const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { storefront } = require('./storefront-helper.cjs');
const root = path.resolve(__dirname, '..');

test('reviews section combines community love, approved cards and the submission form', () => {
  const { run } = storefront();
  const markup = run('productReviews()');
  assert.ok(markup.includes('Strong routines. Big love.'));
  assert.ok(markup.includes('take their training seriously'));
  assert.ok(markup.includes('Community stories are warming up.'));
  assert.ok(markup.includes('data-form="review"'));
  assert.ok(markup.includes('published immediately'));
  assert.ok(!markup.includes('data-action="reviews-prev"'));
});

test('only approved reviews for the selected flavour are displayed', () => {
  const { run } = storefront();
  const markup = run(`approvedReviewCards([
    { approved: true, shopifyProductHandle: 'aura-whey-mawa-kulfi-1-kg', flavour: 'Mawa Kulfi', name: 'Approved customer', rating: 5, text: 'A consistent part of my routine.' },
    { approved: false, shopifyProductHandle: 'aura-whey-mawa-kulfi-1-kg', flavour: 'Mawa Kulfi', name: 'Hidden customer', rating: 5, text: 'Not approved.' },
    { approved: true, shopifyProductHandle: 'aura-whey-rich-chocolate-1-kg', flavour: 'Rich Chocolate', name: 'Other flavour', rating: 5, text: 'Not this product.' }
  ])`);
  assert.ok(markup.includes('Approved customer'));
  assert.ok(!markup.includes('Hidden customer'));
  assert.ok(!markup.includes('Other flavour'));
});

test('homepage review collection includes approved reviews from both flavours', () => {
  const { run } = storefront();
  const markup = run(`reviewShowcase('home', [
    { approved: true, flavour: 'Mawa Kulfi', name: 'Kulfi customer', rating: 5, text: 'Creamy and easy to mix.' },
    { approved: true, flavour: 'Rich Chocolate', name: 'Chocolate customer', rating: 4, text: 'Fits my morning routine.' },
    { approved: false, flavour: 'Rich Chocolate', name: 'Hidden customer', rating: 5, text: 'Awaiting approval.' }
  ])`);
  assert.ok(markup.includes('data-review-scope="home"'));
  assert.ok(markup.includes('Kulfi customer'));
  assert.ok(markup.includes('Chocolate customer'));
  assert.ok(!markup.includes('Hidden customer'));
  assert.ok(!markup.includes('review-card-track'));
});

test('homepage renders the all-flavour customer review section', () => {
  const { run } = storefront();
  const markup = run('home()');
  assert.ok(markup.includes('data-review-scope="home"'));
  assert.ok(markup.includes('id="home-reviews"'));
  assert.ok(markup.includes('Mawa Kulfi and Rich Chocolate'));
});

test('View more reviews targets the full-page collection anchor', () => {
  const { run } = storefront();
  const reviews = Array.from({ length: 4 }, (_, index) => ({ approved: true, displayName: `Customer ${index}`, rating: 5, reviewText: 'Excellent product.' }));
  const homeCards = run(`approvedReviewCards(${JSON.stringify(reviews)}, 'home', { limit: true, showMore: true })`);
  const fullPage = run('reviewsPage()');
  assert.match(homeCards, /href="\/reviews#reviews-collection"/);
  assert.match(homeCards, /data-route="reviews#reviews-collection"/);
  assert.match(homeCards, /data-home-reviews-link/);
  assert.match(fullPage, /id="reviews-collection"/);
  assert.match(fullPage, /Love from the routine/);
});

test('hashed Reviews navigation scrolls after render while plain Reviews navigation stays at page top', () => {
  const { context, run } = storefront();
  const calls = [];
  context.captureScroll = options => calls.push(options);
  context.document.getElementById = id => id === 'reviews-collection' ? { scrollIntoView: options => context.captureScroll({ target: id, ...options }) } : null;
  context.window.scrollTo = options => context.captureScroll({ target: 'window', ...options });
  run("navigate('reviews#reviews-collection')");
  assert.equal(run('location.pathname'), '/reviews');
  assert.equal(run('location.hash'), '#reviews-collection');
  assert.deepEqual(calls.pop(), { target: 'reviews-collection', block: 'start', behavior: 'instant' });
  run("navigate('reviews')");
  assert.equal(run('location.hash'), '');
  assert.deepEqual(calls.pop(), { target: 'window', top: 0, left: 0, behavior: 'instant' });
});

test('every Reviews pagination action scrolls only after its page renders', () => {
  const { context, run } = storefront();
  const pages = [];
  context.capturePage = page => pages.push(page);
  run('renderReviewsPage = () => true; scrollReviewsCollection = () => capturePage(state.reviewPage)');
  for (const page of [2, 1, 2, 1]) run(`handleAction('reviews-page', { dataset: { page: '${page}' } })`);
  assert.deepEqual(pages, [2, 1, 2, 1]);
  run('renderReviewsPage = () => false');
  run("handleAction('reviews-page', { dataset: { page: '2' } })");
  assert.deepEqual(pages, [2, 1, 2, 1], 'failed renders do not move the viewport');
});

test('Reviews collection offsets scrolling by the sticky announcement and header heights', () => {
  const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
  assert.match(css, /#reviews-collection,\s*#home-reviews\s*\{[^}]*scroll-margin-top:\s*calc\(var\(--banner-h\) \+ var\(--header-h\) \+ 1rem\)/);
});

test('review loading reserves card-grid space with accessible skeletons and no delay', () => {
  const { run } = storefront();
  const full = run("reviewLoadingState('home', { paginate: true })");
  const home = run("reviewLoadingState('home')");
  assert.equal((full.match(/review-card-skeleton/g) || []).length, 7);
  assert.equal((home.match(/review-card-skeleton/g) || []).length, 3);
  assert.match(full, /role="status"/);
  assert.match(full, /class="sr-only">Loading reviews/);
  assert.doesNotMatch(run('reviewLoadingState.toString()'), /setTimeout/);
});

test('successful review loading replaces skeletons immediately with review cards', async () => {
  const { context, run } = storefront();
  const board = { innerHTML: '' };
  const section = { querySelector: () => board, querySelectorAll: () => [] };
  context.document.querySelector = selector => selector === '[data-review-scope="home"]' ? section : null;
  let finishFetch;
  context.fetch = () => new Promise(resolve => { finishFetch = resolve; });
  const loading = run("loadReviews('home')");
  assert.match(board.innerHTML, /review-card-skeleton/);
  finishFetch({ ok: true, json: async () => ({ reviews: [{ approved: true, displayName: 'Customer', rating: 5, reviewText: 'Excellent daily protein.' }] }) });
  await loading;
  assert.doesNotMatch(board.innerHTML, /review-card-skeleton/);
  assert.match(board.innerHTML, /Customer/);
});

test('failed review loading removes skeletons and preserves the existing alert', async () => {
  const { context, run } = storefront();
  const board = { innerHTML: '' };
  const section = { querySelector: () => board };
  context.document.querySelector = selector => selector === '[data-review-scope="home"]' ? section : null;
  context.fetch = async () => ({ ok: false, json: async () => ({ message: 'Reviews are temporarily unavailable.' }) });
  await run("loadReviews('home')");
  assert.doesNotMatch(board.innerHTML, /review-card-skeleton/);
  assert.match(board.innerHTML, /class="review-error" role="alert"/);
});

test('browser Back and Forward restore the homepage and Reviews collection anchors', () => {
  const { context, events, run } = storefront();
  const targets = [];
  context.document.getElementById = id => ({ scrollIntoView: () => targets.push(id) });
  run("history.replaceState(null, '', '/#home-reviews'); navigate('reviews#reviews-collection')");
  context.history.back();
  assert.equal(run('location.pathname + location.hash'), '/#home-reviews');
  assert.equal(targets.pop(), 'home-reviews');
  context.history.forward();
  assert.equal(run('location.pathname + location.hash'), '/reviews#reviews-collection');
  assert.equal(targets.pop(), 'reviews-collection');
  assert.equal(typeof events.popstate, 'function');
});

test('View more history refinement reuses existing delegated navigation without duplicate listeners', () => {
  const source = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  assert.match(source, /link\.hasAttribute\('data-home-reviews-link'\) && currentRoute\(\) === 'home'\) history\.replaceState\(null, '', '\/#home-reviews'\)/);
  assert.equal((source.match(/document\.addEventListener\('click'/g) || []).length, 2);
});

test('product reviews use compact horizontal cards with two-way controls', () => {
  const { run } = storefront();
  const markup = run(`reviewShowcase('product', [
    { approved: true, shopifyProductHandle: 'aura-whey-mawa-kulfi-1-kg', flavour: 'Mawa Kulfi', name: 'Product customer', rating: 5, text: 'Creamy and easy to mix.' }
  ])`);
  assert.ok(markup.includes('review-card-track'));
  assert.ok(markup.includes('data-action="reviews-prev"'));
  assert.ok(markup.includes('data-action="reviews-next"'));
});

test('review cards expose likes and deletion only to the owning browser', () => {
  const { run, storage } = storefront();
  const id = '123e4567-e89b-42d3-a456-426614174000';
  storage.set('aura_review_owners', JSON.stringify({ [id]: 'owner-token' }));
  const owned = run(`reviewCard({ id: '${id}', productName: 'Mawa Kulfi', displayName: 'Owner', rating: 5, reviewText: 'Excellent product.', likeCount: 12, liked: true })`);
  const other = run(`reviewCard({ id: '123e4567-e89b-42d3-a456-426614174001', productName: 'Mawa Kulfi', displayName: 'Other', rating: 4, reviewText: 'Tastes very good.', likeCount: 2, liked: false })`);
  assert.ok(owned.includes('data-review-like'));
  assert.ok(owned.includes('aria-pressed="true"'));
  assert.ok(owned.includes('<b>12</b>'));
  assert.ok(owned.includes('data-review-delete'));
  assert.ok(!other.includes('data-review-delete'));
});

test('review deletion uses confirmation and never places owner tokens in URLs', () => {
  const source = require('node:fs').readFileSync('app.js', 'utf8');
  assert.match(source, /Delete your review\?/);
  assert.match(source, /This permanently removes your review\./);
  assert.match(source, /method: 'DELETE'/);
  assert.match(source, /body: JSON\.stringify\(\{ ownerToken: token \}\)/);
  assert.doesNotMatch(source, /ownerToken=.*encodeURIComponent/);
});

test('review form accepts one product photo and cards render safe image galleries', () => {
  const { run } = storefront();
  const form = run('productReviews()');
  assert.ok(form.includes('name="reviewImages"'));
  assert.ok(form.includes('accept="image/jpeg,image/png,image/webp"'));
  assert.ok(form.includes('Optional · 1 image, automatically compressed'));
  assert.doesNotMatch(form, /multiple/);
  const card = run(`reviewCard({ id: '123e4567-e89b-42d3-a456-426614174000', productName: 'Mawa Kulfi', displayName: 'Customer', rating: 5, reviewText: 'Photo review.', imageUrls: ['https://fixture.supabase.co/photo.webp'] })`);
  assert.ok(card.includes('review-photo-grid'));
  assert.ok(card.includes('loading="lazy"'));
  assert.ok(card.includes('rel="noopener"'));
});
