# 04 — Architecture, build pipeline, and shared contracts

Status: decided direction with spike-gated details (D-01…D-07). Platform facts verified 21 Oct 2026 (agent report + spot checks); re-verify at M1.

## 1. Suitability check of the proposed foundation

| Proposal element | Verdict | Evidence / reasoning |
|---|---|---|
| Native Liquid OS 2.0 theme | **Keep** | Only a theme gives merchants the editor, app blocks, Shopify checkout handoff and theme-store-style reuse the brief requires |
| JSON templates + section groups + sections + theme blocks + snippets | **Keep** | Required for merchant composition; Theme Store still requires JSON templates and header/footer groups. A section uses *either* theme blocks *or* local blocks, never both; ≤25 sections per template/group, ≤50 blocks per section, block nesting ≤8 |
| Vite | **Keep, constrained** | Useful for TS, CSS bundling and code-splitting; must output into a **flat** `assets/` (subfolders unsupported). Horizon shows a no-build alternative (importmap + native modules) — our fallback if S1 fails |
| TypeScript | **Keep** | Type-safe service contracts, testable logic (cart queue, picker state) |
| Light-DOM custom elements | **Keep** | Survive section replacement naturally (connected/disconnected callbacks); W&R and Horizon both run this pattern in production |
| Component CSS + tokens | **Keep** | Settings → CSS variables; no Tailwind/Sass (Theme Store disallows Sass; Tailwind not needed) |
| Shared services | **Keep, enumerated** | §5 |
| Shopify CLI + Theme Check | **Keep** | `theme dev`, `theme check`, `theme push --unpublished`, `theme package` |
| Skeleton as starting point | **Drop** | rc-v2 removed sections/JSON templates (D-03) |
| Theme Lab | **Drop** | Vue/Webpack, last push Feb 2024 |
| HMR bridge | **Optional** | vite-plugin-shopify supports it via tunnel (Chrome Local Network Access blocks localhost from storefronts); not a dependency |

## 2. Layer ownership

| Layer | Owns | Never owns |
|---|---|---|
| Liquid (sections/blocks/snippets) | All initial HTML, forms, routes, money, translations, `shopify_attributes` | Client-side product database |
| JSON templates / groups | Composition, merchant data | Logic |
| Custom elements | Interaction state for one subtree | Cross-page state, prices, totals |
| Services | Cart queue, overlay stack, requests, section fetch/replace, announcements, editor events | Markup that Liquid can render |
| CSS | Presentation from tokens | Business state (no CSS-only "sold out" logic) |

## 3. Repository layout (future code repo; this folder stays planning-only)

```text
nk-theme/
  package.json  pnpm-lock.yaml  tsconfig.json  vite.config.ts  .theme-check.yml  .shopifyignore
  src/
    core/         element.ts (NkElement base) define.ts dom.ts motion.ts i18n.ts types.ts
    services/     request.ts sections.ts cart.ts overlay.ts announce.ts editor.ts url-state.ts
    components/   header/ nav-drawer/ mega-menu/ predictive-search/ product-card/ quick-add/
                  variant-picker/ product-form/ product-gallery/ media-zoom/ size-guide/
                  sticky-buy-bar/ cart-drawer/ cart-items/ facets/ pagination/ rail/
                  marquee/ reveal/ tabs/ disclosure/ video-media/ localization/ expand-media/(P2)
    entries/      global.ts product.ts collection.ts search.ts cart.ts content.ts
    styles/       tokens.css base.css utilities.css components/*.css pages/*.css
  theme/
    assets/       (built, flat; plus owned static files listed in assets.owned.json)
    blocks/       heading.liquid text.liquid button-group.liquid media.liquid group.liquid
                  product-title.liquid product-price.liquid variant-picker.liquid buy-buttons.liquid
                  product-accordion.liquid size-guide-trigger.liquid fit-note.liquid ... _slide.liquid _tile.liquid
    config/       settings_schema.json settings_data.json (presets A/B)
    layout/       theme.liquid password.liquid
    locales/      en.default.json en.default.schema.json (+ market languages)
    sections/     header.liquid footer.liquid announcement.liquid header-group.json footer-group.json
                  main-product.liquid main-collection.liquid main-search.liquid main-cart.liquid
                  cart-drawer.liquid predictive-search.liquid quick-add.liquid
                  hero.liquid collection-tiles.liquid featured-collection.liquid media-text.liquid
                  campaign-tiles.liquid rich-text.liquid faq.liquid newsletter.liquid
                  product-recommendations.liquid custom-liquid.liquid main-page.liquid main-404.liquid ...
    snippets/     nk-assets.liquid (generated) css-variables.liquid product-card.liquid price.liquid
                  image.liquid icon.liquid line-item.liquid size-chart-table.liquid swatch.liquid
                  facets.liquid pagination.liquid editor-placeholder.liquid
    templates/    index.json product.json collection.json search.json cart.json page.json 404.json ...
  scripts/        build-assets-snippet.ts check-owned-assets.ts package-theme.ts contrast-check.ts
  tests/          unit/ (vitest) e2e/ (playwright vs. unpublished preview) fixtures/ editor-scripts/
  docs/           merchant-setup.md data-contracts.md events.md upgrade-notes.md CHANGELOG.md LICENSES/
```

Prefix all theme-owned asset filenames `nk-` so the build can identify owned files without touching merchant uploads.

## 4. Build pipeline (D-05, spike S1)

1. Pin Node LTS, pnpm, Shopify CLI, Vite and TypeScript versions in `package.json` engines + lockfile.
2. Vite multi-entry build: `entries/*.ts` → `theme/assets/nk-<entry>.js`; shared chunks `nk-chunk-[name]-[hash].js`; CSS per entry `nk-<entry>.css` + component CSS imported by entries. `build.outDir = theme/assets`, `assetsDir = ''`, `emptyOutDir = false`, `build.manifest = true` (written to `.vite/manifest.json` outside `theme/` via `manifest` path or moved by script).
3. **Flatness test:** a post-build script fails if any emitted path contains `/`.
4. `scripts/build-assets-snippet.ts` reads the manifest and writes `snippets/nk-assets.liquid` taking `entry` as a parameter: emits `<link rel="modulepreload">` for static imports, `<script type="module" src="{{ 'nk-product.js' | asset_url }}" defer>`, and the entry CSS via `stylesheet_tag`. Relative dynamic imports between flat siblings resolve on the CDN; hashed names give cache-busting (the `?v=` from `asset_url` is not inherited by relative imports).
5. Owned-asset hygiene: `assets.owned.json` lists build outputs; the build deletes only stale `nk-*` files it previously produced. Merchant/other files are never removed.
6. Readability: production output is ES2020 modules, *not minified by default* but comment-stripped (Shopify serves compressed; also keeps a future Theme Store path open — "no minified JS except ES6/third-party" requirement); measure gzip size either way.
7. Dev loop: `vite build --watch` + `shopify theme dev --path theme`. Optional: vite-plugin-shopify HMR with `tunnel` for CSS work only.
8. CI: `tsc --noEmit`, `vitest`, `vite build`, flatness + owned-asset check, `shopify theme check`, locale/schema JSON validation, size budgets (`size-limit`-style script), Playwright journeys against an unpublished preview theme.

**S1 compares** vite-plugin-shopify 5.x (MIT; generates `vite-tag.liquid`) against the ~100-line owned script above. Pick the plugin only if it supports flat multi-entry output, modulepreload of shared chunks and `emptyOutDir:false` without workarounds.

**CSS loading:** `base.css` + tokens inline-critical via `snippets/css-variables.liquid` (settings → custom properties) and `nk-global.css`; page-group CSS (`nk-product.css`, `nk-collection.css`…) linked by template from `layout/theme.liquid`; P2 sections link their own small CSS with `stylesheet_tag` (accept duplicate-link risk only after S1 verifies browser de-dup or a render-once guard).

## 5. Runtime contracts

### 5.1 `NkElement` base class (`src/core/element.ts`)

```ts
abstract class NkElement extends HTMLElement {
  protected ac!: AbortController;           // fresh per connect
  protected get signal(): AbortSignal;
  connectedCallback(): void;                 // creates ac, calls mount() once per connection
  disconnectedCallback(): void;              // ac.abort(); runs registered disposers; calls unmount()
  protected abstract mount(): void;
  protected unmount?(): void;
  protected on<K extends keyof HTMLElementEventMap>(t: EventTarget, type: K, fn, opts?): void; // auto {signal}
  protected observeIntersection(el, fn, opts?): void;  // disconnect on abort
  protected observeResize(el, fn): void;
  protected later(fn, ms): void;             // cleared on abort
  protected dispose(fn: () => void): void;   // custom cleanup (media.pause, animations.cancel)
  protected ref<T extends Element>(name: string): T | null;   // [data-ref="name"] within this root only
  protected refs<T extends Element>(name: string): T[];
  // editor hooks (called by editor service; default no-op)
  onEditorSelect?(blockId?: string): void;
  onEditorDeselect?(blockId?: string): void;
}
export function define(tag: string, ctor: CustomElementConstructor) { if (!customElements.get(tag)) customElements.define(tag, ctor); }
```

Rules: no work in `constructor`; no document-wide queries except via services; IDs derived from `section.id`/`block.id` in Liquid; state lives in attributes/`dataset` where it must survive morphing.

### 5.2 Services (`src/services/*`)

| Service | API (summary) | Guarantees |
|---|---|---|
| `request` | `fetchText(url, {signal, timeoutMs, key})`, `fetchJSON`, `latest(key)` sequencer | Aborts superseded requests by key; typed errors `NetworkError`, `TimeoutError`, `HttpError(status, body)`, `ParseError`; never retries POSTs |
| `sections` | `render(url, sectionIds[] ≤5)`, `replace(target, html, {preserveFocus, selector})` | Validates fragment root `[data-section-id]` exists; null → recoverable error; replaces inner region only; dispatches `nk:section:replaced` |
| `cart` | `add(items, {sourceId, sections})`, `change({key, quantity})`, `update(updates)`, `note(text)`, `get()`, `reconcile(snapshot)`; queue status events | Serialized FIFO; same-line quantity edits coalesce to latest absolute value; line keys refreshed from each response; ambiguous outcome → `reconcile`, never auto-replay; locale-aware routes from `window.Shopify.routes.root` with Liquid-injected fallback |
| `overlay` | `open(panel, {trigger, modal, onClose})`, `close(panel)`, `closeAll()`, `current` | One major overlay; scroll lock via `html` class with saved scroll; `inert` on siblings; focus first labelled control; Esc; focus return (or documented fallback); cleanup on removal/breakpoint/orientation/pagehide |
| `announce` | `polite(msg)`, `assertive(msg)` | One live region pair in layout; de-duplicates within 1s |
| `editor` | Listens to `shopify:section:*`, `shopify:block:*`, `shopify:inspector:*`; maps to `onEditorSelect/Deselect`; exposes `isDesignMode` | No reload workarounds; select reveals (opens accordion/panel/slide, pauses motion) |
| `url-state` | `push(url)`, `onPop(fn)` | Filters/sort/pagination URL state; Back/Forward re-render |
| `motion` (core) | `level` (`off/minimal/standard`), `reduced`, `animate(el, keyframes, token)` returning a cancellable handle | Honors `prefers-reduced-motion`, setting, design-mode selection; `finish()` on interrupt |

### 5.3 Event catalogue (`docs/events.md`)

All `CustomEvent`s bubble from the component root, `detail` typed:

| Event | Detail | Emitted by |
|---|---|---|
| `nk:cart:updated` | `{cart, sourceId, requestId}` | cart service (authoritative JSON) |
| `nk:cart:error` | `{error, sourceId, requestId}` | cart service |
| `nk:cart:pending` | `{pending: boolean}` | cart service |
| `nk:variant:changed` | `{productId, variantId|null, available, sectionId}` | variant-picker |
| `nk:overlay:opened` / `closed` | `{id}` | overlay service |
| `nk:section:replaced` | `{sectionId}` | sections service |
| `nk:filters:applied` | `{url, count}` | facets |

App integrations: documented `document.dispatchEvent(new CustomEvent('nk:cart:refresh'))` makes the cart service re-fetch and re-render drawer/count — the supported hook for apps that mutate the cart.

## 6. Data/render rules

- Routes: always `routes.*` in Liquid; JS reads routes from a `<script type="application/json" id="nk-config">` (cart, search, predictive search, recommendations, root) — no hardcoded `/cart`.
- Money: only Liquid formats money. JS never formats prices; it swaps server-rendered fragments.
- Variant data: never `product | json`; the picker re-renders via `option_values`.
- Fragments: always requested from the real resource URL with real section IDs; max 5 per request.
- Editor: `request.design_mode` disables autoplay/entrance defaults server-side as well.

## 7. Technical spikes (M1) — each needs a dev store

| ID | Question | Pass evidence | If it fails |
|---|---|---|---|
| S1 | Does the flat Vite build load entries, shared chunks, dynamic chunks and CSS through the Shopify CDN in preview and editor? | Network log + screenshot on unpublished theme; size report | Switch to no-build importmap modules (Horizon-style) with TS compiled per file |
| S2 | Do two duplicated sections with `NkElement` components survive add/duplicate/reorder/remove/setting change without leaks? | Editor script record; heap/listener count before/after | Revise base-class lifecycle |
| S3 | Does the `option_values` picker stay correct on a 300+ variant product and with unavailable combos under slow 3G? | Video + Playwright test | Change replace boundary (picker vs. whole info column) |
| S4 | Does the cart queue keep correct lines/totals under rapid edits, same-variant-different-properties lines, lost responses (devtools offline) ? | Test log | Revise coalescing/reconcile |
| S5 | Does a representative app block (e.g., a reviews app) survive variant re-render and section reloads? | Before/after DOM + app function | Narrow replace boundary further |
| S6 | Overlay manager on real iOS Safari + Android Chrome: scroll lock, keyboard, rotation, bfcache back | Device video | Adjust lock strategy (position:fixed body fallback) |
| S7 | Size-chart metaobject with JSON table field renders as accessible table; fallback rich text works | Rendered page + editor dynamic source binding | Use metaobject with list fields or page-based charts |
| S8 | Product information as theme blocks: are static blocks + `@app` + reorderable info blocks workable with a single product form association (`form="…"` attributes)? | Editor reorder test | Use local section blocks for main-product |
