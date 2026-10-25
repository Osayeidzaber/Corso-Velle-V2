# Production readiness — final evaluation, 25 October 2026

This is the final pre-launch evaluation of the NK theme (Shopify Online Store 2.0, Liquid + Vite + vanilla TypeScript + GSAP/Lenis). It covers code, Shopify compatibility, customer journeys on the real Shopify development preview, performance, SEO, security and commercial distribution. It builds on, and does not repeat, the earlier audits listed in [README › Project notes](README.md#project-notes).

Evidence labels used below:

- **Confirmed**: reproduced by a test, a measurement or a live interaction in this evaluation.
- **Code inspection**: established by reading source; not exercised live.
- **Optional**: an improvement, not a defect. Needs owner approval before implementation.

## Verdict

| Question | Verdict | Why |
| --- | --- | --- |
| Ready for Corsovelle's production store? | **Yes for the code, conditionally for launch.** | No open critical or high-severity code defect. Purchase path, variant rules, cart, discount handling and checkout handoff behaved correctly on the real Shopify preview. Launch still depends on store-side work the theme cannot do: real size-chart measurements, Search & Discovery filters, a social sharing image, an owner Theme Editor pass, real-device checks and one authorized test order (see [Launch requirements](#launch-requirements-for-corsovelle)). |
| Ready for private commercial distribution? | **Not yet.** | The architecture is reusable, but the shipped package is still Corsovelle's store: saved settings contain Corsovelle's support email/phone/Instagram, the homepage template streams videos from corsovelle.com, and the theme is named "NK — Corso Velle". A neutral install package, buyer documentation and a GSAP licence confirmation are needed first (see [Commercial distribution](#commercial-distribution)). |
| Eligible for the Shopify Theme Store? | **No, not without substantial work.** | Shopify requires a Skeleton-based codebase and rejects themes derived from Dawn; nine sections are documented as Dawn adaptations. Shopify also rejects minified `.css`, company names in theme names, and requires measured Lighthouse averages (performance ≥ 60, accessibility ≥ 90) that have not been measured. |

## Method

### Shopify agent skills actually used

The official skills from [Shopify/agent-skills](https://github.com/Shopify/agent-skills) were already installed in `~/.claude/skills` (14 of the 15 published skills; `shopify-storefront-graphql` is irrelevant to a Liquid theme).

| Skill | How it was used |
| --- | --- |
| `shopify-liquid` | Followed its theme architecture rules (LiquidDoc headers, escaping, schema practice). Ran `scripts/validate.js` in full-theme mode on **all 151 theme files** (all passed) and again on every file changed here (all passed). Used `scripts/search_docs.js` for the Ajax cart / cart object, the `video_source` object and Theme Store performance requirements. |
| `shopify-dev` | Its `search_docs.js` currently fails for every query: Shopify's search backend rejects the skill's `api_name 'dev'` (HTTP 400). Shopify documentation was read directly on shopify.dev instead. |
| `shopify-custom-data` | Not needed for a new definition; the existing metafield/metaobject contracts (`custom.discount_code`, `custom.promotion`, size-chart metaobjects) were reviewed against [docs/PROMOTIONS.md](docs/PROMOTIONS.md) and [docs/SIZE-CHART-ADMIN.md](docs/SIZE-CHART-ADMIN.md). |
| `shopify-admin`, `shopify-functions` | Not used. The theme makes no Admin API calls and the discount design deliberately leaves eligibility to Shopify Admin; no Function is involved. |

### Validation tools executed (final run, after all changes)

| Gate | Result |
| --- | --- |
| TypeScript `tsc --noEmit` | Passed |
| Vitest | 44 files, **227 tests passed** |
| Vite production build + owned-asset sync | Passed; 49 owned assets, 2 entrypoints |
| Theme JSON (`check-json.mjs`) | Passed |
| Theme contracts (`theme-contracts.test.mjs`) | **6 passed** (one new test added here) |
| Customization reference freshness | Current (regenerated after a schema change) |
| Shopify Theme Check, `--fail-level suggestion` (strictest) | **152 files, no offenses** |
| `shopify-liquid` skill validator | 151/151 files passed; changed files re-validated |
| `npm audit` (production and dev) | 0 known vulnerabilities |

### Live testing environment

Shopify CLI development preview (`shopify theme dev`, store `gbhr1g-hm`), i.e. real Liquid rendering, real catalog, real Ajax cart and real Shopify checkout. Not a Vite preview. Desktop viewport and a 375×812 phone emulation. The browser pane ran hidden, which pauses `requestAnimationFrame`; frame-timing measurements were therefore impossible (see [Limitations](#limitations)).

### Documentation and code reviewed

All project Markdown (README, UPDATES, CUSTOMIZATION, the plans, prior audits, docs/*, the master plan and owner questionnaire), the 23 reference components in `E:\NKIL\example componenets` (identical to the repository copies apart from line endings; the comparison table in [docs/AUDIT-2026-10-25.md](docs/AUDIT-2026-10-25.md#comparison-with-all-23-selected-reference-files) remains accurate), and the source: commerce services and product components in full, the scroll/motion stack in full, every section schema programmatically (escaping, presets, labels), and repository-wide scans for dead modules, unused snippets, unsafe DOM sinks, secrets and store-specific strings.

## Changes made in this evaluation

| Change | Problem | Evidence |
| --- | --- | --- |
| New `snippets/video-sources.liquid`; used by `background-video.liquid` and `product-card.liquid` | **Confirmed.** Liquid's `video.sources` exposes only the HLS stream and the single largest MP4 (a real product returned `m3u8 606x1080` and `mp4 606x1080` only). The card's "pick the smallest ≥480p" loop therefore always chose 1080p: every desktop card hover streamed ~13 MB. Phones received the 23.3 MB 1080p hero because no phone video was configured. The snippet offers Shopify's lower rendition (same file name, different quality token) first and always ends with the original file. | All 11 derived URLs returned HTTP 200. Live: hover video played `SD-480p` (2.9 MB vs 13.4 MB); desktop hero stayed 1080p; 375px viewport selected `HD-720p` (14.7 MB vs 23.3 MB). A deliberately missing rendition fell back to the original and played. New contract test guards the fallback. |
| `templates/index.json`: "Riviera nights" expanding video URL | **Confirmed.** The URL returned **404** (its numeric suffix had been copied from the hero URL), so the section only ever showed its poster. Corrected to the file Shopify actually serves. | HEAD 200 for the corrected URL and its 720p rendition. |
| New setting Theme settings › Customer support › **Show these links instead of the contact information policy** (`support_replace_policy`) | **Code inspection, distribution risk.** `layout/theme.liquid` replaced Shopify's contact-information policy with theme links whenever any support field was filled. For another merchant that silently hides policy text they may be legally required to publish (business address, registration). Now opt-in, default off; Corsovelle's saved settings keep it on, so its page is unchanged. | Live: Corsovelle contact page still renders the mailto/tel links. Meta description fallback follows the same switch. |
| `snippets/background-video.liquid` | Had no LiquidDoc header (required for snippets by the Liquid skill). Added. | Validator passed. |
| `vite.config.ts` comment | Said the build is "readable output" while `minify: true`. Corrected and linked to the Theme Store implication. | — |
| `CUSTOMIZATION.md` | Regenerated generated settings tables for the new setting. | Freshness check passes. |

### Review of the other agent's uncommitted changes

A separate Codex session worked in this checkout during the evaluation (SEO pass, purchase-flow and carousel changes). Its edits were reviewed rather than assumed correct. Queued add-to-cart while a variant resolves, `reportValidity()` before AJAX add, the native-form fallback for file-upload line properties, and the >250-variant carousel guard are sound and covered by its new tests. The contact-policy replacement was made opt-in (above). Its SEO conclusions were spot-checked (below) and hold. Its editor screenshot ([evidence](docs/evidence/production-readiness-2026-10-25/editor-hero-settings.png)) shows the development theme open in the Theme Editor with the hero section selectable. That is Codex's evidence, not a full editor acceptance pass.

## Customer journeys verified live (Confirmed)

| Journey | Result |
| --- | --- |
| Homepage | One h1, no horizontal overflow, Lenis active, no theme console errors (only Shopify's dev-only `shop.app` frame CSP message). |
| Product page (Amaya) | Buy button disabled and labelled "Choose a Size" until a size is chosen; variant id input disabled while incomplete; sold-out XL disabled; valid `ProductGroup` JSON-LD. |
| Variant selection + add | Selected M and pressed Add to cart **twice during resolution**: exactly one line added (M ×1, Tk 1,900 from Shopify), URL updated to `?variant=…`, drawer opened, no error. |
| Sold-out protection | Direct `cart/add.js` with the sold-out XL id → Shopify 422 "already sold out". |
| Quantity change | Drawer + → M ×2, cart total Tk 3,800. |
| Invalid discount code | Code sent to Shopify, judged not applicable, removed again (`discount_codes: []`), honest explanatory message. |
| Checkout handoff | Drawer Checkout → Shopify checkout showing Amaya M ×2, ৳3,800 subtotal. Stopped before entering any customer data; no order placed. |
| Card quick add | Real variant ids; double-click added one unit; adding the "only 1 left" size twice → second refused with "The maximum quantity of this item is already in your cart." |
| Cart page | Line removal → "Your cart is empty". Test cart left empty. |
| Search | Predictive endpoint returns products; markup-like query not reflected unescaped; empty search shows a no-results state; unknown collection returns 404. |

## Findings by priority

No **critical** defect (broken checkout, wrong prices, purchasable invalid variants, corrupted cart, security vulnerability, incompatible Shopify code) was found open.

### High: fixed

1. Video payload (above). **Confirmed** and fixed.
2. Broken expanding-video URL (above). **Confirmed** and fixed.

### Medium: open, owner/store action

1. **Phone hero is still heavy.** Even at 720p the hero file is 14.7 MB on a connection-sensitive market. Upload a short, phone-framed clip as the hero's *Phone video* in the Theme Editor (the setting already exists), or pick the video with the Video picker (Shopify then also serves HLS adaptive streaming). **Confirmed** by file size.
2. **No social sharing image.** Homepage and some listing pages have no `og:image`. The theme correctly uses Shopify's native `page_image`; set the image in Shopify Admin › Online Store › Preferences. **Confirmed.**
3. **Automatic discount application is not proven against real codes.** No promotion slots are configured and no test discount exists. Creating one changes the live store, so it was not done. Behaviour is covered by unit tests (`discounts.test.ts`, `cart-discounts.test.ts`) and the protocol was checked against [Shopify's Ajax Cart API](https://shopify.dev/docs/api/ajax/reference/cart). Run the 8-step checklist in [docs/PROMOTIONS.md](docs/PROMOTIONS.md#testing-checklist-dev-store) before relying on it.
4. **Size charts and filters** remain merchant data work, as recorded in [docs/AUDIT-2026-10-25.md](docs/AUDIT-2026-10-25.md#essential-attention-before-release). The fit-finder credibility decision is still open with the owner.

### Low / Optional (approval needed)

- **GSAP on ordinary pages.** The 47.7 KB (gzip) GSAP + ScrollTrigger + SplitText chunk loads on most pages. Splitting simple reveals from SplitText could reduce parse work. Needs before/after traces. *Optional.*
- **Neutral distribution package** (see below). *Recommended before any sale.*

## Commerce and discounts (Code inspection + Confirmed where noted)

- **Cart** (`src/services/cart.ts`): one FIFO queue, line-key addressing, coalesced queued quantity changes, no automatic POST retry, ambiguous network failures reconciled by re-reading the cart, response shape validated. Bundled section rendering stays within Shopify's five-section limit.
- **Variants** (`variant-picker.ts`, `product-form.ts`): option-value ids + Section Rendering (Shopify's high-variant approach), latest-request sequencing, explicit size choice, submission only when the resolved id equals the form id and the state is `available`. Confirmed live above.
- **Discounts** (`services/discounts.ts`, `snippets/promotion.liquid`, `snippets/cart-discounts.liquid`): only existing Shopify codes; one new code per step by priority; rejected codes removed and not retried until the cart or codes change (no loops); shopper-entered and `/discount/CODE` codes never displaced; amounts shown only from Shopify allocations; no calculated promotional prices on cards or product pages. `/cart/update.js` `discount` usage matches Shopify's documented comma-separated, empty-string-clears format. Theme associations decide only where a code is *shown and tried*; Shopify Admin still decides eligibility. Merchants must keep the two in sync (documented).

## Motion and scrolling

**Code inspection:** one Lenis instance (desktop fine-pointer only, lazy, `autoRaf: false`) driven by GSAP's ticker with `ScrollTrigger.update` on Lenis scroll. That is the documented synchronisation pattern, with no second RAF loop. Touch stays native (`syncTouch: false`), with phone `ignoreMobileResize` to avoid URL-bar jumps. Lenis is bypassed for reduced motion, editor mode and Motion off, and stops while any overlay is open (scroll lock). Nested rails, dialogs and tab lists are excluded via `prevent`. `ScrollTrigger.refresh` is debounced on document height changes, section load/reorder/unload, tab changes, font and lazy-image loads, and bfcache restore. GSAP scenes are scoped with `gsap.matchMedia` contexts and reverted on re-run/teardown, so duplicate triggers cannot accumulate. `html.lenis` disables CSS `scroll-behavior: smooth`, avoiding double smoothing.

**Confirmed:** Lenis initialised on the homepage and took wheel input (`lenis-scrolling`).

**Not verified:** frame pacing, jitter and trigger timing under real scrolling. The hidden browser pane paused `requestAnimationFrame`. Needs a visible-browser or physical-device pass (Performance panel trace while wheel/trackpad scrolling the homepage and product page).

No animation was removed, simplified or disabled.

## Performance (measured)

Development preview, desktop, before the video fix: TTFB 1.14 s, DCL 3.05 s, load 4.39 s, CLS 0, LCP 7.9 s on the hero `<video>`, long tasks 650/96/58/53 ms, **22.4 MB transferred, 21.6 MB of it video**. Non-video transfer ≈ 1.3 MB across 143 requests (including Shopify's own scripts).

After the fix the hero still loads 1080p on desktop by design; card hovers and phones load the smaller renditions listed above. A full post-fix page-weight figure could not be captured because the hidden pane did not report finished media transfers. **These are dev-preview numbers, not Core Web Vitals.** The CLI preview adds hot-reload scripts and its TTFB is not representative. No Lighthouse score is claimed.

Build output (gzip): global JS 12.9 KB, product JS 9.9 KB, global CSS 31.7 KB, product CSS 6.2 KB, GSAP chunk 47.7 KB, OGL carousel chunk 25.7 KB, Lenis 5.4 KB.

## SEO (spot-checked, Confirmed)

Server-rendered Liquid on home, collection, paginated collection, product, contact and search pages: one h1 each, canonical URLs on the primary domain, meta descriptions (contact page excepted), `max-image-preview:large`, search results `noindex, follow`, valid JSON-LD (`OnlineStore` graph, `ProductGroup` with variant offers, `BreadcrumbList`), no `<img>` without `alt`. robots.txt and the sitemap index are Shopify-native. Content is in HTML before any animation, so motion does not hide it from crawlers. Detailed work and the Bangladesh/Google Shopping notes are in [docs/SEO-ADVANCED-AUDIT-2026-10-25.md](docs/SEO-ADVANCED-AUDIT-2026-10-25.md). International SEO is intentionally not used.

## Security (Code inspection + Confirmed)

- No Admin API tokens, private keys or credentials in source, theme files or built assets (pattern scan of `src/`, `theme/` and every built asset).
- No Admin API usage from the storefront; all commerce goes through Shopify's storefront Ajax/Section Rendering endpoints.
- Every `text`/`textarea`/`inline_richtext` setting printed inside an HTML attribute is escaped (programmatic scan of all 59 section and 2 block schemas found none unescaped). `innerHTML` use is limited to same-origin, Shopify-rendered section HTML.
- `npm audit`: 0 vulnerabilities. Third-party runtime code: GSAP, Lenis, OGL only, all bundled and served from Shopify's CDN.
- Failure states exist for picker resolution, cart mutations (including ambiguous outcomes), predictive search, facets and discount codes; hidden error templates were verified not to show spuriously.

## Commercial distribution

### Reusability

Positive: 59 configurable sections (45 with presets; the 11 without are main/template sections, as expected), shared reusable blocks, colour schemes, font pickers, motion settings, metafield/metaobject-driven product data with honest empty states, no dependence on specific products or collections in code, missing-image placeholders, >250-variant fallback, sold-out handling.

Blocking a clean install for another merchant (found by scanning for store-specific strings):

| Item | Where | Needed |
| --- | --- | --- |
| Corsovelle support email, phone, Instagram | `config/settings_data.json` | Neutral defaults in the distributed package |
| Homepage hero and story videos on corsovelle.com, Corsovelle copy | `templates/index.json` | Neutral demo template (videos don't transfer on install anyway) |
| `theme_name` "NK — Corso Velle", author "NKIL", docs/support URLs pointing at Shopify Help | `config/settings_schema.json` › `theme_info` | Product name, your documentation and support URLs |
| Riviera styling labelled as "the Corso Velle look" | `src/styles/components/riviera.css` (comment) | Cosmetic only |

Recommendation (**needs approval**): a small release step (e.g. `npm run package:distribution`) that packages the theme with a neutral `settings_data.json` and demo `index.json`, keeping Corsovelle's files untouched in the repository. This avoids damaging Corsovelle's setup.

### Licences

| Component | Licence | Private sale | Note |
| --- | --- | --- | --- |
| Shopify Skeleton (base) | Shopify modified MIT | Yes | Retained in [docs/LICENSES](docs/LICENSES/shopify-skeleton-theme.md). |
| Shopify Dawn (9 adapted sections) | Shopify theme licence: MIT terms limited to themes for Shopify | Yes, for Shopify themes | **Disqualifies the Theme Store.** |
| GSAP 3.15 (+ ScrollTrigger, SplitText) | Standard "no charge" licence | Probably yes | Prohibits use in no-code visual animation tools that compete with Webflow. A theme with editor animation presets is unlikely to be that, but the clause is subjective: get written confirmation from GSAP/Webflow before selling ([licence text mirror](https://scancode-licensedb.aboutcode.org/gsap-standard-no-charge-2025.html), [Webflow announcement](https://webflow.com/blog/gsap-becomes-free)). |
| Lenis | MIT | Yes | |
| OGL | Unlicense | Yes | |
| daisyUI, Flowbite, HyperUI, Heroicons, uiverse snippets | See [docs/LICENSES](docs/LICENSES) | Per those files | Recorded per section in [docs/SECTION-SOURCES.md](docs/SECTION-SOURCES.md). |
| Fonts | Shopify font picker (Shopify font library) | Yes | No bundled font files. |
| Brand imagery, videos, logo | Corsovelle's | **No** | Must not ship in a sold package. |

### Shopify Theme Store gaps

Per [Shopify's Theme Store requirements](https://shopify.dev/docs/storefronts/themes/store/requirements):

1. Dawn-derived sections are ineligible; rewrite or remove the nine documented adaptations.
2. No minified `.css` (set `cssMinify: false`; ES-module JS is exempt).
3. Theme and preset names must not contain a company name; one preset must carry the theme's name.
4. Measured Lighthouse averages: performance ≥ 60 and accessibility ≥ 90 on home, product and collection pages, desktop and mobile. Not measured.
5. Text style: 1,414 schema labels are hard-coded English. Not explicitly a Theme Store rule, but moving them to `t:` keys in `locales/en.default.schema.json` is expected for a translatable commercial theme.
6. Authentic demo content, full required-template review, and Shopify's manual review.

## Launch requirements for Corsovelle

1. Enter approved size-chart measurements and assignments ([docs/SIZE-CHART-ADMIN.md](docs/SIZE-CHART-ADMIN.md)); decide on the fit finder.
2. Configure Search & Discovery Size/Color filters (store-wide change; needs owner authorization).
3. Upload a phone hero video (or pick the hero via the Video picker).
4. Set the social sharing image (Admin › Preferences).
5. If promotions will be used: create the discounts in Admin, configure the Promotions slots, run the PROMOTIONS testing checklist.
6. Owner Theme Editor pass on a duplicate theme: save/reopen, add/duplicate/reorder/remove sections, mobile preview, app blocks ([docs/EDITOR_CUSTOMIZATION_QA.md](docs/EDITOR_CUSTOMIZATION_QA.md)).
7. Real-device checks: iOS Safari and a mid-range Android: scrolling, drawers, size selection, keyboard, VoiceOver/TalkBack.
8. Lighthouse / trace on the unpublished built theme (home, collection, product; mobile and desktop) and record the numbers.
9. One authorized test order and refund (COD flow), plus contact-form and newsletter delivery.

## Limitations

- **Theme Editor:** the in-app browser was not signed in to Shopify Admin and credentials were not entered, so no editor interaction was performed by this evaluation.
- **Motion smoothness:** not measurable with a hidden pane (no `requestAnimationFrame`).
- **Catalog conditions not present in the store** (product with no images, empty collection, many-option products, missing metafields, long descriptions, multiple real discounts) were reviewed in code and unit tests, not live.
- **Not tested:** payment completion, real devices, assistive technology, apps/selling plans, Lighthouse/Core Web Vitals.
- The `shopify-dev` skill's search is broken upstream (see Method).

## Shopify documentation that influenced decisions

- [Ajax Cart API reference](https://shopify.dev/docs/api/ajax/reference/cart): `discount` format, five-section bundled rendering limit, `sections_url`.
- [`video_source` object](https://shopify.dev/docs/api/liquid/objects/video_source) and the live `sources` probe: basis for the rendition fix.
- [Theme performance best practices](https://shopify.dev/docs/storefronts/themes/best-practices/performance): Lighthouse ≥ 60 Theme Store rule, server-rendered content.
- [Theme Store requirements](https://shopify.dev/docs/storefronts/themes/store/requirements): Skeleton-only codebase, no Dawn derivatives, no minified CSS, naming, accessibility ≥ 90.
- [Cart template](https://shopify.dev/docs/storefronts/themes/architecture/templates/cart) and [cart object](https://shopify.dev/docs/api/liquid/objects/cart): discount display and `total_discount`.

Nothing was published, no commit was made, no store settings, products, discounts or policies were changed in Shopify Admin, and the test cart was left empty.
