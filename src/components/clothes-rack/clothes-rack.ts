import { define } from '../../core/define';
import { NkElement } from '../../core/element';
import { animate, decorativeMotionAllowed, easing } from '../../core/motion';

type Side = 'front' | 'back';

/** Waits for a photo, but never longer than a beat: a slow network must not freeze the rack. */
const settle = (work: Promise<void>, ms = 450) =>
  Promise.race([work, new Promise<void>((resolve) => setTimeout(resolve, ms))]);

/** Resolves when an animation ends, or shortly after it should have (hidden tabs pause them). */
const played = (animation: Animation | null, ms: number) =>
  animation ? settle(animation.finished.then(() => undefined, () => undefined), ms + 150) : Promise.resolve();

const SPRING = 'cubic-bezier(0.34, 1.22, 0.64, 1)';
const GLIDE = 'cubic-bezier(0.22, 1, 0.36, 1)';

/**
 * <nk-clothes-rack> — products hang edge-on from a rail. Hover (or keyboard focus) turns one to
 * face the visitor and points "See availability" at it; a click lifts it into a focused view
 * with a Front/Back spin, prev/next and colourway tags. The garment links stay real product
 * links: modified clicks and no-JS visits go straight to the product page.
 *
 * Layout never changes while hovering: slots keep their width and garments move with
 * translate/transform only. Which garment is "under the pointer" is decided against where the
 * garments are drawn, not their slots — the one facing the visitor owns its whole visible
 * width, so moving across a wide shirt never hands hover to the narrow neighbour behind it.
 *
 * Every animation runs on .clothes-rack__turn / .clothes-rack__spin only, so the multiply
 * knock-out keeps blending with the section background (see clothes-rack.css).
 */
export class NkClothesRack extends NkElement {
  #items: HTMLElement[] = [];
  #garments: HTMLAnchorElement[] = [];
  #active = -1;
  #index = -1;
  #side: Side = 'front';
  #busy = false;
  #queued: (() => Promise<void>) | null = null;
  #ctaHref = '';
  #centers: number[] = [];
  #leaveTimer = 0;

  protected mount(): void {
    this.#items = this.refs('item');
    this.#garments = this.refs<HTMLAnchorElement>('garment');
    const list = this.ref('list');
    this.#ctaHref = this.ref<HTMLAnchorElement>('cta')?.getAttribute('href') ?? '';
    if (!list || this.#garments.length === 0) return;

    this.observeResize(list, () => (this.#centers = []));
    this.on(list, 'scroll', () => (this.#centers = []), { passive: true });
    this.on(window, 'scroll', () => (this.#centers = []), { passive: true });
    // Hover picks a garment only in the band from the rail to the hems (the section is taller:
    // it reserves room for the focused view). Below that band nothing new is picked, but the
    // chosen garment stays facing the visitor, so the pointer can travel down to "See
    // availability" for it. Going above the rail or out of the section lets it go.
    this.on(this, 'pointermove', (event) => {
      if (event.pointerType !== 'mouse' || this.#isOpen) return;
      const band = this.#band();
      if (event.clientY < band.top) return this.#leaveSoon();
      if (event.clientY > band.bottom) return this.#stay();
      this.#stay();
      const index = this.#hit(event.clientX);
      if (index !== this.#active) this.#setActive(index);
    });
    this.on(this, 'pointerleave', () => this.#leaveSoon());
    this.dispose(() => window.clearTimeout(this.#leaveTimer));
    this.on(list, 'focusin', (event) => {
      const index = this.#garments.indexOf(event.target as HTMLAnchorElement);
      if (index >= 0 && !this.#isOpen && !this.#touch) this.#setActive(index);
    });
    this.on(list, 'click', (event) => {
      const garment = (event.target as Element).closest<HTMLAnchorElement>('[data-ref="garment"]');
      if (!garment || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      // Open what the visitor sees in front of them, which may not be the slot under the pointer.
      // A tap has no hover to go by: open the garment drawn where the finger landed.
      const tapped = this.#garments.indexOf(garment);
      const index = this.#touch ? (this.#hit(event.clientX) >= 0 ? this.#hit(event.clientX) : tapped) : this.#active >= 0 ? this.#active : tapped;
      void this.#run(() => this.#open(index));
    });
    this.#bindTouch(list);

    const focus = this.ref('focus');
    if (!focus) return;
    this.on(this.ref('close') ?? focus, 'click', () => void this.#run(() => this.#close()));
    this.on(this.ref('prev') ?? focus, 'click', () => void this.#run(() => this.#step(-1)));
    this.on(this.ref('next') ?? focus, 'click', () => void this.#run(() => this.#step(1)));
    this.on(this.ref('sides') ?? focus, 'click', (event) => {
      const side = (event.target as Element).closest<HTMLElement>('[data-side]')?.dataset.side as Side | undefined;
      if (side) void this.#run(() => this.#turnTo(side));
    });
    this.on(this, 'keydown', (event) => {
      if (!this.#isOpen) return;
      if (event.key === 'Escape') void this.#run(() => this.#close());
      else if (event.key === 'ArrowLeft') void this.#run(() => this.#step(-1));
      else if (event.key === 'ArrowRight') void this.#run(() => this.#step(1));
    });
  }

  override onEditorSelect(): void {
    if (this.#isOpen) void this.#run(() => this.#close());
  }

  get #isOpen(): boolean {
    return this.hasAttribute('data-focused');
  }

  /** Phones and tablets: no hover to turn a garment, so the rail and the focused view follow the finger. */
  get #touch(): boolean {
    return matchMedia('(hover: none)').matches;
  }

  /**
   * Touch: the garment nearest the middle of the scrolled rail turns to face the visitor (with
   * its hanger swing) and "See availability" points at it; in the focused view a sideways swipe
   * steps to the next or previous garment.
   */
  #bindTouch(list: HTMLElement): void {
    let frame = 0;
    const centre = () => {
      frame = 0;
      if (!this.#touch || this.#isOpen || this.#busy) return;
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
    this.on(list, 'scroll', schedule, { passive: true });
    this.observeIntersection(this, (entry) => { if (entry.isIntersecting) schedule(); });
    this.dispose(() => cancelAnimationFrame(frame));
    this.#recentre = schedule;

    const focus = this.ref('focus');
    if (!focus) return;
    let start: { x: number; y: number; id: number } | null = null;
    this.on(focus, 'pointerdown', (event) => {
      if (event.pointerType === 'mouse' || (event.target as Element).closest('button, a')) return;
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
    if (this.#leaveTimer || this.#active < 0) return;
    this.#leaveTimer = window.setTimeout(() => {
      this.#leaveTimer = 0;
      if (!this.#isOpen) this.#setActive(-1);
    }, 140);
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

  /**
   * The garment drawn under clientX. Each garment is scored by distance from where it is drawn
   * (slot centre + its slide aside) relative to its drawn half-width, so the one facing the
   * visitor, drawn wide, keeps hover across all of it.
   */
  #hit(clientX: number): number {
    if (this.#centers.length !== this.#items.length) {
      this.#centers = this.#items.map((item) => {
        const box = item.getBoundingClientRect();
        return box.left + box.width / 2;
      });
    }
    const slot = this.#items[0]?.offsetWidth ?? 1;
    const wide = this.#garments[0]?.offsetWidth ?? slot;
    const gap = Math.max(0, (wide * 0.86 - slot) / 2);
    let best = -1;
    let bestScore = Infinity;
    this.#centers.forEach((center, i) => {
      const facing = i === this.#active;
      const drawn = center + (this.#active < 0 ? 0 : Math.sign(i - this.#active)) * gap;
      const half = facing ? wide * 0.43 : slot / 2;
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
    this.#active = index;
    this.#items.forEach((item, i) => {
      item.classList.toggle('is-active', i === index);
      item.style.setProperty('--rack-shift', String(index < 0 ? 0 : Math.sign(i - index)));
    });
    this.#showCta(index);
    if (index >= 0) {
      // A small swing on the hanger as it turns, and a nudge for the one it replaces.
      this.#sway(index, previous < 0 ? 1 : Math.sign(index - previous), 2.2);
      if (previous >= 0) this.#sway(previous, Math.sign(index - previous), 1.2);
      this.#preload(index); // hovering is a strong hint of a click
    }
  }

  #sway(index: number, direction: number, degrees: number): void {
    const turn = this.#turnOf(index);
    if (!turn || !decorativeMotionAllowed()) return;
    turn.getAnimations().forEach((a) => a.id === 'sway' && a.cancel());
    const d = direction * degrees;
    const sway = turn.animate(
      [{ rotate: '0deg' }, { rotate: `${-d}deg` }, { rotate: `${d * 0.45}deg` }, { rotate: `${-d * 0.15}deg` }, { rotate: '0deg' }],
      { duration: 1100, easing: 'ease-out' },
    );
    sway.id = 'sway';
  }

  /** Transform that draws the hero (spin) over a hanging garment's resting box. */
  #flip(index: number, angle: number): string | null {
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
    const scale = from.width / to.width;
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top - to.top;
    return `translate(${dx}px, ${dy}px) scale(${scale}) perspective(70rem) rotateY(${angle}deg)`;
  }

  #sideAngle(index: number): number {
    const turn = this.#turnOf(index);
    return turn ? parseFloat(getComputedStyle(turn).getPropertyValue('--rack-side')) || 68 : 68;
  }

  async #open(index: number): Promise<void> {
    const focus = this.ref('focus');
    const spin = this.ref('spin');
    if (!focus || !spin || index < 0 || this.#isOpen) return;
    const angle = index === this.#active ? 0 : this.#sideAngle(index);

    this.#index = index;
    this.#side = 'front';
    window.clearTimeout(this.#leaveTimer);
    // Respond at once; give the photo a moment to arrive before it flies in.
    const ready = this.#fill();
    this.#items[index]?.classList.remove('is-active');
    this.#active = -1;
    this.setAttribute('data-focused', '');
    focus.hidden = false;
    this.#lift();
    this.#part();
    const start = this.#flip(index, angle);
    spin.style.opacity = '0';
    await settle(ready, 350);
    spin.style.opacity = '';
    requestAnimationFrame(() => focus.classList.add('is-shown'));
    if (start) {
      await played(animate(spin, [{ transform: start }, { transform: 'none' }], { duration: 760, easing: GLIDE }), 760);
    }
    this.ref('close')?.focus({ preventScroll: true });
  }

  async #close(): Promise<void> {
    if (!this.#isOpen) return;
    const focus = this.ref('focus');
    const spin = this.ref('spin');
    const index = this.#index;
    focus?.classList.remove('is-shown');
    // Rail first, so the garments glide back while the hero returns to its hook.
    for (const item of this.#items) item.style.setProperty('--rack-shift', '0');
    this.removeAttribute('data-focused');
    const end = spin ? this.#flip(index, this.#sideAngle(index)) : null;
    const back =
      spin && end
        ? animate(
            spin,
            [{ transform: 'none', opacity: 1 }, { transform: end, opacity: 1, offset: 0.88 }, { transform: end, opacity: 0 }],
            { duration: 640, easing: GLIDE, fill: 'forwards' },
          )
        : null;
    await played(back, 640);
    this.#turnOf(index)?.classList.remove('is-lifted');
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
    const leave = spin
      ? animate(
          spin,
          [
            { transform: 'none', opacity: 1 },
            { transform: `translateX(${direction * -38}%) perspective(70rem) rotateY(${direction * 55}deg)`, opacity: 0 },
          ],
          { duration: 280, easing: easing.in, fill: 'forwards' },
        )
      : null;
    this.#turnOf(this.#index)?.classList.remove('is-lifted');
    this.#index = (this.#index + direction + count) % count;
    this.#side = 'front';
    this.#lift();
    this.#part();
    this.#swapName();
    await played(leave, 280);
    await settle(this.#fill());
    const enter = spin
      ? animate(
          spin,
          [
            { transform: `translateX(${direction * 38}%) perspective(70rem) rotateY(${direction * -55}deg)`, opacity: 0 },
            { transform: 'none', opacity: 1 },
          ],
          { duration: 640, easing: SPRING },
        )
      : null;
    leave?.cancel();
    await played(enter, 640);
  }

  /** Front/back: the garment turns on its hook, showing the other side as it comes round. */
  async #turnTo(side: Side): Promise<void> {
    const spin = this.ref('spin');
    if (!this.#isOpen || side === this.#side) return;
    const direction = side === 'back' ? 1 : -1;
    this.#side = side;
    this.#syncSides();
    const out = spin
      ? animate(
          spin,
          [{ transform: 'perspective(70rem) rotateY(0deg)' }, { transform: `perspective(70rem) rotateY(${direction * -90}deg)` }],
          { duration: 240, easing: easing.in, fill: 'forwards' },
        )
      : null;
    await played(out, 240);
    await settle(this.#fill());
    const back = spin
      ? animate(
          spin,
          [{ transform: `perspective(70rem) rotateY(${direction * 90}deg)` }, { transform: 'perspective(70rem) rotateY(0deg)' }],
          { duration: 680, easing: SPRING },
        )
      : null;
    out?.cancel();
    await played(back, 680);
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

    const strip = this.ref('sizes');
    // Keep the old sizes in place while the strip closes; swap them only when there is a garment.
    if (strip && garment) {
      strip.replaceChildren(
        ...stock.map(({ size, inStock }) => {
          const chip = document.createElement('span');
          chip.className = `clothes-rack__cta-size${inStock ? '' : ' is-out'}`;
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

  /** Writes the current garment and side into the focused view; resolves once the photo decodes. */
  async #fill(): Promise<void> {
    const garment = this.#garments[this.#index];
    if (!garment) return;
    const { title = '', color = '', front = '', back = '' } = garment.dataset;

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
    if (price) price.textContent = garment.dataset.price ?? '';
    this.#showCta(this.#index);

    const face = this.ref<HTMLImageElement>('face');
    const src = this.#side === 'back' && back ? back : front;
    if (face && src && face.getAttribute('src') !== src) {
      face.src = src;
      face.alt = `${title}${this.#side === 'back' ? ' (back)' : ''}`;
      await face.decode().catch(() => undefined);
    }
    this.#preload(this.#index + 1);
    this.#preload(this.#index - 1);
  }

  #preload(index: number): void {
    const count = this.#garments.length;
    const { front, back } = this.#garments[(index + count) % count]?.dataset ?? {};
    for (const src of [front, back]) if (src) new Image().src = src;
  }

  #lift(): void {
    this.#turnOf(this.#index)?.classList.add('is-lifted');
  }

  /** Parts the rest of the rail around the lifted garment. */
  #part(): void {
    this.#items.forEach((item, i) => item.style.setProperty('--rack-shift', String(Math.sign(i - this.#index))));
  }

  #turnOf(index: number): HTMLElement | null {
    return this.#items[index]?.querySelector<HTMLElement>('.clothes-rack__turn') ?? null;
  }
}

define('nk-clothes-rack', NkClothesRack);
