/**
 * Shared overlay manager (master-plan/06 N-06).
 *
 * Every major overlay (menu drawer, search, quick add, size guide, cart, filters, zoom) is a
 * native <dialog> opened with showModal(), which gives inert background, focus containment, the
 * top layer and Escape for free. This service adds what <dialog> doesn't:
 *  - only one overlay at a time (opening another closes the current one first);
 *  - one scroll lock with scroll position restore;
 *  - focus return to the trigger, or a documented fallback if the trigger is gone;
 *  - self-healing when the dialog is removed by a section re-render.
 */
export interface OpenOptions {
  trigger?: HTMLElement | null;
  /** Close when the backdrop (the dialog box itself, outside its content) is clicked. */
  lightDismiss?: boolean;
  onClose?: () => void;
  /** Element to focus after opening; defaults to [data-autofocus] or the dialog. */
  initialFocus?: HTMLElement | null;
}

interface Active {
  dialog: HTMLDialogElement;
  options: OpenOptions;
  controller: AbortController;
  observer: MutationObserver;
}

let active: Active | null = null;
let savedScroll = 0;

function lockScroll(): void {
  savedScroll = window.scrollY;
  document.documentElement.classList.add('nk-locked');
  document.documentElement.style.setProperty('--nk-scrollbar', `${window.innerWidth - document.documentElement.clientWidth}px`);
}

function unlockScroll(): void {
  document.documentElement.classList.remove('nk-locked');
  document.documentElement.style.removeProperty('--nk-scrollbar');
  if (Math.abs(window.scrollY - savedScroll) > 1) window.scrollTo({ top: savedScroll, behavior: 'instant' });
}

function returnFocus(trigger: HTMLElement | null | undefined): void {
  if (trigger?.isConnected) {
    trigger.focus({ preventScroll: true });
    return;
  }
  const fallback = document.querySelector<HTMLElement>('[data-focus-fallback]') ?? document.querySelector<HTMLElement>('main');
  if (fallback) {
    if (!fallback.hasAttribute('tabindex')) fallback.setAttribute('tabindex', '-1');
    fallback.focus({ preventScroll: true });
  }
}

function teardown(restoreFocus: boolean): void {
  if (!active) return;
  const { options, controller, observer } = active;
  active = null;
  controller.abort();
  observer.disconnect();
  unlockScroll();
  if (restoreFocus) returnFocus(options.trigger);
  options.onClose?.();
  document.dispatchEvent(new CustomEvent('nk:overlay:closed'));
}

export const overlay = {
  get current(): HTMLDialogElement | null {
    return active?.dialog ?? null;
  },

  isOpen(dialog: HTMLDialogElement): boolean {
    return active?.dialog === dialog;
  },

  open(dialog: HTMLDialogElement, options: OpenOptions = {}): void {
    if (active?.dialog === dialog) return;
    if (active) overlay.close(active.dialog, { restoreFocus: false });

    const controller = new AbortController();
    // Self-heal: if a section re-render removes the dialog, release lock and focus.
    const observer = new MutationObserver(() => {
      if (!dialog.isConnected) teardown(true);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    active = { dialog, options, controller, observer };
    dialog.addEventListener('close', () => teardown(true), { signal: controller.signal, once: true });
    if (options.lightDismiss !== false) {
      dialog.addEventListener(
        'click',
        (event) => {
          if (event.target === dialog) overlay.close(dialog);
        },
        { signal: controller.signal },
      );
    }
    window.addEventListener('pagehide', () => overlay.close(dialog), { signal: controller.signal });

    lockScroll();
    if (!dialog.open) dialog.showModal();
    const focusTarget = options.initialFocus ?? dialog.querySelector<HTMLElement>('[data-autofocus]');
    focusTarget?.focus();
    document.dispatchEvent(new CustomEvent('nk:overlay:opened', { detail: { id: dialog.id } }));
  },

  close(dialog: HTMLDialogElement, { restoreFocus = true } = {}): void {
    if (active?.dialog !== dialog) {
      if (dialog.open) dialog.close();
      return;
    }
    active.controller.abort(); // detach the 'close' listener so teardown runs exactly once
    if (dialog.open) dialog.close();
    teardown(restoreFocus);
  },

  closeAll(): void {
    if (active) overlay.close(active.dialog);
  },
};
