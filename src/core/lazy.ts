/**
 * Loads a component module only when its tag is on the page (master-plan/12 §3 loading rules).
 * Each loader is a dynamic import, so Vite emits it as its own chunk (+ CSS) next to the entry in
 * theme/assets, fetched from the CDN relative to the entry's URL.
 *
 * Runs on startup and again for every section the theme editor inserts or re-renders.
 */
type Loader = () => Promise<unknown>;

const loaders = new Map<string, Loader>();
const started = new Set<string>();

export function registerLazy(tag: string, loader: Loader): void {
  loaders.set(tag, loader);
}

export function loadFor(root: ParentNode = document): void {
  for (const [tag, loader] of loaders) {
    if (started.has(tag) || customElements.get(tag)) continue;
    if (!root.querySelector(tag)) continue;
    started.add(tag);
    loader().catch((error: unknown) => {
      started.delete(tag); // allow a retry on the next section load
      console.error(`Failed to load <${tag}>`, error);
    });
  }
}

export function installLazyLoader(): void {
  loadFor(document);
  document.addEventListener('shopify:section:load', (event) => loadFor(event.target as ParentNode));
  // Sections swapped in by the theme itself (cart, variant re-render) announce themselves too.
  document.addEventListener('nk:section:replaced', (event) => loadFor(event.target as ParentNode));
}
