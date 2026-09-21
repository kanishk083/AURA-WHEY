import { createHmac, randomUUID } from 'node:crypto';

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

function clean(value, max) {
  return String(value ?? '').normalize('NFKC').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

export function validateSubmission(body) {
  if (!body || typeof body !== 'object') fail(422, 'Enter a rating and review.');
  const product = productForHandle(body.productHandle);
  const displayName = clean(body.displayName, 60);
  const reviewText = clean(body.reviewText, 1000);
  const rating = Number(body.rating);
  if (!displayName || displayName.length < 2 || !Number.isInteger(rating) || rating < 1 || rating > 5 || reviewText.length < 10 || /[<>]/.test(displayName + reviewText)) fail(422, 'Enter your name, a rating from 1 to 5, and a review of at least 10 characters.');
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

async function antiSpam(ip, input) {
  const ipHash = fingerprint(ip);
  const duplicateHash = fingerprint(`${ipHash}\n${input.product.id}\n${input.displayName.toLowerCase()}\n${input.reviewText.toLowerCase()}`);
  const result = await db('rpc/check_review_antispam', { method: 'POST', body: JSON.stringify({ p_ip_hash: ipHash, p_duplicate_hash: duplicateHash }) });
  const decision = Array.isArray(result) ? result[0] : result;
  if (!decision || decision.allowed !== true) fail(decision?.reason === 'rate_limited' ? 429 : decision?.reason === 'duplicate' ? 409 : 503, decision?.reason === 'rate_limited' ? 'Please wait before submitting another review.' : decision?.reason === 'duplicate' ? 'This review was already submitted recently.' : 'Reviews are temporarily unavailable.');
}

async function db(path, options = {}) {
  const { url, key } = supabaseConfig();
  const authorization = /^eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key) ? { Authorization: `Bearer ${key}` } : {};
  const response = await fetch(`${url}/rest/v1/${path}`, { ...options, headers: { apikey: key, ...authorization, 'Content-Type': 'application/json', ...(options.headers || {}) }, signal: AbortSignal.timeout(10000) });
  if (!response.ok) fail(502, 'Reviews are temporarily unavailable.');
  return response.status === 204 ? null : response.json();
}

export async function createReview(request) {
  const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
  const input = validateSubmission(body);
  const ip = String(request.headers['x-forwarded-for'] || request.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  await antiSpam(ip, input);
  const review = { id: randomUUID(), shopify_product_id: input.product.id, shopify_product_handle: input.product.handle, product_name: input.product.name, display_name: input.displayName, rating: input.rating, review_text: input.reviewText, created_at: new Date().toISOString() };
  await db('reviews', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(review) });
  return publicReview(review);
}

export function publicReview(review) { return { id: review.id, shopifyProductHandle: review.shopify_product_handle, productName: review.product_name, displayName: review.display_name, rating: review.rating, reviewText: review.review_text, createdAt: review.created_at }; }

export async function listReviews(request) {
  const params = new URL(request.url || 'http://localhost').searchParams;
  let path = 'reviews?select=id,shopify_product_handle,product_name,display_name,rating,review_text,created_at&order=created_at.desc&limit=' + LIMIT;
  if (params.get('scope') === 'home') path += '&shopify_product_handle=in.(aura-whey-rich-chocolate-1-kg,aura-whey-mawa-kulfi-1-kg)';
  else path += '&shopify_product_handle=eq.' + encodeURIComponent(productForHandle(params.get('product')).handle);
  return (await db(path)).map(publicReview);
}
