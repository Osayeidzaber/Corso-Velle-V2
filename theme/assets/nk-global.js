const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./nk-reveal.css","./nk-marquee.css","./nk-tabs.css","./nk-expand-media.css","./nk-search-pill.css"])))=>i.map(i=>d[i]);
import { _ as NkElement, a as captureFocus, b as t, c as animate, d as easing, h as cartSectionIds, l as decorativeMotionAllowed, m as cart, o as parseHTML, p as CartError, r as renderSections, s as restoreFocus, u as durations, v as announce, x as define, y as config } from "./nk-chunk-sections-CYB9cWhh.js";
// src/core/lazy.ts
var loaders = /* @__PURE__ */ new Map();
var started = /* @__PURE__ */ new Set();
function registerLazy(tag, loader) {
	loaders.set(tag, loader);
}
function loadFor(root = document) {
	for (const [tag, loader] of loaders) {
		if (started.has(tag) || customElements.get(tag)) continue;
		if (!root.querySelector(tag)) continue;
		started.add(tag);
		loader().catch((error) => {
			started.delete(tag);
			console.error(`Failed to load <${tag}>`, error);
		});
	}
}
function installLazyLoader() {
	loadFor(document);
	document.addEventListener("shopify:section:load", (event) => loadFor(event.target));
	document.addEventListener("nk:section:replaced", (event) => loadFor(event.target));
}
// src/services/overlay.ts
var active = null;
var savedScroll = 0;
function lockScroll() {
	savedScroll = window.scrollY;
	document.documentElement.classList.add("nk-locked");
	document.documentElement.style.setProperty("--nk-scrollbar", `${window.innerWidth - document.documentElement.clientWidth}px`);
}
function unlockScroll() {
	document.documentElement.classList.remove("nk-locked");
	document.documentElement.style.removeProperty("--nk-scrollbar");
	if (Math.abs(window.scrollY - savedScroll) > 1) window.scrollTo({
		top: savedScroll,
		behavior: "instant"
	});
}
function returnFocus(trigger) {
	if (trigger?.isConnected) {
		trigger.focus({ preventScroll: true });
		return;
	}
	const fallback = document.querySelector("[data-focus-fallback]") ?? document.querySelector("main");
	if (fallback) {
		if (!fallback.hasAttribute("tabindex")) fallback.setAttribute("tabindex", "-1");
		fallback.focus({ preventScroll: true });
	}
}
function teardown(restoreFocus) {
	if (!active) return;
	const { options, controller, observer } = active;
	active = null;
	controller.abort();
	observer.disconnect();
	unlockScroll();
	if (restoreFocus) returnFocus(options.trigger);
	options.onClose?.();
	document.dispatchEvent(new CustomEvent("nk:overlay:closed"));
}
var overlay = {
	get current() {
		return active?.dialog ?? null;
	},
	isOpen(dialog) {
		return active?.dialog === dialog;
	},
	open(dialog, options = {}) {
		if (active?.dialog === dialog) return;
		if (active) overlay.close(active.dialog, { restoreFocus: false });
		const controller = new AbortController();
		const observer = new MutationObserver(() => {
			if (!dialog.isConnected) teardown(true);
		});
		observer.observe(document.body, {
			childList: true,
			subtree: true
		});
		active = {
			dialog,
			options,
			controller,
			observer
		};
		dialog.addEventListener("close", () => teardown(true), {
			signal: controller.signal,
			once: true
		});
		if (options.lightDismiss !== false) dialog.addEventListener("click", (event) => {
			if (event.target === dialog) overlay.close(dialog);
		}, { signal: controller.signal });
		window.addEventListener("pagehide", () => overlay.close(dialog), { signal: controller.signal });
		lockScroll();
		if (!dialog.open) dialog.showModal();
		(options.initialFocus ?? dialog.querySelector("[data-autofocus]"))?.focus();
		document.dispatchEvent(new CustomEvent("nk:overlay:opened", { detail: { id: dialog.id } }));
	},
	close(dialog, { restoreFocus = true } = {}) {
		if (active?.dialog !== dialog) {
			if (dialog.open) dialog.close();
			return;
		}
		active.controller.abort();
		if (dialog.open) dialog.close();
		teardown(restoreFocus);
	},
	closeAll() {
		if (active) overlay.close(active.dialog);
	}
};
// src/components/modal/modal.ts
/**
* <nk-modal> wraps one <dialog> and routes it through the overlay service.
*
* Triggers anywhere on the page: `<a href="/cart" data-nk-open="CartDrawer">` keeps working as
* a normal link without JS (or if the modal failed to load); with JS the click opens the modal.
* Inside the dialog, any `[data-nk-close]` closes it.
*/
var NkModal = class extends NkElement {
	dialog;
	mount() {
		const dialog = this.querySelector(":scope > dialog");
		if (!dialog) throw new Error(`<nk-modal id="${this.id}"> needs a direct <dialog> child`);
		this.dialog = dialog;
		this.on(this.dialog, "click", (event) => {
			if (event.target.closest("[data-nk-close]")) this.close();
		});
		this.dispose(() => {
			if (overlay.isOpen(this.dialog)) overlay.close(this.dialog, { restoreFocus: false });
		});
	}
	get isOpen() {
		return overlay.isOpen(this.dialog);
	}
	open(trigger) {
		trigger?.setAttribute("aria-expanded", "true");
		overlay.open(this.dialog, {
			trigger: trigger ?? null,
			lightDismiss: this.dataset.lightDismiss !== "false",
			onClose: () => {
				trigger?.setAttribute("aria-expanded", "false");
				this.onClosed();
			}
		});
		this.onOpened();
	}
	close() {
		overlay.close(this.dialog);
	}
	onOpened() {}
	onClosed() {}
};
var delegated = false;
/** One document-level listener for all [data-nk-open] triggers (survives section re-renders). */
function installModalTriggers() {
	if (delegated) return;
	delegated = true;
	document.addEventListener("click", (event) => {
		if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
		const trigger = event.target.closest("[data-nk-open]");
		if (!trigger) return;
		const modal = document.getElementById(trigger.dataset.nkOpen);
		if (!(modal instanceof NkModal)) return;
		event.preventDefault();
		modal.open(trigger);
	});
}
// src/components/cart/cart-drawer.ts
/**
* <nk-cart-drawer> (master-plan/09 CA-02). Opening never mutates the cart. After a successful
* add from a product form it opens (when the merchant chose "drawer") and announces the result.
* Its contents are a cart section region refreshed by the cart renderer.
*/
var NkCartDrawer = class extends NkModal {
	mount() {
		super.mount();
		this.on(document, "nk:cart:updated", (event) => {
			if (event.detail.kind !== "add") return;
			announce.polite(t("cart.added"));
			if (config().cart.afterAdd === "drawer" && !this.isOpen) requestAnimationFrame(() => this.open(document.querySelector(`[data-nk-open="${this.id}"]`)));
			if (config().cart.afterAdd === "page") location.assign(config().routes.cart);
		});
		this.on(document, "nk:cart:pending", (event) => {
			this.toggleAttribute("data-pending", event.detail.pending);
		});
	}
	onOpened() {
		this.dialog.querySelector("[data-autofocus]")?.focus();
	}
};
// src/components/cart/cart-items.ts
/**
* <nk-cart-items> — quantity steppers, quantity inputs and remove buttons for cart lines, shared
* by the drawer and the cart page (master-plan/09 CA-04). Lines carry data-line-key; changes go
* through the cart queue so rapid taps collapse to the latest absolute quantity.
*
* Without JS the same markup is a normal cart form (updates[] inputs + remove links).
*/
var NkCartItems = class extends NkElement {
	mount() {
		this.on(this, "click", (event) => {
			const target = event.target;
			const step = target.closest("[data-qty-step]");
			const remove = target.closest("[data-line-remove]");
			if (step) {
				event.preventDefault();
				const input = this.#inputFor(step);
				if (!input) return;
				const next = Math.max(0, Number(input.value || 0) + Number(step.dataset.qtyStep));
				input.value = String(next);
				this.#change(step, next);
			} else if (remove) {
				event.preventDefault();
				this.#change(remove, 0);
			}
		});
		this.on(this, "change", (event) => {
			const note = event.target.closest("textarea[data-cart-note]");
			if (note) {
				cart.note(note.value, this.id || "cart-note").catch(() => this.#showError(this, t("cart.error")));
				return;
			}
			const input = event.target.closest("input[data-qty-input]");
			if (!input) return;
			const value = Math.max(0, Math.floor(Number(input.value)));
			if (Number.isFinite(value)) this.#change(input, value);
		});
	}
	#inputFor(element) {
		return element.closest("[data-line-key]")?.querySelector("input[data-qty-input]") ?? null;
	}
	#change(element, quantity) {
		const line = element.closest("[data-line-key]");
		const key = line?.dataset.lineKey;
		if (!line || !key) return;
		line.setAttribute("aria-busy", "true");
		this.#clearError(line);
		cart.change(key, quantity, this.id || "cart-items").then(() => {
			if (quantity === 0) announce.polite(t("cart.removed"));
		}, (error) => {
			const message = error instanceof CartError && error.kind !== "unknown" ? error.message : t("cart.error");
			cart.refresh("cart-items").catch(() => {}).finally(() => {
				const current = this.querySelector(`[data-line-key="${CSS.escape(key)}"]`);
				current?.removeAttribute("aria-busy");
				this.#showError(current ?? this, message);
			});
		});
	}
	#showError(scope, message) {
		const region = scope.querySelector("[data-line-error], [data-cart-error]");
		if (!region) return;
		region.textContent = message;
		region.hidden = false;
		announce.assertive(message);
	}
	#clearError(line) {
		const region = line.querySelector("[data-line-error]");
		if (region) {
			region.textContent = "";
			region.hidden = true;
		}
	}
};
// src/components/disclosure/disclosure.ts
/**
* <nk-disclosure> wraps a native <details>. The behaviour (keyboard, semantics, no-JS) is the
* browser's; this element only opens itself when selected in the theme editor and restores the
* merchant's default state afterwards. Rewrite of the motion-primitives Disclosure example
* (master-plan/05 §4.9) — content stays in the DOM instead of being unmounted.
*/
var NkDisclosure = class extends NkElement {
	#details = null;
	#openedByEditor = false;
	mount() {
		this.#details = this.querySelector(":scope > details");
	}
	onEditorSelect() {
		if (this.#details && !this.#details.open) {
			this.#details.open = true;
			this.#openedByEditor = true;
		}
	}
	onEditorDeselect() {
		if (this.#details && this.#openedByEditor) this.#details.open = false;
		this.#openedByEditor = false;
	}
};
// src/components/header/header.ts
/**
* <nk-header> (master-plan/06 N-01).
* - Publishes its rendered height as --nk-header-h (never a hardcoded offset).
* - data-sticky="reveal": hides after deliberate downward travel, returns on upward intent,
*   never hides while it contains focus or an overlay/menu is open.
* - data-overlay: transparent over an eligible first section, solid once that section is passed
*   or any overlay opens.
*/
var HIDE_AFTER = 64;
var NkHeader = class extends NkElement {
	#lastY = 0;
	#travel = 0;
	#frame = 0;
	mount() {
		this.observeResize(this, () => {
			document.documentElement.style.setProperty("--nk-header-h", `${Math.round(this.getBoundingClientRect().height)}px`);
		});
		if (this.dataset.sticky === "reveal") {
			this.#lastY = window.scrollY;
			this.on(window, "scroll", () => this.#schedule(), { passive: true });
			this.on(this, "focusin", () => this.#setHidden(false));
		}
		if (this.hasAttribute("data-overlay")) this.#watchOverlay();
		this.on(document, "nk:overlay:opened", () => {
			this.dataset.forcedSolid = "";
			this.#setHidden(false);
		});
		this.on(document, "nk:overlay:closed", () => delete this.dataset.forcedSolid);
		this.dispose(() => cancelAnimationFrame(this.#frame));
		this.on(document, "nk:cart:updated", (event) => {
			const count = event.detail.cart.item_count;
			this.#updateCartCount(count);
		});
		this.#enhanceDisclosureNav();
	}
	/** Floating panel style: the newly opened panel grows from where the previous one was (FLIP). */
	#morph(panel, from) {
		if (!panel) return;
		const to = panel.getBoundingClientRect();
		if (!to.width || !to.height) return;
		animate(panel, [{
			transformOrigin: "top left",
			transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`
		}, {
			transformOrigin: "top left",
			transform: "none"
		}], {
			duration: durations.overlayOut + 40,
			easing: easing.out
		});
	}
	#updateCartCount(count) {
		const bubble = this.querySelector("[data-cart-count]");
		if (bubble) {
			bubble.textContent = String(count);
			bubble.hidden = count === 0;
		}
		const link = this.querySelector("[data-cart-count-label]");
		const template = link?.dataset.cartCountLabel;
		if (link && template) link.setAttribute("aria-label", template.replace("[count]", String(count)));
	}
	/**
	* Desktop menu panels are native <details> (work without JS). Enhancements: one open at a time,
	* Escape closes and returns focus to the summary, clicking outside closes.
	*/
	#enhanceDisclosureNav() {
		const panels = [...this.querySelectorAll(".nav__disclosure")];
		if (!panels.length) return;
		const floating = this.querySelector(".header--panel-floating") !== null;
		for (const details of panels) this.on(details, "toggle", () => {
			if (!details.open) return;
			const fromRect = panels.find((other) => other !== details && other.open)?.querySelector(".nav__panel")?.getBoundingClientRect();
			for (const other of panels) if (other !== details) other.open = false;
			this.#setHidden(false);
			if (floating && fromRect) this.#morph(details.querySelector(".nav__panel"), fromRect);
		});
		if (matchMedia("(hover: hover) and (pointer: fine)").matches) for (const details of panels) {
			const item = details.closest(".nav__item") ?? details;
			let timer = 0;
			this.on(item, "pointerenter", () => {
				window.clearTimeout(timer);
				timer = window.setTimeout(() => details.open = true, 150);
			});
			this.on(item, "pointerleave", () => {
				window.clearTimeout(timer);
				timer = window.setTimeout(() => details.open = false, 250);
			});
			this.dispose(() => window.clearTimeout(timer));
		}
		this.on(this, "keydown", (event) => {
			if (event.key !== "Escape") return;
			const open = panels.find((details) => details.open);
			if (!open) return;
			open.open = false;
			open.querySelector("summary")?.focus();
		});
		this.on(document, "click", (event) => {
			if (!this.contains(event.target)) for (const details of panels) details.open = false;
		});
	}
	onEditorSelect() {
		this.#setHidden(false);
	}
	#schedule() {
		if (this.#frame) return;
		this.#frame = requestAnimationFrame(() => {
			this.#frame = 0;
			this.#update();
		});
	}
	#update() {
		const y = Math.max(0, window.scrollY);
		const delta = y - this.#lastY;
		this.#lastY = y;
		this.#travel = Math.sign(delta) === Math.sign(this.#travel) ? this.#travel + delta : delta;
		const height = this.offsetHeight;
		const locked = this.matches(":focus-within") || overlay.current !== null || this.querySelector("details[open]") !== null;
		if (y <= height * 2 || locked) this.#setHidden(false);
		else if (this.#travel > HIDE_AFTER) this.#setHidden(true);
		else if (this.#travel < -16) this.#setHidden(false);
	}
	#setHidden(hidden) {
		if (hidden) this.dataset.hidden = "";
		else delete this.dataset.hidden;
	}
	#watchOverlay() {
		const first = document.querySelector("main > .shopify-section");
		if (!first?.querySelector("[data-overlay-eligible]")) {
			this.removeAttribute("data-overlay");
			return;
		}
		this.observeIntersection(first, (entry) => {
			if (entry.isIntersecting) this.dataset.surface = "overlay";
			else this.dataset.surface = "solid";
		}, { rootMargin: `-${this.offsetHeight}px 0px 0px 0px` });
	}
};
// src/components/nav-drawer/nav-drawer.ts
/**
* <nk-nav-drawer> (master-plan/06 N-04): phone menu dialog with level panels.
*
* Markup: every panel is `[data-level-panel="<id>"]` (root is "root"); a row with children has a
* `<button data-level-open="<id>">`; nested panels have `<button data-level-back>`. Going back
* restores the parent's scroll position and focuses the row that opened the child panel.
* The drawer closes when the viewport reaches the desktop breakpoint.
*/
var NkNavDrawer = class extends NkModal {
	#stack = [];
	mount() {
		super.mount();
		this.on(this.dialog, "click", (event) => {
			const target = event.target;
			const opener = target.closest("[data-level-open]");
			if (opener) this.#push(opener.dataset.levelOpen, opener);
			if (target.closest("[data-level-back]")) this.#pop();
		});
		this.on(this.dialog, "keydown", (event) => {
			if (event.key === "Escape" && this.#stack.length > 1) {
				event.preventDefault();
				this.#pop();
			}
		});
		const desktop = matchMedia("(min-width: 990px)");
		this.on(desktop, "change", () => {
			if (desktop.matches && this.isOpen) this.close();
		});
	}
	onOpened() {
		this.#stack = [{
			id: "root",
			scroll: 0,
			opener: null
		}];
		this.#show("root");
		this.#entrance();
	}
	/**
	* Style-specific entrance (decorative, skipped under reduced motion / Motion off):
	* - editorial (menu.md / StaggeredMenu): two colour layers sweep across, rows rise in sequence;
	* - cards (cardnav): cards rise in sequence.
	*/
	#entrance() {
		if (!decorativeMotionAllowed()) return;
		[...this.dialog.querySelectorAll(".menu-drawer__layer")].forEach((layer, i) => {
			animate(layer, [
				{ translate: "-100% 0" },
				{
					translate: "0 0",
					offset: .45
				},
				{ translate: "100% 0" }
			], {
				duration: 700,
				delay: i * 70,
				easing: easing.out
			}, { decorative: true });
		});
		const items = [...this.dialog.querySelectorAll("[data-level-panel=\"root\"] > .menu-drawer__list > li, [data-level-panel=\"root\"] .menu-card")].slice(0, 6);
		if (!this.dialog.matches(".menu-drawer--editorial, .menu-drawer--cards")) return;
		items.forEach((item, i) => {
			animate(item, [{
				opacity: 0,
				transform: "translateY(24px)"
			}, {
				opacity: 1,
				transform: "none"
			}], {
				duration: durations.overlayIn + 120,
				delay: 120 + i * durations.stagger,
				easing: easing.out,
				fill: "backwards"
			}, { decorative: true });
		});
	}
	onClosed() {
		this.#stack = [];
	}
	onEditorSelect(blockId) {
		if (!blockId) return;
		const block = this.querySelector(`[data-block-id="${CSS.escape(blockId)}"]`);
		if (!block) return;
		if (!this.isOpen) this.open();
		const panel = block.closest("[data-level-panel]");
		if (panel) this.#show(panel.dataset.levelPanel);
	}
	onEditorDeselect() {
		if (this.isOpen) this.close();
	}
	#panel(id) {
		return this.dialog.querySelector(`[data-level-panel="${CSS.escape(id)}"]`);
	}
	#push(id, opener) {
		const current = this.#stack.at(-1);
		if (current) current.scroll = this.#panel(current.id)?.scrollTop ?? 0;
		this.#stack.push({
			id,
			scroll: 0,
			opener: opener.dataset.levelOpen ?? null
		});
		this.#show(id);
		this.#panel(id)?.querySelector("[data-level-back]")?.focus();
	}
	#pop() {
		if (this.#stack.length < 2) return;
		const closing = this.#stack.pop();
		const parent = this.#stack.at(-1);
		this.#show(parent.id);
		const panel = this.#panel(parent.id);
		if (panel) panel.scrollTop = parent.scroll;
		panel?.querySelector(`[data-level-open="${CSS.escape(closing.id)}"]`)?.focus();
	}
	#show(id) {
		for (const panel of this.dialog.querySelectorAll("[data-level-panel]")) {
			const active = panel.dataset.levelPanel === id;
			panel.hidden = !active;
			panel.toggleAttribute("data-active", active);
		}
	}
};
// src/services/cart-render.ts
/**
* Applies cart section HTML after every mutation. Each cart region in Liquid renders
* `<div data-cart-section="{{ section.id }}">…</div>`; only its children are swapped so the
* surrounding dialog/shell (and its focus management) stays intact.
*/
function apply(sections) {
	if (!sections || typeof sections !== "object") return cartSectionIds();
	const missing = [];
	for (const id of cartSectionIds()) {
		if (!(id in sections)) continue;
		const html = sections[id];
		const target = document.querySelector(`[data-cart-section="${CSS.escape(id)}"]`);
		const next = html ? parseHTML(html).querySelector(`[data-cart-section="${CSS.escape(id)}"]`) : null;
		if (!target || !next) {
			missing.push(id);
			continue;
		}
		const focusKey = captureFocus(target);
		target.replaceChildren(...[...next.childNodes].map((node) => document.importNode(node, true)));
		restoreFocus(target, focusKey);
	}
	return missing;
}
function installCartRenderer() {
	document.addEventListener("nk:cart:updated", async (event) => {
		const { sections } = event.detail;
		const missing = apply(sections);
		if (!missing.length) return;
		try {
			apply(await renderSections(location.pathname, missing));
		} catch {
			document.dispatchEvent(new CustomEvent("nk:cart:render-failed", { detail: { missing } }));
		}
	});
	document.addEventListener("nk:cart:refresh", () => void cart.refresh("app").catch(() => {}));
	window.addEventListener("pageshow", (event) => {
		if (event.persisted) cart.refresh("pageshow").catch(() => {});
	});
}
// src/services/editor.ts
function ownersOf(target) {
	if (!(target instanceof Element)) return [];
	const owners = [];
	let node = target;
	while (node) {
		if (node.localName.startsWith("nk-") && typeof node.onEditorSelect === "function") owners.push(node);
		node = node.parentElement;
	}
	return owners;
}
function componentsIn(target) {
	if (!(target instanceof Element)) return [];
	return [...target.querySelectorAll("*")].filter((el) => el.localName.startsWith("nk-") && typeof el.onEditorSelect === "function");
}
function isDesignMode() {
	return Boolean(window.Shopify?.designMode);
}
var installed = false;
function installEditorAdapter() {
	if (installed || !isDesignMode()) return;
	installed = true;
	document.documentElement.classList.add("nk-design-mode");
	document.addEventListener("shopify:block:select", (event) => {
		const blockId = event.detail?.blockId;
		for (const owner of ownersOf(event.target)) owner.onEditorSelect?.(blockId);
	});
	document.addEventListener("shopify:block:deselect", (event) => {
		const blockId = event.detail?.blockId;
		for (const owner of ownersOf(event.target)) owner.onEditorDeselect?.(blockId);
	});
	document.addEventListener("shopify:section:select", (event) => {
		for (const component of componentsIn(event.target)) component.onEditorSelect?.();
	});
	document.addEventListener("shopify:section:deselect", (event) => {
		for (const component of componentsIn(event.target)) component.onEditorDeselect?.();
	});
}
// \0vite/preload-helper.js
var scriptRel = /* @__PURE__ */ (function detectScriptRel() {
	const relList = typeof document !== "undefined" && document.createElement("link").relList;
	return relList && relList.supports && relList.supports("modulepreload") ? "modulepreload" : "preload";
})();
var assetsURL = function(dep, importerUrl) {
	return new URL(dep, importerUrl).href;
};
var seen = {};
var isCssPreloadUrl = function isCssPreloadUrl(url) {
	return url.pathname.endsWith(".css");
};
var preloadOnce = function preloadOnce(seen, href, preload) {
	if (href in seen) return seen[href];
	const promise = preload();
	if (!promise) {
		seen[href] = void 0;
		return;
	}
	const preloadPromise = promise.then(() => {
		seen[href] = void 0;
	}, (err) => {
		seen[href] = void 0;
		throw err;
	});
	seen[href] = preloadPromise;
	return preloadPromise;
};
var __vitePreload = function preload(baseModule, deps, importerUrl) {
	let promise = Promise.resolve();
	if (deps && deps.length > 0) {
		let preloadedHrefs;
		const cspNonceMeta = document.querySelector("meta[property=csp-nonce]");
		const cspNonce = cspNonceMeta?.nonce || cspNonceMeta?.getAttribute("nonce");
		function allSettled(promises) {
			return Promise.all(promises.map((p) => Promise.resolve(p).then((value) => ({
				status: "fulfilled",
				value
			}), (reason) => ({
				status: "rejected",
				reason
			}))));
		}
		function importMetaResolve(specifier) {
			if (import.meta.resolve) return new URL(import.meta.resolve(specifier));
			return new URL(
				specifier,
				/** #__KEEP__ */
				import.meta.url
			);
		}
		promise = allSettled(deps.map((depString) => {
			depString = assetsURL(depString, importerUrl);
			const dep = importMetaResolve(depString);
			const isCss = isCssPreloadUrl(dep);
			return preloadOnce(seen, dep.href, () => {
				if (preloadedHrefs === void 0) {
					preloadedHrefs = {
						all: /* @__PURE__ */ new Set(),
						styles: /* @__PURE__ */ new Set()
					};
					const links = document.getElementsByTagName("link");
					for (let i = links.length - 1; i >= 0; i--) {
						const link = links[i];
						preloadedHrefs.all.add(link.href);
						if (link.rel === "stylesheet") preloadedHrefs.styles.add(link.href);
					}
				}
				if ((isCss ? preloadedHrefs.styles : preloadedHrefs.all).has(dep.href)) return;
				const link = document.createElement("link");
				link.rel = isCss ? "stylesheet" : scriptRel;
				if (!isCss) link.as = "script";
				link.crossOrigin = "";
				link.href = dep.href;
				if (cspNonce) link.setAttribute("nonce", cspNonce);
				document.head.appendChild(link);
				if (isCss) return new Promise((res, rej) => {
					link.addEventListener("load", res);
					link.addEventListener("error", () => rej(/* @__PURE__ */ new Error(`Unable to preload CSS for ${dep}`)));
				});
			});
		}).filter((p) => p !== void 0));
	}
	function handlePreloadError(err) {
		const e = new Event("vite:preloadError", { cancelable: true });
		e.payload = err;
		window.dispatchEvent(e);
		if (!e.defaultPrevented) throw err;
	}
	return promise.then((res) => {
		for (const item of res || []) {
			if (item.status !== "rejected") continue;
			handlePreloadError(item.reason);
		}
		return baseModule().catch(handlePreloadError);
	});
};
// src/entries/global.ts
installEditorAdapter();
installCartRenderer();
installModalTriggers();
define("nk-header", NkHeader);
define("nk-modal", NkModal);
define("nk-nav-drawer", NkNavDrawer);
define("nk-cart-drawer", NkCartDrawer);
define("nk-cart-items", NkCartItems);
define("nk-disclosure", NkDisclosure);
registerLazy("nk-reveal", () => __vitePreload(() => import("./nk-chunk-reveal-Nh2pZLd2.js"), __vite__mapDeps([0]), import.meta.url));
registerLazy("nk-marquee", () => __vitePreload(() => import("./nk-chunk-marquee-C1Dv4wly.js"), __vite__mapDeps([1]), import.meta.url));
registerLazy("nk-tabs", () => __vitePreload(() => import("./nk-chunk-tabs-Cs0NEdgZ.js"), __vite__mapDeps([2]), import.meta.url));
registerLazy("nk-expand-media", () => __vitePreload(() => import("./nk-chunk-expand-media-TmvWNLEY.js"), __vite__mapDeps([3]), import.meta.url));
registerLazy("nk-elastic-line", () => __vitePreload(() => import("./nk-chunk-elastic-line-Ccf4lPj8.js"), [], import.meta.url));
registerLazy("nk-search-pill", () => __vitePreload(() => import("./nk-chunk-search-pill-CDiLYkI3.js"), __vite__mapDeps([4]), import.meta.url));
installLazyLoader();
