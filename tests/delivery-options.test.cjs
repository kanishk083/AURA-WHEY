const { test } = require('node:test');
const assert = require('node:assert/strict');
const { storefront } = require('./storefront-helper.cjs');

test('product page includes delivery options below the purchase controls', () => {
  const { run } = storefront();
  const markup = run('shop()');
  assert.ok(markup.includes('id="delivery-options-title"'));
  assert.ok(markup.includes('data-form="delivery-check"'));
  assert.ok(markup.includes('name="pincode"'));
  assert.ok(markup.includes('Free shipping on orders above \u20b92,000'));
  assert.ok(markup.includes('Replacement and cancellation policy'));
});

test('delivery options preserve a serviceable pincode state between renders', () => {
  const { run } = storefront();
  run("state.delivery = { pincode: '400001', status: 'serviceable', message: 'Delivery available · Estimated delivery 2 days.' }");
  const markup = run('deliveryOptions()');
  assert.ok(markup.includes('value="400001"'));
  assert.ok(markup.includes('Delivery available'));
});

test('delivery options render unserviceable and error as distinct states', () => {
  const { run } = storefront();
  run("state.delivery = { pincode: '110001', status: 'unserviceable', message: 'Delivery is not available for this pincode.' }");
  assert.match(run('deliveryPincodeCard()'), /Delivery is not available/);
  run("state.delivery = { pincode: '560001', status: 'error', message: 'Unable to check delivery availability right now. Please try again.' }");
  const markup = run('deliveryPincodeCard()');
  assert.match(markup, /Unable to check delivery availability/);
  assert.doesNotMatch(markup, /Delivery is not available/);
});

async function submitPincode(result) {
  const { context, run } = storefront();
  context.fetch = async () => result;
  await run(`handleForm({ preventDefault() {}, currentTarget: { dataset: { form: 'delivery-check' }, elements: { pincode: { value: '401203' } } } })`);
  return run('state.delivery');
}

test('delivery submission maps the backend serviceable state', async () => {
  const delivery = await submitPincode({ ok: true, json: async () => ({ status: 'serviceable', available: true, message: 'Delivery available.' }) });
  assert.equal(delivery.status, 'serviceable');
  assert.equal(delivery.message, 'Delivery available.');
});

test('delivery submission maps only an explicit backend rejection to unserviceable', async () => {
  const delivery = await submitPincode({ ok: true, json: async () => ({ status: 'unserviceable', available: false, message: 'Delivery is not available for this pincode.' }) });
  assert.equal(delivery.status, 'unserviceable');
  assert.equal(delivery.message, 'Delivery is not available for this pincode.');
});

for (const [name, response] of [
  ['HTTP failure', { ok: false, json: async () => ({ status: 'error', available: null }) }],
  ['invalid JSON', { ok: true, json: async () => { throw new SyntaxError('bad JSON'); } }],
  ['invalid success payload', { ok: true, json: async () => ({ available: false }) }],
]) {
  test(`${name} renders unable-to-check, never unserviceable`, async () => {
    const delivery = await submitPincode(response);
    assert.equal(delivery.status, 'error');
    assert.equal(delivery.message, 'Unable to check delivery availability right now. Please try again.');
    assert.doesNotMatch(delivery.message, /Delivery is not available/);
  });
}

test('coupon and delivery controls share the same responsive action row', () => {
  const { run } = storefront();
  assert.ok(run('couponEntry()').includes('class="inline-action-row"'));
  assert.ok(run('deliveryOptions()').includes('class="inline-action-row"'));
});
