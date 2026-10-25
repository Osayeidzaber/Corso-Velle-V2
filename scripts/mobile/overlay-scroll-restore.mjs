// Mobile QA harness (MOBILE_TESTING_REPORT.md). Needs Playwright and Chrome:
//   PLAYWRIGHT_MODULE=<path or URL of playwright/index.mjs>  CHROME_PATH=<chrome.exe>  BASE=http://127.0.0.1:9292
// Runs against a Shopify CLI development preview (shopify theme dev), never a production store.
import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const BASE = process.env.BASE ?? 'http://127.0.0.1:9292';
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
const swipe = async (dy) => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 196, y: 500 }] }); for (let i = 1; i <= 20; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 196, y: 500 + dy * i / 20 }] }); await new Promise((r) => setTimeout(r, 24)); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
const tapAt = async (sel) => { const box = await page.evaluate((sel) => { const e = [...document.querySelectorAll(sel)].find((x) => { const r = x.getBoundingClientRect(); return r.width && r.top >= 0 && r.bottom <= innerHeight; }); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel); if (!box) return false; await page.touchscreen.tap(box.x, box.y); return true; };
const y = () => page.evaluate(() => Math.round(scrollY));
const rows = [];
for (const [path, trigger] of [['/', '[data-nk-open="MenuDrawer"]'], ['/', '[data-nk-open="SearchModal"]'], ['/collections/all', '.facets [data-nk-open]'], ['/collections/all', '[data-nk-open="CartDrawer"]'], ['/products/amaya-embroidered-shacket', '.size-guide-link']]) {
  await page.goto(BASE + path, { waitUntil: 'load' }); await page.waitForTimeout(2500);
  await swipe(-500); await page.waitForTimeout(1500);
  await swipe(60); await page.waitForTimeout(900); // a small upward nudge reveals the hiding header
  const before = await y();
  const ok = await tapAt(trigger);
  await page.waitForTimeout(900);
  const opened = await page.evaluate(() => document.querySelectorAll('dialog[open]').length);
  const during = await y();
  await swipe(-300); await page.waitForTimeout(600);
  const duringSwipe = await y();
  await tapAt('dialog[open] [data-nk-close]') || await page.keyboard.press('Escape');
  await page.waitForTimeout(900);
  const after = await y();
  await swipe(-300); await page.waitForTimeout(900);
  const row = { path, trigger, tapped: ok, opened, before, during, duringSwipe, after, restored: Math.abs(after - before) <= 2, scrollsAfterClose: (await y()) > after, locked: await page.evaluate(() => document.documentElement.classList.contains('nk-locked')) };
  rows.push(row); console.log(JSON.stringify(row));
}
await browser.close();
