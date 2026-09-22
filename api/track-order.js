import { adminQuery, ShopifyAdminError } from './_lib/shopify-admin.js';

const NOT_FOUND = 'Order not found. Check your order number and email and try again.';
const attempts = new Map();
const RATE_WINDOW = 60 * 60 * 1000;
const RATE_LIMIT = 10;
const SEARCH_QUERY = `query TrackOrder($search: String!) {
  orders(first: 10, query: $search, sortKey: CREATED_AT, reverse: true) {
    nodes {
      id name number createdAt processedAt email customer { email }
      displayFinancialStatus displayFulfillmentStatus
      currentTotalPriceSet { shopMoney { amount currencyCode } }
      lineItems(first: 100) { nodes { title quantity } }
      fulfillments(first: 100) { status displayStatus trackingInfo { company number url } }
    }
  }
}`;

export function normalizeOrderNumber(value) {
  const normalized = String(value ?? '').trim().toUpperCase().replace(/^#/, '').replace(/^AW-/, '');
  return /^\d{1,20}$/.test(normalized) ? normalized : null;
}

function normalizeEmail(value) { return String(value ?? '').trim().toLowerCase(); }
function normalizeShopifyNumber(order) { return String(order?.number ?? order?.name ?? '').replace(/^#/, '').trim(); }
function sameOrder(order, number) { return normalizeShopifyNumber(order) === number; }

function statusFor(order) {
  const statuses = (order.fulfillments || []).flatMap(item => [item.displayStatus, item.status]).map(value => String(value || '').toUpperCase());
  if (statuses.includes('DELIVERED')) return 'delivered';
  if (statuses.includes('OUT_FOR_DELIVERY')) return 'out_for_delivery';
  if (statuses.some(value => ['IN_TRANSIT', 'SHIPPED', 'SUCCESS'].includes(value))) return 'shipped';
  if (statuses.length || order.displayFulfillmentStatus && order.displayFulfillmentStatus !== 'UNFULFILLED') return 'processing';
  return 'processing';
}

export function publicOrder(order) {
  const tracking = (order.fulfillments || []).flatMap(item => item.trackingInfo || []).filter(item => item && (item.company || item.number || item.url)).map(item => ({ company: item.company || null, number: item.number || null, url: /^https:\/\//i.test(item.url || '') ? item.url : null }));
  const progress = statusFor(order);
  return {
    orderNumber: order.name,
    orderDate: order.createdAt || order.processedAt,
    paymentStatus: order.displayFinancialStatus || null,
    fulfillmentStatus: order.displayFulfillmentStatus || null,
    products: (order.lineItems?.nodes || []).map(item => ({ title: item.title, quantity: item.quantity })),
    total: order.currentTotalPriceSet?.shopMoney?.amount || null,
    currency: order.currentTotalPriceSet?.shopMoney?.currencyCode || null,
    tracking,
    progress,
    preparing: tracking.length === 0 && !(order.fulfillments || []).length,
  };
}

function validateBody(body) {
  if (!body || typeof body !== 'object') throw Object.assign(new Error(NOT_FOUND), { status: 400 });
  const orderNumber = normalizeOrderNumber(body.orderNumber);
  const email = normalizeEmail(body.email);
  if (!orderNumber || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw Object.assign(new Error(NOT_FOUND), { status: 400 });
  return { orderNumber, email };
}

function allowRequest(request) {
  const ip = String(request.headers?.['x-forwarded-for'] || request.socket?.remoteAddress || 'unknown').split(',')[0].trim().slice(0, 128);
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter(time => now - time < RATE_WINDOW);
  if (recent.length >= RATE_LIMIT) return false;
  recent.push(now); attempts.set(ip, recent);
  if (attempts.size > 1000) for (const [key, times] of attempts) if (!times.some(time => now - time < RATE_WINDOW)) attempts.delete(key);
  return true;
}

export async function findTrackOrder(body, config = { shopDomain: process.env.SHOPIFY_STORE_DOMAIN }) {
  const input = validateBody(body);
  if (!config?.shopDomain || !/^[a-z0-9-]+\.myshopify\.com$/i.test(config.shopDomain)) throw Object.assign(new Error('Order tracking is temporarily unavailable.'), { status: 503 });
  const data = await adminQuery(config, SEARCH_QUERY, { search: `name:${input.orderNumber}` });
  const order = (data.orders?.nodes || []).find(item => sameOrder(item, input.orderNumber));
  const emails = [order?.email, order?.customer?.email].map(normalizeEmail).filter(Boolean);
  if (!order || !emails.includes(input.email)) throw Object.assign(new Error(NOT_FOUND), { status: 404 });
  return publicOrder(order);
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') return response.status(405).json({ message: 'Method not allowed.' });
  if (!allowRequest(request)) return response.status(429).json({ message: 'Please wait before trying again.' });
  try {
    let body = request.body;
    try { if (typeof body === 'string') body = JSON.parse(body); } catch { return response.status(400).json({ message: NOT_FOUND }); }
    return response.status(200).json({ order: await findTrackOrder(body) });
  } catch (error) {
    if (error instanceof ShopifyAdminError) return response.status(error.status).json({ message: error.status === 429 ? 'Please wait a moment before trying again.' : 'Order tracking is temporarily unavailable.' });
    return response.status(error.status || 502).json({ message: error.message === NOT_FOUND ? NOT_FOUND : 'Order tracking is temporarily unavailable.' });
  }
}
