import { define } from '../../core/define';
import { NkElement } from '../../core/element';
import { motionMode } from '../../core/motion';

/**
 * <nk-elastic-line> — decorative divider that bends toward the pointer and springs back
 * (clean-room rewrite of the supplied elasticline example). Purely decorative: aria-hidden, no
 * focus, nothing depends on it. The spring runs in rAF only while the line is moving.
 * Reduced motion / Motion off / editor: a static hairline.
 *
 * Attributes: grab="12" (px distance that catches the line), release="60" (px that lets go).
 */
const STIFFNESS = 0.12;
const DAMPING = 0.82;

export class NkElasticLine extends NkElement {
  #path: SVGPathElement | null = null;
  #offset = 0;
  #velocity = 0;
  #target = 0;
  #x = 0.5;
  #grabbed = false;
  #frame = 0;

  protected mount(): void {
    this.setAttribute('aria-hidden', 'true');
    this.#path = this.querySelector('path');
    this.#draw();
    if (motionMode() !== 'full' || !this.#path) return;

    const grab = Number(this.getAttribute('grab') ?? 12);
    const release = Number(this.getAttribute('release') ?? 60);
    const zone = this.parentElement ?? this;
    this.on(zone, 'pointermove', (event) => {
      if (event.pointerType !== 'mouse') return;
      const rect = this.getBoundingClientRect();
      const dy = event.clientY - (rect.top + rect.height / 2);
      const inside = event.clientX >= rect.left && event.clientX <= rect.right;
      if (!this.#grabbed && inside && Math.abs(dy) < grab) this.#grabbed = true;
      if (this.#grabbed && (Math.abs(dy) > release || !inside)) this.#grabbed = false;
      this.#x = Math.min(1, Math.max(0, (event.clientX - rect.left) / Math.max(1, rect.width)));
      this.#target = this.#grabbed ? dy : 0;
      this.#run();
    });
    this.on(zone, 'pointerleave', () => {
      this.#grabbed = false;
      this.#target = 0;
      this.#run();
    });
    this.dispose(() => {
      cancelAnimationFrame(this.#frame);
      this.#frame = 0; // a stale id would block #run after reconnection
    });
  }

  #run(): void {
    if (this.#frame) return;
    const tick = () => {
      this.#velocity = (this.#velocity + (this.#target - this.#offset) * STIFFNESS) * DAMPING;
      this.#offset += this.#velocity;
      this.#draw();
      const settled = Math.abs(this.#velocity) < 0.05 && Math.abs(this.#target - this.#offset) < 0.05;
      if (settled) {
        this.#offset = this.#target;
        this.#draw();
        this.#frame = 0;
        return;
      }
      this.#frame = requestAnimationFrame(tick);
    };
    this.#frame = requestAnimationFrame(tick);
  }

  #draw(): void {
    // viewBox is 0..100 × -50..50; quadratic curve with the control point under the pointer.
    this.#path?.setAttribute('d', `M0 0 Q ${(this.#x * 100).toFixed(2)} ${(this.#offset * 2).toFixed(2)} 100 0`);
  }
}

define('nk-elastic-line', NkElasticLine);
