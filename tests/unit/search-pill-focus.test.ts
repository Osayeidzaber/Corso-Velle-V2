import { afterEach, expect, it } from 'vitest';
import '../../src/components/search-pill/search-pill';
afterEach(() => { document.body.innerHTML = ''; });
it('keeps search open across the toggle-to-input focus transfer and closes after focus leaves', async () => {
  const pill = document.createElement('nk-search-pill');
  pill.innerHTML = '<button data-ref="toggle">Search</button><form><input type="search"><button type="button" data-ref="close">Close</button></form>';
  const outside = document.createElement('button');
  document.body.append(pill, outside);
  const toggle = pill.querySelector<HTMLButtonElement>('[data-ref="toggle"]')!;
  const input = pill.querySelector<HTMLInputElement>('input')!;
  toggle.focus(); toggle.click();
  // Browsers can report null relatedTarget when a focused element becomes hidden.
  toggle.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
  await Promise.resolve();
  expect(document.activeElement).toBe(input);
  expect(pill.hasAttribute('data-open')).toBe(true);
  outside.focus();
  await Promise.resolve();
  expect(pill.hasAttribute('data-open')).toBe(false);
});
