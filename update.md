# NK Theme — Comprehensive Updates & Redesign Report

This document summarizes all audits, bug fixes, visual/interactive overhauls, motion upgrades, and architectural collection redesigns completed for the **NK Shopify Liquid Theme** (`nk-theme/`).

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

## 3. Product Card v2: Hover Video, Frosted Size Tray & Full Sold-Out State

### 3.1 Hover Video & Secondary Image Curtain Reveal (`theme/snippets/product-card.liquid`, `src/entries/global.ts`, `src/styles/components/card.css`)
- **Hover Video Support**: Updated `theme/snippets/product-card.liquid` to detect the first `video` media item on a product and render a muted, looping `<video class="card__video" preload="none">` inside `.card__media`.
- **Smart Video Lifecycle**: Wired `pointerenter`, `pointerleave`, `focusin`, and `focusout` listeners in `src/entries/global.ts` (`startCardVideo` / `stopCardVideo`) that lazy-hydrate `<source data-src>` on first hover/focus, play the video smoothly, and pause on leave (respecting `prefers-reduced-motion: reduce`).
- **Secondary Image Reveal**: When a product has no video but has a second image, hovering performs a smooth upward curtain wipe (`clip-path: inset(100% 0 0 0) -> inset(0 0 0 0)`) and subtle scale settle (`scale(1.06) -> scale(1)`).

### 3.2 Frosted Glass Size Tray on Hover (`theme/snippets/product-card.liquid`, `src/styles/components/card.css`)
- Redesigned `.card__tray` into a frosted glass overlay (`backdrop-filter: blur(12px)`) anchored at the bottom of `.card__media` that slides up on card hover/focus (`translate: 0 calc(100% + 12px) -> 0 0`).
- Displays a `Sizes` header label (`product.sizes_label`) above individual bordered `.card__tray-pill` badges for each size, with unavailable sizes clearly struck through and dimmed (`.card__tray-pill.is-out`).

### 3.3 Unmistakable Full-Card Sold-Out State (`theme/snippets/product-card.liquid`, `src/styles/components/card.css`)
- When `product.available == false`, the entire `.card--sold-out` element is grayed out (`filter: grayscale(1); opacity: 0.58`), displays a centered `.card__sold-out-veil` + `.card__sold-out-banner` over the media, a top-left pill badge with a status dot (`.badge--sold-out`), a struck-through `.price__current`, and an inline `Sold out` label next to the price.

---

## 4. "The Wardrobe" (`category-cards.liquid`) Uncropped Studio Fit & Architectural Frame

- **Fixed Cropping (`object-fit: contain`)**: Updated `theme/sections/category-cards.liquid` and `src/styles/components/riviera.css` so category/wardrobe images sit on a pure studio white canvas (`#ffffff`) with `object-fit: contain` instead of `object-fit: cover`, ensuring garments are never cropped.
- **Architectural Studio Framing**: Redesigned each category card with a top index bar (`01`–`05` + live `{{ count }} products` badge), uncropped 4:5 studio frame, and a bottom caption bar with title, subtitle, and interactive `↗` arrow indicator.

---

## 5. Smooth Motion Engine & Component Utilization Across Storefront

- **`<nk-reveal>` (`src/components/reveal/reveal.ts`)**: Added `delay` and `duration` attributes, upgraded easing to `expo.out` / `power3.out`, and added `clearProps: 'transform,opacity,clipPath'` upon completion so revealed elements never trap CSS stacking contexts.
- **`<nk-stagger>` (`src/components/motion/stagger.ts`)**: Upgraded scroll-triggered grid stagger so each `[data-stagger-item]` rises smoothly (`y: 34 -> 0`, `opacity: 0 -> 1`, `duration: 0.95s`, `ease: 'expo.out'`, `stagger: 0.075s`) while its inner studio image settles from `scale(1.05)` to `scale(1)` (`duration: 1.25s`).
- **`<nk-tabs>` (`src/components/tabs/tabs.ts`)**: Removed the heavy blur filter and horizontal jump when switching tabs; replaced with a 280ms panel fade (`cubic-bezier(0.22, 1, 0.36, 1)`), a 460ms gliding underline indicator, and a staggered vertical card rise + image scale settle.
- **Storefront Component Integration**: Integrated `<nk-reveal>`, `<nk-stagger>`, `<nk-magnetic>`, `<nk-parallax>`, `<nk-marquee>`, and `data-cursor` across `theme/templates/index.json`, `theme/templates/product.json`, `theme/sections/main-product.liquid`, and `theme/sections/product-recommendations.liquid`.

---

## 6. Complete Collection Sections & Collection Page Redesign (`wrclo.com` Inspired)

### 6.1 Homepage Collection Sections
- **Collection Tabs (`theme/sections/collection-tabs.liquid`)**:
  - Redesigned with an architectural split header bar (`border-bottom: 1px solid var(--nk-color-line)`), eyebrow + display heading on the left, and uppercase technical tab triggers with live `(count)` badges and a gliding underline indicator on the right.
  - Added a structured editorial footer bar below each tab panel showing the collection summary and a magnetic `View all (count) →` CTA button.
- **Featured Collection (`theme/sections/featured-collection.liquid`)**:
  - Rebuilt into a luxury drop showcase with an architectural split header, italic display accent support, live `(count)` badge, optional collection description, `<nk-stagger>` product grid, and a bottom editorial footer bar.

### 6.2 Collection Page (`/collections/:handle`) & All Collections Directory (`/collections`)
- **Editorial Collection Banner (`theme/sections/collection-banner.liquid`, `theme/templates/collection.json`)**:
  - Eliminated the empty 500px dark brown box (`scheme-2`) when a collection has no banner image.
  - When no banner image is set, renders a crisp `wrclo.com`-style **Editorial Collection Header** on `scheme-1` featuring:
    - Breadcrumb navigation (`Home / Collections / {{ collection.title }}`)
    - Display `h1` with word-mask entrance + tabular product count badge (`124 products`)
    - Optional collection description (`max-width: 60ch`)
    - **Horizontal Collection Quick-Navigation Strip** with `View all` + store collections (including live product counts and `aria-current="page"` active pill state)
  - When a banner image is present, renders a full-bleed `<nk-parallax>` hero banner with dark scrim and light typography.
- **Full-Bleed Sticky Architectural Toolbar & Interactive Grid Layout Switcher (`theme/snippets/facets.liquid`, `src/styles/components/facets.css`, `src/components/facets/facets.ts`, `src/styles/components/card.css`)**:
  - Built a full-bleed `100vw` sticky toolbar (`top: var(--header-height, 0px)`, `backdrop-filter: blur(12px)`, `border-block: 1px solid var(--nk-color-line)`) divided by crisp vertical `1px solid` hairline borders:
    - **Left**: Filter drawer button (with sliders SVG icon + active count) and inline `Sort by:` select control.
    - **Center**: Live tabular product count (`[data-results-label]`).
    - **Right**: Interactive **Grid Layout Switcher** (`1` / `2` columns on mobile; `2` / `3` / `4` columns on desktop) with geometric SVG grid icons.
  - Enhanced `<nk-facets>` (`src/components/facets/facets.ts`) to switch `--nk-cols-mobile` and `--nk-cols-desktop` live on `.product-grid`, persist the shopper's layout preference in `sessionStorage`, update `aria-pressed`, and trigger smooth staggered card + image animations on layout change and AJAX filter/sort updates.
- **Main Collection Grid & Empty States (`theme/sections/main-collection.liquid`)**:
  - Connected `main-collection.liquid` seamlessly with the editorial collection banner and sticky toolbar, and styled architectural empty states and pagination bars.
- **All Collections Directory (`theme/sections/collections.liquid`)**:
  - Replaced the unstyled boilerplate in `theme/sections/collections.liquid` (`/collections`) with a numbered architectural directory (`01`–`NN`), live product counts, uncropped `object-contain` studio imagery via `{% render 'image' %}`, and interactive `↗` hover cards.

---

## 7. Connected Product Experience, Size Selector, Dark Measurement Panel & Gallery Zoom

### 7.1 Product Page Layout, Breadcrumbs & Smart Automation (`theme/sections/main-product.liquid`, `src/styles/product.css`, `theme/snippets/price.liquid`)
- **Collection Breadcrumb & Context Header**: Added a top breadcrumb (`Collections / <Primary Collection> / <Product Title>`) and an eyebrow/badge row that automatically surfaces `Sale` (with computed `−XX%` savings in `theme/snippets/price.liquid`), `Sold out`, and tag-driven badges (`New`, `Bestseller`, `Limited`), alongside live variant SKU references (`Ref. {{ variant.sku }}`).
- **Smart Color Sibling & Edition Detection**: Automatically detects `product.metafields.custom.color_siblings.value` or sibling products sharing the same title within the primary collection (e.g., `Andre | Linen Shirt`, `Bellagio | Knit Polo`) and renders an interactive thumbnail switcher strip above the variant picker.
- **Automatic Swatch Color Fallback**: Added a reusable colour-name resolver for `Color`/`Colour` options so standard fashion shades (`noir`, `ivory`, `ecru`, `sand`, `camel`, `espresso`, `navy`, `olive`, `burgundy`, `terracotta`, `charcoal`, etc.) automatically render colour swatches even when no Shopify Admin swatch object is attached.
- **Smart Real-Time Inventory Status (`[data-region="inventory"]`)**: Automatically displays an emerald `In stock — ready to ship` status badge, an amber `Only X left` low-stock badge when inventory is at or below threshold, or a `Sold out` status that lists which other sizes of the garment are still available.
- **Automated Metafield Specs & Accordions (`src/components/disclosure/disclosure.ts`)**: Automatically surfaces `custom.fabric` / `custom.materials`, `custom.fit`, `custom.origin`, and `custom.care` / `custom.care_instructions` inside smooth height-animated `<nk-disclosure>` accordions.

### 7.2 Horizontal Size Selector, Gliding Underline & Dark Garment Measurement Panel (`theme/snippets/product-measurements.liquid`, `theme/snippets/size-chart.liquid`, `src/components/product/variant-picker.ts`, `src/components/size-guide/size-guide.ts`)
- **Horizontal Size Strip with Gliding Underline (`[data-size-indicator]`)**: Redesigned the size selector in `main-product.liquid` and `src/styles/product.css` with a horizontal typographic size bar (`.option__values--size`) and a hardware-accelerated underline indicator (`transform: translate3d(var(--indicator-x), 0, 0)`) that glides smoothly across sizes on selection, hover preview, focus, and resize.
- **Reusable Dark Garment Measurement Panel (`theme/snippets/product-measurements.liquid`)**:
  - Built a dark obsidian measurement panel (`#141312` surface, `#F5F2EB` tabular typography, gold indicator dot) embedded inside `<nk-variant-picker>` that reveals garment measurements (`Chest`, `Length`, `Shoulder`, `Sleeves`, etc.) for the selected or hovered size.
  - **Multi-Source Resolution**: Automatically resolves measurements from `product.metafields.custom.size_chart.value` (metaobject), `product.metafields.custom.measurements.value` (JSON), or category-validated block CSV tables.
  - **Strict Category & Size Validation (Zero Fabricated Data)**: Validates that measurement rows match the product's actual size option values and suppresses shirt chest/sleeve fallback tables on footwear (`Loafers`, `Boots`, `Mules`) and bottoms (`Trousers`, `Jeans`) when no category-specific measurement data is present.
  - **Live `in` / `cm` Unit Conversion & Sync**: Clicking `in` or `cm` in the inline dark measurement panel or inside the `<nk-size-guide>` drawer converts all values (`× 2.54` / `÷ 2.54`), persists the preference in `sessionStorage` (`nk:measure-unit`), and synchronizes both views via the `nk:unit:changed` custom event.

### 7.3 Product Gallery Thumbnails & High-Resolution Lightbox Zoom (`theme/snippets/product-media.liquid`, `src/components/product/gallery.ts`, `src/styles/product.css`)
- **Interactive Thumbnail Navigation Strip (`[data-gallery-thumb]`)**: Added a vertical sticky thumbnail rail on desktop (`>= 990px`) and horizontal thumbnail strip on mobile that jumps directly to any media slide and tracks the active slide via `IntersectionObserver`.
- **Variant Media Synchronization**: Selecting a variant with `featured_media` automatically scrolls the gallery to that variant's image and updates the active thumbnail.
- **High-Resolution Lightbox Zoom Modal (`<dialog data-ref="lightbox" closedby="any">`)**: Added a full-viewport dark editorial lightbox modal with `closedby="any"` + backdrop click light-dismiss, keyboard `ArrowLeft`/`ArrowRight` navigation, adjacent high-res image preloading, and interactive 2× click-to-zoom with pointer panning.
- **LCP & Fetch Priority Optimization**: First gallery image loads with `loading="eager" fetchpriority="high"`, while subsequent slides use `loading="lazy"` with no redundant `fetchpriority="auto"`.

### 7.4 Interactive Product Cards: 1-Click Quick Add, Mobile Toggle, Swatch Preview & Prefetching (`theme/snippets/product-card.liquid`, `src/components/product/card-interactions.ts`, `src/styles/components/card.css`)
- **Accessible Sibling Quick-Add Tray**: Moved `.card__tray` outside `<a class="card__media">` into `.card__media-wrap` so size pills are real `<button type="button" data-quick-add="...">` controls with zero nested interactive elements.
- **One-Click Quick Add to Cart**: Clicking any available size pill in a card's tray adds that variant directly via `cart.add()`, shows busy (`···`), added (`✓`), or error (`!`) states, and opens the Cart Drawer automatically.
- **Mobile Touch Quick-Add Toggle (`[data-card-quick-toggle]`)**: Added a touch-friendly `+` toggle button on mobile/tablet so shoppers can open the size tray and quick-add sizes without relying on hover.
- **Color Swatch Image Preview & Predictive Prefetching**: Clicking or hovering `.card__swatch` dots updates the card's primary image (`[data-card-primary-img]`), and hovering a product card for `140ms` prefetches the product page URL (`<link rel="prefetch">`, capped at 8 URLs, respecting `Save-Data`).

### 7.5 Mobile & Compact Sticky Add-to-Cart Bar (`src/components/product/sticky-buy.ts`, `theme/sections/main-product.liquid`)
- Created `<nk-sticky-buy>` (`src/components/product/sticky-buy.ts`, registered in `src/entries/product.ts`), which uses `IntersectionObserver` on `<nk-product-form>` to slide up a frosted bottom purchase bar once the main buy button scrolls out of view.
- Synchronizes active variant title, price, availability, and incomplete-selection prompts (`Choose a Size` scrolls smoothly to the size selector and focuses the first option; `Add to cart` submits `<nk-product-form>`).

---

## 8. Core Infrastructure & Verification Summary

- **Lazy & Global Registration (`src/entries/global.ts`, `src/entries/product.ts`)**: Registered `nk-predictive-search`, `nk-facets`, `nk-sticky-buy`, and `installCardInteractions()`.
- **Verification (`npm run check`)**:
  - **TypeScript (`npm run typecheck`)**: `tsc --noEmit` — **0 errors**
  - **Unit Tests (`npm run test`)**: `vitest run` — **4 test files passed, 20 tests passed** (covering `nk-variant-picker` explicit size choice, dark measurement panel hover/selection reveal, `in`/`cm` unit conversion, `nk-size-guide`, `nk-gallery` thumbnails & lightbox zoom, product card quick-add & swatch image preview, `nk-sticky-buy`, `nk-predictive-search`, and `nk-facets` AJAX sort & grid layout switcher)
  - **Production Build (`npm run build`)**: `vite build && node scripts/sync-assets.mjs` — **20 files synced to `theme/assets/`, `theme/snippets/nk-assets.liquid` updated**
  - **Strict JSON Check (`npm run check:json`)**: `node scripts/check-json.mjs` — **all theme JSON files parse strictly**
  - **Shopify Theme Check (`npm run check:theme`)**: `shopify theme check --path theme --fail-level error` — **72 files inspected, 0 errors, 0 warnings**
