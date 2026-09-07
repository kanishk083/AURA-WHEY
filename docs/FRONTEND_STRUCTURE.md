# Aura Whey frontend structure

## Current architecture

The storefront is a vanilla JavaScript single-page application.

- `index.html` is the static application entry point.
- `app.js` owns application state, hash routing, shared layout, page renderers, carousel behavior, and form actions.
- `styles.css` contains the complete global design system and responsive styles.
- Product and Stitch reference assets are maintained alongside the project files.

The current runtime remains unchanged. This document defines the professional module structure to use for a future refactor.

## Recommended target structure

```text
.
├── index.html
├── src/
│   ├── main.js                         # Browser entry point; starts the app
│   ├── app.js                          # Thin app composition and route rendering
│   ├── data/
│   │   ├── hero-slides.js              # Hero banner image and copy configuration
│   │   ├── navigation.js               # Header and footer navigation data
│   │   ├── products.js                 # Product, flavour, price, and nutrition data
│   │   ├── documents.js                # Certification and quality-document data
│   │   ├── faqs.js                     # FAQ content
│   │   └── posts.js                    # Journal/article metadata
│   ├── state/
│   │   ├── store.js                    # Shared cart, flavour, coupon, and theme state
│   │   └── actions.js                  # State transitions and action handlers
│   ├── routes/
│   │   ├── router.js                   # Hash route parsing and navigation
│   │   └── routes.js                   # Route-to-page component map
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.js               # Offer bar, navigation, utility controls
│   │   │   ├── MobileMenu.js           # Responsive navigation drawer
│   │   │   └── Footer.js               # Shared footer
│   │   ├── hero/
│   │   │   ├── HeroCarousel.js         # Autoplay, buttons, indicators, swipe handling
│   │   │   └── HeroSlide.js            # One accessible image banner
│   │   ├── sections/
│   │   │   ├── ProductHighlights.js    # Homepage product cards
│   │   │   ├── NutritionSnapshot.js    # Homepage nutrition metrics
│   │   │   ├── RoutineSection.js       # Homepage routine / why-Aura section
│   │   │   ├── QualityPreview.js       # Homepage quality and certification preview
│   │   │   ├── PackVerification.js     # Homepage pack/document preview
│   │   │   ├── JournalPreview.js       # Homepage journal preview
│   │   │   └── FaqPreview.js           # Homepage FAQ preview
│   │   └── ui/
│   │       ├── Button.js               # Shared button variants
│   │       ├── Icon.js                 # Inline SVG icon registry
│   │       ├── ProductCard.js          # Reusable flavour/product card
│   │       ├── DocumentCard.js         # Reusable certificate card
│   │       ├── Accordion.js            # Accessible FAQ accordion
│   │       ├── CouponForm.js           # Reusable coupon input and result
│   │       └── Toast.js                # Shared transient status message
│   ├── pages/
│   │   ├── HomePage.js                 # Composes homepage sections only
│   │   ├── ProductPage.js
│   │   ├── CartPage.js
│   │   ├── CheckoutPage.js
│   │   ├── QualityPage.js
│   │   ├── BlogPage.js
│   │   ├── ArticlePage.js
│   │   ├── AuthenticatePage.js
│   │   ├── TrackOrderPage.js
│   │   ├── FaqPage.js
│   │   ├── ContactPage.js
│   │   ├── SearchPage.js
│   │   ├── AccountPage.js
│   │   ├── PolicyPage.js
│   │   └── DocumentPage.js
│   ├── utils/
│   │   ├── dom.js                     # Small DOM/render helpers
│   │   ├── currency.js                # INR formatting helpers
│   │   └── accessibility.js           # Focus and reduced-motion helpers
│   └── styles/
│       ├── tokens.css                 # Colours, fonts, spacing, radii, breakpoints
│       ├── base.css                   # Reset and base element rules
│       ├── layout.css                 # Header, grid, page, and footer layout
│       ├── components.css             # Reusable UI component styles
│       └── pages.css                  # Page- and section-specific styles
├── assets/
│   ├── products/
│   ├── quality/
│   └── hero/
└── docs/
    └── FRONTEND_STRUCTURE.md
```

## Module boundaries

| Concern | Owns | Must not own |
| --- | --- | --- |
| `app.js` | Root render composition and lifecycle wiring | Page markup, data, business transitions |
| `pages/` | Page-level composition | Shared header, footer, or reusable cards |
| `components/layout/` | Global shell UI | Route-specific content |
| `components/sections/` | Homepage section markup | Cross-page state mutations |
| `components/ui/` | Reusable presentational patterns | Route decisions |
| `data/` | Static display data | DOM mutations or event listeners |
| `state/` | State and transitions | Markup or CSS decisions |
| `routes/` | URL-to-page resolution | Shared visual components |

## Safe refactor order

1. Move immutable data out of `app.js` with no markup changes.
2. Extract `Icon`, `Button`, and link/render helpers.
3. Extract `Header`, mobile menu, and `Footer` without changing their output.
4. Extract the hero carousel into `HeroCarousel` and move slide data into `data/hero-slides.js`.
5. Extract homepage sections one at a time, preserving their exact DOM classes and order.
6. Extract route pages, then reduce `app.js` to composition, router setup, and subscriptions.
7. Split global CSS by responsibility only after component markup is stable.

## Invariants for the refactor

- Keep the current hash routes and route names.
- Preserve the cart, coupon, quantity, theme, FAQ, authentication, tracking, and carousel behavior.
- Preserve all current CSS class names during the initial extraction pass so the visual output does not change.
- Do not introduce React, a build tool, or a UI framework unless the project explicitly adopts one.
- Keep hero images replaceable by editing only `data/hero-slides.js` after extraction.
