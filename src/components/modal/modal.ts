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
