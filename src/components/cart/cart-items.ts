import { t } from '../../core/config';
import { NkElement } from '../../core/element';
import { announce } from '../../services/announce';
import { cart, CartError } from '../../services/cart';

/**
 * <nk-cart-items> — quantity steppers, quantity inputs and remove buttons for cart lines, shared
 * by the drawer and the cart page. Lines carry data-line-key; changes go
 * through the cart queue so rapid taps collapse to the latest absolute quantity.
 *
 * Without JS the same markup is a normal cart form (updates[] inputs + remove links).
 */
export class NkCartItems extends NkElement {
  protected mount(): void {
    this.on(this, 'click', (event) => {
      const target = event.target as Element;
      const step = target.closest<HTMLButtonElement>('[data-qty-step]');
      const remove = target.closest<HTMLElement>('[data-line-remove]');
      if (step) {
        event.preventDefault();
        const input = this.#inputFor(step);
        if (!input) return;
        // Steps follow the variant's quantity rule increment (rendered as the input's step).
        const increment = Number(input.step) || 1;
        const min = Number(input.dataset.quantityMin) || 1;
        const max = input.max ? Number(input.max) : Infinity;
        const candidate = Number(input.value || 0) + increment * Number(step.dataset.qtyStep);
        const next = candidate < min ? (Number(step.dataset.qtyStep) < 0 ? 0 : min) : Math.min(max, candidate);
        input.value = String(next);
        this.#change(step, next);
      } else if (remove) {
        event.preventDefault();
        this.#change(remove, 0);
      }
    });
    this.on(this, 'change', (event) => {
      const note = (event.target as Element).closest<HTMLTextAreaElement>('textarea[data-cart-note]');
      if (note) {
        void cart.note(note.value, this.id || 'cart-note').catch(() => this.#showError(this, t('cart.error')));
        return;
      }
      const input = (event.target as Element).closest<HTMLInputElement>('input[data-qty-input]');
      if (!input) return;
      const value = Number(input.value);
      const min = Number(input.dataset.quantityMin) || 1;
      if (!input.value.trim() || !Number.isInteger(value) || value < 0 || (value !== 0 && value < min) || !input.reportValidity()) {
        input.value = input.defaultValue;
        return;
      }
      this.#change(input, value);
    });
    this.on(this, 'submit', (event) => {
      if (cart.pending || this.querySelector('[data-cart-stale]')) event.preventDefault();
    });
  }

  #inputFor(element: Element): HTMLInputElement | null {
    return element.closest('[data-line-key]')?.querySelector<HTMLInputElement>('input[data-qty-input]') ?? null;
  }

  #change(element: Element, quantity: number): void {
    const line = element.closest<HTMLElement>('[data-line-key]');
    const key = line?.dataset.lineKey;
    if (!line || !key) return;
    line.setAttribute('aria-busy', 'true');
    this.#clearError(line);
    cart.change(key, quantity, this.id || 'cart-items').then(
      () => {
        if (quantity === 0) announce.polite(t('cart.removed'));
      },
      (error: unknown) => {
        const message = error instanceof CartError && error.kind !== 'unknown' ? error.message : t('cart.error');
        // Re-sync the lines with the server first (the input shows the rejected value), then
        // show the error on the freshly rendered line — or at list level if the line is gone.
        void cart
          .refresh('cart-items')
          .catch(() => {})
          .finally(() => {
            const current = this.querySelector<HTMLElement>(`[data-line-key="${CSS.escape(key)}"]`);
            current?.removeAttribute('aria-busy');
            this.#showError(current ?? this, message);
          });
      },
    );
  }

  #showError(scope: HTMLElement, message: string): void {
    const region = scope.querySelector<HTMLElement>('[data-line-error], [data-cart-error]');
    if (!region) return;
    region.textContent = message;
    region.hidden = false;
    announce.assertive(message);
  }

  #clearError(line: HTMLElement): void {
    const region = line.querySelector<HTMLElement>('[data-line-error]');
    if (region) {
      region.textContent = '';
      region.hidden = true;
    }
  }
}
