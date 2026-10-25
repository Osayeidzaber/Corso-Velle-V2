# Distribution and updates

[Back to README](../README.md) · [Installation](../INSTALLATION.md) · [Development](../DEVELOPMENT.md) · [License status](../LICENSE)

The current checkout is Corsovelle's configured theme. Building a ZIP is supported; preparing a neutral commercial product remains a separate release task. No automated neutralization or settings migration command exists.

## Release contents

| Delivery | Include |
| --- | --- |
| Merchant install ZIP | Built contents of `theme/`, with theme directories at ZIP root, generated assets/loader and `assets/nk-third-party-notices.txt`. |
| Buyer documentation | README, installation/customization guides, settings reference, specialist setup guides, approved license/support terms and third-party records. Deliver these beside the install ZIP. |
| Source distribution, if licensed | Authored `src/`, theme source, package/lockfile, Vite/TypeScript configuration, scripts, relevant tests, public guides and attribution records. Exclude dependencies, credentials and private working material. |

Use [Installation → Build and distribute](../INSTALLATION.md#build-and-distribute) for commands. `npm run package` runs checks and packages the current theme; it does not remove brand settings, change resource references or publish a theme.

## Prepare neutral defaults

Prepare a separate release copy while preserving Corsovelle's working configuration. Review `theme/config/settings_data.json`, all template and section-group JSON, schema defaults, Liquid fallbacks, media URLs, text and assets. Remove or replace store-specific logos, support contacts, social links, product/collection references, imported chart assignments and promotional codes. Supply owned demo media, meaningful empty states and approved theme metadata/documentation URLs.

Install the resulting ZIP on both a separate empty store and a representative populated store. Verify missing resources, reconnecting pickers, theme styles, section/block composition and complete shopping flows. A theme package cannot create the store's catalog, discounts, metafield definitions or metaobject entries.

## License and release decisions

The [LICENSE](../LICENSE) states that no license is granted until commercial terms are published. Keep all existing [third-party notices](../THIRD_PARTY_NOTICES.md) and obtain approval for original code, adapted components, bundled libraries, fonts, photography, video, logos and demo content. Attribution alone does not establish permission to distribute every asset.

Before a buyer-facing release, the owner must approve:

| Decision | Current status |
| --- | --- |
| Commercial theme name and rights holder | **Pending owner approval**; repository display name is not a finalized sales identity. |
| License scope and distribution channel | **Pending owner approval**; no buyer/store/seat terms supplied. |
| Support contact, scope and response policy | **Pending owner approval**; no support address supplied. |
| Release numbering and release notes | **Pending owner approval**; package/theme metadata is not a published support commitment. |
| Update entitlement and delivery | **Pending owner approval**; no automatic updater or migration tool. |
| Compatibility commitment | **Pending validation** across browsers, physical devices, apps and required markets/currencies. |

Private sales and Shopify Theme Store submission have different requirements. Theme Store submission needs its own review against [Shopify's current requirements](https://shopify.dev/docs/storefronts/themes/store/requirements), including originality, exclusivity, performance, accessibility and support. Current Dawn adaptations and minified CSS need review for that channel. No Theme Store acceptance or blanket redistribution clearance is claimed here.

## Updates

1. Back up/download the installed theme and keep a source diff of any custom code.
2. Review the release's approved changes and migration instructions. No versioned buyer release history exists yet.
3. Install the update as an unpublished theme. Compare settings, template arrangements, section/block IDs, custom CSS/Liquid and app blocks before copying or merging anything.
4. Preserve merchant `settings_data.json`, template/group JSON and resource assignments deliberately. Blind replacement can erase design changes; blind copying can discard new release defaults. Renamed schema IDs need a documented migration.
5. Preview, reconnect resources if needed and complete [installation checks](../INSTALLATION.md#test-and-publish). Publish only after acceptance; retain the previous theme for rollback.

## Support information

Until a support channel is approved, no public address or service promise should be inferred from this repository. For a reproducible issue, record source revision/release, browser/device, template, setting values, expected/actual behavior and minimal steps. Redact customer/order data and private credentials. Storefront customer-support settings describe the merchant's business, not the theme vendor's support service.

## Documentation media

The [README cover](readme-cover.svg) is a brand illustration, not a storefront screenshot; the README has no storefront screenshots yet. Capture approved images of the home page on desktop/phone, product gallery and size guide, Theme Editor design controls, collection filters and cart drawer. Use owned catalog media, remove private/customer data, add descriptive alt text and record the theme revision. Add references only after the approved files exist.

Keep public documentation and license texts in Git. Store prompts, audit evidence, scratchpads and temporary captures outside the repository or in ignored `.local-dev/`. Do not include ignored private material by force-adding it to a release commit or source archive.
