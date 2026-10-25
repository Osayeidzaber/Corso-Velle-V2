# Promotions and discount codes

Discounts are created and managed in **Shopify admin > Discounts**. The theme never creates,
edits, prices or validates a discount. It only:

1. connects an existing discount code to products (for display and auto-apply),
2. shows that code on product cards and product pages, without a calculated price,
3. sends the code to Shopify's cart when an associated product is in the cart, and keeps it only
   if Shopify reports it as applicable,
4. shows the savings Shopify actually allocated (line discounts, cart discounts, total saved).

Shopify stays responsible for eligibility, value, minimums, customer restrictions, schedules,
combinations, tax, shipping and the final checkout price.

## What a theme can and cannot do

| Capability | Native theme? | Notes |
| --- | --- | --- |
| Apply one or more codes to the cart | Yes | `POST /cart/update.js` with `{"discount": "A,B"}`. The list **replaces** the cart's codes. |
| Know whether Shopify accepted a code | Yes, after applying | `cart.js` returns `discount_codes: [{code, applicable}]`. |
| Know *why* a code was rejected (expired, minimum, not combinable…) | No | Shopify only says `applicable: false`. The cart message lists the possible reasons. |
| Read a code's rules (products, %, minimums, dates) before applying | No | Requires the Admin API, so an app. Liquid has no access to discount definitions. |
| Show a "discounted price" on product cards before the cart | No (not reliably) | Only compare-at prices and automatic discounts already in the cart reach Liquid. |
| Keep codes through checkout | Yes | Codes on the cart carry into Shopify checkout, where Shopify validates them again. |
| Change which products a code really applies to | No | Only Shopify admin does that. Theme associations don't change eligibility. |

Verified on the live store (October 2026) with an anonymous test cart: multiple codes are accepted
in one request, unknown codes come back as `applicable: false`, and codes persist across quantity
changes. Checkout behaviour was **not** tested from the theme.

**Important:** for a code to give a discount on a product, the discount in Shopify admin must
include that product (or apply to all products). The theme association only decides where the
code is *shown and tried*. Keep the two in sync.

## Connecting a code to products

All methods feed one association model (`snippets/promotion.liquid`). When a product matches
several promotions, the highest **priority** wins; ties keep the earlier source (metafield first,
then Promotion 1, 2, 3, 4).

### Theme settings > Promotions (four promotion slots)

Each slot has: **Enable**, **Shopify discount code**, **Applies to** (matching products or entire
store), and any combination of:

- **Products**: Shopify's product picker (up to 50).
- **Product handles**: one per line or comma-separated. This is the most stable text match: titles
  change, handles rarely do.
- **Product title phrases**: one per line, case-insensitive, extra spaces ignored, whole words only.
  `Oversized Tee` matches "The Oversized Tee – Sand" but not "Oversized Teen Hoodie".
- **Product tag or promotion key**: matches a product tag (e.g. `summer-sale`) or the product's
  `custom.promotion` metafield. New products join the promotion just by being tagged.

Plus **Priority** (1–10), **Try this code automatically**, **Show on product cards**, and
optional **Badge text** / **Product page message** (`[code]` is replaced with the code).

### Product metafields (manage from each product page)

Create these once in **Settings > Custom data > Products > Add definition**:

| Name | Namespace and key | Type | Purpose |
| --- | --- | --- | --- |
| Discount code | `custom.discount_code` | Single line text | Connects this product directly to a code, e.g. `TEE20`. |
| Promotion key | `custom.promotion` | Single line text (or list of single line text) | A key that a Promotion slot matches, e.g. `summer-sale`. |

Turn on **Storefront access** for both definitions. The metafield code's priority and card display
are set under Theme settings > Promotions > Product metafield codes.

## Automatic application in the cart

`src/services/discounts.ts` runs after every cart change (and once per page load when the cart has
associated codes and something changed since the last check):

- It tries **one new code per step**, highest priority first, through the same queue as all other
  cart changes, so requests never race.
- If Shopify rejects it, the code is removed again, so no inapplicable code reaches checkout. It is
  not retried until the cart contents or the applied codes change. That handles minimum-spend and
  quantity offers without loops.
- If the new code knocks out a code that applied before (the two can't combine), **When codes
  can't be combined** decides: *Keep the code already applied* (default), or *Use the
  higher-priority promotion* (equal priority keeps the existing one).
- Automatic codes whose products leave the cart, or that Shopify stops accepting, are removed.
- Codes the shopper typed, or that came from a `/discount/CODE` link, are **never** removed or
  displaced automatically. A code the shopper removes is not re-added for that cart.

At most a handful of requests run per cart change, and none run when nothing needs trying.

## Customer-entered codes

The cart drawer and cart page show a **Discount code** field (Theme settings > Promotions > Show
discount code field in cart). The field appears only with JavaScript; without it, shoppers enter
codes at checkout. A shopper's code takes precedence over automatic codes: if it can't combine with
an automatic code, the automatic one is removed and the shopper is told. A rejected code is taken
off the cart and the shopper sees the possible reasons, because Shopify doesn't report which one
applies. A code Shopify accepts without a cart-level saving (such as free shipping) is shown as
"saving shown at checkout".

## What shoppers see

- **Product cards:** sale badge only for a genuine compare-at price, plus an outlined code badge
  ("Code TEE20") when a promotion is connected. Never a calculated price.
- **Product page:** below the price, the code and an honest message ("Added to your cart
  automatically when your order qualifies…"). Toggle per price block.
- **Cart:** each line's Shopify discount allocation (code/title and amount), cart-level
  discounts, a **You save** total from `cart.total_discount`, applied-code chips with remove
  buttons, and "Discounts are confirmed at checkout."

Compare-at prices and discounts are separate: a compare-at saving is shown on the product, and only
real discount allocations count toward **You save** in the cart.

## Testing checklist (dev store)

1. Create `TEE20` (10% off, specific products) in Shopify admin; connect it to one product in
   Promotion 1. Add that product: the cart shows `TEE20` with Shopify's amount.
2. Add a product not in the discount: totals are unchanged and no saving is invented.
3. Give `TEE20` a minimum quantity of 2: with one unit, no code stays on the cart; raising the
   quantity applies it.
4. Create `SUMMER10` without "combines with product discounts" and connect it to another product.
   Add both: the configured conflict rule decides and the cart doesn't flip-flop.
5. Remove the associated product: the automatic code is removed.
6. Expire a code in admin: it is rejected and never shown as applied.
7. Enter an invalid code in the field: you see an error and the existing codes are untouched.
8. Proceed to checkout and confirm the codes and amounts there. Shopify is the final authority.
