# Shopify editor and theme reuse

Status: proposed contracts and release tests. No access to a Shopify admin/editor was used in this research.

## What compatibility means

A merchant must be able to build and maintain the storefront through Shopify's editor without a developer changing code for ordinary branding, campaigns, menus, or content. A component that works only after refreshing the preview fails this contract.

Shopify dynamically replaces section markup during editing and exposes lifecycle/selection events. Selected content must be visible. [Editor integration documentation](https://shopify.dev/docs/storefronts/themes/best-practices/editor/integrate-sections-and-blocks)

The following architecture and tests are our implementation requirements, not a claim that the reference websites pass them.

## Configuration hierarchy

| Scope | Controls | Example |
|---|---|---|
| Global | Brand identity, color schemes, type scale, button style, product-card defaults, motion preference | Change the default accent across the store |
| Section | Layout, spacing, content source, media, local color scheme | Turn a featured collection from grid to rail |
| Block | A single content item and its local placement | Edit one campaign tile or one slide |
| Product/content data | Product-specific fit, composition, size guide, paired media | Different size chart for trousers |
| Preset | A coordinated starting configuration | Editorial vs bold streetwear |

Use presets for coherent starting points. Do not create hundreds of independent switches for every border and pixel. Offer bounded choices, useful labels, help text, and reliable defaults. Settings should control a meaningful merchant outcome.

## Section and block strategy

Theme blocks live in `/blocks` and support reuse across sections; section blocks are local to one section. A section cannot mix those two block models. App blocks require declared support. These are platform constraints, confirmed in Shopify's [blocks reference](https://shopify.dev/docs/storefronts/themes/architecture/blocks).

Our proposal:

- Reusable heading, text, button group, media, and editorial group elements use theme blocks in designated composition sections.
- Tightly constrained controls, such as an announcement message list, may use section blocks where that makes the editor simpler.
- Product information uses a deliberate block structure for title, price, variant selection, buy controls, accordions, and app positions. Validate shared product/form context in the prototype before finalizing nesting.
- Product-card internals use snippets with explicit parameters; merchants do not need dozens of nested controls per card.
- Header/footer use section groups with supported positions and limits. Main page content uses JSON templates.
- Avoid arbitrary unlimited nesting. Keep the editor tree understandable and the semantic HTML stable.

## Component lifecycle contract

Every interactive component must implement these behaviors:

1. Initialize only within its own root. Find children using local selectors and instance-specific IDs.
2. Support insertion after initial page load, including content fetched through Ajax.
3. Clean up subscriptions, timers, resize observers, intersection observers, and animations when removed.
4. Reinitialize correctly after reconnection. Do not reuse an already-aborted event controller.
5. Do not register a custom-element definition twice when the same section is used repeatedly.
6. Handle section replacement without resetting unrelated components.
7. Keep product/form references unambiguous across main product, featured product, and quick add.
8. Keep selection visible in the editor. Open the selected accordion/slide/panel and suspend motion that would hide it.
9. Restore normal behavior after deselection without leaking state into another instance.
10. Do not attach a full-page reload as the normal fix for editor changes.

The editor adapter translates Shopify selection events into component methods. The component itself owns its view state. Design mode changes inspection behavior, not the fundamental rendering or commerce architecture.

## Editor behavior by component

| Component | Merchant action | Required preview response |
|---|---|---|
| Announcement | Select a particular message | Show it; pause rotation/ticker as needed |
| Header | Switch logo, layout, colors, sticky setting | Correct live dimensions, no duplicated observers |
| Navigation | Edit promotional tile/block | Reveal the relevant navigation panel without initiating navigation |
| Hero | Select slide or change mobile image | Selected content visible; autoplay paused during selection |
| Product rail | Select an offscreen item/block | Bring it into view without stealing focus unexpectedly |
| Accordion | Select closed block | Open it while selected |
| Video | Edit poster or source | Preview is controllable; no unexpected audio |
| Product info | Move buy controls/app block | Maintain valid form association and semantic order |
| Footer | Remove a menu/social block | Reflow without an empty column or stale divider |

Never let a decorative reveal's initial hidden state conceal merchant-selected content. Empty content must have a useful editor placeholder; customer-facing output should omit meaningless empty sections.

## Settings conventions

- Separate desktop/mobile media only where it materially changes composition: hero, campaign tile, and video poster. Do not duplicate every setting by device.
- Expose image focal points and fit choices with sensible defaults.
- Group settings into Content, Layout, Appearance, and Behavior; use consistent labels across sections.
- Use Shopify resource pickers for menus, collections, products, pages, and images. Do not request raw handles for routine setup.
- Support dynamic sources for appropriate content fields. Provide documented metafield definitions when a feature needs them.
- Translate storefront strings and schema labels through locale files. Avoid concatenated English fragments that cannot be translated naturally.
- Render blocks with the required Shopify editor attributes and stable roots.
- Validate presets, defaults, setting ranges, and identifiers with Theme Check and actual editor installation.

## Brand portability test

Deliver two presets from the same code:

| Property | Preset A: campaign streetwear | Preset B: quiet editorial |
|---|---|---|
| Header | Centered logo; solid or campaign overlay | Left/center logo; restrained solid header |
| Palette | Strong contrast with one accent | Neutral surfaces and muted accent |
| Hero | Campaign media and prominent CTA | Editorial still and smaller copy |
| Product display | Compact grid; optional quick add | Airier grid; image-led cards |
| Motion | Standard, optional ticker | Reduced decorative motion |
| Homepage | Drop → category spotlights → story | Editorial → collection → story |

These are original working directions, not replicas of the reference stores. Neither preset may require a conditional branch on shop domain or brand name.

Test with long product titles, a landscape logo, a tall logo, no hero image, one collection, many collections, translated labels, and missing optional data. A preset that only looks correct with the demo content is unfinished.

## Merchant-owned data and updates

Treat merchant editor configuration as data. Release tooling must distinguish code changes from changes to `settings_data.json`, JSON template arrangements, section-group content, and resource references. Do not overwrite a merchant's live content with demo defaults during an update.

Before any upgrade: back up current theme, compare schema changes, map renamed/removed setting IDs, apply migrations to an unpublished copy, and verify saved layouts. Setting and block IDs become compatibility contracts after release. Changing a setting label is different from changing its identity.

Ship a changelog, migration notes, version information, and a known integration list. Test an upgrade from the previous release with customized layouts, not only a fresh installation.

## Editor acceptance script

Run against hero, featured collection, editorial content, and main product on desktop and narrow preview:

1. Add a fresh instance; verify placeholder state.
2. Populate real content and change all supported layout modes.
3. Duplicate it; confirm independent controls and unique IDs.
4. Reorder it above/below other sections.
5. Select an offscreen or hidden block; verify visibility.
6. Change settings rapidly while interactive elements are open.
7. Delete the instance; verify no background animation or console error remains.
8. Save, exit preview, and reopen the actual storefront.
9. Reload editor and confirm persisted state.
10. Add a representative app block where supported and repeat relevant operations.

Record expected vs actual results. No checkbox is considered passed based solely on a screenshot of the initial page.

## Definition of complete

The theme passes the script above, builds a second brand without code edits, documents all required data, and installs cleanly on a different test store. Compatibility claims name the browsers, Shopify features, and integrations actually tested.
