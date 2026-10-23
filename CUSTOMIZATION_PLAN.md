# Native theme customization roadmap

Updated: 23 October 2026 (Asia/Dhaka). This is a living implementation plan, not a list of shipped features.

## Delivery contract and checkpoint

Keep Shopify Liquid, JSON templates, Vite 8, Tailwind 4, strict TypeScript, native custom elements and GSAP. Liquid remains authoritative for commerce and content. Complete one chunk, validate it, update `CUSTOMIZATION.md` and this plan, then report a checkpoint. Do not migrate to a headless storefront or install a visual-builder runtime.

Initial checkpoint: audit and roadmap, followed by **F1–F2**. The user has now requested continuous sequential execution of the remaining roadmap. Complete checks and documentation per chunk, then continue without requesting approval between chunks. All work below remains pending unless explicitly marked complete. Existing functionality is a baseline, not work completed by this roadmap. Preserve pre-existing and concurrent edits. Do not overwrite merchant `settings_data.json`, templates or section-group arrangements to demonstrate new settings.

## Audit findings

See [source audit](docs/CUSTOMIZATION_AUDIT.md) for the component-by-component matrix, reusable modules, source boundaries and defects. The schema reference in [CUSTOMIZATION.md](CUSTOMIZATION.md) lists the current controls, defaults, block types and presets; a schema declaration alone does not prove its rendered behavior.

- Native OS 2.0 architecture already supports repeated dynamic sections, local section blocks and an isolated theme-block composition section. It needs incremental extension, not replacement.
- Global colors, fonts, container width, section rhythm, card image defaults and motion policy exist. Responsive gutters are hardcoded. Riviera overrides some shared type/button values, including button radius, so adding more settings without tracing the cascade would create ineffective controls.
- Core lifecycle (`NkElement`), lazy registration and editor selection already exist. Retain these; add meaningful repeated-instance tests as individual components change.
- Hero already supports overlay/editorial/split, mobile media/position, reorderable content and rich CTA controls. Featured collection already supports grid, continuous rail and liquid carousel. Do not create duplicates of these sections.
- Media/text, expanding campaign, category cards, collection tabs, marquees, image strips, reviews, recommendations, footer and size guides are present. FAQ, standalone newsletter/contact, feature grid, timeline, comparison, before/after and hotspots are genuine gaps.
- Reviews wall distributes distinct reviews across columns, then hides later columns on phones and from accessibility APIs. Fix content reachability before adding styles.
- Carousel autoplay/interval behavior differs between the OGL and native paths. Header/search and cart contain intentional singleton IDs. Product quick-add has ID rewriting. Treat these separately from repeatable marketing sections.
- Existing update reports and `infomation/` contain proposals and historical evidence that do not always match current code. Current source wins; never carry historical test results forward as new verification.
- Baseline checked this turn: TypeScript, 84 tests / 17 files, strict JSON, Theme Check (76 files, no offenses). Production build and browser verification are recorded per chunk below.

## Architecture decisions

1. Settings hierarchy: global defaults → section choices/overrides → item/block content → Shopify resource/metafield data. Presets are coordinated starting configurations, not a runtime style engine.
2. Render CSS tokens in `css-variables.liquid`; use static CSS and bounded schema choices. Scope section overrides on its root so two instances can differ. Never emit instance Liquid inside `{% stylesheet %}`.
3. Use snippets for render-only reuse (images, headings, price, card, buttons, section presentation). Use `@theme` and `content_for 'blocks'` for composition; keep local blocks for constrained lists and product info. Do not mix local and theme blocks in one section.
4. Keep existing public setting/block IDs stable. Migration work must be explicit. Do not convert existing hero or product local blocks to theme blocks in place.
5. Initialize through custom elements and `registerLazy`; own selectors, timers, request sequencing and GSAP contexts per instance. Do not install one new document listener for every section.
6. Motion is progressive enhancement: content visible without JS, editor static/inspectable, reduced motion respected, native scroll retained, shopping interactions never delayed by decoration.
7. Bound meaningful choices, not arbitrary item limits. Review existing `max_blocks` and per-type limits per component; retain semantic singleton controls such as one purchase form. Native platform limits are not a performance target.
8. Shopify currently permits 25 sections per JSON template, 50 blocks per section and theme-block nesting up to eight levels excluding sections. Recheck official limits before composition changes. Native section instances cannot be nested inside blocks; offer a group of theme blocks instead. A reusable block definition does not automatically share its merchant-entered content across instances; use dynamic sources for shared data.

References checked 22 October 2026: [theme limits](https://shopify.dev/docs/storefronts/themes/architecture/limits), [theme block schema](https://shopify.dev/docs/storefronts/themes/architecture/blocks/theme-blocks/schema), [settings](https://shopify.dev/docs/storefronts/themes/architecture/settings), [JSON templates](https://shopify.dev/docs/storefronts/themes/architecture/templates/json-templates).

## Shared completion gate

For every chunk inspect affected sources first, implement only its dependencies, run relevant behavior tests plus TypeScript, Vite build/owned-asset sync, JSON and Theme Check. Use real editor/store fixtures where available. Record unavailable checks as pending, never passed. Update reference/settings tables and status before starting another chunk. Test no-JS, reduced motion, phone and desktop when behavior/layout changes. Never publish or replace live merchant content as an incidental validation step.

For repeatable sections: two differently configured instances, rapid setting replacement, add/duplicate/reorder/remove/reconnect, hidden block selection, unique IDs/forms/ARIA, no orphaned animations/listeners. For commerce: actual chosen variant, sold-out/quantity rules, failed/stale responses, localized routes, cart fragments and focus recovery. Browser tests are evidence in addition to schema/unit checks.

## Phase F — Shared foundation

### F1 — Responsive layout rhythm
- **Status:** implemented and locally validated; native editor save/reopen QA pending.
- **Objective/components:** make shared page gutters and mobile section padding merchant controlled with backward-compatible defaults.
- **Modify:** `theme/config/settings_schema.json`, `theme/snippets/css-variables.liquid`, `src/styles/base.css`; regenerate owned CSS/assets through the build.
- **Create:** no runtime component; audit/reference documentation and schema-reference maintenance tool only.
- **Controls:** phone/tablet/desktop gutter ranges; compact/regular/airy/same-as-desktop mobile spacing choices. Existing width and desktop section spacing remain the defaults source.
- **Dependencies:** audit A0 complete. **Concerns:** Liquid style loads before base CSS; use separate input tokens rather than losing values to cascade. Do not affect full-bleed media or component-specific padding.
- **Tests/acceptance:** all shared gates; actual computed gutter and section padding at 749/750/989/990/1199/1200px, extrema and default values; no overflow at 320px. New defaults retain 16/24/48px gutters and 66% mobile rhythm. Fix the discovered base-CSS override of saved section spacing, and document the resulting visible correction for saved Compact/Airy values, fixed-spacing exclusions and pending live-editor checks.

### F2 — Section presentation contract
- **Status:** implemented and locally validated; native editor save/reopen QA pending. **Objective:** one opt-in width, top/bottom spacing and scheme pattern; pilot on `media-text` only.
- **Modify:** `sections/media-text.liquid`, `src/styles/base.css`, relevant editorial CSS. **Create:** `snippets/section-presentation.liquid` if it reduces real duplication.
- **Controls:** inherit/narrow/wide/full content width, independent top/bottom padding, smaller-screen padding, scheme. Keep media bleed distinct from copy width.
- **Dependencies:** F1. **Risks:** existing `.shopify-section` grid/inherited `--content-width`, pin geometry, overlay text contrast.
- **Tests/acceptance:** two editorial instances with different bounds; default screenshot unchanged; no overflow and no unrelated instance style changes; all shared gates.

### F3 — Buttons and surfaces
- **Status:** implemented and locally validated; native editor QA pending. **Objective:** repair ineffective radius setting and unify real shared button defaults.
- **Modify:** `settings_schema.json`, `css-variables.liquid`, controls/Riviera/hero CSS, `hero-button.liquid`; inspect purchase button consumers first. **Create:** general `button.liquid` only after compatibility comparison with hero CTA.
- **Controls:** square/soft/pill, compact/regular/large, filled/outline/text, optional icon, none/subtle hover; bounded border/shadow surface presets. Defaults preserve current visual style.
- **Dependencies:** F1–F2. **Risks:** clipping fill animation, disabled/busy/focus contrast, hero size overrides, checkout touch targets.
- **Tests/acceptance:** every shared button respects supported choices; purchase semantics unchanged; keyboard/reduced-motion checks; shared gates and two-instance CTA checks.

### F4 — Typography and coordinated global styles
- **Status:** implemented; source/build validation complete, full native preset matrix pending. **Objective:** make typography defaults honest and add useful coordinated design starts.
- **Modify:** schema/tokens, base/Riviera/hero/card CSS; preset entries in `settings_data.json` only (preserve `current`). **Create:** preset compatibility checklist in docs.
- **Controls:** heading/body/label scale, heading tracking/line height with restrained choices; extend existing Riviera/Quiet with a distinct minimal/bordered style if all consumed controls work.
- **Dependencies:** F3. **Risks:** font loading, long translations, overlarge mobile headings, theme preset effects on saved content.
- **Tests/acceptance:** preview each preset with long titles and missing images, same content/different visual result, no overflow; existing fonts and IDs retained; shared gates.

### F5 — Schema and editor regression safeguards
- **Status:** implemented (source contracts and QA checklist); live editor verification remains per-component. **Objective:** catch invalid settings and repeated-instance regressions before library growth.
- **Modify:** `scripts/check-json.mjs`, `package.json`, `tests/unit/sections.test.ts`, `src/services/editor.ts` only if tests expose a defect. **Create:** schema contract validator and editor QA checklist.
- **Controls:** none. Validate IDs, defaults, ranges, presets, block order and supported block models without pretending to implement Liquid or Shopify's full validator.
- **Dependencies:** F2. **Risks:** avoid false errors for dynamic settings access and editor-managed JSON banners.
- **Tests/acceptance:** intentional invalid fixtures fail; existing theme passes; two-instance lifecycle fixtures and documented live-editor matrix; shared gates.

## Phase E — Existing sections and shopping components

### E1 — Reviews reachability and accessible moving lists
- **Status:** implemented; source/build/static lifecycle checks pass, native visual/editor QA pending. **Objective:** every distinct review remains available on phones, keyboard and assistive technology.
- **Modify:** `sections/reviews-wall.liquid`, marquee TS/CSS. **Create:** review multi-column behavior regression fixtures.
- **Controls:** static grid/vertical wall, text alignment/card style, mobile list, explicit motion toggle; reuse existing quote/name/product blocks and genuine content.
- **Dependencies:** F2/F5. **Risks:** hidden real content vs decorative clones, pause control must govern all moving columns, duplicated IDs/blocks.
- **Tests/acceptance:** all entered quotes reachable exactly once semantically across column counts, mobile and reduced motion; block selection reveals any review; shared gates.

### E2 — Hero layout and media expansion
- **Status:** implemented; automated checks pass, native visual/editor/media-device acceptance pending. **Objective:** build on overlay/editorial/split rather than introduce competing hero implementations.
- **Modify:** `hero.liquid`, `hero.css`, shared CTA/media snippets; `parallax.ts` only for required lifecycle changes. **Create:** preset configurations.
- **Controls:** centered/minimal and image-led presets; mobile height, media fit/focal point, text panel width, video controls/play policy, gradient scrim; reuse current positions/scales/buttons/animations.
- **Dependencies:** F2–F4. **Risks:** first-section h1/LCP priority, transparent header eligibility, muted autoplay and readable overlays.
- **Tests/acceptance:** repeat overlay/split hero together; mobile media priority, long copy, no-media fallback, no-JS/reduced motion; shared gates.

### E3 — Product cards
- **Status:** implemented; source/commerce regressions pass, native visual/media acceptance pending. **Objective:** one reusable product-card renderer with local presentation overrides.
- **Modify:** `product-card.liquid`, card/Riviera CSS, `card-interactions.ts`, card settings. **Create:** appearance fixture matrix.
- **Controls:** minimal/editorial/bordered/image-led, vendor/price/badges/sizes, ratio/fit/gap, hover photo/video/off and touch behavior; explicit snippet parameters default to global settings.
- **Dependencies:** F3–F5. **Risks:** real variants and multi-option quick-add, swatch navigation, video bandwidth, existing sold-out styling and mandatory size choice.
- **Tests/acceptance:** two grids can differ; actual chosen variant only; hover/focus/touch/failed media, sold-out and missing images pass; shared gates plus purchase regressions.

### E4 — Featured collection grids
- **Status:** implemented; source checks pass, native source/layout/editor matrix pending. **Objective:** improve existing grid with useful composition choices.
- **Modify:** `featured-collection.liquid`, card/grid CSS. **Create:** grid preset fixtures.
- **Controls:** product-list override or collection source, grid/dense/editorial arrangement, mobile/desktop columns/gap, heading alignment/count/CTA, local card appearance; retain carousel branch.
- **Dependencies:** E3/F2. **Risks:** render cost/image sizes at high counts, empty sources and all-products fallback must be explicit.
- **Tests/acceptance:** two independent sources/styles, accurate count/limits, empty editor placeholders, correct responsive sizes; shared gates.

### E5 — Product carousel behavior and presets
- **Status:** implemented; carousel regressions pass, native editor/WebGL/device matrix pending. **Objective:** consistent merchant controls across liquid/OGL and native fallbacks.
- **Modify:** featured-collection schema/Liquid, `carousel.ts`, `flex-carousel.ts`, carousel CSS/product-data as necessary. **Create:** multiple-carousel lifecycle tests.
- **Controls:** native snap/continuous/liquid, autoplay on/off, interval actually consumed by fallback, speed, card width/gap, active emphasis, arrows/progress, lightweight mobile mode.
- **Dependencies:** E3–E4/F5. **Risks:** native path currently loops continuous mode even when autoplay is unchecked; snap timer is hardcoded to 5s; OGL contexts/memory, clone accessibility, selection resets and purchase state.
- **Tests/acceptance:** three differing carousels, independent pause/size/selection, WebGL failure/static fallback, offscreen/background suspension, reconnect cleanup; shared gates.

### E6 — Collection tabs and recommendations
- **Status:** E6a/E6b implemented in separate checkpoints; source/lifecycle checks pass, native catalog/editor/visual QA pending. **Objective:** consistent collection merchandising without duplicating card logic.
- **Modify:** `collection-tabs.liquid`, tabs TS/CSS, `product-recommendations.liquid`, recommendations TS. **Create:** tabs/recommendation instance fixtures.
- **Controls:** tabs underline/pills/sidebar, per-tab limits/source labels, mobile columns/gap/card override, related/complementary fallback, hide-empty/CTA, optional transitions.
- **Dependencies:** E3–E4. **Risks:** all tab panels currently server-render products; cap expensive eager media; stale recommendation fetches and hidden content selection.
- **Tests/acceptance:** keyboard tabs, no-JS stacked panels, source changes, isolated IDs, empty related results, repeat recommendations without races; shared gates.

### E7 — Category navigation and collection directory/banner
- **Status:** E7a/E7b/E7c implemented separately; source checks pass, native large-count/visual/editor/pagination acceptance pending. **Objective:** flexible collection navigation using current implementations.
- **Modify:** `category-cards.liquid`, `collections.liquid`, `collection-banner.liquid`, relevant Riviera CSS. **Create:** preset fixtures, shared navigation snippet only where markup matches.
- **Controls:** refine existing bento/grid/scroller; per-card scheme/fit, optional index/count/description, menu/product imagery source; directory source selection/order; banner image/text/minimal, heights and navigation toggle.
- **Dependencies:** F2–F4. **Risks:** hardcoded category surfaces/ink and white studio frames, missing URL/image, section presets exposing context-dependent collection data.
- **Tests/acceptance:** 1/2/5/50 category blocks where supported, no cut-off links, distinct mobile arrangement, fallback/no image; shared gates.

### E8 — Editorial and expanding campaign
- **Status:** E8a/E8b implemented separately; source/runtime checks pass, native paired-scene/long-copy/video/editor acceptance pending. **Objective:** more story composition without competing animation ownership.
- **Modify:** both sections, scene attributes/scene.ts, expand-media TS/CSS, editorial CSS. **Create:** editorial/expansion preset fixtures.
- **Controls:** media/text stacked/split/overlay/asymmetric, copy width, ratio, focal point, mobile media/order; expansion alignment/type scale/video controls/short or static layouts; reusable buttons.
- **Dependencies:** E2/F2/F3. **Risks:** sticky stage dimensions, short/long copy, nested transformations, video source priority and reduced motion.
- **Tests/acceptance:** two distinct scenes/campaigns, reverse/fast scroll, resize and editor selection, visible links under static fallback; shared gates.

### E9 — Bands, strips and dividers
- **Status:** E9a/E9b/E9c implemented separately; source/runtime checks pass, native moving-list/image/pointer/editor QA pending. **Objective:** extend current marquees and separators rather than add redundant marquee sections.
- **Modify:** announcement/message-band/image-strip/divider Liquid, marquee and elastic-line CSS/TS as needed. **Create:** configuration fixtures.
- **Controls:** static/ticker, row/direction/pause options, gap/icon/separator, mobile font/height, image logo/portrait/editorial presets, divider line/dash/space/elastic and width.
- **Dependencies:** E1/F2. **Risks:** existing arbitrary 6/10/20 block caps; static announcement shows only first message outside editor; link accessibility, animation pause and asset loading.
- **Tests/acceptance:** no lost content in supported static modes, independent repeated tickers, reduced motion, zero/one/many blocks, safe clone semantics; shared gates.

### E10 — Header, navigation, announcement group and search
- **Status:** implemented; targeted navigation/search checks pass, native shell/editor/visual matrix pending. **Objective:** deepen existing shell variations while preserving one site navigation/search shell.
- **Modify:** header/group, nav-drawer/menu-promo/search-modal snippets, header/nav/search TS/CSS. **Create:** shell fixture scenarios.
- **Controls:** left/center/two-row layouts, always/reveal/off sticky, dropdown/mega layouts, utilities placement/visibility, phone drawer variants, suggestion resources/count, announcement placement.
- **Dependencies:** F2–F5/E9. **Risks:** fixed SearchModal/CartDrawer IDs are intentional singletons; shared header-height token requires one header. Document schema singleton limits rather than promise repeatable shell sections.
- **Tests/acceptance:** keyboard/focus/escape, nested navigation, overlay eligible hero, long menus, search cancellation and real routes, editor menu-block reveal; shared gates.

### E11 — Footer and standalone newsletter extraction
- **Status:** implemented; responsive-menu/source checks pass, native form/scheme/fit/editor matrix pending. **Objective:** selectable compact/columns/editorial footer with shared newsletter form rendering.
- **Modify:** footer Liquid/TS/CSS, footer-group only if migration is necessary. **Create:** newsletter-form snippet consumed by footer and later N3.
- **Controls:** layouts/column width, local scheme vs custom palette, spacing/logo/wordmark scales, mobile accordion behavior, social/payment/policy visibility, decorative beam/reveal.
- **Dependencies:** F2–F4. **Risks:** tall-footer reveal fit, form IDs, privacy links, custom footer colors currently override scheme backgrounds.
- **Tests/acceptance:** no newsletter/one menu/many columns, successful/error form fixtures, keyboard and independent forms, normal flow when tall/mobile/reduced motion; shared gates.

### E12 — Product page, media and information
- **Status:** E12a gallery/layout and E12b info extensions implemented; E12c existing chart system retained/reconciled. Automated regressions pass; native product/chart/app/cart/editor matrix pending. **Objective:** configurable product presentation with unchanged purchase authority.
- **Modify:** main-product, media/size/measurement/sibling/option snippets, product TS/CSS and global product settings. **Create:** render-only product presentation snippet only after form-context audit.
- **Controls:** gallery stack/grid/slider, thumbnails/zoom/video, desktop proportions/mobile order, label/accordion/tab presentation, feature blocks and chart appearance; keep required-option selection and optional app blocks.
- **Dependencies:** E3/F5. **Risks:** SKU/availability fragment swaps, high variants, app DOM preservation, chart rule priority, quick-add ID rewriting; do not restore removed duplicate sticky purchase UI merely because its module exists.
- **Tests/acceptance:** actual selected size, unavailable variant, multi-option navigation, real quantity rules, chart precedence/conversion, app block survival, multiple product contexts; shared gates and existing commerce suite.

### E13 — Collection/search results and cart
- **Status:** E13a/E13b implemented separately; automated commerce/search checks pass, native URL/cart/checkout/editor/device matrix pending. **Objective:** merchandising controls around existing transactional services.
- **Modify:** main-collection/search/facets/pagination, main-cart/cart-drawer/line-item, relevant CSS/TS. **Create:** empty-state snippet if justified.
- **Controls:** filter layout/visibility, sort/grid density/card style, pagination count/empty messaging; cart typography/spacing/note/empty recommendation and optional complementary products.
- **Dependencies:** E3/E7/F5. **Risks:** query parameters/history, shopper density storage, filters' full-bleed geometry, serialized cart mutations and recovery/checkout gates. Keep cart drawer singleton.
- **Tests/acceptance:** filter/sort/back navigation, missing fragments, pending quantities/note/focus recovery and localized cart routes; shared gates.

### E14 — Utility/content templates
- **Status:** E14a/E14b implemented separately; source/build checks pass, native comments/password/gift-card/editor/mobile matrix pending. **Objective:** remove needless fixed presentation from remaining templates.
- **Modify:** respective Liquid sections/templates and schema/locales; shared card/CSS only if required. **Create:** scoped utility CSS when inline styles warrant extraction.
- **Controls:** article width/metadata/media/comments display, blog source/count/grid, page width/title, password branding/newsletter, 404 search/CTA; preserve gift-card platform contract.
- **Dependencies:** F2–F4/E3. **Risks:** article comment IDs are currently fixed; contextual main sections should be template-limited and not advertised as generic components.
- **Tests/acceptance:** empty and populated data, long text/comments/errors, unique form IDs, no-JS/phone, correct contextual objects; shared gates.

## Phase N — Prioritized additions (each item is its own chunk)

### N1 — FAQ / accordion section
- **Status:** implemented; disclosure/source checks pass, native grouping/editor/visual/accessibility matrix pending. **Objective:** reusable questions with accessible native disclosure.
- **Modify:** global registration only if existing disclosure cannot serve it. **Create:** `sections/faq.liquid`, scoped FAQ styles; reuse `NkDisclosure`.
- **Controls:** question/answer/page blocks, list/split layout, single/multiple open, heading/scheme/spacing, optional icon.
- **Dependencies:** F2/F5. **Risks:** do not fabricate structured review/FAQ claims or duplicate native disclosure logic.
- **Tests/acceptance:** rearrange/add/delete questions, two sections, selected closed block opens, no-JS answers accessible and keyboard behavior; shared gates.

### N2 — Feature/icon grid and statistics
- **Status:** pending; feature grid then statistics checkpoints. **Objective:** reusable benefits/trust and factual metric layouts.
- **Create:** `sections/feature-grid.liquid`, later `sections/statistics.liquid`, shared feature-card snippet/style. **Modify:** lazy registry only if counters need JS.
- **Controls:** icon/image/title/text/link blocks, 1–4 column/card/list arrangements, alignment; metric value/label with optional lightweight count animation.
- **Dependencies:** F2–F4. **Risks:** curated icons only, accessible literal values always rendered, no fabricated statistics or redundant dependency.
- **Tests/acceptance:** long labels/empty icons, block reorder, different repeat instances, no-JS/reduced motion shows final values; shared gates.

### N3 — Newsletter and contact/information
- **Status:** pending; newsletter then contact checkpoints. **Objective:** merchant-addable native Shopify forms independent of footer.
- **Create:** `sections/newsletter.liquid`, later `sections/contact.liquid` and scoped CSS. **Modify:** shared form snippet from E11 as necessary.
- **Controls:** centered/split/image-backed, copy/consent links/button/scheme, native contact name/email/message and information blocks.
- **Dependencies:** E11/F2/F3. **Risks:** unique IDs and errors, Shopify spam protection, no test subscriptions/messages submitted to real people without authorization.
- **Tests/acceptance:** two form IDs/label associations, native validation and success/error fixtures, mobile; real submission remains a named verification requirement; shared gates.

### N4 — Featured product
- **Status:** pending. **Objective:** product showcase anywhere using the existing purchase contract.
- **Create:** `sections/featured-product.liquid`; extract shared product presentation only where context is safe. **Modify:** product DOM/quick-add/form modules only as required for instance context.
- **Controls:** product picker, image-led/split/compact layouts, media, selected information blocks/description and button presentation.
- **Dependencies:** E12/F5. **Risks:** section-rendering target for resource selected outside product template, apps, form ownership and mandatory options.
- **Tests/acceptance:** two selected products plus quick-add coexist, variant URLs do not change unrelated page, exact chosen variant, empty editor placeholder; shared gates.

### N5 — Gallery/lookbook and shop the look
- **Status:** pending; gallery first, product-linked lookbook second. **Objective:** one media-grid family with optional product linkage.
- **Create:** `sections/gallery.liquid`, shared media tile, then `sections/shop-the-look.liquid` only if product workflow differs materially. **Modify:** reuse gallery/modal facilities after interface audit.
- **Controls:** masonry-like CSS/grid/editorial/slider, image/caption/link blocks, ratio/gap, selected products and optional hotspot coordinates.
- **Dependencies:** E2/E3/N4. **Risks:** image CLS and fetch cost, dialog focus, image hotspot keyboard/touch equivalence.
- **Tests/acceptance:** repeated galleries, empty and landscape/portrait imagery, click/keyboard lightbox, product-link correctness; shared gates.

### N6 — Timeline / brand storytelling
- **Status:** pending. **Objective:** chronological/editorial reusable story rows.
- **Create:** `sections/timeline.liquid`, scoped CSS; reuse heading/image/scene snippets. **Modify:** no runtime unless enhancement justified.
- **Controls:** date/title/body/image/link blocks, alternating/stacked layout, line/icons, static/subtle entrance.
- **Dependencies:** F2–F4/E8. **Risks:** semantic reading order must match chronological sequence on phones.
- **Tests/acceptance:** reorder rows and duplicate section, long copy and missing media, reduced motion; shared gates.

### N7 — Before/after comparison
- **Status:** pending. **Objective:** accessible two-image comparison without heavy media engine.
- **Create:** `sections/image-comparison.liquid`, lazy component/CSS and tests. **Modify:** lazy registry.
- **Controls:** before/after images and labels, orientation, starting position, ratio, drag/slider appearance.
- **Dependencies:** F2/F5. **Risks:** native range keyboard labels, touch scroll interference, no-JS fallback shows both images.
- **Tests/acceptance:** keyboard/touch/pointer at bounds, two independent instances, teardown, responsive image sizing; shared gates.

### N8 — Promotion / countdown
- **Status:** pending. **Objective:** banner presets on existing hero/band for ordinary promotions; new section only for an actual timed offer.
- **Modify:** hero/band preset schemas first. **Create:** `sections/countdown.liquid`, lazy timer/CSS if needed.
- **Controls:** merchant-specified end instant/timezone guidance, expired state, text/media/CTA and compact/hero layout.
- **Dependencies:** E2/E9/F5. **Risks:** truthful expiration, editor clock preview, no per-second accessibility announcements or fake urgency.
- **Tests/acceptance:** past/future/invalid time, page visibility pause, two timers, no-JS date and valid CTA; shared gates.

### N9 — Product comparison
- **Status:** pending. **Objective:** factual product feature comparison.
- **Create:** `sections/product-comparison.liquid`, table styles/shared feature-value renderer as justified. **Modify:** no cart services unless actual purchase is included.
- **Controls:** product pickers, feature label/value blocks or documented metafield keys, row/column emphasis, sticky first column, mobile scroll.
- **Dependencies:** E3/N4/F5. **Risks:** data consistency, accessible row/column headers, no invented claims or duplicate product pricing engine.
- **Tests/acceptance:** missing values/long labels, 2–4 products, keyboard horizontal scroll, localized prices and repeat sections; shared gates.

### N10 — Recently viewed products
- **Status:** pending; lower priority until privacy/data contract reviewed. **Objective:** optional browser-local shopping history rail.
- **Create:** section/lazy controller/cache helper and tests. **Modify:** product entry to record only when enabled; reuse product-card HTML/section fetching.
- **Controls:** opt-in, limit, exclude current product, clear history, card/grid/rail appearance.
- **Dependencies:** E3/E5/F5. **Risks:** storage availability, consent expectations, invalid/unpublished products, request fan-out and markets.
- **Tests/acceptance:** disabled storage/private mode, empty/history cap/clear, stale products and two instances, no scripts loaded when unused; shared gates.

## Phase C — Native composition and advanced controls

### C1 — Composition section and reusable primitives
- **Status:** pending. **Objective:** improve existing `custom-section` and `group` rather than build a parallel page builder.
- **Modify:** custom-section, group/text theme blocks, locale schemas. **Create:** heading, media, button-group and feature-card theme blocks plus shared render snippets.
- **Controls:** group direction/wrap/gap/alignment/mobile stacking, section background/scheme/spacing, semantic heading level, responsive media and buttons. Use current theme-block presets as starting points.
- **Dependencies:** F2–F5/E2/E3/N2. **Risks:** `.group` currently clips overflow and never wraps; text is plain output; nested sizing and editor wrappers. Do not migrate saved local section-block trees automatically.
- **Tests/acceptance:** native nested rows/columns, long content, independent duplicate groups, block selection, no arbitrary nesting restriction below supported platform maximum; shared gates.

### C2 — Tabbed content and button groups
- **Status:** pending. **Objective:** reusable content tabs using existing `NkTabs`, shared buttons across composition sections.
- **Create:** `sections/tabbed-content.liquid` and appropriate theme-block composition surfaces after verifying native nesting support. **Modify:** tabs/CTA snippets only as needed.
- **Controls:** pane title/body/image/page, underline/pills/stacked-mobile, button order/style/icons and alignment.
- **Dependencies:** C1/N1/F5. **Risks:** nested interactive roles, hidden panel focus, local vs theme-block model must remain valid.
- **Tests/acceptance:** keyboard/no-JS/selected-block visibility, nested editor operations and multiple tabsets; shared gates.

### C3 — Interactive storytelling variations
- **Status:** pending; hotspots, hover-reveal grid, horizontal story slider are separate opt-in checkpoints. **Objective:** add behavior only where existing sections cannot express it.
- **Modify:** gallery/feature/media sections or create specialized section where warranted; lazy controller/CSS/registration per new behavior.
- **Controls:** optional hotspot labels/products, click/tap equivalent to hover, horizontal slider controls, bounded parallax/text entrances.
- **Dependencies:** N5/C1/E8/F5. **Risks:** GPU layers, focus visibility, touch scroll and mobile/static fallback. Reuse scene/marquee/carousel engines rather than another slider dependency.
- **Tests/acceptance:** repeated instances, touch/keyboard/offscreen/teardown, no-JS/reduced motion, measured frame cost; shared gates.

### C4 — Motion consistency and tuning
- **Status:** pending. **Objective:** consume one policy across all effects, then expose relevant local overrides.
- **Modify:** core motion/config/gsap, tabs/marquee/carousel/text/reveal/scene/expand controllers, motion/scene schemas and CSS effects.
- **Controls:** inherit/off/subtle/expressive, bounded duration/delay/intensity; autoplay distinct from decorative scroll effects. No arbitrary technical GSAP controls.
- **Dependencies:** F5/E5/E8/E9. **Risks:** some modules use `decorativeMotionAllowed()` while others use viewport-aware `motionMode()`; tab transitions still have fixed timing and animate card images. Avoid two owners transforming the same image.
- **Tests/acceptance:** global off/phone off/data saver/reduced-motion changes/editor all honored, fast/reverse scroll and reconnect leave content usable; shared gates and runtime profiling.

## Phase V — Integration, styles and maintainability

### V1 — Template and preset integration
- **Status:** pending. **Objective:** assemble distinct complete storefronts from shipped components.
- **Modify:** new demo template/preset files, never current merchant arrangements. **Create:** optional editorial/minimal/campaign template examples and migration notes.
- **Controls:** presets use only shipped settings/components; second-brand fixtures via editor.
- **Dependencies:** relevant E/N/C chunks, not every lower-priority addition. **Risks:** stale resource handles, destructive settings replacement, native section/block budgets.
- **Tests/acceptance:** all presets usable with empty store and real catalog, saved customized-template upgrade works, no brand-domain conditions; shared gates.

### V2 — Full editor/commerce/accessibility validation
- **Status:** pending; repeat portions after each relevant chunk. **Objective:** verify actual native composition and purchase paths.
- **Modify:** only defects discovered. **Create:** QA matrix/evidence covering templates and component variation families.
- **Controls:** none. **Dependencies:** each candidate release scope. **Risks:** mocks cannot certify Shopify editor, high-variant products, apps, checkout, physical Safari or screen readers.
- **Tests/acceptance:** editor add/duplicate/reorder/remove/save/reopen, repeated carousel/product/form cases, mobile 320/390/750/990/1440, keyboard/contrast/zoom, real variants/cart/search/filter, reduced motion/no-JS. Record fixture gaps explicitly; never claim all combinations tested from a few screenshots.

### V3 — Performance, documentation and release
- **Status:** pending. **Objective:** ship a maintainable library with measured cost and upgrade guidance.
- **Modify:** only measured bottlenecks and docs; build scripts if ownership/caching issues are found. **Create:** per-template asset/media budgets and release/migration checklist.
- **Controls:** no new controls. **Dependencies:** V1–V2 for selected scope. **Risks:** multiple OGL contexts, eagerly rendered hidden tab images, app overhead and duplicated CSS imports; profile first.
- **Tests/acceptance:** representative mobile Lighthouse/Web Vitals, image dimensions/CLS, idle/offscreen animation work and editor leak checks, license review, all checks pass, reference regeneration produces no diff, documented remaining limitations. Publishing is a separate explicit release action.

## Progress log

### A0 — Audit and practical roadmap
- **Status:** complete (source audit; live-editor certification pending).
- Inspected documentation/design history, native theme schemas/templates/blocks/snippets, build and asset ownership, CSS cascade, runtime lifecycle/motion and commerce boundaries. Findings and existing capabilities are recorded separately from future work.
- Baseline: TypeScript pass; 84 unit tests pass; JSON pass; Theme Check 76 files, zero offenses.
- F1 is implemented below. F2 is the current continuation; F3 remains pending.

### F1 — Responsive layout rhythm checkpoint
- Added three responsive page-gutter ranges and four meaningful smaller-screen section-spacing choices under Theme settings → Layout. Values flow through Liquid CSS input tokens into existing base CSS; no runtime dependency or new JS component.
- Browser validation exposed the existing base-CSS `--nk-space-section:72px` override of merchant settings. Moved that fallback to its use sites. Saved Airy now renders 112px desktop / 73.92px smaller-screen shared padding rather than the incorrectly forced 72px / 47.52px. New default gutters and mobile ratio match former hardcoded values. Merchant values were not edited.
- Expanded `CUSTOMIZATION.md` with current component behavior/limitations, extension instructions and generated setting/default/block/preset tables. `scripts/customization-reference.mjs --check` detects stale reference tables; this is documentation tooling, not a replacement for Shopify schema validation.
- Verification: TypeScript pass; **89 tests / 20 files pass** in the shared tree at this checkpoint; Vite production build pass and 27 owned assets synchronized; strict JSON pass; Theme Check pass. Additional tests and product/motion changes arrived from concurrent workspace work and are not counted as F1 implementation.
- Actual Shopify preview at 320, 749, 750, 989, 990, 1199, 1200 and 1440px: expected 16/24/48px gutters, 73.92/112px saved Airy padding and no horizontal overflow. Collection preview also confirmed 48px desktop gutters/no overflow.
- Temporary local fixture used the actual production CSS with schema-default/minimum/maximum/85%-Airy/saved-Airy token sets at the same eight widths: **40 combinations passed**, including repeated sections' padding, content width and full-bleed width. This tests CSS token consumption; it does not certify clicking/saving each setting in Shopify's editor.
- Evidence: `docs/evidence/customization-f1-collection-desktop.jpg`, `docs/evidence/customization-f1-layout-checks.json`. Temporary fixture/server stopped; viewport override restored.
- Not performed: native editor add/duplicate/reorder/save/reopen, real device/performance profiling or complete commerce end-to-end revalidation. F1 changes only shared CSS/layout settings; existing commerce regressions pass. Nothing published to production.
- Next chunk: **F2**, pilot section-level presentation controls on media-with-text. Review current concurrent changes before extending shared files.

### F2 — Section presentation checkpoint
- **Implemented:** opt-in `.section-presentation` CSS contract and `theme/snippets/section-presentation.liquid`, consumed by Media with text only. Width choices inherit/1200/1440/full with gutters; padding inherits global values or uses four independent 0–200px sliders (4px steps), split at 990px. Existing per-instance color scheme is grouped under Section appearance. Defaults emit no local override declarations.
- **Compatibility:** no merchant template/settings values edited, no new JavaScript/dependency, no layout or motion engine replacement. Full-width backgrounds stay full width; container settings size media and copy together. Native conditional settings keep the four sliders visible only in Custom mode.
- **Repair discovered through validation:** a long unbroken heading made the copy grid's implicit minimum width overflow. Local `minmax(0,1fr)`, child constraints and heading wrapping now keep content inside the chosen container. This is confined to Media with text.
- **Native render verification:** used a temporary alternate collection JSON template in the development theme, with four independently styled Media with text instances plus an unchanged Featured collection neighbor. At 320/390/749/750/989/990/1199/1200/1440/1920px, all **40 section checks pass**: expected inner widths, top/bottom padding (including zero/200px), full-width backgrounds, no page overflow, and unchanged neighbor sizing. Distinct schemes and desktop/phone order remain isolated. Saved inherited defaults match the previous shared width/padding geometry.
- Changed the fixture's section order and switched a custom instance back to inherited spacing while retaining its old slider values. Shopify rendered the new order and restored 112px desktop / 73.92px smaller-screen padding; custom declarations disappeared from that root. A tall campaign-style scene with desktop hold requested stayed unpinned. No browser errors observed in these checks. This was a source-template reload test, not a Theme Editor drag/drop lifecycle certification.
- **Validation (finalized 23 October):** TypeScript pass, **91 tests / 20 files pass** in the shared working tree, Vite production build + 27 owned assets synchronized, strict JSON pass, schema-reference check pass. Final Shopify Theme Check: **79 files, zero offenses** after fixture removal. Translation errors and a product-only complexity warning seen during concurrent work were resolved in that work; final validation is clean. Whitespace validation passes for the F2 source files.
- **Evidence:** `docs/evidence/customization-f2-layout-checks.json`, `customization-f2-desktop.jpg`; reproducible initial fixture in `docs/fixtures/collection.customization-f2-audit.json`. The temporary deployable template is removed after testing; the archived fixture is documentation only. To reproduce, copy that fixture into `theme/templates/` on a development theme and open `/collections/all-products?view=customization-f2-audit`, then remove it. Resource handles may need replacing for another store.
- **Not performed:** native editor slider/save/reopen/add/delete/drag operations, physical devices, OS reduced-motion switching, full commerce end-to-end pass or pixel-by-pixel baseline screenshot comparison. No animation policy changed; current commerce/motion regression suite passes. Native render checks do not replace those remaining release checks.
- **Next:** F3 — repair shared button radius/default controls and introduce bounded button/surface choices. Stop here for this chunk; inspect the current CSS cascade and concurrent changes before F3.


### Product/carousel integration checkpoint — 23 October

Independent product completion work is tracked in PRODUCT_PAGE_PLAN.md. Shared measurement
panels use the existing global accent/on-accent tokens and product/collection/global chart
assignments. Variant picker settings control visibility, preview, unit switching and highlights;
existing breadcrumb/title/SKU/care/accordion controls are documented in CUSTOMIZATION.md.
The user-requested size-panel reference update is confined to those components. Carousel speed
now affects editorial settling as well as classic rail movement, independently of the interval.
Carousel size selection shows the shared measurement panel below the sizes and retains autoplay
holds; product-template charts load on demand with stale-response guards. No new library, Admin
records or template/block rearrangements were introduced. Browser/editor/device/cart integration
QA for this follow-up remains pending; it is not claimed by F1/F2's earlier evidence.

### F3–F5 — Shared design and safeguards checkpoint
- F3: repaired shared radius, added button size/corner/motion defaults and local hero corner overrides, plus flat/bordered/raised card surfaces. Shopify preview passed 24 button cases, three surface cases, focus/instant-motion checks and four viewport widths. Evidence: `docs/evidence/customization-f3-checks.json` and `customization-f3-buttons.jpg`. Fixtures archived outside the deployable theme; no production publish.
- F4: heading weight/tracking/leading and label tracking now consume shared settings; body size adds 17/18px. Added Minimal preset without changing current merchant settings. Source/build validation passes; actual preset switching/long-content browser matrix remains pending.
- F5: added schema/order/preset source contracts with five validator tests and reference-freshness check to the aggregate check command. Added `docs/EDITOR_CUSTOMIZATION_QA.md`; these checks supplement Theme Check and do not certify editor behavior.

### E1 — Reviews checkpoint
- Replaced inaccessible alternating columns with one grid list whose columns move together. All genuine reviews remain semantic and visible on phones/static/editor/no-JS; one pause governs the whole wall. Added static-grid preset, alignment and card appearance; removed arbitrary 24-block cap.
- Marquee now honors phone Motion off, supports explicit static/phone-static modes, resets cleanup state and seeks vertical keyboard links into view.
- Three new static/reconnect checks pass; TypeScript, Vite/27 assets, strict JSON, five schema-contract tests and Theme Check (81 files, zero offenses) pass. Native preview is currently unavailable, so visual moving/focus/editor acceptance is pending. Continue with E2.

### E2 — Hero checkpoint
- Added centered/minimal-split/image-led presets, independent phone height, contain/cover and tint distribution. Contain disables parallax cropping; existing content/first-image behavior retained.
- Added lazy muted background-video policy with explicit autoplay/manual choice, accessible toggle, offscreen/hidden pause, reduced-motion/editor manual playback, rejection handling and cleanup. Native controls remain as no-JS fallback.
- Three playback tests, TypeScript, schema contracts, strict JSON, Theme Check (81 files, zero offenses) and production build/28 owned assets pass. Native visual/editor/device playback still pending. Preview restart encountered port 9292 already occupied; no existing process was terminated. Continue E3.

### E3 — Shared product-card checkpoint
- Added global appearances, hover media policy, vendor/price toggles and optional per-section card settings contract with scoped ratio/fit tokens. Existing card renderer, options authority, size/quick-add logic and actions:false behavior retained.
- Twenty product/quick-add regressions, TypeScript, Vite/28 assets, strict JSON, schema contracts and Theme Check (82 files, zero offenses) pass. Visual two-grid and actual media/commerce browser QA remains pending. Continue E4 to expose local grid controls.

### E4 — Featured collection checkpoint
- Added explicit product selection/source-aware counts, regular/compact/editorial-first arrangements, responsive gaps, heading/count/CTA options, eight local card overrides and F2 width/spacing controls. Added two presets without changing merchant templates.
- Responsive image sizes account for columns and the editorial span. No unrelated all-products fallback; custom selections require an explicit View all destination.
- TypeScript, production build/28 assets, JSON, schema contracts and Theme Check (82 files, zero offenses) pass. Browser acquisition was blocked on the failed preview tab; no bypass was attempted. Native repeated-layout/source/editor checks remain pending. Continue E5.

### E5 — Carousel checkpoint
- Fixed classic autoplay Off and native snap's hardcoded interval; added explicit no-WebGL snap style, native rail width/gap/emphasis/arrows and two presets. All native paths honor viewport motion policy and retain required-size purchase holds.
- Moved the eight new card controls into a singleton presentation block after Theme Check flagged an oversized section panel. This is a deliberate roadmap refinement; the block is optional, presets include it and old saved sections continue with global cards.
- 21 targeted carousel tests pass, including three new instance/interval/off/cleanup regressions. TypeScript, build/28 assets, schema contracts, JSON and Theme Check pass after the settings-panel repair. Browser/editor/multi-WebGL/device QA remains pending. Continue E6.

### E6a — Collection tabs checkpoint
- Added pills/sidebar presets, phone columns/gap, local card controls, per-tab display limits and shared width/spacing. Removed the arbitrary six-tab cap; documented server-render cost and lazy media limits.
- Added vertical ARIA/key support, per-instance transition switch and stacked-content cleanup. Two keyboard/instance/editor-selection/reconnect tests pass; TypeScript, source contracts, Theme Check (82 files, zero offenses), build/28 assets and JSON pass. Native visual/editor/large-library profiling pending. E6 recommendations follow separately.

### E6b — Recommendations checkpoint
- Added complementary preset, responsive grid/card overrides, heading/CTA/presentation and meaningful empty-state controls. Shopify intent/data and fallback source remain authoritative.
- Empty results now respect show-empty and are marked loaded; stale responses retain the existing connection guard. Three response/empty tests pass; TypeScript, contracts, JSON, Theme Check (82 files, zero offenses) and build/28 assets pass. Real recommendation/editor/visual QA pending. Continue E7.

### E7a — Category cards checkpoint
- Added scheme-driven/per-card colors, fit overrides, index/count/description/sub-link choices, heading motion and shared presentation. Added grid/swipe presets and removed the eight-card cap. Missing destinations no longer generate empty links.
- Source contracts caught a duplicated existing scheme setting; repaired it. Reviewed CSS specificity against legacy alternating surfaces. TypeScript, contracts, Theme Check (82 files, zero offenses), build/28 assets and JSON pass. Native large-count/layout/palette/editor QA pending.
- Full-suite check after E6 exposed the old classic-carousel fixture's implicit autoplay assumption; made its native/autoplay intent explicit without weakening assertions. All five tests in that suite now pass. Continue E7b directory.

### E7b — Collection directory checkpoint
- Added curated/manual source order, heading/visibility/media/frame/scheme/presentation controls and a curated preset. Extracted one render-only grid snippet for both pagination sources; added native pagination (24/page default) instead of silently stopping at 50.
- Official Shopify paginate/input-setting documentation confirms collection-list pagination and its independent query key. All-store repeated directories share normal page state; post-pagination empty filtering can shorten pages, both documented.
- Theme Check caught a markup boundary error during extraction; fixed it before continuing. Final TypeScript, build/28 assets, JSON, source contracts and Theme Check (83 files, zero offenses) pass. Native pagination/editor/visual QA pending. Continue E7c banner.

### E7c — Collection banner checkpoint
- Added image/text/minimal variants, independent phone height, tint/drift/scheme options, heading override, breadcrumb/count/navigation controls and minimal preset. Only the first banner claims h1 and eager image priority.
- Source contracts, build/28 assets, strict JSON and Theme Check (83 files, zero offenses) pass. Native image/contrast/navigation/editor/responsive acceptance remains pending. Continue E8 editorial sections.

### E8a — Editorial media checkpoint
- Added stacked/asymmetric presets, media ratio/fit/phone image, copy width/alignment, CTA appearances, overlay foreground choice and Shopify-hosted video. Shared video rendering with Hero; contain suppresses inner scene parallax.
- Reviewed overlay/button stacking and constrained video geometry. Targeted video/GSAP/campaign tests, TypeScript, build/28 assets, strict JSON, source contracts and Theme Check (84 files, zero offenses) pass. Paired scenes/video/mobile/native editor acceptance pending. Continue E8b expansion.

### Scroll and accent system — final verification, 23 October
The scroll/colour work tracked in SCROLL_ANIMATION_PLAN.md is implemented and validated: shared brown tokens, native scroll, section scenes, bounded optional desktop holds, fast-scroll reveals and simplified phone motion. Merchant settings and the regenerated schema reference are current in CUSTOMIZATION.md. Final checks pass: 115 unit tests, five contracts, TypeScript, Vite build, strict JSON and Theme Check (84 files). Broader E-series customization checkpoints above retain their own pending acceptance items; this completion does not mark those separate items complete.

### E8b — Expanding campaign checkpoint
- Added alignment/copy width/heading size, static compact preset, repeatable text/buttons and shared CTA variants. Static stage grows with content to avoid clipping long copy.
- Reused the shared background video policy; external instance-scoped pause control sits outside the clipped frame. Removed duplicate playback logic. A TypeScript check caught a leftover call during extraction and it was removed before passing verification.
- Nine campaign/video tests, TypeScript, build/28 assets, JSON, source contracts and Theme Check (84 files, zero offenses) pass. Native scroll/long-copy/editor/device acceptance pending. Continue E9.

### E9a — Message/announcement checkpoint
- Added static wrapped band, phone-static policy/scale, direction and one pause for both rows. Added stacked-all announcements, separator/direction and 44px ticker pause. Explicit first-message mode remains intentional; removed arbitrary caps.
- Keyboard focus immediately pauses and seeks original items in either direction. Four marquee tests, TypeScript, contracts, JSON and build/28 assets pass. Theme Check has no errors; two orphaned carousel snippets appeared during concurrent browse-only work and were preserved. Native ticker/editor/long-label QA pending. Continue E9b.

### E9b — Image strip checkpoint
- Added static/logo/portrait presets, shape/fit/phone sizing, monochrome/caption/fade choices, shared presentation and a real pause button. Preserved product-then-image-block data order; removed twenty-block cap.
- TypeScript, source contracts, JSON and build/28 assets pass. Theme Check: no errors, two concurrent carousel orphan warnings. Native image/labels/static-grid/overflow/editor QA pending. Continue E9c divider.

### E9c — Divider checkpoint
- Added dashed/space, width/thickness choices and quiet/spacer presets. Marked separator decorative; elastic movement requires full motion and mouse input.
- TypeScript, contracts, JSON and build/28 assets pass. Theme Check has no errors and two concurrent carousel orphan warnings. Native pointer/editor/visual QA pending. Continue E10 header/navigation/search.

### E10 — Header/navigation/search checkpoint
- Added two-row desktop layout, click/hover choice, dropdown grouping, logo-color treatment, responsive minimum heights, utility toggles and common predictive resource/count settings. Explicit singleton header preserves fixed drawer/modal IDs and shared measurements. Existing sticky/drawer/overlay choices retained.
- Two hover/native-click/timer cleanup tests and four search regressions pass. TypeScript, contracts, JSON and build/28 assets pass; Theme Check has no errors and two concurrent carousel orphan warnings. Native shell/long-menu/search/editor/visual matrix pending. Continue E11 footer.


### Carousel reference supersession — 23 October
The user's latest design request supersedes the earlier carousel size-panel checkpoint above.
Featured collections now render a browse-only curved liquid lens, active brown highlight, autoplay
and first-click product links; product-page charts remain unchanged. Products before the curve
(3–6, default 4) governs the extended desktop center; interval defaults to 1.5s with 1s minimum.
Existing speed/intro/spacing/emphasis settings continue working; arrows apply to native rail modes,
with a minimal pause control for the lens. Native fallback below 990px and motion-policy teardown
preserve accessibility/touch navigation. Changes are confined to the carousel integration and docs;
this does not mark unrelated roadmap phases complete. Live visual/editor QA remains outstanding.

### E11 — Footer checkpoint
- Added three layouts, density/columns/logo/wordmark controls, policy/back-to-top visibility and always-open phone menus. Scheme mode uses the actual selected color-scheme object; default custom palette preserves saved colors. Extracted native signup with unique IDs/error/privacy handling for later standalone use.
- Removed arbitrary menu cap, retained semantic brand/social limits and explicit singleton shell. Beam requires full motion; reveal keeps fit safeguards.
- Six carousel/footer tests, TypeScript, contracts, JSON and build/28 assets pass. Theme Check has no errors, two concurrent carousel orphan warnings. Native forms/schemes/tall-footer/editor/device checks pending. Continue E12; reconcile current product work before adding duplicate controls.


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

### E12a — Product gallery/layout checkpoint
- Added opt-in stack/editorial grid, proportions/side/order/sticky/scheme/padding and media ratio/fit/background/thumbnail/control/zoom choices. Default gallery remains the current single square uncropped slider; quick add retains its own single-column behavior.
- Twenty-two product/quick-add/gallery tests, TypeScript, contracts, JSON and build/28 assets pass. Replaced three conditional root attributes with literal boolean attributes after complexity warning; final Theme Check has only the two concurrent carousel orphan warnings. Native media/variants/cart/app/editor/visual acceptance pending. Continue E12b information blocks.

### E12b–c — Information/size-guide checkpoint
- Added title scale, info spacing, inline description and an optional repeatable feature block. Extracted existing description/spec/care render logic to reduce main-section complexity. No merchant template blocks were inserted.
- Reconciled E12c against existing product/collection/global chart assignment and per-picker guide/preview/unit/highlight controls; retained them instead of adding a second sizing system or fabricated data.
- Twenty-two product/quick-add/gallery tests, TypeScript, contracts, JSON and build/28 assets pass. Theme Check has no errors, two concurrent carousel orphan warnings. Native actual chart/variant/cart/app/editor/device matrix remains pending. Continue E13 results/cart.

### E13a — Results checkpoint
- Added local card controls/gap, contained or full toolbar, sticky choice and optional shopper density switch. Locked grids ignore old session preference; search toolbar now receives actual rendered columns. Existing filter/sort/history authority retained.
- Nine facet/sort/search tests, TypeScript, contracts, JSON and build/28 assets pass. Theme Check: no errors, two concurrent carousel orphan warnings. Native filtered URLs/history/catalog/editor/visual matrix pending. Continue E13b cart.

### E13b — Cart checkpoint
- Added scheme/density/image controls, cart-page note/summary/sticky/accelerated-checkout choices and bounded drawer widths. Optional empty-cart suggestions use four links-only shared cards inside the native form, with no nested forms/actions; default off.
- Thirty-four cart/render/product regressions, TypeScript, contracts, JSON and build/28 assets pass. Theme Check: no errors and two concurrent carousel orphan warnings. Native mutations/forms/checkout/fragment/editor/device acceptance pending. Continue E14 content/utilities.

### E14a — Blog/article checkpoint
- Added source/layout/count/column/media/excerpt/metadata controls and article reading width/image/comments choices. Shared escaped/localized metadata, scoped comment form/field IDs and success acknowledgement. Contextual singleton restrictions protect resource assumptions; no content inserted.
- TypeScript, contracts, JSON and build/28 assets pass. Theme Check has no errors, two concurrent carousel orphan warnings. Native comment/pagination/moderation/editor/mobile QA pending; no comment submitted. Continue E14b utilities.

### E14b — Utilities checkpoint
- Added scoped page/404/password widths/schemes, optional title/search/branding/signup and CTA/message overrides. Password signup remains off by default and outside the native password form. Added gift-card Classic/Minimal/Bordered global presentation without changing redemption/balance logic.
- TypeScript, contracts, JSON and production build/owned-asset sync pass. Theme Check: no errors, two concurrent carousel orphan warnings. Native protected forms, real gift cards/print/editor/mobile remain pending. Continue Phase N one section at a time, rechecking concurrent additions to avoid duplicates.

### N1 — FAQ checkpoint
- Added native question/page-answer blocks, list/split/cards, markers, first/single-open choices and shared presentation. Reused disclosure runtime with local animation Off and clipping cleanup; native details grouping is section scoped, with older-browser fallback documented.
- Three new disclosure regressions plus existing footer tests pass, TypeScript/build/owned sync/JSON/contracts pass. Theme Check: no errors, two concurrent carousel orphan warnings. Native grouping/editor/screen-reader/mobile QA pending. Continue N2a feature grid.

### N2a — Feature library checkpoint
- Added grid/cards/list presets with image/curated icons, content/links, responsive columns/gap/alignment/icon size and local card/scheme/spacing options. Shared renderer/CSS with product feature blocks; no new runtime/dependency or inserted merchant content.
- TypeScript, schema contracts, JSON, build/owned sync and Theme Check error gate pass; two concurrent carousel orphan warnings remain. Native large-count/responsive/editor/contrast QA pending. Continue N2b statistics.
