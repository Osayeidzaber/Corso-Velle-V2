import { define } from '../../core/define';
import { NkElement } from '../../core/element';
import './image-compare.css';

/**
 * <nk-image-compare> — before/after slider for sections/image-compare.liquid. The clip-path
 * layering follows daisyUI's diff component (MIT); instead of its CSS `resize` handle (mouse
 * only) a transparent native range input spans the frame, which gives drag, tap-to-jump, arrow
 * keys and an accessible name for free. Without JS the range stays hidden at the start position.
 */
export class NkImageCompare extends NkElement {
  protected mount(): void {
    const range = this.ref<HTMLInputElement>('range');
    if (!range) return;
    range.hidden = false;
    const update = () => this.style.setProperty('--position', `${range.value}%`);
    update();
    this.on(range, 'input', update);
    this.dispose(() => { range.hidden = true; });
  }
}

define('nk-image-compare', NkImageCompare);
