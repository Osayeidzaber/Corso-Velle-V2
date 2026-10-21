import { _ as NkElement, c as animate, d as easing, u as durations, x as define } from "./nk-chunk-sections-CYB9cWhh.js";
// src/components/tabs/tabs.ts
/**
* <nk-tabs> — accessible tabs with a sliding indicator and panel transition (master-plan/05 T4).
* Clean-room rewrite of the supplied tabswithtransctition example (motion-primitives
* TransitionPanel), adding the WAI-ARIA tabs pattern the example lacked.
*
* Liquid renders every panel with its own heading and a hidden tab list, so without JS the
* content reads as stacked sections. With JS: roving tabindex, ←/→/Home/End, automatic
* activation, indicator moved with transforms, 120ms opacity/8px panel transition (no blur).
*/
var NkTabs = class extends NkElement {
	#tabs = [];
	#panels = [];
	#index = 0;
	mount() {
		const list = this.ref("tablist");
		this.#tabs = this.refs("tab");
		this.#panels = this.refs("panel");
		if (!list || this.#tabs.length < 2 || this.#tabs.length !== this.#panels.length) return;
		list.hidden = false;
		this.setAttribute("data-enhanced", "");
		list.setAttribute("role", "tablist");
		this.#tabs.forEach((tab, i) => {
			const panel = this.#panels[i];
			tab.setAttribute("role", "tab");
			tab.setAttribute("aria-controls", panel.id);
			panel.setAttribute("role", "tabpanel");
			panel.setAttribute("aria-labelledby", tab.id);
			panel.tabIndex = 0;
		});
		this.on(list, "click", (event) => {
			const tab = event.target.closest("[data-ref=\"tab\"]");
			if (tab) this.select(this.#tabs.indexOf(tab), true);
		});
		this.on(list, "keydown", (event) => {
			const keys = {
				ArrowRight: this.#index + 1,
				ArrowLeft: this.#index - 1,
				Home: 0,
				End: this.#tabs.length - 1
			};
			if (!(event.key in keys)) return;
			event.preventDefault();
			const next = (keys[event.key] + this.#tabs.length) % this.#tabs.length;
			this.select(next, true);
			this.#tabs[next]?.focus();
		});
		this.observeResize(list, () => this.#moveIndicator(false));
		const initial = Math.max(0, this.#tabs.findIndex((tab) => tab.hasAttribute("data-selected")));
		this.select(initial, false);
	}
	onEditorSelect(blockId) {
		if (!blockId) return;
		const index = this.#panels.findIndex((panel) => panel.dataset.blockId === blockId);
		if (index >= 0) this.select(index, false);
	}
	select(index, animated) {
		if (index < 0 || index >= this.#tabs.length) return;
		const previous = this.#index;
		this.#index = index;
		this.#tabs.forEach((tab, i) => {
			const active = i === index;
			tab.setAttribute("aria-selected", String(active));
			tab.tabIndex = active ? 0 : -1;
			this.#panels[i].hidden = !active;
		});
		this.#moveIndicator(animated);
		if (animated && previous !== index) animate(this.#panels[index], [{
			opacity: 0,
			transform: `translateX(${index > previous ? 8 : -8}px)`
		}, {
			opacity: 1,
			transform: "none"
		}], {
			duration: durations.instant,
			easing: easing.out
		});
		this.emit("nk:tabs:change", { index });
	}
	#moveIndicator(animated) {
		const indicator = this.ref("indicator");
		const tab = this.#tabs[this.#index];
		const list = this.ref("tablist");
		if (!indicator || !tab || !list) return;
		indicator.style.transition = animated ? "" : "none";
		indicator.style.width = `${tab.offsetWidth}px`;
		indicator.style.transform = `translateX(${tab.offsetLeft - list.scrollLeft}px)`;
	}
};
define("nk-tabs", NkTabs);
export { NkTabs };
