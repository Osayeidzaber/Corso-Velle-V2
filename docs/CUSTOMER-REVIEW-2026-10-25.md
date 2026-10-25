# Customer journey, UX and motion review — 25 October 2026

This review made no theme, storefront configuration, dependency or design changes. It created this report and screenshots only. Shopping actions were reversible QA actions; no order, account, newsletter subscription or message was submitted. The two test products were removed afterwards.

## Scope and evidence

Tested the real Shopify development-theme storefront at `http://127.0.0.1:9292`, with Shopify catalog, Section Rendering, cart and hosted checkout. This is not a static Vite mockup and is not proof that the published theme has the same behavior. Checkout identified preview theme 193548550507. The workspace/preview was also receiving changes from another chat, including the new clothes rack; that component needs a stable acceptance pass after its work finishes.

Browser sizes: desktop 1440×900; tablet 768×1024; phone 375×812; the browser's normal intermediate width was also used. Viewport resizing is not physical iOS/Android device testing or touch-hardware validation. Restored the viewport afterwards.

Read the existing project/audit documentation and traced observed behavior into the Liquid, custom elements, CSS, motion policy and built assets. Earlier source audit and automated-test results are documented separately in `docs/AUDIT-2026-10-25.md`; they are not claimed as fresh browser verification here.

| Journey | Fresh observation | Boundary |
| --- | --- | --- |
| Homepage | Editorial hero, rail, product carousel, tabs, category cards, story, expanding campaign, featured shackets, accordion gallery and footer inspected; scrolled through desktop and phone layouts. | Not every saved section setting or every animation frame tested. |
| Catalog | All Products pages 1 and 2 rendered 24 + 10 products; real stock/size controls and pagination. | Does not validate every product's Admin content. |
| Filters/sort | In-stock filter changed 34 to 33 products, removed fully sold-out Portofino, added active chip and retained price sort. Price ascending began with Tk 600 tank and Tk 700 tees. | Size/color filters were absent; only Availability and Price were exposed. Back/Forward, all price bounds and failed-network recovery not retested. |
| Mobile collections | Menu → Tops → Shackets worked; three products; two-column layout control produced two 160px columns. | Physical swipe behavior not certified. |
| Search | Desktop predictive `amaya` returned products. Mobile search opened a dialog. Unmatched query showed a clear empty state; Enter reached full search with Shop all recovery. `boots` returned footwear. | Shopify search relevance is not limited to product title; unrelated-looking results need catalog/search configuration review. |
| Apparel | Amaya's five-image gallery, Next, image zoom/open/close, size modal, all three fit steps, M selection and disabled XL exercised. Buying disabled until size selected. | No merchant chart image/table was available to verify visually on this product. |
| Footwear | Varenzo showed ten images, numeric stock states, 42 selection and the size-guide problem below. | Shoe 42 was not purchased/added. |
| Cart | Product-page add: Amaya M ×1 at Tk 1,900; drawer quantity ×2 updated line/subtotal/badge to Tk 3,800; View cart rendered same item. Checkout disabled during pending update. | Discounts, selling plans, stock races and connection-loss behavior not exercised. |
| Checkout | Native Checkout reached hosted Shopify checkout with two items, Tk 3,880 total including Tk 80 standard shipping. Tk 150 outside-city and Tk 250 express options and COD were visible. | No address/payment details entered and no order submitted. Only Bangladesh was selectable in this session; international selling configuration not certified. |
| Card quick-add | Classic White Rib Tank M added directly from page 2: one item, size M, Tk 600 and drawer confirmation. | Complex multi-option quick-add drawer not exercised with an appropriate fixture. |
| Accounts | Shopify account button opened Sign in/create-account panel, email form and Orders/Profile links. | No sign-in/OTP, address or order-history acceptance test. |
| Policies/support | Shipping, refund/exchange and contact-information pages opened and contained substantive content. | Email/Instagram contact anchors had no href; phone was plain text. No message sent. |

Screenshots are in `docs/evidence/customer-review-2026-10-25/`: home-desktop, home-tablet, home-mobile, product-desktop, product-tablet, product-mobile, collection-mobile, cart-mobile, checkout-mobile, footwear-wrong-fit-guide and campaign-desktop. Some product screenshots reflect the viewport's current scroll position rather than a complete page capture.

## Priority 1 — essential shopping problems

### 1. Footwear opens a clothing fit estimator — confirmed

**Where:** Varenzo Leather Boots → Size guide. Shoe options are 39–44, but the guide asks sex, height and weight and displays **L**. This gives irrelevant guidance at a purchase-critical moment.

**Cause:** `theme/sections/main-product.liquid:179` chooses a fit option using `size-option`; `theme/snippets/size-option.liquid` recognizes any name containing “size”, including “Shoe size”. The finder is therefore rendered before numeric compatibility is established. `src/components/fit-finder/fit-finder.ts` can return null when mapping letter sizes onto numeric options, but that later guard does not prevent the inappropriate questionnaire and letter estimate from appearing.

**Recommended repair:** Add a distinct “supported apparel fit scale” eligibility check before rendering the finder; numeric/footwear options should show the assigned footwear image/table, units and measuring instructions. Keep the broader size-option detection for legitimate radio selection and quick-add. Do not invent an EU-to-letter conversion. Add regressions for shoe sizes, numeric waist sizing, letter apparel and mixed unsupported labels. Low runtime cost, no new library.

### 2. Collection categories are clipped, undiscoverable and incomplete — confirmed

**Where:** All Products and Shackets banner category strip. At desktop, the last rendered category was clipped. On phone the row was 328px wide with 1,464px of content. No arrows or scrollbar were visible. A horizontal browser scroll attempt left scrollLeft at zero; this alone does not prove physical touch swiping is broken.

**Two independent causes:** `theme/sections/collection-banner.liquid:291` creates a no-wrap `overflow-x:auto` row, hides its scrollbar at line 299 and supplies no previous/next controls. Separately, line 103 stops automatic collection output at `navigation_limit`, whose default is eight. Categories beyond those eight cannot be reached by any scrolling. Shackets itself was absent from that automatic row while visiting Shackets.

**Recommended repair:** Use the existing Theme Editor related-menu setting to curate the real customer taxonomy. Add visibly discoverable previous/next buttons, native horizontal overflow/swipe, an edge cue and active-link reveal. Controls must disable at actual ends, update on resize and remain keyboard operable; no wheel hijacking or GSAP needed. For automatic mode, ensure current collection is represented and provide an explicit “All categories” route rather than silently omitting categories. Increasing the limit alone does not solve scrolling; adding arrows alone does not solve omitted categories.

**Acceptance:** Every configured category reachable with mouse/keyboard; real touch swipe; correct active category on each collection; no page-wide horizontal overflow at 320/375/768/1440px; controls survive section reloads and multiple instances.

### 3. Actual size measurements are missing on tested products — confirmed content gap

**Where:** Amaya M and Varenzo 42: “Measurements for this size have not been provided.” Amaya's guide offered the fit questionnaire without an actual garment chart. This prevents a customer from checking fit independently.

**Recommended repair:** Populate merchant-verified charts through the existing Admin/metaobject or Theme Editor assignment system, including the requested chart picture. Product, collection and tag rules and image rendering already exist in source; they should not be rebuilt as another sizing system. See `docs/SIZE-CHART-ADMIN.md`. The real store still needs populated entries, storefront access and representative assignments accepted in the browser. Earlier Liquid fixtures verify precedence/image markup; they do not prove a merchant image is configured or legible live.

**UX:** Present “Size chart” directly, with “Find my fit” as a separate optional action or clearly labeled area. Explain garment vs body dimensions, measurement units and fit. Image-only charts should open at readable size and retain meaningful alt text; numeric conversions should only operate on actual numeric table data. Never fill missing measurements with guessed values.

### 4. Fit claims exceed the underlying model — confirmed implementation, recommendation

**Where:** “Find your perfect size”, “Your size L”, and the three-step finder. The formula estimates chest from height/weight and generic thresholds; it does not read the garment chart, fabric stretch or silhouette. Defaults alone produced L, and completing steps saved a profile even without choosing the suggested size.

**Recommended repair:** Clearly call this an estimate and avoid “perfect” certainty. Keep authoritative measurements adjacent. Save the recommendation on an explicit user action if that is the intended product behavior. A chart-derived recommendation would be a separate, significant feature requiring approval, verified measurements and a defined ease/fit model. Do not silently map an unsupported/out-of-range body to the nearest garment size and describe it as a confident fit.

## Priority 2 — customer experience and content

### 5. Product shipping/exchange panel gives insufficient buying information — confirmed

Amaya's panel says delivery times/exchange terms are confirmed at checkout. The actual shipping page already specifies standard 3–5 business days and express 1–2, with Tk 80/150/250 rates. The actual exchange page specifies size-only exchanges within three days, subject to availability, with customer-paid exchange delivery. Those conditions matter before adding to cart; the product panel should summarize them accurately and link to the policies.

Use merchant-editable product/template blocks in `theme/sections/main-product.liquid` and `theme/templates/product.json`. Keep commercial promises in a shared merchant-controlled source; do not hardcode duplicate policy prose across components. Confirm policy wording with the owner before changing business terms. No performance concern.

### 6. Customer support text looks actionable but is not linked — confirmed

On `/policies/contact-information`, email and Instagram are anchor elements with no href, and the phone has no tel link. A mobile shopper must copy details manually. Repair the Shopify Admin policy HTML with `mailto:`, the actual Instagram URL and `tel:`. Add an explicit response-time statement only if the business can meet it. This is store content, not a routing-library problem.

### 7. Taxonomy appears to expose Admin organization rather than a curated shop — confirmed

Both “Bottoms (4)” and “bottoms (6)” appear as different collections; mobile search's “Popular collections” also shows both and an alphabetical-looking set of six categories. Shirt/Shacket/Designer Shacket/Embroidered Shirt need a clear hierarchy. This makes shoppers question whether destinations differ.

Configure the existing `header.search_collections`, collection related-menu and navigation menus. Reconcile duplicate collection purposes in Admin without deleting collections or breaking incoming links during this review. `theme/snippets/search-modal.liquid` defaults to collections when suggested collections are empty and caps initial suggestions. Reuse a deliberate menu/collection selection instead of building another taxonomy service. Minimal performance impact.

### 8. Size/color product discovery filters are absent — confirmed configuration gap

The tested filter drawer exposed Availability and Price only. Clothing shoppers cannot narrow the grid by available size, color or fit there. Review Shopify Search & Discovery filter configuration and consistent product option/metafield data; `theme/snippets/facets.liquid`/`src/components/facets/facets.ts` already render native platform filters. Enable size/color only after checking useful counts and unavailable-variant behavior. Native configuration should precede custom filtering code.

### 9. Mobile homepage asks for considerable scrolling — measured; editorial decision

At 375×812 with the initial Timeless tab, document height was about **13,354px**; the Just landed section alone was **4,344px**, with eight one-column products. Switching to three Shackets reduced page length, as expected. Desktop tabs were about 2,290px tall and the expanding campaign about 1,980px at a 900px viewport.

The issue is browsing density and repeated product discovery, not missing smooth-scroll initialization. Recommend showing four mobile tab products plus View all, or offering a compact two-column mobile layout. Retain one major product carousel, the wardrobe cards and one editorial moment; decide whether every repeat merchandising section is useful. This changes presentation and requires approval. It would reduce DOM/media work as well as scroll distance; do not introduce an infinite-scroll dependency.

### 10. First new-arrivals spotlight is fully sold out — confirmed merchandising

The carousel initially highlighted The Portofino Shirt with disabled Sold out actions. Sold-out presentation itself works; placing it first in a shopping-led edit is a weak opening when 33 products have availability. Curate the edit to start with a purchasable item, or clearly frame the sold-out item as an archive with an approved back-in-stock option. Avoid blanket hiding sold-out products without a merchandising decision.

### 11. Important product facts are sparse on tested PDPs — confirmed sample, not catalog-wide

Amaya lists unisex, boxy fit, cotton-twill blend and embroidery. Varenzo lists leather, heel/toe and zip details. Neither sample supplied usable dimensions in the tested guide. Recommend merchant-authored fit notes, model size/height where real, fabric composition, care, relevant construction and linked delivery/exchange information. Reuse existing blocks/metafields. No invented manufacturing, sustainability or fit claims.

## Priority 3 — scrolling and animation

### 12. Why wheel scrolling is not consistently “smooth” — confirmed architecture

There is **no Lenis or ScrollSmoother integration** in the inspected dependencies/runtime modules. `src/styles/base.css:45` sets `scroll-behavior:smooth`, which affects navigation/API-driven scrolling, not ordinary user wheel scrolling. [MDN documents that distinction](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scroll-behavior).

GSAP, ScrollTrigger and SplitText are registered in `src/motion/gsap.ts`. ScrollTrigger's scrub smooths an animation catching up to scroll; it does not itself supply a smooth wheel-scrolling engine. [GSAP's documentation describes scrub and scroller integration](https://gsap.com/docs/v3/Plugins/ScrollTrigger/).

**Live proof of operation:** Desktop `nk-expand-media` had no data-static marker. Around scrollY 7,865 its top was −402px and CSS progress `--e` was 0.4944; later it reached 1.0000. The campaign visibly transitioned from inset to full frame. Phone mode had data-static and a normal 812px campaign block. A blanket “GSAP is not initialized” diagnosis is incorrect.

**What affects the feel:** Native mouse-wheel increments remain native. Scene/hero scrub is 0.25s, campaign 0.35s and parallax 0.6s, so their catch-up differs. Product/reveal entrances use time-based easing instead. Phone policy is intentionally simple at ≤749px, and campaign expansion is forcibly disabled there even if full phone effects are selected. This is a combination of different motion systems/policies, not evidence of one broken master scroller.

**Recommended first pass:** Preserve native touch scroll; define separate coherent timing rules for short control feedback, one-time content entrances and subtle scroll-linked media. Keep purchase information immediately available. Tune displacement, start/end positions and pacing on the existing modules before increasing all durations or adding pins. Compare wheel and trackpad manually on a physical device. Increasing scrub globally makes animations lag farther behind and is not a general cure.

### 13. Layered reveals can briefly leave large blank areas during fast browsing — observed transient, suspected contributor

During rapid mobile scrolling, screenshots captured blank content areas that populated on the next observation; they did not stay permanently missing. The category headline also appeared partially entered before settling. Exact delay and frame cost were not profiled, so this is not a measured dropped-frame diagnosis.

`src/components/reveal/reveal.ts` can wait for fonts (up to 1.2s), then animate for roughly 0.65–0.75s plus delay; `src/components/motion/stagger.ts` initially sets card opacity to zero, then animates entries. `scene.ts` can add a parent entrance. Fast-scroll completion and focus guards exist and should be retained.

Recommend avoiding parent + heading + card visibility gates on the same shopping content, arming near-viewport elements early, and revealing already-in-view content immediately after late initialization. Use opacity/travel lightly; do not lengthen every entrance to make it “premium”. Reproduce cold/warm loads and quick reverse scroll on device before selecting exact timing changes. These are proposed changes, not fixes performed here.

### 14. Campaign pacing should give the shopping CTA more usable time — confirmed timing; optional tuning

`src/components/expand-media/expand-media.ts:49` drives a 220svh desktop track. Progress is divided by 0.75; the overlay begins at p=0.68 and becomes interactive at p=0.9. At 900px height the 1,080px scroll range therefore starts the overlay around 551px into the track and enables it around 729px. This is intentional sequencing, but the commercial CTA is unavailable through much of the scene.

Keep the dramatic reveal, test an earlier stable headline/CTA and a modestly shorter track. Do not lock scroll or stretch the scene merely to force appreciation. Changing the choreography needs approval. `src/components/expand-media/expand-media.css` and the section's settings own its size; JS owns reveal thresholds. Correct its stale module comment, which still describes a former passive-listener/rAF implementation although the code uses ScrollTrigger.

### 15. Carousel is functional but motion should remain shopping-led — verified controls; recommendation

Next/previous/autoplay changed the highlighted product and counter; the pause control was present. Tab selection changed product content, and the lower accordion opened Puro with its matching price/Shop the piece link. The mobile carousel's first frame displayed a sold-out overlay, crossed price, sold-out label and disabled buying action together: clear stock handling, but visually repetitive.

Keep manual arrows, swipe/keyboard support and pause. Prefer a deliberate settled product before enabling purchase, preserve autoplay holds while options/purchase are active, and make duration/ease match other product interactions. Retain video fallback and one-active-video safeguards in `src/components/product/card-interactions.ts`. Hover curtain is 700ms; trial a shorter 300–450ms reveal after the first playable frame, rather than delaying the product information. Hover timing requires real pointer/trackpad and touch-device acceptance; it was not quantitatively profiled here.

### Lenis decision — optional, with a clear test criterion

Lenis could supply the missing wheel interpolation on desktop, so it is technically appropriate **if** physical mouse testing still feels coarse after motion/payload tuning. It will not repair absent charts, category navigation, image/video loading or main-thread stalls. My recommendation is a reversible desktop-only prototype behind an off-by-default Theme Editor setting, followed by a side-by-side decision. No library was installed.

If approved, use one scroll owner and one animation clock, forward Lenis scroll updates to ScrollTrigger and synchronize its RAF with the existing GSAP ticker according to the [maintainer's integration documentation](https://github.com/darkroomengineering/lenis). Keep native touch and reduced-motion behavior, nested dialog/category rails, focus scrolling, anchor offsets, browser restoration and Shopify editor lifecycles working. Destroy listeners/ticker callbacks when disabled; do not run two RAF loops or add global non-passive wheel listeners to every component. Measure added payload and interaction latency before enabling by default.

## Priority 4 — visual consistency and performance

### 16. Preserve the identity; simplify competing merchandising treatments — design assessment

The brown/cream palette, serif/italic editorial headings, script logo, spacious photography and restrained product layout form a coherent foundation. The wardrobe cards and Quietly considered story are particularly consistent. Keep them. The rail, curved carousel, tab grid, bento categories, full-screen campaign, standard grid and accordion are many competing browsing patterns on one page. Their variety should support a story rather than function as a component showcase.

Recommend consistent eyebrow size/spacing, a shared arrow/button vocabulary and one motion emphasis per viewport. The catalog's very large cropped logo banner occupies substantial shopping space; trial a compact collection-specific image/title variant, especially on phone. These are optional art-direction changes, not functional repairs. No full redesign is justified.

### 17. Campaign video readiness needs a separate media acceptance test — unresolved observation

The browser initially exposed “Unable to play media” for the expanding campaign. Later, after pressing Play, its video remained readyState 0/currentTime 0 across observations without a media error code. Hero video reached readyState 4. This supports a readiness/loading problem in this session, **not** a proven broken URL, codec or autoplay policy diagnosis. The campaign poster remained useful.

Inspect the actual CDN response, media source alternatives, encoding and `play()` settlement with browser Network/Media tooling; test in the published theme and physical Safari/Chrome. Use Shopify-hosted video sources with appropriate smaller encodings/posters when possible. The saved campaign/hero URLs select HD-1080p-7.2Mbps assets; that identifies a rendition, not measured bytes transferred. Provide loading/error/retry states and change the control to Pause only when playback is confirmed. Source: `theme/templates/index.json`, hero/expand section media output and video controller. Do not add another media player dependency as a first response.

### 18. Bundle sizes justify targeted profiling — measured files, not Core Web Vitals

| Asset | Local bytes | Local gzip estimate |
| --- | ---: | ---: |
| Global CSS | 164,754 | 29,616 |
| Product CSS | 20,041 | 4,608 |
| Shared GSAP chunk | 121,168 | 47,031 |
| Flex-carousel chunk | 81,624 | 25,202 |
| Global entry JS | 25,377 | 8,265 |

These are current filesystem sizes and gzip estimates, not the browser's measured transfer sizes, execution time or cache behavior. Native Liquid + TypeScript custom elements own the deployed storefront; React is not in package.json/runtime. A React rewrite is unnecessary.

Good foundations: responsive Shopify image widths/sizes, lazy secondary photos, video preload none on cards, shared renderers, lazy GSAP/component imports and separate product entry. Check the actual selected image sizes against rendered width/DPR before changing them.

Investigate whether SplitText must always share the same chunk with scroll-only components, whether the WebGL/OGL carousel improves the phone experience enough to justify its cost, and whether global CSS can be divided by section without creating flashes. `src/components/motion/parallax.ts` imports GSAP before exiting for simple motion; move policy checks before import where safe. These are targeted opportunities, not proof that bundle size caused the scrolling complaint.

`src/motion/gsap.ts` schedules global refresh after body-height changes, image loads, fonts, section replacements and tab changes. A 120ms debounce exists. Profile refresh count/time during cold image loading and tab changes before altering it; repeated refreshes are a suspected source of hitching, not a confirmed bottleneck.

### 19. Analytics warning — confirmed console observation, lower priority

Checkout emitted a Meta Pixel warning about an invalid pixel_id value with embedded quote characters. Check Shopify Customer Events/pixel or app configuration and test actual analytics delivery. The warning alone does not prove every event is lost, and is not evidence that the theme's purchase path is broken. Avoid adding a second pixel script to compensate.

### Measurement limits

The available browser capabilities exposed viewport, visibility, page assets, console logs and normal UI/DOM inspection, but no Lighthouse or performance-trace capture. No LCP, CLS, INP, FPS, long-task or field-CrUX score is claimed. Next performance acceptance should use a stable preview/published build, throttled cold/warm mobile runs and real-device traces. Prioritize hero LCP/media, scroll-time long tasks, layout changes during fonts/tabs and cart interaction latency. Use Shopify performance reporting for real-user evidence when available.

## Optional enhancements, ranked for approval

| Rank | Idea and customer benefit | Implementation | Performance impact |
| --- | --- | --- | --- |
| 1 | **Fit confidence panel:** immediate chart picture/table, garment/body basis, selected-size measurements, measuring illustration and verified model fit note. Helps users buy the right size. | Build on existing chart assignments and PDP block; separate estimate from chart. Owner supplies verified data. | Small; lazy-load full chart image, no additional framework. |
| 2 | **Availability-led discovery:** “Shop my size” using native size filters, retaining selection while moving between collections. Reduces dead ends. | Consistent Admin option data + Search & Discovery first; only add cross-page preference after UX approval. | Low with native filters; avoid fetching entire catalog in JS. |
| 3 | **A shorter, deliberate mobile edit:** four initial products, clear View all, one campaign moment, larger genuinely useful product details. | Existing section settings/layouts; optional compact tab grid. | Usually reduces media/DOM and scrolling work. |
| 4 | **Product detail storytelling:** an explicit “On model / Details” image toggle, restrained crossfade and tap-accessible garment detail close-up. Gives purpose to premium interactions. | Existing gallery/cards; use alternate real media, keyboard labels and preload only adjacent media. | Low to moderate; no autoplay for every card, avoid huge duplicate imagery. |
| 5 | **Complete the look with coherent outfits:** current recommendations already work, but curate matching trousers/shoes with correct sizes per item. | Reuse native complementary product data and existing quick-add; do not auto-add or guess sizes. | Low if recommendations remain deferred; complex multi-item buying needs focused tests. |
| 6 | **Desktop smooth-wheel experiment:** bounded Lenis interpolation only if physical comparison proves a benefit. | One optional integration, reduced-motion/editor/touch exclusions, same ticker and overlay service. | Adds JS and per-frame work; accept only if response remains immediate and traces support it. |

Wishlist, quick-view everywhere, cursor effects and more full-screen animation are lower priorities than the issues above. The new garment rail already offers a distinct visual interaction; finish its mobile/keyboard/Front–Back acceptance before introducing another major display system.

## Suggested implementation order

1. Repair fit eligibility and truthful labeling; populate and visually accept apparel and footwear charts, including image-only assignments.
2. Repair category reachability and curate navigation/search collections; link support channels.
3. Surface accurate shipping/exchange details, care/material/fit content and native size/color filters.
4. Tune existing reveal timing and media readiness on a stable build; measure performance rather than guessing.
5. With owner approval, trial the shorter mobile edit and fit-confidence presentation; evaluate optional Lenis last.

Each repair should be accepted through the same customer journey. Keep normal Liquid links/forms usable, preserve the brown direction and avoid changing working commerce logic merely to unify animation styles.

## Still unverified

Not every collection/product/detail page, every menu branch or saved section setting was opened. Physical touch gestures, Safari/iOS/Android, keyboard-only full traversal, screen readers, contrast ratios, reduced-motion OS switching, no-JS purchase, mixed 3D/external-video products, large/multi-option catalogs, real chart-image Admin save/reopen, authenticated customer workflows, contact/newsletter delivery, checkout discounts, payment completion and fulfillment remain separate acceptance work. No artificial form submissions or orders were used to claim completeness.

No P0 purchase blocker appeared in the tested paths. That is a bounded QA result, not a launch certification or a claim that every feature works.
