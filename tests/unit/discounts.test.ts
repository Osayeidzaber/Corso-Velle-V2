import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setConfigForTests } from '../../src/core/config';
import type { Cart, CartDiscountCode } from '../../src/services/cart';
import {
  cartSignature,
  holdPromotions,
  judgeAttempt,
  loadMemory,
  markManual,
  nextStep,
  readPromotions,
  reconcilePromotions,
  resetPromotionsForTests,
  waitForPromotions,
} from '../../src/services/discounts';

/**
 * Promotion codes (docs/PROMOTIONS.md). A fake Shopify cart decides `applicable` per code with a
 * scenario-specific rule, standing in for Shopify admin's real eligibility and combination
 * settings; the service must only ever react to that verdict.
 */

type Rule = (codes: string[], lines: Line[]) => boolean[];
interface Line { variant_id: number; quantity: number }

let lines: Line[];
let codes: string[];
let rule: Rule;
let updates: string[][];

const VALID = new Set(['TEE20', 'SUMMER10', 'STORE5', 'MANUAL15']);
/** Default rule: valid codes apply; TEE20 needs 2+ units; SUMMER10 and TEE20 don't combine (first wins). */
const shopifyLike: Rule = (list, cartLines) => {
  const units = cartLines.reduce((sum, line) => sum + line.quantity, 0);
  let exclusiveTaken = false;
  return list.map((code) => {
    if (!VALID.has(code) || (code === 'TEE20' && units < 2)) return false;
    if (code === 'TEE20' || code === 'SUMMER10') {
      if (exclusiveTaken) return false;
      exclusiveTaken = true;
    }
    return true;
  });
};

function cartJson(): Cart {
  const verdicts = rule(codes, lines);
  return {
    token: 'tok?key=1',
    note: null,
    item_count: lines.reduce((sum, line) => sum + line.quantity, 0),
    total_price: 0,
    items: lines.map((line, index) => ({ key: `k${index}`, id: line.variant_id, properties: null, ...line })),
    discount_codes: codes.map((code, index) => ({ code, applicable: verdicts[index]! })),
    cart_level_discount_applications: [],
  };
}

function renderPromotions(promos: Array<{ code: string; priority: number }>): void {
  const signature = lines.map((line) => `${line.variant_id}:${line.quantity},`).join('');
  document.body.innerHTML = `<div data-cart-section="cart-drawer"><script type="application/json" data-cart-promotions>${JSON.stringify({ signature, codes: promos })}</script></div>`;
}

beforeEach(() => {
  resetPromotionsForTests();
  sessionStorage.clear();
  setConfigForTests({
    routes: {
      root: '/', cart: '/cart', cartAdd: '/cart/add', cartChange: '/cart/change', cartUpdate: '/cart/update',
      predictiveSearch: '/search/suggest', productRecommendations: '/recommendations/products', search: '/search',
    },
    motion: 'standard',
    cart: { afterAdd: 'drawer', sections: [] },
    promotions: { conflictRule: 'keep' },
    strings: {},
  });
  lines = [{ variant_id: 1, quantity: 2 }];
  codes = [];
  rule = shopifyLike;
  updates = [];
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes('/cart/update.js')) {
      const body = JSON.parse(String(init?.body)) as { discount: string };
      codes = body.discount ? body.discount.split(',') : [];
      updates.push([...codes]);
      return new Response(JSON.stringify({ ...cartJson(), sections: {} }), { headers: { 'Content-Type': 'application/json' } });
    }
    if (url.includes('/cart.js')) return new Response(JSON.stringify(cartJson()), { headers: { 'Content-Type': 'application/json' } });
    return new Response('{}', { headers: { 'Content-Type': 'application/json' } });
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  setConfigForTests(null);
});

describe('readPromotions', () => {
  it('dedupes codes case-insensitively, keeps the highest priority and skips malformed entries', () => {
    document.body.innerHTML = `<script type="application/json" data-cart-promotions>{"signature":"1:2,","codes":[{"code":"tee20","priority":3},{"code":"TEE20 ","priority":7},{"code":"A,B","priority":9},{"code":"","priority":1}]}</script>`;
    expect(readPromotions()).toEqual({ signature: '1:2,', codes: [{ code: 'TEE20', priority: 7 }] });
  });

  it('matches the Liquid signature format', () => {
    expect(cartSignature({ items: [{ variant_id: 5, quantity: 2 }, { variant_id: 9, quantity: 1 }] as Cart['items'] })).toBe('5:2,9:1,');
  });
});

describe('planning and judging (pure)', () => {
  const memory = { auto: [] as string[], tried: [] as string[], declined: [] as string[] };

  it('tries the highest-priority missing code first and never re-sends present codes', () => {
    const step = nextStep({ current: [{ code: 'STORE5', applicable: true }], promotions: [{ code: 'SUMMER10', priority: 3 }, { code: 'TEE20', priority: 8 }, { code: 'STORE5', priority: 9 }], memory, signature: 's' });
    expect(step).toEqual({ type: 'try', codes: ['STORE5', 'TEE20'], candidate: 'TEE20' });
  });

  it('a displaced shopper code always wins, whatever the rule', () => {
    const before: CartDiscountCode[] = [{ code: 'MANUAL15', applicable: true }];
    const after: CartDiscountCode[] = [{ code: 'MANUAL15', applicable: false }, { code: 'TEE20', applicable: true }];
    const verdict = judgeAttempt({ before, after, candidate: 'TEE20', auto: [], priorities: new Map([['TEE20', 10]]), rule: 'priority' });
    expect(verdict).toMatchObject({ outcome: 'kept-existing', codes: ['MANUAL15'] });
  });
});

describe('reconcilePromotions against Shopify verdicts', () => {
  it('lets an in-flight automatic attempt finish before a held shopper transaction reads codes', async () => {
    renderPromotions([{ code: 'TEE20', priority: 5 }]);
    const normalFetch = fetch;
    let finish!: () => void;
    vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).includes('/cart/update.js')) await new Promise<void>(resolve => { finish = resolve; });
      return normalFetch(input, init);
    });
    const running = reconcilePromotions();
    await vi.waitFor(() => expect(finish).toBeTypeOf('function'));
    const release = holdPromotions();
    let idle = false;
    const waiting = waitForPromotions().then(() => { idle = true; });
    await Promise.resolve();
    expect(idle).toBe(false);
    finish();
    await running;
    await waiting;
    expect(codes).toEqual(['TEE20']);
    expect(idle).toBe(true);
    release();
  });
  it('applies an eligible code once and makes no further requests (no double application)', async () => {
    renderPromotions([{ code: 'TEE20', priority: 5 }]);
    await reconcilePromotions();
    expect(codes).toEqual(['TEE20']);
    expect(loadMemory('tok').auto).toEqual(['TEE20']);
    const before = updates.length;
    await reconcilePromotions();
    await reconcilePromotions();
    expect(updates.length).toBe(before);
  });

  it('removes a code Shopify rejects and only retries it when the cart changes', async () => {
    lines = [{ variant_id: 1, quantity: 1 }]; // TEE20 needs two units
    renderPromotions([{ code: 'TEE20', priority: 5 }]);
    await reconcilePromotions();
    expect(updates).toEqual([['TEE20'], []]);
    expect(codes).toEqual([]);

    await reconcilePromotions();
    expect(updates).toHaveLength(2); // same cart: not retried

    lines = [{ variant_id: 1, quantity: 2 }];
    renderPromotions([{ code: 'TEE20', priority: 5 }]);
    await reconcilePromotions();
    expect(codes).toEqual(['TEE20']);
  });

  it('expired or unknown codes are never left on the cart', async () => {
    renderPromotions([{ code: 'EXPIRED30', priority: 5 }]);
    await reconcilePromotions();
    expect(codes).toEqual([]);
    expect(updates).toEqual([['EXPIRED30'], []]);
  });

  it('combines codes Shopify allows together', async () => {
    renderPromotions([{ code: 'TEE20', priority: 5 }, { code: 'STORE5', priority: 1 }]);
    await reconcilePromotions();
    expect(codes).toEqual(['TEE20', 'STORE5']);
  });

  it("keeps the code already applied when a new one can't combine ('keep' rule)", async () => {
    // Shopify picks the newest code here, so adding SUMMER10 displaces TEE20.
    rule = (list, cartLines) => {
      const verdicts = shopifyLike([...list].reverse(), cartLines).reverse();
      return verdicts;
    };
    renderPromotions([{ code: 'TEE20', priority: 5 }]);
    await reconcilePromotions();
    expect(codes).toEqual(['TEE20']);

    lines = [...lines, { variant_id: 2, quantity: 1 }];
    renderPromotions([{ code: 'TEE20', priority: 5 }, { code: 'SUMMER10', priority: 8 }]);
    await reconcilePromotions();
    expect(codes).toEqual(['TEE20']);
    expect(updates.at(-2)).toEqual(['TEE20', 'SUMMER10']);
    // No flip-flopping on later cart events.
    const count = updates.length;
    await reconcilePromotions();
    expect(updates.length).toBe(count);
  });

  it("switches to the higher-priority code under the 'priority' rule", async () => {
    setConfigForTests({
      routes: { root: '/', cart: '/cart', cartAdd: '/cart/add', cartChange: '/cart/change', cartUpdate: '/cart/update', predictiveSearch: '/s', productRecommendations: '/r', search: '/search' },
      motion: 'standard', cart: { afterAdd: 'drawer', sections: [] }, promotions: { conflictRule: 'priority' }, strings: {},
    });
    rule = (list, cartLines) => shopifyLike([...list].reverse(), cartLines).reverse();
    renderPromotions([{ code: 'TEE20', priority: 5 }]);
    await reconcilePromotions();
    lines = [...lines, { variant_id: 2, quantity: 1 }];
    renderPromotions([{ code: 'TEE20', priority: 5 }, { code: 'SUMMER10', priority: 8 }]);
    await reconcilePromotions();
    expect(codes).toEqual(['SUMMER10']);
    expect(loadMemory('tok').auto).toEqual(['SUMMER10']);
  });

  it('removes an automatic code when its product leaves the cart', async () => {
    renderPromotions([{ code: 'TEE20', priority: 5 }]);
    await reconcilePromotions();
    lines = [{ variant_id: 3, quantity: 2 }];
    renderPromotions([]);
    await reconcilePromotions();
    expect(codes).toEqual([]);
  });

  it('never removes or displaces a code the shopper entered', async () => {
    codes = ['MANUAL15', 'BOGUS'];
    renderPromotions([]);
    await reconcilePromotions();
    expect(updates).toEqual([]);
    expect(codes).toEqual(['MANUAL15', 'BOGUS']);
  });

  it('does not re-add an automatic code the shopper removed', async () => {
    renderPromotions([{ code: 'TEE20', priority: 5 }]);
    markManual('tok', [], ['TEE20']);
    await reconcilePromotions();
    expect(updates).toEqual([]);
  });

  it('waits when the rendered cart section is older than the cart', async () => {
    renderPromotions([{ code: 'TEE20', priority: 5 }]);
    lines = [{ variant_id: 1, quantity: 3 }];
    await reconcilePromotions();
    expect(updates).toEqual([]);
  });
});
