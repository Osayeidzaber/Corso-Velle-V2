# 13 — Testing, roadmap, dependencies, and release gates

This file refines [../10-implementation-roadmap.md](../10-implementation-roadmap.md) and [../09-quality-and-release.md](../09-quality-and-release.md). It keeps their fixture catalog, journeys Q-01 to Q-14 and defect severity rules, and adds work packages, spikes and definitions of done.

## 1. Work packages (WP)

| WP | Owns | Depends on | Key outputs |
|---|---|---|---|
| WP0 Inputs | Owner answers (OD-*), dev store, collaborator access, sample catalog and media | — | Store access, fixture catalog, approved direction |
| WP1 Foundation | Repo, build (S1), `NkElement`, services, tokens, layout, `nk-config`, CI | WP0 store access | Deployable empty theme, CI green |
| WP2 Editor | Editor adapter (S2), placeholder snippet, lifecycle test harness | WP1 | Editor script tooling |
| WP3 Navigation | Header, announcement, mega menu, drawer, predictive search, overlay usage | WP1, overlay | N-01..N-06 |
| WP4 Discovery | Product card, collection, facets, pagination, quick add, rail | WP1, cart service, picker (quick add) | DC-01..DC-04 |
| WP5 Product | Gallery, picker (S3), buy buttons, size guide (S7), accordions, sticky bar, recommendations | WP1, cart service | PR-01..PR-08 |
| WP6 Commerce | Cart service (S4), drawer, cart page, line item, checkout handoff | WP1 | CA-01..CA-07 |
| WP7 Content | Hero, tiles, featured collection, media-text, campaign tiles, rich text/FAQ, newsletter, footer, templates, marquee, reveal, tabs | WP1, WP2 | CS-01..CS-10 |
| WP8 Presets & reuse | Preset A/B, second store, data contracts, docs, migration script | WP3–WP7 | Reuse proof |
| WP9 Validation | Fixtures, Playwright journeys, device runs, accessibility, performance, evidence bundles | runs alongside all WPs | Gate evidence |

## 2. High-risk technical spikes (all in M1, on a real development store)

S1 build through the CDN · S2 editor lifecycle · S3 high-variant picker · S4 cart queue · S5 app block survival · S6 overlay on iOS/Android · S7 size-chart metaobject · S8 product info theme blocks. Questions, pass evidence and fallbacks are in [04 §7](04-architecture-and-build.md#7-technical-spikes-m1--each-needs-a-dev-store).

## 3. Milestones

### M0 — Inputs and design lock for the slice
- **Deliverables:**
  - The owner answers forms 1, 3 and 4, at minimum OD-01 to OD-07.
  - A development store with a test catalog. It must include sizes and colours, a product with more than 250 variants, sold-out items, missing combinations, and products with and without metafields.
  - A second round of Claude Design work if the design direction changes.
- **Definition of done:** OD-01, OD-03, OD-04 and OD-05 are answered or default-accepted in writing, the store is accessible, and the fixture list is created.
- **Parallel:** WP1 scaffolding can start as soon as the store exists.

### M1 — Foundation and spikes
- **Deliverables:**
  - An unpublished theme on the dev store with the build pipeline, base class, services, CI, and spikes S1–S8, each with a recorded result.
  - Decision log entries for anything that changed.
- **Definition of done:**
  - Every spike passes, or its fallback has been chosen and the docs updated.
  - Theme Check is clean.
  - Two duplicated test sections survive the editor script.
  - The cart queue unit tests pass.
- **Parallel:** S1 and S2 come first (one person). S3, S4 and S7 run in parallel after S1. S5, S6 and S8 follow.

### M2 — First complete Shopify shopping journey (P0)
- **Deliverables:**
  - Header and drawer, search, collection with filters and pagination, card, quick add, product page (gallery, picker, size guide, accordions), cart drawer and page, footer (basic), `<shopify-account>`, and test-mode checkout handoff.
  - All of the above as editor-configurable sections.
- **Definition of done:**
  - Q-01 to Q-12 pass on Playwright and on two physical phones.
  - The editor script passes for every P0 section.
  - Baseline JS, CSS and Lighthouse numbers are recorded.
  - No blocking or major defects.
  - The owner walks the journey on their own phone (L27 tasks).
- **Parallel:** WP3, WP4/WP5 and WP6 by separate developers. They must not create their own overlay or cart logic.

### M3 — Visual system and content library (P1)
- **Deliverables:**
  - CS-01 to CS-10, mega menu with promos, overlay header, sticky buy bar, recommendations (single and tabs), model/packshot toggle (if data exists), marquee, reveal, motion tuning, and final tokens with real media.
- **Definition of done:**
  - Each section passes the editor script, alone and in combinations.
  - Device script on real media.
  - Budgets still met.
  - The design review compares the build with the canvas states.
  - Every CTA has a destination.

### M4 — Reuse and integrations
- **Deliverables:**
  - Preset B.
  - The second store with a different catalog, currency and language.
  - App tests for the chosen apps (OD-09).
  - Data-contract docs.
  - Migration script and an upgrade test from the M3 tag.
- **Definition of done:** Q-13 and Q-14 pass, upgrade preserves customised layouts, and the hardcoding check is clean.

### M5 — Release candidate
- **Deliverables:**
  - Full device and browser matrix.
  - Accessibility manual runs.
  - Three-run Lighthouse reports.
  - Link check.
  - Clean ZIP install on a fresh theme.
  - Evidence bundle, docs, training recording, and rollback plan.
- **Definition of done:** No blocking or major defects, budget exceptions explained, and owner sign-off. Publishing is a separate action that the owner requests.

### M6 — P2 enhancements
Each enhancement gets its own brief covering data, backend, content, benefit, cost, states and tests. Candidates: expanding media, reels, lookbook, split headline, wishlist, membership, upsells, free-shipping bar, discount field.

## 4. Scope tiers

- **P0:** listed in [00 §Scope](00-executive-brief.md#scope-by-priority) and built in M2.
- **P1:** built in M3 and M4.
- **P2:** built in M6.

A tier can move only through a decision log entry.

## 5. Estimates (deliberately not precise)

No calendar estimate is credible until M1. The size of the work depends on:

- whether S3, S5 and S8 pass on the first approach
- the catalog option model (OD-03)
- the number of markets and languages (OD-06)
- app integrations (OD-09)
- when assets will be ready

**Relative sizing**, assuming one experienced Shopify developer plus part-time QA:

| Milestone | Relative size |
|---|---|
| M1 | Medium |
| M2 | Largest single milestone |
| M3 | Large |
| M4 | Medium |
| M5 | Medium |

Re-estimate at the end of M1 using actual spike outcomes. Report ranges with the assumptions listed.

## 6. Testing layers

| Layer | Tool | Scope |
|---|---|---|
| Static | `tsc`, Theme Check, JSON schema/locale validation, hardcoding grep, flat-asset check | Every commit |
| Unit | Vitest with happy-dom | cart queue, request sequencer, picker state machine, overlay service, URL state, migration transforms |
| Component | Playwright against the unpublished preview theme (dev store) | Each component's acceptance list, at widths 320–1440 |
| Journey | Playwright | Q-01 to Q-14 (Q-12 stops at the checkout page in test mode) |
| Editor | Manual scripted runs, plus an automated subset where feasible | §8 of [11](11-editor-data-presets-reuse.md) |
| Accessibility | axe-core in Playwright, then manual keyboard and screen-reader runs | P0 journeys |
| Performance | Lighthouse CI (fixed profile) and bundle-size check | Home, collection, product |
| Visual | Screenshot diffs of deterministic fixture states (the canvas states) | Header, card, PDP options, drawers |
| Device | Physical iOS and Android script | M2, M3, M5 |

**Reference stores are never mutated.** All commerce tests run on the authorised development store.

## 7. Release evidence bundle

Each release candidate's bundle contains:

- **Identity:** commit, build ID, theme version, lockfile, store and theme IDs.
- **Environment:** fixture version, and device/browser versions.
- **Results:**
  - journey results
  - editor script records
  - accessibility results
  - Lighthouse reports and bundle sizes, theme and apps separated
  - screenshots and videos
- **Open items:** known issues and app limitations.
- **Procedures:** migration notes and the rollback procedure.

Credentials are never included.

## 8. Risks and mitigation

| Risk | Early signal | Mitigation |
|---|---|---|
| Owner expects a literal port of an example (exact GSAP timing, hover-only menus) | Review feedback | Show the matrix rationale (licence, a11y, phone cost); native targets keep the visual intent |
| Vite output fails on the CDN or in the editor | S1 | Fallback: Horizon-style no-build importmap with per-file TypeScript compilation |
| Theme-block product info is unworkable | S8 | Use local blocks in `main-product` |
| Picker re-render breaks app blocks | S5 | Narrower replace regions |
| iOS scroll-lock bugs | S6 | Fixed-body fallback, `<dialog>` evaluation |
| Metaobjects unavailable or rejected (Theme Store) | OD-01 | Page and rich-text fallback as the primary path |
| Owner answers delayed | M0 slips | Proceed with documented defaults (OD table). Content remains blocked. |
| Scope creep from effects | Requests for more animation | Apply the [05 §2](05-component-rewrite-matrix.md#2-why-an-effect-earns-a-place-unchanged) test and the decision log |
| Licence contamination | Code that looks copied from React Bits or Aceternity | Clean-room rule, PR checklist item, docs/LICENSES review |
| Platform changes (Liquid preview tags, Skeleton changes, account component) | Changelog | Re-verify the platform list at M1, M3 and M5 |
| Performance regressions from media or apps | Budget CI | Separate measurements, content budgets in the content guide |

## 9. Decisions that would change scope or architecture

- **OD-01 Theme Store:** brings in its full requirements list. That means `<shopify-account>`, the required features list, no custom metaobject definitions, a possibly unminified-JS rule, and a fresh audit. It does not require a new architecture.
- **OD-03 Combined listings or a sibling-heavy catalog:** NAVIGATE_SECTION becomes a primary path, and the card colour summary changes.
- **OD-06 Many markets and languages, or RTL:** localisation testing grows, and RTL needs logical CSS properties (use them from the start anyway).
- **OD-09 Subscription, bundle or review apps:** changes the line-item rendering and the app block placements.
- **A request for a framework island (Vue or React):** only with a measured need, bounded mount and unmount, and no second cart state (see the Theme Lab decision).
