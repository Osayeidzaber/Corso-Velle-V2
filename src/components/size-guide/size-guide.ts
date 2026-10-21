import { define } from '../../core/define';
import { NkElement } from '../../core/element';

const CM_PER_INCH = 2.54;

/**
 * <nk-size-guide unit="in"> — switches a size table between inches and centimetres and
 * highlights the row for the size currently chosen in the variant picker. Cells carry their
 * base value in [data-value]; the table reads fine without JS in the unit it was entered in.
 */
export class NkSizeGuide extends NkElement {
  #base: 'in' | 'cm' = 'in';

  protected mount(): void {
    this.#base = this.getAttribute('unit') === 'cm' ? 'cm' : 'in';
    for (const button of this.refs<HTMLButtonElement>('unit')) {
      button.hidden = false;
      this.on(button, 'click', () => this.#show(button.value === 'cm' ? 'cm' : 'in'));
    }
    this.#show(this.#base);
    this.#highlight();
    this.on(document, 'change', (event) => {
      if ((event.target as Element | null)?.closest('nk-variant-picker')) this.#highlight();
    });
    // The picker region is re-rendered after each choice; re-read once it settles.
    this.on(document, 'nk:variant:changed', () => this.#highlight());
  }

  #show(unit: 'in' | 'cm'): void {
    for (const cell of this.querySelectorAll<HTMLElement>('[data-value]')) {
      const value = Number.parseFloat(cell.dataset.value ?? '');
      if (Number.isNaN(value)) continue;
      let shown = value;
      if (unit !== this.#base) shown = unit === 'cm' ? value * CM_PER_INCH : value / CM_PER_INCH;
      cell.textContent = String(Math.round(shown * 10) / 10);
    }
    for (const button of this.refs<HTMLButtonElement>('unit')) {
      button.setAttribute('aria-pressed', String(button.value === unit));
    }
  }

  #highlight(): void {
    const fieldset = document.querySelector<HTMLElement>(`nk-variant-picker fieldset[data-option-name="${this.getAttribute('option') ?? 'Size'}"]`);
    const chosen = fieldset?.querySelector<HTMLInputElement>('input:checked')?.value.trim().toLowerCase();
    for (const row of this.querySelectorAll<HTMLElement>('[data-size-row]')) {
      row.toggleAttribute('data-current', !!chosen && row.dataset.sizeRow?.trim().toLowerCase() === chosen);
    }
  }
}

define('nk-size-guide', NkSizeGuide);
