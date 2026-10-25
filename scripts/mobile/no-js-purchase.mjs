// Mobile QA harness (MOBILE_TESTING_REPORT.md). Needs Playwright and Chrome:
//   PLAYWRIGHT_MODULE=<path or URL of playwright/index.mjs>  CHROME_PATH=<chrome.exe>  BASE=http://127.0.0.1:9292
// Runs against a Shopify CLI development preview (shopify theme dev), never a production store.
import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const BASE = process.env.BASE ?? 'http://127.0.0.1:9292';
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, javaScriptEnabled: false });
const page = await ctx.newPage();
await page.goto(`${BASE}/products/amaya-embroidered-shacket`, { waitUntil: 'load' });
const links = await page.$$eval('main noscript ~ * a, main details a[href*="option_values="]', (as) => as.map((a) => ({ t: a.textContent.trim().replace(/\s+/g, ' '), h: a.getAttribute('href'), w: Math.round(a.getBoundingClientRect().width), hgt: Math.round(a.getBoundingClientRect().height) })));
console.log('links', JSON.stringify(links));
await page.tap('main form details.disclosure summary'); const m = await page.$('main form details a:text-is("M")');
await Promise.all([page.waitForURL(/option_values/), m.tap()]); await page.waitForLoadState('load');
const state = await page.$eval('form[action*="/cart/add"] [type=submit]', (b) => ({ disabled: b.disabled, label: b.textContent.replace(/\s+/g, ' ').trim(), id: b.form.querySelector('[name=id]').value, idDisabled: b.form.querySelector('[name=id]').disabled, url: location.search }));
console.log('after M', JSON.stringify(state));
await page.screenshot({ path: process.argv[2] + '/no-js-variant-selected.png' });
await Promise.all([page.waitForURL(/cart/), page.tap('form[action*="/cart/add"] [type=submit]')]); await page.waitForLoadState('load');
console.log('after add', page.url().replace(/[a-f0-9]{20,}/g, '<tok>'));
const cart = await (await ctx.request.get(`${BASE}/cart.js`)).json();
console.log('cart', cart.items.map((i) => i.variant_title + ' x' + i.quantity));
for (const i of cart.items) await ctx.request.post(`${BASE}/cart/change.js`, { data: { id: i.key, quantity: 0 } });
console.log('cleaned', (await (await ctx.request.get(`${BASE}/cart.js`)).json()).item_count);
// No-JS header navigation on a phone
await page.goto(`${BASE}/`, { waitUntil: 'load' });
console.log('nav', JSON.stringify(await page.evaluate(() => ({ menuButton: !!document.querySelector('[data-nk-open="MenuDrawer"]'), noscriptNav: [...document.querySelectorAll('header noscript, header a[href^="/collections"], header a[href^="/pages"]')].filter((e) => e.getBoundingClientRect?.().width > 0).length, footerLinks: document.querySelectorAll('footer a[href^="/collections"], footer a[href^="/pages"], footer a[href^="/policies"]').length, visibleFooterLinks: [...document.querySelectorAll('footer a')].filter((a) => a.getBoundingClientRect().width > 0).length }))));
await browser.close();
