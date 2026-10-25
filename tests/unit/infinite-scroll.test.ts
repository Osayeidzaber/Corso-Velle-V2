import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { NkElement } from '../../src/core/element';
import { setConfigForTests, config } from '../../src/core/config';
import '../../src/components/facets/infinite-scroll';

function mount(): NkElement {
  document.body.innerHTML = `<div data-facets-results><ul class="product-grid"><li><article data-product-url="/products/a"></article></li></ul>
    <nk-infinite-scroll data-mode="button" data-section-id="main">
      <a data-infinite-next href="?page=2">More</a><p data-infinite-status></p>
      <div data-infinite-fallback><a href="?page=2">Page 2</a></div>
    </nk-infinite-scroll></div>`;
  const root = document.querySelector<NkElement>('nk-infinite-scroll')!;
  root.disconnectedCallback(); root.connectedCallback();
  return root;
}
const incoming = '<ul class="product-grid"><li><article data-product-url="/products/b"></article></li></ul><nk-infinite-scroll></nk-infinite-scroll>';

beforeEach(() => { setConfigForTests({ ...config(), motion: 'off' }); sessionStorage.clear(); });
afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); vi.unstubAllGlobals(); setConfigForTests(null); });

it('restores real pagination when the section request fails', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
  const root = mount();
  root.querySelector<HTMLAnchorElement>('[data-infinite-next]')!.click();
  await vi.waitFor(() => expect(root.hasAttribute('aria-busy')).toBe(false));
  expect(root.querySelector<HTMLElement>('[data-infinite-fallback]')!.hidden).toBe(false);
});

it('does not append a previous connection response after editor removal and reinsertion', async () => {
  let finish!: (response: Response) => void;
  vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(resolve => { finish = resolve; })));
  const root = mount();
  root.querySelector<HTMLAnchorElement>('[data-infinite-next]')!.click();
  root.remove();
  document.querySelector('[data-facets-results]')!.append(root);
  finish(new Response(incoming));
  await new Promise(resolve => setTimeout(resolve, 20));
  expect(document.querySelectorAll('.product-grid > li')).toHaveLength(1);
});

it('keeps the next page available after an invalid section response', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<h1>Unexpected response</h1>')));
  const root = mount();
  root.querySelector<HTMLAnchorElement>('[data-infinite-next]')!.click();
  await vi.waitFor(() => expect(root.hasAttribute('aria-busy')).toBe(false));
  expect(root.querySelector('[data-infinite-next]')).not.toBeNull();
  expect(root.querySelector<HTMLElement>('[data-infinite-fallback]')!.hidden).toBe(false);
});

it('appends valid new products and removes the exhausted next link', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(incoming)));
  const root = mount();
  root.querySelector<HTMLAnchorElement>('[data-infinite-next]')!.click();
  await vi.waitFor(() => expect(document.querySelectorAll('.product-grid > li')).toHaveLength(2));
  expect(root.querySelector('[data-infinite-next]')).toBeNull();
});
