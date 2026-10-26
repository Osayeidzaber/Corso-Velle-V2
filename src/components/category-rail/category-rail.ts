import { define } from '../../core/define';
import { NkElement } from '../../core/element';
import { prefersReducedMotion } from '../../core/motion';

/** Native swipe/scrollbar with explicit controls; no document wheel interception. */
export class NkCategoryRail extends NkElement {
  protected mount(): void {
    const list = this.querySelector<HTMLUListElement>('ul');
    const previous = this.querySelector<HTMLButtonElement>('[data-category-step="-1"]');
    const next = this.querySelector<HTMLButtonElement>('[data-category-step="1"]');
    if (!list || !previous || !next) return;
    const update = () => {
      const max = list.scrollWidth - list.clientWidth;
      const left = Math.abs(list.scrollLeft);
      previous.disabled = left <= 2;
      next.disabled = left >= max - 2;
      previous.hidden = next.hidden = max < 2;
    };
    this.on(list, 'scroll', update, { passive: true });
    this.observeResize(list, update);
    this.on(this, 'click', event => {
      const button = (event.target as Element).closest<HTMLElement>('[data-category-step]');
      if (!button) return;
      const rtl = getComputedStyle(list).direction === 'rtl' ? -1 : 1;
      list.scrollBy({ left: Number(button.dataset.categoryStep) * list.clientWidth * 0.75 * rtl, behavior: prefersReducedMotion() ? 'instant' : 'smooth' });
    });
    const active = list.querySelector<HTMLElement>('[aria-current="page"]');
    if (active) list.scrollLeft = active.offsetLeft - list.offsetLeft - 16;
    update();
  }
}
define('nk-category-rail', NkCategoryRail);
