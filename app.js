const links = [
  ['home', 'Home'], ['shop', 'Shop'], ['quality', 'Quality & lab reports'],
  ['blog', 'Journal'], ['authenticate', 'Authenticate'], ['track-order', 'Track order'],
  ['faq', 'FAQs'], ['contact', 'Contact']
];

const app = document.querySelector('#app');
const assetBase = './stitch_aura_whey_storefront_design/';
const assets = {
  hero: [
    `${assetBase}chatgpt_image_sep_4_2026_06_59_38_pm_4.png/screen.png`,
    `${assetBase}chatgpt_image_sep_4_2026_07_04_00_pm.png/screen.png`,
    `${assetBase}chatgpt_image_sep_4_2026_07_09_56_pm.png/screen.png`
  ],
  chocolate: `${assetBase}chatgpt_image_aug_15_2026_02_36_24_pm.png/screen.png`,
  mawa: `${assetBase}chatgpt_image_aug_15_2026_02_34_55_pm.png/screen.png`,
  duo: `${assetBase}chatgpt_image_aug_15_2026_02_33_29_pm.png/screen.png`,
  labelMawa: `${assetBase}whatsapp_image_2026_07_22_at_21.31.00.jpeg/screen.png`,
  why: `${assetBase}chatgpt_image_sep_4_2026_07_09_56_pm.png/screen.png`
};

const state = {
  flavour: 'Mawa Kulfi', quantity: 1, tab: 'Details', cart: 0, coupon: '',
  couponOpen: true, searchQuery: '', heroSlide: 0, theme: localStorage.getItem('aura-theme') || 'dark',
  document: 'FSSAI licence'
};

const svg = (paths) => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const icon = (name) => ({
  search: svg('<circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4 4"></path>'),
  account: svg('<circle cx="12" cy="8" r="3.5"></circle><path d="M4.5 20c.9-3.4 3.3-5.2 7.5-5.2s6.6 1.8 7.5 5.2"></path>'),
  bag: svg('<path d="M5.5 8.5h13l-1 11h-11l-1-11Z"></path><path d="M8.5 9V7a3.5 3.5 0 0 1 7 0v2"></path>'),
  menu: svg('<path d="M4 7h16M4 12h16M4 17h16"></path>'),
  close: svg('<path d="m6 6 12 12M18 6 6 18"></path>'),
  moon: svg('<path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z"></path>'),
  sun: svg('<circle cx="12" cy="12" r="3.5"></circle><path d="M12 2.5v2M12 19.5v2M21.5 12h-2M4.5 12h-2M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4M18.7 18.7l-1.4-1.4M6.7 6.7 5.3 5.3"></path>'),
  arrowLeft: svg('<path d="m14.5 5-7 7 7 7"></path>'),
  arrowRight: svg('<path d="m9.5 5 7 7-7 7"></path>'),
  chevron: svg('<path d="m7 10 5 5 5-5"></path>'),
  check: svg('<path d="m5 12 4.2 4.2L19 6.7"></path>'),
  file: svg('<path d="M6 3.5h8l4 4V20.5H6z"></path><path d="M14 3.5v4h4M9 12h6M9 16h6"></path>'),
  instagram: svg('<rect x="4" y="4" width="16" height="16" rx="4"></rect><circle cx="12" cy="12" r="3.5"></circle><path d="M17.5 6.5h.01"></path>'),
  facebook: svg('<path d="M14 21v-8h2.8l.4-3H14V8.1c0-.9.3-1.6 1.7-1.6H17V3.8c-.6-.1-1.3-.2-2.2-.2-2.3 0-3.8 1.4-3.8 4V10H8.5v3H11v8"></path>'),
  linkedin: svg('<path d="M6.5 9.5V18M6.5 6.5v.1M10.5 18v-5.1c0-2.3 4.5-2.5 4.5 0V18M10.5 12.1V9.5M15 12.1V9.5"></path><rect x="3" y="3" width="18" height="18" rx="2"></rect>'),
  youtube: svg('<path d="M20.4 7.1c-.2-1-1-1.8-2-2C16.6 4.7 7.4 4.7 5.6 5.1c-1 .2-1.8 1-2 2-.4 1.8-.4 8 0 9.8.2 1 1 1.8 2 2 1.8.4 11 .4 12.8 0 1-.2 1.8-1 2-2 .4-1.8.4-8 0-9.8Z"></path><path d="m10 9 5 3-5 3Z"></path>')
}[name] || '');

const routeLink = (route, label, className = '') => `<a href="#/${route}" class="${className}" data-route="${route}">${label}</a>`;
const iconLink = (route, name, label, className = '') => routeLink(route, `${icon(name)}<span class="sr-only">${label}</span>`, `icon-button ${className}`);
const button = (action, label, className = '', iconName = '') => `<button type="button" class="button ${className}" data-action="${action}">${iconName ? icon(iconName) : ''}<span>${label}</span></button>`;
const image = (src, alt, className = '') => `<img class="${className}" src="${src}" alt="${alt}" loading="lazy" />`;
const productPrice = '₹4,199';

function brand() {
  return routeLink('home', `<span class="brand-mark" aria-hidden="true"><i>A</i><b>V</b></span><span class="brand-name">AURA <strong>WHEY</strong><small>Fuel your aura</small></span>`, 'brand');
}

function shell(content) {
  const nav = links.map(([route, text]) => routeLink(route, text)).join('');
  const themeLabel = state.theme === 'dark' ? 'Use light mode' : 'Use dark mode';
  const themeIcon = state.theme === 'dark' ? 'sun' : 'moon';
  app.innerHTML = `
    <div class="shell">
      <div class="coupon-wrap">
        <div class="announcement coupon-banner ${state.couponOpen ? '' : 'collapsed'}" aria-hidden="${!state.couponOpen}">
          <span>Use code <strong>DISC5</strong> for 5% off your order</span>
          <button type="button" class="coupon-toggle" data-action="toggle-coupon" aria-expanded="${state.couponOpen}">Hide</button>
        </div>
        <button type="button" class="coupon-reopen" data-action="show-coupon" ${state.couponOpen ? 'hidden' : ''}>Show offer</button>
      </div>
      <header class="header">
        ${brand()}
        <nav class="desktop-nav" aria-label="Primary navigation">${nav}</nav>
        <div class="header-actions">
          ${iconLink('search', 'search', 'Search', 'hide-mobile')}
          ${iconLink('account', 'account', 'Sign in or log in')}
          ${routeLink('cart', `${icon('bag')}<span class="cart-count" aria-label="${state.cart} items in cart">${state.cart}</span><span class="sr-only">Cart</span>`, 'icon-button cart-link')}
          <button class="icon-button theme-toggle" type="button" data-action="toggle-theme" aria-label="${themeLabel}" title="${themeLabel}">${icon(themeIcon)}</button>
          <button class="icon-button menu-button" type="button" data-action="open-menu" aria-label="Open menu" aria-expanded="false">${icon('menu')}</button>
        </div>
      </header>
      <div class="overlay" data-action="close-menu"></div>
      <aside class="mobile-panel" aria-label="Mobile navigation">
        <div class="mobile-panel-top">${brand()}<button class="icon-button menu-close" type="button" data-action="close-menu" aria-label="Close menu">${icon('close')}</button></div>
        <form class="mobile-search" data-form="search" data-mobile-search="true">
          <label class="sr-only" for="mobile-search-input">Search the store</label>
          <input id="mobile-search-input" name="query" placeholder="Search products and guides" value="${state.searchQuery}" />
          <button type="submit" aria-label="Search">${icon('search')}</button>
        </form>
        <nav>${nav}${routeLink('account', 'Sign in / Log in')}${routeLink('cart', `Cart <span class="cart-count">${state.cart}</span>`)}</nav>
        <div class="mobile-theme"><span>Appearance</span><button type="button" class="text-button" data-action="toggle-theme">${state.theme === 'dark' ? 'Light mode' : 'Dark mode'}</button></div>
      </aside>
      <main tabindex="-1">${content}</main>
      <footer class="footer">
        <div class="footer-grid">
          <div class="footer-intro">${brand()}<p>Whey protein in Mawa Kulfi and Rich Chocolate flavours. Built around the routine, not the noise.</p></div>
          <div><strong>Shop</strong><ul><li>${routeLink('shop', 'Whey protein')}</li><li>${routeLink('cart', 'Your cart')}</li></ul></div>
          <div><strong>Support</strong><ul><li>${routeLink('authenticate', 'Authenticate a pack')}</li><li>${routeLink('track-order', 'Track your order')}</li><li>${routeLink('faq', 'FAQs')}</li><li>${routeLink('contact', 'Contact')}</li></ul></div>
          <div><strong>Learn</strong><ul><li>${routeLink('quality', 'Quality & lab reports')}</li><li>${routeLink('blog', 'Journal')}</li><li>${routeLink('policy', 'Policies')}</li></ul></div>
        </div>
        <div class="footer-bottom"><div class="footer-socials" aria-label="Social links"><a href="#" aria-label="Facebook">${icon('facebook')}</a><a href="#" aria-label="Instagram">${icon('instagram')}</a><a href="#" aria-label="LinkedIn">${icon('linkedin')}</a><a href="#" aria-label="YouTube">${icon('youtube')}</a></div><span>© 2026 Aura Whey</span></div>
      </footer>
    </div>`;
}

function heroControls() {
  return `<div class="hero-controls"><div class="button-row"><button type="button" class="hero-arrow" data-action="hero-prev" aria-label="Previous hero image">${icon('arrowLeft')}</button><button type="button" class="hero-arrow" data-action="hero-next" aria-label="Next hero image">${icon('arrowRight')}</button></div><div class="hero-dots">${assets.hero.map((_, index) => `<button type="button" class="hero-dot ${index === state.heroSlide ? 'active' : ''}" data-action="hero-${index}" aria-label="Show hero image ${index + 1}"></button>`).join('')}</div><span class="hero-count">0${state.heroSlide + 1} / 0${assets.hero.length}</span></div>`;
}

function home() {
  const slideTitles = ['Aura Whey Rich Chocolate', 'Aura Whey Mawa Kulfi', 'Aura Whey product range'];
  return `
    <section class="section hero-section">
      <div class="hero-grid">
        <div class="hero-copy"><p class="hero-overline">Aura Whey Protein</p><h1>Fuel your <span>aura.</span></h1><p>Two full-bodied flavours. One straightforward whey protein routine.</p><div class="hero-specs"><div class="hero-spec"><strong>24g</strong><span>Protein</span></div><div class="hero-spec"><strong>5.7g</strong><span>BCAAs</span></div><div class="hero-spec"><strong>35g</strong><span>Serving size</span></div><div class="hero-spec"><strong>1kg</strong><span>Net weight</span></div></div><div class="button-row">${button('go-shop', 'Shop the flavours', 'primary')}${routeLink('quality', 'Explore quality', 'button-link secondary')}</div><p class="small hero-note">Available in Mawa Kulfi and Rich Chocolate.</p></div>
        <div class="hero-media">${image(assets.hero[state.heroSlide], slideTitles[state.heroSlide], 'hero-image')}${heroControls()}</div>
      </div>
    </section>
    <section class="section"><div class="section-inner"><div class="section-head"><div><h2>Pick your flavour</h2><div class="gold-rule"></div></div><p>Choose the flavour that fits the ritual you want to repeat.</p></div><div class="grid grid-2">${productCard('Mawa Kulfi')}${productCard('Rich Chocolate')}</div></div></section>
    <section class="section nutrition-section"><div class="section-inner"><div class="section-head"><div><h2>What’s in a serving</h2><div class="gold-rule"></div></div><p>Clear product information, right where you need it.</p></div><div class="stats"><div><span class="stat-value">24g</span>Protein per serving</div><div><span class="stat-value">5.7g</span>BCAAs per serving</div><div><span class="stat-value">35g</span>Serving size</div><div><span class="stat-value">28</span>Servings per pack</div></div></div></section>
    <section class="section"><div class="section-inner"><div class="section-head"><div><h2>Made for the routine</h2><div class="gold-rule"></div></div><p>Simple product details. Familiar flavours. A dependable post-training choice.</p></div><div class="image-section">${image(assets.why, 'Aura Whey product and key details')}</div></div></section>
    <section class="section"><div class="section-inner"><div class="section-head"><div><h2>Quality, on record</h2><div class="gold-rule"></div></div><p>Review the facility and food-safety documents before you buy.</p></div><div class="trust-grid"><div class="trust-item"><strong>FSSAI licensed</strong><span>Licence no. 10724997000182</span></div><div class="trust-item"><strong>ISO 22000</strong><span>Food safety management system</span></div><div class="trust-item"><strong>GMP</strong><span>Good manufacturing practice</span></div><div class="trust-item"><strong>HACCP</strong><span>Hazard control process</span></div></div><p class="button-row">${routeLink('quality', 'View quality documents', 'button-link secondary')}</p></div></section>
    <section class="section"><div class="section-inner"><div class="section-head"><div><h2>Know your pack</h2><div class="gold-rule"></div></div><p>Read the nutrition panel, check the documents, then verify your product code.</p></div><div class="grid grid-2"><div class="card label-card">${image(assets.labelMawa, 'Aura Whey Mawa Kulfi nutrition label', 'label-preview')}</div><div class="quality-cta"><h3>Quality documents and product authentication</h3><p>Our quality library keeps the supplied certification documents in one place. Use the pack code to confirm your purchase.</p><div class="button-row">${routeLink('quality', 'Open quality library', 'button-link primary')}${routeLink('authenticate', 'Authenticate a pack', 'button-link')}</div></div></div></div></section>
    <section class="section"><div class="section-inner"><div class="section-head"><div><h2>Better-informed training</h2><div class="gold-rule"></div></div><p>Practical guides for choosing, using, and enjoying your whey protein.</p></div><div class="grid grid-3">${blogCard(0)}${blogCard(1)}${blogCard(2)}</div><p>${routeLink('blog', 'Browse the journal', 'button-link secondary')}</p></div></section>
    <section class="section"><div class="section-inner"><div class="section-head"><div><h2>Before you order</h2><div class="gold-rule"></div></div><p>The quick answers customers look for most.</p></div>${faqItems(true)}<p>${routeLink('faq', 'Read all FAQs', 'button-link secondary')}</p></div></section>`;
}

const posts = [
  { title: 'How to choose a whey protein flavour', excerpt: 'Start with the taste you will genuinely look forward to using.', image: assets.duo },
  { title: 'A simple way to plan your protein routine', excerpt: 'Build a repeatable food and training routine around your day.', image: assets.why },
  { title: 'Mawa Kulfi or Rich Chocolate?', excerpt: 'Two different flavour profiles, one straightforward choice.', image: assets.chocolate }
];

function blogCard(index) {
  const post = posts[index % posts.length];
  return `<article class="card blog-card"><div class="blog-image">${image(post.image, post.title)}</div><div class="blog-card-copy"><h3>${post.title}</h3><p>${post.excerpt}</p>${routeLink('article', 'Read guide', 'text-link')}</div></article>`;
}

function productCard(flavour) {
  const isMawa = flavour === 'Mawa Kulfi';
  const description = isMawa ? 'A creamy, kulfi-inspired finish with a familiar Indian flavour profile.' : 'A deep chocolate flavour made for a classic shake routine.';
  return `<article class="card product-card"><div class="product-card-media">${image(isMawa ? assets.mawa : assets.chocolate, `Aura Whey ${flavour}`)}</div><div class="product-card-body"><div class="product-card-top"><h3>Aura Whey <span>${flavour}</span></h3><strong>${productPrice}</strong></div><div class="product-meta"><span>1 kg</span><span>28 servings</span></div><p>${description}</p><div class="button-row">${button(`select-${flavour}`, 'View product', 'primary')}</div></div></article>`;
}

function couponEntry() {
  const result = state.coupon === 'DISC5' ? 'DISC5 is applied. Your 5% offer will be reflected at checkout.' : state.coupon ? 'That code is not recognised. Try DISC5.' : 'Have a code? Apply it before checkout.';
  return `<form class="coupon-form" data-form="coupon"><label class="field">Coupon code<input name="coupon" value="${state.coupon}" placeholder="Enter coupon code" /></label><button type="submit" class="button">Apply</button></form><div class="coupon-result" aria-live="polite">${result}</div>`;
}

function shop() {
  const tabContent = {
    Details: 'Aura Whey Protein is supplied in a 1 kg pack with two flavour options: Mawa Kulfi and Rich Chocolate. Choose a flavour, add it to your cart, and complete payment through the Shopify checkout.',
    Nutrition: 'Per 35 g serving: 24 g protein and 5.7 g BCAAs. One 1 kg pack contains 28 servings. Refer to the pack nutrition panel for the complete information.',
    Ingredients: 'Refer to the product pack for the ingredients list, allergen advice, storage instructions, and full nutritional information.'
  };
  const productImage = state.flavour === 'Mawa Kulfi' ? assets.mawa : assets.chocolate;
  return `<h1 class="page-title">Aura Whey Protein</h1><div class="product-layout"><section class="product-gallery"><div class="product-main-image">${image(productImage, `${state.flavour} Aura Whey product`)}</div><div class="thumbnail-row"><button type="button" class="thumbnail" data-action="select-Mawa Kulfi" aria-label="Select Mawa Kulfi">${image(assets.mawa, 'Mawa Kulfi')}</button><button type="button" class="thumbnail" data-action="select-Rich Chocolate" aria-label="Select Rich Chocolate">${image(assets.chocolate, 'Rich Chocolate')}</button><div class="thumbnail">${icon('file')}<span>Label</span></div></div></section><section class="purchase-panel"><p class="breadcrumb">Shop / Whey protein</p><h2>Aura Whey <span>${state.flavour}</span></h2><div class="price">${productPrice}<span>Inclusive of taxes</span></div><p>1 kg · 28 servings · 35 g serving size</p><div class="flavour-picker"><span>Choose flavour</span><div class="button-row"><button type="button" class="flavour ${state.flavour === 'Mawa Kulfi' ? 'active' : ''}" data-action="select-Mawa Kulfi">Mawa Kulfi</button><button type="button" class="flavour ${state.flavour === 'Rich Chocolate' ? 'active' : ''}" data-action="select-Rich Chocolate">Rich Chocolate</button></div></div><div class="coupon-entry">${couponEntry()}</div><div class="product-actions"><div class="button-row">${button('add-cart', 'Add to cart', 'primary', 'bag')}${routeLink('quality', 'View quality documents', 'button-link secondary')}</div></div></section></div><section class="section"><div class="section-inner"><div class="tab-list">${Object.keys(tabContent).map(tab => `<button type="button" class="tab ${state.tab === tab ? 'active' : ''}" data-action="tab-${tab}">${tab}</button>`).join('')}</div><div class="tab-panel">${tabContent[state.tab]}</div></div></section><section class="section"><div class="section-inner"><div class="trust-grid"><div class="trust-item"><strong>Manufacturing</strong><span>GMP-certified facility</span></div><div class="trust-item"><strong>Food safety</strong><span>ISO 22000 and HACCP documents</span></div><div class="trust-item"><strong>Authenticity</strong><span>${routeLink('authenticate', 'Authenticate your pack')}</span></div><div class="trust-item"><strong>Need help?</strong><span>${routeLink('faq', 'Read the FAQs')}</span></div></div></div></section>`;
}

function totals() {
  const subtotal = 4199 * state.quantity;
  const discount = state.coupon === 'DISC5' ? Math.round(subtotal * .05) : 0;
  return { subtotal, discount, total: subtotal - discount, format: (value) => `₹${value.toLocaleString('en-IN')}` };
}

function cart() {
  const hasCart = state.cart > 0;
  if (!hasCart) return `<section class="empty-state"><div><p class="hero-overline">Your cart</p><h1>Nothing here yet.</h1><p>Pick a flavour to begin your Aura Whey routine.</p>${routeLink('shop', 'Shop whey protein', 'button-link primary')}</div></section>`;
  const amount = totals();
  const productImage = state.flavour === 'Mawa Kulfi' ? assets.mawa : assets.chocolate;
  return `<h1 class="page-title">Your cart</h1><div class="cart-layout"><section><article class="cart-item"><div class="cart-image">${image(productImage, `Aura Whey ${state.flavour}`)}</div><div><h2>Aura Whey ${state.flavour}</h2><p>1 kg · 28 servings</p><strong class="item-price">${productPrice}</strong><div class="quantity"><span>Quantity</span><button class="quantity-button" type="button" data-action="quantity-down" aria-label="Decrease quantity">−</button><span>${state.quantity}</span><button class="quantity-button" type="button" data-action="quantity-up" aria-label="Increase quantity">+</button></div></div>${button('remove-cart', 'Remove')}</article></section><aside class="summary"><h2>Order summary</h2><div class="summary-row"><span>Subtotal</span><span>${amount.format(amount.subtotal)}</span></div>${amount.discount ? `<div class="summary-row discount"><span>DISC5</span><span>−${amount.format(amount.discount)}</span></div>` : ''}<div class="summary-row"><span>Shipping</span><span>Calculated at checkout</span></div><div class="summary-row"><strong>Total</strong><strong>${amount.format(amount.total)}</strong></div><div class="cart-coupon">${couponEntry()}</div><p>${button('checkout', 'Secure checkout', 'primary')}</p><p class="small">Checkout is completed securely through Shopify.</p></aside></div>`;
}

function checkout() { return `<section class="handoff"><div class="handoff-icon">${icon('bag')}</div><p class="hero-overline">Secure checkout</p><h1>Ready for Shopify checkout.</h1><p>Your delivery address, payment method, taxes, and order confirmation are handled in the secure Shopify checkout.</p><div class="button-row">${routeLink('cart', 'Back to cart', 'button-link')}${button('shopify-checkout', 'Continue to checkout', 'primary')}</div><div id="checkout-result" aria-live="polite"></div></section>`; }

const documents = [
  ['FSSAI licence', 'Food safety licence', 'Licence no. 10724997000182'],
  ['ISO 22000 certificate', 'Food safety management', 'Certificate supplied by the manufacturer'],
  ['GMP certificate', 'Manufacturing practice', 'Certificate supplied by the manufacturer'],
  ['HACCP certificate', 'Hazard analysis and control', 'Certificate supplied by the manufacturer'],
  ['Kosher certificate', 'Dietary certification', 'Certificate supplied by the manufacturer'],
  ['Halal certificate', 'Dietary certification', 'Certificate supplied by the manufacturer']
];

function documentCard([title, type, detail]) { return `<article class="card document-card"><div class="document-icon">${icon('file')}</div><p class="document-type">${type}</p><h3>${title}</h3><p>${detail}</p>${button(`view-document-${title}`, 'View document', 'document-button')}</article>`; }

function quality() {
  return `<section class="page-intro"><p class="hero-overline">Quality & documentation</p><h1>Quality you can inspect.</h1><p>Browse the supplied food-safety and manufacturing documents, then authenticate the code on your pack.</p></section><section class="section"><div class="section-inner"><div class="section-head"><div><h2>Certificates</h2><div class="gold-rule"></div></div><p>Food safety, manufacturing, and dietary certification documents.</p></div><div class="grid grid-3">${documents.map(documentCard).join('')}</div></div></section><section class="section"><div class="section-inner quality-process"><div class="quality-process-image">${image(assets.labelMawa, 'Aura Whey product nutrition information')}</div><div><h2>Read the pack first.</h2><p>Nutrition, ingredients, allergen advice, and storage guidance are printed on the product label. We keep the supplied certificates alongside it for straightforward review.</p><div class="button-row">${routeLink('authenticate', 'Authenticate your pack', 'button-link primary')}${routeLink('contact', 'Contact support', 'button-link')}</div></div></div></section>`;
}

function search() {
  const query = state.searchQuery.trim();
  const results = query ? `<div class="search-results"><p>Showing matches for <strong>${query}</strong></p><div class="grid grid-2">${productCard('Mawa Kulfi')}${productCard('Rich Chocolate')}</div></div>` : '<p class="search-help">Search for a product, a quality document, or a journal guide.</p>';
  return `<section class="page-intro compact"><p class="hero-overline">Search</p><h1>Find what you need.</h1><form class="search-form" data-form="search"><label class="sr-only" for="store-search">Search the store</label><input id="store-search" name="query" value="${query}" placeholder="Search products and guides" />${button('submit-search', 'Search', 'primary', 'search')}</form>${results}</section>`;
}

function account() { return `<section class="page-intro compact"><p class="hero-overline">Your account</p><h1>Sign in to Aura Whey.</h1><div class="account-layout"><form class="form" data-form="account"><label class="field">Email address<input name="email" type="email" placeholder="you@example.com" /></label><label class="field">Password<input name="password" type="password" placeholder="Your password" /></label>${button('submit-account', 'Sign in', 'primary')}</form><div class="account-aside"><h3>New here?</h3><p>Create your customer account during Shopify checkout. You can then return to view your orders.</p>${routeLink('track-order', 'Track an order instead', 'text-link')}</div></div><div id="account-result" aria-live="polite"></div></section>`; }

function blog() { return `<section class="page-intro"><p class="hero-overline">Aura journal</p><h1>Train with clarity.</h1><p>Practical reads for choosing your product and making your routine easier to keep.</p></section><section class="section"><div class="featured-post"><div class="featured-image">${image(assets.duo, posts[0].title)}</div><div><p class="hero-overline">Featured guide</p><h2>${posts[0].title}</h2><p>${posts[0].excerpt}</p>${routeLink('article', 'Read the guide', 'button-link primary')}</div></div></section><section class="section"><div class="section-inner"><div class="grid grid-3">${[0, 1, 2, 0, 1, 2].map(blogCard).join('')}</div></div></section>`; }

function article() { return `<article class="article"><p>${routeLink('blog', 'Back to journal', 'text-link')}</p><p class="hero-overline">Product guide</p><h1>How to choose a whey protein flavour</h1><p class="article-meta">Aura Whey Journal · 5 minute read</p><div class="article-hero">${image(assets.duo, 'Aura Whey product flavours')}</div><div class="article-layout"><div><h2>Start with the flavour you will use.</h2><p>The best choice is usually the flavour that makes your everyday shake easy to enjoy. Rich Chocolate keeps things familiar, while Mawa Kulfi brings a creamier, dessert-inspired profile.</p><h2>Keep your routine simple.</h2><p>Use the product label as your reference for serving size, nutrition information, ingredients, and allergen guidance. Consistency is easier when the plan is clear.</p></div><aside class="article-aside"><strong>Explore Aura Whey</strong>${routeLink('shop', 'Shop both flavours', 'text-link')}${routeLink('quality', 'View quality documents', 'text-link')}</aside></div></article>`; }

function authenticate() { return `<section class="page-intro compact"><p class="hero-overline">Product authentication</p><h1>Check your Aura Whey pack.</h1><div class="verify-layout"><div class="verify-image">${image(assets.labelMawa, 'Aura Whey pack label')}</div><div><p>Enter the authentication code printed on your pack. For this interactive preview, use <strong>AURA-2026-001</strong> or <strong>AURA-2026-USED</strong>.</p><form class="form" data-form="authenticate"><label class="field">Pack code<input name="code" placeholder="Enter pack code" /></label>${button('verify-code', 'Verify code', 'primary', 'check')}</form><div id="auth-result" aria-live="polite"></div></div></div></section>`; }

function trackOrder() { return `<section class="page-intro compact"><p class="hero-overline">Order tracking</p><h1>Where is your order?</h1><div class="track-layout"><div><form class="form" data-form="tracking"><label class="field">Order number<input name="order" placeholder="e.g. AW-1001" /></label><label class="field">Email address<input name="email" type="email" placeholder="Email used at checkout" /></label>${button('find-order', 'Find order', 'primary')}</form><div id="tracking-result" aria-live="polite"></div></div><div class="track-help"><h3>Need help?</h3><p>Your order number is included in the email confirmation sent after checkout.</p>${routeLink('contact', 'Contact support', 'text-link')}</div></div></section>`; }

const faqs = [
  ['Which flavours are available?', 'Aura Whey Protein is currently available in Mawa Kulfi and Rich Chocolate flavours.'],
  ['How much protein is in one serving?', 'The product label states 24 g protein per 35 g serving, with 5.7 g BCAAs.'],
  ['How do I authenticate my product?', 'Visit Authenticate, then enter the code printed on your Aura Whey pack.'],
  ['Where can I read the certificates?', 'The Quality & lab reports page contains the supplied manufacturing and food-safety documents.'],
  ['How do I track an order?', 'Use your order number and the email address used at checkout on the Track order page.']
];

function faqItems(limit = false) { return `<div class="accordion">${faqs.slice(0, limit ? 2 : faqs.length).map(([question, answer], index) => `<div><button type="button" data-action="faq-${index}" aria-expanded="false"><span>${question}</span>${icon('chevron')}</button><div class="accordion-panel" hidden>${answer}</div></div>`).join('')}</div>`; }
function faq() { return `<section class="page-intro compact"><p class="hero-overline">FAQs</p><h1>Answers, without the runaround.</h1>${faqItems()}</section>`; }

function contact() { return `<section class="page-intro compact"><p class="hero-overline">Contact Aura Whey</p><h1>How can we help?</h1><div class="contact-layout"><div><form class="form" data-form="contact"><label class="field">Name<input name="name" placeholder="Your name" /></label><label class="field">Email address<input name="email" type="email" placeholder="you@example.com" /></label><label class="field">Message<textarea name="message" rows="5" placeholder="Tell us how we can help"></textarea></label>${button('send-message', 'Send message', 'primary')}</form><div id="contact-result" aria-live="polite"></div></div><div class="contact-aside"><h3>Before you contact us</h3><p>For an existing order, keep your order number nearby. For product verification, use the code printed on the pack.</p>${routeLink('track-order', 'Track an order', 'text-link')}${routeLink('authenticate', 'Authenticate a pack', 'text-link')}</div></div></section>`; }

function policy() { return `<section class="page-intro compact"><p class="hero-overline">Policies</p><h1>Store policies.</h1><div class="policy-grid"><article><h2>Shipping</h2><p>Shipping availability, timelines, and charges are confirmed during Shopify checkout.</p></article><article><h2>Returns</h2><p>Return eligibility is reviewed by support based on the order and product condition.</p></article><article><h2>Privacy</h2><p>Customer information is used to process orders, provide support, and improve the store experience.</p></article></div><p class="small">These policy summaries will be replaced with the approved legal policy text before store launch.</p></section>`; }

function documentPage() { return `<section class="page-intro compact"><p class="hero-overline">Quality document</p><h1>${state.document}</h1><div class="document-viewer"><div class="document-sheet"><div class="document-stamp">AW</div><h2>${state.document}</h2><p>This screen is ready to connect to the supplied source PDF when the document library is added to the production store.</p><div class="document-lines"><i></i><i></i><i></i><i></i></div></div><div><p>Use the quality library to browse the supplied certificates for Aura Whey.</p>${routeLink('quality', 'Back to quality documents', 'button-link')}</div></div></section>`; }

const views = { home, shop, cart, checkout, quality, blog, article, authenticate, 'track-order': trackOrder, faq, contact, policy, document: documentPage, search, account };

function currentRoute() { return location.hash.replace('#/', '') || 'home'; }
function applyTheme() { document.documentElement.dataset.theme = state.theme; document.querySelector('meta[name="theme-color"]')?.setAttribute('content', state.theme === 'dark' ? '#0a0a0a' : '#f7f4ed'); }
function render() { applyTheme(); shell((views[currentRoute()] || home)()); bindEvents(); }
function navigate(route) { location.hash = `/${route}`; }

function bindEvents() {
  document.querySelectorAll('[data-route]').forEach(link => link.addEventListener('click', () => setTimeout(() => document.querySelector('main')?.focus(), 0)));
  document.querySelectorAll('[data-action]').forEach(element => element.addEventListener('click', () => handleAction(element.dataset.action, element)));
  document.querySelectorAll('form[data-form]').forEach(form => form.addEventListener('submit', handleForm));
}

function handleAction(action, element) {
  if (action === 'toggle-theme') { state.theme = state.theme === 'dark' ? 'light' : 'dark'; localStorage.setItem('aura-theme', state.theme); return render(); }
  if (action === 'toggle-coupon') { state.couponOpen = false; return render(); }
  if (action === 'show-coupon') { state.couponOpen = true; return render(); }
  if (action === 'hero-next') { state.heroSlide = (state.heroSlide + 1) % assets.hero.length; return render(); }
  if (action === 'hero-prev') { state.heroSlide = (state.heroSlide - 1 + assets.hero.length) % assets.hero.length; return render(); }
  if (action.startsWith('hero-') && /^hero-\d+$/.test(action)) { state.heroSlide = Number(action.replace('hero-', '')); return render(); }
  if (action === 'open-menu') { document.querySelector('.mobile-panel').classList.add('open'); document.querySelector('.overlay').classList.add('open'); return; }
  if (action === 'close-menu') { document.querySelector('.mobile-panel').classList.remove('open'); document.querySelector('.overlay').classList.remove('open'); return; }
  if (action === 'go-shop') return navigate('shop');
  if (action.startsWith('select-')) { state.flavour = action.replace('select-', ''); return currentRoute() === 'shop' ? render() : navigate('shop'); }
  if (action.startsWith('tab-')) { state.tab = action.replace('tab-', ''); return render(); }
  if (action === 'add-cart') { state.cart = 1; return navigate('cart'); }
  if (action === 'remove-cart') { state.cart = 0; state.quantity = 1; return render(); }
  if (action === 'quantity-up') { state.quantity += 1; return render(); }
  if (action === 'quantity-down') { state.quantity = Math.max(1, state.quantity - 1); return render(); }
  if (action === 'checkout') return navigate('checkout');
  if (action === 'shopify-checkout') { document.querySelector('#checkout-result').innerHTML = '<div class="result state-valid"><strong>Checkout handoff ready</strong><p>Connect your Shopify Storefront API or checkout URL here when the store credentials are available.</p></div>'; return; }
  if (action.startsWith('view-document-')) { state.document = action.replace('view-document-', ''); return navigate('document'); }
  if (action.startsWith('faq-')) { const panel = element.nextElementSibling; const expanded = element.getAttribute('aria-expanded') === 'true'; element.setAttribute('aria-expanded', String(!expanded)); panel.hidden = expanded; return; }
}

function handleForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (form.dataset.form === 'coupon') { state.coupon = form.elements.coupon.value.trim().toUpperCase(); return render(); }
  if (form.dataset.form === 'authenticate') {
    const value = form.elements.code.value.trim().toUpperCase();
    const results = { 'AURA-2026-001': ['state-valid', 'Pack verified', 'This demonstration code is accepted. In production, this will return your product’s verification record.'], 'AURA-2026-USED': ['state-invalid', 'This code has already been checked', 'Please contact support if you believe your pack needs another review.'] };
    const [kind, title, text] = results[value] || ['state-invalid', 'Code not found', 'Check the code printed on your pack and try again.'];
    document.querySelector('#auth-result').innerHTML = `<div class="result ${kind}"><strong>${title}</strong><p>${text}</p></div>`;
    return;
  }
  if (form.dataset.form === 'tracking') {
    const order = form.elements.order.value.trim().toUpperCase();
    const email = form.elements.email.value.trim();
    const found = order === 'AW-1001' && email;
    document.querySelector('#tracking-result').innerHTML = found ? '<div class="result state-valid"><strong>Order found</strong><p>Your order is confirmed. Courier details and delivery updates will appear here after Shopify tracking is connected.</p></div>' : '<div class="result state-invalid"><strong>No matching order</strong><p>Check the order number and email address, then try again.</p></div>';
    return;
  }
  if (form.dataset.form === 'contact') { document.querySelector('#contact-result').innerHTML = '<div class="result state-valid"><strong>Message received</strong><p>Thanks. The support team will reply to the email address you provided.</p></div>'; return; }
  if (form.dataset.form === 'account') { document.querySelector('#account-result').innerHTML = '<div class="result"><strong>Account sign-in</strong><p>Connect this form to Shopify customer accounts when the store integration is enabled.</p></div>'; return; }
  if (form.dataset.form === 'search') { state.searchQuery = form.elements.query.value.trim(); return form.dataset.mobileSearch ? navigate('search') : render(); }
}

window.addEventListener('hashchange', render);
render();
