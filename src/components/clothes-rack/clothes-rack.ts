import { config } from '../../core/config';
import { define } from '../../core/define';
import { NkElement } from '../../core/element';
import { animate, decorativeMotionAllowed, easing } from '../../core/motion';
import { cutout } from './rack-cutout';
import { angleForSide, clamp, faceAt, makeGarment, RackSim, stepAngle, tuningFor, type Feel } from './rack-physics';

type Side = 'front' | 'back';
type Entrance = 'brush' | 'slide' | 'drop' | 'none';

/** Waits for a photo, but never longer than a beat: a slow network must not freeze the rack. */
const settle = (work: Promise<void>, ms = 450) =>
  Promise.race([work, new Promise<void>((resolve) => setTimeout(resolve, ms))]);

/** Resolves when an animation ends, or shortly after it should have (hidden tabs pause them). */
const played = (animation: Animation | null, ms: number) =>
  animation ? settle(animation.finished.then(() => undefined, () => undefined), ms + 150) : Promise.resolve();

const SPRING = 'cubic-bezier(0.34, 1.22, 0.64, 1)';
const GLIDE = 'cubic-bezier(0.22, 1, 0.36, 1)';
/** Same pattern as the CSS (nth-child), so nothing jumps when the script takes over. */
const JITTER = [0, -1, 1];

/** Per-garment nodes the frame loop writes to, plus the last value so unchanged ones are skipped. */
interface Parts {
  turn: HTMLElement | null;
  /** Set when the piece has a side photo: these rotate on their own instead of the whole turn. */
  rotating: HTMLElement[];
  front: HTMLElement | null;
  side: HTMLElement | null;
  /** The garment's far side, once it has been cut out. */
  inner: HTMLElement | null;
  /** Cut-outs are opaque, so they recede by darkening instead of fading. */
  cut: boolean;
  label: HTMLElement | null;
  tag: HTMLElement | null;
  last: Map<HTMLElement, Partial<Record<'transform' | 'opacity' | 'translate' | 'filter', string>>>;
}

/**
 * <nk-clothes-rack> — products hang edge-on from a rail, moved by the springs in rack-physics.ts.
 * Hover (or keyboard focus) turns one to face the visitor and points "See availability" at it;
 * hangers can be dragged along the rail and shove each other aside; a click lifts one into a
 * focused view with a draggable Front/Back spin, prev/next and colourway tags. The garment links
 * stay real product links: modified clicks and no-JS visits go straight to the product page.
 *
 * Layout never changes: slots keep their width and every frame writes one transform per garment.
 * What is "under the pointer" is decided against where the garments are drawn, not their slots.
 *
 * All motion lands on .clothes-rack__turn / .clothes-rack__spin (or inside them), so the multiply
 * knock-out keeps blending with the section background (see clothes-rack.css).
 */
export class NkClothesRack extends NkElement {
  #items: HTMLElement[] = [];
  #garments: HTMLAnchorElement[] = [];
  #parts: Parts[] = [];
  #sim!: RackSim;
  #list: HTMLElement | null = null;
  #active = -1;
  #index = -1;
  #side: Side = 'front';
  #busy = false;
  #queued: (() => Promise<void>) | null = null;
  #ctaHref = '';
  #centers: number[] = [];
  #leaveTimer = 0;
  #frame = 0;
  #lastFrame = 0;
  #inside = false;
  #inView = false;
  #autoOn = false;
  #autoTimer = 0;
  #justDragged = false;
  #spin = { value: 0, velocity: 0, target: 0, frame: 0, last: 0, dragging: false, startX: 0, startValue: 0 };
  #shownSide: Side = 'front';

  /** Reads a number the section wrote onto the element. */
  #num(name: string, fallback: number): number {
    const value = parseFloat(this.dataset[name] ?? '');
    return Number.isFinite(value) ? value : fallback;
  }

  #flag(name: string): boolean {
    return this.dataset[name] === 'true';
  }

  get #config() {
    return {
      depth: this.#num('depth', 1120),
      depthFade: this.#num('depthFade', 40) / 100,
      railFade: this.#num('railFade', 10) / 100,
      room: this.#num('room', 86) / 100,
      interval: Math.max(1, this.#num('autoplaySeconds', 3)) * 1000,
      stagger: this.#num('stagger', 60),
      lift: this.#num('liftMs', 760),
      frontScale: this.#num('frontScale', 100) / 100,
      thickness: this.#num('thickness', 40) / 100,
      brush: this.#num('brush', 100) / 100,
      leave: this.#num('leaveMs', 140),
      coast: this.#num('coastMs', 700),
      arc: this.#num('arc', 100) / 100,
      lean: this.#num('lean', 2),
      entrance: (this.dataset.entrance ?? 'brush') as Entrance,
      hover: this.dataset.turnOn !== 'click',
      focusOnClick: this.dataset.clickAction !== 'product',
    };
  }

  protected mount(): void {
    this.#items = this.refs('item');
    this.#garments = this.refs<HTMLAnchorElement>('garment');
    this.#list = this.ref('list');
    const list = this.#list;
    this.#ctaHref = this.ref<HTMLAnchorElement>('cta')?.getAttribute('href') ?? '';
    if (!list || this.#garments.length === 0) return;

    this.#active = -1;
    this.#buildSim();
    this.setAttribute('data-live', '');
    this.dispose(() => {
      cancelAnimationFrame(this.#frame);
      cancelAnimationFrame(this.#spin.frame);
      window.clearTimeout(this.#autoTimer);
      window.clearTimeout(this.#leaveTimer);
      // Zeroed, not just cleared: #leaveSoon skips while an id is set, so a stale one from before
      // a rebuild (phone rotation, motion setting) would stop garments ever turning back.
      this.#leaveTimer = 0;
      this.#autoTimer = 0;
      this.#frame = 0;
      this.#spin.frame = 0;
      this.removeAttribute('data-live');
    });

    this.observeResize(list, () => this.#measure());
    this.on(list, 'scroll', () => (this.#centers = []), { passive: true });
    this.on(window, 'scroll', () => (this.#centers = []), { passive: true });
    this.#bindPointer();
    this.#bindKeyboard(list);
    this.#bindTouch(list);
    this.#bindFocus();
    this.#startEntrance();
    this.#startAutoplay();
    this.#startCutouts();
  }

  override onEditorSelect(): void {
    if (this.#isOpen) void this.#run(() => this.#close());
  }

  get #isOpen(): boolean {
    return this.hasAttribute('data-focused');
  }

  /** Phones and tablets: no hover to turn a garment. */
  get #touch(): boolean {
    return matchMedia('(hover: none)').matches;
  }

  /** The phone layout: the rail scrolls sideways under the finger. */
  get #scrolls(): boolean {
    const list = this.#list;
    return !!list && list.scrollWidth > list.clientWidth + 1;
  }

  /** The springs. The theme editor can opt in, so settings can be felt while editing them. */
  get #motion(): boolean {
    if (decorativeMotionAllowed()) return true;
    return Boolean(window.Shopify?.designMode) && this.#flag('editorMotion') && config().motion === 'standard' && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // ---- Physics --------------------------------------------------------------------------------

  #buildSim(): void {
    const side = this.#num('sideAngle', 68);
    const vary = this.#num('angleVary', 4);
    this.#sim = new RackSim(
      tuningFor({
        feel: (this.dataset.feel ?? 'balanced') as Feel,
        turnSpeed: this.#num('turnSpeed', 50),
        turnBounce: this.#num('turnBounce', 30),
        slideSpeed: this.#num('slideSpeed', 50),
        slideBounce: this.#num('slideBounce', 15),
        // Phones can swing differently, because the rail moves under a finger there.
        swing: (this.#num('swing', 100) / 100) * (matchMedia('(max-width: 749px)').matches ? this.#num('phoneSwing', 100) / 100 : 1),
        swingSeconds: this.#num('swingSeconds', 3),
        drape: this.#num('drape', 50) / 100,
      }),
    );
    this.#sim.garments = this.#items.map((_, i) => makeGarment(0, side + (JITTER[i % 3] ?? 0) * vary));
    this.#parts = this.#items.map((item) => {
      const side = item.querySelector<HTMLElement>('.clothes-rack__img--side');
      const front = item.querySelector<HTMLElement>('.clothes-rack__img:not(.clothes-rack__img--side)');
      const hanger = item.querySelector<HTMLElement>('.clothes-rack__hanger');
      return {
        turn: item.querySelector<HTMLElement>('.clothes-rack__turn'),
        rotating: side ? ([hanger, front].filter(Boolean) as HTMLElement[]) : [],
        front,
        side,
        inner: null,
        cut: false,
        label: item.querySelector<HTMLElement>('.clothes-rack__label'),
        tag: item.querySelector<HTMLElement>('.clothes-rack__hangtag'),
        last: new Map(),
      };
    });
    this.#measure();
    this.#sim.settle();
    this.#paint();
  }

  /** Reads slots from layout. The garment link is never transformed, so its box is the resting box. */
  #measure(): void {
    const sim = this.#sim;
    const first = this.#items[0];
    const garment = this.#garments[0];
    if (!first || !garment) return;
    this.#centers = [];
    const left = first.getBoundingClientRect().left + first.offsetWidth / 2;
    this.#items.forEach((item, i) => {
      const g = sim.garments[i];
      if (g) g.base = item.getBoundingClientRect().left + item.offsetWidth / 2 - left;
    });
    sim.slot = first.offsetWidth;
    sim.wide = garment.offsetWidth * this.#config.room * this.#config.frontScale;
    const rail = (this.ref('rail')?.offsetWidth ? this.ref('rail') : this.ref('stage'))?.getBoundingClientRect();
    if (rail) {
      const edge = sim.wide / 2;
      sim.min = rail.left + edge - left;
      sim.max = rail.right - edge - left;
    }
    this.#retarget();
  }

  /** How far neighbours stand aside for the garment in front. */
  get #gap(): number {
    return Math.max(0, (this.#sim.wide - this.#sim.slot) / 2);
  }

  /** Aims every garment at where the current state wants it. */
  #retarget(): void {
    const open = this.#isOpen;
    const front = open ? this.#index : this.#active;
    const width = this.#garments[0]?.offsetWidth ?? 0;
    const gap = open ? Math.max(this.#gap, width * 0.62) : this.#gap;
    const { railFade } = this.#config;
    const hero = open ? this.ref('hero')?.getBoundingClientRect() : null;
    this.#sim.garments.forEach((g, i) => {
      g.tx = front < 0 ? 0 : Math.sign(i - front) * gap;
      g.tturn = !open && i === front ? 0 : g.rest;
      // Multiply has no occlusion: a faded garment behind the hero would show through its cloth.
      const behind = hero ? Math.abs(this.#drawn(i) - g.x + g.tx - (hero.left + hero.width / 2)) < (hero.width + this.#sim.slot) / 2 : false;
      g.tfade = !open ? 1 : i === front || behind ? 0 : railFade;
    });
    this.#kick();
  }

  #kick(): void {
    if (!this.isConnected) return;
    if (!this.#motion) {
      this.#sim.settle();
      this.#paint();
      return;
    }
    if (!this.#frame) {
      this.#lastFrame = 0;
      this.#frame = requestAnimationFrame(this.#tick);
    }
  }

  #tick = (now: number): void => {
    const dt = this.#lastFrame ? (now - this.#lastFrame) / 1000 : 1 / 60;
    this.#lastFrame = now;
    const busy = this.#sim.step(dt, now);
    this.#paint(now);
    this.#frame = busy ? requestAnimationFrame(this.#tick) : 0;
  };

  #write(parts: Parts, node: HTMLElement | null, property: 'transform' | 'opacity' | 'translate' | 'filter', value: string): void {
    if (!node) return;
    let memo = parts.last.get(node);
    if (!memo) parts.last.set(node, (memo = {}));
    if (memo[property] === value) return;
    memo[property] = value;
    node.style[property] = value;
  }

  #paint(now = performance.now()): void {
    const { depth, depthFade, frontScale, thickness } = this.#config;
    const { drape } = this.#sim.tuning;
    this.#sim.garments.forEach((g, i) => {
      const parts = this.#parts[i];
      if (!parts) return;
      const lag = clamp(-g.vswing * 0.03 * drape, -5, 5);
      const place = `translate3d(${g.x.toFixed(2)}px, ${g.y.toFixed(2)}px, 0) rotate(${g.swing.toFixed(3)}deg)`;
      const facing = g.rest ? clamp(1 - g.turn / g.rest, 0, 1) : 1;
      const grow = 1 + (frontScale - 1) * facing;
      const turn = `perspective(${depth}px) rotateY(${g.turn.toFixed(2)}deg) skewX(${lag.toFixed(3)}deg) scale(${grow.toFixed(4)})`;

      if (parts.side) {
        // A side photo already looks edge-on, so it is shown flat and the front photo takes over
        // halfway through the turn.
        const e = g.rest ? clamp(1 - g.turn / g.rest, 0, 1) : 1;
        this.#write(parts, parts.turn, 'transform', place);
        for (const node of parts.rotating) this.#write(parts, node, 'transform', turn);
        this.#write(parts, parts.side, 'transform', `perspective(${depth}px) rotateY(${(Math.min(1, e * 2) * -84).toFixed(2)}deg)`);
        this.#write(parts, parts.side, 'opacity', clamp((0.56 - e) / 0.12, 0, 1).toFixed(3));
        this.#write(parts, parts.front, 'opacity', clamp((e - 0.44) / 0.12, 0, 1).toFixed(3));
      } else {
        this.#write(parts, parts.turn, 'transform', `${place} ${turn}`);
      }

      // Garments turned away recede a little, like cloth further from the light. Fading (not
      // darkening) keeps white studio backgrounds invisible under the multiply knock-out.
      const sine = Math.sin((g.turn * Math.PI) / 180);
      const shade = 1 - depthFade * 0.35 * sine * sine;
      this.#write(parts, parts.turn, 'opacity', (now < g.hold ? 0 : (parts.cut ? 1 : shade) * g.fade).toFixed(3));
      if (parts.cut) this.#write(parts, parts.turn, 'filter', `brightness(${shade.toFixed(3)})`);
      // The far side slides out from behind as the garment turns away.
      if (parts.inner) this.#write(parts, parts.inner, 'translate', `${(sine * 6.5 * thickness).toFixed(2)}% 0.8%`);
      this.#write(parts, parts.label, 'translate', `${g.x.toFixed(1)}px 0`);
      this.#write(parts, parts.tag, 'transform', `translate3d(${g.x.toFixed(2)}px, ${g.y.toFixed(2)}px, 0) rotate(${(-10 + g.tag).toFixed(2)}deg)`);
    });
  }

  #impulse(index: number, amount: number): void {
    const g = this.#sim.garments[index];
    if (!g || !this.#motion) return;
    g.vswing += amount * this.#sim.tuning.swing;
    this.#kick();
  }

  // ---- Entrance and autoplay -------------------------------------------------------------------

  #startEntrance(): void {
    const { entrance, stagger } = this.#config;
    const entering = decorativeMotionAllowed() && entrance !== 'none';
    const sim = this.#sim;
    const count = sim.garments.length;
    const width = this.#list?.clientWidth ?? 0;
    if (entering && (entrance === 'slide' || entrance === 'drop')) {
      // Waits off-stage; the rightmost slides in first so nothing runs through its neighbours.
      sim.garments.forEach((g) => {
        g.hold = Infinity;
        if (entrance === 'slide') g.x = -width * 0.5;
        else g.y = -(this.#garments[0]?.offsetHeight ?? 200) * 0.14;
      });
      this.#paint();
    }
    let entered = false;
    this.observeIntersection(
      this,
      (entry) => {
        this.#inView = entry.isIntersecting;
        if (!entry.isIntersecting || entered) return;
        entered = true;
        // The scrolling layout opens with the garment in the middle already facing the visitor.
        this.later(() => this.#recentre(), entering ? 700 + count * stagger : 0);
        if (!entering) return;
        const now = performance.now();
        sim.garments.forEach((g, i) => {
          const order = entrance === 'slide' ? count - 1 - i : i;
          g.hold = entrance === 'brush' ? 0 : now + order * stagger;
          if (entrance === 'brush') {
            this.later(() => this.#impulse(i, 46 - i * 2.5), 120 + i * stagger);
          } else if (entrance === 'drop') {
            this.later(() => this.#impulse(i, i % 2 ? 26 : -26), order * stagger + 120);
          }
        });
        this.#kick();
      },
      { threshold: 0.2 },
    );
  }

  get #cutOptions() {
    return {
      shading: this.#num('shading', 60) / 100,
      shadow: this.#num('shadow', 35) / 100,
      blur: this.#num('shadowBlur', 50) / 100,
      distance: this.#num('shadowDistance', 50) / 100,
      tolerance: this.#num('cutTolerance', 4),
    };
  }

  /** Phones get smaller photos to cut, and Data Saver visitors keep the plain blend. */
  #cutSource(url: string): string {
    return url.replace(/width=\d+/, matchMedia('(max-width: 749px)').matches ? 'width=640' : 'width=900');
  }

  get #cuts(): boolean {
    const saver = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    return this.#flag('cutOut') && !saver;
  }

  /** Swaps each hanging photo for its cut-out shortly before the rack scrolls into view. */
  #startCutouts(): void {
    if (!this.#cuts) return;
    let started = false;
    this.observeIntersection(
      this,
      (entry) => {
        if (!entry.isIntersecting || started) return;
        started = true;
        this.#items.forEach((item, i) => void this.#cutGarment(item, i));
      },
      { rootMargin: '900px 0px' },
    );
  }

  async #cutGarment(item: HTMLElement, index: number): Promise<void> {
    const parts = this.#parts[index];
    const front = this.#garments[index]?.dataset.front;
    const img = parts?.front as HTMLImageElement | null | undefined;
    if (!parts || !front || !img || parts.side) return;
    const url = await cutout(this.#cutSource(front), this.#cutOptions);
    if (!url || !this.isConnected) return;
    const next = new Image();
    next.src = url;
    await next.decode().catch(() => undefined);
    if (!this.isConnected) return;
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
    img.src = url;
    const inner = img.cloneNode() as HTMLImageElement;
    inner.classList.add('clothes-rack__img--inner');
    img.before(inner);
    parts.inner = inner;
    parts.cut = true;
    item.classList.add('is-cut');
    this.#paint();
  }

  #startAutoplay(): void {
    if (!this.#flag('autoplay')) return;
    this.#autoOn = true;
    const { interval } = this.#config;
    const tick = () => {
      if (!this.#autoOn) return;
      if (this.#inView && !this.#inside && !this.#isOpen && !document.hidden && this.#motion && !this.#scrolls) {
        const count = this.#garments.length;
        this.#setActive((this.#active + 1) % count);
      }
      this.#autoTimer = window.setTimeout(tick, interval);
    };
    this.#autoTimer = window.setTimeout(tick, Math.min(interval, 1400));
  }

  /** Taking hold of the rack ends the show for good. */
  #stopAutoplay(): void {
    this.#autoOn = false;
    window.clearTimeout(this.#autoTimer);
  }

  // ---- Pointer ---------------------------------------------------------------------------------

  #bindPointer(): void {
    const list = this.#list!;
    const { hover, focusOnClick } = this.#config;
    const canDrag = this.#flag('drag');
    const press = { id: -1, index: -1, x: 0, y: 0, grab: 0, lastX: 0, lastT: 0, v: 0 };

    // Hover picks a garment only in the band from the rail to the hems (the section is taller:
    // it reserves room for the focused view). Below that band nothing new is picked, but the
    // chosen garment stays facing the visitor, so the pointer can travel down to "See
    // availability" for it. Going above the rail or out of the section lets it go.
    this.on(this, 'pointermove', (event) => {
      if (event.pointerType !== 'mouse' || this.#isOpen || this.#scrolls) return;
      this.#inside = true;
      if (press.id === event.pointerId) return;
      const band = this.#band();
      if (event.clientY < band.top) return this.#leaveSoon();
      if (event.clientY > band.bottom) return this.#stay();
      this.#stay();
      if (!hover) return;
      const index = this.#hit(event.clientX);
      if (index !== this.#active) this.#setActive(index);
    });
    // A lifted finger "leaves" too; on touch the garment in the middle stays the chosen one.
    this.on(this, 'pointerleave', (event) => {
      if (event.pointerType !== 'mouse' || this.#scrolls) return;
      this.#inside = false;
      if (press.id < 0) this.#leaveSoon();
    });

    this.on(list, 'dragstart', (event) => event.preventDefault());
    // The phone layout in a narrow desktop window: a mouse drag scrolls the rail, as a finger does.
    const pan = { id: -1, x: 0, left: 0, moved: false };
    this.on(list, 'pointerdown', (event) => {
      if (event.pointerType !== 'mouse' || event.button !== 0 || !this.#scrolls || this.#isOpen) return;
      Object.assign(pan, { id: event.pointerId, x: event.clientX, left: list.scrollLeft, moved: false });
    });
    this.on(list, 'pointermove', (event) => {
      if (pan.id !== event.pointerId) return;
      const dx = event.clientX - pan.x;
      if (!pan.moved) {
        if (Math.abs(dx) < 6) return;
        pan.moved = true;
        list.setPointerCapture(event.pointerId);
        list.style.scrollSnapType = 'none';
        this.toggleAttribute('data-dragging', true);
      }
      list.scrollLeft = pan.left - dx;
    });
    const endPan = (event: PointerEvent) => {
      if (pan.id !== event.pointerId) return;
      pan.id = -1;
      if (!pan.moved) return;
      if (list.hasPointerCapture(event.pointerId)) list.releasePointerCapture(event.pointerId);
      this.removeAttribute('data-dragging');
      // Glide to the garment nearest the middle, as a released finger would, and turn it to face the visitor.
      const middle = list.getBoundingClientRect().left + list.clientWidth / 2;
      let shift = Infinity;
      for (const item of this.#items) {
        const box = item.getBoundingClientRect();
        const d = box.left + box.width / 2 - middle;
        if (Math.abs(d) < Math.abs(shift)) shift = d;
      }
      list.style.removeProperty('scroll-snap-type');
      if (Number.isFinite(shift)) list.scrollBy({ left: shift, behavior: 'smooth' });
      this.#recentre();
      this.#justDragged = true;
      window.setTimeout(() => (this.#justDragged = false), 0);
    };
    this.on(window, 'pointerup', endPan as EventListener);
    this.on(window, 'pointercancel', endPan as EventListener);

    this.on(list, 'pointerdown', (event) => {
      if (!canDrag || event.button !== 0 || event.pointerType === 'touch' || this.#isOpen || this.#scrolls) return;
      const index = this.#hit(event.clientX);
      if (index < 0) return;
      const now = performance.now();
      Object.assign(press, { id: event.pointerId, index, x: event.clientX, y: event.clientY, grab: NaN, lastX: event.clientX, lastT: now, v: 0 });
    });
    this.on(list, 'pointermove', (event) => {
      if (press.id !== event.pointerId) return;
      const sim = this.#sim;
      const g = sim.garments[press.index];
      if (!g) return;
      const now = performance.now();
      if (Number.isNaN(press.grab)) {
        const dx = event.clientX - press.x;
        if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(event.clientY - press.y)) return;
        press.grab = event.clientX - this.#drawn(press.index);
        sim.drag = press.index;
        list.setPointerCapture(event.pointerId);
        this.toggleAttribute('data-dragging', true);
        this.#stopAutoplay();
        if (this.#active !== press.index) this.#setActive(press.index);
      }
      press.v = press.v * 0.6 + ((event.clientX - press.lastX) / Math.max(1, now - press.lastT)) * 0.4;
      press.lastX = event.clientX;
      press.lastT = now;
      g.vx = press.v * 1000;
      g.x = clamp(event.clientX - press.grab - (this.#centers[press.index] ?? 0), sim.min - g.base, sim.max - g.base);
      sim.free = now + 900;
      this.#kick();
    });
    const release = (event: PointerEvent) => {
      if (press.id !== event.pointerId) return;
      const dragged = !Number.isNaN(press.grab);
      press.id = -1;
      if (!dragged) return;
      const sim = this.#sim;
      sim.drag = -1;
      sim.free = performance.now() + this.#config.coast;
      this.removeAttribute('data-dragging');
      if (list.hasPointerCapture(event.pointerId)) list.releasePointerCapture(event.pointerId);
      this.#justDragged = true;
      window.setTimeout(() => (this.#justDragged = false), 0);
      this.#kick();
    };
    // On the window: a press released off the rail must still end, or hover stays stuck on it.
    this.on(window, 'pointerup', release as EventListener);
    this.on(window, 'pointercancel', release as EventListener);

    this.on(list, 'click', (event) => {
      const garment = (event.target as Element).closest<HTMLAnchorElement>('[data-ref="garment"]');
      if (this.#justDragged) {
        event.preventDefault();
        return;
      }
      if (!garment || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const tapped = this.#garments.indexOf(garment);
      const hit = this.#hit(event.clientX);
      // Keyboard "clicks" have no position: use the link itself.
      const under = event.detail === 0 ? tapped : hit >= 0 ? hit : tapped;
      const pointed = this.#scrolls ? under : !hover || this.#touch ? under : this.#active >= 0 ? this.#active : under;
      // Without hover the first press turns the garment and the second one acts on it.
      if ((!hover || (this.#touch && !this.#scrolls)) && event.detail !== 0 && pointed !== this.#active) {
        event.preventDefault();
        this.#stopAutoplay();
        this.#setActive(pointed);
        return;
      }
      this.#stopAutoplay();
      if (!focusOnClick) {
        const target = this.#garments[pointed];
        if (target && target !== garment) {
          event.preventDefault();
          location.assign(target.href);
        }
        return;
      }
      event.preventDefault();
      void this.#run(() => this.#open(pointed));
    });
  }

  #bindKeyboard(list: HTMLElement): void {
    this.on(list, 'focusin', (event) => {
      const index = this.#garments.indexOf(event.target as HTMLAnchorElement);
      if (index >= 0 && !this.#isOpen && !this.#touch && !this.#scrolls && !this.#inside) {
        this.#stopAutoplay();
        this.#setActive(index);
      }
    });
    this.on(list, 'keydown', (event) => {
      const moves: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, Home: -Infinity, End: Infinity };
      const move = moves[event.key];
      if (move === undefined || this.#isOpen) return;
      const from = this.#garments.indexOf(event.target as HTMLAnchorElement);
      if (from < 0) return;
      event.preventDefault();
      const next = clamp(from + move, 0, this.#garments.length - 1);
      this.#garments[next]?.focus({ preventScroll: true });
    });
    this.on(this, 'focusout', (event) => {
      if (this.#isOpen || this.#inside || this.#touch || this.#scrolls) return;
      if (!this.contains(event.relatedTarget as Node | null)) this.#setActive(-1);
    });
  }

  /**
   * Touch: the garment nearest the middle of the scrolled rail turns to face the visitor, a flick
   * sets the hangers swinging, and in the focused view a sideways swipe steps between garments.
   */
  #bindTouch(list: HTMLElement): void {
    let frame = 0;
    const centre = () => {
      frame = 0;
      if (!this.#scrolls || this.#isOpen || this.#busy) return;
      const view = list.getBoundingClientRect();
      if (view.bottom < 0 || view.top > innerHeight) return;
      const middle = view.left + view.width / 2;
      let best = -1;
      let distance = Infinity;
      this.#items.forEach((item, i) => {
        const box = item.getBoundingClientRect();
        const d = Math.abs(box.left + box.width / 2 - middle);
        if (d < distance) { distance = d; best = i; }
      });
      if (best !== this.#active) this.#setActive(best);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(centre); };
    let lastLeft = list.scrollLeft;
    let lastTime = 0;
    let lastSpeed = 0;
    this.on(
      list,
      'scroll',
      () => {
        schedule();
        const now = performance.now();
        const speed = lastTime ? (list.scrollLeft - lastLeft) / Math.max(1, now - lastTime) : 0;
        lastLeft = list.scrollLeft;
        lastTime = now;
        const change = clamp(speed - lastSpeed, -2, 2);
        lastSpeed = speed;
        if (Math.abs(change) > 0.05) for (let i = 0; i < this.#items.length; i++) this.#impulse(i, change * 22);
      },
      { passive: true },
    );
    this.observeIntersection(this, (entry) => { if (entry.isIntersecting) schedule(); });
    this.dispose(() => cancelAnimationFrame(frame));
    this.#recentre = schedule;

    const focus = this.ref('focus');
    if (!focus) return;
    const heroSpins = this.#flag('spinDrag');
    let start: { x: number; y: number; id: number } | null = null;
    this.on(focus, 'pointerdown', (event) => {
      const target = event.target as Element;
      if (event.pointerType === 'mouse' || target.closest('button, a')) return;
      if (heroSpins && target.closest('[data-ref="hero"]')) return;
      start = { x: event.clientX, y: event.clientY, id: event.pointerId };
    });
    this.on(focus, 'pointerup', (event) => {
      if (!start || event.pointerId !== start.id) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      start = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) void this.#run(() => this.#step(dx < 0 ? 1 : -1));
    });
    this.on(focus, 'pointercancel', () => (start = null));
  }

  #recentre: () => void = () => {};

  /** Runs one transition at a time; the latest request made meanwhile runs next (never dropped). */
  async #run(task: () => Promise<void>): Promise<void> {
    if (this.#busy) {
      this.#queued = task;
      return;
    }
    this.#busy = true;
    try {
      await task();
    } finally {
      this.#busy = false;
    }
    const next = this.#queued;
    this.#queued = null;
    if (next) await this.#run(next);
  }

  /** A short grace period: brushing past the rack's edge shouldn't snap every garment back. */
  #leaveSoon(): void {
    if (this.#leaveTimer || this.#active < 0 || this.#sim.drag >= 0) return;
    this.#leaveTimer = window.setTimeout(() => {
      this.#leaveTimer = 0;
      if (!this.#isOpen) this.#setActive(-1);
    }, this.#config.leave);
  }

  #stay(): void {
    window.clearTimeout(this.#leaveTimer);
    this.#leaveTimer = 0;
  }

  /** From the rail to the hems (photos carry a white margin under the garment). */
  #band(): { top: number; bottom: number } {
    const box = this.#garments[0]?.getBoundingClientRect();
    return box ? { top: box.top, bottom: box.bottom - box.width * 0.1 } : { top: 0, bottom: 0 };
  }

  /** Where a garment is drawn right now, in viewport pixels. */
  #drawn(index: number): number {
    if (this.#centers.length !== this.#items.length) {
      this.#centers = this.#items.map((item) => {
        const box = item.getBoundingClientRect();
        return box.left + box.width / 2;
      });
    }
    return (this.#centers[index] ?? 0) + (this.#sim.garments[index]?.x ?? 0);
  }

  /**
   * The garment drawn under clientX: distance from where it is drawn, relative to how wide it is
   * drawn, so the one facing the visitor keeps hover across its whole width. Targets rather than
   * live positions, or a neighbour sliding away would steal hover back mid-move.
   */
  #hit(clientX: number): number {
    let best = -1;
    let bestScore = Infinity;
    this.#sim.garments.forEach((g, i) => {
      const facing = i === this.#active;
      const drawn = this.#drawn(i) - g.x + g.tx;
      const half = (facing ? this.#sim.wide : this.#sim.slot) / 2;
      // Slight preference for the current garment so the edge between two doesn't flicker.
      const score = Math.abs(clientX - drawn) / half - (facing ? 0.12 : 0);
      if (score < bestScore) {
        bestScore = score;
        best = i;
      }
    });
    return bestScore <= 1.6 ? best : -1;
  }

  #setActive(index: number): void {
    const previous = this.#active;
    if (previous === index) return;
    this.#active = index;
    this.#items.forEach((item, i) => item.classList.toggle('is-active', i === index));
    this.toggleAttribute('data-has-active', index >= 0);
    this.#showCta(index);
    this.#retarget();
    if (index >= 0) {
      // The neighbours get brushed aside, and the one it replaces settles back.
      const direction = previous < 0 ? 1 : Math.sign(index - previous);
      const { brush } = this.#config;
      this.#impulse(index, direction * 16 * brush);
      this.#impulse(index - 1, -28 * brush);
      this.#impulse(index + 1, 28 * brush);
      this.#preload(index); // hovering is a strong hint of a click
    }
    if (previous >= 0) {
      this.#impulse(previous - 1, 12 * this.#config.brush);
      this.#impulse(previous + 1, -12 * this.#config.brush);
    }
  }

  // ---- Focused view ----------------------------------------------------------------------------

  #bindFocus(): void {
    const focus = this.ref('focus');
    if (!focus) return;
    const button = (name: string, task: () => Promise<void>) => {
      const node = this.ref(name);
      if (node) this.on(node, 'click', () => void this.#run(task));
    };
    button('close', () => this.#close());
    button('prev', () => this.#step(-1));
    button('next', () => this.#step(1));
    const sides = this.ref('sides');
    if (sides) {
      this.on(sides, 'click', (event) => {
        const side = (event.target as Element).closest<HTMLElement>('[data-side]')?.dataset.side as Side | undefined;
        if (side) this.#turnTo(side);
      });
    }
    this.on(focus, 'click', (event) => {
      if (event.target === focus) void this.#run(() => this.#close());
    });
    this.on(this, 'keydown', (event) => {
      if (!this.#isOpen) return;
      if (event.key === 'Escape') void this.#run(() => this.#close());
      else if (event.key === 'ArrowLeft') void this.#run(() => this.#step(-1));
      else if (event.key === 'ArrowRight') void this.#run(() => this.#step(1));
    });
    if (this.#flag('spinDrag')) this.#bindSpin();
  }

  /** Grab the hero and turn it by hand; on release it settles on whichever side is nearer. */
  #bindSpin(): void {
    const hero = this.ref('hero');
    if (!hero) return;
    const s = this.#spin;
    this.on(hero, 'pointerdown', (event) => {
      if (event.button !== 0 || !this.#isOpen || this.#busy) return;
      s.dragging = true;
      s.startX = event.clientX;
      s.startValue = s.value;
      s.velocity = 0;
      cancelAnimationFrame(s.frame);
      s.frame = 0;
      hero.setPointerCapture(event.pointerId);
    });
    this.on(hero, 'pointermove', (event) => {
      if (!s.dragging) return;
      const reach = this.#garments[this.#index]?.dataset.back ? 360 : 35;
      s.value = clamp(s.startValue + (event.clientX - s.startX) * 0.45, s.startValue - reach, s.startValue + reach);
      this.#paintSpin();
    });
    const release = () => {
      if (!s.dragging) return;
      s.dragging = false;
      const side = this.#garments[this.#index]?.dataset.back ? faceAt(s.value).side : 'front';
      this.#spinTo(side);
    };
    this.on(hero, 'pointerup', release);
    this.on(hero, 'pointercancel', release);
  }

  #paintSpin(): void {
    const spin = this.ref('spin');
    if (!spin) return;
    const { side, shown } = faceAt(this.#spin.value);
    spin.style.transform = shown === 0 ? '' : `perspective(${this.#config.depth}px) rotateY(${shown.toFixed(2)}deg)`;
    if (side !== this.#shownSide) {
      this.#shownSide = side;
      const back = this.ref('face-back');
      const front = this.ref('face');
      if (back) back.style.visibility = side === 'back' ? 'visible' : 'hidden';
      if (front) front.style.visibility = side === 'back' ? 'hidden' : 'visible';
    }
  }

  #spinTo(side: Side): void {
    const s = this.#spin;
    this.#side = side;
    this.#syncSides();
    s.target = angleForSide(s.value, side);
    if (!this.#motion) {
      s.value = s.target;
      s.velocity = 0;
      this.#paintSpin();
      return;
    }
    if (s.frame) return;
    s.last = 0;
    const loop = (now: number) => {
      const dt = s.last ? (now - s.last) / 1000 : 1 / 60;
      s.last = now;
      const moving = stepAngle(s, dt, this.#sim.tuning.turn);
      this.#paintSpin();
      s.frame = moving ? requestAnimationFrame(loop) : 0;
    };
    s.frame = requestAnimationFrame(loop);
  }

  /** Back to a clean front view, without animating: a different garment is about to arrive. */
  #resetSpin(): void {
    const s = this.#spin;
    cancelAnimationFrame(s.frame);
    s.frame = 0;
    s.value = 0;
    s.velocity = 0;
    s.target = 0;
    s.dragging = false;
    this.#paintSpin();
  }

  /** The hero's starting pose over a hanging garment: where it hangs, at its current angle. */
  #pose(index: number, angle: number, x: number): { dx: number; dy: number; scale: number; angle: number } | null {
    const spin = this.ref('spin');
    // The garment link is never transformed, so its box is where the garment hangs at rest.
    const from = this.#garments[index]?.getBoundingClientRect();
    if (!spin || !from) return null;
    const saved = spin.style.transform;
    const animations = spin.getAnimations();
    animations.forEach((a) => a.pause());
    spin.style.transform = 'none';
    const to = spin.getBoundingClientRect();
    spin.style.transform = saved;
    animations.forEach((a) => a.play());
    if (!to.width) return null;
    return {
      dx: from.left + from.width / 2 + x - (to.left + to.width / 2),
      dy: from.top - to.top,
      scale: from.width / to.width,
      angle,
    };
  }

  /** Lifts in an arc: up off the rail, a slight lean, then across. Same function list throughout. */
  #flight(pose: { dx: number; dy: number; scale: number; angle: number }, t: number, lift: number, lean: number): string {
    const k = 1 - t;
    const scale = pose.scale + (1 - pose.scale) * t;
    return `translate(${pose.dx * k}px, ${pose.dy * k - lift}px) scale(${scale}) rotate(${lean}deg) perspective(${this.#config.depth}px) rotateY(${pose.angle * k}deg)`;
  }

  async #open(index: number): Promise<void> {
    const focus = this.ref('focus');
    const spin = this.ref('spin');
    if (!focus || !spin || index < 0 || this.#isOpen) return;
    const g = this.#sim.garments[index];
    if (!g) return;
    const angle = g.turn;
    const x = g.x;

    this.#index = index;
    this.#side = 'front';
    this.#resetSpin();
    window.clearTimeout(this.#leaveTimer);
    // Respond at once; give the photo a moment to arrive before it flies in.
    const ready = this.#fill();
    // All of them: on a phone the garment tapped need not be the one that was facing the visitor.
    for (const item of this.#items) item.classList.remove('is-active');
    this.#active = -1;
    this.setAttribute('data-focused', '');
    focus.hidden = false;
    this.#retarget();
    g.fade = 0; // the hero takes its place in the same frame
    const pose = this.#pose(index, angle, x);
    spin.style.opacity = '0';
    await settle(ready, 350);
    spin.style.opacity = '';
    requestAnimationFrame(() => focus.classList.add('is-shown'));
    if (pose) {
      const { lift: duration, arc: arcScale, lean: leanBy } = this.#config;
      const arc = Math.min(70, Math.abs(pose.dy) * 0.25 + 24) * arcScale;
      const lean = pose.dx > 0 ? -leanBy : leanBy;
      await played(
        animate(
          spin,
          [
            { transform: this.#flight(pose, 0, 0, 0), offset: 0 },
            { transform: this.#flight(pose, 0.55, arc, lean), offset: 0.45 },
            { transform: this.#flight(pose, 1, 0, 0), offset: 1 },
          ],
          { duration, easing: GLIDE },
        ),
        duration,
      );
    }
    this.ref('close')?.focus({ preventScroll: true });
  }

  async #close(): Promise<void> {
    if (!this.#isOpen) return;
    const focus = this.ref('focus');
    const spin = this.ref('spin');
    const index = this.#index;
    const g = this.#sim.garments[index];
    this.#resetSpin();
    focus?.classList.remove('is-shown');
    // Rail first, so the garments glide back while the hero returns to its hook.
    this.removeAttribute('data-focused');
    if (g) g.tfade = 0;
    this.#sim.garments.forEach((other) => {
      other.tx = 0;
      if (other !== g) other.tfade = 1;
    });
    this.#kick();
    const pose = spin && g ? this.#pose(index, g.rest, 0) : null;
    const { lift } = this.#config;
    const duration = lift * 0.84;
    const back =
      spin && pose
        ? animate(
            spin,
            [
              { transform: this.#flight(pose, 1, 0, 0), opacity: 1, offset: 0 },
              { transform: this.#flight(pose, 0, 0, 0), opacity: 1, offset: 0.9 },
              { transform: this.#flight(pose, 0, 0, 0), opacity: 0, offset: 1 },
            ],
            { duration, easing: GLIDE, fill: 'forwards' },
          )
        : null;
    await played(back, duration);
    if (g) {
      g.fade = 1;
      g.tfade = 1;
      // It lands on the hook with a little swing.
      this.#impulse(index, index % 2 ? 30 : -30);
    }
    this.#kick();
    if (focus) focus.hidden = true;
    back?.cancel();
    this.#showCta(-1);
    this.#garments[index]?.focus({ preventScroll: true });
    this.#recentre();
  }

  /** Next/previous: the hero slides off turning away, the next garment slides in turning to face. */
  async #step(direction: 1 | -1): Promise<void> {
    const spin = this.ref('spin');
    if (!this.#isOpen || this.#garments.length < 2) return;
    const count = this.#garments.length;
    const { depth } = this.#config;
    this.#resetSpin();
    const leave = spin
      ? animate(
          spin,
          [
            { transform: `translateX(0%) perspective(${depth}px) rotateY(0deg)`, opacity: 1 },
            { transform: `translateX(${direction * -38}%) perspective(${depth}px) rotateY(${direction * 55}deg)`, opacity: 0 },
          ],
          { duration: 280, easing: easing.in, fill: 'forwards' },
        )
      : null;
    this.#index = (this.#index + direction + count) % count;
    this.#side = 'front';
    this.#retarget();
    const incoming = this.#sim.garments[this.#index];
    if (incoming) incoming.fade = 0;
    this.#swapName();
    await played(leave, 280);
    await settle(this.#fill());
    const enter = spin
      ? animate(
          spin,
          [
            { transform: `translateX(${direction * 38}%) perspective(${depth}px) rotateY(${direction * -55}deg)`, opacity: 0 },
            { transform: `translateX(0%) perspective(${depth}px) rotateY(0deg)`, opacity: 1 },
          ],
          { duration: 640, easing: SPRING },
        )
      : null;
    leave?.cancel();
    await played(enter, 640);
  }

  #turnTo(side: Side): void {
    if (!this.#isOpen || side === this.#side) return;
    this.#spinTo(side);
  }

  /** Cross-fades the product name; #fill writes the new text while it is faded out. */
  #swapName(): void {
    const name = this.ref('name');
    if (!name) return;
    name.classList.add('is-swapping');
    this.later(() => name.classList.remove('is-swapping'), 300);
  }

  /**
   * Points the availability button at a garment (or back at the collection for -1) and shows
   * its stock: the sizes, sold-out ones struck through.
   */
  #showCta(index: number): void {
    const cta = this.ref<HTMLAnchorElement>('cta');
    if (!cta) return;
    const garment = this.#garments[index];
    cta.href = garment?.href ?? this.#ctaHref;
    if (cta.dataset.for === String(index)) return;
    const switching = Boolean(garment) && Number(cta.dataset.for ?? -1) >= 0;
    cta.dataset.for = String(index);

    const { title = '', available = '1', sizes = '' } = garment?.dataset ?? {};
    const stock = sizes
      .split('|')
      .filter(Boolean)
      .map((entry) => {
        const [size = '', inStock] = entry.split('~');
        return { size, inStock: inStock === '1' };
      });
    cta.dataset.state = !garment ? 'idle' : available === '1' ? 'ready' : 'soldout';

    // Say which garment this is about, so that moving to another one visibly changes the button.
    const named = this.ref('cta-for');
    if (named && garment) {
      named.textContent = available === '1' ? title : `${title} · ${cta.dataset.soldout ?? 'Sold out'}`;
      if (switching) {
        animate(named, [{ opacity: 0, transform: 'translateY(0.4rem)' }, { opacity: 0.72, transform: 'none' }], { duration: 320, easing: GLIDE });
        animate(cta, [{ transform: 'scale(1)' }, { transform: 'scale(1.035)', offset: 0.35 }, { transform: 'scale(1)' }], { duration: 380, easing: 'ease-out' });
      }
    }

    const strip = this.ref('sizes');
    // Keep the old sizes in place while the strip closes; swap them only when there is a garment.
    if (strip && garment) {
      strip.replaceChildren(
        ...stock.map(({ size, inStock }, i) => {
          const chip = document.createElement('span');
          chip.className = `clothes-rack__cta-size${inStock ? '' : ' is-out'}`;
          chip.style.setProperty('--chip', String(i));
          chip.textContent = size;
          return chip;
        }),
      );
    }
    strip?.parentElement?.classList.toggle('has-sizes', Boolean(garment) && stock.length > 0);

    const context = this.ref('cta-context');
    if (context) {
      const open = stock.filter((s) => s.inStock).map((s) => s.size);
      context.textContent = !garment
        ? ''
        : `: ${title}, ${available !== '1' ? 'sold out' : open.length ? `in stock in ${open.join(', ')}` : 'in stock'}`;
    }
  }

  #syncSides(): void {
    for (const button of this.ref('sides')?.querySelectorAll<HTMLElement>('[data-side]') ?? []) {
      button.setAttribute('aria-pressed', String(button.dataset.side === this.#side));
    }
  }

  /** Writes the current garment into the focused view; resolves once the front photo decodes. */
  async #fill(): Promise<void> {
    const garment = this.#garments[this.#index];
    if (!garment) return;
    const { title = '', color = '', front = '', back = '', price: amount = '', description = '', details = '' } = garment.dataset;
    this.ref('spin')?.classList.remove('is-cut');

    const name = this.ref('name');
    if (name) name.textContent = color ? `${title} — ${color}` : title;
    const sides = this.ref('sides');
    if (sides) sides.hidden = !back;
    this.#syncSides();
    const tags = this.ref('tags');
    if (tags) {
      const template = this.#items[this.#index]?.querySelector<HTMLTemplateElement>('template[data-ref="siblings"]');
      tags.replaceChildren(template ? template.content.cloneNode(true) : '');
    }
    const price = this.ref('price');
    if (price) price.textContent = amount;
    const words = this.ref('description');
    if (words) words.textContent = description;
    const chips = this.ref('details');
    if (chips) {
      chips.replaceChildren(
        ...details
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean)
          .map((entry) => {
            const chip = document.createElement('li');
            chip.textContent = entry;
            return chip;
          }),
      );
    }
    this.#showCta(this.#index);

    // Usually already cut (hovering prepared it): use it straight away, so the lift never swaps
    // images mid-flight. Otherwise the plain photo goes up now and is upgraded when ready.
    const shown = this.#index;
    const face = this.ref<HTMLImageElement>('face');
    const faceBack = this.ref<HTMLImageElement>('face-back');
    if (face) face.alt = title;
    if (faceBack) faceBack.alt = back ? `${title} (back)` : '';
    const useCut = (cut: { front: string; back: string | null }) => {
      this.ref('spin')?.classList.add('is-cut');
      if (face) face.src = cut.front;
      // A back that couldn't be cut (a model or lifestyle shot) is shown as the photo it is.
      if (faceBack && (cut.back || back)) faceBack.src = cut.back ?? back;
      return face?.decode().catch(() => undefined);
    };
    const cutting = this.#cutHero(front, back);
    const quick = await Promise.race([cutting, new Promise<null>((resolve) => setTimeout(() => resolve(null), 60))]);
    if (quick) {
      await useCut(quick);
    } else {
      if (faceBack && back) faceBack.src = back;
      if (face && front) {
        face.src = front;
        await face.decode().catch(() => undefined);
      }
      void cutting.then((cut) => {
        if (cut && shown === this.#index && this.#isOpen) void useCut(cut);
      });
    }
    this.#preload(this.#index + 1);
    this.#preload(this.#index - 1);
  }

  #preload(index: number): void {
    const count = this.#garments.length;
    const { front, back } = this.#garments[(index + count) % count]?.dataset ?? {};
    for (const src of [front, back]) if (src) new Image().src = src;
    if (front) void this.#cutHero(front, back ?? '');
  }

  /**
   * The front decides: a cut-out front keeps the garment in front of its hanger. A back that can't be
   * cut (a model or lifestyle photo, not a garment on white) is then shown whole rather than blended.
   */
  async #cutHero(front: string, back: string): Promise<{ front: string; back: string | null } | null> {
    if (!this.#cuts) return null;
    const options = this.#cutOptions;
    const [cutFront, cutBack] = await Promise.all([
      cutout(this.#cutSource(front), options),
      back ? cutout(this.#cutSource(back), options) : Promise.resolve(null),
    ]);
    if (!cutFront) return null;
    return { front: cutFront, back: cutBack };
  }
}

define('nk-clothes-rack', NkClothesRack);
