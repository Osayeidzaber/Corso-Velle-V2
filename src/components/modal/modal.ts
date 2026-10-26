import { NkElement } from '../../core/element';
import { overlay } from '../../services/overlay';

/**
 * <nk-modal> wraps one <dialog> and routes it through the overlay service.
 *
 * Triggers anywhere on the page: `<a href="/cart" data-nk-open="CartDrawer">` keeps working as
 * a normal link without JS (or if the modal failed to load); with JS the click opens the modal.
 * Inside the dialog, any `[data-nk-close]` closes it.
 */
export class NkModal extends NkElement {
  protected dialog!: HTMLDialogElement;

  protected mount(): void {
    const dialog = this.querySelector<HTMLDialogElement>(':scope > dialog');
    if (!dialog) throw new Error(`<nk-modal id="${this.id}"> needs a direct <dialog> child`);
    this.dialog = dialog;
    this.on(this.dialog, 'click', (event) => {
      if ((event.target as Element).closest('[data-nk-close]')) this.close();
    });
    this.dispose(() => {
      if (overlay.isOpen(this.dialog)) overlay.close(this.dialog, { restoreFocus: false });
    });
    if (dialog.hasAttribute('data-swipe-close')) this.#installSwipeClose(dialog);
  }

  /**
   * Bottom sheets (phones): dragging the [data-drag-handle] area down follows the finger and
   * closes past a distance or flick threshold; otherwise the sheet springs back.
   */
  #installSwipeClose(dialog: HTMLDialogElement): void {
    const sheetQuery = matchMedia('(max-width: 749px)');
    let pointerId: number | null = null;
    let startY = 0;
    let startTime = 0;
    let offset = 0;

    const release = (event: PointerEvent): void => {
      if (event.pointerId !== pointerId) return;
      pointerId = null;
      dialog.style.removeProperty('transition');
      const velocity = offset / Math.max(1, performance.now() - startTime);
      const shouldClose = event.type === 'pointerup' && (offset > dialog.offsetHeight * 0.25 || (offset > 24 && velocity > 0.5));
      // Clearing the inline offset lets the CSS transition carry the sheet from where the finger
      // left it, either back to rest or out through the close transition.
      dialog.style.removeProperty('translate');
      offset = 0;
      if (shouldClose) this.close();
    };

    this.on(dialog, 'pointerdown', (event) => {
      if (!sheetQuery.matches || event.button !== 0 || !(event.target as Element).closest('[data-drag-handle]')) return;
      if ((event.target as Element).closest('button, a, input')) return;
      pointerId = event.pointerId;
      startY = event.clientY;
      startTime = performance.now();
      offset = 0;
      (event.target as Element).setPointerCapture?.(event.pointerId);
      dialog.style.setProperty('transition', 'none');
    });
    this.on(dialog, 'pointermove', (event) => {
      if (event.pointerId !== pointerId) return;
      offset = Math.max(0, event.clientY - startY);
      dialog.style.setProperty('translate', `0 ${offset}px`);
    });
    this.on(dialog, 'pointerup', release);
    this.on(dialog, 'pointercancel', release);
  }

  get isOpen(): boolean {
    return overlay.isOpen(this.dialog);
  }

  open(trigger?: HTMLElement | null): void {
    trigger?.setAttribute('aria-expanded', 'true');
    overlay.open(this.dialog, {
      trigger: trigger ?? null,
      lightDismiss: this.dataset.lightDismiss !== 'false',
      onClose: () => {
        trigger?.setAttribute('aria-expanded', 'false');
        this.onClosed();
      },
    });
    this.onOpened();
  }

  close(): void {
    overlay.close(this.dialog);
  }

  protected onOpened(): void {}
  protected onClosed(): void {}
}

let delegated = false;

/** One document-level listener for all [data-nk-open] triggers (survives section re-renders). */
export function installModalTriggers(): void {
  if (delegated) return;
  delegated = true;
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
    const trigger = (event.target as Element).closest<HTMLElement>('[data-nk-open]');
    if (!trigger) return;
    const modal = document.getElementById(trigger.dataset.nkOpen!);
    if (!(modal instanceof NkModal)) return; // let the link navigate
    event.preventDefault();
    modal.open(trigger);
  });
}
