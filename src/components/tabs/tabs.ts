import { define } from '../../core/define';
import { NkElement } from '../../core/element';
import { animate } from '../../core/motion';

/**
 * <nk-tabs> — accessible tabs with a sliding indicator and panel transition (master-plan/05 T4).
 * Clean-room rewrite of the supplied tabswithtransctition example (motion-primitives
 * TransitionPanel), adding the WAI-ARIA tabs pattern the example lacked.
 *
 * Liquid renders every panel with its own heading and a hidden tab list, so without JS the
 * content reads as stacked sections. With JS: roving tabindex, ←/→/Home/End, automatic
 * activation, indicator moved with transforms, 120ms opacity/8px panel transition (no blur).
 */
export class NkTabs extends NkElement {
  #tabs: HTMLButtonElement[] = [];
  #panels: HTMLElement[] = [];
  #index = 0;

  protected mount(): void {
    const list = this.ref('tablist');
    this.#tabs = this.refs<HTMLButtonElement>('tab');
    this.#panels = this.refs('panel');
    if (!list || this.#tabs.length < 2 || this.#tabs.length !== this.#panels.length) return;

    list.hidden = false;
    this.setAttribute('data-enhanced', '');
    list.setAttribute('role', 'tablist');
    list.setAttribute('aria-label', this.getAttribute('label') ?? '');
    this.#tabs.forEach((tab, i) => {
      const panel = this.#panels[i]!;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', panel.id);
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id);
      panel.tabIndex = 0;
    });

    this.on(list, 'click', (event) => {
      const tab = (event.target as Element).closest<HTMLButtonElement>('[data-ref="tab"]');
      if (tab) this.select(this.#tabs.indexOf(tab), true);
    });
    this.on(list, 'keydown', (event) => {
      const keys: Record<string, number> = {
        ArrowRight: this.#index + 1,
        ArrowLeft: this.#index - 1,
        ...(list.getAttribute('aria-orientation') === 'vertical' ? { ArrowDown: this.#index + 1, ArrowUp: this.#index - 1 } : {}),
        Home: 0,
        End: this.#tabs.length - 1,
      };
      if (!(event.key in keys)) return;
      event.preventDefault();
      const next = (keys[event.key]! + this.#tabs.length) % this.#tabs.length;
      this.select(next, true);
      this.#tabs[next]?.focus();
    });
    this.observeResize(list, () => this.#moveIndicator(false));

    const initial = Math.max(0, this.#tabs.findIndex((tab) => tab.hasAttribute('data-selected')));
    this.select(initial, false);
    this.dispose(() => {
      list.hidden = true;
      this.removeAttribute('data-enhanced');
      this.#panels.forEach((panel) => { panel.hidden = false; panel.removeAttribute('role'); panel.removeAttribute('aria-labelledby'); panel.removeAttribute('tabindex'); });
    });
  }

  override onEditorSelect(blockId?: string): void {
    if (!blockId) return;
    const index = this.#panels.findIndex((panel) => panel.dataset.blockId === blockId);
    if (index >= 0) this.select(index, false);
  }

  select(index: number, animated: boolean): void {
    if (index < 0 || index >= this.#tabs.length) return;
    const previous = this.#index;
    this.#index = index;
    this.#tabs.forEach((tab, i) => {
      const active = i === index;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      this.#panels[i]!.hidden = !active;
    });
    this.#moveIndicator(animated);
    if (animated && previous !== index && !this.hasAttribute('no-transition')) {
      const panel = this.#panels[index]!;
      animate(
        panel,
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: 280, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
        { decorative: true },
      );
      panel.querySelectorAll<HTMLElement>('[data-stagger-item], [data-tab-item]').forEach((item, i) => {
        if (i > 11) return;
        animate(
          item,
          [
            { opacity: 0, transform: 'translateY(22px)' },
            { opacity: 1, transform: 'none' },
          ],
          { duration: 580, delay: 40 + i * 45, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' },
          { decorative: true },
        );
        const img = item.querySelector<HTMLElement>('.card__media > img:first-child');
        if (img) {
          animate(
            img,
            [{ transform: 'scale(1.045)' }, { transform: 'scale(1)' }],
            { duration: 780, delay: 40 + i * 45, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' },
            { decorative: true },
          );
        }
      });
    }
    this.emit('nk:tabs:change', { index });
  }

  #moveIndicator(animated: boolean): void {
    const indicator = this.ref('indicator');
    const tab = this.#tabs[this.#index];
    const list = this.ref('tablist');
    if (!indicator || !tab || !list) return;
    list.setAttribute('aria-orientation', this.dataset.orientation === 'vertical' && matchMedia('(min-width: 990px)').matches ? 'vertical' : 'horizontal');
    indicator.style.transition = animated ? '' : 'none';
    indicator.style.width = `${tab.offsetWidth}px`;
    indicator.style.transform = `translateX(${tab.offsetLeft - list.scrollLeft}px)`;
  }
}

define('nk-tabs', NkTabs);
