# 01 — Source inventory, evidence, contradictions, and gaps

Prepared 21 October 2026. This file lists what was actually inspected for the master plan, what could not be inspected, and where the sources disagree. It is the evidence base for every other file in this folder.

## 1. Location note

The brief names `C:\Users\advsh\OneDrive\Desktop\NKIL\master-plan` as the output folder. That path could not be opened from this session: the result was `Permission denied`, because it belongs to a different Windows profile. The project actually opened in this session is **`E:\NKIL`**, so the package was written to **`E:\NKIL\master-plan`**. If the OneDrive copy is the canonical one, copy this folder across and diff the two project trees first. Nothing confirms that the two trees are identical.

## 2. Recursive project inventory (E:\NKIL, as found today)

No `AGENTS.md`, `CLAUDE.md`, `.git`, `package.json`, images, recordings, or source code exist anywhere in the project tree. There were no hidden files and no alternate data streams beyond `$DATA`.

| Path | Bytes | Read in full? | Classification |
|---|---:|---|---|
| README.md | 4,548 | Yes | Index of the earlier plan |
| 00-design-direction.md | 7,361 | Yes | Earlier plan: design direction |
| 01-architecture.md | 10,208 | Yes | Earlier plan: ADR-01..03, build contract, spikes |
| 02-editor-and-reusability.md | 9,265 | Yes | Earlier plan: lifecycle contract, presets, upgrades |
| 03-header-navigation-search.md | 8,596 | Yes | Earlier plan: H-01..H-06 |
| 04-collections-and-product-cards.md | 8,573 | Yes | Earlier plan: C-01..C-07 |
| 05-product-detail.md | 9,890 | Yes | Earlier plan: P-01..P-08 |
| 06-cart-and-commerce.md | 7,483 | Yes | Earlier plan: K-01..K-08 |
| 07-homepage-and-content.md | 9,377 | Yes | Earlier plan: S-01..S-12 |
| 08-mobile-and-motion.md | 7,529 | Yes | Earlier plan: phone rules, motion tokens, device script |
| 09-quality-and-release.md | 9,847 | Yes | Earlier plan: matrix, fixtures, Q-01..Q-14, budgets |
| 10-implementation-roadmap.md | 8,912 | Yes | Earlier plan: M0–M6, risks |
| references/hypetown.md | 11,662 | Yes | Desktop audit (earlier session) |
| references/rushmode.md | 17,076 | Yes | Desktop audit (earlier session) |
| references/wrclo.md | 10,766 | Yes | Desktop audit (earlier session) |
| references/theme-lab.md | 5,882 | Yes | Source review of Theme Lab |
| owner-questionnaire/README.md | 2,138 | Yes | Questionnaire index |
| owner-questionnaire/00-google-forms-builder-guide.md | 10,370 | Yes | Builder instructions |
| owner-questionnaire/01-business-brand-and-customers.md | 11,933 | Yes | 50 questions, **no answers** |
| owner-questionnaire/02-visual-direction-and-content.md | 13,962 | Yes | 54 questions, **no answers** |
| owner-questionnaire/03-shopping-experience.md | 17,369 | Yes | 70 questions, **no answers** |
| owner-questionnaire/04-catalog-operations-and-integrations.md | 14,681 | Yes | 60 questions, **no answers** |
| owner-questionnaire/05-priorities-budget-and-approval.md | 9,522 | Yes | 36 questions, **no answers** |
| owner-questionnaire/06-response-review-template.md | 8,407 | Yes | Template, every field `[pending]` |
| example componenets/ (23 files, listed below) | 234 – 25,068 | Yes, all 23 in full (second inventory) | Component source, demos, and one docs page |

Long files were read in chunks until the end. Tool output that the harness truncated was read again from the saved full output, not from the preview.

### Example-component files: empty at first, then filled

At the first inventory (around 22:30) all 23 files were 0 bytes. The owner pasted their contents at 23:23–23:24. A second inventory found all 23 populated, and each was read in full:

| File | Bytes | Content |
|---|---:|---|
| Split Text.md | 14,179 | Demo + full React Bits `SplitText` (GSAP) |
| Shiny Text.md | 12,313 | Demo + full React Bits `ShinyText` + CSS |
| Gradient Text.md | 8,497 | Demo + full React Bits `GradientText` + CSS |
| Scroll Velocity.md | 10,873 | Demo (text "React Bits") + full `ScrollVelocity` (motion) + CSS |
| Animated Content.md | 6,062 | Full React Bits `AnimatedContent` (GSAP) |
| Scroll Expand.md | 9,393 | Demos + full `ScrollExpand` + CSS (provenance unconfirmed) |
| foldtext.md | 15,175 | Demo + full `FoldText` (GSAP) + CSS (provenance unconfirmed) |
| menu.md | 21,457 | Full React Bits `StaggeredMenu` (GSAP) + CSS |
| cardnav.md | 25,068 | Full React Bits `CardNav` + CSS |
| navbatmain.md | 3,101 | Aceternity Navbar Menu internals (framer-motion, Next) |
| navbar2.md | 2,986 | Aceternity Navbar Menu demo |
| bubble.md | 10,730 | shadcn/ui **Bubble chat-message docs** (not a menu) |
| discolsure.md, infiniteslider.md, tabswithtransctition.md, progresivebasicblur.md, textloading.md, textpercharacter.md | 234 – 2,525 | motion-primitives usage demos (library source not included) |
| letterswap.md, elasticline.md | 1,144 / 2,625 | Fancy usage demos |
| stickeyfootor.md | 1,679 | Fancy sticky-footer demo (complete CSS technique) |
| marquee.md | 2,559 | Magic UI vertical review-card marquee demo |
| gooeyinput.md | 261 | Usage demo only; library unidentified |

None of the files has a licence header. Provenance comes from internal evidence: demo text, logo paths and import paths. The [rewrite matrix](05-component-rewrite-matrix.md) is now based on this real content.

The earlier candidate research, done while the files were empty, is kept in [evidence/components-research.md](evidence/components-research.md). Of its guesses:
- **Wrong:** bubble, navbar2, navbatmain, textloading.
- **Uncertain:** menu, foldtext, Scroll Expand.
- **Correct:** the rest.

### Owner questionnaires: questions only

All five forms are question banks totalling 270 entries, as the questionnaire README states: 50 + 54 + 70 + 60 + 36. No response sheet, filled copy, or answer file exists. The review template is unfilled. **Every owner-dependent decision is therefore pending.** Defaults proposed in this plan are marked *Assumption* in [14 — owner decisions](14-owner-decisions-assets-risks.md).

## 3. External evidence gathered in this session

Agent notes with every URL and V/NF/Interp label are kept in [evidence/components-research.md](evidence/components-research.md) and [evidence/shopify-docs.md](evidence/shopify-docs.md).

| Source | Method | Who | Result |
|---|---|---|---|
| Candidate public components (React Bits, motion-primitives, Fancy, Magic UI, Aceternity, 21st.dev, shadcn.io) | Docs pages plus raw GitHub or registry source, displayed only; nothing installed or run | Research agent 1 | Props, defaults, dependencies, accessibility and license for each candidate. The Scroll Expand source, the 21st.dev Gooey page and the GSAP license page did not render |
| Shopify platform docs (architecture, blocks, editor events, Section Rendering, Cart, high-variant, filtering, predictive search, CLI, Theme Check, Theme Store, Horizon, metaobjects, checkout, customer accounts) and Vite / vite-plugin-shopify / Theme Lab repo status | WebFetch and the GitHub API | Research agent 2 | Every claim carries a URL and a V (verified), NF (not found) or Interp (interpretation) label. Four URLs returned 404 |
| Spot checks of the two most consequential agent claims | WebFetch | Primary | Confirmed: the Skeleton README now says "deliberately excludes the section-based model", and `<shopify-account>` has been a Theme Store header requirement since 30 July 2026 |
| Reference stores at an emulated phone viewport (375×812, DPR 2, Android Chrome UA) | Built-in browser, DOM measurement with JS, screenshots | Primary | Covered below. Screenshots after the first page became unreliable at the emulated size, so DOM measurements were used instead |
| Claude Design | Design canvas created through the Claude Design artifact type | Primary | 9 artboards. See [03](03-claude-design.md) |

### New phone-viewport observations (emulated, not physical devices)

These are measurements taken in an emulated viewport. They do not show how the sites feel on a real phone, how a screen reader handles them, or how fast they run.

| Store / page | Observed at 375×812 | Implication for us |
|---|---|---|
| Hype Town home | Ticker strip, then a hamburger on the left, centred wordmark, and four icon actions on the right (search, account, tracking, cart). The full-bleed hero fills the first screen; its CTA sits about 85px above the bottom edge. A floating WhatsApp button (48×48, `fixed bottom-5 right-5`) sits next to the CTA area | Plan floating widgets against CTAs and sticky bars, and test them on real devices |
| Hype Town menu | The hamburger opens a left drawer with a Close control. "Shop" expands *inline* as an accordion: View all, New arrivals, campaign links, then Clothing and Accessories groups. "Collections" is collapsed | Their nested lists are accordions. We chose level-2 panels with a Back control instead. The decision and its reasoning are in [06](06-header-navigation-search.md) |
| Hype Town product page | No horizontal overflow. Sticky header 48px. Size buttons measure **44×36**. The "Size Chart" trigger is **85×18**. Add to Cart sits at document y≈1113, so it is below the first screen. No sticky buy bar was found | Size controls must meet a 44px minimum height. The size-guide trigger needs a real hit area |
| Rush Mode product page | Sticky header 69px. Menu button 30×24. Size buttons 46×36. Size Guide trigger 121×34. Add to Cart at y≈1246. The menu opens a flat list of 9 category links, each about 20px tall, with no `aria-expanded` and no body scroll lock detected | Reach and touch-target problems confirmed. The earlier finding that Escape does not close their modal still stands |
| W&R product page | Light-DOM **custom elements** in Shopify section groups: `variant-picker`, `product-sticky-bar`, `cart-drawer`, `predictive-search`, `quick-buy-modal`, `product-rerender`, `safe-sticky`, `height-observer`, and others. The sticky bar (fixed, 55px) is hidden at load and stayed hidden after a programmatic scroll; real-scroll behaviour was not verified. Size controls measure **40×26**. Header icons 22×22. 86 `<img>` elements, 55 of them lazy | This is evidence that light-DOM custom elements are a workable production Shopify architecture. It is not evidence of quality. Small targets confirm the 44px rule |
| W&R New Arrivals | 49 product cards in a 2-column grid, each 187px wide. Each card contains **30–32 `<img>` elements**: 1,598 image elements in the DOM, all marked lazy. No `page=` links (likely load-more or infinite). Filter button 244×42 | Supports our rule that a card renders at most 2 images, with any gallery loaded on demand. Supports real pagination links |

Not established in this session: how real devices perform, how gestures feel, whether W&R's sticky bar appears under real scrolling, how quick-add flows behave, populated carts, filter URLs, keyboard and screen-reader behaviour, and exact animation timing. No purchases were made, no cart mutations, no form submissions, and no accounts were created.

## 4. Contradictions and how they were resolved

| ID | Contradiction | Resolution (decision ID in [00](00-executive-brief.md)) |
|---|---|---|
| X-01 | Output path in the brief (C:\…\advsh) vs. the project actually opened (E:\NKIL) | Wrote to E:\NKIL\master-plan; flagged in §1 |
| X-02 | Brief says the examples may be React/Vue code; the files were empty at first inventory, then filled at 23:23 | Matrix revision 2 is based on the real files; four revision-1 candidate guesses corrected |
| X-03 | The brief's wording implied about 21 components; the folder holds 23 | 23 used everywhere |
| X-04 | Earlier ADR-03: "optionally start from Shopify Skeleton". Skeleton `main` (1 Oct 2026, rc-v2.0.0) dropped `sections/` and JSON templates, yet the Theme Store still requires JSON templates and section groups | **D-03**: write original OS 2.0 code. Do not scaffold from Skeleton rc-v2. Read Skeleton only as a reference, under its modified-MIT license |
| X-05 | Earlier plan treats the account link as a plain route; the Theme Store now requires `<shopify-account>` in the header | **D-11**: render `<shopify-account>` when `shop.customer_accounts_enabled`; no legacy customer templates |
| X-06 | Earlier budget of 60 KB gzip JS per page vs. the Theme Check `AssetSizeJavaScript` default of 10 KB compressed *per file* | Both apply. Per-page budget kept; feature modules split so each file stays ≤10 KB compressed where practical. Exceptions recorded |
| X-07 | Touch targets: earlier plan says 44×44; Theme Store minimum is 24×24 | Keep 44×44 for shopping controls; 24×24 is the floor for secondary links |
| X-08 | WCAG target: earlier plan says 2.2 AA; Shopify's page cites 2.1 and the "2.0 principles" | Keep 2.2 AA as our internal target; claim nothing beyond what was tested |
| X-09 | 00-design-direction proposes a "dark streetwear" second preset; 02-editor proposes "campaign streetwear vs. quiet editorial" | **D-14**: Preset A "Signal" (light shopping surface with a dark campaign scheme) and Preset B "Quiet" (editorial). A dark-only store is a configuration fixture, not a third preset |
| X-10 | 04-collections leaves the default open between pagination and Load more | **D-16**: numbered pagination links by default; Load more is an option; no infinite scroll in v1 |
| X-11 | Earlier variant notes cite the 250-item `product.variants` limit only; the platform limit is now 2,048 variants per product | Fixtures must exceed 250 variants. The picker uses `option_values` re-rendering (**D-08**) |
| X-12 | Earlier plan names "Vite" without a version or integration choice; vite-plugin-shopify 5.0.0 (MIT, Vite 5–8) now exists and is maintained | **D-05**: spike S1 compares the plugin against a small owned manifest adapter. Owned flat output is required either way |
| X-13 | Earlier plan treats Theme Lab as a reference; the repo has had no push since Feb 2024 and its last release was 2021 | Theme Lab is a historical reference only; none of its tooling is adopted |

## 5. Evidence gaps that remain

| Gap | Why it matters | Who / how to close |
|---|---|---|
| Library source for the 12 demo-only files (motion-primitives, Fancy, Magic UI, gooey input) and provenance of Scroll Expand / FoldText | Behaviour of those is taken from demos + public docs | Not blocking: rewrites are clean-room from behaviour specs; owner may confirm sources (OD-07) |
| Owner answers to the 270 questions | Brand, catalog, policies, priorities | Owner (OD-01..OD-12) |
| Dev store and collaborator access | All Shopify behaviour, editor and checkout proof | Owner grants a development store; required for M1 |
| Physical iPhone and midrange Android | Gesture, keyboard, safe-area and performance evidence | Implementation team in M2 and M5 |
| Real catalog data (option model, size charts, media pairs) | Variant picker, size guide, model/packshot feature | Owner (OD-03, OD-04) |
| App list (reviews, restock, subscriptions, etc.) | App block positions and cart integration | Owner (OD-09) |
| GSAP license text from gsap.com | Only relevant if GSAP is ever adopted; current plan has no GSAP | Not needed unless D-06 changes |
| Theme Store suitability | Distribution route undecided | Owner decision OD-01; fresh requirements audit before any submission |

## 6. Reliability notes

- Agent reports were treated as leads. The two claims that change the architecture were re-checked directly. Other agent-reported platform facts keep their URLs in the agent notes. Re-verify them at implementation time, because Shopify changes frequently: three relevant changelog entries are dated July–October 2026.
- Reference-store observations describe what was visible on 21 October 2026. Prices, catalog counts and campaigns change.
- No supplied script was run and no dependency was installed. The project contains no scripts.
