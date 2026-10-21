import { _ as NkElement, b as t, l as decorativeMotionAllowed, x as define } from "./nk-chunk-sections-CYB9cWhh.js";
// src/components/marquee/marquee.ts
/**
* <nk-marquee> — endless ticker / message band / image strip / vertical reviews wall
* (master-plan/05 T2). Clean-room rewrite of the behaviour of the supplied marquee (Magic UI),
* Scroll Velocity (React Bits) and infiniteslider (motion-primitives) examples.
*
* Attributes: direction="left|right|up|down" speed="40" (px/s) hover-speed="0.3" (playback rate
* while hovered; 0 pauses) scroll-react (speed follows page scroll velocity).
*
* - Liquid renders the list once; copies made here are aria-hidden + inert (no double reading,
*   no duplicate tab stops).
* - Web Animations on transform only; paused offscreen, in background tabs, on hover/focus.
* - A pause button is always present while moving (WCAG 2.2.2).
* - Reduced motion / Motion off / editor: static, scrollable list instead.
*/
var NkMarquee = class extends NkElement {
	#animation = null;
	#userPaused = false;
	#visible = true;
	#hovered = false;
	#scrollBoost = 1;
	#frame = 0;
	mount() {
		const track = this.ref("track");
		const list = this.ref("list");
		if (!track || !list) return;
		if (!decorativeMotionAllowed()) {
			this.setAttribute("data-static", "");
			return;
		}
		this.#build(track, list);
		let width = this.offsetWidth;
		this.observeResize(this, () => {
			if (Math.abs(this.offsetWidth - width) < 2) return;
			width = this.offsetWidth;
			this.#build(track, list);
		});
		this.observeIntersection(this, (entry) => {
			this.#visible = entry.isIntersecting;
			this.#sync();
		});
		this.on(document, "visibilitychange", () => this.#sync());
		const hoverRate = Number(this.getAttribute("hover-speed") ?? "0");
		this.on(this, "pointerenter", (event) => {
			if (event.pointerType !== "mouse") return;
			this.#hovered = true;
			this.#applyRate(hoverRate);
		});
		this.on(this, "pointerleave", () => {
			this.#hovered = false;
			this.#applyRate(1);
		});
		this.on(this, "focusin", () => {
			this.#hovered = true;
			this.#sync();
		});
		this.on(this, "focusout", () => {
			this.#hovered = false;
			this.#sync();
		});
		const pause = this.ref("pause");
		if (pause) {
			pause.hidden = false;
			this.on(pause, "click", () => {
				this.#userPaused = !this.#userPaused;
				pause.setAttribute("aria-pressed", String(this.#userPaused));
				pause.setAttribute("aria-label", this.#userPaused ? t("marquee.play") : t("marquee.pause"));
				this.#sync();
			});
		}
		if (this.hasAttribute("scroll-react")) this.#reactToScroll();
		this.dispose(() => {
			this.#animation?.cancel();
			cancelAnimationFrame(this.#frame);
			this.querySelectorAll("[data-marquee-clone]").forEach((clone) => clone.remove());
		});
	}
	onEditorSelect(blockId) {
		this.#userPaused = true;
		this.#sync();
		if (!blockId || !this.#animation) return;
		const block = this.ref("list")?.querySelector(`[data-block-id="${CSS.escape(blockId)}"]`);
		const distance = Number(this.dataset.distance ?? 0);
		const duration = Number(this.#animation.effect?.getTiming().duration ?? 0);
		if (block && distance && duration) {
			const offset = this.#vertical ? block.offsetTop : block.offsetLeft;
			this.#animation.currentTime = offset / distance * duration;
		}
	}
	onEditorDeselect() {
		this.#userPaused = false;
		this.#sync();
	}
	get #vertical() {
		const direction = this.getAttribute("direction");
		return direction === "up" || direction === "down";
	}
	#build(track, list) {
		this.#animation?.cancel();
		track.querySelectorAll("[data-marquee-clone]").forEach((clone) => clone.remove());
		const vertical = this.#vertical;
		const listSize = vertical ? list.offsetHeight : list.offsetWidth;
		const viewSize = vertical ? this.offsetHeight : this.offsetWidth;
		if (!listSize) return;
		const perUnit = Math.max(1, Math.ceil(viewSize / listSize));
		const copies = perUnit * 2 - 1;
		for (let i = 0; i < copies; i++) {
			const clone = list.cloneNode(true);
			clone.removeAttribute("data-ref");
			clone.setAttribute("data-marquee-clone", "");
			clone.setAttribute("aria-hidden", "true");
			clone.inert = true;
			clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
			clone.querySelectorAll("[data-block-id]").forEach((el) => el.removeAttribute("data-block-id"));
			track.append(clone);
		}
		const distance = listSize * perUnit;
		this.dataset.distance = String(distance);
		const speed = Math.max(5, Number(this.getAttribute("speed") ?? 40));
		const axis = vertical ? "translateY" : "translateX";
		const reverse = this.getAttribute("direction") === "right" || this.getAttribute("direction") === "down";
		this.#animation = track.animate([{ transform: `${axis}(0)` }, { transform: `${axis}(-${distance}px)` }], {
			duration: distance / speed * 1e3,
			iterations: Infinity,
			direction: reverse ? "reverse" : "normal"
		});
		this.#sync();
	}
	#sync() {
		const animation = this.#animation;
		if (!animation) return;
		const hoverRate = Number(this.getAttribute("hover-speed") ?? "0");
		const stopped = this.#userPaused || !this.#visible || document.hidden || this.#hovered && hoverRate === 0;
		if (stopped && animation.playState === "running") animation.pause();
		if (!stopped && animation.playState !== "running") animation.play();
		this.toggleAttribute("data-paused", this.#userPaused);
	}
	#applyRate(base) {
		if (!this.#animation) return;
		if (base === 0) {
			this.#sync();
			return;
		}
		this.#animation.updatePlaybackRate(base * this.#scrollBoost);
		this.#sync();
	}
	/** Scroll Velocity behaviour: speed up with scroll speed, ease back when scrolling stops. */
	#reactToScroll() {
		let lastY = window.scrollY;
		let lastTime = performance.now();
		const decay = () => {
			this.#frame = 0;
			this.#scrollBoost += (1 - this.#scrollBoost) * .08;
			if (Math.abs(this.#scrollBoost - 1) < .01) this.#scrollBoost = 1;
			if (!this.#hovered) this.#animation?.updatePlaybackRate(this.#scrollBoost);
			if (this.#scrollBoost !== 1) this.#frame = requestAnimationFrame(decay);
		};
		this.on(window, "scroll", () => {
			if (!this.#visible) return;
			const now = performance.now();
			const velocity = Math.abs(window.scrollY - lastY) / Math.max(16, now - lastTime);
			lastY = window.scrollY;
			lastTime = now;
			this.#scrollBoost = Math.min(3, Math.max(this.#scrollBoost, 1 + velocity * 1.5));
			if (!this.#hovered) this.#animation?.updatePlaybackRate(this.#scrollBoost);
			if (!this.#frame) this.#frame = requestAnimationFrame(decay);
		}, { passive: true });
	}
};
define("nk-marquee", NkMarquee);
export { NkMarquee };
