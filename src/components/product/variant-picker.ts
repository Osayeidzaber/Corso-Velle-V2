import { t } from '../../core/config';
import { NkElement } from '../../core/element';
import { animate } from '../../core/motion';
import { announce } from '../../services/announce';
import { Sequencer } from '../../services/request';
import { MissingFragmentError, renderSection, replaceRegions } from '../../services/sections';

const CM_PER_INCH = 2.54;
const UNIT_STORAGE_KEY = 'nk:measure-unit';

/**
 * <nk-variant-picker> (master-plan/08 PR-02).
 *
 * Liquid renders one <fieldset data-option-position="N"> per product option with radio inputs
 * carrying data-option-value-id. On change we re-render the product section through
 * `?option_values=` (Shopify's high-variant approach — no variant matrix in JS) and swap only the
 * price / picker / inventory / buy regions, so app blocks elsewhere in the section survive.
 *
 * Options listed in data-required-options (default "Size") are never preselected unless the URL
 * named a variant (data-preselected). Until every required option is chosen the picker is
 * INCOMPLETE and the product form refuses to submit.
 *
 * Also manages the horizontal size underline indicator ([data-size-indicator]) and the dark
 * garment measurement panel ([data-measurement-panel]) with live hover preview and in/cm toggle.
 */
export type PickerState = 'incomplete' | 'resolving' | 'available' | 'sold-out' | 'unavailable' | 'failed';

export class NkVariantPicker extends NkElement {
  #sequencer = new Sequencer();
  #chosen = new Set<string>();
  #state: PickerState = 'incomplete';
  #measureUnit: 'in' | 'cm' | null = null;
  #lastRevealedSize: string | null = null;

  get state(): PickerState {
    return this.#state;
  }

  /** The variant id that may be submitted, or null if none is resolved and purchasable-checked. */
  get resolvedVariantId(): string | null {
    return this.#state === 'available' ? (this.#section()?.querySelector<HTMLInputElement>('input[name="id"]')?.value ?? null) : null;
  }

  protected mount(): void {
    try {
      const savedUnit = sessionStorage.getItem(UNIT_STORAGE_KEY);
      if (savedUnit === 'in' || savedUnit === 'cm') this.#measureUnit = savedUnit;
    } catch {
      // ignore storage errors
    }

    const preselected = this.hasAttribute('data-preselected');
    for (const fieldset of this.#fieldsets()) {
      const position = fieldset.dataset.optionPosition!;
      if (preselected || !this.#isRequired(fieldset)) this.#chosen.add(position);
    }
    this.#applyExplicitChoice();

    this.on(this, 'change', (event) => {
      const input = event.target as HTMLInputElement;
      const fieldset = input.closest<HTMLFieldSetElement>('fieldset[data-option-position]');
      if (!fieldset || input.type !== 'radio') return;
      this.#chosen.add(fieldset.dataset.optionPosition!);
      const status = fieldset.querySelector<HTMLElement>('[data-selected-value]');
      if (status) status.textContent = input.value;
      this.#syncSizeUI(input.value);
      void this.#resolve(input.dataset.optionValueId ?? null);
    });

    this.on(this, 'click', (event) => {
      const unitBtn = (event.target as Element).closest<HTMLButtonElement>('[data-measure-unit]');
      if (!unitBtn) return;
      event.preventDefault();
      const nextUnit = unitBtn.dataset.measureUnit === 'cm' ? 'cm' : 'in';
      this.#setMeasureUnit(nextUnit, true);
    });

    this.on(this, 'pointerover', (event) => {
      const pill = (event.target as Element).closest<HTMLElement>('[data-size-pill]');
      if (!pill) return;
      const sizeKey = pill.dataset.sizePill;
      if (sizeKey) this.#syncSizeUI(sizeKey, true);
    });

    this.on(this, 'pointerout', (event) => {
      const fieldset = (event.target as Element).closest<HTMLElement>('[data-size-fieldset]');
      const related = (event as PointerEvent).relatedTarget as Node | null;
      if (fieldset && (!related || !fieldset.contains(related))) {
        this.#syncSizeUI();
      }
    });

    this.on(document, 'nk:unit:changed', (event) => {
      const detail = (event as CustomEvent<{ unit: 'in' | 'cm'; source?: Element }>).detail;
      if (detail?.source !== this && (detail?.unit === 'in' || detail?.unit === 'cm')) {
        this.#setMeasureUnit(detail.unit, false);
      }
    });

    this.observeResize(this, () => this.#updateUnderline());
    this.dispose(() => this.#sequencer.cancel());
  }

  /** First option group the shopper still has to choose, for focusing from the buy button. */
  firstIncomplete(): HTMLFieldSetElement | null {
    return this.#fieldsets().find((f) => !this.#chosen.has(f.dataset.optionPosition!)) ?? null;
  }

  #section(): HTMLElement | null {
    return this.closest<HTMLElement>('[data-product-section]');
  }

  #fieldsets(): HTMLFieldSetElement[] {
    return [...this.querySelectorAll<HTMLFieldSetElement>('fieldset[data-option-position]')];
  }

  #isRequired(fieldset: HTMLFieldSetElement): boolean {
    const required = (this.dataset.requiredOptions ?? 'Size').split(',').map((s) => s.trim().toLowerCase());
    return required.includes((fieldset.dataset.optionName ?? '').toLowerCase());
  }

  /** Server-selected ids for every option (unchosen required options keep the server default). */
  #selectedIds(): string[] {
    return this.#fieldsets().map((fieldset) => {
      const checked = fieldset.querySelector<HTMLInputElement>('input[type="radio"]:checked');
      return checked?.dataset.optionValueId ?? fieldset.dataset.defaultValueId ?? '';
    });
  }

  async #resolve(focusValueId: string | null): Promise<void> {
    const section = this.#section();
    const url = this.dataset.productUrl;
    const sectionId = this.dataset.sectionId;
    if (!section || !url || !sectionId) return;

    this.#setState('resolving');
    const target = new URL(url, location.origin);
    target.searchParams.set('option_values', this.#selectedIds().join(','));

    try {
      const outcome = await this.#sequencer.run((signal) => renderSection(target.toString(), sectionId, { signal }));
      if (outcome.stale) return;
      const incomingUrl = this.#combinedListingUrl(outcome.value);
      if (incomingUrl) {
        location.assign(incomingUrl);
        return;
      }
      replaceRegions(section, outcome.value, ['price', 'picker', 'inventory', 'buy']);
      this.#applyExplicitChoice();
      this.#restoreFocus(focusValueId);
    } catch (error) {
      if (error instanceof MissingFragmentError) console.warn(error);
      this.#setState('failed', target.toString());
    }
  }

  #combinedListingUrl(html: string): string | null {
    const match = /data-product-url="([^"]+)"/.exec(html);
    const incoming = match?.[1];
    if (!incoming || !this.dataset.productUrl) return null;
    return new URL(incoming, location.origin).pathname !== new URL(this.dataset.productUrl, location.origin).pathname
      ? incoming
      : null;
  }

  /** After any render: uncheck required options the shopper hasn't chosen and derive state. */
  #applyExplicitChoice(): void {
    const section = this.#section();
    let incomplete = false;
    for (const fieldset of this.#fieldsets()) {
      const position = fieldset.dataset.optionPosition!;
      if (this.#chosen.has(position)) {
        fieldset.removeAttribute('data-incomplete');
        continue;
      }
      incomplete = true;
      const checked = fieldset.querySelector<HTMLInputElement>('input[type="radio"]:checked');
      if (checked) fieldset.dataset.defaultValueId = checked.dataset.optionValueId ?? '';
      for (const radio of fieldset.querySelectorAll<HTMLInputElement>('input[type="radio"]')) radio.checked = false;
      fieldset.dataset.incomplete = '';
      const status = fieldset.querySelector<HTMLElement>('[data-selected-value]');
      if (status) status.textContent = t('product.choose_option');
    }

    this.#syncSizeUI();

    const idInput = section?.querySelector<HTMLInputElement>('input[name="id"]');
    if (incomplete) {
      idInput?.setAttribute('disabled', '');
      this.#setState('incomplete');
      return;
    }
    idInput?.removeAttribute('disabled');
    const availability = section?.querySelector<HTMLElement>('[data-region="buy"]')?.dataset.availability;
    if (!idInput?.value || availability === 'unavailable') this.#setState('unavailable');
    else if (availability === 'sold-out') this.#setState('sold-out');
    else this.#setState('available');

    if (idInput?.value && this.#state !== 'unavailable') {
      const next = new URL(location.href);
      next.searchParams.set('variant', idInput.value);
      history.replaceState(history.state, '', next);
    }
  }

  /** Synchronize the sliding underline indicator and dark garment measurement panel. */
  #syncSizeUI(overrideSize?: string, isPreview = false): void {
    const sizeFieldset =
      this.querySelector<HTMLFieldSetElement>('fieldset[data-size-fieldset]') ??
      this.#fieldsets().find((f) => (f.dataset.optionName ?? '').toLowerCase().includes('size'));
    if (!sizeFieldset) return;

    const checkedRadio = sizeFieldset.querySelector<HTMLInputElement>('input[type="radio"]:checked');
    const activeSize = (overrideSize ?? checkedRadio?.value ?? '').trim().toUpperCase();

    this.#updateUnderline(activeSize, isPreview);
    this.#updateMeasurementPanel(sizeFieldset, activeSize, isPreview);
  }

  #updateUnderline(targetSize?: string, isPreview = false): void {
    const sizeFieldset =
      this.querySelector<HTMLFieldSetElement>('fieldset[data-size-fieldset]') ??
      this.#fieldsets().find((f) => (f.dataset.optionName ?? '').toLowerCase().includes('size'));
    if (!sizeFieldset) return;

    const indicator = sizeFieldset.querySelector<HTMLElement>('[data-size-indicator]');
    if (!indicator) return;

    const checkedRadio = sizeFieldset.querySelector<HTMLInputElement>('input[type="radio"]:checked');
    const key = (targetSize ?? checkedRadio?.value ?? '').trim().toUpperCase();
    const pill = key
      ? sizeFieldset.querySelector<HTMLElement>(`[data-size-pill="${CSS.escape(key)}"]`) ??
        checkedRadio?.closest<HTMLElement>('.option__value')
      : null;

    if (!pill) {
      indicator.removeAttribute('data-active');
      indicator.removeAttribute('data-preview');
      indicator.style.setProperty('--indicator-w', '0px');
      return;
    }

    indicator.setAttribute('data-active', '');
    indicator.toggleAttribute('data-preview', isPreview);
    indicator.style.setProperty('--indicator-x', `${pill.offsetLeft}px`);
    indicator.style.setProperty('--indicator-w', `${pill.offsetWidth}px`);
  }

  #updateMeasurementPanel(sizeFieldset: HTMLElement, activeSize: string, isPreview: boolean): void {
    const panel = sizeFieldset.querySelector<HTMLElement>('[data-measurement-panel]');
    if (!panel) return;

    const baseUnit = panel.dataset.baseUnit === 'cm' ? 'cm' : 'in';
    const currentUnit = this.#measureUnit ?? baseUnit;
    this.#applyPanelUnit(panel, baseUnit, currentUnit);

    if (!activeSize) {
      panel.hidden = true;
      return;
    }

    const rows = [...panel.querySelectorAll<HTMLElement>('[data-measurement-row]')];
    const matchedRow = rows.find((row) => (row.dataset.measurementRow ?? '').trim().toUpperCase() === activeSize);
    if (!matchedRow) {
      panel.hidden = true;
      return;
    }

    const wasHidden = panel.hidden;
    panel.hidden = false;
    panel.toggleAttribute('data-preview', isPreview);

    const activeLabel = panel.querySelector<HTMLElement>('[data-measurement-active-size]');
    if (activeLabel) activeLabel.textContent = activeSize;

    for (const row of rows) {
      row.hidden = row !== matchedRow;
    }

    if (wasHidden || this.#lastRevealedSize !== activeSize) {
      this.#lastRevealedSize = activeSize;
      const cells = matchedRow.querySelectorAll<HTMLElement>('.measurement-panel__cell');
      cells.forEach((cell, index) => {
        animate(
          cell,
          [
            { opacity: 0, transform: 'translateY(6px)' },
            { opacity: 1, transform: 'none' },
          ],
          {
            duration: 240,
            delay: index * 28,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'backwards',
          },
        );
      });
    }
  }

  #setMeasureUnit(unit: 'in' | 'cm', broadcast: boolean): void {
    this.#measureUnit = unit;
    try {
      sessionStorage.setItem(UNIT_STORAGE_KEY, unit);
    } catch {
      // ignore
    }
    const panel = this.querySelector<HTMLElement>('[data-measurement-panel]');
    if (panel) {
      const baseUnit = panel.dataset.baseUnit === 'cm' ? 'cm' : 'in';
      this.#applyPanelUnit(panel, baseUnit, unit);
    }
    if (broadcast) {
      this.emit('nk:unit:changed', { unit, source: this });
    }
  }

  #applyPanelUnit(panel: HTMLElement, baseUnit: 'in' | 'cm', unit: 'in' | 'cm'): void {
    for (const btn of panel.querySelectorAll<HTMLButtonElement>('[data-measure-unit]')) {
      btn.setAttribute('aria-pressed', String(btn.dataset.measureUnit === unit));
    }
    for (const suffix of panel.querySelectorAll<HTMLElement>('[data-measure-suffix]')) {
      suffix.textContent = unit;
    }
    for (const valEl of panel.querySelectorAll<HTMLElement>('[data-measure-value]')) {
      const raw = Number.parseFloat(valEl.dataset.measureValue ?? '');
      if (Number.isNaN(raw)) continue;
      let converted = raw;
      if (unit !== baseUnit) {
        converted = unit === 'cm' ? raw * CM_PER_INCH : raw / CM_PER_INCH;
      }
      valEl.textContent = String(Math.round(converted * 10) / 10);
    }
  }

  #restoreFocus(valueId: string | null): void {
    if (!valueId) return;
    this.querySelector<HTMLInputElement>(`input[data-option-value-id="${CSS.escape(valueId)}"]`)?.focus({ preventScroll: true });
  }

  #setState(state: PickerState, retryUrl?: string): void {
    this.#state = state;
    const section = this.#section();
    section?.setAttribute('data-picker-state', state);
    const failure = section?.querySelector<HTMLElement>('[data-picker-error]');
    if (failure) {
      failure.hidden = state !== 'failed';
      const link = failure.querySelector<HTMLAnchorElement>('a');
      if (link && retryUrl) {
        const full = new URL(retryUrl);
        full.searchParams.delete('section_id');
        link.href = full.toString();
      }
    }
    if (state === 'failed') announce.assertive(t('product.selection_failed'));
    this.emit('nk:variant:changed', { state, variantId: this.resolvedVariantId });
  }
}
