# Reusable size charts

[Back to README](../README.md) · [Customization](../CUSTOMIZATION.md) · [Development](../DEVELOPMENT.md) · [Chart settings](SIZE-CHART-SETTINGS.md)

Reusable charts are `size_chart` metaobject entries that many products and collections can share,
so a measurement is edited once. They feed the size guide drawer, the inline measurement panel and
quick add. The theme never adds measurements to products: create the definitions and entries below
first. For simple per-rule tables or pictures without metaobjects, use
[Size chart settings](SIZE-CHART-SETTINGS.md) instead.

## 1. Define a reusable chart

In **Content → Metaobjects → Add definition** (also accessible through **Settings → Metafields and
metaobjects / Custom data**), create **Size chart**, with the exact type `size_chart`.
Reuse an existing definition of that type instead of creating a second one.

| Field key | Type | Purpose |
|---|---|---|
| `title` | Single line text | Internal/display chart name; use as the display-name field |
| `unit` | Single line text, allowed values `cm`, `in` | Unit in which numerical values were entered |
| `measurement_basis` | Single line text | For example, garment measured flat or body measurements |
| `table` | JSON | Arbitrary measurement columns and size rows, as below |
| `image` | File reference, restricted to images (optional) | Upload/select a size-chart picture; may be used alone or beside the table |
| `notes` | Rich text (optional) | Sizing instructions, fit advice or measuring directions |
| `fallback` | Rich text (optional) | Instructions when no numerical table is provided |

Enable storefront/Online Store access. If the definition uses entry status, use **Active** for
entries to be displayed. Do not require standalone web pages: the product page renders the entry.
Create one entry per actual fit/category/measurement set in **Content → Metaobjects → Size chart**.
This supports shirts, T-shirts, hoodies, trousers and jeans with different columns. The theme does
not infer which measurements apply from a product title.

`table` has this structure (synthetic illustration only; replace every measurement with approved data):

```json
{
  "columns": [
    { "key": "chest", "label": "Chest" },
    { "key": "length", "label": "Length" }
  ],
  "rows": [
    { "size": "M", "values": { "chest": 52, "length": 70 } },
    { "size": "L", "values": { "chest": 55, "length": 72 } }
  ]
}
```

Use unique column keys, labels suited to the garment, and size labels matching Shopify variants.
For trousers use keys such as `waist`, `inseam`, `rise`; the same renderer supports any number of
columns. Enter decimal numbers for automatic conversion. Text such as `38–40` or `Regular` remains
text with its original unit where relevant; the theme never invents a converted range.
Changing a chart does not create product variants or change stock.

### Pictures and assignment rules

For the simplest picture workflow, open **Online Store → Themes → Customize → Theme settings →
Size charts**. In any of the twelve chart rules:

1. Pick **Apply to collections** and/or **Apply to specific products**, or enter **Apply to product
   tags**, one exact tag per line. Any listed target can match; a product does not need to match
   every field. Tag matching ignores case and surrounding spaces, never matches part of a tag,
   and preserves commas inside tag names.
2. Use **Size chart picture** to upload/select your image. You may leave Measurements empty.
3. Save. The same existing Size guide opens that picture on the matching products and quick-add
   drawers. Clicking the picture opens its larger version in a new tab. Keep image text readable
   on phones and provide descriptive alt text in Shopify Files.

For a chart edited centrally under **Content → Metaobjects**, add the optional `image` field above
to your existing `size_chart` definition. Upload the picture and/or edit its measurement table in
the entry. Copy the entry's handle into **Reusable chart handle** in the rule. A usable reusable
chart takes priority over the rule's CSV; its picture takes priority over the rule's uploaded
picture. A rule picture can supplement a reusable numerical table that has no picture.

Existing product/collection metafield references remain supported. Reusing an entry means an
Admin edit updates all products that reference it on subsequent page/section requests. No browser
copy of the measurement dataset or new storefront API is involved. Previously open pages need a
reload to see an Admin edit.

A picture-only chart is valid. It does not produce fabricated inline measurements, numeric size
highlighting or unit conversion. Use a structured table as well if those capabilities are wanted.
If Size guide has been disabled in the product template, enable it under **Product information →
Variant picker → Show size guide** to display the picture.

## 2. Define assignments

Under **Settings → Metafields and metaobjects**, add these definitions (reuse matching existing ones):

| Owner | Namespace/key | Type |
|---|---|---|
| Products | `custom.size_chart` | Metaobject reference → Size chart, one entry |
| Collections | `custom.size_chart` | Metaobject reference → Size chart, one entry |
| Collections | `custom.size_chart_priority` | Integer, optional; lower wins; unset = 1000 |
| Products | `custom.size_chart_collection` | Collection reference, one collection, optional |
| Products | `custom.measurements` | JSON, optional legacy per-product alternative |

For a product override, open the product and select its chart in **Metafields → Size chart**.
For a collection chart, open the collection and choose the reusable chart there. Multiple products
or collections can reference the same entry. Chart edits then update every reference without code.

For a product in multiple charted collections, optionally choose one of its own collections using
`custom.size_chart_collection`. A reference to an unrelated collection is ignored. Otherwise the
lowest `custom.size_chart_priority` wins; equal priorities sort by collection handle alphabetically.
The result does not depend on the collection URL used to reach the product.

## 3. Global fallback and exact precedence

Open **Theme settings → Size charts → Default reusable chart handle**. Copy the entry's **Handle**
from Shopify Admin, for example `classic-shirt`. Leave blank to retain existing template fallbacks.
The handle field works before the custom definition exists; a custom metaobject picker would show
an editor error until that definition is installed. A nonexistent, draft or empty entry is ignored.

First usable source wins:

1. Product `custom.size_chart`, then product `custom.measurements` JSON.
2. An explicitly assigned **product** rule in the twelve Theme Editor chart rules.
3. A **collection metaobject chart**, selected by explicit collection reference or priority above.
4. A matching **collection** rule.
5. A matching **tag** rule.
6. The global reusable chart handle.
7. The existing product-template CSV, then selected fallback page.

Legacy product/collection CSV assignments retain their relative behavior. Product-specific data
always precedes collection and global data. An instructions-only assigned chart is intentional:
it renders those instructions without mixing in measurements from a lower-priority source.
An empty chart with neither a valid table, picture nor instructions falls through to the next
source. Within each rule scope the first usable rule (Chart 1 through Chart 12) wins. A missing,
draft or inaccessible reusable entry uses that rule's CSV/picture if supplied, otherwise the
resolver continues to the next rule. Product-specific data remains the strongest override.

Both the full drawer and inline panel receive the same resolved chart. Selected-size highlighting
and inch/cm switching reuse the current controllers. A missing matching size row shows the existing
unavailable-measurements message, not guessed values. Quick-add reuses the product section and chart.


## 4. Display settings (defaults preserve existing behavior)

**Product information → Variant picker** controls full guide visibility, inline panel visibility,
hover/focus preview, unit switching and selected-size highlighting. The original measurement-basis
heading, note, template table and fallback page fields remain available. Disabling unit switching
uses the chart's authored unit even if a shopper previously chose another unit.

Inline measurements consume scheme accent/text-on-accent tokens. Full guide surfaces retain their own styling; review contrast after palette changes.

## 5. Carousel size details

Featured collection supports a **Shop the highlighted product** switch. When enabled, its purchase panel and size choices can use assigned measurements; when disabled it is browse-only. Complex or incomplete variant data directs shoppers to the product page. Picture-only charts do not supply numerical inline values.

## Testing and references

Optional local Liquid fixture check: install `python-liquid` outside the project, make it available
on `PYTHONPATH`, then run `python scripts/verify-size-charts.py`. It renders the actual assignment,
table and inline-panel snippets with synthetic fixtures. It does not create Shopify records.
Verify assigned charts on a development theme before publishing.

Shopify references: [building a metaobject](https://help.shopify.com/en/manual/custom-data/metaobjects/building-a-metaobject),
[creating entries](https://help.shopify.com/en/manual/custom-data/metaobjects/creating-entries),
[metafield definitions](https://help.shopify.com/en/manual/custom-data/metafields/metafield-definitions/creating-custom-metafield-definitions),
[metaobject settings limitations](https://shopify.dev/docs/storefronts/themes/architecture/settings/input-settings#metaobject).
