import { afterEach, describe, expect, it, vi } from 'vitest';
import { availabilityLabel } from '../../src/components/carousel/availability-label';

afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });

describe('carousel availability texture', () => {
  it('uses the translated label and existing brown/warm-white scheme', () => {
    const context = { fillStyle: '', font: '', textAlign: '', textBaseline: '', fillRect: vi.fn(), fillText: vi.fn() };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
    document.body.innerHTML = '<div id="carousel" style="--nk-color-accent:#432d23;--nk-color-accent-text:#f5ecdf;--nk-font-spec:Arial"></div>';
    const canvas = availabilityLabel(document.querySelector('#carousel')!, 'Épuisé');
    expect(canvas?.width).toBe(512);
    expect(canvas?.height).toBe(96);
    expect(context.fillRect).toHaveBeenCalledExactlyOnceWith(0, 0, 512, 96);
    expect(context.fillStyle).toBe('#f5ecdf');
    expect(context.fillText).toHaveBeenCalledExactlyOnceWith('ÉPUISÉ', 256, 48, 464);
  });
  it('keeps the native/caption fallback when a 2D texture cannot be created', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    expect(availabilityLabel(document.createElement('div'), 'Sold out')).toBeNull();
  });
});
