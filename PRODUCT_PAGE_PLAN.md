# Product page completion — 22 October 2026

## Contract
Preserve existing design, markup structure, CSS, component order, typography, spacing, colors,
hover/scroll effects and responsive layout. Extend existing components only. No dependencies,
replacement gallery, new checkout UI or automatically inserted information blocks.

## Audit
Reviewed main-product Liquid + product JSON, gallery/card/price/sibling/option/measurement snippets,
product/quick-add/size-guide controllers, cart service/renderer/drawer/items, product CSS, global
settings, motion lifecycle, existing product regression tests and prior product audit docs.

Already implemented: product title/price/compare-at and sale state, actual description/composition/
fit/origin/care metafields, optional rich text/page accordions and app/custom Liquid blocks,
Shopify option_values section resolution, explicit size choice, swatches, sibling references,
inventory thresholds, optional quantity rules, add/cart reconciliation, product recommendations,
image/video/external-video/model rendering, thumbnail/keyboard/zoom navigation, measurement hover
preview, inch/cm conversion and selected chart-row highlighting. Keep these implementations.

Gaps and defects to address:
- Product custom.size_chart metaobjects and custom.measurements JSON work, but collection chart
  metafields and a reusable global default are missing. Five existing CSV assignment rules must
  remain compatible and must not gain guessed measurements.
- Multiple collections need predictable priority independent of the route or membership order.
- Size guide and inline panel resolve data separately; extend them through one shared assignment
  resolver so a guide and preview cannot choose different collection charts.
- Optional chart/highlight/preview/unit controls are missing; new defaults must preserve behavior.
- Variant picker structural replacement can reset explicit choices when the available value set
  changes. Check and repair only if reproduced by a regression fixture.
- Gallery reacts to intermediate variant states; avoid moving to old media while resolving.
- Product section settings are empty: expose existing breadcrumb and title-motion visibility,
  optional chart controls, optional SKU/care/accordion behavior without adding visible blocks.

## Size chart contract
One existing `size_chart` metaobject type: title, measurement_basis, unit (in/cm), table (JSON
columns/rows), optional notes and fallback rich text. No invented garment measurements.
Priority: product metaobject/JSON; explicit legacy product CSV rule; collection metafield chart
(lowest integer custom.size_chart_priority, tie: collection handle alphabetically); legacy
collection CSV rule; reusable global default; existing template CSV/page fallback.
An optional product custom.size_chart_collection collection reference can choose one of its own
collections explicitly, ahead of automatic collection ordering. If invalid/unassigned, use ordering.
Global default is selected by metaobject handle in Theme settings so installing the theme does not
produce an invalid native metaobject-picker setting before the custom definition exists.
Assignments/measurements live in Shopify Admin; display/behavior choices live in Theme Editor.

## Chunks
1. **Audit/visual baseline (in progress).** Record current desktop/phone page and run baseline
   tests. Confirm assignment schema with current Shopify documentation. No changes to catalog data.
2. **Commerce reliability.** Reproduce choice-loss/media-state defects with focused tests, make
   minimal controller fixes, run relevant tests/typecheck before proceeding.
3. **Chart assignments.** Shared Liquid resolver, product/collection/global hierarchy, preserve
   legacy CSV/page paths. Add deterministic Liquid rendering tests with realistic synthetic chart
   objects (test fixtures only). Validate schemas/Liquid/build; update size chart docs immediately.
4. **Existing-component settings.** Default-preserving chart visibility/highlight/unit/preview,
   breadcrumb/title-motion/SKU/care and accordion-open controls. No new CSS or default layout change.
   Document each setting and verify behavior, including quick-add scoping.
5. **Final verification.** TypeScript/unit/JSON/Theme Check/Vite, desktop and phone product page,
   variants/media/stock, chart conversion/highlight, add/cart feedback, comparison with baseline.
   Report what was verified locally versus what requires merchant Admin setup or device fixtures.

## Risks and boundaries
Do not create fake store measurements or guess shipping/care information. No Shopify Admin
connector is present; catalog definitions/entries require documented merchant setup unless a
supported authorized Admin session becomes available. Render/test schema logic locally and keep
empty/unassigned storefront behavior unchanged. Shopify Theme Check cannot prove actual Admin
definitions exist. Do not publish production theme changes.

## Progress
- 23 October follow-up: supplied segmented-control code and screenshot authorize a focused size
  selector/panel update: equal slots, short animated underline, centered size heading and evenly
  spaced measurements. Adapt to existing native radios/motion policy; no React/Motion dependency.
  Keep the rest of the product page intact and never insert example garment measurements.
- Immediate carousel repair requested: first fix startup/navigation latency, then show the same
  assigned size measurements directly below carousel sizes. Audit found the preview region is
  outside the WebGL caption, detached from the selected sizes. Move it into the purchase area,
  share panel styles/data, and verify selection, preview, units, product changes and autoplay hold.
  Complete these as separate tested chunks before final product verification.
- Plan recorded before implementation; current working tree includes earlier scroll/carousel work.
  Preserve that work. Existing product styles and product template block order are the baseline.
- Chunk 1 complete: baseline screenshots saved at 1280x720 and 390x844; desktop geometry recorded
  for gallery, info, title, size row and buy button. Existing 87-test suite was green before this task.
- Chunk 2: regression fixture confirmed gallery reacted four times to intermediate/unchanged
  variant states. Minimal fix ignores unresolved state and unchanged media. Structural-picker
  choice fixture already passes: `replaceRegions` retains the element/chosen state, so no picker
  rewrite or choice-transfer machinery is needed. Keep the regression, omit the speculative fix.
- Chunk 2 complete: TypeScript and 16 focused product tests pass.
- Chunk 3 complete: shared Liquid assignment resolver connected to both existing chart surfaces;
  collection reference/priority and global handle fallback implemented. Liquid fixtures pass for
  product/JSON/CSV precedence, explicit membership, numeric priorities, alphabetical ties, empty
  defaults, units and instructions-only charts. Validation renderer installed in the OS temp
  directory only; package.json/lockfile/runtime dependencies unchanged. Theme Check: 77 files,
  no offenses after documenting snippet parameters. Catalog definitions and measurements not created.
- User clarified palette: preserve the storefront's existing brown and warm white. In chunk 4,
  replace only the measurement panel's hardcoded black/near-white with existing accent/on-accent
  scheme tokens. Keep its dimensions, type, controls, layout and motion intact.
- Chunk 4 complete: existing-component settings wired and documented, defaults retain existing
  behavior. The subsequent screenshot request explicitly supersedes the selector/panel geometry
  restriction only: bordered equal slots, short elastic underline, centered translated full-size
  heading, measured values in columns, soft shadow and brown/warm-white shared scheme. Adapted
  supplied React/Motion concept to native radios/WAAPI; no dependency added and vertical touch
  scrolling remains native. Shared panel stylesheet loaded globally for carousel reuse.
- Carousel timing follow-up implemented: entrance reduced to 0.7–1 seconds, image wait bounded to
  600ms instead of waiting up to 3.5s for every image, faster critically damped navigation driven
  by existing speed control, shorter caption fade. Manual input cancels even a not-yet-started
  entrance so loading cannot reset navigation. Time-on-product/size-choice autoplay hold retained.
- Carousel measurement follow-up implemented: panel moved directly below sizes; extra stage space
  prevents resizing the photographic scene when details expand. Common chart assignment and panel
  styles/labels shared. Product-template-only legacy charts load on first committed size selection
  with per-product caching, connection cancellation and stale-product checks. Selection persists
  on repeated click; keyboard arrows skip unavailable sizes; touch hover does not change preview.
- Final local verification in progress: focused carousel behavior/frame-loop and Liquid fixtures
  pass. Browser preview acquisition was rejected by the browser URL security check after the
  previous preview became unreachable; no workaround attempted. Final desktop/phone screenshots,
  real Theme Editor controls and live-cart end-to-end checks remain unverified in this continuation.
  Earlier baseline gallery/size/mobile observations do not certify the latest CSS changes.


## Files and final local checks — 23 October

- Commerce repair: src/components/product/gallery.ts, product-gallery-state.test.ts and
  product-regressions.test.ts.
- Chart data/settings: theme/snippets/{size-chart-assignment,measurement-chart-rule,size-chart,
  product-measurements,carousel-measurements,size-display-label}.liquid; main-product and
  featured-collection sections; config/settings_schema.json; locales/en.default.json;
  src/components/{product/variant-picker,size-guide/size-guide,carousel/carousel,carousel/flex-carousel}.ts.
- Presentation: src/styles/product.css, shared src/styles/components/measurement-panel.css,
  global.css import and src/components/carousel/carousel.css. No product JSON layout changes.
- Verification: scripts/verify-size-charts.py, tests/unit/carousel-enhancement.test.ts and
  flex-carousel-response.test.ts; documentation CUSTOMIZATION.md and docs/SIZE-CHART-ADMIN.md.
- Owned Vite assets, nk-assets.liquid and assets.owned.json rebuilt through the existing pipeline.
- TypeScript, full unit suite (102 tests / 21 files), production Vite build/asset sync and strict theme JSON pass.
  Actual Liquid assignment/display fixtures pass, including collection priority, shared panel
  data, authored units, translated size labels and carousel placement. Theme Check: 81 files,
  zero offenses in the final local snapshot. No runtime dependencies changed.
- Outstanding: create/assign genuine Admin chart data using docs/SIZE-CHART-ADMIN.md; visually
  compare latest product/carousel panel at desktop/phone widths; native editor save/reload/reorder;
  real cart Add/update/remove and third-party app/high-variant checks. Earlier cart-controller
  regression tests pass but are not a live-cart test. No production publication performed.

## Size-detail stability repair — 23 October
Inspect preview enter/leave events, pending carousel movement and caption resize ordering. Reproduce transient hide and in-flight product changes; add a short cancellable leave grace period, keep the active product stable during size interaction, and decouple scene geometry from measurement-height updates. Preserve current appearance, chart data and native scroll. Validate focused regressions, TypeScript, build and theme checks.

## Superseding carousel direction — 23 October
The latest user request replaces carousel size/purchase controls with the newly supplied FlexCarousel. Keep the supplied curved liquid lens, natural image proportions, entrances, drag/inertia and minimal captions; add center highlight/autoplay and direct product navigation. No size UI, quick add or focus-popup click step in the storefront carousel. Product-page size features remain intact. Port within existing OGL/custom-element architecture; keep native mobile/reduced-motion fallback and pause control. Implement browse-only integration first, then reference lens, with tests/build at each stage. The unfinished hover-flicker repair is superseded, not reported as completed.


### Latest carousel implementation checkpoint
- Current featured-collection markup is browse-only: no size selector, measurement region, Add to
  cart or product variant JSON. Product-page charts and prior custom-markup compatibility remain.
- Ported the supplied liquid lens shader and render-target pass into existing OGL modules. Kept
  natural image proportions, drag/flick inertia and rolling captions; added brown center emphasis
  and first-click/Enter product navigation instead of the zoom/focus step. No React dependency.
- Follow-up speed direction: 0.4–0.55s entrances, 320-based responsive spring, quicker counter/
  caption/image reveal, 900ms manual idle grace and default 1.5s autoplay interval. Pause/hover/
  focus/drag still work. Native interval range supports the same 1s minimum.
- Follow-up screenshot direction: desktop stage fills the actual viewport excluding scrollbar;
  center geometry fits roughly four median-proportioned products into the flatter 76% run.
  Wider lens center and stronger edge curl, shared inverse hit mapping so bent cards remain
  clickable. New Theme Editor Products before the curve range 3–6, default 4.
- Scoped motion and breakpoint listeners tear down/rebuild safely. Below 990px, simple/reduced
  motion and graphics failures retain native links/rail; no global page-wheel capture.
- New/affected runtime files: flex-lens.ts, flex-layout.ts, flex-shaders.ts, flex-carousel.ts,
  carousel.ts and carousel.css; featured-collection.liquid schema/markup. Unit fixtures cover
  first-click/keyboard navigation, autoplay, phone fallback, central composition and lens mapping.
- Final real-browser comparison remains unverified in this continuation. The user-provided
  screenshot confirms the earlier lens direction, not the final four-product composition.

Final local checks for the curved/fast/four-product follow-up: TypeScript pass; 126 tests across 27 files pass in the shared tree; Vite build and 28 owned assets synchronized; JSON/schema-reference and Liquid fixtures pass. Theme Check has no errors and two intentional orphan-snippet warnings for retained legacy carousel purchase snippets. Preview server listens on 127.0.0.1:9292. Latest desktop composition still requires visual confirmation in the running preview.

### Continuous-flow correction — latest user feedback
Replace the browse-only editorial move/settle/dwell cycle with continuous, eased velocity. Merely hovering the photographic stage must not stall it. Preserve explicit pause, drag/keyboard interaction holds, direct links, cyclic wrap and native/reduced-motion fallback. Highlight follows the nearest moving product; interval becomes travel pace, not a stopped countdown. Add frame-loop tests for sustained movement, pointer hover, pause/resume and manual navigation before rebuilding.


### Continuous flow finalized — 23 October
Latest feedback replaces stopped center dwell with continuous editorial travel. Velocity eases in,
passes products without snapping/waiting, and uses autoplay pace plus speed as travel controls.
Passive mouse hover no longer pauses the lens. Explicit pause, dragging and keyboard intent still
hold it; manual interaction resumes after a short grace and settling. Pointer/keyboard intent is
tracked even when focus remains on the same stage, avoiding stale focus holds; explicit Play also
resumes from a keyboard-focused button. Underline follows the nearest product with no countdown.
Curved lens, extended center and direct links are unchanged. Native rails retain their own hover
behavior. Frame-loop tests cover repeated movement during hover, persistent pause/resume, drag
release and keyboard-to-pointer switching. Final focused checks: 34 tests / 4 files, TypeScript,
Vite build/28 owned assets, strict JSON and customization-reference check pass. Earlier full suite:
130 tests / 27 files passed; latest input-intent regression is included in the focused result.
Theme Check last completed with zero errors and two retained legacy-snippet warnings. Live visual
comparison remains a user-preview check; no new visual verification is claimed.

### Sold-out visibility — 23 October
Existing Shopify product.available already drives card--sold-out, a native caption label/veil and WebGL grayscale. The curved canvas does not draw the native image veil. Add a small reusable translated brown/warm-white availability texture inside the card shader so every visible sold-out product is labeled through the lens, plus availability in the active screen-reader status. Keep product links, continuous motion, existing product-page/variant behavior and native card labels unchanged. Validate availability rendering/state and rebuild assets.

Sold-out visibility implemented: one translated 512x96 badge texture shared per carousel, composited after grayscale and before the liquid lens so all visible sold-out photos carry a readable scheme-colored label. Existing native caption/veil and links are preserved; active accessibility status includes availability and clears on available products. Tests cover localized text/palette, unavailable canvas fallback and stock-state transitions. TypeScript, 37 focused tests / 5 files, Vite build/owned assets, JSON and schema-reference pass. Theme Check: no errors; two existing legacy orphan-snippet warnings. Live GPU/text orientation and final visual appearance remain unverified in this continuation.
