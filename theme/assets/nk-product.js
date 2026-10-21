import { c as CartError, d as Sequencer, f as NkElement, g as define, h as t, i as replaceRegions, l as cart, m as config, n as renderSection, p as announce, t as MissingFragmentError } from "./nk-chunk-sections-BXbPwMMJ.js";
// src/core/motion.ts
var reducedQuery = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null;
function prefersReducedMotion() {
	return reducedQuery?.matches ?? false;
}
/** True when functional transitions (drawer slide) may use travel; otherwise use a short fade. */
function transitionsAllowed() {
	return config().motion !== "off" && !prefersReducedMotion();
}
// src/components/product/gallery.ts
/**
* <nk-gallery> (master-plan/08 PR-01). A native horizontal scroll-snap track, so vertical page
* scrolling and pinch zoom stay native. Buttons and the "3 / 7" counter are enhancements; the
* slide nearest the start of the track is "current". When the variant changes, the gallery moves
* to that variant's featured media (data-variant-media-id on the buy region).
* Videos pause when their slide stops being current.
*/
var NkGallery = class extends NkElement {
	#track;
	#slides = [];
	#index = 0;
	mount() {
		const track = this.ref("track");
		if (!track) return;
		this.#track = track;
		this.#slides = this.refs("slide");
		if (this.#slides.length < 2) return;
		for (const slide of this.#slides) this.observeIntersection(slide, (entry) => {
			if (entry.intersectionRatio >= .6) this.#setCurrent(this.#slides.indexOf(slide));
		}, {
			root: this.#track,
			threshold: [.6]
		});
		this.on(this, "click", (event) => {
			const button = event.target.closest("[data-gallery-step]");
			if (button) this.go(this.#index + Number(button.dataset.galleryStep));
		});
		const section = this.closest("[data-product-section]");
		if (section) this.on(section, "nk:variant:changed", () => {
			const mediaId = section.querySelector("[data-region=\"buy\"]")?.dataset.variantMediaId;
			const target = mediaId ? this.#slides.findIndex((s) => s.dataset.mediaId === mediaId) : -1;
			if (target >= 0) this.go(target);
		});
		this.#setCurrent(0);
	}
	go(index) {
		const clamped = Math.max(0, Math.min(this.#slides.length - 1, index));
		const slide = this.#slides[clamped];
		if (!slide) return;
		this.#track.scrollTo({
			left: slide.offsetLeft - this.#track.offsetLeft,
			behavior: transitionsAllowed() ? "smooth" : "instant"
		});
		this.#setCurrent(clamped);
	}
	#setCurrent(index) {
		if (index < 0) return;
		this.#index = index;
		this.#slides.forEach((slide, i) => {
			slide.toggleAttribute("data-current", i === index);
			if (i !== index) slide.querySelectorAll("video").forEach((video) => video.pause());
		});
		const counter = this.ref("counter");
		if (counter) counter.textContent = t("product.media_position", {
			index: index + 1,
			count: this.#slides.length
		});
		const prev = this.querySelector("[data-gallery-step=\"-1\"]");
		const next = this.querySelector("[data-gallery-step=\"1\"]");
		if (prev) prev.disabled = index === 0;
		if (next) next.disabled = index === this.#slides.length - 1;
	}
};
// src/components/product/product-form.ts
/**
* <nk-product-form> wraps Shopify's `{% form 'product' %}` (master-plan/08 PR-05, 09 CA-01).
*
* Without JS the form posts to /cart/add normally. With JS:
* - an incomplete selection never submits: focus moves to the first unchosen option group;
* - while the picker is resolving, or the resolved id doesn't match the form's id, submit is blocked;
* - one submission at a time (double clicks are ignored);
* - the outcome comes from the cart service; ambiguous failures are reconciled, never re-sent.
*/
var NkProductForm = class extends NkElement {
	#submitting = false;
	mount() {
		const form = this.querySelector("form");
		if (!form) return;
		this.on(form, "submit", (event) => {
			event.preventDefault();
			this.#submit(form, event.submitter);
		});
		const section = this.closest("[data-product-section]");
		if (section) {
			this.on(section, "nk:variant:changed", (event) => {
				this.#reflectState(event.detail.state);
			});
			const picker = this.#picker();
			if (picker) this.#reflectState(picker.state);
		}
	}
	/** Button label/disabled for states Liquid can't express (explicit choice, missing combination). */
	#reflectState(state) {
		const button = this.querySelector("[data-region=\"buy\"] button[type=\"submit\"]");
		const label = button?.querySelector("[data-button-label]");
		if (!button || !label) return;
		if (state === "incomplete") {
			const name = this.#picker()?.firstIncomplete()?.dataset.optionName ?? "";
			label.textContent = t("product.choose_named_option", { option: name });
			button.disabled = false;
		} else if (state === "unavailable") {
			label.textContent = t("product.unavailable");
			button.disabled = true;
		}
	}
	#picker() {
		return this.closest("[data-product-section]")?.querySelector("nk-variant-picker") ?? null;
	}
	async #submit(form, submitter) {
		if (this.#submitting) return;
		this.#clearError();
		const picker = this.#picker();
		if (picker) {
			if (picker.state === "incomplete") {
				const fieldset = picker.firstIncomplete();
				const name = fieldset?.dataset.optionName ?? "";
				fieldset?.querySelector("input[type=\"radio\"]")?.focus();
				this.#showError(t("product.choose_named_option", { option: name }));
				return;
			}
			if (picker.state !== "available") return;
		}
		const data = new FormData(form);
		const id = Number(data.get("id"));
		if (!id || picker && String(id) !== picker.resolvedVariantId) return;
		const quantity = Math.max(1, Number(data.get("quantity") ?? 1));
		const properties = {};
		for (const [key, value] of data.entries()) {
			const match = /^properties\[(.+)\]$/.exec(key);
			if (match?.[1] && typeof value === "string" && value !== "") properties[match[1]] = value;
		}
		const item = {
			id,
			quantity
		};
		if (Object.keys(properties).length) item.properties = properties;
		const sellingPlan = Number(data.get("selling_plan"));
		if (sellingPlan) item.selling_plan = sellingPlan;
		this.#setPending(true, submitter);
		try {
			await cart.add([item], this.dataset.sourceId ?? this.id ?? "product-form");
		} catch (error) {
			const message = error instanceof CartError ? error.kind === "unknown" ? t("cart.add_unconfirmed") : error.kind === "not-applied" ? t("cart.add_not_applied") : error.message : t("cart.error");
			this.#showError(message);
		} finally {
			this.#setPending(false, submitter);
		}
	}
	#setPending(pending, submitter) {
		this.#submitting = pending;
		this.toggleAttribute("data-pending", pending);
		const button = submitter ?? this.querySelector("button[type=\"submit\"]");
		if (!button) return;
		button.setAttribute("aria-busy", String(pending));
		const label = button.querySelector("[data-button-label]");
		if (label) {
			if (pending) {
				label.dataset.idleLabel = label.textContent ?? "";
				label.textContent = t("product.adding");
			} else if (label.dataset.idleLabel !== void 0) label.textContent = label.dataset.idleLabel;
		}
	}
	#showError(message) {
		const region = this.closest("[data-product-section]")?.querySelector("[data-form-error]");
		if (!region) return;
		region.textContent = message;
		region.hidden = false;
		announce.assertive(message);
	}
	#clearError() {
		const region = this.closest("[data-product-section]")?.querySelector("[data-form-error]");
		if (region) {
			region.hidden = true;
			region.textContent = "";
		}
	}
};
// src/components/product/variant-picker.ts
var NkVariantPicker = class extends NkElement {
	#sequencer = new Sequencer();
	#chosen = /* @__PURE__ */ new Set();
	#state = "incomplete";
	get state() {
		return this.#state;
	}
	/** The variant id that may be submitted, or null if none is resolved and purchasable-checked. */
	get resolvedVariantId() {
		return this.#state === "available" ? this.#section()?.querySelector("input[name=\"id\"]")?.value ?? null : null;
	}
	mount() {
		const preselected = this.hasAttribute("data-preselected");
		for (const fieldset of this.#fieldsets()) {
			const position = fieldset.dataset.optionPosition;
			if (preselected || !this.#isRequired(fieldset)) this.#chosen.add(position);
		}
		this.#applyExplicitChoice();
		this.on(this, "change", (event) => {
			const input = event.target;
			const fieldset = input.closest("fieldset[data-option-position]");
			if (!fieldset || input.type !== "radio") return;
			this.#chosen.add(fieldset.dataset.optionPosition);
			this.#resolve(input.dataset.optionValueId ?? null);
		});
		this.dispose(() => this.#sequencer.cancel());
	}
	/** First option group the shopper still has to choose, for focusing from the buy button. */
	firstIncomplete() {
		return this.#fieldsets().find((f) => !this.#chosen.has(f.dataset.optionPosition)) ?? null;
	}
	#section() {
		return this.closest("[data-product-section]");
	}
	#fieldsets() {
		return [...this.querySelectorAll("fieldset[data-option-position]")];
	}
	#isRequired(fieldset) {
		return (this.dataset.requiredOptions ?? "Size").split(",").map((s) => s.trim().toLowerCase()).includes((fieldset.dataset.optionName ?? "").toLowerCase());
	}
	/** Server-selected ids for every option (unchosen required options keep the server default). */
	#selectedIds() {
		return this.#fieldsets().map((fieldset) => {
			return fieldset.querySelector("input[type=\"radio\"]:checked")?.dataset.optionValueId ?? fieldset.dataset.defaultValueId ?? "";
		});
	}
	async #resolve(focusValueId) {
		const section = this.#section();
		const url = this.dataset.productUrl;
		const sectionId = this.dataset.sectionId;
		if (!section || !url || !sectionId) return;
		this.#setState("resolving");
		const target = new URL(url, location.origin);
		target.searchParams.set("option_values", this.#selectedIds().join(","));
		try {
			const outcome = await this.#sequencer.run((signal) => renderSection(target.toString(), sectionId, { signal }));
			if (outcome.stale) return;
			const incomingUrl = this.#combinedListingUrl(outcome.value);
			if (incomingUrl) {
				location.assign(incomingUrl);
				return;
			}
			replaceRegions(section, outcome.value, [
				"price",
				"picker",
				"inventory",
				"buy"
			]);
			this.#applyExplicitChoice();
			this.#restoreFocus(focusValueId);
		} catch (error) {
			if (error instanceof MissingFragmentError) console.warn(error);
			this.#setState("failed", target.toString());
		}
	}
	#combinedListingUrl(html) {
		const incoming = /data-product-url="([^"]+)"/.exec(html)?.[1];
		if (!incoming || !this.dataset.productUrl) return null;
		return new URL(incoming, location.origin).pathname !== new URL(this.dataset.productUrl, location.origin).pathname ? incoming : null;
	}
	/** After any render: uncheck required options the shopper hasn't chosen and derive state. */
	#applyExplicitChoice() {
		const section = this.#section();
		let incomplete = false;
		for (const fieldset of this.#fieldsets()) {
			const position = fieldset.dataset.optionPosition;
			if (this.#chosen.has(position)) {
				fieldset.removeAttribute("data-incomplete");
				continue;
			}
			incomplete = true;
			const checked = fieldset.querySelector("input[type=\"radio\"]:checked");
			if (checked) fieldset.dataset.defaultValueId = checked.dataset.optionValueId ?? "";
			for (const radio of fieldset.querySelectorAll("input[type=\"radio\"]")) radio.checked = false;
			fieldset.dataset.incomplete = "";
			const status = fieldset.querySelector("[data-selected-value]");
			if (status) status.textContent = t("product.choose_option");
		}
		const idInput = section?.querySelector("input[name=\"id\"]");
		if (incomplete) {
			idInput?.setAttribute("disabled", "");
			this.#setState("incomplete");
			return;
		}
		idInput?.removeAttribute("disabled");
		const availability = section?.querySelector("[data-region=\"buy\"]")?.dataset.availability;
		if (!idInput?.value || availability === "unavailable") this.#setState("unavailable");
		else if (availability === "sold-out") this.#setState("sold-out");
		else this.#setState("available");
		if (idInput?.value && this.#state !== "unavailable") {
			const next = new URL(location.href);
			next.searchParams.set("variant", idInput.value);
			history.replaceState(history.state, "", next);
		}
	}
	#restoreFocus(valueId) {
		if (!valueId) return;
		this.querySelector(`input[data-option-value-id="${CSS.escape(valueId)}"]`)?.focus({ preventScroll: true });
	}
	#setState(state, retryUrl) {
		this.#state = state;
		const section = this.#section();
		section?.setAttribute("data-picker-state", state);
		const failure = section?.querySelector("[data-picker-error]");
		if (failure) {
			failure.hidden = state !== "failed";
			const link = failure.querySelector("a");
			if (link && retryUrl) {
				const full = new URL(retryUrl);
				full.searchParams.delete("section_id");
				link.href = full.toString();
			}
		}
		if (state === "failed") announce.assertive(t("product.selection_failed"));
		this.emit("nk:variant:changed", {
			state,
			variantId: this.resolvedVariantId
		});
	}
};
// src/entries/product.ts
define("nk-variant-picker", NkVariantPicker);
define("nk-product-form", NkProductForm);
define("nk-gallery", NkGallery);
