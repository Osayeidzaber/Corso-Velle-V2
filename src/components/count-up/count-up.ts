import { define } from '../../core/define';
import { NkElement } from '../../core/element';
import { transitionsAllowed } from '../../core/motion';
import './count-up.css';

export interface CountFormat {
  value: number;
  decimals: number;
  grouping: boolean;
}

/** "12,000" → 12000 with grouping; "4.9" → one decimal. Null when the text isn't a plain number. */
export function parseCount(text: string): CountFormat | null {
  const clean = text.trim();
  if (!/^\d{1,3}(,\d{3})*(\.\d+)?$|^\d+(\.\d+)?$/.test(clean)) return null;
  const decimals = clean.includes('.') ? clean.split('.')[1]!.length : 0;
  return { value: Number(clean.replaceAll(',', '')), decimals, grouping: clean.includes(',') };
}

export function formatCount(value: number, { decimals, grouping }: CountFormat): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: grouping });
}

/**
 * <nk-count-up duration="1600"> — counts a statistic up from zero the first time it scrolls into
 * view (sections/counter-band.liquid, layout from HyperUI stats). Liquid prints the final number,
 * which is what no-JS, reduced-motion, Motion off and the theme editor keep; the section also
 * prints a visually hidden copy so assistive tech never hears intermediate values.
 */
export class NkCountUp extends NkElement {
  protected mount(): void {
    const original = this.textContent ?? '';
    const format = parseCount(original);
    if (!format || window.Shopify?.designMode || !transitionsAllowed()) return;
    const duration = Math.max(200, Number(this.getAttribute('duration')) || 1600);
    let frame = 0;
    this.textContent = formatCount(0, format);
    this.dispose(() => {
      cancelAnimationFrame(frame);
      this.textContent = original;
    });
    this.observeIntersection(this, (entry, observer) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const step = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - (1 - progress) ** 3;
        this.textContent = progress === 1 ? original : formatCount(format.value * eased, format);
        if (progress < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    }, { threshold: 0.4 });
  }
}

define('nk-count-up', NkCountUp);
