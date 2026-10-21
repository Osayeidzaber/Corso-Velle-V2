# Homepage, section library, and content requirements

Status: proposed section plan informed by actual top-to-footer reference review. The first preset is a campaign-led clothing store; its name and branding remain open.

## Homepage narrative

The references offer three rhythms: Hype Town repeats category stories with products, Rush Mode follows a compact campaign/category/product/story sequence, and W&R puts most of the page into its product grid. Our default should combine strong campaign identity with a manageable route to products and a reachable footer.

Proposed default order:

1. Announcement and header.
2. One campaign hero with one primary destination.
3. Category discovery tiles, usually three or four.
4. Featured drop: a bounded product selection and View all.
5. One category spotlight or editorial story.
6. A second curated collection if it adds a distinct shopping purpose.
7. Optional campaign pair or lookbook teaser.
8. Newsletter invitation.
9. Footer.

This is a preset, not a locked template. The theme must allow sections to move, duplicate, or disappear without dependencies on their original order. Limit the initial default product count rather than reproducing W&R's very long homepage grid or every Hype Town category repetition.

## Section inventory and priority

| ID | Section | First release | Merchant purpose |
|---|---|---|---|
| S-01 | Campaign hero | Required | Promote the current drop |
| S-02 | Collection tiles | Required | Browse by garment/category |
| S-03 | Featured collection | Required | Show a bounded product grid or rail |
| S-04 | Media with text | Required | Explain fit, fabric, or brand story |
| S-05 | Campaign tiles | Required | Link two or more editorial destinations |
| S-06 | Rich text / FAQ | Required | Useful content and support pages |
| S-07 | Newsletter | Required | Collect subscription through the chosen supported form |
| S-08 | Footer group | Required | Navigation, policies, contact, social links |
| S-09 | Announcement/ticker | Static required; movement optional | Campaign messaging |
| S-10 | Video/reels rail | Later enhancement | Editorial video discovery |
| S-11 | Shoppable lookbook | Later enhancement | Link styled outfits to products |
| S-12 | Membership campaign | Content-only optional | Link to a real external/app-backed membership flow |

An enabled section must still meet mobile/editor/accessibility gates. Later enhancements are not silently included in the initial launch estimate.

## S-01: Campaign hero

**Content:** desktop image, optional mobile image, optional video with poster, eyebrow, heading, short body, up to two links, text alignment, color scheme/scrim, height mode, focal point.

**Default:** a single still image or restrained video campaign with a visible destination. Slideshow is optional and capped to a small set of slides. First visible media must render promptly; text must never depend on a delayed animation.

**Mobile:** dedicated crop and text placement, adequate contrast, height bounded by actual content and viewport. Do not use a fixed 100vh assumption that hides the CTA under browser chrome.

**Editor:** selected slide becomes visible; rotation pauses; replacing media cleans up player state. Empty media uses editor placeholders and a stable customer-facing fallback.

**Failure:** video blocked/unavailable shows poster; missing secondary CTA removes its gap; very long text expands content safely.

**Acceptance:** CTA visible at 320px with large text, no layout jump when image loads, no unrequested audio, clear pause behavior, selected block never hidden.

## S-02: Collection tiles

Each block selects a collection with optional image/title override. Use a real linked destination and a clear overlay gradient or text region. Default desktop layout uses equal tiles; mobile stacks or uses two columns depending on content. A horizontal rail is a deliberate alternative, not accidental overflow.

Do not derive every tile from the same generic product image. The content brief should request campaign-quality category photographs with a known safe crop. Empty/missing collection selection is a helpful placeholder in the editor and omitted on the storefront.

## S-03: Featured collection

Use the shared card described in [04-collections-and-product-cards.md](04-collections-and-product-cards.md). Settings include collection, title override, product limit, grid/rail, mobile columns, image ratio, color scheme, and optional View all label. Avoid a separate bespoke product-card implementation for home.

Use a bounded default such as eight products, not an entire catalog. A rail starts at a logical position and remains keyboard/touch accessible. If there is one product, remove meaningless carousel controls.

## S-04: Media with text / category spotlight

One reusable section can express Rush Mode's fit story or a Hype Town-style category banner when configured differently. Define coherent layout modes rather than many special-case sections: split media/text, image with overlaid copy, and compact banner.

Controls: media, eyebrow, title, body, link group, desktop side, mobile order, color scheme, bounded spacing, crop/focal point. Preserve reading order in the DOM; do not visually reverse essential content into a confusing keyboard sequence.

A category banner and its following collection may be separate reorderable sections. Do not secretly assume the next section belongs to it. The preset can place them together; the merchant can change that composition.

## S-05: Campaign tiles

Repeatable tiles with image, heading, optional short copy, and destination. Support two equal columns and a stacked mobile arrangement. Text overlays need contrast testing against the actual image. Missing destinations must not produce clickable-looking dead cards.

The reference's generic campaign labels are evidence of a layout, not copy for our store. Require real campaign content before launch.

## S-06: Text, FAQ, and content templates

Provide a readable rich-text section and FAQ with semantic disclosure behavior. Include templates for standard page, contact, blog/article if in scope, collection list, search, 404, password, and gift card as required by the final release scope. Product and collection templates have their dedicated main sections.

Contact form uses Shopify's supported form behavior with labels and visible success/error states. Privacy, returns, shipping, and tracking links use merchant destinations. Account navigation follows the store's configured account experience; do not attempt to theme hosted account screens with storefront Liquid.

## S-07: Newsletter

Single labelled email field, clear purpose, submit control, pending/success/error states, and configured privacy link. Connect to the actual supported subscription mechanism; do not ship a form that only animates success.

Show validation near the field and announce it accessibly. Prevent accidental duplicate submissions. On phones the keyboard must not hide the field or submit button. In editor previews, content/layout inspection does not create subscriptions.

## S-08: Footer

Use blocks for brand message, menu columns, newsletter if not already used, contact details, and social links. Optional localization controls and real payment-method display are driven by configuration.

Desktop can show columns; phones stack or use accessible expandable menu groups. Contact information remains readable/clickable where appropriate. Empty columns collapse. Footer must remain reachable through pagination and not be trapped below endless product loading.

Launch link check rejects `#` placeholders for policy/support/tracking destinations. Unsupported features stay hidden, with setup guidance in editor help.

## Later media features

**Reels rail:** poster-first rendering, one active player, explicit audio control, offscreen pause, captions when needed, and no automatic download of every video. Start with editorial links/video; shoppable overlays require a separate product mapping and interaction spec.

**Lookbook:** explicit product references and accessible list alternative to hotspots. Hotspots cannot be the only way to discover products. Keep these features out of the critical shopping slice until device performance is measured.

**Membership:** a campaign block can link to a real signup flow. Points, raffles, access control, and member pricing are backend/app work, not benefits a Liquid section can implement by itself.

## Content package needed before final visual design

| Asset/data | Needed for | Fallback during development |
|---|---|---|
| Normal and alternate logo, brand name | Header/footer | Neutral project text |
| One desktop and mobile campaign composition | Hero | Owned/licensed placeholder media |
| Category imagery and selected collections | Collection tiles | Editor placeholders/test collections |
| Consistent product images and actual options | Cards/PDP | Test catalog |
| Size charts, fit, fabric/care | Purchase confidence | Clearly labelled test data |
| Real delivery/returns/contact copy | Product/footer | No invented promises |
| App list and tracking/subscription destinations | Integrations | Features disabled |

Reference media must not be repackaged into the theme. The visual system should remain attractive when a different merchant supplies different photography.
