# Hype Town: storefront reference audit

Reviewed: 21 October 2026, Asia/Dhaka. Purpose: identify observed components and translate their useful principles into an original reusable Shopify clothing theme.

## Evidence and limits

The delegated browser researcher scrolled the complete homepage and reported its section order and scrolling behavior before reaching a usage limit. The primary researcher supplemented that work with the live homepage accessibility tree, screenshots, product-page inspection, size-chart expansion, search-panel opening, collection inspection, and the loaded empty cart.

**Observed** means directly inspected in this session or explicitly reported by the delegated browser researcher. **Inferred** describes interpretation. **Proposed** means our future theme, not an existing capability of Hype Town.

Desktop screenshots were approximately 1265×712. Mobile viewport emulation was not exposed to the research agent; no physical-phone, editor, performance, or complete accessibility test was performed. Animation timing/easing and internal implementation are unverified. No product was added, no account opened, and no newsletter/order form submitted.

## Pages inspected

- [Homepage](https://hypetownbd.com/): top-to-footer delegated review, supplemented by primary browser inspection.
- [Shirts collection](https://hypetownbd.com/collections/shirts): heading, category navigation, sort/price controls, initial product grid.
- [Resort-shirt product](https://hypetownbd.com/products/hand-stitched-resort-shirt-beige): media, purchasing controls, inline size guide, lower-content inventory.
- [Empty cart](https://hypetownbd.com/cart): loading and resolved empty state.

## Visual identity and page rhythm

**Observed:** a slim black announcement ticker sits above a white header with centered wordmark, left shopping/navigation labels, and right search/account/tracking/cart actions. Large campaign media fills the first screen below the header. Product areas use white surfaces, fairly compact labels, portrait imagery, and clear price/size information. Lower content alternates shopping and brand storytelling, ending in a substantial dark footer.

**Inferred:** its appeal comes from the rhythm between immersive campaign imagery and immediate shopping grids. The theme plan should preserve that rhythm without requiring every merchant to populate an equally long homepage.

## Homepage inventory in observed order

| Order | Component | Observed content/behavior | Proposed adaptation |
|---|---|---|---|
| 1 | Promotional ticker | Repeating sale message in a thin black strip | Optional movement, pause and static fallback |
| 2 | Centered-logo header | Shop/Collections left; utility actions right | Configurable header layout using real menus/routes |
| 3 | Campaign hero | Full-width changing media with campaign label, headline, and shopping CTA | Hero supporting still/video/poster and mobile crop |
| 4 | New-drop products | Eight products, card actions, visible size row, View all | Bounded featured collection using shared cards |
| 5 | Denim spotlight | Category banner followed by four products and View all | Reusable banner plus independently configurable collection |
| 6 | Shirt spotlight | Same banner/grid rhythm for shirts | Same components with different sources |
| 7 | T-shirt spotlight | Banner, sale messaging, four product cards | Real sale data and merchant campaign copy |
| 8 | Accessories spotlight | Category banner and four smaller accessory products | Support default-variant products without fake size pickers |
| 9 | Campaign pair | Two equal promotional tiles | Repeatable linked campaign-card section |
| 10 | Membership invitation | Strong blue brand callout | Content block linking to a real configured membership destination |
| 11 | Reels/shorts rail | Portrait media items and mute/unmute controls | Optional later video section with controlled loading |
| 12 | Lower ticker | Brand/community message before footer | Optional independent message band |
| 13 | Footer | Brand, category links, newsletter, company/utility links, contact/social information | Menu/data-driven footer with no hardcoded business details |

Source: live [homepage](https://hypetownbd.com/) and delegated full-page scroll observations. Counts describe this review, not permanent catalog facts.

## Header and scrolling

**Observed by delegated researcher:** header disappears during downward scrolling; the floating WhatsApp action remains visible. The primary product/collection screenshots also show the floating contact control near the lower-right edge.

**Not verified:** exact upward-reveal threshold, hover menu behavior, nested mobile navigation, keyboard handling, sticky re-entry animation, and reduced-motion behavior. Shop and Collections display dropdown indicators, but those indicators alone are not evidence of a tested mega-menu.

**Proposed:** model header visibility explicitly. Re-show it for keyboard focus or open overlays; never let sticky behavior hide a focused control. Make the floating contact action optional and test overlap with sticky purchase/cart/consent controls on phones.

## Product-card observations

**Observed:** image/title links, Quick Add buttons, wishlist controls, prices, and a short size row are present. Sale cards include a discount label and original/current prices. The delegated researcher observed hover quick-add presentation; the accessibility tree exposes alternate product images. The full quick-add flow and wishlist persistence were not exercised.

**Proposed:** keep product image navigation separate from option-selection controls. Provide an explicit touch-accessible quick-add action. Availability text must reflect actual options, while a click still resolves a valid variant. A wishlist icon is omitted until a real persistence model exists.

Do not mistake an accessory's free-size label for a zero price. The future theme should use appropriate option labels supplied by product data rather than hardcoding clothing sizes into every card.

## Search panel

**Observed:** clicking Search opens a wide white input strip below the top area with a dimmed page behind it. An input and submit control appear. Typing a generic product query was attempted; a predictive result set was not confirmed in this short interaction. Search completion, Escape dismissal, and focus trapping remain unverified.

**Proposed:** a similar clear search entry can be retained, with a fully specified result/loading/empty/error model and normal search-form fallback. See [navigation/search plan](../03-header-navigation-search.md).

## Collection page

**Observed:** the shirts collection loads a heading, wrapping category pills, a sort selector, minimum/maximum price fields, Clear, and a four-column desktop grid. The selected category has a dark-filled pill. The sort control exposes alphabetical, price, and newest ordering. The page settled on a URL carrying `sort=newest`.

**Not exercised:** changing sort/price, filtered-to-zero state, pagination, browser Back restoration, or mobile wrapping. No claim is made that its filtering uses Shopify's native filter API.

**Proposed:** preserve visible category navigation as merchandising navigation while implementing actual Shopify filters separately. Category links and filter chips should not be conflated. Native Shopify URL conventions and server-rendered result state will govern our theme, irrespective of the reference's implementation.

## Product detail

The [inspected shirt](https://hypetownbd.com/products/hand-stitched-resort-shirt-beige) resolves after an initial loading state into a large left media area and a right information/purchase area.

| Component | Observed | Verification boundary |
|---|---|---|
| Breadcrumb | Home, garment category, subcategory, product | Narrow wrapping not tested |
| Gallery | Four thumbnail buttons and large imagery with zoom affordances | Zoom and touch gestures not exercised |
| Title/price | Large title and prominent price | Variant-price changes not tested |
| Delivery box | Local/regional charges and estimates above options | Business rules not validated or adopted |
| Size buttons | Available choices plus visibly disabled/struck unavailable sizes | Inventory correctness not checked |
| Size chart | Clicking Size Chart inserts an image guide inline, pushing quantity/actions downward | Not a modal in this observed path |
| Chart contents | Garment-measurement diagram and tables for two units | Data accuracy and accessible alternative not verified |
| Stock message | Low-stock text visible | Whether dynamically inventory-backed is unknown |
| Quantity/actions | Quantity stepper, Add to cart, Buy now | No mutation performed |
| Information | Product details, shipping/return, care accordion controls | Full expansion not tested |
| Recommendations | Related-products area reuses product-card pattern | Recommendation source unknown |

**Proposed:** use the strong fit/purchase hierarchy, but a structured accessible size table is preferable to relying solely on an image. Our size-guide placement must not unexpectedly bury buying controls on a small phone. Delivery and stock statements require the merchant's real data.

The loading state is an observation of this visit, not a measured performance finding or proof of any particular frontend framework. Our plan renders essential product content through Liquid from the outset.

## Empty cart

**Observed:** a dedicated cart page has a title, item count, cart/checkout progression labels, then a resolved empty-state illustration/message and shopping link. A spinner appeared while content loaded. The primary researcher waited for the empty state before recording it.

**Not tested:** populated cart, discounts, line editing, cart drawer after add, or checkout. Presence of a checkout navigation label does not establish a working empty-cart checkout flow.

**Proposed:** keep a real cart page alongside an optional drawer. Empty carts should give a clear route back to products, and controls must not suggest a purchase is ready when there are no items.

## Lower-page component lessons

The repeating spotlight pattern deserves reusable sections, not one custom section per category. The campaign pair needs explicit destinations. The membership callout is content until a backend is chosen. Reels need poster-first loading, offscreen pause, and one active player. Newsletter needs real success/error handling. Footer links/contact details must come from merchant configuration.

The floating contact button and several moving/media regions can compete for phone screen space. Treat those as options, not mandatory ingredients of a premium theme.

## Carry-forward decisions

| Carry forward | Improve | Leave out until supported |
|---|---|---|
| Campaign-to-product rhythm | Explicit mobile and keyboard interactions | Wishlist persistence |
| Centered branding option | Accessible structured size guidance | Membership/raffle functionality |
| Category spotlights | Bounded product/media loading | Full reels/shoppable-video system |
| Visible size availability | Real stock/delivery rules | Unverified dynamic business claims |
| Substantial configurable footer | No empty or generic campaign destinations | Hardcoded contact/currency/category data |

## Research still needed during design validation

Physical-phone navigation, actual quick-add flow, predictive search completion, menu hover/keyboard states, populated cart, reduced motion, and measured performance. Theme-editor compatibility cannot be determined from this storefront and must be proven in our implementation.
