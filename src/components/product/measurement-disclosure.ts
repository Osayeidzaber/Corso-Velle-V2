import { animate, transitionsAllowed } from '../../core/motion';

const EASE_OUT = 'cubic-bezier(.22,1,.36,1)';
const EASE_IN_OUT = 'cubic-bezier(.65,0,.35,1)';
const OPEN_MS = 460;
const CLOSE_MS = 320;
const SWAP_MS = 280;

/**
 * Interruptible disclosure: animate the outer footprint, keeping the chart's layout intact.
 * The shell grows first and the panel's content rises and fades in behind it; closing fades the
 * content out before the height settles, so the buy button never jumps. swap() crossfades a
 * content change (another size) and eases any height difference instead of snapping.
 */
export function measurementDisclosure(panel: HTMLElement) {
  const shell = document.createElement('div');
  shell.className = 'measurement-panel-shell';
  panel.before(shell); shell.append(panel);
  let open = !panel.hidden;
  let animation: Animation | null = null;
  let contentAnimation: Animation | null = null;
  shell.style.height = open ? 'auto' : '0px';
  shell.style.opacity = open ? '1' : '0';
  shell.inert = !open;

  const settle = () => {
    panel.hidden = !open;
    shell.style.height = open ? 'auto' : '0px';
    animation = null;
  };

  return {
    setOpen(next: boolean) {
      if (next === open) return;
      const height = shell.getBoundingClientRect().height;
      const opacity = Number(getComputedStyle(shell).opacity);
      animation?.cancel(); animation = null;
      contentAnimation?.cancel(); contentAnimation = null;
      open = next;
      shell.inert = !next;
      panel.hidden = false;
      // flow-root includes the chart's margin in the height being animated.
      shell.style.height = 'auto';
      const target = next ? shell.getBoundingClientRect().height : 0;
      shell.style.height = `${target}px`;
      shell.style.opacity = next ? '1' : '0';
      if (!transitionsAllowed()) { settle(); return; }
      // Duration scales with the distance left, so an interrupted open/close never lurches.
      const full = Math.max(target, height, 1);
      const share = Math.min(1, Math.max(0.35, Math.abs(target - height) / full));
      animation = animate(shell,
        next
          ? [{ height: `${height}px`, opacity }, { opacity: Math.max(opacity, 0.6), offset: 0.35 }, { height: `${target}px`, opacity: 1 }]
          : [{ height: `${height}px`, opacity }, { opacity: 0, offset: 0.55 }, { height: '0px', opacity: 0 }],
        { duration: (next ? OPEN_MS : CLOSE_MS) * share, easing: next ? EASE_OUT : EASE_IN_OUT });
      if (next) {
        contentAnimation = animate(panel,
          [{ transform: 'translate3d(0,-8px,0)', opacity: 0, filter: 'blur(2px)' }, { transform: 'none', opacity: 1, filter: 'blur(0)' }],
          { duration: OPEN_MS * share, delay: 60, easing: EASE_OUT, fill: 'backwards' });
      }
      if (animation) animation.onfinish = settle;
      else settle();
    },
    /** Apply a content change (another size) while open, crossfading it and easing the height. */
    swap(update: () => void) {
      if (!open || animation?.playState === 'running' || !transitionsAllowed()) { update(); return; }
      animation?.cancel(); animation = null;
      const from = shell.getBoundingClientRect().height;
      update();
      shell.style.height = 'auto';
      const to = shell.getBoundingClientRect().height;
      if (Math.abs(to - from) > 1) {
        animation = animate(shell, [{ height: `${from}px` }, { height: `${to}px` }], { duration: SWAP_MS, easing: EASE_OUT });
        if (animation) animation.onfinish = settle;
      }
      contentAnimation?.cancel();
      contentAnimation = animate(panel,
        [{ opacity: 0.35, transform: 'translate3d(0,3px,0)' }, { opacity: 1, transform: 'none' }],
        { duration: SWAP_MS, easing: EASE_OUT });
    },
    dispose() { animation?.cancel(); contentAnimation?.cancel(); panel.hidden = !open; shell.replaceWith(panel); },
  };
}
