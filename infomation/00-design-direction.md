# Design direction and reference synthesis

Status: proposed direction, based on 21 October 2026 research. The public brand identity and final art direction are not yet selected. NKIL is used only as a project identifier.

## The intended result

An original clothing storefront that feels confident and fluid on phones, has a distinctive campaign presentation, and lets a merchant change content/layouts safely in Shopify. Its foundation should install on a second store without brand-specific code changes.

World-class is treated as a set of observable qualities: clear product discovery, excellent image presentation, understandable sizing, correct commerce, accessible interactions, measured speed, and an editor that remains stable after changes. Typography is one ingredient.

## What the reference research actually establishes

Three agents researched the three stores independently. Rush Mode's full report was completed by its agent; Hype Town and W&R agents supplied full-homepage/collection findings before hitting a usage limit, and the primary researcher completed supplementary interaction checks and their reports. Each audit states its evidence boundaries.

All three homepages were reviewed through their lower sections/footer. Product and collection interfaces, size guidance, and empty-cart presentation were inspected. Mobile and Shopify-editor behavior were not tested. No populated cart, checkout, benchmark, exact animation timing, or framework provenance is claimed from the storefront reviews.

Detailed evidence lives in [Hype Town](references/hypetown.md), [Rush Mode](references/rushmode.md), [W&R](references/wrclo.md), and the separate [Theme Lab source review](references/theme-lab.md).

## Reference-to-decision map

| Observed pattern | Value for a clothing store | Our decision | Spec |
|---|---|---|---|
| Hype/W&R centered logo and split header actions | Brand recognition while keeping shopping visible | Supported desktop layout, compact separate mobile design | [Header](03-header-navigation-search.md) |
| W&R transparent header over campaign | Immersive first impression | Optional, only on an eligible hero with tested contrast | [Header](03-header-navigation-search.md) |
| Rush persistent direct category navigation | Fast entry to garment type | Direct-link variant for small catalogs | [Header](03-header-navigation-search.md) |
| Hype repeated banner + product group | Connects campaign imagery to purchasable items | Reusable sections, bounded default repetition | [Homepage](07-homepage-and-content.md) |
| Rush category grid and fit story | Browsing plus purchase context | Collection tiles and media-with-text sections | [Homepage](07-homepage-and-content.md) |
| W&R model/packshot switch | Compare fit and garment details | Optional explicit media-mapping feature | [Collections](04-collections-and-product-cards.md) |
| Hype visible sizes and quick-add affordance | Earlier availability discovery | Shared card and deliberate option-selection flow | [Collections](04-collections-and-product-cards.md) |
| Three different size-guide treatments | Size confidence near buying decision | Structured accessible data with shared panel behavior | [Product](05-product-detail.md) |
| W&R drawer vs Hype/Rush cart pages | Continuity versus reliable direct destination | Provide both using one commerce service | [Cart](06-cart-and-commerce.md) |
| Tickers and changing media | Campaign energy | Optional controlled motion, no purchase-blocking delay | [Mobile/motion](08-mobile-and-motion.md) |
| Hype reels/membership sections | Richer brand storytelling | Later enhancements with explicit data/backend scope | [Homepage](07-homepage-and-content.md) |

## Default visual proposal

Start with a light shopping surface, dark primary text, a high-contrast announcement/header option, and one merchant-controlled accent. Give campaign photography visual weight, use consistent portrait product media, and keep borders/iconography restrained. Let headings communicate hierarchy without overpowering prices and options.

Use a deliberate mix of full-width campaign sections and bounded shopping/content sections. Establish a small spacing scale and align recurring headings, grids, and CTAs. Mobile composition is designed first for the purchase journey, while desktop gains more breathing room and richer navigation.

Create a dark streetwear preset using the same components as a second proof of flexibility. It should change coherent settings, not introduce an alternate codebase.

These are proposed directions, not final visual approval. The next design artifact should show the same components in their actual open/error/selected states, not just static homepage hero concepts.

## Originality rules

Use the references to understand behaviors and hierarchy. Do not duplicate their logos, campaign copy, photography, distinctive artwork, or source theme. Own the layout system, interaction details, settings, and content. Use owned/licensed media for prototypes that will be shared or shipped.

Reuse means portable code and configuration. It does not mean every merchant should look identical or that every possible feature must be enabled by default.

## Priorities

| Priority | Includes | Why |
|---|---|---|
| P0: core proof | Header/menu/search, product card, collection, product selection, size guide, cart, editor lifecycle | Establish the complete shopping experience |
| P1: release content | Campaign hero, tiles, featured collection, story section, newsletter, footer, supporting templates, second preset | Make a complete maintainable store |
| P2: optional expansion | Reels, shoppable lookbook, richer recommendations, wishlist/membership integrations | Add only after core quality and content readiness |

Performance/accessibility/mobile/editor tests apply to every priority; they are not a final optional polish phase.

## Decisions already proposed

- Native Liquid theme; Vite/TypeScript/custom elements; no separate Next.js storefront.
- Original/Skeleton-based foundation; Theme Lab as a source of ideas.
- Shared overlay and cart services, with independent component instances.
- Real cart page even when the drawer is primary.
- Real product/variant data and locale-aware routes/money.
- Bounded homepage product/media loading and optional decorative motion.
- Merchant settings and data preserved across updates.
- Second brand/preset as a concrete reuse test.

## Inputs still needed before implementation/design lock

| Input | Why it matters | Safe planning assumption |
|---|---|---|
| Brand name/logo/colors and owned imagery | Final visual identity | Neutral project branding in early prototype |
| Store/dev-store access | Real Liquid/editor/commerce validation | Plan only until access exists |
| Catalog size, options, markets, languages | Fixture/data scope | Apparel with varied size/color options; no hardcoded currency |
| Current must-have apps | Integration boundaries | Core theme works without optional apps |
| Reuse route: private stores/direct sale/Theme Store | Distribution requirements | Preserve original-code option; no marketplace acceptance promise |
| Actual policy/size-chart data | Trust and purchase accuracy | Test content clearly marked; no invented claims |

These are future implementation inputs, not reasons to leave this planning package incomplete.
