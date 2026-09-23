const { test, mock } = require('node:test');
const assert = require('node:assert/strict');

process.env.SHOPIFY_STORE_DOMAIN = 'fixture.myshopify.com';
process.env.SHOPIFY_ADMIN_CLIENT_ID = 'fixture-client';
process.env.SHOPIFY_ADMIN_CLIENT_SECRET = 'fixture-secret';

const cancellationPromise = import('../api/track-order-cancel.js');
const trackPromise = import('../api/track-order.js');
const adminPromise = import('../api/_lib/shopify-admin.js');

const NOW = Date.parse('2026-09-24T10:00:00Z');
function order(overrides = {}) {
  return {
    id: 'gid://shopify/Order/1001', name: '#1001', number: 1001,
    createdAt: new Date(NOW - 30 * 60 * 1000).toISOString(), processedAt: new Date(NOW - 30 * 60 * 1000).toISOString(),
    email: 'customer@example.com', customer: { email: 'customer@example.com' }, cancelledAt: null,
    displayFinancialStatus: 'PAID', displayFulfillmentStatus: 'UNFULFILLED', returnStatus: 'NO_RETURN',
    currentTotalPriceSet: { shopMoney: { amount: '4199.00', currencyCode: 'INR' } },
    totalReceivedSet: { shopMoney: { amount: '4199.00', currencyCode: 'INR' } },
    totalRefundedSet: { shopMoney: { amount: '0.00', currencyCode: 'INR' } },
    transactionsCount: { count: 1, precision: 'EXACT' }, transactions: [{ kind: 'SALE', status: 'SUCCESS' }],
    lineItems: { nodes: [{ title: 'Aura Whey', quantity: 1 }] }, fulfillments: [],
    fulfillmentOrders: { pageInfo: { hasNextPage: false }, nodes: [{ status: 'OPEN', requestStatus: 'UNSUBMITTED' }] },
    ...overrides,
  };
}
function deps(initial, latest, cancel = async () => ({ job: { id: 'gid://shopify/Job/1', done: true }, orderCancelUserErrors: [], userErrors: [] })) {
  const latestValues = Array.isArray(latest) ? [...latest] : [latest];
  let latestCalls = 0;
  const calls = { cancel: 0 };
  return {
    calls,
    value: {
      resolve: async body => ({ input: { orderNumber: '1001', email: String(body.email).trim().toLowerCase() }, order: initial, config: { shopDomain: 'fixture.myshopify.com' } }),
      now: () => NOW,
      wait: async () => {},
      latest: async () => { latestCalls += 1; return latestValues[Math.min(latestCalls - 1, latestValues.length - 1)]; },
      cancel: async (...args) => { calls.cancel += 1; return cancel(...args); },
    },
  };
}

test('eligibility allows under 60 minutes and the exact 60-minute boundary', async () => {
  const { cancellationEligibility } = await trackPromise;
  assert.equal(cancellationEligibility(order(), NOW).eligible, true);
  assert.equal(cancellationEligibility(order({ createdAt: new Date(NOW - 60 * 60 * 1000).toISOString() }), NOW).eligible, true);
});

test('eligibility rejects over 60 minutes, future and invalid createdAt', async () => {
  const { cancellationEligibility } = await trackPromise;
  assert.equal(cancellationEligibility(order({ createdAt: new Date(NOW - 60 * 60 * 1000 - 1).toISOString() }), NOW).code, 'window_expired');
  assert.equal(cancellationEligibility(order({ createdAt: new Date(NOW + 1).toISOString() }), NOW).eligible, false);
  assert.equal(cancellationEligibility(order({ createdAt: 'invalid' }), NOW).eligible, false);
});

test('eligibility rejects cancelled, fulfilled, fulfillment, tracking and submitted fulfillment orders', async () => {
  const { cancellationEligibility } = await trackPromise;
  assert.equal(cancellationEligibility(order({ cancelledAt: new Date(NOW).toISOString() }), NOW).code, 'already_cancelled');
  assert.equal(cancellationEligibility(order({ displayFulfillmentStatus: 'FULFILLED' }), NOW).code, 'shipped');
  assert.equal(cancellationEligibility(order({ fulfillments: [{ status: 'SUCCESS', trackingInfo: [] }] }), NOW).code, 'shipped');
  assert.equal(cancellationEligibility(order({ fulfillments: [{ status: 'CANCELLED', trackingInfo: [{ number: 'AWB1' }] }] }), NOW).code, 'shipped');
  assert.equal(cancellationEligibility(order({ fulfillmentOrders: { pageInfo: { hasNextPage: false }, nodes: [{ status: 'OPEN', requestStatus: 'SUBMITTED' }] } }), NOW).code, 'shipped');
});

test('eligibility rejects partial refunds and unsafe transaction state', async () => {
  const { cancellationEligibility } = await trackPromise;
  assert.equal(cancellationEligibility(order({ displayFinancialStatus: 'PARTIALLY_REFUNDED', totalRefundedSet: { shopMoney: { amount: '100.00' } } }), NOW).eligible, false);
  assert.equal(cancellationEligibility(order({ transactions: [{ kind: 'SALE', status: 'PENDING' }] }), NOW).eligible, false);
});

test('successful cancellation is returned only after Shopify confirms cancelledAt', async () => {
  const { cancelTrackedOrder } = await cancellationPromise;
  const eligible = order();
  const cancelled = order({ cancelledAt: new Date(NOW).toISOString(), displayFinancialStatus: 'REFUNDED' });
  const fixture = deps(eligible, [eligible, cancelled]);
  const result = await cancelTrackedOrder({ orderNumber: '#1001', email: 'CUSTOMER@example.com', reason: 'changed_mind' }, fixture.value);
  assert.equal(result.status, 200);
  assert.equal(result.payload.cancelled, true);
  assert.equal(result.payload.refundStatus, 'Refunded');
  assert.equal(fixture.calls.cancel, 1);
  assert.equal(result.payload.order.id, undefined);
  assert.equal(result.payload.order.email, undefined);
});

test('async cancellation remains pending when cancelledAt cannot yet be confirmed', async () => {
  const { cancelTrackedOrder } = await cancellationPromise;
  const eligible = order();
  const fixture = deps(eligible, eligible);
  const result = await cancelTrackedOrder({ orderNumber: '1001', email: 'customer@example.com', reason: 'other' }, fixture.value);
  assert.equal(result.status, 202);
  assert.equal(result.payload.cancelled, false);
  assert.equal(result.payload.pending, true);
});

test('Shopify user error is rejected and does not claim success', async () => {
  const { cancelTrackedOrder } = await cancellationPromise;
  const eligible = order();
  const fixture = deps(eligible, eligible, async () => ({ job: null, orderCancelUserErrors: [{ code: 'ORDER_NOT_CANCELABLE' }], userErrors: [] }));
  await assert.rejects(() => cancelTrackedOrder({ orderNumber: '1001', email: 'customer@example.com', reason: 'incorrect_product' }, fixture.value), error => error.status === 409);
});

test('expired #1001-style order never calls orderCancel', async () => {
  const { cancelTrackedOrder } = await cancellationPromise;
  const expired = order({ createdAt: new Date(NOW - 2 * 60 * 60 * 1000).toISOString() });
  const fixture = deps(expired, expired);
  await assert.rejects(() => cancelTrackedOrder({ orderNumber: '#1001', email: 'customer@example.com', reason: 'changed_mind' }, fixture.value), error => error.code === 'window_expired');
  assert.equal(fixture.calls.cancel, 0);
});

test('already-cancelled order returns a safe state without another mutation', async () => {
  const { cancelTrackedOrder } = await cancellationPromise;
  const cancelled = order({ cancelledAt: new Date(NOW).toISOString(), displayFinancialStatus: 'REFUNDED' });
  const fixture = deps(cancelled, cancelled);
  const result = await cancelTrackedOrder({ orderNumber: '1001', email: 'customer@example.com', reason: 'changed_mind' }, fixture.value);
  assert.equal(result.payload.alreadyCancelled, true);
  assert.equal(fixture.calls.cancel, 0);
});

test('wrong email and unknown order retain the generic lookup response', async t => {
  const { default: lookupHandler } = await trackPromise;
  await (await adminPromise).clearAdminTokenCache();
  t.mock.method(global, 'fetch', async url => url.includes('/oauth/')
    ? { ok: true, status: 200, json: async () => ({ access_token: 'fixture-token', expires_in: 3600 }) }
    : { ok: true, status: 200, json: async () => ({ data: { orders: { nodes: [order()] } } }) });
  const response = () => ({ statusCode: 0, body: null, setHeader() {}, status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; } });
  const wrong = response();
  await lookupHandler({ method: 'POST', body: { orderNumber: '1001', email: 'wrong@example.com' }, headers: {} }, wrong);
  assert.equal(wrong.statusCode, 404);
  assert.equal(wrong.body.message, 'Order not found. Check your order number and email and try again.');
});

test('mutation uses original payment refund, restock, notification and no PII staff note', async t => {
  const { dependencies } = await cancellationPromise;
  const { clearAdminTokenCache } = await adminPromise;
  clearAdminTokenCache();
  let graphqlBody;
  t.mock.method(global, 'fetch', async (url, options) => {
    if (url.includes('/oauth/')) return { ok: true, status: 200, json: async () => ({ access_token: 'fixture-token', expires_in: 3600 }) };
    graphqlBody = JSON.parse(options.body);
    return { ok: true, status: 200, json: async () => ({ data: { orderCancel: { job: { id: 'job', done: false }, orderCancelUserErrors: [], userErrors: [] } } }) };
  });
  await dependencies.cancel({ shopDomain: 'fixture.myshopify.com' }, 'gid://shopify/Order/1001', 'Customer cancellation from AURA WHEY Track Order: Changed my mind.');
  assert.deepEqual(graphqlBody.variables.refundMethod, { originalPaymentMethodsRefund: true });
  assert.match(graphqlBody.query, /restock: true/);
  assert.match(graphqlBody.query, /notifyCustomer: true/);
  assert.doesNotMatch(graphqlBody.variables.staffNote, /customer@example|gid:\/\//i);
});

test('simultaneous duplicate requests invoke orderCancel once', async () => {
  const { cancelTrackedOrder } = await cancellationPromise;
  const eligible = order();
  const cancelled = order({ cancelledAt: new Date(NOW).toISOString(), displayFinancialStatus: 'REFUNDED' });
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  let latestCalls = 0;
  let cancelCalls = 0;
  const shared = {
    resolve: async body => ({ input: { orderNumber: '1001', email: body.email.toLowerCase() }, order: eligible, config: { shopDomain: 'fixture.myshopify.com' } }),
    now: () => NOW,
    wait: async () => {},
    latest: async () => (++latestCalls === 1 ? eligible : cancelled),
    cancel: async () => { cancelCalls += 1; await gate; return { job: { id: 'job', done: false }, orderCancelUserErrors: [], userErrors: [] }; },
  };
  const body = { orderNumber: '1001', email: 'customer@example.com', reason: 'changed_mind' };
  const first = cancelTrackedOrder(body, shared);
  await new Promise(resolve => setImmediate(resolve));
  const second = cancelTrackedOrder(body, shared);
  release();
  const results = await Promise.all([first, second]);
  assert.equal(cancelCalls, 1);
  assert.equal(results.every(result => result.payload.cancelled), true);
});

test('cancellation endpoint validates JSON and rate limits repeated attempts', async () => {
  const { default: handler } = await cancellationPromise;
  const response = () => ({ statusCode: 0, body: null, headers: {}, setHeader(key, value) { this.headers[key] = value; }, status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; } });
  const request = { method: 'POST', body: {}, headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.55' } };
  for (let index = 0; index < 5; index += 1) {
    const result = response();
    await handler(request, result);
    assert.equal(result.statusCode, 400);
  }
  const limited = response();
  await handler(request, limited);
  assert.equal(limited.statusCode, 429);
  assert.equal(limited.headers['Retry-After'], '900');
});
