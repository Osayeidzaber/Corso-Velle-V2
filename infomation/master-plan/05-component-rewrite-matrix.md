# 05 — Example components: inventory and framework-to-native rewrite matrix

Revision 2 (21 Oct 2026, 23:30). This revision is based on the **actual contents** of the 23 files in `example componenets/`. When this package was first written, all 23 files were 0 bytes. The owner filled them at 23:23–23:24, and every file was then read in full. Revision 1 relied on guessed public candidates. Where a guess was wrong, the correction is noted in field 2.

## 0. What the files contain, and the rules for the rewrite

| Kind of content | Files |
|---|---|
| **Full component source** (React + CSS) | Split Text, Shiny Text, Gradient Text, Scroll Velocity, Animated Content, Scroll Expand, foldtext (FoldText), menu (StaggeredMenu), cardnav (CardNav), navbatmain (Aceternity Navbar Menu internals) |
| **Usage demo only**: imports a library component, so its source is *not* supplied | discolsure, infiniteslider, tabswithtransctition, progresivebasicblur, textloading, textpercharacter (motion-primitives); letterswap, elasticline (Fancy); marquee (Magic UI); navbar2 (Aceternity demo); gooeyinput (unknown library, `@/components/ui/gooey-input`) |
| **Complete demo, technique only** | stickeyfootor (Fancy sticky-footer demo, CSS only) |
| **Documentation page, not code** | bubble (shadcn/ui "Bubble" chat-message docs. It is *not* a menu, which corrects revision 1) |

**Provenance evidence from the files themselves:**
- Scroll Velocity's demo uses the text `'React Bits'`.
- StaggeredMenu's default logo is `/src/assets/logos/reactbits-gh-white.svg`.
- CardNav, Split Text, Shiny Text, Gradient Text and Animated Content match React Bits' current props exactly.
- Scroll Expand and FoldText share the same authoring pattern (`'use client'`, co-located CSS, clamped props), but their provenance is **unconfirmed**. Treat them as React Bits-licensed until proven otherwise.
- Import paths identify motion-primitives (`@/components/core/*`), Fancy (`@/components/fancy/*`), Magic UI (`@/registry/magicui/*`) and Aceternity (`../ui/navbar-menu`, plus `next/link`, `next/image` and `framer-motion`).
- **None of the files carries a licence header.**

**Rules that apply to every rewrite.** Implementation is **clean-room**. Developers work from the behaviour specs in §3 and §4, not from the pasted code.
- This is mandatory for React Bits code: its licence is MIT + Commons Clause, which forbids redistributing it "as a ported version".
- It is also mandatory for Aceternity code: its licence forbids use in themes and templates.
- Unconfirmed files (Scroll Expand, FoldText) get the same treatment.
- MIT sources (motion-primitives, Fancy, Magic UI, shadcn/ui) may be consulted. Where any expression is reused, add the notice to `docs/LICENSES/`.
- No candidate dependency enters the theme: no React, Next, motion/framer-motion or @hugeicons (D-04). GSAP (+ SplitText/ScrollTrigger) and Tailwind v4 were adopted later at the owner's request; see D-06 (superseded).

## 1. Summary

| # | File | Actual source (evidence) | Disposition | Native target | Tier |
|---|---|---|---|---|---|
| 1 | Split Text | React Bits SplitText, full source (GSAP + SplitText + ScrollTrigger) | **Adapt**: words/lines only | `nk-reveal mode="split"` | P2 (P1 ships `cut`) |
| 2 | Shiny Text | React Bits ShinyText, full source (rAF + canvas colour parse) | **Defer** | CSS `.nk-text--shine` | P2 |
| 3 | Gradient Text | React Bits GradientText, full source (rAF gradient, pointer follow) | **Reject (v1)** | — | — |
| 4 | Scroll Velocity | React Bits ScrollVelocity, full source (motion/react; drag + fling) | **Adapt as option** (no drag) | `nk-marquee speed-mode="scroll"` | P2 |
| 5 | Animated Content | React Bits AnimatedContent, full source (GSAP ScrollTrigger; wipes) | **Adapt** | `nk-reveal mode="fade\|cut\|wipe"` | P1 |
| 6 | Scroll Expand | Full source, provenance unconfirmed; React only, passive scroll + rAF smoothing | **Adapt (P2, first post-launch candidate)** | `nk-expand-media` section | P2 |
| 7 | bubble | shadcn/ui Bubble **chat-message docs** (no source) | **Reject** | — | — |
| 8 | cardnav | React Bits CardNav, full source (rAF spring, glass, Esc + focus return) | **Adapt (pattern)** | `nk-nav-drawer` card level-1 + optional "menu button" header layout | P0 a11y / P1 layout |
| 9 | discolsure | motion-primitives Disclosure, demo only | **Adopt pattern** via `<details>` | `nk-disclosure` | P0 |
| 10 | elasticline | Fancy ElasticLine, demo only | **Reject** | — | — |
| 11 | foldtext | FoldText, full source, provenance unconfirmed (GSAP; paper/blinds/flip 3D folds) | **Merge/Defer** | `nk-reveal mode="fold"` (lines/words, no hover refold) | P2 |
| 12 | gooeyinput | Demo only; library unidentified (Aceternity has a matching component) | **Reject** | — (search = `nk-predictive-search`) | — |
| 13 | infiniteslider | motion-primitives InfiniteSlider, demo only (images, `speedOnHover`) | **Merge** | `nk-marquee` items mode | P1 |
| 14 | letterswap | Fancy LetterSwapForward/PingPong, demo only | **Defer (CSS-only)** | `.nk-link--swap` | P2 |
| 15 | marquee | Magic UI Marquee, demo only (**vertical two-column review-card wall**) | **Adapt** | `nk-marquee` (horizontal ticker P1; vertical testimonial wall P2, real reviews only) | P1 / P2 |
| 16 | menu | React Bits StaggeredMenu, full source | **Adapt (pattern)** | `nk-nav-drawer` style "Editorial" (numbered large items, layered panel) | P1 |
| 17 | navbar2 | Aceternity Navbar Menu demo (floating pill nav, hover dropdowns with product cards) | **Adapt (pattern)** | `nk-mega-menu` panel style "Floating" | P1 |
| 18 | navbatmain | Aceternity Navbar Menu source (`MenuItem`, `Menu`, `ProductItem`, `HoveredLink`) | **Adapt (pattern)**, merged with #17 | `nk-mega-menu` | P1 |
| 19 | progresivebasicblur | motion-primitives ProgressiveBlur demo (caption over artwork, `blurIntensity=6`) | **Defer** | `--nk-scrim: blur` option on media captions | P2 |
| 20 | stickeyfootor | Fancy sticky-footer demo (CSS reveal footer) | **Reject (v1)** | — | P2 candidate |
| 21 | tabswithtransctition | motion-primitives TransitionPanel demo (3 buttons + blur/slide panels) | **Adapt** | `nk-tabs` | P1 |
| 22 | textloading | motion-primitives **TextShimmerWave** demo ("Generating code...") | **Reject** | static status text | — |
| 23 | textpercharacter | motion-primitives TextEffect `per='char' preset='fade'` demo | **Merge/Defer** | `nk-reveal split by="char"` (≤24 chars) | P2 |

**Result:** 13 adapted, adopted or merged; 6 rejected; 4 deferred. All of them are consolidated into **6 native targets** plus CSS styles:
- `nk-reveal`
- `nk-marquee`
- `nk-disclosure`
- `nk-tabs`
- `nk-expand-media`
- the header/navigation set: `nk-header`, `nk-nav-drawer`, `nk-mega-menu`

**Corrections to revision 1:**
- **bubble** is a chat bubble, not BubbleMenu.
- **navbar2 / navbatmain** are Aceternity's hover Navbar Menu, so they are now Adapt instead of blocked.
- **menu** is confirmed as StaggeredMenu, so it is now Adapt.
- **textloading** is TextShimmerWave, not TextShimmer.
- **foldtext** has real source, so it is now Merge/Defer instead of Reject.
- **Scroll Expand** source shows passive scrolling with no scroll-jacking, so it is upgraded.
- **marquee** demo is a vertical testimonial wall.

## 2. Why an effect earns a place (unchanged)

An effect belongs only if it strengthens a campaign moment or makes a state change clearer.
- On the purchase path (options, add to cart, cart), only instant feedback and overlay transitions are allowed. See [12 §4](12-mobile-accessibility-motion-performance.md#4-motion-system).
- Every accepted effect needs all four of these: one home section, a reduced-motion equivalent, an editor override, and a measurable performance cost.

## 3. Native target specifications

### T1 `nk-reveal`: in-view reveal (from #1, #5, #11, #23)
- **Markup.** `<nk-reveal mode="cut|fade|wipe|split|fold" by="line|word|char" delay="0">` wraps Liquid content. The content is **visible in the HTML**. The hidden start state is applied only when the `html.nk-motion` class is set (by an inline script in the layout), Motion is not Off, the element is below the fold at mount, and the page is not in design mode. This fixes a defect shared by #1, #5 and #11: each starts with `visibility:hidden` or `opacity:0`, so content stays invisible without JavaScript.
- **Modes.**
  - `cut`: `clip-path: inset(0 0 100% 0)` → `inset(0)`, 380 ms.
  - `fade`: opacity plus a 12px translate, 300 ms.
  - `wipe`: from #5. A mask-image gradient driven by an `@property --nk-wipe` (up/down/left/right).
  - `split`: from #1 and #23. Splits into lines or words (chars only for text of 24 characters or fewer). Stagger 40 ms, total capped at 600 ms. Default effect is "rise". Of #1's effects, only "fade" is also offered. Flip, pop, skew, blur and wave are dropped.
  - `fold`: from #11. Word or line pieces rotate around a top hinge (`rotateX` 90°→0) inside a `perspective` wrapper, with optional crease shading via `::after`. Paper style only.
- **Accessibility.** Split and fold keep the original text for assistive technology. Following #11's good pattern, an sr-only copy is used, and the visual pieces are `aria-hidden` inside a heading whose accessible name is the full text. Splitting is redone after `document.fonts.ready` (as in #1) and after a debounced resize.
- **Dropped from the sources:**
  - hover lift/wave springs (#1)
  - hover refold with window-level `pointermove` and scroll capture listeners (#11)
  - loop / `loopDelay` (#1, #11)
  - scrub, disappear-after, blur, tilt (#5)
  - the hard-coded `#snap-main-container` scroller (#5)
  - `onLetterAnimationComplete` callbacks
- **Implementation.** IntersectionObserver (threshold 0.15, then disconnect) → Web Animations API or a class toggle. No GSAP. Handles are cancelled in `dispose`.
- **Settings.** Block or section "Entrance": None / Cut / Fade / Wipe / Split lines / Fold. Defaults: Cut in Preset A, None in Preset B.
- **Reduced motion / Motion=Off / editor selection.** The final state is applied immediately and nothing is split.
- **Scope.** Never used on product grids, prices, options or the cart.

### T2 `nk-marquee`: ticker, band, content strip, testimonial wall (from #4, #13, #15)
- **Markup.** Liquid renders the list once. JavaScript clones it into an `aria-hidden="true" inert` copy only while needed. This fixes #15 (copies were not hidden) and #13 (children rendered twice).
- **Motion.** A CSS keyframe `translateX` (or `translateY` for vertical) on the track. Duration = width ÷ speed (default 40 px/s, close to #15's `--duration` intent).
- **Pause.** A pause button is always present (WCAG 2.2.2). Neither #15's `pauseOnHover` nor #4's reduced-motion freeze is enough on its own. Hover and focus-within pause the band, slowing to the #13 `speedOnHover` equivalent. An IntersectionObserver and `visibilitychange` pause it when off screen or in a background tab.
- **Optional `speed-mode="scroll"` (from #4).** `playbackRate` is set from passive scroll velocity, clamped 0.5–3×, with an optional skew of ≤8°. #4's drag and fling (pointer capture) are rejected: it competes with page scrolling and adds no shopping value.
- **Modes.**
  - Message ticker (announcement): P1.
  - Message band in condensed display type, optionally two rows in opposite directions as in #4: P2.
  - Image/logo strip (#13): P1.
  - **Vertical testimonial wall (#15): P2, and only when backed by a real review source** (a review app's data, or merchant-entered testimonials that carry attribution). We do not invent quotes. Edges fade via a mask, following #15's gradient overlays.
- **Reduced motion / Off.** A static first message with ◀ ▶ step buttons, or a horizontally scrollable rail for item strips.
- **Editor.** Selecting a block pauses the band and scrolls that item into view.

### T3 `nk-disclosure` (from #9)
Uses native `<details>`/`<summary>`, so content stays in the DOM (#9 unmounts it) and the trigger is a real summary (#9 nests a `<button>` inside its trigger). Optional height animation via `interpolate-size` where supported. `onEditorSelect` opens it. Used for: product info, FAQ, phone footer menus, filter groups, and size-guide notes.

### T4 `nk-tabs` (from #21)
The #21 demo uses plain buttons with no tab roles, and blur + 50px vertical slide panels at 0.2 s. The target is the full WAI-ARIA tabs pattern: roving tabindex, ←/→/Home/End, and an underline indicator moved by transform. Panels change with a 120 ms opacity and 8px translate (no blur, which costs too much on phones). Panels load lazily on first activation. Without JavaScript, panels are stacked with headings. Used for recommendation tabs and the tabbed featured collection.

### T5 `nk-expand-media` (from #6)
- **Observed behaviour of #6.**
  - A tall track: `stageH × (1 + scrollDistance 1.2 + hold 0.35)`.
  - A sticky full-viewport stage.
  - The frame's `clip-path: inset(...) round r` grows from 42%×58% with a 24px radius to full-bleed with radius 0.
  - Media scale goes from 1.35 to 1.
  - A centred title fades out between 40% and 88% progress.
  - A scrim and overlay content fade in from 68% progress.
  - A "Scroll" hint fades out at 0–12%.
  - Passive scroll listener with rAF exponential smoothing.
  - Video autoplays muted on loop.
  - Reduced motion only removes the smoothing; the scroll-linked change remains.
  - **There is no scroll-jacking.**
- **Port.**
  - Liquid section `expand-media` with the same visual model.
  - CSS `animation-timeline: view()` / `scroll()` keyframes for inset, scale and opacity where supported. Otherwise the original approach: passive scroll plus a rAF that runs only while progress changes.
  - Stage height uses `100svh`, not `innerHeight`, to avoid jumps from the iOS toolbar.
  - Heading and CTA are real HTML and readable at every progress value; the title is not duplicated as decoration.
  - Video: poster first, plays only while in view and when Motion is not Off, with a pause button.
  - **Reduced motion, Off and design mode:** a static full-bleed hero with overlay content visible.
- **Settings.** Media (image or video), mobile media, start inset (small/medium), scroll length (short/long), title, overlay blocks, scrim strength, colour scheme.
- **Gate.** Owner demand plus profiling on a midrange Android phone. It must never be the first section by default, because LCP and CTA visibility come first.

### T6 Header and navigation patterns (from #8, #16, #17, #18)
Specified in [06](06-header-navigation-search.md). Adopted:

- **Card panel (#8).** The level-1 drawer can show link groups as cards: label, description and links. #8's accessibility contract is kept: `aria-expanded`/`aria-controls`, Esc closes and returns focus to the toggle, closed links get `tabIndex=-1`, and click-away uses `pointerdown`. #8's rAF spring height and intro `clip-path` animation (820 ms on every mount) are dropped in favour of overlay tokens; the intro would replay on every page view. Glass blur is an optional scheme value with a solid fallback.
- **Editorial drawer style (#16).**
  - Large uppercase items with automatic `01`, `02` numbering (CSS counters), which matches the "index" device in Cut & Label.
  - Coloured pre-layers slide in before the panel (≤2 layers, 70 ms offsets).
  - Items rise with a stagger of ≤6 × 40 ms.
  - A "Menu/Close" label swap on the toggle.
  - Fixes over #16: no Esc, no focus move, no scroll lock, `aria-hidden` on a panel whose links stay tabbable, a hard-coded `id="staggered-menu-panel"` that collides across instances, no reduced motion, and a flat list only. The target adds level panels, focus management via the overlay service, and per-instance IDs.
- **Floating mega-menu panel (#17, #18).**
  - One panel morphs between top-level items (it repositions and resizes rather than re-opening).
  - Product/campaign cards with image, title and short description.
  - Optional floating pill header layout.
  - Fixes over #17/#18: it was **hover-only** (`onMouseEnter`/`onMouseLeave`), its top-level items were `<p>` elements (not focusable), and it had no keyboard support or Esc. The target uses link + disclosure button pairs, click/keyboard opening, hover-intent as an enhancement only, and a reduced-motion instant swap. Panel movement uses FLIP (measure and transform), 240 ms, replacing #18's framer-motion `layoutId` spring.

## 4. Per-example records (17 fields each)

Field key:
1. Name and source file
2. Framework, dependencies, provenance
3. What it does (observed in the file)
4. Belongs in this store?
5. Location and purpose
6. Disposition
7. What is rewritten
8. Liquid target
9. TypeScript target
10. CSS/tokens
11. Inputs, settings, state, events, outputs
12. Pointer, keyboard, touch, reduced motion
13. Phone
14. Editor lifecycle
15. Loading and performance
16. Acceptance tests
17. Open questions

### 4.1 Split Text — `Split Text.md`
1. `example componenets/Split Text.md`: demo (`text="Hello, GSAP!"`, effect `rise`, chars, delay 50, duration 1.25, trigger `view`, hoverEffect `lift`) plus the full `SplitText` source.
2. React client component. `gsap`, `gsap/ScrollTrigger`, `gsap/SplitText`, `@gsap/react`. React Bits, MIT + Commons Clause.
3. Observed:
   - Waits for `document.fonts`.
   - Splits with GSAP SplitText (`smartWrap`, `autoSplit` for lines, optional masks).
   - Plays one of 7 effects (rise/fade/blur/flip/pop/skew/wave) with stagger on view, load, hover or click.
   - Optional accent-colour sweep, loop with conceal/reveal cycle, and hover springs (lift/wave) in a rAF loop that stops itself.
   - Reduced motion skips the animation.
   - The element is `visibility:hidden` until ready.
4. Yes, narrowly: campaign headlines only.
5. Hero heading block and editorial section headings in Preset A.
6. **Adapt.** Lines/words split is P2. P1 uses `cut`.
7. Line/word splitting (Range rects, no GSAP), stagger, accessible text copy, font/resize re-split. The visibility defect is fixed.
8. `blocks/heading.liquid` setting `entrance` wraps the real `<h1>`/`<h2>` in `<nk-reveal>`.
9. `src/components/reveal/reveal.ts` + `split.ts`.
10. `--nk-dur-reveal`, `--nk-ease-out`, `--nk-stagger`. Transform/opacity only.
11. Inputs: `mode`, `by`, `delay`. State: idle, armed, playing, done. No events. Output: the final text.
12. Hover/click triggers and hover springs dropped. Reduced motion: no split, final state.
13. Animates at most 4 lines; disabled below 28px font size.
14. Selection → finish. Section reload → fresh observer. Remove → observer disconnected. Duplicates are independent.
15. About 1.5 KB gzip; idle until in view; no line-box changes, so no CLS.
16.
    - Screen reader reads the heading once.
    - Copy/paste yields the original text.
    - Text is visible without JavaScript.
    - A long translated headline wraps correctly.
    - Reduced motion shows the final state instantly.
    - 10 duplicated sections leak no listeners.
17. Does the owner want character-level splitting (as in the demo)? It is limited to text of 24 characters or fewer.

### 4.2 Shiny Text — `Shiny Text.md`
1. `Shiny Text.md`: demo (`color #b5b5b5`, `shineColor #ffffff`, speed 2, shineWidth 40, softness 0.8, trigger `loop`) plus the full `ShinyText` source.
2. React + CSS. React Bits, MIT + Commons Clause.
3. Observed:
   - A rAF loop rebuilds a multi-stop `linear-gradient` each frame, with colours parsed via a 2D canvas and blended in linear light.
   - Background-clip text.
   - Triggers: loop, hover or view. Optional yoyo, pointer-follow spring and pause on hover.
   - IntersectionObserver pauses it off screen.
   - Reduced motion stops the loop.
   - Glow duplicate is `aria-hidden`.
4. Marginal. The demo's base colour `#b5b5b5` on white fails contrast (about 2:1).
5. If adopted: a campaign eyebrow label only.
6. **Defer (P2).**
7. CSS-only sweep: `@property --nk-shine` keyframes moving a gradient over a solid base colour that already passes contrast. No canvas, no rAF.
8. Heading/eyebrow block "Style: Shine" (off by default).
9. None.
10. Base = scheme text colour (≥4.5:1); highlight = scheme accent at most 40% mix.
11. One setting.
12. Reduced motion / Off: solid text. No pointer follow.
13. Disabled for text under 14px.
14. Paused when selected.
15. CSS only.
16. Contrast passes at 0%, 50% and 100% of the sweep.
17. Is shimmer text actually wanted? Questionnaire V42.

### 4.3 Gradient Text — `Gradient Text.md`
1. `Gradient Text.md`: demo (`colors ['#5227FF','#FF9FFC','#B497CF']`, speed 8, variant `flow`, glow 0.4) plus the full `GradientText` source and CSS.
2. React + CSS. React Bits, MIT + Commons Clause.
3. Observed:
   - A rAF loop writes `--gt-gradient` each frame (linear, conic, or "flow" with blob radial gradients), with a pointer-follow spring.
   - Optional gradient border via mask-composite.
   - Glow copy is `aria-hidden`.
   - IntersectionObserver pause.
   - Reduced motion pauses time but still paints.
4. No for v1. The colours conflict with the proposed direction, contrast with merchant colours can't be guaranteed, and it serves no shopping purpose.
5. —
6. **Reject (v1).** Revisit only if the approved brand includes a gradient.
7–15. Not applicable.
16. —
17. Does the brand include a gradient (OD-02)?

### 4.4 Scroll Velocity — `Scroll Velocity.md`
1. `Scroll Velocity.md`: demo (`texts ['React Bits','Scroll Down']`, velocity 100, skew 16, scale 0.18, draggable, 104px/900) plus the full source and CSS.
2. React + `motion/react`. React Bits (confirmed by the demo text), MIT + Commons Clause.
3. Observed:
   - Rows of 6 copies scroll endlessly; alternate rows reverse.
   - Speed and direction follow smoothed scroll velocity.
   - Optional skew/scale surge, outline on alternate rows, fade-edge mask, pause on hover.
   - Drag with fling (pointer capture, `touch-action: pan-y`); click suppression after drag.
   - Copies after the first are `aria-hidden`.
   - Reduced motion freezes it.
   - `useAnimationFrame` runs continuously.
4. Partly. A brand/category band suits Preset A, as in Rush Mode's ticker.
5. Message band between homepage sections.
6. **Adapt as option** (`nk-marquee speed-mode="scroll"`, two rows). Drag is rejected.
7. Velocity from a passive scroll listener; WAAPI `playbackRate`; optional skew; no idle rAF.
8. `sections/message-band.liquid`: message blocks, rows (1–2), "React to scrolling", outline alternate.
9. `src/components/marquee/marquee.ts` + `scroll-speed.ts`.
10. Display type tokens, `--nk-marquee-gap`, scheme colours.
11. Settings: speed, direction, rows, scroll reactivity, outline. State: running/paused.
12. Pause button; hover/focus pause; reduced motion → static.
13. One row on phones; no drag; vertical page scroll is never captured.
14. Selection pauses; removal cancels animations and listeners.
15. About 2 KB gzip extra; no CPU while off screen.
16. 60 s soak with no CPU off screen; pause reachable by keyboard; VoiceOver reads the list once.
17. —

### 4.5 Animated Content — `Animated Content.md`
1. `Animated Content.md`: full `AnimatedContent` source.
2. React + `gsap` + `ScrollTrigger`. React Bits, MIT + Commons Clause.
3. Observed:
   - Scroll- or mount-triggered `fromTo` on the element or its children.
   - Effects: distance/axis/reverse, scale, opacity, blur, rotate, tilt with perspective, and **mask wipes** (up/down/left/right/centre via `--ac-wipe` gradient).
   - Stagger, scrub, "disappear after".
   - Reduced motion shows content immediately.
   - The wrapper is **`visibility:hidden` inline** until the effect runs.
   - Looks up `#snap-main-container` as the scroller.
4. Yes, for editorial moments.
5. Media-with-text, campaign tiles, story sections.
6. **Adapt** into `nk-reveal` (`fade`, `cut`, `wipe`).
7. IntersectionObserver trigger, WAAPI/CSS, the wipe as an `@property` mask. Visible without JavaScript.
8. Section setting "Entrance" plus wrapper markup on content blocks.
9. `reveal.ts`.
10. Motion tokens; no `filter: blur`.
11. As T1.
12. As T1; never on hover.
13. Distances ≤12px on phones; never above the fold on first load.
14. As T1.
15. As T1.
16. CLS identical with and without JavaScript; editor preview shows content; reduced motion is instant.
17. —

### 4.6 Scroll Expand — `Scroll Expand.md`
1. `Scroll Expand.md`: two demos (window-scroll hero; a 520px container with `mediaZoom` 1.35) plus the full `ScrollExpand` source and CSS.
2. React only, no animation library. Provenance unconfirmed (React Bits pattern), so it is treated as restricted.
3. Observed: see T5. Clip-path frame expansion, media zoom-out, title fade-out, overlay fade-in, scroll hint, smoothstep easing, a passive scroll listener with rAF smoothing that stops when settled, and a ResizeObserver. Video always autoplays, muted and looped.
4. Yes, as an optional campaign opener. It matches questionnaire V42 "scroll-linked image expansion".
5. Optional homepage or landing section (not the default hero).
6. **Adapt (P2).** First enhancement candidate after launch.
7. CSS scroll-driven keyframes with fallback; `svh` stage; poster-first video with pause; static mode.
8. `sections/expand-media.liquid` with heading and button blocks.
9. `src/components/expand-media/expand-media.ts` (feature detection, fallback rAF, video control).
10. Scrim from scheme; radius token; title display type.
11. Settings per T5. State: progress 0–1 (CSS variable), video playing/paused.
12. Keyboard Page Down works because it is native scrolling. Reduced motion → static.
13. Shorter track (about 140svh). Mobile media setting. Title size clamp.
14. Design mode renders the final static state; selecting a block shows the overlay content.
15. Video `preload="none"`; poster served via `image_url`; profile midrange Android.
16. No `preventDefault` on wheel or touch; CTA reachable; no CLS; no autoplay under reduced motion.
17. Does the owner want it at launch? (Plan: P2.)

### 4.7 bubble — `bubble.md`
1. `bubble.md`: shadcn/ui docs page for **Bubble**, a chat-message surface (variants, alignment, reactions, groups). Source is referenced via `<ComponentSource>` and is not included.
2. React (shadcn/ui, Base UI style), MIT.
3. Documentation: message bubbles with seven variants, reactions, collapsible content, and accessibility notes (label reaction rows, use real buttons for interactive bubbles, don't rely on colour).
4. No. A clothing storefront has no chat surface; support chat comes from an app if one is chosen (OD-09).
5. —
6. **Reject.** Its accessibility guidance on interactive surfaces and colour meaning is already covered in [12](12-mobile-accessibility-motion-performance.md).
7–15. —
16. —
17. Was this file pasted by mistake? Did the owner mean React Bits *BubbleMenu*? If so, the drawer covers that purpose.

### 4.8 cardnav — `cardnav.md`
1. `cardnav.md`: full `CardNav` source and CSS.
2. React + `@hugeicons/react`. React Bits, MIT + Commons Clause.
3. Observed:
   - A pill bar (menu button with Menu/Close label swap, centred logo, optional CTA) expands into a panel of cards (label, description, links).
   - Height is driven by a rAF spring (bounce, speed); card effects are rise, unfold or fade (blur).
   - Glass surface (`blur(20px) saturate(1.6)`) or solid; dark/light themes.
   - Below a 560px container width, cards stack and the CTA moves inside.
   - Esc closes and refocuses the toggle; pointer-down outside closes; links are `tabIndex=-1` when closed; content is `aria-hidden` when closed.
   - Optional hover opening that ignores touch.
   - Intro clip-path animation (820 ms) on mount; reduced-motion handling.
4. Yes as a pattern: grouped link cards suit small catalogs and the phone drawer.
5. Phone drawer level 1 (card groups) and an optional "Menu button" desktop header layout.
6. **Adapt (pattern).**
7. Disclosure/dialog behaviour via the overlay service; card layout; label swap. Spring replaced by overlay tokens; intro animation dropped.
8. `sections/header.liquid` + `snippets/nav-drawer.liquid`. Groups come from menu levels. Optional `_menu-group` blocks add a description and colour.
9. `src/components/nav-drawer/nav-drawer.ts`; `src/components/header/header.ts` for the menu-button layout.
10. Card radius from layout setting (0/2px in our presets), scheme surface/tile roles, optional blur scheme flag.
11. Settings: header layout, group descriptions, CTA link. State: closed/opening/open/closing.
12. Click/tap; Esc; focus first card link; hover opening only on pointer:fine; reduced motion → instant.
13. Full-height dialog on phones (#8 is not modal; ours is, because of drawer content length).
14. Selecting a group block opens the drawer at that group.
15. No rAF; one blur layer only if enabled.
16. Keyboard through all cards; focus return; no background scroll on iOS; rotation closes cleanly.
17. —

### 4.9 discolsure — `discolsure.md`
1. `discolsure.md`: `DisclosureBasic` demo (330px bordered box, "Show more" trigger, code sample content).
2. React + motion-primitives `Disclosure` (source not supplied). MIT.
3. A trigger toggles a content region (the library animates height and opacity and unmounts content when closed; behaviour as documented in the revision-1 research). The demo nests a `<button>` inside `DisclosureTrigger`.
4. Yes.
5. Product accordions, FAQ, footer (phone), filters.
6. **Adopt pattern** via `<details>`.
7. See T3.
8. `snippets/disclosure.liquid`.
9. `src/components/disclosure/disclosure.ts`.
10. Row ≥52px, `--nk-line`, icon 120 ms.
11. Settings: default open, exclusive group. Native `open` / `toggle` event.
12. Native keyboard; reduced motion → instant.
13. Full-width rows.
14. Block select → open.
15. About 0.5 KB.
16. Works without JavaScript; expanded state is announced; empty rows are omitted.
17. —

### 4.10 elasticline — `elasticline.md`
1. `elasticline.md`: demo, a full-viewport "FANCY COMPONENTS" layout with `ElasticLine` (`releaseThreshold 50`, spring intro) and spring text entrances.
2. React + `motion/react`; Fancy `ElasticLine` (source not supplied). MIT.
3. A decorative SVG line drawn in on mount that bends toward the cursor and springs back. Text fades up with springs.
4. No. Cursor-only and decorative, with no touch value.
5. —
6. **Reject.** Use static hairline dividers.
7–15. —
16. —
17. —

### 4.11 foldtext — `foldtext.md`
1. `foldtext.md`: demo (`"Launch with clarity"`, paper, char, hinge top, trigger scroll, angle 92, duration 0.65, stagger 0.045, hoverRefold radius 140) plus the full `FoldText` source and CSS.
2. React + `gsap` + `ScrollTrigger`. Provenance unconfirmed, treated as restricted.
3. Observed:
   - Splits text into char, word or line pieces.
   - Three styles: paper (rotate around a hinge), blinds (two clipped slats with 0.24 delay), flip (180° with lift).
   - Crease shading via `::after` with `attr(data-fold-text)` and a gradient background-clip.
   - Triggers: mount, scroll (once at `top 82%`), hover or loop.
   - Optional hover "refold" proximity effect using a **window-level `pointermove` and capture-phase scroll listener** and a GSAP ticker.
   - Good: an sr-only copy plus an `aria-hidden` visual.
   - Pieces start with inline `opacity:0`, so they are hidden without JavaScript.
   - Reduced motion: a CSS override removes transforms and crease; durations shorten.
4. Possibly, as a distinctive campaign headline style. It shares the hinge idea with the "cut" direction.
5. Hero or editorial headline (Preset A option).
6. **Merge/Defer** into `nk-reveal mode="fold"` (P2). Paper style, words or lines, scroll trigger only, no hover refold or loop.
7. Hinge rotation via WAAPI per piece, crease via the CSS variable `--nk-crease`, sr-only pattern kept, visible without JavaScript.
8. Heading block "Entrance: Fold".
9. `reveal.ts` (fold mode).
10. Motion tokens; perspective 700px; crease gradient from the scheme text colour.
11. As T1.
12. No hover behaviour. Reduced motion → final state.
13. Words only below 750px; capped at 6 pieces.
14. As T1.
15. Many inline-block pieces increase DOM size, so text is capped at 40 characters.
16. As 4.1, plus no window-level listeners after unmount.
17. Does the owner prefer fold, cut or split as the signature? One should be chosen as the default.

### 4.12 gooeyinput — `gooeyinput.md`
1. `gooeyinput.md`: `GooeyInputDemo` with `<GooeyInput placeholder="Search..." />` only.
2. React client component; library unidentified (`@/components/ui/gooey-input`). Aceternity publishes a matching component, whose licence forbids theme use; 21st.dev lists it as "no-license".
3. Not observable from the file. The likely behaviour, from public research, is a search pill that morphs into an input using an SVG goo filter.
4. No.
5. —
6. **Reject.** Search is a labelled button opening `nk-predictive-search`. A short pill-to-field width transition on desktop is possible later without the goo filter.
7–15. —
16. —
17. Which library did the owner take it from?

### 4.13 infiniteslider — `infiniteslider.md`
1. `infiniteslider.md`: `InfiniteSliderHoverSpeed` demo; six 120px square album covers; `speedOnHover={20}`, `gap={24}`.
2. React + motion-primitives `InfiniteSlider` (source not supplied). MIT.
3. A continuous horizontal loop of images that slows on hover.
4. Yes, as an image/logo/press strip, merged into the marquee.
5. Optional "content strip" section (press logos, lookbook thumbnails, UGC with permission).
6. **Merge** into `nk-marquee` items mode.
7. See T2.
8. `sections/content-strip.liquid` with image and link blocks.
9. `marquee.ts`.
10. Item height setting; gap token.
11. Settings: speed, hover speed, direction.
12. Pause button; hover slow-down; reduced motion → scroll-snap rail.
13. Rail fallback when content is shorter than the screen.
14. Block selection pauses the strip and brings that item into view.
15. Lazy images with small `sizes`.
16. No duplicate tab stops; reduced motion leaves a usable rail.
17. What content should the strip carry? (Do not reuse the demo's album covers.)

### 4.14 letterswap — `letterswap.md`
1. `letterswap.md`: demo with five labels (`LetterSwapForward` with reverse/stagger options; `LetterSwapPingPong` with `staggerFrom` centre/last).
2. React + Fancy components (source not supplied). MIT.
3. On hover, letters slide out and duplicates slide in, staggered (forward or ping-pong).
4. Small. A navigation-link micro-interaction for Preset A on desktop.
5. Desktop primary navigation and footer links (optional).
6. **Defer (P2), CSS-only.**
7. Per word, not per letter: two stacked copies with a `translateY` swap on `:hover` and `:focus-visible`.
8. `data-swap` and an `aria-hidden` duplicate span on navigation links.
9. None.
10. `--nk-dur-instant`.
11. Setting "Link hover: underline / swap".
12. Focus-visible triggers it too; nothing on touch; reduced motion → underline.
13. Off below 990px.
14. —
15. CSS only.
16. Link is read once; focus is visible.
17. —

### 4.15 marquee — `marquee.md`
1. `marquee.md`: `MarqueeDemoVertical` with two vertical marquees (one reversed, `pauseOnHover`, `--duration:20s`) of review cards (avatar, name, handle, quote), plus top and bottom fade gradients.
2. React + Magic UI `Marquee` (source not supplied; CSS keyframes) + Tailwind. MIT.
3. A wall of testimonial cards scrolling vertically in opposite directions. Hover pauses it.
4. Partly. The horizontal ticker is a confirmed pattern from the reference stores. A **testimonial wall is only valid with real reviews**.
5. Announcement ticker (header group), message band, and a P2 "Reviews wall" section.
6. **Adapt** (T2). Static announcement P0, ticker P1, vertical wall P2 (gated on OD-09 review source).
7. See T2. The wall is a vertical track per column, each with its own direction.
8. `sections/announcement.liquid`, `sections/message-band.liquid`, P2 `sections/reviews-wall.liquid` (blocks: quote, name, optional image and product link; or an app source).
9. `marquee.ts` (with a `vertical` attribute).
10. Card tokens (surface, line, radius); strip height 30–44px.
11. As T2; wall adds columns (1–3).
12. As T2; the pause button is visible on the wall too.
13. One column on phones, with a reduced speed.
14. Selecting a quote block pauses the wall and scrolls to that quote.
15. CSS only; avatars lazy-loaded.
16. WCAG 2.2.2; no duplicate reading; attribution on every quote.
17. Does a review source exist (OD-09)?

### 4.16 menu — `menu.md`
1. `menu.md`: full `StaggeredMenu` source and CSS.
2. React + `gsap`. React Bits (confirmed by the default logo path), MIT + Commons Clause.
3. Observed:
   - A toggle button with a cycling Menu/Close text column and a rotating plus icon.
   - A side panel (right or left, `clamp(260px, 38vw, 420px)`, full width at ≤1024px) slides in after 2–3 coloured pre-layers (0.07 s offsets, power4.out).
   - Items (3.5rem uppercase) rise from a 140% offset with a 10° rotation, staggered 0.1 s.
   - Optional `01, 02…` numbering via CSS counters; socials list fades in.
   - Click-away on `mousedown`.
   - `aria-expanded`/`aria-controls` on the toggle.
   - Defects: the panel gets `aria-hidden` when closed but its links stay focusable; **no Esc, no focus management, no scroll lock, no reduced motion, a hard-coded id, flat items only**; the panel has `backdrop-filter` on top of a white background, which does nothing.
4. Yes as an expressive drawer style.
5. `nk-nav-drawer` style "Editorial" (Preset A option).
6. **Adapt (pattern).**
7. Layered entrance (≤2 layers), numbered large items, label swap. Level panels, overlay-service focus, scroll lock and per-instance IDs added.
8. `snippets/nav-drawer.liquid` style variant; numbering via CSS counters.
9. `nav-drawer.ts` (style-specific animation in `drawer-editorial.ts`, loaded only when that style is chosen).
10. Pre-layer colours come from scheme roles (accent, surface); item size uses a display token clamp (2.25–3.5rem).
11. Setting: drawer style (Standard / Editorial), numbering on/off. State as N-04.
12. Esc, focus trap, return focus; reduced motion → 120 ms fade without layers or stagger.
13. Full width; items wrap; long translated labels clamp down in size.
14. As N-04.
15. About 1.5 KB extra; transforms only.
16. Keyboard and screen-reader pass; no tabbable hidden links (axe); iOS scroll lock holds.
17. Should Editorial be the Preset A default? (Proposal: yes for phones.)

### 4.17 navbar2 — `navbar2.md`
1. `navbar2.md`: `NavbarDemo`, a fixed floating max-width-2xl navbar with three `MenuItem`s (Services, Products, Pricing). The Products dropdown is a 2-column grid of `ProductItem` cards (image 140×70, title, description).
2. React + Aceternity Navbar Menu. Aceternity licence: no use in themes, so clean-room only.
3. A hover menu: entering an item opens a dropdown, and leaving the nav closes it. Product cards show an image and short description.
4. Yes as a pattern. Product/campaign cards inside the mega menu suit fashion merchandising.
5. Desktop mega menu "Floating" panel style.
6. **Adapt (pattern)**, merged with 4.18.
7. See T6.
8. `snippets/nav-desktop.liquid` + `_menu-promo` blocks (image, title, short text, link).
9. `src/components/mega-menu/mega-menu.ts` (FLIP panel morph).
10. Panel radius/shadow tokens per preset (square in ours).
11. Settings: panel style (Attached / Floating), promo cards per item.
12. Click and keyboard; hover-intent enhancement; Esc; reduced motion → instant swap.
13. Desktop only; phones use the drawer.
14. Selecting a promo block opens that item's panel.
15. Promo images lazy until the first open.
16. See N-03 acceptance.
17. —

### 4.18 navbatmain — `navbatmain.md`
1. `navbatmain.md`: the `MenuItem`, `Menu`, `ProductItem` and `HoveredLink` implementations.
2. React + `framer-motion` + `next/link` + `next/image`. Aceternity licence, so clean-room only.
3. Observed:
   - `MenuItem` sets `active` on `mouseenter`. When active, it renders a dropdown (spring: mass 0.5, damping 11.5, stiffness 100) positioned below, with a shared `layoutId="active"` so one panel morphs between items.
   - `Menu` is a rounded-full `<nav>` that resets on `mouseleave`.
   - Top-level labels are `<p>` elements: **not focusable, not buttons**.
   - No keyboard, Esc or touch path; no reduced motion; `backdrop-blur-sm`.
4. The pattern yes; the implementation no.
5. As 4.17.
6. **Adapt (pattern).**
7. Shared morphing panel via FLIP (measure the old and new item panel, animate transform/size 240 ms with no overshoot). Accessible triggers.
8–16. As 4.17 and [06 N-03](06-header-navigation-search.md).
17. —

### 4.19 progresivebasicblur — `progresivebasicblur.md`
1. `progresivebasicblur.md`: an artwork card (300px square image) with `ProgressiveBlur` on the bottom 50% (`blurIntensity 6`) under caption text.
2. React + motion-primitives `ProgressiveBlur` (source not supplied: stacked masked `backdrop-filter` layers). MIT.
3. Blur increases toward the bottom edge so white caption text stays legible over an image.
4. A legitimate legibility tool for captions on campaign tiles and hero text, but expensive on phones.
5. Campaign tiles, collection tiles, hero caption area.
6. **Defer (P2).** The default is a solid or translucent caption band. Blur is an opt-in scrim style capped at 2 layers after device profiling.
7. CSS with `@supports (backdrop-filter)` and a mask gradient.
8. Tile/hero setting "Caption background: solid / translucent / blur (experimental)".
9. None.
10. `--nk-scrim-opacity`, scheme colours.
11. Setting only.
12. `prefers-reduced-transparency` → solid.
13. Disabled on phones unless profiling passes.
14. —
15. Measured on a midrange Android.
16. Caption contrast ≥4.5:1 on real imagery.
17. —

### 4.20 stickeyfootor — `stickeyfootor.md`
1. `stickeyfootor.md`: complete demo. A 100dvh `relative z-10` orange block, then a `sticky bottom-0 z-0` 320px white footer with link lists (`<li>` items without links) and a giant word mark.
2. React + Tailwind (Fancy demo). MIT.
3. A "reveal" footer that sits beneath the content and is uncovered as the content scrolls past.
4. Not for v1. The stacking order can hide footer content behind short pages, editor selection of footer blocks becomes awkward, the iOS dynamic toolbar interferes, and the demo's links aren't links.
5. —
6. **Reject (v1).** A possible P2 footer style ("Reveal") if the owner wants it, gated on testing short pages and the editor.
7–15. —
16. —
17. —

### 4.21 tabswithtransctition — `tabswithtransctition.md`
1. `tabswithtransctition.md`: `TabsTransitionPanel` with three items (Aesthetics/Art/Technique), plain buttons with active background, and a `TransitionPanel` (0.2 s easeInOut; enter `opacity 0, y -50, blur 4px`, exit `y 50`).
2. React + motion-primitives `TransitionPanel` (source not supplied). MIT.
3. Buttons switch a panel with a vertical slide and blur cross-transition. No tab roles.
4. Yes.
5. Recommendation tabs; tabbed featured collection.
6. **Adapt** (T4).
7. ARIA tabs, an indicator transform, an opacity plus 8px panel swap without blur, and lazy panels.
8. `sections/product-recommendations.liquid` (tab blocks); `featured-collection` tabs variant.
9. `src/components/tabs/tabs.ts`.
10. Indicator 2px signal colour; `--nk-dur-small`.
11. Blocks: label, source. State: active index. Event: `nk:tabs:change`.
12. Arrow keys; tap; reduced motion → instant.
13. The tablist scrolls inside its own container.
14. Selecting a tab block activates that tab.
15. Inactive panels are fetched on first use.
16. axe tabs pattern; stacked fallback without JavaScript.
17. —

### 4.22 textloading — `textloading.md`
1. `textloading.md`: `TextShimmerWaveBasic`, "Generating code..." in mono small text, duration 1.
2. React + motion-primitives `TextShimmerWave` (source not supplied; a per-character wave shimmer). MIT.
3. An endless per-letter shimmer wave on a loading label.
4. No. Our loading states use static status text plus a small indicator, and keep previous content visible. A looping per-character shimmer adds motion without information and repeats announcements if it is ever made live.
5. —
6. **Reject.**
7–15. —
16. —
17. —

### 4.23 textpercharacter — `textpercharacter.md`
1. `textpercharacter.md`: `TextEffect per='char' preset='fade'` on "Animate your ideas with motion-primitives".
2. React + motion-primitives `TextEffect` (source not supplied). MIT.
3. A per-character staggered fade on mount.
4. Only as a sub-mode of the headline reveal.
5. Short campaign headlines.
6. **Merge/Defer** into `nk-reveal split by="char"` (P2, 24 characters or fewer).
7. As T1.
8. Heading block setting.
9. `reveal.ts`.
10. As T1.
11. As T1.
12. As T1; never on mount above the fold.
13. Off below a 32px font size.
14. As T1.
15. Character spans are capped.
16. As 4.1.
17. —

## 5. Licence and attribution actions

| Files | Source licence | Action |
|---|---|---|
| 1, 2, 3, 4, 5, 8, 16 (confirmed React Bits); 6, 11 (assumed) | MIT + Commons Clause | Clean-room only. Implementers don't keep the pasted code open while writing; record a clean-room note in the PR. |
| 17, 18 (Aceternity); 12 (likely) | Aceternity licence / none | Clean-room only. |
| 9, 13, 19, 21, 22, 23 (motion-primitives); 10, 14, 20 (Fancy); 15 (Magic UI); 7 (shadcn/ui) | MIT | Behaviour reference. Keep the notice in `docs/LICENSES/` if any expression is reused. |
| GSAP (used by 1, 5, 11, 16) | GSAP "no charge" licence | Used since 2026-10-22 (D-06 superseded): reveal, parallax, stagger, cursor, expand media. Our own code, not the example source. |

The pasted files stay in `example componenets/` as evidence. They are never copied into the theme repo.
