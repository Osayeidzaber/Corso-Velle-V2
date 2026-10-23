import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const motion = vi.hoisted(() => ({ animate: vi.fn(), cancel: vi.fn() }));
vi.mock('../../src/core/motion', () => ({
  transitionsAllowed: () => true, animate: motion.animate, durations:{small:200,overlayIn:280}, easing:{in:'ease',out:'ease'},
}));
import { NkDisclosure } from '../../src/components/disclosure/disclosure';
if (!customElements.get('nk-disclosure')) customElements.define('nk-disclosure', NkDisclosure);
beforeEach(() => { motion.animate.mockReturnValue({ cancel:motion.cancel }); });
afterEach(() => { document.body.innerHTML = ''; vi.clearAllMocks(); });
function mount(instant = false) {
  const root = document.createElement('nk-disclosure') as NkDisclosure;
  if (instant) root.setAttribute('no-animation','');
  root.innerHTML = '<details><summary>Question</summary><div class="disclosure__content">Answer</div></details>';
  const content = root.querySelector<HTMLElement>('div')!; content.animate = vi.fn();
  document.body.append(root); return {root, content, details:root.querySelector('details')!, summary:root.querySelector('summary')!};
}
it('lets the native disclosure toggle immediately when animation is disabled', () => {
  const item = mount(true); item.summary.click();
  expect(item.details.open).toBe(true); expect(motion.animate).not.toHaveBeenCalled();
});
it('cancels opening work and clears clipping when a question is removed', () => {
  const item = mount(); item.summary.click();
  expect(item.content.style.overflow).toBe('hidden'); item.root.remove();
  expect(motion.cancel).toHaveBeenCalled(); expect(item.content.style.overflow).toBe('');
});
it('opens selected editor content independently and restores its previous closed state', () => {
  const first = mount(true); const second = mount(true);
  first.root.onEditorSelect();
  expect(first.details.open).toBe(true); expect(second.details.open).toBe(false);
  first.root.onEditorDeselect(); expect(first.details.open).toBe(false);
});
