import './runway.css';
import { define } from '../../core/define';
import { NkElement } from '../../core/element';
import { animate, durations, easing, motionMode, PHONE_QUERY } from '../../core/motion';
import { cart, type AddItem } from '../../services/cart';

/** Shortest signed distance from `active` to `index` around a loop of `total` looks. */
export function wrapOffset(index: number, active: number, total: number): number {
  let offset = index - active;
  if (offset > total / 2) offset -= total;
  if (offset < -total / 2) offset += total;
  return offset;
}

/** The nearest look at or after `index`, walking in `direction`, that may take the centre. Background looks never do. */
export function frontLook(index: number, direction: number, back: boolean[]): number {
  const total = back.length;
  const step = direction < 0 ? -1 : 1;
  for (let tries = 0, at = index; tries < total; tries += 1, at = (at + step + total) % total) {
    if (!back[at]) return at;
  }
  return index;
}

/** Formats cents with Shopify's shop.money_format; there is no client-side money helper otherwise. */
export function formatMoney(cents: number, format: string): string {
  const group = (value: number, decimals: number, thousands: string, point: string): string => {
    const [whole = '0', fraction] = (value / 100).toFixed(decimals).split('.');
    const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
    return fraction ? `${grouped}${point}${fraction}` : grouped;
  };
  return format.replace(/\{\{\s*(\w+)\s*\}\}/, (_, kind: string) => {
    switch (kind) {
      case 'amount_no_decimals': return group(cents, 0, ',', '.');
      case 'amount_with_comma_separator': return group(cents, 2, '.', ',');
      case 'amount_no_decimals_with_comma_separator': return group(cents, 0, '.', ',');
      case 'amount_with_apostrophe_separator': return group(cents, 2, "'", '.');
      case 'amount_with_space_separator': return group(cents, 2, ' ', ',');
      default: return group(cents, 2, ',', '.');
    }
  });
}

/** Wraps a fractional distance into the loop so a look never flies across the line-up. */
export function wrapFloat(offset: number, total: number): number {
  return offset - total * Math.round(offset / total);
}

/** Neighbours sit a full gap away; everything further out bunches up, as a line-up in depth does. */
export function placeOnLine(offset: number, gap: number): number {
  // A smooth curve: a corner here would show as a change of speed as each model passes it.
  const curve = (value: number): number => 0.6 * value + 0.4 * Math.tanh(value * 1.5);
  return (gap * curve(offset)) / curve(1);
}

/** Whole-percent saving of a sale price, or 0 when there is no real saving. */
export function salePercent(price: number, compare: number): number {
  return compare > price && price >= 0 ? Math.floor(((compare - price) / compare) * 100) : 0;
}

/** What a set of pieces costs before and after sale prices and the bundle discount. */
export function bundleTotals(rows: Array<{ price: number; compare: number }>, percent: number): { now: number; was: number } {
  const sum = rows.reduce((total, row) => total + row.price, 0);
  return {
    now: Math.round(sum * (1 - percent / 100)),
    was: rows.reduce((total, row) => total + Math.max(row.compare, row.price), 0),
  };
}

/** Which look a #look-2 address asks for, as an index, or null. */
export function lookFromHash(hash: string, total: number): number | null {
  const match = /^#look-(\d+)$/.exec(hash);
  if (!match) return null;
  const index = Number(match[1]) - 1;
  return index >= 0 && index < total ? index : null;
}

/** How much further back a background look stands, in looks. */
export const BACK_DEPTH = 0.4;

/** Upward shift (percent of the stage) that puts a look further back on the floor. */
export function lineRise(distance: number, rise = 3.2): number {
  return -rise * Math.min(distance, 2.5);
}

/** Neighbours stay nearly solid; beyond them looks drop away quickly into the haze. */
export function lineFade(distance: number, step: number, far = 0.5): number {
  const beyond = Math.max(distance - 1, 0);
  return Math.max(1 - Math.min(distance, 1) * step - beyond * far, 0);
}

export interface SpringState {
  pos: number;
  goal: number;
  vel: number;
}

/**
 * Advances the line-up in fixed small steps, so it moves the same at 60, 120 or a stuttering 40fps.
 * The goal eases toward the target first, which lets a move build up speed instead of lurching.
 */
export function stepSpring(state: SpringState, target: number, omega: number, dt: number): void {
  const step = 1 / 240;
  const ease = 1 - Math.exp(-step * omega * 1.6);
  for (let left = dt; left > 0; left -= step) {
    const h = Math.min(left, step);
    state.goal += (target - state.goal) * ease * (h / step);
    state.vel += ((state.goal - state.pos) * omega * omega - 2 * omega * state.vel) * h;
    state.pos += state.vel * h;
  }
}

/** The goal that keeps a critically damped spring at its current speed: nothing brakes on release. */
export function goalForSpeed(pos: number, vel: number, omega: number): number {
  return pos + (2 * vel) / omega;
}

interface LookLayers {
  look: HTMLElement;
  sharp: HTMLElement | null;
  soft: HTMLElement | null;
  ghosts: HTMLElement[];
  cache: Record<string, string>;
  /** Which side of the line-up the furthest look stands on until it has faded out. */
  side: number;
  /** 0 to 1 after crossing sides, so the furthest look fades in rather than popping. */
  reveal: number;
  shine: HTMLElement | null;
}

/** Skips style writes that wouldn't change anything. */
function write(entry: LookLayers, part: string, property: 'transform' | 'opacity' | 'zIndex' | 'visibility', value: string, element?: HTMLElement): void {
  const key = `${part}.${property}`;
  if (entry.cache[key] === value) return;
  entry.cache[key] = value;
  const target = element ?? (part === 'look' ? entry.look : part === 'sharp' ? entry.sharp : entry.soft);
  if (target) target.style[property] = value;
}

/**
 * <nk-runway> — a line-up of looks driven by one spring. Every frame writes only transform and
 * opacity, so the browser composites instead of repainting: side blur is a pre-blurred small copy
 * of the photo that cross-fades in, and the motion trail is two copies that show with speed.
 * The loop sleeps as soon as the line-up settles. Opening the centre look isolates it and reveals
 * its panel; Shopify's cart remains the authority on what was added and which discount applies.
 */
export class NkRunway extends NkElement {
  #looks: HTMLElement[] = [];
  #panels: HTMLElement[] = [];
  /** Looks that stand in the back row: they fill the line-up but never come to the centre. */
  #back: boolean[] = [];
  #clock = 0;
  #active = 0;
  #layers: LookLayers[] = [];
  /** Line-up position in looks and speed in looks per second, chasing #target. */
  #spring: SpringState = { pos: 0, goal: 0, vel: 0 };
  #target = 0;
  #dragGoal = 0;
  /** Load-in, 0 to 1: the line-up comes out of a white haze the first time it is seen. */
  #entry = 1;
  #entryStart = 0;
  /** Survive rebuilds (phone breakpoint, motion settings): same look, and no second load-in. */
  #mounted = false;
  #entered = false;
  /** 1 at rest, 0 while moving: the furthest look fades before it crosses to the other side. */
  #far = 1;
  #shineDue = false;
  #cursor = { el: null as HTMLElement | null, x: 0, y: 0, cx: 0, cy: 0 };
  #lean = 0;
  #leanTarget = 0;
  #frame = 0;
  #lastTime = 0;
  #dragging = false;
  #tune = { gap: 19, scale: 0.88, fade: 0.12, omega: 7.6, lean: 0, trail: 0, range: 3, rise: 3.2, far: 0.5 };
  #listed = false;
  #playing = false;
  #swiped = false;
  #holds = new Set<string>();

  protected mount(): void {
    this.#looks = this.refs('look');
    this.#panels = this.refs('panel');
    if (!this.#looks.length) return;
    this.#back = this.#looks.map((look) => look.hasAttribute('data-back'));
    const share = this.hasAttribute('data-share');
    const linked = share ? lookFromHash(location.hash, this.#looks.length) : null;
    const start = Math.min(Math.max((Number(this.dataset.start) || 1) - 1, 0), this.#looks.length - 1);
    this.#active = frontLook(this.#mounted ? Math.min(this.#active, this.#looks.length - 1) : linked ?? start, 1, this.#back);
    this.#listed = false;
    this.#spring = { pos: this.#active, goal: this.#active, vel: 0 };
    this.#target = this.#dragGoal = this.#active;
    this.#lean = this.#leanTarget = 0;
    this.#dragging = false;
    this.#buildLayers();
    this.#measure();
    this.#bindEntrance();
    this.on(window, 'resize', () => { this.#measure(); this.#fitBackdrop(); this.#wake(); });
    this.dispose(() => { cancelAnimationFrame(this.#frame); this.#frame = 0; });
    this.#holds.clear();
    this.removeAttribute('data-open');
    this.removeAttribute('data-panel');
    this.toggleAttribute('data-ready', true);
    this.#render();
    this.#panels.forEach((panel) => this.#updateTotal(panel));
    this.ref('now-name')?.removeAttribute('data-look');
    this.#render();

    const stage = this.ref('stage')!;
    this.on(stage, 'click', (event) => this.#onStageClick(event as MouseEvent));
    this.on(this.ref('close') ?? stage, 'click', () => this.close());
    const prev = this.ref('prev');
    const next = this.ref('next');
    if (prev) this.on(prev, 'click', () => this.step(-1));
    if (next) this.on(next, 'click', () => this.step(1));
    this.on(this, 'keydown', (event) => this.#onKey(event as KeyboardEvent));
    // On the document: focus may be anywhere after a click. An open dialog gets the key first.
    this.on(document, 'keydown', (event) => {
      if ((event as KeyboardEvent).key === 'Escape' && !document.querySelector('dialog[open]')) this.#exit();
    });
    if (share) {
      this.on(window, 'hashchange', () => {
        const look = lookFromHash(location.hash, this.#looks.length);
        if (look !== null) this.go(look);
      });
    }
    this.on(document, 'keydown', (event) => {
      if ((event as KeyboardEvent).key === 'Tab') this.toggleAttribute('data-tabbing', true);
    });
    this.on(document, 'pointerdown', () => this.removeAttribute('data-tabbing'));
    // Scrolling away from an open look returns to the line-up, so it is moving again on the way back.
    this.observeIntersection(this, (entry) => {
      if (!entry.isIntersecting) this.#exit();
    });
    this.#bindSheet();
    this.#bindNudge(stage);
    const firstMount = !this.#mounted;
    this.#mounted = true;
    if (linked !== null && firstMount) {
      this.scrollIntoView({ block: 'start' });
      this.open();
    }
    this.#bindDrag(stage);
    this.#bindMouse(stage);
    this.#bindPanels();
    this.#bindAutoplay(stage);
  }

  override onEditorSelect(blockId?: string): void {
    if (!blockId) return;
    const selector = `[data-block="${CSS.escape(blockId)}"]`;
    const look = this.#looks.findIndex((element) => element.matches(selector));
    if (look >= 0) {
      this.go(look);
      return;
    }
    const owner = this.#panels.findIndex((panel) => panel.querySelector(`[data-ref="piece"][data-shopify-editor-block*="${CSS.escape(blockId)}"]`));
    if (owner >= 0) {
      this.go(owner);
      this.open();
      this.#showPanel();
    }
  }

  get #isOpen(): boolean {
    return this.hasAttribute('data-open');
  }

  step(direction: number): void {
    const total = this.#looks.length;
    const index = frontLook((this.#active + direction + total) % total, direction, this.#back);
    if (index === this.#active) return;
    // Keep travelling the way the arrow points, gliding past any background looks, so the loop never rewinds.
    const ahead = (((index - this.#active) * Math.sign(direction || 1)) % total + total) % total;
    this.#target += ahead * Math.sign(direction || 1);
    this.#shineDue = true;
    this.#active = index;
    this.#render();
  }

  go(index: number): void {
    // A background look was asked for: the main look just past it, on the same side, comes forward instead.
    index = frontLook(index, Math.sign(wrapOffset(index, this.#active, this.#looks.length)) || 1, this.#back);
    if (index === this.#active) return;
    this.#target += wrapOffset(index, this.#active, this.#looks.length);
    this.#shineDue = true;
    this.#active = index;
    this.#render();
  }

  open(): void {
    if (this.#isOpen) return;
    this.toggleAttribute('data-open', true);
    this.#leanTarget = 0;
    this.ref('cursor')?.removeAttribute('data-on');
    this.#wake();
    this.#hold('open', true);
    this.ref('close')?.focus({ preventScroll: true });
    // Phones list the pieces under the model, and a look with no pins has nothing else to click.
    const hasPins = !!this.#looks[this.#active]?.querySelector('[data-ref="pin"]');
    if (this.dataset.panelOpen === 'look' || !hasPins || matchMedia(PHONE_QUERY).matches) this.#showPanel();
  }

  #showPanel(): void {
    if (this.hasAttribute('data-panel')) return;
    this.toggleAttribute('data-panel', true);
    this.#hold('panel', true);
    this.#panels[this.#active]?.scrollTo?.({ top: 0 });
  }

  /** One step back: isolated model to line-up (the panel stays to browse), then the panel away. */
  close(): void {
    const panel = this.hasAttribute('data-panel');
    if (!this.#isOpen && !panel) return;
    const keepPanel = this.#isOpen && panel && !matchMedia(PHONE_QUERY).matches;
    this.removeAttribute('data-open');
    this.#hold('open', false);
    if (!keepPanel) {
      this.removeAttribute('data-panel');
      this.#hold('panel', false);
    }
    this.#looks[this.#active]?.querySelector<HTMLElement>('[data-ref="trigger"]')?.focus({ preventScroll: true });
  }

  /** Straight back to the line-up, whatever is open. */
  #exit(): void {
    if (!this.#isOpen && !this.hasAttribute('data-panel')) return;
    this.removeAttribute('data-open');
    this.removeAttribute('data-panel');
    this.#hold('open', false);
    this.#hold('panel', false);
    // Scrolling past an open look also lands here: focus that has moved on elsewhere stays there.
    if (this.contains(document.activeElement)) {
      this.#looks[this.#active]?.querySelector<HTMLElement>('[data-ref="trigger"]')?.focus({ preventScroll: true });
    }
  }

  /** Phones: the panel is a sheet you can drag down or dismiss by tapping outside it. */
  #bindSheet(): void {
    const scrim = this.ref('scrim');
    if (scrim) this.on(scrim, 'click', () => this.#exit());
    for (const panel of this.#panels) {
      const head = panel.querySelector<HTMLElement>('[data-ref="sheet-head"]');
      if (!head) continue;
      let startY: number | null = null;
      const place = (y: number | null): void => {
        if (y === null) panel.style.removeProperty('translate');
        else panel.style.setProperty('translate', `0 ${y}px`, 'important');
        panel.toggleAttribute('data-dragging', y !== null);
      };
      const inSheet = (): boolean => this.dataset.phonePanel === 'sheet' && matchMedia(PHONE_QUERY).matches;
      for (const handle of [head, panel.querySelector<HTMLElement>('.runway__grip')]) {
        if (!handle) continue;
        this.on(handle, 'pointerdown', (event) => {
          if (!inSheet()) return;
          const pointer = event as PointerEvent;
          startY = pointer.clientY;
          handle.setPointerCapture?.(pointer.pointerId);
        });
        this.on(handle, 'pointermove', (event) => {
          if (startY !== null) place(Math.max((event as PointerEvent).clientY - startY, 0));
        });
        const release = (event: Event): void => {
          if (startY === null) return;
          const moved = (event as PointerEvent).clientY - startY;
          startY = null;
          place(null);
          if (moved > 90) this.#exit();
        };
        this.on(handle, 'pointerup', release);
        this.on(handle, 'pointercancel', release);
      }
    }
  }

  /** Once a visit on phones: the line-up leans a little and a hint says it can be swiped. */
  #bindNudge(stage: HTMLElement): void {
    const hint = this.ref('swipe');
    if (!hint || !matchMedia(PHONE_QUERY).matches || this.#looks.length < 2 || motionMode() === 'off') return;
    const key = 'nk-runway-swipe-hint';
    try {
      if (sessionStorage.getItem(key)) return;
    } catch {
      return;
    }
    let ended = false;
    const end = (): void => {
      ended = true;
      window.clearTimeout(start);
      window.clearTimeout(stop);
      this.removeAttribute('data-nudge');
    };
    let stop = 0;
    const start = window.setTimeout(() => {
      if (ended || !this.hasAttribute('data-seen') || this.#isOpen) return;
      try {
        sessionStorage.setItem(key, '1');
      } catch {
        // The hint simply shows again next time.
      }
      this.toggleAttribute('data-nudge', true);
      this.#spring.vel = 0.9;
      this.#wake();
      stop = window.setTimeout(end, 2800);
    }, 2200);
    this.on(stage, 'pointerdown', end);
    this.dispose(end);
  }

  /** The large name shrinks to fit the width rather than running off both edges. Runs per change. */
  #fitBackdrop(): void {
    const name = this.ref('backdrop-name');
    const box = this.ref('backdrop');
    if (!name || !box) return;
    name.style.removeProperty('font-size');
    const room = box.clientWidth * 0.94;
    const width = name.scrollWidth;
    if (!room || width <= room) return;
    const size = parseFloat(getComputedStyle(name).fontSize);
    name.style.fontSize = `${Math.floor(size * (room / width))}px`;
  }

  #bindEntrance(): void {
    this.removeAttribute('data-seen');
    this.#entryStart = 0;
    if (motionMode() === 'off' || this.#entered) {
      this.#entry = 1;
      this.toggleAttribute('data-seen', true);
      return;
    }
    this.#entry = 0;
    const { signal } = this;
    let asked = false;
    this.observeIntersection(this, (entry) => {
      if (!entry.isIntersecting || asked) return;
      asked = true;
      // Waits for the photos, so the haze clears onto models rather than onto empty space.
      const photos = this.#layers.flatMap(({ sharp, soft }) => [sharp, soft]).filter((image): image is HTMLImageElement => image instanceof HTMLImageElement);
      photos.forEach((image) => image.setAttribute('loading', 'eager'));
      const ready = Promise.allSettled(photos.map((image) => image.decode()));
      const limit = new Promise((resolve) => window.setTimeout(resolve, 2500));
      void Promise.race([ready, limit]).then(() => {
        if (!this.connectionIsCurrent(signal)) return;
        this.#entryStart = performance.now();
        this.#entered = true;
        this.#shineDue = true;
        this.toggleAttribute('data-seen', true);
        this.#wake();
      });
    });
  }

  /** State that changes per look, not per frame. */
  #render(): void {
    const total = this.#looks.length;
    this.#looks.forEach((look, index) => {
      const distance = Math.abs(wrapOffset(index, this.#active, total));
      look.toggleAttribute('data-center', distance === 0);
      const trigger = look.querySelector<HTMLElement>('[data-ref="trigger"]');
      if (trigger) trigger.tabIndex = distance > this.#tune.range || this.#back[index] ? -1 : 0;
      if (distance <= this.#tune.range + 2) look.querySelectorAll('img').forEach((img) => img.setAttribute('loading', 'eager'));
    });
    this.#panels.forEach((panel, index) => panel.toggleAttribute('data-active', index === this.#active));
    const name = this.#looks[this.#active]?.dataset.name ?? '';
    if (this.#listed && this.hasAttribute('data-share')) history.replaceState(null, '', `#look-${this.#active + 1}`);
    this.#listed = true;
    const indexLabel = this.ref('detail-index');
    const nameLabel = this.ref('detail-name');
    if (indexLabel) indexLabel.textContent = `${this.dataset.lookLabel ?? ''} ${String(this.#back.slice(0, this.#active + 1).filter((back) => !back).length).padStart(2, '0')}`.trim();
    if (nameLabel) nameLabel.textContent = name;
    const backdrop = this.ref('backdrop-name');
    const large = this.#looks[this.#active]?.dataset.backdrop ?? name;
    if (backdrop && backdrop.textContent !== large) {
      const first = !backdrop.textContent;
      backdrop.textContent = large;
      this.#fitBackdrop();
      if (!first) animate(backdrop, [{ opacity: 0, transform: 'translateY(14%)' }, { opacity: 1, transform: 'none' }], { duration: 900, easing: 'cubic-bezier(.2,.7,.2,1)' });
    }
    const nowName = this.ref('now-name');
    if (nowName && nowName.dataset.look !== name) {
      const first = !nowName.dataset.look;
      nowName.dataset.look = name;
      const price = this.#panels[this.#active]?.querySelector('[data-ref="total"]')?.textContent;
      nowName.textContent = name;
      if (price && this.hasAttribute('data-bar-price')) {
        const meta = document.createElement('span');
        meta.className = 'runway__now-price';
        meta.textContent = price;
        nowName.append(meta);
      }
      if (!first) animate(nowName, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: durations.reveal, easing: easing.out });
    }
    this.#schedule();
    this.#wake();
  }

  /** Small copies of each photo for the blur and the trail; only their opacity ever changes. */
  #buildLayers(): void {
    this.querySelectorAll('.runway__layer').forEach((layer) => layer.remove());
    this.#shineDue = false;
    const blur = parseFloat(getComputedStyle(this).getPropertyValue('--runway-blur')) || 0;
    const trail = Number(this.dataset.trail) > 0;
    this.#layers = this.#looks.map((look) => {
      const sharp = look.querySelector<HTMLElement>('.runway__img');
      const entry: LookLayers = { look, sharp, soft: null, ghosts: [], cache: {}, side: 0, reveal: 1, shine: null };
      if (!(sharp instanceof HTMLImageElement)) return entry;
      const copy = (name: string): HTMLImageElement => {
        const layer = sharp.cloneNode() as HTMLImageElement;
        layer.className = `runway__layer ${name}`;
        layer.alt = '';
        layer.setAttribute('aria-hidden', 'true');
        layer.sizes = name === 'runway__soft' ? '240px' : '500px';
        sharp.after(layer);
        layer.decode?.().catch(() => undefined);
        return layer;
      };
      if (this.hasAttribute('data-shine')) {
        const shine = document.createElement('span');
        shine.className = 'runway__layer runway__shine';
        shine.setAttribute('aria-hidden', 'true');
        shine.append(document.createElement('span'));
        sharp.after(shine);
        entry.shine = shine;
      }
      sharp.decoding = 'async';
      sharp.decode?.().catch(() => undefined);
      if (blur > 0) entry.soft = copy('runway__soft');
      if (trail) entry.ghosts = [copy('runway__ghost'), copy('runway__ghost')];
      return entry;
    });
  }

  /** Reads CSS once per resize so the frame loop never touches layout. */
  #measure(): void {
    const css = getComputedStyle(this);
    const read = (name: string, fallback: number): number => {
      const value = parseFloat(css.getPropertyValue(name));
      return Number.isFinite(value) ? value : fallback;
    };
    this.#tune = {
      gap: read('--runway-gap', 19),
      scale: read('--runway-side-scale', 0.88),
      fade: read('--runway-fade', 0.12),
      omega: 6500 / Math.max(read('--runway-speed', 850), 1),
      lean: read('--runway-lean', 0),
      rise: read('--runway-rise', 3.2),
      far: read('--runway-far', 0.5),
      trail: motionMode() === 'full' ? Number(this.dataset.trail) || 0 : 0,
      range: Math.min(Number(this.dataset.visible) || 3, Math.floor(this.#looks.length / 2)),
    };
  }

  #wake(): void {
    if (this.#frame || !this.isConnected) return;
    this.#lastTime = 0;
    this.#frame = requestAnimationFrame((time) => this.#tick(time));
  }

  #tick(time: number): void {
    this.#frame = 0;
    const dt = this.#lastTime ? Math.min((time - this.#lastTime) / 1000, 1 / 20) : 1 / 60;
    this.#lastTime = time;
    const spring = this.#spring;
    if (this.#dragging) {
      // The pointer is followed through a short filter: event timing never reaches the screen.
      const next = spring.pos + (this.#dragGoal - spring.pos) * (1 - Math.exp(-dt * 28));
      spring.vel += ((next - spring.pos) / dt - spring.vel) * (1 - Math.exp(-dt * 18));
      spring.pos = next;
      spring.goal = next;
    } else if (motionMode() === 'off') {
      spring.pos = spring.goal = this.#target;
      spring.vel = 0;
      this.#lean = this.#leanTarget = 0;
    } else {
      stepSpring(spring, this.#target, this.#tune.omega, dt);
    }
    if (this.#entryStart && this.#entry < 1) this.#entry = Math.min((time - this.#entryStart) / 1200, 1);
    const moving = this.#dragging || Math.abs(this.#target - spring.pos) > 0.01;
    this.#far += ((moving ? 0 : 1) - this.#far) * (1 - Math.exp(-dt * (moving ? 16 : 5)));
    if (this.#shineDue && !this.#dragging && this.#entry > 0.6 && Math.abs(this.#target - spring.pos) < 0.04) {
      this.#shineDue = false;
      this.#sweep();
    }
    this.#lean += (this.#leanTarget - this.#lean) * (1 - Math.exp(-dt * 5));
    const cursor = this.#cursor;
    const follow = 1 - Math.exp(-dt * 16);
    cursor.cx += (cursor.x - cursor.cx) * follow;
    cursor.cy += (cursor.y - cursor.cy) * follow;
    if (cursor.el) cursor.el.style.transform = `translate3d(${cursor.cx.toFixed(2)}px,${cursor.cy.toFixed(2)}px,0)`;
    const settled = !this.#dragging
      && (this.#entry >= 1 || !this.#entryStart)
      && this.#far > 0.995
      && Math.abs(this.#target - spring.pos) < 0.0005
      && Math.abs(spring.vel) < 0.005
      && Math.abs(this.#leanTarget - this.#lean) < 0.0005
      && Math.abs(cursor.x - cursor.cx) + Math.abs(cursor.y - cursor.cy) < 0.2;
    if (settled) {
      this.#far = 1;
      spring.pos = spring.goal = this.#target;
      spring.vel = 0;
      this.#paint();
      return;
    }
    this.#paint();
    this.#frame = requestAnimationFrame((next) => this.#tick(next));
  }

  /** One pass of light over the centre model, cut to the photo's own outline. */
  #sweep(): void {
    const entry = this.#layers[this.#active];
    const beam = entry?.shine?.firstElementChild;
    const source = entry?.sharp instanceof HTMLImageElement ? entry.sharp.currentSrc : '';
    if (!entry?.shine || !beam || !source || motionMode() === 'off') return;
    // Only exists for the length of the sweep: a resting mask layer on every model costs and shows.
    const { shine } = entry;
    shine.style.setProperty('--runway-shine-src', `url("${source}")`);
    shine.toggleAttribute('data-sweeping', true);
    beam.getAnimations().forEach((animation) => animation.cancel());
    const pass = beam.animate([{ transform: 'translateX(-120%) skewX(-16deg)' }, { transform: 'translateX(320%) skewX(-16deg)' }], { duration: 1100, easing: 'cubic-bezier(.45,.05,.3,1)' });
    pass.onfinish = () => shine.removeAttribute('data-sweeping');
  }

  #paint(): void {
    const { gap, scale, fade, trail, range, rise: floor, far } = this.#tune;
    const total = this.#looks.length;
    const { pos, vel } = this.#spring;
    const backdrop = this.ref('backdrop');
    if (backdrop) backdrop.style.transform = `translate3d(${(this.#lean * 12).toFixed(2)}%,0,0)`;
    const light = this.ref('light');
    if (light) light.style.transform = `translate3d(${(this.#lean * 130).toFixed(2)}%,0,0)`;
    const speed = Math.min(Math.abs(vel) / 2, 1);
    const entrance = 1 - (1 - this.#entry) ** 3;
    const half = total / 2;
    // With an even number of looks the furthest one stands exactly opposite the centre.
    const opposite = total % 2 === 0 && range >= half;
    const limit = opposite ? half + 0.5 : Math.min(range + 0.5, half);
    for (let index = 0; index < total; index += 1) {
      const entry = this.#layers[index]!;
      let offset = wrapFloat(index - pos, total);
      if (opposite) {
        const side = Math.sign(offset) || 1;
        if (Math.abs(offset) < half - 0.4 || !entry.side || this.#far < 0.05) {
          if (entry.side && side !== entry.side) entry.reveal = 0;
          entry.side = side;
        }
        else if (side !== entry.side) offset += entry.side * total;
      }
      const distance = Math.abs(offset);
      const hidden = distance >= limit;
      // Background looks stand a step further back than their place in the line suggests.
      const depth = distance + (this.#back[index] ? BACK_DEPTH : 0);
      write(entry, 'look', 'visibility', hidden ? 'hidden' : 'visible');
      if (hidden) continue;
      entry.reveal = Math.min(entry.reveal + 0.06, 1);
      const edge = opposite
        ? (this.#far + (1 - this.#far) * Math.min(Math.max((half - distance) / 0.5, 0), 1)) * entry.reveal
        : Math.min((limit - distance) / 0.5, 1);
      // The mouse only slides the models, with the nearest moving most; it never changes their focus.
      const leaned = placeOnLine(offset, gap) + this.#lean * gap * (1 - 0.3 * Math.min(distance, 2));
      // Further back means higher on the floor, smaller and, past the neighbours, hazier.
      const rise = lineRise(depth, floor) + (1 - entrance) * 1.5;
      write(entry, 'look', 'transform', `translate3d(${leaned.toFixed(3)}%,${rise.toFixed(3)}%,0) scale(${(1 - Math.min(depth, 3.5) * (1 - scale)).toFixed(4)})`);
      write(entry, 'look', 'opacity', (lineFade(depth, fade, far) * edge * entrance).toFixed(3));
      write(entry, 'look', 'zIndex', String(10 - Math.round(depth * 2)));
      const reach = Math.min(distance, 1);
      const soft = Math.max(reach * reach * (3 - 2 * reach), 1 - entrance);
      if (entry.soft && entry.sharp) {
        write(entry, 'sharp', 'opacity', (1 - soft ** 4).toFixed(3));
        write(entry, 'soft', 'opacity', soft.toFixed(3));
      }
      entry.ghosts.forEach((ghost, order) => {
        const strength = trail * speed * (order ? 0.55 : 1);
        const key = `ghost${order}`;
        write(entry, key, 'opacity', strength.toFixed(3), ghost);
        if (strength > 0.002) write(entry, key, 'transform', `translate3d(${(-vel * (order ? 11 : 5.5)).toFixed(2)}%,0,0)`, ghost);
      });
    }
  }

  /** Mouse and touch both drag the line-up; a click that became a drag doesn't open anything. */
  #bindDrag(stage: HTMLElement): void {
    let startX = 0;
    let startPos = 0;
    let pressed = false;
    let width = 1;
    this.on(stage, 'dragstart', (event) => event.preventDefault());
    this.on(stage, 'pointerdown', (event) => {
      const pointer = event as PointerEvent;
      this.#swiped = false;
      if (this.#isOpen || pointer.button !== 0 || this.#looks.length < 2) return;
      if ((pointer.target as Element).closest('[data-ref="pin"], [data-ref="panel"], button')) return;
      pressed = true;
      startX = pointer.clientX;
      width = stage.clientWidth || 1;
    });
    this.on(stage, 'pointermove', (event) => {
      const pointer = event as PointerEvent;
      if (!pressed) return;
      // Released outside the stage before the drag began: no pointerup ever reached us.
      if (!this.#dragging && pointer.pointerType === 'mouse' && pointer.buttons === 0) {
        pressed = false;
        return;
      }
      if (!this.#dragging) {
        if (Math.abs(pointer.clientX - startX) < 6) return;
        // Starts from wherever the line-up is now, so grabbing it mid-move doesn't make it jump.
        startX = pointer.clientX;
        startPos = this.#spring.pos;
        this.#dragging = true;
        this.#swiped = true;
        this.toggleAttribute('data-dragging', true);
        this.#hold('drag', true);
        stage.setPointerCapture?.(pointer.pointerId);
      }
      const perLook = (width * this.#tune.gap) / 100 || 1;
      this.#dragGoal = startPos - (pointer.clientX - startX) / perLook;
      this.#wake();
    });
    const release = (): void => {
      pressed = false;
      if (!this.#dragging) return;
      this.#dragging = false;
      this.removeAttribute('data-dragging');
      this.#hold('drag', false);
      const total = this.#looks.length;
      const spring = this.#spring;
      spring.goal = goalForSpeed(spring.pos, spring.vel, this.#tune.omega);
      const flick = Math.max(-1.5, Math.min(1.5, spring.vel * 0.22));
      this.#target = Math.round(spring.pos + flick);
      const landed = ((this.#target % total) + total) % total;
      // Never settle on a background look: carry on to the next main look in the direction of travel.
      const front = frontLook(landed, Math.sign(this.#target - spring.pos) || Math.sign(spring.vel) || 1, this.#back);
      this.#target += wrapOffset(front, landed, total);
      this.#shineDue = true;
      this.#active = front;
      this.#render();
    };
    this.on(stage, 'pointerup', release);
    this.on(stage, 'pointercancel', release);
  }

  /** A real mouse leans the line-up toward the pointer and drives the cursor bubble. */
  #bindMouse(stage: HTMLElement): void {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia(PHONE_QUERY).matches) return;
    const state = this.#cursor;
    const cursor = this.ref('cursor');
    state.el = cursor;
    this.on(stage, 'pointermove', (event) => {
      const pointer = event as PointerEvent;
      if (pointer.pointerType !== 'mouse') return;
      const box = stage.getBoundingClientRect();
      state.x = pointer.clientX - box.left;
      state.y = pointer.clientY - box.top;
      if (cursor) {
        // Appears where the pointer is, rather than flying in from where it last left.
        if (!cursor.hasAttribute('data-on')) {
          state.cx = state.x;
          state.cy = state.y;
        }
        const target = pointer.target as Element;
        const look = target.closest('[data-ref="trigger"]')?.closest<HTMLElement>('[data-ref="look"]');
        const over = target.closest('[data-ref="panel"], [data-ref="close"], [data-ref="pin"]');
        cursor.toggleAttribute('data-on', !over && !this.#isOpen);
        cursor.toggleAttribute('data-big', !!look?.hasAttribute('data-center') && !this.#dragging);
        cursor.toggleAttribute('data-side', !!look && !look.hasAttribute('data-center'));
      }
      if (!this.#isOpen) this.#leanTarget = (state.x / (box.width || 1) - 0.5) * this.#tune.lean;
      this.#wake();
    });
    this.on(stage, 'pointerdown', () => cursor?.toggleAttribute('data-press', true));
    this.on(window, 'pointerup', () => cursor?.removeAttribute('data-press'));
    this.on(stage, 'pointerleave', () => {
      cursor?.removeAttribute('data-on');
      this.#leanTarget = 0;
      this.#wake();
    });
  }

  #onStageClick(event: MouseEvent): void {
    const target = event.target as Element;
    const pin = target.closest<HTMLElement>('[data-ref="pin"]');
    if (pin) {
      this.#showPanel();
      this.#highlight(pin.dataset.piece ?? '', true);
      return;
    }
    const trigger = target.closest<HTMLAnchorElement>('[data-ref="trigger"]');
    if (!trigger) {
      // A captured drag ends with its click on the stage; that click is the end of the drag.
      this.#swiped = false;
      return;
    }
    const index = this.#looks.findIndex((look) => look.contains(trigger));
    const linked = this.dataset.click === 'link' && trigger.getAttribute('href') !== '#';
    if (index === this.#active && linked && !this.#swiped) return;
    if (index === this.#active && (event.metaKey || event.ctrlKey || event.shiftKey) && trigger.getAttribute('href') !== '#') return;
    event.preventDefault();
    if (this.#swiped) {
      this.#swiped = false;
      return;
    }
    if (index !== this.#active) this.go(index);
    else if (this.#isOpen) this.#showPanel();
    else if (this.dataset.click !== 'link') this.open();
  }

  #onKey(event: KeyboardEvent): void {
    if ((event.target as Element).matches('input')) return;
    if (event.key === 'ArrowLeft') this.step(-1);
    else if (event.key === 'ArrowRight') this.step(1);
  }

  #highlight(piece: string, scroll: boolean): void {
    const panel = this.#panels[this.#active];
    const look = this.#looks[this.#active];
    panel?.querySelectorAll<HTMLElement>('[data-ref="piece"]').forEach((row) => {
      const match = row.dataset.piece === piece;
      row.toggleAttribute('data-highlight', match);
      if (match && scroll) row.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
    });
    look?.querySelectorAll<HTMLElement>('[data-ref="pin"]').forEach((pin) => pin.toggleAttribute('data-highlight', pin.dataset.piece === piece));
  }

  #bindPanels(): void {
    for (const panel of this.#panels) {
      this.on(panel, 'change', (event) => {
        const input = (event.target as Element).closest<HTMLInputElement>('[data-ref="variant"] input');
        const row = input?.closest<HTMLElement>('[data-ref="piece"]');
        if (!input || !row) return;
        row.dataset.price = input.dataset.price ?? row.dataset.price;
        row.dataset.compare = input.dataset.compare ?? '0';
        row.removeAttribute('data-missing');
        this.#showPrice(row, input);
        this.#updateTotal(panel);
      });
      this.on(panel, 'pointerover', (event) => {
        const row = (event.target as Element).closest<HTMLElement>('[data-ref="piece"]');
        if (row) this.#highlight(row.dataset.piece ?? '', false);
      });
      this.on(panel, 'click', (event) => {
        const target = event.target as Element;
        if (target.closest('[data-sheet-close]')) {
          this.#exit();
          return;
        }
        const add = target.closest<HTMLButtonElement>('[data-ref="add"]');
        if (add) void this.#add(panel, [add.closest<HTMLElement>('[data-ref="piece"]')!], add);
        const all = target.closest<HTMLButtonElement>('[data-ref="add-all"]');
        if (all) void this.#add(panel, this.#buyable(panel), all, true);
      });
    }
  }

  /** A size can carry its own price and sale price. */
  #showPrice(row: HTMLElement, input: HTMLInputElement): void {
    const percent = salePercent(Number(input.dataset.price), Number(input.dataset.compare));
    const now = row.querySelector<HTMLElement>('[data-ref="piece-price"]');
    const was = row.querySelector<HTMLElement>('[data-ref="piece-was"]');
    const badge = row.querySelector<HTMLElement>('[data-ref="piece-sale"]');
    if (now && input.dataset.money) now.textContent = input.dataset.money;
    now?.toggleAttribute('data-sale', percent > 0);
    if (was) {
      was.hidden = percent === 0;
      was.textContent = input.dataset.compareMoney ?? '';
    }
    if (badge) {
      badge.hidden = percent === 0;
      badge.textContent = `-${percent}%`;
    }
  }

  /** The button itself confirms the add, then returns to normal. */
  #confirm(button: HTMLButtonElement, status: Element | null): void {
    const label = button.matches('[data-ref="add-all"]') ? button.querySelector('span') : null;
    const original = label?.textContent ?? '';
    button.toggleAttribute('data-added', true);
    if (label) label.textContent = this.dataset.addedLabel ?? original;
    const timer = window.setTimeout(() => {
      button.removeAttribute('data-added');
      if (label) label.textContent = original;
      if (status) status.textContent = '';
    }, 1800);
    this.dispose(() => window.clearTimeout(timer));
  }

  #buyable(panel: HTMLElement): HTMLElement[] {
    return [...panel.querySelectorAll<HTMLElement>('[data-ref="piece"]:not([data-sold-out])')];
  }

  #updateTotal(panel: HTMLElement): void {
    const bundle = panel.querySelector<HTMLElement>('[data-ref="bundle"]');
    if (!bundle) return;
    const rows = this.#buyable(panel);
    bundle.hidden = rows.length === 0;
    const format = this.dataset.moneyFormat || '{{amount}}';
    const { now, was } = bundleTotals(
      rows.map((row) => ({ price: Number(row.dataset.price) || 0, compare: Number(row.dataset.compare) || 0 })),
      Number(this.dataset.discountPercent) || 0,
    );
    const total = bundle.querySelector('[data-ref="total"]');
    const compare = bundle.querySelector<HTMLElement>('[data-ref="compare"]');
    const save = bundle.querySelector<HTMLElement>('[data-ref="save"]');
    if (total) total.textContent = formatMoney(now, format);
    if (compare) {
      compare.hidden = was <= now;
      compare.textContent = formatMoney(was, format);
    }
    if (save) {
      save.hidden = was <= now;
      save.textContent = `${this.dataset.saveLabel ?? ''} ${formatMoney(was - now, format)}`.trim();
    }
  }

  async #add(panel: HTMLElement, rows: HTMLElement[], button: HTMLButtonElement, isBundle = false): Promise<void> {
    if (button.disabled) return;
    const status = panel.querySelector('[data-ref="status"]');
    const items: AddItem[] = [];
    let missing: HTMLInputElement | null = null;
    for (const row of rows) {
      const choice = row.querySelector<HTMLInputElement>('[data-ref="variant"] input:checked');
      const id = Number(row.dataset.variant || choice?.value);
      row.toggleAttribute('data-missing', !id);
      if (id) items.push({ id, quantity: 1 });
      else missing ??= row.querySelector<HTMLInputElement>('[data-ref="variant"] input:not(:disabled)');
    }
    if (missing) {
      if (status) status.textContent = this.dataset.chooseMessage ?? '';
      missing.focus();
      return;
    }
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    if (status) status.textContent = '';
    try {
      const result = await cart.add(items, `runway-${this.id || 'section'}`);
      if (status) status.textContent = this.dataset.addedLabel ?? '';
      this.#confirm(button, status);
      animate(button, [{ transform: 'scale(.96)' }, { transform: 'none' }], { duration: durations.small, easing: easing.out });
      const code = this.dataset.discountCode;
      // The pieces are in the bag by now; a code that fails to apply must not read as a failed add.
      if (isBundle && code) await this.#applyCode(code, (result.cart.discount_codes ?? []).map((entry) => entry.code)).catch(() => undefined);
    } catch {
      if (status) status.textContent = this.dataset.errorMessage ?? '';
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  }

  /** Adds the bundle code alongside existing ones and withdraws it if Shopify says it doesn't apply. */
  async #applyCode(code: string, existing: string[]): Promise<void> {
    if (existing.some((entry) => entry.toUpperCase() === code.toUpperCase())) return;
    const { cart: state } = await cart.discounts([...existing, code], 'runway-discount');
    const entry = state.discount_codes?.find((item) => item.code.toUpperCase() === code.toUpperCase());
    if (!entry?.applicable) await cart.discounts(existing, 'runway-discount');
  }

  #hold(reason: string, on: boolean): void {
    if (on) this.#holds.add(reason);
    else this.#holds.delete(reason);
    this.#schedule();
  }

  /** Each look gets the full interval again after any move, hover or pause. */
  #schedule(): void {
    window.clearTimeout(this.#clock);
    if (!this.#playing || this.#holds.size > 0) return;
    const seconds = parseFloat(getComputedStyle(this).getPropertyValue('--runway-interval')) || 5;
    this.#clock = window.setTimeout(() => this.step(1), seconds * 1000);
  }

  #bindAutoplay(stage: HTMLElement): void {
    const allowed = this.hasAttribute('data-autoplay') && this.#looks.length > 1 && motionMode() !== 'off';
    this.#playing = allowed;
    const play = this.ref('play');
    if (play) play.hidden = !allowed;
    if (!allowed) return;
    this.dispose(() => window.clearTimeout(this.#clock));
    this.#schedule();
    this.on(stage, 'pointerenter', (event) => { if ((event as PointerEvent).pointerType === 'mouse') this.#hold('hover', true); });
    this.on(stage, 'pointerleave', () => this.#hold('hover', false));
    // Only keyboard focus pauses: a click also focuses the model, and must not stop the line-up for good.
    this.on(this, 'focusin', () => this.#hold('focus', this.hasAttribute('data-tabbing')));
    this.on(this, 'focusout', () => this.#hold('focus', false));
    this.observeIntersection(this, (entry) => this.#hold('offscreen', !entry.isIntersecting));
    if (play) {
      this.on(play, 'click', () => {
        this.#playing = !this.#playing;
        play.setAttribute('aria-pressed', String(this.#playing));
        play.setAttribute('aria-label', (this.#playing ? play.dataset.pauseLabel : play.dataset.playLabel) ?? '');
        this.#hold('user', false);
      });
    }
  }
}

define('nk-runway', NkRunway);
