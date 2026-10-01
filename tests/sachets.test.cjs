const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { storefront } = require('./storefront-helper.cjs');

const root = path.resolve(__dirname, '..');

test('Shop Products navigation exposes accessible desktop and mobile product destinations', () => {
  const { run } = storefront();
  const desktop = run('shopNavigation()');
  const mobile = run('shopNavigation(true)');
  for (const markup of [desktop, mobile]) {
    assert.match(markup, /Shop Products/);
    assert.match(markup, /Whey Protein \u2014 1 KG/);
    assert.match(markup, /Protein Sachets \u2014 35g/);
    assert.match(markup, /href="\/shop\/sachets"/);
    assert.doesNotMatch(markup, /Single Sachet|Duo Pack|Travel Pack/);
  }
  assert.match(desktop, /aria-haspopup="true"/);
  assert.match(mobile, /<details/);
  assert.doesNotMatch(mobile, /<details[^>]*\sopen(?:\s|>)/);
  assert.equal((desktop.match(/Protein Sachets \u2014 35g/g) || []).length, 1);
  assert.equal((mobile.match(/Protein Sachets \u2014 35g/g) || []).length, 1);
});

test('Sachets use Shopify option mapping, live prices and supplied project images', () => {
  const { context, run } = storefront();
  context.location.pathname = '/shop/sachets';
  const markup = run('shop()');
  assert.equal(run('SHOPIFY_CONFIG.products.Sachets'), 'aura-whey-protein-sachets-35g');
  assert.equal((markup.match(/class="sachet-card /g) || []).length, 3);
  for (const text of ['Single Sachet', 'Duo Pack', 'Travel Pack', '\u20b9149.00', '\u20b9270.00', '\u20b9875.00', '\u20b9199.00', '\u20b9398.00', '\u20b91,393.00']) assert.ok(markup.includes(text), text);
  assert.ok(markup.includes('1 Chocolate + 1 Mawa Kulfi'));
  assert.ok(!markup.includes('Duo Pack / Chocolate'));
  assert.ok(!markup.includes('Duo Pack / Mawa Kulfi'));
  for (const file of ['sachet-front.png.png', 'sachet-back.png.png', 'sachet-front-back-lifestyle.png.png', 'sachet-travel-pack.png.png']) assert.ok(fs.existsSync(path.join(root, 'assets', 'Sachets', file)));
  for (const source of ['sachet-front-720.webp', 'sachet-product-info-960.webp', 'sachet-travel-pack-720.webp']) assert.ok(markup.includes(source), source);
  assert.equal((markup.match(/sachet-product-info-960\.webp/g) || []).length, 2);
  assert.match(markup, /sachet-product-info-480\.webp 480w/);
  assert.match(markup, /class="sachet-hero-image"[^>]*loading="eager"[^>]*fetchpriority="high"/);
  assert.equal((markup.match(/class="sachet-card-back"/g) || []).length, 3);
  assert.equal((markup.match(/sachet-back-720\.webp/g) || []).length, 6);
  assert.equal((markup.match(/class="sachet-card-track"/g) || []).length, 3);
  assert.equal((markup.match(/data-action="sachet-image-next"/g) || []).length, 3);
  assert.equal((markup.match(/data-action="sachet-image-prev"/g) || []).length, 3);
  assert.doesNotMatch(markup, /sachet-information-title|Complete front and back product information/);
  assert.match(run('JSON.stringify(sachetAssets)'), /sachet-back-720\.webp/);
  assert.match(markup, /Rich Chocolate/);
});

test('Duo always resolves the designated variant without exposing an artificial flavour choice', () => {
  const { run } = storefront();
  assert.equal(run("sachetVariant('Duo Pack', 'Chocolate').id"), 'variant-sachet-duo-chocolate');
  assert.equal(run("sachetVariant('Duo Pack', 'Mawa Kulfi').id"), 'variant-sachet-duo-chocolate');
  const card = run("sachetCard('Duo Pack', 'Duo Pack', 'Mixed duo')");
  assert.match(card, /1 Chocolate \+ 1 Mawa Kulfi/);
  assert.doesNotMatch(card, /Choose Duo Pack flavour/);
  assert.doesNotMatch(card, /data-flavour=/);
});

test('mixed 1 KG and Sachet cart uses existing quantity, removal and checkout flow', async () => {
  const { run, redirects } = storefront();
  await run("addShopifyProduct('Mawa Kulfi', 1)");
  await run("addSachetProduct('Single Sachet', 'Chocolate')");
  await run("addSachetProduct('Duo Pack', 'Mawa Kulfi')");
  await run("addSachetProduct('Travel Pack (7 Sachets)', 'Mawa Kulfi')");
  assert.equal(run('commerce.cart.lines.nodes.length'), 4);
  assert.equal(run('commerce.cart.cost.totalAmount.amount'), '5493.00');
  const markup = run('cart()');
  for (const label of ['Aura Whey Mawa Kulfi', 'Aura Whey Sachet \u2014 Chocolate', 'Single Sachet', 'Aura Whey Duo Pack', '1 Chocolate + 1 Mawa Kulfi', 'Aura Whey Travel Pack \u2014 Mawa Kulfi', '7 Sachets']) assert.ok(markup.includes(label), label);
  assert.match(markup, /sachet-front-720\.webp/);
  assert.match(markup, /sachet-travel-pack-720\.webp/);
  assert.ok(!markup.includes('Duo Pack / Chocolate'));
  const duoId = run("commerce.cart.lines.nodes.find(line => line.merchandise.id === 'variant-sachet-duo-chocolate').id");
  await run(`changeCartLine('line-up', '${duoId}')`);
  assert.equal(run("commerce.cart.lines.nodes.find(line => line.id === '" + duoId + "').quantity"), 2);
  await run(`changeCartLine('line-remove', '${duoId}')`);
  assert.equal(run("commerce.cart.lines.nodes.some(line => line.id === '" + duoId + "')"), false);
  await run('openShopifyCheckout()');
  assert.equal(redirects[0], 'https://cay9kn-xc.myshopify.com/checkouts/test');
});

test('Shopify availability blocks Sachet cart mutation', async () => {
  const { run } = storefront();
  run("sachetVariant('Single Sachet', 'Chocolate').availableForSale = false");
  await run("addSachetProduct('Single Sachet', 'Chocolate')");
  assert.equal(run('state.cart'), 0);
  const card = run("sachetCard('Single Sachet', 'Single Sachet', 'Choose a flavour')");
  assert.match(card, /Out of stock/);
  assert.match(card, /disabled/);
});

test('direct Sachets load stays disabled until Shopify availability resolves', async () => {
  const { context, run } = storefront();
  context.location.pathname = '/shop/sachets';
  run("savedSachetProduct = commerce.products.Sachets; commerce.products = {}; commerce.loading = true; commerce.cartReady = false; commerce.error = ''");
  const loading = run('shop()');
  assert.match(loading, /data-commerce-state="loading"/);
  assert.doesNotMatch(loading, /Checking availability/);
  assert.equal((loading.match(/data-availability="loading" aria-hidden="true">&nbsp;<\/p>/g) || []).length, 3);
  assert.equal((loading.match(/sachet-price is-unresolved" aria-hidden="true"/g) || []).length, 3);
  assert.equal((loading.match(/data-action="add-sachet"[^>]*disabled/g) || []).length, 3);
  await run("addSachetProduct('Single Sachet', 'Chocolate')");
  assert.equal(run('state.cart'), 0, 'an unresolved variant cannot bypass the disabled button');

  run("commerce.products.Sachets = savedSachetProduct; commerce.loading = false; commerce.cartReady = true");
  const ready = run('shop()');
  assert.match(ready, /data-commerce-state="ready"/);
  assert.equal((ready.match(/data-availability="available"[^>]*>In stock/g) || []).length, 3);
  assert.equal((ready.match(/data-action="add-sachet"[^>]*disabled/g) || []).length, 0);
  for (const price of ['\u20b9149.00', '\u20b9270.00', '\u20b9875.00', '\u20b9199.00', '\u20b9398.00', '\u20b91,393.00']) assert.match(ready, new RegExp(price));
});

test('Sachet availability renders explicit unavailable and Shopify error states safely', () => {
  const { context, run } = storefront();
  context.location.pathname = '/shop/sachets';
  run("sachetVariant('Single Sachet', 'Chocolate').availableForSale = false");
  const unavailable = run("sachetCard('Single Sachet', 'Single Sachet', 'Choose a flavour')");
  assert.match(unavailable, /data-availability="unavailable"[^>]*>Out of stock/);
  assert.match(unavailable, /data-action="add-sachet"[^>]*disabled/);

  run("commerce.products = {}; commerce.loading = false; commerce.cartReady = false; commerce.error = 'Storefront unavailable'");
  const failed = run('shop()');
  assert.match(failed, /data-commerce-state="error"/);
  assert.equal((failed.match(/Unable to check availability/g) || []).length, 3);
  assert.equal((failed.match(/data-action="add-sachet"[^>]*disabled/g) || []).length, 3);
  assert.match(failed, /data-action="retry-shopify"/);
});

test('Shopify hydration replaces stale direct-load Sachet markup before quantity-only patching', () => {
  const { run } = storefront();
  const section = (state, controls = 0) => ({ dataset: { commerceState: state }, querySelectorAll: () => Array(controls) });
  const loading = section('loading');
  const ready = section('ready');
  const failed = section('error');
  assert.equal(run('sachetProductsNeedReplacement')(loading, ready), true);
  assert.equal(run('sachetProductsNeedReplacement')(loading, failed), true);
  assert.equal(run('sachetProductsNeedReplacement')(ready, section('ready')), false);
  assert.equal(run('sachetProductsNeedReplacement')(ready, section('ready', 1)), true);
});

test('all Sachet pack and flavour choices resolve their authoritative Shopify variants', () => {
  const { run } = storefront();
  const choices = run(`[
    ['Single Sachet', 'Chocolate'], ['Single Sachet', 'Mawa Kulfi'],
    ['Duo Pack', 'Chocolate'], ['Duo Pack', 'Mawa Kulfi'],
    ['Travel Pack (7 Sachets)', 'Chocolate'], ['Travel Pack (7 Sachets)', 'Mawa Kulfi']
  ].map(([pack, flavour]) => ({ pack, flavour, id: sachetVariant(pack, flavour)?.id, available: sachetVariant(pack, flavour)?.availableForSale }))`);
  assert.deepEqual(JSON.parse(JSON.stringify(choices)), [
    { pack: 'Single Sachet', flavour: 'Chocolate', id: 'variant-sachet-single-chocolate', available: true },
    { pack: 'Single Sachet', flavour: 'Mawa Kulfi', id: 'variant-sachet-single-mawa', available: true },
    { pack: 'Duo Pack', flavour: 'Chocolate', id: 'variant-sachet-duo-chocolate', available: true },
    { pack: 'Duo Pack', flavour: 'Mawa Kulfi', id: 'variant-sachet-duo-chocolate', available: true },
    { pack: 'Travel Pack (7 Sachets)', flavour: 'Chocolate', id: 'variant-sachet-travel-chocolate', available: true },
    { pack: 'Travel Pack (7 Sachets)', flavour: 'Mawa Kulfi', id: 'variant-sachet-travel-mawa', available: true }
  ]);
});

test('direct load, hard refresh and SPA navigation converge to the same Sachet state', () => {
  const renderDirect = () => {
    const fixture = storefront();
    fixture.context.location.pathname = '/shop/sachets';
    return fixture.run('shop()');
  };
  const direct = renderDirect();
  const refreshed = renderDirect();
  const spa = storefront();
  spa.run("navigate('shop/sachets')");
  const navigated = spa.run('shop()');
  const state = markup => ({
    ready: (markup.match(/data-commerce-state="ready"/g) || []).length,
    available: (markup.match(/data-availability="available"[^>]*>In stock/g) || []).length,
    enabled: (markup.match(/data-action="add-sachet"(?![^>]*disabled)/g) || []).length,
    prices: ['\u20b9149.00', '\u20b9270.00', '\u20b9875.00'].map(price => markup.includes(price))
  });
  assert.deepEqual(state(direct), state(refreshed));
  assert.deepEqual(state(direct), state(navigated));
  assert.deepEqual(state(direct), { ready: 1, available: 3, enabled: 3, prices: [true, true, true] });
});

test('Sachet disabled state is visually distinct while availability is unresolved', () => {
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  assert.match(css, /\.sachet-card \.button:disabled\s*\{[^}]*opacity:\s*\.45[^}]*cursor:\s*not-allowed/);
  assert.match(css, /\.sachet-card \.button:disabled:hover\s*\{[^}]*transform:\s*none/);
  assert.match(css, /\.sachet-price\.is-unresolved, \.sachet-stock\[data-availability="loading"\]\s*\{[^}]*visibility:\s*hidden/);
  assert.match(css, /\.sachet-stock\s*\{[^}]*min-height:\s*1\.5rem/);
});

test('Storefront query requests compare-at prices and no Rewards system is introduced', () => {
  const shopify = fs.readFileSync(path.join(root, 'shopify.js'), 'utf8');
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  assert.match(shopify, /compareAtPrice/);
  assert.doesNotMatch(app, /Rewards Unlocked/i);
});

test('homepage CTA promotes Sachets with the centralized front asset and both shopping routes', () => {
  const { run } = storefront();
  const markup = run('shopInvitation()');
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  assert.match(markup, /Protein\. Anywhere/);
  assert.match(markup, /Fuel your Aura on the go/);
  assert.match(markup, /24g protein\. 5\.7g BCAAs/);
  assert.match(markup, /sachet-front-720\.webp/);
  assert.match(markup, /href="\/shop\/sachets"[^>]*>Shop Sachets/);
  assert.match(markup, /href="\/shop"[^>]*>Shop 1 KG Whey/);
  assert.doesNotMatch(markup, /Compare flavours|Rewards|Free Gift/i);
  assert.match(css, /\.shop-invitation-media\s*\{[^}]*padding:\s*1rem[^}]*box-sizing:\s*border-box/);
  assert.match(css, /\.shop-invitation-media img\s*\{[^}]*width:\s*auto[^}]*height:\s*auto[^}]*object-fit:\s*contain/);
  assert.match(css, /@media \(max-width:\s*520px\)[\s\S]*?\.shop-invitation-media img\s*\{[^}]*width:\s*min\(70%,\s*15rem\)/);
  assert.doesNotMatch(css, /\.shop-invitation-media\s*\{[^}]*overflow:\s*hidden/);
});

test('mobile floating cart action keeps rounded corners', () => {
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  assert.match(css, /\.floating-purchase-actions > \.button\s*\{[^}]*border-radius:\s*10px\s*!important/);
});

test('pack selection updates in place and never invokes global navigation', () => {
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const handler = app.match(/if \(action === 'select-sachet-pack'\) \{([\s\S]*?)\n  \}/)?.[1] || '';
  assert.match(handler, /history\.replaceState/);
  assert.match(handler, /classList\.toggle\('is-selected'/);
  assert.doesNotMatch(handler, /navigate\(/);
  assert.doesNotMatch(handler, /scrollTo/);
});

test('every Sachet card supports independent front/back controls and touch swiping', () => {
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  assert.match(app, /function setSachetImageSlide/);
  assert.match(app, /\.sachet-card-track'\)\.style\.transform/);
  assert.match(app, /slider\.onpointerdown/);
  assert.match(app, /slider\.onpointerup/);
});

test('Sachet image frame and empty drawer use bounded responsive layout', () => {
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  assert.match(css, /\.sachet-card-image[^}]*aspect-ratio:\s*4\s*\/\s*5/);
  assert.match(css, /\.sachet-card-image \.sachet-card-primary[^}]*object-fit:\s*contain/);
  assert.match(css, /\.sachet-card-image \.sachet-card-primary[^}]*object-position:\s*center/);
  assert.doesNotMatch(css, /\.sachet-card-image \.sachet-card-primary[^}]*object-fit:\s*cover/);
  assert.match(css, /\.cart-drawer \.empty-state[^}]*width:\s*100%[^}]*max-width:\s*100%[^}]*min-width:\s*0/);
  const { run } = storefront();
  const empty = run('cart()');
  assert.match(empty, />Shop Products</);
  assert.doesNotMatch(empty, /Shop whey protein/i);
});

test('Sachets inherit the existing semantic light and dark theme variables', () => {
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  const rule = css.match(/\.sachet-route, \.sachet-shop\s*\{([^}]*)\}/)?.[1] || '';
  assert.match(rule, /background:\s*var\(--bg\)/);
  assert.match(rule, /color:\s*var\(--text\)/);
  assert.doesNotMatch(rule, /#[0-9a-f]{3,8}/i);
});
