import { afterEach, describe, expect, it, vi } from 'vitest';
import { overlay } from '../../src/services/overlay';

function dialog(): HTMLDialogElement {
  const element = document.createElement('dialog');
  element.innerHTML = '<button data-autofocus>Close</button>';
  element.showModal = () => element.setAttribute('open', '');
  element.close = () => { element.removeAttribute('open'); element.dispatchEvent(new Event('close')); };
  document.body.append(element);
  return element;
}
afterEach(() => { overlay.closeAll(); document.body.replaceChildren(); });

describe('shared overlay lifecycle', () => {
  it('keeps one modal open, marks the overlay state, and returns focus', () => {
    const trigger = document.createElement('button'); document.body.append(trigger);
    const first = dialog(); const second = dialog();
    overlay.open(first, { trigger });
    overlay.open(second, { trigger });
    expect(first.open).toBe(false);
    expect(second.open).toBe(true);
    expect(document.documentElement.hasAttribute('data-overlay-open')).toBe(true);
    overlay.close(second);
    expect(document.activeElement).toBe(trigger);
    expect(document.documentElement.classList.contains('nk-locked')).toBe(false);
  });

  it('releases scroll lock when the theme editor removes an open dialog', async () => {
    const element = dialog(); overlay.open(element); element.remove();
    await vi.waitFor(() => expect(overlay.current).toBeNull());
    expect(document.documentElement.hasAttribute('data-overlay-open')).toBe(false);
    expect(document.documentElement.classList.contains('nk-locked')).toBe(false);
  });

  it('does not retain a scroll lock when showModal fails', () => {
    const element = dialog(); element.showModal = () => { throw new Error('cannot open'); };
    expect(() => overlay.open(element)).toThrow('cannot open');
    expect(overlay.current).toBeNull();
    expect(document.documentElement.classList.contains('nk-locked')).toBe(false);
  });
});
