# NK theme (project NKIL)

A reusable Shopify Online Store 2.0 clothing theme. The plan, decisions and specs live in
[`../master-plan`](../master-plan/README.md). This repository is the implementation.

**Status: M1 foundation and first P0 slice. Not yet run on a Shopify store.** Typecheck, unit
tests, the build and Theme Check pass. No behaviour has been verified in a browser against
real Shopify data, the theme editor or a phone. That is the next step and needs a development
store (master-plan/13 M1).

## Base

The theme starts from **Shopify Skeleton at commit `a4f32d3` (26 Feb 2026)**, the last
section-based version. Skeleton's current `main` (rc-v2, 1 Oct 2026) removed sections and JSON
templates. Dawn and Horizon were not used because their licences limit derived themes to a
single merchant, which conflicts with reuse across brands. Skeleton's licence (kept in
[`docs/LICENSES`](docs/LICENSES/shopify-skeleton-theme.md)) permits developing and distributing
Shopify themes. The first commit is the unmodified import.

## Layout

```text
src/                 TypeScript + CSS sources (built by Vite)
  core/              NkElement base class, config, motion policy, DOM helpers
  services/          request, sections, cart (queue), cart-render, overlay, editor, announce
  components/        header, nav-drawer, modal, cart drawer/items, product (picker, form, gallery), disclosure
  entries/           one file per page bundle → theme/assets/nk-<entry>.js
  styles/            tokens/base + component CSS
theme/               the deployable Shopify theme (push this folder)
scripts/             sync-assets (flat assets + generated snippets/nk-assets.liquid), watch, check-json
tests/unit/          Vitest (happy-dom): cart queue, request sequencing, element lifecycle
```

Build output is copied flat into `theme/assets` with an `nk-` prefix. Only files listed in
`assets.owned.json` are ever deleted, so merchant-uploaded assets survive builds.
`theme/snippets/nk-assets.liquid` is generated from the Vite manifest.

## Commands

```bash
npm install          # use npm 11 (npx npm@11 install) — npm 10.2 crashes on this tree
npm run build        # vite build + sync into theme/
npm run watch        # rebuild on change (run alongside `npm run dev`)
npm run dev          # shopify theme dev --path theme  (needs store access)
npm run check        # typecheck + unit tests + build + JSON check + Theme Check
npm run package      # build + shopify theme package
```

## What exists now (mapped to master-plan IDs)

| Area | Status |
|---|---|
| Build pipeline (D-05) | Done: flat hashed chunks, owned-asset sync, generated asset snippet. CDN loading not yet proven (spike S1) |
| `NkElement` lifecycle (04 §5.1) | Done, unit-tested |
| Services: request/Sequencer, sections, overlay (native `<dialog>`), editor adapter, announce | Done |
| Cart service (CA-01): queue, coalescing, line keys, ambiguous-add reconciliation | Done, unit-tested |
| Header N-01 (sticky reveal, overlay surface, cart count), announcement N-02 (static) | Done |
| Desktop nav N-03 | Native `<details>` disclosures with link + separate toggle. `nk-mega-menu` with floating panel is P1 |
| Phone drawer N-04 | Done (level panels, Back, focus, breakpoint close) |
| Cart drawer CA-02 / cart page CA-03 / line item CA-04 | Done; cart page works without JS |
| Product page PR-01/02/04/05/07 | Gallery, `option_values` picker with explicit size choice, size-chart metaobject + page fallback, buy form, accordions, `@app` blocks |
| Product card DC-03, collection DC-01, featured collection CS-03 | Done (no filters yet) |
| Settings, colour schemes, presets Signal + Quiet | Done (fonts are placeholders until the brand is chosen) |
| Not started | Predictive search N-05, filters/sort DC-02, quick add DC-04, sticky buy bar, hero/tiles/media-text sections, `nk-reveal`/`nk-marquee`/`nk-tabs`, schema label translation |

## Licence notes

- Skeleton code: Shopify's modified MIT licence (see `docs/LICENSES`).
- The example components in `../example componenets` are **not** copied. Any rewrite is
  clean-room from master-plan/05.
