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
