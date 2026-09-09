const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

// Run the actual storefront templates and actions without starting its DOM lifecycle.
function storefront() {
  const events = {};
  const context = vm.createContext({
    document: { querySelector: () => null, readyState: 'loading', addEventListener() {} },
    window: { addEventListener(name, handler) { events[name] = handler; } },
    localStorage: { getItem: () => null },
    location: { hash: '#/home' }
  });
  vm.runInContext(source, context);
  return { context, events, run: code => vm.runInContext(code, context) };
}

for (const flavour of ['Mawa Kulfi', 'Rich Chocolate']) {
  test(`${flavour}: navigation resets homepage scroll after rendering the selected product`, () => {
    const { context, events, run } = storefront();
    let rendered = '';
    let scrollTop = 1200;
    context.captureRender = html => { rendered = html; };
    run('render = () => captureRender(shop())');
    context.window.scrollTo = options => {
      assert.ok(rendered.includes(`Aura Whey <span>${flavour}</span>`));
      assert.equal(options.behavior, 'instant');
      assert.equal(options.left, 0);
      scrollTop = options.top;
    };
    run(`handleAction('select-${flavour}')`);
    assert.equal(run('location.hash'), '/shop');
    events.hashchange();
    assert.equal(scrollTop, 0);
    scrollTop = 500;
    run('render()');
    assert.equal(scrollTop, 500, 'in-page renders preserve scroll position');
  });
}

for (const [flavour, theme] of [['Mawa Kulfi', 'flavour-kulfi'], ['Rich Chocolate', 'flavour-chocolate']]) {
  test(`${flavour}: card, product page and all five supplied assets`, () => {
    const { run } = storefront();
    const card = run(`productCard('${flavour}')`);
    assert.ok(card.includes(`product-card ${theme}`));
    assert.ok(card.includes(`data-action="add-flavour-${flavour}"`));
    assert.ok(card.includes(`data-action="select-${flavour}"`));
    assert.ok(card.includes('Add to cart'));
    assert.ok(card.includes('View product'));
    run(`state.flavour = '${flavour}'`);
    const page = run('shop()');
    assert.ok(page.includes(`product-page ${theme}`));
    assert.equal((page.match(/class="thumbnail"/g) || []).length, 5);
    assert.equal((page.match(/aria-pressed="true"/g) || []).length, 1);
    const images = run(`productFlavours['${flavour}'].images`);
    assert.equal(images.length, 5);
    for (const url of images) assert.ok(fs.existsSync(path.join(root, decodeURIComponent(url))), url);
  });

  test(`${flavour}: card add-to-cart keeps the selected flavour and price`, () => {
    const { run } = storefront();
    run(`handleAction('add-flavour-${flavour}')`);
    assert.equal(run('state.flavour'), flavour);
    assert.equal(run('state.cart'), 1);
    assert.equal(run('location.hash'), '/cart');
    assert.equal(run('totals().total'), 4199);
    assert.ok(run('cart()').includes(`Aura Whey ${flavour}`));
    run("state.coupon = 'DISC5'");
    assert.equal(run('totals().total'), 3989);
  });
}

test('gallery selection updates the image and pressed state without losing the current button', () => {
  const { context, run } = storefront();
  const img = {};
  const thumbnails = Array.from({ length: 5 }, () => ({ setAttribute(name, value) { this[name] = value; } }));
  context.document.querySelector = () => img;
  context.document.querySelectorAll = () => thumbnails;
  context.selectedThumbnail = thumbnails[3];
  run("handleAction('product-image-3', selectedThumbnail)");
  assert.equal(img.src, run('productFlavours[state.flavour].images[3]'));
  assert.equal(thumbnails[3]['aria-pressed'], 'true');
  assert.equal(thumbnails.filter(t => t['aria-pressed'] === 'true').length, 1);
  run("handleAction('select-Rich Chocolate')");
  assert.equal(run('state.productImage'), 0);
  assert.equal(run('location.hash'), '/shop');
});

test('homepage keeps both cards and the existing five-slide hero', () => {
  const { run } = storefront();
  const markup = run('home()');
  assert.equal((markup.match(/class="card product-card /g) || []).length, 2);
  assert.equal(run('heroSlides.length'), 5);
  assert.ok(markup.includes('grid product-grid'));
});
