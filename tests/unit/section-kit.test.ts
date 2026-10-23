import { afterEach, describe, expect, it, vi } from 'vitest';

const policy = vi.hoisted(() => ({ transitions: true }));
vi.mock('../../src/core/motion', () => ({
  transitionsAllowed: () => policy.transitions,
  animate: () => null,
}));

import { parseEnd, remaining } from '../../src/components/countdown/countdown';
import { formatCount, parseCount } from '../../src/components/count-up/count-up';
import '../../src/components/dismissible/dismissible';
import '../../src/components/image-compare/image-compare';
import '../../src/components/video/video';

/** Parse detached, then connect, so each element mounts with its children in place (as in a page). */
function render(markup: string): void {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = markup;
  document.body.append(...wrapper.childNodes);
}

afterEach(() => {
  document.body.innerHTML = '';
  sessionStorage.clear();
  policy.transitions = true;
  vi.useRealTimers();
});

describe('countdown', () => {
  it('reads the end date in the shop offset and splits the remaining time', () => {
    const end = parseEnd('2026-12-31T23:59:00', '+0100');
    expect(end).toBe(Date.parse('2026-12-31T22:59:00Z'));
    expect(remaining(end, end - ((2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000))).toMatchObject({ days: 2, hours: 3, minutes: 4, seconds: 5 });
    expect(remaining(end, end + 5000).total).toBe(0);
  });

  it('rejects malformed editor values instead of counting to an arbitrary date', () => {
    expect(parseEnd('31/12/2026T23:59:00', '+0100')).toBeNaN();
    expect(parseEnd('2026-12-31TT:00', '')).toBeNaN();
  });

  it('shows the ended message once the date has passed', async () => {
    await import('../../src/components/countdown/countdown');
    render('<nk-countdown ends-at="2001-01-01T00:00:00" utc-offset="+0000" hide-ended><div data-ref="clock"><span data-ref="days">00</span></div><p data-ref="ended" hidden>Ended</p></nk-countdown>');
    const element = document.querySelector('nk-countdown')!;
    expect(element.hasAttribute('data-ended')).toBe(true);
    expect(element.querySelector<HTMLElement>('[data-ref="ended"]')!.hidden).toBe(false);
    expect(element.querySelector<HTMLElement>('[data-ref="clock"]')!.hidden).toBe(true);
  });
});

describe('count-up', () => {
  it('keeps the merchant number format', () => {
    const grouped = parseCount('12,000')!;
    expect(grouped).toEqual({ value: 12000, decimals: 0, grouping: true });
    expect(formatCount(4500.4, grouped)).toBe('4,500');
    expect(formatCount(2.46, parseCount('4.9')!)).toBe('2.5');
    expect(parseCount('about 40')).toBeNull();
  });
});

describe('dismissible banner', () => {
  it('reveals the close button and stays hidden for the session after dismissing', () => {
    const markup = '<div class="shopify-section"><nk-dismissible key="banner-a"><p>Free delivery</p><button data-ref="dismiss" hidden>Dismiss</button></nk-dismissible></div>';
    render(markup);
    const button = document.querySelector<HTMLButtonElement>('[data-ref="dismiss"]')!;
    expect(button.hidden).toBe(false);
    button.click();
    expect(document.querySelector<HTMLElement>('.shopify-section')!.hidden).toBe(true);

    document.body.innerHTML = '';
    render(markup);
    expect(document.querySelector<HTMLElement>('.shopify-section')!.hidden).toBe(true);
  });
});

describe('image compare', () => {
  it('moves the split with the native range input', () => {
    render('<nk-image-compare style="--position:50%"><input data-ref="range" type="range" value="50" hidden></nk-image-compare>');
    const element = document.querySelector<HTMLElement>('nk-image-compare')!;
    const range = element.querySelector('input')!;
    expect(range.hidden).toBe(false);
    range.value = '20';
    range.dispatchEvent(new Event('input'));
    expect(element.style.getPropertyValue('--position')).toBe('20%');
  });
});

describe('video', () => {
  it('loads the player only after the poster is activated', () => {
    render('<nk-video><a data-ref="play" href="https://example.com/watch">Play</a><template data-ref="media"><iframe title="Film"></iframe></template></nk-video>');
    expect(document.querySelector('nk-video iframe')).toBeNull();
    document.querySelector<HTMLAnchorElement>('[data-ref="play"]')!.click();
    expect(document.querySelector('nk-video > iframe')).not.toBeNull();
    expect(document.querySelector('[data-ref="play"]')).toBeNull();
  });
});
