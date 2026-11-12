import { describe, expect, it } from 'vitest';
import { maskFromAlpha } from '../../src/components/clothes-rack/rack-cutout';

describe('maskFromAlpha', () => {
  it('keeps the outline a transparent photo already has', () => {
    // 3x2: only the middle column of the bottom row is solid.
    const data = new Uint8ClampedArray(3 * 2 * 4);
    data[(1 * 3 + 1) * 4 + 3] = 255;
    data[(0 * 3 + 1) * 4 + 3] = 40;
    const { alpha, coverage, box } = maskFromAlpha(data, 3, 2);
    expect(Array.from(alpha)).toEqual([0, 40, 0, 0, 255, 0]);
    expect(coverage).toBeCloseTo(1 / 6);
    expect(box).toEqual({ left: 1, top: 1, right: 1, bottom: 1 });
  });
});
