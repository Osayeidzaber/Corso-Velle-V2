# Collections, discovery, and product cards

Status: proposed specification informed by the three reference audits. Homepage placement belongs in [07-homepage-and-content.md](07-homepage-and-content.md); product purchasing belongs in [05-product-detail.md](05-product-detail.md).

## Intent

Let shoppers compare clothing quickly, understand availability, and reach the correct product/variant without accidental taps. W&R's model/packshot switch is a useful candidate feature; Hype Town's visible sizes make availability easier to scan; Rush Mode's category links keep navigation direct. These patterns should share one coherent card system.

## C-01: Collection page composition

Default order:

1. Breadcrumb where useful, title, product count, short optional description.
2. Optional category links from a chosen menu, with visible active state.
3. Filter/sort toolbar and optional image-mode control.
4. Active filter chips and clear-all action when filters exist.
5. Product grid.
6. Pagination or explicit Load more control with accessible fallback.
7. Optional editorial/footer content that remains reachable.

Do not put a full-screen decorative hero before every product grid. Collection banner is optional and constrained so browsing begins quickly.

## C-02: Grid behavior

Initial defaults: two columns on phones, three on medium widths, four on wide desktops. Provide bounded merchant choices, including a one-column editorial option where needed. Container width and card minimum size determine final breakpoints; test 320px rather than assuming two cards always remain readable.

Maintain stable media boxes. Long titles wrap without pushing price/actions into neighboring cards. Product imagery can use portrait or square ratio per section/preset, with an explicit contain/cover choice. No compulsory hover action on touch devices.

A rail and grid reuse the same product-card markup. A rail has clear previous/next controls and can be moved without blocking page scroll. A missing image produces a consistent placeholder rather than a collapsed card.

## C-03: Product-card anatomy

| Element | Rule |
|---|---|
| Main media | Product link, responsive image, stable aspect ratio |
| Secondary media | Optional desktop pointer-hover enhancement; lazy enough to avoid loading every asset upfront |
| Badge | Actual sale/sold-out or merchant-supplied supported label; never invented scarcity |
| Title | Product link with readable complete text available |
| Price | Shopify money formatting, compare-at only when meaningful, from-price when appropriate |
| Color indicator | Named swatches or color count; missing data must not produce fake swatches |
| Size availability | Optional concise row; not a substitute for actual option selection |
| Quick add | Explicit control; opens option selection when needed |
| Wishlist | Only if a real persistence/integration contract exists; otherwise omitted |

Do not wrap the entire card in a link containing buttons or inputs. Media/title navigation and quick-add controls must have distinct semantic targets. Prevent event bubbling from opening the product while choosing a size.

## C-04: Quick add

For a single default-variant product, a direct add can be allowed if its identity is clear. Clothing with meaningful options opens a compact picker. It must not silently choose a size the shopper did not intend.

The picker reuses the product-selection logic, price/availability state, and cart service. It can show an image, title, price, option groups, and View full details. On phones, use a usable panel with adequate touch targets rather than a tiny hover overlay.

Progression: closed → loading product data → selecting → submitting → confirmed or error. All states have a close action except a brief mutation critical section, where closing may hide UI but must not trigger an automatic duplicate request. Cart success is based on the server response, not the button animation.

If loading fails, provide the ordinary product link. A sold-out product remains navigable but cannot present a working-looking add button.

## C-05: Model/packshot switch

**Scope:** optional release-one feature after the core grid is stable. The W&R reference demonstrates its shopping value, but the theme needs a robust content contract.

Use explicit product media references, for example documented product metafields for model and packshot images. Do not assume the first image is a packshot and the second is always a model. A product without the chosen view falls back to its primary image without disappearing.

The switch changes card media, not the product result set. Keep card dimensions, title, price, and focus stable. Remember a session preference only if storage is available; failure to persist must not break browsing. Limit prefetching to nearby cards. Swapping mode must not eagerly download a catalog's worth of alternate images.

Expose the switch only when the feature is enabled and relevant data exists. Document the merchant setup burden in the editor help and content guide.

## C-06: Filters and sorting

Use Shopify storefront filters and sort options supplied by the collection/search context. Do not infer filters by scanning only the first loaded page. Shopify's [filtering documentation](https://shopify.dev/docs/storefronts/themes/navigation-search/filtering/storefront-filtering) explains merchant-configured filters and URL representation.

Desktop can use a compact filter drawer initially; a sidebar is a later layout variation if needed. Mobile uses the same filter data with a dedicated Apply action. Draft changes inside the drawer are distinct from applied URL state. Closing without applying restores the applied selection; Reset in the panel resets the draft until Apply.

Sort may apply immediately from the toolbar. Preserve applied filters when changing sort and reset pagination when the result set changes. Show result count, applied chips, and clear-all. Unavailable filter values must remain understandable, not mysteriously vanish during interaction.

When enhancing with section rendering:

- Keep the current grid visible during a request with a modest loading treatment.
- Reject stale responses from earlier requests.
- Update the result area and related toolbar counts coherently.
- Update browser history with the real filter URL.
- Handle Back/Forward through the same URL-driven state.
- If fetching fails, offer/revert to ordinary navigation rather than an empty grid.

No-results state includes the active constraints and clear/reset controls. Empty collection and filtered-to-zero are different states and should have different copy.

## C-07: Pagination

Default to explicit pagination or Load more with real links. Avoid infinite loading as the only way to browse: it makes the footer, browser history, and return position harder to use.

If Load more is enabled, expose progress, append without duplicate cards, announce the result, and keep the next page reachable without JavaScript. Document how returning from a product restores a useful position. Do not claim full position restoration until tested across reload and browser Back behavior.

## Editor contract

Featured-collection sections accept a real collection picker, item limit, desktop/mobile layout choice, image ratio, color scheme, and optional card overrides. Default to global card settings; avoid copying all global switches into every section.

Two collection sections may reference the same products and still work independently. Changing a section's source or layout must clean up rails, quick-add bindings, and image observers. A placeholder collection view is editor-only; customer pages do not display fake merchandise.

## Acceptance scenarios

| Case | Required result |
|---|---|
| 40-character title and long translated price label | No overlap or truncated purchase meaning |
| One-image product in model mode | Stable primary-image fallback |
| Filter applied, sort changed, Back pressed | Consistent URL/UI/product set |
| Slow responses arrive out of order | Latest requested filter state wins |
| Phone scroll starts on card image | Page remains scrollable; no accidental navigation |
| Quick add opened from two duplicated sections | Correct product and independent form identity |
| Empty collection vs zero matching products | Different helpful recovery messages |
| Product becomes unavailable | Server rejection shown honestly, card/cart refreshed as needed |

The reference sites' product counts and current catalog choices are examples, not values to hardcode.
