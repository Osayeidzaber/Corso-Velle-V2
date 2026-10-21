# 12 — Phone usability, accessibility, motion, and performance

This file refines [../08-mobile-and-motion.md](../08-mobile-and-motion.md) and the budgets in [../09-quality-and-release.md](../09-quality-and-release.md). Each component spec (files 06–10) already carries its own phone, motion and editor rules. This file holds the **shared** rules those specs rely on.

## 1. Phone rules (apply to every component)

| Concern | Rule | Verified by |
|---|---|---|
| Narrow width | Layouts work from 320px. Pages never scroll horizontally. Rails and tables scroll only inside their own containers. | Playwright widths 320/360/375/390/414/430; `scrollWidth === clientWidth` assertion |
| Touch targets | Shopping controls ≥44×44. Option pills ≥52×48. Rows in menus/filters ≥52px tall. Nothing interactive below 24×24. | Automated bounding-box check on fixture pages |
| Viewport units | Full-height surfaces use `dvh`/`svh` with a `vh` fallback. The hero uses `svh` so the CTA isn't under browser chrome. | iOS Safari and Android Chrome devices |
| Safe areas | `viewport-fit=cover`. Sticky and fixed footers add `env(safe-area-inset-bottom)`. | iPhone with home indicator |
| Keyboard | Inputs are 16px (no iOS zoom). Search, filter price and cart note watch `visualViewport` and keep the focused field visible. The sticky buy bar hides while the keyboard is open. | Device script steps 3 and 7 |
| Rotation and resize | Overlays reconcile on `orientationchange` and on breakpoint change. Scroll locks are released. | Device script |
| bfcache and Back | On `pageshow` with `persisted`, cart count is refreshed (`/cart.js`) and no overlay stays open. | Device script |
| Gestures | Only native scrolling: scroll-snap for galleries and rails, with buttons as alternatives. No swipe is needed for any purchase step. No `touch-action:none` on large areas. | Gallery test |
| Hover | No essential action is hover-only. Quick add is always visible on touch (`@media (hover:none)`). | Emulated + device |
| Zoom | `user-scalable` is never disabled. 200% browser zoom and large OS text are tested. | Manual |
| Floating widgets | The optional contact link and third-party chat apps get `--nk-bottom-offset`. Sticky buy and cart footer raise it. Floating elements are hidden while an overlay is open. | Hype collision case |
| Slow networks | Previous content stays visible while updating. No full-screen loaders. Timeouts produce honest errors. | Throttled Playwright and devices on cellular |

## 2. Accessibility baseline (WCAG 2.2 AA target, D-22)

- **Semantics.** Landmarks: header, nav (labelled "Primary"/"Footer"), main, footer. Headings in order: one `h1` per page, and section headings follow the page structure. Every block exposes `heading_level`.
- **Patterns.**

  | UI | Pattern |
  |---|---|
  | Accordions | disclosure (`details`) |
  | Mega menu | disclosure navigation (not `role=menu`) |
  | Predictive search | combobox |
  | Drawers and quick add | dialog |
  | Recommendation tabs | tabs |
  | Hero slides | carousel (APG) |
  | Option groups | radio groups in `fieldset`/`legend` |
  | Quantity | number input + labelled buttons |

- **Focus.** Visible ring is 2px in the signal colour with a 2px offset, and is never removed. Focus is managed by the overlay service. After a section replace, focus returns to the same control via `data-focus-key`. Sticky header and bars never cover the focused element (`scroll-padding-top: var(--nk-header-h)` and `scroll-padding-bottom` while sticky bars are shown).
- **Status messages.** Cart add/update/error, filter result counts and search counts go through the `announce` service: polite, de-duplicated.
- **Colour.** Text contrast ≥4.5:1, large text and UI parts ≥3:1. Sold-out and unavailable states use strikethrough plus text plus `aria` (never colour alone). Swatches always carry a name.
- **Motion.** Moving content can be paused (WCAG 2.2.2). `prefers-reduced-motion` and the Motion setting are respected.
- **Images.** Product images use media alt text, falling back to the product title. Decorative campaign duplicates use `alt=""`. Merchants are told in setting info text to write alt text.
- **Forms.** Every input has a visible label. Errors are linked with `aria-describedby`. Required fields are marked.
- **Testing.** axe on fixture pages in CI. Manual keyboard runs of journeys Q-01 to Q-12. VoiceOver (iOS Safari) and TalkBack (Android Chrome) samples. NVDA with Firefox on desktop for the PDP and cart.

## 3. Performance

### Loading rules
- Liquid renders the LCP element: hero image or first product media. It gets `fetchpriority=high`, explicit width and height, and accurate `sizes`. `preload` is only used when the LCP image is in CSS (avoid).
- Images use `image_url` + `image_tag` with widths 180–3000 matched to their layout. Lazy below the fold. Cards have at most 2 `<img>` elements, and the secondary image is fetched on first hover or focus. Galleries render all thumbnails lazy and only the first main image eager.
- Video uses `preload="none"` and a poster. Only one plays at a time.
- JS: `nk-global` is loaded deferred with `type=module` and contains the core, services, header, drawer, cart drawer and disclosure. Page entries are product, collection/search and content. Rarely used features are dynamic imports: zoom, size guide, quick add (on first click or idle prefetch), and `expand-media`.
- CSS: tokens and base go in the layout. Page-group CSS is linked by template. No unused section CSS on pages without that section.
- Third parties: none in the theme. Apps are measured separately.

### Budgets (D-19; lab, production build, real content)
| Metric | Budget | Notes |
|---|---|---|
| Theme JS at startup, home/collection | ≤60 KB gzip | Includes shared chunks |
| Theme JS at startup, product | ≤90 KB gzip | |
| Per JS file | ≈10 KB compressed (Theme Check default) | Exceptions recorded in `.theme-check.yml` with a reason |
| Theme CSS per core page | ≤50 KB gzip | |
| Lighthouse mobile performance | Median ≥90 across 3 runs on home, collection, product | The Theme Store minimum is 60. Ours is stricter. |
| Lighthouse accessibility | ≥95, no serious/critical axe issues | |
| Field LCP / INP / CLS (p75) | ≤2.5 s / ≤200 ms / ≤0.1 | After launch, field data only. Never labelled from lab runs. |
| Main-thread work after a cart add | No long task >50 ms from theme code | Performance panel trace |

Measurement follows a fixed profile (Lighthouse version, throttling, device) recorded in the evidence bundle. Theme-owned and app costs are reported separately, and both are shown to the merchant.

## 4. Motion system

### Tokens (initial; tuned after device review in M3)
| Token | Value | Reduced motion / Motion=Minimal |
|---|---|---|
| `--nk-dur-instant` | 120 ms | same (colour/opacity only) |
| `--nk-dur-small` | 200 ms | opacity only |
| `--nk-dur-overlay` | 280 ms in / 200 ms out | 120 ms fade, no translate |
| `--nk-dur-reveal` | 380 ms (cut) / 300 ms (fade) | none |
| `--nk-stagger` | 40 ms, max 6 items | none |
| `--nk-ease-out` | cubic-bezier(.2,.7,.2,1) | — |
| `--nk-ease-in` | cubic-bezier(.4,0,1,1) | — |
| Marquee speed | 40 px/s | static |

These are **proposed** values, not taken from the reference stores (whose timings were not measured).

### Where motion is allowed
| Area | Allowed | Not allowed |
|---|---|---|
| Campaign/editorial sections | cut/fade reveal once; slide crossfade; marquee with pause | parallax, scroll-jacking, blur filters, cursor followers |
| Overlays | panel translate + backdrop fade | bounce/spring overshoot |
| Header | reveal translate; overlay → solid colour | per-pixel scroll-linked styles |
| Cards | secondary image crossfade (pointer fine) | entrance animations on grids |
| Purchase path (options, add, cart) | instant feedback, overlay transitions, line highlight | anything delaying a state change or a button |

### Engineering rules
Animate only transform, opacity and clip-path. Every animation goes through `motion.animate()`, which returns a cancellable handle that the owning component's `dispose` finishes. No rAF loop runs while idle. IntersectionObserver gates all in-view work. `Shopify.designMode` selection forces final states.

## 5. Real-device script (run in M2, M3 and M5)

Device examples: current iPhone with iOS Safari, previous iOS version, and a midrange Android (≈4 GB RAM) with Chrome. Record exact OS and browser versions and video.

1. Open home on cellular. Scroll before media finishes loading.
2. Open the menu, go to level 2, Back, close. The page position must be unchanged.
3. Search: type, dismiss the keyboard, reopen, rotate.
4. Collection: filter (draft, apply), sort, open a product, Back. URL, state and position must be restored.
5. Gallery: swipe while scrolling vertically, open and close zoom.
6. Choose colour and size, open the size guide, close. The selection must persist.
7. Add (test store), edit quantity rapidly, add a note with the keyboard open, remove, reach the empty state.
8. Checkout handoff in test mode, then Back to the store.
9. Repeat 2, 6 and 7 with large text, reduced motion, and VoiceOver or TalkBack.
10. Background the app for 1 minute, return, and press browser Back. No stuck overlay.

This is a plan; no device run has happened yet.
