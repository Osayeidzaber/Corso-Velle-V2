import { t } from '../../core/config';
import { NkElement } from '../../core/element';
import { announce } from '../../services/announce';
import { Sequencer } from '../../services/request';
import { MissingFragmentError, renderSection, replaceRegions } from '../../services/sections';

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
 */
export type PickerState = 'incomplete' | 'resolving' | 'available' | 'sold-out' | 'unavailable' | 'failed';

export class NkVariantPicker extends NkElement {
  #sequencer = new Sequencer();
  #chosen = new Set<string>();
  #state: PickerState = 'incomplete';

  get state(): PickerState {
    return this.#state;
  }

  /** The variant id that may be submitted, or null if none is resolved and purchasable-checked. */
  get resolvedVariantId(): string | null {
    return this.#state === 'available' ? (this.#section()?.querySelector<HTMLInputElement>('input[name="id"]')?.value ?? null) : null;
  }

  protected mount(): void {
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
      void this.#resolve(input.dataset.optionValueId ?? null);
    });
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
        // Combined listing: the choice belongs to another product. Navigate (whole page context changes).
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
