# Implementation roadmap and decision gates

Status: proposed sequence. No store, theme code, deployment, or automation has been created by this planning task. Effort estimates should follow the initial technical slice, catalog/app review, and chosen visual direction.

## Working method

Build one complete journey early. Each component includes its desktop, phone, editor, empty, pending, and error states before it is counted complete. Avoid building a polished homepage around unfinished buying behavior.

Use small reviewable milestones. The output of each is a real preview or evidence bundle with explicit pass/fail conditions. A phase does not finish merely because its code exists.

## M0 — Inputs and interaction design

**Dependencies:** this plan; brand/catalog/app inputs listed in [design direction](00-design-direction.md).

Tasks:

- Confirm public brand identity and one primary preset direction.
- Inventory real products, variant models, required markets/languages, size data, and apps.
- Prepare owned/licensed desktop/mobile media and a deliberately varied test catalog.
- Draw header states, mobile menu levels, search results, collection filters, product selection, size guide, and cart states.
- Establish the initial tokens: spacing, type scale, colors, radii, borders, media ratios, motion.

**Deliverable:** component/state designs at phone and desktop widths, content inventory, and confirmed release scope.

**Gate:** no unresolved basic flow such as how a shopper picks a size from quick add or closes a filter panel. Brand assets can remain temporary for the technical spike, but not for final visual sign-off.

## M1 — Foundation and high-risk spikes

**Dependencies:** test Shopify store/theme access and approved runtime/library versions.

| Task | Output | Gate |
|---|---|---|
| Original/Skeleton scaffolding | Valid deployable theme structure | Clean theme installation |
| Vite asset adapter | Manifest-to-Liquid mapping and owned asset handling | All chunks/CSS load through Shopify CDN |
| Component base | Local initialization/cleanup and instance IDs | Duplicate/reinsert component tests |
| Editor adapter | Selection and lifecycle behavior | Add/reorder/delete without refresh workaround |
| Overlay service | One active panel, focus/scroll lifecycle | Repeated open/close and removal safe |
| Variant spike | High-variant-aware selection and fragment boundaries | Correct price/media/ID for test cases |
| Cart spike | Serialized mutation/reconciliation | No wrong-line edits or duplicate retry |

**Gate:** resolve technical failures now; do not compensate by adding more libraries and postponing compatibility testing.

## M2 — Complete shopping slice

**Dependencies:** M1 passes.

Build header/menu/search, collection/grid/card, one product layout, size guide, quick add, cart drawer/page, and checkout handoff using real test-store data. Include an actual mobile layout and editor controls for the relevant sections.

**Deliverable:** a shopper can start from a simple homepage, find a product, select the intended size/color, add it, edit/remove items, and reach Shopify checkout in a test flow.

**Gate:** Q-01 through Q-12 in [quality](09-quality-and-release.md), plus the editor script for components in the slice. Capture initial JS/CSS and lab performance baseline. No real payment is needed.

## M3 — Complete visual system and content library

**Dependencies:** M2 shopping correctness and performance baseline.

Implement the P1 section inventory in [homepage](07-homepage-and-content.md), apply the visual system consistently, and add the restrained motion rules. Complete supporting templates and navigation destinations. Validate actual campaign crops and long/translated content.

**Deliverable:** branded homepage, collection/product layouts, content pages, footer, newsletter/contact behavior, and documented section settings.

**Gate:** every included section passes mobile/editor tests independently and in repeated combinations. Real media does not break the budget. Every visible CTA has a meaningful destination or action.

## M4 — Reuse and integration proof

**Dependencies:** M3 coherent store experience.

- Configure a second visually different preset using the same code.
- Install on a separate test store/theme with different menus/products and no original brand references.
- Test the actual selected app blocks and integration hooks.
- Document metafield/metaobject setup and default/fallback behavior.
- Exercise empty/missing content and absent optional apps.
- Prepare upgrade handling for merchant configuration and schema identifiers.

**Deliverable:** second preset/store proof plus merchant setup guide and integration limitations.

**Gate:** Q-13/Q-14 and configuration-preservation checks. A branch that duplicates the theme for each brand does not pass reuse.

## M5 — Release candidate

**Dependencies:** M4 and production content readiness.

Run the named physical-device/browser matrix, complete keyboard/screen-reader checks, run repeatable performance tests with real content, check all internal/utility links, and install the packaged ZIP from scratch. Fix blocking/major defects; rerun only affected checks plus the critical smoke journey after fixes.

**Deliverable:** versioned ZIP, source/lockfile, changelog, setup guide, migration notes, test evidence, preview, and rollback procedure.

**Gate:** documented results, no blocking/major defects, no unexplained budget exceptions, no missing configuration dependency. Publishing is handled as a separate deployment step when the user requests it.

## M6 — Optional enhancements

Reels, lookbook hotspots, wishlist, membership, richer recommendation tabs, and any custom discount/shipping UI need individual briefs. Each brief includes data/backend ownership, content requirement, expected shopping benefit, performance cost, mobile/editor states, and acceptance tests.

Do not let these expand the initial release accidentally. A feature can remain an optional disabled module without weakening the core theme.

## Work package ownership boundaries

Parallel work is appropriate after the shared contracts are fixed:

| Package | Owns | Must coordinate with |
|---|---|---|
| Foundation | Build, lifecycle, shared services, tokens | All component authors |
| Navigation | Header, menus, search | Overlay/editor services |
| Discovery | Cards, collection filters, pagination | Product quick-add and cart contracts |
| Product | Gallery, variants, size guidance | Cart and data setup |
| Commerce | Cart page/drawer, mutation service | Product, cards, app integrations |
| Content | Hero, tiles, editorial, footer, newsletter | Shared media/motion/editor contracts |
| Validation | Fixtures, journeys, device/editor evidence | All packages |

A component author must not independently invent another overlay manager or cart service. Shared contracts are versioned and reviewed before dependent changes merge.

## Risk register

| Risk | Early signal | Mitigation / decision point |
|---|---|---|
| Attractive prototype but poor Shopify fit | Works locally, fails editor replacement | M1 real-store/editor spike |
| Overbuilt feature set | Multiple media systems before cart works | P0/P1/P2 scope and milestone gates |
| Asset/chunk path problems | CDN module errors | Production-build preview test before many components |
| Variant mismatch | Price/media disagree under rapid changes | Single selection state and stale-response tests |
| Cart duplicate/line errors | Replayed timed-out requests or variant-ID line matching | Queue, reconciliation, line-key tests |
| Mobile overlay failures | Scroll locked, keyboard hides actions | Physical-device and lifecycle scripts |
| Merchant updates lose layouts | Defaults overwrite saved configuration | Update on unpublished copy with backups/migrations |
| Media/app regression | Page weight grows beyond baseline | Separate theme/app measurement and content budgets |
| Reuse only works for one brand | Hardcoded handles or exact content assumptions | Second-store proof before release |
| Marketplace requirements change | Distribution route selected late | Fresh requirements audit before submission |

## Decision log format for implementation

For each meaningful change to this plan, record: decision ID, date, trigger/evidence, chosen approach, alternatives considered, affected documents/components, and validation required. Do not silently change a core contract in one file while leaving others inconsistent.

## Next concrete deliverable

Begin M0 with phone and desktop component-state designs, then M1 with an actual Shopify preview. The first implementation demonstration should show the header/menu, one collection card, one working product picker, a size guide, and the cart inside the real editor. A standalone Vite mockup is useful for styling but is not proof of theme compatibility.
