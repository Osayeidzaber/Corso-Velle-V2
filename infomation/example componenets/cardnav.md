'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons';
import './CardNav.css';

const THEMES = {
  dark: {
    '--cn-panel': 'rgba(38, 35, 46, 0.72)',
    '--cn-solid': '#26232e',
    '--cn-edge': 'rgba(255, 255, 255, 0.08)',
    '--cn-highlight': 'rgba(255, 255, 255, 0.07)',
    '--cn-shadow': '0 24px 48px -20px rgba(0, 0, 0, 0.8), 0 6px 16px -8px rgba(0, 0, 0, 0.5)',
    '--cn-text': '#f4f4f5',
    '--cn-muted': 'rgba(244, 244, 245, 0.56)',
    '--cn-hover': 'rgba(255, 255, 255, 0.06)',
    '--cn-ring': 'rgba(244, 244, 245, 0.55)',
    '--cn-tile': 'linear-gradient(180deg, #34303d 0%, #27242f 100%)',
    '--cn-tile-rim':
      'inset 0 0 0 1px rgba(255, 255, 255, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 4px 10px -4px rgba(0, 0, 0, 0.6)',
    '--cn-cta': 'linear-gradient(180deg, #ffffff 0%, #ebebf0 100%)',
    '--cn-cta-ink': '#121016',
    '--cn-cta-shadow': 'inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 6px 16px -6px rgba(0, 0, 0, 0.6)',
    '--cn-cta-hover': 'brightness(0.94)'
  },
  light: {
    '--cn-panel': 'rgba(244, 244, 246, 0.84)',
    '--cn-solid': '#f4f4f6',
    '--cn-edge': 'rgba(24, 24, 27, 0.07)',
    '--cn-highlight': 'rgba(255, 255, 255, 0.95)',
    '--cn-shadow': '0 24px 48px -24px rgba(24, 24, 27, 0.3), 0 6px 16px -10px rgba(24, 24, 27, 0.16)',
    '--cn-text': '#18181b',
    '--cn-muted': 'rgba(24, 24, 27, 0.56)',
    '--cn-hover': 'rgba(24, 24, 27, 0.05)',
    '--cn-ring': 'rgba(24, 24, 27, 0.45)',
    '--cn-tile': 'linear-gradient(180deg, #ffffff 0%, #f8f8fa 100%)',
    '--cn-tile-rim':
      'inset 0 0 0 1px rgba(24, 24, 27, 0.07), inset 0 1px 0 rgba(255, 255, 255, 1), 0 4px 10px -5px rgba(24, 24, 27, 0.22)',
    '--cn-cta': 'linear-gradient(180deg, #2c2c31 0%, #18181b 100%)',
    '--cn-cta-ink': '#ffffff',
    '--cn-cta-shadow': 'inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 6px 14px -6px rgba(24, 24, 27, 0.45)',
    '--cn-cta-hover': 'brightness(1.25)'
  }
};

const ROOT = 'card-nav';
const PANEL = 'card-nav__panel';
const RIM = 'card-nav__rim';
const BAR = 'card-nav__bar';
const MENU = 'card-nav__menu';
const BURGER = 'card-nav__burger';
const LINE_TOP = 'card-nav__line card-nav__line--top';
const LINE_BOTTOM = 'card-nav__line card-nav__line--bottom';
const MENU_LABEL = 'card-nav__menu-label';
const WORD_OPEN = 'card-nav__word card-nav__word--open';
const WORD_CLOSE = 'card-nav__word card-nav__word--close';
const LOGO = 'card-nav__logo';
const CTA = 'card-nav__cta';
const CTA_WIDE = 'card-nav__cta card-nav__cta--wide';
const CONTENT = 'card-nav__content';
const CARDS = 'card-nav__cards';
const CARD = 'card-nav__card';
const CARD_HEAD = 'card-nav__card-head';
const LABEL = 'card-nav__label';
const DESCRIPTION = 'card-nav__description';
const LINKS = 'card-nav__links';
const LINK = 'card-nav__link';
const ARROW = 'card-nav__arrow';
const ARROW_OUT = 'card-nav__arrow-icon card-nav__arrow-icon--out';
const ARROW_IN = 'card-nav__arrow-icon card-nav__arrow-icon--in';

const DEFAULT_ITEMS = [
  {
    label: 'About',
    description: 'The people and the story behind the studio.',
    links: [
      { label: 'Company', href: '#' },
      { label: 'Careers', href: '#' }
    ]
  },
  {
    label: 'Projects',
    description: 'Selected work from the last few years.',
    links: [
      { label: 'Featured', href: '#' },
      { label: 'Case studies', href: '#' }
    ]
  },
  {
    label: 'Contact',
    description: 'Say hello, we read everything.',
    links: [
      { label: 'Email', href: '#' },
      { label: 'X', href: '#' },
      { label: 'LinkedIn', href: '#' }
    ]
  }
];

const NARROW = 560;
const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const easeOut = t => 1 - (1 - t) ** 3;

const contrastInk = color => {
  const hex = String(color || '')
    .trim()
    .replace('#', '');
  if (!/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return null;
  const full =
    hex.length === 3
      ? hex
          .split('')
          .map(c => c + c)
          .join('')
      : hex;
  const channel = index => {
    const value = parseInt(full.slice(index, index + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
  return luminance > 0.36 ? '#121016' : '#ffffff';
};

const CardNav = ({
  logo,
  logoAlt = 'Logo',
  logoHref = '#',
  items = DEFAULT_ITEMS,
  cta,
  theme = 'dark',
  surface = 'glass',
  openOn = 'click',
  cardEffect = 'rise',
  stagger = 0.12,
  bounce = 0.2,
  speed = 1,
  cardHeight = 176,
  maxWidth = 800,
  accentColor,
  menuLabel = true,
  intro = true,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  linkComponent: LinkComponent = 'a',
  onLinkClick,
  ariaLabel = 'Main',
  className = '',
  style
}) => {
  const contentId = useId();
  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const contentRef = useRef(null);
  const menuRef = useRef(null);
  const cardRefs = useRef([]);
  const engineRef = useRef(null);
  const leaveRef = useRef(0);
  const barRef = useRef(null);
  const introRef = useRef(intro);
  const [openState, setOpenState] = useState(defaultOpen);
  const [narrow, setNarrow] = useState(false);
  const [shown, setShown] = useState(defaultOpen);

  const controlled = openProp !== undefined;
  const hasCta = Boolean(cta);
  const open = controlled ? openProp : openState;

  const settings = {
    open,
    cardEffect,
    stagger: clamp(stagger, 0, 0.3),
    bounce: clamp(bounce, 0, 1),
    speed: clamp(speed, 0.2, 3)
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const palette = THEMES[theme] ?? THEMES.dark;
  const vars = {
    ...palette,
    '--cn-max': `${maxWidth}px`,
    '--cn-bar': '60px',
    '--cn-inset': '8px',
    '--cn-gap': '8px',
    '--cn-radius': '18px',
    '--cn-logo': '24px',
    '--cn-card': `${cardHeight}px`
  };
  if (surface === 'glass') vars['--cn-blur'] = 'blur(20px) saturate(1.6)';
  if (surface === 'solid') {
    vars['--cn-panel'] = palette['--cn-solid'];
    vars['--cn-blur'] = 'none';
  }
  if (accentColor) {
    vars['--cn-cta'] = accentColor;
    vars['--cn-cta-ink'] = contrastInk(accentColor) || '#ffffff';
    vars['--cn-cta-shadow'] = 'inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 6px 16px -6px rgba(0, 0, 0, 0.45)';
    vars['--cn-cta-hover'] = 'brightness(1.08)';
  }

  const setOpen = next => {
    if (next === open) return;
    if (!controlled) setOpenState(next);
    onOpenChange?.(next);
  };
  const setOpenRef = useRef(setOpen);
  setOpenRef.current = setOpen;

  useEffect(() => {
    const panel = panelRef.current;
    const content = contentRef.current;
    if (!panel || !content) return undefined;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const state = { p: settingsRef.current.open ? 1 : 0, v: 0, height: content.offsetHeight, bar: 60 };
    let raf = 0;
    let last = 0;

    const render = () => {
      const s = settingsRef.current;
      state.bar = parseFloat(getComputedStyle(panel).getPropertyValue('--cn-bar')) || 60;
      panel.style.height = `${state.bar + Math.max(0, state.p) * state.height}px`;
      const cards = cardRefs.current.filter(Boolean);
      const count = cards.length;
      const lag = count > 1 ? Math.min(s.stagger, 0.7 / (count - 1)) : 0;
      const span = 1 - lag * (count - 1);
      cards.forEach((card, index) => {
        const local = clamp((state.p - index * lag) / Math.max(span, 0.05), 0, 1);
        const e = easeOut(local);
        if (s.cardEffect === 'unfold') {
          card.style.transform = `translateY(${(1 - e) * -10}px) rotateX(${(1 - e) * -72}deg)`;
          card.style.opacity = `${clamp(local * 1.8, 0, 1)}`;
          card.style.filter = '';
        } else if (s.cardEffect === 'fade') {
          card.style.transform = `translateY(${(1 - e) * 6}px)`;
          card.style.opacity = `${e}`;
          card.style.filter = e < 0.999 ? `blur(${(1 - e) * 6}px)` : '';
        } else {
          card.style.transform = `translateY(${(1 - e) * 26}px) scale(${0.97 + 0.03 * e})`;
          card.style.opacity = `${e}`;
          card.style.filter = '';
        }
      });
    };

    const tick = now => {
      raf = 0;
      const s = settingsRef.current;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const target = s.open ? 1 : 0;
      if (reduce) {
        state.p = target;
        state.v = 0;
      } else {
        const k = 160 * s.speed * s.speed;
        const zeta = s.open ? 1 - 0.68 * s.bounce : 1;
        const steps = Math.ceil(dt / (1 / 240));
        const h = dt / steps;
        for (let i = 0; i < steps; i++) {
          state.v += (-k * (state.p - target) - 2 * zeta * Math.sqrt(k) * state.v) * h;
          state.p += state.v * h;
        }
      }
      const done = Math.abs(state.p - target) < 0.0005 && Math.abs(state.v) < 0.002;
      if (done) {
        state.p = target;
        state.v = 0;
      }
      render();
      if (done && target === 0) setShown(false);
      if (!done) raf = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(tick);
      }
    };

    engineRef.current = {
      wake,
      refresh: () => {
        state.height = content.offsetHeight;
        render();
      }
    };

    render();
    const observer = new ResizeObserver(() => {
      state.height = content.offsetHeight;
      render();
    });
    observer.observe(content);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      engineRef.current = null;
    };
  }, [items.length, hasCta, narrow]);

  useLayoutEffect(() => {
    if (open) setShown(true);
    engineRef.current?.refresh();
    engineRef.current?.wake();
  }, [open]);

  useEffect(() => {
    engineRef.current?.refresh();
  });

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const measure = () => setNarrow(root.offsetWidth < NARROW);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = event => {
      const target = event.target;
      if (target instanceof Node && rootRef.current?.contains(target)) return;
      setOpenRef.current(false);
    };
    const onKeyDown = event => {
      if (event.key !== 'Escape') return;
      setOpenRef.current(false);
      menuRef.current?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => () => window.clearTimeout(leaveRef.current), []);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const bar = barRef.current;
    if (!panel || !bar || !introRef.current) return;
    introRef.current = false;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const width = panel.offsetWidth;
    const height = panel.offsetHeight;
    const radius = parseFloat(getComputedStyle(panel).borderTopLeftRadius) || 18;
    panel.animate(
      [
        { clipPath: `inset(0px ${Math.max(0, (width - height) / 2)}px round ${height / 2}px)`, opacity: 0 },
        { clipPath: `inset(0px 0px round ${radius}px)`, opacity: 1 }
      ],
      { duration: 820, easing: EASE_OUT, fill: 'backwards' }
    );
    Array.from(bar.children).forEach((child, index) => {
      child.animate(
        [
          { opacity: 0, transform: 'translateY(8px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ],
        { duration: 560, delay: 220 + index * 70, easing: EASE_OUT, fill: 'backwards' }
      );
    });
  }, []);

  const hover = openOn === 'hover';

  const onPointerEnter = event => {
    if (!hover || event.pointerType === 'touch') return;
    window.clearTimeout(leaveRef.current);
    setOpen(true);
  };

  const onPointerLeave = event => {
    if (!hover || event.pointerType === 'touch') return;
    window.clearTimeout(leaveRef.current);
    leaveRef.current = window.setTimeout(() => setOpenRef.current(false), 160);
  };

  const anchor = (target, props, children) => {
    if (!target.href) {
      return (
        <button type="button" {...props}>
          {children}
        </button>
      );
    }
    return (
      <LinkComponent href={target.href} {...props}>
        {children}
      </LinkComponent>
    );
  };

  const ctaButton = (target, wide) =>
    anchor(
      target,
      {
        className: wide ? CTA_WIDE : CTA,
        tabIndex: wide && !open ? -1 : undefined,
        onClick: event => {
          target.onClick?.(event);
          if (wide) setOpen(false);
        }
      },
      target.label
    );

  return (
    <div
      ref={rootRef}
      className={[ROOT, className].filter(Boolean).join(' ')}
      data-open={open ? '' : undefined}
      data-shown={shown || open ? '' : undefined}
      data-narrow={narrow ? '' : undefined}
      style={{ ...vars, ...style }}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <nav ref={panelRef} className={PANEL} aria-label={ariaLabel}>
        <div ref={barRef} className={BAR}>
          <button
            ref={menuRef}
            type="button"
            className={MENU}
            data-icon-only={menuLabel ? undefined : ''}
            aria-expanded={open}
            aria-controls={contentId}
            aria-label={menuLabel ? undefined : open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen(!open)}
          >
            <span className={BURGER} aria-hidden="true">
              <span className={LINE_TOP} />
              <span className={LINE_BOTTOM} />
            </span>
            {menuLabel && (
              <span className={MENU_LABEL}>
                <span className={WORD_OPEN} aria-hidden={open}>
                  Menu
                </span>
                <span className={WORD_CLOSE} aria-hidden={!open}>
                  Close
                </span>
              </span>
            )}
          </button>

          {logo && (
            <LinkComponent href={logoHref} className={LOGO} aria-label={logoAlt}>
              {typeof logo === 'string' ? <img src={logo} alt="" draggable={false} /> : logo}
            </LinkComponent>
          )}

          {cta && !narrow && ctaButton(cta, false)}
        </div>

        <div ref={contentRef} id={contentId} className={CONTENT} aria-hidden={!open}>
          <div className={CARDS}>
            {items.map((item, index) => (
              <div
                key={`${item.label}-${index}`}
                ref={element => {
                  cardRefs.current[index] = element;
                }}
                className={CARD}
                data-tinted={item.bgColor ? '' : undefined}
                style={item.bgColor ? { background: item.bgColor, color: item.textColor } : undefined}
              >
                <div className={CARD_HEAD}>
                  <span className={LABEL}>{item.label}</span>
                  {item.description && <p className={DESCRIPTION}>{item.description}</p>}
                </div>
                <ul className={LINKS}>
                  {(item.links ?? []).map((link, linkIndex) => (
                    <li key={`${link.label}-${linkIndex}`}>
                      {anchor(
                        link,
                        {
                          className: LINK,
                          'aria-label': link.ariaLabel,
                          tabIndex: open ? undefined : -1,
                          onClick: event => {
                            onLinkClick?.(link, item, event);
                            setOpen(false);
                          }
                        },
                        <>
                          <span className={ARROW} aria-hidden="true">
                            <HugeiconsIcon className={ARROW_OUT} icon={ArrowUpRight01Icon} size={14} strokeWidth={2} />
                            <HugeiconsIcon className={ARROW_IN} icon={ArrowUpRight01Icon} size={14} strokeWidth={2} />
                          </span>
                          {link.label}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {cta && narrow && (
            <div
              ref={element => {
                cardRefs.current[items.length] = element;
              }}
            >
              {ctaButton(cta, true)}
            </div>
          )}
        </div>
        <span className={RIM} />
      </nav>
    </div>
  );
};

export default CardNav;


/* ---- CardNav.css ---- */
.card-nav {
  position: relative;
  width: 100%;
  max-width: var(--cn-max);
  height: var(--cn-bar);
  margin: 0 auto;
  font-size: 14px;
  line-height: 1.4;
  -webkit-tap-highlight-color: transparent;
}

.card-nav__panel {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  z-index: 10;
  height: var(--cn-bar);
  border-radius: var(--cn-radius);
  overflow: hidden;
  background: var(--cn-panel);
  box-shadow: var(--cn-shadow);
  -webkit-backdrop-filter: var(--cn-blur);
  backdrop-filter: var(--cn-blur);
}

.card-nav__rim {
  position: absolute;
  inset: 0;
  z-index: 3;
  border-radius: inherit;
  box-shadow:
    inset 0 0 0 1px var(--cn-edge),
    inset 0 1px 0 var(--cn-highlight);
  pointer-events: none;
}

.card-nav__bar {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  height: var(--cn-bar);
  padding: 0 var(--cn-inset);
  box-sizing: border-box;
}

.card-nav__menu {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  justify-self: start;
  height: calc(var(--cn-bar) - var(--cn-inset) * 2);
  padding: 0 14px 0 16px;
  border: 0;
  border-radius: calc(var(--cn-radius) - var(--cn-inset));
  background: none;
  color: var(--cn-text);
  font-family: inherit;
  font-size: inherit;
  font-weight: 500;
  cursor: pointer;
  outline: none;
  transition: background-color 0.2s ease;
}

.card-nav__menu[data-icon-only] {
  justify-content: center;
  width: calc(var(--cn-bar) - var(--cn-inset) * 2);
  padding: 0;
}

.card-nav__menu:hover {
  background: var(--cn-hover);
}

.card-nav__menu:focus-visible,
.card-nav__logo:focus-visible,
.card-nav__cta:focus-visible,
.card-nav__link:focus-visible {
  outline: 2px solid var(--cn-ring);
  outline-offset: 2px;
}

.card-nav__burger {
  position: relative;
  width: 18px;
  height: 12px;
}

.card-nav__line {
  position: absolute;
  left: 0;
  width: 100%;
  height: 1.5px;
  border-radius: 2px;
  background: currentColor;
  transition:
    transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),
    top 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

.card-nav__line--top {
  top: 2.25px;
}

.card-nav__line--bottom {
  top: 8.25px;
}

.card-nav[data-open] .card-nav__line--top {
  top: 5.25px;
  transform: rotate(45deg);
}

.card-nav[data-open] .card-nav__line--bottom {
  top: 5.25px;
  transform: rotate(-45deg);
}

.card-nav__menu-label {
  position: relative;
  display: inline-grid;
  overflow: hidden;
}

.card-nav__word {
  grid-area: 1 / 1;
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

.card-nav__word--close {
  transform: translateY(110%);
}

.card-nav[data-open] .card-nav__word--open {
  transform: translateY(-110%);
}

.card-nav[data-open] .card-nav__word--close {
  transform: translateY(0);
}

.card-nav__logo {
  display: inline-flex;
  align-items: center;
  justify-self: center;
  height: var(--cn-logo);
  color: var(--cn-text);
  text-decoration: none;
  outline: none;
}

.card-nav__logo img,
.card-nav__logo svg {
  display: block;
  height: 100%;
  width: auto;
}

.card-nav__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  justify-self: end;
  height: calc(var(--cn-bar) - var(--cn-inset) * 2);
  padding: 0 16px;
  border: 0;
  border-radius: calc(var(--cn-radius) - var(--cn-inset));
  background: var(--cn-cta);
  box-shadow: var(--cn-cta-shadow);
  color: var(--cn-cta-ink);
  font-family: inherit;
  font-size: inherit;
  font-weight: 600;
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  outline: none;
  transition: filter 0.2s ease;
}

.card-nav__cta:hover {
  filter: var(--cn-cta-hover);
}

.card-nav[data-narrow] .card-nav__bar {
  grid-template-columns: auto 1fr auto;
}

.card-nav[data-narrow] .card-nav__logo {
  grid-column: 1;
  grid-row: 1;
  justify-self: start;
  padding-left: 14px;
}

.card-nav[data-narrow] .card-nav__menu {
  grid-column: 3;
  grid-row: 1;
  justify-self: end;
}

.card-nav__content {
  position: absolute;
  top: var(--cn-bar);
  right: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  gap: var(--cn-gap);
  padding: 0 var(--cn-inset) var(--cn-inset);
  box-sizing: border-box;
  perspective: 900px;
}

.card-nav__content {
  visibility: hidden;
}

.card-nav[data-shown] .card-nav__content {
  visibility: visible;
}

.card-nav__cards {
  display: flex;
  gap: var(--cn-gap);
}

.card-nav[data-narrow] .card-nav__cards {
  flex-direction: column;
}

.card-nav__card {
  position: relative;
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
  min-height: var(--cn-card);
  padding: 16px 16px 14px;
  border-radius: calc(var(--cn-radius) - var(--cn-inset));
  box-sizing: border-box;
  background: var(--cn-tile);
  box-shadow: var(--cn-tile-rim);
  color: var(--cn-text);
  transform-origin: 50% 0;
  will-change: transform, opacity;
}

.card-nav[data-narrow] .card-nav__card {
  flex: none;
  min-height: 0;
  gap: 10px;
  padding: 14px 14px 12px;
}

.card-nav[data-narrow] .card-nav__links {
  flex-direction: row;
  flex-wrap: wrap;
  gap: 2px 16px;
}

.card-nav__card[data-tinted] {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    0 4px 10px -4px rgba(0, 0, 0, 0.45);
}

.card-nav__card-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-nav__label {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.015em;
}

.card-nav__description {
  margin: 0;
  color: var(--cn-muted);
  font-size: 13px;
  line-height: 1.45;
}

.card-nav__card[data-tinted] .card-nav__description {
  color: inherit;
  opacity: 0.7;
}

.card-nav__links {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: auto 0 0;
  padding: 0;
  list-style: none;
}

.card-nav__link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 3px 0;
  border: 0;
  border-radius: 6px;
  background: none;
  color: inherit;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  outline: none;
  opacity: 0.82;
  transition: opacity 0.2s ease;
}

.card-nav__link:hover {
  opacity: 1;
}

.card-nav__arrow {
  position: relative;
  display: inline-block;
  flex: none;
  width: 14px;
  height: 14px;
  overflow: hidden;
}

.card-nav__arrow-icon {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}

.card-nav__arrow-icon--in {
  transform: translate(-110%, 110%);
}

.card-nav__link:hover .card-nav__arrow-icon--out,
.card-nav__link:focus-visible .card-nav__arrow-icon--out {
  transform: translate(110%, -110%);
}

.card-nav__link:hover .card-nav__arrow-icon--in,
.card-nav__link:focus-visible .card-nav__arrow-icon--in {
  transform: translate(0, 0);
}

.card-nav__cta--wide {
  display: flex;
  width: 100%;
  height: 44px;
}

@media (prefers-reduced-motion: reduce) {
  .card-nav__line,
  .card-nav__word,
  .card-nav__arrow-icon {
    transition: none;
  }
}
