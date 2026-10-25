# Mobile testing report — 25 October 2026

A mobile-first evaluation of the NK theme on Corsovelle's Shopify development preview: how it looks, scrolls, responds and sells on phones, with tablet and desktop regression checks. It complements [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md).

## Verdict

**The mobile storefront is ready for customers on typical phones**, with two caveats:

- **First scroll on low-end Android.** On a low-end phone (6× CPU throttle) the first pass down the homepage drops to about 30 fps while sections start their animations. Scrolling itself stays native, and the same sections are a smooth 60 fps on the way back.
- **Not tested on real hardware.** No physical phone and no Safari/WebKit engine were available. iPhone-specific behaviour (Safari toolbars, the on-screen keyboard, safe areas, momentum feel) is **unverified**.

Every purchase-critical step worked by touch at every tested width: browse, filter, search, swipe the gallery, choose a size, open the size guide, add to cart, change quantity, enter a discount code and reach Shopify checkout. Six defects found during testing are fixed and re-verified (below). Both open choices are now decided: the sticky filter bar stays on phones, and the existing sticky add-to-cart bar is turned on for phones and tablets.

## How this was tested

| Method | What it means |
| --- | --- |
| **Browser emulation (Chromium)** | Google Chrome 155 driven headless through Playwright, using the store's real Shopify CLI development preview (`shopify theme dev`, real Liquid, catalog, cart and checkout). Emulation set `isMobile`, `hasTouch`, device pixel ratio and an Android Chrome user agent. Touch input used real touch events (`Input.dispatchTouchEvent`), which produce native compositor scrolling with fling momentum. |
| **CPU throttling** | Chrome DevTools CPU throttling: **4×** as a mid-range Android stand-in, **6×** as low-end. This approximates CPU speed only; it does not model GPU, thermal throttling or memory pressure. |
| **Performance traces** | Chrome traces of homepage load plus touch scrolling, attributed per script ([analysis](docs/evidence/mobile-2026-10-25/perf/trace-analysis-home-cpu4.txt)). |
| **Source inspection** | Motion policy, scroll stack, overlays/scroll lock, gestures and CSS were read directly. |
| **Real devices** | **None.** No physical iPhone or Android device, no WebKit engine (Playwright's WebKit build wasn't installed), no screen reader. |

The in-app browser pane was hidden, which pauses animation frames, so it was not used for frame measurements. The test harness is in [`scripts/mobile/`](scripts/mobile) (configure with `PLAYWRIGHT_MODULE`, `CHROME_PATH` and `BASE`). Run it only against a development preview.

### Viewports

| Profile | Size (CSS px) | DPR | Represents |
| --- | --- | --- | --- |
| android-small-320 | 320×640 | 2 | Small/older Android |
| android-360 | 360×780 | 3 | Common Android (low-end journey at 6× CPU) |
| iphone-se-375 | 375×667 | 2 | iPhone SE |
| iphone-15-393 | 393×852 | 3 | Standard iPhone (main journey at 4× CPU) |
| pro-max-430 | 430×932 | 3 | Pro Max |
| landscape-852 / 932 | 852×393, 932×430 | 3 | Phones held sideways |
| tablet-768 / 1024 | 768×1024, 1024×1366, 1024×768 | 2 | iPad portrait/landscape |
| desktop-1440 | 1440×900 | 1 | Desktop regression |

Pages swept at every viewport: home, all products, an empty collection, a standard product (Amaya), the longest title (Firenze Gurkha Flared Trouser), a sold-out product (Portofino), numeric footwear sizes (Varenzo), search results, cart and contact. That's 90 page/viewport combinations, plus a 40-page regression after the fixes and a 40-page final sweep.

## Results summary

| Check | Result |
| --- | --- |
| Horizontal overflow | **None** on any page at any width, 320–1440 px, portrait or landscape |
| Elements outside their containers | **None** |
| Broken images, h1 count | None broken; exactly one h1 per page |
| Content stuck invisible after scrolling | None. Two sweep flags were carousel intros mid-animation (confirmed visible once finished) |
| Reduced motion | All content visible, **0 running animations**, no overflow |
| JavaScript disabled | All content visible; full purchase path works (size link → Add to cart → `/cart`) |
| Smooth-scroll library on touch | **Not loaded** (`html.lenis` absent); `touch-action: auto`; native momentum |
| Scroll lock | Menu, search, filters, cart and size guide lock the page; swipes behind don't move it; exact position restored on close; scrolling works afterwards |
| Rotation mid-page | Phone → landscape → phone kept scroll position, no overflow, smooth scroll after |
| Gallery | One photo per horizontal swipe (1→2→3→2 of 5), page doesn't move; a vertical swipe on the photo scrolls the page |
| Inputs and iOS zoom | Every phone-reachable field ≥ 16 px (search 18 px, discount 16 px, contact form, filters, newsletter). Header search pill fixed for touch tablets (below) |
| Cart drawer | Fits the screen; Checkout visible without scrolling; quantity buttons 44×44; discount input 16 px |
| Checkout handoff | Reached Shopify checkout in the previous evaluation; not repeated here. No order placed |

### Measured performance (development preview, emulated phone)

| Metric | 393×852 @ 4× CPU | 360×780 @ 6× CPU |
| --- | --- | --- |
| LCP (hero video poster/video) | 2.4 s | 2.4 s |
| CLS | 0 | 0.0001 |
| Total blocking time during load | 1.18 s | higher; long tasks up to 856 ms |
| First scroll down the homepage: median / p95 frame | 16.7 ms / 49.9 ms (14 frames > 50 ms) | 33.3 ms / 50.1 ms (31 frames > 50 ms) |
| Scroll back up (sections already initialised) | 16.7 ms p50, **0** frames > 50 ms | 16.7 ms p50, **0** frames > 50 ms |
| Gallery swipe | 16.7 ms p95, 0 drops | 33.3 ms p95, 0 > 50 ms |
| Size tap → resolved price/stock | 0.69 s | 0.90 s |
| Slowest interaction (Event Timing, ≈ INP) | 168 ms | 216 ms |

These are **lab numbers on a development preview over a fast local network**: not field Core Web Vitals and not Lighthouse scores. Frame times measure the main thread. Native touch scrolling runs on the compositor and can stay smooth while main-thread animation frames stutter.

Where the main-thread time goes (homepage, 4× CPU, load plus scroll):

- **Shopify platform scripts** (web-pixel manager 281 ms, perf-kit 175 ms, trekkie 94 ms, account/shop chunks): ≈ 800 ms of long tasks. Not theme-controlled.
- **WebGL New Arrivals carousel:** 125–150 ms frames as it enters the viewport, about half of each being image decoding for textures.
- **GSAP:** ≈ 1 s of script across all scenes.
- **Layout and style:** ≈ 1 s each.
- The theme's own IntersectionObservers are small (5–8 targets per page). The large IntersectionObserver cost in the trace is Shopify's web-pixel manager (55 of 61 targets on the homepage) and native lazy-loading.

## Issues found and fixed

Each was reproduced in emulation, fixed in place, and re-verified in the browser. Regression checks at 375, 430, 768, 1024 and 1440 px showed no change to unaffected layouts.

### 1. Fit finder recommended a size from answers the shopper never gave (all devices)

- **Where:** product page, size row. Found at 393×852.
- **Steps:** open a product in a fresh browser → tap a size (M) without opening the fit finder.
- **Expected:** no recommendation until the shopper answers and applies the fit finder.
- **Actual:** "**Estimated size L**" appeared beside Size guide, with a recommendation dot over L, next to the shopper's own choice of M.
- **Cause:** `fit-finder.ts` re-marked the picker on every `nk:variant:changed` using the in-memory profile, which is the placeholder defaults (Male, 180 cm, 80 kg) until the shopper saves answers.
- **Fix:** variant changes only mark a size from a **saved** profile. Regression test added (fails on the old code, passes now).
- **Verified:** choosing M leaves the hint hidden with no dot. Completing the fit finder and pressing Select size L still selects and marks L.

### 2. Sticky filter toolbar never stuck (phones and desktop)

- **Where:** collection and search results. Found at 393×852, also confirmed at 1440.
- **Steps:** open All products → scroll down.
- **Expected:** "Sticky filter toolbar" is on by default, so Filter/Sort should stay reachable.
- **Actual:** the toolbar scrolled away. On a one-column phone grid (~11,000 px) shoppers had to return to the top to filter or sort.
- **Cause:** `position: sticky` was on the toolbar, whose parent (the facets form) is exactly as tall as the toolbar, so it had no room to stick.
- **Fix:** `facets.css` now sticks the form inside the full-height `<nk-facets>`. It sits under a visible header, moves to the top when the "reveal" header hides or the header doesn't stick, and the setting's off switch still works.
- **Verified** at 320, 393 and 1440: 0 px gap or overlap with the header in both states; Filter opens from the stuck bar; position is kept after closing.
- **Your decision:** on phones the bar is two rows (103 px), 12% of a 393 px screen with the header hidden and 20% with it shown (16–26% at 320 px). See [Decisions](#decisions-needed).

### 3. Landscape phone hero: headline filled the screen (852×393, 932×430)

- **Expected:** the hero message and a call to action visible together.
- **Actual:** the width-based type scale (`13vw` ≈ 110 px) filled the 393 px-tall screen; the buttons were far below.
- **Fix:** `hero.css` caps the heading at `15svh` only for `(orientation: landscape) and (max-height: 500px)`.
- **Verified:** 110 → 59 px at 852×393 (64 px at 932×430). Eyebrow, headline and subtitle fit and the buttons begin at the bottom edge. Portrait (56 px), iPad landscape (133 px) and desktop (184 px) are unchanged.

### 4. Empty collection showed a useless toolbar (all widths)

- **Steps:** open Leather Goods (0 products).
- **Actual:** an empty filter cell, grid toggle and "Sort by" above "This collection is empty".
- **Fix:** `main-collection.liquid` renders the toolbar only when the collection has products. A filtered-to-zero result keeps it, so filters can still be cleared (verified with `?filter.v.price.gte=999999`).

### 5. Small tap targets

| Control | Before | Fix | After |
| --- | --- | --- | --- |
| Announcement-bar links (moving marquee) | 14 px tall | Padding offset by negative margin; bar height unchanged | No longer under 24 px |
| Collection breadcrumb (10 px text) | 15 px tall | Same technique, in `collection-banner.liquid` | No longer under 24 px |
| No-JavaScript size links | 8–19 × 19 px | `.option-links` pill styling | 44×44 px |

Card titles (22 px) and homepage category titles (23 px) were left as they are: each card's image is also a link, so the effective target is large.

### 6. Header search pill zoomed the page on touch tablets

- **Where:** the 14 px header search field shown from 990 px, which includes iPad landscape. iOS/iPadOS Safari zooms any focused field under 16 px.
- **Fix:** 16 px on `(pointer: coarse)` only; mouse users keep 14 px. Phones were never affected; they use the 18 px search screen.

### Also fixed: empty-state alignment

On the cart page and the no-results search page, "Your cart is empty" / "No results" sat 16 px further right than the page heading. A page-only modifier aligns them (16/16 px); the cart drawer keeps its inner padding.

## Investigated and not a defect

- **"Overlays jump the page to the top":** first observed, then traced to the test tool scrolling the hidden header into view before tapping. With real-position taps, every overlay keeps and restores the scroll position.
- **"Search stays open after Escape":** the first Escape clears the search text (native `type=search` behaviour); a second closes it. The close button and Back close it directly.
- **Gallery swipe miss** in one throttled run: a harness swipe started too near the edge. Direct tests swipe exactly one photo at a time.
- **IntersectionObserver cost:** Shopify's web-pixel manager and native lazy-loading, not theme observers.

## Tried and reverted

**Off-thread texture decoding for the WebGL carousel.** I added `image.decode()` before uploading textures and re-traced at 4× CPU. The decode slices stayed inside the frames (64–85 ms), because WebGL re-decodes images for upload. The change had no measured benefit, so it was reverted exactly (the build reproduces the original chunk hash). See recommendation R3.

## Not verified (limitations)

- **Real devices:** no physical iPhone or Android. Momentum feel, the 120 Hz ProMotion display, real GPU/thermal behaviour and memory pressure are unmeasured.
- **Safari/WebKit:** not run. Unverified: Safari's collapsing toolbars against `100dvh` drawers, `@starting-style` drawer entrances, the iOS keyboard over the cart drawer's discount field, and video autoplay policies.
- **On-screen keyboard:** headless Chrome has no virtual keyboard, so keyboard-over-input behaviour in drawers is untested. The viewport meta has no `interactive-widget`, so on Android the keyboard overlays drawers rather than resizing them.
- **Safe areas:** the viewport meta lacks `viewport-fit=cover`, so every `env(safe-area-inset-*)` value resolves to 0 and Safari keeps content out of the notch and home-indicator areas itself. That's safe. Switching to `cover` would need left/right notch padding throughout and a real-iPhone check.
- **Screen readers:** VoiceOver/TalkBack not run. Accessible names and focus handling were reviewed in code and the DOM.
- **Theme Editor mobile preview:** not available (Admin not signed in).
- **Field data:** no real-user Core Web Vitals yet. Check Shopify's Web Performance report after launch.

### Test-environment incident

During testing, a `sed -i` edit inside `theme/` briefly created a temporary file that the existing Shopify dev server (port 9292, started by an earlier Codex session) tried to upload. That server now serves an "Upload Errors" page for every URL and needs a restart. All later testing used a fresh server on port 9393. No files outside the development theme were affected.

## Decisions needed

1. **Sticky filter bar on phones: decided, kept on phones.** Always-reachable Filter/Sort outweighs the space on long one-column grids. While shoppers scroll down, the header hides and the bar uses 12% of a 393 px screen; 20% only while the header is shown on scroll-up. Merchants can still turn it off (Collection › Sticky filter toolbar). A one-row compact version on phones (idea 8) remains a possible refinement.
2. **Sticky add-to-cart bar: decided, turned on for phones and tablets** (`templates/product.json` › main › `sticky_buy: "mobile"`; Theme Editor › Products › Default product › Product information › Sticky Add to cart bar). Verified at 393×852:
   - It is hidden at the top of the page and appears (83 px, 44 px-tall button) once the main button scrolls away. The page gets matching bottom padding, so nothing is covered.
   - With no size chosen it reads "Choose a Size", and tapping it brings the size selector into view without adding anything.
   - After choosing M it reads "M · Tk 1,900.00 · Add to cart", and tapping it added M ×1 and opened the cart drawer. The bar hides while the drawer is open.
   - It stays hidden at 1440 px.

   [Screenshot](docs/evidence/mobile-2026-10-25/fixes/sticky-buy-phone-size-chosen.png). Test cart emptied.

## Recommendations (need approval)

| # | Recommendation | Why | Cost/risk |
| --- | --- | --- | --- |
| R1 | ~~Enable the existing sticky add-to-cart on phones~~ **Done** (see Decisions) | Buying stays one tap away while reading details and photos | Setting only |
| R2 | Low-end motion tier | 6× CPU first scroll is ~30 fps while scenes initialise. Use the existing Motion › Phones "Simplified" mode automatically when `navigator.deviceMemory ≤ 4` or `hardwareConcurrency ≤ 4`, keeping all animations on capable phones | Small change; needs real-device validation |
| R3 | Lighter WebGL carousel textures on phones | The canvas renders at a capped 2× DPR (786 px wide), but each texture decodes the full 900×900 card image. A ~720 px source cuts decode work ~36%; `createImageBitmap` could move decoding off the main thread | Texture sharpness and Safari flip-Y support must be checked on real phones |
| R4 | Hide the measurement panel when a product has no measurements | Amaya shows a large dark panel saying only "Measurements … have not been provided" | Visual change; better fixed by entering real measurements |
| R5 | Fit finder starts without preselected answers | It opens with Male, 180 cm and 80 kg preselected and a live "L" estimate before any input | Behaviour change to an existing feature (already an open owner decision) |
| R6 | Readability of 9–10 px labels | Item counts, the card "Sizes" label and the sold-out badge are 9–10 px. 11 px minimum suggested | Typography change |
| R7 | Phone hero video | The phone hero is a 14.7 MB 720p file. A short phone-framed clip (Hero › Phone video) would cut data use sharply on Bangladeshi mobile networks | Content only |
| R8 | Tidy the menu content | Catalog contains both "Shop all Catalog" and a separate "Shop All" level | Shopify Admin › Navigation |
| R9 | Nested menu back label | "BACK: CATALOG" sits at the far right, away from its arrow | Small CSS change |

## Creative mobile ideas (for discussion, none implemented)

1. **Swipe-to-dismiss on every sheet.** The size guide already supports dragging down to close; extending that to the cart and filter drawers would feel native on phones.
2. **Thumb-zone sticky bar.** Pair R1 with the selected size inside the bar ("M · Tk 1,900 · Add"), so the choice stays visible while scrolling photos.
3. **Gallery progress dots with an edge hint.** A sliver of the next photo, so shoppers see the gallery swipes before they try.
4. **Shared-element transition from card to product page.** A restrained View Transition from the card photo to the product gallery, with a reduced-motion fallback. It would feel continuous instead of a page jump.
5. **Quick size sheet from cards.** A long-press or a "+" on a card opens a bottom sheet with sizes, using the existing quick-add, so adding from a grid doesn't need a page visit.
6. **Recently viewed rail** in the cart drawer or empty-cart page, useful when comparing several shirts on a phone.
7. **Haptic confirmation on add-to-cart** (`navigator.vibrate(10)` on Android), as a subtle physical acknowledgement alongside the existing visual one.
8. **Collapsible two-row filter bar** that shrinks to one compact "Filter · Sort" row once stuck (also resolves decision 1).

## Files changed in this pass

`src/components/fit-finder/fit-finder.ts`, `tests/unit/fit-finder.test.ts`, `src/styles/components/facets.css`, `src/styles/components/hero.css`, `src/styles/components/header.css`, `src/styles/components/cart.css`, `src/styles/product.css`, `src/components/search-pill/search-pill.css`, `theme/sections/main-collection.liquid`, `theme/sections/main-cart.liquid`, `theme/sections/search.liquid`, `theme/sections/collection-banner.liquid`, `theme/snippets/product-option-links.liquid`, `scripts/mobile/*`, plus rebuilt `theme/assets`.

Final gates: TypeScript passed; **228** unit tests; 6 contract tests; JSON valid; customization reference current; Shopify Theme Check, strictest level, **152 files, no offenses**; `shopify-liquid` skill validator passed on every changed Liquid file. Evidence is in [docs/evidence/mobile-2026-10-25/](docs/evidence/mobile-2026-10-25). Nothing was published or committed, and test carts were emptied.
