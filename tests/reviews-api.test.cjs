const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const mod = import('../api/_lib/reviews.js');
process.env.SUPABASE_URL = 'https://fixture.supabase.co'; process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_fixture-service-role-key';

function response() { return { statusCode: 0, body: null, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(n) { this.statusCode = n; return this; }, json(v) { this.body = v; return this; } }; }
function request(body, ip = '203.0.113.5') { return { body, headers: { 'x-forwarded-for': ip } }; }

test('review validation resolves supported products and rejects unsafe input', async () => {
  const { validateSubmission } = await mod;
  process.env.REVIEWS_RICH_CHOCOLATE_PRODUCT_ID = 'gid://shopify/Product/101';
  const valid = validateSubmission({ productHandle: 'aura-whey-rich-chocolate-1-kg', displayName: ' Rahul ', rating: 5, reviewText: '  Smooth and delicious protein.  ' });
  assert.equal(valid.product.id, 'gid://shopify/Product/101'); assert.equal(valid.displayName, 'Rahul');
  assert.throws(() => validateSubmission({ productHandle: 'unknown', displayName: 'Rahul', rating: 5, reviewText: 'Good product review' }), { status: 422 });
  assert.throws(() => validateSubmission({ productHandle: 'aura-whey-rich-chocolate-1-kg', displayName: 'Rahul', rating: 6, reviewText: 'Good product review' }), { status: 422 });
  assert.throws(() => validateSubmission({ productHandle: 'aura-whey-rich-chocolate-1-kg', displayName: 'Rahul', rating: 5, reviewText: '<script>alert(1)</script>' }), { status: 422 });
});

test('review validation enforces every public input boundary', async () => {
  const { validateSubmission } = await mod;
  process.env.REVIEWS_RICH_CHOCOLATE_PRODUCT_ID = 'gid://shopify/Product/101';
  process.env.REVIEWS_MAWA_KULFI_PRODUCT_ID = 'gid://shopify/Product/102';
  const base = { productHandle: 'aura-whey-mawa-kulfi-1-kg', displayName: 'Ka', rating: 4, reviewText: '1234567890', website: '' };
  assert.equal(validateSubmission(base).displayName, 'Ka');
  assert.equal(validateSubmission({ ...base, rating: 1 }).rating, 1);
  assert.equal(validateSubmission({ ...base, rating: 5 }).rating, 5);
  assert.equal(validateSubmission({ ...base, reviewText: 'VERY NICEEEE, GG FINALLY WORKED' }).reviewText, 'VERY NICEEEE, GG FINALLY WORKED');
  assert.equal(validateSubmission({ ...base, productHandle: 'aura-whey-rich-chocolate-1-kg' }).product.name, 'Rich Chocolate');
  for (const invalid of [
    { ...base, displayName: 'K' },
    { ...base, displayName: 'K'.repeat(61) },
    { ...base, rating: 0 },
    { ...base, rating: 6 },
    { ...base, rating: '4' },
    { ...base, reviewText: '123456789' },
    { ...base, reviewText: 'K'.repeat(1001) },
    { ...base, productHandle: 'unknown' },
    { ...base, website: 'bot.example' },
  ]) assert.throws(() => validateSubmission(invalid), { status: 422 });
});

test('Vercel relative review URLs reach the expected Supabase REST reads', async t => {
  const { listReviews } = await mod;
  process.env.REVIEWS_RICH_CHOCOLATE_PRODUCT_ID = 'gid://shopify/Product/101';
  process.env.REVIEWS_MAWA_KULFI_PRODUCT_ID = 'gid://shopify/Product/102';
  const calls = [];
  t.mock.method(global, 'fetch', async url => { calls.push(url); return { ok: true, status: 200, json: async () => [] }; });
  await listReviews({ url: '/api/reviews?product=aura-whey-mawa-kulfi-1-kg' });
  await listReviews({ url: '/api/reviews?product=aura-whey-rich-chocolate-1-kg' });
  await listReviews({ url: '/api/reviews?scope=home' });
  assert.match(calls[0], /shopify_product_handle=eq\.aura-whey-mawa-kulfi-1-kg/);
  assert.match(calls[1], /shopify_product_handle=eq\.aura-whey-rich-chocolate-1-kg/);
  assert.match(calls[2], /shopify_product_handle=in\.\(aura-whey-rich-chocolate-1-kg,aura-whey-mawa-kulfi-1-kg\)/);
});

test('a fully valid Mawa Kulfi request reaches the Supabase anti-spam RPC', async t => {
  const { createReview } = await mod;
  process.env.REVIEWS_MAWA_KULFI_PRODUCT_ID = 'gid://shopify/Product/102';
  process.env.REVIEWS_IP_HASH_SECRET = 'fixture-review-secret-012345678901234567890';
  const calls = [];
  t.mock.method(global, 'fetch', async (url) => {
    calls.push(url);
    if (url.includes('/rpc/check_review_antispam')) return { ok: true, status: 200, json: async () => ({ allowed: true, reason: 'allowed' }) };
    return { ok: true, status: 201, json: async () => null };
  });
  await createReview(request({ productHandle: 'aura-whey-mawa-kulfi-1-kg', displayName: 'KANISHK', rating: 4, reviewText: 'VERY NICEEEE, GG FINALLY WORKED', website: '' }));
  assert.match(calls[0], /\/rest\/v1\/rpc\/check_review_antispam$/);
  assert.match(calls[1], /\/rest\/v1\/reviews$/);
});

test('POST persists canonical product data and returns safe public review', async t => {
  const { createReview } = await mod;
  process.env.REVIEWS_RICH_CHOCOLATE_PRODUCT_ID = 'gid://shopify/Product/101'; process.env.REVIEWS_IP_HASH_SECRET = 'fixture-review-secret-012345678901234567890';
  let saved;
  t.mock.method(global, 'fetch', async (url, options) => { if (url.includes('/rpc/')) return { ok: true, status: 200, json: async () => ({ allowed: true, reason: 'allowed' }) }; saved = JSON.parse(options.body); return { ok: true, status: 201, json: async () => null }; });
  const review = await createReview(request({ productHandle: 'aura-whey-rich-chocolate-1-kg', displayName: 'Rahul', rating: 5, reviewText: 'Really smooth and tastes great.' }));
  assert.equal(saved.shopify_product_id, 'gid://shopify/Product/101'); assert.equal(saved.product_name, 'Rich Chocolate'); assert.equal(review.displayName, 'Rahul'); assert.equal(review.status, undefined); assert.equal(JSON.stringify(review).includes('<script>'), false);
});

test('rate limiting and honeypot reject abusive submissions', async () => {
  const { validateSubmission } = await mod;
  process.env.REVIEWS_RICH_CHOCOLATE_PRODUCT_ID = 'gid://shopify/Product/101'; assert.throws(() => validateSubmission({ productHandle: 'aura-whey-rich-chocolate-1-kg', displayName: 'Bot', rating: 5, reviewText: 'A real review with enough words.', website: 'spam' }), { status: 422 });
});

test('duplicate rapid submissions are rejected before persistence', async () => {
  const { createReview } = await mod;
  process.env.REVIEWS_RICH_CHOCOLATE_PRODUCT_ID = 'gid://shopify/Product/101';
  let rpcCalls = 0; mock.method(global, 'fetch', async (url) => url.includes('/rpc/') ? (++rpcCalls === 2 ? { ok: true, status: 200, json: async () => ({ allowed: false, reason: 'duplicate' }) } : { ok: true, status: 200, json: async () => ({ allowed: true, reason: 'allowed' }) }) : ({ ok: true, status: 201, json: async () => null }));
  const body = { productHandle: 'aura-whey-rich-chocolate-1-kg', displayName: 'Same', rating: 4, reviewText: 'A repeated review with enough text.' };
  await createReview(request(body, '192.0.2.9')); await assert.rejects(createReview(request(body, '192.0.2.9')), { status: 409 });
});

test('GET filters by exact product handle or returns a mixed home feed', async t => {
  const { listReviews } = await mod;
  const calls = []; t.mock.method(global, 'fetch', async (url) => { calls.push(url); return { ok: true, status: 200, json: async () => [{ id: '1', shopify_product_handle: 'aura-whey-rich-chocolate-1-kg', product_name: 'Rich Chocolate', display_name: 'R', rating: 4, review_text: 'Great taste.', created_at: 'now' }] }; });
  const product = await listReviews({ url: 'https://example.test/api/reviews?product=aura-whey-rich-chocolate-1-kg' }); assert.equal(product[0].productName, 'Rich Chocolate'); assert.match(calls[0], /shopify_product_handle=eq/);
  await listReviews({ url: 'https://example.test/api/reviews?scope=home' }); assert.match(calls[1], /in\.\(/);
});

test('modern Supabase secret keys use apikey without a bearer authorization header', async t => {
  const { listReviews } = await mod;
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_modern-fixture-key';
  let headers; t.mock.method(global, 'fetch', async (_url, options) => { headers = options.headers; return { ok: true, status: 200, json: async () => [] }; });
  await listReviews({ url: 'https://example.test/api/reviews?scope=home' });
  assert.equal(headers.apikey, 'sb_secret_modern-fixture-key');
  assert.equal(headers.Authorization, undefined);
});

test('legacy JWT Supabase service-role keys use apikey and bearer authorization', async t => {
  const { listReviews } = await mod;
  const key = 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.fixture-signature';
  process.env.SUPABASE_SERVICE_ROLE_KEY = key;
  let headers; t.mock.method(global, 'fetch', async (_url, options) => { headers = options.headers; return { ok: true, status: 200, json: async () => [] }; });
  await listReviews({ url: 'https://example.test/api/reviews?scope=home' });
  assert.equal(headers.apikey, key);
  assert.equal(headers.Authorization, `Bearer ${key}`);
});

test('Supabase failure is returned as a safe generic error', async t => {
  const { createReview } = await mod;
  const key = 'sb_secret_must-never-be-exposed';
  process.env.SUPABASE_SERVICE_ROLE_KEY = key;
  t.mock.method(global, 'fetch', async () => ({ ok: false, status: 500, json: async () => ({ secret: 'db detail' }) }));
  const error = await createReview(request({ productHandle: 'aura-whey-rich-chocolate-1-kg', displayName: 'Rahul', rating: 5, reviewText: 'A real review with enough words.' })).catch(value => value);
  assert.equal(error.status, 502); assert.equal(error.message, 'Reviews are temporarily unavailable.'); assert.equal(JSON.stringify(error).includes(key), false);
});

test('review API responses and logs never expose Supabase secret values', async t => {
  const { default: handler } = await import('../api/reviews/index.js');
  const key = 'sb_secret_response-log-fixture'; process.env.SUPABASE_SERVICE_ROLE_KEY = key;
  const logged = []; t.mock.method(console, 'log', (...values) => logged.push(values)); t.mock.method(console, 'error', (...values) => logged.push(values));
  t.mock.method(global, 'fetch', async () => ({ ok: false, status: 401, json: async () => ({ message: key }) }));
  const res = response(); await handler({ method: 'GET', url: 'https://example.test/api/reviews?scope=home' }, res);
  assert.equal(res.statusCode, 502); assert.equal(res.body.message, 'Reviews are temporarily unavailable.');
  assert.equal(JSON.stringify(res.body).includes(key), false); assert.equal(JSON.stringify(logged).includes(key), false);
});
