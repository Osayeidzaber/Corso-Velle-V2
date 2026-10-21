# Architecture and build decisions

Status: proposed implementation baseline. Research date: 21 October 2026. This is a plan, not an implemented or benchmarked theme.

## Product boundary

Build a native Shopify Online Store theme for a clothing brand, with portable settings and a second brand preset proving reuse. Shopify renders the pages; the theme enhances navigation, product selection, discovery, and cart interaction. Checkout and hosted customer-account experiences remain Shopify surfaces. A theme does not replace payment processing, order tracking services, inventory management, or a loyalty backend.

The directory name NKIL is the project identifier. The public brand name, logo, market, and legal information remain undecided.

## ADR-01: Liquid + Vite + TypeScript + native custom elements

**Decision:** retain Liquid as the source of storefront HTML. Use Vite to compile assets and TypeScript to implement small, independently mounted custom elements. Use light DOM by default so Shopify's editor, app markup, CSS, and accessibility relationships remain straightforward.

| Layer | Owns | Does not own |
|---|---|---|
| Liquid | Initial content, commerce forms, URLs, money, section markup | Client-only replica of the product database |
| JSON templates and section groups | Page composition and merchant configuration | Browser routing |
| Theme blocks / section blocks | Editor-controlled content composition | General application state |
| Snippets | Reusable markup with explicit parameters | Merchant-editable instances |
| Custom elements | Behavior for a bounded DOM subtree | Replacing the entire storefront |
| Shared services | Cart queue, overlay coordination, request handling | A second authoritative inventory/price database |
| Vite | Build/watch, entry points, asset output | Production hosting or Liquid rendering |

Normal links and forms remain the baseline. Enhance collection filtering and cart updates selectively. Do not introduce a site-wide client router in version one: history, analytics, app initialization, and editor behavior would all become more complex without proving a shopping benefit.

This separation follows Shopify's [theme structure](https://shopify.dev/docs/storefronts/themes/architecture); the particular module boundaries above are our design decisions.

## ADR-02: Theme Lab is an architectural reference, not our starter

The inspected [Theme Lab manifest](https://github.com/uicrooks/shopify-theme-lab/blob/main/package.json) declares version 4.4.1, Vue 3.2.x, Vuex 4, Tailwind 3, and Webpack 5. Its scripts include `shopify theme serve`. The declaration ranges are evidence about the repository, not proof of the exact dependencies installed by every user. We have not installed or security-audited it.

Keep its useful idea: separate authored frontend source from deployable Shopify files, with a reproducible asset build. Do not inherit its dependency choices solely because its README promises speed. It is not a Vite template, and copying it would introduce migration work before our own components exist.

Vue remains a possible future island for a genuinely complex tool. It is not required for a drawer, variant picker, or collection grid. A framework choice would need measured bundle cost and editor lifecycle tests. Tailwind is optional build-time tooling, not a performance or editor-compatibility guarantee. Default here is component CSS plus design tokens to keep merchant setting values explicit.

## ADR-03: Original implementation with distribution options preserved

Use original theme code, optionally starting from Shopify's Skeleton scaffolding after checking its current license and structure. Do not base a potentially distributable theme on a reference store's downloaded source.

Shopify's current [Theme Store requirements](https://shopify.dev/docs/storefronts/themes/store/requirements) distinguish original/Skeleton-based submissions from Dawn/Horizon derivatives, and impose distribution conditions. Reusable private installation is not the same as Theme Store eligibility. Marketplace submission is a separate later workstream with a fresh requirements review; this plan does not promise acceptance.

## Proposed repository layout

```text
src/
  entries/             # core, product, collection, search, optional media
  components/          # header, drawer, picker, gallery, carousel
  services/            # cart, overlays, requests, section replacement
  styles/              # tokens, base, components, page styles
theme/
  assets/              # compiled owned assets + explicitly retained static assets
  blocks/              # reusable editor blocks
  config/              # theme settings and distribution defaults
  layout/
  locales/
  sections/            # page sections, header/footer groups, response sections
  snippets/
  templates/
scripts/               # build integration, asset mapping, package checks
tests/                 # commerce behavior, browser journeys, editor test fixtures
docs/                  # merchant setup, developer contracts, migrations
```

These directories describe the future code repository. The current NKIL folder contains planning documents only.

## Build contract

1. Pin compatible Node, package-manager, CLI, and dependency versions when implementation starts; commit the lockfile.
2. Build CSS and ES modules into `theme/assets`. Shopify assets are not an arbitrary nested web-server filesystem: configure filenames and imports accordingly.
3. Read Vite's production manifest during the build and generate a Liquid asset-reference snippet. Liquid does not read a local build manifest at request time.
4. Resolve shared CSS and module dependencies once per page. Verify generated references through Shopify's CDN, including dynamic chunks, rather than assuming localhost import paths will work.
5. Maintain an owned-asset manifest. A build must not wipe merchant assets or unrelated manually maintained assets. If using a clean distribution directory, compose it explicitly before packaging.
6. Start with Vite build-watch plus `shopify theme dev`. Add a direct Vite HMR bridge only if its editor-preview and HTTPS behavior are proven. Do not make a custom HMR bridge a launch dependency.
7. Package only deployable theme files. No source tree, secrets, local server URLs, or required runtime from the developer's computer.

Vite documents the general [manifest/backend integration](https://vite.dev/guide/backend-integration); the Liquid/CDN adapter is implementation work we must build and test. Shopify's supported development workflow is documented in [CLI for themes](https://shopify.dev/docs/storefronts/themes/tools/cli).

## Runtime ownership

Each instance gets a stable identity derived from section/block/form identity. Never assume one gallery or one product form exists on a page. Components register once, initialize idempotently, and release listeners, observers, and animation handles when removed. Reconnected instances must create fresh cleanup controllers.

Use DOM events for narrow communication, with a documented namespace such as `nkil:cart:updated`. Suggested payload: source identifier, request identifier, and authoritative returned cart data. Avoid undocumented global variables and components querying unrelated page regions.

The overlay service owns which major drawer is open, scroll locking, focus restoration, and background inertness. The cart service serializes mutations. Product instances own their selection and stale-response protection. None of these services owns page content that Liquid can render reliably.

## Rendering and data contracts

- Generate routes and money through Shopify context. Do not hardcode `/cart`, a currency symbol, language prefixes, or a store domain in shared frontend logic.
- Prefer returned Liquid fragments for UI whose pricing, localization, or app markup would otherwise be duplicated in JavaScript.
- Request fragments against the actual product or collection URL and real section identity. Treat missing fragments as a recoverable failure; a successful HTTP response alone does not prove usable HTML.
- Keep collection and variant URLs meaningful for reloads and browser history.
- Do not assume serializing `product.variants` yields every possible variant. Shopify documents a 250-entry limit on that Liquid collection and provides option-value mechanisms for scalable selectors. Our product implementation must exercise the [high-variant approach](https://shopify.dev/docs/storefronts/themes/product-merchandising/variants/support-high-variant-products).

The [Section Rendering API](https://shopify.dev/docs/api/ajax/section-rendering) supplies server-rendered fragments; our implementation must validate targets, manage focus, and reject stale responses.

## Integration boundary

Support app blocks in explicitly declared product/content positions and preserve platform-required layout output. Avoid global CSS rules that restyle arbitrary app buttons. Publish component events and insertion rules in the developer guide.

Reviews, restock messages, wishlist synchronization, loyalty, and tracking portals need chosen integrations or defined backend services. Their buttons must not be shipped as decorative promises. A WhatsApp/contact link is a configurable optional merchant feature, hidden when no destination is provided.

## Technical spikes before broad implementation

| Spike | Evidence needed | Failure changes |
|---|---|---|
| Build through Shopify CDN | CSS, module entry, shared chunk, optional chunk all load from preview | Flatten/change build output or asset mapping |
| Editor replacement | Two duplicate components survive add/reorder/change/delete | Component lifecycle contract |
| Variant selector | Correct selection on high-variant and unavailable-combination fixtures | Product fragment strategy |
| Cart mutation | Correct totals and line identities under rapid edits | Cart queue and replacement boundaries |
| App block | Representative app block survives product update | Narrower DOM replacement boundary |

Do these before proliferating sections. Their results determine implementation details without reopening the overall product scope.
