# Quality gates, performance, and release validation

Status: planned acceptance criteria, not achieved results. Reference-store observations are not benchmark measurements.

## Release principle

Visual quality, correct commerce, accessibility, phone usability, and editor stability are separate gates. A high Lighthouse score cannot compensate for the wrong variant entering the cart. A good desktop screenshot cannot prove mobile usability.

## Supported test matrix

Record exact browser and OS versions when testing. Initial support target is current and previous major iOS Safari, current Android Chrome on a midrange physical device, and current desktop Chrome, Safari, Firefox, and Edge. Adjust the final supported matrix using actual store traffic and feature requirements.

| Environment | What it proves | What it does not prove |
|---|---|---|
| 320, 360, 390, 430px automated viewports | Layout, overflow, major responsive states | Real touch behavior or phone GPU performance |
| 768, 1024, 1280, 1440px viewports | Tablet/desktop composition and breakpoint transitions | Every possible monitor/font configuration |
| Physical iPhone | Safari keyboard, dynamic browser chrome, safe areas, touch, VoiceOver | All Android behavior |
| Physical midrange Android | Touch, Chrome, slower CPU, TalkBack sampling | Every manufacturer browser |
| Shopify editor | Section lifecycle, saved configuration, block selection | Identical standalone storefront speed |
| Unpublished theme preview | Real Liquid/data/CDN integration | Production traffic metrics |

Run portrait and landscape, 200% zoom, larger text, reduced motion, keyboard navigation, slow network, and failed-request scenarios. Test the narrow editor iframe separately from a standalone phone browser.

## Fixture catalog

Use owned or licensed media and a test catalog that intentionally stresses the theme:

- Single default variant and multiple sizes/colors.
- An unavailable option combination; a fully sold-out product; stock changing during interaction.
- More than 250 variants to catch incomplete variant serialization assumptions.
- Different prices across variants, sale prices, long titles, and optional unit-price data where applicable.
- One-image product, many-image product, mixed portrait/landscape media, and video.
- Product with missing optional fit/size data and one with complete structured data.
- Same variant on separate cart lines because of properties/selling plans where supported.
- Empty collection, one-product collection, large paginated collection, and no-result filters.
- Multiple currencies/locales if enabled for the store; do not test by manually replacing a currency symbol.
- Representative review/app block and a store with no optional apps.

## Critical end-to-end journeys

| ID | Journey | Pass condition |
|---|---|---|
| Q-01 | Home → menu → collection → product | Correct destinations, no blocked controls |
| Q-02 | Search → keyboard select → product | Accessible results, correct focus and navigation |
| Q-03 | Choose size/color → add | Exact selected variant and quantity reflected in cart |
| Q-04 | Change variant quickly under slow network | Last user choice wins; stale price/media never overwrite it |
| Q-05 | Repeated add click | Pending state prevents unintended duplicate submission |
| Q-06 | Rapid quantity changes → remove → last line removed | Authoritative totals and coherent empty state |
| Q-07 | Failed cart request/fragment response | Honest error, recovery path, no false success |
| Q-08 | Filter + sort → product → Back | URL, filters, sort, and usable browsing position restored |
| Q-09 | Open menu → search → cart | One active overlay; background scroll/focus restored |
| Q-10 | Size guide → close → purchase | Original selection/focus preserved |
| Q-11 | JavaScript unavailable | Core links, product-selection fallback, forms, and cart page remain usable |
| Q-12 | Checkout handoff from test cart | Correct cart reaches Shopify checkout; no real payment required |
| Q-13 | Duplicate product/hero sections in editor | No shared state or duplicate IDs |
| Q-14 | Second preset/store | No original brand content or domain dependencies |

Commerce mutations are tested in the authorized development store, not on the reference stores. Do not place real orders to validate a theme.

## Performance budgets

These are proposed project budgets, to validate during the first complete shopping slice. They are not promises about a live store with unknown apps and media.

| Metric | Initial project target | Measurement rule |
|---|---|---|
| Initial theme-owned JS | At most 60 KB gzip on home/collection; 90 KB on product | Include shared modules loaded at startup; report optional interactions separately |
| Initial theme-owned CSS | At most 50 KB gzip per core page | Count all CSS fetched before interaction |
| Mobile lab performance | Median Lighthouse performance at least 90 on home, collection, product | Three comparable production-build runs with real content; same throttling/device profile |
| Lab accessibility | At least 95 with no known serious/critical automated findings | Manual tests still required |
| Real-user LCP | At most 2.5 seconds at the 75th percentile | Postlaunch field evidence when sufficient traffic exists |
| Real-user INP | At most 200 milliseconds at the 75th percentile | Field evidence; do not label a Lighthouse proxy as INP |
| Real-user CLS | At most 0.1 at the 75th percentile | Field evidence plus lab layout-shift inspection |

The field thresholds correspond to [Core Web Vitals](https://web.dev/articles/vitals). Budget exceptions require a recorded reason, measured effect, and an alternative considered. Establish the baseline before adding decorative media or app scripts.

Measure theme code separately from platform and app contributions, and also report total page experience. Excluding third-party costs from the theme-owned budget must not hide them from the merchant.

Prioritize the visible hero/poster and product image; defer offscreen imagery. Supply responsive sizes and intrinsic dimensions. Do not load every product-card gallery image or every reel on initial render. Never make meaningful product content wait for an entrance animation.

Shopify provides [performance guidance](https://shopify.dev/docs/storefronts/themes/best-practices/performance) and [benchmark testing guidance](https://shopify.dev/docs/storefronts/themes/best-practices/performance/testing-for-performance). Our internal budget is deliberately separate from marketplace submission minimums.

## Accessibility gate

Aim for WCAG 2.2 AA in the implemented experience; do not advertise compliance based only on an automated score. Follow [Shopify's accessibility guidance](https://shopify.dev/docs/storefronts/themes/best-practices/accessibility) and verify actual behavior.

- All shopping controls work by keyboard with visible focus.
- Navigation, filters, variant groups, dialogs, and errors have meaningful names and relationships.
- Focus cannot disappear into removed DOM; closing an overlay restores it sensibly.
- Dynamic cart/search status is announced without excessive repetition.
- Color swatches include readable names; unavailable values are distinguishable without color alone.
- Hero text contrast survives the actual background image, not just a blank design canvas.
- Zoom/reflow does not obscure buying controls; sticky UI does not cover focused fields.
- Motion is reduced when requested; moving promotional content can be paused.
- Informative images have useful alt text; decorative duplicates are hidden appropriately.

## Automation scope

Use tests for meaningful failure-prone behavior: request ordering, variant selection, cart line identity, overlay cleanup, history navigation, and editor lifecycle. Avoid superficial tests that only restate class names or markup implementation.

CI should run type checking, Theme Check, schema/locale validation, the production build, package-content checks, and selected browser journeys against an authorized preview. Visual snapshots cover header states, product options, drawers, and responsive grids with deterministic fixtures. Theme-editor operations also require a real editor session and a manual result record where automation is unreliable.

## Defect severity and release rule

| Severity | Examples | Release rule |
|---|---|---|
| Blocking | Wrong cart item/price, inaccessible checkout handoff, lost merchant configuration | Must fix |
| Major | Mobile menu unusable, editor section breaks after reorder, focus trapped incorrectly | Must fix |
| Moderate | Layout overflow on a supported viewport, missing error recovery, inconsistent state | Fix or explicitly scope out the feature before release |
| Minor | Small spacing inconsistency without task impact | Track with owner and target version |

Do not average away a failing core journey because other pages pass.

## Release evidence bundle

For each candidate: commit/build ID, dependency lockfile, theme version, test-store/theme identifiers, browser/device versions, fixture version, journey results, editor results, screenshots, performance reports, outstanding defects, and known app limitations. Keep credentials outside the bundle.

Install the ZIP on a clean test theme, verify both presets, verify an update over a customized previous release, then prepare the merchant preview and rollback instructions. Publishing is a distinct deployment action; the research/planning task does not publish anything.

## After launch

Compare field performance and shopping errors against the lab baseline. Investigate by page type, device, media, and integration. Recheck after major campaigns, app changes, or theme upgrades. This is a future maintenance process, not a scheduled monitor created by this plan.
