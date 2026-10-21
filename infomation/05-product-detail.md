# Product detail, fit guidance, and variant selection

Status: proposed specification. Read [04-collections-and-product-cards.md](04-collections-and-product-cards.md) for entry points and [06-cart-and-commerce.md](06-cart-and-commerce.md) for submission behavior.

## Purpose

A clothing product page must answer: what does it look like, how does it fit, which option is available, what will it cost, and what happens after purchase? The design should make those answers visible before secondary storytelling.

Reference differences are useful: Hype Town shows delivery information above size selection and an expandable image size chart; Rush Mode places a size-guide modal beside options and uses informational accordions; W&R combines product-image color choices, model fit information, a measurement table, and tabbed recommendations. Those observations are documented separately; the following is our own implementation contract.

## P-01: Page composition

Desktop: media area roughly 55–60% and information area 40–45%, within a controlled container or edge-to-edge preset. Sticky information is optional and must stop before lower content. A tall information panel must remain fully reachable.

Mobile: media, title/price, color/options, fit/size guidance, purchase controls, concise delivery/return information, details, recommendations. Do not place a long editorial block between size selection and buying.

Information blocks:

1. Product title and actual price state.
2. Optional short fit/benefit text from product data.
3. Color/product-family selection if configured.
4. Size/other variant options and size-guide trigger.
5. Availability message based on real data.
6. Quantity if enabled and valid for the product.
7. Add to cart and optional Shopify-provided accelerated purchase control.
8. Product details, fabric/care, delivery/returns, app blocks.

Merchants may reorder supported information blocks, but form associations, labels, and required controls remain valid. The editor should warn through help text when a composition removes essential purchase content.

## P-02: Media gallery

Support images and Shopify-hosted video in the first release. Confirm any external video/3D requirements before claiming support. Default desktop layout is a primary image with thumbnails; optional stacked media can follow once its sticky behavior is proven. Mobile uses swipeable media with explicit position indicators and accessible previous/next controls.

- Main media is visible without JavaScript and has stable dimensions.
- Do not autoplay product-gallery rotation. Shoppers need time to inspect fabric and fit.
- Changing a variant may select its associated media but should not reset unrelated state.
- Zoom opens an accessible viewer with an obvious close action and bounded image loading.
- Never disable browser pinch zoom to implement a custom gallery.
- Pause video when it is no longer active; do not play multiple product videos simultaneously.
- Thumbnail labels identify their position/content, not filenames such as a camera export ID.
- Defer full-resolution zoom assets until requested.

## P-03: Variant-selection policy

Default proposed policy for apparel: require an explicit size selection unless a valid deep link already identifies a variant. A color can have a sensible initial display, but the primary button must make an incomplete selection obvious. Single-default-variant products need no artificial option picker.

Distinguish these states:

| State | Purchase control | Customer explanation |
|---|---|---|
| Incomplete selection | Choose options action/label | Identify the missing option |
| Resolving selection | Temporarily pending | Keep current choice visible |
| Available variant | Add to cart | Current price and availability |
| Valid but sold out | Disabled add | Sold out; optional real restock integration |
| Combination does not exist | Disabled add | This combination is unavailable |
| Resolution failed | Retry/full-page option fallback | Selection could not be updated |

Do not equate an unavailable combination with a sold-out existing variant. Do not silently submit the previously selected variant while a new selection is loading.

For each selection update, synchronize hidden variant ID, price/compare-at, availability, media, URL, quantity rules, and relevant purchase controls as one coherent state. Ignore out-of-order responses. Validate the selected ID again immediately before submission.

Avoid a full client-side matrix generated from all variants. Use Shopify's [high-variant selection mechanisms](https://shopify.dev/docs/storefronts/themes/product-merchandising/variants/support-high-variant-products), and test beyond the Liquid variant-list limit. Exact partial-render boundaries are settled by the architecture spike.

## P-04: Color variants versus sibling products

These are different data models and must not be confused:

| Model | Behavior | Source |
|---|---|---|
| Variants within one product | Change selected option and associated media/price | Shopify product options |
| Related color products | Navigate to another product or deliberately replace its full context | Explicit product-reference list/metafield |
| Combined listing, if used | Follow the supported associated product URL semantics | Shopify-provided option data |

Do not guess relationships from similar titles or product handles. Sibling links must work without JavaScript. Their visible color names and current state need accessible labels. A product with no configured group simply omits the family selector.

## P-05: Size and fit guidance

Size-guide trigger sits alongside size selection. Default presentation is a dialog/panel using the shared overlay system; an inline expansion may be offered as a section setting after both are tested. No separate ad hoc focus implementation.

Prefer structured measurements rendered as an HTML table with headers and units. An optional garment diagram explains how to measure. An image-only chart needs a meaningful accessible alternative; alt text saying only Size Guide is insufficient for its data.

Content contract:

- Size labels and measurement columns belong to the particular garment/category.
- State whether measurements describe the garment or the body.
- State units and measurement guidance supplied by the merchant.
- Model height/worn size is optional product data, not generic theme copy.
- Unit switching uses a single documented data source and predictable rounding; verify displayed values against the merchant's approved chart.
- On a narrow screen, only the table region may scroll horizontally; the whole page must not.

Dialog must close with Escape and a visible close control, remain usable with large text, and restore focus. Selecting/opening guidance never clears the chosen size.

## P-06: Delivery, care, and trust information

Use configurable content or documented dynamic sources. Separate merchant policy copy from live shipping calculations. A static delivery estimate must not imply a real-time quote. Do not copy the references' Dhaka delivery charges or return periods.

Low-stock messaging is optional and only appears when inventory data supports it and the merchant chooses to expose it. No fake countdowns, viewer counts, or scarcity claims. Badges must have explicit data rules.

Accordions remain usable without JavaScript when possible. Multiple-open behavior is acceptable and should be consistent. An empty care field removes that row rather than displaying a blank accordion.

## P-07: Sticky mobile purchase bar

Optional after the base form passes testing. Show only when the main purchase area is outside view and no keyboard/modal conflicts exist. Include current price and a clear action. If options are incomplete, take the shopper back to/select the missing option; do not add a default size.

Use the same product state and submission path as the main form. Avoid duplicate uncontrolled forms. Account for safe-area bottom inset, chat widgets, consent banners, and the footer. Hide in editor inspection when it obstructs selected content.

## P-08: Recommendations

Start with one recommendation section and a curated fallback collection. Optional tabs can represent actual configured collections, inspired by W&R, but each tab must have a real content source. Empty sources are hidden gracefully. No automatic claim that products are personalized or best sellers without corresponding data.

Use the shared card. Lazy-load below-fold recommendation content without moving already-visible content. Avoid loading every tab's full image gallery at startup.

## Data setup deliverable

Document proposed namespaces/types before coding: fit text, fabric/care rich text, size-guide reference, model image, packshot image, sibling-product list. These are proposed definitions, not existing fields on the user's store. Prefer reusable size-guide metaobjects where the approved data model supports the needed measurement structure. Provide an accessible rich-text/table fallback if structured setup is not completed.

## Acceptance checklist

- Deep-linked variant renders correctly on first load.
- No-selection flow cannot add an unintended size.
- Unavailable, sold-out, and changing-stock cases have distinct correct outcomes.
- Rapid changes under a slow connection never submit stale IDs.
- Main product, featured product, and quick add can coexist without ID collisions.
- Size guide works with keyboard, large text, and phone viewport; selection survives closing.
- Gallery respects vertical scrolling, video pause, and reduced motion.
- Price, URL, image, and button state stay synchronized.
- App blocks survive the chosen fragment replacement strategy.
- Product remains meaningfully usable when JavaScript fails; implement and test the variant-selection fallback explicitly, including its high-variant limitations.
