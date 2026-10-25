import { t } from '../../core/config';
import { NkElement } from '../../core/element';
import { announce } from '../../services/announce';
import { cart, type Cart, type CartDiscountCode } from '../../services/cart';
import { holdPromotions, isAuto, loadMemory, markManual, normalizeCode, saveMemory, waitForPromotions } from '../../services/discounts';

/**
 * <nk-cart-discounts> — the shopper's discount code field and applied-code chips in the cart drawer
 * and on the cart page (docs/PROMOTIONS.md). Codes go to Shopify through the cart queue; the
 * verdict and every amount come from Shopify's response, never from a calculation here.
 *
 * Shopify reports only whether a code applies, not why, so a rejection message lists the possible
 * reasons instead of guessing one.
 */

type Tone = 'success' | 'error' | 'info';

// Section re-rendering replaces this element after every cart change; the latest message is kept
// here so the fresh instance can show it.
let flash: { text: string; tone: Tone; at: number } | null = null;
let editing = false;

const hasSaving = (state: Cart, code: string): boolean =>
  (state.cart_level_discount_applications ?? []).some((app) => normalizeCode(app.title) === code)
  || state.items.some((line) => (line.line_level_discount_allocations ?? [])
    .some((allocation) => normalizeCode(allocation.discount_application.title) === code));

export class NkCartDiscounts extends NkElement {
  protected mount(): void {
    // Children may still be parsing when a parser-created element upgrades.
    if (this.querySelector('[data-discount-message]')) this.#render();
    else queueMicrotask(() => this.isConnected && this.#render());

    this.on(this, 'click', (event) => {
      const target = event.target as Element;
      const remove = target.closest<HTMLElement>('[data-discount-remove]');
      if (remove?.dataset.discountRemove) {
        event.preventDefault();
        void this.#remove(remove.dataset.discountRemove);
      } else if (target.closest('[data-discount-apply]')) {
        event.preventDefault();
        void this.#apply();
      }
    });
    this.on(this, 'keydown', (event) => {
      // Enter in the code field applies the code instead of submitting the cart form (checkout).
      if (event.key === 'Enter' && (event.target as Element).matches('[data-discount-input]')) {
        event.preventDefault();
        void this.#apply();
      }
    });
  }

  #render(): void {
    const field = this.querySelector<HTMLDetailsElement>('[data-discount-field]');
    if (field) {
      field.removeAttribute('hidden');
      if (flash && flash.tone === 'error' && Date.now() - flash.at < 10_000) field.open = true;
    }
    this.#hydrate(cart.lastKnown);
    this.#busy(editing);
    if (flash && Date.now() - flash.at < 10_000) this.#show(flash.text, flash.tone, false);
  }

  /**
   * Liquid lists codes with confirmed savings. Codes Shopify accepted without a cart-level saving
   * (shipping discounts) or no longer accepts are only visible in cart JSON, so add those here.
   */
  #hydrate(state: Cart | null): void {
    const list = this.querySelector<HTMLUListElement>('[data-discount-codes]');
    if (!list || !state?.discount_codes?.length) return;
    const listed = new Set([...list.querySelectorAll<HTMLElement>('[data-discount-code]')].map((chip) => chip.dataset.discountCode ?? ''));
    for (const entry of state.discount_codes) {
      const code = normalizeCode(entry.code);
      if (listed.has(code)) continue;
      // Auto codes Shopify rejected are being removed by the promotions service; don't flash them.
      if (!entry.applicable && isAuto(state.token, code)) continue;
      list.append(this.#chip(code, entry.applicable && !hasSaving(state, code) ? t('promotions.applied_at_checkout', { code }) : t('promotions.not_applicable', { code }), entry.applicable));
      list.hidden = false;
    }
  }

  #chip(code: string, note: string, applicable: boolean): HTMLLIElement {
    const chip = document.createElement('li');
    chip.className = `cart-discounts__code${applicable ? '' : ' cart-discounts__code--inactive'}`;
    chip.dataset.discountCode = code;
    chip.title = note;
    const name = document.createElement('span');
    name.className = 'cart-discounts__code-name spec';
    name.textContent = code;
    const hint = document.createElement('span');
    hint.className = 'visually-hidden';
    hint.textContent = note;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cart-discounts__remove';
    button.dataset.discountRemove = code;
    button.dataset.focusKey = `discount-remove-${code}`;
    button.setAttribute('aria-label', t('promotions.remove_code', { code }));
    button.textContent = '×';
    chip.append(name, hint, button);
    return chip;
  }

  async #apply(): Promise<void> {
    if (editing) return;
    const input = this.querySelector<HTMLInputElement>('[data-discount-input]');
    const code = normalizeCode(input?.value ?? '');
    if (!code || code.includes(',')) {
      this.#show(t('promotions.empty'), 'error');
      input?.focus();
      return;
    }
    editing = true;
    this.#busy(true);
    this.#show(t('promotions.applying'), 'info', false);
    const release = holdPromotions();
    try {
      const before = await this.#current();
      const existing = before.discount_codes ?? [];
      if (existing.some((entry) => normalizeCode(entry.code) === code && entry.applicable)) {
        markManual(before.token, [code]);
        this.#done(t('promotions.already_applied', { code }), 'info');
        return;
      }
      const others = existing.map((entry) => normalizeCode(entry.code)).filter((other) => other !== code);
      // Shopper codes take precedence over automatic ones; mark it before the cart update event
      // reaches the promotions service so it is never treated as removable.
      markManual(before.token, [code]);
      let state = (await cart.discounts([...others, code], 'cart-discounts')).cart;
      let result = this.#find(state.discount_codes, code);

      if (!result?.applicable) {
        const autoCodes = others.filter((other) => isAuto(before.token, other));
        if (autoCodes.length) {
          // Possibly not combinable with an automatic promotion: try it without those.
          state = (await cart.discounts(others.filter((other) => !autoCodes.includes(other)).concat(code), 'cart-discounts')).cart;
          result = this.#find(state.discount_codes, code);
          if (result?.applicable) {
            const memory = loadMemory(state.token);
            memory.declined.push(...autoCodes);
            memory.auto = memory.auto.filter((other) => !autoCodes.includes(other));
            saveMemory(state.token, memory);
            this.#done(t('promotions.replaced_automatic', { code }), 'success');
            return;
          }
        }
        // Rejected: restore exactly the codes the cart had, so nothing else changes.
        await cart.discounts(existing.map((entry) => entry.code), 'cart-discounts');
        this.#done(t('promotions.not_applicable', { code }), 'error');
        return;
      }
      if (input) input.value = '';
      this.#done(hasSaving(state, code) ? t('promotions.applied', { code }) : t('promotions.applied_at_checkout', { code }), 'success');
    } catch {
      this.#done(t('promotions.error'), 'error');
      void cart.refresh('cart-discounts').catch(() => {});
    } finally {
      editing = false;
      this.#busy(false);
      release();
    }
  }

  async #remove(code: string): Promise<void> {
    if (editing) return;
    editing = true;
    const normalized = normalizeCode(code);
    this.#busy(true);
    const release = holdPromotions();
    try {
      const before = await this.#current();
      // A removed automatic code is the shopper's decision: don't re-add it for this cart.
      markManual(before.token, [], [normalized]);
      const codes = (before.discount_codes ?? []).map((entry) => entry.code).filter((other) => normalizeCode(other) !== normalized);
      await cart.discounts(codes, 'cart-discounts');
      this.#done(t('promotions.removed', { code: normalized }), 'info');
    } catch {
      this.#done(t('promotions.error'), 'error');
    } finally {
      editing = false;
      this.#busy(false);
      release();
    }
  }

  async #current(): Promise<Cart> {
    // Always read fresh: the code list is replaced wholesale, and codes may have changed in another
    // tab or at checkout since this page loaded.
    await waitForPromotions();
    return cart.read();
  }

  #find(list: CartDiscountCode[] | undefined, code: string): CartDiscountCode | undefined {
    return list?.find((entry) => normalizeCode(entry.code) === code);
  }

  #busy(busy: boolean): void {
    for (const element of document.querySelectorAll('nk-cart-discounts')) element.toggleAttribute('aria-busy', busy);
    for (const button of document.querySelectorAll<HTMLButtonElement>('nk-cart-discounts [data-discount-apply], nk-cart-discounts [data-discount-remove]')) button.disabled = busy;
  }

  /** Final outcome: show it on every (freshly rendered) instance and announce it once. */
  #done(text: string, tone: Tone): void {
    flash = { text, tone, at: Date.now() };
    for (const element of document.querySelectorAll<NkCartDiscounts>('nk-cart-discounts')) {
      if (element instanceof NkCartDiscounts) element.#show(text, tone, false);
    }
    if (tone === 'error') announce.assertive(text);
    else announce.polite(text);
  }

  #show(text: string, tone: Tone, record = true): void {
    if (record) flash = { text, tone, at: Date.now() };
    const region = this.querySelector<HTMLElement>('[data-discount-message]');
    if (!region) return;
    region.textContent = text;
    region.dataset.tone = tone;
    region.hidden = false;
  }
}
