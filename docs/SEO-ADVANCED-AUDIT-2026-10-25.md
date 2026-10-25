# Advanced SEO audit and implementation

25 October 2026, Asia/Dhaka. Native Shopify Online Store 2.0, Bangladesh-focused.

## Outcome and scope

The development theme now has stronger metadata fallbacks, product variant markup, barcode
validation and image loading. GSAP, ScrollTrigger, Lenis, the WebGL carousel, gallery interactions,
animation timings, styling and merchant content have been retained. No SEO app, frontend framework,
international storefront, custom sitemap or robots override was added. Nothing was published.

The public store and the development theme are separate implementations. The public store still
serves its existing theme; editing this repository or syncing the development theme does not
publish these changes. An authenticated Search Console, Merchant Center, Bing Webmaster Tools or
Shopify sales-channel dashboard was not available to this audit. CLI theme access is not evidence
of access to those accounts.

Evidence in `docs/evidence/seo-2026-10-25/`:

- `source-inventory.json`: initial static inventory of 314 authored source/config/test files and
  95 Markdown documents. Generated assets are checked through the build instead of treated as a
  second authored implementation. Signal counts are review aids, not proof of defects.
- `baseline/audit.json`, `published/audit.json`, `after/audit.json`: 73 URLs per crawl, covering
  all URLs in the native product, collection, page and blog sitemaps, plus pagination, sorting,
  availability filters, search, cart, policies, variant/tracking links, a collection-scoped product
  URL, and a deliberately nonexistent product. Each records response status, redirects, metadata,
  headings, image attributes, internal links and parsed JSON-LD.
- `baseline/robots.txt`, `baseline/sitemap.xml`: actual native public responses, not replacements.
- `browser-baseline/`, `browser-after/`: desktop and mobile viewport screenshots, performance
  observations and no-JS / blocked-module checks for home, collection and product.
- `interactions.json`: mobile/desktop gallery, variant, cart, menu and sorting regressions.
- `link-checks.json`: collection directory, privacy policy, HTTP and www redirect checks.
- `checkout-handoff.json`: successful native checkout handoff with the session path redacted;
  no customer details or payment were submitted.
- `mobile-home-repeats.json`, `mobile-home-poster-after.json`, `card-video-hover.json`:
  targeted network/performance and hover checks around redundant video-poster removal.
- `rich-results.txt`, `rich-results.png`: Google test attempt, which requested sign-in.

The documentation review covered the current README, customization reference, architecture and
product contracts, original architecture/collection/product/motion/performance specifications,
prior codebase/storefront/customer audits, repair notes, promotions, sizing and model-information
contracts, and the previous SEO report. Historical plans are not treated as current implementation
or as passing test evidence. Static inspection spans sections, snippets, templates, blocks, runtime,
styles, build and tests; browser checks sample representative behavior, not every editor setting.
There are no published articles to test: the article path was reviewed in source and Theme Check.

## Already implemented and preserved

| Area | Existing implementation and verified behavior |
| --- | --- |
| Architecture | Liquid renders products, descriptions, links, prices, option data and content. Custom elements progressively enhance it. React/Hydrogen and client-side product rendering are absent. |
| Metadata | One central `meta-tags` snippet; Shopify `page_title`, `page_description`, `canonical_url` and `page_image` provide the primary data. Custom Admin SEO fields remain authoritative. |
| Canonicals | Page two retains `?page=2`; variant, tracking, filtered and sorted samples consolidate to the appropriate main URL. No blanket page-one canonical or collection noindex was introduced. |
| Discovery | Product links and numbered pagination exist in raw HTML. Infinite loading has crawlable pagination fallbacks. All 34 catalog products were linked somewhere in the audited HTML graph. |
| Structured data | `OnlineStore`/`WebSite` on home, `ProductGroup` and variant `Product`/`Offer` on products, native article markup and conditional visible breadcrumb markup. Theme product schema has one owner. |
| Price integrity | Variant price and currency come from Shopify. Real compare-at prices are separate strikethrough specifications. Conditional promotion codes do not manufacture lower schema prices. |
| Images | Real `<img src>` markup, responsive CDN images and intrinsic dimensions for theme-owned photography. Product-title alternatives are used when merchant image alt text is absent. |
| Motion | GSAP contexts and component disposers, reduced-motion handling, existing CSS recovery for failed modules, native touch scrolling and optional Lenis wheel enhancement. |
| Product facts | Descriptions, composition, fit, care, origin, model information and measurements are server-rendered when the merchant supplies them. Native `<details>` retains its content in HTML. |

The native sitemap index and its four child maps returned 200 with primary-domain page URLs.
The product map includes the homepage plus 34 products; the other maps contain 22 collections,
one content page and the News blog. No foreign page host was found in these maps. Native Shopify
robots rules already handle private endpoints and several query traps; they were retained.

The nonexistent product returned 404 rather than a soft 404. HTTP and www each redirected once
to the primary HTTPS host. The collection-scoped product sample ultimately reached its main
product URL; no loop was observed. This is not a store-wide redirect database audit.

## Findings and fixes

Severity reflects customer/search impact, not a promise of ranking gain. “Fixture” means verified
with synthetic data rendered through the actual Liquid snippets, not a fabricated live product.

| Severity | Finding and root cause | Action / responsible files |
| --- | --- | --- |
| Moderate | 24/73 baseline pages omitted descriptions. Many collections have no Admin description; policies have useful content but no supplied page description. | Resource-aware fallbacks: collection title/store/actual count, existing resource content, native policy body, or the same configured support introduction displayed on contact-information. Existing native SEO descriptions win. `meta-tags.liquid`, new `seo-text.liquid`. Final omissions: 5/73. |
| Moderate | Rich-text boundaries can collapse when tags are stripped. | Shared plain-text normalization preserves paragraph, list, line-break and table-cell boundaries for fallback metadata and product JSON-LD. Native descriptions are not replaced with generated sales copy. Already flattened, list-shaped Admin SEO descriptions still need editing. |
| Minor | Case-sensitive brand matching can append a second store-name suffix. | Case-insensitive comparison, with a shop-name fallback for missing titles. Custom title wording is retained. Verified by fixtures. `meta-tags.liquid`. |
| Opportunity | No explicit permission for large search-result image previews. | Added `max-image-preview:large` for otherwise public pages. Existing utility-page `noindex, follow` remains. This permits a preview size; it does not promise a search feature. `meta-tags.liquid`. |
| Moderate | Barcode validation accepted any numeric string with a GTIN-shaped length. | Require valid length, digits, a nonzero value and GS1 modulo-10 check digit. Emit the specific `gtin8/12/13/14` property. This checks syntax/checksum, not GS1 registration or ownership. New `structured-data-gtin.liquid`, `structured-data-offer.liquid`. |
| Moderate | A selected variant outside Liquid's initial variant/loop window could be absent from schema. | Render up to 50 initial variants plus the exact selected variant if missing, through one reusable snippet. Both variant Product and Offer have the exact landing URL. No thousands-of-offers payload. Verified with an outside-window synthetic variant. `structured-data.liquid`, new `structured-data-variant.liquid`. |
| Moderate | Schema size recognition did not honor configured custom size names such as Waist. | Reuse `size-option.liquid`, already used in the purchase UI. Size recognition and schema now agree. `structured-data.liquid`. |
| Moderate | Only the first gallery image received eager/high priority, even when a slider opens another variant image. | Prioritize the selected image for slider deep links. Keep the first image eager for the no-JS first frame; collage keeps its visible first image high priority. Exactly one high-priority photo. Verified in Liquid fixtures. `product-media.liquid`. |
| Moderate | Grid cards assumed 50vw mobile sources even when the actual grid has one column. | Derive default `sizes` from configured column counts; explicit carousel/editorial sizes still win. This restores source sharpness without changing the card dimensions. `product-card.liquid`. |
| Moderate | Direct visits to later collection pages marked all first-row product images lazy. | Make the first four cards eager on every paginated page, as on page one. `main-collection.liquid`. |
| Minor | Repeated hero-split/overlay sections always requested eager, high-priority images regardless of position. | Follow the existing main hero's section-position policy: high/eager for the first section, lazy/auto otherwise. No image resolution or styling changes. `hero-split.liquid`, `hero-overlay.liquid`. |
| Moderate | Background video initially assumed it was visible, briefly starting hidden/offscreen media before IntersectionObserver ran. | Wait for the first visible observation before autoplay. Existing play/pause, slideshow intent, reduced motion and cleanup remain. `background-video.ts`; regression in `background-video.test.ts`. |
| Moderate | Hidden card-video posters downloaded on mobile despite `preload="none"`, competing with visible content. | Remove the redundant poster from the manual hover-video element. The existing primary product photo remains visible until the first real video frame, exactly as before. Nine poster requests disappeared in the sampled homepage runs; desktop hover playback and return to the primary photo passed. `product-card.liquid`. |
| Minor | Blog images lacked a title fallback; the article's `default` filter was applied after the generated image tag instead of to its alt value. | Resolve alt before calling `image_tag`, preserving real merchant alternatives. Source/Theme Check verified; no published articles exist for a live article test. `blog.liquid`, `article.liquid`. |

No global stylesheet, animation duration/easing, scrolling strength, product copy or business policy
was changed for SEO. Build outputs and the generated asset-loader/ownership files were synchronized
from the current shared workspace; unrelated pre-existing changes were retained.

## Structured-data decisions

The existing variant model is appropriate for this clothing catalog. An `AggregateOffer` is not
added over exact variant Offers merely to increase the number of schema types. Single default-
variant products keep a single `Product`. Availability, real sale prices, missing identifiers,
custom size names, Unicode/quotes and outside-window selections have fixture coverage.

The initial variant list is deliberately bounded. It is not claimed to describe all 2,048 possible
Shopify variants; the selected landing variant is always included. The current catalog is small.
A Merchant Center product source, when eligible, must still cover the complete variant catalog.
No SKU is fabricated from a Shopify ID. Missing identifiers remain an Admin data issue.

`MerchantReturnPolicy`, shipping rates, return windows, gender, age group, item condition, MPNs,
reviews and ratings are not guessed from prose or clothing photos. Native policy prose is not a
safe structured source for return exceptions, applicable countries or fees. Configure real
shipping/returns in eligible Google account settings; a future theme policy schema should consume
an agreed, maintained structured source and match the visible policy. Do not duplicate a second
copy of those terms solely for SEO without a maintenance owner.

No duplicate theme-owned Product script appeared in the sampled development pages. This cannot
prove what an app may inject after publication or an account-level configuration change. Recheck
the DOM after enabling review/SEO apps or sales-channel integrations.

## Remaining catalog and Admin issues

| Priority | Evidence / action | Performance and configuration impact |
| --- | --- | --- |
| High | All 258 product photos lack merchant-written alt text. Add accurate garment/view/detail alternatives in Products → Media. Title fallbacks are useful but cannot describe the photograph. | Admin only; no additional JS or layout cost. Do not add keywords unrelated to the image. |
| High | All 140 public variants have no SKU. Populate stable real SKUs. Add manufacturer GTINs only when they exist; verify channel-specific brand/MPN/identifier settings rather than inventing values. | Admin/feed work; theme reflects changes automatically. |
| High | Three product-title pairs repeat: Andre Linen Shirt, Bellagio Knit Polo, Firenze Gurkha Flared Trouser. Bottoms, Jeans and T-shirt collection title pairs also repeat. | Review whether these are separate colorways, overlapping categories or true duplicates. Approve descriptive titles/merges/redirects in Admin after checking backlinks and sales history. No automatic canonical consolidation. |
| High | 19 product bodies are under 120 plain-text characters in the current public JSON snapshot. Several list-shaped descriptions produce glued words in native SEO fallback text. This is a review flag, not a Google minimum-length rule. | Owner-approved product facts and SEO descriptions; no invented materials, fit, reviews or origin. Write summaries plus real detail, not padded word counts. |
| Moderate | `/pages/contact` and `/blogs/news` were not linked in the sampled HTML graph. These are orphan candidates, not proven site-wide orphans. The News blog currently has no articles. | Link the useful contact page from an appropriate existing menu. Publish real editorial content before promoting an empty blog. Menu/content edits require Admin approval. |
| Moderate | The standalone refund policy still has an empty extra h1 from its Admin body. Product policy embeds already demote policy headings. | Remove the empty heading in Settings → Policies. Do not rewrite the policy through theme string substitutions. |
| Moderate | Final descriptions remain absent on empty News/Leather Goods, the content-empty Contact page, cart and the 404 sample. | Write useful content/SEO descriptions for real landing pages. Cart is noindex and the 404 has a 404 response; neither needs fabricated marketing metadata. |
| Moderate | Favicon, homepage social-sharing image, real social profiles and complete product category attributes remain merchant configuration tasks where absent. | Native theme/Preferences/product fields; no additional app. Organization fields must represent the actual business. |
| Moderate | Shipping policy text currently mentions international delivery, while this project targets Bangladesh. | Owner must confirm operational scope and policy accuracy. The audit did not change policy content, add markets or translate pages. |

The product facts contract already supports `custom.fabric`/`custom.materials`, `custom.fit`,
`custom.care`/`custom.care_instructions`, `custom.origin`, `custom.color_name`, sibling products,
model information and the existing size-chart system. Use those maintained Admin fields. Set
Shopify product category and real apparel attributes; keep corresponding feed data consistent.

Useful owner-reviewed content: a sizing/measurement guide, fabric-care articles tied to actual
materials, factual collection introductions, and a delivery/exchange FAQ that quotes real current
Bangladesh terms. Transactional collection/product copy and informational guides have different
purposes. No substantial copywriting or keyword-location insertion was applied automatically.

## Bangladesh, Google Shopping and AI search

Google's current standard [supported-country/currency table](https://support.google.com/merchants/answer/160637?hl=en)
does **not list Bangladesh or BDT**. Its [beta-country guidance](https://support.google.com/merchants/answer/7101265?hl=en)
says participation may be limited to certain retailers. Verify actual Bangladesh eligibility in
the merchant account or with Google before planning Shopping ads/free-listing exposure. An
unrelated regional-availability add-on's country list does not establish Shopping eligibility.
Do not change BDT, claim a foreign business location or configure foreign targeting to work around
eligibility. Organic Search, image discovery and accurate product markup remain useful.

The theme's app-embed/configuration and public output were inspected, but they cannot establish
whether the **Google & YouTube** channel is installed, linked, approved or syncing correctly.
Inspect the existing channel first in Admin → Sales channels. Do not install another feed app or
create a competing custom feed. If eligible, verify product availability to the channel, source
language, country/currency, apparel attributes, real identifiers, prices/stock, shipping, returns,
website claim and disapprovals. Use clean product imagery; on-page badges are separate from image
files. Compare-at sales and conditional promotions must follow the actual channel/Google rules.
[Shopify's native channel guidance](https://help.shopify.com/en/manual/online-sales-channels/marketplaces/google/getting-setup/syncing-products)
explains the product-source boundary.

For AI features, factual text, crawlable links, accessible images and consistent structured data
are the practical foundation. Google explicitly documents [no special AI schema or text-file requirement](https://developers.google.com/search/docs/appearance/ai-features).
The native robots response has public crawl access plus platform-specific restrictions; no
blanket search-bot block was found. The public robots response also advertises Shopify's native
agent endpoints; their presence is not a ranking or AI-citation result.

For ChatGPT Search, follow [OpenAI's OAI-SearchBot documentation](https://developers.openai.com/api/docs/bots).
Search crawling and GPTBot training preferences are independent. For Perplexity, use its
[published crawler guidance](https://docs.perplexity.ai/docs/resources/perplexity-crawlers).
Robots permission is not proof of successful bot fetches through a CDN/WAF: authenticated logs
or webmaster diagnostics are needed. No speculative hidden content, AI keyword metadata,
`llms.txt`, visitor-triggered indexing pings or automatic training-policy change was added.

No verified physical business location was established. Recommend Google Business Profile only
after confirming a qualifying real customer-facing location/service model; never invent an address.

## Performance and regression evidence

These are unthrottled Chromium desktop-host **lab observations**, one run per page/viewport.
They are not Lighthouse scores, real phones, CrUX, field INP or evidence of a causal speed gain.
The exact values, resources, browser version and screenshots live in the browser reports.
Do not compare an authentication/error page's fast paint to storefront performance: the browser
script explicitly rejects non-200 responses and requires the real page heading before measuring.

The baseline recorded mobile LCP of 1.628s home / 1.444s collection / 0.936s product and desktop
LCP of 1.816s / 1.328s / 1.080s. Baseline desktop home CLS was about 0.085, which is near the good
threshold and deserves field monitoring. The broad after-run recorded mobile home 5.360s,
collection 1.344s, product 1.604s; desktop 1.896s / 1.544s / 1.112s. The slow mobile home result
triggered a network investigation rather than being omitted or called an improvement.

Three mobile-home follow-ups recorded 2.192s / 2.172s / 2.508s. Each downloaded nine hidden 720px
card-video posters. Removing their redundant poster attributes eliminated all nine requests in
three further runs; cold observed poster transfers had totaled about 931KB. The further runs were
2.344s / 1.720s / 1.856s, median 1.856s versus 2.192s. That is useful small-sample lab evidence;
network/cache variability and concurrent workspace work prevent treating it as a controlled field
speed claim. `browser-after/report.json` precedes this final poster optimization; the targeted
poster-after report and hover check cover that last change.

GSAP's shared chunk is about 47.7KB gzip, the global entry 12.9KB, Lenis 5.4KB and the product
entry 9.9KB in the final shared-workspace build. Global CSS is about 31.7KB gzip and product CSS 6.2KB. Page totals include other
chunks and platform/app code; these figures are not whole-page budgets. The existing proposed
60KB home startup-JS target is not established as achieved. WebGL code already waits near the
viewport; fonts use swap, module entries defer execution, and lifecycle cleanup is retained.

Next performance work should use production traces on a midrange phone: separate theme animation
work from Shopify/app/analytics tasks, inspect font/header shifts, video transfer and image decode,
then optimize measured hotspots. Do not strip animations, replace libraries or change scroll/easing
settings for a score. The fixed video visibility gate avoids unnecessary offscreen playback;
the tests prove the lifecycle change, not a measured bandwidth or field-CWV improvement.

| Check | Actual result |
| --- | --- |
| TypeScript | Passed. |
| Vitest | 219 tests across 43 files passed after the video fix; the final shared-workspace check passed 227 tests across 44 files, including concurrent changes retained from other work. |
| Liquid SEO fixtures | 19 tests passed: native metadata precedence, canonical pagination, index/noindex policy, collection/policy fallbacks, GTIN checks, prices, stock, single/group variants, Unicode, custom size names, selected variants outside the window and gallery priorities. |
| Production build and sync | Passed. |
| Theme JSON and contracts | Strict JSON parse and five theme contract tests passed; generated customization reference current. |
| Shopify Theme Check | 152 files, zero offenses in the latest checked shared workspace. |
| Final raw HTML crawl | 73 URLs, no Liquid errors, valid JSON-LD syntax, one title/canonical each; expected 404 retained. Descriptions omitted on 5 pages instead of 24. |
| Browser content fallbacks | Home/collection/product headings and links remain without JS and with theme modules blocked. Product description remains in HTML. Native no-JS option links exist when JS is disabled. |
| Motion/browser | Representative pages initialize GSAP/ScrollTrigger and desktop Lenis; native mobile scrolling remains. No overflow or uncaught page errors in the successful sampled runs. |
| Interactive commerce | At 390px/1440px: thumbnail navigation, zoom/Escape, selecting M, exact variant add, quantity 1→2, removal and empty cart, and AJAX sorting passed. Mobile menu open/close passed. Fresh test carts were cleaned up. |
| Checkout | Native POST `/cart` checkout control was enabled and a fresh test cart reached “Checkout - Corso Velle” with Bangladesh delivery fields. The test line was removed afterward. No customer data, payment or order was submitted; accelerated checkout was not tested. |
| External structured-data validators | Google Rich Results Test asked for sign-in; Schema.org's automated UI attempt did not produce a completed result. Local JSON parsing/fixture success is not advertised as an external eligibility pass. |

The image scanner includes platform-generated fallback `<img>` elements inside native video output.
Those can lack alt/dimensions; an inspected example is the video fallback poster, not a missing
dimension on the visible product photograph. Do not treat the raw count alone as a demonstrated
layout shift. Theme-owned gallery photos keep intrinsic dimensions and the frame's existing ratio.

Not established: real-user CWV, physical iOS/Android, screen-reader certification, every section
configuration/app block, articles with real content, all high-variant purchase scenarios, feed
approval, indexed URL counts, rankings, conversions or AI citations. Concurrent pre-existing work
exists in this shared workspace; bundle/performance differences are not attributed solely to SEO.

## Account setup and monitoring

1. In Google Search Console, use a **Domain property** for `corsovelle.com` and add the provided DNS
   TXT verification record through the real DNS provider. A Domain property does not need a theme
   tag. Keep verification ownership/account access with the business.
2. Submit the existing `https://corsovelle.com/sitemap.xml`. Check child-map fetches and coverage.
   A fetched sitemap is not proof of indexing. Review Pages exclusions and inspect actual examples
   of discovered/crawled-not-indexed, duplicates, blocked URLs, soft 404s and redirect errors.
3. After an authorized publication, inspect canonical product/collection URLs, page two and a
   variant link. Compare crawled/live HTML, screenshot, declared vs Google-selected canonical,
   fetch access and last crawl. Use Rich Results Test and Schema Markup Validator on the public
   version; fix required-property errors and evaluate optional warnings against real available data.
4. Watch Product snippets, Merchant listings and Breadcrumbs reports where available. Configure
   actual shipping/return account settings only if supported and eligible. Missing optional schema
   fields are not a reason to invent policy facts.
5. In Bing Webmaster Tools, import the verified Search Console property or use DNS verification.
   Submit the same native sitemap; review URL Inspection, crawl/indexing diagnostics and search
   performance. Check existing platform IndexNow support before considering another integration.
   No client-side IndexNow implementation or app installation is necessary for this theme work.
6. Measure field CWV at the 75th percentile: LCP ≤2.5s, INP ≤200ms, CLS ≤0.1. Segment mobile and page
   types using Search Console/Shopify web performance reports when enough traffic exists. Use
   repeatable lab traces to diagnose, not to declare field compliance.
7. Track search queries/landing pages, product impressions/clicks and image results before/after
   publication over a sensible period. Annotate catalog, campaign and app changes. No rank/citation
   improvement is claimed from code completion.

No monitoring automation was scheduled. This section is an owner-operated runbook.

## Reproducing the checks

Normal repository checks: `npm run typecheck`, `npm test`, `npm run build`, `npm run check:json`,
`npm run check:contracts`, `npm run check:theme`.

- Start an authorized Shopify development preview, then run
  `node scripts/seo-audit.mjs --base http://127.0.0.1:9292 --out <evidence-folder>`.
  The script reads the public sitemap/catalog and storefront; it does not edit Admin.
- With optional `python-liquid` available: `python scripts/verify-seo-liquid.py`.
  It is a test renderer, not a storefront dependency. It does not prove Shopify drop behavior by itself.
- With optional Playwright available, set `PLAYWRIGHT_MODULE` to its module URL and, if needed,
  `CHROME_PATH` to a browser executable. Run `node scripts/verify-seo-browser.mjs <evidence-folder>`.
- `node scripts/verify-seo-commerce.mjs` exercises isolated development carts and removes its test
  product. Run against the development preview, not a customer's existing browser session.

The remaining work is mainly verified business/catalog content, account eligibility and
post-publication monitoring. Substantial description/brand rewrites, duplicate merges/redirects,
new apps, experimental search features and major visual changes remain owner decisions.

## Files changed by this SEO pass

- Runtime/test: `src/components/media/background-video.ts`, `tests/unit/background-video.test.ts`.
- Central SEO: `theme/snippets/meta-tags.liquid`, `structured-data.liquid`,
  `structured-data-offer.liquid`; new `seo-text.liquid`, `structured-data-gtin.liquid`,
  `structured-data-variant.liquid` in the same snippets folder.
- Photography/content markup: `theme/snippets/product-card.liquid`, `product-media.liquid`;
  `theme/sections/main-collection.liquid`, `hero-split.liquid`, `hero-overlay.liquid`,
  `blog.liquid`, `article.liquid`.
- Repeatable checks: `scripts/seo-audit.mjs`, `verify-seo-browser.mjs`,
  `verify-seo-commerce.mjs`, `verify-seo-liquid.py`.
- Documentation/evidence: this report, `docs/SEO.md`, `README.md`, `UPDATES.md`,
  `docs/evidence/seo-2026-10-25/`.
- Generated build outputs: owned `theme/assets/nk-*` files, `theme/snippets/nk-assets.liquid`
  and `assets.owned.json`, synchronized from the whole current shared workspace.

Other files changed concurrently are not claimed as SEO-pass edits. In particular, this pass
did not author the concurrent video-source, discount, carousel-data or infinite-scroll changes.
