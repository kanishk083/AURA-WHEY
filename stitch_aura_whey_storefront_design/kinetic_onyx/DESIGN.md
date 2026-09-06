---
name: Kinetic Onyx
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#d4c5ab'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#9c8f78'
  outline-variant: '#4f4632'
  surface-tint: '#fabd00'
  primary: '#ffe4af'
  on-primary: '#3f2e00'
  primary-container: '#ffc107'
  on-primary-container: '#6d5100'
  inverse-primary: '#785900'
  secondary: '#ffd484'
  on-secondary: '#412d00'
  secondary-container: '#f5b300'
  on-secondary-container: '#654800'
  tertiary: '#ffe3ba'
  on-tertiary: '#422c00'
  tertiary-container: '#ffc04d'
  on-tertiary-container: '#724f00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdf9e'
  primary-fixed-dim: '#fabd00'
  on-primary-fixed: '#261a00'
  on-primary-fixed-variant: '#5b4300'
  secondary-fixed: '#ffdea5'
  secondary-fixed-dim: '#febb14'
  on-secondary-fixed: '#271900'
  on-secondary-fixed-variant: '#5d4200'
  tertiary-fixed: '#ffdeab'
  tertiary-fixed-dim: '#ffba33'
  on-tertiary-fixed: '#281900'
  on-tertiary-fixed-variant: '#5f4100'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-hero:
    fontFamily: Oswald
    fontSize: 64px
    fontWeight: '700'
    lineHeight: 72px
    letterSpacing: 0.02em
  display-hero-mobile:
    fontFamily: Oswald
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 46px
    letterSpacing: 0.02em
  headline-xl:
    fontFamily: Oswald
    fontSize: 44px
    fontWeight: '600'
    lineHeight: 52px
    letterSpacing: 0.02em
  headline-xl-mobile:
    fontFamily: Oswald
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: 0.02em
  headline-lg:
    fontFamily: Oswald
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: 0.01em
  headline-md:
    fontFamily: Oswald
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 30px
    letterSpacing: 0.01em
  stat-lg:
    fontFamily: Oswald
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: 0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-macro:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.08em
  label-action:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  space-3xl: 4rem
  gutter-mobile: 1rem
  gutter-desktop: 1.5rem
  container-max: 1280px
---

## Brand & Style

This design system embodies high-intensity sports nutrition engineered for maximum performance, discipline, and uncompromising physical excellence. Designed for dedicated athletes, gym-goers, and fitness enthusiasts in the modern Indian market, the UI projects raw power, technical precision, and premium purity. 

Drawing from **High-Contrast Utilitarianism** and **Tactile Performance Tech**, the interface merges deep pitch-black canvases with high-voltage athletic gold accents. Dense technical specifications, macro breakdowns (protein, BCAAs, EAAs), and certification markers are presented with clean, military-grade clarity. The overall visual tone inspires immediate athletic ambition: dark, focused, razor-sharp, and unyielding.

## Colors

The color palette prioritizes intense contrast and immediate visual hierarchy across an ultra-deep dark canvas:

- **Primary (`#FFC107`)**: The high-voltage electric gold used for key conversion buttons, active state indicators, primary nutritional callouts, and brand marks.
- **Secondary (`#F5B301`)**: A rich, concentrated golden yellow for secondary highlights, badge outlines, and interactive hover states.
- **Tertiary (`#E09E00`)**: A deep burnished amber-gold for subtle accents, category tags, and structural dividing accents.
- **Neutrals**:
  - `Canvas Base`: `#0A0A0A` (deep onyx black providing an immersive, low-light stage for golden glows and packaging renders).
  - `Surface Container`: `#121212` (elevated card backgrounds and functional containers).
  - `Surface Elevated`: `#1A1A1A` (popovers, flyout drawers, floating navigation modules).
  - `Borders & Rules`: `#262626` (subtle slate stroke delineating structural blocks without visual clutter).
  - `Text Primary`: `#FFFFFF` (crisp white for high legibility on dark surfaces).
  - `Text Secondary`: `#A3A3A3` (neutral slate for metadata, supporting copy, and dosage instructions).
  - `Success / Quality Badge`: `#10B981` (used for certified vegetarian indicators and lab-test verification markers).

## Typography

The typographic hierarchy establishes athletic dominance paired with clinical readability:

- **Headings & Key Metrics (`Oswald`)**: The condensed, muscular geometry of Oswald delivers maximum punch for marketing claims, nutritional hero figures (e.g., "24g PROTEIN", "5.7g BCAAs"), and section headers. Headlines should frequently be set in full uppercase to echo sports performance packaging and billboard branding.
- **Body & Technical Specs (`Inter`)**: Inter delivers frictionless readability for product descriptions, ingredient panels, amino acid profiles, and checkout details. Its neutral grotesque skeleton prevents visual fatigue against deep dark backgrounds.
- **Macro Data Treatment**: Numerical values leverage bold weights from Oswald, anchored directly above uppercase micro labels set in tracked Inter (`label-macro`).

## Layout & Spacing

This design system uses a strict 8px base rhythm (with a 4px sub-grid for badges and nutritional indicators) embedded within a responsive 12-column grid:

- **Desktop (>= 1024px)**: 12-column layout with 24px (`space-lg`) gutters, 48px page margins, and a locked maximum content container width of 1280px. Heavy use of split screens (50/50 hero layouts) showcasing isolated product renders next to performance claims.
- **Tablet (768px - 1023px)**: 8-column layout with 20px gutters and 32px margins. Product spec tables collapse into swipeable cards.
- **Mobile (< 768px)**: 4-column layout with 16px (`space-md`) gutters and 16px edges. Sticky bottom quick-add conversion drawers lock to the viewport bottom.

Nutritional stats and macro breakdowns use tight structural grid blocks (e.g., a 3-column macro bar: Protein | BCAAs | Servings) delineated by razor-thin vertical slate dividers.

## Elevation & Depth

Visual depth is achieved primarily through dark tonal stepping, crisp structural slate strokes, and restrained golden ambient backlights rather than heavy blurry drop shadows:

- **Base Canvas**: Flat `#0A0A0A` background for pure contrast.
- **Container Level 1**: Flat `#121212` background framed by a subtle, precise `1px solid #262626` outline.
- **Container Level 2 (Hover/Focus)**: Surface elevates to `#1A1A1A` with border color brightening to `#3A3A3A`.
- **Aura Ambient Bloom**: Reserved for hero elements, featured product canisters, and active CTA cards. Uses a targeted diffuse glow: `box-shadow: 0 0 35px -5px rgba(255, 193, 7, 0.15)`.
- **Modals & Drawers**: `#141414` background with an outer ambient shadow of `0 24px 48px -12px rgba(0, 0, 0, 0.85)` and a top boundary highlight `border-top: 1px solid #FFC107`.

## Shapes

The system implements a tightly controlled, soft-edge geometry (`roundedness: 1`):

- **Default Radii (`0.25rem` / 4px)**: Form inputs, interactive buttons, nutritional data tiles, flavor selector tabs, and macro badges. This small radius maintains structural rigor and industrial sharpness without looking crude.
- **Large Radii (`0.5rem` / 8px)**: Product cards, nutrition summary containers, and cart flyouts.
- **Pills / Circles (`9999px`)**: Specifically restricted to status indicators, dietary validation dots (e.g., green veg square badge), and weight step increments.

## Components

### Buttons
- **Primary CTA**: Background `#FFC107`, text `#0A0A0A`, font `Inter` 600, uppercase with slight tracking (`0.04em`), 4px border radius. On hover: shifts to `#F5B301` with a warm halo (`box-shadow: 0 0 20px rgba(255, 193, 7, 0.35)`). Active state scales subtly (`0.98`).
- **Secondary CTA**: Background transparent, border `1px solid #FFC107`, text `#FFC107`. Hover fills to `rgba(255, 193, 7, 0.08)`.
- **Ghost / Utility**: Text `#FFFFFF`, transparent background, hover state brightens text to `#FFC107`.

### Product & Flavor Selectors
- **Flavor Cards / Chips**: Compact rounded rectangular cards (`#121212` background, `1px solid #262626` border). Active flavor displays a `1.5px solid #FFC107` border, a mini golden checkmark, and a subtle amber ambient inner glow.
- **Weight / Size Chips (e.g., 1kg / 2kg)**: Flat dark tiles with bold metric typography. Hover shifts border from `#262626` to `#404040`.

### Cards & Nutritional Spec Blocks
- **Macro Hero Bar**: Dark horizontal slab (`#121212`) divided into equidistant segments by `1px solid #262626` vertical dividers. Numbers rendered in `Oswald` bold gold `#FFC107`, unit metrics in crisp white, and subheadings in muted slate uppercase `Inter`.
- **Product Display Card**: Framed by `#262626` border, `#121212` surface. Features an absolute top badge tag (e.g., "FAST DIGESTING"), high-resolution canister asset centered with bottom-aligned flavor/weight meta, rating stars in `#FFC107`, and a high-impact "ADD TO CART" button.

### Form Inputs & Steppers
- **Text Inputs**: `#0A0A0A` field, `1px solid #262626` border, `#FFFFFF` text. Focus state activates a crisp `1px solid #FFC107` border with zero offset.
- **Quantity Steppers**: Segmented dark control (`#1A1A1A`) with `+` and `-` glyphs in `#FFFFFF` and centered numeric value.

### Badges & Dietary Tags
- **Vegetarian Certification Badge**: Green square container with green internal dot conforming to Indian safety standards, positioned alongside gold-bordered purity tags (e.g., "LAB TESTED", "ZERO ADDED SUGAR").