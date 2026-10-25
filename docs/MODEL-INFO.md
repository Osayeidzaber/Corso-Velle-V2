# Model information

[Back to README](../README.md) · [Customization](../CUSTOMIZATION.md) · [Development](../DEVELOPMENT.md)

Product pages can show a line such as **"Model is 183 cm and wears size M"** under the size
picker. It comes from the **Model info** block in the product template (Theme editor >
Product page > Model info), which you can move, hide (untick **Show model info**) or remove.

## Per-product text (recommended)

Create these product metafield definitions once in **Settings > Custom data > Products >
Add definition** (turn on **Storefront access**):

| Name | Namespace and key | Type | Example |
| --- | --- | --- | --- |
| Model info | `custom.model_info` | Single line text | `Model is 183 cm and wears size M` |
| Model height | `custom.model_height` | Single line text | `183 cm` |
| Model size | `custom.model_size` | Single line text | `M` |

Then fill them on each product page in Shopify admin. Use **either** the full sentence
(`model_info`) **or** height + size; the full sentence wins when both are set.

## Block settings

- **Show model info**: turn the line on or off for the whole template.
- **Use product metafields**: read the metafields above.
- **Sentence**: used with height + size; `[height]` and `[size]` are replaced. Default:
  `Model is [height] and wears size [size]`.
- **Fallback text**: shown on products without model metafields. Leave blank to show nothing.
- **Show icon**: the small figure icon before the text.

Products without metafields and without fallback text show nothing, so the block is safe to leave on.
