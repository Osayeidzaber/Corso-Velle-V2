import { describe, expect, it } from 'vitest';
import { frontLook, lookFromHash, lineFade, lineRise, bundleTotals, formatMoney, salePercent, goalForSpeed, placeOnLine, stepSpring, wrapFloat, wrapOffset } from '../../src/components/runway/runway';

describe('wrapOffset', () => {
  it('takes the short way round the loop', () => {
    expect(wrapOffset(4, 0, 5)).toBe(-1);
    expect(wrapOffset(0, 4, 5)).toBe(1);
    expect(wrapOffset(2, 2, 5)).toBe(0);
  });
});

describe('formatMoney', () => {
  it.each([
    ['${{amount}}', 149230, '$1,492.30'],
    ['{{ amount_no_decimals }} kr', 149230, '1,492 kr'],
    ['{{amount_with_comma_separator}} EUR', 149230, '1.492,30 EUR'],
  ])('%s', (format, cents, expected) => {
    expect(formatMoney(cents, format)).toBe(expected);
  });
});

describe('line-up motion', () => {
  const run = (fps: number, seconds: number) => {
    const state = { pos: 0, goal: 0, vel: 0 };
    for (let frame = 0; frame < seconds * fps; frame += 1) stepSpring(state, 1, 7.6, 1 / fps);
    return state;
  };

  it('moves the same at any frame rate', () => {
    expect(run(60, 0.4).pos).toBeCloseTo(run(144, 0.4).pos, 2);
  });

  it('builds up speed instead of lurching, and never overshoots', () => {
    const early = run(60, 1 / 60);
    expect(early.pos).toBeLessThan(0.002);
    let last = 0;
    const state = { pos: 0, goal: 0, vel: 0 };
    for (let frame = 0; frame < 240; frame += 1) {
      stepSpring(state, 1, 7.6, 1 / 60);
      expect(state.pos).toBeGreaterThanOrEqual(last);
      expect(state.pos).toBeLessThanOrEqual(1.0001);
      last = state.pos;
    }
    expect(last).toBeCloseTo(1, 2);
  });

  it('keeps its speed through a drag release', () => {
    const state = { pos: 0.4, goal: goalForSpeed(0.4, 3, 7.6), vel: 3 };
    stepSpring(state, 1, 7.6, 1 / 60);
    expect(state.vel).toBeGreaterThan(2.7);
  });

  it('places looks on a smooth curve with no change of speed at a neighbour', () => {
    expect(placeOnLine(1, 20)).toBeCloseTo(20);
    expect(placeOnLine(-1, 20)).toBeCloseTo(-20);
    const slope = (at: number) => (placeOnLine(at + 0.001, 20) - placeOnLine(at - 0.001, 20)) / 0.002;
    for (let at = 0; at < 3; at += 0.05) expect(Math.abs(slope(at + 0.05) - slope(at))).toBeLessThan(1);
  });

  it('wraps fractional distances the short way', () => {
    expect(wrapFloat(3.5, 4)).toBeCloseTo(-0.5);
    expect(wrapFloat(-2.25, 5)).toBeCloseTo(-2.25);
  });
});

describe('sale prices', () => {
  it('only reports a real saving', () => {
    expect(salePercent(8000, 10000)).toBe(20);
    expect(salePercent(10000, 10000)).toBe(0);
    expect(salePercent(10000, 0)).toBe(0);
    expect(salePercent(10000, 8000)).toBe(0);
  });

  it('adds sale prices and the bundle discount together', () => {
    const rows = [{ price: 8000, compare: 10000 }, { price: 5000, compare: 0 }];
    expect(bundleTotals(rows, 0)).toEqual({ now: 13000, was: 15000 });
    expect(bundleTotals(rows, 10)).toEqual({ now: 11700, was: 15000 });
  });
});

describe('line-up depth', () => {
  it('stands further looks higher on the floor', () => {
    expect(lineRise(0)).toBeCloseTo(0);
    expect(lineRise(2)).toBeLessThan(lineRise(1));
  });

  it('keeps neighbours solid and drops far looks into the haze', () => {
    expect(lineFade(0, 0.12)).toBe(1);
    expect(lineFade(1, 0.12)).toBeCloseTo(0.88);
    expect(lineFade(2, 0.12)).toBeLessThan(0.5);
    expect(lineFade(2, 0.12)).toBeGreaterThan(0.3);
    expect(lineFade(5, 0.12)).toBe(0);
  });
});

describe('shareable look links', () => {
  it('only accepts looks that exist', () => {
    expect(lookFromHash('#look-2', 4)).toBe(1);
    expect(lookFromHash('#look-9', 4)).toBeNull();
    expect(lookFromHash('#look-0', 4)).toBeNull();
    expect(lookFromHash('#reviews', 4)).toBeNull();
  });
});

describe('depth settings', () => {
  it('follows the floor and haze settings', () => {
    expect(lineRise(1, 0)).toBeCloseTo(0);
    expect(lineRise(1, 5)).toBeCloseTo(-5);
    expect(lineFade(2, 0, 0)).toBe(1);
    expect(lineFade(2, 0, 1)).toBe(0);
  });
});

describe('frontLook', () => {
  const back = [false, true, false, true, false];
  it('keeps a main look', () => expect(frontLook(2, 1, back)).toBe(2));
  it('skips a background look in the direction of travel', () => {
    expect(frontLook(1, 1, back)).toBe(2);
    expect(frontLook(1, -1, back)).toBe(0);
  });
  it('wraps around the loop', () => expect(frontLook(3, 1, [false, true, true, true])).toBe(0));
  it('gives up gracefully when every look is in the back', () => expect(frontLook(1, 1, [true, true])).toBe(1));
});
