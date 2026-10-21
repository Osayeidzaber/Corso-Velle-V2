# 07 — Collections, product cards, filters, and quick add

Refines and replaces C-01..C-07 in [../04-collections-and-product-cards.md](../04-collections-and-product-cards.md). Canvas artboards 04 and 05.

---

## DC-01 Collection page (`sections/main-collection.liquid`)

**Purpose.** Compare garments quickly; find available sizes; reach the right product.

**Evidence.** Hype: pills + sort + price fields; Rush: pills only (no filters); W&R: Model toggle + filter drawer; W&R phone: 49 cards × ~31 `<img>` each ([01 §3](01-source-inventory-and-evidence.md)).

**Behaviour / composition (top → bottom).** Breadcrumb (optional) · title + product count · optional description (collapsed after 3 lines on phones) · optional **category pills** (from a chosen `link_list`, horizontally scrollable rail with edge fade + visible overflow cue, active = `aria-current`) · **toolbar**: Filter (with active count) | Sort | optional View (model/packshot) | (desktop) grid density · active filter chips + Clear all · product grid · pagination (D-16) · optional lower content.

**States.** default · updating (grid at 50% opacity + 3px progress line, `aria-busy`) · filtered-to-zero · empty collection · update-failed (previous results kept + "apply with full page load" link). Canvas 04 shows each.

**Data & settings.** Section: products per page (12–48, default 24), columns desktop (3/4)/phone (1/2), image ratio (inherit/portrait/square/natural), show pills + pills menu, show sort, show filters, filter layout (drawer / sidebar ≥1280px, P1), enable view toggle (only renders if any product has the media metafields), pagination type (numbered / load more), show description. Collection data: `collection.filters`, `collection.sort_options`, `collection.products_count`.

**Responsive.** 2 columns ≥320px with 8px gutter (card min 150px; at 320px card text 13px; 1-column option for editorial collections). 3 columns ≥750px, 4 ≥1200px.

**Motion.** None on the grid. Load-more appends with no animation; focus moves to the first new card's link and `announce` reports "24 more products".

**Editor.** Section settings re-render server-side; filter drawer closes on reload; placeholder cards only in design mode when the collection is empty.

**Errors.** Section Rendering failure → keep previous grid, show inline error with a real link to the target URL. No JS: filters are a `<form method="get">` submitting the same URL; sort a `<select>` in that form with a submit button (hidden with JS).

**Services.** sections, url-state, request, overlay (filter drawer), announce.

**Code.** `sections/main-collection.liquid`, `snippets/facets.liquid`, `snippets/active-facets.liquid`, `snippets/pagination.liquid`, `snippets/product-grid.liquid`, `src/components/facets/*`, `src/components/pagination/load-more.ts`, `styles/pages/collection.css`.

**Acceptance.** Q-08 (filter + sort → product → Back restores URL, filters, sort, page, and approximate position); 320px no horizontal overflow; 5 rapid filter taps → final URL equals final UI; empty vs zero-match copy differ; 5,000+ product collection (no filters from Shopify) hides Filter button gracefully.

---

## DC-02 Filters and sort (`nk-facets`)

**Behaviour.** Built from `collection.filters`/`search.filters`: `list` (checkbox groups; swatch presentation uses `filter_value.swatch` colour/image + visible label), `price_range` (two number inputs with currency from Liquid + optional range slider as enhancement), `boolean` (availability). Groups are `nk-disclosure`s; first two open.

**Draft vs applied (phone drawer & desktop drawer).** Opening copies applied state into a draft form. Changing a value fires a debounced (300ms) background count request (`?section_id=main-collection` with draft params → read `data-results-count`) to label "Show N results"; the grid does **not** change until Apply. Close/Esc discards draft. Reset clears draft only. Apply → push URL → render grid → close → focus to Filter button → announce "N products".
Desktop sidebar variant (P1) applies immediately per change (no draft) with the same request sequencing.

**Sort.** `<select>` applies immediately (phone: inside drawer as first group *and* toolbar shortcut); keeps filters; resets page.

**URL & history.** All state in URL (`filter.*`, `sort_by`, `page`); `pushState` on apply; `popstate` re-renders from URL; reload yields identical page.

**Edge cases.** Filter values with count 0 shown disabled with "(0)"; >25 values → "Show more" within group; price inputs validate min ≤ max; search page filters apply only to products (Shopify behaviour).

**Acceptance.** Out-of-order responses (throttled network) never overwrite later state; Back/Forward through 3 filter states; keyboard operation of every control; swatch filters have text names.

---

## DC-03 Product card (`snippets/product-card.liquid`)

**Purpose.** One card everywhere: collection, featured, rails, search, recommendations, cart suggestions.

**Parameters (LiquidDoc `{% doc %}`):** `product` (required), `image_ratio`, `show_secondary` (bool), `show_size_row`, `show_swatches`, `show_quick_add`, `media_mode` (`default|model|packshot`), `lazy` (bool), `sizes` (string), `heading_level`, `section_id` (for unique IDs).

**Anatomy.** `<article>` containing: media link (`<a>` wrapping `<img>`; secondary image only when `show_secondary` and pointer:fine, `loading=lazy`, swapped on first hover/focus — never both eager) · badges (sale if `compare_at_price > price`; sold out if `!product.available`; merchant badge from `custom.badge` metafield allow-list) · title link · price snippet (from-price when `price_varies`) · size summary row (option named by setting "Size option name(s)", default `Size`; values from `product.options_with_values`; unavailable struck + `aria-label="M sold out"`; >6 values → "XS–3XL") · colour summary (swatches only from `swatch` data, max 5 + "+n"; else "3 colours") · quick-add `<button>` sibling (never inside link). No whole-card link wrapper; optional stretched-link CSS for the media only.

**States.** default · hover (desktop: secondary image crossfade 200ms + quick add reveal; **always visible on touch**) · focus-within (same as hover) · sold out (dimmed media, no quick add) · missing image (placeholder with product title initials) · quick-add pending (button spinner).

**Model/packshot (P1, optional).** Media from `custom.model_image` / `custom.packshot_image` file metafields; fallback to featured media. Toggle in collection toolbar (`aria-pressed`), persisted in `sessionStorage` (try/catch). Swap changes `src/srcset` of visible + next-row cards only; others swap when they enter view.

**Performance.** ≤2 `<img>` per card; first 4 cards (phone) / 8 (desktop) in the first collection section `loading=eager` + `fetchpriority=high` for the first only; `sizes` accurate per grid; widths 180–900 via `image_url`.

**Acceptance.** 40-char + 3-line titles don't push price misaligned in the row (grid uses `subgrid` or fixed title clamp option); 2 duplicate featured sections with same product → unique IDs; screen reader announces card as title, price, availability once; no nested interactive elements (axe).

---

## DC-04 Quick add (`nk-quick-add` + `sections/quick-add.liquid`)

**Purpose.** Add a correctly chosen size without leaving the grid.

**Behaviour.**
- Single-variant product (or all options single-valued): button label "Add to cart"; posts directly via cart service with button pending state; success opens cart drawer (OD-05 setting).
- Multi-option: button "Choose options" (icon `+` with label) opens the quick-add panel (phone bottom sheet ≤90svh; desktop right drawer 440px) through overlay service. Content fetched: `{{ product.url }}?section_id=quick-add` (renders title, price, media 1–3, the **same variant-picker block** and buy buttons as PDP, size guide trigger, "View full details").
- **No meaningful option preselected** unless the card was a deep link with a variant; colour may preselect when the card represents a colour (sibling model).

**States.** closed → loading (sheet opens immediately with card's title/price + skeleton option rows of fixed height) → selecting (incomplete) → resolving (option re-render) → ready → submitting → success (sheet closes, drawer opens, focus to drawer heading) | rejected (inline error, selection kept) | ambiguous (reconcile; see [09](09-cart-commerce.md)) | load-failed (message + link to product page).

**Data/settings.** Global: quick add on/off, after-add behaviour, show size guide link. Card section can override off.

**Responsive.** Sheet with grab handle (visual only; close button is the control), content scrolls, buy button pinned with safe-area padding.

**Motion.** Overlay token; reduced motion fade.

**Editor.** Quick add disabled in design mode by default (opens product link instead) to avoid panels covering inspected content; setting to preview it.

**Errors.** Fetch failure → product link; product became unavailable → message from server.

**Services.** overlay, sections/request, cart, announce, variant-picker component.

**Acceptance.** Cannot add with no size (button focuses size group, announces "Choose a size"); double-click adds once; from two duplicated sections the right product opens; closing during submit doesn't cancel the request and result is announced; size guide from quick add returns to quick add with the same selection.
