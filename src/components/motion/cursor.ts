import { t } from '../../core/config';
import { decorativeMotionAllowed } from '../../core/motion';

/**
 * Desktop-only pointer effects (fine pointer + hover, motion allowed):
 * - a "View" badge that follows the pointer over [data-cursor="view"] (product card media);
 * - magnetic pull on [data-magnetic] buttons.
 * Purely decorative: the badge is aria-hidden and the real link/button is unchanged.
 * html.nk-cursor-on is set only while the badge is live, so CSS hides the system cursor only when
 * something replaces it.
 */
let installed = false;

export async function installCursor(): Promise<void> {
  if (installed || !decorativeMotionAllowed() || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  installed = true;
  let runtime: typeof import('../../motion/gsap');
  try { runtime = await import('../../motion/gsap'); }
  catch (error) { installed = false; throw error; }
  const { gsap } = runtime;
  const pointer = matchMedia('(hover: hover) and (pointer: fine)');
  const allowed = () => decorativeMotionAllowed() && pointer.matches;
  const root = document.documentElement;

  const badge = document.createElement('div');
  badge.className = 'nk-cursor';
  badge.setAttribute('aria-hidden', 'true');
  badge.textContent = t('cursor.view');
  document.body.append(badge);
  gsap.set(badge, { xPercent: -50, yPercent: -50, scale: 0 });
  const moveX = gsap.quickTo(badge, 'x', { duration: 0.35, ease: 'power3' });
  const moveY = gsap.quickTo(badge, 'y', { duration: 0.35, ease: 'power3' });

  let active: Element | null = null;
  let magnet: HTMLElement | null = null;
  let last: { x: number; y: number } | null = null;
  let scrollFrame = 0;

  const syncEnabled = () => root.classList.toggle('nk-cursor-on', allowed());
  syncEnabled();

  const showBadge = (over: Element | null) => {
    if (over === active) return;
    active = over;
    // overwrite 'auto' replaces only a competing scale tween. `true` would also kill the quickTo x/y
    // tweens, freezing the badge in place while the system cursor is hidden.
    gsap.to(badge, { scale: over ? 1 : 0, duration: 0.3, ease: over ? 'back.out(2)' : 'power2.in', overwrite: 'auto' });
  };
  // Ease the released button home instead of snapping it back.
  const releaseMagnet = () => {
    if (magnet) gsap.to(magnet, { x: 0, y: 0, duration: 0.45, ease: 'power3.out', overwrite: true, clearProps: 'transform' });
    magnet = null;
  };
  const pull = (button: HTMLElement, x: number, y: number) => {
    const strength = Number(button.getAttribute('strength') || button.dataset.magnetic) || 0.25;
    // Measure from the button's resting place: the rect already includes the current pull, and
    // using it as-is feeds the offset back into itself (jitter).
    const rect = button.getBoundingClientRect();
    const restX = rect.left + rect.width / 2 - (Number(gsap.getProperty(button, 'x')) || 0);
    const restY = rect.top + rect.height / 2 - (Number(gsap.getProperty(button, 'y')) || 0);
    gsap.to(button, { x: (x - restX) * strength, y: (y - restY) * strength, duration: 0.4, ease: 'power3', overwrite: 'auto' });
  };
  const track = (target: Element | null, x: number, y: number) => {
    showBadge(target?.closest?.('[data-cursor="view"]') ?? null);
    const button = target?.closest?.<HTMLElement>('[data-magnetic], nk-magnetic') ?? null;
    if (button !== magnet) {
      releaseMagnet();
      magnet = button;
    }
    if (button) pull(button, x, y);
  };
  const reset = () => {
    syncEnabled();
    last = null;
    releaseMagnet();
    showBadge(null);
  };

  document.addEventListener('nk:motion:changed', reset);
  pointer.addEventListener('change', reset);
  window.addEventListener('blur', reset);
  // A removed card must not leave a badge or an active GSAP tween behind.
  new MutationObserver(() => {
    if ((active && !active.isConnected) || (magnet && !magnet.isConnected)) reset();
  }).observe(document.body, { childList: true, subtree: true });
  document.addEventListener(
    'pointermove',
    (event) => {
      // Touch drags on hybrid laptops report (hover: hover) too; only a mouse or pen drives the badge.
      if (!allowed() || event.pointerType === 'touch') return;
      last = { x: event.clientX, y: event.clientY };
      moveX(event.clientX);
      moveY(event.clientY);
      track(event.target as Element, event.clientX, event.clientY);
    },
    { passive: true },
  );
  // Scrolling moves content under a still pointer without any pointermove: re-check what is under
  // it so the badge never stays up over something that is no longer a card.
  window.addEventListener(
    'scroll',
    () => {
      if (!last || scrollFrame || (!active && !magnet)) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        if (last && allowed()) track(document.elementFromPoint(last.x, last.y), last.x, last.y);
      });
    },
    { passive: true },
  );

  root.addEventListener('pointerleave', reset);
}
