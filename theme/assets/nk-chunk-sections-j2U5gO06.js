// src/core/define.ts
/** Idempotent registration: entries may load on pages where the tag is already defined. */
function define(tag, constructor) {
	if (!customElements.get(tag)) customElements.define(tag, constructor);
}
// src/core/config.ts
var cached = null;
var fallback = {
	routes: {
		root: "/",
		cart: "/cart",
		cartAdd: "/cart/add",
		cartChange: "/cart/change",
		cartUpdate: "/cart/update",
		predictiveSearch: "/search/suggest",
		productRecommendations: "/recommendations/products",
		search: "/search"
	},
	motion: "standard",
	cart: {
		afterAdd: "drawer",
		sections: []
	},
	strings: {}
};
function config() {
	if (cached) return cached;
	const node = document.getElementById("nk-config");
	if (!node?.textContent) {
		cached = fallback;
		return cached;
	}
	cached = JSON.parse(node.textContent);
	return cached;
}
/** Translated string from locales via nk-config; falls back to the key so gaps are visible. */
function t(key, replacements = {}) {
	let value = config().strings[key] ?? key;
	for (const [name, replacement] of Object.entries(replacements)) value = value.replaceAll(`[${name}]`, String(replacement));
	return value;
}
// src/services/announce.ts
/**
* Live-region announcements for cart, filter and search status. The regions are rendered once in
* layout/theme.liquid (#nk-live-polite / #nk-live-assertive). Identical messages within a second
* are dropped so rapid updates don't repeat.
*/
var last = {
	text: "",
	at: 0
};
function speak(id, text) {
	const region = document.getElementById(id);
	if (!region) return;
	const now = Date.now();
	if (text === last.text && now - last.at < 1e3) return;
	last = {
		text,
		at: now
	};
	region.textContent = "";
	setTimeout(() => {
		region.textContent = text;
	}, 50);
}
var announce = {
	polite: (text) => speak("nk-live-polite", text),
	assertive: (text) => speak("nk-live-assertive", text)
};
// src/core/element.ts
/**
* Base class for every theme custom element (master-plan/04 §5.1).
*
* Shopify's theme editor replaces section HTML at will, so components must assume they can be
* connected, disconnected and reconnected any number of times. Each connection gets a fresh
* AbortController; everything registered through the helpers below is released on disconnect.
*/
var NkElement = class extends HTMLElement {
	#controller = null;
	#disposers = [];
	get signal() {
		if (!this.#controller) throw new Error(`${this.localName} used signal while disconnected`);
		return this.#controller.signal;
	}
	connectedCallback() {
		this.#controller = new AbortController();
		this.#disposers = [];
		this.mount();
	}
	disconnectedCallback() {
		this.#controller?.abort();
		this.#controller = null;
		for (const dispose of this.#disposers.splice(0)) try {
			dispose();
		} catch (error) {
			console.error(error);
		}
		this.unmount?.();
	}
	on(target, type, listener, options = {}) {
		target.addEventListener(type, listener, {
			...options,
			signal: this.signal
		});
	}
	observeIntersection(target, callback, options) {
		const observer = new IntersectionObserver((entries) => {
			for (const entry of entries) callback(entry, observer);
		}, options);
		observer.observe(target);
		this.dispose(() => observer.disconnect());
		return observer;
	}
	observeResize(target, callback) {
		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) callback(entry);
		});
		observer.observe(target);
		this.dispose(() => observer.disconnect());
		return observer;
	}
	/** setTimeout that is cleared automatically on disconnect. */
	later(callback, ms) {
		const id = window.setTimeout(callback, ms);
		this.dispose(() => window.clearTimeout(id));
		return id;
	}
	/** Register custom cleanup (pause media, cancel animations, release a lock...). */
	dispose(callback) {
		this.#disposers.push(callback);
	}
	/** First [data-ref="name"] owned by this element (not by a nested nk- element of the same tag). */
	ref(name) {
		return this.refs(name)[0] ?? null;
	}
	refs(name) {
		return [...this.querySelectorAll(`[data-ref="${name}"]`)].filter((el) => el.closest(this.localName) === this);
	}
	emit(type, detail) {
		this.dispatchEvent(new CustomEvent(type, {
			detail,
			bubbles: true
		}));
	}
};
// src/services/request.ts
/**
* Network layer with typed errors and "latest wins" sequencing (master-plan/04 §5.2).
* POSTs are never retried here; ambiguity is handled by the caller (see cart service).
*/
var NetworkError = class extends Error {
	name = "NetworkError";
};
var TimeoutError = class extends Error {
	name = "TimeoutError";
};
var HttpError = class extends Error {
	status;
	body;
	name = "HttpError";
	constructor(status, body, message = `HTTP ${status}`) {
		super(message);
		this.status = status;
		this.body = body;
	}
};
var AbortedError = class extends Error {
	name = "AbortedError";
};
var ParseError = class extends Error {
	name = "ParseError";
};
async function send(url, { timeoutMs = 15e3, signal, ...init }) {
	const timeout = new AbortController();
	const timer = setTimeout(() => timeout.abort(new TimeoutError(`Timed out after ${timeoutMs}ms`)), timeoutMs);
	const combined = signal ? AbortSignal.any([signal, timeout.signal]) : timeout.signal;
	try {
		return await fetch(url, {
			credentials: "same-origin",
			...init,
			signal: combined
		});
	} catch (error) {
		if (timeout.signal.aborted) throw new TimeoutError(`Timed out after ${timeoutMs}ms`);
		if (signal?.aborted) throw new AbortedError("Superseded");
		throw new NetworkError(error instanceof Error ? error.message : String(error));
	} finally {
		clearTimeout(timer);
	}
}
async function readBody(response) {
	if ((response.headers.get("content-type") ?? "").includes("json")) return response.json().catch(() => null);
	return response.text().catch(() => null);
}
async function fetchText(url, options = {}) {
	const response = await send(url, options);
	if (!response.ok) throw new HttpError(response.status, await readBody(response));
	return response.text();
}
async function fetchJSON(url, options = {}) {
	const response = await send(url, {
		...options,
		headers: {
			Accept: "application/json",
			...options.headers ?? {}
		}
	});
	const text = await response.text().catch(() => "");
	let body = null;
	try {
		body = text ? JSON.parse(text) : null;
	} catch {
		if (response.ok) throw new ParseError(`Expected JSON from ${url}`);
		body = text;
	}
	if (!response.ok) {
		const message = body?.description ?? body?.message;
		throw new HttpError(response.status, body, message ?? `HTTP ${response.status}`);
	}
	return body;
}
/**
* One sequencer per logical stream (a search box, a variant picker, a filter form). Starting a
* new request aborts the previous one; a response is only delivered if it is still the latest.
*/
var Sequencer = class {
	#controller = null;
	#counter = 0;
	async run(task) {
		this.#controller?.abort();
		const controller = new AbortController();
		this.#controller = controller;
		const id = ++this.#counter;
		try {
			const value = await task(controller.signal);
			if (id !== this.#counter) return { stale: true };
			return {
				value,
				stale: false
			};
		} catch (error) {
			if (id !== this.#counter || error instanceof AbortedError) return { stale: true };
			throw error;
		}
	}
	cancel() {
		this.#controller?.abort();
		this.#counter++;
	}
};
/** Errors after which a POST may or may not have been applied by the server. */
function isAmbiguous(error) {
	return error instanceof TimeoutError || error instanceof NetworkError || error instanceof HttpError && error.status >= 500;
}
// src/services/cart.ts
var CartError = class extends Error {
	kind;
	cause;
	name = "CartError";
	constructor(kind, message, cause) {
		super(message);
		this.kind = kind;
		this.cause = cause;
	}
};
var routes = () => config().routes;
/** Section ids of cart regions on this page (≤5), declared in Liquid with data-cart-section. */
function cartSectionIds() {
	const ids = [...document.querySelectorAll("[data-cart-section]")].map((el) => el.dataset.cartSection).filter((id) => Boolean(id));
	return [...new Set(ids)].slice(0, 5);
}
function propertiesMatch(a, b) {
	const left = a ?? {};
	const right = b ?? {};
	const keys = /* @__PURE__ */ new Set([...Object.keys(left), ...Object.keys(right)]);
	for (const key of keys) if (left[key] !== right[key]) return false;
	return true;
}
function quantityFor(cart, item) {
	return cart.items.filter((line) => line.variant_id === item.id && propertiesMatch(line.properties, item.properties)).reduce((sum, line) => sum + line.quantity, 0);
}
var CartService = class {
	#queue = [];
	#running = false;
	#last = null;
	get lastKnown() {
		return this.#last;
	}
	add(items, sourceId) {
		return this.#enqueue({
			kind: "add",
			sourceId,
			payload: { items }
		});
	}
	/** Set an absolute quantity for a line (0 removes it). */
	change(key, quantity, sourceId) {
		const pending = this.#queue.find((op) => !op.sent && op.kind === "change" && op.payload.key === key);
		if (pending) {
			pending.payload.quantity = quantity;
			return new Promise((resolve, reject) => pending.waiters.push({
				resolve,
				reject
			}));
		}
		return this.#enqueue({
			kind: "change",
			sourceId,
			payload: {
				key,
				quantity
			}
		});
	}
	note(note, sourceId) {
		const pending = this.#queue.find((op) => !op.sent && op.kind === "note");
		if (pending) {
			pending.payload.note = note;
			return new Promise((resolve, reject) => pending.waiters.push({
				resolve,
				reject
			}));
		}
		return this.#enqueue({
			kind: "note",
			sourceId,
			payload: { note }
		});
	}
	/** Re-read cart + sections (for app integrations via nk:cart:refresh, bfcache restore, etc). */
	refresh(sourceId = "refresh") {
		return this.#enqueue({
			kind: "refresh",
			sourceId,
			payload: {}
		});
	}
	#enqueue(partial) {
		return new Promise((resolve, reject) => {
			this.#queue.push({
				...partial,
				waiters: [{
					resolve,
					reject
				}],
				sent: false
			});
			this.#drain();
		});
	}
	async #drain() {
		if (this.#running) return;
		this.#running = true;
		this.#emit("nk:cart:pending", { pending: true });
		try {
			while (this.#queue.length) {
				const op = this.#queue[0];
				op.sent = true;
				try {
					const result = await this.#execute(op);
					this.#last = result.cart;
					for (const waiter of op.waiters) waiter.resolve(result);
					this.#emit("nk:cart:updated", {
						...result,
						sourceId: op.sourceId,
						kind: op.kind
					});
				} catch (error) {
					const cartError = this.#toCartError(error);
					for (const waiter of op.waiters) waiter.reject(cartError);
					this.#emit("nk:cart:error", {
						error: cartError,
						sourceId: op.sourceId,
						kind: op.kind
					});
				} finally {
					this.#queue.shift();
				}
			}
		} finally {
			this.#running = false;
			this.#emit("nk:cart:pending", { pending: false });
		}
	}
	async #execute(op) {
		const sections = cartSectionIds();
		switch (op.kind) {
			case "refresh": return {
				cart: await this.#getCart(),
				sections: await this.#renderCartSections(sections),
				reconciled: false
			};
			case "add": return this.#add(op.payload.items ?? [], sections);
			case "change": return this.#change(op.payload.key, op.payload.quantity, sections);
			case "note": return this.#post(routes().cartUpdate, { note: op.payload.note ?? "" }, sections);
		}
	}
	async #add(items, sections) {
		const before = this.#last ?? await this.#getCart().catch(() => null);
		try {
			const response = await fetchJSON(`${routes().cartAdd}.js`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					items,
					sections,
					sections_url: location.pathname
				})
			});
			return {
				cart: await this.#getCart(),
				sections: response.sections ?? {},
				reconciled: false
			};
		} catch (error) {
			if (!isAmbiguous(error)) throw error;
			const after = await this.#getCart().catch(() => null);
			if (!after || !before) throw new CartError("unknown", "Could not confirm whether the item was added", error);
			if (!items.every((item) => quantityFor(after, item) >= quantityFor(before, item) + item.quantity)) throw new CartError("not-applied", "The item was not added", error);
			return {
				cart: after,
				sections: await this.#renderCartSections(sections),
				reconciled: true
			};
		}
	}
	async #change(key, quantity, sections) {
		let known = this.#last;
		if (!known || !known.items.some((line) => line.key === key)) {
			known = await this.#getCart();
			this.#last = known;
			if (!known.items.some((line) => line.key === key)) throw new CartError("line-missing", "This item is no longer in your cart");
		}
		try {
			return await this.#post(routes().cartChange, {
				id: key,
				quantity
			}, sections);
		} catch (error) {
			if (!isAmbiguous(error)) throw error;
			const after = await this.#getCart().catch(() => null);
			if (!after) throw new CartError("unknown", "Could not confirm the cart update", error);
			const line = after.items.find((item) => item.key === key);
			if (!(quantity === 0 ? !line : line?.quantity === quantity)) throw new CartError("not-applied", "The cart was not updated", error);
			return {
				cart: after,
				sections: await this.#renderCartSections(sections),
				reconciled: true
			};
		}
	}
	async #post(url, body, sections) {
		const { sections: rendered, ...cart } = await fetchJSON(`${url}.js`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				...body,
				sections,
				sections_url: location.pathname
			})
		});
		return {
			cart,
			sections: rendered ?? {},
			reconciled: false
		};
	}
	async #getCart() {
		return fetchJSON(`${routes().cart}.js`);
	}
	/** Safe GET used after reconciliation or for refresh; failures degrade to "no HTML". */
	async #renderCartSections(sections) {
		if (!sections.length) return {};
		const url = new URL(location.pathname, location.origin);
		url.searchParams.set("sections", sections.join(","));
		return fetchJSON(url.toString()).catch(() => Object.fromEntries(sections.map((id) => [id, null])));
	}
	#toCartError(error) {
		if (error instanceof CartError) return error;
		if (error instanceof HttpError) {
			if (error.status === 429) return new CartError("throttled", error.message, error);
			if (error.status === 422 || error.status === 400) return new CartError("rejected", error.message, error);
		}
		return new CartError("unknown", error instanceof Error ? error.message : String(error), error);
	}
	#emit(type, detail) {
		document.dispatchEvent(new CustomEvent(type, { detail }));
	}
};
var cart = new CartService();
// src/core/dom.ts
/** Parse an HTML string (from Section Rendering) into a detached document. */
function parseHTML(html) {
	return new DOMParser().parseFromString(html, "text/html");
}
/**
* Remember the focused control inside `root` by its data-focus-key so it can be restored after
* the region is replaced (master-plan/12 §2).
*/
function captureFocus(root) {
	const active = document.activeElement;
	if (!active || !root.contains(active)) return null;
	return active.closest("[data-focus-key]")?.dataset.focusKey ?? null;
}
function restoreFocus(root, key) {
	if (!key) return;
	root.querySelector(`[data-focus-key="${CSS.escape(key)}"]`)?.focus({ preventScroll: true });
}
// src/services/sections.ts
/** Section Rendering API (max 5 sections per request; failed sections come back as null). */
async function renderSections(url, sectionIds, options = {}) {
	if (sectionIds.length === 0 || sectionIds.length > 5) throw new RangeError("Section Rendering accepts 1–5 section ids");
	const target = new URL(url, location.origin);
	target.searchParams.set("sections", sectionIds.join(","));
	return fetchJSON(target.toString(), options);
}
/** Single section as raw HTML (used where the response is one region, e.g. variant picker). */
async function renderSection(url, sectionId, options = {}) {
	const target = new URL(url, location.origin);
	target.searchParams.set("section_id", sectionId);
	return fetchText(target.toString(), options);
}
var MissingFragmentError = class extends Error {
	name = "MissingFragmentError";
};
/**
* Replace the children of every `[data-region="name"]` inside `scope` with the matching region
* from `html`. A region missing from the response is a recoverable error; nothing is replaced
* unless every requested region is present (no half-updated purchase UI).
*/
function replaceRegions(scope, html, regions) {
	const incoming = parseHTML(html);
	const pairs = regions.flatMap((name) => {
		const current = scope.querySelector(`[data-region="${name}"]`);
		if (!current) return [];
		const next = incoming.querySelector(`[data-region="${name}"]`);
		if (!next) throw new MissingFragmentError(`Region "${name}" missing`);
		for (const { name: attr, value } of [...next.attributes]) current.setAttribute(attr, value);
		return [[current, next]];
	});
	const focusKey = captureFocus(scope);
	for (const [current, next] of pairs) current.replaceChildren(...[...next.childNodes].map((n) => document.importNode(n, true)));
	restoreFocus(scope, focusKey);
	scope.dispatchEvent(new CustomEvent("nk:section:replaced", {
		bubbles: true,
		detail: { regions }
	}));
}
export { captureFocus as a, CartError as c, Sequencer as d, NkElement as f, define as g, t as h, replaceRegions as i, cart as l, config as m, renderSection as n, parseHTML as o, announce as p, renderSections as r, restoreFocus as s, MissingFragmentError as t, cartSectionIds as u };
