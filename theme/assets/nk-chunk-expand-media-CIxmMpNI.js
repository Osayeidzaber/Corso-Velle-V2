import { _ as NkElement, b as t, l as decorativeMotionAllowed, x as define } from "./nk-chunk-sections-CYB9cWhh.js";
// src/components/expand-media/expand-media.ts
/**
* <nk-expand-media> — campaign media that opens from an inset card to full-bleed as the page
* scrolls past (master-plan/05 T5). Clean-room rewrite of the supplied Scroll Expand example's
* behaviour: tall track, sticky stage, clip-path inset + media zoom-out, title fades out
* (40–88%), scrim and overlay content fade in (from 68%), scroll hint fades (0–12%).
*
* Uses native scrolling only (passive listener, never preventDefault). JS writes a handful of
* CSS variables per frame and the rAF loop stops once progress settles. Reduced motion, Motion
* off and the theme editor render the final, static state.
*/
var smoothstep = (edge0, edge1, x) => {
	const tt = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
	return tt * tt * (3 - 2 * tt);
};
var NkExpandMedia = class extends NkElement {
	#current = 0;
	#target = 0;
	#frame = 0;
	mount() {
		const video = this.querySelector("video");
		if (!decorativeMotionAllowed()) {
			this.setAttribute("data-static", "");
			this.#apply(1);
			this.#wireVideo(video, false);
			return;
		}
		this.#target = this.#progress();
		this.#current = this.#target;
		this.#apply(this.#current);
		this.on(window, "scroll", () => this.#schedule(), { passive: true });
		this.on(window, "resize", () => this.#schedule());
		this.dispose(() => cancelAnimationFrame(this.#frame));
		this.#wireVideo(video, true);
	}
	onEditorSelect() {
		this.#apply(1);
	}
	#progress() {
		const rect = (this.ref("track") ?? this).getBoundingClientRect();
		const span = Math.max(1, rect.height - window.innerHeight);
		return Math.min(1, Math.max(0, -rect.top / (span * .75)));
	}
	#schedule() {
		this.#target = this.#progress();
		if (this.#frame) return;
		const tick = () => {
			this.#current += (this.#target - this.#current) * .18;
			if (Math.abs(this.#target - this.#current) < .001) this.#current = this.#target;
			this.#apply(this.#current);
			this.#frame = this.#current === this.#target ? 0 : requestAnimationFrame(tick);
		};
		this.#frame = requestAnimationFrame(tick);
	}
	#apply(p) {
		const e = smoothstep(0, 1, p);
		this.style.setProperty("--e", e.toFixed(4));
		this.style.setProperty("--title", (1 - smoothstep(.4, .88, p)).toFixed(3));
		this.style.setProperty("--overlay", smoothstep(.68, 1, p).toFixed(3));
		this.style.setProperty("--hint", (1 - smoothstep(0, .12, p)).toFixed(3));
		this.toggleAttribute("data-open", p > .95);
	}
	#wireVideo(video, autoplay) {
		if (!video) return;
		const button = this.ref("video-toggle");
		let userPaused = !autoplay;
		const update = () => {
			if (!button) return;
			button.setAttribute("aria-label", video.paused ? t("media.play") : t("media.pause"));
			button.setAttribute("aria-pressed", String(!video.paused));
		};
		if (autoplay) this.observeIntersection(this, (entry) => {
			if (entry.isIntersecting && !userPaused) video.play().catch(() => {});
			else video.pause();
		});
		if (button) {
			button.hidden = false;
			this.on(button, "click", () => {
				if (video.paused) {
					userPaused = false;
					video.play().catch(() => {});
				} else {
					userPaused = true;
					video.pause();
				}
			});
			this.on(video, "play", update);
			this.on(video, "pause", update);
			update();
		}
		this.dispose(() => video.pause());
	}
};
define("nk-expand-media", NkExpandMedia);
export { NkExpandMedia };
