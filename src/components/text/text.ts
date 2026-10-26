import { define } from '../../core/define';
import { NkElement } from '../../core/element';
import { motionMode, motionTempo, motionStagger } from '../../core/motion';

type Effect = 'cut' | 'rise' | 'blur' | 'flip' | 'pop' | 'skew' | 'fold' | 'fade';
type SplitBy = 'chars' | 'words' | 'lines';
type Hover = 'none' | 'lift' | 'refold';

/** Spring constants for the hover lift (per piece, critically damped). */
const STIFFNESS = 140;
const DAMPING = 22;

/**
 * <nk-text effect split hover stagger-from play-on-load> — editorial animated headings.
 *
 * - The heading is real text in the HTML. With motion on, CSS hides it before first paint
 *   (html.nk-anim) and this element reveals it already split, so it never flashes in twice.
 *   A CSS failsafe shows it after 3s if scripts fail.
 * - Splitting wraps each word in an overflow-hidden clip mask (.nk-w-clip) and a no-wrap
 *   inline-block (.nk-w) so words rise smoothly from a clean baseline without breaking mid-word.
 * - Screen readers get the text from an aria-label on the heading; the pieces are aria-hidden.
 *   The DOM text stays a single copy, so rendered-page crawlers read the heading once.
 */
export class NkText extends NkElement {
  #revert: (() => void) | null = null;
  #frame = 0;

  protected mount(): void {
    if (motionMode() === 'off' || this.hasAttribute('data-done')) {
      this.#show();
      return;
    }
    void this.#start().catch((error: unknown) => {
      console.error(error);
      this.#show();
    });
  }

  protected override unmount(): void {
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
    this.#revert?.();
    this.#revert = null;
  }

  override onEditorSelect(): void {
    this.#revert?.();
    this.#show();
  }

  #show(): void {
    this.setAttribute('data-ready', '');
    this.setAttribute('data-done', '');
  }

  async #start(): Promise<void> {
    const connection = this.signal;
    const { gsap, ScrollTrigger } = await import('../../motion/gsap');
    if (!this.connectionIsCurrent(connection)) return;
    if (document.fonts && document.fonts.status !== 'loaded') {
      await Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 1200))]);
    }
    if (!this.connectionIsCurrent(connection)) return;

    const target = this.querySelector<HTMLElement>('[data-text-target]') ?? (this.firstElementChild as HTMLElement | null);
    if (!target) return this.#show();

    const simple = motionMode() === 'simple';
    const effect = (simple ? 'fade' : this.getAttribute('effect') ?? 'cut') as Effect;
    const by = (simple ? 'words' : this.getAttribute('split') ?? 'words') as SplitBy;
    const hover = (this.getAttribute('hover') ?? 'none') as Hover;
    const from = (this.getAttribute('stagger-from') ?? 'start') as 'start' | 'center' | 'end';

    const originalHTML = target.innerHTML;
    const originalLabel = target.getAttribute('aria-label');
    const label = target.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    const masked = effect === 'cut' || effect === 'rise';
    const { words, chars } = splitText(target, by === 'chars', masked);
    if (label && originalLabel === null) {
      // Pieces are aria-hidden; the label keeps the text whole for screen readers. A hidden text
      // copy would also do that, but would double the heading's text for search engines.
      target.setAttribute('aria-label', label);
    }

    const em = Number.parseFloat(getComputedStyle(target).fontSize) || 16;
    const pieces = by === 'chars' ? chars : words;
    const look = effectVars(effect, em);
    const requestedStagger = this.hasAttribute('stagger') ? Number(this.getAttribute('stagger')) : motionStagger();
    const each = Math.min(Math.max(0, requestedStagger), 0.35 / Math.max(1, pieces.length - 1));
    const duration = (Number(this.getAttribute('duration')) || (simple ? 0.45 : look.duration)) * motionTempo();

    const context = gsap.context(() => {
      gsap.set(pieces, look.from);
      this.setAttribute('data-ready', '');

      const timeline = gsap.timeline({
        paused: true,
        delay: Number(this.getAttribute('delay')) || 0,
        onComplete: () => {
          gsap.set(pieces, { clearProps: 'transform,filter,opacity,willChange' });
          this.setAttribute('data-done', '');
          if (hover !== 'none') this.#enableHover(hover, words, em);
        },
      });

      if (by === 'lines') {
        // Words that share a line move together; lines follow each other.
        lineGroups(words).forEach((line, index) => {
          timeline.to(line, { ...look.to, duration, ease: look.ease }, index * each);
        });
      } else {
        timeline.to(pieces, { ...look.to, duration, ease: look.ease, stagger: { each, from } }, 0);
      }

      if (this.hasAttribute('play-on-load')) {
        timeline.play(0);
      } else {
        ScrollTrigger.create({
          trigger: this, start: 'top 90%', once: true,
          onEnter: () => timeline.play(0),
          onLeave: () => { timeline.progress(1); },
        });
      }
    }, this);
    this.#revert = () => {
      context.revert();
      target.innerHTML = originalHTML;
      if (originalLabel === null) target.removeAttribute('aria-label');
    };
  }

  /** Subtle pointer hover response when explicitly enabled. */
  #enableHover(mode: Hover, pieces: HTMLElement[], em: number): void {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches || !pieces.length) return;
    const springs = pieces.map(() => ({ value: 0, velocity: 0 }));
    const pointer = { x: 0, y: 0, inside: false };
    let centers: Array<{ x: number; y: number }> = [];
    let last = 0;

    const measure = (): void => {
      centers = pieces.map((piece) => {
        const rect = piece.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      });
    };

    const step = (now: number): void => {
      const dt = Math.min(0.032, (now - (last || now)) / 1000 || 0.016);
      last = now;
      let moving = false;
      pieces.forEach((piece, index) => {
        const spring = springs[index]!;
        const center = centers[index];
        let target = 0;
        if (pointer.inside && center) {
          const dx = (center.x - pointer.x) / (em * 1.1);
          const dy = (center.y - pointer.y) / (em * 1.2);
          const falloff = Math.exp(-(dx * dx + dy * dy) * 0.5);
          target = mode === 'lift' ? -em * 0.06 * falloff : -14 * falloff;
        }
        spring.velocity += (STIFFNESS * (target - spring.value) - DAMPING * spring.velocity) * dt;
        spring.value += spring.velocity * dt;
        if (Math.abs(target - spring.value) < 0.02 && Math.abs(spring.velocity) < 0.05) {
          spring.value = target;
          spring.velocity = 0;
        } else {
          moving = true;
        }
        if (mode === 'lift') {
          piece.style.translate = Math.abs(spring.value) > 0.01 ? `0 ${spring.value.toFixed(2)}px` : '';
        } else {
          piece.style.transform =
            Math.abs(spring.value) > 0.05 ? `perspective(700px) rotateX(${spring.value.toFixed(2)}deg)` : '';
        }
      });
      this.#frame = moving || pointer.inside ? requestAnimationFrame(step) : 0;
      if (!this.#frame) last = 0;
    };

    const wake = (): void => {
      if (!this.#frame) this.#frame = requestAnimationFrame(step);
    };

    // Touch on hybrid devices would leave the lift parked under the last tap point.
    this.on(this, 'pointerenter', (event) => {
      if (event.pointerType === 'touch') return;
      measure();
      pointer.inside = true;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      wake();
    });
    this.on(this, 'pointermove', (event) => {
      if (!pointer.inside) return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      wake();
    });
    this.on(this, 'pointerleave', () => {
      pointer.inside = false;
      wake();
    });
    this.on(window, 'scroll', () => pointer.inside && measure(), { passive: true });
  }
}

interface Look {
  from: gsap.TweenVars;
  to: gsap.TweenVars;
  ease: string;
  duration: number;
}

function effectVars(effect: Effect, em: number): Look {
  switch (effect) {
    case 'fade':
      return { from: { opacity: 0, y: em * 0.14 }, to: { opacity: 1, y: 0 }, ease: 'power3.out', duration: 0.9 };
    case 'blur':
      return {
        from: { opacity: 0, filter: 'blur(6px)', y: em * 0.14 },
        to: { opacity: 1, filter: 'blur(0px)', y: 0 },
        ease: 'power3.out',
        duration: 0.95,
      };
    case 'flip':
    case 'fold':
      return {
        from: { opacity: 0, yPercent: 85, rotationX: -28, transformPerspective: 900, transformOrigin: '50% 100%' },
        to: { opacity: 1, yPercent: 0, rotationX: 0 },
        ease: 'expo.out',
        duration: 0.95,
      };
    case 'pop':
      return { from: { opacity: 0, y: em * 0.2 }, to: { opacity: 1, y: 0 }, ease: 'power3.out', duration: 0.85 };
    case 'skew':
      return {
        from: { opacity: 0, yPercent: 95, skewY: 3, transformOrigin: '0% 100%' },
        to: { opacity: 1, yPercent: 0, skewY: 0 },
        ease: 'expo.out',
        duration: 1.0,
      };
    case 'cut':
    case 'rise':
    default:
      return {
        from: { opacity: 0, yPercent: 102 },
        to: { opacity: 1, yPercent: 0 },
        ease: 'expo.out',
        duration: 0.95,
      };
  }
}

const WHOLE = '.nk-text-shine, .nk-text-gradient';

/** Wrap words (and optionally letters) in inline-blocks, keeping inline markup. */
function splitText(root: HTMLElement, letters: boolean, masked: boolean): { words: HTMLElement[]; chars: HTMLElement[] } {
  const words: HTMLElement[] = [];
  const chars: HTMLElement[] = [];

  const visit = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? '';
      if (!text.trim()) return;
      const fragment = document.createDocumentFragment();
      for (const part of text.split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) {
          fragment.append(document.createTextNode(' '));
          continue;
        }
        const word = document.createElement('span');
        word.className = 'nk-w';
        word.setAttribute('aria-hidden', 'true');
        if (letters) {
          for (const glyph of Array.from(part)) {
            const char = document.createElement('span');
            char.className = 'nk-c';
            char.textContent = glyph;
            word.append(char);
            chars.push(char);
          }
        } else {
          word.textContent = part;
        }
        words.push(word);
        if (masked) {
          const clip = document.createElement('span');
          clip.className = 'nk-w-clip';
          clip.setAttribute('aria-hidden', 'true');
          clip.append(word);
          fragment.append(clip);
        } else {
          fragment.append(word);
        }
      }
      node.parentNode?.replaceChild(fragment, node);
      return;
    }
    if (node instanceof HTMLElement) {
      if (node.matches(WHOLE)) {
        // background-clip:text does not paint into transformed children: move it as one piece.
        node.classList.add('nk-w');
        node.setAttribute('aria-hidden', 'true');
        words.push(node);
        chars.push(node);
        return;
      }
      for (const child of [...node.childNodes]) visit(child);
    }
  };

  for (const child of [...root.childNodes]) visit(child);
  return { words, chars };
}

function lineGroups(words: HTMLElement[]): HTMLElement[][] {
  const lines: HTMLElement[][] = [];
  let top = Number.NaN;
  for (const word of words) {
    const offset = Math.round(word.getBoundingClientRect().top);
    if (Number.isNaN(top) || Math.abs(offset - top) > 4) {
      lines.push([]);
      top = offset;
    }
    lines[lines.length - 1]!.push(word);
  }
  return lines;
}

define('nk-text', NkText);
