import { _ as NkElement, x as define } from "./nk-chunk-sections-CYB9cWhh.js";
// src/components/search-pill/search-pill.ts
/**
* <nk-search-pill> — header search that expands from an icon pill into a field (clean-room
* rewrite of the supplied gooeyinput example). Fixes the example's accessibility issues: a real
* <form role="search"> with a labelled input (never an input inside a button). The "goo" SVG
* filter applies only to the background blobs, never to text or the input.
*
* Without JS the field is simply always open. Escape or blurring an empty field collapses it.
*/
var NkSearchPill = class extends NkElement {
	mount() {
		const toggle = this.ref("toggle");
		const input = this.querySelector("input[type=\"search\"]");
		if (!toggle || !input) return;
		this.setAttribute("data-enhanced", "");
		this.#set(false, toggle);
		this.on(toggle, "click", () => {
			this.#set(true, toggle);
			input.focus();
		});
		this.on(input, "keydown", (event) => {
			if (event.key !== "Escape") return;
			input.value = "";
			this.#set(false, toggle);
			toggle.focus();
		});
		this.on(this, "focusout", (event) => {
			const next = event.relatedTarget;
			if (next && this.contains(next)) return;
			if (!input.value) this.#set(false, toggle);
		});
	}
	#set(open, toggle) {
		this.toggleAttribute("data-open", open);
		toggle.setAttribute("aria-expanded", String(open));
		toggle.hidden = open;
	}
};
define("nk-search-pill", NkSearchPill);
export { NkSearchPill };
