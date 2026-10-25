import { config } from '../core/config';
import { cart, type Cart, type CartDiscountCode, type CartResult } from './cart';

/**
 * Automatic promotion codes (docs/PROMOTIONS.md).
 *
 * Liquid (snippets/cart-discounts) lists the existing Shopify discount codes this cart is
 * associated with; this service sends them to Shopify through the cart queue and keeps only what
 * Shopify accepts. Shopify stays the source of truth: `discount_codes[].applicable` decides, and
 * every price and saving shown comes from Shopify's own allocations in the re-rendered cart.
 *
 * Rules
 * - One new code is tried per step, highest priority first, so the outcome is deterministic.
 * - A code Shopify rejects is removed again (no "pending" codes reach checkout) and is not retried
 *   until the cart contents or the set of applied codes change — no loops, no repeated requests.
 * - If a new code displaces one that applied before (not combinable), the configured rule decides:
 *   'keep' keeps the existing code; 'priority' keeps the higher-priority one (ties keep existing).
 * - Codes the shopper entered (or that arrived via a /discount/CODE link) are never removed or
 *   displaced automatically; a code the shopper removed is never re-added for this cart.
 * - Auto codes whose products left the cart, or that Shopify stopped accepting, are removed.
 */

export interface PromotionCode {
  code: string;
  priority: number;
}

export interface CartPromotions {
  signature: string;
  codes: PromotionCode[];
}

export interface Memory {
  /** Codes this service added (anything else on the cart is the shopper's). */
  auto: string[];
  /** `${code}@${signature}@${applied}` attempts that failed or were reverted. */
  tried: string[];
  /** Codes the shopper removed; never re-added automatically for this cart. */
  declined: string[];
}

export type Step =
  | { type: 'none' }
  | { type: 'cleanup'; codes: string[]; removed: string[] }
  | { type: 'try'; codes: string[]; candidate: string };

export interface Verdict {
  codes: string[];
  outcome: 'applied' | 'rejected' | 'kept-existing' | 'replaced';
  displaced: string[];
}

const SOURCE = 'promotions';
const MAX_STEPS = 6;
const MAX_TRIED = 60;

export const normalizeCode = (code: string): string => code.trim().toUpperCase();

/** The cart's codes in Shopify's order, normalized. */
const codesOf = (list: CartDiscountCode[] | undefined): string[] => (list ?? []).map((entry) => normalizeCode(entry.code));
const appliedOf = (list: CartDiscountCode[] | undefined): string[] =>
  (list ?? []).filter((entry) => entry.applicable).map((entry) => normalizeCode(entry.code));

/** Same encoding as snippets/cart-discounts: `variant:qty,` per line in cart order. */
export function cartSignature(state: Pick<Cart, 'items'>): string {
  return state.items.map((line) => `${line.variant_id}:${line.quantity},`).join('');
}

const attemptKey = (code: string, signature: string, applied: string[]): string =>
  `${code}@${signature}@${[...applied].sort().join('+')}`;

/** Promotion data rendered into the current cart section (deduped, highest priority kept). */
export function readPromotions(root: ParentNode = document): CartPromotions | null {
  const node = root.querySelector<HTMLScriptElement>('script[data-cart-promotions]');
  if (!node?.textContent) return null;
  try {
    const data = JSON.parse(node.textContent) as { signature?: unknown; codes?: unknown };
    const byCode = new Map<string, PromotionCode>();
    for (const entry of Array.isArray(data.codes) ? data.codes : []) {
      const raw = (entry as { code?: unknown }).code;
      const priority = Number((entry as { priority?: unknown }).priority) || 0;
      if (typeof raw !== 'string' || !raw.trim() || raw.includes(',')) continue;
      const code = normalizeCode(raw);
      const known = byCode.get(code);
      if (!known || priority > known.priority) byCode.set(code, { code, priority });
    }
    return { signature: typeof data.signature === 'string' ? data.signature : '', codes: [...byCode.values()] };
  } catch {
    return null;
  }
}

/** Decide the next mutation, or none. Pure: all inputs are explicit. */
export function nextStep(input: {
  current: CartDiscountCode[];
  promotions: PromotionCode[];
  memory: Memory;
  signature: string;
}): Step {
  const { current, promotions, memory, signature } = input;
  const codes = codesOf(current);
  const auto = new Set(memory.auto);
  const wanted = new Set(promotions.map((promo) => promo.code));

  const stale = current
    .filter((entry) => auto.has(normalizeCode(entry.code)) && (!entry.applicable || !wanted.has(normalizeCode(entry.code))))
    .map((entry) => normalizeCode(entry.code));
  if (stale.length) return { type: 'cleanup', codes: codes.filter((code) => !stale.includes(code)), removed: stale };

  const applied = appliedOf(current);
  const tried = new Set(memory.tried);
  const declined = new Set(memory.declined);
  // Stable sort: equal priorities keep Liquid's order (product codes, then storewide slots).
  const candidate = [...promotions]
    .sort((a, b) => b.priority - a.priority)
    .find((promo) => !codes.includes(promo.code) && !declined.has(promo.code) && !tried.has(attemptKey(promo.code, signature, applied)));
  if (candidate) return { type: 'try', codes: [...codes, candidate.code], candidate: candidate.code };
  return { type: 'none' };
}

/** Judge Shopify's answer to adding `candidate`. Returns the code list the cart should end with. */
export function judgeAttempt(input: {
  before: CartDiscountCode[];
  after: CartDiscountCode[];
  candidate: string;
  auto: string[];
  priorities: Map<string, number>;
  rule: 'keep' | 'priority';
}): Verdict {
  const { before, after, candidate, auto, priorities, rule } = input;
  const revert = codesOf(before);
  const result = after.find((entry) => normalizeCode(entry.code) === candidate);
  if (!result?.applicable) return { codes: revert, outcome: 'rejected', displaced: [] };

  const nowApplied = new Set(appliedOf(after));
  const displaced = appliedOf(before).filter((code) => !nowApplied.has(code));
  if (!displaced.length) return { codes: codesOf(after), outcome: 'applied', displaced };

  const autoSet = new Set(auto);
  const mine = priorities.get(candidate) ?? 0;
  const keepExisting = rule === 'keep'
    || displaced.some((code) => !autoSet.has(code))
    || displaced.some((code) => (priorities.get(code) ?? 0) >= mine);
  if (keepExisting) return { codes: revert, outcome: 'kept-existing', displaced };
  return { codes: codesOf(after).filter((code) => !displaced.includes(code)), outcome: 'replaced', displaced };
}

/* ----------------------------------------------------------------- memory (per cart, per tab) */

const memoryKey = (token: string) => `nk:promotions:${token.split('?')[0]}`;
let fallbackMemory: Record<string, Memory> = {};

export function loadMemory(token: string): Memory {
  const key = memoryKey(token);
  try {
    const raw = sessionStorage.getItem(key);
    if (raw) {
      const value = JSON.parse(raw) as Partial<Memory>;
      return { auto: value.auto ?? [], tried: value.tried ?? [], declined: value.declined ?? [] };
    }
  } catch {
    /* storage unavailable: fall through to in-memory state */
  }
  return fallbackMemory[key] ?? { auto: [], tried: [], declined: [] };
}

export function saveMemory(token: string, memory: Memory): void {
  const key = memoryKey(token);
  const value: Memory = {
    auto: [...new Set(memory.auto)],
    tried: [...new Set(memory.tried)].slice(-MAX_TRIED),
    declined: [...new Set(memory.declined)],
  };
  fallbackMemory[key] = value;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* in-memory only */
  }
}

/** Mark codes as the shopper's own: they are never removed or displaced automatically. */
export function markManual(token: string, codes: string[], declined: string[] = []): void {
  const memory = loadMemory(token);
  const manual = new Set(codes.map(normalizeCode));
  memory.auto = memory.auto.filter((code) => !manual.has(code));
  memory.declined = [...memory.declined, ...declined.map(normalizeCode)];
  saveMemory(token, memory);
}

export function isAuto(token: string, code: string): boolean {
  return loadMemory(token).auto.includes(normalizeCode(code));
}

/* ----------------------------------------------------------------------------- controller */

let running = false;
let again = false;
let installed = false;
let holds = 0;
const idleWaiters: Array<() => void> = [];

/** Call after holding promotions, before reading a replacement list for a shopper transaction. */
export function waitForPromotions(): Promise<void> {
  return running ? new Promise(resolve => idleWaiters.push(resolve)) : Promise.resolve();
}

/**
 * Pause automatic changes while the shopper's own code change is in flight (its intermediate cart
 * states must not look like removed codes). Returns the release function; a run follows release.
 */
export function holdPromotions(): () => void {
  holds += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    holds -= 1;
    if (holds === 0) void reconcilePromotions();
  };
}

/** Reconcile the cart's codes with its promotions. Safe to call any time; runs are serialized. */
export async function reconcilePromotions(known?: Cart): Promise<void> {
  if (running || holds > 0) {
    if (running) again = true;
    return;
  }
  running = true;
  try {
    let state = known ?? (await cart.read());
    for (let step = 0; step < MAX_STEPS; step += 1) {
      if (holds > 0) return;
      const promotions = readPromotions();
      // No cart section on the page, or its HTML is from an older cart state: wait for the next
      // nk:cart:updated rather than acting on stale associations.
      if (!promotions || promotions.signature !== cartSignature(state)) return;
      const memory = loadMemory(state.token);
      if (!promotions.codes.length && !memory.auto.length) return;
      const signature = promotions.signature;
      const plan = nextStep({ current: state.discount_codes ?? [], promotions: promotions.codes, memory, signature });
      if (plan.type === 'none') {
        remember(CHECKED_KEY, checkedValue(promotions));
        return;
      }

      if (plan.type === 'cleanup') {
        const applied = appliedOf(state.discount_codes).filter((code) => !plan.removed.includes(code));
        state = (await cart.discounts(plan.codes, SOURCE)).cart;
        memory.auto = memory.auto.filter((code) => !plan.removed.includes(code));
        memory.tried.push(...plan.removed.map((code) => attemptKey(code, signature, applied)));
        saveMemory(state.token, memory);
        continue;
      }

      const before = state.discount_codes ?? [];
      const key = attemptKey(plan.candidate, signature, appliedOf(before));
      const attempt: CartResult = await cart.discounts(plan.codes, SOURCE);
      const verdict = judgeAttempt({
        before,
        after: attempt.cart.discount_codes ?? [],
        candidate: plan.candidate,
        auto: memory.auto,
        priorities: new Map(promotions.codes.map((promo) => [promo.code, promo.priority])),
        rule: config().promotions?.conflictRule ?? 'keep',
      });
      state = attempt.cart;
      if (verdict.outcome === 'applied' || verdict.outcome === 'replaced') {
        memory.auto.push(plan.candidate);
        memory.auto = memory.auto.filter((code) => !verdict.displaced.includes(code));
      } else {
        memory.tried.push(key);
      }
      saveMemory(state.token, memory);
      const held = codesOf(state.discount_codes);
      if (held.length !== verdict.codes.length || held.some((code, index) => code !== verdict.codes[index])) {
        state = (await cart.discounts(verdict.codes, SOURCE)).cart;
      }
    }
  } catch (error) {
    // A failed promotion attempt never blocks shopping; the cart shows Shopify's real state.
    console.warn('Promotion codes could not be updated', error);
  } finally {
    running = false;
    for (const resolve of idleWaiters.splice(0)) resolve();
    if (again) {
      again = false;
      void reconcilePromotions();
    }
  }
}

export function installPromotions(): void {
  if (installed) return;
  installed = true;
  document.addEventListener('nk:cart:updated', (event) => {
    const detail = (event as CustomEvent<CartResult & { sourceId: string }>).detail;
    // Our own steps continue inside the running reconcile.
    if (detail.sourceId === SOURCE) return;
    void reconcilePromotions(detail.cart);
  });
  // Items may have been added on another page, without JS, or by an app: check once per load
  // when this cart has associations (one GET; nothing is sent unless a code needs trying).
  const promotions = readPromotions();
  if (promotions && recall(CHECKED_KEY) === checkedValue(promotions)) return;
  if (promotions?.codes.length || hasAutoMemory()) void reconcilePromotions();
}

const CHECKED_KEY = 'nk:promotions:checked';
const checkedValue = (promotions: CartPromotions) =>
  `${promotions.signature}|${promotions.codes.map((promo) => promo.code).sort().join('+')}`;

function remember(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function recall(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function hasAutoMemory(): boolean {
  try {
    for (let index = 0; index < sessionStorage.length; index += 1) {
      const key = sessionStorage.key(index);
      if (key?.startsWith('nk:promotions:') && (JSON.parse(sessionStorage.getItem(key) ?? '{}') as Partial<Memory>).auto?.length) return true;
    }
  } catch {
    /* ignore */
  }
  return Object.values(fallbackMemory).some((memory) => memory.auto.length > 0);
}

/** Test hook. */
export function resetPromotionsForTests(): void {
  running = false;
  again = false;
  installed = false;
  holds = 0;
  for (const resolve of idleWaiters.splice(0)) resolve();
  fallbackMemory = {};
}
