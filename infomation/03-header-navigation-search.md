# Header, navigation, search, and overlay behavior

Status: proposed component specification. Reference observations are in [Hype Town](references/hypetown.md), [Rush Mode](references/rushmode.md), and [W&R](references/wrclo.md). Values below are design starting points, not measurements copied from those sites.

## Direction

Make the header a recognizable part of the brand and the fastest route into shopping. Combine a centered-logo option and campaign overlay mode with a compact, dependable mobile header. The desktop version must not simply shrink until its links collide.

Two supported desktop layouts are enough for version one: centered logo with split navigation/actions, and left logo with navigation beside it. Both use the same menu data and components. Mobile uses a deliberately simpler arrangement.

## H-01: Header geometry and states

Default design targets: 64–76px desktop header, 56–64px mobile header, optional 28–36px announcement strip. Exact heights depend on logo and type settings. Measure actual rendered height; never assume a constant offset after translations or editor changes.

| State | Entry condition | Presentation | Exit condition |
|---|---|---|---|
| Solid | Normal page or no eligible campaign hero | Surface background, normal logo and icons | Merchant selects supported overlay mode |
| Campaign overlay | First content section explicitly supports overlay | Alternate logo/foreground; readable media scrim | Hero boundary crossed or major overlay opens |
| Sticky visible | Sticky option enabled and threshold passed | Stable solid surface; no layout jump | Hide condition or return to top |
| Sticky hidden | Reveal-on-scroll-up mode, deliberate downward travel | Header moves out without shifting content | Upward intent, keyboard focus, or overlay opening |
| Overlay active | Menu/search/cart is open | Header remains readable; competing panels closed | Dismissal or navigation |
| Editor inspection | Header/block selected | Visible and stable | Deselection |

Use hysteresis for scroll direction rather than reacting to each pixel. Never hide a focused control or an open menu. Return-to-top behavior must not flicker as the hero boundary crosses the viewport. Header transparency applies only to compatible templates/first sections, not to every page with an image.

## H-02: Announcement strip

Support a static message by default and an optional scrolling ticker. Each message has text and an optional real link. Do not duplicate announcements semantically just to create a visual loop. Include pause control for continuous movement and respect reduced motion. In the editor, selecting a message exposes that message immediately.

Keep the announcement independently removable in the header group. Do not force a second ticker at the footer. Multiple moving regions competing on the same screen should be avoided.

## H-03: Desktop navigation

Top-level items that navigate and expand must have separate, understandable hit areas: a link for the destination and a disclosure control for children. Keyboard and touch users must not have to reproduce hover.

| Menu form | Suitable use | Content contract |
|---|---|---|
| Simple dropdown | A few categories | Links from a Shopify menu |
| Mega menu | Several related groups | Link columns plus up to two optional campaign cards |
| Direct links | Small catalog, Rush-like simplicity | Bounded row that switches to drawer before overflow |

Open on explicit click/keyboard; pointer hover enhancement can be added with a short intent delay. Leaving the trigger should not close the panel while the pointer moves into it. Escape closes the active panel and returns focus. Use semantic navigation/disclosure behavior rather than applying application-menu roles indiscriminately.

Empty child menus degrade to normal links. Long translated labels wrap or trigger the compact layout without overlapping the logo. Promotional images have appropriate aspect ratios and cannot push navigation beyond the viewport.

## H-04: Mobile navigation

Use an edge drawer or full-width panel according to viewport. The first view includes clear category links, search access, account link if configured, and optional campaign tile. A nested level has a named Back control and the parent label; do not show a dense desktop mega menu compressed into columns.

The drawer scrolls independently, uses dynamic viewport sizing and safe-area padding, and keeps its close button reachable. Returning to a parent preserves the prior list position. Switching orientation or changing to desktop closes/reconciles the drawer rather than leaving body scroll locked.

Collapsed menus still expose useful navigation if enhancement fails. Active-page and expanded states are separate concepts.

## H-05: Shared overlay controller

Major overlays are menu, search, quick add, size guide, cart, and filters. Permit only one major overlay at a time unless a deliberately designed child dialog is necessary. Version one should avoid nested dialogs.

Contract:

1. Remember the initiating control and current scroll position.
2. Open the target, make the background noninteractive, and move focus to an appropriate labelled element.
3. Keep keyboard focus inside a modal while allowing the panel itself to scroll.
4. Close on the explicit close control and Escape. Backdrop click may close informational panels; it must not trigger accidental navigation.
5. Return focus to the original control if it still exists; otherwise use a documented nearby fallback.
6. Restore scrolling and previous inline styles even if the component is removed or replaced.
7. Interrupt opening/closing animation safely. Rapid repeated clicks cannot strand an invisible modal over the page.

Do not stack independently implemented scroll locks. App dialogs need integration testing because the theme does not control their internals.

## H-06: Predictive search

Search is a deliberate improvement over references where visible search is limited. It is included in both desktop and mobile layouts.

| State | UI |
|---|---|
| Empty | Labelled input plus merchant-selected suggested collections |
| Typing | Keep text responsive; short debounce before lookup |
| Loading | Small status indicator, no jumping panel height |
| Results | Product image/title/price, optional collections/pages, View all results |
| No results | Repeat the query safely; offer clear query/reset action |
| Failure | Keep input; offer ordinary search submission |

Use Shopify-rendered result markup and locale-aware endpoints. Cancel or disregard earlier requests when a newer query exists. Search submission remains a real search form. Arrow-key navigation, Enter, Escape, accessible expanded state, and status announcements must be tested together.

Do not claim a suggested category is a trending search unless analytics actually supplies that fact. Query text must be escaped/rendered safely, never interpolated as trusted HTML.

Shopify's [predictive search object](https://shopify.dev/docs/api/liquid/objects/predictive_search) documents its rendering context. The layout, concurrency policy, and empty states here are our proposed behavior.

## Settings surface

| Group | Settings |
|---|---|
| Identity | Normal/alternate logo, bounded logo width, accessible shop name |
| Navigation | Primary menu, optional secondary menu, layout, mega-menu mappings |
| Behavior | Sticky mode: off/always/reveal; eligible homepage overlay toggle |
| Appearance | Normal and overlay color schemes; separator option |
| Actions | Search; account visibility; cart; optional configured utility link |
| Announcement | Messages, links, static/ticker mode, movement preference |

Cart count comes from the cart. Navigation comes from chosen menus. Social/contact links remain hidden without destinations. A tracking icon requires a real tracking page or integration.

## Acceptance scenarios

- Open each panel using keyboard, pointer, and touch; close by close button/Escape and verify focus.
- Switch between panels while one is animating; no stuck backdrop or scroll lock.
- Scroll down/up slowly and rapidly; header never obscures focused elements.
- Use the longest supported logo/menu labels and a narrow desktop width.
- Open search on a phone, type with the keyboard visible, scroll results, dismiss keyboard, rotate.
- Repeat the editor lifecycle script while the header is selected and a panel is open.
- Test empty menus, zero cart items, translated labels, reduced motion, and JavaScript failure.

Do not accept the header based only on its top-of-homepage screenshot.
