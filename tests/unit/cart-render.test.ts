import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installCartRenderer } from '../../src/services/cart-render';

installCartRenderer();
const html = (text: string) => `<form data-cart-section="drawer"><span>${text}</span><button name="checkout">Checkout</button></form>`;
const update = (sections: Record<string, string | null>) => document.dispatchEvent(new CustomEvent('nk:cart:updated', {
  detail: { cart: { item_count: 2 }, sections, kind: 'change' },
}));
const response = (sections: Record<string, string | null>) => new Response(JSON.stringify(sections));

beforeEach(() => {
  document.body.innerHTML = `<nk-cart-items><p data-cart-render-error hidden></p>${html('initial')}</nk-cart-items><span data-cart-count>0</span>`;
});
afterEach(() => { document.body.replaceChildren(); vi.unstubAllGlobals(); });

describe('cart section recovery', () => {
  it('recovers omitted section keys using a GET and restores checkout', async () => {
    const fetch = vi.fn(async (_url: RequestInfo | URL) => response({ drawer: html('recovered') }));
    vi.stubGlobal('fetch', fetch);
    update({});
    expect(document.querySelector<HTMLButtonElement>('button')!.disabled).toBe(true);
    await vi.waitFor(() => expect(document.querySelector('form')!.textContent).toContain('recovered'));
    expect(fetch).toHaveBeenCalledOnce();
    expect(String(fetch.mock.calls[0]?.[0])).toContain('sections=drawer');
    expect(document.querySelector<HTMLButtonElement>('button')!.disabled).toBe(false);
    expect(document.querySelector('[data-cart-count]')!.textContent).toBe('2');
  });

  it('ignores a slow recovery after a newer mutation renders successfully', async () => {
    let finish!: (value: Response) => void;
    vi.stubGlobal('fetch', () => new Promise<Response>((resolve) => { finish = resolve; }));
    update({ drawer: null });
    update({ drawer: html('newest') });
    finish(response({ drawer: html('stale') }));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(document.querySelector('form')!.textContent).toContain('newest');
    expect(document.querySelector<HTMLButtonElement>('button')!.disabled).toBe(false);
  });

  it('keeps checkout blocked and exposes a fallback when recovery also omits the fragment', async () => {
    vi.stubGlobal('fetch', async () => response({}));
    const failed = vi.fn();
    document.addEventListener('nk:cart:render-failed', failed, { once: true });
    update({});
    await vi.waitFor(() => expect(failed).toHaveBeenCalledOnce());
    expect(document.querySelector<HTMLButtonElement>('button')!.disabled).toBe(true);
    expect(document.querySelector<HTMLElement>('[data-cart-render-error]')!.hidden).toBe(false);
  });

  it('recovers only failed regions when the cart page and drawer coexist', async () => {
    document.body.insertAdjacentHTML('beforeend', '<nk-cart-items><form data-cart-section="page"><span>old page</span><button name="checkout">Checkout</button></form></nk-cart-items>');
    vi.stubGlobal('fetch', async () => response({ drawer: html('recovered drawer') }));
    update({ page: '<form data-cart-section="page"><span>current page</span><button name="checkout">Checkout</button></form>', drawer: null });
    await vi.waitFor(() => expect(document.querySelector('[data-cart-section="drawer"]')!.textContent).toContain('recovered drawer'));
    expect(document.querySelector('[data-cart-section="page"]')!.textContent).toContain('current page');
    expect(document.querySelector('[data-cart-stale]')).toBeNull();
    expect([...document.querySelectorAll<HTMLButtonElement>('button')].every((button) => !button.disabled)).toBe(true);
  });
});
