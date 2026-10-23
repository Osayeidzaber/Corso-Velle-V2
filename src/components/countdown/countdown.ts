import { define } from '../../core/define';
import { NkElement } from '../../core/element';
import { transitionsAllowed } from '../../core/motion';
import './countdown.css';

export interface Remaining {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/** Time left until `target` (epoch ms), never negative. */
export function remaining(target: number, now: number): Remaining {
  const total = Math.max(0, target - now);
  const s = Math.floor(total / 1000);
  return { total, days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
}

/** "2026-12-31T23:59:00" + Liquid's `%z` ("+0100") → epoch ms, or NaN when the editor value is malformed. */
export function parseEnd(endsAt: string, offset: string): number {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(endsAt)) return Number.NaN;
  const zone = /^([+-])(\d{2}):?(\d{2})$/.exec(offset.trim());
  return Date.parse(zone ? `${endsAt}${zone[1]}${zone[2]}:${zone[3]}` : endsAt);
}

/**
 * <nk-countdown ends-at="2026-12-31T23:59:00" utc-offset="+0100" hide-ended> — ticking clock for
 * sections/countdown.liquid. Rolling digits are daisyUI's countdown technique (MIT): each digit
 * span carries --value and CSS scrolls a 00–99 strip; the visible number stays in the text so it
 * reads correctly where CSS mod()/round() is missing. The clock is aria-hidden; the end date
 * printed by Liquid is the accessible equivalent, so screen readers aren't told every second.
 */
export class NkCountdown extends NkElement {
  protected mount(): void {
    const target = parseEnd(this.getAttribute('ends-at') ?? '', this.getAttribute('utc-offset') ?? '');
    if (Number.isNaN(target)) return;
    const units = (['days', 'hours', 'minutes', 'seconds'] as const).map((name) => [name, this.ref(name)] as const);
    this.toggleAttribute('data-rolling', transitionsAllowed());
    this.on(document, 'nk:motion:changed', () => this.toggleAttribute('data-rolling', transitionsAllowed()));

    let timer = 0;
    const tick = () => {
      const left = remaining(target, Date.now());
      for (const [name, element] of units) {
        if (!element) continue;
        const value = left[name];
        element.style.setProperty('--value', String(value));
        element.style.setProperty('--digits', value > 99 ? '3' : '2');
        element.textContent = String(value).padStart(2, '0');
      }
      if (left.total === 0) {
        window.clearInterval(timer);
        this.setAttribute('data-ended', '');
        const ended = this.ref('ended');
        if (ended) ended.hidden = false;
        const clock = this.ref('clock');
        if (clock && this.hasAttribute('hide-ended')) clock.hidden = true;
      }
    };
    tick();
    if (this.hasAttribute('data-ended')) return;
    timer = window.setInterval(tick, 1000);
    this.dispose(() => window.clearInterval(timer));
  }
}

define('nk-countdown', NkCountdown);
