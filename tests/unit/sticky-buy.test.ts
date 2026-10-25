import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { config, setConfigForTests } from '../../src/core/config';
import { define } from '../../src/core/define';
import type { NkElement } from '../../src/core/element';
import { NkProductForm } from '../../src/components/product/product-form';
import { NkStickyBuy } from '../../src/components/product/sticky-buy';
import { NkVariantPicker } from '../../src/components/product/variant-picker';
import { cart, type CartResult } from '../../src/services/cart';

define('nk-variant-picker', NkVariantPicker);
define('nk-product-form', NkProductForm);
define('nk-sticky-buy', NkStickyBuy);

const pill = (size: string, selected: string) =>
  `<div data-size-pill="${size}"><input type="radio" name="size" value="${size}" data-option-value-id="${size}" ${size === selected ? 'checked' : ''}></div>`;

const section = (selected = 'S', id = '101', preselected = true) => `<section data-product-section>
  <nk-variant-picker data-region="picker" data-section-id="main" data-product-url="/products/shirt" ${preselected ? 'data-preselected' : ''}>
    <fieldset data-option-position="1" data-option-name="Size" data-size-fieldset>${pill('S', selected)}${pill('M', selected)}</fieldset>
  </nk-variant-picker>
  <nk-product-form><form><input type="hidden" name="quantity" value="1">
    <div data-region="buy" data-availability="available" data-variant-title="${selected}" data-variant-price="Tk 1,900">
      <input type="hidden" name="id" value="${id}">
      <button type="submit"><span data-button-label>Add to cart</span></button>
    </div>
  </form><p data-form-error hidden></p></nk-product-form>
  <nk-sticky-buy hidden><span data-sticky-variant></span><span data-sticky-price></span>
    <button type="button" data-sticky-cta><span data-sticky-label>Add to cart</span></button></nk-sticky-buy>
</section>`;

function mount(html: string): void {
  document.body.innerHTML = html;
  for (const el of document.querySelectorAll<NkElement>('nk-variant-picker, nk-product-form, nk-sticky-buy')) {
    el.disconnectedCallback();
    el.connectedCallback();
  }
}

function choose(size: string): void {
  const input = document.querySelector<HTMLInputElement>(`input[value="${size}"]`)!;
  input.checked = true;
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

const response = (html: string) => new Response(html, { headers: { 'Content-Type': 'text/html' } });

beforeEach(() => {
  setConfigForTests({
    ...config(),
    motion: 'off',
    strings: {
      'product.add_to_cart': 'Add to cart',
      'product.updating': 'Updating…',
      'product.adding': 'Adding…',
      'product.choose_named_option': 'Choose a [option]',
    },
  });
});

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  setConfigForTests(null);
});

describe('sticky add to cart bar', () => {
  it('never adds before a size is chosen', () => {
    mount(section('', '101', false));
    const add = vi.spyOn(cart, 'add');
    const label = document.querySelector<HTMLElement>('[data-sticky-label]')!;
    expect(label.textContent).toBe('Choose a Size');
    document.querySelector<HTMLButtonElement>('[data-sticky-cta]')!.click();
    expect(add).not.toHaveBeenCalled();
  });

  it('stays pressable while a size resolves and adds the resolved variant', async () => {
    mount(section());
    let finish!: (value: Response) => void;
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((resolve) => { finish = resolve; })));
    let release!: (value: CartResult) => void;
    const add = vi.spyOn(cart, 'add').mockImplementation(() => new Promise((resolve) => { release = resolve; }));
    choose('M');
    const cta = document.querySelector<HTMLButtonElement>('[data-sticky-cta]')!;
    const label = document.querySelector<HTMLElement>('[data-sticky-label]')!;
    expect(cta.disabled).toBe(false);
    expect(label.textContent).toBe('Updating…');
    cta.click();
    finish(response(section('M', '102')));
    await vi.waitFor(() => expect(add).toHaveBeenCalledExactlyOnceWith([{ id: 102, quantity: 1 }], expect.any(String)));
    await vi.waitFor(() => expect(label.textContent).toBe('Adding…'));
    release({} as CartResult);
    await vi.waitFor(() => expect(label.textContent).toBe('Add to cart'));
    expect(document.querySelector('[data-sticky-variant]')!.textContent).toBe('M');
  });

  it('stays out of the quick add dialog', () => {
    mount(`<dialog open>${section()}</dialog>`);
    const add = vi.spyOn(cart, 'add');
    document.querySelector<HTMLButtonElement>('[data-sticky-cta]')!.click();
    expect(add).not.toHaveBeenCalled();
    expect(document.querySelector('nk-sticky-buy')!.hasAttribute('hidden')).toBe(true);
  });
});
