import { define } from '../../core/define';
import { NkElement } from '../../core/element';
import { decorativeMotionAllowed } from '../../core/motion';

/** Responsive native footer menus and a reveal that is enabled only when the footer fits. */
export class NkFooter extends NkElement {
  protected mount(): void {
    const desktop = matchMedia('(min-width: 990px)');
    const menus = [...this.querySelectorAll<HTMLDetailsElement>('[data-footer-menu]')];
    const fitWordmark = this.#wordmark();
    const update = () => {
      const fits = this.getBoundingClientRect().height < window.innerHeight - 32;
      this.toggleAttribute('data-reveal-ready', this.hasAttribute('data-reveal') && desktop.matches && fits && decorativeMotionAllowed() && !this.hasAttribute('data-editor-selected'));
    };
    const layout = () => {
      menus.forEach((menu) => {
        menu.open = desktop.matches;
        const summary = menu.querySelector('summary');
        if (summary) summary.tabIndex = desktop.matches ? -1 : 0;
      });
      update();
    };
    layout();
    this.on(desktop, 'change', layout);
    this.on(window, 'resize', update, { passive: true });
    this.on(document, 'nk:motion:changed', update);
    this.on(this, 'nk:footer:refresh', update);
    this.on(this, 'focusin', () => {
      // Sticky bounds can appear in-view while the main content still paints over the footer.
      if (this.hasAttribute('data-reveal-ready')) window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
    });
    this.on(this, 'submit', (event) => {
      if (window.Shopify?.designMode) event.preventDefault();
    });
    this.observeResize(this, () => { fitWordmark(); update(); });
    this.#beam();
    this.on(this, 'click', (event) => {
      if (desktop.matches && (event.target as Element).closest('[data-footer-menu] > summary')) {
        event.preventDefault(); event.stopPropagation();
      }
    }, { capture: true });
    this.dispose(() => this.removeAttribute('data-reveal-ready'));
  }

  override onEditorSelect(): void {
    this.setAttribute('data-editor-selected', '');
    this.removeAttribute('data-reveal-ready');
    this.querySelectorAll<HTMLDetailsElement>('[data-footer-menu]').forEach((menu) => menu.open = true);
    this.dispatchEvent(new Event('nk:footer:refresh'));
  }

  override onEditorDeselect(): void {
    this.removeAttribute('data-editor-selected');
    this.dispatchEvent(new Event('nk:footer:refresh'));
  }

  /** Adapted from the supplied Beam Wordmark Footer: fit live brand text, then align
   * each letter's painted light to the footer's coordinates, independent of its reveal. */
  #wordmark(): () => void {
    const word = this.querySelector<HTMLElement>('[data-footer-word]');
    if (!word) return () => {};
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const signal = this.signal;
    const fit = () => {
      const available = word.parentElement?.clientWidth ?? 0;
      if (!context || !available) return;
      const style = getComputedStyle(word);
      context.font = `${style.fontWeight} 100px ${style.fontFamily}`;
      const text = word.textContent?.trim() ?? '';
      const metrics = context.measureText(text);
      const spacing = (parseFloat(style.letterSpacing) || 0) / (parseFloat(style.fontSize) || 100) * 100;
      const measured = metrics.width + Math.max(0, Array.from(text).length - 1) * spacing;
      if (measured <= 0) return;
      const size = Math.min(300, 100 * available / measured);
      word.style.fontSize = `${size}px`;
      this.style.setProperty('--footer-word-size', `${size}px`);
      const ascent = metrics.fontBoundingBoxAscent;
      const descent = metrics.fontBoundingBoxDescent;
      const baseline = ascent > 0 && descent >= 0 ? ((100 - ascent - descent) / 2 + ascent) / 100 : .8;
      this.style.setProperty('--footer-word-height', `${size * Math.max(.65, baseline + .02)}px`);
      this.style.setProperty('--footer-width', `${this.clientWidth}px`);
      this.style.setProperty('--footer-height', `${this.clientHeight}px`);
      word.querySelectorAll<HTMLElement>('.footer__letter').forEach((letter) => {
        let x = 0; let y = 0;
        let element: HTMLElement | null = letter;
        while (element && element !== this) {
          x += element.offsetLeft; y += element.offsetTop;
          element = element.offsetParent as HTMLElement | null;
        }
        letter.style.setProperty('--footer-x', `${x}px`);
        letter.style.setProperty('--footer-y', `${y}px`);
      });
    };
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    };
    schedule();
    document.fonts?.ready.then(() => { if (!signal.aborted) schedule(); });
    this.on(window, 'resize', schedule, { passive: true });
    this.dispose(() => cancelAnimationFrame(frame));
    return schedule;
  }

  /** Same slow beam drift and frame-rate-independent easing as the supplied React
   * component, scoped to this element and paused offscreen or in background tabs. */
  #beam(): void {
    let frame = 0; let visible = false; let inside = false;
    let beam = 58; let x = this.clientWidth / 2; let y = 0; let glow = 0;
    let targetX = x; let targetY = y; let u = .5;
    let last = 0; let time = 0;
    const allowed = () => decorativeMotionAllowed() && !this.hasAttribute('data-editor-selected');
    const paint = () => {
      this.style.setProperty('--footer-beam', `${beam.toFixed(2)}%`);
      this.style.setProperty('--footer-pointer-x', `${x.toFixed(1)}px`);
      this.style.setProperty('--footer-pointer-y', `${y.toFixed(1)}px`);
      this.style.setProperty('--footer-glow', glow.toFixed(3));
    };
    const tick = (now: number) => {
      const dt = Math.min(.1, (now - last) / 1000);
      last = now; time += dt;
      const approach = (from: number, to: number, k: number) => to + (from - to) * Math.pow(1 - k, dt * 60);
      const idle = 58 + 9 * (.7 * Math.sin(time * .21) + .3 * Math.sin(time * .077 + 1.3));
      beam = approach(beam, inside ? (30 + 52 * u) * .75 + idle * .25 : idle, .035);
      x = approach(x, targetX, .16); y = approach(y, targetY, .16);
      glow = approach(glow, inside ? 1 : 0, .06);
      paint();
      frame = requestAnimationFrame(tick);
    };
    const update = () => {
      this.toggleAttribute('data-animate', allowed());
      // A sticky footer can intersect the viewport while the opaque main content
      // still covers it. Only animate after the first strip is actually uncovered.
      const main = document.querySelector('main');
      const uncovered = !this.hasAttribute('data-reveal-ready') || !main || main.getBoundingClientRect().bottom < innerHeight - 16;
      const exposed = visible && uncovered && !document.hidden;
      if (exposed && !this.hasAttribute('data-entered')) this.setAttribute('data-entered', '');
      if (exposed && allowed() && this.hasAttribute('data-beam')) {
        if (!frame) { last = performance.now(); frame = requestAnimationFrame(tick); }
      } else if (frame || !allowed()) {
        cancelAnimationFrame(frame); frame = 0;
        glow = 0;
        if (!allowed()) beam = 58;
        paint();
      }
    };
    this.observeIntersection(this, (entry) => {
      visible = entry.isIntersecting;
      update();
    }, { threshold: 0 });
    this.on(this, 'pointermove', (event) => {
      if ((event as PointerEvent).pointerType === 'touch') return;
      const rect = this.getBoundingClientRect();
      targetX = (event as PointerEvent).clientX - rect.left;
      targetY = (event as PointerEvent).clientY - rect.top;
      u = Math.max(0, Math.min(1, rect.width ? targetX / rect.width : .5));
      inside = true;
    }, { passive: true });
    this.on(this, 'pointerleave', () => { inside = false; });
    this.on(document, 'visibilitychange', update);
    this.on(window, 'scroll', update, { passive: true });
    this.on(window, 'resize', update, { passive: true });
    this.on(document, 'nk:motion:changed', update);
    this.on(this, 'nk:footer:refresh', update);
    this.dispose(() => {
      cancelAnimationFrame(frame);
      this.removeAttribute('data-animate');
      this.removeAttribute('data-entered');
    });
    update();
  }
}

define('nk-footer', NkFooter);
