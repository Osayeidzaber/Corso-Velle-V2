# Theme customization (Theme Editor)

What merchants can change without code. Kept in sync with the schemas in `theme/`.

## Product page and shared size details

**Product information** now exposes breadcrumb visibility. Its **Title** block has an animation
switch (on by default); **Price** has an SKU switch (on when data exists). **Description** controls
care-metafield visibility and its heading (default Fabric & Care). Optional **Collapsible row** blocks
can start open (default off). Existing block order, quantity visibility, rich text, page sources,
app blocks, custom Liquid and recommendations remain editable. No new visible blocks are inserted.

**Variant picker** adds independent switches for the full size guide, inline measurements,
hover/focus previews, inch/cm switching and selected-row highlighting. All default on to preserve
current behavior. With unit switching off, the chart's authored unit wins over saved preferences.

The supplied size-selector reference is adapted to the existing native radios: equal-width slots,
a short stretch-and-settle underline, centered size names such as **Small (S)**, and centered
measurements on a brown panel with warm-white text. Only this requested selector/panel presentation
changes; product gallery, typography, content blocks and purchase flow retain their existing design.
Common size names are editable in the language editor under `product.size_names`; numeric or
unrecognized sizes retain their actual product-option label. Motion uses the existing policy.

The featured-collection carousel uses a liquid lens, natural image proportions, coordinated
entrances, inertia, a product caption/counter, center emphasis and autoplay. Product links open
their pages. **Shop the highlighted product** enables the shared Add to cart control and size
selector; switching it off gives a browse-only carousel. Product pages retain full selection.
If the variant list is incomplete, the purchase control opens the product page, where Shopify
resolves all options. It never treats the serialized window as the entire variant catalog.

Carousel speed controls movement; autoplay pace controls travel time per product. The liquid
carousel flows continuously, with no stopped center dwell and no pause on passive mouse hover.
Dragging, keyboard focus and explicit pause still stop it; a discreet pause button remains available. Desktop liquid instances use drag
and keyboard browsing, with classic/snap arrow settings preserved for native rails. Phones, simpler
motion modes and unavailable WebGL use native swipe/link navigation. Reduced motion disables
autoplay. No React dependency or new animation library is installed. After a drag or manual
navigation, flow resumes smoothly once the interaction settles and its short grace period ends.

Sold-out availability is always clear: Shopify `product.available` drives the native card label
and the curved canvas's translated **Sold out** badge. The badge uses the scheme accent/on-accent,
travels through the lens with each sold-out image, and remains legible on inactive cards. The
active screen-reader status includes availability. Product links and continuous flow still work;
partially available products remain purchasable and retain variant-level availability on the
product page. No stock values are guessed and no additional Theme Editor setting is needed.

The latest carousel refinement extends the desktop stage to the viewport width, with a longer
flatter run before the lens bends the edges. **Products before the curve** (3–6, default 4) fits
approximately that many naturally proportioned products into this run. Image proportions vary,
so this is a composition target rather than cropping every image to a fixed width. The active
product retains the brown highlight. The entrance is about 0.4–0.55 seconds; movement settles
faster, captions/counters respond sooner, and the default interval is 1.5 seconds (editable down
to 1 second). Saved merchant interval values remain respected. Below 990px and with simpler
motion, native rails preserve touch scrolling; motion/breakpoint changes rebuild the scoped engine.

**Theme settings → Size charts → Default reusable chart handle** selects an Admin-managed
`size_chart` entry by handle. Product and collection references use `custom.size_chart`; optional
collection priority and explicit product collection selection make overlaps deterministic.
Product-specific data/rules take precedence, then collection data/rules, then the global default
and existing template fallbacks. Full setup, field types, JSON structure, legacy compatibility and
instructions are in [docs/SIZE-CHART-ADMIN.md](docs/SIZE-CHART-ADMIN.md).

The measurement panel now follows the existing brown/text-on-accent scheme tokens; its dimensions
and motion stay the same. Guide surfaces remain warm white, with brown active/highlight states.
Admin definitions and verified measurements must be configured before assigned charts appear;
these records were not created by this implementation.

## Colour

### Accent (global, per colour scheme)
**Theme settings → Colors → Color schemes → Accent.** Default: footer brown `#432D23`.

The accent drives buttons (sliding fill), links, focus rings, selected states (size selector
underline, tab indicator) and header accents. Every related shade is **derived automatically**, so
changing the one accent recolours the whole family:

| Token | Use | Derived as |
|---|---|---|
| `--nk-color-accent` | Primary accent | the setting |
| `--nk-accent-hover` | Hover | 84% accent, mixed toward the scheme's text colour |
| `--nk-accent-active` | Pressed / active | 70% accent, mixed toward text |
| `--nk-accent-subtle` | Tinted backgrounds | 8% accent over the background |
| `--nk-accent-selected` | Selected rows/chips | 16% accent over the background |
| `--nk-accent-border` | Borders, dividers | 38% accent over the background |
| `--nk-accent-muted` | Decorative accents | 55% accent over the background |
| `--nk-focus` | Focus outline | the accent |

On dark schemes, mixing toward the text colour lightens instead of darkening, so states stay
visible. Tailwind utilities: `bg-accent`, `bg-accent-hover`, `bg-accent-subtle`,
`border-accent-border` and so on.

### Section overrides
Sections with a **Color scheme** picker use that scheme's accent. Main product, cart and several
utility sections inherit colors; the footer also has its own palette overrides. Shipped schemes:

| Scheme | Look | Accent |
|---|---|---|
| Scheme 1 | Warm ivory, dark text | Footer brown `#432D23` |
| Scheme 2 | Espresso, light text | Sand `#E7C9A0` |
| Scheme 3 | Footer brown, cream text | Copper `#D7AE83` (the footer's accent) |

### Footer
The footer keeps its own **Background / Text / Light beam and accents** settings (defaults
`#432D23`, `#F5ECDF`, `#D7AE83`); these are the reference values for the palette above.

## Motion

The same global motion settings apply to all storefront pages using the theme layout, including
collection banners/grids, product titles/recommendations and search results. Filters and sort
replacements reuse the shared reveal system; grid layout changes use a brief wrapper transition.
Product galleries, variant selection, cart and checkout controls stay immediately usable and
do not acquire storytelling pins. Plain content/cart pages retain native scrolling. The standalone
gift-card page intentionally uses CSS and native scrolling without the animation runtime.

**Theme settings → Motion** controls animation level, tempo (relaxed/balanced/brisk), stagger
(none/short/medium/long), scroll-linked effects and phone behavior (simplified/full/off).
Tempo affects entrances; scroll-linked scenes always follow scroll position. Shopping card
stagger is capped at 180ms for an entire batch and typography at 350ms to keep content accessible.
Reduced motion and the Theme Editor show static content. **Smooth wheel scrolling** optionally
loads Lenis on desktop fine-pointer devices, synchronized with GSAP's ticker and ScrollTrigger.
**Smooth scrolling strength** selects subtle, balanced or silky interpolation. Touch stays native;
overlays pause interpolation. Reduced motion, Motion off and the editor bypass it.
Phones default to quick entrances; the expanding campaign never pins on phones.

### Media with text → Section motion

- **Section animation:** Off, legacy heading/column settings, Subtle entrance, or Cinematic scroll
  reveal (default). Coordinated presets replace separate heading and column entrances.
- **Reveal direction:** Up, From right, or Fade only.
- **Motion intensity:** Soft (default) or Expressive.
- **Gentle image drift:** cinematic image movement, independent of product hover effects.
- **Brief desktop hold:** optional, off by default. Applies at 990px and above only when the
  section fits below the header; adds at most 240px of scroll. Taller sections scroll normally.
- **Fade subtle accent wash:** a light decorative overlay fades out with the image reveal.
  Uses the section's color scheme; does not interpolate text/background into low contrast states.

Each repeated section has its own settings and cleanup. Cinematic reveals reverse with scroll;
subtle entrances play once. Simplified phone mode uses subtle entrances regardless of preset.
To disable all animation in this section select **Off**. The legacy option retains the existing
heading/column controls for stores using those presets.

### Hero and Riviera nights

**Hero → Gentle scroll exit:** on by default. Subtle desktop copy drift and fade as the hero
leaves; existing entrance, media, buttons and parallax settings remain independent.

**Expanding media → Scroll expansion:** on by default. This is the homepage's **Riviera nights**
component. Turn off for a static campaign. Existing starting width/height, tint and short/long
scroll length remain editable. Simplified mode, phones, reduced motion and the editor use the
fully open frame without a long track. Image/video, overlay blocks and links stay editable.

## Responsive layout rhythm (F1)

**Theme settings → Layout → Responsive spacing.** These settings apply immediately through
Liquid-rendered CSS properties; no new JavaScript, GSAP instance or dependency is added.

| Control | Default | Supported values | Applies at |
| --- | --- | --- | --- |
| Page gutter on phones (`gutter_mobile`) | 16px | 12–32px, step 2 | Below 750px |
| Page gutter on tablets (`gutter_tablet`) | 24px | 16–48px, step 2 | 750–1199px |
| Page gutter on large screens (`gutter_desktop`) | 48px | 24–80px, step 4 | 1200px and above |
| Section spacing on smaller screens (`section_spacing_mobile`) | Regular (66%) | Compact 50%, Regular 66%, Airy 85%, Same as desktop 100% | Below 990px |

`Space between sections` remains the base vertical padding: Compact 48px, Regular 72px (schema
default), Airy 112px. The smaller-screen choice multiplies this value for each edge of sections
using `.section-spacing`. At 990px and above they use the base value. For example, 72px with
Regular gives 47.52px top and bottom below 990px. The saved store currently uses 112px, which
gives 73.92px with Regular. The new control defaults retain the former gutter values and 66% ratio.

F1 also fixes an existing cascade defect: base CSS redeclared `--nk-space-section: 72px` after
Liquid emitted the merchant's setting, forcing every shared section back to 72px. Fallbacks now
live at the CSS use sites. Saved Compact/Airy values therefore start working as intended. On the
current saved Airy configuration, shared padding increases from the incorrectly forced 72px to
112px on desktop (47.52px to 73.92px on smaller screens). No saved setting value is changed.

Page width still offers Narrow 1200px, Wide 1440px and Full 100vw. The shared content grid
subtracts two gutters and fits within the viewport. Gutters also feed header, hero copy, footer
and any other component consuming `--nk-gutter`. Full-width media remains full bleed. Fixed
component padding, hero height, divider spacing, modal padding and nested block padding are not
replaced by these controls. Media with text can override this shared default using F2 below.

Input tokens `--nk-gutter-mobile`, `--nk-gutter-tablet`, `--nk-gutter-desktop` and
`--nk-section-spacing-mobile-scale` are emitted in `css-variables.liquid`. Base CSS resolves the
active `--nk-gutter` at its existing breakpoints. Keep input and active tokens separate because
the inline token stylesheet loads before built base CSS. Existing per-section `--content-width`
and inherited CSS properties keep repeated sections isolated. No merchant content/preset values
are overwritten by F1; the named spacing choices are coordinated ratios, not new whole-theme presets.

## Shared typography and style starts (F4)

Theme settings → Typography adds Natural/Editorial/Tight shared heading tracking, Editorial or
Comfortable line spacing, Natural/Editorial label tracking and 17/18px body sizes alongside 15/16px.
Editorial defaults preserve current shared metrics. Font-picker heading weight now reaches the
shared heading and hero/display styles instead of being forced to 400. Specialized product, menu
and component-specific metrics retain explicit overrides; these controls are deliberately labeled
Shared rather than claiming every piece of text changes identically. Body text still uses the
existing `--nk-text-base` token. No new fonts are downloaded unless selected.

An optional **Minimal** theme style joins Riviera and Quiet: Inter headings, natural tracking,
comfortable leading, 1200px content, regular spacing, compact square buttons with subtle effects,
bordered cards, portrait photography and restrained motion. It is stored in `settings_data.json`
under presets; the merchant's `current` configuration was preserved. Selecting a whole-theme
style is a merchant action, separate from adding section presets. Source/schema/build validation
is complete; the full live editor preset/long-content matrix remains in the QA checklist.

## Source contracts and editor verification (F5)

`npm run check:contracts` runs five meaningful validator tests, checks the actual theme, and
checks that generated schema documentation is current. It validates duplicate setting IDs/options,
select/range defaults, native block-model separation, local-block preset references, section-file
references and template/block ordering. It is included in `npm run check`. It complements Shopify
Theme Check and does not execute Liquid or infer that every declared control is connected.
See [editor acceptance matrix](docs/EDITOR_CUSTOMIZATION_QA.md) for pending live editor/device work.

## Buttons and card surfaces (F3)

Theme settings → Buttons now controls default boxed button size (Compact 44px / Regular 54px /
Large 64px), corners (Layout default / Square / Rounded 8px / Pill) and effects (existing sliding
fill/label roll, Subtle fade, or Instant states). Regular + inherited corners + expressive effects
are defaults. The saved square Layout setting keeps the current storefront square. Layout's
existing Soft 2px/Pill values now work: CSS no longer overwrites the Liquid radius. This correction
also makes fields honor the saved Layout corner value instead of always using 2px.

Hero button groups have a local corner override. Existing Small (44px) and Large (64px) sizes
remain local overrides; Medium follows the theme size. Solid/outline/glass/text styles and arrow
options remain the existing working choices. Text links keep their underline and do not get boxed
corners. Product purchase buttons retain a 56px minimum even when Compact is selected; Large can
increase them. Icon controls, size pills and custom newsletter controls retain their own sizing.

Subtle fades the fill without hero label/arrow travel. Instant changes visible states without
transitions. Focus outlines, disabled and busy states remain available. Global Motion off and OS
reduced motion suppress hero travel regardless of this setting. No new JavaScript is required.

Theme settings → Product cards → Card surface adds Flat (default, no added box), Bordered (1px,
12px padding), and Raised (1px, 16px padding, restrained shadow). It applies to shared `.card`
product/article renderers; custom category cards and OGL canvas photography keep their own design.
Border colors resolve from each local scheme. Per-section card overrides are scheduled for E3.

Sources: `button-tokens.liquid` emits reusable size/corner CSS inputs, `css-variables.liquid`
passes global settings, base CSS resolves field corners, Riviera consumes button tokens, hero
button markup supplies local corner classes, and `button-policy.css` applies interaction policy
after hero styles. Product CSS retains the purchase target floor; card CSS consumes surface inputs.

Validation: actual Shopify rendering checked 24 size/corner/scheme combinations, disabled/busy
markup, three surfaces, focused Subtle/Instant hero CTAs and 320/390/750/1440px widths with no
overflow (smallest target 44px). See `docs/evidence/customization-f3-checks.json`. Temporary native
fixtures are archived in `docs/fixtures/`, outside the deployable theme. Global editor save/reopen
and physical-device/reduced-motion switching still need release QA. Shared suite: 99 tests pass;
the initially failing concurrent carousel tests were subsequently completed and passed.

## Media with text: section presentation (F2)

Select **Media with text → Section appearance / Section spacing** in Shopify's Theme Editor.
Each instance has independent presentation controls. Existing instances default to inherited
theme width and spacing, and retain their current scheme, split/overlay layout and motion.

| Setting | Default | Behavior |
| --- | --- | --- |
| Content width (`content_width`) | Use theme page width | Inherit, Narrow 1200px, Wide 1440px, or Full width with page gutters. Bounds apply to the image and text together, and include two responsive gutters. |
| Color scheme (`color_scheme`, existing) | Scheme 1 | Colors this instance's full-width background and existing text/surface roles. Overlay text retains its existing white treatment; choose a readable scheme/image combination. |
| Padding (`spacing_mode`) | Use theme section spacing | Inherit the global section spacing and smaller-screen ratio, or select Custom to reveal four sliders. |
| Desktop top / bottom (`padding_top`, `padding_bottom`) | 72px each when Custom | Independent exact padding at 990px and above. Range 0–200px in 4px steps. |
| Smaller-screen top / bottom (`padding_top_small`, `padding_bottom_small`) | 48px each when Custom | Independent exact padding below 990px. Range 0–200px in 4px steps; the global spacing ratio is not applied. |

Zero is a valid custom value. Returning Padding to Use theme section spacing ignores the stored
custom slider values. Choosing Narrow/Wide can override either a narrower or wider global width;
Full means available viewport width **minus page gutters**, not edge-to-edge copy. The section's
background remains full bleed for every width option. Image aspect ratios, overlay text inset,
copy's reading width and grid gaps remain the existing layout choices, not additional controls.
The existing phone content-order setting applies below 990px. Long headings and content are
constrained within their grid cell instead of forcing the page wider.

Implementation: `theme/snippets/section-presentation.liquid` emits only CSS declarations inside
the section root's style attribute. `.section-presentation` in `src/styles/base.css` consumes
`--nk-section-page-width` and the four `--nk-section-padding-*` inputs. Only Media with text opts
into the contract in this chunk. Inherit emits no overrides; CSS falls back to the global tokens.
The shared helper accepts `presentation: section.settings`; new sections can adopt it after adding
matching schema IDs and testing their own containment. Do not apply the helper to an ancestor of
multiple independently styled sections. Values remain on the instance root, never on `:root`.

F2 adds no JavaScript or dependencies and changes no animation policy. Existing `NkScene` measures
the resulting section dimensions for its optional desktop hold, including custom padding; tall
sections still use normal flow. No new blocks or section presets are added. Full-width media and
copy cannot be sized independently yet; this chunk controls their shared inner container.

## Current component behavior and limits

The generated reference below enumerates **every current global, section and theme-block setting**,
including schema defaults, ranges, choices, block types, caps and add-menu presets. A section preset
adds a configured instance; it does not update other instances. Ordinary content sections can be
duplicated and arranged in JSON templates. Contextual product/collection/search sections require
the corresponding Shopify page object. Header, search dialog and cart drawer serve one site shell;
their fixed IDs are not a promise of arbitrary repeated shell instances.

| Component family | Purpose, data, layouts and runtime | Responsive behavior / limitations |
| --- | --- | --- |
| Campaign hero | Merchant image/video or collection image; overlay/editorial/split; local eyebrow/heading/text/buttons; `hero.liquid`, hero CSS, reveal/text/parallax/scene controllers | Phone image/position/type/CTA choices; mobile scene simplification. Hosted video autoplays muted. Scroll exit is separate from entrance. |
| Featured collection | Actual collection products, grid/continuous/native or liquid carousel; `featured-collection`, product-card, carousel-data, carousel/flex controllers | Grid columns configurable; native rail fallback. Autoplay/interval behavior differs between paths: native continuous currently ignores the autoplay checkbox, snap fallback uses 5s rather than the interval setting. Repair planned E5. |
| Cards | `product-card`, card CSS and delegated `card-interactions`; product images/video, variants, badges, sibling links | Global image ratio/fit/hover/size settings; phone tray toggle; unambiguous single-option direct add, otherwise real product drawer. Appearance presets not yet implemented. |
| Collection tabs | Reorderable collection/label blocks, shared cards and `NkTabs`; heading entrance setting | Desktop columns; phone layout from CSS; keyboard tab navigation, static stacked panels without JS. Transition timing is fixed. |
| Category cards | Collection/image/menu/link blocks; bento/grid/scroller layouts, columns/gap/ratio | Stacked or scroller phone behavior; fixed tonal card surfaces and contain imagery in current design. Up to four menu links shown per card. |
| Collection directory / banner | Store collections or current collection, collection/product image fallback, counts and menu | Directory compact/large and gap; banner editorial text when no image. Most type/fit/scrim details are fixed. |
| Media with text | Merchant/collection image, copy/link, split/overlay; scene controls documented above | Media-side and phone content-order choices; legacy heading/reveal options apply only in legacy scene mode. |
| Expanding media | Image/video/collection, title/hint and heading/text/button blocks; own scoped expansion timeline | Static open frame on phone/editor/reduced motion, full desktop expansion optional. No independent mobile media control yet. |
| Announcement / message band | Linked text blocks; static-first or ticker announcement, one/two-row large marquee | Native/static motion fallback; static announcement displays only first populated message on storefront. Ticker announcement has hover/focus pause but no explicit pause button. |
| Image strip | Merchant image blocks or collection product imagery; moving strip with height/gap/speed/direction | Static scrollable list when motion unavailable; native labels/links; no grid variant yet. |
| Reviews wall | Merchant-entered attributed review/product blocks, moving vertical columns | Known limitation: later columns contain distinct reviews yet are hidden on phones/from accessibility APIs. E1 repairs this before adding variants. Not a review-provider integration. |
| Divider | Static/elastic separator with spacing and grab intensity, shared elastic-line runtime | Static under reduced motion/editor; no content blocks. |
| Recommendations | Actual Shopify related/complementary recommendations with fallback collection; scoped fetch and shared cards | CSS grid, desktop count setting; requires product context. Empty results may omit section. |
| Header/search/navigation | Menu resources, promos/description blocks, sticky/overlay/panel/drawer/search variants; header/nav/search modules and snippets | Phone drawer and search dialog; static native navigation fallback. One site header/search shell. |
| Footer | Brand/menu/social blocks, native Shopify newsletter, store policies/payment types; footer CSS/controller | Menus become disclosures on phones, fit-aware desktop reveal, reduced-motion fallback. Custom palette overrides scheme; form submission suppressed in editor. |
| Main product / size guide | Product/app/info blocks; native variants/availability/quantity/form, media and measurement snippets plus product entry | Responsive gallery/zoom and explicit required size selection. No general layout picker yet; sticky-buy module is registered but current product markup does not render it. |
| Collection/search results | Actual native filters/sort/pagination/density, facets/sections services and shared cards | Configured phone/desktop columns; shopper density may override initial columns. Predictive-search is an endpoint used by shell widgets, not an addable content section. |
| Cart page/drawer | Shopify lines/totals; serialized cart service, atomic fragment recovery, line-item snippet | Responsive page and dialog; note/empty source/after-add controlled globally. Drawer is static singleton. |
| Blog/article/page | Native Shopify article/blog/page data and comments | Mostly fixed reading width, grid and type; no section controls except directory-like defaults noted in reference. Article comment input IDs currently assume a single main article. |
| Password / 404 / gift card | Native access, error and gift-card templates with translated/static presentation | No merchant section settings currently; gift card is a standalone Liquid template. |
| Custom section / group / text | `@theme` composition with background image and nested group/text blocks; row/column presets, padding/alignment/text styles | Group currently never wraps and clips overflow; plain text appearance uses div rather than semantic heading. No richer media/button blocks yet. |

Size charts: product `custom.size_chart` metaobject or `custom.measurements` JSON takes priority.
The concurrent product work now adds `size-chart-assignment.liquid`: explicit product CSV rules,
then collection charts (`custom.size_chart_collection` can select a membership explicitly;
otherwise lowest `custom.size_chart_priority`, then handle order), collection CSV rules, a global
default `size_chart` metaobject handle, then product-block CSV/page fallback. This source contract
is included for reference; live chart assignment QA belongs to that product work and is not
certified by F1. See [Size chart setup](docs/SIZE-CHART-SETTINGS.md). Measurement data does not
create purchasable variants. No fabricated values, ratings, shipping promises or catalog data are
supplied by customization settings. Product sibling/color and composition/care metafield contracts
are detailed in [product audit](docs/PRODUCT-SYSTEM-AUDIT.md).

Whole-theme style presets **Riviera** and **Quiet** already exist in `settings_data.json`; these
are separate from section add-menu presets and from the current merchant configuration. Additional
style presets, shadow controls and component variations are future work in the roadmap.

## Extending the working architecture

1. Choose the next chunk from [CUSTOMIZATION_PLAN.md](CUSTOMIZATION_PLAN.md), inspect its actual
   sources and preserve public setting/block IDs. Document the migration if an ID must change.
2. Add native settings under clear Content/Layout/Appearance/Behavior headings. Use pickers for
   Shopify resources, bounded choices for meaningful visual outcomes and defaults that preserve
   saved templates. Current schemas use both English labels and schema translation keys.
3. Pass `settings`/`section.settings`/`block.settings` through Liquid. Render instance CSS values
   on that section/block root; static `{% stylesheet %}` and Vite CSS consume custom properties.
   Shared global values belong in `css-variables`. Render-only reuse belongs in snippets with
   explicit parameters. Preserve `block.shopify_attributes` on editable roots.
4. Native composition uses `@theme` and `content_for 'blocks'`; constrained local lists use
   section blocks. Do not mix local and theme block models. Nested theme blocks share definitions,
   not automatically their content. Native limits and composition constraints are in the plan.
5. Only interactive behavior needs TypeScript. Extend `NkElement`, register lazily in `global.ts`,
   use owned refs/unique IDs, capture the connection signal before async imports/fetch, and dispose
   listeners/timers/observers/media/GSAP contexts on removal. Use editor selection hooks to reveal
   hidden content. Global runtime JSON comes from `nk-config` with `json` encoding into `ThemeConfig`.
   Section behavior normally uses escaped attributes on its own custom element. There are no
   framework islands; keep existing TS/custom elements and commerce services as the runtime.
6. Keep content visible without JS. Use `motionMode`, tempo/stagger and scoped GSAP setup for new
   effects. Honor OS reduced motion, data saver, phone policy and design mode. Never animate the
   same image with two owners. Existing modules with incomplete policy consumption are tracked
   in C4 rather than described as already repaired.
7. Validate TypeScript, relevant unit behavior, Vite/sync, strict JSON, Theme Check, responsive
   layout and two differently configured instances. Test real editor operations and commerce
   fixtures where available, recording unavailable verification explicitly.
8. Update handwritten behavior notes, regenerate tables with
   `node scripts/customization-reference.mjs`, verify `--check`, and update roadmap status/evidence.

Do not edit generated `theme/assets/nk-*` or `nk-assets.liquid` by hand. Use the Vite source and
sync script. Saved `settings_data.json` and template arrangements are merchant content, not a
place to force demo settings during a code update. [Source audit](docs/CUSTOMIZATION_AUDIT.md)
maps all reusable modules/snippets and existing limitations.

## Current checkpoint verification

F2: TypeScript and the shared 91-test suite pass. Real Shopify Liquid output passed 40 section
checks at ten widths from 320 to 1920px, with four independent Media with text instances and an
unchanged Featured collection neighbor. Custom zero/extreme padding, default geometry, long
headings, split/overlay layouts, responsive content order, schemes and full-width backgrounds
were checked. Reordering the source template and returning a section to inherited padding worked
after reload. See [measurements](docs/evidence/customization-f2-layout-checks.json),
[desktop evidence](docs/evidence/customization-f2-desktop.jpg) and the archived
[native preview fixture](docs/fixtures/collection.customization-f2-audit.json). The temporary
template is removed from the deployable theme after testing. Native editor slider/save/reopen and
drag/drop lifecycle acceptance remains pending; source-template reload is a narrower check.

Finalized 23 October 2026: TypeScript, all 91 tests, production build/27 owned assets, JSON and
reference synchronization pass. Shopify Theme Check inspected 79 files with zero offenses after
fixture removal. Other product/motion changes continue in this shared workspace; they are
preserved and are not F2 implementation. No production publish was performed.

F1: TypeScript, 89 unit tests in 20 files, Vite build/27 owned assets, JSON and Theme Check passed.
Actual Shopify preview used expected gutters and saved Airy padding at eight widths from 320 to
1440px without page overflow; a temporary production-CSS fixture passed 40 default/extreme/spacing
combinations with two sections and full-bleed content. See [layout measurements](docs/evidence/customization-f1-layout-checks.json)
and [desktop evidence](docs/evidence/customization-f1-collection-desktop.jpg). Native editor
setting save/reopen/duplicate/reorder and physical-device checks remain pending. Concurrent product
and motion changes are preserved; these test totals describe the shared snapshot, not tests added
by F1. No production publish was performed.

## Reviews wall and grid (E1)

Add Reviews wall or Reviews grid in the native section picker. Review blocks retain quote,
attribution and optional product. Desktop columns (1–3), left/center text and bordered/minimal
cards are independent per instance. Moving wall uses the existing height/speed controls; its
columns now move together under one pause control. This deliberately replaces the old alternating
columns, which hid genuine content from phones and assistive technology. The old 24-block cap is
removed; Shopify's section limit applies. Presets do not fabricate customer reviews.

Every entered review appears once in the semantic list, in merchant order. Animation copies are
inert and hidden from accessibility APIs. Phones, editor, reduced motion, Motion off and the Grid
layout show the full list at natural height. Without JS it also remains fully visible. Desktop
moving links seek into view when focused; hover/focus pauses movement. Other tickers now also
honor the global phone Motion off setting. Runtime cleanup removes clones, motion state and skew.
Files: `sections/reviews-wall.liquid`, marquee TS/CSS and the existing motion service. Automated
static/reconnect regressions pass; native editor and visual moving-wall checks remain pending
because the local Shopify preview was unavailable at this checkpoint.

## Hero extensions (E2)

Campaign hero retains overlay/editorial/split layouts and adds Centered, Minimal split and
Image-led section presets using the same renderer and blocks. Phone height can inherit, use
55svh or full-screen minimum height (split applies it to media). Content can grow taller. Media
fit defaults to cover; Contain preserves the entire image/video and disables parallax cropping.
Image focal points use Shopify's image picker. Tint can emphasize bottom (existing default),
top or distribute evenly. Existing text-panel width, block scales and positions remain available.

Background video now has a keyboard-accessible Play/Pause button and an Autoplay choice (on by
default). The reusable lazy `nk-background-video` controls muted playback, pauses offscreen or
in hidden tabs, handles autoplay rejection and cleans up on removal. Reduced motion, Motion off
and the editor require manual Play. Turning motion off stops active playback; it does not restart
automatically when motion is restored. Without JS, native video controls remain available.
Hosted video still precedes file URL, image and collection image. First hero image priority is
unchanged. Files: hero Liquid/CSS, `src/components/media/background-video.ts`, global lazy registry.
Three playback-policy/independence/cleanup tests pass; native editor/device/LCP checks are pending.

## Product-card presentation (E3)

Theme settings → Product cards adds Minimal (default), Editorial, Bordered and Image focused
appearances, vendor visibility (off), price visibility (on), and alternate-media choice
(video with image fallback / image only / off). The existing secondary-media checkbox remains
the global master switch. Appearance does not change selected-variant or purchase rules.

`product-card.liquid` accepts optional `card_options` (section settings) for appearance, ratio
(inherit/square/4:5/2:3/4:3), fit, hover and vendor/price/badges/size visibility. `inherit` follows
global values; explicit show/hide preserves false values without Liquid's default-filter trap.
The `card-presentation` snippet emits local CSS variables on each article. Editorial changes title
scale and metadata rule; Bordered adds frame/padding; Image focused centers metadata. Global card
surface still supplies the base. Hover Off emits no alternate media, avoiding those downloads.
Size visibility does not bypass required options: products still use the existing option drawer
or product link when a direct size tray cannot safely add a variant. `actions: false` still hides
the card's action area for carousel-owned purchase UI. Vendor, title and content are escaped.
Files: product-card/card-presentation snippets, card CSS and global schema. Existing 20 product
and quick-add regression tests pass. Local editor controls are introduced by each consumer;
native multi-grid appearance/media/commerce end-to-end QA remains pending.

## Featured collection composition (E4)

Choose a collection or an explicit product list (up to 24 selections, existing visible limit
still applies). Selected products override the collection; empty sources do not pull in unrelated
products. Counts use the selected source. A custom product list requires its own View all URL;
otherwise that link uses the collection. Heading alignment, optional counts, CTA label/destination,
phone/desktop column gaps and regular/compact/large-first arrangements are per instance.
Editorial product grid and Bordered product grid presets reuse this section. A large first card
spans two desktop columns; all phone cards use the chosen phone column count. Image sizes reflect
columns and the editorial span. The existing 16-item display limit bounds rendering cost.

The optional Product card presentation block exposes E3's appearance/ratio/fit/hover/vendor/price/badge/size overrides.
These affect Liquid cards, including native carousel fallback. The OGL editorial canvas has its
own composition and does not inherit card framing. Content width and independent spacing use F2's
presentation contract. Defaults retain previous grid gaps, source, alignment and global cards.
File: `sections/featured-collection.liquid`, shared product-card snippets and styles. Source
schema/Theme Check/build checks pass; native repeated-source/layout/editor verification pending.

## Carousel policy and rail styles (E5)

Featured collection offers Editorial strip (OGL), Classic product rail and Snap slider. Native
fallback remains available if graphics cannot start. Autoplay defaults on but now respects Off
for every style; classic Off uses a finite manual rail without animation clones. Snap/editorial
time per product uses the configured 1.5–8 seconds, independently per instance. Classic speed
remains continuous pixels/second, while editorial speed controls settling responsiveness.
All native paths now honor the global phone Motion off setting. Size choice, focus, pointer,
drag, hidden tabs and offscreen holds retain their existing purchase protections.

Rail width (regular/compact/wide), spacing (regular/compact/airy), active-card emphasis and arrow
visibility apply to native card rails, including fallback. OGL retains its own responsive stage
geometry. Pause stays available for autoplay when arrows are hidden. Snap product slider and
Classic product rail presets use the same section. Product card controls live in one optional
presentation block, avoiding an oversized section settings panel; removing it restores global
cards. Existing saved sections without that block remain valid.
Three interval/independence/cleanup/off-policy tests and the existing carousel suites pass.
Native editor, multi-canvas memory and device/fallback visual checks remain pending.

## Collection tab variations (E6a)

Collection tabs adds underline (default), pills and desktop-sidebar styles/presets; phone columns,
column gap, card overrides and F2 width/spacing are independent per section. Each Tab block can
use 0 (inherit) or 1–12 products. Existing section limit remains the default. All panels still
render on the server for reliable no-JS access; hidden images stay lazy, but many tabs increase
Liquid/DOM cost. The old six-block cap is removed in favor of Shopify's section limit; use fewer
tabs/products when building media-heavy pages. No extra product fetch or framework is introduced.

Sidebar tabs use vertical ARIA orientation and Up/Down keys on desktop; phone layout remains
horizontal. Left/Right/Home/End, roving focus and editor block selection remain supported. The
Animate tab changes toggle disables panel/item effects and indicator travel for that instance.
Disconnect restores stacked visible panels before reconnect; IDs include section and block IDs.
Files: collection-tabs Liquid and existing tabs TS. Two keyboard/independence/editor/reconnect
regressions pass. Actual editor drag/save/long-label/touch and large-library performance QA remain pending.

## Recommendations presentation (E6b)

Product recommendations stays product-template-only and uses Shopify related/complementary
recommendations, with the existing fallback collection on empty/unavailable results. A new
Complementary products preset shares that implementation. Phone columns, gap, centered/left
heading, shared card controls, width and spacing are per section. Optional button renders only
when label and URL are set. Hide when empty defaults on; Off renders the configurable empty
message after an empty response. Requests remain instance scoped and reject stale reconnect
responses. Fallback remains if loading fails. An empty successful response is marked loaded so
reorder does not repeatedly request it. Files: product-recommendations Liquid, recommendations TS.
Three response/empty-state tests pass; real catalog recommendation/editor/visual QA remains pending.

## Category-card extensions (E7a)

Shop by category retains its five desktop/four phone layouts and original studio palette by
default. Card colors can instead use the section scheme; each Category block can override its
scheme independently. Whole-image (default) or cover fit can be chosen per section/card. Optional
index/count/description, 0–20 sub-links, heading animation and shared width/padding are exposed.
The eight-card cap is removed; native block limits apply. Grid and swipe-row presets reuse the
same implementation. A card without a destination is plain content rather than an empty link.
Destination override now takes precedence over its collection URL; blank retains that URL.
Files: category-cards Liquid with instance-scoped CSS tokens. Schema contracts caught and removed
a duplicate scheme ID; Theme Check/build pass. Native 1/2/5/50-card, palette, overflow and editor
tests remain pending. Existing studio defaults are retained, except decorative heading hover is
removed so the heading animation control is consistent.

## Collection directory (E7b)

Collections grid now supports curated/reordered collection selections or all store collections,
editable heading/eyebrow, empty-collection visibility, card index/count/description toggles,
portrait/square/landscape images, contain/cover and white-studio/scheme frames. Shared scheme,
width and spacing apply per section. Curated collection directory is an additional preset.
The first directory on `/collections` uses h1; other contexts/instances use h2.

Native pagination replaces the former silent 50-iteration ceiling: 4–48 collections per page,
24 default. Empty collections are filtered after pagination, so a page may show fewer cards;
the heading total counts the source including empty collections. Selected-list order comes from
the picker. Shopify gives setting-list pagination its own query key; two all-store directories
share the ordinary page query. Prefer curated lists for independently paged instances. See
[Shopify paginate documentation](https://shopify.dev/docs/api/liquid/tags/paginate).
The render-only `collection-directory-grid` snippet shares both source branches and the existing
pagination UI. Files: collections section and new snippet. Theme Check, source contracts and build
pass; real pagination URLs, repeated native instances and visual/editor acceptance remain pending.

## Collection banner variants (E7c)

Collection banner adds image override, heading override, image-when-available/text/minimal
layouts, regular/compact/tall image height with a separate phone choice, tint strength, drift
(0 disables), original light text or scheme colors, breadcrumb/count toggles and collection
navigation auto/menu-only/hidden. Automatic navigation has a 2–20-link limit (8 default); an
explicit menu remains merchant ordered. Minimal collection title is an additional preset.
Minimal omits the description. The first banner uses h1 and eager/high-priority media; later
instances use h2 and lazy images. Defaults preserve original fallback/image text/tint geometry.
Only collection templates expose the section. File: collection-banner Liquid. Source/build/schema
checks pass; actual image/tint contrast, native navigation/editor and responsive visual QA pending.

## Editorial media with text (E8a)

Media with text adds stacked and wide-image asymmetric layouts/presets to split/overlay, body
copy width (28–72ch, 46 default), centered/left copy, layout-default/portrait/square/landscape
media, contain/cover, phone image and text/filled/outline CTA. Overlay text can use light or scheme
colors; rich text now follows the overlay foreground. Existing scene controls own animation;
Contain disables inner parallax cropping. Stacked layout keeps media above copy on desktop;
the existing phone order choice still applies on phones. All overrides are local root tokens.

Shopify-hosted muted video can replace images and uses the same autoplay/manual/offscreen policy
and accessible controls as Hero. `background-video.liquid` now renders shared video markup for
both sections, retaining native controls without JS. No second video player dependency or global
per-section listener service is added. Files: media-text/hero sections, background-video snippet,
shared scene attributes and hero global CSS. Video policy tests, TypeScript/build/schema/JSON
checks pass; actual paired-story/video/editor/contrast/mobile layout checks remain pending.

## Expanding campaign presentation (E8b)

Expanding media adds left/center/right copy, body width, heading scale, compact/full-scene static
height, manual/autoplay video and shared filled/outline/text buttons with corners/arrows. Static
campaign is an additional preset with expansion off. Text and button blocks can repeat up to
native limits; one heading remains semantic. Static/phone/editor/reduced-motion frames now grow
with long copy instead of trapping content inside a fixed-height clipped stage. Desktop animated
scenes still use the existing bounded sticky track; keep that copy concise or disable expansion.

The former private video playback implementation is replaced by the shared background-video
component/snippet. Its pause control is outside the clipped frame, with an instance-unique ID and
owner-scoped binding, so it stays available while the closed frame animates. No-JS video retains
native controls. Cleanup, reduced-motion manual play and hidden/offscreen behavior use the same
policy as Hero. Files: expand-media Liquid/TS/CSS and shared video files. Campaign and video
tests pass, including external-control cleanup; native long-copy/scroll/contrast/device/editor QA pending.

## Message bands and announcements (E9a)

Message band adds static wrapped text, first-row direction and phone text scale. Phones default
to static; the second row is a decorative duplicate. One pause controls both moving rows in that
band independently from other bands. Announcement retains explicit First message mode and adds
All messages (stacked), direction and separator. Tickers have a 44px pause control. Static bar
height is unchanged. Both sections remove arbitrary block caps. Text is escaped.

Shared marquee focus immediately stops motion and seeks the real linked item into view in either
direction. Editor selection uses the same seek. Clones remain inert. Four static/group/lifecycle
tests pass; native long-label/focus/editor tests remain pending. Concurrent work has switched the
featured carousel section to browse-only: its generic purchase runtime remains, but the current
section no longer renders a purchase panel. Earlier purchase evidence describes its prior snapshot.

## Image and logo strips (E9b)

Image strip adds static wrapped grid, natural/square/portrait/landscape shapes, contain/cover,
phone height, optional static phone mode, monochrome images, captions and edge fading. Logo grid
and Portrait image strip presets reuse the section. Existing collection products precede image
blocks, with the selected product limit; the twenty-block cap is removed. Width/padding use the
shared presentation contract. Moving strips now have an explicit pause button. Defaults retain
natural widths, original height/fit, fading and collection-plus-block source behavior. Phones and
reduced motion retain manual access to static rails. Files: image-strip Liquid; shared marquee.
Theme Check has no errors, schema/JSON/build checks pass; linked-logo labels, extreme images,
static-grid overflow and real editor/native visual checks remain pending.

## Dividers (E9c)

Divider adds dashed/blank-space styles, page/short/full-bleed widths and 1–4px thickness to the
existing line/elastic choices. Quiet separator and Section spacer presets reuse it. Padding
remains 0–96px. The whole separator is decorative and hidden from accessibility APIs. Elastic
motion now runs only in full motion with a mouse; simplified phones, editor and reduced motion
show a static line. No content depends on it. Files: divider Liquid, existing elastic-line TS.
TypeScript, schema/JSON/Theme Check/build gates pass (two unrelated carousel orphan warnings).
Native pointer/multiple-width/editor visual verification remains pending.

## Header, navigation and search extensions (E10)

Header adds a two-row desktop layout, click-only or hover/click submenus, automatic/stacked
dropdown groups, original-color or theme-ink logo treatment, minimum desktop/phone heights
(76/64px defaults), account/search visibility and shared predictive resource/count controls.
Search can request products only, shopping resources, or products/collections/pages/queries;
both pill and modal now use the selected 2–10 results per type (6 default). Initial collection
chips have a separate 2–12 count. Pill previously requested four results; it now follows this
common header setting. Native GET search remains available if predictive behavior is disabled.
Existing sticky modes, overlay eligibility, drawer styles and separate navigation links/disclosures
remain. Header minimum height grows with wrapped navigation. Uploaded colors use a deliberate
specific override of the existing ink filter. Menu descriptions/promos use native block limits.

Header is explicitly limited to one instance because MenuDrawer, SearchModal and the measured
header-height token are site-wide shell contracts. Repeated content sections remain supported;
duplicating the shell is not promised. Announcement section ordering stays native in the header
group. Files: header section/TS/CSS, search-modal snippet and search-pill TS. Two hover/timer-cleanup
tests plus four search regressions pass; native long-menu, two-row, focus/overlay/search/editor and
responsive visual QA remain pending.

## Footer layouts and shared signup (E11)

Footer adds Editorial (default), Stacked signup and columns, and Compact wrap layouts, regular/
compact/airy padding, desktop minimum-column width, logo width, large-wordmark scale, policy and
back-to-top visibility, and collapsible/always-expanded phone menus. Removing Social links controls
social visibility. Menu blocks use native limits; brand/social remain single-purpose blocks.
Footer is explicitly singleton because reveal behavior belongs to the site shell.

Custom footer palette preserves saved colors by default. Selected scheme mode reads the native
[color_scheme object's settings](https://shopify.dev/docs/api/liquid/objects/color_scheme) and
copies actual background/text/accent values into footer tokens, avoiding circular CSS aliases.
Native customer signup is extracted to `newsletter-form.liquid`, preserving its form ID, newsletter
tag, localized labels, errors/success and privacy link. Consumers supply unique IDs; no subscription
was submitted during verification. Phone-open menus stay expanded; short-footer reveal still
disables when content is tall, on phones or under reduced motion. The beam runs only in full motion.
Files: footer section/TS/CSS and shared newsletter snippet. Responsive-menu regression tests and
source/build gates pass; actual form response, long-footer fit, scheme contrast, wordmark sizing
and native editor/device checks remain pending.

## Product gallery and layout (E12a)

Product information adds desktop slider/stack/editorial-grid media, square/portrait/landscape
ratios, contain/cover, white/scheme background, gallery-heavy/balanced/copy-heavy proportions,
gallery side, smaller-screen content order, sticky-info choice, thumbnails, arrow/counter and
zoom toggles. Defaults preserve the single square uncropped gallery and original proportions.
Phones retain the native swipe rail in every desktop layout. Zoom Off omits zoom URLs/buttons/
dialog, and hidden thumbnails do not render their image requests. Padding uses F2's local contract.
Main product is explicitly limited to one template section; later Featured product uses a separate
context. Quick add still removes the gallery and uses its existing single-column override.

Gallery observation uses the viewport root so stacked/grid media can track visibility; horizontal
overflow ancestors still clip phone slides. Variant media updates still require a resolved actual
variant. Existing product/quick-add/gallery regressions (22 tests) pass. Files: main-product,
product-media snippet, product CSS and gallery TS. Native three-layout/video/model/zoom/mobile/
app/editor and actual purchase QA remain pending; unit tests do not certify their visual behavior.

## Product information and chart reconciliation (E12b–c)

Title blocks add 70–130% size and information-block spacing adds 12–32px (defaults 100%/20px).
Description can remain collapsible or show inline under a semantic heading; care stays separately
collapsible. The existing description/specification/care rendering is extracted to
`product-description.liquid` to keep the main section's decision complexity bounded. Product
feature is a new optional repeatable block with decorative image, heading, rich text, optional
link and plain/bordered/surface styles. No feature or other block is inserted into saved templates.
Files: main-product, product-description/product-feature snippets and product CSS.

E12c reuses the existing product/collection/global metaobject and CSV chart assignment system and
variant-picker guide/preview/unit/highlight controls documented above. No duplicate chart engine
or new invented sizing data is added. Existing app blocks and price/picker/inventory/buy fragment
boundaries remain authoritative. Automated product/quick-add/gallery regressions pass; native
chart assignments, inline-description/app composition, actual variants/cart and editor/device
acceptance remain pending. Gallery choices are optional; saved product layout and block order
are preserved at defaults.

## Results merchandising (E13a)

Collection/search results add the shared card appearance/media/visibility controls, column gap,
contained/full-bleed toolbar, sticky toolbar choice and shopper column-switch visibility. Disabling
the switch ignores stored shopper density so merchant columns stay authoritative. Search now
passes its actual default columns to the shared facet toolbar, matching the rendered grid.
Existing Search & Discovery filters, sort, draft/apply behavior, URL history, product/page/article
results and pagination remain. Contextual result sections are explicitly singleton. Files:
main-collection/search, facets TS/CSS and shared cards. Nine targeted facet/sort/search regressions
pass; actual filtered URLs/back navigation, second-page media, empty catalogs and editor/visual QA pending.

## Cart presentation (E13b)

Cart page and drawer add independent schemes, regular/compact/airy line spacing and image
visibility. Images Off omits line photography. Cart page adds inherited/show/hide note choice,
bordered/plain/surface summary, optional sticky summary and accelerated-checkout visibility.
The drawer offers 360/420/560px width, bounded by the viewport. Defaults preserve current layout.
Cart page/drawer stay singletons with their existing fragment IDs and serialized mutation service.

An optional empty-cart collection shows up to four links-only product cards inside the native form;
it defaults off. `cart-empty-recommendations` never emits nested forms or card actions. Empty-cart
fragments therefore update suggestions with the existing cart rendering path. Prices, quantities,
discounts, taxes, checkout, retry/reconciliation and localized routes are unchanged. Files:
main-cart/cart-drawer, line-item/empty-suggestions snippets and cart CSS. Thirty-four cart/render/
product regression tests pass; native note/quantity/failed-response/accelerated-checkout/device/
editor and actual purchase acceptance remain pending. No cart or checkout mutation was made for QA.

## Journal and article templates (E14a)

Blog adds source/title override, grid/list/editorial arrangements, responsive columns, 4–24
articles/page (12 default), image/excerpt/date/author choices and scheme. Article adds 56–96ch
reading width (72 default), scheme, independent date/author and image/comments controls. Shopify's
blog comment enablement still governs whether comments are available. Shared article-meta keeps
localized combined metadata and escapes author text. Comment form/field IDs include the section
ID, entered values are escaped, and successful posts receive an acknowledgement without claiming
moderation approval. The conventional comments anchor remains. These are contextual singleton
blog/article template sections, with no automatically inserted content. Files: blog/article and
article-meta snippet. Schema/JSON/Theme Check/build checks pass; native pagination, comment
error/success/moderation and responsive/editor checks remain pending. No comments were posted for QA.

## Utility templates and gift-card styles (E14b)

Page adds title visibility, scheme and inherited/60ch/80ch reading width. Password adds the same
width/scheme, heading override, optional logo and optional native newsletter form. Signup defaults
off and reuses the shared renderer outside the password form. Password input ID is section scoped.
404 adds scheme/width, message and CTA overrides plus optional native search (off by default).
These remain contextual singleton sections; no existing content/template arrangement is replaced.

Theme settings → Gift card page adds Classic (unchanged default), Minimal and Bordered panel.
Only presentation changes: balance, redemption code, QR, expiry, download/print and Shopify contract
remain. Gift cards are standalone Liquid, so this is a global setting rather than a section schema.
Files: page/password/404 sections, base CSS, settings schema and gift_card template. Source/build/
schema/JSON checks pass; protected-store, signup/password response, real gift card and native
editor/mobile/print acceptance remain pending. No form was submitted or gift-card data accessed for QA.

## FAQ library section (N1)

Add FAQ or Split FAQ cards from the section picker. Each reorderable Question block has a question,
rich answer or page override, and initial-open choice. List/split, ruled/cards, plus/chevron/none,
first-open and single/multiple-open choices are local. Native `details` grouping uses a section-
unique name; older browsers without named-details grouping may allow several answers open.
No JS is required to read/open answers. Shared width/scheme/spacing and an animation toggle apply.
No structured-data claims or fabricated store policies are generated; preset text is editable guidance.

The existing `NkDisclosure` handles editor selection and optional transitions. It now supports
`no-animation` and cancels/clears clipping during replacement or editor selection. Three native
toggle/cleanup/independence tests pass. Files: faq Liquid and shared disclosure TS. Native question
grouping, add/reorder/save, screen reader and responsive/long-answer QA remain pending.

## Feature grids and lists (N2a)

Add Feature grid, Feature cards or Feature list. Reorderable blocks support an uploaded decorative
image or curated check/star/leaf/package/delivery icon, heading, rich text and optional labeled
link. Local card appearance can inherit or override plain/bordered/surface. Section controls offer
grid/list, 1–4 desktop and 1/2 phone columns, gap, alignment, icon size, optional subtle entrances
(off default), scheme and shared width/spacing. No service promises are supplied automatically.
The new feature-card renderer/styles are shared with optional product feature blocks; semantic
heading level is passed by the consumer. No new JS or dependency is needed. Files: feature-grid,
feature-card/feature-icon snippets and shared CSS. Source/schema/build checks pass; native 50-block,
long-label/empty-icon/responsive/editor and contrast checks remain pending.

<!-- schema-reference:start -->
## Implemented schema reference

Generated from current source schemas with `node scripts/customization-reference.mjs`. Run with `--check` to detect stale tables. Edit behavior notes above this marker; do not edit generated tables. These are schema defaults, not the saved values in a merchant template. Blank resource fields require selection; a preset may supply different values. Availability and runtime limitations are documented above and in the [source audit](docs/CUSTOMIZATION_AUDIT.md).

### Theme settings

Source: `theme/config/settings_schema.json`; token consumer: `theme/snippets/css-variables.liquid`; runtime policy: `theme/snippets/nk-config.liquid` → `src/core/config.ts`.

#### Logo

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `logo` — Logo | `image_picker` | Not specified |  |
| `logo_inverse` — Logo over campaign images | `image_picker` | Not specified | Used when the header overlays a dark hero image. |
| `favicon` — Favicon | `image_picker` | Not specified | Shown in browser tabs and bookmarks. Square image, at least 96 × 96px. |
| `logo_width` — Logo width (desktop) | `range` | `140` | 60–300px, step 10 |
| `logo_width_mobile` — Logo width (phone) | `range` | `110` | 60–200px, step 10 |

#### Colors

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `color_schemes` —  | `color_scheme_group` | Not specified |  |

Color scheme fields for `color_schemes`:

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `background` — Background | `color` | `#F3F2EE` |  |
| `surface` — Surface (cards, image placeholders) | `color` | `#E7E4DE` |  |
| `text` — Text | `color` | `#121212` |  |
| `text_muted` — Secondary text | `color` | `#55534E` |  |
| `line` — Lines and borders | `color` | `#D9D6CF` |  |
| `accent` — Accent (buttons, links, focus, selected states) | `color` | `#432D23` | Defaults to the footer brown. Hover, active, selected, border and focus shades are derived from it automatically. |
| `accent_text` — Text on accent | `color` | `#F5ECDF` |  |

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `color_error` — Errors | `color` | `#B42318` |  |
| `color_success` — Success | `color` | `#146C43` |  |

#### Typography

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `type_heading_font` — Headings | `font_picker` | `newsreader_n4` |  |
| `type_body_font` — Body | `font_picker` | `inter_n4` |  |
| `type_spec_font` — Labels (sizes, prices, details) | `font_picker` | `inter_n5` | Used for small uppercase labels, sizes and prices. |
| `heading_case` — Heading case | `select` | `uppercase` | `none`: As typed; `uppercase`: Uppercase |
| `body_size` — Body text size | `select` | `16` | `15`: Compact; `16`: Regular; `17`: Comfortable; `18`: Large |
| `heading_tracking` — Shared heading letter spacing | `select` | `editorial` | `editorial`: Editorial (current style); `natural`: Natural; `tight`: Tight; Shared headings and display text; specialized product/navigation typography keeps its own treatment. |
| `heading_leading` — Shared heading line spacing | `select` | `editorial` | `editorial`: Editorial (current style); `comfortable`: Comfortable |
| `label_tracking` — Shared label letter spacing | `select` | `editorial` | `editorial`: Editorial (current style); `natural`: Natural |

#### Layout

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `page_width` — Page width | `select` | `1440px` | `1200px`: Narrow; `1440px`: Wide; `100vw`: Full |
| `section_spacing` — Space between sections | `select` | `72` | `48`: Compact; `72`: Regular; `112`: Airy |
| `corner_radius` — Button and field corners | `select` | `2` | `0`: Square; `2`: Soft; `999`: Pill |
| `gutter_mobile` — Page gutter on phones | `range` | `16` | 12–32px, step 2; Screens below 750px. |
| `gutter_tablet` — Page gutter on tablets | `range` | `24` | 16–48px, step 2; Screens from 750px to 1199px. |
| `gutter_desktop` — Page gutter on large screens | `range` | `48` | 24–80px, step 4; Screens from 1200px. |
| `section_spacing_mobile` — Section spacing on smaller screens | `select` | `66` | `50`: Compact; `66`: Regular; `85`: Airy; `100`: Same as desktop; Below 990px, sections using shared spacing use 50%, 66%, 85% or 100% of Space between sections. |

#### Buttons

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `button_size` — Default button size | `select` | `regular` | `compact`: Compact; `regular`: Regular; `large`: Large; Applies to shared boxed buttons. Product purchase buttons retain a 56px minimum; hero Small/Large choices override this size. |
| `button_corners` — Default button corners | `select` | `inherit` | `inherit`: Use Layout corner setting; `square`: Square; `soft`: Rounded; `pill`: Pill |
| `button_motion` — Button hover effects | `select` | `expressive` | `expressive`: Sliding fill and hero label roll; `subtle`: Subtle fade; `none`: Instant states (no animation); Keyboard focus keeps its visible outline in all modes. Reduced motion and global Motion off always suppress travel. |

#### Product cards

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `card_surface` — Card surface | `select` | `flat` | `flat`: Flat; `bordered`: Bordered; `raised`: Raised; Applies to shared product and article cards; custom category cards retain their own design. |
| `card_image_ratio` — Image shape | `select` | `4 / 5` | `4 / 5`: Portrait 4:5; `3 / 4`: Portrait 3:4; `1 / 1`: Square |
| `card_image_fit` — Image fit | `select` | `contain` | `cover`: Fill; `contain`: Fit |
| `card_show_secondary` — Show second image on hover | `checkbox` | `true` |  |
| `card_show_sizes` — Show available sizes | `checkbox` | `true` |  |
| `card_show_low_stock` — Mark low-stock sizes | `checkbox` | `true` | A small dot on quick-add sizes at or below the "only a few left" threshold in Product page settings. |
| `card_size_option_names` — Size option name(s) | `text` | `Size` | Comma-separated option names treated as sizes, e.g. Size, Waist. |
| `card_show_badges` — Show sale and sold-out badges | `checkbox` | `true` |  |
| `card_appearance` — Product card appearance | `select` | `minimal` | `minimal`: Minimal; `editorial`: Editorial; `bordered`: Bordered; `image-led`: Image focused |
| `card_hover` — Product media on hover | `select` | `auto` | `auto`: Video when available, otherwise second image; `image`: Second image only; `off`: No alternate media |
| `card_hover_animation` — Product hover animation | `select` | `blur` | `blur`: Smooth blur crossfade; `fade`: Soft crossfade; `zoom`: Gentle zoom crossfade; `slide`: Slide across; `curtain`: Curtain reveal (original); Applies to alternate images and video. Videos appear only when playback is ready. |
| `card_show_vendor` — Show product vendor | `checkbox` | `false` |  |
| `card_show_price` — Show product price | `checkbox` | `true` |  |

#### Product page

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `product_required_options` — Options shoppers must choose | `text` | `Size` | These options are never preselected, so shoppers can't add an unintended size. Comma-separated. |
| `product_sold_out_values` — Sold-out option values | `select` | `strike` | `strike`: Show crossed out; `hide`: Hide |
| `inventory_threshold` — Show "only a few left" at or below | `range` | `3` | 0–20, step 1; 0 turns low-stock messages off. Only counts variants where Shopify tracks inventory and doesn't sell when out of stock. |

#### Size charts

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `size_chart_default_handle` — Default reusable chart handle | `text` | Not specified | Handle of a size_chart metaobject from Content > Metaobjects, e.g. classic-shirt. Used only when no product or collection assignment applies. Leave blank to preserve template fallbacks. |
| `size_chart_1_collections` — Apply to collections | `collection_list` | Not specified | Picker limit 50 |
| `size_chart_1_products` — Apply to specific products | `product_list` | Not specified | Picker limit 50; Use a separate chart for products with different measurements. |
| `size_chart_1_tags` — Apply to product tags | `textarea` | Not specified | One exact tag per line; any match applies. Case-insensitive. Blank tags are ignored. Product and collection assignments take priority. |
| `size_chart_1_handle` — Reusable chart handle | `text` | Not specified | Copy the size_chart entry handle from Admin > Content > Metaobjects. Edit that entry to update all assigned products. A usable reusable chart overrides Measurements below; blank, missing or empty entries use the CSV fallback. |
| `size_chart_1_image` — Size chart picture | `image_picker` | Not specified | Optional picture shown in the size guide. Works without a measurement table. Add image alt text in Shopify Files. A reusable chart picture takes priority. |
| `size_chart_1_table` — Measurements | `textarea` | Not specified | First line: Size,Chest,Length (or your headings). Then one comma-separated row per size. Enter only verified values, using the same size labels as product variants. Leave blank until verified. |
| `size_chart_1_unit` — Unit | `select` | `cm` | `cm`: Centimetres; `in`: Inches |
| `size_chart_1_basis` — Measurement basis | `text` | Not specified | For example: garment measured flat, or body measurements. State the actual method. |
| `size_chart_1_note` — Size guide note | `text` | Not specified |  |
| `size_chart_2_collections` — Apply to collections | `collection_list` | Not specified | Picker limit 50 |
| `size_chart_2_products` — Apply to specific products | `product_list` | Not specified | Picker limit 50; Use a separate chart for products with different measurements. |
| `size_chart_2_tags` — Apply to product tags | `textarea` | Not specified | One exact tag per line; any match applies. Case-insensitive. Blank tags are ignored. Product and collection assignments take priority. |
| `size_chart_2_handle` — Reusable chart handle | `text` | Not specified | Copy the size_chart entry handle from Admin > Content > Metaobjects. Edit that entry to update all assigned products. A usable reusable chart overrides Measurements below; blank, missing or empty entries use the CSV fallback. |
| `size_chart_2_image` — Size chart picture | `image_picker` | Not specified | Optional picture shown in the size guide. Works without a measurement table. Add image alt text in Shopify Files. A reusable chart picture takes priority. |
| `size_chart_2_table` — Measurements | `textarea` | Not specified | First line: Size,Chest,Length (or your headings). Then one comma-separated row per size. Enter only verified values, using the same size labels as product variants. Leave blank until verified. |
| `size_chart_2_unit` — Unit | `select` | `cm` | `cm`: Centimetres; `in`: Inches |
| `size_chart_2_basis` — Measurement basis | `text` | Not specified | For example: garment measured flat, or body measurements. State the actual method. |
| `size_chart_2_note` — Size guide note | `text` | Not specified |  |
| `size_chart_3_collections` — Apply to collections | `collection_list` | Not specified | Picker limit 50 |
| `size_chart_3_products` — Apply to specific products | `product_list` | Not specified | Picker limit 50; Use a separate chart for products with different measurements. |
| `size_chart_3_tags` — Apply to product tags | `textarea` | Not specified | One exact tag per line; any match applies. Case-insensitive. Blank tags are ignored. Product and collection assignments take priority. |
| `size_chart_3_handle` — Reusable chart handle | `text` | Not specified | Copy the size_chart entry handle from Admin > Content > Metaobjects. Edit that entry to update all assigned products. A usable reusable chart overrides Measurements below; blank, missing or empty entries use the CSV fallback. |
| `size_chart_3_image` — Size chart picture | `image_picker` | Not specified | Optional picture shown in the size guide. Works without a measurement table. Add image alt text in Shopify Files. A reusable chart picture takes priority. |
| `size_chart_3_table` — Measurements | `textarea` | Not specified | First line: Size,Chest,Length (or your headings). Then one comma-separated row per size. Enter only verified values, using the same size labels as product variants. Leave blank until verified. |
| `size_chart_3_unit` — Unit | `select` | `cm` | `cm`: Centimetres; `in`: Inches |
| `size_chart_3_basis` — Measurement basis | `text` | Not specified | For example: garment measured flat, or body measurements. State the actual method. |
| `size_chart_3_note` — Size guide note | `text` | Not specified |  |
| `size_chart_4_collections` — Apply to collections | `collection_list` | Not specified | Picker limit 50 |
| `size_chart_4_products` — Apply to specific products | `product_list` | Not specified | Picker limit 50; Use a separate chart for products with different measurements. |
| `size_chart_4_tags` — Apply to product tags | `textarea` | Not specified | One exact tag per line; any match applies. Case-insensitive. Blank tags are ignored. Product and collection assignments take priority. |
| `size_chart_4_handle` — Reusable chart handle | `text` | Not specified | Copy the size_chart entry handle from Admin > Content > Metaobjects. Edit that entry to update all assigned products. A usable reusable chart overrides Measurements below; blank, missing or empty entries use the CSV fallback. |
| `size_chart_4_image` — Size chart picture | `image_picker` | Not specified | Optional picture shown in the size guide. Works without a measurement table. Add image alt text in Shopify Files. A reusable chart picture takes priority. |
| `size_chart_4_table` — Measurements | `textarea` | Not specified | First line: Size,Chest,Length (or your headings). Then one comma-separated row per size. Enter only verified values, using the same size labels as product variants. Leave blank until verified. |
| `size_chart_4_unit` — Unit | `select` | `cm` | `cm`: Centimetres; `in`: Inches |
| `size_chart_4_basis` — Measurement basis | `text` | Not specified | For example: garment measured flat, or body measurements. State the actual method. |
| `size_chart_4_note` — Size guide note | `text` | Not specified |  |
| `size_chart_5_collections` — Apply to collections | `collection_list` | Not specified | Picker limit 50 |
| `size_chart_5_products` — Apply to specific products | `product_list` | Not specified | Picker limit 50; Use a separate chart for products with different measurements. |
| `size_chart_5_tags` — Apply to product tags | `textarea` | Not specified | One exact tag per line; any match applies. Case-insensitive. Blank tags are ignored. Product and collection assignments take priority. |
| `size_chart_5_handle` — Reusable chart handle | `text` | Not specified | Copy the size_chart entry handle from Admin > Content > Metaobjects. Edit that entry to update all assigned products. A usable reusable chart overrides Measurements below; blank, missing or empty entries use the CSV fallback. |
| `size_chart_5_image` — Size chart picture | `image_picker` | Not specified | Optional picture shown in the size guide. Works without a measurement table. Add image alt text in Shopify Files. A reusable chart picture takes priority. |
| `size_chart_5_table` — Measurements | `textarea` | Not specified | First line: Size,Chest,Length (or your headings). Then one comma-separated row per size. Enter only verified values, using the same size labels as product variants. Leave blank until verified. |
| `size_chart_5_unit` — Unit | `select` | `cm` | `cm`: Centimetres; `in`: Inches |
| `size_chart_5_basis` — Measurement basis | `text` | Not specified | For example: garment measured flat, or body measurements. State the actual method. |
| `size_chart_5_note` — Size guide note | `text` | Not specified |  |

#### Cart

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `cart_after_add` — After adding to cart | `select` | `drawer` | `drawer`: Open cart drawer; `notification`: Stay on page; `page`: Go to cart page |
| `cart_fly_animation` — Add-to-cart animation | `checkbox` | `true` | The product photo flies into the cart after it is added. Follows Theme settings > Motion and reduced-motion preferences. |
| `cart_show_note` — Order note | `checkbox` | `false` |  |
| `cart_empty_collection` — Empty cart: suggested collection | `collection` | Not specified |  |
| `cart_free_shipping` — Show free shipping progress | `checkbox` | `false` | Shown in the cart drawer and on the cart page. Set up the matching free shipping rate in Settings > Shipping and delivery. |
| `cart_free_shipping_threshold` — Free shipping minimum order | `number` | `5000` | Amount in your store's default currency, after discounts. Shoppers browsing in another currency don't see the bar. |

#### Promotions

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `promo_auto_apply` — Try promotion codes automatically in the cart | `checkbox` | `true` | When a product with a promotion code is in the cart, the code is sent to Shopify. It stays only if Shopify accepts it. |
| `promo_conflict_rule` — When codes can't be combined | `select` | `keep` | `keep`: Keep the code already applied; `priority`: Use the higher-priority promotion; Codes a shopper enters themselves are never replaced automatically. |
| `promo_code_field` — Show discount code field in cart | `checkbox` | `true` |  |
| `promo_metafield_priority` — Metafield code priority | `range` | `10` | 1–10, step 1; Higher wins when a product matches more than one promotion. |
| `promo_metafield_cards` — Show metafield codes on product cards | `checkbox` | `true` |  |
| `promo_1_enabled` — Enable | `checkbox` | `false` |  |
| `promo_1_code` — Shopify discount code | `text` | Not specified | Type the code exactly as it is set up in Shopify admin, for example TEE20. |
| `promo_1_scope` — Applies to | `select` | `matched` | `matched`: Matching products; `all`: Entire store |
| `promo_1_products` — Products | `product_list` | Not specified | Picker limit 50 |
| `promo_1_handles` — Product handles | `textarea` | Not specified | One per line or comma-separated. Most stable way to match products by text. |
| `promo_1_titles` — Product title phrases | `textarea` | Not specified | One per line. Matches whole words, ignoring case, for example Oversized Tee. |
| `promo_1_tag` — Product tag or promotion key | `text` | Not specified | Matches products tagged with this value, or whose custom.promotion metafield has it, for example summer-sale. |
| `promo_1_priority` — Priority | `range` | `5` | 1–10, step 1 |
| `promo_1_auto` — Try this code automatically in the cart | `checkbox` | `true` |  |
| `promo_1_cards` — Show on product cards | `checkbox` | `true` |  |
| `promo_1_badge` — Badge text | `text` | Not specified | Leave blank for "Code [code]". |
| `promo_1_message` — Product page message | `text` | Not specified | Leave blank for a standard message. Don't promise a saving: Shopify confirms eligibility in the cart. |
| `promo_2_enabled` — Enable | `checkbox` | `false` |  |
| `promo_2_code` — Shopify discount code | `text` | Not specified | Type the code exactly as it is set up in Shopify admin, for example TEE20. |
| `promo_2_scope` — Applies to | `select` | `matched` | `matched`: Matching products; `all`: Entire store |
| `promo_2_products` — Products | `product_list` | Not specified | Picker limit 50 |
| `promo_2_handles` — Product handles | `textarea` | Not specified | One per line or comma-separated. Most stable way to match products by text. |
| `promo_2_titles` — Product title phrases | `textarea` | Not specified | One per line. Matches whole words, ignoring case, for example Oversized Tee. |
| `promo_2_tag` — Product tag or promotion key | `text` | Not specified | Matches products tagged with this value, or whose custom.promotion metafield has it, for example summer-sale. |
| `promo_2_priority` — Priority | `range` | `5` | 1–10, step 1 |
| `promo_2_auto` — Try this code automatically in the cart | `checkbox` | `true` |  |
| `promo_2_cards` — Show on product cards | `checkbox` | `true` |  |
| `promo_2_badge` — Badge text | `text` | Not specified | Leave blank for "Code [code]". |
| `promo_2_message` — Product page message | `text` | Not specified | Leave blank for a standard message. Don't promise a saving: Shopify confirms eligibility in the cart. |
| `promo_3_enabled` — Enable | `checkbox` | `false` |  |
| `promo_3_code` — Shopify discount code | `text` | Not specified | Type the code exactly as it is set up in Shopify admin, for example TEE20. |
| `promo_3_scope` — Applies to | `select` | `matched` | `matched`: Matching products; `all`: Entire store |
| `promo_3_products` — Products | `product_list` | Not specified | Picker limit 50 |
| `promo_3_handles` — Product handles | `textarea` | Not specified | One per line or comma-separated. Most stable way to match products by text. |
| `promo_3_titles` — Product title phrases | `textarea` | Not specified | One per line. Matches whole words, ignoring case, for example Oversized Tee. |
| `promo_3_tag` — Product tag or promotion key | `text` | Not specified | Matches products tagged with this value, or whose custom.promotion metafield has it, for example summer-sale. |
| `promo_3_priority` — Priority | `range` | `5` | 1–10, step 1 |
| `promo_3_auto` — Try this code automatically in the cart | `checkbox` | `true` |  |
| `promo_3_cards` — Show on product cards | `checkbox` | `true` |  |
| `promo_3_badge` — Badge text | `text` | Not specified | Leave blank for "Code [code]". |
| `promo_3_message` — Product page message | `text` | Not specified | Leave blank for a standard message. Don't promise a saving: Shopify confirms eligibility in the cart. |
| `promo_4_enabled` — Enable | `checkbox` | `false` |  |
| `promo_4_code` — Shopify discount code | `text` | Not specified | Type the code exactly as it is set up in Shopify admin, for example TEE20. |
| `promo_4_scope` — Applies to | `select` | `matched` | `matched`: Matching products; `all`: Entire store |
| `promo_4_products` — Products | `product_list` | Not specified | Picker limit 50 |
| `promo_4_handles` — Product handles | `textarea` | Not specified | One per line or comma-separated. Most stable way to match products by text. |
| `promo_4_titles` — Product title phrases | `textarea` | Not specified | One per line. Matches whole words, ignoring case, for example Oversized Tee. |
| `promo_4_tag` — Product tag or promotion key | `text` | Not specified | Matches products tagged with this value, or whose custom.promotion metafield has it, for example summer-sale. |
| `promo_4_priority` — Priority | `range` | `5` | 1–10, step 1 |
| `promo_4_auto` — Try this code automatically in the cart | `checkbox` | `true` |  |
| `promo_4_cards` — Show on product cards | `checkbox` | `true` |  |
| `promo_4_badge` — Badge text | `text` | Not specified | Leave blank for "Code [code]". |
| `promo_4_message` — Product page message | `text` | Not specified | Leave blank for a standard message. Don't promise a saving: Shopify confirms eligibility in the cart. |

#### Motion

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `motion_level` — Animation level | `select` | `standard` | `off`: Off; `minimal`: Minimal; `standard`: Standard; Shoppers who ask their device for reduced motion always get minimal motion. |
| `motion_tempo` — Animation tempo | `select` | `balanced` | `relaxed`: Relaxed; `balanced`: Balanced; `brisk`: Brisk; Overall speed of entrance animations. Scroll-linked scenes always follow the scroll. |
| `motion_stagger` — Stagger between items | `select` | `medium` | `none`: None; `short`: Short; `medium`: Medium; `long`: Long; Delay between cards, words and lines that reveal one after another. |
| `motion_scroll_effects` — Scroll-linked effects | `checkbox` | `true` | Parallax, cinematic section scenes and pinning. Turn off for simple entrance animations only. |
| `motion_mobile` — Phone animations | `select` | `simple` | `simple`: Simplified; `full`: Same as desktop; `off`: Off; Simplified keeps quick fades and reveals but skips pinning, parallax and scroll-linked scenes on screens under 750px. |
| `motion_smooth_scroll` — Smooth wheel scrolling | `checkbox` | `true` | Fluid mouse-wheel and touchpad scrolling on desktop. Phones keep native scrolling. Off when the visitor's device asks for reduced motion (on Windows: Settings > Accessibility > Visual effects > Animation effects), with Motion off, and in the theme editor. |
| `motion_smooth_strength` — Smooth scrolling strength | `select` | `balanced` | `subtle`: Subtle; `balanced`: Balanced; `silky`: Silky (longest glide) |

#### Social media

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `social_instagram` — Instagram | `url` | Not specified |  |
| `social_tiktok` — TikTok | `url` | Not specified |  |
| `social_facebook` — Facebook | `url` | Not specified |  |
| `social_youtube` — YouTube | `url` | Not specified |  |

#### Gift card page

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `gift_card_style` — Presentation | `select` | `classic` | `classic`: Classic; `minimal`: Minimal; `bordered`: Bordered panel |

#### Customer support

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `support_replace_policy` — Show these links instead of the contact information policy | `checkbox` | `false` | Replaces the policy text from Settings › Policies on that page. Leave off if the policy contains details you must publish, such as your business address or registration number. |
| `support_intro` — Introduction | `richtext` | Not specified |  |
| `support_email` — Support email | `text` | Not specified |  |
| `support_phone` — Support phone | `text` | Not specified |  |
| `support_instagram` — Instagram profile URL | `url` | Not specified |  |
| `support_instagram_label` — Instagram link label | `text` | Not specified |  |

### Theme sections

#### Not found (404)

Source: `theme/sections/404.liquid`. Editor: select this section in its template or section group.

Available contexts: `{"templates":["404"]}`.

Section instance limit: 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `message` — Message | `text` | Not specified | Leave empty to use the default translation. |
| `primary_label` — First button label | `text` | Not specified | Defaults to "Go home". |
| `primary_link` — First button link | `url` | Not specified | Defaults to the homepage. |
| `secondary_label` — Second button label | `text` | Not specified | Defaults to "Explore". |
| `secondary_link` — Second button link | `url` | Not specified | Defaults to the collections list. |
| `show_search` — Show search | `checkbox` | `false` |  |
| `menu` — Popular links menu | `link_list` | Not specified |  |
| `show_products` — Show products | `checkbox` | `false` |  |
| `products_heading` — Products heading | `text` | `You might like` |  |
| `collection` — Products collection | `collection` | Not specified | Defaults to all products. |
| `products_count` — Number of products | `range` | `4` | 2–4, step 1 |

No add-menu preset: rendered by an existing template/layout/group or used as a rendering endpoint.

#### Accordion gallery (accordion-gallery)

Source: `theme/sections/accordion-gallery.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

Current section block cap: 6.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `eyebrow` — Eyebrow | `text` | `The collection, in focus` |  |
| `heading` — Heading | `text` | `Explore the collection` |  |
| `heading_size` — Heading size | `range` | `76` | 36–110px, step 2 |
| `description` — Description | `text` | `Everyday pieces. A closer look at the details.` |  |
| `collection` — Product collection | `collection` | Not specified | Product and image panels take priority when added. |
| `limit` — Product panels | `range` | `5` | 2–6, step 1 |
| `light_text_panels` — Light text on panels | `text` | Not specified | For dark product photos. Panel numbers separated by commas, e.g. 2, 4. Applies to collection panels; added panels have their own setting. |
| `height` — Desktop height | `range` | `580` | 420–760px, step 20 |
| `expand_ratio` — Open panel width | `range` | `4` | 2–7, step 1; How many times wider the open panel is than a closed one. |
| `gap` — Space between panels | `range` | `10` | 0–30px, step 2 |
| `radius` — Corner radius | `range` | `0` | 0–30px, step 2 |
| `details_height` — Info box height | `range` | `168` | 120–260px, step 4 |
| `image_fit` — Image fit | `select` | `cover` | `cover`: Fill panel; `contain`: Show whole image |
| `mobile_height` — Mobile open panel height | `range` | `510` | 360–680px, step 10 |
| `mobile_collapsed` — Mobile closed panel height | `range` | `76` | 56–120px, step 2 |
| `label_size` — Closed panel title size | `range` | `30` | 18–48px, step 1 |
| `title_size` — Open panel title size | `range` | `34` | 18–48px, step 1 |
| `show_numbers` — Show panel numbers | `checkbox` | `true` |  |
| `show_price` — Show price | `checkbox` | `true` |  |
| `show_link` — Show shop link | `checkbox` | `true` |  |
| `link_label` — Panel link text | `text` | `Shop the piece` |  |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `text_color` — Heading text | `color` | `#432d23` |  |
| `panel_color` — Panel background | `color` | `#eee9e1` |  |
| `label_color` — Panel titles | `color` | `#432d23` |  |
| `label_light_color` — Panel titles (light text) | `color` | `#fff9f0` |  |
| `details_color` — Info box background | `color` | `#432d23` |  |
| `details_text_color` — Info box text | `color` | `#fff9f0` |  |
| `start_panel` — Panel open on load | `range` | `1` | 1–6, step 1 |
| `open_on_hover` — Open panels on hover | `checkbox` | `true` |  |
| `hover_delay` — Hover delay | `range` | `160` | 0–600ms, step 20 |
| `click_through` — Click open picture to go to product | `checkbox` | `true` |  |
| `speed` — Animation speed | `range` | `1200` | 400–2000ms, step 100; Lower is faster. |

Supported block: **Product panel** (`product`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `product` — Product | `product` | Not specified |  |
| `image` — Image | `image_picker` | Not specified | Optional. Uses the product's main image when empty. |
| `title` — Title | `text` | Not specified | Optional. Uses the product title when empty. |
| `light_text` — Light text | `checkbox` | `false` | Use for dark product photos. |

Supported block: **Image panel** (`panel`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `image` — Image | `image_picker` | Not specified |  |
| `title` — Title | `text` | `Everyday essentials` |  |
| `link` — Link | `url` | Not specified |  |
| `light_text` — Light text | `checkbox` | `false` | Use for dark photos. |

Add-menu presets:

- Accordion gallery.

#### Announcement bar (announcement)

Source: `theme/sections/announcement.liquid`. Editor: select this section in its template or section group.

Available contexts: `{"groups":["header"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `mode` — Display | `select` | `static` | `static`: Static (first message); `ticker`: Scrolling ticker; `stacked`: All messages (stacked) |
| `speed` — Ticker speed | `range` | `40` | 20–120px, step 10; Pixels per second. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-2` |  |
| `direction` — Ticker direction | `select` | `left` | `left`: Right to left; `right`: Left to right |
| `separator` — Ticker separator | `text` | `✳` |  |

Supported block: **Message** (`message`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `text` — Text | `text` | Not specified |  |
| `link` — Link | `url` | Not specified |  |

Add-menu presets:

- Announcement bar; initial blocks `[{"type":"message"}]`.
- Stacked announcements — `{"mode":"stacked"}`; initial blocks `[{"type":"message"},{"type":"message"}]`.

#### Article (article)

Source: `theme/sections/article.liquid`. Editor: select this section in its template or section group.

Available contexts: `{"templates":["article"]}`.

Section instance limit: 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `show_date` — Show date | `checkbox` | `true` |  |
| `show_author` — Show author | `checkbox` | `true` |  |
| `width` — Reading width | `range` | `72` | 56–96ch, step 4 |
| `show_image` — Show article image | `checkbox` | `true` |  |
| `show_comments` — Show comments and comment form | `checkbox` | `true` | Requires comments to be enabled for this blog in Shopify. |

No add-menu preset: rendered by an existing template/layout/group or used as a rendering endpoint.

#### Blog (blog)

Source: `theme/sections/blog.liquid`. Editor: select this section in its template or section group.

Available contexts: `{"templates":["blog"]}`.

Section instance limit: 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `show_date` — Show date | `checkbox` | `true` |  |
| `show_author` — Show author | `checkbox` | `true` |  |
| `blog_source` — Blog source override | `blog` | Not specified |  |
| `heading` — Heading override | `text` | Not specified |  |
| `layout` — Layout | `select` | `grid` | `grid`: Grid; `list`: List; `editorial`: Editorial first story |
| `per_page` — Articles per page | `range` | `12` | 4–24, step 4 |
| `columns` — Desktop columns | `range` | `3` | 2–4, step 1 |
| `columns_mobile` — Phone columns | `select` | `1` | `1`: 1; `2`: 2 |
| `show_images` — Show images | `checkbox` | `true` |  |
| `show_excerpt` — Show excerpt | `checkbox` | `true` |  |

No add-menu preset: rendered by an existing template/layout/group or used as a rendering endpoint.

#### Button row (button-row)

Source: `theme/sections/button-row.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

Current section block cap: 8.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | Not specified |  |
| `text` — Text | `richtext` | Not specified |  |
| `alignment` — Alignment | `select` | `center` | `left`: Left; `center`: Center; `right`: Right |
| `button_width` — Button width | `select` | `auto` | `auto`: Fit label; `equal`: Equal widths; `full`: Full width, one per row |
| `mobile_layout` — On phones | `select` | `wrap` | `wrap`: Wrap side by side; `stack`: Stack full width |
| `gap` — Gap between buttons | `range` | `16` | 0–48px, step 4 |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Button** (`button`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `label` — Label | `text` | `Shop now` |  |
| `link` — Link | `url` | `/collections/all` |  |
| `style` — Style | `select` | `solid` | `solid`: Solid; `outline`: Outline; `pill`: Pill; `sweep`: Center sweep; `offset`: Offset shadow; `press`: 3D press; `link`: Text link |
| `new_tab` — Open link in a new tab | `checkbox` | `false` |  |

Add-menu presets:

- Button row; initial blocks `[{"type":"button","settings":{"label":"Shop new in","style":"solid"}},{"type":"button","settings":{"label":"View lookbook","style":"outline"}}]`.
- Button styles — `{"heading":"Button styles"}`; initial blocks `[{"type":"button","settings":{"label":"Solid","style":"solid"}},{"type":"button","settings":{"label":"Outline","style":"outline"}},{"type":"button","settings":{"label":"Pill","style":"pill"}},{"type":"button","settings":{"label":"Center sweep","style":"sweep"}},{"type":"button","settings":{"label":"Offset shadow","style":"offset"}},{"type":"button","settings":{"label":"3D press","style":"press"}},{"type":"button","settings":{"label":"Text link","style":"link"}}]`.

#### Cart drawer (cart-drawer)

Source: `theme/sections/cart-drawer.liquid`. Editor: select this section in its template or section group.

Section instance limit: 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `density` — Cart line spacing | `select` | `regular` | `regular`: Regular; `compact`: Compact; `airy`: Airy |
| `show_images` — Show product images | `checkbox` | `true` |  |
| `width` — Drawer width | `select` | `regular` | `regular`: Regular (420px); `narrow`: Narrow (360px); `wide`: Wide (560px) |
| `show_recommendations` — Show product suggestions | `checkbox` | `true` | Suggestions for the most recently added product, with one-tap size add. |
| `recommendations_heading` — Heading | `text` | `Complete the look` |  |
| `recommendation_intent` — Suggest | `select` | `complementary` | `complementary`: Complementary products; `related`: Related products; Set complementary products in the Search & Discovery app. Without them, related products are shown. |
| `show_accelerated` — Show express checkout buttons | `checkbox` | `true` | Shop Pay, Apple Pay and other wallets you've enabled in your payment settings. |

No add-menu preset: rendered by an existing template/layout/group or used as a rendering endpoint.

#### Cart recommendations (cart-recommendations)

Source: `theme/sections/cart-recommendations.liquid`. Editor: select this section in its template or section group.

No local settings.

No add-menu preset: rendered by an existing template/layout/group or used as a rendering endpoint.

#### Shop by category (category-cards)

Source: `theme/sections/category-cards.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `eyebrow` — Eyebrow | `text` | `Shop by category` |  |
| `heading` — Heading | `text` | `The` |  |
| `heading_italic` — Heading (italic part) | `text` | `wardrobe` |  |
| `link_label` — Link label | `text` | `Shop all` |  |
| `link` — Link | `url` | Not specified |  |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `layout` — Desktop layout | `select` | `bento` | `bento`: Bento, featured card left; `bento_right`: Bento, featured card right; `banner`: Wide banner, then a row; `grid`: Even grid; `scroller`: Horizontal scroller |
| `columns` — Columns | `range` | `4` | 2–5, step 1; Used by the even grid, the banner's row and the scroller (cards visible at once). |
| `mobile_layout` — Phone layout | `select` | `stacked` | `stacked`: Featured card full width, then two columns; `two`: Two columns; `one`: One column; `scroll`: Swipe row |
| `image_ratio` — Image shape | `select` | `standard` | `standard`: Standard (6:5); `portrait`: Portrait (4:5); `square`: Square; `wide`: Wide (3:2) |
| `gap` — Card spacing | `range` | `16` | 4–32px, step 2 |
| `card_palette` — Card colors | `select` | `studio` | `studio`: Original studio palette; `scheme`: Section color scheme |
| `card_style` — Card style | `select` | `studio` | `studio`: Studio tiles: photo on a tinted tile; `overlay`: Full photo: text over the image; `minimal`: Minimal: photo with a caption below; `framed`: Gallery frame: matted photo, centred title; `band`: Color band: photo above a solid title bar; Changes how each card looks. Desktop layout above sets where the cards go. |
| `card_outline` — Card outline | `checkbox` | `false` |  |
| `card_radius` — Corner radius | `range` | `0` | 0–32px, step 2 |
| `image_fit` — Image fit | `select` | `contain` | `contain`: Show entire image; `cover`: Fill and crop |
| `show_index` — Show index | `checkbox` | `true` |  |
| `show_count` — Show count | `checkbox` | `true` |  |
| `show_description` — Show description | `checkbox` | `true` |  |
| `menu_limit` — Sub-links per card | `range` | `4` | 0–20, step 1 |
| `heading_entrance` — Heading animation | `select` | `fold` | `fold`: Fold; `fade`: Fade; `none`: None |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters; Sets the width of the image and text together. Background stays full width. All options keep the theme's responsive page gutters. |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px. Custom values are exact and are not multiplied by the global smaller-screen spacing setting.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Category** (`category`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `collection` — Collection | `collection` | Not specified |  |
| `image` — Image | `image_picker` | Not specified | Defaults to the collection image. |
| `title` — Title | `text` | Not specified | Defaults to the collection title. |
| `description` — Description | `text` | Not specified |  |
| `menu` — Sub-links | `link_list` | Not specified | Optional menu shown as links on the card (up to 4). |
| `link` — Destination override | `url` | Not specified |  |
| `image_fit` — Image fit | `select` | `inherit` | `inherit`: Use section choice; `contain`: Show entire image; `cover`: Fill and crop |
| `custom_colors` — Override card color scheme | `checkbox` | `false` |  |
| `color_scheme` — Card color scheme | `color_scheme` | `scheme-1` |  |

Add-menu presets:

- Shop by category; initial blocks `[{"type":"category"},{"type":"category"},{"type":"category"},{"type":"category"},{"type":"category"}]`.
- Category grid — `{"layout":"grid","card_palette":"scheme"}`; initial blocks `[{"type":"category"},{"type":"category"},{"type":"category"},{"type":"category"}]`.
- Category swipe row — `{"layout":"scroller","mobile_layout":"scroll"}`; initial blocks `[{"type":"category"},{"type":"category"},{"type":"category"},{"type":"category"}]`.

#### Clothes rack (clothes-rack)

Source: `theme/sections/clothes-rack.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | Not specified | Small label above the rail. Leave empty for none. |
| `collection` — Collection | `collection` | Not specified | Used when no "Hang a product" blocks are added. Works best with clean flat-lay photos on white. |
| `limit` — Pieces on the rail | `range` | `8` | 3–16, step 1 |
| `back_from_second` — Use the second photo as the back view | `checkbox` | `true` | Turn off if your second photo is a lifestyle shot. Blocks can set a back photo per piece. |
| `knock_out_white` — Blend white photo backgrounds into the section | `checkbox` | `true` | Makes white studio backgrounds disappear on light color schemes. |
| `garment_size` — Garment size | `range` | `16` | 8–24rem, step 1 |
| `spacing` — Hanging spacing | `range` | `30` | 14–50%, step 2; How much of each garment shows while it hangs edge-on. |
| `collar_overlap` — Lift photo to the hanger | `range` | `22` | 0–40%, step 1; Pulls the photo up so the collar meets the hanger when photos have space above the garment. |
| `cta_label` — Button label | `text` | `See availability` |  |
| `front_label` — Front label | `text` | `Front` |  |
| `back_label` — Back label | `text` | `Back` |  |
| `close_label` — Close label | `text` | `Back to rack` |  |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Theme default; `narrow`: Narrow; `wide`: Wide; `full`: Full width |
| `spacing_mode` — Section spacing | `select` | `inherit` | `inherit`: Theme default; `custom`: Custom |
| `padding_top` — Top padding | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Bottom padding | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Top padding on phones | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Bottom padding on phones | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Hang a product** (`piece`); type limit 16.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `product` — Product | `product` | Not specified |  |
| `front_image` — Front photo | `image_picker` | Not specified | Optional. Defaults to the product's first photo. Cut-outs on white look best. |
| `back_image` — Back photo | `image_picker` | Not specified | Optional. Defaults to the product's second photo when that option is on. |

Add-menu presets:

- Clothes rack.

#### Collage (collage)

Source: `theme/sections/collage.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

Current section block cap: 5.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `Shop the edit` |  |
| `text` — Text | `richtext` | Not specified |  |
| `alignment` — Alignment | `select` | `left` | `left`: Left; `center`: Center |
| `layout` — Desktop layout | `select` | `left` | `left`: Large block left; `right`: Large block right; `even`: Equal columns |
| `mobile_layout` — Phone layout | `select` | `collage` | `collage`: Collage; `column`: Single column |
| `row_height` — Row height (desktop) | `range` | `320` | 160–600px, step 20 |
| `gap` — Gap | `range` | `12` | 0–40px, step 4 |
| `caption_position` — Caption | `select` | `overlay` | `overlay`: Over the image; `below`: Below the image |
| `hover_zoom` — Zoom images on hover | `checkbox` | `true` |  |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Image** (`image`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `image` — Image | `image_picker` | Not specified |  |
| `caption` — Caption | `text` | Not specified |  |
| `link` — Link | `url` | Not specified |  |

Supported block: **Product** (`product`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `product` — Product | `product` | Not specified |  |

Supported block: **Collection** (`collection`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `collection` — Collection | `collection` | Not specified |  |

Add-menu presets:

- Collage; initial blocks `[{"type":"image"},{"type":"product"},{"type":"collection"}]`.

#### Collection banner (collection-banner)

Source: `theme/sections/collection-banner.liquid`. Editor: select this section in its template or section group.

Available contexts: `{"templates":["collection"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `show_description` — Show collection description | `checkbox` | `true` |  |
| `use_product_image` — Use the first product image when the collection has no image | `checkbox` | `false` |  |
| `menu` — Related collections menu | `link_list` | Not specified | Optional row of links under the title. Falls back to store collections when blank. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `image` — Banner image override | `image_picker` | Not specified |  |
| `heading` — Heading override | `text` | Not specified |  |
| `title_animation` — Title animation | `select` | `rise` | `none`: None; `rise`: Rise from a mask; `blur`: Blur in; `fold`: Fold up; `skew`: Skewed rise; `fade`: Fade up; Plays once when the page opens. Follows Theme settings > Motion and reduced-motion preferences. |
| `title_split` — Animate title by | `select` | `words` | `words`: Word; `chars`: Letter; `lines`: Line |
| `layout` — Banner layout | `select` | `auto` | `auto`: Image when available; `text`: Text only; `minimal`: Minimal title |
| `height` — Image banner height | `select` | `regular` | `regular`: Regular; `compact`: Compact; `full`: Tall |
| `height_mobile` — Image height on phones | `select` | `inherit` | `inherit`: Use desktop choice; `compact`: Compact; `full`: Tall |
| `image_colors` — Text over image | `select` | `light` | `light`: Original light text; `scheme`: Use section scheme |
| `tint_strength` — Image tint strength | `range` | `100` | 0–100%, step 5 |
| `parallax` — Image drift | `range` | `12` | 0–30%, step 2 |
| `show_breadcrumbs` — Show breadcrumbs | `checkbox` | `true` |  |
| `show_count` — Show count | `checkbox` | `true` |  |
| `navigation` — Collection navigation | `select` | `auto` | `auto`: Menu or store collections; `menu`: Selected menu only; `none`: Hidden |

Add-menu presets:

- Collection banner.
- Minimal collection title — `{"layout":"minimal","navigation":"none","show_breadcrumbs":false,"show_count":false}`.

#### Collection tabs (collection-tabs)

Source: `theme/sections/collection-tabs.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `eyebrow` — Eyebrow | `text` | `New arrivals` |  |
| `heading` — Heading | `text` | `Just` |  |
| `heading_italic` — Heading (italic part) | `text` | `landed` |  |
| `entrance` — Heading entrance | `select` | `cut` | `none`: None; `cut`: Editorial masked reveal; `rise`: Rise word by word (Split Text); `blur`: Blur in word by word (Text Effect); `fold`: Paper fold (Fold Text); `flip`: Flip up; `skew`: Skew in; `pop`: Pop; `fade`: Fade |
| `limit` — Products per tab | `range` | `8` | 2–12, step 1 |
| `columns_desktop` — Columns on desktop | `range` | `4` | 2–5, step 1 |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `card_appearance` — Card appearance | `select` | `inherit` | `inherit`: Use theme default; `minimal`: Minimal; `editorial`: Editorial; `bordered`: Bordered; `image-led`: Image focused |
| `card_ratio` — Image ratio | `select` | `inherit` | `inherit`: Use theme default; `square`: Square; `portrait`: Portrait (4:5); `tall`: Tall (2:3); `landscape`: Landscape (4:3) |
| `card_fit` — Image fit | `select` | `inherit` | `inherit`: Use theme default; `cover`: Fill; `contain`: Contain |
| `card_hover` — Alternate media | `select` | `inherit` | `inherit`: Use theme default; `auto`: Video with image fallback; `image`: Second image only; `off`: Off |
| `card_vendor` — Show vendor | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `card_price` — Show price | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `card_badges` — Show badges | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `card_sizes` — Show sizes | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `tab_style` — Tab appearance | `select` | `underline` | `underline`: Underline; `pills`: Pills; `sidebar`: Desktop sidebar |
| `columns_mobile` — Columns on phones | `select` | `1` | `1`: 1; `2`: 2 |
| `grid_gap` — Column gap | `range` | `8` | 0–40px, step 2 |
| `transitions` — Animate tab changes | `checkbox` | `true` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters; Sets the width of the image and text together. Background stays full width. All options keep the theme's responsive page gutters. |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px. Custom values are exact and are not multiplied by the global smaller-screen spacing setting.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Tab** (`tab`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `collection` — Collection | `collection` | Not specified |  |
| `label` — Tab label | `text` | Not specified | Defaults to the collection title. |
| `limit` — Products in this tab | `range` | `0` | 0–12, step 1; Zero uses the section products-per-tab setting. |

Add-menu presets:

- Collection tabs; initial blocks `[{"type":"tab"},{"type":"tab"}]`.
- Pill collection tabs — `{"tab_style":"pills"}`; initial blocks `[{"type":"tab"},{"type":"tab"}]`.
- Sidebar collections — `{"tab_style":"sidebar"}`; initial blocks `[{"type":"tab"},{"type":"tab"}]`.

#### Collections grid (collections)

Source: `theme/sections/collections.liquid`. Editor: select this section in its template or section group.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `grid_item_width` — Card size | `select` | `collections--full` | `collections--compact`: Compact; `collections--full`: Large |
| `grid_gap` — Grid gap | `range` | `20` | 0–50px, step 5 |
| `heading` — Heading | `text` | Not specified | Defaults to the translated collections title. |
| `eyebrow` — Eyebrow | `text` | `Directory` |  |
| `collections` — Selected collections | `collection_list` | Not specified | Choose and reorder collections. Empty uses all store collections. |
| `page_size` — Collections per page | `range` | `24` | 4–48, step 4 |
| `show_empty` — Show empty collections | `checkbox` | `false` |  |
| `show_index` — Show index | `checkbox` | `true` |  |
| `show_count` — Show count | `checkbox` | `true` |  |
| `show_description` — Show description | `checkbox` | `true` |  |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `image_fit` — Image fit | `select` | `contain` | `contain`: Entire image; `cover`: Fill and crop |
| `image_ratio` — Image shape | `select` | `portrait` | `portrait`: Portrait; `square`: Square; `landscape`: Landscape |
| `image_frame` — Image background | `select` | `studio` | `studio`: White studio; `scheme`: Scheme surface |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters; Sets the width of the image and text together. Background stays full width. All options keep the theme's responsive page gutters. |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px. Custom values are exact and are not multiplied by the global smaller-screen spacing setting.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Add-menu presets:

- Collections grid.
- Curated collection directory — `{"image_frame":"scheme","image_ratio":"square"}`.

#### Comparison table (comparison-table)

Source: `theme/sections/comparison-table.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

Current section block cap: 24.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `Compare fabrics` |  |
| `text` — Text | `richtext` | Not specified |  |
| `feature_label` — First column heading | `text` | `Feature` |  |
| `column_1` — Column 1 heading | `text` | `Linen` |  |
| `column_2` — Column 2 heading | `text` | `Cotton` |  |
| `column_3` — Column 3 heading | `text` | `Wool` | Leave blank for two columns. |
| `column_4` — Column 4 heading | `text` | Not specified | Needs column 3. |
| `highlight` — Highlight column | `select` | `1` | `none`: None; `1`: Column 1; `2`: Column 2; `3`: Column 3; `4`: Column 4 |
| `appearance` — Rows | `select` | `ruled` | `ruled`: Ruled; `striped`: Striped; `boxed`: Boxed |
| `mark_style` — "Yes" shown as | `select` | `check` | `check`: Check mark; `dot`: Dot; `word`: Word |
| `header_style` — Column headings | `select` | `spec` | `spec`: Small caps; `heading`: Heading font |
| `text_size` — Text size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large |
| `sticky_first` — Keep first column visible while scrolling | `checkbox` | `true` |  |
| `footnote` — Footnote | `richtext` | Not specified |  |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Row** (`row`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `feature` — Feature | `text` | `Breathable` |  |
| `note` — Feature note | `text` | Not specified |  |
| `value_1` — Column 1 value | `text` | `yes` | Type yes or no for a mark or dash, or any short text. |
| `value_2` — Column 2 value | `text` | `yes` |  |
| `value_3` — Column 3 value | `text` | `no` |  |
| `value_4` — Column 4 value | `text` | Not specified |  |

Add-menu presets:

- Comparison table; initial blocks `[{"type":"row"},{"type":"row","settings":{"feature":"Machine washable","value_1":"no","value_2":"yes","value_3":"no"}},{"type":"row","settings":{"feature":"Warmth","value_1":"Light","value_2":"Medium","value_3":"High"}}]`.

#### Contact form (contact-form)

Source: `theme/sections/contact-form.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

Current section block cap: 8.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `Get in touch` |  |
| `text` — Text | `richtext` | `<p>Questions about sizing, an order or alterations? We reply within one business day.</p>` |  |
| `details` — Contact details | `richtext` | Not specified | For example opening hours, email address or studio address. |
| `layout` — Desktop layout | `select` | `split` | `stacked`: Stacked; `split`: Intro beside form |
| `card_style` — Form panel | `select` | `plain` | `plain`: Plain; `surface`: Surface fill; `outline`: Outline; `shadow`: Soft shadow |
| `field_style` — Field style | `select` | `outline` | `outline`: Outlined; `filled`: Filled; `underline`: Underline |
| `show_phone` — Show phone field | `checkbox` | `true` |  |
| `message_rows` — Message box height (rows) | `range` | `6` | 3–12, step 1 |
| `consent` — Text above the button | `richtext` | Not specified | For example a note about how you use the information. |
| `button_label` — Button label | `text` | Not specified | Defaults to "Send". |
| `button_style` — Button style | `select` | `solid` | `solid`: Solid; `outline`: Outline; `pill`: Pill; `sweep`: Center sweep; `offset`: Offset shadow; `press`: 3D press |
| `button_width` — Button width | `select` | `auto` | `auto`: Fit label; `full`: Full width |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Extra field** (`field`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `label` — Label | `text` | `Order number` |  |
| `type` — Field type | `select` | `text` | `text`: Short text; `textarea`: Long text; `select`: Dropdown; `date`: Date; `number`: Number; `tel`: Phone; `url`: Website |
| `choices` — Dropdown choices | `text` | `Order, Returns, Sizing` | Comma-separated. Used for Dropdown. |
| `placeholder` — Placeholder | `text` | Not specified |  |
| `width` — Width | `select` | `full` | `half`: Half; `full`: Full |
| `required` — Required | `checkbox` | `false` |  |

Add-menu presets:

- Contact form.

#### Countdown (countdown)

Source: `theme/sections/countdown.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `The winter sale ends soon` |  |
| `text` — Text | `richtext` | Not specified |  |
| `alignment` — Alignment | `select` | `center` | `left`: Left; `center`: Center |
| `end_date` — End date | `text` | `2026-12-31` | Format YYYY-MM-DD. |
| `end_time` — End time | `text` | `23:59` | 24-hour HH:MM in the shop time zone. |
| `show_days` — Show days | `checkbox` | `true` |  |
| `show_date` — Show the end date under the timer | `checkbox` | `true` |  |
| `ended_message` — Message after the end | `text` | `This offer has ended.` |  |
| `hide_when_ended` — Hide the timer after the end | `checkbox` | `false` |  |
| `layout` — Desktop layout | `select` | `stacked` | `stacked`: Heading above timer; `inline`: Heading beside timer |
| `appearance` — Digit style | `select` | `boxes` | `plain`: Plain; `boxes`: Boxes; `outline`: Outline; `inverted`: Inverted boxes |
| `digit_size` — Digit size (desktop) | `range` | `72` | 32–120px, step 4 |
| `accent_digits` — Accent color for digits | `checkbox` | `false` |  |
| `show_labels` — Show unit labels | `checkbox` | `true` |  |
| `separators` — Colons between units | `checkbox` | `false` |  |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Button** (`button`); type limit 2.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `label` — Label | `text` | `Shop now` |  |
| `link` — Link | `url` | `/collections/all` |  |
| `style` — Style | `select` | `solid` | `solid`: Solid; `outline`: Outline; `pill`: Pill; `sweep`: Center sweep; `offset`: Offset shadow; `press`: 3D press; `link`: Text link |
| `new_tab` — Open link in a new tab | `checkbox` | `false` |  |

Add-menu presets:

- Countdown; initial blocks `[{"type":"button","settings":{"label":"Shop the sale"}}]`.

#### Counter band (counter-band)

Source: `theme/sections/counter-band.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

Current section block cap: 8.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `In numbers` |  |
| `text` — Text | `richtext` | Not specified |  |
| `alignment` — Alignment | `select` | `center` | `left`: Left; `center`: Center |
| `columns` — Columns (desktop) | `range` | `4` | 2–6, step 1 |
| `gap` — Gap between statistics | `range` | `16` | 0–64px, step 4 |
| `card_style` — Card style | `select` | `outline` | `plain`: Plain; `surface`: Surface fill; `outline`: Outline; `shadow`: Soft shadow |
| `dividers` — Vertical divider lines | `checkbox` | `false` |  |
| `value_size` — Number size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large |
| `accent_values` — Accent color for numbers | `checkbox` | `false` |  |
| `label_position` — Label position | `select` | `below` | `below`: Below the number; `above`: Above the number |
| `animate` — Count up when visible | `checkbox` | `true` | Skipped when visitors prefer reduced motion or motion is off. |
| `duration` — Count duration | `range` | `1600` | 600–3000ms, step 200; Shown when `{{ section.settings.animate }}` |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Statistic** (`stat`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `value` — Number | `text` | `1200` | Digits with optional decimals and thousands separators, such as 4.9 or 12,000. |
| `prefix` — Prefix | `text` | Not specified |  |
| `suffix` — Suffix | `text` | Not specified |  |
| `label` — Label | `text` | `Happy customers` |  |
| `text` — Description | `richtext` | Not specified |  |

Add-menu presets:

- Counter band; initial blocks `[{"type":"stat","settings":{"value":"12,000","suffix":"+","label":"Orders shipped"}},{"type":"stat","settings":{"value":"4.9","suffix":"/5","label":"Average rating"}},{"type":"stat","settings":{"value":"38","label":"Countries"}},{"type":"stat","settings":{"value":"100","suffix":"%","label":"Natural fibres"}}]`.

#### Custom section (custom-section)

Source: `theme/sections/custom-section.liquid`. Editor: select this section in its template or section group.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `background_image` — Background | `image_picker` | Not specified |  |

Supported block: **@theme** (`@theme`).

Add-menu presets:

- Custom section.

#### Divider (divider)

Source: `theme/sections/divider.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `style` — Style | `select` | `elastic` | `line`: Line; `elastic`: Elastic line (reacts to the pointer); `dashed`: Dashed line; `space`: Blank spacing |
| `grab` — Pointer catch distance | `range` | `14` | 4–40px, step 2 |
| `spacing` — Spacing | `range` | `24` | 0–96px, step 4 |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `width` — Line width | `select` | `content` | `content`: Page width; `short`: Short centered line; `full`: Full bleed |
| `thickness` — Line thickness | `range` | `1` | 1–4px, step 1 |

Add-menu presets:

- Divider.
- Quiet separator — `{"style":"line","width":"short","spacing":48}`.
- Section spacer — `{"style":"space"}`.

#### Expanding media (expand-media)

Source: `theme/sections/expand-media.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `animate` — Scroll expansion | `checkbox` | `true` | Desktop sticky storytelling. Phones, reduced motion and the editor show the final frame without a long scroll track. |
| `image` — Image | `image_picker` | Not specified |  |
| `video` — Video | `video` | Not specified | Plays muted while on screen; visitors can pause it. |
| `video_url` — Video file URL | `url` | Not specified | Optional MP4 address, used when no video is picked above. |
| `poster_url` — Video poster image URL | `url` | Not specified |  |
| `collection` — Use collection image | `collection` | Not specified | Shown when no video or image is set. |
| `title` — Title over the closed frame | `text` | `Built to move` | Decorative; repeat important words in the heading block. |
| `hint` — Scroll hint | `text` | `Scroll` |  |
| `start_width` — Starting width | `range` | `42` | 30–90%, step 2 |
| `start_height` — Starting height | `range` | `58` | 30–90%, step 2 |
| `length` — Scroll length | `select` | `long` | `short`: Short; `long`: Long |
| `scrim` — Tint when open | `range` | `45` | 0–80%, step 5 |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-2` |  |
| `video_autoplay` — Autoplay muted video | `checkbox` | `true` |  |
| `alignment` — Content alignment | `select` | `center` | `center`: Center; `left`: Left; `right`: Right |
| `static_height` — Static campaign height | `select` | `regular` | `regular`: Full scene; `compact`: Compact; Minimum height only. Static content grows to fit long copy; applies on phones and when expansion is off. |
| `copy_width` — Content width | `range` | `60` | 28–72ch, step 2 |

Supported block: **Heading** (`heading`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `Every detail, full frame` |  |
| `scale` — Heading size | `range` | `100` | 50–150%, step 5 |

Supported block: **Text** (`text`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `text` — Text | `richtext` | Not specified |  |

Supported block: **Button** (`button`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `label` — Label | `text` | `Shop the drop` |  |
| `link` — Link | `url` | Not specified |  |
| `style` — Button style | `select` | `solid` | `solid`: Filled; `outline`: Outline; `link`: Text |
| `corners` — Corners | `select` | `inherit` | `inherit`: Theme default; `square`: Square; `soft`: Soft; `pill`: Pill |
| `arrow` — Show arrow | `checkbox` | `false` |  |

Add-menu presets:

- Expanding media; initial blocks `[{"type":"heading"},{"type":"button"}]`.
- Static campaign — `{"animate":false,"static_height":"compact","alignment":"left"}`; initial blocks `[{"type":"heading"},{"type":"text"},{"type":"button"}]`.

#### FAQ (faq)

Source: `theme/sections/faq.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `Frequently asked questions` |  |
| `text` — Introduction | `richtext` | Not specified |  |
| `layout` — Layout | `select` | `list` | `list`: Stacked; `split`: Introduction beside questions |
| `appearance` — Appearance | `select` | `lines` | `lines`: Ruled list; `cards`: Cards |
| `marker` — Disclosure icon | `select` | `plus` | `plus`: Plus / minus; `chevron`: Chevron; `none`: None |
| `single_open` — Only one answer open at a time | `checkbox` | `false` |  |
| `first_open` — Open first answer initially | `checkbox` | `false` |  |
| `animate` — Animate opening and closing | `checkbox` | `true` |  |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters; Sets the width of the image and text together. Background stays full width. All options keep the theme's responsive page gutters. |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px. Custom values are exact and are not multiplied by the global smaller-screen spacing setting.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Question** (`question`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `question` — Question | `text` | `Your question` |  |
| `answer` — Answer | `richtext` | `<p>Share a helpful answer with your customers.</p>` |  |
| `page` — Answer from a page | `page` | Not specified | Overrides the answer above. |
| `open` — Open initially | `checkbox` | `false` |  |

Add-menu presets:

- FAQ; initial blocks `[{"type":"question"},{"type":"question"},{"type":"question"}]`.
- Split FAQ cards — `{"layout":"split","appearance":"cards"}`; initial blocks `[{"type":"question"},{"type":"question"}]`.

#### Feature grid (feature-grid)

Source: `theme/sections/feature-grid.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `What makes us different` |  |
| `text` — Introduction | `richtext` | Not specified |  |
| `layout` — Layout | `select` | `grid` | `grid`: Grid; `list`: List |
| `appearance` — Card appearance | `select` | `plain` | `plain`: Plain; `bordered`: Bordered; `surface`: Surface |
| `alignment` — Alignment | `select` | `left` | `left`: Left; `center`: Center |
| `columns` — Desktop columns | `range` | `3` | 1–4, step 1 |
| `columns_mobile` — Phone columns | `select` | `1` | `1`: 1; `2`: 2 |
| `gap` — Card gap | `range` | `24` | 12–48px, step 4 |
| `icon_size` — Icon size | `range` | `48` | 24–80px, step 4 |
| `animate` — Subtle card entrances | `checkbox` | `false` |  |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters; Sets the width of the image and text together. Background stays full width. All options keep the theme's responsive page gutters. |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px. Custom values are exact and are not multiplied by the global smaller-screen spacing setting.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Feature** (`feature`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `icon` — Icon | `select` | `none` | `none`: None; `check`: Check; `star`: Star; `leaf`: Leaf; `box`: Package; `truck`: Delivery |
| `image` — Decorative icon or image | `image_picker` | Not specified |  |
| `heading` — Heading | `text` | `Product feature` |  |
| `text` — Text | `richtext` | Not specified |  |
| `appearance` — Appearance | `select` | `inherit` | `inherit`: Use section choice; `plain`: Plain; `bordered`: Bordered; `surface`: Surface |
| `link` — Link | `url` | Not specified |  |
| `link_label` — Link label | `text` | Not specified |  |

Add-menu presets:

- Feature grid; initial blocks `[{"type":"feature"},{"type":"feature"},{"type":"feature"}]`.
- Feature cards — `{"appearance":"bordered","alignment":"center"}`; initial blocks `[{"type":"feature"},{"type":"feature"},{"type":"feature"}]`.
- Feature list — `{"layout":"list"}`; initial blocks `[{"type":"feature"},{"type":"feature"},{"type":"feature"}]`.

#### Feature list (feature-list)

Source: `theme/sections/feature-list.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

Current section block cap: 12.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `Good to know` |  |
| `text` — Text | `richtext` | Not specified |  |
| `alignment` — Alignment | `select` | `left` | `left`: Left; `center`: Center |
| `columns` — Columns (desktop) | `range` | `3` | 1–6, step 1 |
| `columns_mobile` — Columns (phones) | `select` | `1` | `1`: 1 column; `2`: 2 columns |
| `gap` — Gap between features | `range` | `28` | 0–64px, step 4 |
| `layout` — Icon placement | `select` | `stacked` | `stacked`: Above text; `inline`: Beside text |
| `card_style` — Card style | `select` | `plain` | `plain`: Plain; `surface`: Surface fill; `outline`: Outline; `shadow`: Soft shadow |
| `dividers` — Divider line above each feature | `checkbox` | `false` |  |
| `title_size` — Feature title size | `select` | `medium` | `medium`: Medium; `large`: Large |
| `icon_style` — Icon background | `select` | `circle` | `plain`: None; `circle`: Circle; `square`: Square; `outline`: Outline circle |
| `icon_size` — Icon size | `range` | `28` | 16–64px, step 4 |
| `icon_color` — Icon color | `select` | `accent` | `accent`: Accent; `text`: Text |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Feature** (`feature`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `icon` — Icon | `select` | `truck` | `none`: None; `truck`: Delivery; `arrow-path`: Returns; `scissors`: Tailoring; `sparkles`: Quality; `heart`: Care; `globe-alt`: Worldwide; `lock-closed`: Secure; `shield-check`: Guarantee; `gift`: Gift; `bolt`: Fast; `adjustments-vertical`: Fit; `check`: Check |
| `image` — Custom icon | `image_picker` | Not specified | Replaces the icon above. Use a square image or SVG. |
| `title` — Title | `text` | `Free delivery` |  |
| `text` — Text | `richtext` | `<p>On orders over a set amount, tracked to your door.</p>` |  |
| `link_label` — Link label | `text` | Not specified |  |
| `link` — Link | `url` | Not specified |  |

Add-menu presets:

- Feature list; initial blocks `[{"type":"feature","settings":{"icon":"truck","title":"Free delivery"}},{"type":"feature","settings":{"icon":"arrow-path","title":"Easy returns"}},{"type":"feature","settings":{"icon":"scissors","title":"Free alterations"}}]`.

#### Featured collection (featured-collection)

Source: `theme/sections/featured-collection.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `eyebrow` — Eyebrow | `text` | `Featured drop` |  |
| `heading` — Heading | `text` | `New in` |  |
| `heading_italic` — Heading (italic part) | `text` | Not specified |  |
| `description` — Description | `text` | Not specified |  |
| `show_collection_description` — Use collection description when empty | `checkbox` | `true` |  |
| `collection` — Collection | `collection` | Not specified |  |
| `limit` — Products to show | `range` | `8` | 2–16, step 1 |
| `layout` — Layout | `select` | `grid` | `grid`: Grid; `carousel`: Product carousel |
| `carousel_effect` — Carousel style | `select` | `liquid` | `liquid`: Editorial strip; `native`: Classic product rail; `snap`: Snap slider (no WebGL); In browse mode, phones and tablets use a lightweight swipe rail.; Shown when `{{ section.settings.layout == 'carousel' }}` |
| `carousel_purchase` — Shop the highlighted product | `checkbox` | `true` | Shows one Add to cart button for the centred product. It opens that product's sizes, and the chosen size is added. Autoplay holds while sizes are open. Turn off for a browse-only carousel that links to products.; Shown when `{{ section.settings.layout == 'carousel' }}` |
| `carousel_intro` — Carousel entrance | `select` | `rise` | `rise`: Rise; `bloom`: Bloom; `deal`: Spread; `spin`: Spin; `none`: None; Shown when `{{ section.settings.layout == 'carousel' and section.settings.carousel_effect == 'liquid' }}` |
| `carousel_center_products` — Products before the curve | `range` | `4` | 3–6, step 1; Approximate number of products in the flatter desktop center. Original image proportions are preserved; outer products curve away.; Shown when `{{ section.settings.layout == 'carousel' and section.settings.carousel_effect == 'liquid' and section.settings.carousel_purchase == false }}` |
| `carousel_autoplay` — Advance products automatically | `checkbox` | `true` | Browse mode flows continuously; shop mode steps product by product and holds while a shopper hovers the purchase controls or chooses a size. Dragging, keyboard focus and the pause button always pause it.; Shown when `{{ section.settings.layout == 'carousel' }}` |
| `carousel_interval` — Autoplay pace | `range` | `1.5` | 1–8s, step 0.5; Liquid browse mode: approximate travel time per product. Liquid shop mode and snap rail: time each product stays highlighted.; Shown when `{{ section.settings.layout == 'carousel' and section.settings.carousel_effect != 'native' and section.settings.carousel_autoplay }}` |
| `carousel_speed` — Carousel speed | `range` | `35` | 10–80, step 5; Higher values move faster. Controls native rail speed or liquid flow/manual response; autoplay pace sets the base travel time. |
| `columns_mobile` — Columns on phones | `select` | `1` | `1`: 1; `2`: 2 |
| `columns_desktop` — Columns on desktop | `range` | `4` | 2–5, step 1 |
| `show_view_all` — Show 'View all' button | `checkbox` | `true` |  |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `products` — Custom product selection | `product_list` | Not specified | Picker limit 24; Overrides the collection. An empty list uses the collection; there is no all-products fallback. |
| `grid_style` — Grid arrangement | `select` | `regular` | `regular`: Regular; `dense`: Compact rows; `editorial`: Large first product |
| `grid_gap` — Column gap (desktop) | `range` | `8` | 0–48px, step 2 |
| `grid_gap_mobile` — Column gap (phones) | `range` | `8` | 0–32px, step 2 |
| `heading_alignment` — Heading alignment | `select` | `left` | `left`: Left; `center`: Center |
| `show_count` — Show product counts | `checkbox` | `true` |  |
| `link` — View all destination | `url` | Not specified | Required for a custom product selection. Otherwise uses the collection. |
| `link_label` — View all label | `text` | `View all` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters; Sets the width of the image and text together. Background stays full width. All options keep the theme's responsive page gutters. |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px. Custom values are exact and are not multiplied by the global smaller-screen spacing setting.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `carousel_card_width` — Rail card width | `select` | `regular` | `regular`: Regular; `compact`: Compact; `wide`: Wide; Shown when `{{ section.settings.layout == 'carousel' }}` |
| `carousel_gap` — Rail spacing | `select` | `regular` | `regular`: Regular; `compact`: Compact; `airy`: Airy; Shown when `{{ section.settings.layout == 'carousel' }}` |
| `carousel_emphasis` — Highlight active card | `checkbox` | `true` |  |
| `carousel_arrows` — Show carousel arrows | `checkbox` | `true` | For classic and snap rails. The liquid carousel uses drag and keyboard navigation with a minimal pause control. |

Supported block: **Product card presentation** (`card_style`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `card_appearance` — Card appearance | `select` | `inherit` | `inherit`: Use theme default; `minimal`: Minimal; `editorial`: Editorial; `bordered`: Bordered; `image-led`: Image focused |
| `card_ratio` — Image ratio | `select` | `inherit` | `inherit`: Use theme default; `square`: Square; `portrait`: Portrait (4:5); `tall`: Tall (2:3); `landscape`: Landscape (4:3) |
| `card_fit` — Image fit | `select` | `inherit` | `inherit`: Use theme default; `cover`: Fill; `contain`: Contain |
| `card_hover` — Alternate media | `select` | `inherit` | `inherit`: Use theme default; `auto`: Video with image fallback; `image`: Second image only; `off`: Off |
| `card_vendor` — Show vendor | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `card_price` — Show price | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `card_badges` — Show badges | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `card_sizes` — Show sizes | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |

Add-menu presets:

- Featured collection; initial blocks `[{"type":"card_style","settings":{}}]`.
- Editorial product grid — `{"grid_style":"editorial","columns_desktop":3}`; initial blocks `[{"type":"card_style","settings":{"card_appearance":"editorial"}}]`.
- Bordered product grid — `{"grid_gap":24,"heading_alignment":"center"}`; initial blocks `[{"type":"card_style","settings":{"card_appearance":"bordered"}}]`.
- Snap product slider — `{"layout":"carousel","carousel_effect":"snap","carousel_autoplay":false}`; initial blocks `[{"type":"card_style","settings":{}}]`.
- Classic product rail — `{"layout":"carousel","carousel_effect":"native"}`; initial blocks `[{"type":"card_style","settings":{}}]`.

#### Footer (footer)

Source: `theme/sections/footer.liquid`. Editor: select this section in its template or section group.

Available contexts: `{"groups":["footer"]}`.

Section instance limit: 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `show_newsletter` — Show newsletter signup | `checkbox` | `true` |  |
| `newsletter_eyebrow` — Newsletter label | `text` | `A note from us` |  |
| `newsletter_heading` — Newsletter heading | `text` | `Good things, first.` |  |
| `show_wordmark` — Show large brand name | `checkbox` | `true` |  |
| `background` — Background | `color` | `#432d23` |  |
| `ink` — Text | `color` | `#f5ecdf` |  |
| `accent` — Light beam and accents | `color` | `#d7ae83` |  |
| `animate_beam` — Animate soft light beam | `checkbox` | `true` |  |
| `invert_logo` — Use light logo on dark background | `checkbox` | `true` |  |
| `show_payment_icons` — Show payment icons | `checkbox` | `true` |  |
| `reveal` — Reveal footer on scroll (desktop) | `checkbox` | `true` | Page content scrolls away to uncover the footer when it fits in the viewport. Desktop only. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-2` |  |
| `layout` — Layout | `select` | `editorial` | `editorial`: Editorial; `columns`: Stacked signup and columns; `compact`: Compact wrap |
| `density` — Spacing | `select` | `regular` | `regular`: Regular; `compact`: Compact; `airy`: Airy |
| `palette_mode` — Colors | `select` | `custom` | `custom`: Custom footer palette; `scheme`: Selected color scheme |
| `mobile_menus` — Phone menus | `select` | `accordion` | `accordion`: Collapsible; `open`: Always expanded |
| `column_width` — Minimum desktop column width | `range` | `160` | 140–280px, step 20 |
| `logo_width` — Logo width | `range` | `220` | 100–320px, step 10 |
| `wordmark_scale` — Large brand name scale | `range` | `100` | 70–100%, step 5 |
| `show_policies` — Show policy links | `checkbox` | `true` |  |
| `show_back_to_top` — Show back to top | `checkbox` | `true` |  |

Supported block: **Brand** (`brand`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `text` — Text | `richtext` | Not specified |  |

Supported block: **Menu** (`menu`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | Not specified |  |
| `menu` — Menu | `link_list` | `footer` |  |

Supported block: **Social links** (`social`); type limit 1.

No local settings.

No add-menu preset: rendered by an existing template/layout/group or used as a rendering endpoint.

#### Header (header)

Source: `theme/sections/header.liquid`. Editor: select this section in its template or section group.

Available contexts: `{"groups":["header"]}`.

Section instance limit: 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `menu` — Menu | `link_list` | `main-menu` |  |
| `customer_account_menu` — Customer account menu | `link_list` | `customer-account-main-menu` |  |
| `layout` — Desktop layout | `select` | `center` | `center`: Logo centered; `left`: Logo left; `two-row`: Centered logo with navigation below |
| `sticky` — Sticky header | `select` | `reveal` | `off`: Off; `always`: Always visible; `reveal`: Show when scrolling up |
| `panel_style` — Desktop menu panels | `select` | `attached` | `attached`: Full width; `floating`: Floating card (morphs between items) |
| `link_hover` — Menu link hover | `select` | `underline` | `underline`: Underline; `swap`: Letter swap |
| `drawer_style` — Phone menu style | `select` | `standard` | `standard`: Standard list; `editorial`: Editorial (large numbered items); `cards`: Cards |
| `search_style` — Desktop search | `select` | `icon` | `icon`: Icon; `pill`: Expanding field |
| `predictive_search` — Show search suggestions as you type | `checkbox` | `true` | Search opens a panel with products, collections and suggested queries. |
| `search_collections` — Collections suggested in search | `collection_list` | Not specified |  |
| `overlay_home` — Overlay the homepage hero | `checkbox` | `false` | Only applies when the first homepage section supports overlay (for example the campaign hero). |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `nav_trigger` — Desktop submenu opening | `select` | `hover` | `hover`: Hover or click; `click`: Click only |
| `dropdown_layout` — Dropdown links | `select` | `auto` | `auto`: Automatic grouping; `list`: Stacked groups |
| `logo_treatment` — Logo image colors | `select` | `ink` | `ink`: Original theme ink treatment; `original`: Preserve uploaded colors |
| `logo_animation` — Logo animation on load | `select` | `ink` | `none`: None; `ink`: Ink reveal (written left to right); `rise`: Soft rise; Follows Theme settings > Motion; never plays with reduced motion or in the theme editor. |
| `logo_animation_frequency` — Play logo animation | `select` | `session` | `session`: Once per visit; `every`: On every page |
| `height` — Minimum desktop header height | `range` | `76` | 60–120px, step 4 |
| `height_mobile` — Minimum phone header height | `range` | `64` | 56–88px, step 4 |
| `show_account` — Show customer account | `checkbox` | `true` |  |
| `show_search` — Show header search | `checkbox` | `true` |  |
| `search_resources` — Search suggestions | `select` | `query,product,collection,page` | `query,product,collection,page`: Products, collections, pages and queries; `query,product,collection`: Products, collections and queries; `product`: Products only |
| `search_limit` — Results per suggestion type | `range` | `6` | 2–10, step 1 |
| `suggestion_limit` — Initial collection suggestions | `range` | `6` | 2–12, step 1 |

Supported block: **Menu card description** (`group_description`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `menu_item` — Menu item title | `text` | Not specified | Shown in the Cards phone menu under this top-level item. |
| `text` — Description | `text` | Not specified |  |

Supported block: **Menu promo card** (`promo`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `menu_item` — Show under menu item | `text` | Not specified | Type the exact title of a top-level menu item. |
| `image` — Image | `image_picker` | Not specified |  |
| `title` — Title | `text` | `Campaign` |  |
| `link` — Link | `url` | Not specified |  |

No add-menu preset: rendered by an existing template/layout/group or used as a rendering endpoint.

#### Hero: image overlay (hero-overlay)

Source: `theme/sections/hero-overlay.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `image` — Image | `image_picker` | Not specified |  |
| `image_mobile` — Mobile image | `image_picker` | Not specified |  |
| `overlay_style` — Overlay | `select` | `solid` | `solid`: Even tint; `bottom`: Gradient from bottom; `side`: Gradient from left |
| `overlay_opacity` — Overlay strength | `range` | `30` | 0–90%, step 5 |
| `text_tone` — Text color over image | `select` | `light` | `light`: Light; `dark`: Dark |
| `height` — Height (desktop) | `select` | `large` | `small`: Small; `medium`: Medium; `large`: Large; `full`: Full screen |
| `mobile_height` — Height (phones) | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `full`: Full screen |
| `content_position` — Content position (desktop) | `select` | `bottom-left` | `top-left`: Top left; `top-center`: Top center; `top-right`: Top right; `middle-left`: Middle left; `middle-center`: Middle center; `middle-right`: Middle right; `bottom-left`: Bottom left; `bottom-center`: Bottom center; `bottom-right`: Bottom right |
| `mobile_position` — Content position (phones) | `select` | `bottom` | `top`: Top; `middle`: Middle; `bottom`: Bottom |
| `alignment` — Text alignment | `select` | `left` | `left`: Left; `center`: Center |
| `content_max_width` — Content max width | `range` | `720` | 320–1040px, step 40 |
| `content_box` — Content background | `select` | `none` | `none`: None; `blur`: Frosted glass; `solid`: Solid panel |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Caption** (`caption`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `caption` — Caption | `text` | `New season` |  |
| `style` — Style | `select` | `spec` | `spec`: Small caps; `badge`: Badge; `plain`: Plain text |

Supported block: **Heading** (`heading`); type limit 2.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `Made to move with you` |  |
| `size` — Size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `italic` — Italic | `checkbox` | `false` |  |

Supported block: **Text** (`text`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `text` — Text | `richtext` | `<p>Pair large imagery with a short story about the collection, the fabric or the fit.</p>` |  |
| `size` — Text size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large |
| `color` — Text color | `select` | `default` | `default`: Default; `muted`: Muted |

Supported block: **Spacer** (`spacer`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `height` — Height | `range` | `16` | 0–80px, step 4 |

Supported block: **Button** (`button`); type limit 3.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `label` — Label | `text` | `Shop now` |  |
| `link` — Link | `url` | `/collections/all` |  |
| `style` — Style | `select` | `solid` | `solid`: Solid; `outline`: Outline; `pill`: Pill; `sweep`: Center sweep; `offset`: Offset shadow; `press`: 3D press; `link`: Text link |
| `new_tab` — Open link in a new tab | `checkbox` | `false` |  |

Add-menu presets:

- Hero: image overlay; initial blocks `[{"type":"caption"},{"type":"heading","settings":{"size":"xlarge"}},{"type":"text"},{"type":"button","settings":{"style":"solid"}}]`.

#### Hero: split (hero-split)

Source: `theme/sections/hero-split.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `image` — Image | `image_picker` | Not specified |  |
| `image_mobile` — Mobile image | `image_picker` | Not specified | Optional. Shown on screens below 750px. |
| `image_position` — Image position (desktop) | `select` | `right` | `left`: Left; `right`: Right |
| `image_fit` — Image fit | `select` | `cover` | `cover`: Fill frame (crop); `contain`: Show whole image |
| `split` — Column widths | `select` | `even` | `even`: Half and half; `image`: Larger image; `text`: Larger text |
| `mobile_order` — On phones | `select` | `image_first` | `image_first`: Image above text; `text_first`: Text above image |
| `mobile_image_height` — Image height on phones | `range` | `90` | 40–140%, step 5; Percentage of the screen width. |
| `eyebrow` — Eyebrow | `text` | `New collection` |  |
| `eyebrow_style` — Eyebrow style | `select` | `spec` | `spec`: Small caps; `badge`: Badge; `plain`: Plain text |
| `heading` — Heading | `text` | `Tailored for the everyday` |  |
| `heading_display` — Heading size | `select` | `large` | `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `heading_italic` — Italic heading | `checkbox` | `false` |  |
| `text` — Text | `richtext` | `<p>Considered essentials cut from natural fibres, made to be worn on repeat.</p>` |  |
| `text_size` — Text size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large |
| `height` — Height (desktop) | `select` | `medium` | `auto`: Adapt to content; `medium`: Medium; `large`: Large; `full`: Full screen |
| `alignment` — Text alignment | `select` | `left` | `left`: Left; `center`: Center |
| `vertical_alignment` — Text vertical position | `select` | `middle` | `top`: Top; `middle`: Middle; `bottom`: Bottom |
| `panel` — Panel style | `select` | `surface` | `surface`: Surface fill; `outline`: Outline; `none`: None |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Button** (`button`); type limit 3.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `label` — Label | `text` | `Shop now` |  |
| `link` — Link | `url` | `/collections/all` |  |
| `style` — Style | `select` | `solid` | `solid`: Solid; `outline`: Outline; `pill`: Pill; `sweep`: Center sweep; `offset`: Offset shadow; `press`: 3D press; `link`: Text link |
| `new_tab` — Open link in a new tab | `checkbox` | `false` |  |

Add-menu presets:

- Hero: split; initial blocks `[{"type":"button","settings":{"label":"Shop now","style":"solid"}},{"type":"button","settings":{"label":"Our story","style":"link"}}]`.

#### Campaign hero (hero)

Source: `theme/sections/hero.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

Current section block cap: 16.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `scroll_exit` — Gentle scroll exit | `checkbox` | `true` | Copy subtly drifts and fades as the hero leaves. Full motion only; separate from the entrance setting. |
| `video` — Video | `video` | Not specified | Shopify-hosted video. Plays muted. |
| `video_autoplay` — Autoplay background video | `checkbox` | `true` | Muted. Pauses offscreen and when hidden. Reduced motion and the editor require pressing Play. Native controls remain available without JavaScript. |
| `video_url` — Video file URL | `url` | Not specified | Optional MP4 address from Content › Files, used when no video is picked above. |
| `poster_url` — Video poster image URL | `url` | Not specified |  |
| `image` — Image | `image_picker` | Not specified | Also the video poster when no poster URL is set. |
| `collection` — Use collection image | `collection` | Not specified | Shown when no video or image is set. |
| `video_mobile` — Phone video | `video` | Not specified |  |
| `video_url_mobile` — Phone video file URL | `url` | Not specified | Used when no phone video is picked above. |
| `poster_url_mobile` — Phone video poster image URL | `url` | Not specified |  |
| `image_mobile` — Phone image | `image_picker` | Not specified |  |
| `slide_autoplay` — Change slides automatically | `checkbox` | `true` | Visitors can pause it. Off for visitors who prefer reduced motion and in the theme editor. |
| `slide_interval` — Time per slide | `range` | `6` | 3–15s, step 1 |
| `slide_transition` — Transition | `select` | `fade` | `fade`: Crossfade; `zoom`: Fade with slow zoom; `slide`: Slide sideways |
| `slide_dots` — Show slide dots | `checkbox` | `true` |  |
| `height_mobile` — Height on phones | `select` | `inherit` | `inherit`: Use desktop choice; `compact`: Compact (55% of screen); `full`: Full screen; Content can grow taller. Split layouts apply this to the image panel. |
| `media_fit` — Media fit | `select` | `cover` | `cover`: Fill and crop; `contain`: Show entire image or video; Show entire media disables parallax to avoid cropping. Set image focal points in Shopify's image picker. |
| `tint_direction` — Tint distribution | `select` | `bottom` | `bottom`: Stronger at bottom; `top`: Stronger at top; `uniform`: Even tint |
| `layout` — Layout | `select` | `overlay` | `overlay`: Full-bleed, text over media; `editorial`: Editorial cover; `split`: Split, media beside text; Editorial puts the heading bottom left with the text and buttons in a ruled column on the right. Split shows the media next to a solid panel in the color scheme. |
| `media_position` — Media side (split layout) | `select` | `left` | `left`: Left; `right`: Right |
| `height` — Height | `select` | `full` | `adapt`: Adapt to image; `medium`: Medium; `full`: Full screen |
| `position` — Content position | `select` | `bottom-left` | `top-left`: Top left; `top-center`: Top center; `top-right`: Top right; `center-left`: Middle left; `center`: Center; `center-right`: Middle right; `bottom-left`: Bottom left; `bottom-center`: Bottom center; `bottom-right`: Bottom right; Used by the full-bleed and split layouts. Text aligns to the side you pick. |
| `position_mobile` — Content position on phones | `select` | `same` | `same`: Same as desktop; `top-left`: Top left; `top-center`: Top center; `center-left`: Middle left; `center`: Center; `bottom-left`: Bottom left; `bottom-center`: Bottom center |
| `text_align` — Text alignment | `select` | `auto` | `auto`: Follow the position; `left`: Left; `center`: Center; `right`: Right |
| `content_width` — Content width | `range` | `1100` | 360–1400px, step 20 |
| `block_gap` — Space between blocks | `range` | `22` | 8–56px, step 2 |
| `parallax` — Parallax depth | `range` | `14` | 0–30%, step 2 |
| `show_scroll_cue` — Show scroll cue | `checkbox` | `false` |  |
| `scrim_style` — Text backdrop | `select` | `solid` | `none`: None; `solid`: Tint; `blur`: Progressive blur |
| `scrim` — Tint strength | `range` | `30` | 0–80%, step 5 |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-2` |  |
| `type_style` — Type style | `select` | `signature` | `signature`: Signature: large display serif; `quiet`: Quiet: small and understated; `lowercase`: Nonchalant: relaxed lowercase; `caption`: Caption: tiny spaced capitals; `poster`: Poster: heavy capitals, outlined second line; `romantic`: Romantic: light italic serif; `typewriter`: Typewriter: monospace notes; `classic`: Classic caps: spaced serif capitals; `mixed`: Mixed: small sans over a big italic; Changes the fonts, size and case of the eyebrow, heading and text. The heading block's Size setting still scales it. |
| `custom_heading_font` — Use a custom heading font | `checkbox` | `false` |  |
| `heading_font` — Heading font | `font_picker` | `newsreader_n4` | Shown when `{{ section.settings.custom_heading_font }}` |
| `custom_text_font` — Use a custom text font | `checkbox` | `false` |  |
| `text_font` — Text font | `font_picker` | `inter_n4` | Shown when `{{ section.settings.custom_text_font }}` |
| `entrance` — Entrance | `select` | `fade-up` | `fade-up`: Fade up; `text`: Text reveal, line by line; `zoom`: Media zooms out; `curtain`: Media curtain, then text; `none`: None; Plays when the page loads. The heading keeps its own entrance unless this is None. Not shown to visitors who prefer reduced motion or when Motion is off. |

Supported block: **Slide** (`slide`); type limit 10.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `image` — Image | `image_picker` | Not specified | Also the video poster. |
| `video` — Video | `video` | Not specified |  |
| `video_url` — Video file URL | `url` | Not specified | Used when no video is picked. |
| `image_mobile` — Phone image | `image_picker` | Not specified | Optional. Uses the desktop media when empty. |
| `video_mobile` — Phone video | `video` | Not specified |  |
| `video_url_mobile` — Phone video file URL | `url` | Not specified |  |

Supported block: **Eyebrow** (`eyebrow`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `text` — Text | `text` | `New collection` |  |
| `shine` — Shine effect | `checkbox` | `false` |  |
| `size` — Size | `range` | `100` | 80–200%, step 10 |

Supported block: **Heading** (`heading`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `Campaign` |  |
| `heading_italic` — Second line (italic) | `text` | Not specified |  |
| `size` — Size | `range` | `100` | 50–160%, step 5 |
| `size_mobile` — Size on phones | `range` | `100` | 50–160%, step 5 |
| `italic_style` — Italic line style | `select` | `none` | `none`: Plain; `gradient`: Flowing gradient (Gradient Text) |
| `entrance` — Entrance | `select` | `cut` | `none`: None; `cut`: Editorial masked reveal; `rise`: Rise word by word (Split Text); `blur`: Blur in word by word (Text Effect); `fold`: Paper fold (Fold Text); `flip`: Flip up; `skew`: Skew in; `pop`: Pop; `fade`: Fade; Not shown to visitors who prefer reduced motion. |
| `hover` — Heading hover | `select` | `none` | `none`: None; `lift`: Letters lift near the pointer; `refold`: Letters fold near the pointer |
| `text_style` — Text effect | `select` | `none` | `none`: None; `shine`: Shine; `gradient`: Gradient |

Supported block: **Text** (`text`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `text` — Text | `richtext` | Not specified |  |
| `size` — Size | `range` | `100` | 80–160%, step 5 |
| `width` — Line length | `range` | `42` | 20–80ch, step 2 |

Supported block: **Buttons** (`buttons`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `label_1` — First button label | `text` | `Shop now` |  |
| `link_1` — First button link | `url` | Not specified |  |
| `style_1` — First button style | `select` | `solid` | `solid`: Solid; `outline`: Outline; `glass`: Frosted glass; `link`: Text link with arrow |
| `arrow` — Show arrow on first button | `checkbox` | `false` | Text links always show an arrow. |
| `label_2` — Second button label | `text` | Not specified |  |
| `link_2` — Second button link | `url` | Not specified |  |
| `style_2` — Second button style | `select` | `outline` | `solid`: Solid; `outline`: Outline; `glass`: Frosted glass; `link`: Text link with arrow |
| `corners` — Button corners | `select` | `inherit` | `inherit`: Use theme button corners; `square`: Square; `soft`: Rounded; `pill`: Pill; Boxed styles only; text links keep their underline. |
| `size` — Button size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large |
| `alignment` — Button alignment | `select` | `auto` | `auto`: Follow the text; `left`: Left; `center`: Center; `right`: Right |
| `arrangement` — Arrangement | `select` | `row` | `row`: Side by side; `stack`: Stacked |
| `full_width_mobile` — Full width on phones | `checkbox` | `false` |  |
| `gap` — Space between buttons | `range` | `14` | 0–40px, step 2 |
| `offset` — Extra space above | `range` | `0` | 0–64px, step 4 |

Add-menu presets:

- Campaign hero; initial blocks `[{"type":"eyebrow"},{"type":"heading"},{"type":"buttons"}]`.
- Centered hero — `{"position":"center","text_align":"center","content_width":800,"height":"medium"}`; initial blocks `[{"type":"heading"},{"type":"text"},{"type":"buttons"}]`.
- Minimal split hero — `{"layout":"split","color_scheme":"scheme-1","entrance":"none","parallax":0,"scroll_exit":false,"show_scroll_cue":false}`; initial blocks `[{"type":"heading","settings":{"size":70}},{"type":"text"},{"type":"buttons"}]`.
- Image-led hero — `{"position":"bottom-left","scrim":20,"content_width":640}`; initial blocks `[{"type":"eyebrow"},{"type":"buttons"}]`.
- Quiet hero — `{"type_style":"quiet","position":"bottom-left","scrim":20,"content_width":560}`; initial blocks `[{"type":"eyebrow"},{"type":"heading"},{"type":"text"},{"type":"buttons","settings":{"style_1":"link","label_2":""}}]`.
- Nonchalant hero — `{"type_style":"lowercase","position":"bottom-left","scrim":25}`; initial blocks `[{"type":"heading"},{"type":"text"},{"type":"buttons","settings":{"style_1":"link"}}]`.
- Slideshow hero — `{"position":"bottom-left","scrim":30}`; initial blocks `[{"type":"slide"},{"type":"slide"},{"type":"slide"},{"type":"eyebrow"},{"type":"heading"},{"type":"buttons"}]`.
- Poster hero — `{"type_style":"poster","position":"center","text_align":"center","scrim":40}`; initial blocks `[{"type":"eyebrow"},{"type":"heading"},{"type":"buttons"}]`.

#### Before / after (image-compare)

Source: `theme/sections/image-compare.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

Current section block cap: 4.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `See the difference` |  |
| `text` — Text | `richtext` | Not specified |  |
| `alignment` — Alignment | `select` | `left` | `left`: Left; `center`: Center |
| `columns` — Comparisons per row (desktop) | `select` | `1` | `1`: 1; `2`: 2 |
| `gap` — Gap | `range` | `24` | 0–64px, step 4 |
| `ratio` — Image ratio | `select` | `landscape` | `portrait`: Portrait (4:5); `tall`: Tall (2:3); `square`: Square; `landscape`: Landscape (3:2); `wide`: Wide (16:9) |
| `handle_style` — Handle | `select` | `circle` | `circle`: Circle with arrows; `bar`: Rounded bar; `line`: Line only |
| `handle_color` — Handle color | `select` | `light` | `light`: Light; `dark`: Dark; `accent`: Accent |
| `label_position` — Labels | `select` | `bottom` | `bottom`: Bottom corners; `top`: Top corners; `none`: Hidden |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Comparison** (`comparison`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `before` — Before image | `image_picker` | Not specified |  |
| `after` — After image | `image_picker` | Not specified |  |
| `before_label` — Before label | `text` | `Before` |  |
| `after_label` — After label | `text` | `After` |  |
| `start` — Starting position | `range` | `50` | 0–100%, step 5 |
| `caption` — Caption | `text` | Not specified |  |

Add-menu presets:

- Before / after; initial blocks `[{"type":"comparison"}]`.

#### Image strip (image-strip)

Source: `theme/sections/image-strip.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | Not specified |  |
| `collection` — Show products from collection | `collection` | Not specified | Uses each product's main image. Image blocks are added after these. |
| `limit` — Products to show | `range` | `12` | 4–20, step 1 |
| `height` — Image height | `range` | `140` | 40–300px, step 10 |
| `gap` — Gap | `range` | `24` | 0–64px, step 4 |
| `speed` — Speed | `range` | `40` | 10–120px, step 10 |
| `reverse` — Move left to right | `checkbox` | `false` |  |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `layout` — Display | `select` | `ticker` | `ticker`: Moving strip; `grid`: Static wrapped grid |
| `image_shape` — Image shape | `select` | `natural` | `natural`: Natural width; `square`: Square; `portrait`: Portrait; `landscape`: Landscape |
| `image_fit` — Image fit | `select` | `cover` | `cover`: Fill and crop; `contain`: Entire image |
| `height_mobile` — Phone image height | `select` | `inherit` | `inherit`: Same as desktop; `small`: 80px; `medium`: 120px; `large`: 180px |
| `static_mobile` — Static on phones | `checkbox` | `false` |  |
| `grayscale` — Monochrome images | `checkbox` | `false` |  |
| `show_labels` — Show image labels | `checkbox` | `false` |  |
| `fade_edges` — Fade ticker edges | `checkbox` | `true` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters; Sets the width of the image and text together. Background stays full width. All options keep the theme's responsive page gutters. |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px. Custom values are exact and are not multiplied by the global smaller-screen spacing setting.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Image** (`image`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `image` — Image | `image_picker` | Not specified |  |
| `label` — Accessible label | `text` | Not specified | Used when the image has no alt text, e.g. a press logo name. |
| `link` — Link | `url` | Not specified |  |

Add-menu presets:

- Image strip; initial blocks `[{"type":"image"},{"type":"image"},{"type":"image"},{"type":"image"}]`.
- Logo grid — `{"layout":"grid","height":80,"image_fit":"contain","grayscale":true}`; initial blocks `[{"type":"image"},{"type":"image"},{"type":"image"},{"type":"image"}]`.
- Portrait image strip — `{"image_shape":"portrait","height":300}`; initial blocks `[{"type":"image"},{"type":"image"},{"type":"image"},{"type":"image"}]`.

#### Image with text (image-with-text)

Source: `theme/sections/image-with-text.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `image` — Image | `image_picker` | Not specified |  |
| `image_ratio` — Image ratio | `select` | `portrait` | `adapt`: Adapt to image; `square`: Square (1:1); `portrait`: Portrait (4:5); `tall`: Tall (2:3); `landscape`: Landscape (3:2); `wide`: Wide (16:9) |
| `image_fit` — Image fit | `select` | `cover` | `cover`: Fill frame (crop); `contain`: Show whole image |
| `hover_zoom` — Zoom images on hover | `checkbox` | `true` |  |
| `image_width` — Image width (desktop) | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large |
| `layout` — Desktop layout | `select` | `image_first` | `image_first`: Image first; `text_first`: Text first |
| `mobile_order` — On phones | `select` | `image_first` | `image_first`: Image above text; `text_first`: Text above image |
| `vertical_alignment` — Content vertical position | `select` | `middle` | `top`: Top; `middle`: Middle; `bottom`: Bottom |
| `alignment` — Text alignment | `select` | `left` | `left`: Left; `center`: Center |
| `gap` — Gap between image and text | `range` | `48` | 0–120px, step 4 |
| `card_style` — Content panel | `select` | `plain` | `plain`: Plain; `surface`: Surface fill; `outline`: Outline; `shadow`: Soft shadow |
| `overlap` — Overlap the panel onto the image | `checkbox` | `false` | Desktop only. Needs a content panel other than Plain. |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Caption** (`caption`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `caption` — Caption | `text` | `New season` |  |
| `style` — Style | `select` | `spec` | `spec`: Small caps; `badge`: Badge; `plain`: Plain text |

Supported block: **Heading** (`heading`); type limit 2.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `Image with text` |  |
| `size` — Size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `italic` — Italic | `checkbox` | `false` |  |

Supported block: **Text** (`text`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `text` — Text | `richtext` | `<p>Pair large imagery with a short story about the collection, the fabric or the fit.</p>` |  |
| `size` — Text size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large |
| `color` — Text color | `select` | `default` | `default`: Default; `muted`: Muted |

Supported block: **Spacer** (`spacer`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `height` — Height | `range` | `16` | 0–80px, step 4 |

Supported block: **Button** (`button`); type limit 3.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `label` — Label | `text` | `Shop now` |  |
| `link` — Link | `url` | `/collections/all` |  |
| `style` — Style | `select` | `solid` | `solid`: Solid; `outline`: Outline; `pill`: Pill; `sweep`: Center sweep; `offset`: Offset shadow; `press`: 3D press; `link`: Text link |
| `new_tab` — Open link in a new tab | `checkbox` | `false` |  |

Add-menu presets:

- Image with text; initial blocks `[{"type":"caption"},{"type":"heading"},{"type":"text"},{"type":"button","settings":{"style":"outline"}}]`.
- Image with text panel — `{"card_style":"surface","overlap":true,"image_width":"large"}`; initial blocks `[{"type":"heading"},{"type":"text"},{"type":"button","settings":{"style":"link","label":"Read more"}}]`.

#### Logo wall (logo-wall)

Source: `theme/sections/logo-wall.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

Current section block cap: 24.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `As featured in` |  |
| `text` — Text | `richtext` | Not specified |  |
| `alignment` — Alignment | `select` | `center` | `left`: Left; `center`: Center |
| `layout` — Layout | `select` | `grid` | `grid`: Grid; `row`: Centered row |
| `appearance` — Grid style | `select` | `ruled` | `ruled`: Ruled lines; `cards`: Cards; `plain`: Plain |
| `columns` — Columns (desktop) | `range` | `4` | 2–8, step 1 |
| `columns_mobile` — Columns (phones) | `select` | `2` | `2`: 2 columns; `3`: 3 columns |
| `gap` — Gap (cards, plain and row) | `range` | `24` | 0–80px, step 4 |
| `logo_height` — Logo height | `range` | `40` | 20–120px, step 4 |
| `opacity` — Logo opacity | `range` | `80` | 30–100%, step 5; Logos return to full opacity on hover. |
| `grayscale` — Grayscale until hover | `checkbox` | `true` |  |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Logo** (`logo`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `image` — Logo | `image_picker` | Not specified |  |
| `name` — Name | `text` | `Partner` | Used as alt text, or shown when no logo is uploaded. |
| `link` — Link | `url` | Not specified |  |
| `new_tab` — Open link in a new tab | `checkbox` | `true` |  |

Add-menu presets:

- Logo wall; initial blocks `[{"type":"logo","settings":{"name":"Vogue"}},{"type":"logo","settings":{"name":"Kinfolk"}},{"type":"logo","settings":{"name":"Monocle"}},{"type":"logo","settings":{"name":"Cereal"}}]`.

#### Lookbook hotspots (lookbook)

Source: `theme/sections/lookbook.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

Current section block cap: 10.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `Shop the look` |  |
| `text` — Text | `richtext` | Not specified |  |
| `image` — Image | `image_picker` | Not specified |  |
| `image_ratio` — Image ratio | `select` | `adapt` | `adapt`: Adapt to image; `square`: Square (1:1); `portrait`: Portrait (4:5); `tall`: Tall (2:3); `landscape`: Landscape (3:2); `wide`: Wide (16:9); Fixed ratios crop the image; hotspot positions are relative to the visible frame. |
| `marker` — Marker | `select` | `plus` | `plus`: Plus; `dot`: Dot |
| `show_numbers` — Number the markers | `checkbox` | `false` |  |
| `marker_color` — Marker color | `select` | `light` | `light`: Light; `dark`: Dark; `accent`: Accent |
| `marker_size` — Marker size | `range` | `26` | 16–44px, step 2 |
| `pulse` — Pulse markers | `checkbox` | `true` |  |
| `list_position` — Product list | `select` | `below` | `below`: Below the image; `side`: Beside the image (desktop); `none`: Hidden |
| `list_thumbs` — Show product thumbnails in the list | `checkbox` | `true` |  |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Hotspot** (`hotspot`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `product` — Product | `product` | Not specified |  |
| `x` — Horizontal position | `range` | `50` | 0–100%, step 1 |
| `y` — Vertical position | `range` | `50` | 0–100%, step 1 |
| `label` — Label | `text` | `Product` |  |
| `image` — Thumbnail | `image_picker` | Not specified |  |
| `link` — Link | `url` | Not specified |  |
| `link_label` — Link label | `text` | Not specified | Defaults to "View product". |

Add-menu presets:

- Lookbook hotspots; initial blocks `[{"type":"hotspot","settings":{"x":35,"y":30}},{"type":"hotspot","settings":{"x":62,"y":66}}]`.

#### Cart (main-cart)

Source: `theme/sections/main-cart.liquid`. Editor: select this section in its template or section group.

Available contexts: `{"templates":["cart"]}`.

Section instance limit: 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `density` — Cart line spacing | `select` | `regular` | `regular`: Regular; `compact`: Compact; `airy`: Airy |
| `show_images` — Show product images | `checkbox` | `true` |  |
| `note` — Order note | `select` | `inherit` | `inherit`: Use theme setting; `show`: Show; `hide`: Hide |
| `summary_style` — Summary appearance | `select` | `bordered` | `bordered`: Bordered; `plain`: Plain; `surface`: Surface |
| `sticky_summary` — Sticky summary (desktop) | `checkbox` | `true` |  |
| `show_accelerated` — Show accelerated checkout buttons | `checkbox` | `true` |  |
| `show_empty_recommendations` — Show collection when cart is empty | `checkbox` | `false` |  |
| `recommendation_collection` — Empty cart collection | `collection` | Not specified |  |
| `recommendation_heading` — Empty cart collection heading | `text` | `Explore the collection` |  |

No add-menu preset: rendered by an existing template/layout/group or used as a rendering endpoint.

#### Product grid (main-collection)

Source: `theme/sections/main-collection.liquid`. Editor: select this section in its template or section group.

Available contexts: `{"templates":["collection"]}`.

Section instance limit: 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `show_header` — Show title and description | `checkbox` | `true` | Turn off when a Collection banner section is above. |
| `title_animation` — Title animation | `select` | `rise` | `none`: None; `rise`: Rise from a mask; `blur`: Blur in; `fold`: Fold up; `skew`: Skewed rise; `fade`: Fade up; Plays once when the page opens. Follows Theme settings > Motion and reduced-motion preferences. |
| `title_split` — Animate title by | `select` | `words` | `words`: Word; `chars`: Letter; `lines`: Line |
| `pagination_style` — Pagination | `select` | `infinite` | `infinite`: Infinite scroll; `button`: Load more button; `numbers`: Page numbers |
| `infinite_auto_pages` — Infinite scroll: pages before a button | `range` | `3` | 1–10, step 1; After this many pages load automatically, a Load more button appears so the footer stays reachable. |
| `products_per_page` — Products per page | `range` | `24` | 8–48, step 4 |
| `columns_mobile` — Columns on phones | `select` | `1` | `1`: 1; `2`: 2 |
| `columns_desktop` — Columns on desktop | `range` | `3` | 2–5, step 1 |
| `pills_menu` — Category links menu | `link_list` | Not specified | Optional row of links to related collections. |
| `show_description` — Show collection description | `checkbox` | `true` |  |
| `show_filters` — Show filters | `checkbox` | `true` | Filters come from Shopify's Search & Discovery app. |
| `show_sort` — Show sort | `checkbox` | `true` |  |
| `card_appearance` — Card appearance | `select` | `inherit` | `inherit`: Use theme default; `minimal`: Minimal; `editorial`: Editorial; `bordered`: Bordered; `image-led`: Image focused |
| `card_ratio` — Image ratio | `select` | `inherit` | `inherit`: Use theme default; `square`: Square; `portrait`: Portrait (4:5); `tall`: Tall (2:3); `landscape`: Landscape (4:3) |
| `card_fit` — Image fit | `select` | `inherit` | `inherit`: Use theme default; `cover`: Fill; `contain`: Contain |
| `card_hover` — Alternate media | `select` | `inherit` | `inherit`: Use theme default; `auto`: Video with image fallback; `image`: Second image only; `off`: Off |
| `card_vendor` — Show vendor | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `card_price` — Show price | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `card_badges` — Show badges | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `card_sizes` — Show sizes | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `show_layout_switch` — Allow shoppers to change grid columns | `checkbox` | `true` | Off uses merchant columns and ignores previous shopper grid preferences. |
| `toolbar_width` — Filter toolbar width | `select` | `full` | `full`: Full bleed; `contained`: Within content |
| `toolbar_sticky` — Sticky filter toolbar | `checkbox` | `true` |  |
| `grid_gap` — Product column gap | `range` | `8` | 0–40px, step 2 |

No add-menu preset: rendered by an existing template/layout/group or used as a rendering endpoint.

#### Product information (main-product)

Source: `theme/sections/main-product.liquid`. Editor: select this section in its template or section group.

Available contexts: `{"templates":["product"]}`.

Section instance limit: 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `show_breadcrumb` — Show breadcrumbs | `checkbox` | `false` |  |
| `gallery_layout` — Desktop gallery | `select` | `slider` | `collage`: Editorial collage; `slider`: Single image slider; `stack`: Stacked images; `grid`: Two-column grid; Single image slider: one large photo with a thumbnail rail, subtle arrows and click-to-enlarge. Editorial collage: all photos in a magazine-style rhythm beside sticky product details. |
| `gallery_ratio` — Media shape | `select` | `square` | `square`: Square; `portrait`: Portrait; `landscape`: Landscape |
| `gallery_fit` — Media fit | `select` | `contain` | `contain`: Entire media; `cover`: Fill and crop |
| `gallery_background` — Media background | `select` | `white` | `white`: White studio; `scheme`: Scheme surface |
| `proportions` — Desktop columns | `select` | `media` | `media`: Larger gallery; `balanced`: Balanced; `content`: Larger information column |
| `media_right` — Gallery on the right (desktop) | `checkbox` | `false` |  |
| `text_first_mobile` — Information first on smaller screens | `checkbox` | `false` |  |
| `sticky_info` — Sticky product information | `checkbox` | `true` |  |
| `sticky_buy` — Sticky Add to cart bar | `select` | `off` | `off`: Off; `mobile`: Phones and tablets; `always`: All screen sizes; Appears after the main Add to cart button scrolls out of view. |
| `show_thumbnails` — Show media thumbnails | `checkbox` | `true` |  |
| `show_gallery_controls` — Show media arrows and counter | `checkbox` | `true` |  |
| `show_media_progress` — Show media progress bar | `checkbox` | `true` | A thin bar that follows your position through the product photos: under the slider, or beside stacked photos on desktop. |
| `enable_zoom` — Enable image zoom | `checkbox` | `true` |  |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px. Custom values are exact and are not multiplied by the global smaller-screen spacing setting.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `info_gap` — Space between information blocks | `range` | `20` | 12–32px, step 2 |

Supported block: **@app** (`@app`).

Supported block: **Eyebrow** (`eyebrow`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `text` — Text | `text` | Not specified | Leave empty to show the product type, or its first collection. |

Supported block: **Title** (`title`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `animate` — Animate title | `checkbox` | `true` |  |
| `scale` — Title size | `range` | `100` | 70–130%, step 5 |

Supported block: **Price** (`price`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `show_sku` — Show SKU when available | `checkbox` | `true` |  |
| `show_promotion` — Show promotion code | `checkbox` | `true` | Shows the discount code connected to this product in Theme settings > Promotions. |

Supported block: **Variant picker** (`variant_picker`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `size_guide_option` — Show size guide next to option | `text` | `Size` |  |
| `show_size_guide` — Show full size guide | `checkbox` | `true` |  |
| `show_fit_finder` — Show size finder | `checkbox` | `true` | Estimates a letter size from height, weight, shape and fit preference. Answers stay on the shopper's device. |
| `show_measurements` — Show inline measurements | `checkbox` | `true` |  |
| `measure_preview` — Preview measurements on hover or focus | `checkbox` | `true` |  |
| `show_unit_switch` — Allow inch and centimetre switching | `checkbox` | `true` |  |
| `highlight_selected` — Highlight selected size in guide | `checkbox` | `true` |  |
| `size_guide_page` — Size guide page (fallback) | `page` | Not specified | Used only when no assigned chart or template table is available. |
| `size_heading` — Size guide heading | `text` | `Measured flat, garment in hand` |  |
| `size_table` — Size table | `textarea` | Not specified | Optional merchant-verified chart shared by products using this template. Leave empty unless it applies to every such product. Prefer product metafields. First line: headings; subsequent lines: comma-separated measurements. |
| `size_unit` — Table is written in | `select` | `in` | `in`: Inches; `cm`: Centimetres |
| `size_note` — Note under the table | `text` | Not specified |  |

Supported block: **Inventory status** (`inventory`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `show_on_sizes` — Mark low-stock sizes on size buttons | `checkbox` | `true` | Uses Theme settings > Product page > "Show only a few left" threshold. |

Supported block: **Model info** (`model_info`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `show` — Show model info | `checkbox` | `true` |  |
| `use_metafields` — Use product metafields | `checkbox` | `true` |  |
| `sentence` — Sentence | `text` | `Model is [height] and wears size [size]` | Used with the height and size metafields. [height] and [size] are replaced. |
| `fallback` — Fallback text | `text` | Not specified | Shown on products without model metafields. Leave blank to show nothing. |
| `show_icon` — Show icon | `checkbox` | `true` |  |

Supported block: **Buy buttons** (`buy_buttons`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `show_quantity` — Show quantity | `checkbox` | `false` |  |

Supported block: **Text** (`text`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `text` — Text | `richtext` | Not specified |  |
| `style` — Style | `select` | `` | ``: Body; `spec`: Label |

Supported block: **Description** (`description`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | Not specified |  |
| `show_care` — Show care metafield when available | `checkbox` | `true` |  |
| `care_heading` — Care heading | `text` | `Fabric & Care` |  |
| `open` — Open by default | `checkbox` | `true` |  |
| `presentation` — Description presentation | `select` | `accordion` | `accordion`: Collapsible row; `inline`: Always visible |

Supported block: **Collapsible row** (`accordion`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `policy_source` — Content source | `select` | `custom` | `custom`: Custom content or page; `shipping_exchange`: Shopify shipping and refund policies; Policies stay synchronized with Settings > Policies in Shopify Admin. |
| `heading` — Heading | `text` | `Fabric & care` |  |
| `open` — Open by default | `checkbox` | `false` |  |
| `content` — Content | `richtext` | Not specified |  |
| `page` — Content from page | `page` | Not specified |  |

Supported block: **Custom Liquid** (`custom_liquid`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `custom_liquid` — Custom Liquid | `liquid` | Not specified |  |

Supported block: **Product feature** (`feature`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `image` — Decorative icon or image | `image_picker` | Not specified |  |
| `heading` — Heading | `text` | `Product feature` |  |
| `text` — Text | `richtext` | Not specified |  |
| `appearance` — Appearance | `select` | `plain` | `plain`: Plain; `bordered`: Bordered; `surface`: Surface |
| `link` — Link | `url` | Not specified |  |
| `link_label` — Link label | `text` | Not specified |  |

No add-menu preset: rendered by an existing template/layout/group or used as a rendering endpoint.

#### Media with text (media-text)

Source: `theme/sections/media-text.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `image` — Image | `image_picker` | Not specified |  |
| `collection` — Use collection image | `collection` | Not specified | Shown when no image is set. |
| `layout` — Layout | `select` | `split` | `split`: Side by side; `overlay`: Text over image; `stacked`: Stacked story; `asymmetric`: Wide image split |
| `media_right` — Image on the right (desktop) | `checkbox` | `false` |  |
| `text_first_mobile` — Text first on phones | `checkbox` | `false` |  |
| `blur_scrim` — Progressive blur behind text (overlay layout) | `checkbox` | `true` |  |
| `index` — Index label | `text` | Not specified | Optional, e.g. 01 / Fit |
| `heading` — Heading | `text` | `Tell the` |  |
| `heading_italic` — Heading (italic part) | `text` | `story` |  |
| `text` — Text | `richtext` | Not specified |  |
| `link_label` — Link label | `text` | Not specified |  |
| `link` — Link | `url` | Not specified |  |
| `heading_entrance` — Heading entrance | `select` | `flip` | `none`: None; `rise`: Rise letter by letter (Split Text); `blur`: Blur in word by word (Text Effect); `fold`: Paper fold (Fold Text); `flip`: Flip up; `skew`: Skew in; `pop`: Pop; `fade`: Fade |
| `entrance` — Text column entrance | `select` | `none` | `none`: None; `fade`: Fade up; `wipe`: Wipe |
| `text_style` — Heading effect | `select` | `none` | `none`: None; `shine`: Shine; `gradient`: Gradient |
| `scene_preset` — Section animation | `select` | `cinematic` | `off`: Off; `none`: Use heading and column settings; `subtle`: Subtle entrance; `cinematic`: Cinematic scroll reveal; A section animation replaces separate heading and column entrances to keep movement coordinated. |
| `scene_direction` — Reveal direction | `select` | `up` | `up`: Up; `left`: From right; `none`: Fade only |
| `scene_intensity` — Motion intensity | `select` | `soft` | `soft`: Soft; `full`: Expressive |
| `scene_parallax` — Gentle image drift | `checkbox` | `true` | Cinematic preset only. Simplified phones use a quick entrance. |
| `scene_pin` — Brief desktop hold | `checkbox` | `false` | Cinematic only, on wide screens when the entire section fits below the header. Adds at most 240px of scrolling. |
| `scene_background` — Fade subtle accent wash | `checkbox` | `true` | Cinematic only. Uses this section's color scheme. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters; Sets the width of the image and text together. Background stays full width. All options keep the theme's responsive page gutters. |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px. Custom values are exact and are not multiplied by the global smaller-screen spacing setting.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `video` — Video | `video` | Not specified | Replaces images; muted background video with playback controls. |
| `video_autoplay` — Autoplay video | `checkbox` | `true` |  |
| `image_mobile` — Phone image | `image_picker` | Not specified |  |
| `text_align` — Text alignment | `select` | `left` | `left`: Left; `center`: Center |
| `copy_width` — Body text width | `range` | `46` | 28–72ch, step 2 |
| `media_ratio` — Image shape | `select` | `inherit` | `inherit`: Use layout default; `portrait`: Portrait; `square`: Square; `wide`: Landscape |
| `media_fit` — Media fit | `select` | `cover` | `cover`: Fill and crop; `contain`: Entire media |
| `link_style` — Call to action | `select` | `text` | `text`: Text link; `solid`: Filled button; `outline`: Outline button |
| `overlay_colors` — Overlay text colors | `select` | `light` | `light`: Light; `scheme`: Section scheme |

Add-menu presets:

- Media with text.
- Stacked story — `{"layout":"stacked","text_align":"center","scene_preset":"subtle","media_ratio":"wide"}`.
- Asymmetric story — `{"layout":"asymmetric","scene_preset":"subtle"}`.

#### Message band (message-band)

Source: `theme/sections/message-band.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `rows` — Rows | `select` | `2` | `1`: One; `2`: Two (opposite directions, desktop) |
| `size` — Text size | `range` | `80` | 32–140px, step 4 |
| `speed` — Speed | `range` | `50` | 20–160px, step 10; Pixels per second. |
| `scroll_react` — Speed up while scrolling | `checkbox` | `true` |  |
| `outline_second` — Outline text on second row | `checkbox` | `true` |  |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-2` |  |
| `direction` — Ticker direction | `select` | `left` | `left`: Right to left; `right`: Left to right |
| `layout` — Display | `select` | `ticker` | `ticker`: Moving ticker; `static`: Static wrapped text |
| `mobile_scale` — Phone text size | `select` | `55` | `55`: Compact; `75`: Medium; `100`: Same as desktop |
| `static_mobile` — Static on phones | `checkbox` | `true` |  |

Supported block: **Message** (`message`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `text` — Text | `text` | `New drop` |  |
| `link` — Link | `url` | Not specified |  |

Add-menu presets:

- Message band; initial blocks `[{"type":"message"},{"type":"message"},{"type":"message"}]`.
- Static text band — `{"layout":"static","rows":"1"}`; initial blocks `[{"type":"message"}]`.

#### Multicolumn (multicolumn)

Source: `theme/sections/multicolumn.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

Current section block cap: 12.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `Why shop with us` |  |
| `text` — Text | `richtext` | Not specified |  |
| `alignment` — Alignment | `select` | `left` | `left`: Left; `center`: Center |
| `columns` — Columns (desktop) | `range` | `3` | 1–6, step 1 |
| `columns_mobile` — Columns (phones) | `select` | `1` | `1`: 1 column; `2`: 2 columns |
| `gap` — Gap between columns | `range` | `32` | 0–80px, step 4 |
| `card_style` — Column style | `select` | `plain` | `plain`: Plain; `surface`: Surface fill; `outline`: Outline; `shadow`: Soft shadow |
| `title_size` — Column heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large |
| `image_ratio` — Image ratio | `select` | `adapt` | `adapt`: Adapt to image; `square`: Square (1:1); `portrait`: Portrait (4:5); `tall`: Tall (2:3); `landscape`: Landscape (3:2); `wide`: Wide (16:9); `circle`: Circle |
| `image_width` — Image width | `select` | `full` | `full`: Full column width; `half`: Half column width; `icon`: Icon size |
| `hover_zoom` — Zoom images on hover | `checkbox` | `true` |  |
| `button_label` — Button label | `text` | Not specified |  |
| `button_link` — Button link | `url` | `/collections/all` |  |
| `button_style` — Button style | `select` | `outline` | `solid`: Solid; `outline`: Outline; `pill`: Pill; `sweep`: Center sweep; `offset`: Offset shadow; `press`: 3D press; `link`: Text link |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Column** (`column`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `image` — Image | `image_picker` | Not specified |  |
| `icon` — Icon (used when no image) | `select` | `none` | `none`: None; `truck`: Delivery; `arrow-path`: Returns; `scissors`: Tailoring; `sparkles`: Quality; `heart`: Care; `globe-alt`: Worldwide; `lock-closed`: Secure; `shield-check`: Guarantee; `gift`: Gift; `bolt`: Fast; `adjustments-vertical`: Fit; `check`: Check |
| `title` — Heading | `text` | `Column` |  |
| `text` — Text | `richtext` | `<p>Pair text with an image to focus on a product, collection or service.</p>` |  |
| `link_label` — Link label | `text` | Not specified |  |
| `link` — Link | `url` | Not specified |  |

Add-menu presets:

- Multicolumn; initial blocks `[{"type":"column","settings":{"title":"Free returns","icon":"arrow-path"}},{"type":"column","settings":{"title":"Made to last","icon":"sparkles"}},{"type":"column","settings":{"title":"Fit support","icon":"scissors"}}]`.

#### Newsletter banner (newsletter-banner)

Source: `theme/sections/newsletter-banner.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `image` — Background image | `image_picker` | Not specified |  |
| `image_mobile` — Mobile image | `image_picker` | Not specified |  |
| `overlay_opacity` — Overlay strength | `range` | `35` | 0–90%, step 5 |
| `text_tone` — Text color over image | `select` | `light` | `light`: Light; `dark`: Dark |
| `height` — Height | `select` | `medium` | `small`: Adapt to content; `medium`: Medium; `large`: Large |
| `content_position` — Content position | `select` | `center` | `left`: Left; `center`: Center; `right`: Right |
| `alignment` — Text alignment | `select` | `center` | `left`: Left; `center`: Center |
| `content_box` — Content background | `select` | `none` | `none`: None; `panel`: Solid panel; `blur`: Frosted glass |
| `form_style` — Field style | `select` | `underline` | `underline`: Underline; `boxed`: Boxed; `pill`: Pill |
| `form_button` — Submit button | `select` | `text` | `text`: Text with arrow; `solid`: Solid button |
| `form_width` — Form max width | `range` | `480` | 280–720px, step 20 |
| `show_privacy` — Show privacy policy link | `checkbox` | `true` |  |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Caption** (`caption`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `caption` — Caption | `text` | `Newsletter` |  |
| `style` — Style | `select` | `spec` | `spec`: Small caps; `badge`: Badge; `plain`: Plain text |

Supported block: **Heading** (`heading`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `Join the list` |  |
| `size` — Size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |

Supported block: **Text** (`paragraph`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `text` — Text | `richtext` | `<p>Early access to new collections and members-only offers.</p>` |  |

Supported block: **Email form** (`email_form`); type limit 1.

No local settings.

Add-menu presets:

- Newsletter banner; initial blocks `[{"type":"heading"},{"type":"paragraph"},{"type":"email_form"}]`.

#### Newsletter split (newsletter-split)

Source: `theme/sections/newsletter-split.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

Current section block cap: 6.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `Sign up for our newsletter` |  |
| `heading_display` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `text` — Text | `richtext` | `<p>One email a month: new arrivals, restocks and care tips.</p>` |  |
| `alignment` — Alignment | `select` | `left` | `left`: Left; `center`: Center |
| `layout` — Desktop layout | `select` | `split` | `split`: Side by side; `stacked`: Stacked |
| `card_style` — Background panel | `select` | `surface` | `plain`: Plain; `surface`: Surface fill; `outline`: Outline; `shadow`: Soft shadow |
| `image` — Image | `image_picker` | Not specified | Optional third column on desktop. |
| `image_position` — Image position | `select` | `left` | `left`: Left; `right`: Right |
| `image_ratio` — Image ratio | `select` | `portrait` | `adapt`: Adapt to image; `square`: Square (1:1); `portrait`: Portrait (4:5); `tall`: Tall (2:3); `landscape`: Landscape (3:2); `wide`: Wide (16:9) |
| `form_style` — Field style | `select` | `underline` | `underline`: Underline; `boxed`: Boxed; `pill`: Pill |
| `form_button` — Submit button | `select` | `text` | `text`: Text with arrow; `solid`: Solid button |
| `form_width` — Form max width | `range` | `480` | 280–720px, step 20 |
| `show_privacy` — Show privacy policy link | `checkbox` | `true` |  |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Benefit** (`benefit`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `text` — Text | `text` | `Early access to drops` |  |
| `icon` — Icon | `select` | `check` | `check`: Check; `gift`: Gift; `sparkles`: New; `truck`: Delivery; `heart`: Heart; `bolt`: Flash |

Add-menu presets:

- Newsletter split; initial blocks `[{"type":"benefit"},{"type":"benefit","settings":{"text":"10% off your first order","icon":"gift"}}]`.

#### Page (page)

Source: `theme/sections/page.liquid`. Editor: select this section in its template or section group.

Available contexts: `{"templates":["page"]}`.

Section instance limit: 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `width` — Content width | `select` | `inherit` | `inherit`: Theme page width; `narrow`: Narrow reading width; `regular`: Regular reading width |
| `show_title` — Show page title | `checkbox` | `true` |  |

No add-menu preset: rendered by an existing template/layout/group or used as a rendering endpoint.

#### Password (password)

Source: `theme/sections/password.liquid`. Editor: select this section in its template or section group.

Available contexts: `{"templates":["password"]}`.

Section instance limit: 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `width` — Content width | `select` | `inherit` | `inherit`: Theme page width; `narrow`: Narrow reading width; `regular`: Regular reading width |
| `heading` — Heading override | `text` | Not specified |  |
| `show_logo` — Show logo | `checkbox` | `false` |  |
| `show_newsletter` — Show newsletter signup | `checkbox` | `false` |  |
| `newsletter_heading` — Newsletter heading | `text` | `Stay in touch` |  |

No add-menu preset: rendered by an existing template/layout/group or used as a rendering endpoint.

#### Predictive search (predictive-search)

Source: `theme/sections/predictive-search.liquid`. Editor: select this section in its template or section group.

No local settings.

No add-menu preset: rendered by an existing template/layout/group or used as a rendering endpoint.

#### Pricing cards (pricing-cards)

Source: `theme/sections/pricing-cards.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

Current section block cap: 4.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `Alteration services` |  |
| `text` — Text | `richtext` | Not specified |  |
| `alignment` — Alignment | `select` | `left` | `left`: Left; `center`: Center |
| `columns` — Columns (desktop) | `range` | `3` | 1–4, step 1 |
| `gap` — Gap between cards | `range` | `16` | 0–48px, step 4 |
| `card_style` — Card style | `select` | `outline` | `plain`: Plain; `surface`: Surface fill; `outline`: Outline; `shadow`: Soft shadow |
| `featured_style` — Highlighted plan | `select` | `ring` | `ring`: Bold outline; `inverted`: Inverted colors; `accent`: Accent outline |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Plan** (`plan`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `name` — Name | `text` | `Essential` |  |
| `price` — Price | `text` | `$25` | Shown as written. Use for services; product prices come from the product itself. |
| `compare_price` — Was price | `text` | Not specified | Optional. Shown struck through. |
| `period` — Price note | `text` | `per garment` |  |
| `description` — Description | `richtext` | Not specified |  |
| `features` — Features | `textarea` | `Hemming<br>Sleeve shortening` | One feature per line. |
| `featured` — Highlight this plan | `checkbox` | `false` |  |
| `badge` — Highlight badge | `text` | `Most popular` |  |
| `button_label` — Button label | `text` | `Book now` |  |
| `button_link` — Button link | `url` | `/collections/all` |  |
| `button_style` — Button style | `select` | `auto` | `auto`: Automatic; `solid`: Solid; `outline`: Outline; `pill`: Pill; `sweep`: Center sweep; `offset`: Offset shadow; `press`: 3D press; `link`: Text link |
| `footnote` — Small print | `text` | Not specified |  |

Add-menu presets:

- Pricing cards; initial blocks `[{"type":"plan"},{"type":"plan","settings":{"name":"Tailored","price":"$60","featured":true,"features":"Everything in Essential\nTaking in and letting out\nFree pickup"}},{"type":"plan","settings":{"name":"Bespoke","price":"$180","features":"Full refit\nPersonal fitting\nPriority turnaround"}}]`.

#### Process steps (process-steps)

Source: `theme/sections/process-steps.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

Current section block cap: 8.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `How it works` |  |
| `text` — Text | `richtext` | Not specified |  |
| `alignment` — Alignment | `select` | `left` | `left`: Left; `center`: Center |
| `layout` — Desktop layout | `select` | `horizontal` | `horizontal`: Horizontal; `vertical`: Vertical |
| `gap` — Gap between steps | `range` | `28` | 0–80px, step 4 |
| `card_style` — Step text style | `select` | `plain` | `plain`: Plain; `surface`: Surface fill; `outline`: Outline; `shadow`: Soft shadow |
| `connector` — Connecting line | `checkbox` | `true` |  |
| `marker_content` — Marker shows | `select` | `number` | `number`: Step number; `icon`: Step icon |
| `marker_style` — Marker style | `select` | `filled` | `filled`: Filled; `outline`: Outline; `accent`: Accent fill; `square`: Square |
| `button_label` — Button label | `text` | Not specified |  |
| `button_link` — Button link | `url` | `/collections/all` |  |
| `button_style` — Button style | `select` | `solid` | `solid`: Solid; `outline`: Outline; `pill`: Pill; `sweep`: Center sweep; `offset`: Offset shadow; `press`: 3D press; `link`: Text link |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Step** (`step`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `title` — Title | `text` | `Step` |  |
| `text` — Text | `richtext` | `<p>Explain what happens in this step.</p>` |  |
| `icon` — Icon | `select` | `none` | `none`: None; `truck`: Delivery; `arrow-path`: Returns; `scissors`: Tailoring; `sparkles`: Quality; `heart`: Care; `globe-alt`: Worldwide; `lock-closed`: Secure; `shield-check`: Guarantee; `gift`: Gift; `bolt`: Fast; `adjustments-vertical`: Fit; `check`: Check; Shown when the marker is set to Step icon. |

Add-menu presets:

- Process steps; initial blocks `[{"type":"step","settings":{"title":"Find your size","icon":"adjustments-vertical"}},{"type":"step","settings":{"title":"Try it at home","icon":"truck"}},{"type":"step","settings":{"title":"Free exchanges","icon":"arrow-path"}}]`.

#### Product recommendations (product-recommendations)

Source: `theme/sections/product-recommendations.liquid`. Editor: select this section in its template or section group.

Available contexts: `{"templates":["product"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `You might` |  |
| `heading_italic` — Heading (italic part) | `text` | `also like` |  |
| `fallback_collection` — Fallback collection | `collection` | Not specified | Shown when Shopify has no recommendations, or if recommendations cannot load. |
| `intent` — Show | `select` | `related` | `related`: Related products; `complementary`: Complementary products |
| `limit` — Products to show | `range` | `4` | 2–10, step 1 |
| `columns_desktop` — Columns on desktop | `range` | `4` | 2–5, step 1 |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `card_appearance` — Card appearance | `select` | `inherit` | `inherit`: Use theme default; `minimal`: Minimal; `editorial`: Editorial; `bordered`: Bordered; `image-led`: Image focused |
| `card_ratio` — Image ratio | `select` | `inherit` | `inherit`: Use theme default; `square`: Square; `portrait`: Portrait (4:5); `tall`: Tall (2:3); `landscape`: Landscape (4:3) |
| `card_fit` — Image fit | `select` | `inherit` | `inherit`: Use theme default; `cover`: Fill; `contain`: Contain |
| `card_hover` — Alternate media | `select` | `inherit` | `inherit`: Use theme default; `auto`: Video with image fallback; `image`: Second image only; `off`: Off |
| `card_vendor` — Show vendor | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `card_price` — Show price | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `card_badges` — Show badges | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `card_sizes` — Show sizes | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `columns_mobile` — Columns on phones | `select` | `1` | `1`: 1; `2`: 2 |
| `grid_gap` — Column gap (desktop) | `range` | `8` | 0–48px, step 2 |
| `heading_alignment` — Heading alignment | `select` | `left` | `left`: Left; `center`: Center |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters; Sets the width of the image and text together. Background stays full width. All options keep the theme's responsive page gutters. |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px. Custom values are exact and are not multiplied by the global smaller-screen spacing setting.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `hide_empty` — Hide section when empty | `checkbox` | `true` |  |
| `empty_text` — Empty message | `text` | `More recommendations will be available soon.` |  |
| `link` — Optional button destination | `url` | Not specified |  |
| `link_label` — Optional button label | `text` | Not specified |  |

Add-menu presets:

- Product recommendations.
- Complementary products — `{"intent":"complementary","heading":"Complete the","heading_italic":"look"}`.

#### Promo banner (promo-banner)

Source: `theme/sections/promo-banner.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["footer"]}`.

Current section block cap: 3.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `dismissible` — Visitors can dismiss | `checkbox` | `true` | Stays hidden for the rest of the browser session. Editing the message shows it again. |
| `size` — Height | `select` | `small` | `small`: Slim; `large`: Tall |
| `alignment` — Alignment | `select` | `center` | `left`: Left; `center`: Center |
| `text_size` — Text size | `range` | `14` | 12–20px, step 1 |
| `text_case` — Letter case | `select` | `normal` | `normal`: As typed; `upper`: Uppercase |
| `separator` — Between messages | `select` | `dot` | `none`: Space; `dot`: Dot; `line`: Line |
| `link_style` — Link style | `select` | `underline` | `underline`: Underlined; `pill`: Pill outline |
| `border` — Bottom border | `select` | `none` | `none`: None; `bottom`: Hairline |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |

Supported block: **Message** (`message`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `icon` — Icon | `select` | `none` | `none`: None; `truck`: Delivery; `gift`: Gift; `sparkles`: New; `arrow-path`: Returns; `heart`: Heart; `bolt`: Flash; `globe-alt`: Worldwide |
| `text` — Text | `inline_richtext` | `Free delivery on orders over $150` |  |
| `link_label` — Link label | `text` | `Shop now` |  |
| `link` — Link | `url` | Not specified |  |

Add-menu presets:

- Promo banner; initial blocks `[{"type":"message","settings":{"icon":"truck"}}]`.

#### Reviews wall (reviews-wall)

Source: `theme/sections/reviews-wall.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `What customers say` |  |
| `layout` — Layout | `select` | `wall` | `wall`: Moving wall; `grid`: Static grid; Phones, reduced motion and the editor show all reviews statically. Moving columns travel together so one pause button controls the wall. |
| `columns` — Columns (desktop) | `select` | `2` | `1`: 1; `2`: 2; `3`: 3 |
| `alignment` — Text alignment | `select` | `left` | `left`: Left; `center`: Center |
| `card_style` — Review cards | `select` | `bordered` | `bordered`: Bordered; `flat`: Minimal |
| `height` — Moving wall height | `range` | `520` | 320–800px, step 20; Shown when `{{ section.settings.layout == 'wall' }}` |
| `speed` — Speed | `range` | `25` | 10–80px, step 5; Shown when `{{ section.settings.layout == 'wall' }}` |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |

Supported block: **Review** (`quote`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `quote` — Review text | `richtext` | Not specified |  |
| `name` — Name | `text` | Not specified |  |
| `product` — Product reviewed | `product` | Not specified |  |

Add-menu presets:

- Reviews wall.
- Reviews grid — `{"layout":"grid","card_style":"flat","alignment":"center"}`.

#### Rich text (rich-text)

Source: `theme/sections/rich-text.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `position` — Content position (desktop) | `select` | `center` | `left`: Left; `center`: Center; `right`: Right |
| `alignment` — Text alignment | `select` | `center` | `left`: Left; `center`: Center |
| `max_width` — Content max width | `range` | `720` | 400–1200px, step 40 |
| `card_style` — Background panel | `select` | `plain` | `plain`: Plain; `surface`: Surface fill; `outline`: Outline; `shadow`: Soft shadow |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Caption** (`caption`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `caption` — Caption | `text` | `New season` |  |
| `style` — Style | `select` | `spec` | `spec`: Small caps; `badge`: Badge; `plain`: Plain text |

Supported block: **Heading** (`heading`); type limit 2.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `Talk about your brand` |  |
| `size` — Size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `italic` — Italic | `checkbox` | `false` |  |

Supported block: **Text** (`text`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `text` — Text | `richtext` | `<p>Pair large imagery with a short story about the collection, the fabric or the fit.</p>` |  |
| `size` — Text size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large |
| `color` — Text color | `select` | `default` | `default`: Default; `muted`: Muted |

Supported block: **Spacer** (`spacer`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `height` — Height | `range` | `16` | 0–80px, step 4 |

Supported block: **Button** (`button`); type limit 3.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `label` — Label | `text` | `Shop now` |  |
| `link` — Link | `url` | `/collections/all` |  |
| `style` — Style | `select` | `solid` | `solid`: Solid; `outline`: Outline; `pill`: Pill; `sweep`: Center sweep; `offset`: Offset shadow; `press`: 3D press; `link`: Text link |
| `new_tab` — Open link in a new tab | `checkbox` | `false` |  |

Add-menu presets:

- Rich text; initial blocks `[{"type":"heading"},{"type":"text"},{"type":"button","settings":{"style":"link","label":"Read more"}}]`.

#### Search (search)

Source: `theme/sections/search.liquid`. Editor: select this section in its template or section group.

Available contexts: `{"templates":["search"]}`.

Section instance limit: 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `pagination_style` — Pagination | `select` | `infinite` | `infinite`: Infinite scroll; `button`: Load more button; `numbers`: Page numbers |
| `infinite_auto_pages` — Infinite scroll: pages before a button | `range` | `3` | 1–10, step 1; After this many pages load automatically, a Load more button appears so the footer stays reachable. |
| `per_page` — Results per page | `range` | `24` | 8–48, step 4 |
| `title_animation` — Title animation | `select` | `rise` | `none`: None; `rise`: Rise from a mask; `blur`: Blur in; `fold`: Fold up; `skew`: Skewed rise; `fade`: Fade up; Plays once when the page opens. Follows Theme settings > Motion and reduced-motion preferences. |
| `title_split` — Animate title by | `select` | `words` | `words`: Word; `chars`: Letter; `lines`: Line |
| `columns_mobile` — Columns on phones | `select` | `1` | `1`: 1; `2`: 2 |
| `columns_desktop` — Columns on desktop | `range` | `4` | 3–5, step 1 |
| `show_filters` — Show filters | `checkbox` | `true` | Filters apply to product results. |
| `show_sort` — Show sort | `checkbox` | `true` |  |
| `card_appearance` — Card appearance | `select` | `inherit` | `inherit`: Use theme default; `minimal`: Minimal; `editorial`: Editorial; `bordered`: Bordered; `image-led`: Image focused |
| `card_ratio` — Image ratio | `select` | `inherit` | `inherit`: Use theme default; `square`: Square; `portrait`: Portrait (4:5); `tall`: Tall (2:3); `landscape`: Landscape (4:3) |
| `card_fit` — Image fit | `select` | `inherit` | `inherit`: Use theme default; `cover`: Fill; `contain`: Contain |
| `card_hover` — Alternate media | `select` | `inherit` | `inherit`: Use theme default; `auto`: Video with image fallback; `image`: Second image only; `off`: Off |
| `card_vendor` — Show vendor | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `card_price` — Show price | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `card_badges` — Show badges | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `card_sizes` — Show sizes | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `show_layout_switch` — Allow shoppers to change grid columns | `checkbox` | `true` | Off uses merchant columns and ignores previous shopper grid preferences. |
| `toolbar_width` — Filter toolbar width | `select` | `full` | `full`: Full bleed; `contained`: Within content |
| `toolbar_sticky` — Sticky filter toolbar | `checkbox` | `true` |  |
| `grid_gap` — Product column gap | `range` | `8` | 0–40px, step 2 |

No add-menu preset: rendered by an existing template/layout/group or used as a rendering endpoint.

#### Statistics (statistics)

Source: `theme/sections/statistics.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `By the numbers` |  |
| `text` — Introduction | `richtext` | Not specified |  |
| `layout` — Layout | `select` | `grid` | `grid`: Grid; `list`: List |
| `alignment` — Alignment | `select` | `left` | `left`: Left; `center`: Center |
| `columns` — Desktop columns | `range` | `3` | 1–4, step 1 |
| `gap` — Card gap | `range` | `24` | 12–48px, step 4 |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters; Sets the width of the image and text together. Background stays full width. All options keep the theme's responsive page gutters. |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px. Custom values are exact and are not multiplied by the global smaller-screen spacing setting.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `appearance` — Appearance | `select` | `ruled` | `plain`: Plain; `ruled`: Ruled; `surface`: Surface cards |
| `value_size` — Value size | `select` | `regular` | `compact`: Compact; `regular`: Regular; `large`: Large |
| `animate` — Subtle entrances | `checkbox` | `false` |  |

Supported block: **Metric** (`metric`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `label` — Label | `text` | `Your metric` |  |
| `value` — Value | `text` | `—` | Enter verified figures. Text supports units, prefixes and localized number formatting without automatic parsing. |
| `text` — Explanation | `richtext` | Not specified |  |

Add-menu presets:

- Statistics; initial blocks `[{"type":"metric"},{"type":"metric"},{"type":"metric"}]`.
- Metric cards — `{"appearance":"surface","alignment":"center"}`; initial blocks `[{"type":"metric"},{"type":"metric"}]`.

#### Team (team-grid)

Source: `theme/sections/team-grid.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

Current section block cap: 16.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `The people behind the label` |  |
| `text` — Text | `richtext` | Not specified |  |
| `alignment` — Alignment | `select` | `left` | `left`: Left; `center`: Center |
| `columns` — Columns (desktop) | `range` | `3` | 2–6, step 1 |
| `columns_mobile` — Columns (phones) | `select` | `2` | `1`: 1 column; `2`: 2 columns |
| `gap` — Gap between people | `range` | `24` | 0–64px, step 4 |
| `card_style` — Profile style | `select` | `plain` | `plain`: Plain; `surface`: Surface fill; `outline`: Outline; `shadow`: Soft shadow |
| `show_bio` — Show bios | `checkbox` | `true` |  |
| `image_ratio` — Photo ratio | `select` | `portrait` | `adapt`: Adapt to image; `square`: Square (1:1); `portrait`: Portrait (4:5); `tall`: Tall (2:3); `landscape`: Landscape (3:2); `wide`: Wide (16:9) |
| `grayscale` — Black and white until hover | `checkbox` | `false` |  |
| `hover_zoom` — Zoom photos on hover | `checkbox` | `true` |  |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Team member** (`member`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `image` — Photo | `image_picker` | Not specified |  |
| `name` — Name | `text` | `Name` |  |
| `role` — Role | `text` | `Head of design` |  |
| `bio` — Short bio | `richtext` | Not specified |  |
| `link` — Profile link | `url` | Not specified |  |
| `link_label` — Link label | `text` | `Instagram` |  |

Add-menu presets:

- Team; initial blocks `[{"type":"member"},{"type":"member","settings":{"role":"Pattern cutter"}},{"type":"member","settings":{"role":"Studio manager"}}]`.

#### Testimonials grid (testimonial-grid)

Source: `theme/sections/testimonial-grid.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

Current section block cap: 12.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `What customers say` |  |
| `text` — Text | `richtext` | Not specified |  |
| `alignment` — Alignment | `select` | `left` | `left`: Left; `center`: Center |
| `layout` — Layout | `select` | `grid` | `grid`: Grid; `masonry`: Masonry (desktop); `scroll`: Swipe row |
| `columns` — Columns (desktop) | `range` | `3` | 1–4, step 1 |
| `gap` — Gap between cards | `range` | `16` | 0–48px, step 4 |
| `card_style` — Card style | `select` | `surface` | `plain`: Plain; `surface`: Surface fill; `outline`: Outline; `shadow`: Soft shadow |
| `quote_size` — Quote size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large serif |
| `show_mark` — Show quote mark | `checkbox` | `false` |  |
| `show_rating` — Show star rating | `checkbox` | `true` |  |
| `show_avatar` — Show avatars | `checkbox` | `true` |  |
| `avatar_shape` — Avatar shape | `select` | `circle` | `circle`: Circle; `square`: Square |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Testimonial** (`testimonial`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `rating` — Rating | `range` | `5` | 0–5, step 1; Set to 0 to hide the rating on this quote. |
| `title` — Title | `text` | Not specified | Optional short headline, such as "Perfect fit". |
| `quote` — Quote | `richtext` | `<p>The fit is exactly as described and the fabric feels even better in person.</p>` |  |
| `author` — Author | `text` | `Customer name` |  |
| `role` — Detail | `text` | `Verified buyer` |  |
| `image` — Avatar | `image_picker` | Not specified |  |
| `product` — Product purchased | `product` | Not specified |  |

Add-menu presets:

- Testimonials grid; initial blocks `[{"type":"testimonial"},{"type":"testimonial"},{"type":"testimonial"}]`.

#### Testimonial quote (testimonial-quote)

Source: `theme/sections/testimonial-quote.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `alignment` — Alignment | `select` | `center` | `left`: Left; `center`: Center |
| `size` — Quote size | `select` | `regular` | `small`: Small; `regular`: Regular; `large`: Large |
| `quote_font` — Quote font | `select` | `heading` | `heading`: Heading font; `body`: Body font |
| `mark` — Quote mark | `select` | `small` | `small`: Small accent; `large`: Large faded; `none`: None |
| `max_width` — Max width | `range` | `880` | 480–1200px, step 40 |
| `card_style` — Background panel | `select` | `plain` | `plain`: Plain; `surface`: Surface fill; `outline`: Outline; `shadow`: Soft shadow |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Star rating** (`rating`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `rating` — Rating | `range` | `5` | 1–5, step 1 |

Supported block: **Quote** (`quote`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `quote` — Quote | `richtext` | `<p>Every piece I have bought here has become a favourite. The quality speaks for itself.</p>` |  |

Supported block: **Author** (`author`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `name` — Name | `text` | `Customer name` |  |
| `role` — Detail | `text` | `Customer since 2021` |  |
| `image` — Avatar | `image_picker` | Not specified |  |

Supported block: **Logo** (`logo`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `image` — Logo | `image_picker` | Not specified |  |
| `height` — Logo height | `range` | `32` | 16–80px, step 4 |

Add-menu presets:

- Testimonial quote; initial blocks `[{"type":"quote"},{"type":"author"}]`.

#### Timeline (timeline)

Source: `theme/sections/timeline.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

Current section block cap: 16.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `Our story` |  |
| `text` — Text | `richtext` | Not specified |  |
| `alignment` — Alignment | `select` | `left` | `left`: Left; `center`: Center |
| `layout` — Desktop layout | `select` | `alternate` | `vertical`: Single column; `alternate`: Alternating sides; `horizontal`: Horizontal row |
| `gap` — Space between events | `range` | `40` | 0–96px, step 4 |
| `card_style` — Event style | `select` | `plain` | `plain`: Plain; `surface`: Surface fill; `outline`: Outline; `shadow`: Soft shadow |
| `marker` — Marker | `select` | `dot` | `dot`: Dot; `ring`: Ring; `number`: Number |
| `line_style` — Line | `select` | `solid` | `solid`: Solid; `dashed`: Dashed; `none`: None |
| `date_style` — Date style | `select` | `small` | `small`: Small caps; `large`: Large accent; `badge`: Badge |
| `image_ratio` — Image ratio | `select` | `landscape` | `adapt`: Adapt to image; `square`: Square (1:1); `portrait`: Portrait (4:5); `tall`: Tall (2:3); `landscape`: Landscape (3:2); `wide`: Wide (16:9) |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Event** (`event`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `date` — Date | `text` | `2019` |  |
| `title` — Title | `text` | `Milestone` |  |
| `text` — Text | `richtext` | `<p>Describe what happened and why it matters.</p>` |  |
| `image` — Image | `image_picker` | Not specified |  |

Add-menu presets:

- Timeline; initial blocks `[{"type":"event","settings":{"date":"2019","title":"The first collection"}},{"type":"event","settings":{"date":"2021","title":"Our own atelier"}},{"type":"event","settings":{"date":"2024","title":"Shipping worldwide"}}]`.

#### Video (video-feature)

Source: `theme/sections/video-feature.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | Not specified |  |
| `text` — Text | `richtext` | Not specified |  |
| `alignment` — Alignment | `select` | `left` | `left`: Left; `center`: Center |
| `video` — Shopify-hosted video | `video` | Not specified |  |
| `video_url` — Or YouTube / Vimeo URL | `video_url` | Not specified | Used instead of the uploaded video when set. |
| `description` — Video description | `text` | Not specified | Describes the video for screen readers. |
| `play_mode` — Playback | `select` | `click` | `click`: Poster, plays on click; `ambient`: Silent loop, starts automatically; The silent loop works with Shopify-hosted video only. |
| `loop` — Loop after playing | `checkbox` | `false` |  |
| `cover_image` — Cover image | `image_picker` | Not specified |  |
| `play_button` — Play button | `select` | `light` | `light`: Light; `dark`: Dark; `outline`: Outline; `large`: Large light |
| `poster_label` — Label under the play button | `text` | Not specified | For example the running time, such as 1:24. |
| `ratio` — Aspect ratio | `select` | `landscape` | `landscape`: 16:9; `cinema`: Cinema 21:9; `classic`: 4:3; `square`: Square; `portrait`: Portrait 9:16 |
| `video_width` — Video width | `select` | `full` | `full`: Full content width; `narrow`: Narrow (960px) |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Button** (`button`); type limit 2.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `label` — Label | `text` | `Shop now` |  |
| `link` — Link | `url` | `/collections/all` |  |
| `style` — Style | `select` | `solid` | `solid`: Solid; `outline`: Outline; `pill`: Pill; `sweep`: Center sweep; `offset`: Offset shadow; `press`: 3D press; `link`: Text link |
| `new_tab` — Open link in a new tab | `checkbox` | `false` |  |

Add-menu presets:

- Video — `{"heading":"Behind the seams"}`.

### Theme blocks

#### Group (group)

Source: `theme/blocks/group.liquid`. Editor: Add block inside a compatible theme-block section/group.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `layout_direction` — Layout direction | `select` | `group--vertical` | `group--horizontal`: Horizontal; `group--vertical`: Vertical |
| `alignment` — Alignment | `select` | `flex-start` | `flex-start`: Left; `center`: Center; `flex-end`: Right; Shown when `{{ block.settings.layout_direction == 'group--vertical' }}` |
| `padding` — Padding | `range` | `0` | 0–200px, step 2 |

Supported block: **@theme** (`@theme`).

Add-menu presets:

- Column — `{"layout_direction":"group--vertical","alignment":"flex-start","padding":0}`.
- Row — `{"layout_direction":"group--horizontal","padding":0}`.

#### Text (text)

Source: `theme/blocks/text.liquid`. Editor: Add block inside a compatible theme-block section/group.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `text` — Text | `text` | `Text` |  |
| `text_style` — Text style | `select` | `text--title` | `text--title`: Title; `text--subtitle`: Subtitle; `text--normal`: Normal text |
| `alignment` — Alignment | `text_alignment` | `left` |  |

Add-menu presets:

- Text.
