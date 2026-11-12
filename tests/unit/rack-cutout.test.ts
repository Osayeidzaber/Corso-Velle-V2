import { describe, expect, it } from 'vitest';
import { maskFromWhite, usableCoverage } from '../../src/components/clothes-rack/rack-cutout';

/** Draws rows like "..XX.." where . is white, X is cloth, o is a white logo, s is near-white cloth. */
function image(rows: string[]) {
  const height = rows.length;
  const width = rows[0]!.length;
  const data = new Uint8ClampedArray(width * height * 4);
  rows.forEach((row, y) => {
    [...row].forEach((char, x) => {
      const value = { '.': 255, o: 255, X: 60, s: 243 }[char] ?? 255;
      data.set([value, value, value, 255], (y * width + x) * 4);
    });
  });
  return { data, width, height };
}

const at = (alpha: Uint8ClampedArray, width: number, x: number, y: number) => alpha[y * width + x];

describe('maskFromWhite', () => {
  const big = image(['.........', '.XXXXXXX.', '.XXXXXXX.', '.XXXoXXX.', '.XXXXXXX.', '.XXXXXXX.', '.........']);

  it('removes the white connected to the outside', () => {
    const { alpha } = maskFromWhite(big.data, big.width, big.height);
    expect(at(alpha, big.width, 0, 0)).toBe(0);
    expect(at(alpha, big.width, 8, 6)).toBe(0);
  });

  it('keeps a white logo enclosed by cloth', () => {
    const { alpha } = maskFromWhite(big.data, big.width, big.height);
    expect(at(alpha, big.width, 4, 3)).toBe(255);
  });

  it('softens the rim so no white fringe survives', () => {
    const { alpha } = maskFromWhite(big.data, big.width, big.height);
    expect(at(alpha, big.width, 1, 1)).toBeLessThan(128);
    expect(at(alpha, big.width, 2, 2)).toBeGreaterThan(128);
  });

  it('holds a pale garment on white, as long as it is whiter than the tolerance', () => {
    const pale = image(['.....', '.sss.', '.sss.', '.....']);
    const { coverage } = maskFromWhite(pale.data, pale.width, pale.height, 4);
    expect(coverage).toBeCloseTo(6 / 20, 5);
  });

  it('measures the garment it found', () => {
    expect(maskFromWhite(big.data, big.width, big.height).box).toEqual({ left: 1, top: 1, right: 7, bottom: 5 });
  });
});

describe('usableCoverage', () => {
  it('rejects a fill that leaked into the cloth, and a photo not on white', () => {
    expect(usableCoverage(0.002)).toBe(false);
    expect(usableCoverage(0.97)).toBe(false);
    expect(usableCoverage(0.3)).toBe(true);
  });
});
