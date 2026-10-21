import { animate, decorativeMotionAllowed, durations, easing } from '../../core/motion';
import { NkModal } from '../modal/modal';

/**
 * <nk-nav-drawer> (master-plan/06 N-04): phone menu dialog with level panels.
 *
 * Markup: every panel is `[data-level-panel="<id>"]` (root is "root"); a row with children has a
 * `<button data-level-open="<id>">`; nested panels have `<button data-level-back>`. Going back
 * restores the parent's scroll position and focuses the row that opened the child panel.
 * The drawer closes when the viewport reaches the desktop breakpoint.
 */
export class NkNavDrawer extends NkModal {
  #stack: Array<{ id: string; scroll: number; opener: string | null }> = [];

  protected override mount(): void {
    super.mount();
    this.on(this.dialog, 'click', (event) => {
      const target = event.target as Element;
      const opener = target.closest<HTMLButtonElement>('[data-level-open]');
      if (opener) this.#push(opener.dataset.levelOpen!, opener);
      if (target.closest('[data-level-back]')) this.#pop();
    });
    this.on(this.dialog, 'keydown', (event) => {
      // Escape inside a nested level goes back one level first; at root the dialog closes.
      if (event.key === 'Escape' && this.#stack.length > 1) {
        event.preventDefault();
        this.#pop();
      }
    });
    const desktop = matchMedia('(min-width: 990px)');
    this.on(desktop, 'change', () => {
      if (desktop.matches && this.isOpen) this.close();
    });
  }

  protected override onOpened(): void {
    this.#stack = [{ id: 'root', scroll: 0, opener: null }];
    this.#show('root');
    this.#entrance();
  }

  /**
   * Style-specific entrance (decorative, skipped under reduced motion / Motion off):
   * - editorial (menu.md / StaggeredMenu): two colour layers sweep across, rows rise in sequence;
   * - cards (cardnav): cards rise in sequence.
   */
  #entrance(): void {
    if (!decorativeMotionAllowed()) return;
    const layers = [...this.dialog.querySelectorAll<HTMLElement>('.menu-drawer__layer')];
    layers.forEach((layer, i) => {
      animate(
        layer,
        [{ translate: '-100% 0' }, { translate: '0 0', offset: 0.45 }, { translate: '100% 0' }],
        { duration: 700, delay: i * 70, easing: easing.out },
        { decorative: true },
      );
    });
    const items = [
      ...this.dialog.querySelectorAll<HTMLElement>(
        '[data-level-panel="root"] > .menu-drawer__list > li, [data-level-panel="root"] .menu-card',
      ),
    ].slice(0, 6);
    if (!this.dialog.matches('.menu-drawer--editorial, .menu-drawer--cards')) return;
    items.forEach((item, i) => {
      animate(
        item,
        [
          { opacity: 0, transform: 'translateY(24px)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: durations.overlayIn + 120, delay: 120 + i * durations.stagger, easing: easing.out, fill: 'backwards' },
        { decorative: true },
      );
    });
  }

  protected override onClosed(): void {
    this.#stack = [];
  }

  override onEditorSelect(blockId?: string): void {
    if (!blockId) return;
    const block = this.querySelector(`[data-block-id="${CSS.escape(blockId)}"]`);
    if (!block) return;
    if (!this.isOpen) this.open();
    const panel = block.closest<HTMLElement>('[data-level-panel]');
    if (panel) this.#show(panel.dataset.levelPanel!);
  }

  override onEditorDeselect(): void {
    if (this.isOpen) this.close();
  }

  #panel(id: string): HTMLElement | null {
    return this.dialog.querySelector(`[data-level-panel="${CSS.escape(id)}"]`);
  }

  #push(id: string, opener: HTMLElement): void {
    const current = this.#stack.at(-1);
    if (current) current.scroll = this.#panel(current.id)?.scrollTop ?? 0;
    this.#stack.push({ id, scroll: 0, opener: opener.dataset.levelOpen ?? null });
    this.#show(id);
    this.#panel(id)?.querySelector<HTMLElement>('[data-level-back]')?.focus();
  }

  #pop(): void {
    if (this.#stack.length < 2) return;
    const closing = this.#stack.pop()!;
    const parent = this.#stack.at(-1)!;
    this.#show(parent.id);
    const panel = this.#panel(parent.id);
    if (panel) panel.scrollTop = parent.scroll;
    panel?.querySelector<HTMLElement>(`[data-level-open="${CSS.escape(closing.id)}"]`)?.focus();
  }

  #show(id: string): void {
    for (const panel of this.dialog.querySelectorAll<HTMLElement>('[data-level-panel]')) {
      const active = panel.dataset.levelPanel === id;
      panel.hidden = !active;
      panel.toggleAttribute('data-active', active);
    }
  }
}
