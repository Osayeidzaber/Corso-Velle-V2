# Shopify OS 2.0 clothing theme: documentation check (21 Oct 2026)

Labels: **V** = I saw it in the cited document today. **NF** = not found, or the document is unclear. **Interp** = my interpretation, not a documented statement.

## Major findings that change the plan
1. **The Skeleton theme changed on 2026-10-01.** The commit was "Port rc-v2.0.0 with updated block composition syntax". The README now says "This theme deliberately excludes the section-based model". It has no `sections/` directory, and its templates are `.liquid` files, not JSON (V, https://raw.githubusercontent.com/Shopify/skeleton-theme/main/README.md, https://api.github.com/repos/Shopify/skeleton-theme/commits). The Theme Store requirements still list JSON templates and require header/footer section groups (V, https://shopify.dev/docs/storefronts/themes/store/requirements). The same page says Skeleton is "the only approved codebase for Theme Store development". These two positions conflict. **Interp:** pin an earlier Skeleton commit that is still section-based, or write original OS 2.0 code. Do not adopt rc-v2 for a Theme Store or OS 2.0 target until the requirements are updated.
2. **Liquid July '26 developer preview** (2026-07-21). It adds the `{% block %}` and `{% partial %}` tags for Liquid-first composition. The changelog says "Existing themes continue to work with sections, theme settings, and JSON templates." (V, https://shopify.dev/changelog/developer-preview-liquid-block-and-partial-tags). It is a preview only, so do not rely on it.
3. **Customer accounts:** the `<shopify-account>` web component has been a Theme Store requirement since 2026-07-30 and must be in the header. Legacy customer templates are no longer required (V, https://shopify.dev/changelog/the-shopify-account-component-for-customer-accounts-is-now-a-theme-store-requirement).
4. **Variant limit is 2,048 for all merchants** as of 2025-10-15 (V, https://shopify.dev/changelog/the-product-variant-limit-is-now-2048-for-all-merchants). `product.variants` returns at most 250 (V, the high-variant guide in F).

## A. Architecture and limits
- The theme directories are assets, blocks, config, layout, locales, sections, snippets and templates. `templates/customers` and `templates/metaobject` are the only allowed subfolders. The doc says: "Subdirectories, other than the ones listed, aren't supported." So **assets/ is flat** (V, https://shopify.dev/docs/storefronts/themes/architecture).
- Limits (V, https://shopify.dev/docs/storefronts/themes/architecture/limits):
  - 1,000 JSON templates per theme. 25 sections per JSON template.
  - 20 section groups per theme. 25 sections per group.
  - 50 blocks per section. 1,250 blocks per template or group.
  - Theme block nesting is limited to 8 levels, excluding the section level. The `blocks/` folder holds at most 300 files.
  - File sizes: JSON template or group 512 KB, settings_schema 512 KB, settings_data 1.5 MB, locales 1.5 MB, other Liquid files 256 KB, a single `liquid` setting 50 KB.
  - Whole theme: 50 MB compressed upload, 250 MB of code excluding assets, 100,000 files.
  - Names: schema `name` 25 characters.
- The MaxFileSize check sets **20 MB per asset**. Schema bytes don't count toward the limit for Liquid files (V, https://shopify.dev/docs/storefronts/themes/tools/theme-check/checks/max-file-size).
- **Interp (Vite):**
  - Configure Rollup/Rolldown output so all files land directly in `assets/`, not in `assets/assets/*`, with no nested chunk dirs (for example `entryFileNames: '[name].js'`, `chunkFileNames: '[name]-[hash].js'`).
  - Dynamic `import('./chunk-x.js')` resolves relative to the importing module's CDN URL. Because the folder is flat and on the same CDN path, sibling chunks resolve correctly. The `?v=` query added by `asset_url` is not inherited by relative imports, so use hashed filenames for cache busting.
  - Keep the total asset count well below the file limits.

## B. Theme blocks and snippets
- A section can either define local blocks or accept theme blocks. The doc says "they can't support both simultaneously" (V, https://shopify.dev/docs/storefronts/themes/architecture/blocks/theme-blocks).
- Children render with `{% content_for 'blocks' %}`. A block needs presets to appear in the picker. `@theme` accepts all theme blocks (V, same page).
- **Static blocks** (V, https://shopify.dev/docs/storefronts/themes/architecture/blocks/theme-blocks/static-blocks):
  - Syntax is `{% content_for "block", type: "...", id: "..." %}`.
  - `id` is required and is a string literal. It only has to be unique within its immediate parent.
  - Extra arguments can be passed.
  - Static blocks don't count toward `max_blocks` (V, section-schema page).
- **Private blocks:** an underscore prefix (for example `_slide.liquid`) excludes the block from the picker for `@theme`. A parent must reference it explicitly, for example `"type": "_slide"` (V, https://shopify.dev/docs/storefronts/themes/architecture/blocks/theme-blocks/targeting).
- Nesting depth is 8 levels. The `tag` attribute is limited to 50 characters. Blocks render inside a `shopify-block` wrapper, and the `class` attribute appends classes to it (V, https://shopify.dev/docs/storefronts/themes/architecture/blocks/theme-blocks/schema).
- **App blocks** (V, https://shopify.dev/docs/storefronts/themes/architecture/blocks/app-blocks):
  - Add `{"type":"@app"}` to the section or block schema.
  - In theme blocks, app blocks render through `content_for 'blocks'`. In sections with local blocks, loop over `section.blocks` and use `{% render block %}` for `@app`.
  - `@app` is not allowed in statically rendered sections. It does not accept `limit`.
  - A section can have only one setting per resource type.
- `block.shopify_attributes` must go on the block's parent element (V, https://shopify.dev/docs/storefronts/themes/architecture/sections/integrate-sections-with-the-theme-editor).
- **LiquidDoc** (V, https://shopify.dev/docs/storefronts/themes/tools/liquid-doc, https://shopify.dev/docs/api/liquid/tags/doc):
  - Write `{% doc %}...{% enddoc %}` at the top of a snippet or block.
  - Annotations: `@description`, `@param {type} name - desc`, with optional names in `[name]`, and `@example`.
  - Types: string, number, boolean, object.
  - Theme Check validates `render` and `content_for` arguments, for example MissingRenderSnippetArguments and ValidRenderSnippetArgumentTypes.
  - Unclear: the UnsupportedDocTag check text says the `doc` tag can only be used "within a liquid snippet file", which conflicts with the block support described above (NF/Unclear).

## C. Section groups and section schema
- **Section groups** (V, https://shopify.dev/docs/storefronts/themes/architecture/section-groups):
  - JSON fields: `type` (header, footer, aside or `custom.<name>`), `name`, `sections`, `order`.
  - A layout renders a group with `{% sections 'name' %}`.
  - A group renders up to 25 sections, each with up to 50 blocks.
  - Each section has a `disabled` flag.
  - Contextual override files exist, for example `header-group.context.ca.json`.
- **Section schema** (V, https://shopify.dev/docs/storefronts/themes/architecture/sections/section-schema):
  - `enabled_on` and `disabled_on` accept templates and groups. A section can use only one of the two.
  - `max_blocks` lowers the cap of 50 blocks.
  - `limit` can restrict a section to 1 or 2 uses.
- Failed URL: https://shopify.dev/docs/storefronts/themes/architecture/sections/section-groups returned 404. The correct path is the one cited above.

## D. Theme editor
- **Events** (V, https://shopify.dev/docs/storefronts/themes/architecture/sections/integrate-sections-with-the-theme-editor):
  - `shopify:inspector:activate` and `shopify:inspector:deactivate`.
  - `shopify:section:load`, `:unload`, `:select` and `:deselect`. `:select` has detail `{sectionId, load}`.
  - `shopify:section:reorder`.
  - `shopify:block:select` with detail `{blockId, sectionId, load}`, and `shopify:block:deselect`.
- `Shopify.designMode` is `true` in the editor and `undefined` outside it. `request.design_mode` is a boolean. `request.visual_preview_mode` **exists** and is true in the editor's visual preview (all V).

## E. Section Rendering API and Cart Ajax API
- **Section Rendering API** (V, https://shopify.dev/docs/api/ajax/section-rendering):
  - `?sections=a,b` (or `sections[]=`) returns JSON mapping each ID to its HTML, **maximum 5**. A section that fails returns `null`, while the response can still be HTTP 200.
  - `?section_id=x` returns raw HTML, or 404 if the section doesn't exist.
- **Cart Ajax API** (V, https://shopify.dev/docs/api/ajax/reference/cart):
  - Bundled `sections` (plus `sections_url`, which must start with `/`) are supported on `/{locale}/cart/add`, `/change`, `/clear` and `/update`, up to 5 sections. `GET cart.js` is not listed. An invalid value returns 400.
  - `/cart/change.js` accepts `id` as either a variant ID **or the line item key**, or `line` as a 1-based index. Shopify recommends the key because several lines can share a variant. The key can change when properties or discounts change.
  - Only `line` works when setting a `selling_plan`.
  - `change.js` never adds items. It returns 400 if the item isn't in the cart.
  - `add.js` errors use 422. Repeated failures are throttled with 429.
  - Examples on the page use `window.Shopify.routes.root + 'cart/add.js'`, and the page says requests should be locale-aware (V). The page doesn't formally define `window.Shopify.routes.root` (NF).
- **routes object** (V, https://shopify.dev/docs/api/liquid/objects/routes):
  - Cart: `cart_add_url`, `cart_change_url`, `cart_update_url`, `cart_clear_url`, `cart_url`.
  - Other: `predictive_search_url`, `product_recommendations_url`, `root_url`.
  - Accounts: `account_url`, `account_login_url` and others redirect to customer accounts when enabled. `storefront_login_url`.

## F. High-variant products
- **product_option_value** attributes: `available`, `variant`, `product_url`, `selected`, `swatch`, `id`, `name` (V, https://shopify.dev/docs/api/liquid/objects/product_option_value). **`first_selectable_variant` is NF.**
- **Recommended pattern** (V, https://shopify.dev/docs/storefronts/themes/product-merchandising/variants/support-high-variant-products):
  - Render options from `product.options_with_values`.
  - On change, collect the selected option value IDs and fetch `product_url?section_id=...&option_values=id1,id2,...`. Replace the picker HTML and restore focus.
  - If `product_url` is a different product (combined listing), fetch that product and replace the whole section.
  - `product.variants` returns at most 250, so avoid loops over all variants and `product | json`.
  - `selected_or_first_available_variant` and `selected_variant` can return `null` when the selected combination doesn't exist.
- 2,048 variants per product (V, changelog link above). The limit of 3 options per product comes only from a third-party source (NF on shopify.dev).

## G. Storefront filtering
- **Filter object** (V, https://shopify.dev/docs/api/liquid/objects/filter):
  - Types are `list`, `price_range` and `boolean`.
  - Attributes: `param_name`, `values`, `active_values`, `inactive_values`, `min_value`, `max_value`, `range_max`, `url_to_remove`, `operator` (AND/OR).
  - `presentation` is `image`, `swatch` or `text`.
- **URL parameters** (V, https://shopify.dev/docs/storefronts/themes/navigation-search/filtering/storefront-filtering):
  - Filters combine with AND, and values within a filter combine with OR.
  - Examples: `filter.v.option.color=red,blue`, `filter.p.product_type`, `filter.p.vendor`, `filter.v.availability=1`, `filter.v.price.gte` and `filter.v.price.lte`.
  - Metafield filters: `filter.p.m.custom.x` (product) and `filter.v.m.custom.x` (variant).
  - Up to 25 filters. Filters work on collection and search pages, and filters must be created in the admin.
- **Implementation guide** (V, https://shopify.dev/docs/storefronts/themes/navigation-search/filtering/storefront-filtering/support-storefront-filtering):
  - Collections with over 5,000 products don't display filters.
  - Search filters are calculated from the first 1,000 results.
  - Applying a filter on the search page removes all non-product results.
  - Keep `sort_by` in the URL.
  - Swatch filters use a conic gradient of up to 4 colours. Image swatches are 25px.
- The Search & Discovery app is named in the predictive search docs as the place to configure search, but the filtering pages only say filters are created "in the Shopify admin" (NF as a strict requirement).

## H. Predictive search
- **Endpoints** (V, https://shopify.dev/docs/api/ajax/reference/predictive-search):
  - `GET /{locale}/search/suggest.json?q=` returns JSON. `/search/suggest?q=&section_id=` returns rendered HTML.
  - `resources[type]`: product, page, article, collection, query.
  - `resources[limit]`: 1 to 10, default 10. `limit_scope`: all or each.
  - `options[unavailable_products]`: show, hide or last. `options[fields]` sets the fields searched for pages, articles and collections.
  - Errors: 417 for an unsupported locale, 429 with `Retry-After`, 422, and 404 for a missing section.
  - A theme can check support through `predictiveSearch` in the `shopify-features` script.
- The `predictive_search` object has `performed`, `resources`, `terms` and `types`. It is only populated when the section is rendered through the Predictive Search API (V, https://shopify.dev/docs/api/liquid/objects/predictive_search).

## I. CLI, Theme Check and Theme Store
- **CLI theme commands:** check, console, delete, dev, duplicate, info, init, language-server, list, metafields pull, open, package, preview, profile, publish, pull, push, rename, share (V, https://shopify.dev/docs/api/shopify-cli/theme).
  - `shopify theme push --unpublished` appears in the getting-started tutorial (V, https://shopify.dev/docs/storefronts/themes/getting-started/create).
  - `theme init` clones Skeleton by default (V, same page).
- **Theme Check** (V, https://shopify.dev/docs/storefronts/themes/tools/theme-check/checks):
  - These checks exist: AssetSizeJavaScript (error), AssetSizeCSS, RemoteAsset (warning), ParserBlockingScript (error), ImgWidthAndHeight, HardcodedRoutes, StaticStylesheetAndJavascriptTags, LiquidNestingDepth, ValidBlockTarget, UniqueStaticBlockId and the doc-param checks.
  - AssetSizeJavaScript defaults to `threshold_in_bytes: 10000`, compressed, per file (V, https://shopify.dev/docs/storefronts/themes/tools/theme-check/checks/asset-size-javascript).
- **Theme Store** (V, https://shopify.dev/docs/storefronts/themes/store/requirements):
  - Minimum average Lighthouse performance **60** and accessibility **90**, on desktop and mobile, measured on the product, collection and home pages.
  - No Sass. No minified JS except ES6 and third-party libraries. Scripts must be hosted on Shopify except approved libraries.
  - Themes "built on or derived from Dawn or Horizon are not eligible". Skeleton is "the only approved codebase", otherwise the code must be original.
  - Required features include faceted filtering, predictive search, header and footer section groups, product main section as blocks, `@app` in the main and featured product sections, accelerated checkout and a custom Liquid section and block.
  - Touch targets must be at least 24×24 px. Contrast 4.5:1 for body text and 3:1 for large text.
  - Page states no JS size limit (NF beyond Theme Check).
- **Skeleton theme repo** (https://github.com/Shopify/skeleton-theme):
  - It exists and is active, with the last commit on 2026-10-01 (V).
  - The README says MIT, but LICENSE.md is a **modified MIT**: use is limited to developing Shopify themes and distributing through the Theme Store (V, https://raw.githubusercontent.com/Shopify/skeleton-theme/main/LICENSE.md). Read the LICENSE file, not the README.

## J. Horizon (summary of the architecture only)
- **Repo:** https://github.com/Shopify/horizon (V).
  - License is a modified MIT. Derived themes can't be sold or listed, and can only be delivered to a single merchant for that merchant's own store (V, LICENSE.md).
  - The README says derived themes are not eligible for the Theme Store and points to Skeleton.
- **JS architecture** (V, from reading `snippets/scripts.liquid` and `assets/component.js`):
  - Uses **no framework and no build step**: native ES modules in a flat `assets/`.
  - An `importmap` maps about 30 `@theme/*` bare specifiers to `asset_url`s.
  - Modules load with `type="module"`, plus `modulepreload` hints with low fetch priority. Some modules load only under certain settings or templates. A popover polyfill is loaded with a dynamic import only when native support is missing.
  - Components are custom elements that extend a base `Component` (HTMLElement). A `ref` attribute registry is kept up to date by a MutationObserver.
  - Event handling is declarative: `on:click`-style attributes are dispatched by document-level listeners.
  - Re-renders use the Section Rendering API plus a DOM morph, with an `updatedCallback` hook.
  - Business logic stays on the server. Progressive enhancement.
- **Interp:** a useful model for Vite output is a flat `assets/` folder with an importmap or hashed relative chunk imports.

## K. Metafields and metaobjects
- Dynamic sources support metaobjects directly (storefront-visible) or through `metaobject_reference` metafields. The page gives a setting-to-metafield-type compatibility table (V, https://shopify.dev/docs/storefronts/themes/architecture/settings/dynamic-sources).
- `metaobject` and `metaobject_list` settings require `metaobject_type` (V, https://shopify.dev/docs/storefronts/themes/architecture/settings/input-settings).
  - Standard definitions are available without setup.
  - Custom definitions must already exist on the store.
  - "custom metaobject definitions are not allowed in themes listed on the Theme Store" (V).
- Apps can declare definitions in `shopify.app.toml`, limited to the `$app` namespace (V, https://shopify.dev/docs/apps/build/custom-data/declarative-custom-data-definitions). I found **no mechanism for a theme to declare definitions** (NF). This matches your belief, but it is an absence of evidence.
- The `swatch` object has `color` and `image` and is available on product option values and filter values (V, https://shopify.dev/docs/api/liquid/objects/swatch).
- The link between swatches and category metafields, including the `shopify--color-pattern` metaobject type, appears only in third-party and community sources (NF on shopify.dev). Community reports say custom option or metaobject swatches may not populate `swatch` (NF/unverified). The page https://shopify.dev/docs/storefronts/themes/product-merchandising/variants/swatches returned 404.

## L. Accessibility
- The best-practices page links to WCAG 2.1 and also says it focuses on the "main principles of the WCAG 2.0 Guidelines". It names no conformance level (V, https://shopify.dev/docs/storefronts/themes/best-practices/accessibility).
- The Theme Store's 24×24 touch target rule matches WCAG 2.2 SC 2.5.8 (Interp).

## M. Vite and tooling
- **Vite** (V, https://vite.dev/guide/backend-integration; the docs show v8.3.4):
  - `build.manifest: true` writes `outDir/.vite/manifest.json`.
  - Manifest fields: `file`, `css`, `imports`, `dynamicImports`, `isEntry`, `isDynamicEntry`, `src`, `assets`, `name`.
  - In development, load `@vite/client` from the dev server and set `server.cors.origin` / `server.origin`.
  - Experimental `build.chunkImportMap` output goes to `importmap.json`.
  - The page doesn't say how to set `base` for a CDN (NF).
- **vite-plugin-shopify:**
  - npm latest is **5.0.0** (2026-08-16). It is MIT, has peer `vite` ranges covering 5.4.12+, 6, 7 and 8, and is ESM-only (V, https://registry.npmjs.org/vite-plugin-shopify).
  - Repo barrel/shopify-vite is MIT, not archived, last push 2026-08-17 (V, https://api.github.com/repos/barrel/shopify-vite).
  - Defaults: `themeRoot './'`, `sourceCodeDir 'frontend'`, `entrypointsDir 'frontend/entrypoints'`, `snippetFile 'vite-tag.liquid'`, `versionNumbers false`, `tunnel false` (V, https://raw.githubusercontent.com/barrel/shopify-vite/main/packages/vite-plugin-shopify/README.md).
  - The snippet loads from the dev server with the Vite client in development, and through `asset_url` (CDN) in production (V, https://shopify-vite.barrelny.com/guide/).
- **HMR and dev server caveats** (V, https://shopify-vite.barrelny.com/guide/troubleshooting):
  - Run `shopify theme dev` and Vite in parallel.
  - CORS: set `server.cors.origin` to include myshopify and custom domains.
  - **Chrome Local Network Access blocks public sites from loading localhost.** Use the `tunnel` option, which uses Cloudflare. Use ngrok if Cloudflare fails.
- The docs don't explain how the output is flattened or how dynamic chunks resolve (NF). The page https://shopify-vite.barrelny.com/config/ returned 404.
- **uicrooks/shopify-theme-lab** (V, https://api.github.com/repos/uicrooks/shopify-theme-lab and its /releases):
  - Not archived. MIT.
  - **Last push 2024-02-20.** Latest release v4.4.1 from 2021-12-26.
  - **Interp:** effectively unmaintained, so do not use it.

## N. Checkout
- The cart form posts to `routes.cart_url` and includes a submit input with `name="checkout"` (V, https://shopify.dev/docs/storefronts/themes/architecture/templates/cart).
- **Checkout customization** (V, https://shopify.dev/docs/storefronts/themes/architecture/layouts/checkout-liquid):
  - `checkout.liquid` is unsupported for the Information, Shipping and Payment steps. It was sunset for the Thank you and Order status pages on 2025-08-28.
  - Customization goes through checkout extensions, or the checkout editor for non-Plus stores.
  - **Interp:** the theme can't customize checkout.
- **Accelerated checkout** (V, https://shopify.dev/docs/storefronts/themes/pricing-payments/accelerated-checkout and https://shopify.dev/docs/api/liquid/filters/payment_button):
  - On the product page, use `{{ form | payment_button }}` inside `{% form 'product' %}`.
  - On the cart, check `additional_checkout_buttons`, then output `content_for_additional_checkout_buttons`.
  - Style only through CSS custom properties on `shopify-accelerated-checkout` and `shopify-accelerated-checkout-cart`, because the buttons use shadow DOM.

## O. Customer accounts
- Use the routes from E and `shop.customer_accounts_enabled`. `storefront_login_url` returns the customer to their page. `login_hint` prefills the email. `/customer_authentication/login?return_to=` accepts relative URLs only (V, https://shopify.dev/docs/storefronts/themes/login).
- Legacy customer accounts were deprecated on 2026-02-26. "Theme developers should no longer include legacy customer account liquid files." A store that moves to a theme without them is upgraded automatically. The sunset date is still to be announced (V, https://shopify.dev/changelog/legacy-customer-accounts-are-deprecated).
- The `<shopify-account>` custom element goes in the header and is wrapped in a `shop.customer_accounts_enabled` check. The recommended `menu` value is `customer-account-main-menu`. Shopify maintains the component, and it can be styled only through CSS variables, parts and a slot (V, https://shopify.dev/docs/storefronts/themes/customer-engagement/account-component).

## URLs that failed (404)
- https://shopify.dev/docs/storefronts/themes/architecture/sections/section-groups (correct path: /architecture/section-groups)
- https://shopify.dev/docs/storefronts/themes/architecture/assets
- https://shopify.dev/docs/storefronts/themes/product-merchandising/variants/swatches
- https://shopify-vite.barrelny.com/config/
