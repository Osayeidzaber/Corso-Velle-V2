/** Parse an HTML string (from Section Rendering) into a detached document. */
export function parseHTML(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

/**
 * Remember the focused control inside `root` by its data-focus-key so it can be restored after
 * the region is replaced.
 */
export function captureFocus(root: Element): string | null {
  const active = document.activeElement;
  if (!active || !root.contains(active)) return null;
  return active.closest<HTMLElement>('[data-focus-key]')?.dataset.focusKey ?? null;
}

export function restoreFocus(root: Element, key: string | null): void {
  if (!key) return;
  root.querySelector<HTMLElement>(`[data-focus-key="${CSS.escape(key)}"]`)?.focus({ preventScroll: true });
}

const ICON_PATHS = {
  close: 'M5 5l14 14M19 5L5 19',
  check: 'M5 12.5l4.5 4.5L19 7.5',
} as const;

/**
 * Same stroke icon as snippets/icon.liquid, for controls built in script. Drawn rather than typed:
 * phones may render symbol characters (× ✓) as colour emoji or in a fallback font.
 */
export function icon(name: keyof typeof ICON_PATHS, size = 22): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const attributes: Record<string, string> = {
    class: `icon icon--${name}`,
    width: String(size),
    height: String(size),
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '1.8',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
    focusable: 'false',
  };
  for (const [key, value] of Object.entries(attributes)) svg.setAttribute(key, value);
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', ICON_PATHS[name]);
  svg.append(path);
  return svg;
}
