const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const mod = import('../api/_lib/reviews.js');
process.env.SUPABASE_URL = 'https://fixture.supabase.co'; process.env.SUPABASE_SERVICE_ROLE_KEY = 'fixture-service-role-key';

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

test('Supabase failure is returned as a safe generic error', async t => {
  const { createReview } = await mod;
  t.mock.method(global, 'fetch', async () => ({ ok: false, status: 500, json: async () => ({ secret: 'db detail' }) }));
  await assert.rejects(createReview(request({ productHandle: 'aura-whey-rich-chocolate-1-kg', displayName: 'Rahul', rating: 5, reviewText: 'A real review with enough words.' })), { status: 502 });
});
