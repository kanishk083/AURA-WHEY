const links = [
  ['home', 'Home'], ['shop', 'Shop'], ['quality', 'Quality & Lab Reports'],
  ['blog', 'Blog'], ['authenticate', 'Authenticate'], ['track-order', 'Track Order'],
  ['faq', 'FAQs'], ['contact', 'Contact']
];

const app = document.querySelector('#app');
const state = { flavour: 'Mawa Kulfi', quantity: 1, tab: 'Details', cart: 0, coupon: '', couponOpen: true, searchQuery: '' };

const routeLink = (route, label, className = '') => `<a href="#/${route}" class="${className}" data-route="${route}">${label}</a>`;
const button = (action, label, className = '') => `<button type="button" class="button ${className}" data-action="${action}">${label}</button>`;
const label = (text) => `<div class="wire-label">${text}</div>`;
const placeholder = (text, extra = '') => `<div class="placeholder ${extra}">[ ${text} ]</div>`;

function shell(content) {
  const nav = links.map(([route, text]) => routeLink(route, text)).join('');
  app.innerHTML = `
    <div class="shell">
      <div class="coupon-wrap">
        <div class="announcement coupon-banner ${state.couponOpen ? '' : 'collapsed'}" aria-hidden="${!state.couponOpen}">
          <span>Use coupon code <strong>DISC5</strong> to get 5% off on all orders</span>
          <button type="button" class="coupon-toggle" data-action="toggle-coupon" aria-expanded="${state.couponOpen}">${state.couponOpen ? 'Hide offer' : 'Show offer'}</button>
        </div>
        <button type="button" class="coupon-reopen" data-action="show-coupon" ${state.couponOpen ? 'hidden' : ''}>Show coupon offer</button>
      </div>
      <header class="header">
        ${routeLink('home', 'LOGO PLACEHOLDER', 'logo')}
        <nav class="desktop-nav" aria-label="Primary navigation">${nav}</nav>
        <div class="header-actions">
          ${routeLink('search', '[ Search ]', 'utility-link hide-mobile')}
          ${routeLink('account', '<span class="account-wide">Sign in / Log in</span><span class="account-compact">Sign in</span>', 'utility-link account-link')}
          ${routeLink('cart', `Cart <span class="cart-count">(${state.cart})</span>`, 'utility-link cart-link')}
          <button class="button menu-button" type="button" data-action="open-menu" aria-expanded="false">Menu</button>
        </div>
      </header>
      <div class="overlay" data-action="close-menu"></div>
      <aside class="mobile-panel" aria-label="Mobile navigation">
        <button class="button menu-close" type="button" data-action="close-menu">Close</button>
        <form class="mobile-search" data-form="search" data-mobile-search="true">
          <label class="sr-only" for="mobile-search-input">Search in</label>
          <input id="mobile-search-input" name="query" placeholder="Search in..." value="${state.searchQuery}" />
          <button type="submit" aria-label="Search">⌕</button>
        </form>
        <nav>${nav}${routeLink('account', 'Sign in / Log in')}${routeLink('cart', `Cart <span class="cart-count">(${state.cart})</span>`)}</nav>
      </aside>
      <main tabindex="-1">${content}</main>
      <footer class="footer">
        <div class="footer-grid">
          <div>${label('Brand / newsletter')}<p>[ Brand introduction and email signup placeholder ]</p></div>
          <div><strong>Shop</strong><ul><li>${routeLink('shop', 'Whey protein')}</li><li>${routeLink('cart', 'Cart')}</li></ul></div>
          <div><strong>Help</strong><ul><li>${routeLink('authenticate', 'Authenticate')}</li><li>${routeLink('track-order', 'Track order')}</li><li>${routeLink('faq', 'FAQs')}</li></ul></div>
          <div><strong>Information</strong><ul><li>${routeLink('quality', 'Quality & lab reports')}</li><li>${routeLink('blog', 'Blog')}</li><li>${routeLink('policy', 'Policies')}</li></ul></div>
        </div>
        <div class="footer-socials" aria-label="Social links"><span>[ Facebook ]</span><span>[ Instagram ]</span><span>[ LinkedIn ]</span><span>[ YouTube ]</span></div>
      </footer>
    </div>`;
}

function home() {
  return `
    <section class="section">
      ${label('Hero')}
      <div class="grid grid-2">
        <div><h1>Homepage hero placeholder</h1><p>[ Product promise and supporting copy placeholder ]</p><div class="button-row">${button('go-shop', 'Shop whey', 'primary')}${routeLink('quality', 'Explore quality proof', 'button-link')}</div></div>
        ${placeholder('Hero product / lifestyle media', 'hero-placeholder')}
      </div>
    </section>
    <section class="section">${label('Product highlights')}<h2>Featured product area</h2><div class="grid grid-2">${productCard('Mawa Kulfi')}${productCard('Rich Chocolate')}</div></section>
    <section class="section">${label('Product facts')}<h2>Nutrition snapshot</h2><div class="stats"><div><span class="stat-value">[ 24 g ]</span>Protein</div><div><span class="stat-value">[ 5.7 g ]</span>BCAAs</div><div><span class="stat-value">[ 35 g ]</span>Serving size</div><div><span class="stat-value">[ 28 ]</span>Servings</div></div></section>
    <section class="section">${label('Why choose us')}<div class="grid grid-2"><div><h2>Benefit / ingredient area</h2><p>[ Key quality and product benefit placeholders ]</p>${placeholder('Illustration or product composition')}</div><div class="grid"><div class="card">[ Benefit point 1 ]</div><div class="card">[ Benefit point 2 ]</div><div class="card">[ Benefit point 3 ]</div></div></div></section>
    <section class="section">${label('Trust & certification')}<div class="grid grid-2"><div><h2>Quality evidence</h2><p>[ Certification summary and facility credentials placeholder ]</p>${routeLink('quality', 'View certificates and lab reports', 'button-link')}</div>${placeholder('Certification logo / document row')}</div></section>
    <section class="section">${label('Lab reports')}<h2>Product testing area</h2><div class="grid grid-3"><div class="card">[ Report filter / product selector ]</div><div class="card">[ Latest report summary ]</div><div class="card">${routeLink('quality', 'Open report library', 'button-link')}</div></div></section>
    <section class="section">${label('Blog preview')}<h2>Training and nutrition articles</h2><div class="grid grid-3">${blogCard('Article card 1')}${blogCard('Article card 2')}${blogCard('Article card 3')}</div><p>${routeLink('blog', 'View all articles', 'button-link')}</p></section>
    <section class="section">${label('FAQ preview')}<h2>Common questions</h2>${faqItems(true)}<p>${routeLink('faq', 'View all FAQs', 'button-link')}</p></section>`;
}

function productCard(flavour) {
  return `<article class="card">${placeholder(`${flavour} product image`)}<h3>[ Whey protein — ${flavour} ]</h3><p>[ Price / stock placeholder ]</p><div class="button-row">${button(`select-${flavour}`, 'View product', 'primary')}</div></article>`;
}
function blogCard(title) { return `<article class="card">${placeholder('Article image')}<h3>[ ${title} ]</h3><p>[ Article excerpt placeholder ]</p>${routeLink('article', 'Read article', 'button-link')}</article>`; }
function couponEntry() { return `${label('Coupon code')}<form class="coupon-form" data-form="coupon"><label class="field">Apply a coupon<input name="coupon" value="${state.coupon}" placeholder="[ Enter coupon code ]" /></label><button type="submit" class="button">Apply code</button></form><div class="coupon-result" aria-live="polite">${state.coupon ? `[ ${state.coupon} applied — discount placeholder ]` : '[ Coupon result placeholder ]'}</div>`; }

function shop() {
  const tabContent = { Details: '[ Product description, usage guidance, and flavour detail placeholder ]', Nutrition: '[ Nutrition panel and amino-acid table placeholder ]', Ingredients: '[ Ingredients, allergen, and storage detail placeholder ]' };
  return `
    <h1 class="page-title">Product page wireframe</h1>
    <div class="product-layout">
      <section class="product-gallery">${label('Product media gallery')}${placeholder('Main product image / video placeholder')}<div class="thumbnail-row"><div class="thumbnail">[ Thumb 1 ]</div><div class="thumbnail">[ Thumb 2 ]</div><div class="thumbnail">[ Thumb 3 ]</div></div></section>
      <section>${label('Purchase panel')}<p class="small">[ Product category breadcrumb ]</p><h2>[ Whey protein product title ]</h2><div class="price-placeholder">[ Price / compare-at price / stock placeholder ]</div><p><strong>Flavour:</strong> ${state.flavour}</p><div class="button-row"><button type="button" class="flavour ${state.flavour === 'Mawa Kulfi' ? 'active' : ''}" data-action="select-Mawa Kulfi">Mawa Kulfi</button><button type="button" class="flavour ${state.flavour === 'Rich Chocolate' ? 'active' : ''}" data-action="select-Rich Chocolate">Rich Chocolate</button></div><div class="coupon-entry">${couponEntry()}</div><div class="product-actions"><div class="button-row">${button('add-cart', 'Add to cart', 'primary')}${routeLink('quality', 'View quality proof', 'button-link')}</div></div></section>
    </div>
    <section class="section">${label('Product information tabs')}<div class="tab-list">${Object.keys(tabContent).map(tab => `<button type="button" class="tab ${state.tab === tab ? 'active' : ''}" data-action="tab-${tab}">${tab}</button>`).join('')}</div><div class="tab-panel">${tabContent[state.tab]}</div></section>
    <section class="section">${label('Trust strip')}<div class="grid grid-3"><div class="card">[ Manufacturing standard ]</div><div class="card">[ Certification placeholder ]</div><div class="card">${routeLink('authenticate', 'Authenticate your pack', 'button-link')}</div></div></section>`;
}

function cart() {
  const hasCart = state.cart > 0;
  return `<h1 class="page-title">Cart wireframe</h1>${hasCart ? `<div class="cart-layout"><section>${label('Cart item')}<article class="cart-item">${placeholder('Product image', 'cart-image')}<div><h2>[ Whey protein — ${state.flavour} ]</h2><p>[ Variant / price placeholder ]</p><div class="quantity"><span>Quantity</span><button class="quantity-button" type="button" data-action="quantity-down">−</button><span>${state.quantity}</span><button class="quantity-button" type="button" data-action="quantity-up">+</button></div></div>${button('remove-cart', 'Remove')}</article></section><aside class="summary">${label('Order summary')}<div class="summary-row"><span>Subtotal</span><span>[ Amount ]</span></div><div class="summary-row"><span>Shipping</span><span>[ Calculated later ]</span></div><div class="summary-row"><strong>Total</strong><strong>[ Amount ]</strong></div><div class="cart-coupon">${couponEntry()}</div><p>${button('checkout', 'Continue to secure checkout', 'primary')}</p><p class="small">[ Shopify checkout handoff placeholder ]</p></aside></div>` : `<div class="notice"><h2>Your cart is empty</h2><p>[ Empty-cart guidance placeholder ]</p><div class="cart-coupon">${couponEntry()}</div>${routeLink('shop', 'Shop whey', 'button-link primary')}</div>`}`;
}

function checkout() { return `<h1 class="page-title">Checkout handoff</h1><section class="notice">${label('External checkout transition')}<h2>[ Redirecting to Shopify checkout ]</h2><p>[ Secure checkout, shipping address, payment, tax, and order confirmation occur in Shopify. ]</p><div class="button-row">${routeLink('cart', 'Back to cart', 'button-link')}${button('shopify-checkout', 'Open Shopify checkout placeholder', 'primary')}</div></section>`; }

function quality() { return `<h1 class="page-title">Quality & lab reports</h1><p class="page-lede">[ Introductory quality statement placeholder ]</p><section class="section">${label('Certification library')}<div class="grid grid-4">${documentCard('FSSAI licence')}${documentCard('Food safety certificate')}${documentCard('GMP certificate')}${documentCard('HACCP certificate')}</div></section><section class="section">${label('Lab reports')}<h2>Report library</h2><div class="grid grid-3">${documentCard('Batch report card')}${documentCard('Nutrition report card')}${documentCard('Testing method card')}</div></section><section class="section">${label('Trust explanation')}<div class="grid grid-2"><div>${placeholder('Quality process image / diagram')}</div><div><h2>[ How quality checks work ]</h2><p>[ Plain-language process explanation placeholder ]</p>${routeLink('authenticate', 'Authenticate your product', 'button-link')}</div></div></section>`; }
function documentCard(title) { return `<article class="card">${placeholder('Document preview')}<h3>[ ${title} ]</h3><p>[ Issuer / date / scope placeholder ]</p>${routeLink('document', 'View document', 'button-link')}</article>`; }
function search() { return `<h1 class="page-title">Search wireframe</h1><form class="form" data-form="search"><label class="field">Search the store<input name="query" value="${state.searchQuery}" placeholder="[ Search products, articles, or FAQs ]" /></label><button type="submit" class="button primary">Search</button></form><div id="search-result" aria-live="polite">${state.searchQuery ? '<div class="result">[ Search results placeholder ]</div>' : ''}</div>`; }
function account() { return `<h1 class="page-title">Account wireframe</h1><div class="notice">${label('Customer account')}<h2>[ Login / account dashboard placeholder ]</h2><p>[ Order history, saved details, and account actions placeholder ]</p>${routeLink('track-order', 'Track an order', 'button-link')}</div>`; }

function blog() { return `<h1 class="page-title">Blog wireframe</h1><section>${label('Featured article')}<div class="grid grid-2">${placeholder('Featured article image')}<div><h2>[ Featured article title ]</h2><p>[ Intro / author / date placeholder ]</p>${routeLink('article', 'Read article', 'button-link primary')}</div></div></section><section class="section">${label('Article listing')}<div class="grid grid-3">${blogCard('Article card 1')}${blogCard('Article card 2')}${blogCard('Article card 3')}${blogCard('Article card 4')}${blogCard('Article card 5')}${blogCard('Article card 6')}</div></section>`; }
function article() { return `<article><p>${routeLink('blog', 'Back to blog')}</p>${label('Article header')}<h1 class="page-title">[ Article title placeholder ]</h1><p class="small">[ Author / date / category placeholder ]</p>${placeholder('Article hero image')}<section class="section"><div class="grid grid-2"><div><h2>[ Article section heading ]</h2><p>[ Article body placeholder. This area represents long-form education content and internal links. ]</p><p>[ Paragraph placeholder. ]</p></div><aside class="card"><strong>[ Related articles ]</strong><p>[ Article link ]</p><p>[ Article link ]</p></aside></div></section></article>`; }

function authenticate() { return `<h1 class="page-title">Authenticate your pack</h1><section class="grid grid-2"><div><p>[ Explain where the customer finds the code or QR on the pack. ]</p>${placeholder('Pack code / QR location diagram')}</div><div>${label('Code verification form')}<form class="form" data-form="authenticate"><label class="field">Pack code<input name="code" placeholder="[ Enter code ]" /></label><button type="submit" class="button primary">Verify code</button></form><div id="auth-result" aria-live="polite"></div></div></section><section class="section">${label('Verification help')}<h2>[ What each verification state means ]</h2><div class="grid grid-3"><div class="card">[ Verified ]</div><div class="card">[ Already checked ]</div><div class="card">[ Invalid code ]</div></div></section>`; }

function trackOrder() { return `<h1 class="page-title">Track order</h1><section class="grid grid-2"><div>${label('Order lookup form')}<form class="form" data-form="tracking"><label class="field">Order number<input name="order" placeholder="[ Order number ]" /></label><label class="field">Email address<input name="email" type="email" placeholder="[ Email used at checkout ]" /></label><button type="submit" class="button primary">Find order</button></form><div id="tracking-result" aria-live="polite"></div></div><div>${label('Tracking support')}<h2>[ Order and delivery help ]</h2><p>[ Tracking explanation and support fallback placeholder ]</p>${routeLink('contact', 'Contact support', 'button-link')}</div></section>`; }

function faqItems(limit = false) {
  const questions = ['[ Product and serving question ]', '[ Delivery and return question ]', '[ Authenticity question ]', '[ Quality documentation question ]'];
  return `<div class="accordion">${questions.slice(0, limit ? 2 : 4).map((question, index) => `<div><button type="button" data-action="faq-${index}" aria-expanded="false"><span>${question}</span><span>+</span></button><div class="accordion-panel" hidden>[ Answer placeholder ]</div></div>`).join('')}</div>`;
}
function faq() { return `<h1 class="page-title">Frequently asked questions</h1>${label('FAQ accordion')}${faqItems()}</section>`; }
function contact() { return `<h1 class="page-title">Contact wireframe</h1><section class="grid grid-2"><div>${label('Contact form')}<form class="form" data-form="contact"><label class="field">Name<input placeholder="[ Name ]" /></label><label class="field">Email<input type="email" placeholder="[ Email ]" /></label><label class="field">Message<textarea rows="5" placeholder="[ Message ]"></textarea></label><button type="submit" class="button primary">Send message</button></form><div id="contact-result" aria-live="polite"></div></div><div>${label('Support details')}<div class="card"><p>[ Customer-care email ]</p><p>[ Phone / WhatsApp ]</p><p>[ Support hours ]</p><p>[ Address / map placeholder ]</p></div></div></section>`; }
function policy() { return `<h1 class="page-title">Policy page wireframe</h1>${label('Policy navigation')}<div class="grid grid-3"><div class="card">[ Shipping policy ]</div><div class="card">[ Returns policy ]</div><div class="card">[ Privacy policy ]</div></div><section class="section">${label('Policy content')}<h2>[ Policy heading ]</h2><p>[ Policy text placeholder ]</p><p>[ Policy text placeholder ]</p></section>`; }
function documentPage() { return `<h1 class="page-title">Document viewer wireframe</h1><p>${routeLink('quality', 'Back to quality library')}</p>${label('Document metadata')}<div class="grid grid-2"><div><h2>[ Certificate / report title ]</h2><p>[ Issuer, issue date, validity, scope, and download action placeholder ]</p><div class="button-row">${button('download-doc', 'Download document placeholder')}${routeLink('quality', 'Back to library', 'button-link')}</div></div>${placeholder('PDF / document preview')}</div>`; }

const views = { home, shop, cart, checkout, quality, blog, article, authenticate, 'track-order': trackOrder, faq, contact, policy, document: documentPage, search, account };

function currentRoute() { return location.hash.replace('#/', '') || 'home'; }
function render() { shell((views[currentRoute()] || home)()); bindEvents(); }
function navigate(route) { location.hash = `/${route}`; }

function bindEvents() {
  document.querySelectorAll('[data-route]').forEach(link => link.addEventListener('click', () => setTimeout(() => document.querySelector('main')?.focus(), 0)));
  document.querySelectorAll('[data-action]').forEach(element => element.addEventListener('click', () => handleAction(element.dataset.action, element)));
  document.querySelectorAll('form[data-form]').forEach(form => form.addEventListener('submit', handleForm));
}

function handleAction(action, element) {
  if (action === 'toggle-coupon') { state.couponOpen = false; const banner = document.querySelector('.coupon-banner'); banner.classList.add('collapsed'); banner.setAttribute('aria-hidden', 'true'); element.setAttribute('aria-expanded', 'false'); document.querySelector('.coupon-reopen').hidden = false; return; }
  if (action === 'show-coupon') { state.couponOpen = true; const banner = document.querySelector('.coupon-banner'); banner.classList.remove('collapsed'); banner.setAttribute('aria-hidden', 'false'); document.querySelector('.coupon-reopen').hidden = true; banner.querySelector('[data-action="toggle-coupon"]').setAttribute('aria-expanded', 'true'); return; }
  if (action === 'open-menu') { document.querySelector('.mobile-panel').classList.add('open'); document.querySelector('.overlay').classList.add('open'); return; }
  if (action === 'close-menu') { document.querySelector('.mobile-panel').classList.remove('open'); document.querySelector('.overlay').classList.remove('open'); return; }
  if (action === 'go-shop') return navigate('shop');
  if (action.startsWith('select-')) { state.flavour = action.replace('select-', ''); return navigate('shop'); }
  if (action.startsWith('tab-')) { state.tab = action.replace('tab-', ''); return render(); }
  if (action === 'add-cart') { state.cart = 1; return navigate('cart'); }
  if (action === 'remove-cart') { state.cart = 0; state.quantity = 1; return render(); }
  if (action === 'quantity-up') { state.quantity += 1; return render(); }
  if (action === 'quantity-down') { state.quantity = Math.max(1, state.quantity - 1); return render(); }
  if (action === 'checkout') return navigate('checkout');
  if (action === 'shopify-checkout') { element.closest('.notice').insertAdjacentHTML('beforeend', '<div class="result">[ Shopify checkout opened — prototype state ]</div>'); return; }
  if (action === 'download-doc') { element.insertAdjacentHTML('afterend', '<span class="small"> [ Download initiated — prototype state ]</span>'); return; }
  if (action.startsWith('faq-')) { const panel = element.nextElementSibling; const expanded = element.getAttribute('aria-expanded') === 'true'; element.setAttribute('aria-expanded', String(!expanded)); element.lastElementChild.textContent = expanded ? '+' : '−'; panel.hidden = expanded; }
}

function handleForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (form.dataset.form === 'coupon') {
    state.coupon = form.elements.coupon.value.trim().toUpperCase();
    const result = state.coupon === 'DISC5' ? '[ DISC5 applied — discount placeholder ]' : '[ Coupon not recognised — result placeholder ]';
    document.querySelectorAll('.coupon-result').forEach(target => { target.textContent = result; });
  }
  if (form.dataset.form === 'authenticate') {
    const value = form.elements.code.value.trim().toUpperCase();
    const results = { 'AURA-2026-001': ['state-valid', '[ Verified code ]', '[ Product authentication result, date, and next action placeholder. ]'], 'AURA-2026-USED': ['state-invalid', '[ Code previously checked ]', '[ Repeat-check warning and support path placeholder. ]'] };
    const [kind, title, text] = results[value] || ['state-invalid', '[ Invalid code ]', '[ Invalid-code explanation and support path placeholder. ]'];
    document.querySelector('#auth-result').innerHTML = `<div class="result ${kind}"><strong>${title}</strong><p>${text}</p></div>`;
  }
  if (form.dataset.form === 'tracking') {
    const order = form.elements.order.value.trim().toUpperCase();
    const email = form.elements.email.value.trim();
    const match = order === 'AW-1001' && email;
    document.querySelector('#tracking-result').innerHTML = match ? '<div class="result state-valid"><strong>[ Order found ]</strong><p>[ Fulfilment status, courier link, and estimated delivery placeholder. ]</p></div>' : '<div class="result state-invalid"><strong>[ No matching order ]</strong><p>[ Check the order number and email, or contact support. ]</p></div>';
  }
  if (form.dataset.form === 'contact') document.querySelector('#contact-result').innerHTML = '<div class="result">[ Message received — prototype state ]</div>';
  if (form.dataset.form === 'search') {
    state.searchQuery = form.elements.query.value.trim();
    if (form.dataset.mobileSearch) return navigate('search');
    const target = document.querySelector('#search-result');
    if (target) target.innerHTML = '<div class="result">[ Search results placeholder ]</div>';
  }
}

window.addEventListener('hashchange', render);
render();
