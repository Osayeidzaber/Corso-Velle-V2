# Corso Velle

![Corso Velle wordmark](docs/readme-cover.svg)

A Shopify Online Store 2.0 theme built for [Corsovelle](https://corsovelle.com). Liquid renders every page; TypeScript custom elements, GSAP and Vite add interaction on top. It uses Shopify's own catalog, cart, checkout, filters and SEO objects. There is no separate storefront app and no React.

> This repository holds Corsovelle's configured theme. It is not yet packaged as a neutral commercial release, and no license is granted (see [LICENSE](LICENSE)).

## Features

| Area | What's included |
| --- | --- |
| Content | Image, video and slideshow heroes; media with text; expanding media; category cards; lookbook hotspots; FAQ; testimonials and reviews; feature, timeline, pricing and newsletter sections |
| Discovery | Featured collections as a grid or a WebGL carousel (native fallback), collection tabs, clothes rack, predictive search, Search & Discovery filters, sorting, infinite or numbered pagination |
| Product page | Gallery layouts with zoom, explicit size selection, size charts with cm/in switching, model information, sibling colourways, sticky add-to-cart bar |
| Cart | AJAX drawer and cart page, quantity changes, notes, recommendations, free-shipping progress, Shopify discount codes (manual and automatic) |
| Design | Colour schemes, three font roles, spacing, buttons, card styles, per-section options, Riviera / Minimal / Quiet theme styles |
| Motion | GSAP entrances and scroll scenes, optional desktop wheel smoothing (Lenis), simplified phone motion, full reduced-motion support |

## Quick start

Install a built theme ZIP from Shopify Admin → **Online Store → Themes**. To work from source (Node.js 22.12+, 24 or 26+):

```sh
npm ci
npm run build
npm run watch                                      # terminal 1: rebuild assets on change
npm run dev -- --store your-store.myshopify.com    # terminal 2: Shopify preview
```

Run `npm run check` before committing, and `npm run package` to build the installable ZIP. See [INSTALLATION.md](INSTALLATION.md) for details and troubleshooting.

## Branches

| Branch | What it holds | Who changes it |
| --- | --- | --- |
| `main` | All source code and docs: `src/`, `theme/`, `scripts/`, `tests/`, `docs/`. Work happens here. | You, by committing |
| `shopify` | Only the contents of `theme/`, moved to the top level. This is the branch connected to Shopify (Online Store → Themes → **Connect from GitHub**). | Generated from `main`, plus Shopify's own commits |
| `history` | The full development history up to the clean `main`. Kept for reference only. | Nobody; leave it as is |

Shopify can only read a branch whose top level is a theme (`layout/`, `sections/`, `templates/` …). `main` keeps the theme inside `theme/` next to the source code, so it can't be connected directly; `shopify` exists for that reason.

Shopify also writes back to `shopify`: every save in the Theme Editor or code editor becomes a commit there (mostly `config/settings_data.json` and `templates/*.json`). So:

- **Code changes go `main` → `shopify`.**
- **Theme Editor changes go `shopify` → `main`.**

To publish code changes, first bring the Theme Editor's changes into `main`, then rebuild and update `shopify`:

```sh
git checkout main
npm run shopify:pull      # copies Theme Editor commits from origin/shopify into theme/
npm run check             # rebuilds theme/assets and runs every check
git add <files> && git commit -m "Describe the change"
git push origin main
npm run shopify:deploy    # commits main's theme/ on top of origin/shopify and pushes it
```

`shopify:deploy` refuses to run while `shopify` has Theme Editor changes that `main` doesn't, so a deploy can't wipe them. It only ever fast-forwards. Never edit files on `shopify` by hand, and never force-push it: that overwrites the store's saved customizations.

## Repository layout

```text
src/       TypeScript and CSS sources (built by Vite)
theme/     The Shopify theme that gets uploaded (Liquid, JSON, built assets)
scripts/   Asset sync, watcher, JSON/schema checks, settings-reference generator
tests/     Vitest unit tests
docs/      Setup guides, settings reference, licenses
```

Edit `src/` and `theme/`. Never edit `theme/assets/nk-*` or `theme/snippets/nk-assets.liquid` by hand; the build generates them.

## Documentation

| Guide | Covers |
| --- | --- |
| [INSTALLATION.md](INSTALLATION.md) | Installing a ZIP, developing from source, commands, packaging, troubleshooting |
| [CUSTOMIZATION.md](CUSTOMIZATION.md) | Every Theme Editor area, what it controls and its limits |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Architecture, adding sections and components, animation, commerce code |
| [docs/SETTINGS-REFERENCE.md](docs/SETTINGS-REFERENCE.md) | Every setting, default and block (generated from the schemas) |
| [docs/SIZE-CHART-SETTINGS.md](docs/SIZE-CHART-SETTINGS.md) · [docs/SIZE-CHART-ADMIN.md](docs/SIZE-CHART-ADMIN.md) | Size charts from theme settings, or shared metaobject charts |
| [docs/PROMOTIONS.md](docs/PROMOTIONS.md) | Connecting Shopify discount codes to products |
| [docs/MODEL-INFO.md](docs/MODEL-INFO.md) | Model height and size text on product pages |
| [docs/DISTRIBUTION.md](docs/DISTRIBUTION.md) | Preparing a release for another store, and updates |
| [docs/SECTION-SOURCES.md](docs/SECTION-SOURCES.md) · [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) | Where adapted sections and components came from, and their licenses |

## License

No license is granted; all rights are reserved by the owner. Third-party parts keep their own licenses, listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). The project started from [Shopify Skeleton](https://github.com/Shopify/skeleton-theme).
