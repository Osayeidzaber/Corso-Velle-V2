// Mobile QA harness (MOBILE_TESTING_REPORT.md). Needs Playwright and Chrome:
//   PLAYWRIGHT_MODULE=<path or URL of playwright/index.mjs>  CHROME_PATH=<chrome.exe>  BASE=http://127.0.0.1:9292
// Runs against a Shopify CLI development preview (shopify theme dev), never a production store.
// Touch journey on an emulated phone: real touch taps/swipes (CDP synthesized gestures), CPU
// throttling, frame timing, overlays/scroll lock, gallery gestures, cart. Results to journey.json.
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const base = process.env.BASE ?? 'http://127.0.0.1:9292';
const out = process.argv[2];
const width = Number(process.argv[3] ?? 390), height = Number(process.argv[4] ?? 844);
const cpu = Number(process.argv[5] ?? 4);
await mkdir(out, { recursive: true });
const UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36';
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: UA });
await context.addInitScript(() => {
  const m = window.__m = { lcp: 0, lcpEl: '', cls: 0, long: [], events: [] };
  const po = (type, fn, extra = {}) => { try { new PerformanceObserver((l) => l.getEntries().forEach(fn)).observe({ type, buffered: true, ...extra }); } catch {} };
  po('largest-contentful-paint', (e) => { m.lcp = e.startTime; m.lcpEl = e.element ? e.element.tagName + '.' + String(e.element.className).slice(0, 30) : ''; });
  po('layout-shift', (e) => { if (!e.hadRecentInput) { m.cls += e.value; (m.shifts ||= []).push({ t: Math.round(e.startTime), v: +e.value.toFixed(4), src: (e.sources || []).map((s) => s.node ? s.node.nodeName + '.' + String(s.node.className || '').slice(0, 30) : '').join('|') }); } });
  po('longtask', (e) => m.long.push([Math.round(e.startTime), Math.round(e.duration)]));
  po('event', (e) => { if (e.interactionId) m.events.push([e.name, Math.round(e.duration), Math.round(e.processingStart - e.startTime), String(e.target?.className || e.target?.tagName || '').slice(0, 40)]); }, { durationThreshold: 16 });
});
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
const results = { viewport: `${width}x${height}`, cpuThrottle: cpu, steps: [] };
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/shop\.app|Content Security Policy|Failed to load resource/.test(m.text())) errors.push(m.text().slice(0, 200)); });
const log = (step, data) => { results.steps.push({ step, ...data }); console.log(step, JSON.stringify(data).slice(0, 400)); };
const wait = (ms) => page.waitForTimeout(ms);
async function go(path) {
  for (let i = 0; i < 3; i++) { const r = await page.goto(base + path, { waitUntil: 'load', timeout: 90000 }); if (r.status() === 200) return; await wait(1500); }
}
/** A finger swipe: raw touch events at ~60Hz (synthesizeScrollGesture doesn't scroll in headless). */
async function swipe(x, y, dx, dy, speed = 1400) {
  const distance = Math.hypot(dx, dy);
  const steps = Math.max(4, Math.round((distance / speed) * 60));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let i = 1; i <= steps; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + (dx * i) / steps, y: y + (dy * i) / steps }] });
    await new Promise((r) => setTimeout(r, 16));
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
/** Frame pacing during an async action: rAF gaps in ms. */
async function frames(action) {
  await page.evaluate(() => { const f = window.__f = []; let last = performance.now(); const tick = (t) => { f.push(t - last); last = t; window.__fr = requestAnimationFrame(tick); }; window.__fr = requestAnimationFrame(tick); });
  const longBefore = await page.evaluate(() => window.__m.long.length);
  await action();
  return page.evaluate((lb) => { cancelAnimationFrame(window.__fr); const f = window.__f.slice(1); const s = [...f].sort((a, b) => a - b);
    return { frames: f.length, p50: +s[Math.floor(s.length * 0.5)]?.toFixed(1), p95: +s[Math.floor(s.length * 0.95)]?.toFixed(1), max: +Math.max(...f).toFixed(1), over50ms: f.filter((x) => x > 50).length, over34ms: f.filter((x) => x > 34).length, longTasksDuring: window.__m.long.slice(lb) }; }, longBefore);
}
const lockState = () => page.evaluate(() => ({ locked: document.documentElement.classList.contains('nk-locked'), overlay: document.documentElement.hasAttribute('data-overlay-open'), openDialogs: [...document.querySelectorAll('dialog[open]')].map((d) => d.className.split(' ').slice(0, 2).join('.')), scrollY: Math.round(scrollY), bodyOverflow: getComputedStyle(document.documentElement).overflow }));
const fits = (sel) => page.evaluate((sel) => { const d = document.querySelector(sel); if (!d) return null; const r = d.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), vw: innerWidth, vh: innerHeight, fits: r.left >= -1 && r.right <= innerWidth + 1 && r.top >= -1 && r.bottom <= innerHeight + 1, scrollable: d.scrollHeight > d.clientHeight || [...d.querySelectorAll('*')].some((c) => c.scrollHeight > c.clientHeight + 2 && /(auto|scroll)/.test(getComputedStyle(c).overflowY)) }; }, sel);
async function step(name, fn) { try { await fn(); } catch (e) { log(name, { error: e.message.split('\n')[0].slice(0, 300) }); } }

if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });

// 1. Homepage load + metrics
await step('home-load', async () => {
  await go('/');
  await wait(4000);
  const m = await page.evaluate(() => ({ ...window.__m, lenis: document.documentElement.classList.contains('lenis'), nkAnim: document.documentElement.classList.contains('nk-anim'), cursorOn: document.documentElement.classList.contains('nk-cursor-on'), tbt: window.__m.long.reduce((a, [, d]) => a + Math.max(0, d - 50), 0), heroSrc: document.querySelector('.hero__video')?.currentSrc.split('/').pop(), jsHeapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null }));
  log('home-load', { lcp: Math.round(m.lcp), lcpEl: m.lcpEl, cls: +m.cls.toFixed(4), shifts: m.shifts, longTasks: m.long, tbt: m.tbt, lenisOnTouch: m.lenis, nkAnim: m.nkAnim, cursorOnTouch: m.cursorOn, heroSrc: m.heroSrc, jsHeapMB: m.jsHeapMB });
  await page.screenshot({ path: `${out}/home-top.png` });
});

// 2. Touch scroll through the homepage, frame pacing; watch for snapping/locking.
await step('home-scroll', async () => {
  const startY = await page.evaluate(() => scrollY);
  const f = await frames(async () => { for (let i = 0; i < 10; i++) await swipe(width / 2, height * 0.75, 0, -height * 0.6, 1600); await wait(600); });
  const after = await page.evaluate(() => ({ y: Math.round(scrollY), max: document.documentElement.scrollHeight - innerHeight, pinSpacers: document.querySelectorAll('.pin-spacer').length, stuckHidden: [...document.querySelectorAll('main h2, main p, main [data-product-card]')].filter((e) => { const r = e.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight * 3 || !r.width) return false; let o = 1; for (let p = e; p && p !== document.body; p = p.parentElement) o *= +getComputedStyle(p).opacity; return o < 0.05 && r.bottom < innerHeight; }).length }));
  log('home-scroll', { startY, ...after, ...f });
  // Back to top with swipes in the opposite direction.
  const f2 = await frames(async () => { for (let i = 0; i < 4; i++) await swipe(width / 2, height * 0.25, 0, height * 0.7, 2400); await wait(500); });
  log('home-scroll-up', { y: await page.evaluate(() => Math.round(scrollY)), ...f2 });
});

// 3. Orientation change mid-page: overflow, ScrollTrigger refresh, pins.
await step('rotate', async () => {
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight * 0.4));
  await wait(600);
  await page.setViewportSize({ width: height, height: width });
  await wait(1500);
  const land = await page.evaluate(() => ({ overflowX: document.documentElement.scrollWidth - innerWidth, y: Math.round(scrollY), docH: document.documentElement.scrollHeight }));
  await page.setViewportSize({ width, height });
  await wait(1500);
  const port = await page.evaluate(() => ({ overflowX: document.documentElement.scrollWidth - innerWidth, y: Math.round(scrollY), docH: document.documentElement.scrollHeight }));
  const f = await frames(async () => { await swipe(width / 2, height * 0.7, 0, -height * 0.5); await wait(500); });
  log('rotate', { landscape: land, portraitAgain: port, scrollAfterRotate: f });
  await page.screenshot({ path: `${out}/after-rotate.png` });
});

// 4. Mobile navigation drawer.
await step('nav-drawer', async () => {
  await go('/');
  await wait(2500);
  await page.evaluate(() => scrollTo(0, 600)); await wait(400);
  const t0 = Date.now();
  await page.tap('[data-nk-open="MenuDrawer"]');
  await page.waitForSelector('#MenuDrawer dialog[open], dialog.menu-drawer--cards[open], dialog[open][aria-labelledby="MenuDrawerTitle"]', { timeout: 5000 });
  const openMs = Date.now() - t0;
  await wait(700);
  const box = await fits('dialog[open]');
  const lock = await lockState();
  await page.screenshot({ path: `${out}/nav-open.png` });
  // try to scroll the page behind
  await swipe(width / 2, height * 0.8, 0, -300); await wait(400);
  const behind = await lockState();
  let nested = null;
  const lvl = await page.$('dialog[open] [data-level-open]');
  if (lvl) { await lvl.tap(); await wait(700); nested = await page.evaluate(() => [...document.querySelectorAll('dialog[open] [data-level], dialog[open] [data-panel]')].filter((p) => p.getBoundingClientRect().left >= 0 && p.getBoundingClientRect().left < innerWidth && getComputedStyle(p).visibility !== 'hidden').length); await page.screenshot({ path: `${out}/nav-nested.png` }); }
  const close = await page.$('dialog[open] [data-nk-close], dialog[open] button[aria-label*="Close" i]');
  if (close) await close.tap(); else await page.keyboard.press('Escape');
  await wait(800);
  log('nav-drawer', { openMs, box, lockOpen: lock, afterSwipeBehind: behind, nestedPanelsVisible: nested, afterClose: await lockState() });
});

// 5. Search overlay.
await step('search', async () => {
  const trigger = await page.$('[data-nk-open="SearchModal"]:visible, [aria-controls="HeaderSearchPill"]:visible');
  await trigger.tap(); await wait(900);
  const input = await page.$('dialog[open] input[type=search], input[type=search]:visible');
  const fs = await input?.evaluate((i) => parseFloat(getComputedStyle(i).fontSize));
  await input?.type('shirt', { delay: 60 }); await wait(2500);
  const res = await page.evaluate(() => ({ results: document.querySelectorAll('dialog[open] a[href*="/products/"], [id*=predictive] a[href*="/products/"]').length, focused: document.activeElement?.tagName + '.' + document.activeElement?.className }));
  await page.screenshot({ path: `${out}/search.png` });
  const box = await fits('dialog[open]');
  await page.keyboard.press('Escape'); await wait(700);
  log('search', { inputFontPx: fs, ...res, box, afterClose: await lockState() });
});

// 6. Collection, filters.
await step('collection-filters', async () => {
  await go('/collections/all'); await wait(2500);
  const grid = await page.evaluate(() => { const cards = [...document.querySelectorAll('[data-product-card]')]; const xs = new Set(cards.slice(0, 6).map((c) => Math.round(c.getBoundingClientRect().left))); const c = cards[0]?.getBoundingClientRect(); return { cards: cards.length, columns: xs.size, cardW: Math.round(c?.width), titleFont: parseFloat(getComputedStyle(cards[0].querySelector('h3, .card__title') || cards[0]).fontSize), priceFont: parseFloat(getComputedStyle(cards[0].querySelector('.price, .price__current') || cards[0]).fontSize), trayVisible: !!cards[0].querySelector('.card__tray') && getComputedStyle(cards[0].querySelector('.card__tray')).display !== 'none', trayOpacity: cards[0].querySelector('.card__tray') ? getComputedStyle(cards[0].querySelector('.card__tray')).opacity : null }; });
  await page.screenshot({ path: `${out}/collection.png` });
  const filterBtn = await page.$('[data-nk-open^="Facets"]:visible, .facets [data-nk-open]:visible');
  let filt = null;
  if (filterBtn) {
    await filterBtn.tap(); await wait(900);
    const box = await fits('dialog[open]');
    await page.screenshot({ path: `${out}/filters.png` });
    const lock = await lockState();
    await page.keyboard.press('Escape'); await wait(700);
    filt = { box, lock, afterClose: await lockState() };
  }
  log('collection-filters', { grid, filters: filt });
});

// 7. Product page: gallery gestures, size selection, size guide, add, cart drawer.
await step('product', async () => {
  await go('/products/amaya-embroidered-shacket'); await wait(3000);
  const layout = await page.evaluate(() => { const b = document.querySelector('[data-region="buy"] button[type=submit]'); const r = b.getBoundingClientRect(); const pills = [...document.querySelectorAll('fieldset[data-size-fieldset] label')].map((l) => { const x = l.getBoundingClientRect(); return [Math.round(x.width), Math.round(x.height)]; }); return { buyTop: Math.round(r.top + scrollY), buyH: Math.round(r.height), viewportH: innerHeight, buyAboveFold: r.bottom < innerHeight, pills, sticky: !!document.querySelector('nk-sticky-buy') }; });
  await page.screenshot({ path: `${out}/product-top.png` });
  const track = await page.$('[data-ref="track"]');
  const tb = await track.boundingBox();
  const idx = () => page.evaluate(() => ({ y: Math.round(scrollY), sl: Math.round(document.querySelector('[data-ref="track"]').scrollLeft), current: document.querySelector('[data-gallery-thumb][aria-current="true"], [data-gallery-thumb][data-active]')?.dataset.galleryThumb ?? null }));
  const g0 = await idx();
  const fh = await frames(async () => { await swipe(tb.x + tb.width * 0.8, tb.y + tb.height / 2, -tb.width * 0.6, 0, 1600); await wait(700); });
  const g1 = await idx();
  await swipe(tb.x + tb.width / 2, tb.y + tb.height * 0.7, 0, -250, 1200); await wait(600);
  const g2 = await idx();
  log('gallery', { start: g0, afterHorizontalSwipe: g1, afterVerticalSwipeOnGallery: g2, horizontalFrames: fh });
  // Size selection by tap
  await page.evaluate(() => scrollTo(0, 0)); await wait(300);
  const M = await page.$('fieldset[data-size-fieldset] input[value="M"]');
  const label = await page.$('fieldset[data-size-fieldset] label[for="' + await M.evaluate((i) => i.id) + '"]');
  await label.scrollIntoViewIfNeeded(); await wait(300);
  const t0 = Date.now();
  await label.tap();
  await page.waitForFunction(() => document.querySelector('[data-product-section]').dataset.pickerState !== 'resolving', null, { timeout: 15000 });
  const resolveMs = Date.now() - t0;
  const sel = await page.evaluate(() => ({ state: document.querySelector('[data-product-section]').dataset.pickerState, selectedText: document.querySelector('fieldset[data-size-fieldset] [data-selected-value]')?.textContent.trim(), buyLabel: document.querySelector('[data-region="buy"] button[type=submit]').textContent.replace(/\s+/g, ' ').trim(), panelOpen: document.querySelector('[data-measurement-panel]')?.getAttribute('data-open') ?? document.querySelector('[data-measurement-panel]')?.hidden }));
  await page.screenshot({ path: `${out}/product-size-selected.png` });
  log('size-select', { resolveMs, ...sel });
  // Size guide
  const guide = await page.$('[data-nk-open^="SizeGuide"]:visible, [data-nk-open*="size" i]:visible');
  if (guide) {
    await guide.tap(); await wait(900);
    const box = await fits('dialog[open]');
    await page.screenshot({ path: `${out}/size-guide.png` });
    const tableOverflow = await page.evaluate(() => { const t = document.querySelector('dialog[open] table'); if (!t) return null; const p = t.parentElement; return { tableW: t.scrollWidth, wrapW: p.clientWidth, wrapScrolls: /(auto|scroll)/.test(getComputedStyle(p).overflowX) }; });
    const close = await page.$('dialog[open] [data-nk-close], dialog[open] button[aria-label*="Close" i]');
    if (close) await close.tap(); else await page.keyboard.press('Escape');
    await wait(700);
    log('size-guide', { box, tableOverflow, afterClose: await lockState(), selectionKept: await page.evaluate(() => document.querySelector('fieldset[data-size-fieldset] input:checked')?.value) });
  } else log('size-guide', { trigger: 'none visible' });
  // Add to cart
  const buy = await page.$('[data-region="buy"] button[type=submit]');
  await buy.scrollIntoViewIfNeeded();
  const ta = Date.now();
  await buy.tap();
  await page.waitForSelector('dialog.cart-drawer[open]', { timeout: 15000 });
  const addMs = Date.now() - ta;
  await wait(900);
  const drawer = await fits('dialog.cart-drawer[open]');
  await page.screenshot({ path: `${out}/cart-drawer.png` });
  const footer = await page.evaluate(() => { const d = document.querySelector('dialog.cart-drawer[open]'); const btn = d.querySelector('[name=checkout]'); const r = btn?.getBoundingClientRect(); const qty = [...d.querySelectorAll('button')].filter((b) => /increase|decrease|remove/i.test(b.getAttribute('aria-label') || '')).map((b) => { const x = b.getBoundingClientRect(); return `${b.getAttribute('aria-label').slice(0, 18)} ${Math.round(x.width)}x${Math.round(x.height)}`; }); const inp = d.querySelector('[data-discount-input]'); return { checkoutVisible: r ? r.bottom <= innerHeight && r.top >= 0 : null, checkoutH: r && Math.round(r.height), qty, discountInputFont: inp ? parseFloat(getComputedStyle(inp).fontSize) : null }; });
  const plus = await page.$('dialog.cart-drawer[open] button[aria-label*="Increase" i]');
  let qtyMs = null;
  if (plus) { const tq = Date.now(); await plus.tap(); await page.waitForFunction(async () => (await (await fetch('/cart.js')).json()).item_count === 2, null, { timeout: 15000, polling: 500 }); qtyMs = Date.now() - tq; }
  log('cart-drawer', { addMs, drawer, ...footer, qtyMs, lock: await lockState() });
  const close = await page.$('dialog.cart-drawer[open] [data-nk-close], dialog.cart-drawer[open] button[aria-label*="Close" i]');
  if (close) await close.tap(); else await page.keyboard.press('Escape');
  await wait(800);
  log('cart-close', await lockState());
  const ev = await page.evaluate(() => window.__m.events);
  log('interactions', { slowest: ev.sort((a, b) => b[1] - a[1]).slice(0, 8) });
  // Cleanup cart
  await page.evaluate(async () => { const c = await (await fetch('/cart.js')).json(); for (const i of c.items) await fetch('/cart/change.js', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: i.key, quantity: 0 }) }); });
  log('cleanup', { items: await page.evaluate(async () => (await (await fetch('/cart.js')).json()).item_count) });
});

results.errors = errors;
await writeFile(`${out}/journey-${width}x${height}-cpu${cpu}.json`, JSON.stringify(results, null, 2));
await browser.close();
