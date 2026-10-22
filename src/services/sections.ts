import { captureFocus, parseHTML, restoreFocus } from '../core/dom';
import { fetchJSON, fetchText, type RequestOptions } from './request';

/** Section Rendering API (max 5 sections per request; failed sections come back as null). */
export async function renderSections(
  url: string,
  sectionIds: string[],
  options: RequestOptions = {},
): Promise<Record<string, string | null>> {
  if (sectionIds.length === 0 || sectionIds.length > 5) {
    throw new RangeError('Section Rendering accepts 1–5 section ids');
  }
  const target = new URL(url, location.origin);
  target.searchParams.set('sections', sectionIds.join(','));
  return fetchJSON<Record<string, string | null>>(target.toString(), options);
}

/** Single section as raw HTML (used where the response is one region, e.g. variant picker). */
export async function renderSection(url: string, sectionId: string, options: RequestOptions = {}): Promise<string> {
  const target = new URL(url, location.origin);
  target.searchParams.set('section_id', sectionId);
  return fetchText(target.toString(), options);
}

export class MissingFragmentError extends Error {
  override name = 'MissingFragmentError';
}

/**
 * Replace the children of every `[data-region="name"]` inside `scope` with the matching region
 * from `html`. A region missing from the response is a recoverable error; nothing is replaced
 * unless every requested region is present (no half-updated purchase UI).
 */
export function replaceRegions(scope: Element, html: string, regions: string[]): void {
  const incoming = parseHTML(html);
  // Regions the merchant removed (e.g. no price block) are simply skipped; a region present on the
  // page but missing from the response is an error.
  const pairs = regions.flatMap((name) => {
    const current = scope.querySelector(`[data-region="${name}"]`);
    if (!current) return [];
    const next = incoming.querySelector(`[data-region="${name}"]`);
    if (!next) throw new MissingFragmentError(`Region "${name}" missing`);
    // Attributes carry state too (e.g. data-availability on the buy region).
    for (const { name: attr, value } of [...next.attributes]) current.setAttribute(attr, value);
    return [[current, next] as const];
  });
  const focusKey = captureFocus(scope);
  for (const [current, next] of pairs) current.replaceChildren(...[...next.childNodes].map((n) => document.importNode(n, true)));
  restoreFocus(scope, focusKey);
  scope.dispatchEvent(new CustomEvent('nk:section:replaced', { bubbles: true, detail: { regions } }));
}

/** Replace a whole element by id-matching element in the response. */
export function replaceElementById(html: string, id: string): boolean {
  const current = document.getElementById(id);
  const next = parseHTML(html).getElementById(id);
  if (!current || !next) return false;
  const focusKey = captureFocus(current);
  current.replaceWith(document.importNode(next, true));
  const fresh = document.getElementById(id);
  if (fresh) {
    restoreFocus(fresh, focusKey);
    fresh.dispatchEvent(new CustomEvent('nk:section:replaced', { bubbles: true, detail: { id } }));
  }
  return true;
}
