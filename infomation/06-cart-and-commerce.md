# Cart, mutation handling, and checkout handoff

Status: proposed behavior. No cart mutations or purchases were performed on reference stores.

## Chosen experience

Provide a cart drawer as the primary preset interaction and a complete cart page as the reliable direct destination/fallback. Hype Town and Rush Mode demonstrate dedicated cart pages; W&R exposes a cart overlay. Our choice is configurable, and both presentations use one shared service and shared line-item rendering.

The drawer is not a custom checkout. It prepares the cart and hands off to Shopify's supported checkout flow.

## K-01: State model

| State | Required UI |
|---|---|
| Empty | Clear empty message, configured shopping link, no active-looking checkout action |
| Loading initial state | Labelled loading status without fake line items |
| Ready | Items, selected options, prices, quantities, subtotal, appropriate policy note |
| Mutating | Pending indicator on affected controls; prevent conflicting submissions |
| Confirmed update | Authoritative server-rendered lines/totals/count |
| Recoverable error | Inline explanation, retained context, retry or cart-page route |
| Unknown mutation outcome | Reconcile with current cart before offering another add |

Opening the drawer must not mutate the cart. Closing it while a request is pending must not cancel the user's operation in a way that encourages blind retries. Keep result handling alive in the cart service and announce the outcome appropriately.

## K-02: Add behavior

1. Validate that a current, purchasable variant and allowed quantity are selected.
2. Mark only the relevant submission pending and block duplicate click submission.
3. Send the cart request using locale-aware routes.
4. Consume authoritative returned state/fragments.
5. Update drawer, header count, and cart page regions if present.
6. Open the drawer or display confirmation according to the merchant setting.
7. On rejection, show the actual useful error near the initiating form and preserve chosen options.

No success animation until the server confirms the operation. A timeout after a POST is ambiguous: it may have succeeded. Re-fetch the cart and reconcile instead of automatically replaying the add.

## K-03: Quantity and line identity

Serialize mutations through a shared queue. Coalesce rapid edits to the same line where safe, but preserve the latest intended absolute quantity. Never let independently issued responses overwrite newer state.

Identify existing lines using their current cart line keys, not merely product/variant IDs. The same variant can appear in separate lines because of properties or selling plans. Refresh keys from authoritative responses because they can change. If a queued operation refers to a removed/stale line, reconcile before applying it.

Use clear pending feedback, maintain focus after line replacement, and move focus to a sensible neighbor when a line is removed. Removing the last line transitions to the real empty state and updates header count.

Shopify's [Cart API](https://shopify.dev/docs/api/ajax/reference/cart) documents locale-aware requests, line updates, and bundled section rendering. The queue/recovery policies here are our proposed implementation safeguards.

## K-04: Fragment contract

Keep drawer content and cart-count output within known renderable sections. Request only the few required fragments, using actual section identities. A mutation can succeed even if a requested UI fragment is missing or cannot be rendered: do not repeat the mutation just to obtain HTML.

Validate returned fragments before replacing DOM. If markup is unavailable, reconcile cart state and provide a cart-page fallback. Preserve the drawer shell/focus-management layer while updating its contents. Reinitialize only replaced component regions.

Maintain ordinary product/cart forms for fallback behavior. Test the fallback rather than assuming the presence of a form tag alone makes all custom variant choices work.

## K-05: Line-item contents

- Product image, title, and link.
- Selected option names/values, excluding meaningless default labels.
- Relevant public properties and selling-plan information when supported.
- Current and original price/discount information from Shopify.
- Quantity control and remove action.
- Line-specific errors.

Do not recompute discounts or currency conversion in browser code. Render subtotal and discount information from the cart. Shipping/tax copy must reflect store configuration; the theme cannot promise a total that checkout has not calculated.

## K-06: Optional modules

| Module | Policy |
|---|---|
| Cart note | Optional, labelled, saved through the shared queue |
| Recommendations | Below essential cart controls; not allowed to delay checkout |
| Free-shipping progress | Off by default; only enabled with verified market/currency/rule assumptions |
| Discount-code field | Separate scoped implementation if requested and supported; no fake local discount calculation |
| Gift wrap/add-on | Real configured product/service with explicit selection, never silently added |
| Payment icons | Actual enabled payment methods, not decorative claims |

A threshold alone cannot describe every shipping zone, profile, discount, or market rule. Do not advertise free shipping unless the selected implementation can support the store's actual conditions.

## K-07: Phone behavior

Use full available width on narrow phones or a bounded drawer on wider screens. Header/close control remains reachable; items scroll in the middle; subtotal/action region must not cover the final item. Safe-area padding accounts for the home indicator.

Test the note field with the keyboard open, long product titles, several line items, zoomed text, and a consent/chat widget. The drawer must be dismissible after rotation and after returning from the background. Quantity controls use comfortable touch targets.

## K-08: Integration hooks

Publish a documented cart-refresh/mutation interface for supported app integrations. Do not assume an app dispatches the same custom events as the theme. Avoid a global MutationObserver that constantly rebuilds the entire cart to guess changes.

Test the actual review, bundle, subscription, or upsell apps chosen by the merchant. A generic app-block claim is not evidence of compatibility with every app. Preserve required platform output in the layout and checkout handoff.

## Failure scenarios to test

| Scenario | Expected behavior |
|---|---|
| Add double-click | One intended add while pending |
| Inventory changes after page render | Server error shown; selection retained and availability refreshed |
| Add response lost | Reconcile current cart; no automatic duplicate add |
| Quantity 1→2→3 rapidly | Final confirmed quantity matches latest accepted intent |
| Remove while another update is queued | No update applied to the wrong line |
| Missing section HTML after successful mutation | Recover UI without replaying mutation |
| Identical variant with different properties | Correct individual line edited |
| Cart drawer removed by editor refresh | No stuck scroll lock; service remains coherent |
| JavaScript disabled | Usable cart page and checkout handoff |
| Locale/market changes | Correct routes and authoritative money formatting |

Completion requires these tests on a development store, including a test checkout handoff. The current document makes no claim about payment processing or completed orders.
