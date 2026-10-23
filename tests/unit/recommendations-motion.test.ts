import { afterEach, expect, it, vi } from 'vitest';
const request = vi.hoisted(() => ({ fetchText: vi.fn() }));
vi.mock('../../src/services/request', () => request);
import '../../src/components/recommendations/recommendations';
import type { NkElement } from '../../src/core/element';

afterEach(() => { document.body.replaceChildren(); vi.unstubAllGlobals(); request.fetchText.mockReset(); });

it.each([true, false])('handles an empty response independently with show-empty=%s', async (show) => {
  let callback!: IntersectionObserverCallback;
  vi.stubGlobal('IntersectionObserver', class {
    constructor(cb: IntersectionObserverCallback) { callback = cb; }
    observe() {} disconnect() {}
  });
  request.fetchText.mockResolvedValue('<nk-recommendations><p>No recommendations yet</p></nk-recommendations>');
  const wrapper = document.createElement('section'); wrapper.className = 'shopify-section';
  const element = document.createElement('nk-recommendations'); element.setAttribute('url', '/recommendations');
  if (show) element.setAttribute('show-empty', '');
  wrapper.append(element); document.body.append(wrapper);
  callback([{ isIntersecting: true } as IntersectionObserverEntry], { disconnect() {} } as IntersectionObserver);
  await vi.waitFor(() => expect(element.hasAttribute('data-loaded')).toBe(true));
  expect(wrapper.hidden).toBe(!show);
  if (show) expect(element.textContent).toBe('No recommendations yet');
});

it('rejects an old recommendation response after reconnect and announces the current grid for motion initialization', async () => {
  const callbacks: IntersectionObserverCallback[] = [];
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: IntersectionObserverCallback) { callbacks.push(callback); }
    observe() {} disconnect() {} unobserve() {}
  });
  let oldResponse!: (html: string) => void;
  let newResponse!: (html: string) => void;
  request.fetchText.mockImplementationOnce(() => new Promise<string>(resolve => { oldResponse = resolve; }))
    .mockImplementationOnce(() => new Promise<string>(resolve => { newResponse = resolve; }));
  const element = document.createElement('nk-recommendations') as NkElement;
  element.setAttribute('url', '/recommendations/products?product_id=1');
  document.body.append(element);
  const trigger = () => callbacks.at(-1)!([{ isIntersecting: true } as IntersectionObserverEntry], { disconnect() {} } as IntersectionObserver);
  trigger();
  element.remove(); document.body.append(element); trigger();
  const replaced = vi.fn(); element.addEventListener('nk:section:replaced', replaced);
  oldResponse('<nk-recommendations><li data-stagger-item>Old</li></nk-recommendations>');
  await Promise.resolve(); await Promise.resolve();
  expect(element.textContent).not.toContain('Old');
  newResponse('<nk-recommendations><nk-stagger><li data-stagger-item>Current</li></nk-stagger></nk-recommendations>');
  await vi.waitFor(() => expect(element.textContent).toBe('Current'));
  expect(element.hasAttribute('data-loaded')).toBe(true);
  expect(replaced).toHaveBeenCalledOnce();
});
