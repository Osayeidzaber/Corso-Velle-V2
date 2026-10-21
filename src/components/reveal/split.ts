export type SplitBy = 'line' | 'word' | 'char';

const MAX_CHARS = 24;

/**
 * Splits the text of `target` into `.nk-piece` spans for staggered reveals.
 *
 * The original text stays readable by assistive tech in a visually hidden span; the visual pieces
 * are aria-hidden. Only plain text (and <br>) is split — headings with links or formatting are
 * left untouched and reveal as a whole. Returns a function that restores the original markup.
 * Character splitting falls back to words above 24 characters (DOM size and readability).
 */
export function splitText(target: HTMLElement, by: SplitBy): () => void {
  const original = target.innerHTML;
  const restore = () => {
    target.innerHTML = original;
  };
  const plain = [...target.childNodes].every(
    (node) => node.nodeType === Node.TEXT_NODE || (node instanceof HTMLBRElement),
  );
  if (!plain) return restore;

  const text = target.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  if (!text) return restore;
  const mode: SplitBy = by === 'char' && text.length > MAX_CHARS ? 'word' : by;

  const accessible = document.createElement('span');
  accessible.className = 'visually-hidden';
  accessible.textContent = text;

  const visual = document.createElement('span');
  visual.className = 'nk-pieces';
  visual.setAttribute('aria-hidden', 'true');

  // Lines from authored <br>s are kept as hard breaks.
  const segments = original
    .split(/<br\s*\/?>/i)
    .map((html) => {
      const scratch = document.createElement('span');
      scratch.innerHTML = html;
      return scratch.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    })
    .filter(Boolean);

  let index = 0;
  const words: HTMLSpanElement[] = [];
  segments.forEach((segment, segmentIndex) => {
    if (segmentIndex > 0) visual.append(document.createElement('br'));
    segment.split(' ').forEach((word, wordIndex, all) => {
      const wordSpan = document.createElement('span');
      wordSpan.className = 'nk-word';
      if (mode === 'char') {
        for (const char of Array.from(word)) {
          const piece = document.createElement('span');
          piece.className = 'nk-piece';
          piece.style.setProperty('--i', String(index++));
          piece.textContent = char;
          wordSpan.append(piece);
        }
      } else {
        wordSpan.classList.add('nk-piece');
        wordSpan.style.setProperty('--i', String(index++));
        wordSpan.textContent = word;
      }
      words.push(wordSpan);
      visual.append(wordSpan);
      if (wordIndex < all.length - 1) visual.append(document.createTextNode(' '));
    });
  });

  target.replaceChildren(accessible, visual);

  if (mode === 'line') groupIntoLines(visual, words);
  return restore;
}

/** Wraps words that share a rendered line into `.nk-line > .nk-piece` (needs layout). */
function groupIntoLines(visual: HTMLElement, words: HTMLSpanElement[]): void {
  const lines: HTMLSpanElement[][] = [];
  let top: number | null = null;
  for (const word of words) {
    const y = word.offsetTop;
    if (top === null || Math.abs(y - top) > 2) {
      lines.push([]);
      top = y;
    }
    lines.at(-1)!.push(word);
  }
  visual.replaceChildren();
  lines.forEach((lineWords, i) => {
    const line = document.createElement('span');
    line.className = 'nk-line';
    const inner = document.createElement('span');
    inner.className = 'nk-piece';
    inner.style.setProperty('--i', String(i));
    inner.textContent = lineWords.map((w) => w.textContent).join(' ');
    line.append(inner);
    visual.append(line);
  });
}
