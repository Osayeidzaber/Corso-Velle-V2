import { measurementDisclosure } from './measurement-disclosure';
import { applyPanelUnit, panelBaseUnit, showMeasurementRow, storedUnit, storeUnit, unitFromEvent, type MeasureUnit } from './measure-units';
import { installSizeGlide } from './size-glide';
import { t } from '../../core/config';
import { parseHTML } from '../../core/dom';
import { NkElement } from '../../core/element';
import { animate } from '../../core/motion';
import { announce } from '../../services/announce';
import { Sequencer } from '../../services/request';
import { MissingFragmentError, replaceRegions, renderSection } from '../../services/sections';
import { namespaceProductHTML } from './product-dom';

/** Grace period before an unselected preview panel collapses, so sweeping across pills never flickers. */
const PANEL_HIDE_DELAY = 220;
const OTHER_REGIONS = ['price', 'inventory', 'quantity', 'buy', 'badges'];

/**
 * <nk-variant-picker> (master-plan/08 PR-02).
 *
 * Liquid renders one <fieldset data-option-position="N"> per product option with radio inputs
 * carrying data-option-value-id. On change we re-render the product section through
 * `?option_values=` (Shopify's high-variant approach — no variant matrix in JS) and swap only the
 * price / inventory / buy regions, so app blocks elsewhere in the section survive.
 *
 * The picker itself is patched in place (checked / disabled / availability state per value) rather
 * than replaced: replacing it recreated the size indicator, reset the row's scroll position and
 * replayed the measurement panel on every click. It is only replaced when the server returns a
 * different set of values (e.g. sold-out values hidden by theme settings).
 *
 * Options listed in data-required-options (default "Size") are never preselected unless the URL
 * named a variant (data-preselected). Until every required option is chosen the picker is
 * INCOMPLETE and the product form refuses to submit.
 *
 * Size pills: hover feedback is pure CSS; the sliding indicator ([data-size-indicator]) marks only
 * the selected size and moves only when the selection does. Pointer hover / keyboard focus preview
 * that size's row in the dark measurement panel ([data-measurement-panel]) without selecting it.
 */
export type PickerState = 'incomplete' | 'resolving' | 'available' | 'sold-out' | 'unavailable' | 'failed';

export class NkVariantPicker extends NkElement {
  #sequencer = new Sequencer();
  #chosen = new Set<string>();
  #state: PickerState = 'incomplete';
  #measureUnit: MeasureUnit | null = null;
  #shownSize: string | null = null;
  #panelDisclosures = new Map<HTMLElement, ReturnType<typeof measurementDisclosure>>();
  #indicatorAnimation: Animation | null = null;
  #hideTimer = 0;
  #hoverSize: string | undefined;
  #focusSize: string | undefined;

  get state(): PickerState {
    return this.#state;
  }

  /** The variant id that may be submitted, or null if none is resolved and purchasable-checked. */
  get resolvedVariantId(): string | null {
    return this.#state === 'available' ? (this.#section()?.querySelector<HTMLInputElement>('input[name="id"]')?.value ?? null) : null;
  }

  protected mount(): void {
    this.#chosen.clear();
    this.#hoverSize = undefined;
    this.#focusSize = undefined;
    this.#shownSize = null;
    this.#measureUnit = storedUnit() ?? this.#measureUnit;

    const preselected = this.hasAttribute('data-preselected');
    for (const fieldset of this.#fieldsets()) {
      const position = fieldset.dataset.optionPosition!;
      const requiresFreshChoice = this.hasAttribute('data-explicit-size-choice') && fieldset.hasAttribute('data-size-fieldset');
      if (!requiresFreshChoice && (preselected || !this.#isRequired(fieldset))) this.#chosen.add(position);
    }
    this.#applyExplicitChoice();

    this.on(this, 'change', (event) => {
      const input = event.target as HTMLInputElement;
      const fieldset = input.closest<HTMLFieldSetElement>('fieldset[data-option-position]');
      if (!fieldset || input.type !== 'radio') return;
      if (input.dataset.productUrl) {
        const target = new URL(input.dataset.productUrl, location.origin);
        target.searchParams.set('option_values', input.dataset.optionValueId ?? '');
        location.assign(target.toString());
        return;
      }
      this.#chosen.add(fieldset.dataset.optionPosition!);
      fieldset.removeAttribute('data-incomplete');
      if (fieldset.hasAttribute('data-size-fieldset')) {
        this.#hoverSize = undefined;
        this.#focusSize = undefined;
      }
      const status = fieldset.querySelector<HTMLElement>('[data-selected-value]');
      if (status) status.textContent = input.value;
      // Optimistic: the browser has already checked the radio, so the indicator and panel follow
      // the click immediately instead of waiting for the network.
      this.#syncSizeUI();
      void this.#resolve(input.dataset.optionValueId ?? null);
    });

    this.on(this, 'click', (event) => {
      const unitBtn = (event.target as Element).closest<HTMLButtonElement>('[data-measure-unit]');
      if (!unitBtn) return;
      event.preventDefault();
      this.#setMeasureUnit(unitBtn.dataset.measureUnit === 'cm' ? 'cm' : 'in', true);
    });

    // Touch has no hover: a tap selects (change) and must not leave a stale preview behind.
    // Moving from a pill down onto the measurement panel (or the underline) keeps the preview, so
    // the panel never collapses under the cursor; it clears only outside the size fieldset.
    this.on(this, 'pointerover', (event) => {
      if ((event as PointerEvent).pointerType === 'touch') return;
      const target = event.target instanceof Element ? event.target : null;
      const pill = this.#pillKey(target);
      if (!pill && target?.closest('fieldset[data-size-fieldset]')) return;
      const next = pill;
      if (next === this.#hoverSize) return;
      this.#hoverSize = next;
      this.#syncSizeUI();
    });
    this.on(this, 'pointerleave', (event) => {
      if ((event as PointerEvent).pointerType === 'touch' || this.#hoverSize === undefined) return;
      this.#hoverSize = undefined;
      this.#syncSizeUI();
    });
    this.on(this, 'focusin', (event) => {
      this.#focusSize = this.#pillKey(event.target);
      this.#syncSizeUI();
    });
    this.on(this, 'focusout', (event) => {
      this.#focusSize = this.#pillKey(event.relatedTarget);
      this.#syncSizeUI();
    });

    this.on(document, 'nk:unit:changed', (event) => {
      const unit = unitFromEvent(event, this);
      if (unit) this.#setMeasureUnit(unit, false);
    });

    const sizeValues = this.#sizeFieldset()?.querySelector<HTMLElement>('[data-size-values]');
    if (sizeValues) {
      this.observeResize(sizeValues, () => this.#updateIndicator(true));
      this.dispose(installSizeGlide(sizeValues, this.signal));
    }
    // Pill widths follow the web font; re-measure once it has loaded.
    document.fonts?.ready.then(() => {
      if (this.isConnected) this.#updateIndicator(true);
    });
    this.dispose(() => this.#sequencer.cancel());
    this.dispose(() => window.clearTimeout(this.#hideTimer));
    this.dispose(() => { this.#panelDisclosures.forEach(disclosure => disclosure.dispose()); this.#panelDisclosures.clear(); });
    this.dispose(() => this.#indicatorAnimation?.cancel());
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

  #sizeFieldset(): HTMLFieldSetElement | undefined {
    return (
      this.querySelector<HTMLFieldSetElement>('fieldset[data-size-fieldset]') ??
      this.#fieldsets().find((f) => (f.dataset.optionName ?? '').toLowerCase().includes('size'))
    );
  }

  #pillKey(target: EventTarget | null): string | undefined {
    return target instanceof Element ? target.closest<HTMLElement>('[data-size-pill]')?.dataset.sizePill : undefined;
  }

  #isRequired(fieldset: HTMLFieldSetElement): boolean {
    const required = (this.dataset.requiredOptions ?? 'Size').split(',').map((s) => s.trim().toLowerCase());
    return required.includes((fieldset.dataset.optionName ?? '').toLowerCase())
      || (required.includes('size') && fieldset.hasAttribute('data-size-fieldset'));
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
      const html = this.dataset.idPrefix ? namespaceProductHTML(outcome.value, this.dataset.idPrefix) : outcome.value;
      const incomingPicker = this.#incomingPicker(html);
      if (this.#canPatch(incomingPicker)) {
        replaceRegions(section, html, OTHER_REGIONS);
        this.#patch(incomingPicker);
        this.#applyExplicitChoice();
      } else {
        replaceRegions(section, html, ['picker', ...OTHER_REGIONS]);
        this.#shownSize = null;
        this.#applyExplicitChoice();
        this.#restoreFocus(focusValueId);
      }
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

  /** The picker region of a section response (this element itself may carry data-region="picker"). */
  #incomingPicker(html: string): Element | null {
    const region = this.matches('[data-region="picker"]') ? this : this.querySelector('[data-region="picker"]');
    if (!region) return null;
    const incoming = parseHTML(html).querySelector('[data-region="picker"]');
    if (!incoming) throw new MissingFragmentError('Region "picker" missing');
    return incoming;
  }

  /** In-place patching is safe only when the response renders exactly the same option values. */
  #canPatch(incoming: Element | null): incoming is Element {
    if (!incoming) return false;
    const signature = (root: ParentNode): string =>
      [...root.querySelectorAll<HTMLElement>('fieldset[data-option-position]')]
        .map((fieldset) =>
          [...fieldset.querySelectorAll<HTMLInputElement>('input[type="radio"]')]
            .map((input) => input.dataset.optionValueId ?? input.value)
            .join(','),
        )
        .join('|');
    return signature(incoming) === signature(this);
  }

  /** Copy per-value state from the response onto the live inputs; layout elements stay untouched. */
  #patch(incoming: Element): void {
    const current = this.#fieldsets();
    incoming.querySelectorAll<HTMLFieldSetElement>('fieldset[data-option-position]').forEach((nextFieldset, index) => {
      const fieldset = current[index];
      if (!fieldset) return;
      const nextStatus = nextFieldset.querySelector('[data-selected-value]');
      const status = fieldset.querySelector('[data-selected-value]');
      if (nextStatus && status) status.textContent = nextStatus.textContent;

      const inputs = fieldset.querySelectorAll<HTMLInputElement>('input[type="radio"]');
      nextFieldset.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach((nextInput, i) => {
        const input = inputs[i];
        if (!input) return;
        input.checked = nextInput.hasAttribute('checked');
        input.disabled = nextInput.hasAttribute('disabled');
        if (nextInput.dataset.productUrl) input.dataset.productUrl = nextInput.dataset.productUrl;
        else delete input.dataset.productUrl;

        const wrapper = input.closest('.option__value');
        const nextWrapper = nextInput.closest('.option__value');
        if (wrapper && nextWrapper) wrapper.className = nextWrapper.className;
        const label = input.labels?.[0];
        const nextLabel = nextInput.parentElement?.querySelector('label');
        if (label && nextLabel && label.innerHTML !== nextLabel.innerHTML) {
          label.replaceChildren(...[...nextLabel.childNodes].map((node) => document.importNode(node, true)));
        }
      });
    });
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
      if (this.closest('[data-quick-add-dialog]')) return;
      const next = new URL(location.href);
      next.searchParams.delete('option_values');
      next.searchParams.set('variant', idInput.value);
      history.replaceState(history.state, '', next);
    } else if (!this.closest('[data-quick-add-dialog]')) {
      const next = new URL(location.href);
      next.searchParams.delete('variant');
      next.searchParams.set('option_values', this.#selectedIds().join(','));
      history.replaceState(history.state, '', next);
    }
  }

  /** Selection indicator plus measurement panel (selected size, or the hovered/focused preview). */
  #syncSizeUI(): void {
    const fieldset = this.#sizeFieldset();
    if (!fieldset) return;
    const selected = (fieldset.querySelector<HTMLInputElement>('input[type="radio"]:checked')?.value ?? '').trim().toUpperCase();
    const preview = this.hasAttribute('data-measure-preview-disabled') ? '' : (this.#hoverSize ?? this.#focusSize ?? '').trim().toUpperCase();
    this.#updateIndicator(false);
    this.#updateMeasurementPanel(fieldset, preview || selected, !!preview && preview !== selected);
  }

  /**
   * Slide the underline under the checked size. It never follows hover, so the selection stays
   * marked until another size is chosen. Positions are written only when they change, and the
   * first placement (or a resize) jumps instead of sliding in from the left edge.
   */
  #updateIndicator(instant: boolean): void {
    const fieldset = this.#sizeFieldset();
    const indicator = fieldset?.querySelector<HTMLElement>('[data-size-indicator]');
    if (!fieldset || !indicator) return;
    const pill = fieldset.querySelector<HTMLInputElement>('input[type="radio"]:checked')?.closest<HTMLElement>('[data-size-pill], .option__value');
    if (!pill) {
      indicator.removeAttribute('data-active');
      return;
    }
    const x = `${pill.offsetLeft + (pill.offsetWidth - 14) / 2}px`;
    const w = '14px';
    const wasActive = indicator.hasAttribute('data-active');
    if (wasActive && indicator.style.getPropertyValue('--indicator-x') === x && indicator.style.getPropertyValue('--indicator-w') === w) return;

    const previousX = parseFloat(indicator.style.getPropertyValue('--indicator-x')) || 0;
    const live = indicator.getBoundingClientRect();
    const row = pill.parentElement!;
    const fromX = live.width ? live.left - row.getBoundingClientRect().left + row.scrollLeft : previousX;
    const fromScale = live.width ? live.width / 14 : 1;
    this.#indicatorAnimation?.cancel();
    const jump = instant || !wasActive;
    if (jump) indicator.setAttribute('data-instant', '');
    indicator.style.setProperty('--indicator-x', x);
    indicator.style.setProperty('--indicator-w', w);
    indicator.setAttribute('data-active', '');
    if (jump) {
      void indicator.offsetWidth; // commit the jump before transitions are restored
      indicator.removeAttribute('data-instant');
    }
    if (!jump) {
      const nextX = parseFloat(x);
      const stretch = Math.min(3, 1 + Math.abs(nextX - fromX) / 110);
      // Adapt the supplied segmented control's stretch/settle to the screenshot's short underline.
      this.#indicatorAnimation = animate(indicator, [
        { transform: `translate3d(${fromX}px,0,0) scaleX(${fromScale})` },
        { transform: `translate3d(${(fromX + nextX) / 2 - 7 * (stretch - 1)}px,0,0) scaleX(${stretch})`, offset: .42 },
        { transform: `translate3d(${nextX}px,0,0) scaleX(1)` },
      ], { duration: 280, easing: 'cubic-bezier(.23,1,.32,1)' });
    }
    this.#revealPill(pill);
  }

  /** Keep the selected pill visible inside a sideways-scrolling size row without scrolling the page. */
  #revealPill(pill: HTMLElement): void {
    const row = pill.parentElement;
    if (!row || row.scrollWidth <= row.clientWidth) return;
    const left = pill.offsetLeft;
    const right = left + pill.offsetWidth;
    if (left < row.scrollLeft) row.scrollLeft = left;
    else if (right > row.scrollLeft + row.clientWidth) row.scrollLeft = right - row.clientWidth;
  }

  #updateMeasurementPanel(sizeFieldset: HTMLElement, activeSize: string, isPreview: boolean): void {
    const panel = sizeFieldset.querySelector<HTMLElement>('[data-measurement-panel]');
    if (!panel) return;
    let disclosure = this.#panelDisclosures.get(panel);
    if (!disclosure) { disclosure = measurementDisclosure(panel); this.#panelDisclosures.set(panel, disclosure); }

    applyPanelUnit(panel, this.#measureUnit ?? panelBaseUnit(panel));

    if (!activeSize) {
      // Collapse after a short grace period: moving between pills never flashes the panel shut.
      window.clearTimeout(this.#hideTimer);
      this.#hideTimer = window.setTimeout(() => {
        disclosure.setOpen(false);
        panel.removeAttribute('data-preview');
        this.#shownSize = null;
      }, PANEL_HIDE_DELAY);
      return;
    }
    window.clearTimeout(this.#hideTimer);
    panel.toggleAttribute('data-preview', isPreview);
    if (this.#shownSize === activeSize) { disclosure.setOpen(true); return; }

    // Another size while the panel is open crossfades instead of snapping; a closed panel just fills.
    disclosure.swap(() => showMeasurementRow(panel, activeSize));
    this.#shownSize = activeSize;

    disclosure.setOpen(true);
  }

  #setMeasureUnit(unit: MeasureUnit, broadcast: boolean): void {
    this.#measureUnit = unit;
    storeUnit(unit);
    const panel = this.querySelector<HTMLElement>('[data-measurement-panel]');
    if (panel) applyPanelUnit(panel, unit);
    if (broadcast) this.emit('nk:unit:changed', { unit, source: this });
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
