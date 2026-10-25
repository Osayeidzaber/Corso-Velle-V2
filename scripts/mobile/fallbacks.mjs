// Mobile QA harness (MOBILE_TESTING_REPORT.md). Needs Playwright and Chrome:
//   PLAYWRIGHT_MODULE=<path or URL of playwright/index.mjs>  CHROME_PATH=<chrome.exe>  BASE=http://127.0.0.1:9292
// Runs against a Shopify CLI development preview (shopify theme dev), never a production store.
// Phone visits with reduced motion and with JavaScript disabled.
import { writeFile, mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const out = process.argv[2];
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
const res = [];
for (const mode of ['reduced-motion', 'no-js']) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, reducedMotion: mode === 'reduced-motion' ? 'reduce' : 'no-preference', javaScriptEnabled: mode !== 'no-js' });
  for (const path of ['/', '/collections/all', '/products/amaya-embroidered-shacket']) {
    const page = await context.newPage();
    await page.goto((process.env.BASE ?? 'http://127.0.0.1:9292') + path, { waitUntil: 'load', timeout: 90000 });
    await page.waitForTimeout(1500);
    // Scroll with plain scrollTo (works without page JS).
    for (let y = 0; y < 12000; y += 700) { await page.mouse.wheel(0, 0); await page.evaluate((y) => window.scrollTo(0, y), y).catch(() => {}); await page.waitForTimeout(120); }
    const data = await page.evaluate(() => {
      const op = (e) => { let o = 1; for (let p = e; p && p !== document.body; p = p.parentElement) o *= +getComputedStyle(p).opacity; return o; };
      const els = [...document.querySelectorAll('main h1, main h2, main p, main [data-product-card], main img')].filter((e) => e.getBoundingClientRect().width > 0 && !e.closest('[hidden],dialog:not([open]),[aria-hidden="true"]') && !e.matches('.card__secondary, .card__secondary *'));
      const invisible = els.filter((e) => op(e) < 0.05).map((e) => e.tagName + '.' + String(e.className).slice(0, 40));
      const form = document.querySelector('form[action*="/cart/add"]');
      return { visibleCount: els.length - invisible.length, invisible: invisible.slice(0, 10), invisibleCount: invisible.length, addForm: !!form, addButton: form?.querySelector('[type=submit]')?.textContent.replace(/\s+/g, ' ').trim().slice(0, 40), addDisabled: form?.querySelector('[type=submit]')?.disabled, idInput: form?.querySelector('[name=id]')?.value, cards: document.querySelectorAll('[data-product-card]').length, overflowX: document.documentElement.scrollWidth - innerWidth, runningAnimations: document.getAnimations ? document.getAnimations().filter((a) => a.playState === 'running').length : null, menuLink: !!document.querySelector('header a[href="/collections/all"], header nav a') };
    });
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `${out}/${mode}${path.replace(/\//g, '_')}.png` });
    res.push({ mode, path, ...data });
    console.log(mode, path, JSON.stringify(data));
    await page.close();
  }
  await context.close();
}
await writeFile(`${out}/fallbacks.json`, JSON.stringify(res, null, 2));
await browser.close();
