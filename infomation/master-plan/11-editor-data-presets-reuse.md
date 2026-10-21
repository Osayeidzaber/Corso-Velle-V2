# 11 — Editor compatibility, settings, data contracts, presets, reuse, upgrades

Refines [../02-editor-and-reusability.md](../02-editor-and-reusability.md) (its lifecycle contract and acceptance script remain valid and are incorporated here).

## 1. Editor lifecycle — how each requirement is met

| Requirement | Mechanism |
|---|---|
| Sections can be added, duplicated, moved, removed and re-rendered | All behaviour lives in custom elements. Shopify replaces section HTML and the browser fires `connectedCallback`/`disconnectedCallback`. Nothing initialises from a page-load event alone. |
| Components initialise after insertion | `NkElement.connectedCallback` → `mount()`. `define()` is idempotent. Entry modules load on every page type that can host the component. Content-only modules (marquee, reveal, tabs) load from `nk-global` when cheap; otherwise a section adds `<script type="module" src="{{ 'nk-content.js' \| asset_url }}">` (browsers de-duplicate module scripts by URL). |
| Removed instances release listeners, observers, timers, media and animations | One `AbortController` per connection. `observe*`, `later` and `dispose` helpers; video `pause()` and `src` released in `dispose`. The overlay service self-heals when its panel disconnects. Tested in S2 by counting listeners and timers. |
| Multiple instances stay independent | IDs come from `section.id`/`block.id`. `ref()` lookups are scoped to the root. No module-level singletons except services, and services key all state by `sourceId`. |
| Selected blocks become and stay visible | The `editor` service maps `shopify:block:select` to the owning element's `onEditorSelect(blockId)`. That opens the accordion, drawer level, mega panel, tab or slide; pauses marquee and slides; finishes reveals; and scrolls a rail to the block. Deselect restores the default state. |
| Autoplay and entrances don't obstruct editing | Liquid checks `request.design_mode` and renders final states with autoplay off by default. JS also checks `Shopify.designMode`. |
| App blocks survive supported updates | `@app` sits in the product info column, the cart page and content groups. Variant re-render replaces only named regions (S5). No global CSS targets app markup. |
| Merchant configuration is preserved during upgrades | See §6. |
| Correct block model | §2. |

**Placeholders.** The `editor-placeholder` snippet shows a helpful empty state only when `request.design_mode` is true. On the storefront, empty optional sections render nothing.

## 2. Theme blocks vs section blocks vs snippets

| Use | Model | Why |
|---|---|---|
| Composable content (heading, text, buttons, media, group) inside hero, media-text, rich text, campaign tiles | **Theme blocks** (`blocks/*.liquid`, `@theme` + private `_slide`, `_tile`, `_campaign`) | Reuse across sections; merchants can nest a group of up to 2 levels |
| Main product info column | **Theme blocks with static required blocks** (title, price, picker, buy) — confirmed by S8; fallback is local section blocks | Reorderable, with app positions, and required blocks can't be deleted |
| Announcement messages, footer columns, menu promos, facets config | **Section (local) blocks** | Tight constraints and a simpler editor tree |
| Product card, price, line item, image, swatch, option values, size chart table | **Snippets** with LiquidDoc params | Not merchant-editable instances; one implementation |
| Header, footer, announcement | **Section groups** (`header-group.json`, `footer-group.json`) | Platform requirement; merchants can add sections to the groups |

A section never mixes theme blocks and local blocks (platform rule). Limits to stay within: 25 sections per template or group, 50 blocks per section, nesting depth ≤8 (we use ≤3).

## 3. Global settings (`config/settings_schema.json`)

Grouped and bounded. Each item is a merchant outcome, not a pixel.

| Group | Settings |
|---|---|
| Logo & favicon | logo, alternate logo, favicon |
| Colors | Color scheme group (roles: background, surface, text, text-muted, line, accent, accent-text); status colors error and success |
| Typography | heading font (`font_picker`), body font, spec font, heading case (as typed / uppercase), heading width (normal/condensed where the font supports it), base size (14/15/16) |
| Layout | page width (1200/1440/full), section spacing (compact/regular/airy), corner style (square/soft) |
| Product cards | image ratio, show secondary image, show size row + option name(s), show color summary, quick add (off/on), badge style |
| Product | explicit-choice option names (default "Size"), sold-out values (strike/hide), inventory note threshold (off/number), pre-order wording |
| Cart | after add (drawer/notification/page), show note, accelerated checkout in drawer, empty-state collection |
| Search | predictive on/off, suggested collections, resource types |
| Motion | level (off/minimal/standard), header reveal on/off |
| Social & contact | URLs (hidden when empty), optional floating contact link + position |
| Currency & localization | show currency codes, country/language selectors |

Per-section settings are grouped Content → Layout → Appearance → Behavior, with consistent labels and `info` help text, all translated in `locales/en.default.schema.json`.

## 4. Product data contracts (`docs/data-contracts.md`)

Proposed definitions. They **do not exist on the owner's store yet**. They are created by setup (manual admin steps, or an Admin API script run by the developer with the owner's permission) — themes cannot declare definitions.

| Namespace.key | Type | Used by | Fallback |
|---|---|---|---|
| `custom.fit_note` | single_line_text | fit-note block, quick add | block hidden |
| `custom.model_info` | single_line_text ("Model 185 cm, wears L") | picker area | hidden |
| `custom.fabric` | rich_text | accordion | accordion hidden |
| `custom.care` | rich_text | accordion | hidden |
| `custom.size_chart` | metaobject_reference → `size_chart` | size guide | section default chart → page fallback → trigger hidden |
| `custom.model_image` | file_reference (image) | card model mode | featured media |
| `custom.packshot_image` | file_reference (image) | card packshot mode | featured media |
| `custom.color_siblings` | list.product_reference | color-siblings block, card count | block hidden |
| `custom.color_name` | single_line_text | sibling label | product option or title |
| `custom.badge` | single_line_text with choices (new, limited, exclusive, back-in-stock) | card badge | none |

The `size_chart` metaobject fields are listed in [08 PR-04](08-product.md#pr-04-size-guide-nk-size-guide). Storefront access must be enabled on the metaobject definition. Theme Store caveat: custom metaobject definitions aren't allowed for Theme Store themes. If OD-01 chooses that route, ship the page-based fallback as the primary path.

Shopify standard data used: option swatches (`product_option_value.swatch`), filters, `variant.quantity_rule`, `selling_plan`, and recommendations.

## 5. Presets and reuse proof

**Preset A "Signal"** and **Preset B "Quiet"** are delivered as `settings_data.json` presets plus their JSON template defaults (canvas artboard 09 shows the differing values). Neither preset may branch on preset name, brand, domain or handle.

**Reuse proof (M4):** install the packaged theme on a *second* development store with a different catalog (accessories-heavy, no sizes, a different currency, two languages), apply Preset B, and change brand assets — **zero code edits**. Stress fixtures to include:

- landscape and tall logos
- no hero image
- 1 collection and 40 collections
- products with no metafields
- products that use every metafield
- long German titles
- an RTL check, only if a market needs it

A configuration fixture "dark-only store" (Rush-like) checks the color-scheme roles.

**Hardcoding guard (CI):** grep for currency symbols, `/cart` or `/collections/` literals in `src/`, `myshopify.com`, brand names, and handles outside presets/locales. Theme Check `HardcodedRoutes` runs on Liquid.

## 6. Upgrades and merchant-data preservation

1. **Setting and block IDs are API.** Never rename an `id`. Deprecate it, keep reading it, and add the new one. Labels can change freely.
2. Every release ships `CHANGELOG.md`, `docs/upgrade-notes.md` (schema changes and a mapping table), and its version in `settings_schema.json` `theme_info`.
3. **Upgrade procedure:**
   1. Duplicate the live theme (backup).
   2. Pull its `config/settings_data.json`, `templates/*.json` and section-group JSON.
   3. Run `scripts/migrate.ts` on those files (pure JSON transforms, unit-tested) for any renamed or moved settings.
   4. Push code plus the migrated JSON to a *new unpublished* theme.
   5. Run the editor acceptance script and the critical journeys.
   6. Get owner approval.
   7. Publish (a separate, explicit action).
   8. Keep the old theme for rollback.
4. Never push demo `settings_data.json` or templates over a merchant theme. `.shopifyignore` and the push scripts exclude merchant JSON by default (`--only` lists for code).
5. Theme-owned assets carry the `nk-` prefix. Packaging and pushes never delete non-`nk-` assets.

## 7. Installation, content setup, and handover

| Document | Audience | Contents |
|---|---|---|
| `docs/install.md` | developer/owner | Upload ZIP → preview → choose preset → set fonts/colors |
| `docs/merchant-setup.md` | owner/staff | Menus, filters (Search & Discovery), metafield/metaobject creation, size charts, media standards, cart/search settings, markets |
| `docs/content-guide.md` | content team | Image specs, safe areas, copy lengths, alt text, campaign launch checklist |
| `docs/developer.md` | developers | Build, components, events, services, adding a section, testing |
| `docs/upgrade-notes.md` | developer | Migrations per version |
| Recorded walkthrough | staff | Typical weekly tasks (OD-12) |

## 8. Editor acceptance script (per section/component, run in M2–M5)

Carried over from the earlier plan, with additions marked **new**:

1. Add a fresh instance and confirm the placeholder.
2. Populate it and switch every layout mode.
3. Duplicate it and check for independent behaviour and unique IDs.
4. Reorder it.
5. Select an offscreen or hidden block and confirm it is visible.
6. Change settings rapidly with a panel open.
7. Delete it and check: no console errors, and listener/timer counts are back to baseline (**new: measured with a devtools snippet**).
8. Save, exit, and verify the storefront.
9. Reload the editor and confirm the state persisted.
10. Add an app block where supported.
11. **New:** repeat steps 1–7 at the narrow (mobile) editor preview width.
12. **New:** with Motion set to Off and with reduced motion emulated.

Record expected vs. actual. Screenshots alone don't count as a pass.
