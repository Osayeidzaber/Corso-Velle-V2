# Customization

[Back to README](README.md) · [Installation](INSTALLATION.md) · [Development](DEVELOPMENT.md) · [Settings reference](docs/SETTINGS-REFERENCE.md)

Configure the design in the Theme Editor, maintain catalog content in Shopify Admin, and use code for changes beyond the available controls. This guide describes the current implementation; the linked reference lists every schema setting, choice, block and preset.

## Contents

- [Editing workflow](#editing-workflow)
- [Brand and design](#brand-and-design)
- [Navigation and store shell](#navigation-and-store-shell)
- [Editorial sections](#editorial-sections)
- [Product discovery](#product-discovery)
- [Product pages](#product-pages)
- [Cart and promotions](#cart-and-promotions)
- [Motion](#motion)
- [Content and utility pages](#content-and-utility-pages)
- [Limits and extension opportunities](#limits-and-extension-opportunities)

## Editing workflow

1. Duplicate or install an unpublished theme and open its Theme Editor from **Online Store → Themes**.
2. Select the page/template to edit. Select the appropriate product or collection preview so contextual sections have real data.
3. Edit **Theme settings** for shared defaults. Select a section for local settings; select its blocks for content and ordering. A local override takes precedence where offered.
4. Use **Add section** to choose an available section preset. Add/reorder blocks within that section's allowed types. Preview phone and desktop layouts, then save.
5. Open the storefront preview outside the editor to test motion and commerce.

Templates are shared: editing the default product template changes every product assigned to it. For a distinct product or page layout, create a template using the editor and assign it to that resource in Admin. A section preset adds a configured instance; a whole-theme style changes global settings and can replace saved assignments. Back up before switching styles.

The included theme styles are **Riviera**, **Minimal** and **Quiet** in `theme/config/settings_data.json`. Saved Corsovelle values may differ from schema defaults. Header/footer groups are edited separately from page sections. Contextual sections and rendering endpoints do not all appear under Add section; check the [reference](docs/SETTINGS-REFERENCE.md) for allowed contexts and presets.

## Brand and design

| Theme settings group | What you can change |
| --- | --- |
| Logo | Primary/inverse logo, favicon, desktop and phone logo widths. Header logo treatment separately chooses original colors or theme ink. |
| Colors | Color schemes with background, surface, text, muted text, border, accent and text-on-accent roles; error/success colors. Choose a scheme on sections that expose a picker. |
| Typography | Heading, body and label fonts; heading case; body size; shared heading tracking/leading and label tracking. Specialized component typography can retain its own metrics. |
| Layout | Narrow 1200px, Wide 1440px or Full page width; section spacing and corners; phone/tablet/large-screen gutters and smaller-screen spacing ratio. |
| Buttons | Compact/Regular/Large boxed sizes, inherited/square/rounded/pill corners, expressive/subtle/instant interactions. Local button choices can override these. |
| Product cards | Surface, appearance, image shape/fit, alternate media, image hover animation, sizes, low-stock indication, badges, vendor and price visibility. |

The accent drives related hover, selected, border and focus colors through derived CSS tokens. Choose text-on-accent for readable button labels and verify contrast after editing a palette. Footer **Custom palette** mode uses its own background/text/accent; switch to scheme mode to use the selected scheme.

Shared gutters apply below 750px, from 750–1199px and from 1200px. Smaller-screen section spacing applies below 990px. Sections using the shared presentation controls can choose inherited/narrow/wide/full width and custom top/bottom padding for desktop and smaller screens. Custom padding is exact and is not multiplied by the global ratio. Full content width still respects gutters; media can separately bleed to the viewport in layouts that support it.

These controls do not resize every icon, modal, size pill or fixed component inset. Purchase buttons retain their minimum target size. Use section controls before changing source CSS.

## Navigation and store shell

### Header and search

Select the **Header** in the header group to configure menus, desktop layout, sticky behavior, home overlay, panel/drawer styles, submenu trigger and dropdown arrangement. Account and search visibility, desktop/phone minimum heights, logo treatment and logo animation/frequency are local controls. Menu-description and promotional blocks add content to navigation groups.

Predictive search can be enabled and configured for resource types and result limits; collection suggestions have their own source/count controls. A native search form remains available when predictive search is disabled. Edit the actual menu items in Shopify Admin and select that menu in the section; writing a label does not create a destination page.

### Announcements and message bands

**Announcement bar** supports first-message, stacked-message and ticker modes, color scheme, direction, speed and separator. Add linked Message blocks in the intended order. First-message mode intentionally displays only the first populated message.

**Message band** supports static or moving text, one/two rows, direction, type scale and smaller phone text; phones can stay static. The second moving row is decorative duplication. Moving instances provide pause controls and honor motion policy.

### Footer and support

Footer settings cover editorial/stacked/compact layouts, spacing, column width, logo/wordmark size, custom or scheme palette, newsletter copy, payment/policy/back-to-top visibility and collapsible or expanded phone menus. Brand, Menu and Social blocks manage content. Social destinations come from **Theme settings → Social media**.

Newsletter forms use Shopify's customer signup. Contact forms use Shopify's contact form handling; the theme does not configure email automation. Verify delivery with your store setup. **Customer support** settings supply storefront contact content; replacing the contact-information policy is optional and should be intentional.

Header, footer, search modal and cart drawer are site-shell components. Do not duplicate them as ordinary content sections.

## Editorial sections

| Section family | Practical controls and content |
| --- | --- |
| Campaign hero | Overlay/editorial/split layouts, image/hosted video/file URL/collection source, phone media, slides, autoplay/interval/transition/dots, media fit, tint, positions, fonts/type treatments, copy blocks and buttons. Contain avoids parallax cropping. |
| Hero: split / image overlay | Images and phone alternatives, split or overlay composition, positions, heights, panels and button/content blocks. Available controls differ from Campaign hero. |
| Media with text | Split/overlay/stacked/asymmetric composition, media side and phone order, image/phone image or hosted video, copy width/alignment, ratio/fit, CTA and section motion. |
| Expanding media | Image/video/collection source, starting frame dimensions, tint, scroll length, expansion switch, static height, aligned heading/text/button blocks and manual/autoplay video. No separate phone media picker. |
| Accordion gallery | Collection products or explicit product/panel blocks, panel dimensions/colors, fit, starting panel, hover/click behavior, labels, price and link visibility, animation speed. |
| Clothes rack | Collection source or Hang blocks with product/front/back image overrides, second-photo back fallback, garment size/spacing/collar overlap, white-background knockout and action labels. A product link remains without JavaScript. |
| Shop by category | Bento/grid/scroller arrangements, phone layout, palette or per-card scheme, image shape/fit, counts/index/descriptions, menus and link overrides. |
| Image strip / logo wall | Moving or static arrangements, image blocks, collection source where offered, size/fit/spacing, grayscale and labels; logo wall offers grid/row and opacity options. |
| Reviews wall / testimonials | Enter quotes and attribution, optionally associate products; choose layouts, columns, alignment and card presentation. Reviews wall can move on desktop or show a static grid; phones/static policy show the full semantic list. No review-provider integration is included. |
| FAQ | Question blocks with rich answers or page content, initial-open states, single/multiple-open behavior, list/split layout, ruled/cards and marker choice. |
| Feature grid / feature list / multicolumn | Reorderable content, icons/images, heading/text/link, column/layout and card choices as exposed by each section. |
| Collage / lookbook / before-after | Mixed media/product/collection blocks; positioned product hotspots and optional product list; or comparison image pairs with a native range handle. |
| Rich text / image with text | Caption, heading, text, spacer and button blocks; content order, image/panel treatment and shared design controls. |
| Countdown / counter / statistics | Authored dates or numerical facts, labels, layout and presentation. A countdown is visual content and does not schedule a Shopify discount. |
| Promo banner / pricing / timeline / process / team | Authored promotional messages, plans, events, steps or profiles with section-specific blocks and design choices. Pricing cards do not create Shopify products, subscriptions or checkout plans. |
| Divider / button row | Line/elastic/dashed/blank separator, width/thickness/space; or reusable link buttons with alignment and style controls. |
| Newsletter / contact | Native Shopify forms with configurable presentation and supported custom contact fields. |

Use approved copy, real reviews and owned media. Product/collection sources do not transfer between stores. Empty configured sections may hide on the storefront while showing editor placeholders. The [settings reference](docs/SETTINGS-REFERENCE.md#theme-sections) lists exact controls for each family; [section sources](docs/SECTION-SOURCES.md) preserves adaptation provenance and behavior notes.

Countdowns interpret the entered date/time using the shop offset at render time; crossing daylight-saving changes can shift the intended time. Dismissible promo banners remain hidden for the browser session, with message edits resetting dismissal. Hosted background videos use manual play under reduced motion/editor policy and pause when hidden/offscreen. The optional Video section loads third-party embeds after play.

## Product discovery

### Featured products and carousel

In **Featured collection**, choose a collection or explicit products. An explicit product list takes precedence; provide a View all URL for it. Configure count, description, heading alignment, desktop/phone grid columns and gaps, regular/compact/large-first composition, width and spacing. The optional **Product card presentation** block supplies local card overrides; removing it restores global defaults.

Carousel layouts offer **Editorial strip**, **Classic product rail** and **Snap slider**, with autoplay, interval/speed, arrows, native rail width/gap/emphasis and **Products before the curve** for the editorial composition. Editorial mode uses OGL/WebGL on supported desktop configurations; smaller screens and simpler motion use native rails. Canvas photography has its own framing and does not inherit every Liquid card decoration.

**Shop the highlighted product** enables the shared purchase panel and size selector. Off gives browse-only navigation. Incomplete variant data takes shoppers to the actual product page. A chart never determines purchase availability. Native and WebGL modes differ in hover/drag and movement; test the style actually selected. Pause and reduced-motion behavior take priority over autoplay.

### Collections, tabs and cards

**Collection tabs** supports underline, pill and desktop-sidebar arrangements, reorderable collection blocks, per-tab product limits, phone columns and optional transition animation. No-JavaScript panels remain stacked. Many tabs increase server-rendered markup and media cost.

**Collections grid** supports all collections or a curated picker order, pagination, empty-collection visibility, image fit/shape/frame and counts/descriptions. Empty collections are hidden after pagination, so a page can show fewer cards. Multiple all-store directories share the ordinary pagination query; use curated sources for more independent instances.

**Collection banner** offers image/text/minimal treatments, image/heading overrides, phone height, tint, title animation, parallax, breadcrumbs/count and automatic/menu/hidden navigation. Minimal omits the description.

**Product grid** and **Search** control filters, sorting, pagination, columns, toolbar and card presentation. Shopify Search & Discovery supplies filter definitions. Shopper density choices can override initial columns when the layout switch is enabled. Search also controls result-related presentation through its available settings.

Card controls affect real product data: sale badges use compare-at pricing, code badges use configured promotion associations, and low stock uses inventory rules. Simple choices can use direct variant add; complex choices use quick add or the product page. Hiding size controls does not remove required product options. See [product-card settings](docs/SETTINGS-REFERENCE.md#product-cards) and the relevant section reference for local overrides.

### Recommendations

Product recommendations use Shopify **related** or **complementary** intent with a fallback collection. Configure count, columns, cards, heading, optional link and empty handling on product templates. Drawer recommendations have separate drawer controls. Recommendations depend on Shopify data; they are not a manually calculated recommendation engine.

## Product pages

Select a product template and **Product information**. Layout settings include slider/stack/editorial-grid galleries, ratio/fit/background, gallery/information proportions, desktop side, smaller-screen order, sticky information, thumbnails, arrows/counter, media progress and zoom. Phones keep a swipe gallery. **Sticky Add to cart bar** is opt-in: Off, Phones and tablets, or All screen sizes; it appears after the main purchase button leaves view.

Reorder supported information blocks: Eyebrow, Title, Price, Variant picker, Inventory, Model info, Buy buttons, Text, Description, Collapsible row, Custom Liquid, Product feature and compatible app blocks. Title supports size and animation; Price controls SKU and promotion messaging. Description supports inline/collapsible treatment, heading, open state and optional care content. Product feature blocks add authored image/icon, text and link content. App blocks require an installed compatible app.

### Options, stock and product content

Maintain options, variants, prices, inventory, media and descriptions under **Products** in Admin. **Theme settings → Product page** controls required option names, sold-out value display and inventory threshold. **Product cards → Size option names** determines which option is treated as a size on shared cards. Match your real option names; these fields do not rename Shopify variants.

The Description renderer reads these optional product metafields. Create suitable definitions under Shopify custom data and enable storefront access where required; the suggested types below match their use in this theme.

| Namespace/key | Suggested definition | Use |
| --- | --- | --- |
| `custom.fabric` or fallback `custom.materials` | Rich text or text | Composition, rendered with `metafield_tag`. |
| `custom.fit` | Single line text | Escaped fit description. |
| `custom.origin` | Single line text | Escaped origin description. |
| `custom.care` or fallback `custom.care_instructions` | Rich text or text | Optional Fabric & Care content. |
| `custom.color_siblings` | List of product references | Links to separate colorway products; include the current product if desired. |
| `custom.color_name` | Single line text | Colorway display label, falling back to product title. |

Sibling links are separate products, not a substitute for variant selection. Model text uses `custom.model_info`, or `custom.model_height` plus `custom.model_size`; see [Model information](docs/MODEL-INFO.md) for definitions and block fallbacks. Some product specification labels are fixed English in Liquid and need code/localization work to change.

### Size charts and fit guidance

Start with [Size chart settings](docs/SIZE-CHART-SETTINGS.md) for the twelve global product/collection/tag assignment rules. Each supports a picture, CSV measurements or reusable chart handle. The **Variant picker** block independently controls full guide, inline measurements, hover/focus preview, unit switching and selected-size highlighting.

For centrally edited charts, follow [Reusable size charts](docs/SIZE-CHART-ADMIN.md). Resolution is: product chart/measurement metafield → product rule → collection metaobject chart → collection rule → tag rule → default reusable handle → template CSV/page fallback. Within a rule scope, the first usable rule wins. Picture-only charts cannot generate numeric inline previews or converted image text.

Use approved measurements with exact variant size labels. Missing values remain missing. Product inventory and available sizes always come from Shopify variants. The Variant picker also exposes **Show fit finder**. Its guidance is heuristic and client-side; the recommendation formula is code-defined rather than an editor setting.

## Cart and promotions

**Theme settings → Cart** selects drawer/notification/cart-page behavior after add, fly-to-cart animation, cart note, empty-cart destination collection and optional free-shipping progress threshold. A progress threshold is display configuration: configure matching shipping rules in Shopify Admin and verify currency/market behavior.

Cart page and drawer have independent schemes, density and image visibility. The page adds note override, summary style/stickiness, accelerated checkout and optional empty-cart suggestions. The drawer adds width, recommendations and accelerated-checkout visibility. Standard adds use the shared AJAX cart; file-upload line properties retain native multipart submission.

### Discount-code associations

Create and validate discounts in **Shopify Admin → Discounts**. **Theme settings → Promotions** associates existing codes through four slots, using entire-store scope, product pickers, handles, whole-word title phrases, or tags/`custom.promotion`. Product `custom.discount_code` is another source. Highest priority wins for an individual product; ties prefer the metafield, then earlier slots.

Enable global automatic application and each slot's auto-try option if wanted; configure code badges, product messages, conflict policy and cart code field separately. The theme submits codes to Shopify and displays Shopify's accepted allocations. Association does not change eligibility, create a discount or calculate a pre-cart promotional price.

There is **no collection picker for promotion rules**. Use supported products/handles/tags or product metafields; a collection-based association would require implementation. Shopify Admin may independently restrict the real discount to a collection. See [Promotions](docs/PROMOTIONS.md) for exact matching, conflicts, manual-code behavior and testing.

## Motion

### Merchant controls

**Theme settings → Motion** provides animation level (Off/Minimal/Standard), tempo, stagger, scroll-linked effects, phone behavior, smooth wheel scrolling and smoothing strength. Reduced motion and editor mode override decorative effects. Data Saver simplifies supported scenes. Disabling scroll effects keeps entrances while removing full scroll-linked scenes; it does not change Shopify product behavior.

| Section/control | Effect |
| --- | --- |
| Campaign hero | Entrance treatment, media parallax, gentle scroll exit, slideshow behavior and video autoplay. |
| Media with text | Off/legacy/subtle/cinematic preset, reveal direction, intensity, image drift, accent wash and optional brief desktop hold. Simplified phones use entrances; tall sections avoid the hold. |
| Expanding media | Scroll expansion on/off, starting width/height and track length. Phones, editor and reduced motion use a static open presentation. Keep animated desktop copy concise. |
| Featured collection | Style, autoplay, pace/speed and rail presentation. Reduced motion suppresses automatic travel. |
| Tickers, image strips and reviews | Speed/direction or static layout where available, with scoped pause behavior. |
| Product title, collection title, tabs and section-kit entrances | Local animation switches or entrance choices as listed in their schemas. |
| Divider / footer / buttons / header logo | Elastic line, optional reveal/beam, interaction style or logo animation, subject to their motion policies. |

Smooth wheel scrolling uses one Lenis instance on fine-pointer devices at 750px and above; touch stays native. It synchronizes with GSAP and pauses for overlays. Reduced motion, editor and non-decorative motion modes bypass it. Do not add a second smoothing script through Custom Liquid.

### Developer changes

Use [Animation development](DEVELOPMENT.md#animation-development) to locate GSAP/ScrollTrigger, the shared policy, section controllers and cleanup rules. Individual timing curves, shaders, fit-finder formulas and animation sequences are not all exposed in the Theme Editor. Expose bounded, instance-scoped schema options when merchants need to control them.

## Content and utility pages

Blog settings cover source/title, grid/list/editorial layout, columns, articles per page and image/excerpt/date/author visibility. Article settings cover reading width, scheme, image/date/author/comments; Shopify's blog settings still control whether comments are available.

Page controls title visibility, scheme and reading width. Password controls heading, logo, width, scheme and optional newsletter signup. The 404 section controls message, calls to action, optional search, menu and product suggestions. **Theme settings → Gift card page** offers Classic/Minimal/Bordered presentation for the standalone gift-card template.

Translations live in `theme/locales/en.default.json`; supported storefront wording can be edited through Shopify's theme language/content editor. Size names use `product.size_names`. Only English locale files ship in this checkout; adding a translation requires translating strings and checking fixed Liquid labels too.

## Limits and extension opportunities

- **React is not installed.** Interactivity uses TypeScript custom elements. A React integration needs dependencies, build support and mount/unmount ownership; see [development](DEVELOPMENT.md#react-and-interactive-components).
- **Native theme blocks are intentionally small.** Custom section supports nested Group/Text blocks, not a complete drag-and-drop library of every section component. Group layout does not offer wrapping and can clip overflow; test long or dense content.
- **Some presentation remains code-defined.** Canvas framing, shader strength, detailed animation curves, fixed product labels and fit estimation need source changes. Add schema controls only when their runtime consumers are implemented and verified.
- **No automatic catalog or settings migration.** Metaobject definitions, resource assignments, filters, real discounts and update reconciliation require Admin/developer work.
- **No commercial compatibility certification yet.** Test repeated content sections, editor add/reorder/remove/save, responsive extremes, app blocks, reduced motion, native fallbacks and actual purchases before promising support.

When extending a feature, update this guide's behavior notes, regenerate the [settings reference](docs/SETTINGS-REFERENCE.md), and verify both the setting declaration and its rendered/runtime effect. See [Development](DEVELOPMENT.md#validation-and-documentation-maintenance).
