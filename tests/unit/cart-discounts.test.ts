import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setConfigForTests } from '../../src/core/config';
import { NkCartDiscounts } from '../../src/components/cart/cart-discounts';
import { loadMemory, resetPromotionsForTests, saveMemory } from '../../src/services/discounts';

/**
 * Shopper-entered codes in <nk-cart-discounts>: Shopify's `applicable` verdict drives the message,
 * rejected codes are taken back off the cart, and no amount is ever calculated client-side.
 */

let codes: string[];
let updates: string[][];
const VALID = new Set(['WELCOME10', 'FREESHIP']);
let exclusive = false; // when true, WELCOME10 and AUTO20 can't combine (the existing code wins)

function verdicts(list: string[]): boolean[] {
  let taken = false;
  return list.map((code) => {
    if (!VALID.has(code) && code !== 'AUTO20') return false;
    if (exclusive && (code === 'WELCOME10' || code === 'AUTO20')) {
      if (taken) return false;
      taken = true;
    }
    return true;
  });
}

function cartJson() {
  const applicable = verdicts(codes);
  return {
    token: 'tok',
    note: null,
    item_count: 1,
    total_price: 1000,
    items: [{
      key: 'k1', id: 1, variant_id: 1, quantity: 1, properties: null,
      line_level_discount_allocations: codes.filter((code, index) => applicable[index] && code !== 'FREESHIP')
        .map((code) => ({ amount: 100, discount_application: { type: 'discount_code', title: code } })),
    }],
    discount_codes: codes.map((code, index) => ({ code, applicable: applicable[index]! })),
    cart_level_discount_applications: [],
  };
}

const flush = async () => {
  for (let index = 0; index < 20; index += 1) await new Promise((resolve) => setTimeout(resolve, 0));
};

function mountField(): HTMLElement {
  document.body.innerHTML = `
    <div data-cart-section="cart-drawer">
      <nk-cart-discounts>
        <ul data-discount-codes hidden></ul>
        <details data-discount-field hidden><summary>Discount code</summary>
          <input data-discount-input><button type="button" data-discount-apply>Apply</button>
        </details>
        <p data-discount-message hidden></p>
      </nk-cart-discounts>
    </div>`;
  return document.querySelector('nk-cart-discounts')!;
}

async function apply(code: string): Promise<string> {
  const element = document.querySelector('nk-cart-discounts')!;
  element.querySelector<HTMLInputElement>('[data-discount-input]')!.value = code;
  element.querySelector<HTMLButtonElement>('[data-discount-apply]')!.click();
  await flush();
  return document.querySelector('[data-discount-message]')!.textContent ?? '';
}

beforeEach(() => {
  if (!customElements.get('nk-cart-discounts')) customElements.define('nk-cart-discounts', NkCartDiscounts);
  resetPromotionsForTests();
  sessionStorage.clear();
  codes = [];
  updates = [];
  exclusive = false;
  setConfigForTests({
    routes: {
      root: '/', cart: '/cart', cartAdd: '/cart/add', cartChange: '/cart/change', cartUpdate: '/cart/update',
      predictiveSearch: '/search/suggest', productRecommendations: '/recommendations/products', search: '/search',
    },
    motion: 'standard',
    cart: { afterAdd: 'drawer', sections: [] },
    strings: {
      'promotions.applied': 'applied [code]',
      'promotions.applied_at_checkout': 'checkout [code]',
      'promotions.not_applicable': 'rejected [code]',
      'promotions.replaced_automatic': 'replaced [code]',
      'promotions.empty': 'empty',
    },
  });
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes('/cart/update.js')) {
      const body = JSON.parse(String(init?.body)) as { discount: string };
      codes = body.discount ? body.discount.split(',') : [];
      updates.push([...codes]);
      return new Response(JSON.stringify({ ...cartJson(), sections: {} }), { headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify(cartJson()), { headers: { 'Content-Type': 'application/json' } });
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  setConfigForTests(null);
});

describe('<nk-cart-discounts>', () => {
  it('ignores repeated Enter and removal while a code transaction is pending', async () => {
    const element = mountField();
    const input = element.querySelector<HTMLInputElement>('[data-discount-input]')!;
    input.value = 'WELCOME10';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await flush();
    expect(updates).toEqual([['WELCOME10']]);
  });
  it('reveals the field only when enhanced (no-JS carts never post a discount field)', async () => {
    const element = mountField();
    await flush();
    expect(element.querySelector('[data-discount-field]')!.hasAttribute('hidden')).toBe(false);
    expect(element.querySelector('input')!.hasAttribute('name')).toBe(false);
  });

  it('applies a valid code and reports it from Shopify allocations', async () => {
    mountField();
    expect(await apply(' welcome10 ')).toBe('applied WELCOME10');
    expect(codes).toEqual(['WELCOME10']);
  });

  it('explains instead of inventing savings when a code has no cart allocation (e.g. shipping)', async () => {
    mountField();
    expect(await apply('FREESHIP')).toBe('checkout FREESHIP');
  });

  it('rejects an invalid or expired code and restores the previous codes exactly', async () => {
    codes = ['WELCOME10'];
    mountField();
    expect(await apply('NOPE')).toBe('rejected NOPE');
    expect(codes).toEqual(['WELCOME10']);
    expect(updates).toEqual([['WELCOME10', 'NOPE'], ['WELCOME10']]);
  });

  it('gives a shopper code precedence over an automatic code it cannot combine with', async () => {
    exclusive = true;
    codes = ['AUTO20'];
    saveMemory('tok', { auto: ['AUTO20'], tried: [], declined: [] });
    mountField();
    expect(await apply('WELCOME10')).toBe('replaced WELCOME10');
    expect(codes).toEqual(['WELCOME10']);
    expect(loadMemory('tok').declined).toContain('AUTO20');
  });

  it('asks for a code when the field is empty, without a request', async () => {
    mountField();
    expect(await apply('   ')).toBe('empty');
    expect(updates).toEqual([]);
  });
});
