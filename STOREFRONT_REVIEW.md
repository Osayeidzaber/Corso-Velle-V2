# Storefront review: 23 October 2026

This is a second pass after `CODEBASE_AUDIT.md`. I re-read the project docs and the theme
(sections, snippets, templates, TypeScript, CSS, build), compared the 23 example components with
what's built, and walked the shopping path on the live dev store (`shopify theme dev`, 127.0.0.1:9393)
at 1024px and 375px.

**Labels.** *Verified live* means I exercised it on the dev store. *Unit-tested* means automated
tests only. *Not verified* means I couldn't exercise it in this environment.

## Validation

| Check | Before | After |
| --- | --- | --- |
| `npm run typecheck` | pass | pass |
| `npx vitest run` | 161 tests | **164 tests**, all pass |
| `npm run build` | pass | pass |
| `npm run check:json` | pass | pass |
| `npm run check:contracts` | pass | pass (customization reference regenerated) |
| `shopify theme check --fail-level error` | 128 files, 0 offenses | **131 files, 0 offenses** |

## What's already solid

- **Commerce core.** The cart queue, Section Rendering, drawer and page cart, quantity rules,
  discounts, selling-plan lines, checkout blocking while a cart update is pending, and cart
  recovery. *Verified live:* add → +1 → subtotal → remove → empty, with the badge and drawer in sync.
- **Collections and search.** Native filters, sort, pagination, and empty states. Predictive
  search covers products, collections, queries and pages. *Verified live:* `/collections/all`
  showed 24 cards with sort and pagination, `/search?q=shirt` returned 21 results, and typing
  "lin" in predictive search returned suggestions.
- **OS 2.0 and Theme Editor.** Every section has presets or template scope, `@app` blocks are on
  the product page, header and footer groups are in place, and editor lifecycle is handled. Theme
  settings are extensive (motion level, tempo, mobile motion, cards, size charts, buttons).
- **Accounts.** The header uses Shopify's `<shopify-account>` element (new customer accounts), so
  no classic `customers/*` templates are needed.
- **Motion architecture.** Components load lazily per tag. GSAP is imported only by animated
  components, with `matchMedia` cleanup and reduced-motion handling. CSS is code-split for lazy
  chunks.
- **Example components.** Almost all are integrated (table below), several beyond the original plan.

## Fixed in this pass (essential)

| # | Problem | Fix | Status |
| --- | --- | --- | --- |
| 1 | **Size option never recognised on the product page.** `main-product.liquid` overwrote the captured `size-option` result with `false` before checking it. No size pills, sliding underline, measurement panel or size-guide link appeared on any product. | Captured into a separate variable. | Verified live: Size renders as pills, XL disabled as sold out, size guide and measurements back. |
| 2 | **"Add to cart" did nothing if tapped while a just-chosen size was resolving.** The button was disabled and the tap was dropped (the dev store took more than 1.5s to resolve). | The button stays pressable. The tap is queued and adds only the resolved variant, or is dropped if that variant is sold out or unavailable. | Verified live (tap during resolve added `M ×1`). 2 new tests. |
| 3 | **Desktop nav wrapped onto two rows at 990–1200px** (1024px header was 92px tall). | `nk-header` detects that the merchant's menu would wrap and switches to the drawer button (`data-nav-compact`). The drawer stays usable at that width. | Verified live at 1024px. |
| 7 | **No favicon setting.** | Theme settings › Logo › Favicon, plus an apple-touch-icon. | Theme Check passes. |
| 8 | **No contact page template.** | `templates/page.contact.json` (page and contact form). | Theme Check passes. |
| 9 | Hard-coded English ("New", "Bestseller", "Limited", "0 results"). | Moved to locale keys. | Theme Check passes. |

The country/language selector, Shop Pay Installments message and gift card recipient form were
added in this pass and then removed at the owner's request.

## Second round (24 October 2026)

| Change | How it works | Status |
| --- | --- | --- |
| **Add to cart only once a size is chosen** | Until a size is selected the product page button is disabled and reads "Choose a Size". The sticky bar never adds without a size; tapping it moves focus to the sizes. | Verified live. Unit-tested. |
| **Sticky Add to cart bar** (opt-in) | Product information › *Sticky Add to cart bar*: Off (default), Phones and tablets, or All screen sizes. Shows the product, chosen size, price and the button once the main button scrolls away, mirrors "Updating…" and "Adding…", and stays out of the quick-add dialog. | Markup and tap behaviour verified live. Unit-tested. **Not verified:** the scroll-in, because the hidden browser pane renders no frames. |
| **Free shipping progress** | Theme settings › Cart › *Show free shipping progress* and *Free shipping minimum order*. Appears in the drawer and on the cart page, and the bar grows from its previous value after each change. Shown only in the store's default currency, and only when the cart needs shipping. | Verified live (Tk 3,100 left at 38%, then 76% after an add). |
| **Complete the look** in the cart drawer | Cart drawer › *Show product suggestions*, heading, and *Complementary* or *Related*. Based on the newest cart item, loaded only when the drawer is open, skips products already in the cart, and adds sizes in one tap. Falls back to related products when none are set as complementary in Search & Discovery (the case today). | Verified live: suggestions render, one-tap size add works, and the list updates. Unit-tested. |
| **Express checkout in the drawer** | Cart drawer › *Show express checkout buttons* (default on). Blocked while the cart is updating, like the cart page. | **Not verified:** no wallets are enabled for this BDT store, so Shopify renders none here or on the cart page. |
| **404 page rebuilt** | Matches the supplied design: full-height centred layout, an extra-bold "404" (the theme's sans at weight 800) fading out at the bottom, the message tucked under it, and Go home / Explore buttons with icons. Labels and links are editable; search, a popular-links menu and a product row are optional extras, off by default. | Verified live at 375px and 1280px. |

Changed files (both rounds): `theme/sections/{main-product,main-collection,main-cart,cart-drawer,cart-recommendations,404}.liquid`,
`theme/snippets/{sticky-buy,free-shipping-bar}.liquid`, `theme/layout/theme.liquid`,
`theme/config/settings_schema.json`, `theme/locales/en.default.json`, `theme/templates/page.contact.json`,
`src/components/{header/header,nav-drawer/nav-drawer,product/product-form,product/sticky-buy,cart/cart-recommendations}.ts`,
`src/services/cart-render.ts`, `src/entries/global.ts`, `src/styles/{product,components/cart,components/header}.css`,
tests (`product-regressions`, `sticky-buy`, `cart-recommendations`), `CUSTOMIZATION.md` (generated) and the rebuilt `theme/assets`.

## Third round (24 October 2026)

| Problem | Fix | Status |
| --- | --- | --- |
| **Rich text had no spacing anywhere.** The base reset zeroes every margin, so headings and paragraphs in pages, articles, product descriptions and policies ran together (most visible on the refund policy page). | New `src/styles/components/rte.css`: paragraph and heading spacing, list, link, quote and table styles, at zero specificity so sections can still override. Policy pages also get room below the header. | Verified live on the refund policy. Homepage and product text unchanged. |
| **Prices broke in two on phones** ("Tk" / "1,900.00" in cart lines). | Amounts never wrap between currency and number. In cart lines the sale and original prices stack. | Verified live on the cart page at 375px. |
| `--nk-font-display` was used but never defined, so the collection empty-state title silently fell back to the body font. | Uses the heading font. | Theme Check passes. |

Checked at 375px with no problems found: every page type returns 200, has one theme `<h1>`, alt text on images, labels on fields and no horizontal overflow. The phone filter drawer applies through "Show results" and updates the URL and chips. Card size buttons are always visible on touch, with 44px targets. The cart page works.

## Still needs attention (owner actions, no code)

- **Refund policy:** the policy text contains an empty heading (`<h1><br></h1>`). Delete it in Settings › Policies.
- **Blog:** "News" has no articles. Publish some or take it out of the menus.

- **Catalog data limits the theme.** All 34 products have only a Size option, no product type, no
  colour variants and no gift card.
  - Filters show only Availability and Price. Add Size, Product type and Colour in
    **Search & Discovery › Filters**.
  - Set product types. They feed filters, the product eyebrow and recommendations.
  - Set up colour variants or combined listings. The swatch and sibling UI is already built.
  - Add a gift card product.
- **Size charts.** Assign `custom.size_chart` metaobjects so every product's measurements panel
  has real data.
- **Not verified here:** real iOS/Android devices, screen readers, a Theme Editor add/reorder
  pass, multi-market currency, and checkout. The browser pane was hidden, so animation visuals
  and WebGL weren't checked visually.

## Example components vs implementation

| Example | Status |
| --- | --- |
| Split Text, Animated Content, Text Effect (per char), Fold Text, Shiny, Gradient, Progressive blur | Implemented as `nk-text` / `nk-reveal` effects, selectable per heading in the editor |
| Scroll Velocity, Marquee, Infinite slider | `nk-marquee` (ticker, image strip, vertical wall, `scroll-react`) |
| Scroll Expand | `nk-expand-media` section |
| Card Nav, Staggered Menu | Phone drawer styles "Cards" and "Editorial" |
| Navbar menu (Aceternity) | Desktop "Floating card (morphs between items)" panels and promo cards |
| Disclosure, Tabs with transition | `nk-disclosure`, `nk-tabs` |
| Letter swap | Header link hover "Letter swap" |
| Elastic line, Sticky footer | `nk-elastic-line`, footer reveal setting |
| Text loading (shimmer) | "Updating…" label on the buy button |
| Gooey input | Not ported. The expanding search pill covers the job. |
| Bubble | Chat-message docs, not relevant to a store |

## Recommendations (need your go-ahead)

Ranked by value. "Perf" is the expected performance effect.

### Tier 1: worth doing

1. ~~**Mobile sticky Add to cart bar.**~~ Done (second round). On a 375×812 phone the Add to cart button sits about 1,000px
   down, below the gallery and thumbnails. Once shoppers scroll into details, buying means scrolling
   back. `sticky-buy.ts` already exists (unused). It would be restored as an opt-in setting that
   shows the size, price and Add button after the main button scrolls out of view. *Perf:*
   negligible, since the code is already in `nk-product.js`.
2. ~~**Cart drawer that sells.**~~ Done (second round). Add a free-shipping progress bar (threshold set in the editor), a
   "Complete the look" row from Shopify's complementary recommendations, and Shop Pay express
   buttons in the drawer (today they appear only on the cart page). These directly lift
   conversion and order value. *Perf:* one recommendations request when the drawer opens.
3. **Product card → product page morph** using cross-document View Transitions. The card image
   flies into the gallery, which feels premium. It needs almost no JavaScript (CSS
   `@view-transition` plus `view-transition-name`), and browsers without support do a normal page
   load. *Perf:* none, and it hides navigation latency.
4. **Lighter collection and product pages.** Simple reveals and staggers pull in GSAP (47 KB gzip)
   on every page. Moving `nk-reveal` and `nk-stagger` to the existing WAAPI helper would keep GSAP
   for the scroll scenes, split text and the cursor only. *Perf:* about 47 KB less JS on
   collection and product pages. *Architectural, so it's your call.*
5. **Lazy-render hidden collection-tab panels.** The homepage "tabs" section ships 84 KB of HTML
   for panels nobody has opened (the page is 279 KB in total). Inactive panels would be fetched
   on first activation through Section Rendering. *Perf:* smaller HTML and fewer DOM nodes.

### Tier 2: good additions

6. **Instant size switching.** Prefetch the variant fragment on pointerdown or hover of a size
   pill, so "Updating…" rarely shows. *Perf:* positive.
7. **Notify me when a sold-out size returns.** XL is sold out on several products. This needs a
   back-in-stock app (for example Klaviyo); the theme would render the button on sold-out pills.
8. **Recently viewed** on the product page and in the empty search state (localStorage only).
9. **"Load more" on collections** instead of page links, with URL sync. Better on mobile.
10. **Discount code field in the cart.** Shopify's cart API supports applying codes before checkout.
11. **Pickup availability** on the product page. Only useful if you offer local pickup.

### Tier 3: creative ideas

12. **Fly-to-bag micro-interaction.** On add, the product thumbnail arcs into the header bag
    (WAAPI, about 1 KB), with a subtle haptic tick on Android.
13. **Shop-the-look hotspots** on lookbook and editorial images, opening a quick-add for the
    tagged product.
14. **Size-pill measurement peek on cards.** Reuse the product page's measurement preview in card
    quick-add trays.

### Design decisions I'd push back on

- **No express checkout on the product page.** "One clear purchase action" is a clean principle,
  but Shop Pay's accelerated button is a proven conversion lift on mobile. It's now in the cart
  drawer; the product page is still your call.
- **Homepage weight.** The hero video plus card videos transfer about 1.2 MB on first load.
  Consider poster-only on mobile data, or a shorter, lower-bitrate mobile source.

## Next suggestions (third round, ranked)

1. **Instant size switching.** Now that Add to cart waits for a size, the wait after tapping one
   is the main friction left: each tap asks the server to re-render the purchase area (over 1.5s on
   the dev store). For single-option products (the whole catalog), the size's variant, price and
   stock can be switched in the browser at once, keeping the server render only for multi-option
   products. *Perf:* faster, with fewer requests.
2. **Delivery and cash-on-delivery block on the product page.** The refund policy describes
   delivery-representative checks, which points to cash on delivery. A small editable block near
   Add to cart ("Cash on delivery · Dhaka 1–2 days · Outside Dhaka 3–5 days · Easy size exchange")
   answers the questions shoppers ask before buying. An optional WhatsApp/Messenger "Ask about
   sizing" link could sit beside it. *Perf:* none.
3. **Product reviews.** There's no product-level social proof. Install a reviews app (Judge.me,
   Shopify Product Reviews); the product page already accepts app blocks, and the star rating could
   show on cards too.
4. **"Your size" memory.** Remember the last size a shopper chose and show a subtle "Your size: M"
   hint on other products and cards. It's a hint only and never selects for them, which keeps the
   "choose a size first" rule. *Perf:* none (localStorage).
5. **Card → product page morph** (View Transitions). Unchanged from Tier 1.
6. **Lighter pages:** move simple reveals off GSAP (about 47 KB gzip on collection and product
   pages) and lazy-render hidden collection-tab panels (84 KB of HTML).
7. **Cart page extras:** a "Continue shopping" link when the cart has items, and the drawer's
   "Complete the look" row on the full cart page too.
8. **Empty search page:** show popular collections or searches instead of a bare search field.
