import { t } from '../../core/config';
import { NkElement } from '../../core/element';
import { announce } from '../../services/announce';
import { cart, CartError, type AddItem } from '../../services/cart';
import type { NkVariantPicker } from './variant-picker';

/**
 * <nk-product-form> wraps Shopify's `{% form 'product' %}` (master-plan/08 PR-05, 09 CA-01).
 *
 * Without JS the form posts to /cart/add normally. With JS:
 * - an incomplete selection never submits: focus moves to the first unchosen option group;
 * - while the picker is resolving, or the resolved id doesn't match the form's id, submit is blocked;
 * - one submission at a time (double clicks are ignored);
 * - the outcome comes from the cart service; ambiguous failures are reconciled, never re-sent.
 */
export class NkProductForm extends NkElement {
  #submitting = false;

  protected mount(): void {
    const form = this.querySelector<HTMLFormElement>('form');
    if (!form) return;
    this.on(form, 'submit', (event) => {
      event.preventDefault();
      void this.#submit(form, event.submitter as HTMLButtonElement | null);
    });
    this.on(this, 'click', (event) => {
      const step = (event.target as Element).closest<HTMLButtonElement>('[data-qty-step]');
      if (step) this.#stepQuantity(step);
    });
    const section = this.closest('[data-product-section]');
    if (section) {
      this.on(section, 'nk:variant:changed', (event) => {
        this.#reflectState((event as CustomEvent<{ state: string }>).detail.state);
      });
      const picker = this.#picker();
      if (picker) this.#reflectState(picker.state);
    }
  }

  /** ± buttons honour the quantity rule (min / max / increment) rendered on the input. */
  #stepQuantity(button: HTMLButtonElement): void {
    const input = button.closest('.quantity')?.querySelector<HTMLInputElement>('input[name="quantity"]');
    if (!input) return;
    const step = Number(input.step) || 1;
    const min = Number(input.min) || 1;
    const max = input.max ? Number(input.max) : Number.POSITIVE_INFINITY;
    const current = Number(input.value) || min;
    const next = Math.min(max, Math.max(min, current + step * Number(button.dataset.qtyStep)));
    if (next === current) return;
    input.value = String(next);
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /** Button label/disabled for states Liquid can't express (explicit choice, missing combination). */
  #reflectState(state: string): void {
    const button = this.querySelector<HTMLButtonElement>('[data-region="buy"] button[type="submit"]');
    const label = button?.querySelector<HTMLElement>('[data-button-label]');
    if (!button || !label) return;
    label.classList.toggle('nk-text-wave', state === 'resolving');
    if (state === 'resolving') {
      label.textContent = t('product.updating');
    } else if (state === 'incomplete') {
      const name = this.#picker()?.firstIncomplete()?.dataset.optionName ?? '';
      label.textContent = t('product.choose_named_option', { option: name });
      button.disabled = false; // clicking explains what is missing
    } else if (state === 'unavailable') {
      label.textContent = t('product.unavailable');
      button.disabled = true;
    }
  }

  #picker(): NkVariantPicker | null {
    const section = this.closest('[data-product-section]');
    return section?.querySelector<NkVariantPicker>('nk-variant-picker') ?? null;
  }

  async #submit(form: HTMLFormElement, submitter: HTMLButtonElement | null): Promise<void> {
    if (this.#submitting) return;
    this.#clearError();

    const picker = this.#picker();
    if (picker) {
      if (picker.state === 'incomplete') {
        const fieldset = picker.firstIncomplete();
        const name = fieldset?.dataset.optionName ?? '';
        fieldset?.querySelector<HTMLInputElement>('input[type="radio"]')?.focus();
        this.#showError(t('product.choose_named_option', { option: name }));
        return;
      }
      if (picker.state !== 'available') return; // resolving, sold out, unavailable, failed
    }

    const data = new FormData(form);
    const id = Number(data.get('id'));
    if (!id || (picker && String(id) !== picker.resolvedVariantId)) return;

    const quantity = Math.max(1, Number(data.get('quantity') ?? 1));
    const properties: Record<string, string> = {};
    for (const [key, value] of data.entries()) {
      const match = /^properties\[(.+)\]$/.exec(key);
      if (match?.[1] && typeof value === 'string' && value !== '') properties[match[1]] = value;
    }
    const item: AddItem = { id, quantity };
    if (Object.keys(properties).length) item.properties = properties;
    const sellingPlan = Number(data.get('selling_plan'));
    if (sellingPlan) item.selling_plan = sellingPlan;

    this.#setPending(true, submitter);
    try {
      await cart.add([item], this.dataset.sourceId ?? this.id ?? 'product-form');
    } catch (error) {
      const message =
        error instanceof CartError
          ? error.kind === 'unknown'
            ? t('cart.add_unconfirmed')
            : error.kind === 'not-applied'
              ? t('cart.add_not_applied')
              : error.message
          : t('cart.error');
      this.#showError(message);
    } finally {
      this.#setPending(false, submitter);
    }
  }

  #setPending(pending: boolean, submitter: HTMLButtonElement | null): void {
    this.#submitting = pending;
    this.toggleAttribute('data-pending', pending);
    const button = submitter ?? this.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (!button) return;
    button.setAttribute('aria-busy', String(pending));
    const label = button.querySelector<HTMLElement>('[data-button-label]');
    if (label) {
      if (pending) {
        label.dataset.idleLabel = label.textContent ?? '';
        label.textContent = t('product.adding');
      } else if (label.dataset.idleLabel !== undefined) {
        label.textContent = label.dataset.idleLabel;
      }
    }
  }

  #showError(message: string): void {
    const region = this.closest('[data-product-section]')?.querySelector<HTMLElement>('[data-form-error]');
    if (!region) return;
    region.textContent = message;
    region.hidden = false;
    announce.assertive(message);
  }

  #clearError(): void {
    const region = this.closest('[data-product-section]')?.querySelector<HTMLElement>('[data-form-error]');
    if (region) {
      region.hidden = true;
      region.textContent = '';
    }
  }
}
