import { afterEach, expect, it, vi } from 'vitest';
import '../../src/components/facets/facets';
import type { NkElement } from '../../src/core/element';

function mount() {
 document.body.innerHTML = `<nk-facets data-section-id="collection"><form data-facets-form action="/collections/all">
 <input name="filter.v.availability" value="1" type="hidden"><select data-facets-sort name="sort_by"><option value="manual">Featured</option><option value="price-ascending">Price, low to high</option></select>
 <details data-sort-menu open><summary data-focus-key="facets-sort-menu">Sort by</summary><button type="button" data-facets-sort-value="manual">Featured</button><button type="button" data-facets-sort-value="price-ascending">Price, low to high</button></details>
 </form><div data-results-label>34 products</div></nk-facets><button data-outside>Outside</button>`;
 const element=document.querySelector<NkElement>('nk-facets')!; element.disconnectedCallback();element.connectedCallback();
}
afterEach(()=>{document.body.replaceChildren();vi.unstubAllGlobals();});
it('applies custom sort while preserving Shopify filters and returns to its trigger',async()=>{
 mount();
 const fetch=vi.fn(async(url: string)=>{
  expect(url).toContain('sort_by=price-ascending');expect(url).toContain('filter.v.availability=1');
  return new Response('<nk-facets><details data-sort-menu><summary data-focus-key="facets-sort-menu">Price, low to high</summary></details><div data-results-label>19 products</div></nk-facets>');
 });vi.stubGlobal('fetch',fetch);
 document.querySelector<HTMLButtonElement>('[data-facets-sort-value="price-ascending"]')!.click();
 expect(document.querySelector<HTMLDetailsElement>('details')!.open).toBe(false);
 await vi.waitFor(()=>expect(document.querySelector('[data-results-label]')!.textContent).toBe('19 products'));
 expect(document.activeElement?.getAttribute('data-focus-key')).toBe('facets-sort-menu');
});
it('supports keyboard navigation, Escape and outside dismissal',()=>{
 mount();const menu=document.querySelector<HTMLDetailsElement>('details')!;const summary=menu.querySelector('summary')!;
 summary.focus();summary.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));
 expect(document.activeElement?.textContent).toBe('Featured');
 document.activeElement!.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));expect(menu.open).toBe(false);expect(document.activeElement).toBe(summary);
 menu.open=true;document.querySelector('[data-outside]')!.dispatchEvent(new Event('pointerdown',{bubbles:true}));expect(menu.open).toBe(false);
});
