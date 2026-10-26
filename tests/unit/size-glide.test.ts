import { afterEach, expect, it, vi } from 'vitest';
import { installSizeGlide } from '../../src/components/product/size-glide';
afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals(); });
it('retargets one highlight, skips disabled sizes and does not change radio selection', () => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  document.body.innerHTML = '<div data-size-values><div data-size-pill="S"><input type="radio"><label>S</label></div><div data-size-pill="M"><input type="radio"><label>M</label></div><div data-size-pill="L"><input type="radio" disabled><label>L</label></div></div>';
  const row = document.querySelector<HTMLElement>('[data-size-values]')!;
  const controller = new AbortController(); const cleanup = installSizeGlide(row, controller.signal);
  const labels = row.querySelectorAll('label');
  const hover = (index: number, type = 'mouse') => labels[index]!.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: type }));
  hover(0); hover(1); hover(0); hover(1);
  expect(row.querySelectorAll('.option__hover-glide')).toHaveLength(1);
  expect(row.querySelector('.option__hover-glide')?.hasAttribute('data-active')).toBe(true);
  expect(row.querySelector('input:checked')).toBeNull();
  hover(2);
  expect(row.querySelector('.option__hover-glide')?.hasAttribute('data-active')).toBe(false);
  hover(0, 'touch');
  expect(row.querySelector('.option__hover-glide')?.hasAttribute('data-active')).toBe(false);
  controller.abort(); cleanup();
  expect(row.querySelector('.option__hover-glide')).toBeNull();
});

