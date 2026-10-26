/**
 * Measurement units shared by the product measurement panel, the size guide table and the
 * carousel's size preview. One storage key and one `nk:unit:changed` event keep every chart on
 * the page in the same unit; values are authored in a base unit and converted for display.
 */
export type MeasureUnit = 'in' | 'cm';

export const CM_PER_INCH = 2.54;
const STORAGE_KEY = 'nk:measure-unit';

export function storedUnit(): MeasureUnit | null {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved === 'in' || saved === 'cm' ? saved : null;
  } catch {
    return null;
  }
}

export function storeUnit(unit: MeasureUnit): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, unit);
  } catch {
    // Storage can be unavailable (private mode, blocked site data); the unit still applies here.
  }
}

/** The unit carried by an `nk:unit:changed` event from another source, or null. */
export function unitFromEvent(event: Event, self: Element): MeasureUnit | null {
  const detail = (event as CustomEvent<{ unit?: string; source?: Element }>).detail;
  if (!detail || detail.source === self) return null;
  return detail.unit === 'in' || detail.unit === 'cm' ? detail.unit : null;
}

/** Display value for an authored measurement, rounded to one decimal. */
export function convertMeasure(value: number, base: MeasureUnit, unit: MeasureUnit): number {
  const converted = base === unit ? value : unit === 'cm' ? value * CM_PER_INCH : value / CM_PER_INCH;
  return Math.round(converted * 10) / 10;
}

export function panelBaseUnit(panel: HTMLElement): MeasureUnit {
  return panel.dataset.baseUnit === 'cm' ? 'cm' : 'in';
}

/** Show a [data-measurement-panel] in `unit` (or its base unit when the merchant disabled switching). */
export function applyPanelUnit(panel: HTMLElement, unit: MeasureUnit): void {
  const base = panelBaseUnit(panel);
  if (panel.hasAttribute('data-unit-switch-disabled')) unit = base;
  if (panel.dataset.shownUnit === unit) return;
  panel.dataset.shownUnit = unit;
  for (const button of panel.querySelectorAll<HTMLElement>('[data-measure-unit]')) {
    button.setAttribute('aria-pressed', String(button.dataset.measureUnit === unit));
  }
  for (const suffix of panel.querySelectorAll<HTMLElement>('[data-measure-suffix]')) suffix.textContent = unit;
  for (const element of panel.querySelectorAll<HTMLElement>('[data-measure-value]')) {
    const source = element.dataset.measureValue?.trim() ?? '';
    const raw = Number(source);
    if (!source || !Number.isFinite(raw)) {
      // Text values (e.g. "One size") are shown as authored, labelled with the authored unit.
      element.textContent = source;
      const suffix = element.parentElement?.querySelector<HTMLElement>('[data-measure-suffix]');
      if (suffix) suffix.textContent = base;
      continue;
    }
    element.textContent = String(convertMeasure(raw, base, unit));
  }
}

/** Show one size's row in a measurement panel; returns whether the panel has data for it. */
export function showMeasurementRow(panel: HTMLElement, size: string): boolean {
  const key = size.trim().toUpperCase();
  const rows = [...panel.querySelectorAll<HTMLElement>('[data-measurement-row]')];
  const matched = rows.find((row) => (row.dataset.measurementRow ?? '').trim().toUpperCase() === key);
  for (const row of rows) row.hidden = row !== matched;
  const activeLabel = panel.querySelector<HTMLElement>('[data-measurement-active-size]');
  const label = [...panel.querySelectorAll<HTMLTemplateElement>('[data-measurement-size-label]')]
    .find((entry) => entry.dataset.measurementSizeLabel === key)?.content.textContent;
  if (activeLabel) activeLabel.textContent = label?.trim() || size;
  const empty = panel.querySelector<HTMLElement>('[data-measurement-empty]');
  if (empty) empty.hidden = Boolean(matched);
  for (const detail of panel.querySelectorAll<HTMLElement>('.measurement-panel__basis, .measurement-panel__actions')) detail.hidden = !matched;
  const footer = panel.querySelector<HTMLElement>('[data-measurement-footer]');
  if (footer) footer.hidden = !matched;
  return Boolean(matched);
}
