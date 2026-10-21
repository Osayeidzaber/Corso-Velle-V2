# NKIL — reusable Shopify clothing theme plan

Prepared 21 October 2026 (Asia/Dhaka). This folder contains research and proposed specifications, not a built theme. NKIL is the project folder name; public branding is not assumed.

## Start here

Read [design direction](00-design-direction.md) for the reference synthesis and scope, then [implementation roadmap](10-implementation-roadmap.md) for the sequence and gates. Open the specialist document when working on that part of the theme; this index intentionally does not duplicate the full plan.

## Planning documents

| File | Owns |
|---|---|
| [00 — Design direction](00-design-direction.md) | Reference-to-decision map, visual proposal, priorities, open inputs |
| [01 — Architecture](01-architecture.md) | Liquid/Vite/component decisions, build/CDN contract, data/service boundaries |
| [02 — Editor and reusability](02-editor-and-reusability.md) | Section/block design, lifecycle, settings, presets, merchant-data preservation |
| [03 — Header, navigation, search](03-header-navigation-search.md) | Header states, desktop/mobile menus, shared overlays, predictive search |
| [04 — Collections and product cards](04-collections-and-product-cards.md) | Grid, quick add, filters, history, pagination, model/packshot mode |
| [05 — Product detail](05-product-detail.md) | Gallery, variants, fit/size guidance, product data, sticky purchasing |
| [06 — Cart and commerce](06-cart-and-commerce.md) | Drawer/page, mutation ordering, recovery, line identity, checkout handoff |
| [07 — Homepage and content](07-homepage-and-content.md) | Section library, page rhythm, media/content requirements, supporting templates |
| [08 — Mobile and motion](08-mobile-and-motion.md) | Phone layouts, keyboard/safe areas, gestures, motion tokens, real-device script |
| [09 — Quality and release](09-quality-and-release.md) | Fixtures, measurable budgets, critical journeys, browser/editor gates |
| [10 — Implementation roadmap](10-implementation-roadmap.md) | Milestones, dependencies, deliverables, risks, next concrete proof |

## Reference audits

| File | Coverage |
|---|---|
| [Hype Town](references/hypetown.md) | Full homepage inventory, campaign/product rhythm, collection, product sizing, search and empty cart |
| [Rush Mode](references/rushmode.md) | Full homepage, persistent navigation, collection, gallery/options, modal/accordions, cart/footer |
| [Wrongs & Rebels](references/wrclo.md) | Full homepage, model toggle/filter panel, product/size guide, search and cart overlays |
| [Theme Lab](references/theme-lab.md) | Selected source files, runtime/build/editor approach, keep/change decisions |

## Evidence labels

- **Observed:** visible or exercised behavior in a desktop browser, with source links and limits in each audit.
- **Inferred:** interpretation of observed behavior, not a verified internal implementation.
- **Proposed:** our future theme's behavior, defaults, architecture, or acceptance criteria.
- **Unverified:** behavior not established by this research; do not turn it into a compatibility claim.

Three research agents were used. Two reached a usage limit after reporting homepage/collection findings; their reports were completed by the primary researcher with additional browser checks. The third completed its full audit directly. All three homepages were explored through the footer. No physical-phone or Shopify-editor validation was available, no exact animation timings or performance benchmarks were measured, and no reference-store purchases/cart mutations were performed.

## How to use the plan

Before design lock, use the [owner questionnaire](owner-questionnaire/README.md): five staged Google Forms question banks with 270 detailed entries, setup/branching guidance, and a response-review template. The answers supply the brand, content, operational rules, and launch priorities needed to refine this plan.

Component documents define behavior and local acceptance scenarios. The editor document owns shared lifecycle/reuse requirements, the mobile document owns shared device/motion rules, and the quality document owns release gates. If a component adds a new interaction, apply those cross-cutting contracts rather than copying or weakening them.

All documents are proposals until their implementation gates pass. Sources were checked on the research date; revalidate platform requirements when implementation or distribution begins. No reference images, logos, copy, or theme source are licensed for reuse by this research.
