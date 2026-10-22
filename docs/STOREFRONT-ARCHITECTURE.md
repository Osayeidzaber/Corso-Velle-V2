# Storefront architecture and audit evidence

Audit date: 22 October 2026 (Asia/Dhaka). This is a native Liquid theme using Vite,
Tailwind, vanilla TypeScript custom elements and GSAP. Liquid owns product, price,
availability, cart totals, filtering and initial HTML. No frontend framework or
alternative commerce backend is required.

## Existing source inventory

There were 41 TypeScript source files at the start of this audit. The existing
organization is retained because it already separates responsibilities:

| Area | Existing files and responsibility |
| --- | --- |
| Entrypoints | `src/entries/global.ts` starts shared services and registers components; `product.ts` registers the product components and imports product CSS. |
| Core | `src/core/config.ts`, `define.ts`, `dom.ts`, `element.ts`, `lazy.ts`, `motion.ts`: Liquid configuration, idempotent registration, focus/HTML helpers, connection-scoped resources, dynamic imports and motion policy. |
| Commerce and services | `src/services/cart.ts`, `cart-render.ts`, `sections.ts`, `request.ts`, `overlay.ts`, `editor.ts`, `announce.ts`: serialized mutations, authoritative section HTML, request sequencing, focus/scroll ownership, editor selection and announcements. |
| Product | `src/components/product/variant-picker.ts`, `product-form.ts`, `gallery.ts`, `sticky-buy.ts`, `card-interactions.ts`, plus `components/size-guide/size-guide.ts`. |
| Collection/search | `components/facets/facets.ts`, `predictive-search/predictive-search.ts`, `search-pill/search-pill.ts`, `recommendations/recommendations.ts`. |
| Navigation/shared UI | `components/header/header.ts`, `nav-drawer/nav-drawer.ts`, `modal/modal.ts`, `disclosure/disclosure.ts`, `tabs/tabs.ts`. |
| Motion/content | `src/motion/gsap.ts`; components `reveal/reveal.ts`, `text/text.ts`, `marquee/marquee.ts`, `expand-media/expand-media.ts`, `elastic-line/elastic-line.ts`, `motion/stagger.ts`, `motion/parallax.ts`, `motion/cursor.ts`. |

New implemented source modules in the combined work are
`components/predictive-search/results.ts` (instance-specific result identifiers),
`components/product/product-dom.ts` (fetched product identifier isolation), and
`components/product/quick-add.ts` (shared product UI in a quick-add dialog).
Product-specific work was performed concurrently by the user's other Codex chat;
its source changes are preserved here.

## Liquid integration and ownership

| Interface | Liquid boundary | Runtime |
| --- | --- | --- |
| Layout | `layout/theme.liquid`, `nk-config`, generated `nk-assets` | Global entry, localized routes, translated strings, live regions and cart notification. |
| Navigation | `sections/header.liquid`, `snippets/nav-drawer.liquid`, `search-modal.liquid` | Header, drawer, modal, pill and predictive search. |
| Product | `sections/main-product.liquid`, product snippets | Product entry; server-rendered option resolution; scoped gallery, measurements, forms and sticky controls. |
| Cards | `snippets/product-card.liquid` | One delegated card interaction installer across grids, recommendations and inserted sections. |
| Collections and results | `sections/main-collection.liquid`, `search.liquid`, snippets `facets` and `pagination` | Native filter parameters, sort, pagination, history and Section Rendering. |
| Cart | `sections/main-cart.liquid`, `cart-drawer.liquid`, `snippets/line-item.liquid` | Both use `nk-cart-items`, the same cart queue and the same fragment renderer. |
| Content | Content section custom-element tags | Lazy content modules; GSAP is requested only when motion is permitted. |

Product tags also register through the global lazy loader, allowing a fetched or
inserted product component to hydrate outside the original product template.
There are two real page entrypoints, not empty cart/collection entry files.
Prices remain formatted by Shopify Liquid; there is no parallel JS price engine.

## Runtime contracts

- `NkElement` creates one AbortController per connection. Repeated initialization
  is harmless. Disconnect aborts listeners, cancels subtree Web Animations and runs
  component disposers. Async motion startup checks the original connection signal,
  so removal and reinsertion cannot start duplicate timelines.
- Lazy loading handles both descendants and an event root that is itself a custom
  element. It runs at startup, section load and `nk:section:replaced`.
- Native connect/disconnect handles section load/unload; the editor adapter routes
  section/block selection to component owners. Reorder and section replacement
  refresh ScrollTrigger measurements. Header selection keeps the header visible.
- Decorative motion observes OS reduced-motion changes. GSAP contexts revert on
  removal, batched tween callbacks stay in their owning context, and split headings
  restore their original markup. Cursor/magnetic listeners are delegated rather
  than attached permanently to removed buttons.
- `Sequencer` provides latest-response-wins behavior. Search cancels immediately
  on new input, before debounce starts the next request, and on clear/dismissal.
  Listbox, option and heading IDs are unique across simultaneous search instances.
- The request timeout covers response body consumption as well as initial headers.
  Empty/malformed JSON produces a typed error. A malformed successful mutation
  response is ambiguous and must be reconciled rather than retried.
- `replaceRegions` validates every required fragment before mutating either
  attributes or contents, avoiding a partially updated purchase interface.
- The cart queue never retries POST mutations automatically. Reconciliation
  distinguishes properties and selling plans, combines duplicate requested item
  quantities, and obtains a fresh pre-add snapshot. Invalid quantities are rejected
  before sending requests; cart response shapes are validated before distribution.
- Omitted/null cart fragments recover with safe GET requests. A newer cart update
  invalidates earlier recovery. On cart pages with a drawer, recovery only processes
  the missing regions, preserving already valid page regions.
- Checkout buttons and accelerated checkout containers are blocked while mutations
  are pending or their cart HTML remains unconfirmed. A visible View cart recovery
  link remains available. Shopify owns all checkout calculations.
- Cart replacement restores line focus, moves focus after removal, and preserves
  an actively edited note. Notes are escaped in Liquid. Notification-mode adds
  display a dismissible confirmation with a real cart link.
- One overlay service owns the active native dialog, scroll lock and return focus.
  Its root attribute also hides floating purchase UI. Removed dialogs and failed
  `showModal()` calls release their lock.

Public events: `nk:cart:pending`, `nk:cart:updated`, `nk:cart:error`,
`nk:cart:render-failed`, `nk:section:replaced`, `nk:variant:changed`,
`nk:unit:changed`, `nk:overlay:opened`, `nk:overlay:closed`, `nk:motion:changed`.
Apps that mutate Shopify's cart can dispatch `nk:cart:refresh` on `document`.

## Verification recorded in this chat

- TypeScript: `tsc --noEmit` passed.
- Vitest: 9 files, 49 tests passed at the recorded verification point, including
  concurrently added product regression tests. Coverage includes queues,
  reconciliation identity, invalid quantities, fragment recovery races and partial
  recovery, response-body timeouts, search cancellation and unique IDs, keyboard
  selection, atomic section updates, lazy roots, duplicate initialization and
  overlay removal/failure cleanup.
- Vite production build and first watch-mode compilation passed in isolated
  `.audit-build` and `.audit-watch` staging folders. These did not replace assets
  during the other chat's browser validation. The other chat owns the final shared
  build/sync. Automatic approval review blocked deletion of the temporary staging
  folders, which are retained locally and ignored by Git.
- Strict theme JSON validation passed.
- Shopify Theme Check: 72 files inspected, zero offenses.
- A separate browser tab at `http://127.0.0.1:9292/collections/all` successfully
  changed to price-ascending sorting and applied `filter.v.availability=0` using
  real Shopify Section Rendering. The URL updated, 34 products became 19 filtered
  products, the filter dialog closed and scroll lock was released.
- Header predictive search returned real products, queries and a collection for
  `linen`. No browser console errors were observed in these collection/search
  checks. Keyboard behavior is covered by automated regression tests; the live
  keyboard attempt was interrupted by preview reloads and is not counted as passed.
- Browser inspection identified scrollbar-width overflow in the full-bleed filter
  toolbar and intrinsic overflow in the collection banner. Source fixes measure
  the usable viewport width and constrain the banner grid. These final CSS changes
  require verification after the final shared build.

New regression test files from this chat: `cart-render.test.ts`,
`search-regressions.test.ts`, `sections.test.ts`, `overlay.test.ts`.
Existing `cart.test.ts`, `request.test.ts` and `element.test.ts` were extended.

## Remaining release verification

This audit is not a production certification. The following are not established by
the local unit suite or the limited desktop preview:

- Physical iOS/Android touch, software keyboard, safe areas and screen readers.
- Complete real Theme Editor add/duplicate/reorder/select/delete acceptance script.
- End-to-end checkout handoff, discounts, accelerated payments, subscription apps,
  file properties, multiple markets/currencies and representative third-party apps.
- Real high-variant catalog fixtures, long-running leak profiling and Lighthouse
  performance across desktop/mobile pages.
- Final combined product/gallery/card design verification, owned by the concurrent
  product chat; consult its report for its actual browser evidence.

Use Shopify's official [Ajax cart reference](https://shopify.dev/docs/api/ajax/reference/cart),
[Section Rendering API](https://shopify.dev/docs/api/ajax/section-rendering), and
[Theme Editor lifecycle documentation](https://shopify.dev/docs/storefronts/themes/best-practices/editor/integrate-sections-and-blocks)
when extending these contracts. Do not add private API credentials to `nk-config`.
