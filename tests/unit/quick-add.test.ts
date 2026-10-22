import { afterEach, expect, it, vi } from 'vitest';
import { openQuickAdd } from '../../src/components/product/quick-add';
import { overlay } from '../../src/services/overlay';

afterEach(() => { overlay.closeAll(); document.body.replaceChildren(); vi.unstubAllGlobals(); });
function trigger() { const link=document.createElement('a');link.href='/products/fixture';link.textContent='Choose options';document.body.append(link);return link; }
it('loads the real product form with isolated IDs, leaves collection history intact and closes on confirmed add',async()=>{
 const before=location.href;
 vi.stubGlobal('fetch',vi.fn(async()=>new Response(`<section data-product-section><h1>Fixture</h1><nk-variant-picker data-region="picker" data-section-id="actual-section" data-product-url="/products/fixture"><fieldset data-option-position="1" data-option-name="Size" data-size-fieldset><input id="size-m" type="radio" name="Size" value="M" data-option-value-id="17" checked><label for="size-m">M</label></fieldset></nk-variant-picker><nk-product-form data-source-id="actual-section"><form id="product-form"><div data-region="buy" data-availability="available"><input name="id" value="123"><button type="submit"><span data-button-label>Add</span></button></div></form></nk-product-form></section>`)));
 await openQuickAdd('/products/fixture',trigger());
 const dialog=document.querySelector<HTMLDialogElement>('[data-quick-add-dialog]')!;
 expect(dialog.open).toBe(true);
 expect(location.href).toBe(before);
 const input=dialog.querySelector<HTMLInputElement>('input[type="radio"]')!;
 expect(input.name).toMatch(/^QuickAdd-/);
 expect(dialog.querySelector('label')!.htmlFor).toBe(input.id);
 expect(dialog.querySelector('nk-variant-picker')!.getAttribute('data-section-id')).toBe('actual-section');
 document.dispatchEvent(new CustomEvent('nk:cart:updated',{detail:{kind:'add',sourceId:'actual-section'}}));
 expect(document.querySelector('[data-quick-add-dialog]')).toBeNull();
 expect(document.documentElement.classList.contains('nk-locked')).toBe(false);
});
it('keeps a normal product link and honest error when product loading fails',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>{throw new Error('offline');}));
 await openQuickAdd('/products/fixture',trigger());
 const dialog=document.querySelector<HTMLDialogElement>('[data-quick-add-dialog]')!;
 expect(dialog.querySelector('a')!.getAttribute('href')).toBe('/products/fixture');
 expect(dialog.querySelector('[role="alert"]')).not.toBeNull();
});
