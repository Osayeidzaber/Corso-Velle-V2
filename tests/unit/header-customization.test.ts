import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { NkHeader } from '../../src/components/header/header';
if (!customElements.get('nk-header')) customElements.define('nk-header', NkHeader);
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('matchMedia', () => ({matches:true}));
  vi.stubGlobal('ResizeObserver', class {observe() {} disconnect() {}});
});
afterEach(() => { document.body.innerHTML = ''; vi.useRealTimers(); vi.unstubAllGlobals(); });
function mount(trigger: string) {
  const root = document.createElement('nk-header'); root.dataset.navTrigger = trigger;
  root.innerHTML = '<div class="nav__item"><details class="nav__disclosure"><summary>More</summary><div class="nav__panel">Links</div></details></div>';
  document.body.append(root); return root;
}
it('keeps click-only menus closed on hover while retaining native disclosure markup', () => {
  const root = mount('click');
  root.querySelector('.nav__item')!.dispatchEvent(new PointerEvent('pointerenter', {pointerType:'mouse'}));
  vi.advanceTimersByTime(200);
  expect(root.querySelector('details')!.open).toBe(false);
  root.querySelector('summary')!.click();
  expect(root.querySelector('details')!.open).toBe(true);
});
it('clears pending hover work when the editor replaces the header', () => {
  const root = mount('hover');
  root.querySelector('.nav__item')!.dispatchEvent(new PointerEvent('pointerenter', {pointerType:'mouse'}));
  root.remove(); vi.advanceTimersByTime(200);
  expect(root.querySelector('details')!.open).toBe(false);
});
