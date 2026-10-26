import { afterEach, expect, it, vi } from 'vitest';
import type { NkElement } from '../../src/core/element';
const motion = vi.hoisted(() => ({ animate: vi.fn() }));
vi.mock('../../src/core/motion', async (original) => ({
  ...await original<typeof import('../../src/core/motion')>(), animate: motion.animate,
}));
import '../../src/components/facets/facets';

afterEach(() => { document.body.replaceChildren(); sessionStorage.clear(); vi.restoreAllMocks(); motion.animate.mockClear(); });

it('keeps merchant columns when the shopper layout switcher is disabled', () => {
  sessionStorage.setItem('nk:grid-cols-desktop', '2');
  document.body.innerHTML = '<nk-facets data-layout-locked><ul class="product-grid" style="--nk-cols-desktop:5"></ul></nk-facets>';
  const root = document.querySelector('nk-facets') as NkElement;
  root.disconnectedCallback(); root.connectedCallback();
  expect(root.querySelector<HTMLElement>('.product-grid')!.style.getPropertyValue('--nk-cols-desktop')).toBe('5');
});

it('finishes scroll reveals before a layout change and animates visible card wrappers only', () => {
  document.body.innerHTML = `<nk-facets><button data-grid-cols-desktop="2">Two columns</button>
    <nk-stagger><ul class="product-grid">${Array.from({ length: 12 }, () => '<li data-stagger-item><div class="card__media"><img></div></li>').join('')}</ul></nk-stagger></nk-facets>`;
  const facets = document.querySelector('nk-facets') as NkElement;
  facets.disconnectedCallback(); facets.connectedCallback();
  const finish = vi.fn();
  document.querySelector('nk-stagger')!.addEventListener('nk:stagger:finish', finish);
  const items = [...document.querySelectorAll('li')];
  items.forEach((item, index) => vi.spyOn(item, 'getBoundingClientRect').mockReturnValue({ top: index === 11 ? 5000 : 100, bottom: index === 11 ? 5200 : 300 } as DOMRect));
  document.querySelector<HTMLButtonElement>('button')!.click();
  expect(finish).toHaveBeenCalledOnce();
  expect(motion.animate).toHaveBeenCalledTimes(11);
  for (const [target, , options] of motion.animate.mock.calls) {
    expect(target.tagName).toBe('LI');
    expect(options.delay).toBeLessThanOrEqual(180);
    expect(options.duration).toBeLessThan(400);
  }
});
