import { afterEach, describe, expect, it, vi } from 'vitest';
import { MissingFragmentError, replaceRegions } from '../../src/services/sections';
import { loadFor, registerLazy } from '../../src/core/lazy';

afterEach(() => document.body.replaceChildren());

describe('section rendering integration', () => {
  it('never partially changes attributes or HTML when a later region is missing', () => {
    document.body.innerHTML = '<section><div data-region="price" data-price="old">Old price</div><div data-region="buy">Old buy</div></section>';
    expect(() => replaceRegions(document.querySelector('section')!, '<div data-region="price" data-price="new">New price</div>', ['price', 'buy']))
      .toThrow(MissingFragmentError);
    expect(document.querySelector('[data-region="price"]')!.getAttribute('data-price')).toBe('old');
    expect(document.querySelector('[data-region="price"]')!.textContent).toBe('Old price');
  });

  it('hydrates the event root itself and starts the loader only once', async () => {
    const loader = vi.fn(async () => undefined);
    registerLazy('nk-lazy-fixture', loader);
    const root = document.createElement('nk-lazy-fixture');
    document.body.append(root);
    loadFor(root); loadFor(root);
    expect(loader).toHaveBeenCalledOnce();
  });
});
