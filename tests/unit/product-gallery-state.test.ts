import { afterEach, expect, it, vi } from 'vitest';
import { define } from '../../src/core/define';
import { NkGallery } from '../../src/components/product/gallery';
import { config, setConfigForTests } from '../../src/core/config';
define('nk-gallery', NkGallery);
afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); setConfigForTests(null); });

it('moves product media only for resolved variant changes, not intermediate states or the same image', () => {
  setConfigForTests({ ...config(), motion: 'off' });
  const section = document.createElement('section');
  section.setAttribute('data-product-section', '');
  section.innerHTML = `<nk-gallery><div data-ref="track"><div data-ref="slide" data-media-id="1"></div><div data-ref="slide" data-media-id="2"></div></div></nk-gallery><div data-region="buy" data-variant-media-id="1"></div>`;
  document.body.append(section);
  const gallery = section.querySelector('nk-gallery') as NkGallery;
  gallery.disconnectedCallback(); gallery.connectedCallback();
  const go = vi.spyOn(gallery, 'go');
  const emit = (state: string) => section.dispatchEvent(new CustomEvent('nk:variant:changed', { detail: { state } }));
  emit('resolving'); emit('incomplete'); emit('failed'); emit('available');
  expect(go).not.toHaveBeenCalled();
  section.querySelector<HTMLElement>('[data-region="buy"]')!.dataset.variantMediaId = '2';
  emit('available'); emit('available');
  expect(go).toHaveBeenCalledExactlyOnceWith(1, true);
});
