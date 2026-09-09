const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

// Run the actual storefront templates and actions without starting its DOM lifecycle.
function storefront() {
  const context = vm.createContext({
    document: {
      documentElement: { dataset: {} },
      querySelector: () => null,
      querySelectorAll: () => [],
      readyState: 'loading',
      addEventListener() {}
    },
    window: { addEventListener() {} },
    localStorage: { getItem: () => null },
    location: { hash: '#/home' }
  });
  vm.runInContext(source, context);
  return { context, run: code => vm.runInContext(code, context) };
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
    assert.equal(run('cartCount()'), 1);
    assert.equal(run(`state.cartItems['${flavour}']`), 1);
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

test('cart keeps both flavours with independent quantities', () => {
  const { run } = storefront();
  run("handleAction('add-flavour-Rich Chocolate')");
  run("handleAction('add-flavour-Mawa Kulfi')");
  assert.equal(run('cartCount()'), 2);
  assert.equal(run("state.cartItems['Rich Chocolate']"), 1);
  assert.equal(run("state.cartItems['Mawa Kulfi']"), 1);
  assert.equal(run('totals().total'), 8398);
  let markup = run('cart()');
  assert.ok(markup.includes('Aura Whey Rich Chocolate'));
  assert.ok(markup.includes('Aura Whey Mawa Kulfi'));

  run("handleAction('quantity-up-Mawa Kulfi')");
  assert.equal(run("state.cartItems['Mawa Kulfi']"), 2);
  assert.equal(run("state.cartItems['Rich Chocolate']"), 1);
  assert.equal(run('cartCount()'), 3);
  assert.equal(run('totals().total'), 12597);

  run("handleAction('remove-cart-Rich Chocolate')");
  assert.equal(run("state.cartItems['Rich Chocolate']"), undefined);
  assert.equal(run("state.cartItems['Mawa Kulfi']"), 2);
  markup = run('cart()');
  assert.ok(!markup.includes('Aura Whey Rich Chocolate'));
  assert.ok(markup.includes('Aura Whey Mawa Kulfi'));
});

test('homepage keeps both cards and the existing five-slide hero', () => {
  const { run } = storefront();
  const markup = run('home()');
  assert.equal((markup.match(/class="card product-card /g) || []).length, 2);
  assert.equal(run('heroSlides.length'), 5);
  assert.ok(markup.includes('grid product-grid'));
});

test('homepage shows six FAQs and the FAQ page provides the complete expanded set', () => {
  const { run } = storefront();
  const homepage = run('home()');
  const faqPage = run('faq()');
  assert.equal((homepage.match(/data-action="faq-/g) || []).length, 6);
  assert.equal(run('faqs.length'), 12);
  assert.equal((faqPage.match(/data-action="faq-/g) || []).length, 12);
  assert.ok(homepage.includes('How should I prepare my shake?'));
  assert.ok(faqPage.includes('Does Aura Whey contain milk or other allergens?'));
});
