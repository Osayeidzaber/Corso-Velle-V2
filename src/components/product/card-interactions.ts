import { t } from '../../core/config';
import { announce } from '../../services/announce';
import { cart, CartError } from '../../services/cart';

const prefetchedUrls = new Set<string>();
const MAX_PREFETCH = 8;
let installed = false;

/**
 * Delegated product card interactions across all grids, tabs, search results, and recommendations:
 * 1. Quick-add size buttons ([data-quick-add-id]) -> cart.add() with busy/success/error states
 * 2. Touch/mobile quick-add tray toggle ([data-card-quick-toggle])
 * 3. Color swatch image preview ([data-card-swatch-img])
 * 4. Hover video play/pause ([data-card-video])
 * 5. Predictive product URL prefetching on pointer hover
 */
export function installCardInteractions(): void {
  if (installed) return;
  installed = true;

  document.addEventListener('click', (event) => {
    const target = event.target as Element | null;
    if (!target) return;

    // 1. One-click Quick Add button
    const quickBtn = target.closest<HTMLButtonElement>('[data-quick-add-id], [data-quick-add]');
    if (quickBtn) {
      event.preventDefault();
      event.stopPropagation();
      void handleQuickAdd(quickBtn);
      return;
    }

    // 2. Mobile / touch Quick-Add tray toggle
    const toggleBtn = target.closest<HTMLButtonElement>('[data-card-quick-toggle]');
    if (toggleBtn) {
      event.preventDefault();
      event.stopPropagation();
      const card = toggleBtn.closest<HTMLElement>('[data-product-card], .card');
      if (!card) return;
      const isOpen = card.hasAttribute('data-tray-open');
      closeAllCardTrays(card);
      card.toggleAttribute('data-tray-open', !isOpen);
      toggleBtn.setAttribute('aria-expanded', String(!isOpen));
      return;
    }

    // 3. Color swatch preview button
    const swatchBtn = target.closest<HTMLButtonElement>('.card__swatch');
    if (swatchBtn) {
      event.preventDefault();
      applyCardSwatch(swatchBtn);
      return;
    }

    // Close open mobile trays when tapping outside
    if (!target.closest('[data-card-tray], .card__tray')) {
      closeAllCardTrays();
    }
  });

  // Hover video play/pause & predictive prefetch
  let hoverTimer = 0;

  document.addEventListener('pointerover', (event) => {
    const target = event.target as Element | null;
    if (!target) return;

    const swatchBtn = target.closest<HTMLButtonElement>('.card__swatch[data-card-swatch-img], .card__swatch[data-swatch-src]');
    if (swatchBtn) {
      applyCardSwatch(swatchBtn);
    }

    const card = target.closest<HTMLElement>('.card');
    if (!card) return;

    const video = card.querySelector<HTMLVideoElement>('video[data-card-video]');
    if (video && video.paused) {
      card.setAttribute('data-video-playing', '');
      void video.play().catch(() => {
        card.removeAttribute('data-video-playing');
      });
    }

    const productUrl = card.dataset.productUrl;
    if (productUrl && !prefetchedUrls.has(productUrl) && prefetchedUrls.size < MAX_PREFETCH) {
      window.clearTimeout(hoverTimer);
      hoverTimer = window.setTimeout(() => {
        prefetchProductUrl(productUrl);
      }, 140);
    }
  });

  document.addEventListener('pointerout', (event) => {
    const target = event.target as Element | null;
    if (!target) return;
    const card = target.closest<HTMLElement>('.card');
    if (!card) return;
    const related = (event as PointerEvent).relatedTarget as Node | null;
    if (related && card.contains(related)) return;

    window.clearTimeout(hoverTimer);
    const video = card.querySelector<HTMLVideoElement>('video[data-card-video]');
    if (video && !video.paused) {
      video.pause();
      card.removeAttribute('data-video-playing');
    }
  });
}

function closeAllCardTrays(except?: HTMLElement): void {
  for (const openCard of document.querySelectorAll<HTMLElement>('.card[data-tray-open]')) {
    if (openCard === except) continue;
    openCard.removeAttribute('data-tray-open');
    openCard.querySelector('[data-card-quick-toggle]')?.setAttribute('aria-expanded', 'false');
  }
}

function applyCardSwatch(swatchBtn: HTMLButtonElement): void {
  const card = swatchBtn.closest<HTMLElement>('.card');
  if (!card) return;
  for (const s of card.querySelectorAll('.card__swatch')) {
    const active = s === swatchBtn;
    s.classList.toggle('is-active', active);
    s.setAttribute('aria-pressed', String(active));
  }
  const imgUrl = swatchBtn.dataset.cardSwatchImg || swatchBtn.dataset.swatchSrc;
  const primaryImg = card.querySelector<HTMLImageElement>('[data-card-primary-img], .card__media > img:first-child');
  if (imgUrl && primaryImg) {
    primaryImg.removeAttribute('srcset');
    primaryImg.src = imgUrl;
  }
  const nextUrl = swatchBtn.dataset.swatchUrl;
  if (nextUrl) {
    for (const link of card.querySelectorAll<HTMLAnchorElement>('a[data-card-link], a.card__media, a.card__title')) {
      link.href = nextUrl;
    }
  }
}

async function handleQuickAdd(button: HTMLButtonElement): Promise<void> {
  if (button.hasAttribute('data-busy')) return;
  const variantId = Number(button.dataset.quickAddId || button.dataset.quickAdd);
  if (!variantId) return;

  const originalText = button.textContent ?? '';
  button.setAttribute('data-busy', '');
  button.disabled = true;
  button.textContent = '···';

  try {
    await cart.add([{ id: variantId, quantity: 1 }], 'quick-add');
    button.setAttribute('data-added', '');
    button.textContent = '✓';
    const card = button.closest<HTMLElement>('.card');
    window.setTimeout(() => {
      button.removeAttribute('data-added');
      button.textContent = originalText;
      card?.removeAttribute('data-tray-open');
      card?.querySelector('[data-card-quick-toggle]')?.setAttribute('aria-expanded', 'false');
    }, 900);
  } catch (error) {
    button.setAttribute('data-error', '');
    button.textContent = '!';
    const message = error instanceof CartError ? error.message : t('cart.error');
    announce.assertive(message);
    window.setTimeout(() => {
      button.removeAttribute('data-error');
      button.textContent = originalText;
    }, 1400);
  } finally {
    button.removeAttribute('data-busy');
    button.disabled = false;
  }
}

function prefetchProductUrl(url: string): void {
  if (prefetchedUrls.has(url)) return;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData) return;
  prefetchedUrls.add(url);
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  document.head.appendChild(link);
}

/** Reset state in unit tests. */
export function resetCardInteractionsForTests(): void {
  prefetchedUrls.clear();
}
