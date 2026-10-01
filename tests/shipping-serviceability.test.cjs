const { test } = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

const moduleUrl = pathToFileURL(path.resolve(__dirname, '../api/shipping/check.js')).href;

function jsonResponse(status, payload, jsonError) {
  return { ok: status >= 200 && status < 300, status, json: async () => { if (jsonError) throw jsonError; return payload; } };
}

async function invoke(t, serviceability, options = {}) {
  const originalFetch = global.fetch;
  const originalEmail = process.env.SHIPROCKET_API_EMAIL;
  const originalPassword = process.env.SHIPROCKET_API_PASSWORD;
  const originalPickupPostcode = process.env.SHIPROCKET_PICKUP_POSTCODE;
  const originalInfo = console.info;
  const originalError = console.error;
  process.env.SHIPROCKET_API_EMAIL = 'x';
  process.env.SHIPROCKET_API_PASSWORD = 'y';
  if (options.pickupConfigured) process.env.SHIPROCKET_PICKUP_POSTCODE = '123456';
  else delete process.env.SHIPROCKET_PICKUP_POSTCODE;
  const requests = [];
  const logs = [];
  global.fetch = async (url, init = {}) => {
    requests.push({ url: String(url), init });
    if (String(url).endsWith('/auth/login')) return options.auth || jsonResponse(200, { token: 'token-marker' });
    if (options.networkError) throw options.networkError;
    return serviceability;
  };
  console.info = (...args) => logs.push(args);
  console.error = (...args) => logs.push(args);
  t.after(() => {
    global.fetch = originalFetch;
    console.info = originalInfo;
    console.error = originalError;
    if (originalEmail === undefined) delete process.env.SHIPROCKET_API_EMAIL; else process.env.SHIPROCKET_API_EMAIL = originalEmail;
    if (originalPassword === undefined) delete process.env.SHIPROCKET_API_PASSWORD; else process.env.SHIPROCKET_API_PASSWORD = originalPassword;
    if (originalPickupPostcode === undefined) delete process.env.SHIPROCKET_PICKUP_POSTCODE; else process.env.SHIPROCKET_PICKUP_POSTCODE = originalPickupPostcode;
  });
  const { default: handler } = await import(`${moduleUrl}?test=${Date.now()}-${Math.random()}`);
  const output = {};
  const response = {
    status(code) { output.status = code; return this; },
    setHeader() { return this; },
    json(body) { output.body = body; return this; },
  };
  await handler({ method: 'POST', body: { pincode: options.pincode || '401203', quantity: 1 } }, response);
  return { ...output, requests, logs };
}

test('valid Shiprocket courier response is serviceable and uses prepaid mode', async t => {
  const result = await invoke(t, jsonResponse(200, { data: { available_courier_companies: [{ blocked: false, pickup_availability: '1', cod: 0, estimated_delivery_days: 2 }] } }));
  assert.equal(result.status, 200);
  assert.equal(result.body.status, 'serviceable');
  assert.equal(result.body.available, true);
  const url = new URL(result.requests[1].url);
  assert.equal(url.searchParams.get('delivery_postcode'), '401203');
  assert.equal(url.searchParams.get('cod'), '0');
});

test('valid empty courier response is explicitly unserviceable', async t => {
  const result = await invoke(t, jsonResponse(200, { data: { available_courier_companies: [] } }), { pincode: '400001' });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { status: 'unserviceable', available: false, codAvailable: false, message: 'Delivery is not available for this pincode.' });
});

for (const [name, payload] of [
  ['missing courier companies', { data: {} }],
  ['wrong courier companies type', { data: { available_courier_companies: {} } }],
  ['error-style HTTP 200 payload', { status_code: 400, message: 'Provider rejected request' }],
]) {
  test(`${name} returns error, never unserviceable`, async t => {
    const result = await invoke(t, jsonResponse(200, payload), { pincode: '110001' });
    assert.equal(result.status, 502);
    assert.equal(result.body.status, 'error');
    assert.equal(result.body.available, null);
    assert.doesNotMatch(result.body.message, /not available for this pincode/i);
  });
}

test('malformed JSON returns a safe error', async t => {
  const result = await invoke(t, jsonResponse(200, null, new SyntaxError('bad JSON')));
  assert.equal(result.status, 502);
  assert.equal(result.body.status, 'error');
});

test('Shiprocket non-2xx returns a safe error', async t => {
  const result = await invoke(t, jsonResponse(503, { message: 'Unavailable' }));
  assert.equal(result.status, 502);
  assert.equal(result.body.status, 'error');
});

test('authentication failure returns a safe error', async t => {
  const result = await invoke(t, jsonResponse(200, {}), { auth: jsonResponse(401, { message: 'Unauthorized' }) });
  assert.equal(result.status, 502);
  assert.equal(result.body.status, 'error');
  assert.equal(result.requests.length, 1);
});

test('network failure returns a safe error', async t => {
  const result = await invoke(t, null, { networkError: new Error('connection failed'), pincode: '560001' });
  assert.equal(result.status, 502);
  assert.equal(result.body.status, 'error');
});

test('diagnostics contain aggregates but no token, credentials, authorization or pincode', async t => {
  const result = await invoke(t, jsonResponse(200, { data: { available_courier_companies: [{
    courier_name: 'Safe Courier', courier_company_id: 42, pickup_availability: '0', blocked: false,
    rate: 91.5, etd: 'Oct 03, 2026', estimated_delivery_days: '2', postcode: '401203',
  }] } }), { pickupConfigured: true });
  const serialized = JSON.stringify(result.logs);
  assert.match(serialized, /courierCompaniesCount/);
  assert.match(serialized, /eligibleCourierCount/);
  assert.match(serialized, /"pickup_availability":"0"/);
  assert.match(serialized, /"pickupAvailabilityType":"string"/);
  assert.match(serialized, /"pickupConfigSource":"SHIPROCKET_PICKUP_POSTCODE"/);
  assert.match(serialized, /"pickupConfigured":true/);
  assert.doesNotMatch(serialized, /token-marker|Authorization|401203|postcode/);
});

test('pickup availability is diagnostic and does not reject serviceable couriers', async t => {
  const result = await invoke(t, jsonResponse(200, { data: { available_courier_companies: [
    { courier_name: 'String zero', blocked: false, pickup_availability: '0' },
    { courier_name: 'Numeric zero', blocked: false, pickup_availability: 0 },
    { courier_name: 'String one', blocked: false, pickup_availability: '1', estimated_delivery_days: 2 },
    { courier_name: 'Numeric one', blocked: false, pickup_availability: 1, estimated_delivery_days: 3 },
    { courier_name: 'Boolean true', blocked: false, pickup_availability: true, estimated_delivery_days: 4 },
  ] } }));
  assert.equal(result.status, 200);
  assert.equal(result.body.status, 'serviceable');
  const diagnostic = result.logs[0][1];
  assert.equal(diagnostic.pickupUnavailableCount, 2);
  assert.equal(diagnostic.eligibleCourierCount, 5);
  assert.equal(diagnostic.pickupConfigSource, 'default');
  assert.equal(diagnostic.pickupConfigured, false);
});

test('a valid unblocked courier remains serviceable when pickup availability is zero', async t => {
  const result = await invoke(t, jsonResponse(200, { data: { available_courier_companies: [{
    courier_name: 'Prepaid Courier', blocked: 0, pickup_availability: '0', estimated_delivery_days: '3', cod: 0,
  }] } }));
  assert.equal(result.status, 200);
  assert.equal(result.body.status, 'serviceable');
  assert.equal(result.body.available, true);
  assert.equal(result.body.codAvailable, false);
  assert.equal(result.logs[0][1].pickupUnavailableCount, 1);
  assert.equal(result.logs[0][1].eligibleCourierCount, 1);
});

test('six-digit India pincode validation remains enforced before any network request', async t => {
  const result = await invoke(t, jsonResponse(200, {}), { pincode: '40001' });
  assert.equal(result.status, 400);
  assert.equal(result.requests.length, 0);
});
