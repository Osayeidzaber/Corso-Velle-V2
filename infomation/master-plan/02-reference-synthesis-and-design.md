# 02 — Reference synthesis and original design direction

Evidence: earlier desktop audits ([Hype Town](../references/hypetown.md), [Rush Mode](../references/rushmode.md), [W&R](../references/wrclo.md)) plus today's emulated-phone measurements ([01 §3](01-source-inventory-and-evidence.md#3-external-evidence-gathered-in-this-session)). Labels: **Observed** / **Interpretation** / **Proposal**.

## 1. What the references teach (and what they get wrong)

| Theme | Observed | Interpretation | Proposal for us |
|---|---|---|---|
| Campaign → product rhythm | Hype alternates full-bleed category banners with 4–8 product grids; Rush runs hero → category grid → products → fit story; W&R puts most of the homepage into one long grid | Shoppers get both mood and immediately buyable product; very long grids push the footer away | Default homepage: hero → tiles → one bounded drop grid → spotlight/story → newsletter. Repetition is a preset choice, not a code path |
| Header | All three: logo + split actions; Hype hides on scroll-down; Rush stays sticky; W&R overlays the hero then turns solid | Stability and immersion both matter; neither is universally right | Solid / overlay / sticky-always / reveal-on-up modes, one state model ([06](06-header-navigation-search.md)) |
| Mobile navigation | Hype: left drawer with inline accordion levels; Rush: flat list of ~20px-tall links, no `aria-expanded`, no scroll lock; W&R: sidebar with collapsible panels | Accordions lengthen the list; flat lists don't scale; tiny targets | Level panels with named Back, ≥52px rows, search at top, optional promo cards |
| Size selection | Size controls measured 44×36 (Hype), 46×36 (Rush), 40×26 (W&R) | All three under a 44px height | 48px option height minimum; spec-voice labels; unavailable = strike + text |
| Size guide | Hype inline image chart; Rush modal image chart (Escape didn't close it); W&R side panel with HTML table + cm/in | Image charts fail readers and small screens; a real table is better | Structured HTML table in a shared dialog; selected size row highlighted; local horizontal scroll |
| Buy button reach | Add to cart sits ~1.4–1.6 screens down on Hype/Rush; W&R has a sticky bar custom element | Long media + info push the action down | Compact info order on phones; optional sticky bar that mirrors the main form state |
| Product cards | Hype shows size row + quick add; Rush plain cards with badges; W&R card galleries with ~30 `<img>` per card | Size rows aid scanning; per-card galleries are heavy | Size summary row in spec voice; max 2 images per card; quick add as explicit button |
| Filters | Hype: price min/max + sort; Rush: none (pills are collection links); W&R: right drawer with sort/size/fabric/colour/price/availability | Navigation pills and filters are different tools | Keep pills (menu-driven navigation) *and* real Shopify filters, visually distinct |
| Cart | Hype/Rush cart pages; W&R drawer | Drawer keeps context; page is a reliable destination | Both, one service and one line-item snippet |
| Floating widgets | Hype WhatsApp 48×48 fixed bottom-right beside the hero CTA | Collides with CTAs and sticky bars on phones | Optional contact link with collision rules ([12](12-mobile-accessibility-motion-performance.md)) |
| Motion | Tickers, changing hero media, overlay open/close; durations not measured | Energy comes from campaign moments, not from animating commerce | Motion confined to campaign moments + overlays; tokens in §4 |

Do not copy: logos, wordmarks, photography, campaign copy ("Summer '26", "Self Club" etc.), category handles, prices, delivery charges, policy text, or storefront source.

## 2. Direction "Cut & Label" (proposal A — awaiting owner approval, OD-02)

**Idea.** Fashion campaigns are loud; garment labels are exact. The store borrows both: unframed, large campaign imagery with condensed display headlines, and a calm, precise information layer — sizes, fit, care, availability and price set in a mono "spec voice" like a woven care label. Shoppers get atmosphere where browsing starts and certainty where buying happens.

**Signature details (each is a reusable component behaviour, not a one-off):**

1. **Spec voice.** Mono uppercase 11–13px for size runs (`XS S M L XL`), option names, availability, counts and section indices. Unavailable values are struck through *and* named in text.
2. **Index numbers.** Editorial sections carry an optional index (`01 / Drop`) — a heading-block setting, translated, off in Preset B.
3. **The cut.** A single reveal style: headline or image wipes in once via `clip-path` (≈380ms). No floating fades, no parallax, no bounce.
4. **Signal accent.** One merchant colour used only for focus rings, active filter state, progress and primary emphasis — never decoration.
5. **Hard edges.** Media radius 0; controls 2px (A) / 0 (B); hairline 1px dividers; no drop shadows except the sticky header hairline.

**Why it is original and portable:** none of the references use a mono information layer or the cut reveal; the system depends on tokens and settings, so Preset B swaps it to a serif editorial store without code changes.

**Alternatives if the owner rejects A** (to explore in the next Claude Design round): *"Studio"* — warm neutral, oversized grotesk, softer radii, image-led cards with minimal text; *"Night Drop"* — dark-first (Rush-like energy) with high-contrast type and a single neon signal. The component states on the canvas are layout-stable across all three.

## 3. Tokens (initial values; become settings and CSS custom properties)

Colour roles (Preset A, light scheme): `ground #F3F2EE`, `surface #FFFFFF`, `ink #121212`, `ink-2 #55534E`, `line #D9D6CF`, `signal #2338E0`, `disabled #8A877F`, `error #B42318`, `success #146C43`. Dark campaign scheme: `ground #0E0E0E`, `surface #1C1C1B`, `ink #F3F2EE`, `signal #9AA5FF`. Body pairs ≥4.5:1 (verify with the final values in CI contrast tests).

Shopify mapping: `color_scheme_group` with roles background, surface, text, text-muted, line, accent, accent-text, error, success; up to 5 schemes; every section has a `color_scheme` setting. Error/success are global, not per-scheme.

Typography: display **Archivo** variable (width 62–125, weight 400–900; condensed 72% / 800 for display), body Archivo 400/600, spec **IBM Plex Mono** 400/500 (both OFL, available as Google Fonts; prefer the Shopify font library equivalents where available via `font_picker`, else self-host in assets with licence files). Scale: display 112/96/64/40 (desktop) → 52/40/32 (phone) via `clamp()`; section heading 28/22; body 16 (15 on dense cards); price 14–18 tabular; spec 11–13.

Space: 4, 8, 12, 16, 24, 32, 48, 72, 112. Section vertical rhythm uses only 48/72/112 (setting: compact/regular/airy). Grid: 12 columns, 24px gutter desktop; 2-column product grid with 8px gutter on phones; page gutter 16px (phone) / 24px / 64px max.

Media ratios: product 4:5 (A) or 3:4 (B), selectable `portrait | square | natural`; campaign 16:9 desktop / 4:5–9:16 mobile with separate mobile image; tiles 3:4.

Controls: height 48 (primary 52), radius 2/0, focus ring 2px signal + 2px offset, option pills min 52×48.

Motion tokens: see [12 §4](12-mobile-accessibility-motion-performance.md#4-motion-system).

## 4. Composition rules

**Phone first for the purchase path.** Product page order: gallery (≤60% of first screen height), title, price, colour, size + guide link, availability, add, short delivery/returns line, then accordions and recommendations. No editorial block between size selection and add.

**Desktop adds room, not features.** Product: media 7/12, info 5/12 with sticky info that stops before recommendations. Collection: 4 columns ≥1280px, 3 at ≥990px, 2 below; optional filter sidebar is a P1 variation of the drawer.

**Campaign sections own colour.** Dark schemes live on campaign/editorial sections; shopping sections default to the light scheme so price and option states read consistently.

**Photography brief (owner/brand):** consistent background and lighting per drop; product images 4:5 at ≥2000px tall, packshot + on-model where the model/packshot feature is used; campaign images with a declared safe area for text on both crops; no text baked into images. Until owned imagery exists, prototypes use labelled flat placeholders (as on the canvas), never reference-store media.

## 5. Reuse guardrails

- No section knows the brand, domain, collection handles, currency symbol or policy text.
- Copy defaults live in locale files; demo content lives only in presets/templates and is placeholder-labelled.
- Distinctiveness comes from tokens, type, image ratios, motion level and section composition — the same controls a second brand uses.
