import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); document.body.innerHTML = ''; });

it('reduced motion overrides full merchant settings and responds to preference changes', async () => {
  vi.resetModules();
  const reduced = new EventTarget() as EventTarget & { matches: boolean };
  reduced.matches = true;
  const phone = new EventTarget() as EventTarget & { matches: boolean };
  phone.matches = false;
  vi.stubGlobal('matchMedia', (query: string) => query.includes('prefers-reduced') ? reduced : phone);
  const { motionMode, installMotionPolicy } = await import('../../src/core/motion');
  const { config, setConfigForTests } = await import('../../src/core/config');
  setConfigForTests({ ...config(), motion: 'standard', motionOptions: { tempo: 'balanced', stagger: 'long', scrollEffects: true, mobile: 'full' } });
  expect(motionMode()).toBe('off');
  installMotionPolicy();
  reduced.matches = false;
  reduced.dispatchEvent(new Event('change'));
  expect(motionMode()).toBe('full');
  expect(document.documentElement.classList.contains('nk-anim')).toBe(true);
  reduced.matches = true;
  reduced.dispatchEvent(new Event('change'));
  expect(document.documentElement.classList.contains('nk-anim')).toBe(false);
});
