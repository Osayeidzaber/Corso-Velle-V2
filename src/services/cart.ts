import { config } from '../core/config';
import { fetchJSON, HttpError, isAmbiguous, ParseError } from './request';

/**
 * Cart mutation service (master-plan/09 CA-01).
 *
 * - Every mutation goes through one FIFO queue, so responses can never overwrite newer state.
 * - Queued (not yet sent) quantity changes for the same line coalesce to the latest absolute value.
 * - Lines are addressed by line item key, never by variant id (same variant may be several lines).
 * - A timeout/network failure after sending is *ambiguous*: we re-read the cart and report what
 *   actually happened. Mutations are never retried automatically.
 * - Bundled section HTML is passed through; a missing fragment never triggers a new mutation.
 */

export interface CartLine {
  key: string;
  id: number;
  variant_id: number;
  quantity: number;
  properties: Record<string, string> | null;
  selling_plan_allocation?: { selling_plan: { id: number } } | null;
  line_level_discount_allocations?: Array<{ amount: number; discount_application: { type: string; title: string } }>;
}

/** A code on the cart as Shopify reports it; `applicable` is Shopify's verdict for this cart. */
export interface CartDiscountCode {
  code: string;
  applicable: boolean;
}

export interface Cart {
  token: string;
  item_count: number;
  items: CartLine[];
  total_price: number;
  note: string | null;
  total_discount?: number;
  discount_codes?: CartDiscountCode[];
  cart_level_discount_applications?: Array<{ type: string; title: string; total_allocated_amount: number }>;
}

export interface AddItem {
  id: number;
  quantity: number;
  properties?: Record<string, string>;
  selling_plan?: number;
}

export type CartErrorKind = 'rejected' | 'line-missing' | 'not-applied' | 'unknown' | 'throttled';

export class CartError extends Error {
  override name = 'CartError';
  constructor(
    readonly kind: CartErrorKind,
    message: string,
    override readonly cause?: unknown,
  ) {
    super(message);
  }
}

export interface CartResult {
  cart: Cart;
  /** Rendered section HTML by section id; null when Shopify couldn't render one. */
  sections: Record<string, string | null>;
  /** True when the outcome was established by re-reading the cart after an ambiguous failure. */
  reconciled: boolean;
}

type OpKind = 'add' | 'change' | 'note' | 'discount' | 'refresh';

interface Op {
  kind: OpKind;
  sourceId: string;
  payload: { items?: AddItem[]; key?: string; quantity?: number; note?: string; codes?: string[] };
  waiters: Array<{ resolve: (r: CartResult) => void; reject: (e: unknown) => void }>;
  sent: boolean;
}

const routes = () => config().routes;

/** Section ids of cart regions on this page (≤5), declared in Liquid with data-cart-section. */
export function cartSectionIds(): string[] {
  const ids = [...document.querySelectorAll<HTMLElement>('[data-cart-section]')]
    .map((el) => el.dataset.cartSection)
    .filter((id): id is string => Boolean(id));
  return [...new Set(ids)].slice(0, 5);
}

function propertiesMatch(a: Record<string, string> | null | undefined, b: Record<string, string> | null | undefined): boolean {
  const left = a ?? {};
  const right = b ?? {};
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const key of keys) if (left[key] !== right[key]) return false;
  return true;
}

function quantityFor(cart: Cart, item: AddItem): number {
  return cart.items
    .filter((line) => line.variant_id === item.id && propertiesMatch(line.properties, item.properties)
      && (line.selling_plan_allocation?.selling_plan.id ?? null) === (item.selling_plan ?? null))
    .reduce((sum, line) => sum + line.quantity, 0);
}

function checkedCart(state: Cart): Cart {
  if (!state || !Array.isArray(state.items) || !Number.isInteger(state.item_count) || state.item_count < 0
    || !Number.isFinite(state.total_price) || state.total_price < 0
    || state.items.some((line) => typeof line.key !== 'string' || !Number.isInteger(line.quantity) || line.quantity < 0)) {
    throw new ParseError('Invalid cart response');
  }
  return state;
}

export class CartService {
  #queue: Op[] = [];
  #running = false;
  #last: Cart | null = null;

  get lastKnown(): Cart | null {
    return this.#last;
  }

  get pending(): boolean {
    return this.#running || this.#queue.length > 0;
  }

  add(items: AddItem[], sourceId: string): Promise<CartResult> {
    if (!items.length || items.some((item) => !Number.isSafeInteger(item.id) || item.id < 1 || !Number.isInteger(item.quantity) || item.quantity < 1)) {
      return Promise.reject(new CartError('rejected', 'Invalid product or quantity'));
    }
    return this.#enqueue({ kind: 'add', sourceId, payload: { items } });
  }

  /** Set an absolute quantity for a line (0 removes it). */
  change(key: string, quantity: number, sourceId: string): Promise<CartResult> {
    if (!key || !Number.isInteger(quantity) || quantity < 0) return Promise.reject(new CartError('rejected', 'Invalid cart quantity'));
    const pending = this.#queue.find((op) => !op.sent && op.kind === 'change' && op.payload.key === key);
    if (pending) {
      pending.payload.quantity = quantity;
      return new Promise((resolve, reject) => pending.waiters.push({ resolve, reject }));
    }
    return this.#enqueue({ kind: 'change', sourceId, payload: { key, quantity } });
  }

  note(note: string, sourceId: string): Promise<CartResult> {
    const pending = this.#queue.find((op) => !op.sent && op.kind === 'note');
    if (pending) {
      pending.payload.note = note;
      return new Promise((resolve, reject) => pending.waiters.push({ resolve, reject }));
    }
    return this.#enqueue({ kind: 'note', sourceId, payload: { note } });
  }

  /**
   * Replace the cart's discount codes with exactly `codes` (Shopify's /cart/update.js `discount`
   * parameter replaces, never appends; [] removes all). Shopify validates each code and reports
   * `applicable` per code in the returned cart. Never coalesced: each list is a deliberate attempt.
   */
  discounts(codes: string[], sourceId: string): Promise<CartResult> {
    const list = [...new Set(codes.map((code) => code.trim()).filter(Boolean))];
    if (list.some((code) => code.includes(','))) return Promise.reject(new CartError('rejected', 'Invalid discount code'));
    return this.#enqueue({ kind: 'discount', sourceId, payload: { codes: list } });
  }

  /** Read the cart without rendering sections (safe GET; updates lastKnown). */
  async read(): Promise<Cart> {
    const state = await this.#getCart();
    if (!this.pending) this.#last = state;
    return state;
  }

  /** Re-read cart + sections (for app integrations via nk:cart:refresh, bfcache restore, etc). */
  refresh(sourceId = 'refresh'): Promise<CartResult> {
    return this.#enqueue({ kind: 'refresh', sourceId, payload: {} });
  }

  #enqueue(partial: Omit<Op, 'waiters' | 'sent'>): Promise<CartResult> {
    return new Promise((resolve, reject) => {
      this.#queue.push({ ...partial, waiters: [{ resolve, reject }], sent: false });
      void this.#drain();
    });
  }

  async #drain(): Promise<void> {
    if (this.#running) return;
    this.#running = true;
    this.#emit('nk:cart:pending', { pending: true });
    try {
      while (this.#queue.length) {
        const op = this.#queue[0]!;
        op.sent = true;
        try {
          const result = await this.#execute(op);
          this.#last = result.cart;
          for (const waiter of op.waiters) waiter.resolve(result);
          this.#emit('nk:cart:updated', { ...result, sourceId: op.sourceId, kind: op.kind });
        } catch (error) {
          const cartError = this.#toCartError(error);
          for (const waiter of op.waiters) waiter.reject(cartError);
          this.#emit('nk:cart:error', { error: cartError, sourceId: op.sourceId, kind: op.kind });
        } finally {
          this.#queue.shift();
        }
      }
    } finally {
      this.#running = false;
      this.#emit('nk:cart:pending', { pending: false });
    }
  }

  async #execute(op: Op): Promise<CartResult> {
    const sections = cartSectionIds();
    switch (op.kind) {
      case 'refresh':
        return { cart: await this.#getCart(), sections: await this.#renderCartSections(sections), reconciled: false };
      case 'add':
        return this.#add(op.payload.items ?? [], sections);
      case 'change':
        return this.#change(op.payload.key!, op.payload.quantity!, sections);
      case 'note':
        return this.#post(routes().cartUpdate, { note: op.payload.note ?? '' }, sections);
      case 'discount':
        return this.#discount(op.payload.codes ?? [], sections);
    }
  }

  async #add(items: AddItem[], sections: string[]): Promise<CartResult> {
    const before = await this.#getCart().catch(() => null);
    try {
      // add.js returns the added items, not the cart, so the cart is re-read afterwards.
      const response = await fetchJSON<{ sections?: Record<string, string | null> }>(`${routes().cartAdd}.js`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, sections, sections_url: location.pathname }),
      });
      return { cart: await this.#getCart(), sections: response.sections ?? {}, reconciled: false };
    } catch (error) {
      if (!isAmbiguous(error)) throw error;
      // The add may or may not have happened. Compare against the snapshot; never re-send.
      const after = await this.#getCart().catch(() => null);
      if (!after || !before) throw new CartError('unknown', 'Could not confirm whether the item was added', error);
      const applied = items.every((item) => {
        const requested = items.filter((other) => other.id === item.id
          && propertiesMatch(other.properties, item.properties) && other.selling_plan === item.selling_plan)
          .reduce((sum, other) => sum + other.quantity, 0);
        return quantityFor(after, item) >= quantityFor(before, item) + requested;
      });
      if (!applied) throw new CartError('not-applied', 'The item was not added', error);
      return { cart: after, sections: await this.#renderCartSections(sections), reconciled: true };
    }
  }

  async #change(key: string, quantity: number, sections: string[]): Promise<CartResult> {
    let known = this.#last;
    if (!known || !known.items.some((line) => line.key === key)) {
      known = await this.#getCart();
      this.#last = known;
      if (!known.items.some((line) => line.key === key)) {
        throw new CartError('line-missing', 'This item is no longer in your cart');
      }
    }
    try {
      return await this.#post(routes().cartChange, { id: key, quantity }, sections);
    } catch (error) {
      if (!isAmbiguous(error)) throw error;
      const after = await this.#getCart().catch(() => null);
      if (!after) throw new CartError('unknown', 'Could not confirm the cart update', error);
      const line = after.items.find((item) => item.key === key);
      const applied = quantity === 0 ? !line : line?.quantity === quantity;
      if (!applied) throw new CartError('not-applied', 'The cart was not updated', error);
      return { cart: after, sections: await this.#renderCartSections(sections), reconciled: true };
    }
  }

  async #discount(codes: string[], sections: string[]): Promise<CartResult> {
    try {
      return await this.#post(routes().cartUpdate, { discount: codes.join(',') }, sections);
    } catch (error) {
      if (!isAmbiguous(error)) throw error;
      // Replacing the code list is idempotent, but it is still never re-sent: report what the
      // cart actually holds so callers judge Shopify's real state.
      const after = await this.#getCart().catch(() => null);
      if (!after) throw new CartError('unknown', 'Could not confirm the discount update', error);
      const held = new Set((after.discount_codes ?? []).map((entry) => entry.code.toUpperCase()));
      if (codes.length !== held.size || codes.some((code) => !held.has(code.toUpperCase()))) {
        throw new CartError('not-applied', 'The discount codes were not updated', error);
      }
      return { cart: after, sections: await this.#renderCartSections(sections), reconciled: true };
    }
  }

  async #post(url: string, body: Record<string, unknown>, sections: string[]): Promise<CartResult> {
    const response = await fetchJSON<Cart & { sections?: Record<string, string | null> }>(`${url}.js`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, sections, sections_url: location.pathname }),
    });
    const { sections: rendered, ...cart } = response;
    return { cart: checkedCart(cart as Cart), sections: rendered ?? {}, reconciled: false };
  }

  async #getCart(): Promise<Cart> {
    const state = await fetchJSON<Cart>(`${routes().cart}.js`, { cache: 'no-store' });
    return checkedCart(state);
  }

  /** Safe GET used after reconciliation or for refresh; failures degrade to "no HTML". */
  async #renderCartSections(sections: string[]): Promise<Record<string, string | null>> {
    if (!sections.length) return {};
    const url = new URL(location.pathname, location.origin);
    url.searchParams.set('sections', sections.join(','));
    return fetchJSON<Record<string, string | null>>(url.toString()).catch(() => Object.fromEntries(sections.map((id) => [id, null])));
  }

  #toCartError(error: unknown): CartError {
    if (error instanceof CartError) return error;
    if (error instanceof HttpError) {
      if (error.status === 429) return new CartError('throttled', error.message, error);
      if (error.status === 422 || error.status === 400) return new CartError('rejected', error.message, error);
    }
    return new CartError('unknown', error instanceof Error ? error.message : String(error), error);
  }

  #emit(type: string, detail: unknown): void {
    document.dispatchEvent(new CustomEvent(type, { detail }));
  }
}

export const cart = new CartService();
