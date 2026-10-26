/**
 * Pinch / wheel / double-tap zoom with inertial drag panning for the product lightbox.
 *
 * - Two fingers pinch around their midpoint; trackpad pinch (ctrl+wheel) and wheel-while-zoomed
 *   zoom around the cursor. Mouse click and touch double-tap toggle 1× ↔ 2.5× at the point.
 * - Dragging while zoomed pans with a little rubber band past the edges; releasing keeps the
 *   flick's momentum (exponential decay) and springs back inside the image bounds.
 * - At 1×, a horizontal swipe asks for the previous / next image.
 * - Keyboard: + / − zoom, 0 resets (arrows stay with the gallery).
 * Reduced motion (or Motion off) removes momentum and springs: positions apply instantly.
 *
 * One transform on the image (translate3d + scale) keeps it on the compositor.
 */

export interface ZoomPanOptions {
  /** Called with -1 / 1 for a swipe at 1× (previous / next). */
  onSwipe?: (direction: -1 | 1) => void;
  /** Called whenever the zoomed state flips. */
  onZoomChange?: (zoomed: boolean) => void;
  /** Whether momentum / spring animation may run. */
  motion?: () => boolean;
}

interface Point { x: number; y: number }

export const MIN_SCALE = 1;
export const MAX_SCALE = 4;
export const TAP_SCALE = 2.5;
const FRICTION = 0.0045; // per ms: velocity *= exp(-FRICTION * dt)
const RUBBER = 0.35;
const SWIPE_DISTANCE = 60;
const DOUBLE_TAP_MS = 300;

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Pan limit on one axis: half of how much the scaled image overflows the stage. */
export function panLimit(base: number, scale: number, stage: number): number {
  return Math.max(0, (base * scale - stage) / 2);
}

/** Translation that keeps the point `anchor` (relative to the stage centre) fixed while scaling. */
export function anchoredTranslate(anchor: number, translate: number, from: number, to: number): number {
  return anchor - (anchor - translate) * (to / from);
}

/** Past an edge, movement is damped (rubber band). */
export function rubberBand(value: number, limit: number): number {
  if (value > limit) return limit + (value - limit) * RUBBER;
  if (value < -limit) return -limit + (value + limit) * RUBBER;
  return value;
}

export class ZoomPan {
  scale = 1;
  x = 0;
  y = 0;
  #stage: HTMLElement;
  #img: HTMLElement | null = null;
  #options: ZoomPanOptions;
  #pointers = new Map<number, Point>();
  #pinch: { distance: number; scale: number } | null = null;
  #drag: { start: Point; last: Point; moved: boolean; time: number } | null = null;
  #velocity: Point = { x: 0, y: 0 };
  #frame = 0;
  #lastTap = 0;
  #base = { width: 0, height: 0 };
  #controller = new AbortController();

  constructor(stage: HTMLElement, options: ZoomPanOptions = {}) {
    this.#stage = stage;
    this.#options = options;
    const signal = this.#controller.signal;
    stage.addEventListener('pointerdown', (event) => this.#down(event), { signal });
    stage.addEventListener('pointermove', (event) => this.#move(event), { signal });
    stage.addEventListener('pointerup', (event) => this.#up(event), { signal });
    stage.addEventListener('pointercancel', (event) => this.#up(event, true), { signal });
    stage.addEventListener('wheel', (event) => this.#wheel(event), { signal, passive: false });
    // Safari gesture events would otherwise zoom the whole page.
    stage.addEventListener('gesturestart', (event) => event.preventDefault(), { signal });
  }

  get zoomed(): boolean {
    return this.scale > 1.01;
  }

  /** Use a (new) image element; resets to 1×. */
  attach(img: HTMLElement): void {
    this.#img = img;
    img.draggable = false;
    this.reset();
  }

  reset(): void {
    this.#stop();
    this.#base = { width: 0, height: 0 };
    this.#set(1, 0, 0);
  }

  destroy(): void {
    this.#stop();
    this.#controller.abort();
  }

  /** Zoom to `target` around a client point (default: stage centre). */
  zoomTo(target: number, client?: Point): void {
    const anchor = this.#anchor(client);
    const next = clamp(target, MIN_SCALE, MAX_SCALE);
    const x = anchoredTranslate(anchor.x, this.x, this.scale, next);
    const y = anchoredTranslate(anchor.y, this.y, this.scale, next);
    this.#set(next, x, y);
    this.#settle();
  }

  zoomBy(factor: number, client?: Point): void {
    this.zoomTo(this.scale * factor, client);
  }

  /** Keyboard support; returns true when the key was used. */
  key(key: string): boolean {
    if (key === '+' || key === '=') this.zoomBy(1.5);
    else if (key === '-' || key === '_') this.zoomBy(1 / 1.5);
    else if (key === '0') this.zoomTo(1);
    else return false;
    return true;
  }

  /* ---------------------------------------------------------------------------- pointers */

  #down(event: PointerEvent): void {
    if (!this.#img || (event.target as Element).closest('button')) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    this.#stop();
    try {
      this.#stage.setPointerCapture(event.pointerId);
    } catch {
      /* pointer already gone (or synthetic): gestures still work without capture */
    }
    this.#pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (this.#pointers.size === 2) {
      this.#pinch = { distance: this.#distance(), scale: this.scale };
      this.#drag = null;
    } else if (this.#pointers.size === 1) {
      const point = { x: event.clientX, y: event.clientY };
      this.#drag = { start: point, last: point, moved: false, time: event.timeStamp };
      this.#velocity = { x: 0, y: 0 };
    }
  }

  #move(event: PointerEvent): void {
    if (!this.#pointers.has(event.pointerId)) return;
    const previous = this.#midpoint();
    this.#pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (this.#pinch && this.#pointers.size >= 2) {
      event.preventDefault();
      const middle = this.#midpoint();
      const next = clamp(this.#pinch.scale * (this.#distance() / this.#pinch.distance), MIN_SCALE * 0.85, MAX_SCALE * 1.15);
      const anchor = this.#anchor(middle);
      // Scale around the fingers, then follow the midpoint as it moves.
      let x = anchoredTranslate(anchor.x, this.x, this.scale, next) + (middle.x - previous.x);
      let y = anchoredTranslate(anchor.y, this.y, this.scale, next) + (middle.y - previous.y);
      const limits = this.#limits(next);
      x = rubberBand(x, limits.x);
      y = rubberBand(y, limits.y);
      this.#set(next, x, y);
      return;
    }

    const drag = this.#drag;
    if (!drag) return;
    const point = { x: event.clientX, y: event.clientY };
    const dx = point.x - drag.last.x;
    const dy = point.y - drag.last.y;
    const dt = Math.max(1, event.timeStamp - drag.time);
    if (Math.hypot(point.x - drag.start.x, point.y - drag.start.y) > 6) drag.moved = true;
    if (this.zoomed) {
      event.preventDefault();
      const limits = this.#limits(this.scale);
      // Rubber band is applied to the "free" position so returning from an edge feels natural.
      this.#set(this.scale, rubberBand(this.x + dx, limits.x), rubberBand(this.y + dy, limits.y));
      // Smoothed velocity (px/ms) for the release flick.
      this.#velocity = { x: this.#velocity.x * 0.6 + (dx / dt) * 0.4, y: this.#velocity.y * 0.6 + (dy / dt) * 0.4 };
    }
    drag.last = point;
    drag.time = event.timeStamp;
  }

  #up(event: PointerEvent, cancelled = false): void {
    if (!this.#pointers.has(event.pointerId)) return;
    this.#pointers.delete(event.pointerId);
    if (this.#stage.hasPointerCapture?.(event.pointerId)) this.#stage.releasePointerCapture(event.pointerId);

    if (this.#pinch) {
      if (this.#pointers.size < 2) {
        this.#pinch = null;
        // A remaining finger continues as a drag from where it is.
        const rest = [...this.#pointers.values()][0];
        this.#drag = rest ? { start: rest, last: rest, moved: true, time: event.timeStamp } : null;
        this.#velocity = { x: 0, y: 0 };
        this.#settle();
      }
      return;
    }

    const drag = this.#drag;
    this.#drag = null;
    if (!drag || cancelled) {
      this.#settle();
      return;
    }

    if (!drag.moved) {
      this.#tap(event);
      return;
    }

    if (!this.zoomed) {
      const dx = event.clientX - drag.start.x;
      const dy = event.clientY - drag.start.y;
      if (Math.abs(dx) > SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy) * 1.4) this.#options.onSwipe?.(dx < 0 ? 1 : -1);
      return;
    }
    // A pause before release kills the flick.
    if (event.timeStamp - drag.time > 80) this.#velocity = { x: 0, y: 0 };
    this.#glide();
  }

  #tap(event: PointerEvent): void {
    const point = { x: event.clientX, y: event.clientY };
    if (event.pointerType === 'mouse') {
      this.zoomTo(this.zoomed ? 1 : TAP_SCALE, point);
      return;
    }
    // Touch: double tap toggles; a single tap does nothing (so it never fights a pinch).
    if (event.timeStamp - this.#lastTap < DOUBLE_TAP_MS) {
      this.#lastTap = 0;
      this.zoomTo(this.zoomed ? 1 : TAP_SCALE, point);
    } else {
      this.#lastTap = event.timeStamp;
    }
  }

  #wheel(event: WheelEvent): void {
    if (!this.#img) return;
    // Trackpad pinch arrives as ctrl+wheel; a plain wheel only zooms an already-zoomed image.
    if (!event.ctrlKey && !this.zoomed) return;
    event.preventDefault();
    const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
    this.zoomBy(Math.exp(-delta * (event.ctrlKey ? 0.01 : 0.0025)), { x: event.clientX, y: event.clientY });
  }

  /* ------------------------------------------------------------------------- animation */

  /** Momentum after a flick, then spring back inside the bounds. */
  #glide(): void {
    if (!this.#motion() || Math.hypot(this.#velocity.x, this.#velocity.y) < 0.02) {
      this.#settle();
      return;
    }
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(48, now - last);
      last = now;
      const decay = Math.exp(-FRICTION * dt);
      this.#velocity = { x: this.#velocity.x * decay, y: this.#velocity.y * decay };
      const limits = this.#limits(this.scale);
      let x = this.x + this.#velocity.x * dt;
      let y = this.y + this.#velocity.y * dt;
      // Hitting an edge absorbs that axis' momentum quickly.
      if (Math.abs(x) > limits.x) { x = rubberBand(x, limits.x); this.#velocity.x *= 0.5; }
      if (Math.abs(y) > limits.y) { y = rubberBand(y, limits.y); this.#velocity.y *= 0.5; }
      this.#set(this.scale, x, y);
      if (Math.hypot(this.#velocity.x, this.#velocity.y) > 0.01) this.#frame = requestAnimationFrame(step);
      else { this.#frame = 0; this.#settle(); }
    };
    this.#frame = requestAnimationFrame(step);
  }

  /** Bring scale and position back inside their limits (springy when motion is allowed). */
  #settle(): void {
    const scale = clamp(this.scale, MIN_SCALE, MAX_SCALE);
    const limits = this.#limits(scale);
    const target = { scale, x: clamp(this.x, -limits.x, limits.x), y: clamp(this.y, -limits.y, limits.y) };
    if (scale <= 1.01) Object.assign(target, { scale: 1, x: 0, y: 0 });
    const done = Math.abs(target.scale - this.scale) < 0.001 && Math.abs(target.x - this.x) < 0.5 && Math.abs(target.y - this.y) < 0.5;
    if (done || !this.#motion()) {
      this.#set(target.scale, target.x, target.y);
      return;
    }
    const from = { scale: this.scale, x: this.x, y: this.y };
    const start = performance.now();
    const duration = 320;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      this.#set(
        from.scale + (target.scale - from.scale) * eased,
        from.x + (target.x - from.x) * eased,
        from.y + (target.y - from.y) * eased,
      );
      this.#frame = t < 1 ? requestAnimationFrame(step) : 0;
    };
    cancelAnimationFrame(this.#frame);
    this.#frame = requestAnimationFrame(step);
  }

  #stop(): void {
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
  }

  /* --------------------------------------------------------------------------- geometry */

  #set(scale: number, x: number, y: number): void {
    const wasZoomed = this.zoomed;
    this.scale = scale;
    this.x = x;
    this.y = y;
    if (this.#img) this.#img.style.transform = scale === 1 && x === 0 && y === 0 ? '' : `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    this.#stage.toggleAttribute('data-zoomed', this.zoomed);
    if (wasZoomed !== this.zoomed) this.#options.onZoomChange?.(this.zoomed);
  }

  /** Displayed size of the image at 1× (measured once per image, without the transform). */
  #measure(): { width: number; height: number } {
    if (!this.#base.width && this.#img) {
      this.#base = { width: this.#img.offsetWidth, height: this.#img.offsetHeight };
    }
    return this.#base;
  }

  #limits(scale: number): Point {
    const base = this.#measure();
    return { x: panLimit(base.width, scale, this.#stage.clientWidth), y: panLimit(base.height, scale, this.#stage.clientHeight) };
  }

  /** Client point → offset from the stage centre. */
  #anchor(client?: Point): Point {
    if (!client) return { x: 0, y: 0 };
    const rect = this.#stage.getBoundingClientRect();
    return { x: client.x - (rect.left + rect.width / 2), y: client.y - (rect.top + rect.height / 2) };
  }

  #distance(): number {
    const [a, b] = [...this.#pointers.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) || 1 : 1;
  }

  #midpoint(): Point {
    const points = [...this.#pointers.values()];
    if (!points.length) return { x: 0, y: 0 };
    return { x: points.reduce((sum, p) => sum + p.x, 0) / points.length, y: points.reduce((sum, p) => sum + p.y, 0) / points.length };
  }

  #motion(): boolean {
    return this.#options.motion?.() ?? true;
  }
}
