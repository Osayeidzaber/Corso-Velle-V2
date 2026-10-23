# Native editor acceptance matrix

Run against an unpublished development theme. Local/unit checks do not certify these steps.
Record store/theme, browser/device, date, section IDs, actual outcome and evidence. Preserve the
merchant's current configuration; use a temporary test template or duplicate theme.

| Surface | Exercise | Required result | Current verification |
| --- | --- | --- | --- |
| Global layout | Choose each width, gutter and spacing value, save/reopen | Preview and saved storefront agree; full-bleed media remains full bleed | Native render + responsive checks passed; editor persistence pending |
| Media with text | Duplicate and set different widths/padding/schemes | Each instance stays independent; global changes affect inherited instances | Four-instance native render passed; editor drag/save pending |
| Media with text | Custom 0/200px edges, switch back to inherit, reorder | Zero honored; stale custom values ignored; no width leak | Native template reload/reorder passed |
| Buttons | Switch size/corners/effect in both schemes | Box/label legible; 44px minimum; product purchase minimum 56px | Native presentation matrix passed; global editor persistence pending |
| Hero CTAs | Two heroes with different local corners/styles/sizes | Independent settings; keyboard outline; no duplicate spoken labels | Native snippet matrix passed; editor duplication pending |
| Typography/presets | Riviera/Quiet/Minimal with long text/missing media | Valid fonts, wrapping and contrast; current content unaffected by code upgrade | Source/schema checks; full preset selection matrix pending |
| Nested blocks | Add/move/remove group/text and future primitives | Correct selection root, DOM order and responsive flow | Existing source contract; expanded block QA pending C1 |
| Motion | Toggle OS preference and phone policy, resize mid-scene | Content stays visible, static fallbacks, no orphaned pins | Runtime regressions exist; physical/OS session pending |
| Commerce | Select sold-out/available sizes, add exact variant, change quantity | Actual Shopify availability, no unintended size or duplicate add | Existing regression suite; each release needs catalog fixtures |
| Forms | Two newsletters/contact forms, errors/success | Unique labels/IDs; native errors and focus; no accidental real messages | Fixtures/real submissions require per-component evidence |

For each interactive section: add → populate → duplicate → reorder → select hidden block → change
settings rapidly → delete → re-add → save → reopen. Verify no console errors, duplicate IDs,
stale event handlers, extra requests or running offscreen animations. Check keyboard, no-JS,
reduced motion, 320/390/750/990/1440px and physical Safari/Android where available.

`npm run check:contracts` catches duplicate IDs/options, invalid range/select defaults, mixed
theme/local block models, invalid local-block presets, missing sections and broken order entries.
It intentionally does not claim to execute Liquid, detect every disconnected setting, validate
all Shopify constraints or certify editor/browser behavior. Shopify Theme Check remains required.
