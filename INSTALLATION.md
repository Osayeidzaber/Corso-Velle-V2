# Installation

[Back to README](README.md) · [Customization](CUSTOMIZATION.md) · [Development](DEVELOPMENT.md)

Choose the path that matches what you received. A merchant installs a built theme; a developer builds that theme from source.

## Contents

- [Install a prepared theme](#install-a-prepared-theme)
- [Develop from source](#develop-from-source)
- [Commands](#commands)
- [Build and distribute](#build-and-distribute)
- [Troubleshooting](#troubleshooting)

## Install a prepared theme

### Requirements

You need a Shopify store with the Online Store sales channel, permission to manage themes, and a prepared Shopify theme ZIP. Merchants do not need Node.js or developer tools. Store subscription, payments, shipping and checkout are configured separately in Shopify Admin.

The install ZIP must contain the contents of `theme/` at its root: `assets`, `blocks`, `config`, `layout`, `locales`, `sections`, `snippets` and `templates`. Do not upload a ZIP containing the whole source repository or a wrapping `theme/` directory.

> This checkout contains Corsovelle content and saved resource references. A developer must prepare neutral release defaults before distributing it to another merchant; see [distribution](docs/DISTRIBUTION.md).

### Upload and preview

1. Back up your current theme using its action menu in **Online Store → Themes**. Keep the current published theme available.
2. In the theme library, choose the theme import/upload action, select the prepared ZIP and upload it. Shopify may change menu wording; its [theme upload guide](https://help.shopify.com/en/manual/online-store/themes/adding-themes) describes the current interface.
3. Open the new theme's **Edit theme / Customize** action to enter the Theme Editor. Work on this unpublished copy.
4. Use **Preview** from the theme's action menu to inspect the actual storefront. Editor mode suppresses decorative motion, so use the storefront preview to review animation.

Uploading a theme does not import products, inventory, collections, navigation menus, pages, blog posts, discounts, metafield definitions or metaobject entries. Reconnect resource pickers and replace missing or brand-specific media for your store.

### Configure the store

| Where | Essential setup |
| --- | --- |
| Theme settings | Logo/favicon, color schemes, typography, spacing, product cards, product required-option rules, cart behavior, motion, social and support information. |
| Header and footer groups | Select menus, edit promotional blocks, configure search, footer signup, policy visibility and branding. |
| Templates and sections | Assign products, collections, images, video and links; review phone layouts and empty states. |
| Products and collections in Admin | Product descriptions, options, prices, stock, media, collections and template assignments. |
| Shopify custom data | Optional [size charts](docs/SIZE-CHART-SETTINGS.md), [reusable charts](docs/SIZE-CHART-ADMIN.md) and [model information](docs/MODEL-INFO.md). Definitions are not created automatically. |
| Shopify Discounts | Create valid codes first, then configure [theme promotion associations](docs/PROMOTIONS.md). |
| Shopify store settings | Policies, contact information, payments, shipping, taxes, markets, domain, language and social sharing image as appropriate. Configure native collection filters through Shopify Search & Discovery. |

Leave **Customer support → Show these links instead of the contact information policy** off unless you intentionally replace that policy and provide the required information. A theme support field is storefront content, not a vendor help desk configuration.

For the design workflow, continue to [Customization](CUSTOMIZATION.md).

### Test and publish

Before publication, check the unpublished preview:

- Home, collection, search, product, cart, content and contact pages with your actual catalog and menus.
- Available/sold-out variants, required option choices, gallery and size-guide data, card actions and optional sticky purchase bar.
- Add, change quantity and remove in the drawer and cart page; test valid, invalid, minimum-quantity and non-combinable discount codes.
- Checkout handoff and an authorized test order using your store's test-payment process. Shopify validates the final discount and total.
- Newsletter/contact responses, policy links, keyboard navigation, reduced motion and phone/tablet layouts, including physical devices.

When ready, select **Publish** for this theme in **Online Store → Themes** and confirm Shopify's prompt. Keep the previous theme for rollback; republishing it restores its theme files and saved presentation, not orders or catalog changes.

## Develop from source

### Requirements

- Node.js matching `package.json`: `^22.12.0 || ^24.0.0 || >=26.0.0`, with npm available on the same PATH.
- Git if cloning; otherwise an authorized source archive.
- Access to the intended Shopify store with appropriate theme permissions. Shopify CLI is pinned as a project development dependency; no global CLI installation is required.
- Internet access for dependencies and the Shopify preview. Consult [Shopify CLI setup and authentication](https://shopify.dev/docs/storefronts/themes/tools/cli) for store access requirements.

### Obtain and install

Use your authorized repository URL; none is assumed here:

```sh
git clone <repository-url> nk-theme
cd nk-theme
npm ci
npm run build
```

Replace `<repository-url>` before running the command. If using an archive, extract it and open a terminal at the folder containing `package.json`. `npm ci` installs the locked dependency tree, including the local Shopify CLI.

### Connect the preview

Run the asset watcher in one terminal:

```sh
npm run watch
```

In a second terminal:

```sh
npm run dev -- --store your-store.myshopify.com
```

Follow the authentication prompt with an authorized account and open the printed preview URL. Use the `.myshopify.com` domain. `npm run dev` expands to `shopify theme dev --path theme`; it contains no hardcoded store. Passing `--store` explicitly avoids relying on remembered CLI state.

Vite's watcher rebuilds into `.build/` and synchronizes output into `theme/assets/`. Shopify CLI serves the Liquid theme and detects those asset changes. This project does not use `vite dev`, localhost React routing or a frontend `.env` file for Shopify credentials. Keep both terminals running; avoid concurrent one-off builds while the watcher owns `.build/`.

## Commands

Run from the repository root after installing dependencies.

| Command | Purpose |
| --- | --- |
| `npm run build` | Production Vite build followed by asset synchronization. |
| `npm run watch` | Watch builds and synchronize assets after each successful bundle. |
| `npm run dev -- --store your-store.myshopify.com` | Shopify development preview for the specified store. |
| `npm run typecheck` | TypeScript validation without emitting files. |
| `npm test` | Vitest unit suite using happy-dom. |
| `npm run check:json` | Parse config, locale, template and section-group JSON. |
| `npm run check:contracts` | Validate schema/composition contracts and generated reference freshness. |
| `npm run check:theme` | Shopify Theme Check, failing at error severity. |
| `npm run check` | Types → tests → build → JSON → contracts/reference → Theme Check. |
| `npm run package` | Run `check`, then Shopify CLI theme packaging. |
| `node scripts/customization-reference.mjs` | Regenerate the settings reference after schema changes. |

There is no project `deploy`, `start`, `lint` or automatic neutral-release script.

## Build and distribute

Stop the watcher, then run:

```sh
npm run package
```

With `--path theme`, Shopify CLI writes the ZIP inside `theme/`, named from theme metadata. Check the path it prints and inspect the ZIP before upload. ZIPs are ignored by Git. Packaging does not publish or push to a live theme and does not sanitize merchant settings.

The build stages hashed `nk-*.js` chunks and CSS in `.build/`. `scripts/sync-assets.mjs` copies flat assets, removes obsolete files listed in `assets.owned.json`, and generates `theme/snippets/nk-assets.liquid` from the Vite manifest. Include the entire resulting `theme/` contents, especially the generated loader and `assets/nk-third-party-notices.txt`.

For a CLI upload to a new unpublished theme, after building and checking the source:

```sh
npx shopify theme push --path theme --store your-store.myshopify.com --unpublished
```

This is a Shopify CLI command, not an npm deploy script. Use the returned preview and finish the merchant checks before publishing in Admin. See the [official push command](https://shopify.dev/docs/api/shopify-cli/theme/theme-push).

Review [distribution requirements](docs/DISTRIBUTION.md) before supplying a ZIP or source archive to another store. Source documentation and license records accompany delivery separately; the theme ZIP contains only Shopify theme files.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Node/npm will not start | Confirm `node --version` and `npm --version` work first. On Windows, a Nodist `NODIST_PREFIX` error is a local runtime problem; repair Nodist or use a supported Node/npm installation. |
| CLI cannot access store | Verify domain, account and permissions. Follow CLI diagnostics rather than placing Admin API secrets in Liquid. |
| Styles or interactions missing | Build first, confirm `nk-assets.liquid` and its referenced files exist, then restart watch and preview. |
| Changes do not appear | Keep both processes running, inspect terminal failures and verify the preview is for the intended theme. |
| Theme ZIP rejected | Upload the packaged theme, not the repository archive. Theme directories belong at the ZIP root. |
| Blank products, menus or media | Select resources in this store. References do not migrate catalog data. |
| Animation absent in editor | Preview outside the editor; check motion, phone policy, reduced motion and section switches. |
| Packaging fails | Fix the first failed check. A failed command is not a successful package or release acceptance. |
