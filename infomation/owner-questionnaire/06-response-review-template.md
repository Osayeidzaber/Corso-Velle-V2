# Owner-response review and project brief template

For the design/development team after the owner submits the forms. This is not another owner questionnaire. Duplicate this template for the actual response review; leave unknowns visible rather than filling them with assumptions.

## Review record

Project/brand: [pending]

Reviewer and date: [pending]

Forms received / missing: [pending]

Response versions or latest edit date: [pending]

Final decision maker: [pending]

## 1. One-paragraph brief

We are building [store purpose] for [main customer], selling [catalog/positioning] in [markets/languages]. The store should feel [specific visual/interaction direction] and help shoppers [main tasks]. Launch succeeds when [observable outcomes]. The first release includes [agreed essentials]; [named later features] are deferred.

## 2. Evidence and confidence

Use these labels consistently:

- Confirmed fact: supported by owner/data and ready to use.
- Owner preference: useful direction, still subject to design/testing.
- Proposed business rule: needs approval before publication or implementation.
- Estimate: useful for planning, not a measured baseline.
- Recommendation needed: owner explicitly wants a decision from the team.
- Unresolved: contradictory, missing, or dependent on another decision.

Keep the question IDs beside every material decision.

## 3. Business and customer summary

| Topic | Owner response and question IDs | Implication | Open item |
|---|---|---|---|
| Primary goal and next priorities | [A10–A14] | [pending] | [pending] |
| Main customer and concerns | [A29–A43] | [pending] | [pending] |
| Positioning and proof | [A17–A28] | [pending] | [pending] |
| Markets/languages | [A32–A33, O26–O29] | [pending] | [pending] |
| Reuse expectations | [A47–A49, L28] | [pending] | [pending] |

## 4. Visual and interaction direction

| Decision | Proposed direction | Owner evidence | Validation needed |
|---|---|---|---|
| Palette/type/spacing | [pending] | [V11–V21] | [actual media, contrast, phone] |
| Homepage rhythm | [pending] | [V22–V33] | [content readiness, layout] |
| Header/navigation | [pending] | [V34–V39, S01–S10] | [desktop/phone/open states] |
| Motion level | [pending] | [V40–V46] | [reduced motion, speed, interruption] |
| Product presentation | [pending] | [S11–S48] | [real product fixtures] |
| Cart behavior | [pending] | [S49–S56] | [correctness/focus/errors] |

For every adopted reference, write: source → exact useful pattern → original adaptation → customer benefit → test. Do not substitute a screenshot collection for actual behavior decisions.

## 5. Proposed launch scope

| Capability | Customer/business reason | Question IDs | Launch / Later / Excluded | Dependency | Acceptance example |
|---|---|---|---|---|---|
| [feature] | [need] | [IDs] | [priority] | [content/platform/app] | [testable outcome] |

Separate core quality from optional features. A simpler launch can still require correct pricing/variants, usable phone controls, accessible core journeys, and stable editor behavior.

## 6. Data, content, and integration checklist

| Item | Ready / Draft / Missing | Owner | Required date | Blocked feature |
|---|---|---|---|---|
| Brand assets | [V11–V17] | [pending] | [pending] | [pending] |
| Campaign imagery/mobile crop | [V23–V27, V47] | [pending] | [pending] | [pending] |
| Product data and imagery | [O09–O19, S26–S31] | [pending] | [pending] | [pending] |
| Size charts/fit guidance | [S39–S44] | [pending] | [pending] | [pending] |
| Inventory source/rules | [O20–O25] | [pending] | [pending] | [pending] |
| Shipping/returns/policies | [O33–O44] | [pending] | [pending] | [pending] |
| Payment/market setup | [O26–O32] | [pending] | [pending] | [pending] |
| Apps/marketing | [O45–O52, S57–S64] | [pending] | [pending] | [pending] |
| Migration/redirect inputs | [O01–O08] | [pending] | [pending] | [pending] |

Do not copy customer records or access secrets into the brief. Reference the agreed restricted access process instead.

## 7. Contradictions and useful follow-ups

Check these combinations before design lock:

| Potential conflict | Look at | Resolve by asking for a concrete choice |
|---|---|---|
| Very animated + fastest possible low-end-phone experience | V40–V46, A42 | Which effects belong only in campaign areas, and which can be simplified? |
| Many header actions + very minimal phone header | V34–V37, S06 | Which actions deserve primary placement? |
| Model/packshot toggle + only one image per product | S13, V49, S26 | Prepare both images or defer/hide the control? |
| Rich filters + inconsistent product attributes | S17, O13/O18 | Who will normalize the required data before launch? |
| Low-stock messaging + delayed/manual inventory | S47, O20–O25 | Can accuracy be guaranteed, or should the message be omitted? |
| Promise free/fast shipping + several unresolved rules | O33–O39 | What approved conditions can the site state accurately? |
| Loyalty/wishlist/restock feature + no supporting system | S57–S63, O45/O47 | Choose a service, scope a backend, or defer the feature? |
| Existing search traffic + restructuring URLs | O03/O04/O06 | Map valuable old destinations and approve migration behavior. |
| Fixed launch + assets not ready | L16–L22, V47 | Move launch or agree a smaller content-ready scope? |
| Broad customization + concern about editor mistakes | O54–O59 | Use coordinated presets/limits for the risky settings. |
| Everything marked essential + limited budget | L01–L15 | Rank actual customer outcomes and propose phased delivery. |
| Multiple approvers + no consolidated decision | A04, L24/L25 | Nominate the final decision maker and feedback owner. |

Ask follow-ups only for unresolved decisions; do not ask the owner to repeat clear answers.

## 8. Acceptance criteria in plain language

Complete statements like these using the actual answers:

- A phone shopper can find [category/size] through [menu/search/filter path].
- Choosing [unavailable combination] shows [approved explanation/recovery] and cannot add the wrong variant.
- The size guide shows [correct garment chart/units] without losing the chosen options.
- A successful add updates [drawer/page/count] with the correct variant, quantity, and price.
- If a request fails, the shopper sees [clear recovery] without false success or duplicate adds.
- The owner can change [named content/layout] in the editor without code and without breaking the phone view.
- A second store can change [branding/catalog/preset] using the agreed reuse controls.
- Actual launch policies, contact links, media, and campaigns have named approval owners.

Attach the agreed browser/device/editor and performance gates from the main plan; owner preference does not replace technical validation.

## 9. Budget, schedule, and approval record

Budget/currency and exclusions: [L09–L15]

Launch target and firmness: [L16–L18]

Content dependencies and owners: [L19]

Review turnaround and availability: [L20–L21]

Change process: [L29]

Handover/support expectations: [L32–L33, O53–O58]

Named decisions needing owner approval: [pending]

## 10. Update the existing theme plan

| Questionnaire area | Planning document to update |
|---|---|
| Business, positioning, references, scope | [Design direction](../00-design-direction.md) |
| Platform/data/integration constraints | [Architecture](../01-architecture.md) |
| Editor users, reuse, handover | [Editor and reusability](../02-editor-and-reusability.md) |
| Menus, search, header | [Navigation](../03-header-navigation-search.md) |
| Cards, filters, collection presentation | [Collections](../04-collections-and-product-cards.md) |
| Media, variants, size/fit information | [Product detail](../05-product-detail.md) |
| Add/cart/purchase extras | [Commerce](../06-cart-and-commerce.md) |
| Homepage/media/copy/other pages | [Homepage and content](../07-homepage-and-content.md) |
| Phone needs and animation preferences | [Mobile and motion](../08-mobile-and-motion.md) |
| Acceptance devices, quality, launch scope | [Quality](../09-quality-and-release.md) and [roadmap](../10-implementation-roadmap.md) |

Keep the original questionnaire responses as evidence. Record approved changes and rationale in the plan rather than treating every answer as an already implemented feature.
