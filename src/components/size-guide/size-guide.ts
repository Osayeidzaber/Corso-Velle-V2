import { define } from '../../core/define';
import { NkElement } from '../../core/element';
import { convertMeasure, storedUnit, storeUnit, unitFromEvent, type MeasureUnit } from '../product/measure-units';

/**
 * <nk-size-guide unit="in"> — switches a size table between inches and centimetres and
 * highlights the row for the size currently chosen in the variant picker. Cells carry their
 * base value in [data-value]; the table reads fine without JS in the unit it was entered in.
 * Unit labels ([data-ref="unit-label"]) follow the toggle.
 */
export class NkSizeGuide extends NkElement {
  #base: MeasureUnit = 'in';

  protected mount(): void {
    this.#base = this.getAttribute('unit') === 'cm' ? 'cm' : 'in';
    const initialUnit = storedUnit() ?? this.#base;
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
    // Opening the guide scrolls the chosen size into view inside the (sideways/vertical) table.
    this.on(document, 'nk:overlay:opened', () => {
      if (this.closest('dialog[open]')) this.#highlight(true);
    });
    this.on(document, 'nk:unit:changed', (event) => {
      const unit = unitFromEvent(event, this);
      if (unit) this.#show(unit, false);
    });
  }

  #show(unit: MeasureUnit, broadcast = false): void {
    if (this.hasAttribute('data-unit-switch-disabled')) unit = this.#base;
    for (const cell of this.querySelectorAll<HTMLElement>('[data-value]')) {
      const source = cell.dataset.value?.trim() ?? '';
      const value = Number(source);
      if (!source || !Number.isFinite(value)) {
        cell.textContent = source && unit !== this.#base ? `${source} (${this.#base})` : source;
        continue;
      }
      cell.textContent = String(convertMeasure(value, this.#base, unit));
    }
    const label = this.refs<HTMLButtonElement>('unit').find((button) => button.value === unit)?.textContent?.trim() ?? unit;
    for (const el of this.refs('unit-label')) el.textContent = label;
    for (const button of this.refs<HTMLButtonElement>('unit')) {
      button.setAttribute('aria-pressed', String(button.value === unit));
    }
    if (broadcast) {
      storeUnit(unit);
      this.emit('nk:unit:changed', { unit, source: this });
    }
  }

  #highlight(reveal = false): void {
    const scope = this.closest('[data-product-section]') ?? document;
    const optionName = (this.getAttribute('option') ?? 'Size').trim().toLowerCase();
    const fieldsets = [...scope.querySelectorAll<HTMLElement>('nk-variant-picker fieldset[data-option-name]')];
    const fieldset =
      fieldsets.find((el) => el.dataset.optionName?.trim().toLowerCase() === optionName) ??
      fieldsets.find((el) => el.hasAttribute('data-size-fieldset'));
    const chosen = fieldset?.querySelector<HTMLInputElement>('input:checked')?.value.trim().toLowerCase();
    let current: HTMLElement | null = null;
    for (const row of this.querySelectorAll<HTMLElement>('[data-size-row]')) {
      const match = !this.hasAttribute('data-highlight-disabled') && !!chosen && row.dataset.sizeRow?.trim().toLowerCase() === chosen;
      row.toggleAttribute('data-current', match);
      if (match) {
        row.setAttribute('aria-current', 'true');
        current = row;
      } else {
        row.removeAttribute('aria-current');
      }
    }
    if (reveal && current) current.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}

define('nk-size-guide', NkSizeGuide);
