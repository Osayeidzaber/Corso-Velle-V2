import { Mesh, Plane, Program, Renderer, Texture } from 'ogl';
import { cardFragment, cardVertex } from './flex-shaders';

export interface FlexCarouselEngine {
  dispose(): void;
  /** Hold autoplay (e.g. while a size is chosen) without counting as an interaction. */
  setHeld(held: boolean): void;
}

export interface FlexCarouselHooks {
  /** The centred product changed. */
  onActive(index: number): void;
  /** The centred product was clicked or Enter was pressed. */
  onSelect(index: number): void;
  /** The renderer failed after starting (e.g. lost WebGL context). */
  onFailure(): void;
}

const wrap = (v: number, size: number) => (((v + size / 2) % size + size) % size) - size / 2;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOut = (v: number) => 1 - Math.pow(1 - clamp01(v), 5);
const smooth = (v: number) => { const t = clamp01(v); return t * t * (3 - 2 * t); };
type Metrics = { height: number; widths: number[]; centers: number[]; gap: number; loop: number };
type Instance = { index: number; x: number; y: number; width: number; height: number; rel: number; alpha: number };

/** Autoplay: the first step waits this long after a customer's input, then one product per interval. */
const IDLE_MS = 3500;
const INTERVAL_MS = 5000;

function loadImage(src: string, signal: AbortSignal): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src || signal.aborted) { resolve(null); return; }
    const image = new Image();
    image.crossOrigin = 'anonymous'; image.decoding = 'async';
    const finish = (result: HTMLImageElement | null) => {
      clearTimeout(timeout); signal.removeEventListener('abort', abort);
      image.onload = null; image.onerror = null;
      resolve(result);
    };
    const abort = () => finish(null);
    const timeout = window.setTimeout(abort, 8000);
    signal.addEventListener('abort', abort, { once: true });
    image.onload = () => finish(image.naturalWidth ? image : null);
    image.onerror = abort;
    image.src = src;
  });
}

const sourceOf = (image: HTMLImageElement | null | undefined) => image?.currentSrc || image?.src || '';

/** Adaptation of the user's FlexCarousel: its card shader, cyclic layout, spring integration,
 * drag inertia and staggered intro. Cards are drawn straight (no lens bend, no speed squeeze);
 * the centred product is highlighted and the others recede. Liquid continues to own every
 * product link, price and stock label. */
export async function createFlexCarousel(
  root: HTMLElement, parentSignal: AbortSignal, hooks: FlexCarouselHooks,
): Promise<FlexCarouselEngine | null> {
  const viewport = root.querySelector<HTMLElement>('[data-ref="viewport"]');
  const track = root.querySelector<HTMLElement>('[data-ref="track"]');
  if (!viewport || !track || parentSignal.aborted) return null;
  const slides = [...track.children] as HTMLElement[];
  const sources = slides.map((slide) => sourceOf(slide.querySelector<HTMLImageElement>('[data-card-primary-img]')));
  if (slides.length < 2 || sources.some((src) => !src)) return null;
  const secondSources = slides.map((slide) => sourceOf(slide.querySelector<HTMLImageElement>('.card__secondary')));
  const soldOut = slides.map((slide) => Boolean(slide.querySelector('.card--sold-out')));
  const canvas = document.createElement('canvas');
  let renderer: Renderer;
  try {
    renderer = new Renderer({ canvas, webgl: 2, alpha: true, depth: false, antialias: false, premultipliedAlpha: true });
  } catch { return null; }
  const gl = renderer.gl;
  const releaseContext = () => gl.getExtension('WEBGL_lose_context')?.loseContext();
  if (!renderer.isWebgl2) { releaseContext(); return null; }
  const [images, seconds] = await Promise.all([
    Promise.all(sources.map((src) => loadImage(src, parentSignal))),
    // Second photographs are optional; a card without one simply has no hover curtain.
    Promise.all(secondSources.map((src) => loadImage(src, parentSignal))),
  ]);
  if (parentSignal.aborted || images.some((image) => !image)) { releaseContext(); return null; }
  // Preserve any native swipe/arrow navigation made while the renderer loaded.
  let initialIndex = 0; let initialDistance = Infinity;
  slides.forEach((slide, index) => {
    const distance = Math.abs(slide.offsetLeft - track.offsetLeft - viewport.scrollLeft);
    if (distance < initialDistance) { initialDistance = distance; initialIndex = index; }
  });

  let cleanup = releaseContext;
  try {
    const aborter = new AbortController();
    const signal = aborter.signal;
    const textures: Texture[] = [];
    const secondTextures: Array<Texture | null> = [];
    const stage = document.createElement('div');
    stage.className = 'product-carousel__stage';
    stage.tabIndex = 0; stage.setAttribute('role', 'group');
    stage.setAttribute('aria-label', root.dataset.canvasLabel ?? root.getAttribute('aria-label') ?? '');
    canvas.setAttribute('aria-hidden', 'true');
    // Underline under the centred product: the highlight, and with autoplay its countdown.
    const marker = document.createElement('span');
    marker.className = 'product-carousel__marker';
    marker.setAttribute('aria-hidden', 'true');
    stage.append(canvas, marker);
    root.insertBefore(stage, viewport);
    const counter = document.createElement('span');
    counter.className = 'product-carousel__position spec';
    counter.setAttribute('aria-hidden', 'true');
    const digitTracks: HTMLElement[] = [];
    for (let index = 0; index < Math.max(2, String(slides.length).length); index++) {
      // Always use at least two rolling digits, as in the supplied component.
      const digit = document.createElement('span'); digit.className = 'product-carousel__digit';
      const strip = document.createElement('span'); strip.className = 'product-carousel__digit-strip';
      for (const number of '0123456789') {
        const cell = document.createElement('span'); cell.textContent = number; strip.append(cell);
      }
      digit.append(strip); counter.append(digit); digitTracks.push(strip);
    }
    counter.append(document.createTextNode(` / ${String(slides.length).padStart(2, '0')}`));
    root.querySelector('.product-carousel__controls')?.insertBefore(counter, root.querySelector('.product-carousel__buttons'));
    const status = document.createElement('span'); status.className = 'visually-hidden';
    status.setAttribute('role', 'status'); status.setAttribute('aria-atomic', 'true'); root.append(status);
    const deleteTextures = () => {
      for (const texture of [...textures, ...secondTextures]) if (texture) gl.deleteTexture(texture.texture);
    };
    cleanup = () => {
      aborter.abort(); stage.remove(); counter.remove(); status.remove();
      slides.forEach((slide) => { slide.hidden = false; slide.removeAttribute('aria-label'); });
      root.removeAttribute('data-effect-ready'); root.removeAttribute('data-ready');
      deleteTextures(); releaseContext();
    };

    let disposed = false; let raf = 0; let timer = 0; let visible = false;
    let width = 1; let height = 1; let last = 0; let dirty = true;
    let pos = 0; let goal = 0; let velocity = 0;
    let active = -1; let userPaused = false; let hovered = false; let focused = false; let held = false;
    let interactedAt = 0; let autoplayAt = performance.now(); let announceNext = false;
    let layout: Metrics | null = null; let instances: Instance[] = [];
    let wheelAt = 0; let wheelMode = false; let intro = 0; let hoverIndex = -1;
    const reveal = slides.map(() => 0);
    const introKind = root.dataset.intro ?? 'rise';
    const autoplay = root.hasAttribute('data-autoplay');
    const pointer = { down: false, dragging: false, id: -1, touch: false, x: 0, y: 0, startX: 0, startY: 0, startPos: 0, samples: [] as { x: number; time: number }[] };
    const pause = root.querySelector<HTMLButtonElement>('[data-carousel-pause]');
    if (pause) pause.hidden = !autoplay;
    root.toggleAttribute('data-autoplay-on', autoplay);
    const dispose = () => {
      if (disposed) return;
      disposed = true; aborter.abort(); cancelAnimationFrame(raf); clearTimeout(timer);
      resizeObserver.disconnect(); intersection.disconnect();
      parentSignal.removeEventListener('abort', dispose);
      slides.forEach((slide) => { slide.hidden = false; slide.removeAttribute('aria-label'); });
      for (const name of ['data-effect-ready', 'data-ready', 'data-autoplay-on']) root.removeAttribute(name);
      stage.remove(); counter.remove(); status.remove();
      deleteTextures(); releaseContext();
    };
    const fail = () => { if (!disposed) { dispose(); hooks.onFailure(); } };

    gl.clearColor(0, 0, 0, 0);
    const cardUniforms = {
      tMap: { value: null as Texture | null }, tSecond: { value: null as Texture | null },
      uRect: { value: [0, 0, 1, 1] }, uResolution: { value: [1, 1] }, uSize: { value: [1, 1] },
      uImage: { value: [1, 1] }, uImage2: { value: [1, 1] },
      uRadius: { value: 0 }, uAlpha: { value: 1 }, uReady: { value: 1 }, uShift: { value: 0 },
      uDpr: { value: 1 }, uPlaceholder: { value: [.92, .9, .87] },
      uReveal: { value: 0 }, uFocus: { value: 1 }, uGray: { value: 0 },
    };
    const cardProgram = new Program(gl, { vertex: cardVertex, fragment: cardFragment, uniforms: cardUniforms, transparent: true, depthTest: false, depthWrite: false });
    cardProgram.setBlendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const cardMesh = new Mesh(gl, { geometry: new Plane(gl), program: cardProgram });
    if (!gl.getProgramParameter(cardProgram.program, gl.LINK_STATUS)) {
      // Observers are set up below, so release the context directly on shader failure.
      stage.remove(); counter.remove(); status.remove(); aborter.abort(); releaseContext(); return null;
    }
    const texture = (image: HTMLImageElement) => new Texture(gl, { image, generateMipmaps: true, minFilter: gl.LINEAR_MIPMAP_LINEAR, magFilter: gl.LINEAR, anisotropy: 4 });
    for (const image of images) textures.push(texture(image!));
    for (const image of seconds) secondTextures.push(image ? texture(image) : null);

    const metrics = (): Metrics => {
      const cardH = height * .68;
      const gap = width < 600 ? 16 : 26;
      const widths = images.map((image) => cardH * image!.naturalWidth / image!.naturalHeight);
      let cursor = 0;
      const centers = widths.map((cardWidth) => { const center = cursor + cardWidth / 2; cursor += cardWidth + gap; return center; });
      return { height: cardH, widths, centers, gap, loop: cursor };
    };
    const nearest = (m: Metrics, at: number) => {
      let best = 0; let distance = Infinity;
      m.centers.forEach((center, i) => { const d = Math.abs(wrap(center - at, m.loop)); if (d < distance) { distance = d; best = i; } });
      return best;
    };
    const snap = (m: Metrics, at: number) => at + wrap(m.centers[nearest(m, at)]! - at, m.loop);
    const setActive = (index: number) => {
      if (active === index) return;
      active = index;
      slides.forEach((slide, i) => { slide.hidden = i !== index; slide.setAttribute('aria-label', `${i + 1} / ${slides.length}`); });
      String(index + 1).padStart(digitTracks.length, '0').split('').forEach((digit, i) => { digitTracks[i]!.style.transform = `translateY(${-Number(digit) * 10}%)`; });
      hooks.onActive(index);
    };
    const goTo = (index: number) => {
      const m = metrics();
      goal += wrap(m.centers[index]! - goal, m.loop);
      announceNext = true; interactedAt = performance.now(); intro = 1; wheelMode = false;
      wake();
    };
    const step = (delta: number, user = true) => {
      const m = metrics(); const from = nearest(m, goal);
      const next = (from + delta + slides.length) % slides.length;
      goal = snap(m, goal) + (m.widths[from]! / 2 + m.gap + m.widths[next]! / 2) * delta;
      if (user) { announceNext = true; interactedAt = performance.now(); intro = 1; }
      wheelMode = false; wake();
    };
    const draw = (m: Metrics, progress: number) => {
      const dpr = renderer.dpr;
      cardUniforms.uResolution.value = [width, height]; cardUniforms.uDpr.value = dpr;
      const draws: (Instance & { focus: number })[] = [];
      const reach = width * (width < 600 ? .6 : .45);
      for (let i = 0; i < slides.length; i++) {
        const cardWidth = m.widths[i]!;
        const baseRel = wrap(m.centers[i]! - pos, m.loop);
        for (let k = -3; k <= 3; k++) {
          const rel = baseRel + k * m.loop;
          if (Math.abs(rel) - cardWidth / 2 > width + 40) continue;
          const delay = Math.min(Math.abs(rel) / (width * .6), 1) * .24;
          const local = introKind === 'none' ? 1 : clamp01((progress - delay) / .7);
          const eased = easeOut(local);
          // Uniform scale only: the photograph keeps its proportions at every moment.
          const scale = introKind === 'bloom' ? .92 + eased * .08 : introKind === 'rise' ? .7 + .3 * eased : 1;
          const x = width / 2 + rel * (introKind === 'deal' ? eased : 1);
          const y = height / 2 + (introKind === 'rise' ? (1 - eased) * height * .45 : 0);
          const focus = 1 - smooth(Math.abs(rel) / reach);
          draws.push({ index: i, rel, x, y, width: cardWidth * scale, height: m.height * scale, alpha: clamp01(local * 4), focus });
        }
      }
      draws.sort((a, b) => Math.abs(b.rel) - Math.abs(a.rel));
      renderer.bindFramebuffer(); gl.clear(gl.COLOR_BUFFER_BIT);
      for (const item of draws) {
        const image = images[item.index]!;
        const second = seconds[item.index];
        cardUniforms.tMap.value = textures[item.index]!;
        cardUniforms.tSecond.value = secondTextures[item.index] ?? textures[item.index]!;
        cardUniforms.uRect.value = [item.x, item.y, item.width + 2, item.height + 2];
        cardUniforms.uSize.value = [item.width, item.height];
        cardUniforms.uImage.value = [image.naturalWidth, image.naturalHeight];
        cardUniforms.uImage2.value = second ? [second.naturalWidth, second.naturalHeight] : [image.naturalWidth, image.naturalHeight];
        cardUniforms.uAlpha.value = item.alpha;
        cardUniforms.uShift.value = Math.max(-1, Math.min(1, item.rel / (width * .75)));
        cardUniforms.uReveal.value = second ? easeOut(reveal[item.index]!) : 0;
        cardUniforms.uFocus.value = item.focus;
        cardUniforms.uGray.value = soldOut[item.index] ? 1 : 0;
        renderer.render({ scene: cardMesh, clear: false });
      }
      instances = draws.sort((a, b) => Math.abs(a.rel) - Math.abs(b.rel));
      const centre = instances[0];
      if (centre) {
        marker.style.width = `${centre.width}px`;
        marker.style.transform = `translate3d(${(centre.x - centre.width / 2).toFixed(1)}px, ${(centre.y + centre.height / 2 + 12).toFixed(1)}px, 0)`;
        marker.style.opacity = String(clamp01(1 - Math.abs(centre.rel) / (centre.width * .5)) * centre.alpha);
      }
    };
    const frame = (now: number) => {
      raf = 0; if (disposed || !visible || document.hidden) return;
      const dt = Math.min(.05, Math.max(.001, (now - last) / 1000)); last = now;
      const m = metrics(); let moving = false;
      if (wheelMode && now - wheelAt > 150) { goal = snap(m, goal); wheelMode = false; }
      if (intro < 1) { intro = Math.min(1, intro + dt / 1.45); moving = true; }
      if (!pointer.dragging) {
        const stiffness = wheelMode ? 80 : 55;
        const count = Math.ceil(dt / (1 / 240)); const h = dt / count;
        for (let i = 0; i < count; i++) {
          velocity += (stiffness * (goal - pos) - 2 * Math.sqrt(stiffness) * velocity) * h;
          pos += velocity * h;
        }
        if (Math.abs(goal - pos) < .05 && Math.abs(velocity) < .5) { pos = goal; velocity = 0; }
        else moving = true;
      } else moving = true;
      if (Math.abs(pos) > m.loop * 8) {
        const shift = Math.round(pos / m.loop) * m.loop;
        pos -= shift; goal -= shift; pointer.startPos -= shift;
      }
      // Hover curtain, timed like the product card's CSS curtain (700ms in, quicker out).
      reveal.forEach((value, index) => {
        const target = index === hoverIndex && !pointer.dragging ? 1 : 0;
        if (value === target) return;
        reveal[index] = target ? Math.min(1, value + dt / .7) : Math.max(0, value - dt / .5);
        moving = true;
      });
      if (dirty || moving) {
        try { draw(m, intro); } catch { fail(); return; }
        dirty = false; setActive(nearest(m, pos));
      }
      if (announceNext && !pointer.dragging && Math.abs(goal - pos) < 1) {
        const title = slides[active]?.querySelector('.card__title')?.textContent?.trim() ?? '';
        status.textContent = `${title}, ${active + 1} / ${slides.length}`; announceNext = false;
      }
      const playing = autoplay && !userPaused && !hovered && !focused && !held && !pointer.down && intro >= 1;
      const settled = Math.abs(goal - pos) < 1;
      const due = Math.max(autoplayAt + INTERVAL_MS, interactedAt + IDLE_MS);
      if (playing && now >= due) { autoplayAt = now; step(1, false); moving = true; }
      // With autoplay running, the highlight underline fills up until the next product.
      const progress = playing && settled ? clamp01((now - autoplayAt) / Math.max(1, due - autoplayAt)) : playing ? 0 : 1;
      marker.style.setProperty('--progress', progress.toFixed(3));
      if (moving || wheelMode || (playing && settled)) { if (!raf) raf = requestAnimationFrame(frame); }
      else if (!raf && autoplay && !userPaused) timer = window.setTimeout(wake, 750);
    };
    function wake(): void {
      dirty = true; clearTimeout(timer);
      if (!raf && !disposed && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); }
    }
    const resize = () => {
      width = Math.max(1, stage.clientWidth); height = Math.max(1, stage.clientHeight);
      renderer.dpr = Math.min(devicePixelRatio || 1, 2, Math.sqrt(2.5e6 / (width * height)));
      renderer.setSize(width, height);
      const m = metrics();
      if (layout) {
        const index = nearest(layout, pos);
        const offset = wrap(pos - layout.centers[index]!, layout.loop) * m.widths[index]! / layout.widths[index]!;
        pos = m.centers[index]! + offset; goal = m.centers[index]!;
      } else { pos = m.centers[initialIndex]!; goal = pos; }
      layout = m; wake();
    };
    const localPoint = (event: PointerEvent) => { const rect = stage.getBoundingClientRect(); return [event.clientX - rect.left, event.clientY - rect.top] as const; };
    const hitTest = (x: number, y: number) => instances.find((item) => x >= item.x - item.width / 2 && x <= item.x + item.width / 2 && y >= item.y - item.height / 2 && y <= item.y + item.height / 2);
    stage.addEventListener('pointerdown', (event) => {
      if (event.button > 0 || !event.isPrimary) return;
      const [x, y] = localPoint(event);
      Object.assign(pointer, { down: true, dragging: false, touch: event.pointerType === 'touch', id: event.pointerId, x, y, startX: x, startY: y, startPos: pos, samples: [{ x, time: performance.now() }] });
      interactedAt = performance.now(); intro = 1; goal = pos; velocity = 0; wake();
    }, { signal });
    stage.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'mouse' && !pointer.dragging) {
        const [hx, hy] = localPoint(event);
        const index = hitTest(hx, hy)?.index ?? -1;
        if (index !== hoverIndex) { hoverIndex = index; stage.toggleAttribute('data-over-card', index >= 0); wake(); }
      }
      if (!pointer.down || event.pointerId !== pointer.id) return;
      const [x, y] = localPoint(event);
      const dx = x - pointer.startX; const dy = y - pointer.startY; const slop = pointer.touch ? 10 : 5;
      if (!pointer.dragging) {
        if (pointer.touch && Math.abs(dy) > slop && Math.abs(dy) > Math.abs(dx)) { pointer.down = false; goal = snap(metrics(), pos); wake(); return; }
        if (Math.abs(dx) <= slop) return;
        pointer.dragging = true; stage.setPointerCapture(event.pointerId); stage.setAttribute('data-dragging', '');
      }
      pos = pointer.startPos - dx; goal = pos; velocity = 0;
      const now = performance.now(); pointer.samples.push({ x, time: now });
      while (pointer.samples.length > 2 && now - pointer.samples[0]!.time > 100) pointer.samples.shift();
      wake();
    }, { signal });
    stage.addEventListener('pointerleave', () => { if (hoverIndex >= 0) { hoverIndex = -1; stage.removeAttribute('data-over-card'); wake(); } }, { signal });
    stage.addEventListener('pointerup', (event) => {
      if (!pointer.down || event.pointerId !== pointer.id) return;
      pointer.down = false; stage.removeAttribute('data-dragging');
      if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
      if (pointer.dragging) {
        pointer.dragging = false;
        const first = pointer.samples[0]; const end = pointer.samples.at(-1);
        velocity = first && end && end.time > first.time && performance.now() - end.time < 70 ? -(end.x - first.x) / (end.time - first.time) * 1000 : 0;
        velocity = Math.max(-4000, Math.min(4000, velocity));
        goal = snap(metrics(), pos + velocity * .22); announceNext = true; wake(); return;
      }
      const [x, y] = localPoint(event);
      const hit = hitTest(x, y);
      if (!hit) { goal = snap(metrics(), pos); wake(); return; }
      if (hit.index === active && Math.abs(goal - pos) < 2) hooks.onSelect(active);
      else goTo(hit.index);
    }, { signal });
    const cancelPointer = () => {
      pointer.down = false; pointer.dragging = false; stage.removeAttribute('data-dragging');
      goal = snap(metrics(), pos); wake();
    };
    stage.addEventListener('pointercancel', cancelPointer, { signal });
    stage.addEventListener('lostpointercapture', () => { if (pointer.down) cancelPointer(); }, { signal });
    stage.addEventListener('wheel', (event) => {
      if (event.ctrlKey) return;
      const dx = event.shiftKey && Math.abs(event.deltaX) < Math.abs(event.deltaY) ? event.deltaY : event.deltaX;
      // Vertical scrolling continues through the page; only a horizontal gesture steers the strip.
      if (!event.shiftKey && Math.abs(dx) <= Math.abs(event.deltaY)) return;
      event.preventDefault(); intro = 1; interactedAt = performance.now();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? width : 1;
      goal += Math.max(-120, Math.min(120, dx * unit)) * 1.25;
      wheelMode = true; wheelAt = performance.now(); announceNext = true; wake();
    }, { passive: false, signal });
    stage.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); step(event.key === 'ArrowRight' ? 1 : -1); }
      else if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); goTo(event.key === 'Home' ? 0 : slides.length - 1); }
      else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); hooks.onSelect(active); }
    }, { signal });
    root.addEventListener('click', (event) => {
      const control = (event.target as Element).closest<HTMLElement>('[data-carousel-step], [data-carousel-pause]');
      if (!control) return;
      if (control.hasAttribute('data-carousel-pause')) {
        userPaused = !userPaused; control.setAttribute('aria-pressed', String(userPaused));
        const label = control.querySelector('[data-carousel-pause-label]');
        if (label) label.textContent = (userPaused ? control.dataset.playLabel : control.dataset.pauseLabel) ?? '';
        autoplayAt = performance.now(); wake();
      } else step(Number(control.dataset.carouselStep));
    }, { signal });
    // A mouse anywhere over the carousel (strip, sizes, button) pauses; leaving resumes shortly.
    root.addEventListener('pointerenter', (event) => { hovered = event.pointerType === 'mouse'; wake(); }, { signal });
    root.addEventListener('pointerleave', () => { hovered = false; autoplayAt = performance.now() - INTERVAL_MS + 1600; wake(); }, { signal });
    // Keyboard focus pauses; focus left behind by a mouse click doesn't freeze the strip.
    const keyboardFocus = (target: EventTarget | null) => target instanceof Element && root.contains(target) && target.matches(':focus-visible');
    root.addEventListener('focusin', (event) => { focused = keyboardFocus(event.target); wake(); }, { signal });
    root.addEventListener('focusout', (event) => { focused = keyboardFocus(event.relatedTarget); wake(); }, { signal });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(raf); clearTimeout(timer); raf = 0; } else wake(); }, { signal });
    canvas.addEventListener('webglcontextlost', (event) => { event.preventDefault(); fail(); }, { signal });
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(stage);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      if (visible) wake(); else { cancelAnimationFrame(raf); clearTimeout(timer); raf = 0; }
    });
    intersection.observe(stage);
    cleanup = dispose;
    root.setAttribute('data-effect-ready', ''); root.setAttribute('data-ready', '');
    root.querySelectorAll<HTMLButtonElement>('[data-carousel-step]').forEach((button) => button.disabled = false);
    if (introKind === 'none') intro = 1;
    setActive(initialIndex); resize();
    parentSignal.addEventListener('abort', dispose, { once: true });
    return {
      dispose,
      setHeld(value: boolean) {
        held = value;
        // Resume gently: the next automatic step waits for a full interval.
        if (!value) autoplayAt = performance.now();
        wake();
      },
    };
  } catch {
    cleanup(); return null;
  }
}
