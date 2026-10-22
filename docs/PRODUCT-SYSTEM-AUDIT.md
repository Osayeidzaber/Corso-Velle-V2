# Product system completion audit — 22 October 2026

The product system now uses real Shopify selection and cart responses, a large single-image gallery, and uncropped product photography. Cards show their size actions below the image and product information on both pointer and touch devices. There is no size tray covering photography. Phone grids default to one large card per row, with an optional two-column layout; desktop defaults to three. Existing saved shopper layout choices remain available.

## What was already present

| System | Finding before this repair |
| --- | --- |
| Liquid + Vite + Tailwind + TypeScript | Real implementation and two connected entrypoints; no framework migration needed. |
| Variant picker | Already used Shopify option-value IDs and Section Rendering with latest-request sequencing; explicit size selection existed. |
| Product form and cart | Real forms, AJAX service, mutation queue, line-key updates and a cart page already existed. |
| Gallery and sizing | Thumbnail/zoom controllers, animated size underline, dark measurement panel, metaobject/JSON/CSV rendering and unit switching existed. |
| Collections and search | Shopify filters/sorting, pagination links, predictive search and reusable product cards existed. |
| Motion | GSAP and component lifecycle helpers existed, but asynchronous setup/cleanup and presentation had gaps. |

Files existing did not establish completion: original tests used a mobile card toggle absent from the actual Liquid, tested a button-based swatch preview that left prices/quick-add IDs stale, and did not cover several purchase failure states.

## Repairs and completed connections

- Product options: updates now include quantity rules and badges as well as price, picker, inventory and buy controls. Failed/resolving/sold-out/unavailable states disable purchase and accelerated checkout. Shoe size follows the default explicit Size policy. Combined-listing option URLs navigate to Shopify's associated product. Resolved URLs discard stale `option_values`; nonexistent combinations retain a meaningful selection URL.
- Purchase controls: one Add to cart button; accelerated checkout and the duplicate sticky purchase bar were removed. Size must be explicitly chosen on each enhanced page visit, including variant URLs. Hover/focus previews measurements without selecting a purchasable variant; tapping selects on touch devices. Products with only a default variant can purchase normally.
- Product submission: validates number-input rules and integer quantity, retains the current variant guard, and uses minimum quantity when the quantity selector is hidden. App markup outside the named update regions survives variant changes.
- Cards: removed arbitrary first-available color selection for a size. Direct size add is limited to unambiguous one-option products; other products open the real product section in a purchase drawer. Its IDs, form associations and radio names are isolated, its URL never overwrites the collection URL, and size guidance stays inline in that drawer. Color swatches use Shopify option-value links instead of an image-only state change.
- Images: full-size uncropped fitting is the default, category-image padding/hover cropping was removed, card spacing tightened and phone imagery enlarged. The main gallery now shows one large image at every breakpoint with thumbnails and previous/next controls. Missing media keeps a stable placeholder.
- Video: card transitions reveal only after `play()` succeeds, keep the photograph visible while buffering, and use a full bottom-to-top curtain swipe matching the second-image hover, reversing on leave. Keyboard focus also works. Playback pauses on leave, hidden page, reduced-motion changes and card removal. Product gallery videos pause when offscreen. External video/model tags render their actual media rather than pretending they are photographs; those media types remain unverified on the store catalog.
- Gallery zoom: uses the shared overlay service, scroll lock, focus return, image-only lightbox navigation and animation cleanup. Closing zoom synchronizes the main track with the viewed image.
- Measurements: removed the sample chart and generic size advice from template/schema defaults. Empty chart metaobjects no longer produce empty guide controls. Nonnumeric ranges are retained with source units instead of being partially parsed into invented numbers. The animated underline and dark panel remain. Charts still come only from merchant metafields/metaobjects or deliberately entered, verified template CSV.
- Inventory: removed the positive stock message at the user's request. Existing sold-out states remain; low-stock messages require tracked inventory and the configured threshold, including zero meaning off. Removed an incomplete/truncated variant-list availability summary.
- Product content: care/composition render actual metafield objects correctly. Sibling links use explicit product references; same-title products are no longer guessed to be color siblings. Product-level discount percentages are omitted when aggregate prices cannot establish a truthful comparison.
- Sorting: replaced the enhanced native popup with a styled disclosure/button menu, retaining the real select for no-JavaScript use. It supports keyboard movement, Escape, outside dismissal and focus restoration. The narrow-screen toolbar separates sorting from filter/layout buttons to prevent overlap.
- Responsive text/motion: card headings have explicit readable line height, long words can wrap, text masks have ascender/descender space and stop clipping after the reveal. Native smooth anchor/gallery scrolling respects reduced motion; touch scrolling remains native.
- Recommendations: added an optional merchant-selected fallback collection when Shopify has no recommendations.
- Shared cart/search/core fixes were coordinated with the separate JavaScript audit chat and preserved. They include fragment recovery races, cart identity/quantity validation, visible recovery/notifications, unique search IDs, stale search cancellation and lifecycle/motion cleanup. See `STOREFRONT-ARCHITECTURE.md`.

## Data contract

`custom.size_chart` is a metaobject reference. Its `table` JSON field contains `columns: [{key,label}]` and `rows: [{size,values:{columnKey:number}}]`; `unit` is `in` or `cm`. Optional fields include measurement basis, title, notes and fallback rich text. Alternatively, `custom.measurements` is JSON with that structure and a `unit` property. Measurements should describe the actual garment/body basis supplied by the merchant. No values are inferred from a size name or product category.

Use `custom.color_siblings` as a list of product references, and `custom.color_name` as an optional label. Composition/care come from `custom.fabric`/`custom.materials` and `custom.care`/`custom.care_instructions`. No metafield definitions or catalog records were created by this task. Existing merchant-verified CSV data should be retained; products lacking approved charts should leave the CSV empty.

## Validation and evidence

- TypeScript, Vite production build/owned-asset sync and strict theme JSON validation pass.
- Vitest: 59 tests in 12 files pass. New product/sort regressions cover purchase failure states, stale variants, quantity-rule replacement, app-node preservation, atomic fragments, isolated quick-add form IDs, explicit Shoe size, strict range conversion, direct-add duplicate prevention, deferred video reveal, sort/filter parameters and keyboard dismissal.
- Shopify Theme Check: 72 files, no offenses.
- Real Shopify development preview ran at `http://127.0.0.1:9292`, using the authenticated development theme, not a static Vite mock.
- Browser: available M and sold-out L on Andre Linen Shirt resolve correctly; sold-out disables add and available M restores purchase. A real M add updated the cart/header count and returned the exact selected size. No order/payment was placed.
- Browser: quick-add drawer loaded Astorio Chestnut Mule from its actual product section. Required shoe sizing is covered by the regression suite; other multi-option combinations are unit fixtures, not a live catalog certification.
- Browser: Velle Members Club Tee variant link opens incomplete with no checked size and exactly one purchase button; an attempted add prompts for size, selecting L resolves availability. This product has no saved measurement panel, so exact measurements remain a merchant data requirement.
- Browser: zoom opens/closes with scroll lock, next image updates its counter, and large gallery photography was inspected. Products without charts omit measurement UI.
- Browser: collection cards were inspected at 320, 390 and 1440px, including one/two-column phone and desktop density controls. Product layout was checked at 390, 768 and 1440px. Narrow-screen overflow found in sorting was repaired. Sort selection updated actual Shopify results and its displayed selection.
- The coordinated JavaScript audit also tested real availability filtering (34 to 19 results), sorting URL updates and predictive search for linen. Its report states the exact evidence boundary.
- Screenshots: `evidence/product-cards-phone.png`, `evidence/sort-menu-phone.png`, `evidence/product-desktop.png`.

## Genuine remaining verification

Physical iOS/Android touch, OS keyboard/safe areas, screen readers, full Theme Editor duplication/reordering, real 250+ variant products, complete multi-option/color inventory fixtures, live approved measurement metaobjects, selling-plan/file-property apps, additional currencies, external video/3D, checkout handoff still require dedicated store/device fixtures. Missing combinations, request races and measurement conversions are tested with controlled unit responses; they are not described as live-store proofs. No fake catalog data was added to make those checks appear complete.

This is a repaired, connected implementation with passing checks and recorded browser evidence, not a claim that every device or store configuration has been certified. Changes are in the shared working tree and development preview; the production theme was not published. Concurrent carousel/footer work belongs to the separate chat and is outside this product audit.

The Windows Nodist npm shim could not run the aggregate check command reliably. Each underlying check was run with the installed Node 22 executable and npm CLI directly.

Follow-up video check: real Andre Linen Shirt card playback reached readyState 4 and advanced frames; its reveal was observed mid-transition at a 67.6% clip, then playback paused and the playing state cleared on focus exit. Production build passed after the swipe CSS update. Evidence: `evidence/card-video-swipe.png`.

Homepage category follow-up: Git 9e8375b had a lead-plus-four bento; 9fbc4c0 replaced it with five equal cards. Restored the asymmetric bento with contained merchant imagery, tonal surfaces, live counts, italic headings, hover arrows and existing GSAP stagger. Inspected at 1440px and 390px; all five images load, phone has no horizontal overflow. Theme Check: 72 files, no offenses. Phone evidence: evidence/wardrobe-bento-phone.png.

Homepage typography follow-up: reproduced Shackets splitting its final s into a second line (74px heading at390px). Root cause was word wrappers allowing internal wrapping under intrinsic flex sizing. Shared nk-text CSS now keeps each animated word intact and allows normal breaks between words. Featured title groups have minimum-width constraints and nonshrinking counts. Browser checked all homepage H1/H2 at320,390,768,1440px; Shackets is one line (37px phone/66px desktop), no page horizontal overflow, no failed loaded main images or console errors. Shirts tab selection showed the correct panel/products. Production build and Theme Check passed. Evidence: evidence/home-featured-heading-phone.png and evidence/home-featured-heading-desktop.png.

Hover and measurement settings follow-up: five global chart rules in Theme settings → Size charts map verified CSV measurements to collection lists or product lists. Product metafields take priority, then explicit product rules, then collection rules, then template fallback. The same resolved chart feeds the dark panel and full guide, including quick-add. Numeric chart data remains empty until supplied by the merchant. See SIZE-CHART-SETTINGS.md. Missing rows now show an honest size-specific message. Hover/focus is retained through section updates and resets when leaving; changing size clears an earlier preview. Video attempts are versioned so an old rejected play promise cannot cancel a fresh hover, and video cards retain their alternate photo as immediate/failure fallback.

Follow-up validation: TypeScript,62 Vitest tests/12files,production build,JSON and Theme Check (73 files,no offenses) pass. Live Bellagio L preview remains visible and actual card video plays (readyState4); collection card alternate image is present. Numeric global assignments have not been saved or live-certified without approved measurements. Screenshot: evidence/bellagio-size-panel.png.
