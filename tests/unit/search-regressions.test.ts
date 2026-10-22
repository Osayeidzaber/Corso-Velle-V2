import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NkElement } from '../../src/core/element';
import '../../src/components/predictive-search/predictive-search';
import '../../src/components/search-pill/search-pill';

const box = () => '<nk-predictive-search><form><input type="search"></form><div data-ref="results"></div></nk-predictive-search>';
const results = () => new Response('<div data-predictive-results data-results-count="1"><ul id="PredictiveSearchListbox" role="listbox"><li id="PredictiveOption-1" role="option"><a href="/products/a">Coat</a></li></ul></div>');
const input = (value: string, element = document.querySelector<HTMLInputElement>('input')!) => {
  element.value = value;
  element.dispatchEvent(new Event('input', { bubbles: true }));
};
function mount(markup: string): void {
  document.body.innerHTML = markup;
  for (const el of document.querySelectorAll<NkElement>('nk-predictive-search, nk-search-pill')) {
    el.disconnectedCallback(); el.connectedCallback();
  }
}
beforeEach(() => vi.useFakeTimers());
afterEach(() => { document.body.replaceChildren(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('search request races', () => {
  it('invalidates an in-flight response immediately, before the next debounce fires', async () => {
    let finish!: (value: Response) => void;
    vi.stubGlobal('fetch', () => new Promise<Response>((resolve) => { finish = resolve; }));
    mount(box());
    input('coat');
    await vi.advanceTimersByTimeAsync(200);
    input('linen');
    finish(results());
    await vi.advanceTimersByTimeAsync(1);
    expect(document.querySelector('[role="option"]')).toBeNull();
    expect(document.querySelector('input')!.getAttribute('aria-expanded')).toBe('false');
  });

  it('isolates listbox and option ids for simultaneous search boxes', async () => {
    vi.stubGlobal('fetch', async () => results());
    mount(box() + box());
    document.querySelectorAll<HTMLInputElement>('input').forEach((el) => input('coat', el));
    await vi.advanceTimersByTimeAsync(210);
    const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const el of document.querySelectorAll<HTMLInputElement>('input')) {
      const list = document.getElementById(el.getAttribute('aria-controls')!);
      expect(list?.getAttribute('role')).toBe('listbox');
      expect(el.closest('nk-predictive-search')?.contains(list)).toBe(true);
    }
  });

  it('does not reopen header results after clearing and closing the pill', async () => {
    let finish!: (value: Response) => void;
    vi.stubGlobal('fetch', () => new Promise<Response>((resolve) => { finish = resolve; }));
    mount('<nk-search-pill data-predictive><button data-ref="toggle">Search</button><form><input type="search"><button type="button" data-ref="close">Close</button></form></nk-search-pill>');
    document.querySelector<HTMLButtonElement>('[data-ref="toggle"]')!.click();
    input('coat'); await vi.advanceTimersByTimeAsync(200);
    document.querySelector<HTMLButtonElement>('[data-ref="close"]')!.click();
    finish(results()); await vi.advanceTimersByTimeAsync(1);
    expect(document.querySelector<HTMLElement>('.search-pill__results')!.hidden).toBe(true);
    expect(document.querySelector('nk-search-pill')!.hasAttribute('data-open')).toBe(false);
  });

  it('keeps keyboard selection tied to the current instance option id', async () => {
    vi.stubGlobal('fetch', async () => results());
    mount(box());
    input('coat'); await vi.advanceTimersByTimeAsync(210);
    const field = document.querySelector<HTMLInputElement>('input')!;
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    const active = document.getElementById(field.getAttribute('aria-activedescendant')!);
    expect(active?.getAttribute('aria-selected')).toBe('true');
    expect(active?.textContent).toBe('Coat');
  });
});
