# NK Theme — Comprehensive Updates & Redesign Report

> Full report also available at [`UPDATES.md`](../UPDATES.md).

This document summarizes all audits, bug fixes, visual/interactive overhauls, motion upgrades, product system integrations, and architectural collection redesigns completed for the **NK Shopify Liquid Theme** (`nk-theme/`).

---

## 1. Header, Navigation & Search Overhaul

### 1.1 Header Layout, Dropdowns & Scroll Behavior (`theme/sections/header.liquid`, `src/components/header/header.ts`, `src/styles/components/header.css`, `theme/sections/header-group.json`)
- **Fixed Header Grid & Alignment**: Rebalanced `.header__inner` into a 3-column grid (`1fr auto 1fr`) on desktop so the brand logo stays dead-center while primary navigation links sit cleanly on the left and utilities (Search, Account, Bag) sit on the right.
- **Configured Live Navigation Menu**: Updated `theme/sections/header-group.json` so the header binds to `main-menu` with sticky scroll behavior enabled.
- **Desktop Dropdown Submenus**: Replaced raw `<details>` overlap issues with `<nk-disclosure>` and styled `.header__submenu` panels (`min-width: 220px`, surface border, smooth fade/translate transition, and click-outside/Escape dismissal).
- **Refined Mobile Navigation Drawer**: Added `<nk-disclosure>` accordion groups inside `.menu-drawer` for nested links alongside a footer utility bar for Account and Search.

### 1.2 Expandable Search Pill & Predictive Search Modal (`src/components/search-pill/search-pill.ts`, `src/components/search-pill/search-pill.css`, `theme/snippets/search-modal.liquid`, `src/styles/components/dialog.css`)
- **Fixed Broken Header Search**:
  - Updated `<nk-search-pill>` in `theme/sections/header.liquid` so clicking the search trigger smoothly expands an inline search input on desktop (`>= 990px`) and opens the full-width `<nk-modal id="search-modal">` drawer on mobile/tablet (`< 990px`), or when clicking **"Explore full search"**.
  - Added live `<nk-predictive-search>` inside the header search popover so typing immediately fetches and displays matching products, collections, and queries via Shopify's Predictive Search Section Rendering API (`/search/suggest?section_id=predictive-search`).
  - Added `.search-modal__error-actions` styling so retry and fallback search links align cleanly on network errors.

---

## 2. Hero & Editorial Text Animation Overhaul

### 2.1 Replaced Corny 3D Fold Animation with Clean Word-Mask Reveal (`src/components/text/text.ts`, `src/components/text/text.css`, `theme/snippets/reveal-heading.liquid`, `theme/sections/hero.liquid`)
- **Problem**: The previous `entrance="fold"` / `hover="refold"` 3D paper-crease effect (`rotateX(-88deg)` with gradient crease shadows) looked gimmicky and re-triggered on hover.
- **Fix**:
  - Added a clean luxury editorial `entrance="words"` mode to `<nk-text>` (`src/components/text/text.ts` & `src/components/text/text.css`) where each word is wrapped in an overflow mask (`.nk-word-mask > .nk-word`) and rises smoothly from `yPercent: 108 -> 0` with `power3.out` easing (`0.82s` duration, `0.045s` stagger) and zero hover re-triggering.
  - Updated `theme/snippets/reveal-heading.liquid` to default to `entrance="words"` with `hover="none"`.
  - Updated `theme/sections/hero.liquid` with choreographed entrance delays across the eyebrow (`delay="0.06"`), word-mask display heading, subtitle (`delay="0.28"`), and magnetic CTA buttons (`delay="0.4"`).

---

## 3. Product Detail Page: Full Architecture, Size Selector & Gallery Zoom

### 3.1 Preserved Animated Size Underline & Live Measurement Panel (`src/components/product/variant-picker.ts`, `src/styles/product.css`, `theme/snippets/product-measurements.liquid`, `theme/sections/main-product.liquid`)
- **Animated Size Underline Indicator**:
  - Maintained the exact horizontal size selector aesthetic in `<nk-variant-picker>`.
  - Wired live sliding underline indicator (`[data-size-indicator]`) using `--indicator-x` and `--indicator-w` with a 300ms cubic-bezier transition.
  - Added pointer-hover preview: hovering any size pill previews the underline position and sets `data-preview` before reverting to the checked selection on mouse leave.
  - Connected `ResizeObserver` on the picker element so the underline recalculates seamlessly on viewport resizes.
- **Inline Garment Measurement Panel**:
  - Connected `[data-measurement-panel]` dynamically to `<nk-variant-picker>`.
  - When a size is hovered or selected, unhides and highlights the matching `[data-measurement-row="<SIZE>"]` and updates `[data-measurement-active-size]`.
  - Supports bidirectional live conversion between inches (`in`) and centimetres (`cm`) (`[data-measure-unit]`), updating all `[data-measure-value]` elements, broadcasting `nk:unit:changed`, and synchronizing with the full size guide drawer.
  - Added staggered micro-animations (`animate()` over 240ms with 28ms stagger) for measurement grid cells on reveal.

### 3.2 High-Resolution Lightbox Zoom Modal & Thumbnail Strip (`src/components/product/gallery.ts`, `theme/snippets/product-media.liquid`, `src/styles/product.css`)
- **Desktop Thumbnail Navigation Strip**: Added sticky vertical thumbnail track on desktop (`.gallery__thumbs`) that synchronizes active state with scroll-snapped slides on both click and scroll.
- **Lightbox Zoom Modal**:
  - Implemented `<dialog class="gallery-lightbox">` in `NkGallery` with backdrop light-dismiss, close button, prev/next arrows, and keyboard Arrow navigation.
  - Injected high-resolution zoom image on demand (`data-zoom-src`) to avoid empty image network requests on initial page load while eliminating Theme Check offenses.
  - Added 2x cursor-tracked zoom pan: moving pointer over the zoomed image pans the view smoothly across coordinates (`--zoom-x`, `--zoom-y`).
  - Preloads adjacent slides for instant next-image transitions.

### 3.3 Dynamic SKU Synchronization & Sticky Purchase Bar (`src/components/product/sticky-buy.ts`, `theme/sections/main-product.liquid`, `src/styles/product.css`)
- **Dynamic SKU Updates**: Wrapped `.product__price-row` in `data-region="price"` so variant SKU (`[data-product-sku]`) dynamically updates alongside price during Section Rendering variant resolution.
- **`<nk-sticky-buy>` Component**:
  - Created and registered `<nk-sticky-buy>` (`src/components/product/sticky-buy.ts`) observing when the primary buy button scrolls out of view via `IntersectionObserver`.
  - Slides up with smooth transition (`translate: 0 100% -> 0 0`), synchronizes variant title, price, and button label with `nk:variant:changed`, automatically hides when drawer overlays are open (`html[data-overlay-open]`), and gracefully handles incomplete selections by smoothly scrolling to the first unchosen option group.

### 3.4 Sibling Switcher & Shared Swatches (`theme/snippets/product-siblings.liquid`, `theme/snippets/swatch-color.liquid`)
- Extracted product colorway/edition sibling links into `theme/snippets/product-siblings.liquid`.
- Created `theme/snippets/swatch-color.liquid` to resolve Shopify native swatch images/colors and editorial color tokens, dropping `main-product.liquid` complexity well within Shopify Theme Check limits.

---

## 4. Product Cards: Hover Video, Frosted Size Tray & Quick Add

### 4.1 Delegated Card Interactions (`src/components/product/card-interactions.ts`, `theme/snippets/product-card.liquid`, `src/styles/components/card.css`)
- **Hover Video Playback**: Automatically plays `<video data-card-video>` on `pointerover` / `focusin` and pauses/resets on leave, lazy-hydrating metadata and respecting `prefers-reduced-motion`.
- **Frosted Size Tray Quick-Add**:
  - Rendered interactive `.card__tray-pill--btn` buttons for available sizes directly inside `.card__tray` (placed outside the primary anchor tag for valid HTML).
  - Clicking any size calls `cart.add()` with immediate busy state (`data-busy`, `···`), success feedback (`data-added`, `✓`), polite screen-reader announcements, and triggers the cart drawer via `cart-render.ts`.
  - Added 1-click Quick Add for single-variant products (`.card__tray-single`).
- **Color Swatch Previews**:
  - Rendered `.card__swatches` for products with color options. Hovering or clicking a swatch updates the card's primary image preview (`[data-card-primary-img]`) and synchronizes all card links (`[data-card-link]`) to that variant's URL.
- **Full Sold-Out Treatment**: Grayed out sold-out cards (`filter: grayscale(1); opacity: 0.58`) with centered veil, top badge with status dot, and struck-through pricing.

---

## 5. Collections & Search: AJAX Pagination, Sticky Toolbar & Layout Switcher

### 5.1 Full-Bleed Sticky Architectural Toolbar (`theme/snippets/facets.liquid`, `src/styles/components/facets.css`, `src/components/facets/facets.ts`)
- Fixed CSS variable references (`--nk-header-h`, `--nk-gutter`) for precise sticky positioning under the header.
- Interactive Grid Layout Switcher: dynamically toggles `--nk-cols-mobile` (`1` / `2`) and `--nk-cols-desktop` (`2` / `3` / `4`) on `.product-grid`, persists choice in `sessionStorage`, and animates grid items.
- Added `data-facets-link` to `theme/snippets/pagination.liquid` so collection and search pagination seamlessly use `<nk-facets>` Section Rendering without full page reloads.

---

## 6. Motion Engine & Entrypoints Polish

- **`<nk-reveal>` (`src/components/reveal/reveal.ts`)**: Supported both `mode` and `entrance` attributes, added `rise` preset (`opacity: 0, y: 28`), and preserved `clearProps` on animation completion.
- **`<nk-magnetic>` & Cursor (`src/components/motion/cursor.ts`, `src/entries/global.ts`)**: Supported both `[data-magnetic]` and `<nk-magnetic>` custom elements with configurable `strength`.
- **Storefront Lazy Loading (`src/entries/global.ts`)**: Registered `nk-variant-picker`, `nk-product-form`, `nk-gallery`, and `nk-sticky-buy` with `registerLazy()` so product components automatically hydrate on any page where their tags appear.

---

## 7. Verification & Build Health

Ran complete automated verification suite (`npm run check`):
- **TypeScript (`npm run typecheck`)**: `tsc --noEmit` — **0 errors**
- **Unit Tests (`npm run test`)**: `vitest run` — **4 test files passed, 20 tests passed**
  - Cart state, queue, and Section Rendering updates
  - Request sequencer and retry logic
  - Custom element lifecycle and attribute observations
  - Variant picker incomplete option blocking & Section Rendering resolution
  - Size selector animated underline and measurement panel `in`/`cm` conversion
  - Sticky buy bar visibility, option scroll, and submission
  - Size guide drawer unit conversions
  - Predictive search debouncing and result rendering
  - Collection facets sorting, AJAX pagination, and grid layout switcher
- **Production Build (`npm run build`)**: `vite build && node scripts/sync-assets.mjs` — **20 files built and synced to `theme/assets/`, `nk-assets.liquid` updated**
- **Strict JSON Check (`npm run check:json`)**: `node scripts/check-json.mjs` — **all 7 theme JSON files parse strictly**
- **Shopify Theme Check (`npm run check:theme`)**: `shopify theme check --path theme --fail-level error` — **71 files inspected, 0 offenses, 0 errors, 0 warnings**


## 8. Infinite collection carousel and footer improvements — 22 October 2026

- Inspected the public Corso Velle homepage's continuous New Arrivals rail. Added an **Infinite carousel** layout to the existing Featured collection section and configured a New arrivals instance on the homepage using the real All Products collection. Existing grid settings and product-card controls are preserved.
- Added `src/components/carousel/carousel.ts` and its stylesheet: continuous native scrolling, seamless wrap, touch/swipe browsing, previous/next controls, persistent pause, hover/focus/offscreen/background suspension, and a static reduced-motion/editor fallback. Visual duplicates have no tab stops or duplicate IDs; their clicks route through the matching original product control. Duplicate video downloads are avoided.
- Improved the existing footer with responsive native menus, actual Shopify newsletter submission/error states, store-driven links and policies, a large live wordmark, and a reveal enabled only when the full footer fits on desktop. Tall/mobile/reduced-motion footers remain normal document content. Keyboard focus exposes the revealed footer; newsletter submissions are blocked in design mode.
- Reused the supplied sticky-footer interaction as the starting pattern. Subsequent Beam Wordmark styling and motion added concurrently by the other chat are preserved in the same footer component.
- Registered both components lazily through the global entrypoint. Added `tests/unit/carousel-footer.test.ts` covering wrapping, accessible duplicate controls, pause/cleanup, editor fallback, click forwarding, and responsive footer menus.
- Verification: TypeScript, production build/owned-asset sync, strict JSON and Theme Check pass. Real Shopify preview browser checks at 320, 390, 768 and 1440px verified autoplay, pause, navigation, native menus and zero page overflow/console errors; reduced motion produced a static rail. Newsletter backend submission was intentionally not performed (no test subscriber created). Screenshots are in `docs/evidence/infinite-carousel-desktop.png` and `docs/evidence/footer-390.png` / `footer-1440.png`.
- The carousel/footer preview was initially isolated to avoid changing product validation assets. The source is integrated into the main theme and final assets are synced. Nothing was published to the live production theme.
