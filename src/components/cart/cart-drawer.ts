import { config, t } from '../../core/config';
import { announce } from '../../services/announce';
import type { CartResult } from '../../services/cart';
import { NkModal } from '../modal/modal';

/**
 * <nk-cart-drawer> (master-plan/09 CA-02). Opening never mutates the cart. After a successful
 * add from a product form it opens (when the merchant chose "drawer") and announces the result.
 * Its contents are a cart section region refreshed by the cart renderer.
 */
export class NkCartDrawer extends NkModal {
  protected override mount(): void {
    super.mount();
    this.on(document, 'nk:cart:updated', (event) => {
      const detail = (event as CustomEvent<CartResult & { kind: string; sourceId: string }>).detail;
      if (detail.kind !== 'add') return;
      announce.polite(t('cart.added'));
      if (config().cart.afterAdd === 'drawer' && !this.isOpen) {
        // Wait one frame so the renderer has swapped in the new lines.
        this.later(() => this.open(document.querySelector<HTMLElement>(`[data-nk-open="${this.id}"]`)), 0);
      }
      if (config().cart.afterAdd === 'page') location.assign(config().routes.cart);
    });
    this.on(document, 'nk:cart:pending', (event) => {
      this.toggleAttribute('data-pending', (event as CustomEvent<{ pending: boolean }>).detail.pending);
    });
  }

  protected override onOpened(): void {
    this.dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();
  }
}
