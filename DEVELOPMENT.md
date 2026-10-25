# Development

[Back to README](README.md) · [Installation](INSTALLATION.md) · [Customization](CUSTOMIZATION.md) · [Settings reference](docs/SETTINGS-REFERENCE.md)

This guide covers the implemented Liquid and TypeScript architecture. Start with [source installation](INSTALLATION.md#develop-from-source) for runtime setup and commands.

## Contents

- [Architecture and source map](#architecture-and-source-map)
- [Assets and styling](#assets-and-styling)
- [Sections, blocks and snippets](#sections-blocks-and-snippets)
- [Interactive components and Shopify data](#interactive-components-and-shopify-data)
- [React and interactive components](#react-and-interactive-components)
- [Animation development](#animation-development)
- [Products and commerce](#products-and-commerce)
- [Validation and documentation maintenance](#validation-and-documentation-maintenance)

## Architecture and source map

Shopify renders Liquid from JSON templates and section groups. Browser modules enhance existing HTML through `nk-*` custom elements. Shared services coordinate cart requests, rendered section replacement, overlays and editor behavior. There is no application router or separate storefront backend.

| Path | Responsibility |
| --- | --- |
| `theme/layout/theme.liquid` | Storefront shell, global configuration/assets, header/footer groups and singleton cart drawer. |
| `theme/templates/` | Page composition; JSON section instances and block order. Gift cards use a standalone Liquid template. |
| `theme/sections/` | Contextual pages, reusable editorial sections and rendering endpoints. |
| `theme/blocks/` | Native Group and Text theme blocks for compatible composition. |
| `theme/snippets/` | Render-only helpers for cards, forms, media, data, tokens and structured data. |
| `theme/config/` | Global setting definitions and merchant/style preset values. |
| `theme/locales/` | English storefront strings and schema translations. |
| `src/entries/global.ts` | Global CSS, core services, immediate components and lazy registry. |
| `src/entries/product.ts` | Product CSS and variant/form/gallery/sticky-buy component registration. |
| `src/components/` | Component behavior and associated CSS. |
| `src/core/` | Element lifecycle, registration, lazy loader, configuration and motion policy. |
| `src/services/` | Cart queue/rendering, requests, sections, overlays, promotions and smooth scrolling. |
| `src/motion/gsap.ts` | Shared GSAP, ScrollTrigger, SplitText and scoped motion setup. |
| `src/styles/` | Base CSS, theme tokens, Tailwind utilities and shared component styles. |
| `scripts/` / `tests/unit/` | Build synchronization, schema/JSON checks, chart fixtures and regressions. |

The project began with Shopify Skeleton at commit `a4f32d3`; retained license text is in [the notices](THIRD_PARTY_NOTICES.md). Optional section adaptations have a separate [source map](docs/SECTION-SOURCES.md).

## Assets and styling

`vite.config.ts` discovers every `.ts` file in `src/entries/`. Vite compiles for ES2022 with Tailwind's Vite plugin, relative imports, code splitting and a manifest in `.build/.vite/manifest.json`. Current entries are `global` and `product`.

The sync script enforces flat `nk-` output, copies it into `theme/assets/`, removes only obsolete owned files, updates `assets.owned.json` and generates `theme/snippets/nk-assets.liquid`. JS entries/chunks carry content hashes. Global/product CSS names are stable; lazy CSS is hashed. Module script/preload URLs strip Shopify's version query to match relative chunk imports and avoid duplicate module execution. Preserve that loader contract.

The main layout renders `nk-assets` for `global` and for `product` on product pages. Product components can also be loaded lazily for injected product forms. A newly added entry needs an explicit Liquid loader call in its intended context; merely adding a file does not load it on every page.

Edit authored CSS/TypeScript rather than generated `theme/assets/nk-*` or `nk-assets.liquid`. Hand-maintained assets not in the owned manifest survive synchronization. Do not remove the manifest to force cleanup.

### Tailwind and design tokens

`src/styles/global.css` brings together base and component CSS. `src/styles/tailwind.css` imports Tailwind 4 theme/utilities without preflight; `base.css` supplies the reset. Class discovery scans Liquid and TypeScript. Token aliases such as `bg-accent`, `text-muted` and `font-serif` resolve to merchant-controlled `--nk-*` variables.

`theme/snippets/css-variables.liquid` emits global settings and scheme values; `button-tokens.liquid`, `card-presentation.liquid` and `section-presentation.liquid` supply shared contracts. Put instance overrides on the owning section root, not `:root`. Avoid dynamic class-name fragments Tailwind cannot discover; use complete class strings or bounded CSS variables. Utilities are marked important, so check cascade effects before mixing them with authored component rules.

## Sections, blocks and snippets

### Add a section

Create `theme/sections/<name>.liquid`, render meaningful HTML and add a valid `{% schema %}` block. Use an existing section with similar data and composition as the starting point. For example, `feature-grid.liquid` uses local feature blocks, `media-text.liquid` uses a single media/copy configuration, and `custom-section.liquid` supports native theme blocks.

This minimal teaching example follows the existing section/block pattern; it is not a bundled feature. Save it as `theme/sections/editorial-note.liquid` to try it:

```liquid
<section class="section-spacing color-{{ section.settings.color_scheme }}">
  <h2>{{ section.settings.heading | escape }}</h2>
  {% for block in section.blocks %}
    <div {{ block.shopify_attributes }}>{{ block.settings.text }}</div>
  {% endfor %}
</section>

{% schema %}
{
  "name": "Editorial note",
  "settings": [
    { "type": "text", "id": "heading", "label": "Heading", "default": "Our story" },
    { "type": "color_scheme", "id": "color_scheme", "label": "Color scheme", "default": "scheme-1" }
  ],
  "blocks": [
    {
      "type": "paragraph",
      "name": "Paragraph",
      "settings": [{ "type": "richtext", "id": "text", "label": "Text" }]
    }
  ],
  "presets": [{ "name": "Editorial note", "blocks": [{ "type": "paragraph" }] }]
}
{% endschema %}
```

The preset makes the section available in the add menu. A template's `sections` object identifies instances by ID and type; its `order` array controls sequence. Blocks have equivalent stored IDs/order. Use `enabled_on`/`disabled_on` when a section needs product or collection context. Preserve existing setting IDs, block types and option values: stored templates depend on them.

### Layout, blocks and presets

To adopt shared width/padding, copy the matching schema controls from `media-text.liquid` or a section-kit section, then apply the existing helper on the instance root:

```liquid
<div class="section-presentation section-spacing"
  style="{% render 'section-presentation', presentation: section.settings %}">
  <!-- Section content -->
</div>
```

This helper emits CSS declarations only. Adding the helper without its schema settings does not expose editor controls. Native theme blocks use `{"type":"@theme"}` and `{% content_for 'blocks' %}` as in `custom-section.liquid` and `blocks/group.liquid`. Constrained local blocks use `section.blocks` and a `case block.type` renderer. Keep those models separate; compatible app blocks opt in with `@app`. Include `block.shopify_attributes` on editable block roots.

A section preset creates content for a new instance. Global style presets in `settings_data.json` are separate and can replace merchant settings. Do not overwrite `current` values or template arrangements as a side effect of adding a code feature.

### Reusable snippets

Place shared rendering in `theme/snippets/` and pass inputs explicitly. Real examples:

```liquid
{% render 'product-card', product: product, card_options: section.settings %}
{% render 'promotion', product: product, view: 'card' %}
{% render 'model-info', product: product, settings: block.settings %}
```

Check the snippet's `{% doc %}` parameters and call sites before reusing it. Snippets do not expose settings themselves: their section/block consumer owns the schema. Keep unique DOM IDs derived from `section.id`/`block.id`. Escape plain text and attributes; render trusted rich text using the appropriate Liquid/metafield renderer.

## Interactive components and Shopify data

`NkElement` in `src/core/element.ts` owns a fresh AbortController on each connection. `mount()` queries the current DOM; `disconnectedCallback()` aborts listeners, cancels animations and runs registered disposers. Use `this.on`, `this.dispose`, observer helpers and `this.later` instead of unmanaged resources. Capture the connection signal before asynchronous work and check `connectionIsCurrent(signal)` when it returns.

For a new component, create a module under `src/components/<name>/`, extend `NkElement`, import its CSS, and register it with `define`. Register a dynamic import in `global.ts` using `registerLazy`. Match the Liquid element name to that registration. The lazy loader responds to initial markup, `shopify:section:load` and `nk:section:replaced`.

Components and apps can listen for these document events: `nk:cart:pending`, `nk:cart:updated`, `nk:cart:error`, `nk:cart:render-failed`, `nk:section:replaced`, `nk:variant:changed`, `nk:unit:changed`, `nk:overlay:opened`, `nk:overlay:closed` and `nk:motion:changed`. An app that changes the cart itself should dispatch `nk:cart:refresh` so the drawer and counts re-render.

The editor adapter calls optional `onEditorSelect(blockId)` / `onEditorDeselect(blockId)` hooks to reveal selected content. Custom element connection callbacks handle section replacement/removal. Test disconnect/reconnect and two independently configured instances; never query the entire document for section-owned controls.

### Data across the Liquid boundary

Use escaped attributes for small instance settings and `json` for structured data. Global `theme/snippets/nk-config.liquid` renders `#nk-config`, read and cached by `src/core/config.ts`. It contains localized Shopify routes, motion/cart options and translated UI strings. Keep `ThemeConfig`, the Liquid payload and consumers synchronized.

For a product-scoped example, `theme/snippets/carousel-product-data.liquid` emits `script[type="application/json"][data-carousel-product]` containing actual product IDs, option labels, availability, variant count and a serialized variant list. `src/components/carousel/product-data.ts` reads that data. A serialized list can be incomplete; preserve the existing product-page fallback instead of assuming it contains every variant.

Render only needed public data, encode it for its HTML context and avoid injecting untrusted JSON/text as HTML. Never embed Admin API credentials in theme settings, Liquid or built assets. Fetch using the theme's localized route/config services rather than hardcoded `/cart` URLs.

## React and interactive components

**React is not used.** There are no React/ReactDOM dependencies, JSX configuration, React mount nodes or hydration code. Liquid owns HTML; `nk-*` elements enhance it. This includes the GSAP and OGL interactions.

If a future component requires React, treat it as an explicit architecture change: add compatible dependencies and JSX/build support, keep one isolated mount container per Liquid instance, pass minimal JSON-encoded public Shopify data, and unmount its root when the owning custom element disconnects. Preserve server-rendered links/forms and reuse the existing cart, overlay and motion services. Do not let React and a custom element both own the same subtree or duplicate cart listeners. Document and test the integration before advertising React support. These are extension requirements, not installation steps supported by the current project.

## Animation development

| Source | Owns |
| --- | --- |
| `src/core/motion.ts` | Reduced motion, editor/data-saver/phone policy, tempo/stagger and functional transition helpers. |
| `src/motion/gsap.ts` | Registered ScrollTrigger/SplitText, defaults, `motionMatch` scope cleanup and shared refresh scheduling. |
| `src/components/motion/scene.ts` | Media/copy scenes, cinematic entrances, optional brief holds and hero scroll exit. |
| `src/components/motion/parallax.ts` | Scoped media parallax. |
| `src/components/reveal/reveal.ts`, `src/components/text/text.ts` | Reveals and text effects. |
| `src/components/expand-media/expand-media.ts` | Expanding campaign scene. |
| `src/components/carousel/` | Native rail, OGL engine, layout, lens and shaders. |
| `src/components/marquee/marquee.ts` | Moving strips/bands/reviews, clones and pause behavior. |
| `src/services/smooth-scroll.ts` | Single optional Lenis wheel interpolator and overlay coordination. |

Import GSAP from the shared motion module instead of registering plugins again. `motionMode()` returns off/simple/full: off leaves content static, simple avoids scrub/parallax/pinning, and full enables scroll scenes. `motionMatch(scope, setup)` uses scoped GSAP media contexts and returns a cleanup function. Register that function with the owning element's disposer; release non-GSAP resources separately. Read `scene.ts` for the full lazy-import, stale-connection and rebuild pattern.

Keep animation targets inside their owner and avoid two timelines transforming the same media. Use separate wrappers for section reveals and image hover. Prefer transform/opacity, bound stagger for shopping lists, reserve image dimensions and keep purchase controls immediately usable. Do not hide essential content until a successful animation initialization; preserve no-JavaScript and failed-module fallbacks.

Use `motionTempo()`/`motionStagger()` for user-facing presets. Test reduced motion toggled at runtime, phone/desktop breakpoint changes, editor selection, section reorder/remove, hidden tabs, image/font loading and repeated instances. A new `nk-*` animation owner may need inclusion in `installMotionPolicy()`'s reconnect list, or its own scoped policy listener, so it restores static state when preferences change.

### Smooth scrolling and performance

Lenis is synchronized with the shared GSAP ticker and ScrollTrigger, uses native touch scrolling, excludes dialogs/nested rails and stops while overlays are open. Keep that singleton. Do not add another requestAnimationFrame-driven page scroller or block body scrolling inside a section. Use the overlay service for dialogs and `[data-lenis-prevent]` for a genuinely independent scroll region.

The shared GSAP module refreshes measurements after document-height, image/font, editor and section changes. Avoid refreshing on every scroll frame; refresh after meaningful geometry changes. Dispose observers, tickers, timelines, WebGL resources and media listeners when a section leaves the DOM. Keep native carousel fallback available when WebGL cannot initialize. Verify performance with the merchant's actual media and section count.

## Products and commerce

The product entry registers gallery, variant picker, form and sticky-buy elements. Variant selection and quick add rely on actual Shopify product-section responses; preserve the fragment IDs and selector contracts in `main-product.liquid`. Do not infer availability from chart rows or fabricate a variant from incomplete client data.

Use `src/services/cart.ts` for serialized cart mutations and `cart-render.ts`/`sections.ts` for rendered updates. Replacing this with parallel direct fetches can cause stale totals and duplicated requests. File-upload line properties retain native multipart submission. Product forms, quantity rules, selling-plan requirements and Shopify errors must remain authoritative.

Product metafield contracts are in [Customization](CUSTOMIZATION.md#options-stock-and-product-content), [Model information](docs/MODEL-INFO.md) and [Reusable charts](docs/SIZE-CHART-ADMIN.md). Chart selection is centralized in `size-chart-assignment.liquid` and `measurement-chart-rule.liquid`; full and inline renderers share the resolved source. Changing charts does not alter stock or variant definitions.

Promotion resolution is in `theme/snippets/promotion.liquid`; cart associations are rendered by `cart-discounts.liquid` and attempted by `src/services/discounts.ts`. Shopify creates and validates the discount. Preserve the queue, rejected-code cleanup, conflict policy and shopper-code ownership rules. See [Promotions](docs/PROMOTIONS.md) before extending matching.

Meta tags and structured data live in `meta-tags.liquid`, `structured-data.liquid` and related snippets. Keep output tied to actual Shopify data; never add sample ratings or claims to JSON-LD. The theme does not create store domains, feeds, search-engine accounts or catalog data.

## Validation and documentation maintenance

Run `npm run check` before packaging. It checks TypeScript, unit tests, production assets, JSON, composition contracts, reference freshness and Shopify Theme Check. These gates do not certify every schema setting's runtime effect, browser layout or checkout outcome.

After changing schemas:

```sh
node scripts/customization-reference.mjs
npm run check:contracts
```

The generated inventory lives in `docs/SETTINGS-REFERENCE.md`; edit behavior notes in `CUSTOMIZATION.md`. Update `INSTALLATION.md` when commands or dependencies change, and update this guide when lifecycle, data or asset-loading contracts change. Keep the README concise and link to the appropriate guide.

An optional chart fixture runner is `scripts/verify-size-charts.py`; it needs `python-liquid` in a separate Python environment. It is not part of npm installation or a merchant requirement. It exercises synthetic data against actual Liquid snippets, not store records.

For functional changes, test actual rendered settings and two independent content instances, plus editor add/reorder/remove/save, keyboard, reduced motion, responsive extremes and relevant cart/variant/error states. Use an unpublished development theme. Source checks and unit tests do not replace a real checkout/test-order review.

Public guides, license records and necessary source attribution belong in Git. Put AI prompts, temporary fixtures, audit output, screenshots under review and scratch notes outside the repository or in ignored `.local-dev/`; `.codex/` and other local-tool paths are also ignored. Never link public guides to those private files. Preserve merchant `settings_data.json`, template arrangements and unrelated working-tree changes during updates. See [distribution](docs/DISTRIBUTION.md) for release delivery and rights review.
