/** Gliding hover surface inspired by React Bits Animated List; native radio selection stays independent. */
export function installSizeGlide(row: HTMLElement, signal: AbortSignal): () => void {
  const highlight = document.createElement('span');
  highlight.className = 'option__hover-glide';
  highlight.setAttribute('aria-hidden', 'true');
  row.prepend(highlight);
  let pointer: HTMLElement | null = null;
  let focused: HTMLElement | null = null;
  const pillFor = (target: EventTarget | null): HTMLElement | null => {
    const pill = target instanceof Element ? target.closest<HTMLElement>('[data-size-pill]') : null;
    return pill && row.contains(pill) && pill.querySelector<HTMLInputElement>('input')?.disabled === false ? pill : null;
  };
  const paint = () => {
    const pill = pointer ?? focused;
    if (!pill) { highlight.removeAttribute('data-active'); return; }
    // offsetLeft shares the scroller's coordinate space; no scrollIntoView or document movement.
    highlight.style.width = `${pill.offsetWidth}px`;
    highlight.style.transform = `translateX(${pill.offsetLeft}px)`;
    highlight.setAttribute('data-active', '');
  };
  row.addEventListener('pointerover', event => {
    if (event.pointerType === 'touch' || !matchMedia('(hover: hover)').matches) return;
    const next = pillFor(event.target);
    if (next === pointer) return;
    pointer = next; paint();
  }, { signal });
  row.addEventListener('pointerleave', () => { pointer = null; paint(); }, { signal });
  row.addEventListener('pointercancel', () => { pointer = null; paint(); }, { signal });
  row.addEventListener('focusin', event => {
    focused = event.target instanceof Element && event.target.matches(':focus-visible') ? pillFor(event.target) : null;
    paint();
  }, { signal });
  row.addEventListener('focusout', event => { focused = pillFor(event.relatedTarget); paint(); }, { signal });
  const observer = new ResizeObserver(paint);
  observer.observe(row);
  row.setAttribute('data-glide-ready', '');
  return () => { observer.disconnect(); highlight.remove(); row.removeAttribute('data-glide-ready'); };
}
