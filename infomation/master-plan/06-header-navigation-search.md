# 06 — Header, menus, search, and the shared overlay

Each spec uses the same 12 headings. It refines and replaces earlier specs H-01 to H-06 in [../03-header-navigation-search.md](../03-header-navigation-search.md). Where the two disagree, this file wins. Artboards: canvas 02 and 03.

---

## N-01 Header (`nk-header`)

**Purpose.** Shows the brand and gives the fastest way into shopping on every page.

**Reference evidence.**
- Hype hides the header while scrolling down. Rush keeps it sticky (69px). W&R overlays it on the hero and then makes it solid.
- Header tap targets on the reference stores measure 22–30px.
- Detail in [02 §1](02-reference-synthesis-and-design.md).

**Behaviour.**
- Two desktop layouts: centred logo with split navigation, or left logo with inline navigation.
- An optional third layout, "menu button", for small catalogs (the CardNav pattern).
- Phone layout: [☰][search] · logo · [cart (count)]. The account icon moves into the drawer on phones.
- `<shopify-account>` renders when `shop.customer_accounts_enabled` is true (desktop header and drawer). Otherwise a link to `routes.account_url` renders, if customer accounts are used at all.

**States and transitions.**

| State | Enter | Exit | Visual |
|---|---|---|---|
| solid | default; interior templates | overlay-eligible first section | surface scheme |
| overlay | `header_overlay` setting on, and the first section in `index` declares `data-overlay-eligible` | scroll past hero bottom − header height (IO sentinel) or an overlay opens | transparent, alternate logo, scrim |
| sticky-visible | sticky = always, or reveal + upward intent | — | hairline shadow |
| sticky-hidden | reveal mode + ≥64px downward travel after passing 2× header height | upward travel ≥16px, focus enters header, overlay opens, mega menu open | `translateY(-100%)` |
| overlay-active | menu/search/cart open | close | forced solid |
| editor-inspect | header or block selected | deselect | visible, solid |

- Header height is measured with ResizeObserver and published as `--nk-header-h`. Nothing hardcodes the offset.
- Hysteresis prevents flicker.
- The header never hides while `:focus-within` is inside it.

**Data and merchant settings.**
- Logo, alternate logo (overlay), logo width (desktop/phone).
- Menu (`link_list`), layout, sticky mode (off/always/reveal), overlay on home (bool).
- Colour schemes (normal/overlay), separator line, utility link (url + label, hidden if empty).
- Blocks: `_menu-promo` (image, heading, link, attach-to-menu-item handle chosen from the menu).
- Cart count comes from `cart.item_count`, updated through `nk:cart:updated`.

**Responsive.**
- Phone layout below 990px, or earlier if the navigation overflows. A ResizeObserver compares nav width to the available space and switches to the compact layout before links collide.
- Logo width scales with a setting.
- Must work at 320px: the logo can shrink to 96px.

**Motion and reduced motion.**
- Hide/reveal: translate 200ms. Overlay → solid: colour transition 200ms.
- Reduced motion: instant state changes.

**Editor lifecycle.**
- `shopify:section:load` remounts and re-measures. `select` forces the visible solid state.
- Selecting a `_menu-promo` block opens the matching mega menu panel (desktop) or drawer level (phone preview).
- Unload disconnects observers.

**Errors and fallback.**
- No JavaScript: the header is static (not sticky), the menu is a `<details>` list, and search is a plain form link.
- A missing logo falls back to `shop.name` as text.

**Shared services.** overlay (forced solid), editor, cart events.

**Code.**
- `sections/header.liquid`, `sections/header-group.json`
- `snippets/header-actions.liquid`, `blocks/_menu-promo.liquid`
- `src/components/header/header.ts`, `styles/components/header.css`

**Acceptance.**
- Overlay header text is ≥4.5:1 on the actual hero image (manual check with real media).
- Reveal mode never hides a focused element. Tested with a keyboard Tab sequence while scrolling.
- Longest translated menu label plus a landscape logo at 1024px switches to compact before overlap.
- Editor: change logo, layout and sticky mode in quick succession with the drawer open → no stale observers (listener count unchanged).
- Cart count updates after an add from any source.

---

## N-02 Announcement bar

Specified with `nk-marquee` (T2) in [05 §3](05-component-rewrite-matrix.md#3-native-target-specifications).

**Header-group specifics.**
- Static text is the default (P0).
- Each message is a block: text, optional link, and an optional schedule (date fields; Liquid hides expired messages).
- Up to 6 messages.
- Its colour scheme is independent of the header.

**Acceptance.**
- The pause button works with the keyboard.
- With reduced motion, the static message and step buttons are reachable.
- Selecting message 4 in the editor shows message 4.

---

## N-03 Desktop navigation: dropdown and mega menu (`nk-mega-menu`)

**Purpose.** Lets shoppers scan categories and campaigns without leaving the page.

**Evidence.**
- W&R's Shop/Collections parent links navigated instead of opening, so its menu structure couldn't be inspected.
- Hype shows dropdown indicators.

**Behaviour.**
- A top-level item with children renders a link (destination) plus a separate `<button aria-expanded aria-controls>` disclosure (▾).
- Panel content is chosen automatically:
  - children have grandchildren → columns (mega)
  - otherwise → simple dropdown
- Up to 2 promo cards per item.
- Opening:
  - click or Enter/Space on the button
  - hover after a 150ms intent delay, pointer-fine devices only
  - pointer leave closes after 250ms unless the pointer enters the panel
- Esc closes and returns focus to the button.
- Only one panel open at a time.
- Not modal: the page stays scrollable, and the panel closes on scroll beyond 120px.

**States.**
- closed → opening → open → closing.
- Rapid toggles resolve to the latest state. Animations are cancellable.

**Data and settings.**
- Menu levels 1–3, promo blocks, the "mega threshold" rule above.
- No raw handles.
- **Panel style (from navbar2/navbatmain examples):**
  - **Attached** (default): a full-width panel under the header.
  - **Floating**: one rounded/square card panel that *morphs* between top-level items. It repositions and resizes with FLIP over 240ms, with no spring overshoot. The promo cards show image, title and a short description.
  - The example's hover-only `<p>` triggers are replaced by the link + disclosure-button pair described above.

**Responsive.** Desktop ≥990px only. Below that, the drawer takes over.

**Motion.**
- Panel opacity + 8px translate, 240ms. Item stagger ≤6 items × 40ms when Motion = Standard.
- Floating style: moving between items morphs the panel instead of closing and reopening it.
- Reduced motion: instant.

**Editor.**
- Promo block select opens its panel. Deselect closes it.
- Section reload keeps the closed state.

**Errors.**
- No JavaScript: the parent link navigates.
- Empty child menu renders a plain link with no button.

**Services.** editor, motion (non-modal, so no overlay lock).

**Code.**
- `snippets/nav-desktop.liquid`
- `src/components/mega-menu/mega-menu.ts`, `styles/components/mega-menu.css`

**Acceptance.**
- Keyboard: Tab reaches the link then its button; Enter opens; Tab moves into the panel; Esc returns focus.
- Screen reader announces expanded/collapsed.
- Hover-intent never opens on touch.
- Two panels never open at once.
- A promo image never pushes the panel taller than the viewport minus the header.

---

## N-04 Mobile navigation drawer (`nk-nav-drawer`)

**Purpose.** A complete, comfortable phone menu.

**Evidence.**
- Hype: left drawer with inline accordions.
- Rush: flat list of 9 links about 20px tall, no `aria-expanded`, no scroll lock.
- CardNav example (cardnav.md): good accessibility contract; StaggeredMenu example (menu.md): numbered editorial style with weak accessibility.

**Behaviour.** Modal dialog from the left, full width up to 430px, then 400px wide. The first view contains, in order:
1. Search field (opens N-05)
2. Level-1 rows (≥52px)
3. Optional promo cards (2-up)
4. Account / help / market and language selector

Items with children open **level panels**: the panel slides in, gets a named "← Back" button and the parent title, and has a "Shop all [parent]" first row. This is a deliberate change from Hype's accordions: long lists stay short, and the context stays clear.

**States.** closed, open(level=1), open(level=2[parentId]), open(level=3…), closing. Back restores the previous level's scroll position and focuses the originating row.

**Data and settings.** Same menu as desktop (or an optional separate "mobile menu" `link_list`), promo blocks, show account / market / language.

**Drawer style** (from the menu.md / cardnav.md examples):
- **Standard:** rows as above.
- **Editorial:**
  - Large display-type items with automatic `01, 02…` numbering.
  - Up to 2 scheme-coloured layers slide in ahead of the panel.
  - Items rise in a ≤6-item stagger, and the toggle label swaps between Menu and Close.
  - Every Standard behaviour stays the same: levels, Back, focus, scroll lock.
- **Cards:** level-1 groups shown as cards with a label, an optional description (`_menu-group` block) and links.

**Responsive.**
- `height: 100dvh` with fallback to `100vh`.
- `padding-bottom: env(safe-area-inset-bottom)`.
- Closes on resize to ≥990px or on orientation change.

**Motion.**
- Panel translateX 280ms in / 200ms out; level slide 240ms; optional stagger.
- Editorial style: pre-layers offset 70ms, item rise 12px plus clip.
- Reduced motion: 120ms fade with no layers or stagger.

**Editor.**
- In design mode, selecting a promo block opens the drawer at the right level (phone preview only).
- Section reload closes the drawer and releases the lock (overlay service cleanup).

**Errors.** No JavaScript: the drawer button is a `<details>` toggle with nested `<details>` lists. Every link still works.

**Services.** overlay (modal, scroll lock, inert, focus), editor, motion.

**Code.**
- `snippets/nav-drawer.liquid`
- `src/components/nav-drawer/nav-drawer.ts`, `styles/components/nav-drawer.css`

**Acceptance.**
- Real iOS Safari and Android Chrome checks: open, go to level 2, Back, close. Page position is unchanged and the background did not scroll.
- Rotate while open: closes cleanly.
- Go to a page and press browser Back (bfcache): no stuck lock.
- VoiceOver announces "Menu, dialog" and the level titles.
- Rows ≥52px. Long labels wrap.

---

## N-05 Predictive search (`nk-predictive-search`)

**Purpose.** Find a product by name, colour or category quickly. This is where we improve most on the references.

**Behaviour.** The header search button opens a panel:
- Desktop: full-width strip under the header.
- Phone: full-screen dialog.

The panel contains a `<form action="{{ routes.search_url }}" role="search">` with a labelled input. Before anything is typed, it shows merchant-chosen collection chips.

When typing:
- Debounce 200ms; minimum 2 characters.
- Request `{{ routes.predictive_search_url }}?q=…&section_id=predictive-search&resources[type]=product,collection,query&resources[limit]=6&resources[options][unavailable_products]=last`.
- Results use the combobox pattern: input `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`; options are links.
- ↑/↓ move the active option, Enter opens it, Enter with no active option submits, Esc clears and then closes.

**States.**

| State | Trigger | UI |
|---|---|---|
| empty | open, or query <2 characters | suggestions |
| loading | request in flight | previous results dimmed, spinner in the field, `aria-busy` |
| results | 200 with results | product, collection and query groups; "View all results for 'q'" |
| no-results | 200, empty | escaped query, Clear, browse chips |
| error | network/timeout/5xx/417 | message + "Search 'q'" submit button + retry; input kept |
| rate-limited | 429 | as error; respect `Retry-After` |

Only the latest request (sequence key) may render. Earlier requests are aborted.

**Data and settings.**
- Suggested collections (`collection_list`), resource types to show, product image ratio.
- Predictive search can be disabled; it falls back to the plain form.
- Check `shopify-features` for predictiveSearch support, and fall back if it is missing.

**Responsive.**
- On phones the result list scrolls within the panel above the keyboard.
- `visualViewport` resize keeps the input visible.
- Input font-size 16px so iOS does not zoom.

**Motion.** Panel fade/slide 240ms; reduced motion instant. Results never animate per item.

**Editor.** The `predictive-search` section is a non-presentational render target (no presets). The header search settings live in the header section.

**Errors.** As in the states table. No JavaScript means plain search submission.

**Services.** overlay, request (sequencer), announce (result counts, polite), sections.

**Code.**
- `sections/predictive-search.liquid`, `snippets/search-form.liquid`
- `src/components/predictive-search/predictive-search.ts`
- `templates/search.json` with `sections/main-search.liquid` (uses N-07 filters + product grid)

**Acceptance.**
- On a slow network, type "lin", wait, then "linen": the "lin" results never replace "linen" results.
- Keyboard-only selection of a product works.
- VoiceOver/TalkBack announce "6 products".
- Phone: open, type, dismiss keyboard, scroll results, rotate, close; focus returns to the search button.
- `q=<script>` renders as text.

---

## N-06 Shared overlay manager (`services/overlay.ts`)

Panels managed: nav drawer, search, quick add, size guide, cart drawer, filter drawer, media zoom.

**Contract** (refines earlier H-05):
1. `open(panel, {trigger, modal: true})` closes any other open overlay first. It does not stack; there is no nested dialog in v1. The size guide, if opened from quick add, *replaces* the quick-add panel and returns to it on close (the service keeps a one-deep return path).
2. Saves `scrollY`. Locks scroll with `html.nk-locked` (`overflow:hidden`), falling back to a `position:fixed` body for iOS if S6 requires it. Sets `inert` on `#MainContent`, header-group and footer-group siblings.
3. Moves focus to `[data-autofocus]` or the panel heading. Sets `aria-modal` (or uses a `<dialog>` element if S6 confirms `showModal` behaviour on iOS is acceptable).
4. Esc, the close button and the backdrop (for non-form panels) all close it.
5. Close restores scroll position, removes inert, and returns focus to the trigger if it is still connected. Otherwise focus goes to the closest `[data-focus-fallback]`, or failing that `main`.
6. Interrupts: `open` during a close animation finishes the close immediately.
7. Self-healing: if the panel element disconnects (section reload), the service releases everything. The same happens on `pagehide`, breakpoint change for drawer-type panels, and `popstate`.
8. Emits `nk:overlay:opened/closed`.

**Acceptance.**
- Q-09: menu → search → cart in rapid sequence leaves exactly one overlay open, and closing it restores scroll and focus.
- 50 open/close cycles leave no inert residue and no extra listeners.
