# Size charts in Shopify

Reusable product/collection metaobject charts and a global fallback are now supported. Follow
[SIZE-CHART-ADMIN.md](SIZE-CHART-ADMIN.md) for the exact definitions, assignments and fallback order.
The five CSV rules below remain supported for existing stores.

Open Online Store → Themes → Customize → Theme settings → Size charts.

Five chart rules are available. For each chart:

1. Select the collections that share the same verified measurements.
2. Enter the table: first line contains headings such as `Size,Chest,Length`; each following line contains one size label and its actual measurements, separated by commas. Use the product variant labels exactly, such as M, L or XL.
3. Choose centimetres or inches, describe whether values measure the garment or body, and optionally add a note.
4. Save. Product pages, the full size guide and quick-add product drawers use the same chart automatically.

For a product with different measurements, use another rule and select that product under **Apply to specific products**. Product rules take priority over collection rules even if they appear later. Within the same scope, the first populated matching chart wins. Blank charts are ignored.

Existing product metafields `custom.size_chart` and `custom.measurements` remain the highest priority.
Product CSV rules precede collection metafield charts, followed by collection CSV rules, the global
reusable chart and template CSV/page fallback. Footwear charts can be assigned explicitly using these rules.

Purchasable sizes, prices and availability are edited under **Products → the product → Variants**. The chart describes those sizes; it does not create variants, change stock or enable a sold-out size. Card size actions always use the actual variants.

Hover or keyboard focus previews the matching row without selecting a variant. Selecting a size keeps its measurements visible; tap a size on a phone. If a row is missing, the dark panel names that size and says its measurements have not been provided. No numeric measurements have been populated by this change.

Validation: settings and Liquid pass Theme Check; product previews and playback races are covered by automated tests. Live saved collection/product assignments still need merchant-verified measurements before their numerical content can be confirmed on the store.
