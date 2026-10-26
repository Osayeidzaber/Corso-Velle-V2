import { config } from '../core/config';
import { decorativeMotionAllowed, durations } from '../core/motion';
import type { CartResult } from './cart';

/**
 * Add-to-cart "fly" (Theme settings > Cart > Add-to-cart animation): after Shopify confirms an add,
 * a copy of the product photo arcs from where the shopper tapped into the cart, then the cart count
 * pops. Purely decorative and only after success: it never delays or replaces the cart's own
 * confirmation, and it is skipped when motion is reduced/off or the cart page is the next stop.
 *
 * The flyer is a manual popover so it renders in the top layer, above the cart drawer's modal
 * dialog; the drawer's newest line is the landing spot when the drawer opens.
 */

interface Origin {
  trigger: Element;
  at: number;
}

const ORIGIN_TTL = 15_000;
const FLIGHT = 720;
let origin: Origin | null = null;
let installed = false;

/** The photo that best represents what was added, starting from the control that added it. */
export function sourceImage(trigger: Element): HTMLImageElement | null {
  const visible = (img: HTMLImageElement | null | undefined) => (img && img.getBoundingClientRect().width > 0 ? img : null);
  const card = trigger.closest('[data-product-card], .cart-rec, .quick-add, dialog');
  if (card) {
    const img = visible(card.querySelector<HTMLImageElement>('[data-card-primary-img], .cart-rec__media img, img'));
    if (img) return img;
  }
  const section = trigger.closest('[data-product-section]') ?? (trigger.closest('.sticky-buy') ? document.querySelector('[data-product-section]') : null);
  if (section) {
    const img = visible(section.querySelector<HTMLImageElement>('.gallery__slide[data-current] img'))
      ?? visible(section.querySelector<HTMLImageElement>('.gallery__slide img'));
    if (img) return img;
  }
  return visible(trigger.closest('form, article, li')?.querySelector<HTMLImageElement>('img'));
}

function landingSpot(): Element | null {
  const drawer = document.querySelector('#CartDrawer dialog[open]');
  if (drawer) return drawer.querySelector('.cart-line__media') ?? drawer.querySelector('.drawer__title');
  const icon = document.querySelector('.header__cart');
  return icon && icon.getBoundingClientRect().width > 0 ? icon : null;
}

function fly(src: string, from: DOMRect): void {
  const target = landingSpot();
  if (!target || document.visibilityState !== 'visible') return;
  const to = target.getBoundingClientRect();
  if (!from.width || !to.width) return;

  const size = Math.min(from.width, from.height, 220);
  const startX = from.left + from.width / 2 - size / 2;
  const startY = from.top + from.height / 2 - size / 2;
  const endScale = Math.max(0.12, Math.min(to.width, to.height, 64) / size);
  const dx = to.left + to.width / 2 - (startX + size / 2);
  const dy = to.top + to.height / 2 - (startY + size / 2);

  const flyer = document.createElement('div');
  flyer.className = 'cart-flyer';
  flyer.setAttribute('aria-hidden', 'true');
  flyer.style.cssText = `left:${startX}px;top:${startY}px;width:${size}px;height:${size}px;`;
  const lift = document.createElement('div');
  lift.className = 'cart-flyer__lift';
  const copy = new Image();
  copy.src = src;
  copy.alt = '';
  lift.append(copy);
  flyer.append(lift);
  const popover = 'showPopover' in flyer;
  if (popover) flyer.setAttribute('popover', 'manual');
  document.body.append(flyer);
  if (popover) (flyer as HTMLElement & { showPopover(): void }).showPopover();

  // Horizontal travel eases out while the vertical eases in: together they draw an arc.
  const across = flyer.animate(
    [{ transform: 'translateX(0)' }, { transform: `translateX(${dx}px)` }],
    { duration: FLIGHT, easing: 'cubic-bezier(0.3, 0.6, 0.4, 1)', fill: 'forwards' },
  );
  lift.animate(
    [
      { transform: 'translateY(0) scale(1)', opacity: 1, borderRadius: '2px' },
      { transform: `translateY(${Math.min(-60, dy * -0.25)}px) scale(${(1 + endScale) / 2})`, opacity: 1, offset: 0.35 },
      { transform: `translateY(${dy}px) scale(${endScale})`, opacity: 0.85, borderRadius: '50%' },
    ],
    { duration: FLIGHT, easing: 'cubic-bezier(0.55, 0, 0.75, 0.4)', fill: 'forwards' },
  );
  // Background tabs may never finish the animation: the flyer is always removed on time anyway.
  const safety = window.setTimeout(() => flyer.remove(), FLIGHT + 400);
  const done = () => {
    window.clearTimeout(safety);
    flyer.remove();
    land(target);
  };
  across.addEventListener('finish', done, { once: true });
  across.addEventListener('cancel', () => flyer.remove(), { once: true });
}

function land(target: Element): void {
  target.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(1.14)', offset: 0.4 }, { transform: 'scale(1)' }],
    { duration: 420, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
  );
  for (const count of document.querySelectorAll<HTMLElement>('[data-cart-count]:not([hidden])')) {
    count.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.45)', offset: 0.35 }, { transform: 'scale(1)' }],
      { duration: 460, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
    );
  }
}

export function installFlyToCart(): void {
  if (installed) return;
  installed = true;
  const remember = (trigger: Element | null) => {
    if (trigger) origin = { trigger, at: performance.now() };
  };
  document.addEventListener('click', (event) => {
    remember((event.target as Element | null)?.closest('[data-quick-add], [data-quick-add-id], [data-cart-rec-add], .cart-rec button, form[action*="/cart/add"] button[type="submit"]') ?? null);
  }, true);
  document.addEventListener('submit', (event) => {
    const form = event.target as HTMLFormElement;
    if (form.action.includes('/cart/add')) remember((event as SubmitEvent).submitter ?? form);
  }, true);

  document.addEventListener('nk:cart:updated', (event) => {
    const { kind } = (event as CustomEvent<CartResult & { kind: string }>).detail;
    const added = origin;
    if (kind !== 'add' || !added || performance.now() - added.at > ORIGIN_TTL) return;
    origin = null;
    if (!config().cart.flyAnimation || config().cart.afterAdd === 'page' || !decorativeMotionAllowed()) return;
    const img = sourceImage(added.trigger);
    if (!img) return;
    // Capture the photo and its position now (a quick-add sheet may close, sections re-render),
    // and let the drawer finish opening before measuring where to land.
    const src = img.currentSrc || img.src;
    const from = img.getBoundingClientRect();
    const opensDrawer = config().cart.afterAdd === 'drawer' && !document.querySelector('#CartDrawer dialog[open]');
    window.setTimeout(() => fly(src, from), opensDrawer ? durations.overlayIn + 40 : 0);
  });
}
