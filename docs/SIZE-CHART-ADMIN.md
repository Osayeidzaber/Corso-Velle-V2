# Reusable size charts — Shopify Admin setup

This extends the existing size drawer, inline panel and size selector. It does not add measurements
to products automatically. The theme code is implemented; the following definitions and entries
must exist in your store before assigned charts appear. No catalog data was created by this task.

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
2. An explicitly assigned **product** CSV rule in the existing five Theme Editor chart rules.
3. A **collection metaobject chart**, selected by explicit collection reference or priority above.
4. A matching existing **collection** CSV rule (first populated matching rule wins).
5. The global reusable chart handle.
6. The existing product-template CSV, then selected fallback page.

Legacy product/collection CSV assignments retain their relative behavior. Product-specific data
always precedes collection and global data. An instructions-only assigned chart is intentional:
it renders those instructions without mixing in measurements from a lower-priority source.
An empty chart with neither a valid table nor instructions falls through to the next source.

Both the full drawer and inline panel receive the same resolved chart. Selected-size highlighting
and inch/cm switching reuse the current controllers. A missing matching size row shows the existing
unavailable-measurements message, not guessed values. Quick-add reuses the product section and chart.

## 4. Display settings (defaults preserve existing behavior)

**Product information → Variant picker** controls full guide visibility, inline panel visibility,
hover/focus preview, unit switching and selected-size highlighting. The original measurement-basis
heading, note, template table and fallback page fields remain available. Disabling unit switching
uses the chart's authored unit even if a shopper previously chose another unit.

The panel uses the current scheme's accent and text-on-accent (brown `#432D23` and warm white
`#F5ECDF` by default). The drawer retains its existing warm-white surface and brown selection accents.
These switches preserve behavior by default. A separate, explicitly requested reference update
uses a centered full-size heading, short animated selector underline and evenly spaced measurement
columns; other product-page components retain their existing presentation.

## 5. Carousel size details

The latest requested carousel design is browse-only: product photography, minimal captions,
highlight, autoplay and direct product links. Size selectors, inline charts and Add to cart are
intentionally no longer rendered by featured collections. Customers choose sizes on the product
page; the chart assignments and product-page behavior documented above remain unchanged.

Legacy carousel measurement snippets/controllers remain available for existing custom markup.
Those use reusable assignments and can fetch a product-template-only panel on first selection,
with caching and stale-response guards. They are not an active Theme Editor feature in the new
browse-only carousel. No chart data was removed or invented by this presentation change.

## Verification and sources

Optional local Liquid fixture check: install `python-liquid` outside the project, make it available
on `PYTHONPATH`, then run `python scripts/verify-size-charts.py`. It renders the actual assignment,
table and inline-panel snippets with synthetic fixtures. It does not create Shopify records.
Also run the normal TypeScript/unit/build/Theme Check commands and verify assigned data on a store.

Shopify references: [building a metaobject](https://help.shopify.com/en/manual/custom-data/metaobjects/building-a-metaobject),
[creating entries](https://help.shopify.com/en/manual/custom-data/metaobjects/creating-entries),
[metafield definitions](https://help.shopify.com/en/manual/custom-data/metafields/metafield-definitions/creating-custom-metafield-definitions),
[metaobject settings limitations](https://shopify.dev/docs/storefronts/themes/architecture/settings/input-settings#metaobject).
