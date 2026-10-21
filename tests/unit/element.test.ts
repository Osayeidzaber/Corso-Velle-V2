import { describe, expect, it, vi } from 'vitest';
import { define } from '../../src/core/define';
import { NkElement } from '../../src/core/element';

/** Editor lifecycle contract (master-plan/11 §1): independent instances, full cleanup, reconnect. */
const clicks = vi.fn();
const disposed = vi.fn();

class TestElement extends NkElement {
  mounts = 0;
  protected mount(): void {
    this.mounts++;
    this.on(document, 'click', () => clicks(this.id));
    this.later(() => clicks(`${this.id}-timer`), 5);
    this.dispose(() => disposed(this.id));
  }
}
define('nk-test-element', TestElement);

describe('NkElement lifecycle', () => {
  it('releases listeners and timers on removal and re-mounts cleanly on reinsertion', async () => {
    clicks.mockClear();
    disposed.mockClear();
    document.body.innerHTML = '<nk-test-element id="a"></nk-test-element><nk-test-element id="b"></nk-test-element>';
    const a = document.getElementById('a') as TestElement;

    document.body.click();
    expect(clicks.mock.calls.map((c) => c[0]).sort()).toEqual(['a', 'b']);

    a.remove(); // editor deletes section A
    expect(disposed).toHaveBeenCalledWith('a');
    clicks.mockClear();
    document.body.click();
    expect(clicks.mock.calls.map((c) => c[0])).toEqual(['b']);

    await new Promise((resolve) => setTimeout(resolve, 15));
    expect(clicks.mock.calls.map((c) => c[0])).not.toContain('a-timer');

    document.body.append(a); // editor re-inserts (reorder)
    expect(a.mounts).toBe(2);
    clicks.mockClear();
    document.body.click();
    expect(clicks.mock.calls.map((c) => c[0]).sort()).toEqual(['a', 'b']);
  });

  it('defines a tag only once', () => {
    expect(() => define('nk-test-element', TestElement)).not.toThrow();
  });
});
