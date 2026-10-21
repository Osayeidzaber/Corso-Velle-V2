# Example-component candidate research (2026-10-21)

## Folder check
`E:\NKIL\example componenets\` contains **23** files, **all 0 bytes**: Animated Content, bubble, cardnav, discolsure, elasticline, foldtext, gooeyinput, Gradient Text, infiniteslider, letterswap, marquee, menu, navbar2, navbatmain, progresivebasicblur, Scroll Expand, Scroll Velocity, Shiny Text, Split Text, stickeyfootor, tabswithtransctition, textloading, textpercharacter (.md). (The brief's "21" is wrong; 23 is correct.)

**Every match below is a CANDIDATE guessed from the file name. Nothing confirms which code the owner meant to supply.** Sources are current `main` branches as of today. React Bits in particular has been heavily rewritten, so an older copy the owner had may have different props and dependencies.

## Licenses (checked)
| Library | License | Implication for a redistributable theme |
|---|---|---|
| React Bits (DavidHDev/react-bits LICENSE.md) | MIT **+ Commons Clause v1.0**, (c) 2026 David Haz. Use in apps/sites/products, including commercial ones, is allowed. You may **not** sell, sublicense or *redistribute its components alone, bundled, or as a ported version*. Notice must be kept. | **High risk.** A theme sold or shared on the Theme Store is arguably redistributing a ported version. Avoid copying it. Write clean-room code from the behaviour spec, or get written permission. |
| motion-primitives (LICENCE.md) | MIT, (c) 2024 ibelick | OK. Keep the notice. |
| Fancy Components (danielpetho/fancy) | MIT, (c) 2024 Daniel Petho | OK. Keep the notice. |
| Magic UI | MIT (GitHub license API) | OK. Keep the notice. |
| Aceternity UI (ui.aceternity.com/licence) | Custom. End products are OK. You cannot redistribute the source, and you **cannot create themes, templates or derivative products to sell on any marketplace**. The page is written for Pro items, and it is unclear whether it covers the free ones. | **Do not use in a theme.** |
| 21st.dev community items | Per item. Scroll Expansion Hero (Arunachalam) is listed as MIT. Gooey Input on 21st (Manu Arora/Aceternity) is listed as "no-license". | Check each item. "no-license" means no rights are granted. |
| shadcn.io Paper Fold Text | No license stated | No rights are granted. Do not copy. |
| GSAP 3.15.0 (npm `license`: "Standard 'no charge' license") | Effective 2025-04-30 (scancode-licensedb copy). Free, including all plugins (SplitText, ScrollTrigger) per gsap.com/pricing. **Prohibited:** use in no-code visual animation tools that compete with Webflow's animation features, unless Webflow gives written consent. Do not remove notices. **The text does not explicitly address bundling or redistributing in themes or templates.** Webflow may change the terms. | Medium risk. The Shopify theme editor is a visual no-code tool. If merchants could build animations through settings, that could be read as near the "prohibited use" line. That is my interpretation, not legal advice. Prefer a dependency-free implementation. |
| motion 14.5.0, @hugeicons/* (React-only), react-use-measure | MIT | Not needed in a vanilla port. |

gsap.com/standard-license and /community/standard-license did not render the license text (a forum-outage placeholder), so I used the scancode-licensedb mirror and the npm metadata.

## Summary table
| File | Candidate (library) | Conf. | Deps (as observed) | Trigger / behaviour | A11y in source | Lic. |
|---|---|---|---|---|---|---|
| Split Text | SplitText (React Bits) | High | gsap, gsap/ScrollTrigger, gsap/SplitText, @gsap/react; 'use client' | In-view (ScrollTrigger once), load, hover or click; per char/word/line stagger; optional loop; hover lift/wave springs (rAF) | Honours reduced motion (skips animation); waits for fonts; no explicit aria in the component | MIT+CC |
| Shiny Text | ShinyText (React Bits) | High | React only + CSS; 'use client' | rAF-driven background-clip:text sweep; trigger loop/hover/view; IO pauses offscreen | Reduced motion stops looping; glow duplicate has aria-hidden | MIT+CC |
| Gradient Text | GradientText (React Bits) | High | React only + CSS; 'use client' | Continuous rAF gradient animation (linear/flow/conic); IO pause | Reduced motion pauses time; glow duplicate aria-hidden | MIT+CC |
| Scroll Velocity | ScrollVelocity (React Bits) | High | motion/react; 'use client' | Infinite horizontal text rows whose speed and direction follow scroll velocity; optional drag/fling | Copies after the first get aria-hidden; useReducedMotion stops motion | MIT+CC |
| Animated Content | AnimatedContent (React Bits) | High | gsap + ScrollTrigger; 'use client' | Scroll-in (or mount) translate/fade/scale/blur/rotate/tilt/wipe; optional scrub, stagger, auto-disappear | Reduced motion skips; **starts visibility:hidden until JS** | MIT+CC |
| cardnav | CardNav (React Bits) | High | React + CSS + @hugeicons; 'use client' (current version has no GSAP) | Click (or hover) burger expands a panel of link cards with spring physics (rAF); intro clip-path animation | nav aria-label, aria-expanded/controls, Esc closes and returns focus, outside click; hidden links tabIndex -1; reduced motion | MIT+CC |
| bubble | BubbleMenu (React Bits) | High | gsap; 'use client' | Toggle opens an overlay of pill links that scale in with a staggered back.out | aria-label/aria-pressed toggle, role=menu/menuitem; **no Esc, no focus management, no reduced motion** | MIT+CC |
| menu | Unclear. React Bits StaggeredMenu / FlowingMenu, or Aceternity Navbar Menu | Low | StaggeredMenu: gsap; FlowingMenu: React + hugeicons | Staggered: side panel with staggered layers. Flowing: hover marquee per row | Staggered: aria-expanded/controls, no reduced-motion check seen. Flowing: reduced-motion check, aria-current | MIT+CC / Aceternity |
| navbar2, navbatmain | No reliable match. Possibly Aceternity Resizable Navbar / Floating Navbar, or React Bits PillNav / GooeyNav | Low | Aceternity: motion, useScroll, backdrop-filter blur | Shrink/hide on scroll | No aria/role lines found in the Aceternity sources | Aceternity (avoid) |
| infiniteslider | InfiniteSlider (motion-primitives) | High | motion/react, react-use-measure, tailwind cn; 'use client' | Infinite linear loop of children (rendered twice); speed, speedOnHover, direction, reverse, gap | **None**: duplicate not aria-hidden, no reduced motion | MIT |
| discolsure | Disclosure (motion-primitives) | High | motion/react; 'use client' | Click/Enter/Space toggles; height auto/0 + opacity animation; content unmounted when closed | role=button, aria-expanded, tabIndex 0, key handling; **no aria-controls** (id generated but not linked) | MIT |
| progresivebasicblur | ProgressiveBlur (motion-primitives) | High | motion/react; 'use client' | Static stacked backdrop-filter layers with gradient masks | Layers pointer-events-none; no aria needed | MIT |
| textpercharacter | TextEffect per="char" (motion-primitives) | Med-High | motion/react; 'use client' | Mount (or `trigger` boolean) stagger reveal; presets blur/fade-in-blur/scale/fade/slide | sr-only full text + aria-hidden per char/word; no reduced-motion check | MIT |
| textloading | TextShimmer (motion-primitives) | Low-Med | motion/react | Infinite gradient shimmer across text; duration=2, spread=2 | Not inspected in depth | MIT |
| tabswithtransctition | TransitionPanel + AnimatedBackground (motion-primitives), or Aceternity Tabs | Medium | motion/react | Panel crossfade/slide on activeIndex; layoutId sliding highlight | **No tab roles/aria** in either source | MIT / Aceternity |
| letterswap | LetterSwapForward (+PingPong/Random variants) (Fancy) | High | motion/react; 'use client' | Hover: each letter slides out while a duplicate slides in, staggered | sr-only label + aria-hidden letters; mouseenter only (no focus); no reduced motion | MIT |
| elasticline | ElasticLine (Fancy) | High | motion/react, local hooks; 'use client' | Line draws in on mount; near the cursor it is grabbed and bends (quadratic SVG path), springs back on release; rAF each frame | Decorative; mouse-position based (no touch evident); no reduced motion | MIT |
| stickeyfootor | Sticky Footer demo (Fancy). Not a component, just CSS | High | Tailwind classes only | Footer is `position: sticky; bottom:0; z-index:0` beneath a relative z-10 main | N/A (demo uses li without links) | MIT |
| gooeyinput | Gooey Input (Aceternity; mirrored on 21st.dev) | High | motion; 'use client' | Click a pill with a search icon → expands into an input; SVG goo filter (feGaussianBlur + feColorMatrix); layoutId morph; clears on collapse | **input nested inside a button**; no label/aria-label; no reduced motion | Aceternity / "no-license" |
| foldtext | Paper Fold Text (shadcn.io) or Origami Fold Text (21st.dev/shadcnspace) | Low | Not documented | Per-letter top half rotateX 90°→0 on in-view (shadcn.io) | Not documented | None stated |
| Scroll Expand | Scroll Expansion Hero / `ScrollExpandMedia` (21st.dev, Arunachalam) | Medium | next, framer-motion (listing) | Media expands as the user scrolls; props seen in snippets: mediaType, mediaSrc, bgImageSrc, posterSrc, textBlend, scrollToExpand | **Source not retrieved** | MIT (listing) |
| marquee | Marquee (Magic UI) | Med-High | Tailwind keyframes, no JS animation | CSS infinite translateX; repeat=4, reverse, pauseOnHover, vertical; --duration 40s, --gap 1rem | **None**: copies not aria-hidden, no reduced motion | MIT |

## Per-component notes (observed vs. interpretation)

### Split Text: React Bits
- Observed props and defaults: `text`, `delay=50` (ms per item), `duration=1.25`, `ease`, `splitType='chars'`, `from`/`to` (default {opacity:0,y:40}→{opacity:1,y:0}), `threshold=0.1`, `rootMargin='-100px'`, `textAlign='center'`, `tag='p'`, `staggerFrom='start'`, `mask=false`, `effect='rise'` (fade|blur|flip|pop|skew|wave), `trigger='view'` (load|hover|click), `loop=false`, `loopDelay=1.5`, `hoverEffect='none'` (lift|wave), `color`, `accentColor`, `onLetterAnimationComplete`.
- Uses GSAP SplitText with `smartWrap`, `autoSplit` for lines, and `reduceWhiteSpace:false`. Hides the element (visibility hidden) until it is ready. Waits for `document.fonts`. The hover springs run a rAF loop that stops itself when idle.
- Interpretation: per-char spans hurt screen reading, translation and selection. GSAP SplitText v3.13+ has its own aria handling, but I did not verify that this session. A port should keep the original text in an aria-label or sr-only copy, mark pieces aria-hidden, re-split on resize and font load, and leave text visible when JS fails.

### Shiny Text / Gradient Text: React Bits
- ShinyText props: `text|children`, `color='#b5b5b5'`, `shineColor='#ffffff'`, `speed=2`, `delay=0`, `angle=120`, `shineWidth=40`, `softness=0.8`, `bands=1`, `glow=0`, `direction='left'`, `easing='smooth'`, `trigger='loop'`, `yoyo=false`, `followPointer=false`, `pauseOnHover=false`, `disabled=false`. It rebuilds a linear-gradient string every frame. It parses colours through a canvas 2D context.
- GradientText props: `colors=['#5227FF','#FF9FFC','#B497CF']`, `animationSpeed=8`, `variant='linear'` (flow|conic), `angle=90`, `direction`, `scale=3`, `yoyo=true`, `glow=0`, `showBorder=false`, `borderWidth=1.5`, `pauseOnHover=false`, `followPointer=false`. It writes the `--gt-gradient` custom property every frame while visible.
- Interpretation: both can be done mostly in CSS (`@property` + keyframes on background-position) with no per-frame JS. The text stays real, so a11y risk is low. Check contrast: transparent fill plus a gradient can drop below WCAG.

### Scroll Velocity: React Bits
- Props: `texts=[]`, `velocity=100`, `damping=50`, `stiffness=400`, `numCopies=6`, `velocityMapping={input:[0,1000],output:[0,5]}`, `separator=''`, `pauseOnHover=false`, `fadeEdges=false`, `skewWithVelocity=0`, `scaleWithVelocity=0`, `outlineAlternate=false`, `gap=0`, `draggable=false`, plus `fontSize`, `fontWeight`, `color`, `scrollContainerRef`. Odd-numbered rows run in reverse. Uses ResizeObserver to measure copy width.
- Interpretation: it runs a continuous rAF loop for each row, even when nothing is scrolling. A port should pause it with IntersectionObserver and `visibilitychange`, read scroll velocity from a passive scroll listener, and not run at all under reduced motion.

### Animated Content: React Bits
- Props: `distance=100`, `direction='vertical'`, `reverse=false`, `duration=0.8`, `ease='power3.out'`, `initialOpacity=0`, `animateOpacity=true`, `scale=1`, `blur=0`, `rotate=0`, `tilt=0`, `wipe='none'`, `threshold=0.1`, `delay=0`, `stagger=0`, `staggerFrom='start'`, `trigger='scroll'`, `once=true`, `scrub=false`, `disappearAfter=0`, `disappearDuration=0.5`, `disappearEase='power3.in'`, `container`. It looks up `#snap-main-container` by default.
- Interpretation: IntersectionObserver plus CSS transitions or WAAPI replaces this without GSAP. Do not hide content with `visibility:hidden` before JS runs. Use a `.js` class gate so no-JS users, crawlers and Shopify editor previews still see content. Blur filters on large blocks are costly.

### CardNav: React Bits
- Props: `logo`, `logoAlt='Logo'`, `logoHref='#'`, `items`, `cta`, `theme='dark'`, `surface='glass'` (backdrop blur(20px) saturate(1.6)), `openOn='click'`, `cardEffect='rise'` (unfold|fade), `stagger=0.12`, `bounce=0.2`, `speed=1`, `cardHeight=176`, `maxWidth=800`, `accentColor`, `menuLabel=true`, `intro=true`, `defaultOpen=false`, `open`, `onOpenChange`, `ariaLabel='Main'`. Narrow mode below 560px container width.
- Interpretation: it has the best a11y of the set. A port maps well to a `<details>` or button-plus-panel custom element. Animate height with `interpolate-size` or a measured height. Keep backdrop-filter on a single element only.

### BubbleMenu: React Bits
- Props: `logo`, `onMenuClick`, `menuAriaLabel='Toggle menu'`, `menuBg='#fff'`, `menuContentColor='#111'`, `useFixedPosition=false`, `items`, `animationEase='back.out(1.5)'`, `animationDuration=0.5`, `staggerDelay=0.12`. Rotation applies at window width ≥ 900px.
- Interpretation: role=menu is the wrong ARIA for site navigation. Use a plain list of links. A port needs Esc to close, a focus trap or return focus, `aria-expanded` instead of `aria-pressed`, and reduced-motion handling.

### Infinite Slider (motion-primitives) / Marquee (Magic UI)
- InfiniteSlider: `gap=16`, `speed=100` (px/s), `speedOnHover`, `direction='horizontal'`, `reverse=false`. Children are rendered twice. It animates translation from 0 to -(size+gap)/2.
- Marquee: `reverse=false`, `pauseOnHover=false`, `vertical=false`, `repeat=4`. CSS only.
- Interpretation: duplicate copies must be `aria-hidden` and `inert`, or links inside get focused and read twice. Pausing on hover is not enough: WCAG 2.2.2 requires a pause control for motion that runs longer than 5 s, and reduced motion should stop it. Prefer a CSS keyframe marquee (compositor transforms) over JS. Clone at runtime with JS rather than duplicating in Liquid.

### Disclosure: motion-primitives
- Props: `open=false`, `onOpenChange`, `variants`, `transition`. The content is removed from the DOM when collapsed.
- Interpretation: use native `<details>/<summary>` (plus `::details-content` and `interpolate-size` where supported). It is accessible, works without JS, and keeps content in the HTML that crawlers index.

### Progressive Blur: motion-primitives
- Props: `direction='bottom'`, `blurLayers=8`, `blurIntensity=0.25` (layer i blurs i×0.25px). Stacked masked backdrop-filter layers.
- Interpretation: 8 backdrop-filter layers over scrolling or video content is GPU-heavy, especially on low-end mobile. Cap the layer count, and avoid it over sticky headers above product grids. Firefox and older Safari differ in support. Provide a gradient fallback.

### TextEffect per char / TextShimmer / TextRoll: motion-primitives
- TextEffect props: `per='word'` (char|line), `as='p'`, `preset='fade'`, `delay=0`, `speedReveal=1`, `speedSegment=1`, `trigger=true`, `variants`, `containerTransition`, `segmentTransition`. Stagger defaults: char 0.03, word 0.05, line 0.1. Plays on mount, not in-view.
- Good pattern to copy: an sr-only copy plus aria-hidden segments. It has no reduced-motion check. In per='line' mode there is no sr-only copy, and lines are not aria-hidden.
- TextShimmer: `as='p'`, `duration=2`, `spread=2`, infinite repeat.

### Tabs with transition
- TransitionPanel: `activeIndex`, `variants {enter,center,exit}`, `transition`. AnimatePresence popLayout. AnimatedBackground: `defaultValue`, `onValueChange`, `enableHover=false`, `transition`. It uses a layoutId highlight and clones children by `data-id`.
- Aceternity Tabs: stacked-card tabs with layoutId. No roles found.
- Interpretation: none of these provide the WAI-ARIA tabs pattern (tablist/tab/tabpanel, aria-selected, arrow keys). A port must add it. Animate the indicator with transforms and panels with opacity or translate.

### Letter Swap / Elastic Line / Sticky Footer: Fancy
- LetterSwapForward: `label`, `reverse=true`, `transition={type:'spring',duration:0.7}`, `staggerDuration=0.03`, `staggerFrom='first'`. Triggers on mouseenter only.
- ElasticLine: `isVertical=false`, `grabThreshold=5`, `releaseThreshold=100`, `strokeWidth=1`, `transition={type:'spring',stiffness:300,damping:5}`, `animateInTransition={duration:0.3,ease:'easeInOut'}`.
- Sticky footer: CSS only (main `relative z-10`, at least 100vh; footer `sticky bottom-0 z-0`). The author notes the footer always sits behind content, which can interfere with pointer events and stacking.
- Interpretation: Letter swap should also run on `:focus-visible` and be CSS-only where possible (two stacked copies with translateY). Each letter is doubled in the DOM. Elastic line: replace motion's spring with a small spring in rAF that runs only while active, add touch/pointer support, and treat it as decorative (`aria-hidden`). Sticky footer: watch for content shorter than the viewport, iOS dynamic toolbar, and `overflow` on ancestors breaking sticky.

### Gooey Input: Aceternity
- Props from the docs/registry: `placeholder='Type to search...'`, `collapsedWidth=115`, `expandedWidth=200`, `expandedOffset=50`, `gooeyBlur=5`, `value`, `defaultValue=''`, `onValueChange`, `onOpenChange`, `disabled=false`, `classNames`. Filter: feGaussianBlur stdDeviation=blur, feColorMatrix alpha `20 -10`, feComposite atop. The filter wraps text as well.
- Interpretation: there are a11y bugs (input inside a button, no label). An SVG filter over animated elements re-rasterises every frame and can blur the text. Apply the filter only to background shapes, never to the text or input. Aceternity's license forbids theme use, so any port has to be clean-room.

### Scroll Expand: 21st.dev Scroll Expansion Hero
- Only the listing and usage snippets were visible. The component source did not load, so I have not verified how it handles scroll (wheel or touch interception, or scroll-jacking). Interpretation: components of this type often call preventDefault on wheel and touch to "lock" the page while the media expands. If so, that hurts a11y, keyboard scrolling and Shopify editor previews. A port should use CSS scroll-driven animations (`animation-timeline: view()`) on a tall sticky section, with an IntersectionObserver fallback.

### foldtext, textloading, menu, navbar2, navbatmain
- No confident match. Candidates above are guesses. Ask the owner for the real source or URLs.

## Pages that failed or were incomplete
- gsap.com/licensing, /pricing, /standard-license, /community/standard-license: no license text (forum-outage placeholder or marketing only). Used scancode-licensedb mirror.
- 21st.dev scroll-expansion-hero pages (3 URLs): metadata only, no source.
- 21st.dev gooey-input .md: metadata only (source obtained from ui.aceternity.com/registry/gooey-input.json instead).
- shadcn.io paper-fold-text: no props, license or a11y info.
- WebFetch refused to return verbatim source. All source was read through raw.githubusercontent.com or registry JSON with curl (display only, nothing executed or saved).

## Sources
- https://github.com/DavidHDev/react-bits (LICENSE.md; src/content/TextAnimations/{SplitText,ShinyText,GradientText,ScrollVelocity}, Animations/AnimatedContent, Components/{CardNav,BubbleMenu,StaggeredMenu,FlowingMenu,PillNav,GooeyNav})
- https://github.com/ibelick/motion-primitives (LICENCE.md; components/core/{infinite-slider,disclosure,progressive-blur,transition-panel,text-effect,text-loop,text-shimmer,animated-background,text-roll}.tsx)
- https://github.com/danielpetho/fancy (LICENSE; src/fancy/components/{physics/elastic-line,text/letter-swap-forward-anim,filter/gooey-svg-filter}.tsx; docs/blocks/sticky-footer.mdx; examples/blocks/sticky-footer-demo.tsx)
- https://github.com/magicuidesign/magicui (apps/www/public/r/marquee.json; LICENSE.md MIT)
- https://ui.aceternity.com/components/gooey-input, /registry/gooey-input.json, /registry/tabs.json, /registry/{resizable-navbar,navbar-menu,floating-navbar}.json, /licence
- https://21st.dev/@arunachalam/components/scroll-expansion-hero , https://21st.dev/@manuarora700/components/gooey-input.md
- https://www.shadcn.io/text/paper-fold-text , https://21st.dev/@shadcnspace/components/animated-text-12.md
- https://gsap.com/pricing , https://scancode-licensedb.aboutcode.org/gsap-standard-no-charge-2025.html , npm registry metadata (gsap 3.15.0, @gsap/react 2.1.2, motion 14.5.0, @hugeicons/* MIT, react-use-measure MIT)
