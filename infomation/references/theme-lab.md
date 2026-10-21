# Theme Lab: focused source review and decision

Reviewed: 21 October 2026. Repository: [uicrooks/shopify-theme-lab](https://github.com/uicrooks/shopify-theme-lab). This is a source inspection of selected files on `main`, not a complete repository, security, runtime, or compatibility audit. No dependencies were installed and no code was executed.

## Verdict

Use Theme Lab as a useful example of frontend tooling around Liquid. For this project, start a fresh original/Skeleton-based theme with Vite and independently mounted components. The reason is the required lifecycle/reuse contract, not a blanket claim that Vue or Webpack cannot produce a good theme.

See the binding proposal in [architecture](../01-architecture.md).

## Evidence inspected

| File | Direct observation | Why it matters |
|---|---|---|
| [package.json](https://github.com/uicrooks/shopify-theme-lab/blob/main/package.json) | Vue/Vuex, Tailwind and Webpack toolchain; older declared version baselines | It is not a drop-in Vite/TypeScript starter |
| [webpack.common.js](https://github.com/uicrooks/shopify-theme-lab/blob/main/.config/webpack/webpack.common.js) | One main entry, output to Shopify assets, bundle.js/bundle.css, Vue loader/compiler alias | Demonstrates authored-source/deployable-output separation |
| [theme.liquid](https://github.com/uicrooks/shopify-theme-lab/blob/main/shopify/layout/theme.liquid) | App wrapper around layout content, static header/footer sections, global bundle references | Its starting composition differs from our proposed section groups and bounded behavior ownership |
| [src/main.js](https://github.com/uicrooks/shopify-theme-lab/blob/main/src/main.js) | Creates Vue apps, auto-registers components/store modules, mounts root or marked elements | Automatic discovery can be convenient but needs deliberate loading/ownership rules |
| [LICENSE](https://github.com/uicrooks/shopify-theme-lab/blob/main/LICENSE) | MIT license notice present | Preserve applicable notices if code is reused; our default is original implementation |

Declared dependency ranges are not an installed lockfile audit. No conclusion about vulnerabilities or maintainership is drawn from age alone.

## Editor handling: precise finding

The inspected main file listens for section-load events in design mode and mounts Vue for wrappers whose classes contain `vue`. Separately, outside design mode in development, it watches added DOM nodes and reloads the page when matching Vue content is inserted. The same file does not show corresponding section-unload cleanup or block-selection visibility handling. This is a finding about the inspected entry file, not proof that no other repository file could contribute behavior. [Entry source](https://github.com/uicrooks/shopify-theme-lab/blob/main/src/main.js)

Our requirement goes further: duplicated and replaced components must initialize independently, selected slides/accordions must be exposed, and removed instances must release listeners/media/observers. A development reload may be convenient, but it cannot be the mechanism that makes our production/editor interactions correct.

## Asset-cleaning finding

The inspected Webpack configuration uses a cleaning rule that preserves files matching a `static` filename convention while cleaning other output files. [Build source](https://github.com/uicrooks/shopify-theme-lab/blob/main/.config/webpack/webpack.common.js)

For our reusable theme, use an explicit owned-asset manifest or a composed distribution directory. A merchant-added file should not depend on knowing a developer's filename convention to survive a build. Test packaging and upgrades with extra unrelated assets.

## What to retain conceptually

- Keep authored frontend code separate from the uploadable theme.
- Have one reproducible build workflow rather than hand-copying bundles.
- Make component boundaries explicit and consistent.
- Run theme validation alongside frontend lint/type checks.
- Document development commands and the relationship between Liquid and frontend behavior.

These ideas do not require inheriting Theme Lab's entire runtime.

## What our foundation changes

| Concern | Our proposed decision | Proof needed |
|---|---|---|
| Rendering | Liquid owns essential initial HTML | Product/collection content visible before JS |
| Behavior | Light-DOM custom elements with local state | Multiple instances and reinsertion tests |
| Shared state | Narrow cart/overlay services | Concurrency and cleanup tests |
| Asset loading | Small shared core plus feature entries | Measured production bundles and CDN imports |
| Editor | Explicit load/unload/selection adapter | Real editor lifecycle script |
| Page composition | JSON templates and header/footer groups | Merchants can reorder supported content |
| Branding | Settings, dynamic sources, presets | Second brand without code edits |
| Updates | Preserve merchant data and non-owned assets | Upgrade over customized prior version |

## If Vue is later requested

Keep Vue in a bounded island with a documented mount/unmount contract. Choose it for an interaction that benefits from its state/rendering model, measure its incremental cost, and ensure Liquid content and app blocks are not swallowed by a broad mount root. Do not add a second parallel cart state system.

Vite integration still needs an explicit mapping from build outputs to Shopify asset URLs. Replacing Webpack in the package manifest does not solve Liquid references, CDN chunk paths, editor lifecycle, or distribution packaging.

## Foundation decision gate

Proceed with the fresh foundation if the CDN asset spike, duplicated-section editor spike, and commerce slice pass. Reconsider a specific library only if a measured limitation warrants it. The design ambition comes from the interaction/content specification, not from adopting a particular starter repository.
