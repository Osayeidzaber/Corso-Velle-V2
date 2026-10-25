import { Mesh, Plane, Program, Renderer, Texture } from 'ogl';
import { cardFragment, cardVertex } from './flex-shaders';
import { createFlexLens, lensScenePoint } from './flex-lens';
import { centerCardHeight } from './flex-layout';
import { availabilityLabel } from './availability-label';

export interface FlexCarouselEngine {
  dispose(): void;
  /** Hold autoplay (e.g. while a size is chosen) without counting as an interaction. */
  setHeld(held: boolean): void;
}

export interface FlexCarouselHooks {
  /** The centred product changed. */
  onActive(index: number): void;
  /** The renderer failed after starting (e.g. lost WebGL context). */
  onFailure(): void;
}

type Intro = 'rise' | 'bloom' | 'spin' | 'deal' | 'fade' | 'none';

interface Slot {
  index: number;
  texture: Texture;
  second: Texture | null;
  aspect: number;
  loaded: boolean;
  failed: boolean;
  ready: number;
  color: number[];
  image: number[];
  secondImage: number[];
  soldOut: boolean;
  dispose: () => void;
}

interface Metrics { cardH: number; widths: number[]; centers: number[]; gap: number; loop: number }
interface Instance { index: number; x0: number; x1: number; y0: number; y1: number }
interface CardEffect { alpha: number; x: number; y: number; scale: number }
interface IntroEffects { sceneAlpha: number; strength: number; card: ((rel: number) => CardEffect) | null }
interface Draw { i: number; rel: number; x: number; y: number; cw: number; ch: number; alpha: number; emphasis: number }

/* Settings of the supplied FlexCarousel, tuned for product photography. */
const CARD_HEIGHT = .5;
const SQUEEZE = .16;
const IDLE_MS = 2200;
const CAPTION_GAP = 22;
const INTRO_DURATION: Record<string, number> = { rise: .85, bloom: .75, spin: 1, deal: .7, fade: .25 };

const wrap = (value: number, size: number) => ((((value + size / 2) % size) + size) % size) - size / 2;
const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);
const easeOut = (value: number) => 1 - Math.pow(1 - clamp01(value), 3);
const easeOutQuint = (value: number) => 1 - Math.pow(1 - clamp01(value), 5);
const easeInOut = (value: number) => {
  const t = clamp01(value);
  return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
const smooth = (value: number) => { const t = clamp01(value); return t * t * (3 - 2 * t); };const sourceOf = (image: HTMLImageElement | null | undefined) => image?.currentSrc || image?.src || '';

/**
 * The user's FlexCarousel (React/ogl) ported to the theme's custom element. Kept: progressive
 * texture loading with colour placeholders, the cyclic infinite layout, spring integration, drag
 * inertia with flick stepping, speed squeeze, entrances, the liquid lens, autoplay and rolling
 * caption digits. Browse-only storefront instances link directly to products and add center
 * emphasis. Legacy purchase-markup instances retain their existing behavior for compatibility.
 */
export function createFlexCarousel(root: HTMLElement, parentSignal: AbortSignal, hooks: FlexCarouselHooks): FlexCarouselEngine | null {
  const browseOnly = root.hasAttribute('data-browse-only');
  const viewport = root.querySelector<HTMLElement>('[data-ref="viewport"]');
  const track = root.querySelector<HTMLElement>('[data-ref="track"]');
  const purchase = root.querySelector<HTMLElement>('.product-carousel__purchase');
  const measurements = root.querySelector<HTMLElement>('[data-ref="measurements"]');
  if (!viewport || !track || parentSignal.aborted) return null;
  const slides = [...track.children] as HTMLElement[];
  const sources = slides.map((slide) => sourceOf(slide.querySelector<HTMLImageElement>('[data-card-primary-img]')));
  if (slides.length < 2 || sources.some((src) => !src)) return null;

  let renderer: Renderer;
  try {
    renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio || 1, 2), alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
  } catch { return null; }
  const gl = renderer.gl;
  const releaseContext = () => gl.getExtension('WEBGL_lose_context')?.loseContext();
  if (!renderer.isWebgl2) { releaseContext(); return null; }

  const aborter = new AbortController();
  const signal = aborter.signal;
  gl.clearColor(0, 0, 0, 0);
  const canvas = gl.canvas as HTMLCanvasElement;
  canvas.setAttribute('aria-hidden', 'true');

  // Preserve any native swipe/arrow navigation made before the renderer started.
  let initialIndex = 0; let initialDistance = Infinity;
  slides.forEach((slide, index) => {
    const distance = Math.abs(slide.offsetLeft - track.offsetLeft - viewport.scrollLeft);
    if (distance < initialDistance) { initialDistance = distance; initialIndex = index; }
  });

  const stage = document.createElement('div');
  stage.className = 'product-carousel__stage';
  stage.tabIndex = 0; stage.setAttribute('role', 'group');
  stage.setAttribute('aria-label', root.dataset.canvasLabel ?? root.getAttribute('aria-label') ?? '');
  const marker = document.createElement('span');
  marker.className = 'product-carousel__marker';
  marker.setAttribute('aria-hidden', 'true');
  // The caption follows the card: product details, rolling digits, sizes and the button.
  const caption = document.createElement('div');
  caption.className = 'product-carousel__caption';
  const counter = document.createElement('span');
  counter.className = 'product-carousel__position spec';
  counter.setAttribute('aria-hidden', 'true');
  const digitTracks: HTMLElement[] = [];
  for (let index = 0; index < Math.max(2, String(slides.length).length); index++) {
    const digit = document.createElement('span'); digit.className = 'product-carousel__digit';
    const column = document.createElement('span'); column.className = 'product-carousel__digit-strip';
    for (const number of '0123456789') {
      const cell = document.createElement('span'); cell.textContent = number; column.append(cell);
    }
    digit.append(column); counter.append(digit); digitTracks.push(column);
  }
  const total = document.createElement('span');
  total.textContent = ` / ${String(slides.length).padStart(2, '0')}`;
  counter.append(total);
  // Placeholders mark where the Liquid list and purchase block live, so teardown puts them back.
  const viewportHome = document.createComment('');
  const purchaseHome = document.createComment('');
  viewport.before(viewportHome);
  purchase?.before(purchaseHome);
  stage.append(canvas, marker, caption);
  root.insertBefore(stage, viewport);
  caption.append(viewport, counter);
  if (purchase) caption.append(purchase);
  const status = document.createElement('span'); status.className = 'visually-hidden';
  status.setAttribute('role', 'status'); status.setAttribute('aria-atomic', 'true'); root.append(status);
  const soldOutLabel = root.dataset.soldOutLabel || root.querySelector('.card__sold-out-label')?.textContent?.trim() || 'Sold out';
  const stockCanvas = slides.some(slide => slide.querySelector('.card--sold-out')) ? availabilityLabel(root, soldOutLabel) : null;
  const stockTexture = new Texture(gl, { ...(stockCanvas ? { image: stockCanvas } : {}), generateMipmaps: false, minFilter: gl.LINEAR, magFilter: gl.LINEAR });

  const cardProgram = new Program(gl, {
    vertex: cardVertex, fragment: cardFragment, transparent: true, depthTest: false, depthWrite: false,
    uniforms: {
      tMap: { value: new Texture(gl) }, tSecond: { value: new Texture(gl) },
      tAvailability: { value: stockTexture }, uAvailability: { value: stockCanvas ? 1 : 0 },
      uRect: { value: [0, 0, 1, 1] }, uResolution: { value: [1, 1] }, uSize: { value: [1, 1] },
      uImage: { value: [1, 1] }, uImage2: { value: [1, 1] }, uRadius: { value: 0 }, uAlpha: { value: 1 },
      uReady: { value: 0 }, uShift: { value: 0 }, uDpr: { value: 1 }, uPlaceholder: { value: [.5, .5, .5] },
      uHoverStyle: { value: 0 }, uReveal: { value: 0 }, uFocus: { value: 1 }, uGray: { value: 0 },
    },
  });
  cardProgram.setBlendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  if (!gl.getProgramParameter(cardProgram.program, gl.LINK_STATUS)) {
    restore(); releaseContext(); return null;
  }
  const cardMesh = new Mesh(gl, { geometry: new Plane(gl), program: cardProgram });
  let lens: ReturnType<typeof createFlexLens> | null = null;
  try {
    if (browseOnly) lens = createFlexLens(renderer);
    if (lens && !lens.linked) { lens.dispose(); restore(); releaseContext(); return null; }
  } catch { restore(); releaseContext(); return null; }
  let lensStrength = 0;
  const anisotropy = renderer.getExtension('EXT_texture_filter_anisotropic') ? 8 : 0;
  const uniforms = cardProgram.uniforms as Record<string, { value: unknown }>;

  let slots: Slot[] = [];
  let loadingTimer = 0;
  let width = 1; let height = 1;
  let pos = 0; let vel = 0; let goal = 0; let mode = 'spring'; let wheelAt = 0;
  let raf = 0; let last = performance.now(); let visible = false; let alive = true; let dirty = true;
  let activeIndex = -1; let interactedAt = -Infinity; let autoplayAt = performance.now();
  let hasFocus = false; let held = false; let userPaused = false;
  let layout: Metrics | null = null; let resnap = true; let hover = ''; let lift = 1;
  let energy = 0; let lastPos = 0; let captionSpace = 0; let detailsSpace = 0; let homeY = 0; let captionTop = -1;
  let hoverIndex = -1;
  let flowVelocity = 0;
  const reveal = slides.map(() => 0);
  const settings = {
    intro: (root.dataset.intro ?? 'rise') as Intro,
    autoplay: root.hasAttribute('data-autoplay'),
    interval: Math.min(10, Math.max(1, Number(root.dataset.interval) || (browseOnly ? 1.5 : 3))),
    // Keep response speed separate from the configured time spent reading each product.
    stiffness: (browseOnly ? 320 : 140) * Math.max(10, Math.min(80, Number(root.getAttribute('speed')) || 35)) / 35,
    speedScale: Math.max(10, Math.min(80, Number(root.getAttribute('speed')) || 35)) / 35,
  };
  const pointer = { x: 0, y: 0, over: false, down: false, id: -1, startX: 0, startY: 0, startPos: 0, dragging: false, touch: false, samples: [] as { x: number; t: number }[] };
  const introState = { kind: 'none' as Intro, t: 0, running: false, done: false, readyAt: performance.now() };
  const focus = { index: -1, pending: -1, t: 0, v: 0, target: 0 };
  let instances: Instance[] = [];
  const pause = root.querySelector<HTMLButtonElement>('[data-carousel-pause]');
  if (pause) {
    // A fresh start always plays: reset a label left from a pause before the section reloaded.
    pause.hidden = !settings.autoplay;
    pause.setAttribute('aria-pressed', 'false');
    const label = pause.querySelector('[data-carousel-pause-label]');
    if (label) label.textContent = pause.dataset.pauseLabel ?? label.textContent;
  }
  root.toggleAttribute('data-autoplay-on', settings.autoplay);

  function restore(): void {
    viewportHome.replaceWith(viewport!);
    if (purchase) purchaseHome.replaceWith(purchase);
    else purchaseHome.remove();
    stage.remove(); status.remove(); aborter.abort();
  }

  const loadSlot = (slide: HTMLElement, index: number): Slot => {
    const texture = new Texture(gl, { generateMipmaps: true, minFilter: gl.LINEAR_MIPMAP_LINEAR, magFilter: gl.LINEAR, anisotropy });
    const slot: Slot = {
      index, texture, second: null, aspect: .8, loaded: false, failed: false, ready: 0,
      color: [.5, .5, .5], image: [1, 1], secondImage: [1, 1],
      soldOut: Boolean(slide.querySelector('.card--sold-out')), dispose: () => {},
    };
    const primary = slide.querySelector<HTMLImageElement>('[data-card-primary-img]');
    const ratio = Number(primary?.getAttribute('width')) / Number(primary?.getAttribute('height'));
    if (Number.isFinite(ratio) && ratio > 0) slot.aspect = ratio;
    const image = new Image();
    image.crossOrigin = 'anonymous'; image.decoding = 'async';
    image.onload = () => {
      if (!alive || !slots.includes(slot)) return;
      texture.image = image;
      texture.needsUpdate = true;
      slot.image = [image.naturalWidth || 1, image.naturalHeight || 1];
      slot.aspect = slot.image[0]! / slot.image[1]!;
      try {
        const probe = document.createElement('canvas'); probe.width = 8; probe.height = 8;
        const context = probe.getContext('2d', { willReadFrequently: true });
        if (context) {
          context.drawImage(image, 0, 0, 8, 8);
          const data = context.getImageData(0, 0, 8, 8).data;
          const avg = [0, 0, 0];
          for (let i = 0; i < data.length; i += 4) { avg[0]! += data[i]!; avg[1]! += data[i + 1]!; avg[2]! += data[i + 2]!; }
          slot.color = avg.map((v) => v / 64 / 255);
        }
      } catch { slot.color = [.5, .5, .5]; }
      slot.loaded = true; dirty = true; start();
      if (index === initialIndex) window.clearTimeout(loadingTimer);
    };
    // A CORS/texture failure must restore the real image rail, not leave an empty GPU card.
    image.onerror = () => { if (alive) fail(); };
    image.src = sourceOf(primary);
    // Optional second photograph for the product card's hover curtain.
    const secondSrc = sourceOf(slide.querySelector<HTMLImageElement>('.card__secondary'));
    let secondImage: HTMLImageElement | null = null;
    if (secondSrc) {
      secondImage = new Image();
      secondImage.crossOrigin = 'anonymous'; secondImage.decoding = 'async';
      secondImage.onload = () => {
        if (!alive || !slots.includes(slot) || !secondImage) return;
        slot.second = new Texture(gl, { image: secondImage, generateMipmaps: true, minFilter: gl.LINEAR_MIPMAP_LINEAR, magFilter: gl.LINEAR, anisotropy });
        slot.secondImage = [secondImage.naturalWidth || 1, secondImage.naturalHeight || 1];
        dirty = true; start();
      };
      secondImage.src = secondSrc;
    }
    slot.dispose = () => {
      image.onload = null; image.onerror = null;
      if (secondImage) secondImage.onload = null;
      gl.deleteTexture(texture.texture);
      if (slot.second) gl.deleteTexture(slot.second.texture);
    };
    return slot;
  };

  /** Card height, leaving room below for the caption (details, sizes and button). */
  const metrics = (): Metrics => {
    const sceneHeight = height - detailsSpace;
    const room = sceneHeight - captionSpace - CAPTION_GAP - 16;
    const gap = browseOnly ? ({ compact: 8, airy: 24 }[root.dataset.gap ?? ''] ?? 12) : width < 600 ? 12 : 16;
    const cardH = browseOnly ? centerCardHeight(width, sceneHeight, slots.map(slot => slot.aspect), gap, Number(root.dataset.centerProducts) || 4)
      : Math.max(24, Math.min(CARD_HEIGHT * sceneHeight, room * .8));
    homeY = browseOnly ? sceneHeight / 2 : 8 + room / 2;
    const widths = slots.map((slot) => slot.aspect * cardH);
    const centers: number[] = [];
    let cursor = 0;
    for (const cardWidth of widths) { centers.push(cursor + cardWidth / 2); cursor += cardWidth + gap; }
    return { cardH, widths, centers, gap, loop: Math.max(cursor, 1) };
  };
  const nearest = (m: Metrics, at: number) => {
    let best = 0; let bestDist = Infinity;
    for (let i = 0; i < m.centers.length; i++) {
      const dist = Math.abs(wrap(m.centers[i]! - at, m.loop));
      if (dist < bestDist) { bestDist = dist; best = i; }
    }
    return best;
  };
  const snapPoint = (m: Metrics, at: number) => at + wrap(m.centers[nearest(m, at)]! - at, m.loop);
  const remap = (from: Metrics, to: Metrics, at: number) => {
    const i = nearest(from, at);
    const offset = wrap(at - from.centers[i]!, from.loop);
    const cycles = Math.round((at - offset - from.centers[i]!) / from.loop);
    return cycles * to.loop + to.centers[i]! + offset * (to.widths[i]! / from.widths[i]!);
  };
  const step = (m: Metrics, delta: number) => {
    let at = snapPoint(m, goal);
    let index = nearest(m, at);
    const n = m.centers.length;
    for (let k = 0; k < Math.abs(delta); k++) {
      const next = (index + (delta > 0 ? 1 : n - 1)) % n;
      at += delta > 0 ? m.widths[index]! / 2 + m.gap + m.widths[next]! / 2 : -(m.widths[next]! / 2 + m.gap + m.widths[index]! / 2);
      index = next;
    }
    goal = at; mode = 'spring'; dirty = true; start();
  };
  const goTo = (m: Metrics, index: number) => {
    const i = ((index % m.centers.length) + m.centers.length) % m.centers.length;
    goal = goal + wrap(m.centers[i]! - goal, m.loop);
    mode = 'spring'; dirty = true; start();
  };
  const openFocus = (index: number) => {
    focus.index = index; focus.pending = -1; focus.target = 1;
    root.setAttribute('data-focus-open', ''); dirty = true; start();
  };
  const closeFocus = () => {
    focus.pending = -1;
    if (focus.target === 0) return false;
    focus.target = 0; root.removeAttribute('data-focus-open'); dirty = true; start();
    return true;
  };
  const skipIntro = () => {
    introState.running = false; introState.done = true; introState.t = 1;
    root.setAttribute('data-revealed', '');
  };

  const introEffects = (): IntroEffects => {
    const t = introState.running ? introState.t : introState.done ? 1 : 0;
    const e: IntroEffects = { sceneAlpha: 1, strength: 1, card: null };
    if (!introState.done && !introState.running) { e.sceneAlpha = 0; e.strength = 0; return e; }
    if (t >= 1) return e;
    const kind = introState.kind;
    if (kind === 'rise') {
      e.strength = easeInOut((t - .3) / .65);
      e.card = (rel) => {
        const delay = Math.min(Math.abs(rel) / (width * .6), 1) * .34;
        const local = clamp01((t - delay) / .6);
        return { alpha: clamp01(local * 4), x: 0, y: (1 - easeOutQuint(local)) * height * .62, scale: .5 + .5 * easeInOut((local - .18) / .82) };
      };
    } else if (kind === 'bloom') {
      e.strength = easeInOut((t - .2) / .8);
      e.card = (rel) => {
        const delay = Math.min(Math.abs(rel) / (width * .6), 1) * .25;
        const local = easeOut((t - delay) / .55);
        return { alpha: local, x: 0, y: 0, scale: .92 + .08 * local };
      };
    } else if (kind === 'spin') {
      e.sceneAlpha = easeOut(t / .25);
      e.strength = easeOut((t - .55) / .45);
    } else if (kind === 'deal') {
      e.strength = easeOut((t - .45) / .5);
      e.card = (rel) => {
        const spread = Math.min(Math.abs(rel) / (width * .6), 1) * .3;
        const local = easeOut((t - .12 - spread) / .5);
        return { alpha: easeOut((t - spread) / .12), x: -rel * (1 - local), y: 0, scale: 1 };
      };
    } else {
      e.sceneAlpha = easeOut(t);
      e.strength = easeOut(t);
    }
    return e;
  };
  const beginIntro = (m: Metrics) => {
    introState.kind = INTRO_DURATION[settings.intro] ? settings.intro : 'none';
    introState.running = introState.kind !== 'none';
    introState.done = !introState.running;
    introState.t = 0;
    if (introState.done) root.setAttribute('data-revealed', '');
    if (introState.kind === 'spin') {
      const distance = m.loop * 1.6 + width;
      pos = goal + distance; vel = -distance * 3; mode = 'spring';
    }
  };

  const measureCaption = () => {
    // Grow space below the scene for measurements instead of shrinking cards/moving size buttons
    // when the pointer previews a size. Include the purchase grid's extra gap for the visible row.
    const details = measurements && !measurements.hidden ? measurements.offsetHeight + 12 : 0;
    if (details !== detailsSpace) {
      detailsSpace = details;
      stage.style.setProperty('--carousel-details-height', `${details}px`);
      dirty = true; start();
    }
    // Reserve the tallest caption seen, so the cards don't resize from product to product.
    const next = Math.max(captionSpace, Math.ceil(caption.offsetHeight - details));
    if (next !== captionSpace) { captionSpace = next; dirty = true; start(); }
  };
  const resize = () => {
    if (browseOnly) stage.style.setProperty('--carousel-viewport-width', `${document.documentElement.clientWidth || window.innerWidth}px`);
    width = Math.max(1, stage.clientWidth); height = Math.max(1, stage.clientHeight);
    renderer.dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(4.5e6 / (width * height)));
    renderer.setSize(width, height);
    lens?.resize(width, height);
    captionSpace = 0; measureCaption();
    dirty = true; start();
  };

  const setActive = (index: number) => {
    activeIndex = index;
    slides.forEach((slide, i) => { slide.hidden = i !== index; slide.setAttribute('aria-label', `${i + 1} / ${slides.length}`); });
    String(index + 1).padStart(digitTracks.length, '0').split('').forEach((digit, i) => { digitTracks[i]!.style.transform = `translateY(${-Number(digit) * 10}%)`; });
    const title = slides[index]?.querySelector('.card__title')?.textContent?.trim() ?? '';
    status.textContent = `${title}, ${slots[index]?.soldOut ? `${soldOutLabel}, ` : ''}${index + 1} / ${slides.length}`;
    hooks.onActive(index);
    measureCaption();
  };

  const frame = (now: number) => {
    raf = 0;
    if (!alive) return;
    const dt = Math.min(.05, Math.max(.001, (now - last) / 1000));
    last = now;
    const m = metrics();
    const n = slots.length;
    let animating = false;

    if (resnap) {
      goal = snapPoint(m, m.centers[initialIndex] ?? 0); pos = goal; vel = 0; resnap = false;
    } else if (layout && (layout.loop !== m.loop || layout.cardH !== m.cardH)) {
      pos = remap(layout, m, pos); goal = remap(layout, m, goal);
      pointer.startPos = pos + (pointer.x - pointer.startX);
      animating = true;
    }
    layout = m;

    if (!introState.running && !introState.done) {
      // Unloaded offscreen images must not hold up the visible carousel.
      const primary = slots[initialIndex];
      if (primary?.loaded || primary?.failed || now - introState.readyAt > 600) { goal = snapPoint(m, goal); pos = goal; beginIntro(m); }
    }
    if (introState.running) {
      introState.t = Math.min(1, introState.t + dt / ((INTRO_DURATION[introState.kind] || 1) * (browseOnly ? .55 : 1)));
      if (introState.t >= 1) { introState.running = false; introState.done = true; root.setAttribute('data-revealed', ''); }
      animating = true;
    }

    if (mode === 'wheel' && now - wheelAt > 150) { goal = snapPoint(m, goal); mode = 'spring'; }
    const playing = settings.autoplay && !userPaused && !held && introState.done && focus.target === 0 && focus.t < .01
      && (browseOnly || !pointer.over) && !pointer.down && !hasFocus;
    const flow = browseOnly && playing && !pointer.dragging && now - interactedAt > 900
      && (mode === 'flow' || (mode === 'spring' && Math.abs(goal - pos) < 1));
    if (flow) {
      // Continuous travel: no snap-to-center or reading-time dwell between products.
      const targetVelocity = m.loop / n / settings.interval * settings.speedScale;
      flowVelocity += (targetVelocity - flowVelocity) * (1 - Math.exp(-dt / .14));
      pos += flowVelocity * dt; goal = pos; vel = 0; mode = 'flow'; animating = true;
    } else {
      if (mode === 'flow') { mode = 'spring'; goal = pos; vel = 0; }
      flowVelocity = 0;
    }
    if (!flow && !pointer.dragging) {
      const spinning = introState.running && introState.kind === 'spin';
      const stiffness = spinning ? 24 : mode === 'wheel' ? Math.max(160, settings.stiffness) : settings.stiffness;
      const damping = 2 * Math.sqrt(stiffness);
      const steps = Math.ceil(dt / (1 / 240)); const h = dt / steps;
      for (let i = 0; i < steps; i++) { vel += (stiffness * (goal - pos) - damping * vel) * h; pos += vel * h; }
      if (Math.abs(goal - pos) < .05 && Math.abs(vel) < .5) { pos = goal; vel = 0; } else animating = true;
    } else if (pointer.dragging) animating = true;

    if (Math.abs(pos) > m.loop * 8) {
      const shift = Math.round(pos / m.loop) * m.loop;
      pos -= shift; goal -= shift; pointer.startPos -= shift;
    }

    const current = nearest(m, pos);
    if (current !== activeIndex) setActive(current);

    if (focus.pending >= 0 && mode === 'spring' && Math.abs(goal - pos) < 1.5 && Math.abs(vel) < 30) {
      if (current === focus.pending) openFocus(current); else focus.pending = -1;
    }

    const settledNow = mode === 'spring' && Math.abs(goal - pos) < 1;
    const idleMs = browseOnly ? 900 : IDLE_MS;
    if (!browseOnly && playing && settledNow && now - interactedAt > idleMs && now - autoplayAt > settings.interval * 1000) {
      autoplayAt = now; step(m, 1);
    }
    if (settings.autoplay && playing) animating = true;
    // The highlight underline fills while autoplay waits on this product.
    const due = Math.max(autoplayAt + settings.interval * 1000, interactedAt + idleMs);
    const progress = playing && settledNow ? clamp01((now - autoplayAt) / Math.max(1, due - autoplayAt)) : playing ? 0 : 1;
    marker.style.setProperty('--progress', browseOnly ? '1' : progress.toFixed(3));

    const travel = Math.abs(pos - lastPos) / dt;
    lastPos = pos;
    const energyTarget = Math.min(travel / 2600, 1);
    energy += (energyTarget - energy) * (1 - Math.exp(-dt / (energyTarget > energy ? .07 : .35)));
    if (energy > .001) animating = true;

    const focusStiffness = 64;
    focus.v += (focusStiffness * (focus.target - focus.t) - 2 * Math.sqrt(focusStiffness) * focus.v) * dt;
    focus.t += focus.v * dt;
    if (Math.abs(focus.target - focus.t) < .0005 && Math.abs(focus.v) < .001) { focus.t = focus.target; focus.v = 0; } else animating = true;
    const focusAmount = clamp01(focus.t);
    const focusEase = easeInOut(focusAmount);
    const focusW = focus.index >= 0 && focus.index < n ? m.widths[focus.index]! : m.cardH;
    // The pop-up grows the card as far as the caption below (and the stage top) allow.
    const roomScale = Math.min((height - detailsSpace - captionSpace - CAPTION_GAP - 8 - homeY) * 2 / m.cardH, (homeY - 8) * 2 / m.cardH);
    const focusScale = Math.max(1, Math.min(1.3, roomScale, (width * .92) / focusW));
    lift = 1 + (focusScale - 1) * focusEase;

    // Hover curtain, timed like the product card's CSS curtain (700ms in, quicker out).
    reveal.forEach((value, index) => {
      const target = index === hoverIndex && !pointer.dragging && slots[index]?.second ? 1 : 0;
      if (value === target) return;
      reveal[index] = target ? Math.min(1, value + dt / .7) : Math.max(0, value - dt / .5);
      animating = true;
    });

    const effects = introEffects();
    const homeX = width / 2;
    for (const slot of slots) {
      if (slot.loaded && slot.ready < 1) { slot.ready = Math.min(1, slot.ready + dt / (browseOnly ? .24 : .45)); animating = true; }
    }

    const waiting = !introState.done;
    if (dirty || animating || pointer.dragging) {
      dirty = false;
      instances = [];
      const dpr = renderer.dpr;
      uniforms.uResolution!.value = [width, height];
      uniforms.uDpr!.value = dpr;
      const shrink = 1 - SQUEEZE * energy;
      const reach = width * (width < 600 ? .6 : .45);
      const draws: Draw[] = [];
      for (let i = 0; i < n; i++) {
        const w = m.widths[i]!;
        const baseRel = wrap(m.centers[i]! - pos, m.loop);
        for (let k = -3; k <= 3; k++) {
          const rel = baseRel + k * m.loop;
          if (Math.abs(rel) - w / 2 > width + 40) continue;
          const fx = effects.card ? effects.card(rel) : null;
          let x = homeX + rel + (fx ? fx.x : 0);
          // Uniform scale only: proportions never change, the strip is never bent.
          let scale = shrink * (fx ? fx.scale : 1);
          let alpha = (fx ? fx.alpha : 1) * (lens ? 1 : effects.sceneAlpha);
          if (focusAmount > 0) {
            if (i === focus.index && Math.abs(rel) < w) scale *= 1 + (focusScale - 1) * focusEase;
            else {
              const order = Math.min(Math.abs(rel) / width, 1) * .25;
              const part = easeInOut(focusAmount * 1.25 - order);
              x += Math.sign(rel) * part * width * .7;
              alpha *= 1 - part;
            }
          }
          const cw = w * scale;
          if (alpha <= .001 || x + cw / 2 < -40 || x - cw / 2 > width + 40) continue;
          draws.push({ i, rel, x, y: homeY + (fx ? fx.y : 0), cw, ch: m.cardH * scale, alpha, emphasis: 1 - smooth(Math.abs(rel) / reach) });
        }
      }
      draws.sort((a, b) => Math.abs(b.rel) - Math.abs(a.rel));
      renderer.bindFramebuffer(lens?.target);
      gl.viewport(0, 0, lens?.target.width ?? gl.canvas.width, lens?.target.height ?? gl.canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);
      for (const draw of draws) {
        const slot = slots[draw.i]!;
        uniforms.tMap!.value = slot.texture;
        uniforms.tSecond!.value = slot.second ?? slot.texture;
        uniforms.uRect!.value = [draw.x, draw.y, draw.cw + 2, draw.ch + 2];
        uniforms.uSize!.value = [draw.cw, draw.ch];
        uniforms.uImage!.value = slot.image;
        uniforms.uImage2!.value = slot.second ? slot.secondImage : slot.image;
        uniforms.uAlpha!.value = draw.alpha;
        uniforms.uReady!.value = slot.ready;
        uniforms.uShift!.value = Math.max(-1, Math.min(1, draw.rel / (width * .75)));
        uniforms.uPlaceholder!.value = slot.color;
        uniforms.uHoverStyle!.value = ['blur', 'fade', 'zoom', 'slide', 'curtain'].indexOf(slides[draw.i]?.querySelector<HTMLElement>('[data-hover-animation]')?.dataset.hoverAnimation ?? 'blur');
        uniforms.uReveal!.value = slot.second ? easeOut(reveal[draw.i]!) : 0;
        uniforms.uFocus!.value = root.hasAttribute('data-no-emphasis') || (focusAmount > 0 && draw.i === focus.index) ? 1 : draw.emphasis;
        uniforms.uGray!.value = slot.soldOut ? 1 : 0;
        renderer.render({ scene: cardMesh, target: lens?.target, clear: false });
        instances.push({ index: draw.i, x0: draw.x - draw.cw / 2, x1: draw.x + draw.cw / 2, y0: draw.y - draw.ch / 2, y1: draw.y + draw.ch / 2 });
      }
      lensStrength = effects.strength;
      lens?.render(width, height, lensStrength, effects.sceneAlpha);
      // Highlight underline and caption ride just below the centred card, also during the pop-up.
      const centre = draws.length ? draws.reduce((best, item) => (Math.abs(item.rel) < Math.abs(best.rel) ? item : best)) : null;
      if (centre) {
        marker.style.width = `${centre.cw}px`;
        marker.style.transform = `translate3d(${(centre.x - centre.cw / 2).toFixed(1)}px, ${(centre.y + centre.ch / 2 + 8).toFixed(1)}px, 0)`;
        marker.style.opacity = String(clamp01(1 - Math.abs(centre.rel) / (centre.cw * .5)) * centre.alpha);
      }
      const top = Math.round(homeY + (m.cardH * lift) / 2 + CAPTION_GAP);
      if (top !== captionTop) { captionTop = top; caption.style.transform = `translate3d(0, ${top}px, 0)`; }
    }

    let nextHover = '';
    if (pointer.over && !pointer.dragging && introState.done) {
      const [hitX, hitY] = lens ? lensScenePoint(pointer.x, pointer.y, width, height, lensStrength) : [pointer.x, pointer.y];
      const hit = instances.find((inst) => hitX >= inst.x0 && hitX <= inst.x1 && hitY >= inst.y0 && hitY <= inst.y1);
      if (browseOnly && hit) nextHover = 'product';
      else if (focus.target > 0) nextHover = 'close';
      else if (hit) nextHover = 'open';
      const index = hit?.index ?? -1;
      if (index !== hoverIndex) { hoverIndex = index; animating = true; }
    } else if (hoverIndex >= 0) { hoverIndex = -1; animating = true; }
    if (nextHover !== hover) {
      hover = nextHover;
      if (hover) stage.setAttribute('data-hover', hover); else stage.removeAttribute('data-hover');
    }

    if (visible && !document.hidden && (animating || waiting || dirty || pointer.down)) raf = requestAnimationFrame(safeFrame);
  };

  function safeFrame(now: number): void {
    try { frame(now); } catch { fail(); }
  }

  function start(): void {
    if (raf || !visible || !alive || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(safeFrame);
  }

  const localPoint = (event: PointerEvent) => { const rect = stage.getBoundingClientRect(); return [event.clientX - rect.left, event.clientY - rect.top] as const; };
  const inCaption = (event: Event) => caption.contains(event.target as Node);
  const visitProduct = (index: number) => slides[index]?.querySelector<HTMLAnchorElement>('a.card__title, a[href]')?.click();

  stage.addEventListener('pointerdown', (event) => {
    if ((event.button !== undefined && event.button > 0) || inCaption(event)) return;
    skipIntro();
    const [x, y] = localPoint(event);
    Object.assign(pointer, { down: true, id: event.pointerId, touch: event.pointerType === 'touch', startX: x, startY: y, x, y, startPos: pos, dragging: false, samples: [{ x, t: performance.now() }] });
    interactedAt = performance.now();
    if (Math.abs(vel) > 40) { goal = pos; vel = 0; }
    dirty = true; start();
  }, { signal });
  stage.addEventListener('pointermove', (event) => {
    const [x, y] = localPoint(event);
    pointer.x = x; pointer.y = y;
    pointer.over = !inCaption(event) && event.pointerType === 'mouse';
    if (pointer.down && event.pointerId === pointer.id) {
      const dx = x - pointer.startX; const dy = y - pointer.startY; const slop = pointer.touch ? 10 : 5;
      if (!pointer.dragging) {
        if (pointer.touch && Math.abs(dy) > slop && Math.abs(dy) > Math.abs(dx)) { pointer.down = false; return; }
        if (Math.abs(dx) > slop) {
          pointer.dragging = true; pointer.startX = x; pointer.startPos = pos;
          closeFocus();
          try { stage.setPointerCapture(event.pointerId); } catch { /* capture is optional */ }
          stage.setAttribute('data-dragging', '');
        }
      }
      if (pointer.dragging) {
        pos = pointer.startPos - (x - pointer.startX); goal = pos; vel = 0;
        const now = performance.now();
        pointer.samples.push({ x, t: now });
        while (pointer.samples.length > 2 && now - pointer.samples[0]!.t > 100) pointer.samples.shift();
      }
    }
    dirty = true; start();
  }, { signal });
  stage.addEventListener('pointerup', (event) => {
    if (!pointer.down || event.pointerId !== pointer.id) return;
    pointer.down = false;
    stage.removeAttribute('data-dragging');
    const m = metrics();
    interactedAt = performance.now();
    if (pointer.dragging) {
      pointer.dragging = false;
      const now = performance.now();
      const first = pointer.samples[0]; const end = pointer.samples.at(-1);
      let velocity = 0;
      if (first && end && end.t > first.t && now - end.t < 70) velocity = -((end.x - first.x) / (end.t - first.t)) * 1000;
      vel = velocity;
      const landing = snapPoint(m, pos + velocity * .32);
      goal = landing;
      if (Math.abs(velocity) > 400 && Math.abs(landing - pos) < 1) step(m, velocity > 0 ? 1 : -1);
      mode = 'spring'; start();
      return;
    }
    if (closeFocus()) return;
    const [localX, localY] = localPoint(event);
    const [x, y] = lens ? lensScenePoint(localX, localY, width, height, lensStrength) : [localX, localY];
    const hit = instances.find((inst) => x >= inst.x0 && x <= inst.x1 && y >= inst.y0 && y <= inst.y1);
    if (!hit) return;
    if (browseOnly) { visitProduct(hit.index); return; }
    // Clicking the centred product pops it up; clicking a neighbour brings it to the centre first.
    if (hit.index === activeIndex && Math.abs(goal - pos) < 2) openFocus(hit.index);
    else {
      const rel = (hit.x0 + hit.x1) / 2 - width / 2;
      goal = snapPoint(m, pos + rel); mode = 'spring'; focus.pending = hit.index; start();
    }
  }, { signal });
  stage.addEventListener('pointerleave', () => { pointer.over = false; dirty = true; start(); }, { signal });
  const cancelPointer = () => {
    pointer.down = false; pointer.dragging = false; stage.removeAttribute('data-dragging');
    goal = snapPoint(metrics(), pos); mode = 'spring'; start();
  };
  stage.addEventListener('pointercancel', cancelPointer, { signal });
  stage.addEventListener('lostpointercapture', () => { if (pointer.down) cancelPointer(); }, { signal });
  stage.addEventListener('wheel', (event) => {
    if (event.ctrlKey) return;
    let dx = event.deltaX; let dy = event.deltaY;
    if (event.shiftKey && Math.abs(dx) < Math.abs(dy)) { dx = dy; dy = 0; }
    // In a page, only a horizontal gesture steers the strip; vertical scrolling keeps scrolling.
    if (Math.abs(dx) <= Math.abs(dy)) return;
    event.preventDefault(); skipIntro();
    interactedAt = performance.now();
    if (closeFocus()) return;
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height : 1;
    goal += Math.max(-120, Math.min(120, dx * unit)) * 1.25;
    mode = 'wheel'; wheelAt = performance.now(); start();
  }, { passive: false, signal });
  stage.addEventListener('keydown', (event) => {
    if (inCaption(event)) return;
    const m = metrics();
    if (event.key === 'ArrowRight') { event.preventDefault(); skipIntro(); closeFocus(); interactedAt = performance.now(); step(m, 1); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); skipIntro(); closeFocus(); interactedAt = performance.now(); step(m, -1); }
    else if (event.key === 'Home') { event.preventDefault(); skipIntro(); closeFocus(); interactedAt = performance.now(); goTo(m, 0); }
    else if (event.key === 'End') { event.preventDefault(); skipIntro(); closeFocus(); interactedAt = performance.now(); goTo(m, slots.length - 1); }
    else if (event.key === 'Escape') { if (closeFocus()) event.preventDefault(); }
    else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (closeFocus() || activeIndex < 0) return;
      if (browseOnly) visitProduct(activeIndex); else openFocus(activeIndex);
    }
  }, { signal });
  root.addEventListener('click', (event) => {
    const control = (event.target as Element).closest<HTMLElement>('[data-carousel-step], [data-carousel-pause]');
    if (!control) return;
    if (control.hasAttribute('data-carousel-pause')) {
      userPaused = !userPaused; control.setAttribute('aria-pressed', String(userPaused));
      if (browseOnly && !userPaused) hasFocus = false; // Explicit play also works from a focused keyboard button.
      const label = control.querySelector('[data-carousel-pause-label]');
      if (label) label.textContent = (userPaused ? control.dataset.playLabel : control.dataset.pauseLabel) ?? '';
      autoplayAt = performance.now(); start();
    } else {
      skipIntro(); closeFocus(); interactedAt = performance.now(); step(metrics(), Number(control.dataset.carouselStep));
    }
  }, { signal });
  // Pause while a mouse is over the purchase area or keyboard focus is anywhere in the carousel.
  caption.addEventListener('pointerenter', (event) => { if (event.pointerType === 'mouse') { pointer.over = true; start(); } }, { signal });
  caption.addEventListener('pointerleave', () => { pointer.over = false; start(); }, { signal });
  // Hold a title/price link steady during an intentional click, without stopping on passive hover.
  if (browseOnly) caption.addEventListener('pointerdown', () => { interactedAt = performance.now(); start(); }, { signal });
  root.addEventListener('focusin', (event) => { hasFocus = (event.target as Element).matches(':focus-visible'); start(); }, { signal });
  if (browseOnly) {
    // Track input intent too: :focus-visible can change without another focusin on the same stage.
    root.addEventListener('pointerdown', () => { hasFocus = false; start(); }, { signal });
    root.addEventListener('keydown', () => { hasFocus = true; start(); }, { signal });
  }
  root.addEventListener('focusout', (event) => {
    const next = event.relatedTarget as Element | null;
    hasFocus = Boolean(next && root.contains(next) && next.matches(':focus-visible')); start();
  }, { signal });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { dirty = true; start(); } }, { signal });
  canvas.addEventListener('webglcontextlost', (event) => { event.preventDefault(); fail(); }, { signal });

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(stage);
  if (browseOnly) window.addEventListener('resize', resize, { signal });
  const captionObserver = new ResizeObserver(measureCaption);
  captionObserver.observe(caption);
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    // Offscreen WebGL drawing buffers may be discarded: repaint even when paused/held.
    if (visible) { dirty = true; start(); } else { cancelAnimationFrame(raf); raf = 0; }
  });
  intersection.observe(stage);

  let disposed = false;
  function dispose(): void {
    if (disposed) return;
    disposed = true; alive = false; visible = false;
    cancelAnimationFrame(raf);
    window.clearTimeout(loadingTimer);
    resizeObserver.disconnect(); captionObserver.disconnect(); intersection.disconnect();
    parentSignal.removeEventListener('abort', dispose);
    slots.forEach((slot) => slot.dispose()); slots = [];
    gl.deleteTexture(stockTexture.texture);
    lens?.dispose();
    slides.forEach((slide) => { slide.hidden = false; slide.removeAttribute('aria-label'); });
    caption.style.transform = '';
    for (const name of ['data-effect-ready', 'data-ready', 'data-autoplay-on', 'data-revealed', 'data-focus-open']) root.removeAttribute(name);
    restore();
    releaseContext();
  }
  function fail(): void { if (!disposed) { dispose(); hooks.onFailure(); } }

  slots = slides.map(loadSlot);
  // A stalled texture request should not leave the shopping surface on placeholders forever.
  loadingTimer = window.setTimeout(() => { if (alive && !slots[initialIndex]?.loaded) fail(); }, 8000);
  root.setAttribute('data-effect-ready', ''); root.setAttribute('data-ready', '');
  root.querySelectorAll<HTMLButtonElement>('[data-carousel-step]').forEach((button) => button.disabled = false);
  setActive(initialIndex);
  resize();
  parentSignal.addEventListener('abort', dispose, { once: true });
  return {
    dispose,
    setHeld(value: boolean) {
      held = value;
      if (!value) autoplayAt = performance.now();
      dirty = true; start();
    },
  };
}
