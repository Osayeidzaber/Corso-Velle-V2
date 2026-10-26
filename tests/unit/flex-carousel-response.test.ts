import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const drawing = vi.hoisted(() => ({ count: 0 }));

// Exercise the real controller/frame loop without requiring a GPU or loading catalog images.
vi.mock('ogl', () => ({
  Renderer: class {
    dpr = 1; isWebgl2 = true;
    gl = { canvas: document.createElement('canvas'), clearColor() {}, getExtension() {},
      getProgramParameter: () => true, deleteTexture() {}, deleteFramebuffer() {}, generateMipmap() {}, viewport() {}, clear() { drawing.count++; } };
    getExtension() {} setSize() {} bindFramebuffer() {} render() {}
  },
  Texture: class { texture = {}; bind() {} },
  RenderTarget: class {
    texture = { texture: {}, bind() {} }; buffer = {}; width = 2; height = 2;
    setSize(width: number, height: number) { this.width = width; this.height = height; }
  },
  Program: class {
    uniforms: unknown; program = {};
    constructor(_gl: unknown, options: { uniforms: unknown }) { this.uniforms = options.uniforms; }
    setBlendFunc() {} remove() {}
  },
  Plane: class {}, Triangle: class { remove() {} },
  Mesh: class { geometry: { remove(): void }; constructor(_gl: unknown, options: { geometry: { remove(): void } }) { this.geometry = options.geometry; } },
}));
import { createFlexCarousel } from '../../src/components/carousel/flex-carousel';

let now = 0;
let frameId = 0;
const frames = new Map<number, FrameRequestCallback>();
const resizeObservers: { callback: () => void; target?: Element }[] = [];
const intersections: { callback: IntersectionObserverCallback; target: Element; observer: IntersectionObserver }[] = [];
let aborter: AbortController;
function advance(ms: number): void {
  const end = now + ms;
  while (now < end) {
    now = Math.min(end, now + 1000 / 60);
    const callbacks = [...frames.values()]; frames.clear();
    callbacks.forEach((callback) => callback(now));
  }
}
function mount(speed = 35, browseOnly = false, soldOut = false) {
  document.body.innerHTML = `<div id="carousel" data-intro="rise" speed="${speed}" ${browseOnly ? 'data-browse-only data-autoplay data-interval="1.5"' : ''}>
    <div data-ref="viewport"><ul data-ref="track">
      ${[0, 1, 2, 3].map(i => `<li><article class="card${soldOut && i === 0 ? ' card--sold-out' : ''}"><img data-card-primary-img src="/test-${i}.jpg" width="800" height="1000"><a class="card__title" href="/products/test-${i}">Product ${i}</a></article></li>`).join('')}
    </ul></div>${browseOnly ? '' : '<div class="product-carousel__purchase"><div data-ref="measurements" hidden>Size details</div></div>'}
    <button data-carousel-step="1">Next</button>${browseOnly ? '<button data-carousel-pause data-play-label="Play" data-pause-label="Pause"><span data-carousel-pause-label>Pause</span></button>' : ''}</div>`;
  const root = document.querySelector<HTMLElement>('#carousel')!;
  const onActive = vi.fn();
  aborter = new AbortController();
  const engine = createFlexCarousel(root, aborter.signal, { onActive, onFailure: vi.fn() });
  expect(engine).not.toBeNull();
  return { root, onActive, engine: engine!, next: () => root.querySelector<HTMLButtonElement>('button')!.click() };
}
beforeEach(() => {
  now = 0; frameId = 0; frames.clear(); resizeObservers.length = 0; intersections.length = 0; drawing.count = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frames.set(++frameId, callback); return frameId; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  vi.stubGlobal('IntersectionObserver', class {
    constructor(readonly callback: IntersectionObserverCallback) {}
    observe(target: Element) {
      intersections.push({ callback: this.callback, target, observer: this as unknown as IntersectionObserver });
      this.callback([{ target, isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
    }
    disconnect() {}
  });
  vi.stubGlobal('ResizeObserver', class {
    target?: Element;
    constructor(readonly callback: () => void) { resizeObservers.push(this); }
    observe(target: Element) { this.target = target; }
    disconnect() {}
  });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1200);
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function(this: HTMLElement) {
    return 720 + (parseFloat(this.style.getPropertyValue('--carousel-details-height')) || 0);
  });
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function(this: HTMLElement) {
    if (this.dataset.ref === 'measurements') return this.hidden ? 0 : 200;
    if (this.classList.contains('product-carousel__caption')) {
      const details = this.querySelector<HTMLElement>('[data-ref="measurements"]');
      return 100 + (details && !details.hidden ? 212 : 0);
    }
    return 100;
  });
});
afterEach(() => { aborter?.abort(); document.body.replaceChildren(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('editorial carousel responsiveness', () => {
  it('repaints a settled paused scene after leaving and returning to the viewport', () => {
    const { root } = mount(); advance(2400);
    const watch = intersections.find(entry => entry.target.classList.contains('product-carousel__stage'))!;
    const emit = (visible: boolean) => watch.callback([{ target: watch.target, isIntersecting: visible } as IntersectionObserverEntry], watch.observer);
    emit(false); const before = drawing.count;
    emit(true); advance(20);
    expect(drawing.count).toBeGreaterThan(before);
    expect(root.hasAttribute('data-effect-ready')).toBe(true);
  });
  it('restores native merchandise when a GPU texture fails', () => {
    const images: any[] = [];
    vi.stubGlobal('Image', class { onerror: (() => void) | null = null; onload = null; src = ''; constructor() { images.push(this); } });
    const { root } = mount();
    images[0].onerror();
    expect(root.hasAttribute('data-effect-ready')).toBe(false);
    expect(root.querySelector('.product-carousel__stage')).toBeNull();
    expect(root.querySelectorAll('[data-ref="track"] > li')).toHaveLength(4);
  });
  it('announces sold-out availability and clears it when the next product is available', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const { root } = mount(35, true, true);
    expect(root.querySelector('[role="status"]')!.textContent).toBe('Product 0, Sold out, 1 / 4');
    advance(3500);
    expect(root.querySelector('[role="status"]')!.textContent).not.toContain('Sold out');
    expect(root.querySelector('a[href="/products/test-0"]')).not.toBeNull();
  });
  it('keeps flowing between products and does not stall when the pointer hovers over the scene', () => {
    const { root } = mount(35, true); advance(2400);
    const stage = root.querySelector<HTMLElement>('.product-carousel__stage')!;
    const marker = root.querySelector<HTMLElement>('.product-carousel__marker')!;
    const x = () => Number(/translate3d\(([-\d.]+)px/.exec(marker.style.transform)?.[1]);
    stage.dispatchEvent(new PointerEvent('pointermove', { clientX: 10, clientY: 10, pointerType: 'mouse' }));
    for (let sample = 0; sample < 8; sample++) {
      const before = x(); advance(100);
      expect(Math.abs(x() - before)).toBeGreaterThan(3);
    }
    expect(marker.style.getPropertyValue('--progress')).toBe('1');
  });
  it('honors explicit pause until resumed, then returns to continuous movement', () => {
    const { root, onActive } = mount(35, true); advance(2400);
    const pause = root.querySelector<HTMLButtonElement>('[data-carousel-pause]')!;
    pause.click(); advance(1500);
    const pausedCount = onActive.mock.calls.length;
    const marker = root.querySelector<HTMLElement>('.product-carousel__marker')!;
    const resting = marker.style.transform;
    advance(3000);
    expect(onActive).toHaveBeenCalledTimes(pausedCount);
    expect(marker.style.transform).toBe(resting);
    expect(pause.getAttribute('aria-pressed')).toBe('true');
    pause.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    pause.click(); advance(1000);
    expect(pause.getAttribute('aria-pressed')).toBe('false');
    expect(marker.style.transform).not.toBe(resting);
  });
  it('holds for a drag and resumes even while the mouse remains over the carousel', () => {
    const { root, onActive } = mount(35, true); advance(2400);
    const stage = root.querySelector<HTMLElement>('.product-carousel__stage')!;
    const activeBefore = onActive.mock.calls.length;
    stage.dispatchEvent(new PointerEvent('pointerdown', { clientX: 600, clientY: 360, pointerId: 2, button: 0, pointerType: 'mouse' }));
    advance(200);
    expect(onActive).toHaveBeenCalledTimes(activeBefore);
    stage.dispatchEvent(new PointerEvent('pointermove', { clientX: 550, clientY: 360, pointerId: 2, pointerType: 'mouse' }));
    advance(17);
    stage.dispatchEvent(new PointerEvent('pointermove', { clientX: 510, clientY: 360, pointerId: 2, pointerType: 'mouse' }));
    stage.dispatchEvent(new PointerEvent('pointerup', { clientX: 510, clientY: 360, pointerId: 2, button: 0, pointerType: 'mouse' }));
    advance(2400);
    const marker = root.querySelector<HTMLElement>('.product-carousel__marker')!;
    const before = marker.style.transform; advance(150);
    expect(marker.style.transform).not.toBe(before);
    expect(stage.hasAttribute('data-dragging')).toBe(false);
  });
  it('releases a keyboard hold when input switches back to a pointer on the same stage', () => {
    const { root, onActive } = mount(35, true); advance(2400);
    const stage = root.querySelector<HTMLElement>('.product-carousel__stage')!;
    stage.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    advance(1500);
    const pausedCount = onActive.mock.calls.length; advance(2000);
    expect(onActive).toHaveBeenCalledTimes(pausedCount);
    stage.dispatchEvent(new PointerEvent('pointerdown', { clientX: 600, clientY: 360, pointerId: 3, button: 0, pointerType: 'mouse', bubbles: true }));
    stage.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 3, bubbles: true }));
    advance(2500);
    expect(onActive.mock.calls.length).toBeGreaterThan(pausedCount);
  });
  it('renders the reference lens without purchase controls and opens a product on the first click', () => {
    const { root, onActive } = mount(35, true);
    advance(1500);
    const stage = root.querySelector<HTMLElement>('.product-carousel__stage')!;
    const visit = vi.fn((event: Event) => event.preventDefault());
    root.querySelector('a[href="/products/test-0"]')!.addEventListener('click', visit);
    stage.dispatchEvent(new PointerEvent('pointerdown', { clientX: 600, clientY: 360, pointerId: 1, button: 0 }));
    stage.dispatchEvent(new PointerEvent('pointerup', { clientX: 600, clientY: 360, pointerId: 1, button: 0 }));
    expect(visit).toHaveBeenCalledOnce();
    expect(root.hasAttribute('data-focus-open')).toBe(false);
    expect(root.querySelector('.product-carousel__purchase')).toBeNull();
    advance(4500);
    expect(onActive.mock.calls.some(([index]) => index > 0)).toBe(true);
  });
  it('opens the highlighted product with Enter without a focus popup', () => {
    const { root } = mount(35, true); advance(1500);
    const visit = vi.fn((event: Event) => event.preventDefault());
    root.querySelector('a[href="/products/test-0"]')!.addEventListener('click', visit);
    root.querySelector('.product-carousel__stage')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(visit).toHaveBeenCalledOnce();
    expect(root.hasAttribute('data-focus-open')).toBe(false);
  });
  it('reveals within 1.5 seconds even when remote product images have not loaded', () => {
    const { root } = mount();
    advance(1500);
    expect(root.hasAttribute('data-revealed')).toBe(true);
  });
  it('honors a navigation click during image loading instead of resetting it on entrance', () => {
    const { root, next, onActive } = mount();
    advance(17); next(); advance(650);
    expect(root.hasAttribute('data-revealed')).toBe(true);
    expect(onActive).toHaveBeenLastCalledWith(1);
    const marker = root.querySelector<HTMLElement>('.product-carousel__marker')!;
    const left = Number(/translate3d\(([-\d.]+)px/.exec(marker.style.transform)?.[1]);
    expect(Math.abs(left + parseFloat(marker.style.width) / 2 - 600)).toBeLessThan(3);
    advance(3500);
    expect(onActive).toHaveBeenLastCalledWith(1);
  });
  it('uses the merchant speed setting for editorial navigation', () => {
    const slow = mount(10); advance(17); slow.next(); advance(180);
    expect(slow.onActive).toHaveBeenLastCalledWith(0);
    aborter.abort();
    const fast = mount(80); advance(17); fast.next(); advance(180);
    expect(fast.onActive).toHaveBeenLastCalledWith(1);
  });
  it('reserves measurement height below the scene without shifting the product marker', () => {
    const { root, next } = mount(); advance(17); next(); advance(5000);
    const stage = root.querySelector<HTMLElement>('.product-carousel__stage')!;
    const marker = root.querySelector<HTMLElement>('.product-carousel__marker')!;
    const baseline = marker.style.transform;
    const details = root.querySelector<HTMLElement>('[data-ref="measurements"]')!;
    details.hidden = false;
    resizeObservers.find(observer => observer.target?.classList.contains('product-carousel__caption'))!.callback();
    resizeObservers.find(observer => observer.target === stage)!.callback();
    // The space eases open; the cards (and so the marker) must not move at any point, including
    // mid-animation, where they used to jump up and back.
    advance(50);
    const opening = parseFloat(stage.style.getPropertyValue('--carousel-details-height'));
    expect(opening).toBeGreaterThan(0);
    expect(opening).toBeLessThan(212);
    expect(marker.style.transform).toBe(baseline);
    advance(600);
    expect(stage.style.getPropertyValue('--carousel-details-height')).toBe('212px');
    expect(marker.style.transform).toBe(baseline);
    details.hidden = true;
    resizeObservers.find(observer => observer.target?.classList.contains('product-carousel__caption'))!.callback();
    resizeObservers.find(observer => observer.target === stage)!.callback();
    advance(50);
    expect(marker.style.transform).toBe(baseline);
    advance(600);
    expect(stage.style.getPropertyValue('--carousel-details-height')).toBe('0px');
    expect(marker.style.transform).toBe(baseline);
  });
});
