import { describe, expect, it } from 'vitest';
import { centerCardHeight } from '../../src/components/carousel/flex-layout';
import { lensScenePoint } from '../../src/components/carousel/flex-lens';

describe('extended curved carousel layout', () => {
  it('fits four square products into the flatter central run at a wide viewport', () => {
    const height = centerCardHeight(1800, 860, [1, 1, 1, 1, 1], 12, 4);
    expect(height * 4 + 12 * 3).toBeCloseTo(1800 * .76);
    expect(height).toBeGreaterThan(300);
  });
  it('keeps portrait proportions and fits more products when the merchant increases the count', () => {
    const four = centerCardHeight(1800, 860, [.75, .75, .75, 3], 12, 4);
    const six = centerCardHeight(1800, 860, [.75, .75, .75, 3], 12, 6);
    expect(four).toBeLessThanOrEqual(430);
    expect(six * .75 * 6 + 12 * 5).toBeCloseTo(1800 * .76);
    expect(six).toBeLessThan(four);
  });
  it('maps the lens center and uncurved input directly, with symmetric curved edges', () => {
    expect(lensScenePoint(900, 430, 1800, 860, 1)).toEqual([900, 430]);
    expect(lensScenePoint(90, 110, 1800, 860, 0)).toEqual([90, 110]);
    const left = lensScenePoint(90, 110, 1800, 860, 1);
    const right = lensScenePoint(1710, 750, 1800, 860, 1);
    expect(left[0] + right[0]).toBeCloseTo(1800);
    expect(left[1] + right[1]).toBeCloseTo(860);
    expect(left.every(Number.isFinite)).toBe(true);
  });
});
