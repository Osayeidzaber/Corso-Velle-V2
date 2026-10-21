# 10 — Homepage and content section library

This file refines and replaces S-01..S-12 in [../07-homepage-and-content.md](../07-homepage-and-content.md). See canvas artboard 08. Every section below meets the shared rules in [11](11-editor-data-presets-reuse.md) (editor) and [12](12-mobile-accessibility-motion-performance.md) (phone, accessibility, motion, performance). Those rules are not repeated in each entry unless a section adds something to them.

Composition sections accept **theme blocks** (`@theme` plus the private blocks they list). Shared theme blocks: `heading`, `text`, `button-group`, `media`, `group`, `spacer`, `custom-liquid`. Every block renders `{{ block.shopify_attributes }}` on its root element.

## Default homepage order (Preset A)

1. Announcement (header group)
2. Header (overlay on)
3. Hero
4. Collection tiles
5. Featured collection "Drop" (8 products)
6. Media-with-text (fit story)
7. Featured collection 2 (rail)
8. Campaign tiles (2)
9. Newsletter
10. Footer

**Preset B:** split hero → featured collection (grid, 6 products) → rich text story → newsletter.

No section depends on the section next to it. Each one works in any position and works when duplicated.

---

### CS-01 Hero (`sections/hero.liquid`) — P1

**Purpose.** Introduce the current drop and give one clear destination.

**Behaviour.** The section supports three content types:

- **Image.** A desktop image and a mobile image. The mobile image is optional; without one, the desktop image is used with its focal point.
- **Video.** A Shopify-hosted video or a URL, always with a poster image. Video is muted and plays inline. It autoplays only when the setting is on and Motion is not Off. It pauses when offscreen and when the shopper presses the pause button.
- **Slides.** 1–3 `_slide` blocks. Slides advance manually by default. If autoplay is enabled it runs for at least 6 s per slide, with a pause button and a progress bar.

Content blocks: eyebrow, heading (with an optional `nk-reveal` entrance), text, and `button-group` (up to 2 buttons).

**Layout settings.**
- Height: adapt to image / medium / large / full. "Full" uses `min(100svh - var(--nk-header-h), 900px)`.
- Content position: 9-point desktop, 3-point mobile.
- Scrim strength. Colour scheme.

**States.** default · video-loading (poster shown) · video-blocked (poster stays) · paused · slide n · editor-selected (paused on the selected slide).

**Motion.**
- Cut reveal for the heading only.
- Slides crossfade over 400 ms.
- Reduced motion: no autoplay and no reveal.

**Accessibility.** Slides form a `region` with `aria-roledescription="carousel"`; each slide is a group labelled "2 of 3"; previous, next and pause controls are provided. Text is real HTML, never baked into the image.

**Performance.** The first image is eager with `fetchpriority=high` and correct `sizes` (`100vw`). Later slides are lazy. The video loads `preload="none"` until it starts.

**Acceptance.**
- At 320px with 200% text, the CTA stays visible above the browser chrome in the first viewport.
- No CLS while loading.
- In the editor, selecting slide 3 shows slide 3 with autoplay paused.
- If the video fails, the poster is shown.

### CS-02 Collection tiles (`sections/collection-tiles.liquid`) — P1

`_tile` blocks hold a collection picker plus optional image, title override and label. Layouts: grid (2–4 columns desktop, 2 or 1 on phones) or rail (scroll-snap with arrow buttons). The label sits in a solid band or scrim that is contrast-tested. A tile with no collection is omitted on the storefront and shows a placeholder in the editor. Optional product count comes from `collection.products_count`.

### CS-03 Featured collection (`sections/featured-collection.liquid`) — P1 (grid needed by P0 home)

**Settings.** Collection, title and heading blocks, limit (2–16, default 8), layout (grid or rail), columns for desktop and phone, image ratio, show "View all", card overrides (inherit, or quick add off).

**Rail (`nk-rail`).** A native horizontal scroll-snap track with prev/next buttons that are disabled at the ends. Keyboard focus moves through card links. Vertical page scrolling is never blocked.

**One product.** Rendered as a grid, with no rail controls.

**Tabs variant.** Uses `nk-tabs`; see [05 T4](05-component-rewrite-matrix.md#3-native-target-specifications).

**Editor.** Selecting a card block scrolls the rail to that card without stealing focus.

### CS-04 Media with text (`sections/media-text.liquid`) — P1

Modes: split, overlay, or compact banner.

**Settings.** Media (image or video), media side on desktop, media position on phones (first or second; the DOM order stays fixed and CSS sets the visual order), text alignment, scheme, spacing, optional index label, entrance (none, cut or fade).

**Content.** Blocks.

**Acceptance.** Reading order equals DOM order in every mode, and long text does not overflow the overlay mode.

### CS-05 Campaign tiles (`sections/campaign-tiles.liquid`) — P1

Two to four `_campaign` blocks, each with image, heading, text and link. Layouts: equal columns, or a 2:1 asymmetric pair. Each tile has one link. A tile without a link renders as non-interactive.

### CS-06 Rich text, FAQ, Custom Liquid — P1

- **Rich text.** Heading, text and button blocks with a max-width setting.
- **FAQ.** Question blocks rendered as `nk-disclosure`, with optional FAQPage JSON-LD when enabled.
- **Custom Liquid.** Section and block versions, as required by the Theme Store and useful in general.

### CS-07 Newsletter (`sections/newsletter.liquid`) — P1

Uses `{% form 'customer' %}` with `contact[tags]=newsletter`, a labelled email field and a submit button.

**States.**
- Pending: button disabled and labelled "Subscribing…".
- Success: `form.posted_successfully?` renders a message, with focus moved to it after a server round trip.
- Error: `form.errors` shown beside the field with `aria-describedby`.

Includes a privacy link (page picker). The form is a normal POST; JS only adds the pending state and prevents double submission. In design mode, submitting is disabled with a note. If the owner chooses a third-party email tool, that tool's app block replaces this form (OD-09).

### CS-08 Footer (`sections/footer.liquid` in the footer group) — P0 basic, P1 full

**Blocks.** Brand (logo, text), menu (`link_list`), newsletter (reuses CS-07), contact (text with `tel:` and `mailto:`), social links (links from settings; each hidden when its URL is empty).

**Bottom row.** Localization forms (country and language, `localization` object), policy links (`shop.policies`), payment icons (`shop.enabled_payment_types`), copyright.

**Layout.** Columns on desktop. On phones, menus collapse into `nk-disclosure` groups and the brand and newsletter stay open.

**Rules.** A launch link check rejects `#` and empty hrefs. An empty column collapses.

### CS-09 Message band (`sections/message-band.liquid`) — P1

`nk-marquee` (T2), placed between sections, with a static fallback.

### CS-10 Supporting templates — P0/P1

| Template | Content | Priority |
|---|---|---|
| `search.json` | `main-search` with predictive search entry, filters and grid | P0 |
| `page.json` | `main-page` | P0 |
| `page.contact.json` | `main-page` and contact form (`{% form 'contact' %}`) | P1 |
| `404.json` | Message, search and collection links | P0 |
| `list-collections.json` | Collection grid | P1 |
| `blog.json`, `article.json` | Only if OD-11 puts them in scope | P1? |
| `password.liquid` | Password page with newsletter | P1 |
| `gift_card.liquid` | Required template | P1 |
| Customer templates | **None.** New customer accounts and `<shopify-account>` only (D-11) | — |

### P2 sections (individual briefs before build)

| Section | Brief | Notes |
|---|---|---|
| Expanding media | [05 T5](05-component-rewrite-matrix.md) | From the `Scroll Expand` example. First candidate after launch |
| Reviews wall | [05 T2](05-component-rewrite-matrix.md) | From the `marquee` example. Vertical columns. **Only with a real review source** (app data or attributed testimonials) |
| Fold / split headline modes | [05 T1](05-component-rewrite-matrix.md) | From the `foldtext`, `Split Text` and `textpercharacter` examples |
| Reels rail | | Poster-first; one active player; captions; offscreen pause |
| Shoppable lookbook | | Product list alternative to hotspots |
| Membership block | | Links only, until a backend exists |
| Content strip | `nk-marquee` items | |

## Content requirements before visual sign-off

| Asset | Spec | Owner |
|---|---|---|
| Logo and alternate logo | SVG or PNG, at least 600px wide, on transparent background | Brand |
| Hero | Desktop 2880×1620 and mobile 1440×1800 (or 9:16), with the text-safe area marked | Brand / photographer |
| Category tiles | 3:4, consistent lighting, one per collection | Brand |
| Product media | 4:5, at least 2000px tall, front, back and detail; packshot and model images if that toggle is used | Catalog |
| Size charts | Structured values per category, basis (garment or body), unit | Owner (OD-04) |
| Copy | Hero, tiles, story, newsletter, policies, delivery/returns line | Owner |

Until these exist, use labelled placeholders. Never use reference-store media.
