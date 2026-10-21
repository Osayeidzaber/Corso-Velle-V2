# 09 — Cart, commerce service, integrations, and failure recovery

Refines and replaces K-01..K-08 in [../06-cart-and-commerce.md](../06-cart-and-commerce.md). Canvas artboard 07 (and 05 for quick-add outcomes).

## CA-01 Cart service (`src/services/cart.ts`) — commerce-critical

**Responsibilities.** All cart mutations from any component; serialization; authoritative state distribution; recovery.

**Queue model.**
- One FIFO queue of operations: `add`, `change`, `update`, `note`, `clear` (clear only from cart page action, confirm).
- `change` ops for the same `key` that are still *queued* (not in flight) coalesce into one op carrying the latest absolute quantity.
- Each op carries `{opId, sourceId, kind, payload, sections[]}`; `sections` = ids of rendered cart regions currently on page (cart drawer, cart icon bubble, main cart items, main cart footer — ≤5) + `sections_url = location.pathname`.
- Before executing a `change`, the service verifies `key` exists in the latest known cart; if absent → reconcile (GET `/cart.js`) and map by `variant_id` + `properties` hash only if exactly one line matches; else drop op with a user-visible "Cart changed, please review" message.

**Request.** `POST {{ routes.cart_add_url }}.js` etc. using routes from `nk-config` (locale-aware); `Content-Type: application/json`; timeout 15s.

**Outcome handling.**

| Outcome | Detection | Action |
|---|---|---|
| Success | 200 JSON | Update `lastCart` (from response or follow-up GET for add, which returns items not full cart), replace returned section HTML via `sections.replace`, emit `nk:cart:updated`, announce |
| Section HTML null/missing | `sections[id] === null` | Keep mutation result; fetch `/cart.js` for count/subtotal; show "View cart" link in drawer; **do not retry the mutation** |
| Business rejection | 422 (add), 400 (change) | Emit `nk:cart:error` with Shopify `description`/`message`; UI near source; re-fetch cart for change ops |
| Throttled | 429 | Error message "Too many requests, try again in a moment"; no auto retry |
| Ambiguous | timeout, network error after send, 5xx | Mark op `ambiguous`; GET `/cart.js` (retry GET up to 2× with backoff); compare with pre-op snapshot (quantity of matching line by variant + properties) → resolved success or failure; if still unknown → "We couldn't confirm. Check your cart." + link; never auto re-POST |
| Offline before send | `navigator.onLine === false` | Don't send; message; keep UI state |

**Events.** `nk:cart:pending {pending}`, `nk:cart:updated`, `nk:cart:error`; accepts `nk:cart:refresh` (apps) → GET + section render.

**Unit tests.** Coalescing, key refresh, stale key mapping, ambiguous reconciliation, ordering, sections null.

## CA-02 Cart drawer (`sections/cart-drawer.liquid`, `nk-cart-drawer`)

**Purpose.** Confirm adds and edit without losing browsing context.
**Behaviour.** Opens on cart icon (overlay modal; right side ≤420px desktop, full-width phone) and after successful add if setting `after_add = drawer`. Header: "Cart (n)" + close. Status line after add ("Added: title — options", polite announcement). Line list (CA-04). Footer pinned: subtotal (from `cart.total_price` and `cart.cart_level_discount_applications`), tax/shipping note (merchant locale string, defaults to Shopify's `taxes_included`/shipping text keys), Checkout submit (`name="checkout"` form to `routes.cart_url`), View cart link, accelerated checkout buttons only if `additional_checkout_buttons` and setting enabled. Optional note (CA-05).
**States.** empty · loading (first open when HTML not prerendered — drawer is prerendered in layout so normally none) · ready · mutating (affected line `aria-busy`, checkout disabled) · line-error · fragment-failure · ambiguous.
**Responsive.** Header/footer fixed, list scrolls; footer accounts for safe area; note textarea scrolls into view on focus via `visualViewport`.
**Motion.** Overlay token; added line flash 600ms background tint (Motion ≠ Off).
**Editor.** Cart drawer section in header group or layout `{% section 'cart-drawer' %}` (static) — settings: after-add behaviour, empty state collections, show note, show accelerated buttons. Opening in design mode via block select only.
**Errors.** If drawer HTML fails to load, cart icon navigates to cart page (link has real href).
**Code.** `sections/cart-drawer.liquid`, `snippets/line-item.liquid`, `snippets/cart-footer.liquid`, `src/components/cart-drawer/*`, `src/components/cart-items/*`.
**Acceptance.** Q-05, Q-06, Q-07; open drawer never mutates cart; drawer survives editor reload without stuck lock.

## CA-03 Cart page (`templates/cart.json` → `sections/main-cart.liquid`)

Same `line-item` snippet and `nk-cart-items` component. Works with JS off: `<form action="{{ routes.cart_url }}" method="post">` with `updates[]` inputs per line (indexed) + Update button (hidden when JS enhances) + remove links `{{ item.url_to_remove }}` + checkout submit. Empty state with configured link. Optional sections below (recommendations, rich text). Acceptance: full journey with JS disabled to checkout handoff.

## CA-04 Line item (`snippets/line-item.liquid`)

Image link, title link, `item.options_with_values` excluding `Default Title`, `item.properties` not starting with `_`, selling plan name, line-level discounts (`item.line_level_discount_allocations`), `item.final_line_price` + original if different, unit price, quantity stepper (− / input type=number inputmode=numeric / +; respects `item.variant.quantity_rule`; max from inventory only if server says so via error), remove button, line error region. `data-line-key="{{ item.key }}"`, `data-line-index="{{ forloop.index }}"`.
Focus: after replace, focus returns to the same control in the same line (by key); after removal → next line's title link or empty-state heading.

## CA-05 Optional modules (all off by default)

Cart note (saved through queue, debounced 600ms on blur), cart recommendations (complementary intent, below footer CTA on desktop, inside list end on phone), free-shipping progress (**only** with OD-08 approval of a single-market threshold rule; hidden for other currencies/markets), discount code field (P2, uses Shopify `/discount/CODE` or Cart AJAX `discount` param if verified at implementation), gift wrap product (real product variant added explicitly).

## CA-06 Checkout handoff

The theme does not customise checkout (Checkout Extensibility). Handoff = cart form submit `name="checkout"` (page/drawer) or accelerated buttons. Test on dev store in **test payment mode**: correct lines, quantities, discounts and notes reach checkout; return to store via browser Back shows the same cart. No real payment.

## CA-07 Integration hooks

Documented: events above; `nk:cart:refresh`; section IDs of cart regions; product form `id` convention; where app blocks may live (product info, cart page sections, footer). Test with the actual apps from OD-09; no generic compatibility claim.

## Failure matrix (tests)

| Scenario | Expected |
|---|---|
| Double-click add | 1 POST; button pending |
| Inventory changed after render | 422 message near form; picker refreshed |
| Add response lost (offline after send) | Reconcile → correct message; no duplicate |
| 1→2→3 rapid on same line | Final confirmed qty 3; ≤2 requests |
| Remove while another change queued | No op applied to wrong line |
| Same variant, different properties | Correct line edited by key |
| Section HTML null | UI recovers; no re-mutation |
| Drawer removed by editor reload | Lock released; service intact |
| JS disabled | Cart page + checkout work |
| Locale `/fr/` | All cart routes prefixed; money from Liquid |
