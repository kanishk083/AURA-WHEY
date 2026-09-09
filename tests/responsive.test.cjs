const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const source = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

test('document includes mobile viewport and responsive hero preloads', () => {
  assert.match(html, /width=device-width, initial-scale=1\.0/);
  assert.match(html, /hero-combo-960\.jpg/);
  assert.match(html, /hero-combo-1920\.jpg/);
});

test('mobile menu exposes accessible state and keyboard handling', () => {
  assert.match(source, /aria-controls="mobile-menu"/);
  assert.match(source, /aria-hidden="true" inert/);
  assert.match(source, /event\.key === 'Escape'/);
  assert.match(source, /event\.key !== 'Tab'/);
});

test('responsive CSS covers phones, tablets, safe areas, and reduced motion', () => {
  for (const rule of ['max-width: 900px', 'max-width: 768px', 'max-width: 640px', 'max-width: 480px', 'max-width: 360px']) {
    assert.ok(css.includes(rule), rule);
  }
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /pointer: coarse/);
});

test('ultra-wide and zoomed-out layouts use the available product-section space', () => {
  assert.match(css, /@media \(min-width: 2400px\)/);
  assert.match(css, /--container:\s*min\(2400px, calc\(100vw - 8rem\)\)/);
  assert.match(css, /grid-template-columns:\s*repeat\(2, minmax\(0, 52rem\)\)/);
});

test('optimized storefront assets exist and are substantially smaller than originals', () => {
  const optimized = path.join(root, 'assets/optimized');
  const files = fs.readdirSync(optimized);
  assert.equal(files.filter(file => file.startsWith('hero-')).length, 10);
  assert.equal(files.filter(file => /^(kulfi|chocolate)-/.test(file)).length, 10);
  const total = files.reduce((sum, file) => sum + fs.statSync(path.join(optimized, file)).size, 0);
  assert.ok(total < 7 * 1024 * 1024, `optimized assets total ${total} bytes`);
});

test('hero keeps the supplied banner ratio without cropping at mobile breakpoints', () => {
  assert.match(css, /\.hero-carousel\s*\{[^}]*max-width:\s*1920px[^}]*aspect-ratio:\s*1920\s*\/\s*730/s);
  assert.match(css, /\.hero-banner-img\s*\{[^}]*object-fit:\s*contain/s);
  assert.doesNotMatch(css, /\.hero-carousel\s*\{\s*aspect-ratio:\s*(?:16\s*\/\s*9|4\s*\/\s*3)/);
  assert.match(source, /width="1920" height="730" sizes="100vw"/);
});

test('hero omits the pagination pill while retaining directional controls', () => {
  assert.doesNotMatch(source, /hero-indicators|hero-indicator/);
  assert.doesNotMatch(css, /hero-indicators|hero-indicator/);
  assert.match(source, /data-action="hero-prev"/);
  assert.match(source, /data-action="hero-next"/);
});
