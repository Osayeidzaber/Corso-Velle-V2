import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const runtime = vi.hoisted(() => ({
  mode: 'full' as 'off' | 'simple' | 'full',
  reverts: [] as ReturnType<typeof vi.fn>[],
  tween: vi.fn(),
}));
vi.mock('../../src/core/motion', () => ({ motionMode: () => runtime.mode }));
vi.mock('../../src/motion/gsap', () => ({
  gsap: { to: runtime.tween },
  motionMatch: (_scope: Element, setup: (mode: string) => void | (() => void)) => {
    const cleanup = setup(runtime.mode);
    const revert = vi.fn(() => cleanup?.());
    runtime.reverts.push(revert);
    return revert;
  },
}));
import '../../src/components/expand-media/expand-media';

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('campaign motion lifecycle', () => {
  beforeEach(() => {
    runtime.mode = 'full';
    runtime.reverts.length = 0;
    runtime.tween.mockClear();
  });
  afterEach(() => { document.body.innerHTML = ''; });

  it('keeps simplified campaigns fully visible without creating a scroll tween', async () => {
    runtime.mode = 'simple';
    document.body.innerHTML = '<nk-expand-media><div data-ref="track"></div></nk-expand-media>';
    await settle();
    const campaign = document.querySelector('nk-expand-media') as HTMLElement;
    expect(campaign.hasAttribute('data-static')).toBe(true);
    expect(campaign.style.getPropertyValue('--overlay')).toBe('1.000');
    expect(runtime.tween).not.toHaveBeenCalled();
  });

  it('honors a section override independently from an animated campaign and cleans up on removal', async () => {
    document.body.innerHTML = '<nk-expand-media data-motion-disabled></nk-expand-media><nk-expand-media></nk-expand-media>';
    await settle();
    const [disabled, active] = [...document.querySelectorAll('nk-expand-media')];
    expect(disabled?.hasAttribute('data-static')).toBe(true);
    expect(active?.hasAttribute('data-static')).toBe(false);
    expect(runtime.tween).toHaveBeenCalledTimes(1);
    active?.remove();
    expect(runtime.reverts[0]).toHaveBeenCalledTimes(1);
    expect(active?.hasAttribute('data-static')).toBe(true);
  });

  it('does not initialize a detached campaign after its async import resolves', async () => {
    const campaign = document.createElement('nk-expand-media');
    document.body.append(campaign);
    campaign.remove();
    await settle();
    expect(runtime.tween).not.toHaveBeenCalled();
    document.body.append(campaign);
    await settle();
    expect(runtime.tween).toHaveBeenCalledTimes(1);
  });

  it('paints the overlay during its fade while keeping hidden purchase controls out of focus', async () => {
    document.body.innerHTML = '<nk-expand-media><div class="expand__overlay"><a href="/collections/all">Shop</a></div></nk-expand-media>';
    await settle();
    const campaign = document.querySelector('nk-expand-media') as HTMLElement;
    const overlay = campaign.querySelector('.expand__overlay') as HTMLElement;
    const [proxy, tween] = runtime.tween.mock.calls[0]!;
    proxy.p = 0.6; // 80% of the visual transition, during the overlay fade.
    tween.onUpdate();
    expect(campaign.hasAttribute('data-open')).toBe(true);
    expect(Number(campaign.style.getPropertyValue('--overlay'))).toBeGreaterThan(0);
    expect(Number(campaign.style.getPropertyValue('--overlay'))).toBeLessThan(1);
    expect(overlay.inert).toBe(true);
    proxy.p = 1;
    tween.onUpdate();
    expect(overlay.inert).toBe(false);
  });

  it('shows reduced-motion/off campaigns without loading a scroll context', async () => {
    runtime.mode = 'off';
    document.body.innerHTML = '<nk-expand-media></nk-expand-media>';
    await settle();
    expect(document.querySelector('nk-expand-media')?.hasAttribute('data-open')).toBe(true);
    expect(runtime.reverts).toHaveLength(0);
  });
});
