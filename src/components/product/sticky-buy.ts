import { t } from '../../core/config';
import { NkElement } from '../../core/element';
import type { NkVariantPicker } from './variant-picker';

/**
 * <nk-sticky-buy> — Mobile & compact sticky purchase bar that appears when the primary
 * product form scrolls out of view above the viewport. Synchronizes variant title, price,
 * availability, and incomplete-selection prompts with <nk-variant-picker> and <nk-product-form>.
 */
export class NkStickyBuy extends NkElement {
  protected mount(): void {
    const section = this.closest<HTMLElement>('[data-product-section]');
    if (!section) return;

    const formEl = section.querySelector<HTMLElement>('nk-product-form');
    if (formEl) {
      this.observeIntersection(
        formEl,
        (entry) => {
          const passedBuyArea = !entry.isIntersecting && entry.boundingClientRect.bottom < 80;
          if (passedBuyArea) {
            this.hidden = false;
            this.setAttribute('data-visible', '');
          } else {
            this.removeAttribute('data-visible');
          }
        },
        { threshold: 0 },
      );
    }

    this.on(section, 'nk:variant:changed', (event) => {
      const detail = (event as CustomEvent<{ state: string }>).detail;
      this.#sync(section, detail?.state);
    });

    const cta = this.querySelector<HTMLButtonElement>('[data-sticky-cta]');
    if (cta) {
      this.on(cta, 'click', () => {
        const picker = section.querySelector<NkVariantPicker>('nk-variant-picker');
        if (picker && picker.state === 'incomplete') {
          const incompleteFieldset = picker.firstIncomplete();
          incompleteFieldset?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          incompleteFieldset?.querySelector<HTMLInputElement>('input[type="radio"]')?.focus();
          return;
        }
        const form = section.querySelector<HTMLFormElement>('nk-product-form form');
        form?.requestSubmit();
      });
    }

    const picker = section.querySelector<NkVariantPicker>('nk-variant-picker');
    this.#sync(section, picker?.state ?? 'available');
  }

  #sync(section: HTMLElement, state: string): void {
    const buyRegion = section.querySelector<HTMLElement>('[data-region="buy"]');
    const cta = this.querySelector<HTMLButtonElement>('[data-sticky-cta]');
    const labelEl = this.querySelector<HTMLElement>('[data-sticky-label]');
    const variantEl = this.querySelector<HTMLElement>('[data-sticky-variant]');
    const priceEl = this.querySelector<HTMLElement>('[data-sticky-price]');

    if (buyRegion) {
      if (variantEl && buyRegion.dataset.variantTitle) {
        variantEl.textContent = buyRegion.dataset.variantTitle;
      }
      if (priceEl && buyRegion.dataset.variantPrice) {
        priceEl.textContent = buyRegion.dataset.variantPrice;
      }
    }

    if (!cta || !labelEl) return;

    if (state === 'resolving') {
      labelEl.textContent = t('product.updating');
      cta.disabled = true;
    } else if (state === 'incomplete') {
      const picker = section.querySelector<NkVariantPicker>('nk-variant-picker');
      const optName = picker?.firstIncomplete()?.dataset.optionName ?? 'Size';
      labelEl.textContent = t('product.choose_named_option', { option: optName });
      cta.disabled = false;
      if (variantEl) variantEl.textContent = t('product.select_size_prompt') || 'Select size';
    } else if (state === 'sold-out') {
      labelEl.textContent = t('product.sold_out');
      cta.disabled = true;
    } else if (state === 'unavailable') {
      labelEl.textContent = t('product.unavailable');
      cta.disabled = true;
    } else {
      const mainLabel = section.querySelector<HTMLElement>('[data-region="buy"] [data-button-label]')?.textContent?.trim();
      labelEl.textContent = mainLabel || t('product.add_to_cart');
      cta.disabled = false;
    }
  }
}
