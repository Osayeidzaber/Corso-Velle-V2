# Section kit: sources and licenses

These 25 optional sections show up under **Add section** in the theme editor. None of them is used by a default template. Each one is adapted from an open-source component with a permissive license. The markup, schema and CSS were rewritten for this theme: Liquid settings and blocks, `section-presentation` width and padding inputs, `--nk-*` tokens instead of Tailwind utilities, `nk-anim` and reduced-motion guards, and native elements where the original relied on JavaScript or CSS tricks.

Sources were fetched on 2026-10-23 from these upstream commits:

| Project | Repository @ commit | License | License text |
| --- | --- | --- | --- |
| Shopify Dawn | [Shopify/dawn](https://github.com/Shopify/dawn) @ `05222537f6` | Shopify theme license: MIT terms, limited to themes that work with Shopify | [LICENSES/shopify-dawn.md](LICENSES/shopify-dawn.md) |
| HyperUI | [markmead/hyperui](https://github.com/markmead/hyperui) @ `252efcfe39` | MIT, © Mark Mead | [LICENSES/hyperui.md](LICENSES/hyperui.md) |
| daisyUI | [saadeghi/daisyui](https://github.com/saadeghi/daisyui) @ `bf3bac3a39` | MIT, © 2020 Pouya Saadeghi | [LICENSES/daisyui.md](LICENSES/daisyui.md) |
| Flowbite (open-source core, not Flowbite Pro/Blocks) | [themesberg/flowbite](https://github.com/themesberg/flowbite) @ `232ebdb33a` | MIT, © 2023 Bergside Inc. | [LICENSES/flowbite.md](LICENSES/flowbite.md) |
| Uiverse | [uiverse-io/galaxy](https://github.com/uiverse-io/galaxy) @ `adbd2adde0` | MIT, © 2023 Uiverse.io | [LICENSES/uiverse.md](LICENSES/uiverse.md) |
| Heroicons | [tailwindlabs/heroicons](https://github.com/tailwindlabs/heroicons) @ `616b7a4dbb` | MIT, © Tailwind Labs | [LICENSES/heroicons.md](LICENSES/heroicons.md) |

## Sections

| # | Section file | Editor name | Adapted from | Script |
| --- | --- | --- | --- | --- |
| 1 | `sections/button-row.liquid` | Button row | Button styles in `snippets/nk-button.liquid` + `src/styles/components/section-kit.css`: **pill** from HyperUI `public/examples/marketing/buttons/1.html`; **outline** from Uiverse `Buttons/ArturCodeCraft_witty-deer-63.html`; **center sweep** from Uiverse `Buttons/adamgiebl_popular-termite-0.html`; **offset shadow** from Uiverse `Buttons/mi-series_bright-termite-75.html`; **3D press** from Uiverse `Buttons/satyamchaudharydev_purple-rat-85.html` | — |
| 2 | `sections/hero-split.liquid` | Hero: split | HyperUI `marketing/ctas/1.html` (split image + CTA) | — |
| 3 | `sections/hero-overlay.liquid` | Hero: image overlay | Dawn `sections/image-banner.liquid` (overlay opacity, 9 content positions, heading/text/button blocks) | — |
| 4 | `sections/image-with-text.liquid` | Image with text | Dawn `sections/image-with-text.liquid` | — |
| 5 | `sections/rich-text.liquid` | Rich text | Dawn `sections/rich-text.liquid` | — |
| 6 | `sections/multicolumn.liquid` | Multicolumn | Dawn `sections/multicolumn.liquid` | — |
| 7 | `sections/collage.liquid` | Collage | Dawn `sections/collage.liquid` (image / product / collection blocks, large block left or right) | — |
| 8 | `sections/video-feature.liquid` | Video | Dawn `sections/video.liquid` + Dawn's `deferred-media` element (poster first, player on click) | `nk-video` → `src/components/video/` |
| 9 | `sections/testimonial-grid.liquid` | Testimonials grid | HyperUI `marketing/testimonials` (figure, blockquote and avatar caption) | — |
| 10 | `sections/testimonial-quote.liquid` | Testimonial quote | HyperUI `marketing/testimonials/1.html` (single centered quote; quote-mark SVG path from that file) | — |
| 11 | `sections/logo-wall.liquid` | Logo wall | HyperUI `marketing/logo-clouds/1.html` (1px-gap ruled grid, grayscale until hover) | — |
| 12 | `sections/feature-list.liquid` | Feature list | HyperUI `marketing/feature-grids/1.html` + Heroicons 24/outline icons in `snippets/section-icon.liquid` | — |
| 13 | `sections/counter-band.liquid` | Counter band | HyperUI `marketing/stats/1.html` (`dl` with label after value) | `nk-count-up` → `src/components/count-up/` |
| 14 | `sections/timeline.liquid` | Timeline | HyperUI `application/timelines/1.html` (rail + dot); alternating layout from daisyUI `components/timeline.css` | — |
| 15 | `sections/process-steps.liquid` | Process steps | daisyUI `components/steps.css` (numbered markers joined by a line) + HyperUI `application/steps/1.html` | — |
| 16 | `sections/team-grid.liquid` | Team | HyperUI `marketing/team-sections/1.html` (photo, name/role, `aria-labelledby` social link) | — |
| 17 | `sections/pricing-cards.liquid` | Pricing cards | HyperUI `marketing/pricing/1.html` (featured ring card, check-list features) | — |
| 18 | `sections/countdown.liquid` | Countdown | daisyUI `components/countdown.css` (rolling `--value` digit strip) | `nk-countdown` → `src/components/countdown/` |
| 19 | `sections/promo-banner.liquid` | Promo banner | HyperUI `marketing/announcements/1.html` and `marketing/banners/1.html`, plus a dismiss control | `nk-dismissible` → `src/components/dismissible/` |
| 20 | `sections/comparison-table.liquid` | Comparison table | HyperUI `application/tables/1.html` (ruled/striped rows) | — |
| 21 | `sections/newsletter-banner.liquid` | Newsletter banner | Dawn `sections/email-signup-banner.liquid` (heading / text / email form blocks over an image); form from `snippets/newsletter-form.liquid` | — |
| 22 | `sections/newsletter-split.liquid` | Newsletter split | HyperUI `marketing/newsletter-signup/1.html`; form from `snippets/newsletter-form.liquid` | — |
| 23 | `sections/lookbook.liquid` | Lookbook hotspots | Dawn `sections/collage.liquid` (product block data); hotspot dot from daisyUI `components/status.css`; product card from Flowbite `content/components/popover.md`, rebuilt on `<details name>` so it needs no script | — |
| 24 | `sections/contact-form.liquid` | Contact form | Dawn `sections/contact-form.liquid` (`{% form 'contact' %}`, prefilled customer data, error handling) | — |
| 25 | `sections/image-compare.liquid` | Before / after | daisyUI `components/diff.css` (clip-path layers). Its CSS `resize` handle was swapped for a native range input so the slider works with touch and keyboard | `nk-image-compare` → `src/components/image-compare/` |

Shared pieces:

- `snippets/nk-button.liquid`: the button link used by every section (styles listed in row 1).
- `snippets/section-heading.liquid`: the optional heading and intro text.
- `snippets/section-icon.liquid`: Heroicons paths (truck, arrow-path, scissors, sparkles, heart, globe-alt, lock-closed, shield-check, gift, bolt, adjustments-vertical, check).
- `src/styles/components/section-kit.css`: button variants and layout helpers (`.kit-buttons`, `.kit-display`, `.kit-link`, `.kit-placeholder`).
- Storefront text is in `locales/en.default.json` under `sections.*`.

## Editor options

Every section has the same two groups at the end of its settings:

- **Design**: heading size (small to extra large), corners (theme / square / soft / round, applied to images, cards and buttons), button size, and entrance animation (none, fade in section, or items rise one by one with `nk-stagger`; skipped under reduced motion or Motion off).
- **Section**: color scheme, content width and custom desktop/phone padding (`section-presentation`).

Shared building blocks, so the same option behaves the same everywhere:

- **Buttons**: every button block has a label, link (defaults to all products), style (solid, outline, pill, center sweep, offset shadow, 3D press, text link) and *open in a new tab*.
- **Card style**: plain, surface fill, outline or soft shadow, on testimonials, features, counters, timeline events, steps, team, pricing, multicolumn, newsletter and the contact form.
- **Image ratio**: adapt, square, portrait, tall, landscape or wide, with fill-or-contain fit and hover zoom where it makes sense.
- **Content blocks** in the hero overlay, image with text and rich text: caption (small caps, badge or plain), heading (four sizes, italic), text (three sizes, default or muted), spacer and button, in any order.

Notable per-section options: split ratio, mobile order and phone image height (hero split); overlay gradient, light or dark text, frosted or solid panel, separate phone height and position (hero overlay); overlapping panel (image with text); masonry and swipe-row layouts, linked product (testimonials); centered-row layout, opacity and phone columns (logo wall); horizontal layout, ring/number markers and dashed line (timeline); icon markers (process steps); inverted or accent highlighted plan, "was" price and small print (pricing); inline layout, colons, digit size and hiding days (countdown); separators, uppercase and pill links (promo banner); a fourth column, sticky first column and check/dot/word marks (comparison table); field and submit styles for the signup form (newsletters); numbered markers, color, size, pulse and a product list beside or below the image (lookbook); dropdown, date and number field types (contact form); handle style and color, label position (before/after).

## Behaviour notes

- **Countdown**: the end date and time are read in the shop's time zone (Liquid `'now' | date: '%z'`). The offset is the one in effect when the page renders, so a countdown that crosses a daylight-saving change can be off by an hour. The ticking clock is `aria-hidden`; the printed end date is the text assistive tech reads. The rolling digits run only when motion is allowed and the browser supports CSS `mod()` and `round()`. Otherwise the digits change without animation.
- **Promo banner**: a dismissed banner stays hidden for the rest of the browser session (`sessionStorage`). The storage key includes a hash of the message text, so editing the message shows it again. The theme editor never hides it.
- **Counter band**: the final number is in the HTML. The count-up only runs when motion is allowed and the page is outside the editor. Values must be plain numbers such as `4.9` or `12,000`; anything else stays as written.
- **Video**: YouTube embeds use `youtube-nocookie.com` and Vimeo embeds use `dnt=1`. No third-party frame loads until the visitor presses play. Without JavaScript, the YouTube or Vimeo poster links to the video page.
- **Lookbook**: hotspots use exclusive `<details name>` elements. The optional product list under the image gives the same links in a format that works well on small screens.
