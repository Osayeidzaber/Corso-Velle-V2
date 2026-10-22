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
    let initialUnit = this.#base;
    try {
      const saved = sessionStorage.getItem('nk:measure-unit');
      if (saved === 'in' || saved === 'cm') initialUnit = saved;
    } catch {
      // ignore
    }
    for (const button of this.refs<HTMLButtonElement>('unit')) {
      button.hidden = false;
      this.on(button, 'click', () => {
        const nextUnit = button.value === 'cm' ? 'cm' : 'in';
        this.#show(nextUnit, true);
      });
    }
    this.#show(initialUnit, false);
    this.#highlight();
    this.on(document, 'change', (event) => {
      if ((event.target as Element | null)?.closest('nk-variant-picker')) this.#highlight();
    });
    this.on(document, 'nk:variant:changed', () => this.#highlight());
    this.on(document, 'nk:unit:changed', (event) => {
      const detail = (event as CustomEvent<{ unit: 'in' | 'cm'; source?: Element }>).detail;
      if (detail?.source !== this && (detail?.unit === 'in' || detail?.unit === 'cm')) {
        this.#show(detail.unit, false);
      }
    });
  }

  #show(unit: 'in' | 'cm', broadcast = false): void {
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
    if (broadcast) {
      try {
        sessionStorage.setItem('nk:measure-unit', unit);
      } catch {
        // ignore
      }
      this.emit('nk:unit:changed', { unit, source: this });
    }
  }

  #highlight(): void {
    const scope = this.closest('[data-product-section]') ?? document;
    const optionName = (this.getAttribute('option') ?? 'Size').trim().toLowerCase();
    const fieldset = [...scope.querySelectorAll<HTMLElement>('nk-variant-picker fieldset[data-option-name]')].find(
      (el) => el.dataset.optionName?.trim().toLowerCase() === optionName,
    );
    const chosen = fieldset?.querySelector<HTMLInputElement>('input:checked')?.value.trim().toLowerCase();
    for (const row of this.querySelectorAll<HTMLElement>('[data-size-row]')) {
      row.toggleAttribute('data-current', !!chosen && row.dataset.sizeRow?.trim().toLowerCase() === chosen);
    }
  }
}

define('nk-size-guide', NkSizeGuide);
