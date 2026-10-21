/** Parse an HTML string (from Section Rendering) into a detached document. */
export function parseHTML(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

/**
 * Remember the focused control inside `root` by its data-focus-key so it can be restored after
 * the region is replaced (master-plan/12 §2).
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
