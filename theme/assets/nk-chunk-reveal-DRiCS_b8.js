import { _ as NkElement, l as decorativeMotionAllowed, x as define } from "./nk-chunk-sections-CYB9cWhh.js";
// src/components/reveal/split.ts
var MAX_CHARS = 24;
/**
* Splits the text of `target` into `.nk-piece` spans for staggered reveals.
*
* The original text stays readable by assistive tech in a visually hidden span; the visual pieces
* are aria-hidden. Only plain text (and <br>) is split — headings with links or formatting are
* left untouched and reveal as a whole. Returns a function that restores the original markup.
* Character splitting falls back to words above 24 characters (DOM size and readability).
*/
function splitText(target, by) {
	const original = target.innerHTML;
	const restore = () => {
		target.innerHTML = original;
	};
	if (![...target.childNodes].every((node) => node.nodeType === Node.TEXT_NODE || node instanceof HTMLBRElement)) return restore;
	const text = target.textContent?.replace(/\s+/g, " ").trim() ?? "";
	if (!text) return restore;
	const mode = by === "char" && text.length > MAX_CHARS ? "word" : by;
	const accessible = document.createElement("span");
	accessible.className = "visually-hidden";
	accessible.textContent = text;
	const visual = document.createElement("span");
	visual.className = "nk-pieces";
	visual.setAttribute("aria-hidden", "true");
	const segments = original.split(/<br\s*\/?>/i).map((html) => {
		const scratch = document.createElement("span");
		scratch.innerHTML = html;
		return scratch.textContent?.replace(/\s+/g, " ").trim() ?? "";
	}).filter(Boolean);
	let index = 0;
	const words = [];
	segments.forEach((segment, segmentIndex) => {
		if (segmentIndex > 0) visual.append(document.createElement("br"));
		segment.split(" ").forEach((word, wordIndex, all) => {
			const wordSpan = document.createElement("span");
			wordSpan.className = "nk-word";
			if (mode === "char") for (const char of Array.from(word)) {
				const piece = document.createElement("span");
				piece.className = "nk-piece";
				piece.style.setProperty("--i", String(index++));
				piece.textContent = char;
				wordSpan.append(piece);
			}
			else {
				wordSpan.classList.add("nk-piece");
				wordSpan.style.setProperty("--i", String(index++));
				wordSpan.textContent = word;
			}
			words.push(wordSpan);
			visual.append(wordSpan);
			if (wordIndex < all.length - 1) visual.append(document.createTextNode(" "));
		});
	});
	target.replaceChildren(accessible, visual);
	if (mode === "line") groupIntoLines(visual, words);
	return restore;
}
/** Wraps words that share a rendered line into `.nk-line > .nk-piece` (needs layout). */
function groupIntoLines(visual, words) {
	const lines = [];
	let top = null;
	for (const word of words) {
		const y = word.offsetTop;
		if (top === null || Math.abs(y - top) > 2) {
			lines.push([]);
			top = y;
		}
		lines.at(-1).push(word);
	}
	visual.replaceChildren();
	lines.forEach((lineWords, i) => {
		const line = document.createElement("span");
		line.className = "nk-line";
		const inner = document.createElement("span");
		inner.className = "nk-piece";
		inner.style.setProperty("--i", String(i));
		inner.textContent = lineWords.map((w) => w.textContent).join(" ");
		line.append(inner);
		visual.append(line);
	});
}
// src/components/reveal/reveal.ts
/**
* <nk-reveal mode="cut|fade|wipe|split|fold" by="line|word|char"> — in-view entrance for campaign
* headings and editorial blocks (master-plan/05 T1). Clean-room rewrite of the behaviour of the
* supplied Split Text, Animated Content, foldtext and textpercharacter examples:
*
* - Content is visible in the HTML. JS "arms" the hidden start state only when motion is allowed,
*   the element is below the fold, and the page is not in the theme editor.
* - Plays once when 15% visible, then the observer disconnects.
* - split/fold keep the original text for assistive tech (visually hidden copy; pieces aria-hidden).
* - Editor selection or a reduced-motion preference jumps straight to the end state.
*/
var NkReveal = class extends NkElement {
	#restore = null;
	mount() {
		if (!decorativeMotionAllowed()) return;
		const rect = this.getBoundingClientRect();
		const playOnLoad = this.hasAttribute("play-on-load");
		if (rect.top < window.innerHeight * .9 && !playOnLoad) return;
		const mode = this.getAttribute("mode") ?? "fade";
		if (mode === "split" || mode === "fold") {
			const target = this.querySelector("[data-reveal-target]") ?? this.firstElementChild;
			if (target instanceof HTMLElement) {
				const by = this.getAttribute("by") ?? (mode === "fold" ? "word" : "line");
				this.#restore = splitText(target, by);
				if (by === "line") {
					let width = this.offsetWidth;
					this.observeResize(this, () => {
						if (this.hasAttribute("data-play") || Math.abs(this.offsetWidth - width) < 2) return;
						width = this.offsetWidth;
						this.#restore?.();
						this.#restore = splitText(target, by);
					});
					document.fonts?.ready.then(() => {
						if (this.hasAttribute("data-play") || !this.isConnected) return;
						this.#restore?.();
						this.#restore = splitText(target, by);
					});
				}
			}
		}
		this.setAttribute("data-armed", "");
		if (playOnLoad && rect.top < window.innerHeight) {
			requestAnimationFrame(() => requestAnimationFrame(() => this.#play()));
			return;
		}
		this.observeIntersection(this, (entry, observer) => {
			if (!entry.isIntersecting) return;
			observer.disconnect();
			this.#play();
		}, {
			threshold: .15,
			rootMargin: "0px 0px -10% 0px"
		});
	}
	unmount() {
		this.#restore?.();
		this.#restore = null;
	}
	onEditorSelect() {
		this.#finish();
	}
	#play() {
		this.setAttribute("data-play", "");
		const pieces = this.querySelectorAll(".nk-piece").length;
		const total = 600 + Math.min(pieces, 12) * 40;
		this.later(() => this.#finish(), total);
	}
	#finish() {
		this.removeAttribute("data-armed");
		this.setAttribute("data-done", "");
	}
};
define("nk-reveal", NkReveal);
export { NkReveal };
