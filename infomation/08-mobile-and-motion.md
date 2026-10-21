# Phone-first interaction and motion system

Status: proposed design and testing requirements. No physical-phone or emulated-mobile reference audit was completed; desktop observations do not prove mobile compatibility.

## The mobile standard

The complete shopping journey must feel designed for a phone: navigation, browsing, comparison, size selection, cart editing, and checkout handoff. Desktop composition is adapted intentionally, not scaled down.

Responsive test widths begin at 320px. Breakpoints are chosen where content needs them, then tested at intermediate widths. Device brand names are not CSS breakpoints. Use fluid containers, bounded type scaling, and consistent spacing tokens.

## Layout decisions

| Component | Phone decision | Common failure to prevent |
|---|---|---|
| Header | Compact logo/actions, dedicated menu | Desktop links squeezed into an unreadable row |
| Hero | Mobile crop and controllable text position | Face/product cut off; CTA below browser controls |
| Product grid | Two-column default with readable information | Tiny prices/actions or whole-page overflow |
| Product gallery | Swipe plus buttons/position indicators | Horizontal gesture preventing vertical scroll |
| Filters | Scrollable panel with Apply/Reset behavior | Apply button hidden behind keyboard/home indicator |
| Size options | Wrapping labelled controls with generous targets | Small swatches, hover-only availability |
| Size guide | Accessible table/panel with local overflow | Image text too small to read |
| Cart | Viewport-safe panel and reachable summary | Fixed footer covering the last item |
| Editorial split | Intentional stacking and media crop | Desktop half-width text squeezed onto phone |
| Footer | Clear stacked groups | Tiny dense columns |

Primary interactive controls target at least 44×44 CSS pixels where practical. Visible icons can be smaller within a larger hit target. Use adequate separation and test adjacent swatches/quantity controls with real touch.

## Viewport and keyboard handling

Use modern dynamic/small viewport units with suitable fallbacks for full-height surfaces. Account for safe-area insets. Do not disable zoom. Use input text sizing that avoids unintended iOS form zoom where possible and validate with actual Safari.

Search and cart-note panels must respond when the keyboard appears. Prefer natural panel scrolling and bounded flex layouts to multiple fixed-position layers. Opening/closing the keyboard must not leave blank space or change the page's remembered position.

Overlay cleanup must run on removal, navigation, breakpoint transition, and orientation change. Test background/foreground transitions and browser Back. A page that becomes permanently unscrollable is a blocking defect.

## Gesture policy

Native vertical scrolling remains primary. Horizontal rails may use CSS scroll snap or a small controlled carousel, but must preserve vertical touch gestures. Buttons provide alternatives to swiping. Never require dragging to perform a purchase-critical task.

Product images stay links where expected, while explicit gallery controls remain separate. Prevent accidental product navigation only when a real swipe occurred; do not disable normal tapping globally.

## Motion design tokens

These are original starting values, to refine after visual testing. They are not extracted timings from the reference sites.

| Token | Starting range | Use |
|---|---|---|
| Immediate feedback | 100–160ms | Button press, icon state, swatch selection |
| Small transition | 160–240ms | Accordion affordance, image crossfade, header surface |
| Overlay movement | 240–320ms | Menu, filter, cart entrance/exit |
| Content reveal | 300–450ms | Optional small entrance on editorial content |
| Stagger | 30–50ms per item, total capped | A few menu/editorial items, never full long grids |

Use one coherent ease-out family for entrances and a shorter exit. Begin with CSS transitions and Web Animations API. A library must earn its cost with a specific interaction and measurable benefit.

## Motion by feature

| Feature | Motion rule | Reduced-motion behavior |
|---|---|---|
| Header reveal | Translate without reflow; no pixel-by-pixel flicker | Stable visibility or instant state change |
| Drawer | Small directional travel plus backdrop fade; interruptible | Immediate or very short fade |
| Mega menu | Controlled panel appearance; small optional item stagger | No stagger |
| Card alternate image | Crossfade only where secondary media exists | Instant image change |
| Product gallery | User-controlled slide change | Instant/short change |
| Ticker | Optional continuous visual loop, pause control | Static readable message |
| Editorial reveal | Subtle, once; no hiding meaningful content indefinitely | Fully visible immediately |
| Add confirmation | Clear status first, small visual acknowledgment second | Text/status without movement |
| Video | Explicit control; poster fallback | Poster-first, no forced background motion |

No scroll hijacking, compulsory page loaders, cursor-following effects on touch, or long purchase-blocking transitions in version one. These are project scope decisions, not claims that all such effects are inherently unusable.

## Animation engineering contract

- Prefer transform/opacity for frequent movement; avoid repeatedly animating layout across a product grid.
- Do not attach expensive work to every scroll event. Use appropriate observers and bounded scheduled updates.
- Cancel/finish animations cleanly when state changes mid-transition.
- Removing a section stops its observers, timers, and media.
- Only animate the component that changed; a cart update should not replay the whole page.
- Keep initial HTML visible unless enhancement has safely initialized.
- Respect reduced-motion preference and an optional merchant-level decorative-motion setting.
- Editor selection overrides entrance/autoplay behavior so content remains inspectable.
- Background blur is optional and must be profiled on a midrange phone; a plain dim backdrop is the fallback.

## Responsive content rules

Use actual product photography in tests, including mixed ratios. Define safe text areas for hero assets. Product titles, price ranges, translations, and labels must wrap safely. Do not require copywriters to maintain one exact line length to prevent broken layout.

Treat missing optional imagery as a supported state. If a mobile image is absent, use the desktop image with focal-point fallback; do not show an empty hero. If no media exists, use a readable content-only layout or omit the optional section according to its contract.

## Real-device script

1. Open the store on cellular/slow-network conditions and begin scrolling before all media loads.
2. Open menu, enter a nested category, go back, close; verify page position.
3. Open search, type, dismiss keyboard, reopen, and rotate.
4. Browse collection, apply filters, open product, then return with browser Back.
5. Swipe gallery while scrolling the page; open/close zoom.
6. Choose options, open size guide, close, and confirm selection persists.
7. Add in a test store, edit cart quantity, remove item, and inspect error handling.
8. Repeat with larger text, reduced motion, and a screen reader for core controls.
9. Repeat at a narrow editor-preview width, then validate on the actual storefront.

Record video/screenshots and exact device/browser versions during implementation. This script is an acceptance plan, not a completed test report.
