import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setConfigForTests } from '../../src/core/config';
import { CartError, CartService, type Cart } from '../../src/services/cart';

/**
 * Cart queue behaviour (master-plan/09 failure matrix). fetch is replaced by a scripted fake
 * that records request order and can delay, fail or time out individual calls.
 */
type Handler = (url: string, body: Record<string, unknown> | null) => Promise<Response> | Response;

const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });

function cartWith(lines: Array<{ key: string; variant_id: number; quantity: number; properties?: Record<string, string> }>): Cart {
  return {
    token: 't',
    note: null,
    total_price: 0,
    item_count: lines.reduce((sum, line) => sum + line.quantity, 0),
    items: lines.map((line) => ({ id: line.variant_id, properties: null, ...line })),
  };
}

let calls: Array<{ url: string; body: Record<string, unknown> | null }>;

function installFetch(handler: Handler): void {
  calls = [];
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : null;
    calls.push({ url, body });
    return handler(url, body);
  });
}

beforeEach(() => {
  setConfigForTests({
    routes: {
      root: '/',
      cart: '/cart',
      cartAdd: '/cart/add',
      cartChange: '/cart/change',
      cartUpdate: '/cart/update',
      predictiveSearch: '/search/suggest',
      productRecommendations: '/recommendations/products',
      search: '/search',
    },
    motion: 'standard',
    cart: { afterAdd: 'drawer', sections: [] },
    strings: {},
  });
  document.body.innerHTML = '<div data-cart-section="cart-drawer"></div>';
});

afterEach(() => {
  vi.unstubAllGlobals();
  setConfigForTests(null);
});

describe('CartService queue', () => {
  it('serializes mutations in the order they were requested', async () => {
    let state = cartWith([{ key: 'a:1', variant_id: 1, quantity: 1 }]);
    installFetch(async (url, body) => {
      if (url.startsWith('/cart.js')) return json(state);
      if (url.startsWith('/cart/change.js')) {
        await new Promise((resolve) => setTimeout(resolve, body?.quantity === 2 ? 30 : 1));
        state = cartWith([{ key: 'a:1', variant_id: 1, quantity: Number(body?.quantity) }]);
        return json({ ...state, sections: { 'cart-drawer': '<div data-cart-section="cart-drawer"></div>' } });
      }
      throw new Error(`unexpected ${url}`);
    });
    const service = new CartService();
    const first = service.change('a:1', 2, 'test');
    await new Promise((resolve) => setTimeout(resolve, 0)); // let the first request go out
    const second = service.change('a:1', 5, 'test');
    const results = await Promise.all([first, second]);
    expect(results.map((r) => r.cart.items[0]!.quantity)).toEqual([2, 5]);
    const changeBodies = calls.filter((c) => c.url.startsWith('/cart/change.js')).map((c) => c.body?.quantity);
    expect(changeBodies).toEqual([2, 5]);
  });

  it('coalesces queued quantity changes for the same line to the latest value', async () => {
    let state = cartWith([
      { key: 'a:1', variant_id: 1, quantity: 1 },
      { key: 'b:2', variant_id: 2, quantity: 1 },
    ]);
    installFetch(async (url, body) => {
      if (url.startsWith('/cart.js')) return json(state);
      if (url.startsWith('/cart/change.js')) {
        await new Promise((resolve) => setTimeout(resolve, 5));
        state = cartWith(
          state.items.map((line) => ({ key: line.key, variant_id: line.variant_id, quantity: line.key === body?.id ? Number(body?.quantity) : line.quantity })),
        );
        return json({ ...state, sections: {} });
      }
      throw new Error(`unexpected ${url}`);
    });
    const service = new CartService();
    const inFlight = service.change('b:2', 4, 'test'); // occupies the queue
    await new Promise((resolve) => setTimeout(resolve, 0));
    const taps = [service.change('a:1', 2, 'test'), service.change('a:1', 3, 'test'), service.change('a:1', 4, 'test')];
    await Promise.all([inFlight, ...taps]);
    const forA = calls.filter((c) => c.url.startsWith('/cart/change.js') && c.body?.id === 'a:1');
    expect(forA).toHaveLength(1);
    expect(forA[0]!.body?.quantity).toBe(4);
    const resolved = await taps[0]!;
    expect(resolved.cart.items.find((l) => l.key === 'a:1')!.quantity).toBe(4);
  });

  it('refuses to change a line that no longer exists instead of guessing', async () => {
    installFetch((url) => {
      if (url.startsWith('/cart.js')) return json(cartWith([{ key: 'other:9', variant_id: 9, quantity: 1 }]));
      throw new Error(`unexpected ${url}`);
    });
    const service = new CartService();
    await expect(service.change('gone:1', 0, 'test')).rejects.toMatchObject({ kind: 'line-missing' });
    expect(calls.some((c) => c.url.startsWith('/cart/change.js'))).toBe(false);
  });
});

describe('CartService add outcomes', () => {
  it('reports a rejected add (422) without re-sending', async () => {
    installFetch((url) => {
      if (url.startsWith('/cart.js')) return json(cartWith([]));
      if (url.startsWith('/cart/add.js')) return json({ status: 422, description: 'Only 1 left' }, 422);
      throw new Error(`unexpected ${url}`);
    });
    const service = new CartService();
    const error = await service.add([{ id: 7, quantity: 2 }], 'test').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(CartError);
    expect((error as CartError).kind).toBe('rejected');
    expect((error as CartError).message).toBe('Only 1 left');
    expect(calls.filter((c) => c.url.startsWith('/cart/add.js'))).toHaveLength(1);
  });

  it('reconciles an ambiguous add that actually succeeded — and never re-sends it', async () => {
    let addCalls = 0;
    installFetch((url) => {
      if (url.startsWith('/cart.js')) {
        // Before: empty. After: the server did apply the add.
        return json(addCalls === 0 ? cartWith([]) : cartWith([{ key: 'k:7', variant_id: 7, quantity: 1 }]));
      }
      if (url.startsWith('/cart/add.js')) {
        addCalls++;
        throw new TypeError('network connection lost');
      }
      if (url.includes('sections=')) return json({ 'cart-drawer': '<div data-cart-section="cart-drawer"></div>' });
      throw new Error(`unexpected ${url}`);
    });
    const service = new CartService();
    const result = await service.add([{ id: 7, quantity: 1 }], 'test');
    expect(result.reconciled).toBe(true);
    expect(result.cart.item_count).toBe(1);
    expect(addCalls).toBe(1);
  });

  it('reconciles an ambiguous add that did not happen as not-applied', async () => {
    installFetch((url) => {
      if (url.startsWith('/cart.js')) return json(cartWith([]));
      if (url.startsWith('/cart/add.js')) throw new TypeError('offline');
      throw new Error(`unexpected ${url}`);
    });
    const service = new CartService();
    await expect(service.add([{ id: 7, quantity: 1 }], 'test')).rejects.toMatchObject({ kind: 'not-applied' });
    expect(calls.filter((c) => c.url.startsWith('/cart/add.js'))).toHaveLength(1);
  });

  it('treats lines with different properties as different lines when reconciling', async () => {
    let added = false;
    installFetch((url) => {
      if (url.startsWith('/cart.js')) {
        const base = { key: 'k:1', variant_id: 7, quantity: 1, properties: { Engraving: 'A' } };
        return json(added ? cartWith([base, { key: 'k:2', variant_id: 7, quantity: 1, properties: { Engraving: 'B' } }]) : cartWith([base]));
      }
      if (url.startsWith('/cart/add.js')) {
        added = true;
        throw new TypeError('lost');
      }
      if (url.includes('sections=')) return json({});
      throw new Error(`unexpected ${url}`);
    });
    const service = new CartService();
    const result = await service.add([{ id: 7, quantity: 1, properties: { Engraving: 'B' } }], 'test');
    expect(result.reconciled).toBe(true);
  });
});
