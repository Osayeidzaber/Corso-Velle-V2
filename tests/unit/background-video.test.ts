import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ mode: 'full', observers: [] as IntersectionObserverCallback[] }));
vi.mock('../../src/core/motion', () => ({ motionMode: () => state.mode }));
import '../../src/components/media/background-video';

beforeEach(() => {
  state.mode = 'full'; state.observers = [];
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: IntersectionObserverCallback) { state.observers.push(callback); }
    observe() {} disconnect() {}
  });
});
afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals(); });
function mount(autoplay = true, visible = true) {
  const root = document.createElement('nk-background-video');
  if (autoplay) root.setAttribute('autoplay', '');
  root.innerHTML = '<video controls></video><button data-ref="toggle" data-play-label="Play" data-pause-label="Pause" hidden></button>';
  const video = root.querySelector('video')!;
  const play = vi.spyOn(video, 'play').mockResolvedValue();
  const pause = vi.spyOn(video, 'pause').mockImplementation(() => {});
  document.body.append(root);
  state.observers.at(-1)!([{ isIntersecting: visible } as IntersectionObserverEntry], {} as IntersectionObserver);
  return { root, video, play, pause, button: root.querySelector('button')! };
}
it('requires explicit playback under reduced motion and preserves independent user intent', () => {
  state.mode = 'off';
  const first = mount(); const second = mount();
  expect(first.play).not.toHaveBeenCalled();
  first.button.click();
  expect(first.play).toHaveBeenCalledTimes(1);
  expect(second.play).not.toHaveBeenCalled();
  first.root.remove();
  expect(first.video.controls).toBe(true);
  expect(first.button.hidden).toBe(true);
});
it('does not start offscreen autoplay before the first visible observation', () => {
  const instance = mount(true, false);
  expect(instance.play).not.toHaveBeenCalled();
  state.observers.at(-1)!([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
  expect(instance.play).toHaveBeenCalledTimes(1);
});
it('pauses offscreen, resumes authored autoplay and stops after motion is disabled', () => {
  const instance = mount();
  expect(instance.play).toHaveBeenCalledTimes(1);
  state.observers[0]!([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);
  expect(instance.pause).toHaveBeenCalled();
  state.observers[0]!([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
  expect(instance.play).toHaveBeenCalledTimes(2);
  state.mode = 'off'; document.dispatchEvent(new CustomEvent('nk:motion:changed'));
  state.observers[0]!([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
  expect(instance.play).toHaveBeenCalledTimes(2);
});
it('handles blocked autoplay without an unhandled rejection', async () => {
  const instance = mount(false);
  instance.play.mockRejectedValueOnce(new Error('blocked'));
  instance.button.click();
  await Promise.resolve();
  expect(instance.button.getAttribute('aria-label')).toBe('Play');
});

it('binds an external control only inside the owning campaign', () => {
  state.mode = 'off';
  const owner = document.createElement('section'); owner.setAttribute('data-background-video-owner', '');
  owner.innerHTML = '<button id="external" data-play-label="Play" data-pause-label="Pause" hidden></button>';
  document.body.append(owner);
  const root = document.createElement('nk-background-video'); root.setAttribute('toggle-id', 'external');
  root.innerHTML = '<video controls></video>';
  const video = root.querySelector('video')!;
  const play = vi.spyOn(video, 'play').mockResolvedValue(); vi.spyOn(video, 'pause').mockImplementation(() => {});
  owner.append(root);
  state.observers.at(-1)!([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
  owner.querySelector('button')!.click();
  expect(play).toHaveBeenCalledTimes(1);
  root.remove(); owner.querySelector('button')!.click();
  expect(play).toHaveBeenCalledTimes(1);
});
