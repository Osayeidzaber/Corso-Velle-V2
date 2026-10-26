import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const policy = vi.hoisted(() => ({ mode: 'full', phone: false }));
vi.mock('../../src/core/motion', () => ({ motionMode: () => policy.mode, PHONE_QUERY: '(max-width: 749px)' }));
import '../../src/components/marquee/marquee';

beforeEach(() => {
  policy.mode = 'full'; policy.phone = false;
  vi.stubGlobal('matchMedia', () => ({ matches: policy.phone }));
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
});
afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals(); });

function mount(attributes = '') {
  const element = document.createElement('nk-marquee');
  element.innerHTML = '<div data-ref="track"><ul data-ref="list"><li>First</li><li>Second</li><li>Third</li></ul></div><button data-ref="pause" hidden>Pause</button>';
  for (const name of attributes.split(' ').filter(Boolean)) element.setAttribute(name, '');
  document.body.append(element);
  return element;
}

it.each(['static', 'static-on-phone'])('retains every real item without clones or a pause button for %s', (attribute) => {
  policy.phone = true;
  const element = mount(attribute);
  expect(element.hasAttribute('data-static')).toBe(true);
  expect(element.querySelectorAll('li')).toHaveLength(3);
  expect(element.querySelectorAll('[aria-hidden]')).toHaveLength(0);
  expect(element.querySelector<HTMLButtonElement>('button')?.hidden).toBe(true);
});

it('honors phone motion off for ordinary tickers and keeps repeated instances independent', () => {
  policy.mode = 'off';
  const first = mount(); const second = mount();
  first.remove(); document.body.append(first);
  expect(first.hasAttribute('data-static')).toBe(true);
  expect(second.querySelectorAll('li')).toHaveLength(3);
  expect(first.querySelectorAll('[data-marquee-clone]')).toHaveLength(0);
});

it('one group pause controls both rows without affecting a separate band', () => {
  const group = document.createElement('div'); group.setAttribute('data-marquee-group', ''); document.body.append(group);
  const moving = (parent: Element) => {
    const root = document.createElement('nk-marquee'); root.setAttribute('pause-group', '');
    root.innerHTML = '<div data-ref="track"><ul data-ref="list"><li>Content</li></ul></div><button data-ref="pause" hidden>Pause</button>';
    Object.defineProperty(root.querySelector('ul'), 'offsetWidth', {value:100});
    Object.defineProperty(root, 'offsetWidth', {value:50});
    root.querySelector<HTMLElement>('[data-ref="track"]')!.animate = vi.fn(() => ({cancel:vi.fn(),pause:vi.fn(),play:vi.fn(),updatePlaybackRate:vi.fn(),playState:'running',effect:{getTiming:()=>({duration:1000})}} as unknown as Animation));
    parent.append(root); return root;
  };
  const first = moving(group); const second = moving(group); const other = moving(document.body);
  first.querySelector('button')!.click();
  expect(first.hasAttribute('data-paused')).toBe(true);
  expect(second.hasAttribute('data-paused')).toBe(true);
  expect(other.hasAttribute('data-paused')).toBe(false);
  first.querySelector('button')!.click();
  expect(second.hasAttribute('data-paused')).toBe(false);
});
