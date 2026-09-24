import { createHmac, randomBytes, randomUUID } from 'node:crypto';

const PRODUCTS = Object.freeze({
  'aura-whey-rich-chocolate-1-kg': { handle: 'aura-whey-rich-chocolate-1-kg', name: 'Rich Chocolate', idEnv: 'REVIEWS_RICH_CHOCOLATE_PRODUCT_ID' },
  'aura-whey-mawa-kulfi-1-kg': { handle: 'aura-whey-mawa-kulfi-1-kg', name: 'Mawa Kulfi', idEnv: 'REVIEWS_MAWA_KULFI_PRODUCT_ID' },
});
const LIMIT = 50;

export class ReviewError extends Error { constructor(status, message) { super(message); this.status = status; } }
const fail = (status, message) => { throw new ReviewError(status, message); };

export function productForHandle(handle) {
  const product = PRODUCTS[String(handle || '').trim().toLowerCase()];
  if (!product) fail(422, 'Unsupported product.');
  const id = process.env[product.idEnv];
  if (!id || !/^gid:\/\/shopify\/Product\/[1-9]\d*$/.test(id)) fail(503, 'Reviews are temporarily unavailable.');
  return { id, handle: product.handle, name: product.name };
}

function clean(value) {
  return String(value ?? '').normalize('NFKC').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function validateSubmission(body) {
  if (!body || typeof body !== 'object') fail(422, 'Enter a rating and review.');
  const product = productForHandle(body.productHandle);
  const displayName = clean(body.displayName);
  const reviewText = clean(body.reviewText);
  const rating = body.rating;
  if (displayName.length < 2 || displayName.length > 60 || !Number.isInteger(rating) || rating < 1 || rating > 5 || reviewText.length < 10 || reviewText.length > 1000 || /[<>]/.test(displayName + reviewText)) fail(422, 'Enter your name, a rating from 1 to 5, and a review of at least 10 characters.');
  if (body.website) fail(422, 'Unable to submit this review.');
  return { product, displayName, rating, reviewText };
}

function supabaseConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url?.startsWith('https://') || !key) fail(503, 'Reviews are temporarily unavailable.');
  return { url, key };
}

function fingerprint(value) {
  const secret = process.env.REVIEWS_IP_HASH_SECRET;
  if (!secret || secret.length < 32) fail(503, 'Reviews are temporarily unavailable.');
  return createHmac('sha256', secret).update(value).digest('hex');
}

function keyedHash(value, name) {
  const secret = process.env[name];
  if (!secret || secret.length < 32) fail(503, 'Reviews are temporarily unavailable.');
  return createHmac('sha256', secret).update(value).digest('hex');
}

export function ownerTokenHash(token) { return keyedHash(token, 'REVIEWS_OWNER_TOKEN_SECRET'); }
export function visitorHash(visitorId) { return keyedHash(visitorId, 'REVIEWS_VISITOR_HASH_SECRET'); }
export function ipHash(ip) { return fingerprint(ip); }

async function antiSpam(ip, input) {
  const ipHash = fingerprint(ip);
  const duplicateHash = fingerprint(`${ipHash}\n${input.product.id}\n${input.displayName.toLowerCase()}\n${input.reviewText.toLowerCase()}`);
  const result = await reviewDb('rpc/check_review_antispam', { method: 'POST', body: JSON.stringify({ p_ip_hash: ipHash, p_duplicate_hash: duplicateHash }) }, 'check_antispam');
  const decision = Array.isArray(result) ? result[0] : result;
  if (!decision || decision.allowed !== true) fail(decision?.reason === 'rate_limited' ? 429 : decision?.reason === 'duplicate' ? 409 : 503, decision?.reason === 'rate_limited' ? 'Please wait before submitting another review.' : decision?.reason === 'duplicate' ? 'This review was already submitted recently.' : 'Reviews are temporarily unavailable.');
}

function safeDiagnostic(value) {
  if (value == null) return null;
  let result = String(value);
  for (const name of ['SUPABASE_SERVICE_ROLE_KEY', 'REVIEWS_IP_HASH_SECRET', 'REVIEWS_OWNER_TOKEN_SECRET', 'REVIEWS_VISITOR_HASH_SECRET', 'SHOPIFY_ADMIN_CLIENT_SECRET', 'SHOPIFY_ADMIN_ACCESS_TOKEN']) {
    const secret = process.env[name];
    if (secret) result = result.split(secret).join('[redacted]');
  }
  result = result.replace(/\b[0-9a-f]{64}\b/gi, '[redacted-hash]');
  return result.slice(0, 500);
}

export async function reviewDb(path, options = {}, operation = 'reviews_request') {
  const { url, key } = supabaseConfig();
  const authorization = /^eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key) ? { Authorization: `Bearer ${key}` } : {};
  let response;
  try {
    response = await fetch(`${url}/rest/v1/${path}`, { ...options, headers: { apikey: key, ...authorization, 'Content-Type': 'application/json', ...(options.headers || {}) }, signal: AbortSignal.timeout(10000) });
  } catch (error) {
    console.error('[reviews:supabase-network]', { operation, error: safeDiagnostic(error instanceof Error ? error.message : 'Unknown fetch error') });
    fail(502, 'Reviews are temporarily unavailable.');
  }
  if (!response.ok) {
    let parsedError = null;
    try { parsedError = await response.json(); } catch { /* Supabase can return an empty or non-JSON error body. */ }
    console.error('[reviews:supabase]', {
      operation,
      status: response.status,
      statusText: safeDiagnostic(response.statusText),
      code: safeDiagnostic(parsedError?.code),
      message: safeDiagnostic(parsedError?.message),
      details: safeDiagnostic(parsedError?.details),
      hint: safeDiagnostic(parsedError?.hint),
    });
    fail(502, 'Reviews are temporarily unavailable.');
  }
  return response.status === 204 ? null : response.json();
}

export async function createReview(request) {
  const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
  const input = validateSubmission(body);
  const ownerToken = randomBytes(32).toString('base64url');
  const ownerTokenDigest = ownerTokenHash(ownerToken);
  const ip = String(request.headers['x-forwarded-for'] || request.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  await antiSpam(ip, input);
  const review = { id: randomUUID(), shopify_product_id: input.product.id, shopify_product_handle: input.product.handle, product_name: input.product.name, display_name: input.displayName, rating: input.rating, review_text: input.reviewText, created_at: new Date().toISOString(), owner_token_hash: ownerTokenDigest };
  await reviewDb('reviews', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(review) }, 'create_review');
  return { ...publicReview(review), ownerToken };
}

export function publicReview(review) { return { id: review.id, shopifyProductHandle: review.shopify_product_handle, productName: review.product_name, displayName: review.display_name, rating: review.rating, reviewText: review.review_text, createdAt: review.created_at, likeCount: Number(review.like_count || 0), liked: review.liked === true }; }

export async function listReviews(request) {
  const params = new URL(request.url || '/', 'http://localhost').searchParams;
  const scope = params.get('scope') === 'home' ? 'home' : 'product';
  const handle = scope === 'home' ? null : productForHandle(params.get('product')).handle;
  const visitorId = String(request.headers?.['x-aura-review-visitor'] || '').trim();
  const hashedVisitor = /^[A-Za-z0-9_-]{43}$/.test(visitorId) ? visitorHash(visitorId) : null;
  const rows = await reviewDb('rpc/list_public_reviews', { method: 'POST', body: JSON.stringify({ p_product_handle: handle, p_scope: scope, p_visitor_hash: hashedVisitor, p_limit: LIMIT }) }, 'list_reviews');
  return rows.map(publicReview);
}
