/**
 * Base class for every theme custom element (master-plan/04 §5.1).
 *
 * Shopify's theme editor replaces section HTML at will, so components must assume they can be
 * connected, disconnected and reconnected any number of times. Each connection gets a fresh
 * AbortController; everything registered through the helpers below is released on disconnect.
 */
export abstract class NkElement extends HTMLElement {
  #controller: AbortController | null = null;
  #disposers: Array<() => void> = [];

  protected get signal(): AbortSignal {
    if (!this.#controller) throw new Error(`${this.localName} used signal while disconnected`);
    return this.#controller.signal;
  }

  connectedCallback(): void {
    if (this.#controller) return;
    this.#controller = new AbortController();
    this.#disposers = [];
    this.mount();
  }

  disconnectedCallback(): void {
    if (!this.#controller) return;
    this.getAnimations?.({ subtree: true }).forEach((animation) => animation.cancel());
    this.#controller?.abort();
    this.#controller = null;
    for (const dispose of this.#disposers.splice(0)) {
      try {
        dispose();
      } catch (error) {
        console.error(error);
      }
    }
    this.unmount?.();
  }

  /** Invalidates work from a previous connection, even after an editor reorder. */
  protected connectionIsCurrent(signal: AbortSignal): boolean {
    return !signal.aborted && this.#controller?.signal === signal && this.isConnected;
  }

  /** Called once per connection. Query children with ref()/refs(); never in the constructor. */
  protected abstract mount(): void;
  protected unmount?(): void;

  /** Called by the editor service when this element (or one of its blocks) is selected. */
  onEditorSelect?(blockId?: string): void;
  onEditorDeselect?(blockId?: string): void;

  protected on<K extends keyof HTMLElementEventMap>(
    target: EventTarget,
    type: K,
    listener: (event: HTMLElementEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ): void;
  protected on(target: EventTarget, type: string, listener: (event: Event) => void, options?: AddEventListenerOptions): void;
  protected on(target: EventTarget, type: string, listener: (event: Event) => void, options: AddEventListenerOptions = {}): void {
    target.addEventListener(type, listener, { ...options, signal: this.signal });
  }

  protected observeIntersection(
    target: Element,
    callback: (entry: IntersectionObserverEntry, observer: IntersectionObserver) => void,
    options?: IntersectionObserverInit,
  ): IntersectionObserver {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) callback(entry, observer);
    }, options);
    observer.observe(target);
    this.dispose(() => observer.disconnect());
    return observer;
  }

  protected observeResize(target: Element, callback: (entry: ResizeObserverEntry) => void): ResizeObserver {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) callback(entry);
    });
    observer.observe(target);
    this.dispose(() => observer.disconnect());
    return observer;
  }

  /** setTimeout that is cleared automatically on disconnect. */
  protected later(callback: () => void, ms: number): number {
    const id = window.setTimeout(callback, ms);
    this.dispose(() => window.clearTimeout(id));
    return id;
  }

  /** Register custom cleanup (pause media, cancel animations, release a lock...). */
  protected dispose(callback: () => void): void {
    this.#disposers.push(callback);
  }

  /** First [data-ref="name"] owned by this element (not by a nested nk- element of the same tag). */
  protected ref<T extends Element = HTMLElement>(name: string): T | null {
    return this.refs<T>(name)[0] ?? null;
  }

  protected refs<T extends Element = HTMLElement>(name: string): T[] {
    return [...this.querySelectorAll<T>(`[data-ref="${name}"]`)].filter(
      (el) => el.closest(this.localName) === this,
    );
  }

  protected emit<T>(type: string, detail: T): void {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true }));
  }
}
