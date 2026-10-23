# Scroll, Section Transitions & Brown Accent — Plan

Living document. Each chunk is implemented, tested and logged here before the next one starts.
Merchant-facing settings are documented in [CUSTOMIZATION.md](CUSTOMIZATION.md).

## Current continuation — 22 October 2026

The working tree already contains partial work; preserve it and verify rather than reset it.
User clarified that **Riviera nights is a component of this storefront**, not an external site.
`theme/templates/index.json` identifies the reference as the `expand-media` campaign section.
Study its sticky stage, inset-to-full-bleed image, staged title/overlay and scrubbed progress.
The reference notes below reflect this clarification.

Implementation order for this continuation (one chunk at a time):
1. Verify existing brown tokens/settings and baseline tests. Keep native scroll; no dependency changes.
2. Fix shared lifecycle/refresh, fast-scroll reveal completion, grid/hover ownership, mobile campaign
   expansion and reduced-motion/breakpoint changes. Test policy and component lifecycle.
3. Add a lazy scoped scene component to media-with-text, with reversible scroll-linked image/copy,
   optional short desktop pin, direction/intensity/background wash; hero receives a subtle scroll
   exit on its copy only. Avoid nested animations claiming the same elements. Expose useful section
   controls; campaign gets an enable switch. Global tempo/stagger controls must actually be consumed.
4. Validate JSON/Liquid/TS/build and browser desktop/phone/resize/reverse/fast/reduced-motion,
   commerce interactions where available. Record actual evidence and limitations, not assumed passes.

Affected files: `src/motion/gsap.ts`, motion/reveal/text/expand components, `src/core/motion.ts`,
global entry, editorial/hero/expand Liquid schemas, shared motion snippets, customization docs,
regression tests and Vite-generated owned assets. No `CUSTOMIZATION_PLAN.md` exists at inspection.
Risks: sticky/pin geometry, editor reconnects during async imports, long pages hiding shopping items,
late image layout shifts, and pre-existing concurrent carousel edits. Avoid rewriting carousel internals.

## Reference: "Riviera Nights"

The reference is the local homepage campaign, `expand` in `theme/templates/index.json`, titled
**Riviera nights**. Its implementation is `src/components/expand-media/expand-media.ts` and the
corresponding Liquid/CSS. Browser inspection confirmed the inset video card and large italic title.
The 220svh desktop track holds a 100svh sticky stage; the scrubbed proxy opens the frame, then
trades the title for overlay copy and a shopping link. The transition finishes at 75% of the track.
We carry its layered progression into editorial sections with a much shorter, reversible entrance.
No external website behavior or implementation is claimed.

## Current state (inspected)

### Scrolling
- Native scrolling only, plus `html { scroll-behavior: smooth }` (disabled under reduced motion).
  There is no smooth-scroll library, so there are no competing scroll systems.
- **Decision: keep native scrolling and do not add Lenis.** Wheel, trackpad, keyboard, touch,
  anchors and `scrollTo` all behave natively. Smoothing layers add input latency and fight
  ScrollTrigger pinning, sticky header logic and the reveal footer. "Smoothness" comes from
  scrubbed, eased timelines (`scrub: <seconds>`) instead.

### GSAP / ScrollTrigger
- `src/motion/gsap.ts` registers ScrollTrigger and SplitText, and refreshes on body-height change
  (ResizeObserver, debounced 120ms), section events, fonts and load. This is good and stays the
  single refresh authority.
- `nk-reveal` (headings/blocks) and `nk-stagger` (grids) use **one-shot, fixed-duration tweens**
  (`once: true`). Nothing is scroll-linked, nothing reverses, and there are no section exits.
  Sections therefore "pop": the effect is over before the section has settled, which is what reads
  as abrupt and unfinished.
- `nk-parallax` (hero, media-text, collection banner) is scrubbed. It runs on phones too.
- `nk-expand-media` is already a proper scene: a sticky stage with a scrubbed progress proxy.
- Lifecycle: every component uses `gsap.context` scoped to the element and reverts on disconnect
  (NkElement `unmount`). Editor reloads remount components, so no leaks were found in the code.
- **Real duplication bug (fixed during the hover work):** `nk-global.js` was loaded twice (a `?v=`
  URL from the page and a bare URL from lazy chunks), so every global listener and module ran twice.
  Entries are now content-hashed and loaded by bare URL.

### Colour
- The blue accent comes from colour **scheme 1 accent `#1F3A5C`** (navy: button fill, links role,
  focus ring), the **whole navy scheme 3** (`#14213D` background, `#1F3A5C` surface; used by the
  message band, expand-media and a header-group section), the schema default `#2338E0`, and the
  `base.css` fallback `--nk-focus: #2338e0`.
- Footer brown (from `footer-group.json` and the `footer.css` defaults): **`#432d23`** background,
  **`#d7ae83`** copper accent, `#f5ecdf` ink.
- Left alone on purpose: `swatch-color.liquid` maps product colour names ("navy", "blue") to
  swatches. That is product data, not branding.

## Design direction

One motion language with three intensities:

| Section type | Behaviour |
|---|---|
| Hero | Headline split reveal on load (existing). Scrubbed **exit**: media eases to scale 1.06 while copy drifts up and fades as the hero leaves. |
| Editorial (media-text, collection banner) | **Cinematic scene**: image unmasks (clip-path) and settles from scale 1.12 to 1 tied to scroll; text layers in after the image. Optional short desktop pin. |
| Campaign (expand-media) | Existing pinned scene; keep. Simplified on phones. |
| Bands (message band, image strip) | Background colour transition between neighbouring sections; marquee unchanged. |
| Shopping (product grids, tabs, recommendations, category cards) | Fast progressive reveal: small rise, short stagger, never blocks clicks. No pin, no scrub. |

Principles: transform/opacity/clip-path only. Content is visible without JS, under reduced motion
and in the theme editor. Scrubbed scenes are reversible by construction. No scroll-jacking.
Pinning only on desktop, at most +60% of a viewport, opt-in.

## Chunks

1. **Global brown colour system.** Derived accent tokens (`--nk-accent-hover`, `-active`,
   `-subtle`, `-border`, `-selected`, `--nk-focus`) from each scheme's accent via `color-mix`.
   Scheme 1 accent and the schema default become footer brown. Navy scheme 3 becomes a
   footer-brown scheme. Tailwind tokens and the `base.css` fallback follow.
2. **Scroll foundation.** One `motion/scroll.ts` module: ScrollTrigger config (ignore mobile
   resize), `gsap.matchMedia` breakpoints for desktop, mobile and reduced motion, header-offset
   aware starts, and global motion settings (speed, stagger, mobile mode, scroll effects) from
   `nk-config`.
3. **Section scenes and presets.** `<nk-scene>` wraps a section and applies a merchant-chosen
   preset (`none`, `subtle`, `cinematic`) with direction, parallax, pin and background-transition
   options. Rendered by one snippet so every section uses the same attributes. Tuned `nk-stagger`
   and `nk-reveal` presets.
4. **Mobile, performance, docs, verification.** Simplified phone behaviour (no pin, no parallax,
   shorter reveals), reduced motion, `CUSTOMIZATION.md`, and a full browser pass.

## Testing requirements (each chunk)
- `npm run typecheck`, `npm test`, `npm run build`, `npm run check:json`, `npm run check:theme`.
- Browser on the dev store: desktop 1280, tablet 768, phone 375; scroll slowly, quickly, up and
  down; resize mid-scene; reduced motion; theme editor safe (static final state).
- Product cards (hover/video), carousels, size picker, header, footer and cart still work.

## Progress log

### Cross-page follow-up — 22 October 2026 (completed)
Request: make the shared experience work throughout the storefront, especially collections and
products. The global entry loads in `theme.liquid`; collection/search grids already use `nk-stagger`,
collection banners use shared headings/parallax, and products use shared typography plus lazy
recommendation grids. Purchase controls and gallery scroll remain native and unpinned.

Chunk A: remove competing collection-filter/layout animations (separate WAAPI image scale and
long delayed wrapper animations overlapped the shared GSAP reveal). Give grid interactions a
bounded wrapper-only transition and finish pending reveals before layout changes. Guard product
recommendation responses against stale editor connections. Refresh measurements after BFCache restore.
Chunk B: run regression checks and browser-test collection sorting/layout, restored navigation,
rapid/reverse scroll, product gallery/options/recommendations, desktop and phone. Audit other page
templates for shared runtime coverage. Document precise coverage and any standalone-page exceptions.

Results:
- Removed the duplicate post-filter animation in facets; the new grid's `nk-stagger` owns that
  entrance. Search now also wraps results in `nk-stagger`, including mixed product/article results.
- Direct column-layout changes finish pending grid reveals, animate only visible wrappers, cap
  stagger at 180ms and never touch hover-owned images. Pending WAAPI transitions are cancelled.
- Browser Back/Forward result restoration no longer calls `scrollIntoView`; explicit filter/sort
  actions retain their useful grid navigation. BFCache `pageshow` refreshes shared measurements.
- Product recommendations reject responses from prior element connections before replacing any
  content, then announce current results to the global lazy loader and refresh authority.
- Browser collection checks: 1280px desktop sort low-to-high, 4-column switch, page 2 (10 products),
  browser Back, fast and reverse scrolling. At 390px no horizontal overflow or hidden passed cards.
- Browser product checks: 390px gallery Next moved to 2/11; size M updated variant URL; four lazy
  recommendations loaded. Desktop resize and reverse scrolling left no visible cards hidden and
  no horizontal overflow. Search `q=shirt` rendered 21 shared reveal cards and passed a fast scroll
  to the footer. Console checks on product and collection returned no errors. Cart untouched.
- Final checks: **87 unit tests in 19 files**, TypeScript and production Vite build pass. JSON and
  Shopify Theme Check pass (76 files, no offenses). New regression tests cover column motion
  ownership, stale recommendation responses and history scroll preservation.
- Changed: `src/components/facets/facets.ts`, `motion/stagger.ts`,
  `recommendations/recommendations.ts`, `src/motion/gsap.ts`, `theme/sections/search.liquid`,
  `tests/unit/facets-motion.test.ts`, `recommendations-motion.test.ts`, `sort-menu.test.ts`, docs
  and generated owned assets. Evidence: `docs/evidence/scroll-collection-desktop.png`.
- Scope audit: every JSON storefront template uses the shared theme layout/global entry. Existing
  heading, parallax, reveal and scene components work wherever their sections are placed; content,
  blog/article, list-collections, cart and 404 pages retain native scrolling without forced scenes.
  Password layout also loads the global entry. Standalone gift-card intentionally stays native/CSS
  only. Shopify-hosted checkout/account surfaces are outside this theme's scroll control.
- Physical-device Safari and live Theme Editor QA remain as previously documented; this pass does
  not claim to have visited every individual product or collection URL.

### Continuation chunks 1–2: palette verified; foundation implemented
- Confirmed footer settings and CSS both use `#432D23`. Existing scheme tokens, selected carousel
  sizes and active indicators already use the brown family. Product blue/navy swatches stay intact.
- Baseline and post-foundation TypeScript + 75 unit tests pass (bundled Node used because the
  shell's Nodist shim is misconfigured).
- Fixed `motionMatch`: an always-matching condition is required for desktop initialization.
- Batched meaningful image-load refreshes and absorbed pin-spacer height changes into refresh baseline.
- Shopping reveals now rise only 16px, finish on viewport exit/focus, cap total stagger at 180ms,
  and never animate images owned by hover effects. Text/reveal consume tempo/stagger and finish on exit.
- Campaign starts safely in its final frame; phone/simple modes use a short static layout;
  desktop uses scoped matchMedia and faster scrub catch-up. Native scroll remains the only system.

### Continuation chunk 3: coordinated scenes and merchant controls implemented
- `nk-scene` is lazy, observes a 400px approach margin, owns its GSAP media contexts, reverts before
  rebuilding after real viewport resize, and leaves all content visible if JS is unavailable.
- Media-with-text now coordinates image clip/scale and copy rather than layering competing reveals.
  Cinematic progress completes between 90% and 25% viewport entry and reverses naturally; optional
  desktop hold is capped at 240px and skipped for tall sections. Subtle/mobile scenes are one-shot.
- Hero copy receives a gentle reversible exit, independent of its media and text entrance systems.
- Added scene preset/off, direction, intensity, drift, wash and hold controls; campaign enable switch;
  hero exit switch. Updated `CUSTOMIZATION.md`. Existing global motion controls now affect entrances.
- 80 unit tests and TypeScript pass; Theme Check inspected 76 files with no offenses. First Vite
  build succeeded but found a pre-existing malformed hero CSS comment (`*/` inside its prose),
  now repaired. Final build and live preview checks follow in chunk 4.

### Chunk 1: brown colour system (done)
- `theme/config/settings_data.json` (live settings and the "Riviera" preset): scheme 1 accent
  `#1F3A5C` becomes footer brown `#432D23` (text on accent `#F5ECDF`, the footer ink). Navy
  scheme 3 becomes a footer-brown scheme: background `#432D23`, surface `#523A2E`, text `#F5ECDF`,
  muted `#CDB9A5`, line `#5E4537`, accent copper `#D7AE83`. The "Quiet" preset was already brown.
- `theme/config/settings_schema.json`: accent default `#432D23`, text-on-accent default `#F5ECDF`,
  and help text.
- `theme/snippets/css-variables.liquid`: per-scheme derived tokens `--nk-accent-hover`,
  `-active`, `-subtle`, `-selected`, `-border`, `-muted`, and `--nk-focus`, all from the scheme
  accent via `color-mix`.
- `src/styles/base.css`: fallback focus is brown. `src/styles/tailwind.css`: `accent-hover`,
  `accent-active`, `accent-subtle`, `accent-selected` and `accent-border` utilities.
- `src/styles/product.css`: size selector underline uses the accent. `riviera.css`: pressed
  buttons use `--nk-accent-active`.
- Verified on the dev store: the root accent and focus are `#432D23` and the button fill is
  `rgb(67,45,35)`. Announcement bar, message band and expand-media are on the brown scheme. A scan
  of computed colours found no blue on the homepage.
- Continuation audit: carousel active-slide bar and selected sizes now use the accent tokens.
  Browser selection confirmed the selected size background is `rgb(67, 45, 35)`.
- Contrast: `#F5ECDF` on `#432D23` is about 11:1, `#CDB9A5` on `#432D23` about 6:1 and `#D7AE83`
  on `#432D23` about 6:1, all AA or better.

### Continuation chunk 4: integration and verification completed

- Final TypeScript check: pass. Unit suite: **84 tests in 17 files pass**. Vite production build:
  pass without warnings; 27 owned assets synchronized and hashed imports regenerated.
- Strict JSON: pass. Shopify Theme Check: **76 files, zero offenses** (includes Liquid/schema checks).
- Browser, local Shopify preview: desktop 1280×720, phone 390×844 and tablet 768×1024. No horizontal
  overflow at those sizes. Desktop editorial copy progressed from opacity .15 through .5124 to 1;
  reverse scroll returned it to .5124. Phone resize reverted scroll scenes and campaign became
  static with stage and track both 820px (no residual scroll runway). Returning to tablet restored
  the desktop campaign. Native keyboard Home/Ctrl+End, rapid full-page passes and smaller scroll
  steps worked. At the footer, no passed product cards remained opacity 0.
- Commerce: carousel pause/size selection, selected brown state, enabled purchase button, product
  page M selection/variant URL, cart drawer open/close and released scroll lock verified. Existing
  three-item cart untouched. Browser console reported no errors on the final homepage pass.
- Fixed another campaign discontinuity: overlay was visibility-hidden until 95% progress, masking
  most of its opacity ramp. It now paints from 68%, while `inert` keeps links out of focus until
  90%. Regression test also caught and resolved child availability during dynamic initialization.
- Blue-color audit across source CSS/TS, Liquid, JSON config/templates found only product swatches
  `#1D2939` / `#4B6B88` remaining; those represent actual navy/blue products and are preserved.
- Saved `docs/evidence/scroll-editorial-desktop.png` and `scroll-footer-brown.png`.

#### Files changed in this continuation

Runtime: `src/motion/gsap.ts`, `src/core/motion.ts`, `src/entries/global.ts`,
`src/components/motion/scene.ts`, `src/components/motion/stagger.ts`,
`src/components/reveal/reveal.ts`, `src/components/text/text.ts`,
`src/components/expand-media/expand-media.ts` and its CSS.
Styles: `src/styles/global.css`, `src/styles/components/scene.css`, `src/styles/components/hero.css`.
Liquid: `theme/sections/media-text.liquid`, `hero.liquid`, `expand-media.liquid`,
`theme/snippets/scene-attributes.liquid`.
Tests: `campaign-motion.test.ts`, `gsap-policy.test.ts`, `reduced-motion.test.ts`,
`motion-mode.test.ts` under `tests/unit/`.
Docs/evidence: this plan, `CUSTOMIZATION.md`, the two screenshots. Generated outputs:
`theme/assets/`, `theme/snippets/nk-assets.liquid`, `assets.owned.json`.
Existing color settings/token and carousel work was preserved and validated, not re-authored.

#### Intentional scope and remaining QA

No new scroll library/dependency, mandatory page snapping, global background interpolation or
pinning of shopping sections. Ordinary bands, grids, product UI and carousel gestures retain their
own interactions; background progression uses existing schemes and the optional editorial wash.
Hero scale/parallax remains owned by the existing hero media component, avoiding double transforms.
Reduced-motion changes, data-saver and editor safety are covered by unit tests; no OS preference
change or live Theme Editor drag/reorder session was performed in this browser. Physical iOS/Safari,
low-end hardware profiling and the optional merchant-enabled pin layout still need device/editor QA.
No production theme publish was performed. Local Shopify development preview reflects the changes.


### 23 October — carousel responsiveness follow-up

User reported slow carousel movement. Inspecting the editorial controller found up to 3.5s
waiting for all images, 1.5–2.2s entrances, slow spring settling, and a 900ms caption fade.
Bounded first-image wait to 600ms; shortened existing entrance presets, raised settling response
and connected the existing speed setting, shortened caption fade to 240ms. Manual navigation
now finishes pending entrances too, avoiding resets after loading. Kept interval, autoplay holds,
vertical page scrolling, gestures, photography and focus effects. Frame-loop fixtures verify startup,
early input, speed controls and stable scene placement when size details open/close. Source/build
changes are under src/components/carousel/, featured-collection schema and owned generated assets.
Live visual/device QA remains pending because browser preview acquisition was blocked this turn.

### 23 October — final completion check

- Re-ran TypeScript validation: pass.
- Full Vitest suite: **25 files, 115 tests passed**, including carousel responsiveness and motion policy/lifecycle regressions. The three carousel failures noted in the earlier handoff are resolved in the current source.
- Production Vite build and owned asset synchronization: pass (28 output files).
- Strict theme JSON and all five source contract tests: pass.
- Regenerated the stale customization schema reference in CUSTOMIZATION.md; reference check now passes.
- Shopify Theme Check: **84 files, zero offenses**.
- Fresh local preview: brown accent resolves to #432D23; desktop and 390px phone have no horizontal overflow. Phone campaign is static with equal 820px stage/track, desktop parallax restores after resize. Keyboard navigation reaches the footer and reverse scrolling works; passed product reveal wrappers are not left at zero opacity. Browser error log was empty on this check. Footer appearance was visually inspected.
- Earlier recorded scene progression/reversal evidence remains above. Physical iOS/Safari, low-end device profiling and a live Theme Editor drag/reorder session are external QA limitations, not automated passes.
- Implementation and generated theme assets are ready for review. No production publish or Git commit was performed.


### Superseding fast curved-carousel direction — 23 October
The user replaced inline carousel purchasing with the supplied curved FlexCarousel and explicitly
requested fast motion, then a longer central run showing about four products before the curve.
Featured collection now uses viewport-wide OGL lens rendering, brown center emphasis, rapid
entrances/navigation, autoplay and direct product links only. Existing native rail styles, touch/
reduced-motion fallback and scoped cleanup remain. Products before the curve is merchant editable
(3–6, default 4); default interval is 1.5s. Keep this direction over the earlier straight-strip and
inline-size-preview notes. Product-page measurement work is unaffected. Browser comparison of the
latest composition remains pending; unit/math/build/Liquid checks are recorded in PRODUCT_PAGE_PLAN.


### Continuous flow finalized — 23 October
Latest feedback replaces stopped center dwell with continuous editorial travel. Velocity eases in,
passes products without snapping/waiting, and uses autoplay pace plus speed as travel controls.
Passive mouse hover no longer pauses the lens. Explicit pause, dragging and keyboard intent still
hold it; manual interaction resumes after a short grace and settling. Pointer/keyboard intent is
tracked even when focus remains on the same stage, avoiding stale focus holds; explicit Play also
resumes from a keyboard-focused button. Underline follows the nearest product with no countdown.
Curved lens, extended center and direct links are unchanged. Native rails retain their own hover
behavior. Frame-loop tests cover repeated movement during hover, persistent pause/resume, drag
release and keyboard-to-pointer switching. Final focused checks: 34 tests / 4 files, TypeScript,
Vite build/28 owned assets, strict JSON and customization-reference check pass. Earlier full suite:
130 tests / 27 files passed; latest input-intent regression is included in the focused result.
Theme Check last completed with zero errors and two retained legacy-snippet warnings. Live visual
comparison remains a user-preview check; no new visual verification is claimed.
