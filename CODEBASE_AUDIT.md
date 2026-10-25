# Codebase audit — 23 October 2026

Scope: the Shopify OS 2.0 theme in `theme/`, its TypeScript/CSS source in `src/`, build scripts and
unit tests. This builds on earlier reports (`docs/STOREFRONT-ARCHITECTURE.md`,
`docs/PRODUCT-SYSTEM-AUDIT.md`, `docs/CUSTOMIZATION_AUDIT.md`), which are still valid. This audit
re-checked their main points and concentrated on the purchase path, cross-component consistency and
settings that have no effect.

**Labels:** *Confirmed*: reproduced or proven from the code. *Risk*: a plausible failure that was
not reproduced. *Optional*: an improvement, not a defect.

## Baseline (before changes)

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npx vitest run` | 34 files, 151 tests pass |
| `npm run build` | Pass |
| `npm run check:json` | Pass |
| `npm run check:contracts` | 5/5 pass, reference current |
| `shopify theme check` | 0 errors, 2 warnings (`carousel-product-data`, `carousel-measurements` orphaned) |

All the automated checks passed, so the problems below are logic and integration problems that
these checks don't detect.

## Critical

### C1. The carousel purchase flow was unreachable, and its old model didn't match the intended design (Confirmed, fixed)

- **Files:** `theme/sections/featured-collection.liquid`, `src/components/carousel/carousel.ts`,
  `src/components/carousel/carousel.css`, `theme/snippets/carousel-product-data.liquid`
- **Cause:** concurrent work (`PRODUCT_PAGE_PLAN.md`, "Superseding carousel direction") hard-coded
  `data-browse-only` on every featured carousel. The purchase runtime was still in `carousel.ts`,
  but no Liquid rendered its markup or product data, which is why Theme Check reported the two
  orphaned snippets. The runtime that remained also used a different model: sizes were always
  visible, you selected a size, and the button added it.
- **Impact:** the storefront carousel couldn't add anything to the cart, unlike the design in the
  audit brief (one shared Add to cart for the highlighted product, which opens the size selector).
- **Resolution (confirmed with the owner before the change):**
  - New section setting **Shop the highlighted product** (`carousel_purchase`, default on). When
    it's off, the existing browse-only lens carousel is unchanged.
  - **Add to cart** names the highlighted product. Pressing it opens that product's sizes
    (`aria-expanded`, focus moves to the first available size) and does not add anything.
    Choosing an available size adds exactly that variant at its minimum quantity. Pressing the
    button again or pressing Escape closes the sizes and returns focus to the button.
  - The product and variant are captured when the size is clicked. If the highlight moves while
    the request is in flight, the add still completes for the captured product. Only one add can
    be in flight at a time: repeated clicks on sizes or the button are ignored while busy.
  - **Autoplay is held** while the sizes are open, a size is previewed, an add is in flight, the
    mouse is over the purchase panel, or the panel has keyboard focus. This holds for the WebGL
    engine (`setHeld`) and the native/snap rails (`#sync`). If the shopper moves to another product
    themselves, the selector closes.
  - Sold-out products disable the button. Subscription-only and unreadable products link to their
    product page. Default-variant products are added directly. A failed add leaves the sizes open
    and shows Shopify's message.
  - Closed sizes keep their space in the WebGL caption (`visibility: hidden`), so opening them
    doesn't shrink the cards.
- **Tests:** new `tests/unit/carousel-purchase.test.ts` (11 tests). The obsolete select-then-add
  tests in `carousel-enhancement.test.ts` were ported to the new flow, keeping their coverage of
  measurements, unit conversion, legacy chart fetching and late responses.
- **Live check (dev store, `shopify theme dev`, 127.0.0.1:9393):** on the homepage carousel,
  pressing Add to cart opened the sizes (M and XL disabled as sold out, focus on L). Choosing L
  added `The Portofino Shirt - L`. `/cart.js` went from 0 to 1, the header badge showed 1, the
  drawer opened and the selector closed. The test line was removed from the cart afterwards.
  Visual appearance and the WebGL mode were **not** verified because the browser pane was hidden.

## High

### H1. Three different rules for "which option is the size" (Confirmed, fixed)

- **Files:** `snippets/product-card.liquid` (exact match on *Size option name(s)*),
  `snippets/carousel-product-data.liquid` (the same rule, then falls back to the first option),
  `sections/main-product.liquid` (block `size_guide_option` or the name contains "size", used for
  both the picker and the fit finder).
- **Impact:** an option named "Shoe size" got a measurement panel and an explicit choice on the
  product page but no quick-add tray on cards. "Waist", if listed in theme settings, worked on
  cards but not on the product page. So the same product was treated differently depending on
  where the shopper saw it.
- **Resolution:** one new snippet, `snippets/size-option.liquid`, now used by all four call sites.
  An option is a size if its name contains "size", matches a name in the theme setting, or matches
  the block's size-guide option.

### H2. Missing translation for "Choose options" in the carousel (Confirmed, fixed)

- **Files:** `src/components/carousel/carousel.ts`, `theme/snippets/nk-config.liquid`
- **Cause:** `t('product.choose_options')` wasn't in the JS string whitelist, so subscription-only
  products showed the raw key `product.choose_options` on the button.
- **Resolution:** added `product.choose_options` to the `nk-config` strings. All
  `t('…')` keys in `src/` were checked against `nk-config`, and this was the only one missing.

### H3. Quick-add size button could keep showing "✓" (Confirmed, fixed)

- **File:** `src/components/product/card-interactions.ts`
- **Cause:** each click saved the button's *current* text as its label. A second click during the
  900 ms "✓" (or 1.4 s "!") confirmation saved "✓", and two restore timers then raced.
- **Impact:** a card size pill could show "✓" for good instead of its size.
- **Resolution:** the real label is stored once per button, and any pending restore timer is
  cleared when a new add starts. Regression test added to `product-regressions.test.ts`.

## Medium

### M1. Native-rail timers could start while the WebGL engine was running (Confirmed by reading the code, fixed)

- **File:** `src/components/carousel/carousel.ts`
- **Cause:** `#sync()` only checked that `#viewport` was set, and a previous native mount left it
  set. After a remount (for example when the reduced-motion preference changed), holding or
  releasing autoplay in WebGL mode could start a native `requestAnimationFrame` loop or a snap
  `setInterval`. Nothing would ever clean those up, because the native disposers had already run.
- **Resolution:** an explicit `#native` flag is set only while the native rail is mounted and
  cleared when it's disposed.

### M2. Browse carousels restarted twice on a motion change (Confirmed, fixed)

- **Cause:** `core/motion.ts` already disconnects and reconnects every `nk-carousel` on a motion
  change, and the carousel also restarted itself on `nk:motion:changed`. Each change therefore
  created and destroyed two WebGL contexts.
- **Resolution:** removed the redundant listener. The carousel still restarts itself at the 989 px
  breakpoint, which the motion policy doesn't watch.

### M3. "Added to cart" announced more than once (Confirmed, fixed)

- **Files:** `components/cart/cart-drawer.ts`, `services/cart-render.ts`, carousel status markup
- **Cause:** the drawer announced every add, and the renderer announced again in notification
  mode. The old carousel status was also a live region.
- **Resolution:** the cart renderer is now the only announcer (once per add, except in "go to cart
  page" mode). The carousel status is visible but no longer a live region; errors still use the
  assertive announcer.

### M4. Theme setting "Logo over campaign images" did nothing (Confirmed, fixed)

- **Files:** `config/settings_schema.json` (`logo_inverse`), `sections/header.liquid`,
  `src/styles/components/header.css`
- **Cause:** the setting was never rendered. This was found by a scripted check of every schema
  setting against all Liquid. The other settings that check flagged are read through dynamic
  keys (`size_chart_N_*`, `column_N`, `value_N`) and are false positives.
- **Resolution:** on the homepage with the overlay header, the inverse logo is rendered and shown
  only while the header is transparent. It uses exactly the same state selector as the
  transparent styling.

### M5. Measurement unit logic duplicated three times, and the carousel ignored the shopper's unit (Confirmed, fixed)

- **Files:** `variant-picker.ts`, `size-guide.ts`, `carousel.ts`
- **Cause:** each file had its own conversion, storage key handling and event parsing. The
  carousel neither read the saved unit nor broadcast changes, so its preview could show inches
  while the product page showed centimetres.
- **Resolution:** new `src/components/product/measure-units.ts` (stored unit, conversion, panel
  unit display, row display, event parsing) is used by all three. The carousel now reads, stores
  and broadcasts `nk:unit:changed`.

## Low

- **L1 (Confirmed, fixed).** The `carousel-product-data.liquid` doc pointed to a non-existent
  `size-sheet.ts`; it's now corrected.
- **L2 (Confirmed, fixed).** The native loop cloned the carousel's `<script>` product data and
  `<template>` charts into every clone slide. Clones now drop `template` as well as `script`.
- **L3 (Confirmed, fixed).** One `any` in `tests/unit/product-regressions.test.ts` was replaced
  with `CartResult`. `src/` has no `any`, `@ts-ignore` or disabled lint rules.
- **L4 (Optional, not changed).** `src/components/product/sticky-buy.ts` is registered and bundled
  in `nk-product.js`, but no Liquid renders `<nk-sticky-buy>`. It was removed from the design per
  `docs/PRODUCT-SYSTEM-AUDIT.md`. It's left in place because a test still covers it, and removing
  it is a product decision.
- **L5 (Optional, not changed).** The JS strings `media.play` and `media.pause` are sent from
  `nk-config` but never used.
- **L6 (Risk).** `carousel-product-data` iterates `product.variants`, which Liquid caps (250
  variants). Very large catalogs would be cut off. That isn't a concern for this apparel catalog;
  the product page itself uses the high-variant `option_values` approach.

## Reviewed with no defects found

- **Cart service:** FIFO queue, coalescing, no automatic POST retries, and reconciliation after
  ambiguous results. A failed cart read after a successful add.js POST is reconciled correctly.
- **Section renderer and overlay service:** atomic `replaceRegions`, stale-response sequencing,
  recovery GETs.
- **Product form and variant picker:** explicit size choice, blocked submits while resolving or
  mismatched, one submission at a time, `option_values` rendering, and the combined-listing
  redirect.
- **Sold-out consistency:** cards, carousel (canvas grayscale and label), product page and size
  pills all derive from Shopify's `product.available` / `variant.available`. Shopify re-checks
  stock when the item is added.
- **GSAP:** `motionMatch` contexts revert on removal and on breakpoint changes. Reveal, stagger and
  parallax check that their connection is still current after async imports. ScrollTrigger
  refreshes on section load, reorder, unload and replacement. No duplicate timelines were found
  on reconnect.
- **Global listeners:** all are installed once behind `installed` guards. Component listeners use
  `NkElement` abort signals.
- **`innerHTML`:** only used to restore merchant-authored markup (`text.ts`) and to namespace
  fetched product HTML (`product-dom.ts`). No user input reaches `innerHTML`. There are no
  credentials in client code, and routes come from Liquid.

## Validation after changes

| Command | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npx vitest run` | **35 files, 161 tests pass** (151 before; 11 new purchase tests, 1 new quick-add test, obsolete tests ported) |
| `npm run build` | Pass, 44 assets synced |
| `npm run check:json` | Pass |
| `npm run check:contracts` | 5/5 pass, customization reference current |
| `shopify theme check --fail-level error` | **128 files, 0 offenses** (both orphan warnings resolved) |
| Live dev store | Carousel open → size → add verified, as described in C1 |

## Not verified (environment limits)

- **Visuals:** the carousel's appearance in shop mode, the WebGL caption with the open sizes, and
  the inverse logo. The browser pane was hidden, so screenshots were blank and the WebGL engine
  didn't start there; the native rail served the live test.
- **Devices and assistive tech:** real touch devices, screen readers, and Theme Editor
  add/duplicate/reorder of two carousels on the same page. Instance isolation is by design
  (per-element state, `section.id` IDs) but wasn't exercised live.
- **Concurrent edits:** another session was running a dev server in this folder during the audit.
  Files from that work (carousel, shaders, docs) were kept as they were. Review the combined diff
  before committing.
- **Not committed:** none of these changes are committed.
