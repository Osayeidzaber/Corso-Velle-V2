# 14 — Owner decisions, assets, and open questions

**Status: no questionnaire has been answered.** The forms in [../owner-questionnaire](../owner-questionnaire/README.md) are blank, so every item below is pending.

Each item gives a **proposed default**. A default is an *assumption*, not an approved requirement. Planning and the M1 spikes can go ahead on these defaults. Any work that depends on content or on business rules cannot.

## 1. Consequential decisions

| ID | Decision | Why it matters | Proposed default (assumption) | Questionnaire IDs |
|---|---|---|---|---|
| OD-01 | Distribution route: only this store / several own brands / sell or license / Theme Store | Licensing, whether we can use metaobjects, Theme Store-only requirements, support load | Owner's store plus private reuse; keep the code Theme-Store-compatible where it costs little | A47–A49, L28 |
| OD-02 | Visual direction: approve "Cut & Label", or choose an alternative | Final tokens, type and motion level | Proceed with Cut & Label for M1–M2 structure; lock it before M3 | V01–V21, V40–V46, L23 |
| OD-03 | Colour model: options within one product / separate linked products / combined listings | Picker, cards, data contract | Colour as a variant option within one product | S35, O15 |
| OD-04 | Size data: structured charts per category, garment or body measurements, units | Size guide content and conversions | Structured garment measurements per category, in cm, with no automatic inch conversion until verified | S36–S44 |
| OD-05 | After-add behaviour; quick add on or off | Cart and card flow | Open the drawer; quick add on, using the picker sheet | S22, S23, S49 |
| OD-06 | Markets, currencies, languages at launch | Fixtures, localisation UI, copy | One market, one currency, one language; architecture stays locale-safe | A32, A33, O26–O28 |
| OD-07 | Effect shortlist from the supplied examples: signature headline reveal (cut / fold / split), editorial drawer style, floating mega menu, expanding media, testimonial wall | Motion scope and P1/P2 split | Cut reveal (P1), editorial drawer on phones and floating mega menu (P1), fold/split/expand/wall P2 | V42, L06 + the example files |
| OD-08 | Shipping/returns rules and any free-shipping threshold | Copy, optional progress bar | No shipping promises; the progress bar stays off | O33–O41 |
| OD-09 | Apps: reviews, restock, email, subscriptions, bundles, loyalty, chat | App blocks, cart integration, newsletter form | No apps; Shopify customer form for the newsletter | S57–S63, O45–O48 |
| OD-10 | Pre-order or continue-selling wording, low-stock display | Inventory messages | Low-stock messages off; no pre-orders | S47, S48, O23 |
| OD-11 | Blog/journal and other page types in scope | Templates | Page, contact and 404 in scope; blog and article P1 if requested | V53 |
| OD-12 | Explicit size choice rule | Purchase policy | Yes: size is never preselected except through a deep link | S37 |
| OD-13 | Model/packshot toggle | Data and photography load | Off until both images exist for a full collection | S12, S13, V49 |
| OD-14 | Header layout, sticky behaviour, overlay on the home page | Header defaults | Centred logo, reveal on scroll up, overlay on the home hero | V34–V37 |
| OD-15 | Motion level, and which effects (ticker, reveals, video) | Motion settings | Standard on campaign sections; ticker off by default | V39–V46, L06 |
| OD-16 | Floating contact (for example WhatsApp) | Phone collisions | Off; if enabled, product and support pages only, with offsets | S62 |

## 2. Content and asset requirements (owner-supplied)

| Item | Needed by | Notes |
|---|---|---|
| Brand name, logo, alternate logo, colour constraints, font licences | M3 (structure can use neutral branding earlier) | A02, V11–V17 |
| Dev store and collaborator access | **M1 (blocking)** | Arranged through Shopify collaborator access; never share passwords |
| Test catalog or real product export | M1 | Must include variants beyond 250 on at least one fixture product (can be synthetic) |
| Product photography to the specification in [10](10-content-sections.md#content-requirements-before-visual-sign-off) | M3 | Owned or licensed |
| Campaign imagery with mobile crops | M3 | Mark the safe area for text |
| Size charts per category | M2 (one category), M3 (all) | Structured values |
| Policies (shipping, returns, privacy, terms), contact details | M3 | Approved wording only |
| Menu structure and collections | M2 | S02, S03 |
| App list and accounts | M4 | |
| Approvers and review cadence | M0 | A04, L20, L24 |

## 3. What we will not invent

Shipping charges, delivery times, return periods, stock or scarcity claims, reviews or ratings, "best seller" or "trending" labels without data, membership benefits, brand claims (materials, origin), payment-method logos that aren't actually enabled, and any reference-store copy or media.

## 4. Open questions (consolidated, for the next owner conversation)

1. Which distribution route should the theme support (OD-01)? Should it ever be sold or listed?
2. Is "Cut & Label" the right direction, or do you want to see "Studio" or "Night Drop" first?
3. Are colours sold as options within one product or as separate products?
4. Do you have structured size charts? Are they garment or body measurements? Do customers need inches?
5. After adding to cart: open the cart drawer, or stay on the page with a confirmation?
6. Which countries, currencies and languages at launch?
7. From your examples: which headline reveal should be the signature (cut, fold or split)? Do you want the editorial numbered menu and the floating mega menu? Was `bubble.md` (a chat-bubble doc) intended, or did you mean a bubble *menu*?
8. Which apps are already in use or definitely planned?
9. Who approves designs and content, and how quickly can they respond?
10. Is there a launch date tied to a campaign?

## 5. Risk summary for the owner

- The largest schedule risks are **access** (no development store yet) and **content** (photography and size data).
- The largest quality risk is skipping the M1 spikes to "see the homepage sooner". The plan deliberately proves real shopping and editor behaviour first.
- Cosmetic effects from the example list were mostly deferred or rejected on purpose. Each one is either costly on phones, harmful to accessibility, or legally unsafe to port. The direction gets its character from photography, type, the spec voice and one deliberate "cut" motion.
