import { decorativeMotionAllowed, durations } from '../core/motion';

/**
 * Gentle motion for the cart drawer's lines. The drawer's contents are server-rendered and swapped
 * wholesale by the cart renderer, so this works FLIP-style: when a cart mutation starts
 * (`nk:cart:pending`) the lines are measured; when the new HTML lands (`nk:section:replaced`) they
 * are diffed by line key:
 * - kept lines glide from their old place to the new one;
 * - removed lines fade and slide out (a copy, since the real one is gone);
 * - new lines open up and fade in, once the add-to-cart flyer lands on them (fly-to-cart.ts calls
 *   `lineLanded`) or, when nothing flies, once the drawer is showing.
 * Opening the drawer fades the lines up in a short stagger.
 * Purely decorative: skipped when motion is reduced or off.
 */

interface Snap {
  top: number;
  left: number;
  width: number;
  node: HTMLElement;
}

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const SAFETY = 2400;
let snapshot: Map<string, Snap> | null = null;
let waiting: string[] = [];
let flightExpected = false;
let safetyTimer = 0;
let installed = false;

/** Never leave a line hidden: a timeline that isn't advancing (a background tab) gets finished. */
function settle(animations: Animation[], after = 1600): void {
  window.setTimeout(() => {
    for (const a of animations) if (a.playState !== 'finished') a.finish();
  }, after);
}

const listEl = () => document.querySelector<HTMLElement>('#CartDrawer .cart-lines');
const drawerOpen = () => Boolean(document.querySelector('#CartDrawer dialog[open]'));
const linesOf = (list: ParentNode) => [...list.querySelectorAll<HTMLElement>('.cart-line[data-line-key]')];
const lineFor = (key: string) => listEl()?.querySelector<HTMLElement>(`.cart-line[data-line-key="${CSS.escape(key)}"]`) ?? null;

function take(): void {
  const list = listEl();
  if (!list || !decorativeMotionAllowed()) {
    snapshot = null;
    return;
  }
  const origin = list.getBoundingClientRect();
  snapshot = new Map(linesOf(list).map((li) => {
    const box = li.getBoundingClientRect();
    return [li.dataset.lineKey!, { top: box.top - origin.top, left: box.left - origin.left, width: box.width, node: li.cloneNode(true) as HTMLElement }];
  }));
}

function replaced(): void {
  const before = snapshot;
  snapshot = null;
  if (!before) return;
  const list = listEl();
  const visible = drawerOpen();
  const now = list ? linesOf(list) : [];
  const keys = new Set(now.map((li) => li.dataset.lineKey!));

  if (visible && list) {
    // Removed: a copy fades and slides out from where the line was.
    for (const [key, snap] of before) if (!keys.has(key)) leave(list, snap);

    // Kept: glide from the old position.
    const origin = list.getBoundingClientRect();
    for (const li of now) {
      const old = before.get(li.dataset.lineKey!);
      if (!old) continue;
      const dy = old.top - (li.getBoundingClientRect().top - origin.top);
      if (Math.abs(dy) < 1) continue;
      li.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 420, easing: EASE });
    }
  }

  // New: hold back until it can arrive.
  const fresh = now.filter((li) => !before.has(li.dataset.lineKey!));
  if (!fresh.length) return;
  waiting = fresh.map((li) => li.dataset.lineKey!);
  for (const li of fresh) li.style.opacity = '0';
  list?.closest('.drawer__body')?.scrollTo({ top: 0 });
  window.clearTimeout(safetyTimer);
  safetyTimer = window.setTimeout(() => arrive(false), SAFETY);
  // Let fly-to-cart claim the arrival first (same event turn), then show it ourselves if nothing flies.
  window.setTimeout(() => {
    if (flightExpected) return;
    if (drawerOpen()) arrive(true);
    // Otherwise the drawer is about to open: `opened` shows it once the panel has slid in.
  }, 0);
}

function leave(list: HTMLElement, snap: Snap): void {
  const ghost = snap.node;
  ghost.removeAttribute('data-line-key');
  ghost.setAttribute('aria-hidden', 'true');
  ghost.inert = true;
  Object.assign(ghost.style, {
    position: 'absolute',
    top: `${snap.top}px`,
    left: `${snap.left}px`,
    width: `${snap.width}px`,
    margin: '0',
    pointerEvents: 'none',
  });
  if (getComputedStyle(list).position === 'static') list.style.position = 'relative';
  list.append(ghost);
  const out = ghost.animate(
    [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(24px)' }],
    { duration: 300, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' },
  );
  const clear = () => ghost.remove();
  out.addEventListener('finish', clear, { once: true });
  out.addEventListener('cancel', clear, { once: true });
  window.setTimeout(clear, 800);
}

/** Show every waiting line: it opens up to its height, fades in, and its photo settles. */
function arrive(animate: boolean): void {
  window.clearTimeout(safetyTimer);
  flightExpected = false;
  const keys = waiting;
  waiting = [];
  const fresh = keys.map(lineFor).filter((li): li is HTMLElement => Boolean(li));
  for (const li of fresh) li.style.removeProperty('opacity');
  if (!animate || !decorativeMotionAllowed()) return;

  const started: Animation[] = [];
  fresh.forEach((li, i) => {
    const height = li.offsetHeight;
    started.push(li.animate(
      [
        { height: '0px', opacity: 0, paddingBlock: '0px', overflow: 'clip' },
        { height: `${height}px`, opacity: 1, offset: 0.7, overflow: 'clip' },
        { height: `${height}px`, opacity: 1, overflow: 'clip' },
      ],
      { duration: 460, delay: i * 60, easing: EASE, fill: 'backwards' },
    ));
    li.querySelector<HTMLElement>('.cart-line__media')?.animate(
      [{ transform: 'scale(0.92)', opacity: 0.4 }, { transform: 'none', opacity: 1 }],
      { duration: 520, delay: 120 + i * 60, easing: EASE, fill: 'backwards' },
    );
  });
  settle(started);
}

/** The drawer just opened: show anything waiting, or fade the lines up. */
function opened(): void {
  if (!decorativeMotionAllowed()) return;
  if (waiting.length) {
    if (!flightExpected) window.setTimeout(() => arrive(true), durations.overlayIn);
    return;
  }
  const list = listEl();
  if (!list) return;
  settle(linesOf(list).slice(0, 6).map((li, i) =>
    li.animate(
      [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
      { duration: 380, delay: durations.overlayIn * 0.5 + i * 50, easing: EASE, fill: 'backwards' },
    ),
  ));
}

/** fly-to-cart.ts: a photo is on its way to the newest line, so wait for it before showing it. */
export function expectLineFlight(): void {
  flightExpected = true;
}

/** fly-to-cart.ts: the photo has landed on the newest line (or the flight was abandoned). */
export function lineLanded(animate = true): void {
  if (!waiting.length) {
    flightExpected = false;
    return;
  }
  arrive(animate);
}

export function installCartMotion(): void {
  if (installed) return;
  installed = true;
  document.addEventListener('nk:cart:pending', (event) => {
    if ((event as CustomEvent<{ pending: boolean }>).detail.pending) take();
  });
  document.addEventListener('nk:section:replaced', (event) => {
    if ((event.target as Element | null)?.closest?.('#CartDrawer')) replaced();
  });
  document.addEventListener('nk:cart-drawer:opened', opened);
}
