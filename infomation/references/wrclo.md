# Wrongs & Rebels: storefront reference audit

Reviewed: 21 October 2026, Asia/Dhaka. Purpose: capture the site's useful interaction patterns for an original reusable theme.

## Evidence and limits

A delegated browser researcher scrolled the homepage through its footer and exercised collection controls, then reached a usage limit before writing the report. The primary researcher supplemented those reported observations with the live product page, size-guide opening, search opening/closing, and empty-cart drawer. Earlier primary inspection also covered the homepage and collection visually.

**Observed** identifies browser evidence or explicitly reported delegated evidence. **Inferred** is interpretation. **Proposed** identifies our own theme design.

The browser views were desktop-sized. Mobile emulation was not exposed to the research agent. No physical-phone, Shopify editor, performance benchmark, complete keyboard/screen-reader, or checkout test occurred. Exact animation timings and backend implementation remain unknown. No products were added and no personal information submitted.

## Pages inspected

- [Homepage](https://wrclo.com/): complete delegated scroll from campaign through footer.
- [New Arrivals](https://wrclo.com/collections/new-arrivals): category navigation, grid, model switch, filter drawer.
- [Example product](https://wrclo.com/products/wr-light-wash-fig-boxy-tshirt): gallery, color-family links, sizes, size guide, information/recommendation inventory.
- Search and empty cart opened through the visible product-page header controls.

## Visual identity

**Observed:** the homepage puts a thin announcement band and transparent centered-logo header over a near-full-screen fashion photograph. Sparse navigation sits left, utility icons right, and campaign copy/links toward the lower left. Interior shopping pages use a solid light header and restrained dark text. Product imagery occupies much more area than decorative card chrome.

**Inferred:** the premium feeling comes from image scale, spacing, low visual clutter, and consistent navigation placement. This can be adapted without copying photography, wordmark, exact page composition, or theme source.

## Homepage inventory

| Order | Observed component | Behavior/composition | Proposed adaptation |
|---|---|---|---|
| 1 | Announcement ticker | Repeated campaign/brand message | Optional controlled ticker with static alternative |
| 2 | Overlay header | Centered logo, two shopping groups left, account/search/cart right | Explicit solid/overlay/sticky state model |
| 3 | Campaign hero | Large image, concise campaign heading, two links | Original campaign composition with mobile crop |
| 4 | Category imagery | Three edge-to-edge category images | Configurable collection tiles |
| 5 | New Arrivals | Very long four-column desktop product grid, ending with a partial row and View all | Bounded homepage products; full browsing in collection |
| 6 | Footer | Compact dark social and policy/support footer | Configurable footer blocks without unnecessary bulk |

This order is from the delegated full scroll of the [homepage](https://wrclo.com/). The long grid is a notable merchandising choice, not a recommendation to repeat the same number of cards.

## Header/menu evidence

**Observed:** homepage transparent treatment and interior solid treatment. Shop and Collections are exposed as expandable controls; nested category/collection structure is present in page content.

**Limit:** the delegated attempt to expand Shop through the exposed browser action navigated to New Arrivals instead of reliably opening the dropdown. The earlier primary attempt also navigated to that collection. Therefore the actual hover/menu transition and keyboard path were not established. Do not describe an untested mega-menu animation as verified.

**Proposed:** separate a top-level destination from its disclosure control. Support explicit click/keyboard/touch behavior, with hover only as an enhancement. See [header plan](../03-header-navigation-search.md).

## Collection experience

**Observed:** New Arrivals displays a collection heading/count, category links, product count, Model toggle, Filter trigger, and an image-led four-column grid. Product cards show title, price, color-count information, and sold-out state when applicable. Some card media exposes gallery previous/next controls.

**Exercised by delegated researcher:** the Model toggle changes packshot imagery to model imagery. Filter opens a right-side panel with a blurred/dimmed background and controls for sort, size, fabric, color, price, and availability, plus an anchored View Results action.

**Not established:** resulting URL/history after applying multiple filters, no-results state, touch gestures, card-gallery loading cost, or whether all products have complete paired media.

**Proposed:** adopt an optional packshot/model mode only with explicit merchant media mapping and a fallback for missing images. The control changes presentation, not the result set. Filtering uses Shopify's actual filter data and meaningful URLs; blur is optional if it hurts phone performance.

## Product-page hierarchy

The [inspected product](https://wrclo.com/products/wr-light-wash-fig-boxy-tshirt) presents a large gallery on the left and a narrower right information panel with title/price, color-family image choices, sizes/guide, fit text, add button, and information accordions.

| Component | Observed evidence | Implication for our theme |
|---|---|---|
| Gallery | Fifteen media positions, previous/next controls, counter | Bound initial image loading; keep position understandable |
| Color choices | Five small product-image links, including separate sibling product URLs | Distinguish sibling products from ordinary variants |
| Size options | Radio-style controls with selected state and unavailable-looking options | Give clear names and actual availability semantics |
| Fit guidance | Model information adjacent to sizing | Optional product-specific data, not generic global copy |
| Size guide | Find Your Size opens a panel over the information region with diagram and measurement table | Accessible structured guide near the decision point |
| Unit UI | cm/in labels and a switch visible; inch values appeared in opened table | Unit control exists; conversion correctness not tested |
| Purchase | Large dark Add to cart action | Correctness and state feedback matter more than decorative motion |
| Details | Product/shipping disclosure controls | Dynamic content with reliable empty-state behavior |
| Recommendations | Recommended/Best Sellers/New Arrivals tabs and cards | Real data sources per tab; avoid fake personalization claims |

Color links prove that at least this presentation includes separate product destinations. They do not prove how the merchant authored the family relationship internally.

## Size-guide interaction

**Observed:** clicking Find Your Size exposed a garment diagram and a real measurement table in the accessibility tree. A close icon was visible near the upper-right of the panel. The interface appeared over the right information area rather than replacing the entire product page.

**Unverified:** Escape, complete focus management, unit-toggle arithmetic, narrow-screen table behavior, and accurate size measurements. The primary close-icon attempt was followed by opening search; full isolated dismissal semantics were not established.

**Proposed:** support the useful structured-table concept, with explicit accessible headers, units, keyboard dismissal, and local table scrolling on phones. Preserve selected options while the guide is open.

## Search overlay

**Observed:** clicking the search icon opens a full-width input strip below the header, with a close control and a blurred/dimmed background. Closing through the visible control returns to the product view. The accessibility state reports the search trigger expanded while open and collapsed after closing.

**Unverified:** predictive results, query submission, error/no-results states, and physical-phone keyboard behavior. The presence of a predictive-search-named container is not proof that all predictive behavior works.

**Proposed:** retain the clear search entry, then specify loading/results/empty/error behavior and keyboard navigation independently.

## Empty-cart drawer

**Observed:** clicking the cart icon opens a right-side white drawer without navigating away from the product URL. It shows a heading/count, close control, empty message, and shopping link. The background becomes blurred/dimmed. This directly differs from Rush Mode's dedicated cart navigation.

**Unverified:** adding products, quantity editing, populated drawer, discounts, checkout, and cart error handling. Those operations were intentionally not performed on this reference store.

**Proposed:** use a drawer for continuity while retaining a complete cart page. Keep a shared overlay controller, a shared mutation service, and authoritative totals. The observed visual drawer alone does not establish the correct technical design for those operations.

## Motion evidence

The reference visibly changes between closed and open search/cart/size-guide states, and the announcement content moves. Exact duration, easing, interruption handling, reduced-motion behavior, and smoothness under phone load were not measured. Do not infer an animation library from the appearance.

Our proposed motion system supplies its own bounded timing tokens, reduced-motion mode, and editor overrides. Background blur must be optional and profiled on real hardware.

## Carry-forward decisions

| Pattern | Adopt | Improve/limit |
|---|---|---|
| Hero overlay header | An eligible campaign mode | Contrast and state transitions are explicit |
| Image-led cards | Consistent gallery/media proportions | Avoid loading full galleries for every visible card |
| Model/packshot toggle | Optional feature with real content contract | Fallback for missing paired images |
| Filter drawer | Reusable phone/desktop panel | URL/history, stale requests, no-results tests |
| Structured size guidance | Product-specific measurement data | Full keyboard/touch/large-text testing |
| Cart drawer | Fast continuation of browsing | Keep full cart page and robust mutation handling |
| Long home grid | Useful evidence of product emphasis | Use bounded default and reachable footer |

## Research still needed during design validation

Mobile navigation and galleries, actual dropdown behavior, filter application/history, search results, populated cart, reduced motion, physical-device performance, and complete accessibility. Editor compatibility must be tested in our own theme; it cannot be inferred from W&R's storefront.
