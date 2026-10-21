# NKIL theme — master plan package

Prepared 21 October 2026. This folder plans an original, reusable Shopify Online Store 2.0 theme for a clothing store. It is planning only: no code has been written, nothing is deployed, and nothing is published. "NKIL" is the project folder name, not the brand.

## How this relates to the earlier planning files

The earlier documents in the parent folder (`../00-…` to `../10-…`, `../references/`, `../owner-questionnaire/`) are **preserved unchanged**. This package builds on them and reconciles them. Where they differ, the [decision register](00-executive-brief.md#decision-register) and the contradiction table in [01 §4](01-source-inventory-and-evidence.md#4-contradictions-and-how-they-were-resolved) record the change. Each spec file below states which earlier spec it refines.

Precedence: **master-plan → earlier specs → reference audits**. The earlier files still hold detail worth reading, especially the reference audits and the questionnaires.

## Read in this order

| # | File | What it gives you |
|---|---|---|
| 00 | [Executive brief and decisions](00-executive-brief.md) | Scope, architecture, design direction, rewrite strategy, first milestone, decision register D-01 to D-22 |
| 01 | [Source inventory and evidence](01-source-inventory-and-evidence.md) | What was read or measured, the example-component files, phone-viewport findings, contradictions, gaps |
| 02 | [Reference synthesis and design direction](02-reference-synthesis-and-design.md) | Lessons from the reference stores, the "Cut & Label" direction, tokens, composition rules |
| 03 | [Claude Design outputs and handoff](03-claude-design.md) | The 9-artboard canvas and what it settled; brief for the next design round |
| 04 | [Architecture and build](04-architecture-and-build.md) | Suitability check, repo layout, Vite and CDN pipeline, `NkElement`, services, events, spikes S1 to S8 |
| 05 | [Component rewrite matrix](05-component-rewrite-matrix.md) | All 23 example components (actual source): provenance, licence, disposition, native target (17 fields each) |
| 06 | [Header, menus, search, overlay](06-header-navigation-search.md) | N-01 to N-06 |
| 07 | [Collections, cards, filters, quick add](07-collections-cards-filters.md) | DC-01 to DC-04 |
| 08 | [Product page](08-product.md) | PR-01 to PR-08, including the variant-picker state machine and size-chart metaobject |
| 09 | [Cart and commerce](09-cart-commerce.md) | CA-01 to CA-07, queue and recovery, failure matrix |
| 10 | [Content sections](10-content-sections.md) | CS-01 to CS-10, templates, content requirements |
| 11 | [Editor, data, presets, reuse, upgrades](11-editor-data-presets-reuse.md) | Lifecycle mechanisms, block model, settings, metafield contracts, presets, migrations, handover |
| 12 | [Phone, accessibility, motion, performance](12-mobile-accessibility-motion-performance.md) | Shared rules, budgets, motion tokens, device script |
| 13 | [Testing, roadmap, release](13-testing-roadmap-release.md) | Work packages, milestones M0 to M6 with definitions of done, parallel work, risks, evidence |
| 14 | [Owner decisions, assets, risks](14-owner-decisions-assets-risks.md) | OD-01 to OD-16 with defaults, required assets, consolidated questions |

## Component spec template

Every major component spec (files 06 to 10) covers the same points:

- purpose
- reference evidence
- behaviour
- states and transitions
- data and settings
- responsive behaviour
- motion and reduced motion
- editor lifecycle
- errors and fallback
- shared services
- code locations
- acceptance criteria

## Evidence labels

- **Observed:** seen or measured in this session or the earlier one.
- **Interpretation:** what we think the observation means.
- **Proposal / Decided:** our plan.
- **Spike:** a direction that must be proven on a real store in M1.
- **Pending owner:** waiting on an owner decision.

Nothing in this package has been tested on a Shopify store, in the theme editor, or on a physical phone. Those tests are the M1 to M5 gates.
