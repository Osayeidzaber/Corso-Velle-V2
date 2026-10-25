import { define } from '../../core/define';
import { NkElement } from '../../core/element';
import './fit-finder.css';

export const FIT_STORAGE_KEY = 'nk:fit-profile';
const CM_PER_INCH = 2.54;
const LB_PER_KG = 2.20462;
const STEPS = 3;

export type Sex = 'female' | 'male';
export type Shape = 'narrow' | 'average' | 'broad';
export type Fit = 'fitted' | 'regular' | 'relaxed';

export interface FitProfile {
  sex: Sex;
  height: number; // cm
  weight: number; // kg
  chest: Shape;
  stomach: Shape;
  fit: Fit;
  heightUnit: 'cm' | 'ftin';
  weightUnit: 'kg' | 'lbs';
}

const DEFAULTS: FitProfile = {
  sex: 'male',
  height: 180,
  weight: 80,
  chest: 'average',
  stomach: 'average',
  fit: 'regular',
  heightUnit: 'cm',
  weightUnit: 'kg',
};

export const SIZE_SCALE = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'] as const;

// Upper chest/bust bound (cm) for each size up to XXL; anything above is 3XL.
const BOUNDS: Record<Sex, number[]> = {
  male: [82, 88, 94, 100, 106, 112, 118],
  female: [74, 80, 86, 92, 98, 104, 110],
};
const CHEST_SHIFT: Record<Shape, number> = { narrow: -3, average: 0, broad: 4 };
const STOMACH_SHIFT: Record<Shape, number> = { narrow: -1, average: 0, broad: 3 };
const FIT_SHIFT: Record<Fit, number> = { fitted: -2, regular: 0, relaxed: 4 };

/**
 * Estimated chest/bust girth in cm from height and weight. A population-average heuristic: it
 * picks a starting size, not a measurement. Shape and fit answers then nudge it.
 */
export function estimateChest(profile: Pick<FitProfile, 'sex' | 'height' | 'weight'>): number {
  return profile.sex === 'male'
    ? 0.5 * profile.weight + 0.25 * profile.height + 16
    : 0.5 * profile.weight + 0.2 * profile.height + 22;
}

export function recommendSize(profile: Partial<FitProfile> & Pick<FitProfile, 'sex' | 'height' | 'weight'>): string {
  const girth =
    estimateChest(profile) +
    CHEST_SHIFT[profile.chest ?? 'average'] +
    STOMACH_SHIFT[profile.stomach ?? 'average'] +
    FIT_SHIFT[profile.fit ?? 'regular'];
  const index = BOUNDS[profile.sex].findIndex((bound) => girth < bound);
  return SIZE_SCALE[index === -1 ? SIZE_SCALE.length - 1 : index]!;
}

/** XXL/2XL and XXXL/3XL are the same size written differently. */
export function normalizeSize(value: string): string {
  const clean = value.trim().toUpperCase().replace(/\s+/g, '');
  const aliases: Record<string, string> = {
    XXXS: 'XXS', '2XS': 'XXS', '2XL': 'XXL', XXXL: '3XL',
    SMALL: 'S', MEDIUM: 'M', LARGE: 'L', 'X-LARGE': 'XL', 'XX-LARGE': 'XXL',
  };
  return aliases[clean] ?? clean;
}

/**
 * Maps a letter size onto the product's own size labels. Letter sizes the product lacks fall to the
 * nearest one it has; non-letter sizing (28, 30, EU 42) returns null so the chart stays in charge.
 */
export function matchProductSize(letter: string, sizes: string[]): string | null {
  const scale: readonly string[] = SIZE_SCALE;
  const lettered = sizes.map((size) => ({ size, rank: scale.indexOf(normalizeSize(size)) })).filter((s) => s.rank >= 0);
  if (!lettered.length) return null;
  const target = scale.indexOf(letter);
  lettered.sort((a, b) => Math.abs(a.rank - target) - Math.abs(b.rank - target) || b.rank - a.rank);
  return lettered[0]!.size;
}

export function loadProfile(): FitProfile | null {
  try {
    const raw = localStorage.getItem(FIT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<FitProfile>;
    if (!Number.isFinite(parsed.height) || !Number.isFinite(parsed.weight)
      || parsed.height! <= 0 || parsed.weight! <= 0) return null;
    // Storage outlives theme upgrades and can contain stale/invalid enum values.
    // In particular, an unknown sex would make BOUNDS[sex] undefined and break mounting.
    const choices = {
      sex: ['female', 'male'], chest: ['narrow', 'average', 'broad'],
      stomach: ['narrow', 'average', 'broad'], fit: ['fitted', 'regular', 'relaxed'],
      heightUnit: ['cm', 'ftin'], weightUnit: ['kg', 'lbs'],
    };
    for (const key of Object.keys(choices) as Array<keyof typeof choices>) {
      if (parsed[key] !== undefined && !choices[key].includes(parsed[key]!)) return null;
    }
    return { ...DEFAULTS, ...parsed };
  } catch {
    return null;
  }
}

function saveProfile(profile: FitProfile): void {
  try {
    localStorage.setItem(FIT_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // private mode: the finder still works for this visit
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * <nk-fit-finder sizes="S,M,L" option="Size"> — three-step size estimate inside the size guide.
 * Step 1 height/weight (live estimate), step 2 body shape, step 3 fit preference and result.
 * The answers are kept in localStorage, so every product page marks the recommended size pill
 * ([data-size-pill][data-recommended]) and fills [data-fit-hint] without opening the guide.
 */
export class NkFitFinder extends NkElement {
  #profile: FitProfile = { ...DEFAULTS };
  #step = 1;
  #sizes: string[] = [];

  protected mount(): void {
    this.#sizes = (this.getAttribute('sizes') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    const saved = loadProfile();
    if (saved) this.#profile = saved;
    this.hidden = false;

    for (const input of this.refs<HTMLInputElement>('choice')) {
      const name = input.name.split(':').pop() as keyof FitProfile;
      input.checked = String(this.#profile[name]) === input.value;
      this.on(input, 'change', () => {
        if (!input.checked) return;
        (this.#profile as unknown as Record<string, string>)[name] = input.value;
        this.#render();
      });
    }
    for (const range of this.refs<HTMLInputElement>('range')) {
      this.on(range, 'input', () => {
        const field = range.dataset.field as 'height' | 'weight';
        this.#profile[field] = Number(range.value);
        this.#render();
      });
    }
    for (const button of this.refs<HTMLButtonElement>('nudge')) {
      this.on(button, 'click', () => this.#nudge(button.dataset.field as 'height' | 'weight', Number(button.value)));
    }
    for (const button of this.refs<HTMLButtonElement>('unit')) {
      this.on(button, 'click', () => {
        if (button.dataset.field === 'height') this.#profile.heightUnit = button.value === 'ftin' ? 'ftin' : 'cm';
        else this.#profile.weightUnit = button.value === 'lbs' ? 'lbs' : 'kg';
        this.#render();
      });
    }
    for (const button of this.refs<HTMLButtonElement>('next')) this.on(button, 'click', () => this.#go(this.#step + 1));
    for (const button of this.refs<HTMLButtonElement>('back')) this.on(button, 'click', () => this.#go(this.#step - 1));
    for (const button of this.refs<HTMLButtonElement>('restart')) this.on(button, 'click', () => this.#go(1));
    const apply = this.ref<HTMLButtonElement>('apply');
    if (apply) this.on(apply, 'click', () => this.#applySize());

    // Only answers the shopper saved may mark a size; the in-memory profile may still be the
    // untouched defaults, which would show "Estimated size L" beside the size they just chose.
    this.on(document, 'nk:variant:changed', () => {
      const saved = loadProfile();
      this.#markPicker(saved ? matchProductSize(recommendSize(saved), this.#sizes) : null);
    });
    this.#render(false);
    this.#go(1, false);
  }

  #nudge(field: 'height' | 'weight', direction: number): void {
    const imperial = field === 'height' ? this.#profile.heightUnit === 'ftin' : this.#profile.weightUnit === 'lbs';
    const step = field === 'height' ? (imperial ? CM_PER_INCH : 1) : imperial ? 1 / LB_PER_KG : 1;
    const range = this.refs<HTMLInputElement>('range').find((el) => el.dataset.field === field);
    const min = Number(range?.min ?? 0);
    const max = Number(range?.max ?? 300);
    this.#profile[field] = clamp(this.#profile[field] + direction * step, min, max);
    this.#render();
  }

  #go(step: number, focus = true): void {
    this.#step = clamp(step, 1, STEPS);
    for (const panel of this.refs('step')) {
      const active = Number(panel.dataset.step) === this.#step;
      panel.hidden = !active;
      if (active && focus) panel.querySelector<HTMLElement>('[data-step-title]')?.focus({ preventScroll: false });
    }
    const counter = this.ref('counter');
    if (counter) counter.textContent = `${String(this.#step).padStart(2, '0')} / ${String(STEPS).padStart(2, '0')}`;
    this.style.setProperty('--fit-progress', String(this.#step / STEPS));
    for (const button of this.refs<HTMLButtonElement>('back')) button.hidden = this.#step === 1;
    for (const button of this.refs<HTMLButtonElement>('next')) button.hidden = this.#step === STEPS;
    if (this.#step === STEPS) this.#render();
  }

  #render(persist = false): void {
    const p = this.#profile;
    this.dataset.sex = p.sex;

    for (const range of this.refs<HTMLInputElement>('range')) {
      const field = range.dataset.field as 'height' | 'weight';
      range.value = String(Math.round(p[field]));
      const percent = ((p[field] - Number(range.min)) / (Number(range.max) - Number(range.min))) * 100;
      range.style.setProperty('--fit-fill', `${clamp(percent, 0, 100)}%`);
      range.setAttribute('aria-valuetext', this.#format(field).join(' '));
    }
    for (const el of this.refs('value')) {
      const [value, unit] = this.#format(el.dataset.field as 'height' | 'weight');
      el.querySelector('[data-part="number"]')!.textContent = value!;
      el.querySelector('[data-part="unit"]')!.textContent = unit!;
    }
    for (const button of this.refs<HTMLButtonElement>('unit')) {
      const current = button.dataset.field === 'height' ? p.heightUnit : p.weightUnit;
      button.setAttribute('aria-pressed', String(button.value === current));
    }

    // Figure grows with height and widens a little with BMI: visible feedback without caricature.
    const bmi = p.weight / (p.height / 100) ** 2;
    this.style.setProperty('--fit-scale-y', String(clamp(p.height / 178, 0.86, 1.1)));
    this.style.setProperty('--fit-scale-x', String(clamp(1 + (bmi - 23) * 0.025, 0.88, 1.2)));

    const letter = recommendSize(p);
    const match = matchProductSize(letter, this.#sizes);
    const shown = match ?? letter;
    for (const el of this.refs('estimate')) el.textContent = shown;
    this.toggleAttribute('data-unmatched', !match);

    const apply = this.ref<HTMLButtonElement>('apply');
    if (apply) {
      const input = this.#sizeInput(match);
      apply.hidden = !input;
      apply.disabled = !!input?.disabled;
      for (const label of apply.querySelectorAll('[data-part="size"]')) label.textContent = shown;
    }

    if (persist) {
      saveProfile(p);
      this.#markPicker(match);
    } else {
      const saved = loadProfile();
      if (saved) this.#markPicker(matchProductSize(recommendSize(saved), this.#sizes));
    }
  }

  #format(field: 'height' | 'weight'): [string, string] {
    const p = this.#profile;
    if (field === 'height') {
      if (p.heightUnit === 'cm') return [String(Math.round(p.height)), 'cm'];
      const inches = Math.round(p.height / CM_PER_INCH);
      return [`${Math.floor(inches / 12)}′${inches % 12}″`, 'ft/in'];
    }
    return p.weightUnit === 'kg' ? [String(Math.round(p.weight)), 'kg'] : [String(Math.round(p.weight * LB_PER_KG)), 'lbs'];
  }

  #scope(): ParentNode {
    return this.closest('[data-product-section]') ?? document;
  }

  #sizeInput(size: string | null): HTMLInputElement | null {
    if (!size) return null;
    const wanted = normalizeSize(size);
    return (
      [...this.#scope().querySelectorAll<HTMLInputElement>('nk-variant-picker [data-size-fieldset] input[type="radio"]')].find(
        (input) => normalizeSize(input.value) === wanted,
      ) ?? null
    );
  }

  #markPicker(match: string | null = matchProductSize(recommendSize(this.#profile), this.#sizes)): void {
    const scope = this.#scope();
    const wanted = match ? normalizeSize(match) : '';
    for (const pill of scope.querySelectorAll<HTMLElement>('[data-size-pill]')) {
      pill.toggleAttribute('data-recommended', !!wanted && normalizeSize(pill.dataset.sizePill ?? '') === wanted);
    }
    for (const hint of scope.querySelectorAll<HTMLElement>('[data-fit-hint]')) {
      hint.hidden = !match;
      const value = hint.querySelector('[data-part="size"]');
      if (value) value.textContent = match ?? '';
    }
  }

  #applySize(): void {
    const input = this.#sizeInput(matchProductSize(recommendSize(this.#profile), this.#sizes));
    if (!input || input.disabled) return;
    saveProfile(this.#profile);
    this.#markPicker();
    if (!input.checked) input.click();
    (this.closest('nk-modal') as (HTMLElement & { close?: () => void }) | null)?.close?.();
  }
}

define('nk-fit-finder', NkFitFinder);
