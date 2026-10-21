/**
 * Live-region announcements for cart, filter and search status. The regions are rendered once in
 * layout/theme.liquid (#nk-live-polite / #nk-live-assertive). Identical messages within a second
 * are dropped so rapid updates don't repeat.
 */
let last = { text: '', at: 0 };

function speak(id: string, text: string): void {
  const region = document.getElementById(id);
  if (!region) return;
  const now = Date.now();
  if (text === last.text && now - last.at < 1000) return;
  last = { text, at: now };
  region.textContent = '';
  // A separate task so screen readers notice the change even when text repeats later.
  setTimeout(() => {
    region.textContent = text;
  }, 50);
}

export const announce = {
  polite: (text: string) => speak('nk-live-polite', text),
  assertive: (text: string) => speak('nk-live-assertive', text),
};
