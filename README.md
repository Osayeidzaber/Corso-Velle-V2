# Corso Velle

**An editorial Shopify theme for considered commerce.**

![Corso Velle editorial wordmark in espresso, cream and copper](docs/readme-cover.svg)

Built for Corsovelle, Corso Velle combines product-led layouts, configurable sections and purposeful motion with Shopify's catalog, cart and checkout. Liquid renders the storefront; TypeScript custom elements add interaction where it is needed.

**Shopify Online Store 2.0 · Liquid · TypeScript · Vite · Tailwind CSS · GSAP**

> **Release status:** this repository contains Corsovelle's configured theme. Commercial release defaults, licensing and support terms still require approval. See [distribution](docs/DISTRIBUTION.md). The current implementation does **not** include React.

## Contents

- [The storefront](#the-storefront)
- [Get started](#get-started)
- [Make it yours](#make-it-yours)
- [How it works](#how-it-works)
- [Documentation](#documentation)
- [Compatibility and updates](#compatibility-and-updates)
- [Licensing and support](#licensing-and-support)

## The storefront

| Area | Included capabilities |
| --- | --- |
| Editorial content | Image/video heroes and slideshows, media stories, expanding campaigns, category cards, lookbooks, FAQ, testimonials, feature grids and newsletter sections. |
| Product discovery | Featured product grids, editorial WebGL carousel with native fallback, collection tabs, clothes rack, predictive search, collection filtering and sorting. |
| Product pages | Configurable galleries, image zoom, variant selection, optional sticky purchase bar, reusable size charts, model information and product content blocks. |
| Commerce | AJAX cart drawer and cart page, Shopify-calculated totals, existing discount-code associations, optional cart recommendations and configurable after-add behavior. |
| Design controls | Color schemes, three font roles, responsive spacing, button styles, product-card presentation, per-section options and Riviera, Minimal and Quiet theme styles. |
| Motion | Scoped GSAP entrances and scroll effects, optional Lenis wheel smoothing, reduced-motion handling and simplified phone behavior. |

Capabilities depend on each section's available controls and Shopify data. Reviews are merchant-entered content, discounts are managed in Shopify Admin, and a size chart does not create product variants.

## Get started

### Install a prepared theme

Upload the **built theme ZIP** in Shopify Admin → **Online Store → Themes** using the theme import/upload action. Keep it unpublished while you select your own media, menus, products and collections. Merchants do not need Node.js, npm or Vite.

Follow [Installation](INSTALLATION.md#install-a-prepared-theme) for setup, preview and publishing checks. A repository download ZIP is source code, not an installable theme package.

### Develop from source

Use Node.js **22.12+ within 22.x, 24.x, or 26+**, npm and authorized Shopify store access. From the repository root:

```sh
npm ci
npm run build
```

Run these in separate terminals:

```sh
npm run watch
```

```sh
npm run dev -- --store your-store.myshopify.com
```

Replace the example domain with your store. Shopify CLI is installed by `npm ci`; it prompts for authentication. Vite watches and builds assets while Shopify CLI serves the Liquid preview.

See [developer installation](INSTALLATION.md#develop-from-source) for requirements, commands, troubleshooting and packaging.

## Make it yours

Start in the **Theme Editor** for the unpublished theme. Select a template from the page selector, then edit its sections and blocks. Changes to a shared template affect every resource using it.

| To change… | Start here |
| --- | --- |
| Logo, colors, fonts, spacing and buttons | [Brand and design](CUSTOMIZATION.md#brand-and-design) |
| Menus, announcements and footer | [Navigation and store shell](CUSTOMIZATION.md#navigation-and-store-shell) |
| Homepage and campaign layouts | [Editorial sections](CUSTOMIZATION.md#editorial-sections) |
| Collections, featured products and cards | [Product discovery](CUSTOMIZATION.md#product-discovery) |
| Product galleries, content and sizing | [Product pages](CUSTOMIZATION.md#product-pages) and [size charts](docs/SIZE-CHART-SETTINGS.md) |
| Cart behavior and promotional codes | [Cart and promotions](CUSTOMIZATION.md#cart-and-promotions) |
| Animation and smooth scrolling | [Motion](CUSTOMIZATION.md#motion) |
| Sections, snippets or interactive components | [Development](DEVELOPMENT.md) |

The [customization guide](CUSTOMIZATION.md) explains workflows and limitations. The [settings reference](docs/SETTINGS-REFERENCE.md) lists the exact settings, block types, presets and defaults generated from the current Shopify schemas.

## How it works

```text
Shopify data + JSON templates + Liquid sections
                      ↓
             Server-rendered storefront
                      +
TypeScript + CSS → Vite → theme/assets → Shopify CDN
                      ↓
       Custom elements enhance matching markup
```

| Layer | Responsibility |
| --- | --- |
| Liquid and JSON | Page structure, sections, blocks, resource data, native forms and editor settings. |
| TypeScript custom elements | Galleries, tabs, search, cart interactions and component lifecycle. |
| Vite | Compiles entries and lazy chunks, stages output and generates asset loading through the sync script. |
| Tailwind CSS 4 | Token-based utilities alongside authored CSS; no Tailwind preflight reset. |
| GSAP, ScrollTrigger and SplitText | Scoped animation and text effects. |
| Lenis / OGL | Optional desktop wheel smoothing / WebGL editorial carousel. |

Source lives in `src/`; the deployable Shopify theme lives in `theme/`. React is absent from dependencies and runtime. See [the developer guide](DEVELOPMENT.md#react-and-interactive-components) before planning a React integration.

## Documentation

| Guide | Audience and purpose |
| --- | --- |
| [Installation](INSTALLATION.md) | Merchant upload, source setup, preview, production build and package. |
| [Customization](CUSTOMIZATION.md) | Configure the storefront through Shopify Admin and the Theme Editor. |
| [Development](DEVELOPMENT.md) | Architecture, sections, snippets, interactive components, animations and checks. |
| [Settings reference](docs/SETTINGS-REFERENCE.md) | Complete generated schema inventory. |
| [Size chart settings](docs/SIZE-CHART-SETTINGS.md) | Assign chart pictures and measurement tables without code. |
| [Reusable size charts](docs/SIZE-CHART-ADMIN.md) | Metaobject definitions, product/collection references and fallback order. |
| [Model information](docs/MODEL-INFO.md) | Per-product model text and block settings. |
| [Promotions](docs/PROMOTIONS.md) | Existing Shopify discount-code matching, display and application. |
| [Distribution](docs/DISTRIBUTION.md) | Release preparation, updates, support decisions and media recommendations. |
| [Section sources](docs/SECTION-SOURCES.md) | Adaptation provenance and retained upstream licenses. |
| [License status](LICENSE) · [Third-party notices](THIRD_PARTY_NOTICES.md) | Pending project terms and existing attribution requirements. |

## Compatibility and updates

This is a Shopify Online Store 2.0 theme using JSON templates, section groups and theme blocks. JavaScript targets ES2022; the enhanced storefront uses modern browser APIs, including custom elements and native dialogs. Product links, forms and selected content have native fallbacks; some enhancements require JavaScript. WebGL is optional and has a native carousel fallback.

No certified browser, app, market/currency, accessibility or physical-device support matrix is published yet. Verify the combinations your store needs before launch. The standalone gift-card template uses its own layout rather than the animated storefront runtime.

Keep a backup before updating. Install updates as an unpublished theme, preserve merchant settings and template changes, then preview and test before publishing. There is no automatic updater or settings migration tool. Follow [the update workflow](docs/DISTRIBUTION.md#updates).

## Licensing and support

The [LICENSE](LICENSE) records that project-wide commercial terms are pending; it does not grant a new license. Preserve the [third-party notices](THIRD_PARTY_NOTICES.md) and their linked license texts. Brand assets and demo media require separate rights review.

**Owner approval pending:** commercial product name, distribution channel, support contact, support scope, update entitlement and release policy. No purchase link or support service is announced by this repository. Prepare a reproducible issue with theme revision, browser, affected template and steps when requesting help through an approved channel.
