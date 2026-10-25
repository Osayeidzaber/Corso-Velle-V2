# Size charts in Shopify

Reusable product/collection metaobject charts and a global fallback are now supported. Follow
[SIZE-CHART-ADMIN.md](SIZE-CHART-ADMIN.md) for the exact definitions, assignments and fallback order.
The five CSV rules below remain supported for existing stores.

Open Online Store → Themes → Customize → Theme settings → Size charts.

Five chart rules are available. For each chart:

1. Select the collections or specific products, and/or enter exact product tags, one per line. Product assignments outrank collections; collections outrank tags. Within a scope, the first usable rule wins.
2. Upload **Size chart picture**, enter a **Reusable chart handle** for a centrally edited `size_chart` entry, and/or enter the table: first line contains headings such as `Size,Chest,Length`; each following line contains one size label and its actual measurements, separated by commas. Use the product variant labels exactly, such as M, L or XL. Pictures work without a table; a reusable chart takes priority over CSV, and its image takes priority over the rule picture.
3. Choose centimetres or inches, describe whether values measure the garment or body, and optionally add a note.
4. Save. Product pages, the full size guide and quick-add product drawers use the same chart automatically.

For a product with different measurements, use another rule and select that product under **Apply to specific products**. Product rules take priority over collection rules even if they appear later. Within the same scope, the first populated matching chart wins. Blank charts are ignored.

Existing product metafields `custom.size_chart` and `custom.measurements` remain the highest priority.
Product rules precede collection metafield charts, followed by collection rules, tag rules, the global
reusable chart and template CSV/page fallback. Footwear charts can be assigned explicitly using these rules.

Pictures appear in the existing full size guide and can be opened larger. Image text is not
converted between units; numerical inline previews still require actual structured/CSV values.
Reusable chart pictures use the optional `image` field (File reference restricted to images).

Purchasable sizes, prices and availability are edited under **Products → the product → Variants**. The chart describes those sizes; it does not create variants, change stock or enable a sold-out size. Card size actions always use the actual variants.

Hover or keyboard focus previews the matching row without selecting a variant. Selecting a size keeps its measurements visible; tap a size on a phone. If a row is missing, the dark panel names that size and says its measurements have not been provided. No numeric measurements have been populated by this change.

Validation: settings and Liquid pass Theme Check; product previews and playback races are covered by automated tests. Live saved collection/product assignments still need merchant-verified measurements before their numerical content can be confirmed on the store.
