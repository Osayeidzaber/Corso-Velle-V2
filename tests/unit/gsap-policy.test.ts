import { expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ add: vi.fn(), revert: vi.fn() }));
vi.mock('gsap', () => ({ gsap: { registerPlugin: vi.fn(), defaults: vi.fn(), matchMedia: () => mock } }));
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: { config: vi.fn(), refresh: vi.fn() } }));
vi.mock('gsap/SplitText', () => ({ SplitText: {} }));
import { motionMatch } from '../../src/motion/gsap';

it('starts desktop contexts even when phone and reduced-motion queries are false; exposes cleanup', () => {
  const setup = vi.fn();
  const revert = motionMatch(document.body, setup);
  const [conditions, callback] = mock.add.mock.calls[0]!;
  expect(conditions.all).toBe('(min-width: 0px)');
  callback({ conditions: { all: true, phone: false, reduce: false } });
  expect(setup).toHaveBeenCalledWith('full');
  revert();
  expect(mock.revert).toHaveBeenCalledOnce();
});
