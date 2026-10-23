import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('../../src/core/motion', () => ({ animate: vi.fn() }));
import { NkTabs } from '../../src/components/tabs/tabs';
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
});
afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals(); });
function mount(id: string, vertical = false) {
  const root = document.createElement('nk-tabs') as NkTabs;
  if (vertical) root.dataset.orientation = 'vertical';
  root.innerHTML = `<div data-ref="tablist" hidden><button id="${id}-a" data-ref="tab">A</button><button id="${id}-b" data-ref="tab">B</button><span data-ref="indicator"></span></div><div id="${id}-pa" data-ref="panel" data-block-id="a">First</div><div id="${id}-pb" data-ref="panel" data-block-id="b">Second</div>`;
  document.body.append(root); return root;
}
it('supports vertical arrow navigation independently from another tab section', () => {
  const first = mount('first', true); const second = mount('second');
  first.querySelector('[data-ref="tablist"]')!.dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowDown',bubbles:true}));
  expect(first.querySelector('[aria-selected="true"]')?.id).toBe('first-b');
  expect(second.querySelector('[aria-selected="true"]')?.id).toBe('second-a');
  expect(first.querySelector('[role="tablist"]')?.getAttribute('aria-orientation')).toBe('vertical');
});
it('reveals editor-selected blocks and restores stacked content during disconnect', () => {
  const root = mount('editor'); root.onEditorSelect('b');
  expect(root.querySelector<HTMLElement>('#editor-pb')?.hidden).toBe(false);
  root.remove();
  expect([...root.querySelectorAll<HTMLElement>('[data-ref="panel"]')].every(panel => !panel.hidden)).toBe(true);
  document.body.append(root);
  expect(root.querySelectorAll('[role="tab"]')).toHaveLength(2);
  expect(root.querySelectorAll('[aria-selected="true"]')).toHaveLength(1);
});
