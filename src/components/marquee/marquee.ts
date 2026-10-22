import { t } from '../../core/config';
import { define } from '../../core/define';
import { NkElement } from '../../core/element';
import { decorativeMotionAllowed } from '../../core/motion';

/**
 * <nk-marquee> — endless ticker / message band / image strip / vertical reviews wall
 * (master-plan/05 T2). Clean-room rewrite of the behaviour of the supplied marquee (Magic UI),
 * Scroll Velocity (React Bits) and infiniteslider (motion-primitives) examples.
 *
 * Attributes: direction="left|right|up|down" speed="40" (px/s) hover-speed="0.3" (playback rate
 * while hovered; 0 pauses) scroll-react (speed follows page scroll velocity).
 *
 * - Liquid renders the list once; copies made here are aria-hidden + inert (no double reading,
 *   no duplicate tab stops).
 * - Web Animations on transform only; paused offscreen, in background tabs, on hover/focus.
 * - A pause button is always present while moving (WCAG 2.2.2).
 * - Reduced motion / Motion off / editor: static, scrollable list instead.
 */
export class NkMarquee extends NkElement {
  #animation: Animation | null = null;
  #userPaused = false;
  #visible = true;
  #pointerInside = false;
  #focusInside = false;
  /** Base playback rate, eased toward 1 or hover-speed so hover slows and resumes smoothly. */
  #rate = 1;
  #rateFrame = 0;
  #scrollBoost = 1;
  #frame = 0;

  get #hovered(): boolean {
    return this.#pointerInside || this.#focusInside;
  }

  protected mount(): void {
    const track = this.ref('track');
    const list = this.ref('list');
    if (!track || !list) return;
    this.#pointerInside = false;
    this.#focusInside = false;
    this.#rate = 1;

    if (!decorativeMotionAllowed()) {
      this.setAttribute('data-static', '');
      return;
    }

    this.#build(track, list);
    this.removeAttribute('data-static');
    let width = this.offsetWidth;
    this.observeResize(this, () => {
      if (Math.abs(this.offsetWidth - width) < 2) return;
      width = this.offsetWidth;
      this.#build(track, list);
    });

    this.observeIntersection(this, (entry) => {
      this.#visible = entry.isIntersecting;
      this.#sync();
    });
    this.on(document, 'visibilitychange', () => this.#sync());

    // Pointer and focus are tracked apart: tabbing out must not restart a strip the mouse still
    // rests on, and the mouse leaving must not restart one that holds keyboard focus.
    this.on(this, 'pointerenter', (event) => {
      if (event.pointerType !== 'mouse') return;
      this.#pointerInside = true;
      this.#easeRate();
    });
    this.on(this, 'pointerleave', () => {
      this.#pointerInside = false;
      this.#easeRate();
    });
    this.on(this, 'focusin', () => {
      this.#focusInside = true;
      this.#easeRate();
    });
    this.on(this, 'focusout', (event) => {
      if (this.contains(event.relatedTarget as Node | null)) return;
      this.#focusInside = false;
      this.#easeRate();
    });

    const pause = this.ref<HTMLButtonElement>('pause');
    if (pause) {
      pause.hidden = false;
      this.on(pause, 'click', () => {
        this.#userPaused = !this.#userPaused;
        pause.setAttribute('aria-pressed', String(this.#userPaused));
        pause.setAttribute('aria-label', this.#userPaused ? t('marquee.play') : t('marquee.pause'));
        this.#sync();
      });
    }

    if (this.hasAttribute('scroll-react')) this.#reactToScroll();
    this.dispose(() => {
      this.#animation?.cancel();
      cancelAnimationFrame(this.#frame);
      cancelAnimationFrame(this.#rateFrame);
      this.#frame = 0;
      this.#rateFrame = 0;
      this.querySelectorAll('[data-marquee-clone]').forEach((clone) => clone.remove());
    });
  }

  override onEditorSelect(blockId?: string): void {
    this.#userPaused = true;
    this.#sync();
    if (!blockId || !this.#animation) return;
    const block = this.ref('list')?.querySelector<HTMLElement>(`[data-block-id="${CSS.escape(blockId)}"]`);
    const distance = Number(this.dataset.distance ?? 0);
    const duration = Number(this.#animation.effect?.getTiming().duration ?? 0);
    if (block && distance && duration) {
      const offset = this.#vertical ? block.offsetTop : block.offsetLeft;
      this.#animation.currentTime = (offset / distance) * duration;
    }
  }

  override onEditorDeselect(): void {
    this.#userPaused = false;
    this.#sync();
  }

  get #vertical(): boolean {
    const direction = this.getAttribute('direction');
    return direction === 'up' || direction === 'down';
  }

  #build(track: HTMLElement, list: HTMLElement): void {
    this.#animation?.cancel();
    track.querySelectorAll('[data-marquee-clone]').forEach((clone) => clone.remove());

    const vertical = this.#vertical;
    const listSize = vertical ? list.offsetHeight : list.offsetWidth;
    const viewSize = vertical ? this.offsetHeight : this.offsetWidth;
    if (!listSize) return;

    // One "unit" covers the viewport; the track holds two units so -1 unit loops seamlessly.
    const perUnit = Math.max(1, Math.ceil(viewSize / listSize));
    const copies = perUnit * 2 - 1;
    for (let i = 0; i < copies; i++) {
      const clone = list.cloneNode(true) as HTMLElement;
      clone.removeAttribute('data-ref');
      clone.setAttribute('data-marquee-clone', '');
      clone.setAttribute('aria-hidden', 'true');
      clone.inert = true;
      clone.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
      clone.querySelectorAll('[data-block-id]').forEach((el) => el.removeAttribute('data-block-id'));
      track.append(clone);
    }

    const distance = listSize * perUnit;
    this.dataset.distance = String(distance);
    const speed = Math.max(5, Number(this.getAttribute('speed') ?? 40));
    const axis = vertical ? 'translateY' : 'translateX';
    const reverse = this.getAttribute('direction') === 'right' || this.getAttribute('direction') === 'down';
    this.#animation = track.animate(
      [{ transform: `${axis}(0)` }, { transform: `${axis}(-${distance}px)` }],
      { duration: (distance / speed) * 1000, iterations: Infinity, direction: reverse ? 'reverse' : 'normal' },
    );
    this.#applyPlayback(); // a rebuild mid-hover keeps the slowed rate
  }

  #sync(): void {
    const animation = this.#animation;
    if (!animation) return;
    // A hover-speed of 0 pauses only once the eased rate has actually reached zero.
    const stopped = this.#userPaused || !this.#visible || document.hidden || this.#rate === 0;
    if (stopped && animation.playState === 'running') animation.pause();
    if (!stopped && animation.playState !== 'running') animation.play();
    this.toggleAttribute('data-paused', this.#userPaused);
  }

  #targetRate(): number {
    return this.#hovered ? Math.max(0, Number(this.getAttribute('hover-speed') ?? '0') || 0) : 1;
  }

  #applyPlayback(): void {
    if (!this.#animation) return;
    if (this.#rate > 0) this.#animation.updatePlaybackRate(this.#rate * this.#scrollBoost);
    this.#sync();
  }

  /** Ease the base rate toward its target over ~300ms instead of jumping on hover in/out. */
  #easeRate(): void {
    if (this.#rateFrame) return;
    const step = () => {
      const target = this.#targetRate();
      this.#rate += (target - this.#rate) * 0.14;
      if (Math.abs(target - this.#rate) < 0.02) this.#rate = target;
      this.#applyPlayback();
      this.#rateFrame = this.#rate === target ? 0 : requestAnimationFrame(step);
    };
    this.#rateFrame = requestAnimationFrame(step);
  }

  /** Scroll Velocity behaviour: speed up with scroll speed, ease back when scrolling stops. */
  #reactToScroll(): void {
    let lastY = window.scrollY;
    let lastTime = performance.now();
    let skew = 0;
    const setSkew = () => this.style.setProperty('--nk-marquee-skew', `${skew.toFixed(2)}deg`);
    const decay = () => {
      this.#frame = 0;
      this.#scrollBoost += (1 - this.#scrollBoost) * 0.08;
      if (Math.abs(this.#scrollBoost - 1) < 0.01) this.#scrollBoost = 1;
      skew *= 0.88;
      if (Math.abs(skew) < 0.05) skew = 0;
      setSkew();
      this.#applyPlayback();
      if (this.#scrollBoost !== 1 || skew !== 0) this.#frame = requestAnimationFrame(decay);
    };
    this.on(
      window,
      'scroll',
      () => {
        if (!this.#visible) return;
        const now = performance.now();
        const signed = (window.scrollY - lastY) / Math.max(16, now - lastTime); // px/ms
        const velocity = Math.abs(signed);
        lastY = window.scrollY;
        // Scroll Velocity "skewWithVelocity": letters lean into the scroll, capped at 16deg.
        skew = Math.max(-16, Math.min(16, skew * 0.6 + signed * -6));
        setSkew();
        lastTime = now;
        this.#scrollBoost = Math.min(3, Math.max(this.#scrollBoost, 1 + velocity * 1.5));
        this.#applyPlayback();
        if (!this.#frame) this.#frame = requestAnimationFrame(decay);
      },
      { passive: true },
    );
  }
}

define('nk-marquee', NkMarquee);
