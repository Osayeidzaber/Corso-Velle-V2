# 03 — Claude Design outputs and next-round handoff

## Availability check (what was actually used)

- **Claude Design was available** in this session as the "Design" canvas artifact type (Claude Design now lives in Claude; standalone claude.ai/design is closing). No design system is attached to the account, so the canvas uses its own tokens defined on artboard 01.
- The `DesignSync` tool (syncing a local component library into a claude.ai/design design-system project) exists but was **not** used — there is no local component library yet, and it is meant for user-started sync.
- No other design tool was substituted.

**Canvas:** https://claude.ai/artifact/HhNLWgoUTEL6deqB6yNkrV — private to the owner's account until shared from its Share menu. A copy of the published artboard source is kept in [claude-design/](claude-design/canvas.json) (`*.dc.html` + `canvas.json`). These files render only inside the Claude Design canvas; the link above is the viewable version.

## What was produced (9 artboards, static state sheets)

| # | Artboard | Content | Informs |
|---|---|---|---|
| 01 | Direction, tokens, motion | "Cut & Label" statement, spec-voice sample, colour roles (light + dark campaign), type specimen, spacing, controls incl. focus ring, motion token table with reduced-motion column | [02](02-reference-synthesis-and-design.md), [12](12-mobile-accessibility-motion-performance.md) |
| 02 | Header, announcement, mobile menu | Desktop solid, campaign overlay, sticky-reveal, mega menu open (separate link vs ▾ disclosure, promo cards); phone closed header with ticker pause, drawer level 1 (search field, rows, promos, account/market), level 2 with Back + long translated label | [06](06-header-navigation-search.md) |
| 03 | Predictive search (phone) | Empty with suggested collections + keyboard space; typing/loading (stale results dimmed, in-field spinner); results with active option; no results; request failed with normal-search fallback | [06](06-header-navigation-search.md) |
| 04 | Collection + filters (phone) | Default grid with pills/toolbar/size rows/badges; filter drawer draft with counts and "Show 24 results"; applied + updating; filtered-to-zero; empty collection; fetch failure fallback | [07](07-collections-cards-filters.md) |
| 05 | Card + quick add | Card anatomy states (default, desktop hover, touch +, sale, sold out, long title + missing image); quick-add sheet: selecting (no preselected size), submitting → server rejection, unknown outcome → reconcile | [07](07-collections-cards-filters.md), [09](09-cart-commerce.md) |
| 06 | Product page (phone) | Incomplete selection; available variant; sold-out vs non-existent combination vs update failure; size-guide dialog with table, units, highlighted size; lower page with accordions, app block slot, recommendations and sticky buy bar | [08](08-product.md) |
| 07 | Cart | Empty drawer; ready after add (status line, discount line, pinned footer); mutating + line error + fragment-failure note; desktop cart page incl. same-variant/different-properties lines, note, accelerated checkout slot | [09](09-cart-commerce.md) |
| 08 | Sections | Hero desktop + mobile crop with cut-reveal note and slide progress; collection tiles; media-with-text; newsletter states; ticker vs reduced-motion band; footer | [10](10-content-sections.md) |
| 09 | Presets | Preset A "Signal" vs Preset B "Quiet" using the same structures + settings table | [11](11-editor-data-presets-reuse.md) |

**What the canvas is and isn't.** It is a static state inventory with real control semantics (buttons, labels, dialogs) and annotated behaviour; it uses labelled placeholders, not photography; it was **not** rendered-checked, user-tested, or validated for contrast with real images. It is not a high-fidelity brand design — the brand is undecided.

## Decisions the canvas made concrete

- Search is reachable from the closed phone header (not only inside the drawer).
- Quick add is a bottom sheet on phones; button reads "Select a size" until complete.
- Filter drawer footer = Reset + "Show N results" (count from a section-rendered draft request).
- Failed fragment ≠ failed mutation: the cart shows totals from `/cart.js` and never re-sends.
- Size guide highlights the currently selected size row.
- Sold out (existing variant) and "isn't made in this combination" have different copy and button labels.

## Next Claude Design round (handoff brief)

Run after OD-02 (direction) and with owned sample photography. Ask for:

1. **Direction alternatives** if A is not approved: "Studio" and "Night Drop" (described in [02 §2](02-reference-synthesis-and-design.md#2-direction-cut--label-proposal-a--awaiting-owner-approval-od-02)) applied to artboards 02, 05, 06 and 08 only.
2. **Interactive prototypes** (canvas artboards with `is_interactive`) for: product option selection (state machine in [08](08-product.md)), filter draft/apply, cart quantity queue — to review timing of the motion tokens.
3. **Desktop artboards** missing today: collection with sidebar variant, product page desktop (sticky info + thumbnails), cart drawer desktop width, footer desktop/phone, search desktop panel.
4. **Long-content and localisation stress**: German/French label lengths, 3-line product titles, RTL check if any market requires it.
5. **Dark-scheme product page** (contrast of disabled/strikethrough options on dark).
6. **Editor states**: placeholder appearance for empty hero/tiles/featured collection in the theme editor.

Inputs to provide: brand name/logo (or "neutral"), 6–10 owned campaign/product photos with mobile crops, real size chart for one category, actual option labels, and the approved motion level.

## Traceability

Every artboard state maps to a state table row in the component spec files. When a spec state changes, update the artboard (or note the divergence in the spec's "Design reference" line) so the design never drifts from implementable behaviour.
