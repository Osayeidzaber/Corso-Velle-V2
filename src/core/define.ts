/** Idempotent registration: entries may load on pages where the tag is already defined. */
export function define(tag: string, constructor: CustomElementConstructor): void {
  if (!customElements.get(tag)) customElements.define(tag, constructor);
}
