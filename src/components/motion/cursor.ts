import './cursor.css';

import { t } from '../../core/config';
import { decorativeMotionAllowed } from '../../core/motion';

/**
 * Desktop-only pointer effects (fine pointer + hover, motion allowed):
 * - a "View" badge that follows the pointer over [data-cursor="view"] (product card media);
 * - magnetic pull on [data-magnetic] buttons.
 * Purely decorative: the badge is aria-hidden and the real link/button is unchanged.
 */
export async function installCursor(): Promise<void> {
  if (!decorativeMotionAllowed() || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const { gsap } = await import('../../motion/gsap');

  const badge = document.createElement('div');
  badge.className = 'nk-cursor';
  badge.setAttribute('aria-hidden', 'true');
  badge.textContent = t('cursor.view');
  document.body.append(badge);
  gsap.set(badge, { xPercent: -50, yPercent: -50, scale: 0 });
  const moveX = gsap.quickTo(badge, 'x', { duration: 0.35, ease: 'power3' });
  const moveY = gsap.quickTo(badge, 'y', { duration: 0.35, ease: 'power3' });

  let active: Element | null = null;
  document.addEventListener(
    'pointermove',
    (event) => {
      moveX(event.clientX);
      moveY(event.clientY);
      const over = (event.target as Element).closest?.('[data-cursor="view"]') ?? null;
      if (over !== active) {
        active = over;
        gsap.to(badge, { scale: over ? 1 : 0, duration: 0.3, ease: over ? 'back.out(2)' : 'power2.in' });
      }
    },
    { passive: true },
  );

  // Magnetic buttons: drift toward the pointer, spring back on leave.
  document.addEventListener('pointerover', (event) => {
    const button = (event.target as Element).closest?.<HTMLElement>('[data-magnetic]');
    if (!button || button.dataset.magneticBound) return;
    button.dataset.magneticBound = '1';
    const toX = gsap.quickTo(button, 'x', { duration: 0.4, ease: 'power3' });
    const toY = gsap.quickTo(button, 'y', { duration: 0.4, ease: 'power3' });
    button.addEventListener('pointermove', (move) => {
      const rect = button.getBoundingClientRect();
      toX((move.clientX - rect.left - rect.width / 2) * 0.25);
      toY((move.clientY - rect.top - rect.height / 2) * 0.35);
    });
    button.addEventListener('pointerleave', () => {
      gsap.to(button, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    });
  });
}
