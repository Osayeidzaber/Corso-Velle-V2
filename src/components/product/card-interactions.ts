import { t } from '../../core/config';
import { announce } from '../../services/announce';
import { cart, CartError } from '../../services/cart';
import { decorativeMotionAllowed } from '../../core/motion';

const prefetchedUrls = new Set<string>();
const MAX_PREFETCH = 8;
let installed = false;
let activeVideoCard: HTMLElement | null = null;
const videoAttempts = new WeakMap<HTMLElement, number>();
const pauseTimers = new WeakMap<HTMLElement, number>();
/** Quick-add buttons briefly show ✓ / ! ; keep the real label so a repeat click can't capture those. */
const quickAddLabels = new WeakMap<HTMLButtonElement, string>();
const quickAddTimers = new WeakMap<HTMLButtonElement, number>();
/** Matches the video curtain's clip-path transition in card.css. */
const CURTAIN_MS = 700;

/**
 * Video cards reveal one layer on hover: the video (card.css hides the second photo for them). The
 * curtain opens only once a real frame has been painted, and on leave the video keeps playing until
 * the curtain has closed, so it never slides away frozen and a quick re-entry just reverses it.
 * A video that cannot play marks the card data-video-failed, which leaves the primary photo visible.
 */
function stopCardVideo(card: HTMLElement, immediate = false): void {
  videoAttempts.set(card, (videoAttempts.get(card) ?? 0) + 1);
  card.removeAttribute('data-video-intent');
  card.removeAttribute('data-video-playing');
  if (activeVideoCard === card) activeVideoCard = null;
  const video = card.querySelector<HTMLVideoElement>('[data-card-video]');
  window.clearTimeout(pauseTimers.get(card));
  if (!video) return;
  if (immediate) video.pause();
  else pauseTimers.set(card, window.setTimeout(() => video.pause(), CURTAIN_MS));
}

function whenFramePainted(video: HTMLVideoElement, done: () => void): void {
  const withFrame = video as HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => number };
  // Without frame callbacks (Firefox), a resolved play() is the best "frames are flowing" signal.
  if (withFrame.requestVideoFrameCallback) withFrame.requestVideoFrameCallback(done);
  else done();
}

function startCardVideo(card: HTMLElement): void {
  const video = card.querySelector<HTMLVideoElement>('[data-card-video]');
  if (!video || card.hasAttribute('data-video-failed') || !decorativeMotionAllowed() || card.hasAttribute('data-video-intent')) return;
  if (activeVideoCard && activeVideoCard !== card) stopCardVideo(activeVideoCard);
  activeVideoCard = card;
  window.clearTimeout(pauseTimers.get(card));
  const attempt = (videoAttempts.get(card) ?? 0) + 1;
  videoAttempts.set(card, attempt);
  card.setAttribute('data-video-intent', '');
  const reveal = () => {
    if (videoAttempts.get(card) !== attempt) {
      // Playback started after the pointer had already left: nothing will show it, stop it now.
      if (!card.hasAttribute('data-video-intent')) video.pause();
      return;
    }
    if (card.isConnected && card.hasAttribute('data-video-intent') && decorativeMotionAllowed()) {
          card.setAttribute('data-video-playing', '');
    } else video.pause();
  };
  // Still playing from a moment ago (curtain closing): reverse the curtain straight away.
  if (!video.paused && video.readyState >= 2) {
    reveal();
    return;
  }
  void video.play().then(() => whenFramePainted(video, reveal)).catch(() => {
    if (videoAttempts.get(card) !== attempt) return;
    // An interrupted play() (we paused it) is not a failure; anything else is.
    if (video.error || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) card.setAttribute('data-video-failed', '');
    stopCardVideo(card, true);
  });
  if (!video.hasAttribute('data-error-watch')) {
    video.setAttribute('data-error-watch', '');
    video.addEventListener('error', () => {
      card.setAttribute('data-video-failed', '');
      stopCardVideo(card, true);
    });
  }
}

/**
 * Delegated product card interactions across all grids, tabs, search results, and recommendations:
 * 1. Quick-add size buttons ([data-quick-add-id]) -> cart.add() with busy/success/error states
 * 2. Option selection in a product drawer ([data-card-choose-options])
 * 3. Color swatches use normal variant links so pricing and inventory stay authoritative.
 * 4. Hover video play/pause ([data-card-video])
 * 5. Predictive product URL prefetching on pointer hover
 */
export function installCardInteractions(): void {
  if (installed) return;
  installed = true;

  document.addEventListener('click', (event) => {
    const target = event.target as Element | null;
    if (!target) return;

    const options = target.closest<HTMLElement>('[data-card-choose-options]');
    if (options) {
      const url = options.closest<HTMLElement>('.card')?.dataset.productUrl;
      if (url && !window.Shopify?.designMode) {
        event.preventDefault();
        void import('./quick-add').then(({ openQuickAdd }) => openQuickAdd(url, options));
      }
      return;
    }

    // 1. One-click Quick Add button
    const quickBtn = target.closest<HTMLButtonElement>('[data-quick-add-id], [data-quick-add]');
    if (quickBtn) {
      event.preventDefault();
      event.stopPropagation();
      void handleQuickAdd(quickBtn);
      return;
    }

  });

  // Hover video play/pause & predictive prefetch
  let hoverTimer = 0;

  document.addEventListener('pointerover', (event) => {
    const target = event.target as Element | null;
    if (!target) return;

    const card = target.closest<HTMLElement>('.card');
    if (!card) return;

    if (event.pointerType !== 'touch') startCardVideo(card);

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
    stopCardVideo(card);
  });
  // Keyboard focus only: a tap or click also focuses quick add, and must not start (or hold) the
  // video once the pointer has gone.
  document.addEventListener('focusin', (event) => {
    const target = event.target as Element;
    const card = target.closest<HTMLElement>('.card');
    if (card && target.matches(':focus-visible')) startCardVideo(card);
  });
  document.addEventListener('focusout', (event) => {
    const card = (event.target as Element).closest<HTMLElement>('.card');
    if (card && !card.contains(event.relatedTarget as Node | null)) stopCardVideo(card);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && activeVideoCard) stopCardVideo(activeVideoCard, true);
  });
  document.addEventListener('nk:motion:changed', () => {
    if (!decorativeMotionAllowed() && activeVideoCard) stopCardVideo(activeVideoCard, true);
  });
  const watchCards = installTouchReveal();
  new MutationObserver(() => {
    if (activeVideoCard && !activeVideoCard.isConnected) stopCardVideo(activeVideoCard, true);
    watchCards();
  }).observe(document.body, { childList: true, subtree: true });
}

/**
 * Phones and tablets have no hover, so the second photo a card shows on hover never appears.
 * There, a card shows it while it crosses the middle of the screen (data-in-view, card.css)
 * and returns to the first photo as it scrolls on. Returns the function that picks up new cards.
 */
function installTouchReveal(): () => void {
  const touch = typeof matchMedia === 'function' ? matchMedia('(hover: none)') : null;
  if (!touch || typeof IntersectionObserver !== 'function') return () => {};
  const watched = new WeakSet<Element>();
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const card = entry.target.closest<HTMLElement>('.card');
      card?.toggleAttribute('data-in-view', entry.isIntersecting && touch.matches && decorativeMotionAllowed());
    }
  }, { rootMargin: '-38% 0px -38% 0px' });
  const watch = () => {
    for (const media of document.querySelectorAll('.card .card__media--has-second')) {
      if (watched.has(media)) continue;
      watched.add(media);
      observer.observe(media);
    }
  };
  watch();
  // DOM changes come in bursts (carousels, filters); look for new cards once per frame.
  let frame = 0;
  return () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; watch(); }); };
}

async function handleQuickAdd(button: HTMLButtonElement): Promise<void> {
  if (button.disabled || button.hasAttribute('data-busy')) return;
  const variantId = Number(button.dataset.quickAddId || button.dataset.quickAdd);
  if (!variantId) return;

  if (!quickAddLabels.has(button)) quickAddLabels.set(button, button.textContent ?? '');
  const originalText = quickAddLabels.get(button)!;
  const settle = (state: 'data-added' | 'data-error', text: string, ms: number) => {
    button.setAttribute(state, '');
    button.textContent = text;
    quickAddTimers.set(button, window.setTimeout(() => {
      button.removeAttribute(state);
      button.textContent = originalText;
    }, ms));
  };
  window.clearTimeout(quickAddTimers.get(button));
  button.removeAttribute('data-added');
  button.removeAttribute('data-error');
  button.setAttribute('data-busy', '');
  button.disabled = true;
  button.textContent = '···';

  try {
    const quantity = Math.max(1, Number(button.dataset.quickAddQuantity) || 1);
    await cart.add([{ id: variantId, quantity }], 'quick-add');
    settle('data-added', '✓', 900);
  } catch (error) {
    settle('data-error', '!', 1400);
    const message = error instanceof CartError ? error.message : t('cart.error');
    announce.assertive(message);
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
