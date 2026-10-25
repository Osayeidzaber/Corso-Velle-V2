# Settings reference

[Back to README](../README.md) · [Customization](../CUSTOMIZATION.md) · [Development](../DEVELOPMENT.md)

The complete inventory of global settings, section settings, blocks and presets. Use this reference to look up exact IDs, choices and schema defaults; start with the customization guide for practical instructions. Search this page for an editor label or source filename.

- [Theme settings](#theme-settings)
- [Theme sections](#theme-sections)
- [Theme blocks](#theme-blocks)

<!-- schema-reference:start -->
## Implemented schema reference

Generated from current source schemas with `node scripts/customization-reference.mjs`. Run with `--check` to detect stale tables. Do not edit generated tables. These are schema defaults, not saved merchant values. Blank resource fields require selection; a preset may supply different values. A declared setting is not a runtime guarantee: see the [customization guide](../CUSTOMIZATION.md) for behavior and limitations.

### Theme settings

Source: `theme/config/settings_schema.json`; token consumer: `theme/snippets/css-variables.liquid`; runtime policy: `theme/snippets/nk-config.liquid` → `src/core/config.ts`.

#### Logo

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `logo` — Logo | `image_picker` | Not specified |  |
| `logo_inverse` — Logo over campaign images | `image_picker` | Not specified | Used when the header overlays a dark hero image. |
| `favicon` — Favicon | `image_picker` | Not specified | Shown in browser tabs and bookmarks. Square image, at least 96 × 96px. |
| `logo_width` — Logo width (desktop) | `range` | `140` | 60–300px, step 10 |
| `logo_width_mobile` — Logo width (phone) | `range` | `110` | 60–200px, step 10 |

#### Colors

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `color_schemes` —  | `color_scheme_group` | Not specified |  |

Color scheme fields for `color_schemes`:

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `background` — Background | `color` | `#F3F2EE` |  |
| `surface` — Surface (cards, image placeholders) | `color` | `#E7E4DE` |  |
| `text` — Text | `color` | `#121212` |  |
| `text_muted` — Secondary text | `color` | `#55534E` |  |
| `line` — Lines and borders | `color` | `#D9D6CF` |  |
| `accent` — Accent (buttons, links, focus, selected states) | `color` | `#432D23` | Defaults to the footer brown. Hover, active, selected, border and focus shades are derived from it automatically. |
| `accent_text` — Text on accent | `color` | `#F5ECDF` |  |

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `color_error` — Errors | `color` | `#B42318` |  |
| `color_success` — Success | `color` | `#146C43` |  |

#### Typography

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `type_heading_font` — Headings | `font_picker` | `newsreader_n4` |  |
| `type_body_font` — Body | `font_picker` | `inter_n4` |  |
| `type_spec_font` — Labels (sizes, prices, details) | `font_picker` | `inter_n5` | Used for small uppercase labels, sizes and prices. |
| `heading_case` — Heading case | `select` | `uppercase` | `none`: As typed; `uppercase`: Uppercase |
| `body_size` — Body text size | `select` | `16` | `15`: Compact; `16`: Regular; `17`: Comfortable; `18`: Large |
| `heading_tracking` — Shared heading letter spacing | `select` | `editorial` | `editorial`: Editorial; `natural`: Natural; `tight`: Tight; Shared headings and display text; specialized product/navigation typography keeps its own treatment. |
| `heading_leading` — Shared heading line spacing | `select` | `editorial` | `editorial`: Editorial; `comfortable`: Comfortable |
| `label_tracking` — Shared label letter spacing | `select` | `editorial` | `editorial`: Editorial; `natural`: Natural |

#### Layout

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `page_width` — Page width | `select` | `1440px` | `1200px`: Narrow; `1440px`: Wide; `100vw`: Full |
| `section_spacing` — Space between sections | `select` | `72` | `48`: Compact; `72`: Regular; `112`: Airy |
| `corner_radius` — Button and field corners | `select` | `2` | `0`: Square; `2`: Soft; `999`: Pill |
| `gutter_mobile` — Page gutter on phones | `range` | `16` | 12–32px, step 2; Screens below 750px. |
| `gutter_tablet` — Page gutter on tablets | `range` | `24` | 16–48px, step 2; Screens from 750px to 1199px. |
| `gutter_desktop` — Page gutter on large screens | `range` | `48` | 24–80px, step 4; Screens from 1200px. |
| `section_spacing_mobile` — Section spacing on smaller screens | `select` | `66` | `50`: Compact; `66`: Regular; `85`: Airy; `100`: Same as desktop; Below 990px, sections using shared spacing use 50%, 66%, 85% or 100% of Space between sections. |

#### Buttons

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `button_size` — Default button size | `select` | `regular` | `compact`: Compact; `regular`: Regular; `large`: Large; Applies to shared boxed buttons. Product purchase buttons retain a 56px minimum; hero Small/Large choices override this size. |
| `button_corners` — Default button corners | `select` | `inherit` | `inherit`: Use Layout corner setting; `square`: Square; `soft`: Rounded; `pill`: Pill |
| `button_motion` — Button hover effects | `select` | `expressive` | `expressive`: Sliding fill and hero label roll; `subtle`: Subtle fade; `none`: Instant states (no animation); Keyboard focus keeps its visible outline in all modes. Reduced motion and global Motion off always suppress travel. |

#### Product cards

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `card_surface` — Card surface | `select` | `flat` | `flat`: Flat; `bordered`: Bordered; `raised`: Raised; Applies to shared product and article cards; custom category cards retain their own design. |
| `card_image_ratio` — Image shape | `select` | `4 / 5` | `4 / 5`: Portrait 4:5; `3 / 4`: Portrait 3:4; `1 / 1`: Square |
| `card_image_fit` — Image fit | `select` | `contain` | `cover`: Fill; `contain`: Fit |
| `card_show_secondary` — Show second image on hover | `checkbox` | `true` |  |
| `card_show_sizes` — Show available sizes | `checkbox` | `true` |  |
| `card_show_low_stock` — Mark low-stock sizes | `checkbox` | `true` | A small dot on quick-add sizes at or below the "only a few left" threshold in Product page settings. |
| `card_size_option_names` — Size option name(s) | `text` | `Size` | Comma-separated option names treated as sizes, e.g. Size, Waist. |
| `card_show_badges` — Show sale and sold-out badges | `checkbox` | `true` |  |
| `card_appearance` — Product card appearance | `select` | `minimal` | `minimal`: Minimal; `editorial`: Editorial; `bordered`: Bordered; `image-led`: Image focused |
| `card_hover` — Product media on hover | `select` | `auto` | `auto`: Video when available, otherwise second image; `image`: Second image only; `off`: No alternate media |
| `card_hover_animation` — Product hover animation | `select` | `blur` | `blur`: Smooth blur crossfade; `fade`: Soft crossfade; `zoom`: Gentle zoom crossfade; `slide`: Slide across; `curtain`: Curtain reveal; Applies to alternate images and video. Videos appear only when playback is ready. |
| `card_show_vendor` — Show product vendor | `checkbox` | `false` |  |
| `card_show_price` — Show product price | `checkbox` | `true` |  |

#### Product page

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `product_required_options` — Options shoppers must choose | `text` | `Size` | These options are never preselected, so shoppers can't add an unintended size. Comma-separated. |
| `product_sold_out_values` — Sold-out option values | `select` | `strike` | `strike`: Show crossed out; `hide`: Hide |
| `inventory_threshold` — Show "only a few left" at or below | `range` | `3` | 0–20, step 1; 0 turns low-stock messages off. Only counts variants where Shopify tracks inventory and doesn't sell when out of stock. |

#### Size charts

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `size_chart_default_handle` — Default reusable chart handle | `text` | Not specified | Handle of a size_chart metaobject from Content > Metaobjects, e.g. classic-shirt. Used only when no product or collection assignment applies. Leave blank to preserve template fallbacks. |
| `size_chart_1_collections` — Apply to collections | `collection_list` | Not specified | Picker limit 50 |
| `size_chart_1_products` — Apply to specific products | `product_list` | Not specified | Picker limit 50; Use a separate chart for products with different measurements. |
| `size_chart_1_tags` — Apply to product tags | `textarea` | Not specified | One exact tag per line; any match applies. Case-insensitive. Blank tags are ignored. Product and collection assignments take priority. |
| `size_chart_1_handle` — Reusable chart handle | `text` | Not specified | Copy the size_chart entry handle from Admin > Content > Metaobjects. Edit that entry to update all assigned products. A usable reusable chart overrides Measurements below; blank, missing or empty entries use the CSV fallback. |
| `size_chart_1_image` — Size chart picture | `image_picker` | Not specified | Optional picture shown in the size guide. Works without a measurement table. Add image alt text in Shopify Files. A reusable chart picture takes priority. |
| `size_chart_1_table` — Measurements | `textarea` | Not specified | First line: Size,Chest,Length (or your headings). Then one comma-separated row per size. Enter only verified values, using the same size labels as product variants. Leave blank until verified. |
| `size_chart_1_unit` — Unit | `select` | `cm` | `cm`: Centimetres; `in`: Inches |
| `size_chart_1_basis` — Measurement basis | `text` | Not specified | For example: garment measured flat, or body measurements. State the actual method. |
| `size_chart_1_note` — Size guide note | `text` | Not specified |  |
| `size_chart_2_collections` — Apply to collections | `collection_list` | Not specified | Picker limit 50 |
| `size_chart_2_products` — Apply to specific products | `product_list` | Not specified | Picker limit 50; Use a separate chart for products with different measurements. |
| `size_chart_2_tags` — Apply to product tags | `textarea` | Not specified | One exact tag per line; any match applies. Case-insensitive. Blank tags are ignored. Product and collection assignments take priority. |
| `size_chart_2_handle` — Reusable chart handle | `text` | Not specified | Copy the size_chart entry handle from Admin > Content > Metaobjects. Edit that entry to update all assigned products. A usable reusable chart overrides Measurements below; blank, missing or empty entries use the CSV fallback. |
| `size_chart_2_image` — Size chart picture | `image_picker` | Not specified | Optional picture shown in the size guide. Works without a measurement table. Add image alt text in Shopify Files. A reusable chart picture takes priority. |
| `size_chart_2_table` — Measurements | `textarea` | Not specified | First line: Size,Chest,Length (or your headings). Then one comma-separated row per size. Enter only verified values, using the same size labels as product variants. Leave blank until verified. |
| `size_chart_2_unit` — Unit | `select` | `cm` | `cm`: Centimetres; `in`: Inches |
| `size_chart_2_basis` — Measurement basis | `text` | Not specified | For example: garment measured flat, or body measurements. State the actual method. |
| `size_chart_2_note` — Size guide note | `text` | Not specified |  |
| `size_chart_3_collections` — Apply to collections | `collection_list` | Not specified | Picker limit 50 |
| `size_chart_3_products` — Apply to specific products | `product_list` | Not specified | Picker limit 50; Use a separate chart for products with different measurements. |
| `size_chart_3_tags` — Apply to product tags | `textarea` | Not specified | One exact tag per line; any match applies. Case-insensitive. Blank tags are ignored. Product and collection assignments take priority. |
| `size_chart_3_handle` — Reusable chart handle | `text` | Not specified | Copy the size_chart entry handle from Admin > Content > Metaobjects. Edit that entry to update all assigned products. A usable reusable chart overrides Measurements below; blank, missing or empty entries use the CSV fallback. |
| `size_chart_3_image` — Size chart picture | `image_picker` | Not specified | Optional picture shown in the size guide. Works without a measurement table. Add image alt text in Shopify Files. A reusable chart picture takes priority. |
| `size_chart_3_table` — Measurements | `textarea` | Not specified | First line: Size,Chest,Length (or your headings). Then one comma-separated row per size. Enter only verified values, using the same size labels as product variants. Leave blank until verified. |
| `size_chart_3_unit` — Unit | `select` | `cm` | `cm`: Centimetres; `in`: Inches |
| `size_chart_3_basis` — Measurement basis | `text` | Not specified | For example: garment measured flat, or body measurements. State the actual method. |
| `size_chart_3_note` — Size guide note | `text` | Not specified |  |
| `size_chart_4_collections` — Apply to collections | `collection_list` | Not specified | Picker limit 50 |
| `size_chart_4_products` — Apply to specific products | `product_list` | Not specified | Picker limit 50; Use a separate chart for products with different measurements. |
| `size_chart_4_tags` — Apply to product tags | `textarea` | Not specified | One exact tag per line; any match applies. Case-insensitive. Blank tags are ignored. Product and collection assignments take priority. |
| `size_chart_4_handle` — Reusable chart handle | `text` | Not specified | Copy the size_chart entry handle from Admin > Content > Metaobjects. Edit that entry to update all assigned products. A usable reusable chart overrides Measurements below; blank, missing or empty entries use the CSV fallback. |
| `size_chart_4_image` — Size chart picture | `image_picker` | Not specified | Optional picture shown in the size guide. Works without a measurement table. Add image alt text in Shopify Files. A reusable chart picture takes priority. |
| `size_chart_4_table` — Measurements | `textarea` | Not specified | First line: Size,Chest,Length (or your headings). Then one comma-separated row per size. Enter only verified values, using the same size labels as product variants. Leave blank until verified. |
| `size_chart_4_unit` — Unit | `select` | `cm` | `cm`: Centimetres; `in`: Inches |
| `size_chart_4_basis` — Measurement basis | `text` | Not specified | For example: garment measured flat, or body measurements. State the actual method. |
| `size_chart_4_note` — Size guide note | `text` | Not specified |  |
| `size_chart_5_collections` — Apply to collections | `collection_list` | Not specified | Picker limit 50 |
| `size_chart_5_products` — Apply to specific products | `product_list` | Not specified | Picker limit 50; Use a separate chart for products with different measurements. |
| `size_chart_5_tags` — Apply to product tags | `textarea` | Not specified | One exact tag per line; any match applies. Case-insensitive. Blank tags are ignored. Product and collection assignments take priority. |
| `size_chart_5_handle` — Reusable chart handle | `text` | Not specified | Copy the size_chart entry handle from Admin > Content > Metaobjects. Edit that entry to update all assigned products. A usable reusable chart overrides Measurements below; blank, missing or empty entries use the CSV fallback. |
| `size_chart_5_image` — Size chart picture | `image_picker` | Not specified | Optional picture shown in the size guide. Works without a measurement table. Add image alt text in Shopify Files. A reusable chart picture takes priority. |
| `size_chart_5_table` — Measurements | `textarea` | Not specified | First line: Size,Chest,Length (or your headings). Then one comma-separated row per size. Enter only verified values, using the same size labels as product variants. Leave blank until verified. |
| `size_chart_5_unit` — Unit | `select` | `cm` | `cm`: Centimetres; `in`: Inches |
| `size_chart_5_basis` — Measurement basis | `text` | Not specified | For example: garment measured flat, or body measurements. State the actual method. |
| `size_chart_5_note` — Size guide note | `text` | Not specified |  |
| `size_chart_6_collections` — Apply to collections | `collection_list` | Not specified | Picker limit 50 |
| `size_chart_6_products` — Apply to specific products | `product_list` | Not specified | Picker limit 50; Use a separate chart for products with different measurements. |
| `size_chart_6_tags` — Apply to product tags | `textarea` | Not specified | One exact tag per line; any match applies. Case-insensitive. Blank tags are ignored. Product and collection assignments take priority. |
| `size_chart_6_handle` — Reusable chart handle | `text` | Not specified | Copy the size_chart entry handle from Admin > Content > Metaobjects. Edit that entry to update all assigned products. A usable reusable chart overrides Measurements below; blank, missing or empty entries use the CSV fallback. |
| `size_chart_6_image` — Size chart picture | `image_picker` | Not specified | Optional picture shown in the size guide. Works without a measurement table. Add image alt text in Shopify Files. A reusable chart picture takes priority. |
| `size_chart_6_table` — Measurements | `textarea` | Not specified | First line: Size,Chest,Length (or your headings). Then one comma-separated row per size. Enter only verified values, using the same size labels as product variants. Leave blank until verified. |
| `size_chart_6_unit` — Unit | `select` | `cm` | `cm`: Centimetres; `in`: Inches |
| `size_chart_6_basis` — Measurement basis | `text` | Not specified | For example: garment measured flat, or body measurements. State the actual method. |
| `size_chart_6_note` — Size guide note | `text` | Not specified |  |
| `size_chart_7_collections` — Apply to collections | `collection_list` | Not specified | Picker limit 50 |
| `size_chart_7_products` — Apply to specific products | `product_list` | Not specified | Picker limit 50; Use a separate chart for products with different measurements. |
| `size_chart_7_tags` — Apply to product tags | `textarea` | Not specified | One exact tag per line; any match applies. Case-insensitive. Blank tags are ignored. Product and collection assignments take priority. |
| `size_chart_7_handle` — Reusable chart handle | `text` | Not specified | Copy the size_chart entry handle from Admin > Content > Metaobjects. Edit that entry to update all assigned products. A usable reusable chart overrides Measurements below; blank, missing or empty entries use the CSV fallback. |
| `size_chart_7_image` — Size chart picture | `image_picker` | Not specified | Optional picture shown in the size guide. Works without a measurement table. Add image alt text in Shopify Files. A reusable chart picture takes priority. |
| `size_chart_7_table` — Measurements | `textarea` | Not specified | First line: Size,Chest,Length (or your headings). Then one comma-separated row per size. Enter only verified values, using the same size labels as product variants. Leave blank until verified. |
| `size_chart_7_unit` — Unit | `select` | `cm` | `cm`: Centimetres; `in`: Inches |
| `size_chart_7_basis` — Measurement basis | `text` | Not specified | For example: garment measured flat, or body measurements. State the actual method. |
| `size_chart_7_note` — Size guide note | `text` | Not specified |  |
| `size_chart_8_collections` — Apply to collections | `collection_list` | Not specified | Picker limit 50 |
| `size_chart_8_products` — Apply to specific products | `product_list` | Not specified | Picker limit 50; Use a separate chart for products with different measurements. |
| `size_chart_8_tags` — Apply to product tags | `textarea` | Not specified | One exact tag per line; any match applies. Case-insensitive. Blank tags are ignored. Product and collection assignments take priority. |
| `size_chart_8_handle` — Reusable chart handle | `text` | Not specified | Copy the size_chart entry handle from Admin > Content > Metaobjects. Edit that entry to update all assigned products. A usable reusable chart overrides Measurements below; blank, missing or empty entries use the CSV fallback. |
| `size_chart_8_image` — Size chart picture | `image_picker` | Not specified | Optional picture shown in the size guide. Works without a measurement table. Add image alt text in Shopify Files. A reusable chart picture takes priority. |
| `size_chart_8_table` — Measurements | `textarea` | Not specified | First line: Size,Chest,Length (or your headings). Then one comma-separated row per size. Enter only verified values, using the same size labels as product variants. Leave blank until verified. |
| `size_chart_8_unit` — Unit | `select` | `cm` | `cm`: Centimetres; `in`: Inches |
| `size_chart_8_basis` — Measurement basis | `text` | Not specified | For example: garment measured flat, or body measurements. State the actual method. |
| `size_chart_8_note` — Size guide note | `text` | Not specified |  |
| `size_chart_9_collections` — Apply to collections | `collection_list` | Not specified | Picker limit 50 |
| `size_chart_9_products` — Apply to specific products | `product_list` | Not specified | Picker limit 50; Use a separate chart for products with different measurements. |
| `size_chart_9_tags` — Apply to product tags | `textarea` | Not specified | One exact tag per line; any match applies. Case-insensitive. Blank tags are ignored. Product and collection assignments take priority. |
| `size_chart_9_handle` — Reusable chart handle | `text` | Not specified | Copy the size_chart entry handle from Admin > Content > Metaobjects. Edit that entry to update all assigned products. A usable reusable chart overrides Measurements below; blank, missing or empty entries use the CSV fallback. |
| `size_chart_9_image` — Size chart picture | `image_picker` | Not specified | Optional picture shown in the size guide. Works without a measurement table. Add image alt text in Shopify Files. A reusable chart picture takes priority. |
| `size_chart_9_table` — Measurements | `textarea` | Not specified | First line: Size,Chest,Length (or your headings). Then one comma-separated row per size. Enter only verified values, using the same size labels as product variants. Leave blank until verified. |
| `size_chart_9_unit` — Unit | `select` | `cm` | `cm`: Centimetres; `in`: Inches |
| `size_chart_9_basis` — Measurement basis | `text` | Not specified | For example: garment measured flat, or body measurements. State the actual method. |
| `size_chart_9_note` — Size guide note | `text` | Not specified |  |
| `size_chart_10_collections` — Apply to collections | `collection_list` | Not specified | Picker limit 50 |
| `size_chart_10_products` — Apply to specific products | `product_list` | Not specified | Picker limit 50; Use a separate chart for products with different measurements. |
| `size_chart_10_tags` — Apply to product tags | `textarea` | Not specified | One exact tag per line; any match applies. Case-insensitive. Blank tags are ignored. Product and collection assignments take priority. |
| `size_chart_10_handle` — Reusable chart handle | `text` | Not specified | Copy the size_chart entry handle from Admin > Content > Metaobjects. Edit that entry to update all assigned products. A usable reusable chart overrides Measurements below; blank, missing or empty entries use the CSV fallback. |
| `size_chart_10_image` — Size chart picture | `image_picker` | Not specified | Optional picture shown in the size guide. Works without a measurement table. Add image alt text in Shopify Files. A reusable chart picture takes priority. |
| `size_chart_10_table` — Measurements | `textarea` | Not specified | First line: Size,Chest,Length (or your headings). Then one comma-separated row per size. Enter only verified values, using the same size labels as product variants. Leave blank until verified. |
| `size_chart_10_unit` — Unit | `select` | `cm` | `cm`: Centimetres; `in`: Inches |
| `size_chart_10_basis` — Measurement basis | `text` | Not specified | For example: garment measured flat, or body measurements. State the actual method. |
| `size_chart_10_note` — Size guide note | `text` | Not specified |  |
| `size_chart_11_collections` — Apply to collections | `collection_list` | Not specified | Picker limit 50 |
| `size_chart_11_products` — Apply to specific products | `product_list` | Not specified | Picker limit 50; Use a separate chart for products with different measurements. |
| `size_chart_11_tags` — Apply to product tags | `textarea` | Not specified | One exact tag per line; any match applies. Case-insensitive. Blank tags are ignored. Product and collection assignments take priority. |
| `size_chart_11_handle` — Reusable chart handle | `text` | Not specified | Copy the size_chart entry handle from Admin > Content > Metaobjects. Edit that entry to update all assigned products. A usable reusable chart overrides Measurements below; blank, missing or empty entries use the CSV fallback. |
| `size_chart_11_image` — Size chart picture | `image_picker` | Not specified | Optional picture shown in the size guide. Works without a measurement table. Add image alt text in Shopify Files. A reusable chart picture takes priority. |
| `size_chart_11_table` — Measurements | `textarea` | Not specified | First line: Size,Chest,Length (or your headings). Then one comma-separated row per size. Enter only verified values, using the same size labels as product variants. Leave blank until verified. |
| `size_chart_11_unit` — Unit | `select` | `cm` | `cm`: Centimetres; `in`: Inches |
| `size_chart_11_basis` — Measurement basis | `text` | Not specified | For example: garment measured flat, or body measurements. State the actual method. |
| `size_chart_11_note` — Size guide note | `text` | Not specified |  |
| `size_chart_12_collections` — Apply to collections | `collection_list` | Not specified | Picker limit 50 |
| `size_chart_12_products` — Apply to specific products | `product_list` | Not specified | Picker limit 50; Use a separate chart for products with different measurements. |
| `size_chart_12_tags` — Apply to product tags | `textarea` | Not specified | One exact tag per line; any match applies. Case-insensitive. Blank tags are ignored. Product and collection assignments take priority. |
| `size_chart_12_handle` — Reusable chart handle | `text` | Not specified | Copy the size_chart entry handle from Admin > Content > Metaobjects. Edit that entry to update all assigned products. A usable reusable chart overrides Measurements below; blank, missing or empty entries use the CSV fallback. |
| `size_chart_12_image` — Size chart picture | `image_picker` | Not specified | Optional picture shown in the size guide. Works without a measurement table. Add image alt text in Shopify Files. A reusable chart picture takes priority. |
| `size_chart_12_table` — Measurements | `textarea` | Not specified | First line: Size,Chest,Length (or your headings). Then one comma-separated row per size. Enter only verified values, using the same size labels as product variants. Leave blank until verified. |
| `size_chart_12_unit` — Unit | `select` | `cm` | `cm`: Centimetres; `in`: Inches |
| `size_chart_12_basis` — Measurement basis | `text` | Not specified | For example: garment measured flat, or body measurements. State the actual method. |
| `size_chart_12_note` — Size guide note | `text` | Not specified |  |

#### Cart

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `cart_after_add` — After adding to cart | `select` | `drawer` | `drawer`: Open cart drawer; `notification`: Stay on page; `page`: Go to cart page |
| `cart_fly_animation` — Add-to-cart animation | `checkbox` | `true` | The product photo flies into the cart after it is added. Follows Theme settings > Motion and reduced-motion preferences. |
| `cart_show_note` — Order note | `checkbox` | `false` |  |
| `cart_empty_collection` — Empty cart: suggested collection | `collection` | Not specified |  |
| `cart_free_shipping` — Show free shipping progress | `checkbox` | `false` | Shown in the cart drawer and on the cart page. Set up the matching free shipping rate in Settings > Shipping and delivery. |
| `cart_free_shipping_threshold` — Free shipping minimum order | `number` | `5000` | Amount in your store's default currency, after discounts. Shoppers browsing in another currency don't see the bar. |

#### Promotions

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `promo_auto_apply` — Try promotion codes automatically in the cart | `checkbox` | `true` | When a product with a promotion code is in the cart, the code is sent to Shopify. It stays only if Shopify accepts it. |
| `promo_conflict_rule` — When codes can't be combined | `select` | `keep` | `keep`: Keep the code already applied; `priority`: Use the higher-priority promotion; Codes a shopper enters themselves are never replaced automatically. |
| `promo_code_field` — Show discount code field in cart | `checkbox` | `true` |  |
| `promo_metafield_priority` — Metafield code priority | `range` | `10` | 1–10, step 1; Higher wins when a product matches more than one promotion. |
| `promo_metafield_cards` — Show metafield codes on product cards | `checkbox` | `true` |  |
| `promo_1_enabled` — Enable | `checkbox` | `false` |  |
| `promo_1_code` — Shopify discount code | `text` | Not specified | Type the code exactly as it is set up in Shopify admin, for example TEE20. |
| `promo_1_scope` — Applies to | `select` | `matched` | `matched`: Matching products; `all`: Entire store |
| `promo_1_products` — Products | `product_list` | Not specified | Picker limit 50 |
| `promo_1_handles` — Product handles | `textarea` | Not specified | One per line or comma-separated. Most stable way to match products by text. |
| `promo_1_titles` — Product title phrases | `textarea` | Not specified | One per line. Matches whole words, ignoring case, for example Oversized Tee. |
| `promo_1_tag` — Product tag or promotion key | `text` | Not specified | Matches products tagged with this value, or whose custom.promotion metafield has it, for example summer-sale. |
| `promo_1_priority` — Priority | `range` | `5` | 1–10, step 1 |
| `promo_1_auto` — Try this code automatically in the cart | `checkbox` | `true` |  |
| `promo_1_cards` — Show on product cards | `checkbox` | `true` |  |
| `promo_1_badge` — Badge text | `text` | Not specified | Leave blank for "Code [code]". |
| `promo_1_message` — Product page message | `text` | Not specified | Leave blank for a standard message. Don't promise a saving: Shopify confirms eligibility in the cart. |
| `promo_2_enabled` — Enable | `checkbox` | `false` |  |
| `promo_2_code` — Shopify discount code | `text` | Not specified | Type the code exactly as it is set up in Shopify admin, for example TEE20. |
| `promo_2_scope` — Applies to | `select` | `matched` | `matched`: Matching products; `all`: Entire store |
| `promo_2_products` — Products | `product_list` | Not specified | Picker limit 50 |
| `promo_2_handles` — Product handles | `textarea` | Not specified | One per line or comma-separated. Most stable way to match products by text. |
| `promo_2_titles` — Product title phrases | `textarea` | Not specified | One per line. Matches whole words, ignoring case, for example Oversized Tee. |
| `promo_2_tag` — Product tag or promotion key | `text` | Not specified | Matches products tagged with this value, or whose custom.promotion metafield has it, for example summer-sale. |
| `promo_2_priority` — Priority | `range` | `5` | 1–10, step 1 |
| `promo_2_auto` — Try this code automatically in the cart | `checkbox` | `true` |  |
| `promo_2_cards` — Show on product cards | `checkbox` | `true` |  |
| `promo_2_badge` — Badge text | `text` | Not specified | Leave blank for "Code [code]". |
| `promo_2_message` — Product page message | `text` | Not specified | Leave blank for a standard message. Don't promise a saving: Shopify confirms eligibility in the cart. |
| `promo_3_enabled` — Enable | `checkbox` | `false` |  |
| `promo_3_code` — Shopify discount code | `text` | Not specified | Type the code exactly as it is set up in Shopify admin, for example TEE20. |
| `promo_3_scope` — Applies to | `select` | `matched` | `matched`: Matching products; `all`: Entire store |
| `promo_3_products` — Products | `product_list` | Not specified | Picker limit 50 |
| `promo_3_handles` — Product handles | `textarea` | Not specified | One per line or comma-separated. Most stable way to match products by text. |
| `promo_3_titles` — Product title phrases | `textarea` | Not specified | One per line. Matches whole words, ignoring case, for example Oversized Tee. |
| `promo_3_tag` — Product tag or promotion key | `text` | Not specified | Matches products tagged with this value, or whose custom.promotion metafield has it, for example summer-sale. |
| `promo_3_priority` — Priority | `range` | `5` | 1–10, step 1 |
| `promo_3_auto` — Try this code automatically in the cart | `checkbox` | `true` |  |
| `promo_3_cards` — Show on product cards | `checkbox` | `true` |  |
| `promo_3_badge` — Badge text | `text` | Not specified | Leave blank for "Code [code]". |
| `promo_3_message` — Product page message | `text` | Not specified | Leave blank for a standard message. Don't promise a saving: Shopify confirms eligibility in the cart. |
| `promo_4_enabled` — Enable | `checkbox` | `false` |  |
| `promo_4_code` — Shopify discount code | `text` | Not specified | Type the code exactly as it is set up in Shopify admin, for example TEE20. |
| `promo_4_scope` — Applies to | `select` | `matched` | `matched`: Matching products; `all`: Entire store |
| `promo_4_products` — Products | `product_list` | Not specified | Picker limit 50 |
| `promo_4_handles` — Product handles | `textarea` | Not specified | One per line or comma-separated. Most stable way to match products by text. |
| `promo_4_titles` — Product title phrases | `textarea` | Not specified | One per line. Matches whole words, ignoring case, for example Oversized Tee. |
| `promo_4_tag` — Product tag or promotion key | `text` | Not specified | Matches products tagged with this value, or whose custom.promotion metafield has it, for example summer-sale. |
| `promo_4_priority` — Priority | `range` | `5` | 1–10, step 1 |
| `promo_4_auto` — Try this code automatically in the cart | `checkbox` | `true` |  |
| `promo_4_cards` — Show on product cards | `checkbox` | `true` |  |
| `promo_4_badge` — Badge text | `text` | Not specified | Leave blank for "Code [code]". |
| `promo_4_message` — Product page message | `text` | Not specified | Leave blank for a standard message. Don't promise a saving: Shopify confirms eligibility in the cart. |

#### Motion

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `motion_level` — Animation level | `select` | `standard` | `off`: Off; `minimal`: Minimal; `standard`: Standard; Shoppers who ask their device for reduced motion always get minimal motion. |
| `motion_tempo` — Animation tempo | `select` | `balanced` | `relaxed`: Relaxed; `balanced`: Balanced; `brisk`: Brisk; Overall speed of entrance animations. Scroll-linked scenes always follow the scroll. |
| `motion_stagger` — Stagger between items | `select` | `medium` | `none`: None; `short`: Short; `medium`: Medium; `long`: Long; Delay between cards, words and lines that reveal one after another. |
| `motion_scroll_effects` — Scroll-linked effects | `checkbox` | `true` | Parallax, cinematic section scenes and pinning. Turn off for simple entrance animations only. |
| `motion_mobile` — Phone animations | `select` | `simple` | `simple`: Simplified; `full`: Same as desktop; `off`: Off; Simplified keeps quick fades and reveals but skips pinning, parallax and scroll-linked scenes on screens under 750px. |
| `motion_smooth_scroll` — Smooth wheel scrolling | `checkbox` | `true` | Fluid mouse-wheel and touchpad scrolling on desktop. Phones keep native scrolling. Off when the visitor's device asks for reduced motion (on Windows: Settings > Accessibility > Visual effects > Animation effects), with Motion off, and in the theme editor. |
| `motion_smooth_strength` — Smooth scrolling strength | `select` | `balanced` | `subtle`: Subtle; `balanced`: Balanced; `silky`: Silky (longest glide) |

#### Social media

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `social_instagram` — Instagram | `url` | Not specified |  |
| `social_tiktok` — TikTok | `url` | Not specified |  |
| `social_facebook` — Facebook | `url` | Not specified |  |
| `social_youtube` — YouTube | `url` | Not specified |  |

#### Gift card page

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `gift_card_style` — Presentation | `select` | `classic` | `classic`: Classic; `minimal`: Minimal; `bordered`: Bordered panel |

#### Customer support

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `support_replace_policy` — Show these links instead of the contact information policy | `checkbox` | `false` | Replaces the policy text from Settings › Policies on that page. Leave off if the policy contains details you must publish, such as your business address or registration number. |
| `support_intro` — Introduction | `richtext` | Not specified |  |
| `support_email` — Support email | `text` | Not specified |  |
| `support_phone` — Support phone | `text` | Not specified |  |
| `support_instagram` — Instagram profile URL | `url` | Not specified |  |
| `support_instagram_label` — Instagram link label | `text` | Not specified |  |

### Theme sections

#### Not found (404)

Source: `theme/sections/404.liquid`. Editor: select this section in its template or section group.

Available contexts: `{"templates":["404"]}`.

Section instance limit: 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `message` — Message | `text` | Not specified | Leave empty to use the default translation. |
| `primary_label` — First button label | `text` | Not specified | Defaults to "Go home". |
| `primary_link` — First button link | `url` | Not specified | Defaults to the homepage. |
| `secondary_label` — Second button label | `text` | Not specified | Defaults to "Explore". |
| `secondary_link` — Second button link | `url` | Not specified | Defaults to the collections list. |
| `show_search` — Show search | `checkbox` | `false` |  |
| `menu` — Popular links menu | `link_list` | Not specified |  |
| `show_products` — Show products | `checkbox` | `false` |  |
| `products_heading` — Products heading | `text` | `You might like` |  |
| `collection` — Products collection | `collection` | Not specified | Defaults to all products. |
| `products_count` — Number of products | `range` | `4` | 2–4, step 1 |

No add-menu preset: rendered by an existing template/layout/group or used as a rendering endpoint.

#### Accordion gallery (accordion-gallery)

Source: `theme/sections/accordion-gallery.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

Current section block cap: 6.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `eyebrow` — Eyebrow | `text` | `The collection, in focus` |  |
| `heading` — Heading | `text` | `Explore the collection` |  |
| `heading_size` — Heading size | `range` | `76` | 36–110px, step 2 |
| `description` — Description | `text` | `Everyday pieces. A closer look at the details.` |  |
| `collection` — Product collection | `collection` | Not specified | Product and image panels take priority when added. |
| `limit` — Product panels | `range` | `5` | 2–6, step 1 |
| `light_text_panels` — Light text on panels | `text` | Not specified | For dark product photos. Panel numbers separated by commas, e.g. 2, 4. Applies to collection panels; added panels have their own setting. |
| `height` — Desktop height | `range` | `580` | 420–760px, step 20 |
| `expand_ratio` — Open panel width | `range` | `4` | 2–7, step 1; How many times wider the open panel is than a closed one. |
| `gap` — Space between panels | `range` | `10` | 0–30px, step 2 |
| `radius` — Corner radius | `range` | `0` | 0–30px, step 2 |
| `details_height` — Info box height | `range` | `168` | 120–260px, step 4 |
| `image_fit` — Image fit | `select` | `cover` | `cover`: Fill panel; `contain`: Show whole image |
| `mobile_height` — Mobile open panel height | `range` | `510` | 360–680px, step 10 |
| `mobile_collapsed` — Mobile closed panel height | `range` | `76` | 56–120px, step 2 |
| `label_size` — Closed panel title size | `range` | `30` | 18–48px, step 1 |
| `title_size` — Open panel title size | `range` | `34` | 18–48px, step 1 |
| `show_numbers` — Show panel numbers | `checkbox` | `true` |  |
| `show_price` — Show price | `checkbox` | `true` |  |
| `show_link` — Show shop link | `checkbox` | `true` |  |
| `link_label` — Panel link text | `text` | `Shop the piece` |  |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `text_color` — Heading text | `color` | `#432d23` |  |
| `panel_color` — Panel background | `color` | `#eee9e1` |  |
| `label_color` — Panel titles | `color` | `#432d23` |  |
| `label_light_color` — Panel titles (light text) | `color` | `#fff9f0` |  |
| `details_color` — Info box background | `color` | `#432d23` |  |
| `details_text_color` — Info box text | `color` | `#fff9f0` |  |
| `start_panel` — Panel open on load | `range` | `1` | 1–6, step 1 |
| `open_on_hover` — Open panels on hover | `checkbox` | `true` |  |
| `hover_delay` — Hover delay | `range` | `160` | 0–600ms, step 20 |
| `click_through` — Click open picture to go to product | `checkbox` | `true` |  |
| `speed` — Animation speed | `range` | `1200` | 400–2000ms, step 100; Lower is faster. |

Supported block: **Product panel** (`product`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `product` — Product | `product` | Not specified |  |
| `image` — Image | `image_picker` | Not specified | Optional. Uses the product's main image when empty. |
| `title` — Title | `text` | Not specified | Optional. Uses the product title when empty. |
| `light_text` — Light text | `checkbox` | `false` | Use for dark product photos. |

Supported block: **Image panel** (`panel`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `image` — Image | `image_picker` | Not specified |  |
| `title` — Title | `text` | `Everyday essentials` |  |
| `link` — Link | `url` | Not specified |  |
| `light_text` — Light text | `checkbox` | `false` | Use for dark photos. |

Add-menu presets:

- Accordion gallery.

#### Announcement bar (announcement)

Source: `theme/sections/announcement.liquid`. Editor: select this section in its template or section group.

Available contexts: `{"groups":["header"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `mode` — Display | `select` | `static` | `static`: Static (first message); `ticker`: Scrolling ticker; `stacked`: All messages (stacked) |
| `speed` — Ticker speed | `range` | `40` | 20–120px, step 10; Pixels per second. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-2` |  |
| `direction` — Ticker direction | `select` | `left` | `left`: Right to left; `right`: Left to right |
| `separator` — Ticker separator | `text` | `✳` |  |

Supported block: **Message** (`message`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `text` — Text | `text` | Not specified |  |
| `link` — Link | `url` | Not specified |  |

Add-menu presets:

- Announcement bar; initial blocks `[{"type":"message"}]`.
- Stacked announcements — `{"mode":"stacked"}`; initial blocks `[{"type":"message"},{"type":"message"}]`.

#### Article (article)

Source: `theme/sections/article.liquid`. Editor: select this section in its template or section group.

Available contexts: `{"templates":["article"]}`.

Section instance limit: 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `show_date` — Show date | `checkbox` | `true` |  |
| `show_author` — Show author | `checkbox` | `true` |  |
| `width` — Reading width | `range` | `72` | 56–96ch, step 4 |
| `show_image` — Show article image | `checkbox` | `true` |  |
| `show_comments` — Show comments and comment form | `checkbox` | `true` | Requires comments to be enabled for this blog in Shopify. |

No add-menu preset: rendered by an existing template/layout/group or used as a rendering endpoint.

#### Blog (blog)

Source: `theme/sections/blog.liquid`. Editor: select this section in its template or section group.

Available contexts: `{"templates":["blog"]}`.

Section instance limit: 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `show_date` — Show date | `checkbox` | `true` |  |
| `show_author` — Show author | `checkbox` | `true` |  |
| `blog_source` — Blog source override | `blog` | Not specified |  |
| `heading` — Heading override | `text` | Not specified |  |
| `layout` — Layout | `select` | `grid` | `grid`: Grid; `list`: List; `editorial`: Editorial first story |
| `per_page` — Articles per page | `range` | `12` | 4–24, step 4 |
| `columns` — Desktop columns | `range` | `3` | 2–4, step 1 |
| `columns_mobile` — Phone columns | `select` | `1` | `1`: 1; `2`: 2 |
| `show_images` — Show images | `checkbox` | `true` |  |
| `show_excerpt` — Show excerpt | `checkbox` | `true` |  |

No add-menu preset: rendered by an existing template/layout/group or used as a rendering endpoint.

#### Button row (button-row)

Source: `theme/sections/button-row.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

Current section block cap: 8.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | Not specified |  |
| `text` — Text | `richtext` | Not specified |  |
| `alignment` — Alignment | `select` | `center` | `left`: Left; `center`: Center; `right`: Right |
| `button_width` — Button width | `select` | `auto` | `auto`: Fit label; `equal`: Equal widths; `full`: Full width, one per row |
| `mobile_layout` — On phones | `select` | `wrap` | `wrap`: Wrap side by side; `stack`: Stack full width |
| `gap` — Gap between buttons | `range` | `16` | 0–48px, step 4 |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Button** (`button`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `label` — Label | `text` | `Shop now` |  |
| `link` — Link | `url` | `/collections/all` |  |
| `style` — Style | `select` | `solid` | `solid`: Solid; `outline`: Outline; `pill`: Pill; `sweep`: Center sweep; `offset`: Offset shadow; `press`: 3D press; `link`: Text link |
| `new_tab` — Open link in a new tab | `checkbox` | `false` |  |

Add-menu presets:

- Button row; initial blocks `[{"type":"button","settings":{"label":"Shop new in","style":"solid"}},{"type":"button","settings":{"label":"View lookbook","style":"outline"}}]`.
- Button styles — `{"heading":"Button styles"}`; initial blocks `[{"type":"button","settings":{"label":"Solid","style":"solid"}},{"type":"button","settings":{"label":"Outline","style":"outline"}},{"type":"button","settings":{"label":"Pill","style":"pill"}},{"type":"button","settings":{"label":"Center sweep","style":"sweep"}},{"type":"button","settings":{"label":"Offset shadow","style":"offset"}},{"type":"button","settings":{"label":"3D press","style":"press"}},{"type":"button","settings":{"label":"Text link","style":"link"}}]`.

#### Cart drawer (cart-drawer)

Source: `theme/sections/cart-drawer.liquid`. Editor: select this section in its template or section group.

Section instance limit: 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `density` — Cart line spacing | `select` | `regular` | `regular`: Regular; `compact`: Compact; `airy`: Airy |
| `show_images` — Show product images | `checkbox` | `true` |  |
| `width` — Drawer width | `select` | `regular` | `regular`: Regular (420px); `narrow`: Narrow (360px); `wide`: Wide (560px) |
| `show_recommendations` — Show product suggestions | `checkbox` | `true` | Suggestions for the most recently added product, with one-tap size add. |
| `recommendations_heading` — Heading | `text` | `Complete the look` |  |
| `recommendation_intent` — Suggest | `select` | `complementary` | `complementary`: Complementary products; `related`: Related products; Set complementary products in the Search & Discovery app. Without them, related products are shown. |
| `show_accelerated` — Show express checkout buttons | `checkbox` | `true` | Shop Pay, Apple Pay and other wallets you've enabled in your payment settings. |

No add-menu preset: rendered by an existing template/layout/group or used as a rendering endpoint.

#### Cart recommendations (cart-recommendations)

Source: `theme/sections/cart-recommendations.liquid`. Editor: select this section in its template or section group.

No local settings.

No add-menu preset: rendered by an existing template/layout/group or used as a rendering endpoint.

#### Shop by category (category-cards)

Source: `theme/sections/category-cards.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `eyebrow` — Eyebrow | `text` | `Shop by category` |  |
| `heading` — Heading | `text` | `The` |  |
| `heading_italic` — Heading (italic part) | `text` | `wardrobe` |  |
| `link_label` — Link label | `text` | `Shop all` |  |
| `link` — Link | `url` | Not specified |  |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `layout` — Desktop layout | `select` | `bento` | `bento`: Bento, featured card left; `bento_right`: Bento, featured card right; `banner`: Wide banner, then a row; `grid`: Even grid; `scroller`: Horizontal scroller |
| `columns` — Columns | `range` | `4` | 2–5, step 1; Used by the even grid, the banner's row and the scroller (cards visible at once). |
| `mobile_layout` — Phone layout | `select` | `stacked` | `stacked`: Featured card full width, then two columns; `two`: Two columns; `one`: One column; `scroll`: Swipe row |
| `image_ratio` — Image shape | `select` | `standard` | `standard`: Standard (6:5); `portrait`: Portrait (4:5); `square`: Square; `wide`: Wide (3:2) |
| `gap` — Card spacing | `range` | `16` | 4–32px, step 2 |
| `card_palette` — Card colors | `select` | `studio` | `studio`: Original studio palette; `scheme`: Section color scheme |
| `card_style` — Card style | `select` | `studio` | `studio`: Studio tiles: photo on a tinted tile; `overlay`: Full photo: text over the image; `minimal`: Minimal: photo with a caption below; `framed`: Gallery frame: matted photo, centred title; `band`: Color band: photo above a solid title bar; Changes how each card looks. Desktop layout above sets where the cards go. |
| `card_outline` — Card outline | `checkbox` | `false` |  |
| `card_radius` — Corner radius | `range` | `0` | 0–32px, step 2 |
| `image_fit` — Image fit | `select` | `contain` | `contain`: Show entire image; `cover`: Fill and crop |
| `show_index` — Show index | `checkbox` | `true` |  |
| `show_count` — Show count | `checkbox` | `true` |  |
| `show_description` — Show description | `checkbox` | `true` |  |
| `menu_limit` — Sub-links per card | `range` | `4` | 0–20, step 1 |
| `heading_entrance` — Heading animation | `select` | `fold` | `fold`: Fold; `fade`: Fade; `none`: None |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters; Sets the width of the image and text together. Background stays full width. All options keep the theme's responsive page gutters. |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px. Custom values are exact and are not multiplied by the global smaller-screen spacing setting.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Category** (`category`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `collection` — Collection | `collection` | Not specified |  |
| `image` — Image | `image_picker` | Not specified | Defaults to the collection image. |
| `title` — Title | `text` | Not specified | Defaults to the collection title. |
| `description` — Description | `text` | Not specified |  |
| `menu` — Sub-links | `link_list` | Not specified | Optional menu shown as links on the card (up to 4). |
| `link` — Destination override | `url` | Not specified |  |
| `image_fit` — Image fit | `select` | `inherit` | `inherit`: Use section choice; `contain`: Show entire image; `cover`: Fill and crop |
| `custom_colors` — Override card color scheme | `checkbox` | `false` |  |
| `color_scheme` — Card color scheme | `color_scheme` | `scheme-1` |  |

Add-menu presets:

- Shop by category; initial blocks `[{"type":"category"},{"type":"category"},{"type":"category"},{"type":"category"},{"type":"category"}]`.
- Category grid — `{"layout":"grid","card_palette":"scheme"}`; initial blocks `[{"type":"category"},{"type":"category"},{"type":"category"},{"type":"category"}]`.
- Category swipe row — `{"layout":"scroller","mobile_layout":"scroll"}`; initial blocks `[{"type":"category"},{"type":"category"},{"type":"category"},{"type":"category"}]`.

#### Clothes rack (clothes-rack)

Source: `theme/sections/clothes-rack.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | Not specified | Small label above the rail. Leave empty for none. |
| `collection` — Collection | `collection` | Not specified | Used when no "Hang a product" blocks are added. Works best with clean flat-lay photos on white. |
| `limit` — Pieces on the rail | `range` | `8` | 3–16, step 1 |
| `back_from_second` — Use the second photo as the back view | `checkbox` | `true` | Turn off if your second photo is a lifestyle shot. Blocks can set a back photo per piece. |
| `knock_out_white` — Blend white photo backgrounds into the section | `checkbox` | `true` | Makes white studio backgrounds disappear on light color schemes. |
| `garment_size` — Garment size | `range` | `16` | 8–24rem, step 1 |
| `spacing` — Hanging spacing | `range` | `30` | 14–50%, step 2; How much of each garment shows while it hangs edge-on. |
| `collar_overlap` — Lift photo to the hanger | `range` | `22` | 0–40%, step 1; Pulls the photo up so the collar meets the hanger when photos have space above the garment. |
| `cta_label` — Button label | `text` | `See availability` |  |
| `front_label` — Front label | `text` | `Front` |  |
| `back_label` — Back label | `text` | `Back` |  |
| `close_label` — Close label | `text` | `Back to rack` |  |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Theme default; `narrow`: Narrow; `wide`: Wide; `full`: Full width |
| `spacing_mode` — Section spacing | `select` | `inherit` | `inherit`: Theme default; `custom`: Custom |
| `padding_top` — Top padding | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Bottom padding | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Top padding on phones | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Bottom padding on phones | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Hang a product** (`piece`); type limit 16.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `product` — Product | `product` | Not specified |  |
| `front_image` — Front photo | `image_picker` | Not specified | Optional. Defaults to the product's first photo. Cut-outs on white look best. |
| `back_image` — Back photo | `image_picker` | Not specified | Optional. Defaults to the product's second photo when that option is on. |

Add-menu presets:

- Clothes rack.

#### Collage (collage)

Source: `theme/sections/collage.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

Current section block cap: 5.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `Shop the edit` |  |
| `text` — Text | `richtext` | Not specified |  |
| `alignment` — Alignment | `select` | `left` | `left`: Left; `center`: Center |
| `layout` — Desktop layout | `select` | `left` | `left`: Large block left; `right`: Large block right; `even`: Equal columns |
| `mobile_layout` — Phone layout | `select` | `collage` | `collage`: Collage; `column`: Single column |
| `row_height` — Row height (desktop) | `range` | `320` | 160–600px, step 20 |
| `gap` — Gap | `range` | `12` | 0–40px, step 4 |
| `caption_position` — Caption | `select` | `overlay` | `overlay`: Over the image; `below`: Below the image |
| `hover_zoom` — Zoom images on hover | `checkbox` | `true` |  |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Image** (`image`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `image` — Image | `image_picker` | Not specified |  |
| `caption` — Caption | `text` | Not specified |  |
| `link` — Link | `url` | Not specified |  |

Supported block: **Product** (`product`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `product` — Product | `product` | Not specified |  |

Supported block: **Collection** (`collection`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `collection` — Collection | `collection` | Not specified |  |

Add-menu presets:

- Collage; initial blocks `[{"type":"image"},{"type":"product"},{"type":"collection"}]`.

#### Collection banner (collection-banner)

Source: `theme/sections/collection-banner.liquid`. Editor: select this section in its template or section group.

Available contexts: `{"templates":["collection"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `show_description` — Show collection description | `checkbox` | `true` |  |
| `use_product_image` — Use the first product image when the collection has no image | `checkbox` | `false` |  |
| `menu` — Related collections menu | `link_list` | Not specified | Optional row of links under the title. Falls back to store collections when blank. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `image` — Banner image override | `image_picker` | Not specified |  |
| `heading` — Heading override | `text` | Not specified |  |
| `title_animation` — Title animation | `select` | `rise` | `none`: None; `rise`: Rise from a mask; `blur`: Blur in; `fold`: Fold up; `skew`: Skewed rise; `fade`: Fade up; Plays once when the page opens. Follows Theme settings > Motion and reduced-motion preferences. |
| `title_split` — Animate title by | `select` | `words` | `words`: Word; `chars`: Letter; `lines`: Line |
| `layout` — Banner layout | `select` | `auto` | `auto`: Image when available; `text`: Text only; `minimal`: Minimal title |
| `height` — Image banner height | `select` | `regular` | `regular`: Regular; `compact`: Compact; `full`: Tall |
| `height_mobile` — Image height on phones | `select` | `inherit` | `inherit`: Use desktop choice; `compact`: Compact; `full`: Tall |
| `image_colors` — Text over image | `select` | `light` | `light`: Original light text; `scheme`: Use section scheme |
| `tint_strength` — Image tint strength | `range` | `100` | 0–100%, step 5 |
| `parallax` — Image drift | `range` | `12` | 0–30%, step 2 |
| `show_breadcrumbs` — Show breadcrumbs | `checkbox` | `true` |  |
| `show_count` — Show count | `checkbox` | `true` |  |
| `navigation` — Collection navigation | `select` | `auto` | `auto`: Menu or store collections; `menu`: Selected menu only; `none`: Hidden |

Add-menu presets:

- Collection banner.
- Minimal collection title — `{"layout":"minimal","navigation":"none","show_breadcrumbs":false,"show_count":false}`.

#### Collection tabs (collection-tabs)

Source: `theme/sections/collection-tabs.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `eyebrow` — Eyebrow | `text` | `New arrivals` |  |
| `heading` — Heading | `text` | `Just` |  |
| `heading_italic` — Heading (italic part) | `text` | `landed` |  |
| `entrance` — Heading entrance | `select` | `cut` | `none`: None; `cut`: Editorial masked reveal; `rise`: Rise word by word (Split Text); `blur`: Blur in word by word (Text Effect); `fold`: Paper fold (Fold Text); `flip`: Flip up; `skew`: Skew in; `pop`: Pop; `fade`: Fade |
| `limit` — Products per tab | `range` | `8` | 2–12, step 1 |
| `columns_desktop` — Columns on desktop | `range` | `4` | 2–5, step 1 |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `card_appearance` — Card appearance | `select` | `inherit` | `inherit`: Use theme default; `minimal`: Minimal; `editorial`: Editorial; `bordered`: Bordered; `image-led`: Image focused |
| `card_ratio` — Image ratio | `select` | `inherit` | `inherit`: Use theme default; `square`: Square; `portrait`: Portrait (4:5); `tall`: Tall (2:3); `landscape`: Landscape (4:3) |
| `card_fit` — Image fit | `select` | `inherit` | `inherit`: Use theme default; `cover`: Fill; `contain`: Contain |
| `card_hover` — Alternate media | `select` | `inherit` | `inherit`: Use theme default; `auto`: Video with image fallback; `image`: Second image only; `off`: Off |
| `card_vendor` — Show vendor | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `card_price` — Show price | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `card_badges` — Show badges | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `card_sizes` — Show sizes | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `tab_style` — Tab appearance | `select` | `underline` | `underline`: Underline; `pills`: Pills; `sidebar`: Desktop sidebar |
| `columns_mobile` — Columns on phones | `select` | `1` | `1`: 1; `2`: 2 |
| `grid_gap` — Column gap | `range` | `8` | 0–40px, step 2 |
| `transitions` — Animate tab changes | `checkbox` | `true` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters; Sets the width of the image and text together. Background stays full width. All options keep the theme's responsive page gutters. |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px. Custom values are exact and are not multiplied by the global smaller-screen spacing setting.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Tab** (`tab`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `collection` — Collection | `collection` | Not specified |  |
| `label` — Tab label | `text` | Not specified | Defaults to the collection title. |
| `limit` — Products in this tab | `range` | `0` | 0–12, step 1; Zero uses the section products-per-tab setting. |

Add-menu presets:

- Collection tabs; initial blocks `[{"type":"tab"},{"type":"tab"}]`.
- Pill collection tabs — `{"tab_style":"pills"}`; initial blocks `[{"type":"tab"},{"type":"tab"}]`.
- Sidebar collections — `{"tab_style":"sidebar"}`; initial blocks `[{"type":"tab"},{"type":"tab"}]`.

#### Collections grid (collections)

Source: `theme/sections/collections.liquid`. Editor: select this section in its template or section group.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `grid_item_width` — Card size | `select` | `collections--full` | `collections--compact`: Compact; `collections--full`: Large |
| `grid_gap` — Grid gap | `range` | `20` | 0–50px, step 5 |
| `heading` — Heading | `text` | Not specified | Defaults to the translated collections title. |
| `eyebrow` — Eyebrow | `text` | `Directory` |  |
| `collections` — Selected collections | `collection_list` | Not specified | Choose and reorder collections. Empty uses all store collections. |
| `page_size` — Collections per page | `range` | `24` | 4–48, step 4 |
| `show_empty` — Show empty collections | `checkbox` | `false` |  |
| `show_index` — Show index | `checkbox` | `true` |  |
| `show_count` — Show count | `checkbox` | `true` |  |
| `show_description` — Show description | `checkbox` | `true` |  |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `image_fit` — Image fit | `select` | `contain` | `contain`: Entire image; `cover`: Fill and crop |
| `image_ratio` — Image shape | `select` | `portrait` | `portrait`: Portrait; `square`: Square; `landscape`: Landscape |
| `image_frame` — Image background | `select` | `studio` | `studio`: White studio; `scheme`: Scheme surface |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters; Sets the width of the image and text together. Background stays full width. All options keep the theme's responsive page gutters. |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px. Custom values are exact and are not multiplied by the global smaller-screen spacing setting.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Add-menu presets:

- Collections grid.
- Curated collection directory — `{"image_frame":"scheme","image_ratio":"square"}`.

#### Comparison table (comparison-table)

Source: `theme/sections/comparison-table.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

Current section block cap: 24.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `Compare fabrics` |  |
| `text` — Text | `richtext` | Not specified |  |
| `feature_label` — First column heading | `text` | `Feature` |  |
| `column_1` — Column 1 heading | `text` | `Linen` |  |
| `column_2` — Column 2 heading | `text` | `Cotton` |  |
| `column_3` — Column 3 heading | `text` | `Wool` | Leave blank for two columns. |
| `column_4` — Column 4 heading | `text` | Not specified | Needs column 3. |
| `highlight` — Highlight column | `select` | `1` | `none`: None; `1`: Column 1; `2`: Column 2; `3`: Column 3; `4`: Column 4 |
| `appearance` — Rows | `select` | `ruled` | `ruled`: Ruled; `striped`: Striped; `boxed`: Boxed |
| `mark_style` — "Yes" shown as | `select` | `check` | `check`: Check mark; `dot`: Dot; `word`: Word |
| `header_style` — Column headings | `select` | `spec` | `spec`: Small caps; `heading`: Heading font |
| `text_size` — Text size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large |
| `sticky_first` — Keep first column visible while scrolling | `checkbox` | `true` |  |
| `footnote` — Footnote | `richtext` | Not specified |  |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Row** (`row`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `feature` — Feature | `text` | `Breathable` |  |
| `note` — Feature note | `text` | Not specified |  |
| `value_1` — Column 1 value | `text` | `yes` | Type yes or no for a mark or dash, or any short text. |
| `value_2` — Column 2 value | `text` | `yes` |  |
| `value_3` — Column 3 value | `text` | `no` |  |
| `value_4` — Column 4 value | `text` | Not specified |  |

Add-menu presets:

- Comparison table; initial blocks `[{"type":"row"},{"type":"row","settings":{"feature":"Machine washable","value_1":"no","value_2":"yes","value_3":"no"}},{"type":"row","settings":{"feature":"Warmth","value_1":"Light","value_2":"Medium","value_3":"High"}}]`.

#### Contact form (contact-form)

Source: `theme/sections/contact-form.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

Current section block cap: 8.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `Get in touch` |  |
| `text` — Text | `richtext` | `<p>Questions about sizing, an order or alterations? We reply within one business day.</p>` |  |
| `details` — Contact details | `richtext` | Not specified | For example opening hours, email address or studio address. |
| `layout` — Desktop layout | `select` | `split` | `stacked`: Stacked; `split`: Intro beside form |
| `card_style` — Form panel | `select` | `plain` | `plain`: Plain; `surface`: Surface fill; `outline`: Outline; `shadow`: Soft shadow |
| `field_style` — Field style | `select` | `outline` | `outline`: Outlined; `filled`: Filled; `underline`: Underline |
| `show_phone` — Show phone field | `checkbox` | `true` |  |
| `message_rows` — Message box height (rows) | `range` | `6` | 3–12, step 1 |
| `consent` — Text above the button | `richtext` | Not specified | For example a note about how you use the information. |
| `button_label` — Button label | `text` | Not specified | Defaults to "Send". |
| `button_style` — Button style | `select` | `solid` | `solid`: Solid; `outline`: Outline; `pill`: Pill; `sweep`: Center sweep; `offset`: Offset shadow; `press`: 3D press |
| `button_width` — Button width | `select` | `auto` | `auto`: Fit label; `full`: Full width |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Extra field** (`field`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `label` — Label | `text` | `Order number` |  |
| `type` — Field type | `select` | `text` | `text`: Short text; `textarea`: Long text; `select`: Dropdown; `date`: Date; `number`: Number; `tel`: Phone; `url`: Website |
| `choices` — Dropdown choices | `text` | `Order, Returns, Sizing` | Comma-separated. Used for Dropdown. |
| `placeholder` — Placeholder | `text` | Not specified |  |
| `width` — Width | `select` | `full` | `half`: Half; `full`: Full |
| `required` — Required | `checkbox` | `false` |  |

Add-menu presets:

- Contact form.

#### Countdown (countdown)

Source: `theme/sections/countdown.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `The winter sale ends soon` |  |
| `text` — Text | `richtext` | Not specified |  |
| `alignment` — Alignment | `select` | `center` | `left`: Left; `center`: Center |
| `end_date` — End date | `text` | `2026-12-31` | Format YYYY-MM-DD. |
| `end_time` — End time | `text` | `23:59` | 24-hour HH:MM in the shop time zone. |
| `show_days` — Show days | `checkbox` | `true` |  |
| `show_date` — Show the end date under the timer | `checkbox` | `true` |  |
| `ended_message` — Message after the end | `text` | `This offer has ended.` |  |
| `hide_when_ended` — Hide the timer after the end | `checkbox` | `false` |  |
| `layout` — Desktop layout | `select` | `stacked` | `stacked`: Heading above timer; `inline`: Heading beside timer |
| `appearance` — Digit style | `select` | `boxes` | `plain`: Plain; `boxes`: Boxes; `outline`: Outline; `inverted`: Inverted boxes |
| `digit_size` — Digit size (desktop) | `range` | `72` | 32–120px, step 4 |
| `accent_digits` — Accent color for digits | `checkbox` | `false` |  |
| `show_labels` — Show unit labels | `checkbox` | `true` |  |
| `separators` — Colons between units | `checkbox` | `false` |  |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Button** (`button`); type limit 2.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `label` — Label | `text` | `Shop now` |  |
| `link` — Link | `url` | `/collections/all` |  |
| `style` — Style | `select` | `solid` | `solid`: Solid; `outline`: Outline; `pill`: Pill; `sweep`: Center sweep; `offset`: Offset shadow; `press`: 3D press; `link`: Text link |
| `new_tab` — Open link in a new tab | `checkbox` | `false` |  |

Add-menu presets:

- Countdown; initial blocks `[{"type":"button","settings":{"label":"Shop the sale"}}]`.

#### Counter band (counter-band)

Source: `theme/sections/counter-band.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

Current section block cap: 8.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `In numbers` |  |
| `text` — Text | `richtext` | Not specified |  |
| `alignment` — Alignment | `select` | `center` | `left`: Left; `center`: Center |
| `columns` — Columns (desktop) | `range` | `4` | 2–6, step 1 |
| `gap` — Gap between statistics | `range` | `16` | 0–64px, step 4 |
| `card_style` — Card style | `select` | `outline` | `plain`: Plain; `surface`: Surface fill; `outline`: Outline; `shadow`: Soft shadow |
| `dividers` — Vertical divider lines | `checkbox` | `false` |  |
| `value_size` — Number size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large |
| `accent_values` — Accent color for numbers | `checkbox` | `false` |  |
| `label_position` — Label position | `select` | `below` | `below`: Below the number; `above`: Above the number |
| `animate` — Count up when visible | `checkbox` | `true` | Skipped when visitors prefer reduced motion or motion is off. |
| `duration` — Count duration | `range` | `1600` | 600–3000ms, step 200; Shown when `{{ section.settings.animate }}` |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Statistic** (`stat`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `value` — Number | `text` | `1200` | Digits with optional decimals and thousands separators, such as 4.9 or 12,000. |
| `prefix` — Prefix | `text` | Not specified |  |
| `suffix` — Suffix | `text` | Not specified |  |
| `label` — Label | `text` | `Happy customers` |  |
| `text` — Description | `richtext` | Not specified |  |

Add-menu presets:

- Counter band; initial blocks `[{"type":"stat","settings":{"value":"12,000","suffix":"+","label":"Orders shipped"}},{"type":"stat","settings":{"value":"4.9","suffix":"/5","label":"Average rating"}},{"type":"stat","settings":{"value":"38","label":"Countries"}},{"type":"stat","settings":{"value":"100","suffix":"%","label":"Natural fibres"}}]`.

#### Custom section (custom-section)

Source: `theme/sections/custom-section.liquid`. Editor: select this section in its template or section group.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `background_image` — Background | `image_picker` | Not specified |  |

Supported block: **@theme** (`@theme`).

Add-menu presets:

- Custom section.

#### Divider (divider)

Source: `theme/sections/divider.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `style` — Style | `select` | `elastic` | `line`: Line; `elastic`: Elastic line (reacts to the pointer); `dashed`: Dashed line; `space`: Blank spacing |
| `grab` — Pointer catch distance | `range` | `14` | 4–40px, step 2 |
| `spacing` — Spacing | `range` | `24` | 0–96px, step 4 |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `width` — Line width | `select` | `content` | `content`: Page width; `short`: Short centered line; `full`: Full bleed |
| `thickness` — Line thickness | `range` | `1` | 1–4px, step 1 |

Add-menu presets:

- Divider.
- Quiet separator — `{"style":"line","width":"short","spacing":48}`.
- Section spacer — `{"style":"space"}`.

#### Expanding media (expand-media)

Source: `theme/sections/expand-media.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `animate` — Scroll expansion | `checkbox` | `true` | Desktop sticky storytelling. Phones, reduced motion and the editor show the final frame without a long scroll track. |
| `image` — Image | `image_picker` | Not specified |  |
| `video` — Video | `video` | Not specified | Plays muted while on screen; visitors can pause it. |
| `video_url` — Video file URL | `url` | Not specified | Optional MP4 address, used when no video is picked above. |
| `poster_url` — Video poster image URL | `url` | Not specified |  |
| `collection` — Use collection image | `collection` | Not specified | Shown when no video or image is set. |
| `title` — Title over the closed frame | `text` | `Built to move` | Decorative; repeat important words in the heading block. |
| `hint` — Scroll hint | `text` | `Scroll` |  |
| `start_width` — Starting width | `range` | `42` | 30–90%, step 2 |
| `start_height` — Starting height | `range` | `58` | 30–90%, step 2 |
| `length` — Scroll length | `select` | `long` | `short`: Short; `long`: Long |
| `scrim` — Tint when open | `range` | `45` | 0–80%, step 5 |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-2` |  |
| `video_autoplay` — Autoplay muted video | `checkbox` | `true` |  |
| `alignment` — Content alignment | `select` | `center` | `center`: Center; `left`: Left; `right`: Right |
| `static_height` — Static campaign height | `select` | `regular` | `regular`: Full scene; `compact`: Compact; Minimum height only. Static content grows to fit long copy; applies on phones and when expansion is off. |
| `copy_width` — Content width | `range` | `60` | 28–72ch, step 2 |

Supported block: **Heading** (`heading`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `Every detail, full frame` |  |
| `scale` — Heading size | `range` | `100` | 50–150%, step 5 |

Supported block: **Text** (`text`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `text` — Text | `richtext` | Not specified |  |

Supported block: **Button** (`button`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `label` — Label | `text` | `Shop the drop` |  |
| `link` — Link | `url` | Not specified |  |
| `style` — Button style | `select` | `solid` | `solid`: Filled; `outline`: Outline; `link`: Text |
| `corners` — Corners | `select` | `inherit` | `inherit`: Theme default; `square`: Square; `soft`: Soft; `pill`: Pill |
| `arrow` — Show arrow | `checkbox` | `false` |  |

Add-menu presets:

- Expanding media; initial blocks `[{"type":"heading"},{"type":"button"}]`.
- Static campaign — `{"animate":false,"static_height":"compact","alignment":"left"}`; initial blocks `[{"type":"heading"},{"type":"text"},{"type":"button"}]`.

#### FAQ (faq)

Source: `theme/sections/faq.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `Frequently asked questions` |  |
| `text` — Introduction | `richtext` | Not specified |  |
| `layout` — Layout | `select` | `list` | `list`: Stacked; `split`: Introduction beside questions |
| `appearance` — Appearance | `select` | `lines` | `lines`: Ruled list; `cards`: Cards |
| `marker` — Disclosure icon | `select` | `plus` | `plus`: Plus / minus; `chevron`: Chevron; `none`: None |
| `single_open` — Only one answer open at a time | `checkbox` | `false` |  |
| `first_open` — Open first answer initially | `checkbox` | `false` |  |
| `animate` — Animate opening and closing | `checkbox` | `true` |  |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters; Sets the width of the image and text together. Background stays full width. All options keep the theme's responsive page gutters. |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px. Custom values are exact and are not multiplied by the global smaller-screen spacing setting.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Question** (`question`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `question` — Question | `text` | `Your question` |  |
| `answer` — Answer | `richtext` | `<p>Share a helpful answer with your customers.</p>` |  |
| `page` — Answer from a page | `page` | Not specified | Overrides the answer above. |
| `open` — Open initially | `checkbox` | `false` |  |

Add-menu presets:

- FAQ; initial blocks `[{"type":"question"},{"type":"question"},{"type":"question"}]`.
- Split FAQ cards — `{"layout":"split","appearance":"cards"}`; initial blocks `[{"type":"question"},{"type":"question"}]`.

#### Feature grid (feature-grid)

Source: `theme/sections/feature-grid.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `What makes us different` |  |
| `text` — Introduction | `richtext` | Not specified |  |
| `layout` — Layout | `select` | `grid` | `grid`: Grid; `list`: List |
| `appearance` — Card appearance | `select` | `plain` | `plain`: Plain; `bordered`: Bordered; `surface`: Surface |
| `alignment` — Alignment | `select` | `left` | `left`: Left; `center`: Center |
| `columns` — Desktop columns | `range` | `3` | 1–4, step 1 |
| `columns_mobile` — Phone columns | `select` | `1` | `1`: 1; `2`: 2 |
| `gap` — Card gap | `range` | `24` | 12–48px, step 4 |
| `icon_size` — Icon size | `range` | `48` | 24–80px, step 4 |
| `animate` — Subtle card entrances | `checkbox` | `false` |  |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters; Sets the width of the image and text together. Background stays full width. All options keep the theme's responsive page gutters. |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px. Custom values are exact and are not multiplied by the global smaller-screen spacing setting.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Feature** (`feature`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `icon` — Icon | `select` | `none` | `none`: None; `check`: Check; `star`: Star; `leaf`: Leaf; `box`: Package; `truck`: Delivery |
| `image` — Decorative icon or image | `image_picker` | Not specified |  |
| `heading` — Heading | `text` | `Product feature` |  |
| `text` — Text | `richtext` | Not specified |  |
| `appearance` — Appearance | `select` | `inherit` | `inherit`: Use section choice; `plain`: Plain; `bordered`: Bordered; `surface`: Surface |
| `link` — Link | `url` | Not specified |  |
| `link_label` — Link label | `text` | Not specified |  |

Add-menu presets:

- Feature grid; initial blocks `[{"type":"feature"},{"type":"feature"},{"type":"feature"}]`.
- Feature cards — `{"appearance":"bordered","alignment":"center"}`; initial blocks `[{"type":"feature"},{"type":"feature"},{"type":"feature"}]`.
- Feature list — `{"layout":"list"}`; initial blocks `[{"type":"feature"},{"type":"feature"},{"type":"feature"}]`.

#### Feature list (feature-list)

Source: `theme/sections/feature-list.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

Current section block cap: 12.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `Good to know` |  |
| `text` — Text | `richtext` | Not specified |  |
| `alignment` — Alignment | `select` | `left` | `left`: Left; `center`: Center |
| `columns` — Columns (desktop) | `range` | `3` | 1–6, step 1 |
| `columns_mobile` — Columns (phones) | `select` | `1` | `1`: 1 column; `2`: 2 columns |
| `gap` — Gap between features | `range` | `28` | 0–64px, step 4 |
| `layout` — Icon placement | `select` | `stacked` | `stacked`: Above text; `inline`: Beside text |
| `card_style` — Card style | `select` | `plain` | `plain`: Plain; `surface`: Surface fill; `outline`: Outline; `shadow`: Soft shadow |
| `dividers` — Divider line above each feature | `checkbox` | `false` |  |
| `title_size` — Feature title size | `select` | `medium` | `medium`: Medium; `large`: Large |
| `icon_style` — Icon background | `select` | `circle` | `plain`: None; `circle`: Circle; `square`: Square; `outline`: Outline circle |
| `icon_size` — Icon size | `range` | `28` | 16–64px, step 4 |
| `icon_color` — Icon color | `select` | `accent` | `accent`: Accent; `text`: Text |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Feature** (`feature`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `icon` — Icon | `select` | `truck` | `none`: None; `truck`: Delivery; `arrow-path`: Returns; `scissors`: Tailoring; `sparkles`: Quality; `heart`: Care; `globe-alt`: Worldwide; `lock-closed`: Secure; `shield-check`: Guarantee; `gift`: Gift; `bolt`: Fast; `adjustments-vertical`: Fit; `check`: Check |
| `image` — Custom icon | `image_picker` | Not specified | Replaces the icon above. Use a square image or SVG. |
| `title` — Title | `text` | `Free delivery` |  |
| `text` — Text | `richtext` | `<p>On orders over a set amount, tracked to your door.</p>` |  |
| `link_label` — Link label | `text` | Not specified |  |
| `link` — Link | `url` | Not specified |  |

Add-menu presets:

- Feature list; initial blocks `[{"type":"feature","settings":{"icon":"truck","title":"Free delivery"}},{"type":"feature","settings":{"icon":"arrow-path","title":"Easy returns"}},{"type":"feature","settings":{"icon":"scissors","title":"Free alterations"}}]`.

#### Featured collection (featured-collection)

Source: `theme/sections/featured-collection.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `eyebrow` — Eyebrow | `text` | `Featured drop` |  |
| `heading` — Heading | `text` | `New in` |  |
| `heading_italic` — Heading (italic part) | `text` | Not specified |  |
| `description` — Description | `text` | Not specified |  |
| `show_collection_description` — Use collection description when empty | `checkbox` | `true` |  |
| `collection` — Collection | `collection` | Not specified |  |
| `limit` — Products to show | `range` | `8` | 2–16, step 1 |
| `layout` — Layout | `select` | `grid` | `grid`: Grid; `carousel`: Product carousel |
| `carousel_effect` — Carousel style | `select` | `liquid` | `liquid`: Editorial strip; `native`: Classic product rail; `snap`: Snap slider (no WebGL); In browse mode, phones and tablets use a lightweight swipe rail.; Shown when `{{ section.settings.layout == 'carousel' }}` |
| `carousel_purchase` — Shop the highlighted product | `checkbox` | `true` | Shows one Add to cart button for the centred product. It opens that product's sizes, and the chosen size is added. Autoplay holds while sizes are open. Turn off for a browse-only carousel that links to products.; Shown when `{{ section.settings.layout == 'carousel' }}` |
| `carousel_intro` — Carousel entrance | `select` | `rise` | `rise`: Rise; `bloom`: Bloom; `deal`: Spread; `spin`: Spin; `none`: None; Shown when `{{ section.settings.layout == 'carousel' and section.settings.carousel_effect == 'liquid' }}` |
| `carousel_center_products` — Products before the curve | `range` | `4` | 3–6, step 1; Approximate number of products in the flatter desktop center. Original image proportions are preserved; outer products curve away.; Shown when `{{ section.settings.layout == 'carousel' and section.settings.carousel_effect == 'liquid' and section.settings.carousel_purchase == false }}` |
| `carousel_autoplay` — Advance products automatically | `checkbox` | `true` | Browse mode flows continuously; shop mode steps product by product and holds while a shopper hovers the purchase controls or chooses a size. Dragging, keyboard focus and the pause button always pause it.; Shown when `{{ section.settings.layout == 'carousel' }}` |
| `carousel_interval` — Autoplay pace | `range` | `1.5` | 1–8s, step 0.5; Liquid browse mode: approximate travel time per product. Liquid shop mode and snap rail: time each product stays highlighted.; Shown when `{{ section.settings.layout == 'carousel' and section.settings.carousel_effect != 'native' and section.settings.carousel_autoplay }}` |
| `carousel_speed` — Carousel speed | `range` | `35` | 10–80, step 5; Higher values move faster. Controls native rail speed or liquid flow/manual response; autoplay pace sets the base travel time. |
| `columns_mobile` — Columns on phones | `select` | `1` | `1`: 1; `2`: 2 |
| `columns_desktop` — Columns on desktop | `range` | `4` | 2–5, step 1 |
| `show_view_all` — Show 'View all' button | `checkbox` | `true` |  |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `products` — Custom product selection | `product_list` | Not specified | Picker limit 24; Overrides the collection. An empty list uses the collection; there is no all-products fallback. |
| `grid_style` — Grid arrangement | `select` | `regular` | `regular`: Regular; `dense`: Compact rows; `editorial`: Large first product |
| `grid_gap` — Column gap (desktop) | `range` | `8` | 0–48px, step 2 |
| `grid_gap_mobile` — Column gap (phones) | `range` | `8` | 0–32px, step 2 |
| `heading_alignment` — Heading alignment | `select` | `left` | `left`: Left; `center`: Center |
| `show_count` — Show product counts | `checkbox` | `true` |  |
| `link` — View all destination | `url` | Not specified | Required for a custom product selection. Otherwise uses the collection. |
| `link_label` — View all label | `text` | `View all` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters; Sets the width of the image and text together. Background stays full width. All options keep the theme's responsive page gutters. |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px. Custom values are exact and are not multiplied by the global smaller-screen spacing setting.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `carousel_card_width` — Rail card width | `select` | `regular` | `regular`: Regular; `compact`: Compact; `wide`: Wide; Shown when `{{ section.settings.layout == 'carousel' }}` |
| `carousel_gap` — Rail spacing | `select` | `regular` | `regular`: Regular; `compact`: Compact; `airy`: Airy; Shown when `{{ section.settings.layout == 'carousel' }}` |
| `carousel_emphasis` — Highlight active card | `checkbox` | `true` |  |
| `carousel_arrows` — Show carousel arrows | `checkbox` | `true` | For classic and snap rails. The liquid carousel uses drag and keyboard navigation with a minimal pause control. |

Supported block: **Product card presentation** (`card_style`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `card_appearance` — Card appearance | `select` | `inherit` | `inherit`: Use theme default; `minimal`: Minimal; `editorial`: Editorial; `bordered`: Bordered; `image-led`: Image focused |
| `card_ratio` — Image ratio | `select` | `inherit` | `inherit`: Use theme default; `square`: Square; `portrait`: Portrait (4:5); `tall`: Tall (2:3); `landscape`: Landscape (4:3) |
| `card_fit` — Image fit | `select` | `inherit` | `inherit`: Use theme default; `cover`: Fill; `contain`: Contain |
| `card_hover` — Alternate media | `select` | `inherit` | `inherit`: Use theme default; `auto`: Video with image fallback; `image`: Second image only; `off`: Off |
| `card_vendor` — Show vendor | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `card_price` — Show price | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `card_badges` — Show badges | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `card_sizes` — Show sizes | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |

Add-menu presets:

- Featured collection; initial blocks `[{"type":"card_style","settings":{}}]`.
- Editorial product grid — `{"grid_style":"editorial","columns_desktop":3}`; initial blocks `[{"type":"card_style","settings":{"card_appearance":"editorial"}}]`.
- Bordered product grid — `{"grid_gap":24,"heading_alignment":"center"}`; initial blocks `[{"type":"card_style","settings":{"card_appearance":"bordered"}}]`.
- Snap product slider — `{"layout":"carousel","carousel_effect":"snap","carousel_autoplay":false}`; initial blocks `[{"type":"card_style","settings":{}}]`.
- Classic product rail — `{"layout":"carousel","carousel_effect":"native"}`; initial blocks `[{"type":"card_style","settings":{}}]`.

#### Footer (footer)

Source: `theme/sections/footer.liquid`. Editor: select this section in its template or section group.

Available contexts: `{"groups":["footer"]}`.

Section instance limit: 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `show_newsletter` — Show newsletter signup | `checkbox` | `true` |  |
| `newsletter_eyebrow` — Newsletter label | `text` | `A note from us` |  |
| `newsletter_heading` — Newsletter heading | `text` | `Good things, first.` |  |
| `show_wordmark` — Show large brand name | `checkbox` | `true` |  |
| `background` — Background | `color` | `#432d23` |  |
| `ink` — Text | `color` | `#f5ecdf` |  |
| `accent` — Light beam and accents | `color` | `#d7ae83` |  |
| `animate_beam` — Animate soft light beam | `checkbox` | `true` |  |
| `invert_logo` — Use light logo on dark background | `checkbox` | `true` |  |
| `show_payment_icons` — Show payment icons | `checkbox` | `true` |  |
| `reveal` — Reveal footer on scroll (desktop) | `checkbox` | `true` | Page content scrolls away to uncover the footer when it fits in the viewport. Desktop only. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-2` |  |
| `layout` — Layout | `select` | `editorial` | `editorial`: Editorial; `columns`: Stacked signup and columns; `compact`: Compact wrap |
| `density` — Spacing | `select` | `regular` | `regular`: Regular; `compact`: Compact; `airy`: Airy |
| `palette_mode` — Colors | `select` | `custom` | `custom`: Custom footer palette; `scheme`: Selected color scheme |
| `mobile_menus` — Phone menus | `select` | `accordion` | `accordion`: Collapsible; `open`: Always expanded |
| `column_width` — Minimum desktop column width | `range` | `160` | 140–280px, step 20 |
| `logo_width` — Logo width | `range` | `220` | 100–320px, step 10 |
| `wordmark_scale` — Large brand name scale | `range` | `100` | 70–100%, step 5 |
| `show_policies` — Show policy links | `checkbox` | `true` |  |
| `show_back_to_top` — Show back to top | `checkbox` | `true` |  |

Supported block: **Brand** (`brand`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `text` — Text | `richtext` | Not specified |  |

Supported block: **Menu** (`menu`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | Not specified |  |
| `menu` — Menu | `link_list` | `footer` |  |

Supported block: **Social links** (`social`); type limit 1.

No local settings.

No add-menu preset: rendered by an existing template/layout/group or used as a rendering endpoint.

#### Header (header)

Source: `theme/sections/header.liquid`. Editor: select this section in its template or section group.

Available contexts: `{"groups":["header"]}`.

Section instance limit: 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `menu` — Menu | `link_list` | `main-menu` |  |
| `customer_account_menu` — Customer account menu | `link_list` | `customer-account-main-menu` |  |
| `layout` — Desktop layout | `select` | `center` | `center`: Logo centered; `left`: Logo left; `two-row`: Centered logo with navigation below |
| `sticky` — Sticky header | `select` | `reveal` | `off`: Off; `always`: Always visible; `reveal`: Show when scrolling up |
| `panel_style` — Desktop menu panels | `select` | `attached` | `attached`: Full width; `floating`: Floating card (morphs between items) |
| `link_hover` — Menu link hover | `select` | `underline` | `underline`: Underline; `swap`: Letter swap |
| `drawer_style` — Phone menu style | `select` | `standard` | `standard`: Standard list; `editorial`: Editorial (large numbered items); `cards`: Cards |
| `search_style` — Desktop search | `select` | `icon` | `icon`: Icon; `pill`: Expanding field |
| `predictive_search` — Show search suggestions as you type | `checkbox` | `true` | Search opens a panel with products, collections and suggested queries. |
| `search_collections` — Collections suggested in search | `collection_list` | Not specified |  |
| `overlay_home` — Overlay the homepage hero | `checkbox` | `false` | Only applies when the first homepage section supports overlay (for example the campaign hero). |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `nav_trigger` — Desktop submenu opening | `select` | `hover` | `hover`: Hover or click; `click`: Click only |
| `dropdown_layout` — Dropdown links | `select` | `auto` | `auto`: Automatic grouping; `list`: Stacked groups |
| `logo_treatment` — Logo image colors | `select` | `ink` | `ink`: Original theme ink treatment; `original`: Preserve uploaded colors |
| `logo_animation` — Logo animation on load | `select` | `ink` | `none`: None; `ink`: Ink reveal (written left to right); `rise`: Soft rise; Follows Theme settings > Motion; never plays with reduced motion or in the theme editor. |
| `logo_animation_frequency` — Play logo animation | `select` | `session` | `session`: Once per visit; `every`: On every page |
| `height` — Minimum desktop header height | `range` | `76` | 60–120px, step 4 |
| `height_mobile` — Minimum phone header height | `range` | `64` | 56–88px, step 4 |
| `show_account` — Show customer account | `checkbox` | `true` |  |
| `show_search` — Show header search | `checkbox` | `true` |  |
| `search_resources` — Search suggestions | `select` | `query,product,collection,page` | `query,product,collection,page`: Products, collections, pages and queries; `query,product,collection`: Products, collections and queries; `product`: Products only |
| `search_limit` — Results per suggestion type | `range` | `6` | 2–10, step 1 |
| `suggestion_limit` — Initial collection suggestions | `range` | `6` | 2–12, step 1 |

Supported block: **Menu card description** (`group_description`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `menu_item` — Menu item title | `text` | Not specified | Shown in the Cards phone menu under this top-level item. |
| `text` — Description | `text` | Not specified |  |

Supported block: **Menu promo card** (`promo`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `menu_item` — Show under menu item | `text` | Not specified | Type the exact title of a top-level menu item. |
| `image` — Image | `image_picker` | Not specified |  |
| `title` — Title | `text` | `Campaign` |  |
| `link` — Link | `url` | Not specified |  |

No add-menu preset: rendered by an existing template/layout/group or used as a rendering endpoint.

#### Hero: image overlay (hero-overlay)

Source: `theme/sections/hero-overlay.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `image` — Image | `image_picker` | Not specified |  |
| `image_mobile` — Mobile image | `image_picker` | Not specified |  |
| `overlay_style` — Overlay | `select` | `solid` | `solid`: Even tint; `bottom`: Gradient from bottom; `side`: Gradient from left |
| `overlay_opacity` — Overlay strength | `range` | `30` | 0–90%, step 5 |
| `text_tone` — Text color over image | `select` | `light` | `light`: Light; `dark`: Dark |
| `height` — Height (desktop) | `select` | `large` | `small`: Small; `medium`: Medium; `large`: Large; `full`: Full screen |
| `mobile_height` — Height (phones) | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `full`: Full screen |
| `content_position` — Content position (desktop) | `select` | `bottom-left` | `top-left`: Top left; `top-center`: Top center; `top-right`: Top right; `middle-left`: Middle left; `middle-center`: Middle center; `middle-right`: Middle right; `bottom-left`: Bottom left; `bottom-center`: Bottom center; `bottom-right`: Bottom right |
| `mobile_position` — Content position (phones) | `select` | `bottom` | `top`: Top; `middle`: Middle; `bottom`: Bottom |
| `alignment` — Text alignment | `select` | `left` | `left`: Left; `center`: Center |
| `content_max_width` — Content max width | `range` | `720` | 320–1040px, step 40 |
| `content_box` — Content background | `select` | `none` | `none`: None; `blur`: Frosted glass; `solid`: Solid panel |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Caption** (`caption`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `caption` — Caption | `text` | `New season` |  |
| `style` — Style | `select` | `spec` | `spec`: Small caps; `badge`: Badge; `plain`: Plain text |

Supported block: **Heading** (`heading`); type limit 2.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `Made to move with you` |  |
| `size` — Size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `italic` — Italic | `checkbox` | `false` |  |

Supported block: **Text** (`text`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `text` — Text | `richtext` | `<p>Pair large imagery with a short story about the collection, the fabric or the fit.</p>` |  |
| `size` — Text size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large |
| `color` — Text color | `select` | `default` | `default`: Default; `muted`: Muted |

Supported block: **Spacer** (`spacer`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `height` — Height | `range` | `16` | 0–80px, step 4 |

Supported block: **Button** (`button`); type limit 3.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `label` — Label | `text` | `Shop now` |  |
| `link` — Link | `url` | `/collections/all` |  |
| `style` — Style | `select` | `solid` | `solid`: Solid; `outline`: Outline; `pill`: Pill; `sweep`: Center sweep; `offset`: Offset shadow; `press`: 3D press; `link`: Text link |
| `new_tab` — Open link in a new tab | `checkbox` | `false` |  |

Add-menu presets:

- Hero: image overlay; initial blocks `[{"type":"caption"},{"type":"heading","settings":{"size":"xlarge"}},{"type":"text"},{"type":"button","settings":{"style":"solid"}}]`.

#### Hero: split (hero-split)

Source: `theme/sections/hero-split.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `image` — Image | `image_picker` | Not specified |  |
| `image_mobile` — Mobile image | `image_picker` | Not specified | Optional. Shown on screens below 750px. |
| `image_position` — Image position (desktop) | `select` | `right` | `left`: Left; `right`: Right |
| `image_fit` — Image fit | `select` | `cover` | `cover`: Fill frame (crop); `contain`: Show whole image |
| `split` — Column widths | `select` | `even` | `even`: Half and half; `image`: Larger image; `text`: Larger text |
| `mobile_order` — On phones | `select` | `image_first` | `image_first`: Image above text; `text_first`: Text above image |
| `mobile_image_height` — Image height on phones | `range` | `90` | 40–140%, step 5; Percentage of the screen width. |
| `eyebrow` — Eyebrow | `text` | `New collection` |  |
| `eyebrow_style` — Eyebrow style | `select` | `spec` | `spec`: Small caps; `badge`: Badge; `plain`: Plain text |
| `heading` — Heading | `text` | `Tailored for the everyday` |  |
| `heading_display` — Heading size | `select` | `large` | `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `heading_italic` — Italic heading | `checkbox` | `false` |  |
| `text` — Text | `richtext` | `<p>Considered essentials cut from natural fibres, made to be worn on repeat.</p>` |  |
| `text_size` — Text size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large |
| `height` — Height (desktop) | `select` | `medium` | `auto`: Adapt to content; `medium`: Medium; `large`: Large; `full`: Full screen |
| `alignment` — Text alignment | `select` | `left` | `left`: Left; `center`: Center |
| `vertical_alignment` — Text vertical position | `select` | `middle` | `top`: Top; `middle`: Middle; `bottom`: Bottom |
| `panel` — Panel style | `select` | `surface` | `surface`: Surface fill; `outline`: Outline; `none`: None |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Button** (`button`); type limit 3.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `label` — Label | `text` | `Shop now` |  |
| `link` — Link | `url` | `/collections/all` |  |
| `style` — Style | `select` | `solid` | `solid`: Solid; `outline`: Outline; `pill`: Pill; `sweep`: Center sweep; `offset`: Offset shadow; `press`: 3D press; `link`: Text link |
| `new_tab` — Open link in a new tab | `checkbox` | `false` |  |

Add-menu presets:

- Hero: split; initial blocks `[{"type":"button","settings":{"label":"Shop now","style":"solid"}},{"type":"button","settings":{"label":"Our story","style":"link"}}]`.

#### Campaign hero (hero)

Source: `theme/sections/hero.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

Current section block cap: 16.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `scroll_exit` — Gentle scroll exit | `checkbox` | `true` | Copy subtly drifts and fades as the hero leaves. Full motion only; separate from the entrance setting. |
| `video` — Video | `video` | Not specified | Shopify-hosted video. Plays muted. |
| `video_autoplay` — Autoplay background video | `checkbox` | `true` | Muted. Pauses offscreen and when hidden. Reduced motion and the editor require pressing Play. Native controls remain available without JavaScript. |
| `video_url` — Video file URL | `url` | Not specified | Optional MP4 address from Content › Files, used when no video is picked above. |
| `poster_url` — Video poster image URL | `url` | Not specified |  |
| `image` — Image | `image_picker` | Not specified | Also the video poster when no poster URL is set. |
| `collection` — Use collection image | `collection` | Not specified | Shown when no video or image is set. |
| `video_mobile` — Phone video | `video` | Not specified |  |
| `video_url_mobile` — Phone video file URL | `url` | Not specified | Used when no phone video is picked above. |
| `poster_url_mobile` — Phone video poster image URL | `url` | Not specified |  |
| `image_mobile` — Phone image | `image_picker` | Not specified |  |
| `slide_autoplay` — Change slides automatically | `checkbox` | `true` | Visitors can pause it. Off for visitors who prefer reduced motion and in the theme editor. |
| `slide_interval` — Time per slide | `range` | `6` | 3–15s, step 1 |
| `slide_transition` — Transition | `select` | `fade` | `fade`: Crossfade; `zoom`: Fade with slow zoom; `slide`: Slide sideways |
| `slide_dots` — Show slide dots | `checkbox` | `true` |  |
| `height_mobile` — Height on phones | `select` | `inherit` | `inherit`: Use desktop choice; `compact`: Compact (55% of screen); `full`: Full screen; Content can grow taller. Split layouts apply this to the image panel. |
| `media_fit` — Media fit | `select` | `cover` | `cover`: Fill and crop; `contain`: Show entire image or video; Show entire media disables parallax to avoid cropping. Set image focal points in Shopify's image picker. |
| `tint_direction` — Tint distribution | `select` | `bottom` | `bottom`: Stronger at bottom; `top`: Stronger at top; `uniform`: Even tint |
| `layout` — Layout | `select` | `overlay` | `overlay`: Full-bleed, text over media; `editorial`: Editorial cover; `split`: Split, media beside text; Editorial puts the heading bottom left with the text and buttons in a ruled column on the right. Split shows the media next to a solid panel in the color scheme. |
| `media_position` — Media side (split layout) | `select` | `left` | `left`: Left; `right`: Right |
| `height` — Height | `select` | `full` | `adapt`: Adapt to image; `medium`: Medium; `full`: Full screen |
| `position` — Content position | `select` | `bottom-left` | `top-left`: Top left; `top-center`: Top center; `top-right`: Top right; `center-left`: Middle left; `center`: Center; `center-right`: Middle right; `bottom-left`: Bottom left; `bottom-center`: Bottom center; `bottom-right`: Bottom right; Used by the full-bleed and split layouts. Text aligns to the side you pick. |
| `position_mobile` — Content position on phones | `select` | `same` | `same`: Same as desktop; `top-left`: Top left; `top-center`: Top center; `center-left`: Middle left; `center`: Center; `bottom-left`: Bottom left; `bottom-center`: Bottom center |
| `text_align` — Text alignment | `select` | `auto` | `auto`: Follow the position; `left`: Left; `center`: Center; `right`: Right |
| `content_width` — Content width | `range` | `1100` | 360–1400px, step 20 |
| `block_gap` — Space between blocks | `range` | `22` | 8–56px, step 2 |
| `parallax` — Parallax depth | `range` | `14` | 0–30%, step 2 |
| `show_scroll_cue` — Show scroll cue | `checkbox` | `false` |  |
| `scrim_style` — Text backdrop | `select` | `solid` | `none`: None; `solid`: Tint; `blur`: Progressive blur |
| `scrim` — Tint strength | `range` | `30` | 0–80%, step 5 |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-2` |  |
| `type_style` — Type style | `select` | `signature` | `signature`: Signature: large display serif; `quiet`: Quiet: small and understated; `lowercase`: Nonchalant: relaxed lowercase; `caption`: Caption: tiny spaced capitals; `poster`: Poster: heavy capitals, outlined second line; `romantic`: Romantic: light italic serif; `typewriter`: Typewriter: monospace notes; `classic`: Classic caps: spaced serif capitals; `mixed`: Mixed: small sans over a big italic; Changes the fonts, size and case of the eyebrow, heading and text. The heading block's Size setting still scales it. |
| `custom_heading_font` — Use a custom heading font | `checkbox` | `false` |  |
| `heading_font` — Heading font | `font_picker` | `newsreader_n4` | Shown when `{{ section.settings.custom_heading_font }}` |
| `custom_text_font` — Use a custom text font | `checkbox` | `false` |  |
| `text_font` — Text font | `font_picker` | `inter_n4` | Shown when `{{ section.settings.custom_text_font }}` |
| `entrance` — Entrance | `select` | `fade-up` | `fade-up`: Fade up; `text`: Text reveal, line by line; `zoom`: Media zooms out; `curtain`: Media curtain, then text; `none`: None; Plays when the page loads. The heading keeps its own entrance unless this is None. Not shown to visitors who prefer reduced motion or when Motion is off. |

Supported block: **Slide** (`slide`); type limit 10.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `image` — Image | `image_picker` | Not specified | Also the video poster. |
| `video` — Video | `video` | Not specified |  |
| `video_url` — Video file URL | `url` | Not specified | Used when no video is picked. |
| `image_mobile` — Phone image | `image_picker` | Not specified | Optional. Uses the desktop media when empty. |
| `video_mobile` — Phone video | `video` | Not specified |  |
| `video_url_mobile` — Phone video file URL | `url` | Not specified |  |

Supported block: **Eyebrow** (`eyebrow`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `text` — Text | `text` | `New collection` |  |
| `shine` — Shine effect | `checkbox` | `false` |  |
| `size` — Size | `range` | `100` | 80–200%, step 10 |

Supported block: **Heading** (`heading`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `Campaign` |  |
| `heading_italic` — Second line (italic) | `text` | Not specified |  |
| `size` — Size | `range` | `100` | 50–160%, step 5 |
| `size_mobile` — Size on phones | `range` | `100` | 50–160%, step 5 |
| `italic_style` — Italic line style | `select` | `none` | `none`: Plain; `gradient`: Flowing gradient (Gradient Text) |
| `entrance` — Entrance | `select` | `cut` | `none`: None; `cut`: Editorial masked reveal; `rise`: Rise word by word (Split Text); `blur`: Blur in word by word (Text Effect); `fold`: Paper fold (Fold Text); `flip`: Flip up; `skew`: Skew in; `pop`: Pop; `fade`: Fade; Not shown to visitors who prefer reduced motion. |
| `hover` — Heading hover | `select` | `none` | `none`: None; `lift`: Letters lift near the pointer; `refold`: Letters fold near the pointer |
| `text_style` — Text effect | `select` | `none` | `none`: None; `shine`: Shine; `gradient`: Gradient |

Supported block: **Text** (`text`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `text` — Text | `richtext` | Not specified |  |
| `size` — Size | `range` | `100` | 80–160%, step 5 |
| `width` — Line length | `range` | `42` | 20–80ch, step 2 |

Supported block: **Buttons** (`buttons`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `label_1` — First button label | `text` | `Shop now` |  |
| `link_1` — First button link | `url` | Not specified |  |
| `style_1` — First button style | `select` | `solid` | `solid`: Solid; `outline`: Outline; `glass`: Frosted glass; `link`: Text link with arrow |
| `arrow` — Show arrow on first button | `checkbox` | `false` | Text links always show an arrow. |
| `label_2` — Second button label | `text` | Not specified |  |
| `link_2` — Second button link | `url` | Not specified |  |
| `style_2` — Second button style | `select` | `outline` | `solid`: Solid; `outline`: Outline; `glass`: Frosted glass; `link`: Text link with arrow |
| `corners` — Button corners | `select` | `inherit` | `inherit`: Use theme button corners; `square`: Square; `soft`: Rounded; `pill`: Pill; Boxed styles only; text links keep their underline. |
| `size` — Button size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large |
| `alignment` — Button alignment | `select` | `auto` | `auto`: Follow the text; `left`: Left; `center`: Center; `right`: Right |
| `arrangement` — Arrangement | `select` | `row` | `row`: Side by side; `stack`: Stacked |
| `full_width_mobile` — Full width on phones | `checkbox` | `false` |  |
| `gap` — Space between buttons | `range` | `14` | 0–40px, step 2 |
| `offset` — Extra space above | `range` | `0` | 0–64px, step 4 |

Add-menu presets:

- Campaign hero; initial blocks `[{"type":"eyebrow"},{"type":"heading"},{"type":"buttons"}]`.
- Centered hero — `{"position":"center","text_align":"center","content_width":800,"height":"medium"}`; initial blocks `[{"type":"heading"},{"type":"text"},{"type":"buttons"}]`.
- Minimal split hero — `{"layout":"split","color_scheme":"scheme-1","entrance":"none","parallax":0,"scroll_exit":false,"show_scroll_cue":false}`; initial blocks `[{"type":"heading","settings":{"size":70}},{"type":"text"},{"type":"buttons"}]`.
- Image-led hero — `{"position":"bottom-left","scrim":20,"content_width":640}`; initial blocks `[{"type":"eyebrow"},{"type":"buttons"}]`.
- Quiet hero — `{"type_style":"quiet","position":"bottom-left","scrim":20,"content_width":560}`; initial blocks `[{"type":"eyebrow"},{"type":"heading"},{"type":"text"},{"type":"buttons","settings":{"style_1":"link","label_2":""}}]`.
- Nonchalant hero — `{"type_style":"lowercase","position":"bottom-left","scrim":25}`; initial blocks `[{"type":"heading"},{"type":"text"},{"type":"buttons","settings":{"style_1":"link"}}]`.
- Slideshow hero — `{"position":"bottom-left","scrim":30}`; initial blocks `[{"type":"slide"},{"type":"slide"},{"type":"slide"},{"type":"eyebrow"},{"type":"heading"},{"type":"buttons"}]`.
- Poster hero — `{"type_style":"poster","position":"center","text_align":"center","scrim":40}`; initial blocks `[{"type":"eyebrow"},{"type":"heading"},{"type":"buttons"}]`.

#### Before / after (image-compare)

Source: `theme/sections/image-compare.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

Current section block cap: 4.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `See the difference` |  |
| `text` — Text | `richtext` | Not specified |  |
| `alignment` — Alignment | `select` | `left` | `left`: Left; `center`: Center |
| `columns` — Comparisons per row (desktop) | `select` | `1` | `1`: 1; `2`: 2 |
| `gap` — Gap | `range` | `24` | 0–64px, step 4 |
| `ratio` — Image ratio | `select` | `landscape` | `portrait`: Portrait (4:5); `tall`: Tall (2:3); `square`: Square; `landscape`: Landscape (3:2); `wide`: Wide (16:9) |
| `handle_style` — Handle | `select` | `circle` | `circle`: Circle with arrows; `bar`: Rounded bar; `line`: Line only |
| `handle_color` — Handle color | `select` | `light` | `light`: Light; `dark`: Dark; `accent`: Accent |
| `label_position` — Labels | `select` | `bottom` | `bottom`: Bottom corners; `top`: Top corners; `none`: Hidden |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Comparison** (`comparison`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `before` — Before image | `image_picker` | Not specified |  |
| `after` — After image | `image_picker` | Not specified |  |
| `before_label` — Before label | `text` | `Before` |  |
| `after_label` — After label | `text` | `After` |  |
| `start` — Starting position | `range` | `50` | 0–100%, step 5 |
| `caption` — Caption | `text` | Not specified |  |

Add-menu presets:

- Before / after; initial blocks `[{"type":"comparison"}]`.

#### Image strip (image-strip)

Source: `theme/sections/image-strip.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | Not specified |  |
| `collection` — Show products from collection | `collection` | Not specified | Uses each product's main image. Image blocks are added after these. |
| `limit` — Products to show | `range` | `12` | 4–20, step 1 |
| `height` — Image height | `range` | `140` | 40–300px, step 10 |
| `gap` — Gap | `range` | `24` | 0–64px, step 4 |
| `speed` — Speed | `range` | `40` | 10–120px, step 10 |
| `reverse` — Move left to right | `checkbox` | `false` |  |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `layout` — Display | `select` | `ticker` | `ticker`: Moving strip; `grid`: Static wrapped grid |
| `image_shape` — Image shape | `select` | `natural` | `natural`: Natural width; `square`: Square; `portrait`: Portrait; `landscape`: Landscape |
| `image_fit` — Image fit | `select` | `cover` | `cover`: Fill and crop; `contain`: Entire image |
| `height_mobile` — Phone image height | `select` | `inherit` | `inherit`: Same as desktop; `small`: 80px; `medium`: 120px; `large`: 180px |
| `static_mobile` — Static on phones | `checkbox` | `false` |  |
| `grayscale` — Monochrome images | `checkbox` | `false` |  |
| `show_labels` — Show image labels | `checkbox` | `false` |  |
| `fade_edges` — Fade ticker edges | `checkbox` | `true` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters; Sets the width of the image and text together. Background stays full width. All options keep the theme's responsive page gutters. |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px. Custom values are exact and are not multiplied by the global smaller-screen spacing setting.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Image** (`image`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `image` — Image | `image_picker` | Not specified |  |
| `label` — Accessible label | `text` | Not specified | Used when the image has no alt text, e.g. a press logo name. |
| `link` — Link | `url` | Not specified |  |

Add-menu presets:

- Image strip; initial blocks `[{"type":"image"},{"type":"image"},{"type":"image"},{"type":"image"}]`.
- Logo grid — `{"layout":"grid","height":80,"image_fit":"contain","grayscale":true}`; initial blocks `[{"type":"image"},{"type":"image"},{"type":"image"},{"type":"image"}]`.
- Portrait image strip — `{"image_shape":"portrait","height":300}`; initial blocks `[{"type":"image"},{"type":"image"},{"type":"image"},{"type":"image"}]`.

#### Image with text (image-with-text)

Source: `theme/sections/image-with-text.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `image` — Image | `image_picker` | Not specified |  |
| `image_ratio` — Image ratio | `select` | `portrait` | `adapt`: Adapt to image; `square`: Square (1:1); `portrait`: Portrait (4:5); `tall`: Tall (2:3); `landscape`: Landscape (3:2); `wide`: Wide (16:9) |
| `image_fit` — Image fit | `select` | `cover` | `cover`: Fill frame (crop); `contain`: Show whole image |
| `hover_zoom` — Zoom images on hover | `checkbox` | `true` |  |
| `image_width` — Image width (desktop) | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large |
| `layout` — Desktop layout | `select` | `image_first` | `image_first`: Image first; `text_first`: Text first |
| `mobile_order` — On phones | `select` | `image_first` | `image_first`: Image above text; `text_first`: Text above image |
| `vertical_alignment` — Content vertical position | `select` | `middle` | `top`: Top; `middle`: Middle; `bottom`: Bottom |
| `alignment` — Text alignment | `select` | `left` | `left`: Left; `center`: Center |
| `gap` — Gap between image and text | `range` | `48` | 0–120px, step 4 |
| `card_style` — Content panel | `select` | `plain` | `plain`: Plain; `surface`: Surface fill; `outline`: Outline; `shadow`: Soft shadow |
| `overlap` — Overlap the panel onto the image | `checkbox` | `false` | Desktop only. Needs a content panel other than Plain. |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Caption** (`caption`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `caption` — Caption | `text` | `New season` |  |
| `style` — Style | `select` | `spec` | `spec`: Small caps; `badge`: Badge; `plain`: Plain text |

Supported block: **Heading** (`heading`); type limit 2.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `Image with text` |  |
| `size` — Size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `italic` — Italic | `checkbox` | `false` |  |

Supported block: **Text** (`text`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `text` — Text | `richtext` | `<p>Pair large imagery with a short story about the collection, the fabric or the fit.</p>` |  |
| `size` — Text size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large |
| `color` — Text color | `select` | `default` | `default`: Default; `muted`: Muted |

Supported block: **Spacer** (`spacer`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `height` — Height | `range` | `16` | 0–80px, step 4 |

Supported block: **Button** (`button`); type limit 3.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `label` — Label | `text` | `Shop now` |  |
| `link` — Link | `url` | `/collections/all` |  |
| `style` — Style | `select` | `solid` | `solid`: Solid; `outline`: Outline; `pill`: Pill; `sweep`: Center sweep; `offset`: Offset shadow; `press`: 3D press; `link`: Text link |
| `new_tab` — Open link in a new tab | `checkbox` | `false` |  |

Add-menu presets:

- Image with text; initial blocks `[{"type":"caption"},{"type":"heading"},{"type":"text"},{"type":"button","settings":{"style":"outline"}}]`.
- Image with text panel — `{"card_style":"surface","overlap":true,"image_width":"large"}`; initial blocks `[{"type":"heading"},{"type":"text"},{"type":"button","settings":{"style":"link","label":"Read more"}}]`.

#### Logo wall (logo-wall)

Source: `theme/sections/logo-wall.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

Current section block cap: 24.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `As featured in` |  |
| `text` — Text | `richtext` | Not specified |  |
| `alignment` — Alignment | `select` | `center` | `left`: Left; `center`: Center |
| `layout` — Layout | `select` | `grid` | `grid`: Grid; `row`: Centered row |
| `appearance` — Grid style | `select` | `ruled` | `ruled`: Ruled lines; `cards`: Cards; `plain`: Plain |
| `columns` — Columns (desktop) | `range` | `4` | 2–8, step 1 |
| `columns_mobile` — Columns (phones) | `select` | `2` | `2`: 2 columns; `3`: 3 columns |
| `gap` — Gap (cards, plain and row) | `range` | `24` | 0–80px, step 4 |
| `logo_height` — Logo height | `range` | `40` | 20–120px, step 4 |
| `opacity` — Logo opacity | `range` | `80` | 30–100%, step 5; Logos return to full opacity on hover. |
| `grayscale` — Grayscale until hover | `checkbox` | `true` |  |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Logo** (`logo`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `image` — Logo | `image_picker` | Not specified |  |
| `name` — Name | `text` | `Partner` | Used as alt text, or shown when no logo is uploaded. |
| `link` — Link | `url` | Not specified |  |
| `new_tab` — Open link in a new tab | `checkbox` | `true` |  |

Add-menu presets:

- Logo wall; initial blocks `[{"type":"logo","settings":{"name":"Vogue"}},{"type":"logo","settings":{"name":"Kinfolk"}},{"type":"logo","settings":{"name":"Monocle"}},{"type":"logo","settings":{"name":"Cereal"}}]`.

#### Lookbook hotspots (lookbook)

Source: `theme/sections/lookbook.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

Current section block cap: 10.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `Shop the look` |  |
| `text` — Text | `richtext` | Not specified |  |
| `image` — Image | `image_picker` | Not specified |  |
| `image_ratio` — Image ratio | `select` | `adapt` | `adapt`: Adapt to image; `square`: Square (1:1); `portrait`: Portrait (4:5); `tall`: Tall (2:3); `landscape`: Landscape (3:2); `wide`: Wide (16:9); Fixed ratios crop the image; hotspot positions are relative to the visible frame. |
| `marker` — Marker | `select` | `plus` | `plus`: Plus; `dot`: Dot |
| `show_numbers` — Number the markers | `checkbox` | `false` |  |
| `marker_color` — Marker color | `select` | `light` | `light`: Light; `dark`: Dark; `accent`: Accent |
| `marker_size` — Marker size | `range` | `26` | 16–44px, step 2 |
| `pulse` — Pulse markers | `checkbox` | `true` |  |
| `list_position` — Product list | `select` | `below` | `below`: Below the image; `side`: Beside the image (desktop); `none`: Hidden |
| `list_thumbs` — Show product thumbnails in the list | `checkbox` | `true` |  |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Hotspot** (`hotspot`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `product` — Product | `product` | Not specified |  |
| `x` — Horizontal position | `range` | `50` | 0–100%, step 1 |
| `y` — Vertical position | `range` | `50` | 0–100%, step 1 |
| `label` — Label | `text` | `Product` |  |
| `image` — Thumbnail | `image_picker` | Not specified |  |
| `link` — Link | `url` | Not specified |  |
| `link_label` — Link label | `text` | Not specified | Defaults to "View product". |

Add-menu presets:

- Lookbook hotspots; initial blocks `[{"type":"hotspot","settings":{"x":35,"y":30}},{"type":"hotspot","settings":{"x":62,"y":66}}]`.

#### Cart (main-cart)

Source: `theme/sections/main-cart.liquid`. Editor: select this section in its template or section group.

Available contexts: `{"templates":["cart"]}`.

Section instance limit: 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `density` — Cart line spacing | `select` | `regular` | `regular`: Regular; `compact`: Compact; `airy`: Airy |
| `show_images` — Show product images | `checkbox` | `true` |  |
| `note` — Order note | `select` | `inherit` | `inherit`: Use theme setting; `show`: Show; `hide`: Hide |
| `summary_style` — Summary appearance | `select` | `bordered` | `bordered`: Bordered; `plain`: Plain; `surface`: Surface |
| `sticky_summary` — Sticky summary (desktop) | `checkbox` | `true` |  |
| `show_accelerated` — Show accelerated checkout buttons | `checkbox` | `true` |  |
| `show_empty_recommendations` — Show collection when cart is empty | `checkbox` | `false` |  |
| `recommendation_collection` — Empty cart collection | `collection` | Not specified |  |
| `recommendation_heading` — Empty cart collection heading | `text` | `Explore the collection` |  |

No add-menu preset: rendered by an existing template/layout/group or used as a rendering endpoint.

#### Product grid (main-collection)

Source: `theme/sections/main-collection.liquid`. Editor: select this section in its template or section group.

Available contexts: `{"templates":["collection"]}`.

Section instance limit: 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `show_header` — Show title and description | `checkbox` | `true` | Turn off when a Collection banner section is above. |
| `title_animation` — Title animation | `select` | `rise` | `none`: None; `rise`: Rise from a mask; `blur`: Blur in; `fold`: Fold up; `skew`: Skewed rise; `fade`: Fade up; Plays once when the page opens. Follows Theme settings > Motion and reduced-motion preferences. |
| `title_split` — Animate title by | `select` | `words` | `words`: Word; `chars`: Letter; `lines`: Line |
| `pagination_style` — Pagination | `select` | `infinite` | `infinite`: Infinite scroll; `button`: Load more button; `numbers`: Page numbers |
| `infinite_auto_pages` — Infinite scroll: pages before a button | `range` | `3` | 1–10, step 1; After this many pages load automatically, a Load more button appears so the footer stays reachable. |
| `products_per_page` — Products per page | `range` | `24` | 8–48, step 4 |
| `columns_mobile` — Columns on phones | `select` | `1` | `1`: 1; `2`: 2 |
| `columns_desktop` — Columns on desktop | `range` | `3` | 2–5, step 1 |
| `pills_menu` — Category links menu | `link_list` | Not specified | Optional row of links to related collections. |
| `show_description` — Show collection description | `checkbox` | `true` |  |
| `show_filters` — Show filters | `checkbox` | `true` | Filters come from Shopify's Search & Discovery app. |
| `show_sort` — Show sort | `checkbox` | `true` |  |
| `card_appearance` — Card appearance | `select` | `inherit` | `inherit`: Use theme default; `minimal`: Minimal; `editorial`: Editorial; `bordered`: Bordered; `image-led`: Image focused |
| `card_ratio` — Image ratio | `select` | `inherit` | `inherit`: Use theme default; `square`: Square; `portrait`: Portrait (4:5); `tall`: Tall (2:3); `landscape`: Landscape (4:3) |
| `card_fit` — Image fit | `select` | `inherit` | `inherit`: Use theme default; `cover`: Fill; `contain`: Contain |
| `card_hover` — Alternate media | `select` | `inherit` | `inherit`: Use theme default; `auto`: Video with image fallback; `image`: Second image only; `off`: Off |
| `card_vendor` — Show vendor | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `card_price` — Show price | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `card_badges` — Show badges | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `card_sizes` — Show sizes | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `show_layout_switch` — Allow shoppers to change grid columns | `checkbox` | `true` | Off uses merchant columns and ignores previous shopper grid preferences. |
| `toolbar_width` — Filter toolbar width | `select` | `full` | `full`: Full bleed; `contained`: Within content |
| `toolbar_sticky` — Sticky filter toolbar | `checkbox` | `true` |  |
| `grid_gap` — Product column gap | `range` | `8` | 0–40px, step 2 |

No add-menu preset: rendered by an existing template/layout/group or used as a rendering endpoint.

#### Product information (main-product)

Source: `theme/sections/main-product.liquid`. Editor: select this section in its template or section group.

Available contexts: `{"templates":["product"]}`.

Section instance limit: 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `show_breadcrumb` — Show breadcrumbs | `checkbox` | `false` |  |
| `gallery_layout` — Desktop gallery | `select` | `slider` | `collage`: Editorial collage; `slider`: Single image slider; `stack`: Stacked images; `grid`: Two-column grid; Single image slider: one large photo with a thumbnail rail, subtle arrows and click-to-enlarge. Editorial collage: all photos in a magazine-style rhythm beside sticky product details. |
| `gallery_ratio` — Media shape | `select` | `square` | `square`: Square; `portrait`: Portrait; `landscape`: Landscape |
| `gallery_fit` — Media fit | `select` | `contain` | `contain`: Entire media; `cover`: Fill and crop |
| `gallery_background` — Media background | `select` | `white` | `white`: White studio; `scheme`: Scheme surface |
| `proportions` — Desktop columns | `select` | `media` | `media`: Larger gallery; `balanced`: Balanced; `content`: Larger information column |
| `media_right` — Gallery on the right (desktop) | `checkbox` | `false` |  |
| `text_first_mobile` — Information first on smaller screens | `checkbox` | `false` |  |
| `sticky_info` — Sticky product information | `checkbox` | `true` |  |
| `sticky_buy` — Sticky Add to cart bar | `select` | `off` | `off`: Off; `mobile`: Phones and tablets; `always`: All screen sizes; Appears after the main Add to cart button scrolls out of view. |
| `show_thumbnails` — Show media thumbnails | `checkbox` | `true` |  |
| `show_gallery_controls` — Show media arrows and counter | `checkbox` | `true` |  |
| `show_media_progress` — Show media progress bar | `checkbox` | `true` | A thin bar that follows your position through the product photos: under the slider, or beside stacked photos on desktop. |
| `enable_zoom` — Enable image zoom | `checkbox` | `true` |  |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px. Custom values are exact and are not multiplied by the global smaller-screen spacing setting.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `info_gap` — Space between information blocks | `range` | `20` | 12–32px, step 2 |

Supported block: **@app** (`@app`).

Supported block: **Eyebrow** (`eyebrow`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `text` — Text | `text` | Not specified | Leave empty to show the product type, or its first collection. |

Supported block: **Title** (`title`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `animate` — Animate title | `checkbox` | `true` |  |
| `scale` — Title size | `range` | `100` | 70–130%, step 5 |

Supported block: **Price** (`price`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `show_sku` — Show SKU when available | `checkbox` | `true` |  |
| `show_promotion` — Show promotion code | `checkbox` | `true` | Shows the discount code connected to this product in Theme settings > Promotions. |

Supported block: **Variant picker** (`variant_picker`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `size_guide_option` — Show size guide next to option | `text` | `Size` |  |
| `show_size_guide` — Show full size guide | `checkbox` | `true` |  |
| `show_fit_finder` — Show size finder | `checkbox` | `true` | Estimates a letter size from height, weight, shape and fit preference. Answers stay on the shopper's device. |
| `show_measurements` — Show inline measurements | `checkbox` | `true` |  |
| `measure_preview` — Preview measurements on hover or focus | `checkbox` | `true` |  |
| `show_unit_switch` — Allow inch and centimetre switching | `checkbox` | `true` |  |
| `highlight_selected` — Highlight selected size in guide | `checkbox` | `true` |  |
| `size_guide_page` — Size guide page (fallback) | `page` | Not specified | Used only when no assigned chart or template table is available. |
| `size_heading` — Size guide heading | `text` | `Measured flat, garment in hand` |  |
| `size_table` — Size table | `textarea` | Not specified | Optional merchant-verified chart shared by products using this template. Leave empty unless it applies to every such product. Prefer product metafields. First line: headings; subsequent lines: comma-separated measurements. |
| `size_unit` — Table is written in | `select` | `in` | `in`: Inches; `cm`: Centimetres |
| `size_note` — Note under the table | `text` | Not specified |  |

Supported block: **Inventory status** (`inventory`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `show_on_sizes` — Mark low-stock sizes on size buttons | `checkbox` | `true` | Uses Theme settings > Product page > "Show only a few left" threshold. |

Supported block: **Model info** (`model_info`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `show` — Show model info | `checkbox` | `true` |  |
| `use_metafields` — Use product metafields | `checkbox` | `true` |  |
| `sentence` — Sentence | `text` | `Model is [height] and wears size [size]` | Used with the height and size metafields. [height] and [size] are replaced. |
| `fallback` — Fallback text | `text` | Not specified | Shown on products without model metafields. Leave blank to show nothing. |
| `show_icon` — Show icon | `checkbox` | `true` |  |

Supported block: **Buy buttons** (`buy_buttons`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `show_quantity` — Show quantity | `checkbox` | `false` |  |

Supported block: **Text** (`text`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `text` — Text | `richtext` | Not specified |  |
| `style` — Style | `select` | `` | ``: Body; `spec`: Label |

Supported block: **Description** (`description`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | Not specified |  |
| `show_care` — Show care metafield when available | `checkbox` | `true` |  |
| `care_heading` — Care heading | `text` | `Fabric & Care` |  |
| `open` — Open by default | `checkbox` | `true` |  |
| `presentation` — Description presentation | `select` | `accordion` | `accordion`: Collapsible row; `inline`: Always visible |

Supported block: **Collapsible row** (`accordion`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `policy_source` — Content source | `select` | `custom` | `custom`: Custom content or page; `shipping_exchange`: Shopify shipping and refund policies; Policies stay synchronized with Settings > Policies in Shopify Admin. |
| `heading` — Heading | `text` | `Fabric & care` |  |
| `open` — Open by default | `checkbox` | `false` |  |
| `content` — Content | `richtext` | Not specified |  |
| `page` — Content from page | `page` | Not specified |  |

Supported block: **Custom Liquid** (`custom_liquid`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `custom_liquid` — Custom Liquid | `liquid` | Not specified |  |

Supported block: **Product feature** (`feature`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `image` — Decorative icon or image | `image_picker` | Not specified |  |
| `heading` — Heading | `text` | `Product feature` |  |
| `text` — Text | `richtext` | Not specified |  |
| `appearance` — Appearance | `select` | `plain` | `plain`: Plain; `bordered`: Bordered; `surface`: Surface |
| `link` — Link | `url` | Not specified |  |
| `link_label` — Link label | `text` | Not specified |  |

No add-menu preset: rendered by an existing template/layout/group or used as a rendering endpoint.

#### Media with text (media-text)

Source: `theme/sections/media-text.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `image` — Image | `image_picker` | Not specified |  |
| `collection` — Use collection image | `collection` | Not specified | Shown when no image is set. |
| `layout` — Layout | `select` | `split` | `split`: Side by side; `overlay`: Text over image; `stacked`: Stacked story; `asymmetric`: Wide image split |
| `media_right` — Image on the right (desktop) | `checkbox` | `false` |  |
| `text_first_mobile` — Text first on phones | `checkbox` | `false` |  |
| `blur_scrim` — Progressive blur behind text (overlay layout) | `checkbox` | `true` |  |
| `index` — Index label | `text` | Not specified | Optional, e.g. 01 / Fit |
| `heading` — Heading | `text` | `Tell the` |  |
| `heading_italic` — Heading (italic part) | `text` | `story` |  |
| `text` — Text | `richtext` | Not specified |  |
| `link_label` — Link label | `text` | Not specified |  |
| `link` — Link | `url` | Not specified |  |
| `heading_entrance` — Heading entrance | `select` | `flip` | `none`: None; `rise`: Rise letter by letter (Split Text); `blur`: Blur in word by word (Text Effect); `fold`: Paper fold (Fold Text); `flip`: Flip up; `skew`: Skew in; `pop`: Pop; `fade`: Fade |
| `entrance` — Text column entrance | `select` | `none` | `none`: None; `fade`: Fade up; `wipe`: Wipe |
| `text_style` — Heading effect | `select` | `none` | `none`: None; `shine`: Shine; `gradient`: Gradient |
| `scene_preset` — Section animation | `select` | `cinematic` | `off`: Off; `none`: Use heading and column settings; `subtle`: Subtle entrance; `cinematic`: Cinematic scroll reveal; A section animation replaces separate heading and column entrances to keep movement coordinated. |
| `scene_direction` — Reveal direction | `select` | `up` | `up`: Up; `left`: From right; `none`: Fade only |
| `scene_intensity` — Motion intensity | `select` | `soft` | `soft`: Soft; `full`: Expressive |
| `scene_parallax` — Gentle image drift | `checkbox` | `true` | Cinematic preset only. Simplified phones use a quick entrance. |
| `scene_pin` — Brief desktop hold | `checkbox` | `false` | Cinematic only, on wide screens when the entire section fits below the header. Adds at most 240px of scrolling. |
| `scene_background` — Fade subtle accent wash | `checkbox` | `true` | Cinematic only. Uses this section's color scheme. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters; Sets the width of the image and text together. Background stays full width. All options keep the theme's responsive page gutters. |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px. Custom values are exact and are not multiplied by the global smaller-screen spacing setting.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `video` — Video | `video` | Not specified | Replaces images; muted background video with playback controls. |
| `video_autoplay` — Autoplay video | `checkbox` | `true` |  |
| `image_mobile` — Phone image | `image_picker` | Not specified |  |
| `text_align` — Text alignment | `select` | `left` | `left`: Left; `center`: Center |
| `copy_width` — Body text width | `range` | `46` | 28–72ch, step 2 |
| `media_ratio` — Image shape | `select` | `inherit` | `inherit`: Use layout default; `portrait`: Portrait; `square`: Square; `wide`: Landscape |
| `media_fit` — Media fit | `select` | `cover` | `cover`: Fill and crop; `contain`: Entire media |
| `link_style` — Call to action | `select` | `text` | `text`: Text link; `solid`: Filled button; `outline`: Outline button |
| `overlay_colors` — Overlay text colors | `select` | `light` | `light`: Light; `scheme`: Section scheme |

Add-menu presets:

- Media with text.
- Stacked story — `{"layout":"stacked","text_align":"center","scene_preset":"subtle","media_ratio":"wide"}`.
- Asymmetric story — `{"layout":"asymmetric","scene_preset":"subtle"}`.

#### Message band (message-band)

Source: `theme/sections/message-band.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `rows` — Rows | `select` | `2` | `1`: One; `2`: Two (opposite directions, desktop) |
| `size` — Text size | `range` | `80` | 32–140px, step 4 |
| `speed` — Speed | `range` | `50` | 20–160px, step 10; Pixels per second. |
| `scroll_react` — Speed up while scrolling | `checkbox` | `true` |  |
| `outline_second` — Outline text on second row | `checkbox` | `true` |  |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-2` |  |
| `direction` — Ticker direction | `select` | `left` | `left`: Right to left; `right`: Left to right |
| `layout` — Display | `select` | `ticker` | `ticker`: Moving ticker; `static`: Static wrapped text |
| `mobile_scale` — Phone text size | `select` | `55` | `55`: Compact; `75`: Medium; `100`: Same as desktop |
| `static_mobile` — Static on phones | `checkbox` | `true` |  |

Supported block: **Message** (`message`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `text` — Text | `text` | `New drop` |  |
| `link` — Link | `url` | Not specified |  |

Add-menu presets:

- Message band; initial blocks `[{"type":"message"},{"type":"message"},{"type":"message"}]`.
- Static text band — `{"layout":"static","rows":"1"}`; initial blocks `[{"type":"message"}]`.

#### Multicolumn (multicolumn)

Source: `theme/sections/multicolumn.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

Current section block cap: 12.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `Why shop with us` |  |
| `text` — Text | `richtext` | Not specified |  |
| `alignment` — Alignment | `select` | `left` | `left`: Left; `center`: Center |
| `columns` — Columns (desktop) | `range` | `3` | 1–6, step 1 |
| `columns_mobile` — Columns (phones) | `select` | `1` | `1`: 1 column; `2`: 2 columns |
| `gap` — Gap between columns | `range` | `32` | 0–80px, step 4 |
| `card_style` — Column style | `select` | `plain` | `plain`: Plain; `surface`: Surface fill; `outline`: Outline; `shadow`: Soft shadow |
| `title_size` — Column heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large |
| `image_ratio` — Image ratio | `select` | `adapt` | `adapt`: Adapt to image; `square`: Square (1:1); `portrait`: Portrait (4:5); `tall`: Tall (2:3); `landscape`: Landscape (3:2); `wide`: Wide (16:9); `circle`: Circle |
| `image_width` — Image width | `select` | `full` | `full`: Full column width; `half`: Half column width; `icon`: Icon size |
| `hover_zoom` — Zoom images on hover | `checkbox` | `true` |  |
| `button_label` — Button label | `text` | Not specified |  |
| `button_link` — Button link | `url` | `/collections/all` |  |
| `button_style` — Button style | `select` | `outline` | `solid`: Solid; `outline`: Outline; `pill`: Pill; `sweep`: Center sweep; `offset`: Offset shadow; `press`: 3D press; `link`: Text link |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Column** (`column`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `image` — Image | `image_picker` | Not specified |  |
| `icon` — Icon (used when no image) | `select` | `none` | `none`: None; `truck`: Delivery; `arrow-path`: Returns; `scissors`: Tailoring; `sparkles`: Quality; `heart`: Care; `globe-alt`: Worldwide; `lock-closed`: Secure; `shield-check`: Guarantee; `gift`: Gift; `bolt`: Fast; `adjustments-vertical`: Fit; `check`: Check |
| `title` — Heading | `text` | `Column` |  |
| `text` — Text | `richtext` | `<p>Pair text with an image to focus on a product, collection or service.</p>` |  |
| `link_label` — Link label | `text` | Not specified |  |
| `link` — Link | `url` | Not specified |  |

Add-menu presets:

- Multicolumn; initial blocks `[{"type":"column","settings":{"title":"Free returns","icon":"arrow-path"}},{"type":"column","settings":{"title":"Made to last","icon":"sparkles"}},{"type":"column","settings":{"title":"Fit support","icon":"scissors"}}]`.

#### Newsletter banner (newsletter-banner)

Source: `theme/sections/newsletter-banner.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `image` — Background image | `image_picker` | Not specified |  |
| `image_mobile` — Mobile image | `image_picker` | Not specified |  |
| `overlay_opacity` — Overlay strength | `range` | `35` | 0–90%, step 5 |
| `text_tone` — Text color over image | `select` | `light` | `light`: Light; `dark`: Dark |
| `height` — Height | `select` | `medium` | `small`: Adapt to content; `medium`: Medium; `large`: Large |
| `content_position` — Content position | `select` | `center` | `left`: Left; `center`: Center; `right`: Right |
| `alignment` — Text alignment | `select` | `center` | `left`: Left; `center`: Center |
| `content_box` — Content background | `select` | `none` | `none`: None; `panel`: Solid panel; `blur`: Frosted glass |
| `form_style` — Field style | `select` | `underline` | `underline`: Underline; `boxed`: Boxed; `pill`: Pill |
| `form_button` — Submit button | `select` | `text` | `text`: Text with arrow; `solid`: Solid button |
| `form_width` — Form max width | `range` | `480` | 280–720px, step 20 |
| `show_privacy` — Show privacy policy link | `checkbox` | `true` |  |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Caption** (`caption`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `caption` — Caption | `text` | `Newsletter` |  |
| `style` — Style | `select` | `spec` | `spec`: Small caps; `badge`: Badge; `plain`: Plain text |

Supported block: **Heading** (`heading`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `Join the list` |  |
| `size` — Size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |

Supported block: **Text** (`paragraph`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `text` — Text | `richtext` | `<p>Early access to new collections and members-only offers.</p>` |  |

Supported block: **Email form** (`email_form`); type limit 1.

No local settings.

Add-menu presets:

- Newsletter banner; initial blocks `[{"type":"heading"},{"type":"paragraph"},{"type":"email_form"}]`.

#### Newsletter split (newsletter-split)

Source: `theme/sections/newsletter-split.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

Current section block cap: 6.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `Sign up for our newsletter` |  |
| `heading_display` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `text` — Text | `richtext` | `<p>One email a month: new arrivals, restocks and care tips.</p>` |  |
| `alignment` — Alignment | `select` | `left` | `left`: Left; `center`: Center |
| `layout` — Desktop layout | `select` | `split` | `split`: Side by side; `stacked`: Stacked |
| `card_style` — Background panel | `select` | `surface` | `plain`: Plain; `surface`: Surface fill; `outline`: Outline; `shadow`: Soft shadow |
| `image` — Image | `image_picker` | Not specified | Optional third column on desktop. |
| `image_position` — Image position | `select` | `left` | `left`: Left; `right`: Right |
| `image_ratio` — Image ratio | `select` | `portrait` | `adapt`: Adapt to image; `square`: Square (1:1); `portrait`: Portrait (4:5); `tall`: Tall (2:3); `landscape`: Landscape (3:2); `wide`: Wide (16:9) |
| `form_style` — Field style | `select` | `underline` | `underline`: Underline; `boxed`: Boxed; `pill`: Pill |
| `form_button` — Submit button | `select` | `text` | `text`: Text with arrow; `solid`: Solid button |
| `form_width` — Form max width | `range` | `480` | 280–720px, step 20 |
| `show_privacy` — Show privacy policy link | `checkbox` | `true` |  |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Benefit** (`benefit`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `text` — Text | `text` | `Early access to drops` |  |
| `icon` — Icon | `select` | `check` | `check`: Check; `gift`: Gift; `sparkles`: New; `truck`: Delivery; `heart`: Heart; `bolt`: Flash |

Add-menu presets:

- Newsletter split; initial blocks `[{"type":"benefit"},{"type":"benefit","settings":{"text":"10% off your first order","icon":"gift"}}]`.

#### Page (page)

Source: `theme/sections/page.liquid`. Editor: select this section in its template or section group.

Available contexts: `{"templates":["page"]}`.

Section instance limit: 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `width` — Content width | `select` | `inherit` | `inherit`: Theme page width; `narrow`: Narrow reading width; `regular`: Regular reading width |
| `show_title` — Show page title | `checkbox` | `true` |  |

No add-menu preset: rendered by an existing template/layout/group or used as a rendering endpoint.

#### Password (password)

Source: `theme/sections/password.liquid`. Editor: select this section in its template or section group.

Available contexts: `{"templates":["password"]}`.

Section instance limit: 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `width` — Content width | `select` | `inherit` | `inherit`: Theme page width; `narrow`: Narrow reading width; `regular`: Regular reading width |
| `heading` — Heading override | `text` | Not specified |  |
| `show_logo` — Show logo | `checkbox` | `false` |  |
| `show_newsletter` — Show newsletter signup | `checkbox` | `false` |  |
| `newsletter_heading` — Newsletter heading | `text` | `Stay in touch` |  |

No add-menu preset: rendered by an existing template/layout/group or used as a rendering endpoint.

#### Predictive search (predictive-search)

Source: `theme/sections/predictive-search.liquid`. Editor: select this section in its template or section group.

No local settings.

No add-menu preset: rendered by an existing template/layout/group or used as a rendering endpoint.

#### Pricing cards (pricing-cards)

Source: `theme/sections/pricing-cards.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

Current section block cap: 4.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `Alteration services` |  |
| `text` — Text | `richtext` | Not specified |  |
| `alignment` — Alignment | `select` | `left` | `left`: Left; `center`: Center |
| `columns` — Columns (desktop) | `range` | `3` | 1–4, step 1 |
| `gap` — Gap between cards | `range` | `16` | 0–48px, step 4 |
| `card_style` — Card style | `select` | `outline` | `plain`: Plain; `surface`: Surface fill; `outline`: Outline; `shadow`: Soft shadow |
| `featured_style` — Highlighted plan | `select` | `ring` | `ring`: Bold outline; `inverted`: Inverted colors; `accent`: Accent outline |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Plan** (`plan`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `name` — Name | `text` | `Essential` |  |
| `price` — Price | `text` | `$25` | Shown as written. Use for services; product prices come from the product itself. |
| `compare_price` — Was price | `text` | Not specified | Optional. Shown struck through. |
| `period` — Price note | `text` | `per garment` |  |
| `description` — Description | `richtext` | Not specified |  |
| `features` — Features | `textarea` | `Hemming<br>Sleeve shortening` | One feature per line. |
| `featured` — Highlight this plan | `checkbox` | `false` |  |
| `badge` — Highlight badge | `text` | `Most popular` |  |
| `button_label` — Button label | `text` | `Book now` |  |
| `button_link` — Button link | `url` | `/collections/all` |  |
| `button_style` — Button style | `select` | `auto` | `auto`: Automatic; `solid`: Solid; `outline`: Outline; `pill`: Pill; `sweep`: Center sweep; `offset`: Offset shadow; `press`: 3D press; `link`: Text link |
| `footnote` — Small print | `text` | Not specified |  |

Add-menu presets:

- Pricing cards; initial blocks `[{"type":"plan"},{"type":"plan","settings":{"name":"Tailored","price":"$60","featured":true,"features":"Everything in Essential\nTaking in and letting out\nFree pickup"}},{"type":"plan","settings":{"name":"Bespoke","price":"$180","features":"Full refit\nPersonal fitting\nPriority turnaround"}}]`.

#### Process steps (process-steps)

Source: `theme/sections/process-steps.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

Current section block cap: 8.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `How it works` |  |
| `text` — Text | `richtext` | Not specified |  |
| `alignment` — Alignment | `select` | `left` | `left`: Left; `center`: Center |
| `layout` — Desktop layout | `select` | `horizontal` | `horizontal`: Horizontal; `vertical`: Vertical |
| `gap` — Gap between steps | `range` | `28` | 0–80px, step 4 |
| `card_style` — Step text style | `select` | `plain` | `plain`: Plain; `surface`: Surface fill; `outline`: Outline; `shadow`: Soft shadow |
| `connector` — Connecting line | `checkbox` | `true` |  |
| `marker_content` — Marker shows | `select` | `number` | `number`: Step number; `icon`: Step icon |
| `marker_style` — Marker style | `select` | `filled` | `filled`: Filled; `outline`: Outline; `accent`: Accent fill; `square`: Square |
| `button_label` — Button label | `text` | Not specified |  |
| `button_link` — Button link | `url` | `/collections/all` |  |
| `button_style` — Button style | `select` | `solid` | `solid`: Solid; `outline`: Outline; `pill`: Pill; `sweep`: Center sweep; `offset`: Offset shadow; `press`: 3D press; `link`: Text link |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Step** (`step`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `title` — Title | `text` | `Step` |  |
| `text` — Text | `richtext` | `<p>Explain what happens in this step.</p>` |  |
| `icon` — Icon | `select` | `none` | `none`: None; `truck`: Delivery; `arrow-path`: Returns; `scissors`: Tailoring; `sparkles`: Quality; `heart`: Care; `globe-alt`: Worldwide; `lock-closed`: Secure; `shield-check`: Guarantee; `gift`: Gift; `bolt`: Fast; `adjustments-vertical`: Fit; `check`: Check; Shown when the marker is set to Step icon. |

Add-menu presets:

- Process steps; initial blocks `[{"type":"step","settings":{"title":"Find your size","icon":"adjustments-vertical"}},{"type":"step","settings":{"title":"Try it at home","icon":"truck"}},{"type":"step","settings":{"title":"Free exchanges","icon":"arrow-path"}}]`.

#### Product recommendations (product-recommendations)

Source: `theme/sections/product-recommendations.liquid`. Editor: select this section in its template or section group.

Available contexts: `{"templates":["product"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `You might` |  |
| `heading_italic` — Heading (italic part) | `text` | `also like` |  |
| `fallback_collection` — Fallback collection | `collection` | Not specified | Shown when Shopify has no recommendations, or if recommendations cannot load. |
| `intent` — Show | `select` | `related` | `related`: Related products; `complementary`: Complementary products |
| `limit` — Products to show | `range` | `4` | 2–10, step 1 |
| `columns_desktop` — Columns on desktop | `range` | `4` | 2–5, step 1 |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `card_appearance` — Card appearance | `select` | `inherit` | `inherit`: Use theme default; `minimal`: Minimal; `editorial`: Editorial; `bordered`: Bordered; `image-led`: Image focused |
| `card_ratio` — Image ratio | `select` | `inherit` | `inherit`: Use theme default; `square`: Square; `portrait`: Portrait (4:5); `tall`: Tall (2:3); `landscape`: Landscape (4:3) |
| `card_fit` — Image fit | `select` | `inherit` | `inherit`: Use theme default; `cover`: Fill; `contain`: Contain |
| `card_hover` — Alternate media | `select` | `inherit` | `inherit`: Use theme default; `auto`: Video with image fallback; `image`: Second image only; `off`: Off |
| `card_vendor` — Show vendor | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `card_price` — Show price | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `card_badges` — Show badges | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `card_sizes` — Show sizes | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `columns_mobile` — Columns on phones | `select` | `1` | `1`: 1; `2`: 2 |
| `grid_gap` — Column gap (desktop) | `range` | `8` | 0–48px, step 2 |
| `heading_alignment` — Heading alignment | `select` | `left` | `left`: Left; `center`: Center |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters; Sets the width of the image and text together. Background stays full width. All options keep the theme's responsive page gutters. |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px. Custom values are exact and are not multiplied by the global smaller-screen spacing setting.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `hide_empty` — Hide section when empty | `checkbox` | `true` |  |
| `empty_text` — Empty message | `text` | `More recommendations will be available soon.` |  |
| `link` — Optional button destination | `url` | Not specified |  |
| `link_label` — Optional button label | `text` | Not specified |  |

Add-menu presets:

- Product recommendations.
- Complementary products — `{"intent":"complementary","heading":"Complete the","heading_italic":"look"}`.

#### Promo banner (promo-banner)

Source: `theme/sections/promo-banner.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["footer"]}`.

Current section block cap: 3.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `dismissible` — Visitors can dismiss | `checkbox` | `true` | Stays hidden for the rest of the browser session. Editing the message shows it again. |
| `size` — Height | `select` | `small` | `small`: Slim; `large`: Tall |
| `alignment` — Alignment | `select` | `center` | `left`: Left; `center`: Center |
| `text_size` — Text size | `range` | `14` | 12–20px, step 1 |
| `text_case` — Letter case | `select` | `normal` | `normal`: As typed; `upper`: Uppercase |
| `separator` — Between messages | `select` | `dot` | `none`: Space; `dot`: Dot; `line`: Line |
| `link_style` — Link style | `select` | `underline` | `underline`: Underlined; `pill`: Pill outline |
| `border` — Bottom border | `select` | `none` | `none`: None; `bottom`: Hairline |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |

Supported block: **Message** (`message`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `icon` — Icon | `select` | `none` | `none`: None; `truck`: Delivery; `gift`: Gift; `sparkles`: New; `arrow-path`: Returns; `heart`: Heart; `bolt`: Flash; `globe-alt`: Worldwide |
| `text` — Text | `inline_richtext` | `Free delivery on orders over $150` |  |
| `link_label` — Link label | `text` | `Shop now` |  |
| `link` — Link | `url` | Not specified |  |

Add-menu presets:

- Promo banner; initial blocks `[{"type":"message","settings":{"icon":"truck"}}]`.

#### Reviews wall (reviews-wall)

Source: `theme/sections/reviews-wall.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `What customers say` |  |
| `layout` — Layout | `select` | `wall` | `wall`: Moving wall; `grid`: Static grid; Phones, reduced motion and the editor show all reviews statically. Moving columns travel together so one pause button controls the wall. |
| `columns` — Columns (desktop) | `select` | `2` | `1`: 1; `2`: 2; `3`: 3 |
| `alignment` — Text alignment | `select` | `left` | `left`: Left; `center`: Center |
| `card_style` — Review cards | `select` | `bordered` | `bordered`: Bordered; `flat`: Minimal |
| `height` — Moving wall height | `range` | `520` | 320–800px, step 20; Shown when `{{ section.settings.layout == 'wall' }}` |
| `speed` — Speed | `range` | `25` | 10–80px, step 5; Shown when `{{ section.settings.layout == 'wall' }}` |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |

Supported block: **Review** (`quote`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `quote` — Review text | `richtext` | Not specified |  |
| `name` — Name | `text` | Not specified |  |
| `product` — Product reviewed | `product` | Not specified |  |

Add-menu presets:

- Reviews wall.
- Reviews grid — `{"layout":"grid","card_style":"flat","alignment":"center"}`.

#### Rich text (rich-text)

Source: `theme/sections/rich-text.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `position` — Content position (desktop) | `select` | `center` | `left`: Left; `center`: Center; `right`: Right |
| `alignment` — Text alignment | `select` | `center` | `left`: Left; `center`: Center |
| `max_width` — Content max width | `range` | `720` | 400–1200px, step 40 |
| `card_style` — Background panel | `select` | `plain` | `plain`: Plain; `surface`: Surface fill; `outline`: Outline; `shadow`: Soft shadow |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Caption** (`caption`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `caption` — Caption | `text` | `New season` |  |
| `style` — Style | `select` | `spec` | `spec`: Small caps; `badge`: Badge; `plain`: Plain text |

Supported block: **Heading** (`heading`); type limit 2.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `Talk about your brand` |  |
| `size` — Size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `italic` — Italic | `checkbox` | `false` |  |

Supported block: **Text** (`text`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `text` — Text | `richtext` | `<p>Pair large imagery with a short story about the collection, the fabric or the fit.</p>` |  |
| `size` — Text size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large |
| `color` — Text color | `select` | `default` | `default`: Default; `muted`: Muted |

Supported block: **Spacer** (`spacer`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `height` — Height | `range` | `16` | 0–80px, step 4 |

Supported block: **Button** (`button`); type limit 3.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `label` — Label | `text` | `Shop now` |  |
| `link` — Link | `url` | `/collections/all` |  |
| `style` — Style | `select` | `solid` | `solid`: Solid; `outline`: Outline; `pill`: Pill; `sweep`: Center sweep; `offset`: Offset shadow; `press`: 3D press; `link`: Text link |
| `new_tab` — Open link in a new tab | `checkbox` | `false` |  |

Add-menu presets:

- Rich text; initial blocks `[{"type":"heading"},{"type":"text"},{"type":"button","settings":{"style":"link","label":"Read more"}}]`.

#### Search (search)

Source: `theme/sections/search.liquid`. Editor: select this section in its template or section group.

Available contexts: `{"templates":["search"]}`.

Section instance limit: 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `pagination_style` — Pagination | `select` | `infinite` | `infinite`: Infinite scroll; `button`: Load more button; `numbers`: Page numbers |
| `infinite_auto_pages` — Infinite scroll: pages before a button | `range` | `3` | 1–10, step 1; After this many pages load automatically, a Load more button appears so the footer stays reachable. |
| `per_page` — Results per page | `range` | `24` | 8–48, step 4 |
| `title_animation` — Title animation | `select` | `rise` | `none`: None; `rise`: Rise from a mask; `blur`: Blur in; `fold`: Fold up; `skew`: Skewed rise; `fade`: Fade up; Plays once when the page opens. Follows Theme settings > Motion and reduced-motion preferences. |
| `title_split` — Animate title by | `select` | `words` | `words`: Word; `chars`: Letter; `lines`: Line |
| `columns_mobile` — Columns on phones | `select` | `1` | `1`: 1; `2`: 2 |
| `columns_desktop` — Columns on desktop | `range` | `4` | 3–5, step 1 |
| `show_filters` — Show filters | `checkbox` | `true` | Filters apply to product results. |
| `show_sort` — Show sort | `checkbox` | `true` |  |
| `card_appearance` — Card appearance | `select` | `inherit` | `inherit`: Use theme default; `minimal`: Minimal; `editorial`: Editorial; `bordered`: Bordered; `image-led`: Image focused |
| `card_ratio` — Image ratio | `select` | `inherit` | `inherit`: Use theme default; `square`: Square; `portrait`: Portrait (4:5); `tall`: Tall (2:3); `landscape`: Landscape (4:3) |
| `card_fit` — Image fit | `select` | `inherit` | `inherit`: Use theme default; `cover`: Fill; `contain`: Contain |
| `card_hover` — Alternate media | `select` | `inherit` | `inherit`: Use theme default; `auto`: Video with image fallback; `image`: Second image only; `off`: Off |
| `card_vendor` — Show vendor | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `card_price` — Show price | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `card_badges` — Show badges | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `card_sizes` — Show sizes | `select` | `inherit` | `inherit`: Use theme default; `show`: Show; `hide`: Hide |
| `show_layout_switch` — Allow shoppers to change grid columns | `checkbox` | `true` | Off uses merchant columns and ignores previous shopper grid preferences. |
| `toolbar_width` — Filter toolbar width | `select` | `full` | `full`: Full bleed; `contained`: Within content |
| `toolbar_sticky` — Sticky filter toolbar | `checkbox` | `true` |  |
| `grid_gap` — Product column gap | `range` | `8` | 0–40px, step 2 |

No add-menu preset: rendered by an existing template/layout/group or used as a rendering endpoint.

#### Statistics (statistics)

Source: `theme/sections/statistics.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `By the numbers` |  |
| `text` — Introduction | `richtext` | Not specified |  |
| `layout` — Layout | `select` | `grid` | `grid`: Grid; `list`: List |
| `alignment` — Alignment | `select` | `left` | `left`: Left; `center`: Center |
| `columns` — Desktop columns | `range` | `3` | 1–4, step 1 |
| `gap` — Card gap | `range` | `24` | 12–48px, step 4 |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters; Sets the width of the image and text together. Background stays full width. All options keep the theme's responsive page gutters. |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px. Custom values are exact and are not multiplied by the global smaller-screen spacing setting.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `appearance` — Appearance | `select` | `ruled` | `plain`: Plain; `ruled`: Ruled; `surface`: Surface cards |
| `value_size` — Value size | `select` | `regular` | `compact`: Compact; `regular`: Regular; `large`: Large |
| `animate` — Subtle entrances | `checkbox` | `false` |  |

Supported block: **Metric** (`metric`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `label` — Label | `text` | `Your metric` |  |
| `value` — Value | `text` | `—` | Enter verified figures. Text supports units, prefixes and localized number formatting without automatic parsing. |
| `text` — Explanation | `richtext` | Not specified |  |

Add-menu presets:

- Statistics; initial blocks `[{"type":"metric"},{"type":"metric"},{"type":"metric"}]`.
- Metric cards — `{"appearance":"surface","alignment":"center"}`; initial blocks `[{"type":"metric"},{"type":"metric"}]`.

#### Team (team-grid)

Source: `theme/sections/team-grid.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

Current section block cap: 16.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `The people behind the label` |  |
| `text` — Text | `richtext` | Not specified |  |
| `alignment` — Alignment | `select` | `left` | `left`: Left; `center`: Center |
| `columns` — Columns (desktop) | `range` | `3` | 2–6, step 1 |
| `columns_mobile` — Columns (phones) | `select` | `2` | `1`: 1 column; `2`: 2 columns |
| `gap` — Gap between people | `range` | `24` | 0–64px, step 4 |
| `card_style` — Profile style | `select` | `plain` | `plain`: Plain; `surface`: Surface fill; `outline`: Outline; `shadow`: Soft shadow |
| `show_bio` — Show bios | `checkbox` | `true` |  |
| `image_ratio` — Photo ratio | `select` | `portrait` | `adapt`: Adapt to image; `square`: Square (1:1); `portrait`: Portrait (4:5); `tall`: Tall (2:3); `landscape`: Landscape (3:2); `wide`: Wide (16:9) |
| `grayscale` — Black and white until hover | `checkbox` | `false` |  |
| `hover_zoom` — Zoom photos on hover | `checkbox` | `true` |  |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Team member** (`member`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `image` — Photo | `image_picker` | Not specified |  |
| `name` — Name | `text` | `Name` |  |
| `role` — Role | `text` | `Head of design` |  |
| `bio` — Short bio | `richtext` | Not specified |  |
| `link` — Profile link | `url` | Not specified |  |
| `link_label` — Link label | `text` | `Instagram` |  |

Add-menu presets:

- Team; initial blocks `[{"type":"member"},{"type":"member","settings":{"role":"Pattern cutter"}},{"type":"member","settings":{"role":"Studio manager"}}]`.

#### Testimonials grid (testimonial-grid)

Source: `theme/sections/testimonial-grid.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

Current section block cap: 12.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `What customers say` |  |
| `text` — Text | `richtext` | Not specified |  |
| `alignment` — Alignment | `select` | `left` | `left`: Left; `center`: Center |
| `layout` — Layout | `select` | `grid` | `grid`: Grid; `masonry`: Masonry (desktop); `scroll`: Swipe row |
| `columns` — Columns (desktop) | `range` | `3` | 1–4, step 1 |
| `gap` — Gap between cards | `range` | `16` | 0–48px, step 4 |
| `card_style` — Card style | `select` | `surface` | `plain`: Plain; `surface`: Surface fill; `outline`: Outline; `shadow`: Soft shadow |
| `quote_size` — Quote size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large serif |
| `show_mark` — Show quote mark | `checkbox` | `false` |  |
| `show_rating` — Show star rating | `checkbox` | `true` |  |
| `show_avatar` — Show avatars | `checkbox` | `true` |  |
| `avatar_shape` — Avatar shape | `select` | `circle` | `circle`: Circle; `square`: Square |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Testimonial** (`testimonial`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `rating` — Rating | `range` | `5` | 0–5, step 1; Set to 0 to hide the rating on this quote. |
| `title` — Title | `text` | Not specified | Optional short headline, such as "Perfect fit". |
| `quote` — Quote | `richtext` | `<p>The fit is exactly as described and the fabric feels even better in person.</p>` |  |
| `author` — Author | `text` | `Customer name` |  |
| `role` — Detail | `text` | `Verified buyer` |  |
| `image` — Avatar | `image_picker` | Not specified |  |
| `product` — Product purchased | `product` | Not specified |  |

Add-menu presets:

- Testimonials grid; initial blocks `[{"type":"testimonial"},{"type":"testimonial"},{"type":"testimonial"}]`.

#### Testimonial quote (testimonial-quote)

Source: `theme/sections/testimonial-quote.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `alignment` — Alignment | `select` | `center` | `left`: Left; `center`: Center |
| `size` — Quote size | `select` | `regular` | `small`: Small; `regular`: Regular; `large`: Large |
| `quote_font` — Quote font | `select` | `heading` | `heading`: Heading font; `body`: Body font |
| `mark` — Quote mark | `select` | `small` | `small`: Small accent; `large`: Large faded; `none`: None |
| `max_width` — Max width | `range` | `880` | 480–1200px, step 40 |
| `card_style` — Background panel | `select` | `plain` | `plain`: Plain; `surface`: Surface fill; `outline`: Outline; `shadow`: Soft shadow |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Star rating** (`rating`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `rating` — Rating | `range` | `5` | 1–5, step 1 |

Supported block: **Quote** (`quote`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `quote` — Quote | `richtext` | `<p>Every piece I have bought here has become a favourite. The quality speaks for itself.</p>` |  |

Supported block: **Author** (`author`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `name` — Name | `text` | `Customer name` |  |
| `role` — Detail | `text` | `Customer since 2021` |  |
| `image` — Avatar | `image_picker` | Not specified |  |

Supported block: **Logo** (`logo`); type limit 1.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `image` — Logo | `image_picker` | Not specified |  |
| `height` — Logo height | `range` | `32` | 16–80px, step 4 |

Add-menu presets:

- Testimonial quote; initial blocks `[{"type":"quote"},{"type":"author"}]`.

#### Timeline (timeline)

Source: `theme/sections/timeline.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

Current section block cap: 16.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | `Our story` |  |
| `text` — Text | `richtext` | Not specified |  |
| `alignment` — Alignment | `select` | `left` | `left`: Left; `center`: Center |
| `layout` — Desktop layout | `select` | `alternate` | `vertical`: Single column; `alternate`: Alternating sides; `horizontal`: Horizontal row |
| `gap` — Space between events | `range` | `40` | 0–96px, step 4 |
| `card_style` — Event style | `select` | `plain` | `plain`: Plain; `surface`: Surface fill; `outline`: Outline; `shadow`: Soft shadow |
| `marker` — Marker | `select` | `dot` | `dot`: Dot; `ring`: Ring; `number`: Number |
| `line_style` — Line | `select` | `solid` | `solid`: Solid; `dashed`: Dashed; `none`: None |
| `date_style` — Date style | `select` | `small` | `small`: Small caps; `large`: Large accent; `badge`: Badge |
| `image_ratio` — Image ratio | `select` | `landscape` | `adapt`: Adapt to image; `square`: Square (1:1); `portrait`: Portrait (4:5); `tall`: Tall (2:3); `landscape`: Landscape (3:2); `wide`: Wide (16:9) |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Event** (`event`).

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `date` — Date | `text` | `2019` |  |
| `title` — Title | `text` | `Milestone` |  |
| `text` — Text | `richtext` | `<p>Describe what happened and why it matters.</p>` |  |
| `image` — Image | `image_picker` | Not specified |  |

Add-menu presets:

- Timeline; initial blocks `[{"type":"event","settings":{"date":"2019","title":"The first collection"}},{"type":"event","settings":{"date":"2021","title":"Our own atelier"}},{"type":"event","settings":{"date":"2024","title":"Shipping worldwide"}}]`.

#### Video (video-feature)

Source: `theme/sections/video-feature.liquid`. Editor: select this section in its template or section group.

Excluded contexts: `{"groups":["header","footer"]}`.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `heading` — Heading | `text` | Not specified |  |
| `text` — Text | `richtext` | Not specified |  |
| `alignment` — Alignment | `select` | `left` | `left`: Left; `center`: Center |
| `video` — Shopify-hosted video | `video` | Not specified |  |
| `video_url` — Or YouTube / Vimeo URL | `video_url` | Not specified | Used instead of the uploaded video when set. |
| `description` — Video description | `text` | Not specified | Describes the video for screen readers. |
| `play_mode` — Playback | `select` | `click` | `click`: Poster, plays on click; `ambient`: Silent loop, starts automatically; The silent loop works with Shopify-hosted video only. |
| `loop` — Loop after playing | `checkbox` | `false` |  |
| `cover_image` — Cover image | `image_picker` | Not specified |  |
| `play_button` — Play button | `select` | `light` | `light`: Light; `dark`: Dark; `outline`: Outline; `large`: Large light |
| `poster_label` — Label under the play button | `text` | Not specified | For example the running time, such as 1:24. |
| `ratio` — Aspect ratio | `select` | `landscape` | `landscape`: 16:9; `cinema`: Cinema 21:9; `classic`: 4:3; `square`: Square; `portrait`: Portrait 9:16 |
| `video_width` — Video width | `select` | `full` | `full`: Full content width; `narrow`: Narrow (960px) |
| `heading_size` — Heading size | `select` | `medium` | `small`: Small; `medium`: Medium; `large`: Large; `xlarge`: Extra large |
| `corner_style` — Corners | `select` | `theme` | `theme`: Theme default; `square`: Square; `soft`: Soft; `round`: Round; Applies to images, cards and buttons in this section. |
| `button_size` — Button size | `select` | `regular` | `compact`: Compact; `regular`: Theme default; `large`: Large |
| `entrance` — Entrance animation | `select` | `none` | `none`: None; `fade`: Fade in section; `stagger`: Items rise one by one; Skipped when visitors prefer reduced motion or motion is off in Theme settings. |
| `color_scheme` — Color scheme | `color_scheme` | `scheme-1` |  |
| `content_width` — Content width | `select` | `inherit` | `inherit`: Use theme page width; `narrow`: Narrow (1200px); `wide`: Wide (1440px); `full`: Full width with page gutters |
| `spacing_mode` — Padding | `select` | `inherit` | `inherit`: Use theme section spacing; `custom`: Custom |
| `padding_top` — Padding top (desktop) | `range` | `72` | 0–200px, step 4; Screens from 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom` — Padding bottom (desktop) | `range` | `72` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_top_small` — Padding top (smaller screens) | `range` | `48` | 0–200px, step 4; Screens below 990px.; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |
| `padding_bottom_small` — Padding bottom (smaller screens) | `range` | `48` | 0–200px, step 4; Shown when `{{ section.settings.spacing_mode == 'custom' }}` |

Supported block: **Button** (`button`); type limit 2.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `label` — Label | `text` | `Shop now` |  |
| `link` — Link | `url` | `/collections/all` |  |
| `style` — Style | `select` | `solid` | `solid`: Solid; `outline`: Outline; `pill`: Pill; `sweep`: Center sweep; `offset`: Offset shadow; `press`: 3D press; `link`: Text link |
| `new_tab` — Open link in a new tab | `checkbox` | `false` |  |

Add-menu presets:

- Video — `{"heading":"Behind the seams"}`.

### Theme blocks

#### Group (group)

Source: `theme/blocks/group.liquid`. Editor: Add block inside a compatible theme-block section/group.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `layout_direction` — Layout direction | `select` | `group--vertical` | `group--horizontal`: Horizontal; `group--vertical`: Vertical |
| `alignment` — Alignment | `select` | `flex-start` | `flex-start`: Left; `center`: Center; `flex-end`: Right; Shown when `{{ block.settings.layout_direction == 'group--vertical' }}` |
| `padding` — Padding | `range` | `0` | 0–200px, step 2 |

Supported block: **@theme** (`@theme`).

Add-menu presets:

- Column — `{"layout_direction":"group--vertical","alignment":"flex-start","padding":0}`.
- Row — `{"layout_direction":"group--horizontal","padding":0}`.

#### Text (text)

Source: `theme/blocks/text.liquid`. Editor: Add block inside a compatible theme-block section/group.

| Setting ID / label | Type | Schema default | Choices / range / help |
| --- | --- | --- | --- |
| `text` — Text | `text` | `Text` |  |
| `text_style` — Text style | `select` | `text--title` | `text--title`: Title; `text--subtitle`: Subtitle; `text--normal`: Normal text |
| `alignment` — Alignment | `text_alignment` | `left` |  |

Add-menu presets:

- Text.
