import { define } from '../../core/define';
import { NkElement } from '../../core/element';
import { decorativeMotionAllowed } from '../../core/motion';

/**
 * <nk-rec-tabs>: Recommended / Best Sellers / New Arrivals above the product page's 3×3 grid
 * (sections/product-recommendations.liquid). Recommended is server-rendered. The other tabs
 * fetch sections/product-tab-grid.liquid for their collection URL the first time they're chosen,
 * then stay cached. Tabs follow the ARIA tabs pattern: arrow keys move between them.
 */
export class NkRecTabs extends NkElement {
  protected mount(): void {
    const tabs = [...this.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    const panels = [...this.querySelectorAll<HTMLElement>('[role="tabpanel"]')];
    if (!tabs.length) return;

    const select = (index: number, focus = false) => {
      tabs.forEach((tab, i) => {
        const on = i === index;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        const panel = panels[i];
        if (panel) panel.hidden = !on;
      });
      if (focus) tabs[index]?.focus();
      const panel = panels[index];
      if (panel) void this.#load(panel);
    };

    tabs.forEach((tab, i) => {
      this.on(tab, 'click', () => select(i));
      this.on(tab, 'keydown', (event) => {
        const key = (event as KeyboardEvent).key;
        const step = key === 'ArrowRight' ? 1 : key === 'ArrowLeft' ? -1 : 0;
        if (key === 'Home' || key === 'End') {
          event.preventDefault();
          select(key === 'Home' ? 0 : tabs.length - 1, true);
        } else if (step) {
          event.preventDefault();
          select((i + step + tabs.length) % tabs.length, true);
        }
      });
    });
  }

  async #load(panel: HTMLElement): Promise<void> {
    const url = panel.dataset.src;
    if (!url || panel.dataset.loaded) return;
    panel.dataset.loaded = 'pending';
    panel.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch(url, { headers: { Accept: 'text/html' } });
      if (!response.ok) throw new Error(String(response.status));
      const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
      const grid = doc.querySelector('[data-tab-grid]');
      if (!grid) throw new Error('no grid');
      panel.replaceChildren(grid);
      panel.dataset.loaded = 'true';
      if (decorativeMotionAllowed()) {
        grid.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 360, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
      }
    } catch {
      delete panel.dataset.loaded;
      panel.querySelector('[data-tab-status]')?.removeAttribute('hidden');
    } finally {
      panel.removeAttribute('aria-busy');
    }
  }
}
define('nk-rec-tabs', NkRecTabs);
