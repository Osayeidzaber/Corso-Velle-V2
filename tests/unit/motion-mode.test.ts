import { afterEach, describe, expect, it } from 'vitest';
import { config, setConfigForTests } from '../../src/core/config';
import { motionMode, motionStagger, motionTempo } from '../../src/core/motion';

const withMotion = (motionOptions: Partial<ReturnType<typeof config>['motionOptions']>, motion: 'off' | 'minimal' | 'standard' = 'standard') => {
  setConfigForTests(null);
  const base = config();
  setConfigForTests({ ...base, motion, motionOptions: { ...base.motionOptions, ...motionOptions } });
};

describe('motion mode', () => {
  afterEach(() => setConfigForTests(null));

  it('gives desktop the full experience by default and phones the simplified one', () => {
    withMotion({});
    expect(motionMode(false)).toBe('full');
    expect(motionMode(true)).toBe('simple');
  });

  it('honours the phone setting', () => {
    withMotion({ mobile: 'full' });
    expect(motionMode(true)).toBe('full');
    withMotion({ mobile: 'off' });
    expect(motionMode(true)).toBe('off');
    expect(motionMode(false)).toBe('full');
  });

  it('drops scroll-linked effects everywhere when they are turned off', () => {
    withMotion({ scrollEffects: false, mobile: 'full' });
    expect(motionMode(false)).toBe('simple');
    expect(motionMode(true)).toBe('simple');
  });

  it('simplifies motion when the browser requests data saving', () => {
    const previous = Object.getOwnPropertyDescriptor(navigator, 'connection');
    Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: true } });
    try {
      withMotion({ mobile: 'full' });
      expect(motionMode(false)).toBe('simple');
      expect(motionMode(true)).toBe('simple');
    } finally {
      if (previous) Object.defineProperty(navigator, 'connection', previous);
      else delete (navigator as Navigator & { connection?: unknown }).connection;
    }
  });

  it('keeps all decorative scenes off in the Theme Editor', () => {
    const previous = window.Shopify;
    window.Shopify = { designMode: true };
    try {
      withMotion({});
      expect(motionMode(false)).toBe('off');
    } finally { window.Shopify = previous; }
  });

  it('is off whenever the global animation level is not standard', () => {
    withMotion({}, 'minimal');
    expect(motionMode(false)).toBe('off');
    withMotion({}, 'off');
    expect(motionMode(false)).toBe('off');
  });

  it('maps tempo and stagger to sane numbers', () => {
    withMotion({ tempo: 'brisk', stagger: 'none' });
    expect(motionTempo()).toBeLessThan(1);
    expect(motionStagger()).toBe(0);
    withMotion({ tempo: 'relaxed', stagger: 'long' });
    expect(motionTempo()).toBeGreaterThan(1);
    expect(motionStagger()).toBeGreaterThan(0.1);
  });
});
