import { transitionsAllowed } from '../../core/motion';

/**
 * Animated price change when the variant changes. The price region is still replaced with
 * Shopify's freshly rendered HTML (no client-side pricing); this only animates between the old and
 * new text: the old amount rolls up and out, the new one rolls in, a compare-at strikethrough draws
 * itself and the saving badge settles in.
 *
 * Purchase-path motion stays short (≤ 320ms) and is skipped entirely when transitions are off.
 */

export interface PriceSnapshot {
  current: string;
  compare: string;
  html: string;
}

const DURATION = 320;
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

const textOf = (root: ParentNode, selector: string) => root.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

/** The visible price before the region is replaced. */
export function snapshotPrice(section: ParentNode): PriceSnapshot | null {
  const price = section.querySelector<HTMLElement>('[data-region="price"] .product__price');
  if (!price) return null;
  return { current: textOf(price, '.price__current'), compare: textOf(price, '.price__compare'), html: price.innerHTML };
}

/** Animate from `before` to whatever the (already replaced) price region now shows. */
export function playPriceTransition(section: ParentNode, before: PriceSnapshot | null): void {
  const price = section.querySelector<HTMLElement>('[data-region="price"] .product__price');
  if (!price || !before || !transitionsAllowed() || typeof price.animate !== 'function') return;
  const current = price.querySelector<HTMLElement>('.price__current');
  const nowCurrent = textOf(price, '.price__current');
  const nowCompare = textOf(price, '.price__compare');
  if (!current || (nowCurrent === before.current && nowCompare === before.compare)) return;

  if (nowCurrent !== before.current) {
    // A ghost of the old price rolls out on top of the new one, inside a clipped wrapper so the
    // movement reads as a counter rather than a jump.
    const ghost = document.createElement('span');
    ghost.className = 'price-ghost';
    ghost.setAttribute('aria-hidden', 'true');
    ghost.innerHTML = before.html;
    price.append(ghost);
    const out = ghost.animate(
      [{ transform: 'translateY(0)', opacity: 1, filter: 'blur(0)' }, { transform: 'translateY(-55%)', opacity: 0, filter: 'blur(2px)' }],
      { duration: DURATION * 0.8, easing: EASE, fill: 'forwards' },
    );
    const remove = () => ghost.remove();
    out.addEventListener('finish', remove, { once: true });
    out.addEventListener('cancel', remove, { once: true });
    current.animate(
      [{ transform: 'translateY(55%)', opacity: 0, filter: 'blur(2px)' }, { transform: 'translateY(0)', opacity: 1, filter: 'blur(0)' }],
      { duration: DURATION, easing: EASE, delay: 40, fill: 'backwards' },
    );
  }

  const compare = price.querySelector<HTMLElement>('.price__compare');
  if (compare && nowCompare !== before.compare) {
    compare.animate([{ opacity: 0 }, { opacity: 1 }], { duration: DURATION * 0.6, easing: EASE, delay: 60, fill: 'backwards' });
    // The strikethrough is a background line (product.css); drawing it is a size change.
    compare.animate(
      [{ backgroundSize: '0% 1px' }, { backgroundSize: '100% 1px' }],
      { duration: DURATION, easing: EASE, delay: 140, fill: 'backwards' },
    );
  }

  const saving = price.querySelector<HTMLElement>('.price__saving');
  if (saving && nowCompare !== before.compare) {
    saving.animate(
      [{ transform: 'scale(0.82)', opacity: 0 }, { transform: 'scale(1.06)', opacity: 1, offset: 0.7 }, { transform: 'scale(1)', opacity: 1 }],
      { duration: DURATION, easing: EASE, delay: 200, fill: 'backwards' },
    );
  }
}
