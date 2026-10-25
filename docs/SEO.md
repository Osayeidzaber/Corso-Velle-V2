# Search, structured data and AI discoverability

> Historical first-pass report. The [advanced SEO audit and implementation](SEO-ADVANCED-AUDIT-2026-10-25.md)
> supersedes the metadata/GTIN/variant details, records the latest tests, and adds an important
> Bangladesh Shopping eligibility limitation. The evidence below belongs to the earlier pass.

Audit and implementation date: 25 October 2026 (Asia/Dhaka). Scope: the NK theme in `theme/`,
the catalog and Shopify-generated files on `corsovelle.com`, Bangladesh only (no international SEO).

The published storefront at `corsovelle.com` runs a **different theme** ("Corso-Velle/main",
schema 4.1.3). This theme's changes were rendered and validated on the development theme through
`shopify theme dev`; nothing below is live until this theme is published.

## How SEO works in this theme

Everything comes from Shopify admin; no theme code changes are needed when products change.

| Output | Source | File |
| --- | --- | --- |
| `<title>`, meta description | Each resource's **Search engine listing** (title, description), else Shopify's fallback from its title/description. Pages with no description get none rather than a duplicated store description. | `snippets/meta-tags.liquid` |
| Canonical | Shopify `canonical_url` (drops filter/sort parameters, keeps `?page=`). | `snippets/meta-tags.liquid` |
| `noindex, follow` | Internal search results, cart, gift cards, customer pages only. Shopify's robots.txt no longer blocks `/search` or `/cart`. | `snippets/meta-tags.liquid` |
| Open Graph / X cards | Title, description, URL; image is the product/collection/article image, else the **social sharing image** in Online Store > Preferences. Product price from the selected variant. | `snippets/meta-tags.liquid` |
| Product JSON-LD | `ProductGroup` + one `Product` per variant (see below), or one `Product` for single-variant items. | `snippets/structured-data.liquid`, `structured-data-offer.liquid` |
| Organization / WebSite | Home page: `OnlineStore` (name, logo from Theme settings > Logo, store description, social links from Theme settings > Social media) and `WebSite` (site name). | `snippets/structured-data.liquid` |
| BreadcrumbList | Rendered beside a **visible** breadcrumb only: collection banner trail, and product trail when the product section's "Show breadcrumbs" is on (off by default). | `snippets/breadcrumb-schema.liquid` |
| Article JSON-LD | Shopify's own `article | structured_data`. | `snippets/structured-data.liquid` |
| Sitemap, robots.txt | Shopify-native. The theme has no `robots.txt.liquid` and no sitemap generator; keep it that way. | — |

### Product structured data

Replaces Shopify's `product | structured_data` (verified on the live store: it emits no `size`,
`color`, `variesBy`, or SKU/GTIN per variant). Per variant:

- `size` / `color` / `material` / `pattern` from option names containing size, color/colour,
  material/fabric, pattern/print; `variesBy` lists those dimensions.
- `sku` when set; `gtin` only when the barcode is 8, 12, 13 or 14 digits.
- `offers`: variant price (BDT from `cart.currency`), `InStock`/`OutOfStock` from
  `variant.available`, variant URL, and a `StrikethroughPrice` only for a real compare-at price.
- Group level: name, description (plain text), up to 10 images, brand (vendor), Shopify category,
  `material` from `custom.fabric`/`custom.materials` (else Shopify's Fabric category metafield),
  pattern from Shopify's Pattern category metafield, `color` from `custom.color_name` when colour
  is not an option.

**Discount codes are never in structured data.** Codes connected in Theme settings > Promotions
are shown as codes on the storefront but only Shopify's cart confirms them (see
[PROMOTIONS.md](PROMOTIONS.md)), so advertising a reduced price to Google would be unverified.
No reviews, ratings, shipping promises, return windows or condition are emitted: the store
has no source for them in the theme. Configure shipping and returns in Google instead (below).

### Animation changes made for crawlability (no visible change)

- `<nk-text>` split headings (product title, hero, collection and search headings) used to insert a
  hidden copy of the text next to the animated pieces, so the rendered h1 read
  "Bellagio | Knit PoloBellagio | Knit Polo". The heading now carries an `aria-label` and the
  pieces stay `aria-hidden` (the pattern GSAP SplitText uses). Same animation, single text copy.
- Letter-swap nav links held every letter twice plus a hidden copy ("Shop" read "ShopSShhoopp" as
  link text). Both rolling copies are now drawn by CSS from `data-c`; the label is in the HTML once.
- Already crawl-safe and left untouched: motion pre-hiding applies only after `html.nk-anim` is
  set by script, with a 3 s CSS failsafe; all headings, product copy, descriptions (inside
  `<details>`), menus and pagination links are server-rendered Liquid; infinite scroll keeps the
  numbered pagination links in the HTML.

Other fixes: product breadcrumb "Collections" now links to `/collections` (it pointed at
`/collections/all`) and picks the product's most specific collection instead of "All Products";
product-card images carry the media alt text (fallback: product title); article images fall back to
the article title for alt text; "Home" and "tagged" are translatable.

## Validation performed

| Check | Result |
| --- | --- |
| Shopify Theme Check | 148 files, 0 offenses |
| TypeScript, Vitest | Pass; 213 tests including new `tests/unit/seo-text.test.ts` |
| Theme JSON, source contracts | Pass |
| Rendered HTML (dev theme, 11 URLs: home, 3 products incl. a collection-scoped product URL, collection, paginated collection, list-collections, search, cart, contact, blog) | All 200, no Liquid errors, every JSON-LD block parses, canonical and schema URLs on the primary domain, `noindex` only on search/cart, one `<h1>` per page except products, where the refund policy text adds an empty second one (finding 3) |
| Breadcrumb schema vs visible trail | Match, with product breadcrumbs temporarily enabled; template restored byte-identical |
| Browser regression (desktop) | Hero, Lenis smooth scroll, GSAP reveals, clothes rack, carousel autoplay, product title animation and size picker all running; no theme console errors. Letter-swap roll checked on focus (pointer hover could not be simulated in the pane; it uses the same rule). |

**Not run:** Google Rich Results Test and Schema Markup Validator (need a public URL: run them on
the theme preview link or after publishing), Lighthouse/PageSpeed (no before/after measurement was
taken; no performance changes were made), physical mobile devices, Search Console/Merchant Center.

## Store findings that need admin work (not theme code)

From `corsovelle.com/products.json`, sitemaps and the rendered pages on 25 October 2026:

1. **Image alt text: 0 of 258 product images have alt text.** Add it in Products > media > Add alt
   text, describing the image ("Striped cream knit polo, quarter-zip, front view"). The theme now
   uses it on product pages, cards, Open Graph and image search.
2. **SKUs and barcodes: 0 of 140 variants have either.** Add SKUs (feeds and Merchant Center use
   them). Add GTIN barcodes only if the products really have them; own-brand clothing without
   GTINs is normal. Then mark "Product has no GTIN" in the Google & YouTube app.
3. **Refund policy** (Settings > Policies) starts with an empty `<h1><br></h1>` and contains
   ChatGPT copy attributes (`data-start`, `data-end`). Because the policy is shown on product pages,
   this adds a second, empty h1 to every product. Delete the empty heading and re-paste the text as
   plain text.
4. **Duplicate products:** `bellagio-knit-polo` / `-1`, `andre-linen-shirt` / `-1`,
   `firenze-gurkha-flared-trouser` / `-1` share titles. If they are colour variants, give each a
   colour in the title and `custom.color_name` (the theme's sibling swatches already support this),
   or merge them. Otherwise delete one and add a URL redirect.
5. **Overlapping collections in the sitemap:** `t-shirts`/`t-shirt`, `jeans`/`jeans-1`,
   `bottoms`/`bottoms-1`, `polo`/`knit-polo`, `linen`/`linen-shirt`, `shackets`/`designer-shacket`.
   Keep one of each, redirect the other, and write a short, factual description for each kept one.
6. **Short or list-shaped descriptions:** 18 products have under 120 characters. Descriptions written
   as "- item- item" become meta descriptions like "- Breathable textured knit fabric- Classic polo
   collar". Use a real bulleted list and a one-sentence summary, and fill each product's
   Search engine listing description.
7. **Missing identity settings:** no favicon (Theme settings > Logo > Favicon: Google shows it in
   results), no social sharing image (Online Store > Preferences: home page shares have no image),
   no social profile URLs (Theme settings > Social media: used for `sameAs`). The contact page has no
   SEO description.
8. **Product metafields worth filling** (Settings > Custom data > Products, all already read by the
   theme): `custom.fabric`, `custom.care`, `custom.fit`, `custom.origin`, `custom.color_name`, size
   charts. Also set the Shopify product category and its category metafields (Color, Fabric,
   Pattern, Target gender, Age group): Google recommends colour, gender, age group and size for apparel listings.

## External setup (account access required)

- **Google Search Console:** verify the `corsovelle.com` Domain property (DNS TXT). Submit
  `https://corsovelle.com/sitemap.xml`. After publishing this theme, use URL Inspection on a product
  and a collection, then watch Pages, Merchant listings, Product snippets and Breadcrumbs reports.
  In Search Console's shipping and returns settings (where offered for the account), enter the store's real Bangladesh shipping rates and
  return policy (the policy page lists Dhaka/Chattogram BDT 80, rest of Bangladesh BDT 150, express
  BDT 250).
- **Google Merchant Center:** connect through Shopify's **Google & YouTube** app (no custom feed).
  Set the same shipping and returns, check the product sync for disapprovals, and keep promotions
  as Shopify discounts only; Merchant Center "Promotions" are optional and must match the codes.
- **Bing Webmaster Tools:** import from Search Console (Copilot and, in part, ChatGPT search draw on Bing's index).
- **AI crawlers:** Shopify's robots.txt currently allows all crawlers on public pages and Shopify
  already serves `/agents.md`, a UCP endpoint and `sitemap_agentic_discovery.xml`. No change needed.

## Recommendations

**Meaningful**
- Items 1–7 above: catalog content is now the main limit, not the theme.
- A short, factual intro on each main collection (fabric, fit, occasions, care) via the collection
  description; the banner already displays it.
- One FAQ page (sizing, delivery times and costs, exchanges, payment methods such as cash on
  delivery if offered) using the existing FAQ section, linked from the footer. Answers people and
  AI assistants actually ask; written by the store, not generated.
- Turn product breadcrumbs on (Product section > Show breadcrumbs) if the design allows: it adds
  internal links to collections and enables breadcrumb rich results.

**Optional**
- A reviews app that writes real reviews into structured data, only once real reviews exist.
- `itemCondition: NewCondition` in product schema once you confirm everything sold is new
  (one-line change in `structured-data-offer.liquid`).

**Not recommended without evidence**
- `llms.txt`: no major search or AI engine documents using it; Shopify's `/agents.md` already covers
  agent discovery. Keyword "AI metadata" and generated landing pages: no documented benefit and a
  thin-content risk.
