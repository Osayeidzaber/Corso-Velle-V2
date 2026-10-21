# 00 — Executive brief, scope, and decision register

Status: master plan, 21 October 2026. Planning only — no theme code, store, deployment, or publication has been created. "NKIL" is a project identifier, not a brand.

## What we are building

An original **native Shopify Online Store 2.0 theme** for a clothing store that (1) launches and runs the owner's store and (2) installs on other stores/brands through settings, presets and documented data contracts — with no brand-specific code.

Quality is judged by observable outcomes, in this order when they conflict:

1. **Correct commerce** — the exact variant, quantity and price reach the cart and checkout; failures are honest.
2. **Phone usability** — every step from menu to checkout handoff is comfortable at 320–430px with real keyboards, safe areas and touch.
3. **Editor stability** — sections/blocks survive add, duplicate, reorder, remove, re-render and upgrades.
4. **Accessibility and performance** — keyboard/screen-reader paths, reduced motion, measured budgets.
5. **Distinctive presentation** — campaign art direction, composition and deliberate motion that never blocks buying.

## Recommended architecture in one paragraph

Liquid renders every page's essential HTML through JSON templates, header/footer section groups, sections, theme blocks and parameterised snippets. Small **TypeScript light-DOM custom elements** (one base class with built-in cleanup) enhance bounded regions. Six shared services — request, section rendering, cart queue, overlay manager, live announcer, editor adapter — plus a motion helper are the only cross-component state. **Vite** compiles TypeScript and component CSS into a **flat `assets/`** folder with hashed chunks and generates a Liquid snippet that references them through `asset_url`. No React/Vue runtime, no animation library, no client router at launch.

## Recommended design direction in one paragraph

Working direction **"Cut & Label"** (proposal, not owner-approved): unboxed, large campaign photography and condensed display type set against a quiet light shopping surface, with every commercial fact — sizes, availability, fit, price — set in a precise mono "spec" voice inspired by garment labels. One merchant accent ("signal") marks focus, active filters and the primary action. Motion is a short decisive *cut* (clip-path wipe) on campaign moments only; the purchase path uses only instant feedback and overlay transitions. See [02](02-reference-synthesis-and-design.md) and the [Claude Design canvas](03-claude-design.md).

## Component rewrite strategy in one paragraph

The 23 example files (filled by the owner after the first inventory) contain React source or usage demos from React Bits, motion-primitives, Fancy, Magic UI and Aceternity, plus one shadcn docs page; most depend on GSAP or motion. We treat every example as a *behavioural reference only*: extract intent and states, then **clean-room** rebuild as Liquid markup + component CSS on tokens + TypeScript custom elements on our base class and services. React Bits (MIT + Commons Clause, forbids redistributing "ported versions") and Aceternity (forbids themes/templates) code is never copied or consulted line-by-line during implementation. The 23 inputs consolidate into **6 native components/utilities** (disclosure, marquee, reveal, tabs, header-menu patterns, expanding media) covering 13 of the 23 (adapted/adopted/merged); 6 are rejected and 4 deferred. See [05](05-component-rewrite-matrix.md).

## Decision register

Each decision lists what it supersedes in the earlier plan (files in the parent folder). Status: **Decided** (planning-level, revisit only with new evidence), **Spike** (decided direction, confirmed in M1), **Pending owner**.

| ID | Decision | Status | Supersedes / reconciles |
|---|---|---|---|
| D-01 | Deliverable is a native OS 2.0 theme: JSON templates, header/footer section groups, sections, theme blocks, snippets. No headless/Next.js/React storefront. | Decided | Confirms 01 ADR-01 |
| D-02 | Liquid renders all essential content and commerce forms; JS only enhances. Every core journey has a no-JS path. | Decided | Confirms 01 |
| D-03 | **Base = Shopify Skeleton pinned at `a4f32d3` (26 Feb 2026)**, the last section-based commit, imported verbatim then extended (owner asked for a well-known repo as the base, 21 Oct 2026). Not Skeleton `main` (rc-v2 has no sections/JSON templates); not Dawn/Horizon (licences limit derived themes to one merchant). | Decided | **Replaces** 01 ADR-03; revised from "original code only" |
| D-04 | TypeScript light-DOM custom elements on one `NkElement` base class; no UI framework runtime. | Decided | Confirms ADR-01; refines with base-class contract ([04](04-architecture-and-build.md)) |
| D-05 | Vite → flat `theme/assets/`, hashed chunk names, manifest → generated `snippets/nk-assets.liquid`. Compare `vite-plugin-shopify@5` vs owned adapter in spike S1. No HMR dependency; `shopify theme dev` + `vite build --watch` is the baseline loop. | Spike | Refines 01 build contract |
| D-06 | ~~No animation library at launch.~~ **Superseded 2026-10-22 at the owner's request:** GSAP 3.15 (ScrollTrigger, SplitText; "no charge" licence) is loaded lazily as its own chunk only when a motion component is on the page, and Tailwind v4 utilities (no preflight, tokens mapped to `--nk-*`, `important`) sit beside the theme CSS. Reduced-motion and no-JS paths are unchanged: content is visible without GSAP. | Superseded | Owner request (Riviera redesign) |
| D-07 | Shared services: `request`, `sections`, `cart`, `overlay`, `announce`, `editor`; helper `motion`. Components never implement their own cart calls, scroll locks or focus traps. | Decided | Formalises 01/02/03 |
| D-08 | Variant selection re-renders the picker region via `?section_id=&option_values=`; no full variant matrix in JS; combined-listing siblings replace the whole product section. | Spike (S3) | Refines 05 P-03 |
| D-09 | Cart drawer is the default "after add" behaviour; full cart page always exists. One serialized queue, line **keys** for edits, reconcile on ambiguous outcomes, no automatic re-adds. | Decided (behaviour after add is OD-05) | Confirms 06 |
| D-10 | Collection/search filtering uses Shopify storefront filters; results re-rendered via Section Rendering; URL is the source of truth. | Decided | Confirms 04 C-06 |
| D-11 | Header renders `<shopify-account>` when customer accounts are enabled; no legacy customer templates. | Decided | **New** (platform change July 2026) |
| D-12 | Example components are rewritten clean-room; licence matrix in [05](05-component-rewrite-matrix.md). | Decided | **New** |
| D-13 | Visual direction "Cut & Label" as the working proposal. | Pending owner (OD-02) | Refines 00 visual proposal |
| D-14 | Two presets from one codebase: **A "Signal"** (campaign streetwear: light shop surface + dark campaign scheme) and **B "Quiet"** (editorial). | Decided | Reconciles 00 vs 02 (X-09) |
| D-15 | Size guide data = `size_chart` metaobject referenced from the product, with rich-text/page fallback; rendered as an HTML table in a shared dialog. | Spike (S7) | Refines 05 P-05 |
| D-16 | Collections paginate with real links by default; Load more is a section option; no infinite scroll. | Decided | Resolves X-10 |
| D-17 | Quick add never preselects a meaningful option; single-variant products may add directly. | Decided | Confirms 04 C-04 |
| D-18 | Global "Motion" setting: Off / Minimal / Standard. `prefers-reduced-motion` and editor selection always win. | Decided | New |
| D-19 | Budgets: theme JS ≤60 KB gzip (home/collection), ≤90 KB (product); CSS ≤50 KB gzip per core page; per-file JS ≈≤10 KB compressed (Theme Check default) unless an exception is recorded. | Decided | Reconciles X-06 |
| D-20 | Distribution: owner's store + private reuse first; Theme Store is a separate later workstream with a fresh requirements audit. | Pending owner (OD-01) | Confirms 01 |
| D-21 | Shopping-control touch targets ≥44×44 CSS px; nothing interactive below 24×24. | Decided | Reconciles X-07 |
| D-22 | WCAG 2.2 AA is the internal target; compliance is claimed only for tested journeys. | Decided | Reconciles X-08 |

## Scope by priority

| Tier | Contents |
|---|---|
| **P0 — first complete journey (M2)** | Header (solid + sticky), mobile drawer, simple dropdown, predictive search, collection with filters/sort/pagination, product card, quick add, product page (gallery, picker, size guide, accordions), cart drawer + cart page, checkout handoff, `<shopify-account>`, footer basic, editor lifecycle for all of these |
| **P1 — release completeness (M3–M4)** | Campaign hero (image/video), collection tiles, featured collection (grid/rail), media-with-text, campaign tiles, rich text/FAQ, newsletter, full footer, announcement ticker, mega menu with promo blocks, overlay header, sticky buy bar, recommendations (single + tabs), model/packshot toggle (if data exists), reveal/cut motion, Preset B, supporting templates (search, 404, page, contact, blog/article if in scope, password, gift card) |
| **P2 — later, individually briefed** | Expanding-media section, reels rail, shoppable lookbook, split/character headline modes, letter-swap link style, wishlist, membership, cart upsells, free-shipping bar, discount field |

## The first implementation milestone (M1 → M2)

**M1 (spikes, on a real development store):** prove the build through the Shopify CDN, the component lifecycle in the editor (duplicate/reorder/remove), the high-variant picker, the cart queue, the overlay manager on iOS, an app block surviving re-render, and the size-chart metaobject. **M2 (first complete journey):** a shopper on a real phone goes home → menu → collection → filter → product → size guide → add → edit cart → Shopify checkout (test mode), and a merchant adds/duplicates/reorders those sections in the editor without refresh workarounds. Details and gates: [13](13-testing-roadmap-release.md).

## The owner decisions that most change the next stage

1. **OD-01 Distribution route** (own store only / several own brands / sell or license / Theme Store) — affects licensing, metaobject dependence, Theme Store-specific requirements.
2. **OD-03 Colour model** (options within one product vs. separate linked products vs. combined listings) — changes picker and card architecture.
3. **OD-04 Size data** (structured garment/body measurements, units, per-category charts) — size guide content contract.
4. **OD-05 After-add behaviour and quick add** — drawer vs. page, quick add on/off.
5. **OD-06 Markets, languages, currencies** — fixtures, localization UI, copy.
6. **OD-07 Confirm the effect shortlist** — which signature headline reveal (cut / fold / split), whether the editorial drawer and floating mega menu are wanted, and whether a real review source exists for a testimonial wall.
7. **OD-02 Approve or redirect the visual direction** — before M3 visual polish.

Full list with defaults: [14](14-owner-decisions-assets-risks.md).
