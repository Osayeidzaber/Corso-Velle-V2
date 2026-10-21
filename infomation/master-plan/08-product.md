# 08 — Product page: gallery, variants, sizing, purchase, recommendations

Refines and replaces P-01..P-08 in [../05-product-detail.md](../05-product-detail.md). Canvas artboard 06.

## Section structure (`sections/main-product.liquid`)

Two columns ≥990px (media 7/12, info 5/12, sticky info that stops before the section end); one column below. **Info column composition (S8 decides theme blocks vs local blocks):** preferred = theme blocks with static mandatory blocks:

| Block | Type | Static? | Notes |
|---|---|---|---|
| Breadcrumb | `product-breadcrumb` | no | optional |
| Title | `product-title` | **static** `id:"title"` | always rendered |
| Price | `product-price` | **static** | includes unit price, tax note |
| Fit note | `fit-note` | no | dynamic source `custom.fit_note` |
| Colour siblings | `color-siblings` | no | `custom.color_siblings` |
| Variant picker | `variant-picker` | **static** | owns options + size-guide trigger |
| Inventory message | `inventory-note` | no | thresholds; only if enabled |
| Quantity | `quantity` | no | respects quantity rules |
| Buy buttons | `buy-buttons` | **static** | add + `payment_button` (setting) |
| Delivery/returns line | `text` | no | merchant copy/dynamic source |
| Accordion | `product-accordion` | no | repeatable; content from rich text or metafield |
| App | `@app` | — | anywhere in info column |
| Custom Liquid | `custom-liquid` | no | Theme Store requirement-friendly |

All form controls associate to one `<form id="product-form-{{ section.id }}">` via `form` attributes so block order never breaks submission. Help text warns if buy buttons are placed after long content.

---

## PR-01 Gallery (`nk-product-gallery`)

**Purpose.** Inspect fabric, fit and colour.
**Evidence.** Hype 4 thumbs + zoom; Rush thumbs + indicators; W&R 15 media + counter.
**Behaviour.** Phone: horizontal scroll-snap track (native scrolling = vertical page scroll preserved), counter "3 / 7", prev/next buttons (44px), dots optional. Desktop: main + thumbnails (default) or 2-column stacked (setting). Media: images, Shopify video (`video_tag` with poster, muted, controls, playsinline; plays on activation only), external video and 3D only if confirmed (OD). Variant change scrolls/selects the variant's `featured_media` without resetting zoom state. Zoom: tap/click opens `nk-media-zoom` dialog (overlay) with full-res image (`image_url width:2400`) loaded on demand, pinch native (no `user-scalable=no` anywhere), close button + Esc.
**States.** idle, sliding, video-playing (others paused), zoom-open, media-error (placeholder).
**Settings.** Layout (thumbs/stacked/carousel), ratio (adapt/portrait/square), zoom on/off, show counter, hide variant-specific images not matching selected colour (option, off by default — requires alt-text convention or media metafield; document).
**Responsive.** First image `fetchpriority=high`, eager; others lazy; thumbnails 80px widths.
**Motion.** Native scroll-snap; button-triggered `scrollTo({behavior})` = smooth except reduced motion.
**Editor.** Section reload preserves first slide; block select N/A.
**Errors.** No JS: all media in a scrollable list; zoom link opens image URL.
**Services.** overlay (zoom), motion.
**Code.** `snippets/product-media.liquid`, `src/components/product-gallery/*`, `src/components/media-zoom/*`.
**Acceptance.** Vertical swipe on the gallery scrolls the page; horizontal swipe changes slide; screen reader announces "Image 3 of 7, [alt]"; video pauses when slide changes or offscreen; zoom closes with Esc and returns focus.

---

## PR-02 Variant picker (`nk-variant-picker`) — commerce-critical

**Purpose.** Select an existing, purchasable variant explicitly; keep price, media, URL, availability and button in one coherent state.

**Markup (Liquid).** For each `product.options_with_values` option: `<fieldset>` + `<legend>` (option name + selected value), values as radio inputs styled as pills (size) or swatches (colour, `value.swatch.color/image` + visible name). Each value carries `data-option-value-id="{{ value.id }}"`, `available` → normal; `value.variant == nil` → "unavailable combination" style; `!value.available` → sold-out style (strike + `aria-describedby` "sold out"). A hidden `<input name="id" value="{{ selected_variant.id }}">` exists only when a variant is resolved.

**Initial selection policy (D-17/OD-12 default).** If URL has `variant` or `option_values` → render that selection. Else: options named in setting "Require explicit choice" (default `Size`) render **unselected**; others (e.g., Colour) select `selected_or_first_available_variant`'s value. While any required option is unselected, `selected_variant` is treated as null for purchase: button "Select a size".

**State machine.**

```
INCOMPLETE --choose--> RESOLVING --200 matches current request--> READY_AVAILABLE | READY_SOLD_OUT | NO_COMBINATION
READY_* --choose--> RESOLVING
RESOLVING --newer choose--> RESOLVING (abort previous; sequence id)
RESOLVING --error/timeout--> RESOLVE_FAILED (button disabled, retry + full-page link with ?option_values=)
any --product_url differs (combined listing)--> NAVIGATE_SECTION (fetch other product URL, replace whole section, history push)
```

Resolve request: `{{ product.url }}?section_id={{ section.id }}&option_values=<ids>` → replace **only** `[data-region="price"]`, `[data-region="picker"]`, `[data-region="inventory"]`, `[data-region="buy"]` and gallery active index (data attribute), and sticky bar. App blocks are outside replaced regions (S5). Focus restored to the same option value input by `data-option-value-id`. URL updated with `history.replaceState` (`?variant=` when resolved). Event `nk:variant:changed`.

**Submission guard.** Buy buttons read the hidden `id` at submit time and compare with picker's `resolvedVariantId` and `state === READY_AVAILABLE`; mismatch → block + re-resolve.

**Settings.** Option style per option name (pills/swatch/dropdown), explicit-choice options, show sold-out values (strike/hide), size guide trigger placement.

**Responsive.** Pills ≥52×48, wrap; swatches 44px with names on focus/hover and selected name in legend; dropdown option for >12 values.

**Motion.** Selection 120ms border/background change; no motion on price swap.

**Editor.** Re-renders on settings change; deep link test with design mode off.

**Errors.** Covered in the state machine; no JS: options submit as a GET form to `product.url` with `option_values`… fallback: a `<select name="id">` of `product.variants` rendered inside `<noscript>` for ≤250 variants, and for >250 a "choose options" GET form that reloads the page with selection (spike S3 validates).

**Code.** `blocks/variant-picker.liquid`, `snippets/option-values.liquid`, `src/components/variant-picker/*`, `src/components/product-form/*`.

**Acceptance (Q-03/Q-04).** Deep link to `?variant=` renders that variant fully; no-size add impossible; sold-out vs non-existent combination copy differ; rapid colour/size changes on throttled 3G → final UI matches final choice and submitted ID; 300-variant fixture behaves the same; main product + featured product + quick add on one page don't collide.

---

## PR-03 Colour families: variants vs siblings vs combined listings (OD-03)

| Model | Behaviour | Source |
|---|---|---|
| Colour option within product | PR-02 swatches; media follows variant | product options |
| Sibling products | `color-siblings` block: links (image/swatch + name), current marked `aria-current`; normal navigation | `custom.color_siblings` (list.product_reference) + each product's `custom.color_name` / swatch |
| Combined listing (Shopify Plus feature) | `product_option_value.product_url` differs → NAVIGATE_SECTION | Shopify |

Never infer families from titles/handles. Cards: sibling count shown as "n colours" only if siblings metafield is set.

---

## PR-04 Size guide (`nk-size-guide`)

**Purpose.** Size confidence at the decision point.
**Evidence.** Hype inline image; Rush image modal (Esc failed); W&R structured table + units.
**Data (D-15, S7).** Product metafield `custom.size_chart` → metaobject `size_chart`:

| Field | Type | Notes |
|---|---|---|
| `title` | single line | "Tees — regular fit" |
| `measurement_basis` | single line, choices `garment`/`body` | shown as caption |
| `unit` | choices `cm`/`in` | source unit |
| `table` | JSON | `{"columns":[{"key":"chest","label":"Chest"}],"rows":[{"size":"S","values":{"chest":52}}]}` validated in Liquid; invalid → fallback |
| `notes` | rich text | between-sizes advice |
| `how_to_measure` | rich text | optional |
| `diagram` | file (image) | optional with `diagram_alt` |
| `fallback` | rich text | used when table absent |

Category default: section setting "Default size chart" (metaobject picker) when the product has none. If the store cannot use metaobjects (e.g., future Theme Store constraint), fallback: page picker with rich content.

**Behaviour.** Trigger = button inside the size `<legend>` row (44px tall hit area). Opens dialog (phone: bottom/full sheet; desktop: right drawer 520px). Table: `<table>` with `<caption>`, `<th scope>`; current selected size row highlighted + "Your selection"; unit toggle (`role=group` of 2 `aria-pressed` buttons) converts from source unit with documented rounding (1 decimal for in, integer cm) — conversion shown only if merchant enables it. Table in its own `overflow-x:auto; tabindex=0` region with label. Closing never changes selection; focus returns to trigger.
**States.** closed/open/no-data (trigger hidden)/invalid-data (fallback content).
**Editor.** Selecting the variant-picker block with "preview size guide" toggled opens it.
**Acceptance.** Q-10; 200% zoom readable; VoiceOver reads headers per cell; values match merchant chart in a fixture comparison.

---

## PR-05 Buy buttons & inventory

- Add button labels by state: "Select a size" · "Add to cart" · "Sold out" (disabled) · "Unavailable" (disabled) · "Updating…" · "Adding…".
- `{{ form | payment_button }}` only when setting on and the variant is available; styled via CSS variables only.
- Inventory note: off by default; when on, shows "Only N left" only if `variant.inventory_management == 'shopify'` and `inventory_quantity <= threshold` and policy is `deny`. Pre-order/continue-selling wording from setting (OD-10).
- Quantity respects `variant.quantity_rule` (min/max/increment) and shows rule text.
- Errors from `/cart/add.js` 422 shown in `[data-region="buy-error"]` with `role="alert"`.

## PR-06 Sticky buy bar (`nk-sticky-buy`, P1)

Shows when main buy region is out of view (IO) **and** no overlay open **and** `visualViewport` height isn't reduced by a keyboard **and** not in design-mode selection. Mirrors picker state (reads `nk:variant:changed`); action when INCOMPLETE = scroll to and focus the size fieldset; when READY_AVAILABLE = submit the main form (same path). Height 64px + safe-area; adds `padding-bottom` to body while visible; floating contact widgets get `--nk-bottom-offset`.
Acceptance: never covers the footer's last link (body padding); hides when keyboard opens on Android/iOS; same request as main add.

## PR-07 Accordions & content

`product-accordion` blocks with heading + rich text or metafield source (`custom.fabric`, `custom.care`); empty source → block renders nothing. Uses `nk-disclosure`.

## PR-08 Recommendations (`sections/product-recommendations.liquid`)

Single list (default): `routes.product_recommendations_url?product_id=&limit=8&section_id=&intent=related` loaded when 200px from view; fallback collection setting when empty. Tabs variant (P1, `nk-tabs`): each tab block = source (`related` | `complementary` | collection). No "personalised" or "best seller" wording unless the source is that collection. Uses product card.
