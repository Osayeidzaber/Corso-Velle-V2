import type { NkElement } from '../core/element';

/**
 * Theme editor adapter. Translates Shopify's editor events into calls on the
 * owning component so selected content is revealed (open accordion, show slide, pause motion)
 * without page reloads. Components opt in by implementing onEditorSelect/onEditorDeselect.
 */
type EditorAware = NkElement & {
  onEditorSelect?: (blockId?: string) => void;
  onEditorDeselect?: (blockId?: string) => void;
};

function ownersOf(target: EventTarget | null): EditorAware[] {
  if (!(target instanceof Element)) return [];
  const owners: EditorAware[] = [];
  let node: Element | null = target;
  while (node) {
    if (node.localName.startsWith('nk-') && typeof (node as EditorAware).onEditorSelect === 'function') {
      owners.push(node as EditorAware);
    }
    node = node.parentElement;
  }
  return owners;
}

function componentsIn(target: EventTarget | null): EditorAware[] {
  if (!(target instanceof Element)) return [];
  return [...target.querySelectorAll('*')].filter(
    (el): el is EditorAware => el.localName.startsWith('nk-') && typeof (el as EditorAware).onEditorSelect === 'function',
  );
}

export function isDesignMode(): boolean {
  return Boolean(window.Shopify?.designMode);
}

let installed = false;

export function installEditorAdapter(): void {
  if (installed || !isDesignMode()) return;
  installed = true;
  document.documentElement.classList.add('nk-design-mode');

  document.addEventListener('shopify:block:select', (event) => {
    const blockId = (event as CustomEvent<{ blockId: string }>).detail?.blockId;
    for (const owner of ownersOf(event.target)) owner.onEditorSelect?.(blockId);
  });
  document.addEventListener('shopify:block:deselect', (event) => {
    const blockId = (event as CustomEvent<{ blockId: string }>).detail?.blockId;
    for (const owner of ownersOf(event.target)) owner.onEditorDeselect?.(blockId);
  });
  document.addEventListener('shopify:section:select', (event) => {
    for (const component of componentsIn(event.target)) component.onEditorSelect?.();
  });
  document.addEventListener('shopify:section:deselect', (event) => {
    for (const component of componentsIn(event.target)) component.onEditorDeselect?.();
  });
  // section:load / section:unload need no handling: custom element callbacks cover them.
}
