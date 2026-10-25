// Mobile QA harness (MOBILE_TESTING_REPORT.md). Needs Playwright and Chrome:
//   PLAYWRIGHT_MODULE=<path or URL of playwright/index.mjs>  CHROME_PATH=<chrome.exe>  BASE=http://127.0.0.1:9292
// Runs against a Shopify CLI development preview (shopify theme dev), never a production store.
// Layout sweep across phone/tablet/desktop viewports on the Shopify dev preview.
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const base = process.env.BASE ?? 'http://127.0.0.1:9292';
const out = process.argv[2];
const only = process.argv[3]?.split(',');
await mkdir(out, { recursive: true });

export const VIEWPORTS = [
  { name: 'android-small-320', width: 320, height: 640, dpr: 2, mobile: true },
  { name: 'android-360', width: 360, height: 780, dpr: 3, mobile: true },
  { name: 'iphone-se-375', width: 375, height: 667, dpr: 2, mobile: true },
  { name: 'iphone-15-393', width: 393, height: 852, dpr: 3, mobile: true },
  { name: 'pro-max-430', width: 430, height: 932, dpr: 3, mobile: true },
  { name: 'landscape-852', width: 852, height: 393, dpr: 3, mobile: true },
  { name: 'tablet-768', width: 768, height: 1024, dpr: 2, mobile: true },
  { name: 'tablet-1024', width: 1024, height: 1366, dpr: 2, mobile: true },
  { name: 'desktop-1440', width: 1440, height: 900, dpr: 1, mobile: false },
];
const PAGES = ['/', '/collections/all', '/collections/leather-goods', '/products/amaya-embroidered-shacket',
  '/products/firenze-gurkha-flared-trouser', '/products/the-portofino-shirt', '/products/varenzo-leather-boots', '/search?q=shirt', '/cart', '/pages/contact'];

const UA_MOBILE = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36';
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
const report = [];
for (const vp of VIEWPORTS.filter((v) => !only || only.includes(v.name))) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.dpr, isMobile: vp.mobile, hasTouch: vp.mobile,
    ...(vp.mobile ? { userAgent: UA_MOBILE } : {}),
  });
  for (const path of PAGES) {
   try {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/shop\.app|Content Security Policy|Failed to load resource/.test(m.text())) errors.push(m.text().slice(0, 160)); });
    let status = 0;
    for (let i = 0; i < 3 && status !== 200 && status !== 404; i++) status = (await page.goto(base + path, { waitUntil: 'load', timeout: 60000 }))?.status() ?? 0;
    await page.waitForTimeout(1200);
    // Scroll through the page in steps so lazy content and entrances run, then return to top.
    await page.evaluate(async () => {
      const step = innerHeight * 0.8;
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 140)); }
      await new Promise((r) => setTimeout(r, 900));
    });
    const data = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const doc = { scrollWidth: document.documentElement.scrollWidth, vw, height: document.documentElement.scrollHeight };
      const clippedByAncestor = (el) => {
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
          const s = getComputedStyle(p);
          if (/(hidden|auto|scroll|clip)/.test(s.overflowX) || s.contain.includes('paint')) {
            const r = p.getBoundingClientRect(); if (r.left >= -1 && r.right <= vw + 1) return true;
          }
        }
        return false;
      };
      const visible = (el) => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.visibility !== 'hidden' && s.display !== 'none' && r.width > 0 && r.height > 0 && !el.closest('[hidden],[inert],dialog:not([open]),[aria-hidden="true"]'); };
      const name = (el) => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''}`;
      const sec = (el) => el.closest('[id^="shopify-section"]')?.id.split('__').pop().replace('shopify-section-', '') ?? '';
      const offscreen = [];
      for (const el of document.querySelectorAll('main *, header *, footer *')) {
        if (!visible(el)) continue;
        const r = el.getBoundingClientRect();
        if ((r.right > vw + 2 || r.left < -2) && !clippedByAncestor(el) && getComputedStyle(el).position !== 'fixed') offscreen.push(`${sec(el)} ${name(el)} [${Math.round(r.left)}..${Math.round(r.right)}]`);
      }
      const small = [];
      for (const el of document.querySelectorAll('a[href], button, input:not([type=hidden]), select, summary, label[for], [role=button], [role=tab]')) {
        if (!visible(el)) continue;
        const r = el.getBoundingClientRect();
        if (el.matches('input[type=radio], input[type=checkbox]') && el.labels?.length) continue;
        if (r.width < 24 || r.height < 24) {
          // Inline text links inside paragraphs are exempt (WCAG 2.5.8 inline exception).
          if (el.tagName === 'A' && el.closest('p, li.rte, .rte') && getComputedStyle(el).display === 'inline') continue;
          small.push(`${sec(el)} ${name(el)} ${Math.round(r.width)}x${Math.round(r.height)} "${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 24)}"`);
        }
      }
      const tinyText = new Set();
      for (const el of document.querySelectorAll('main *, header *, footer *')) {
        if (!visible(el) || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs < 11) tinyText.add(`${sec(el)} ${name(el)} ${fs}px "${el.textContent.trim().slice(0, 20)}"`);
      }
      const hidden = [];
      for (const el of document.querySelectorAll('main h1, main h2, main h3, main p, main img, main .card, main [data-product-card], main .button')) {
        const r = el.getBoundingClientRect(); if (!r.width) continue;
        let o = 1; for (let p = el; p && p !== document.body; p = p.parentElement) o *= parseFloat(getComputedStyle(p).opacity);
        if (o < 0.05 && !el.closest('[hidden],dialog:not([open]),[aria-hidden="true"],.card__secondary,[data-card-secondary]') && !el.matches('.card__secondary, video')) hidden.push(`${sec(el)} ${name(el)} op=${o.toFixed(2)}`);
      }
      const brokenImgs = [...document.querySelectorAll('main img')].filter((i) => i.complete && i.naturalWidth === 0 && i.loading !== 'lazy' && i.currentSrc).map((i) => i.currentSrc.split('/').pop().slice(0, 50));
      return { doc, offscreen: offscreen.slice(0, 25), offscreenCount: offscreen.length, small: [...new Set(small)].slice(0, 40), smallCount: small.length, tinyText: [...tinyText].slice(0, 20), hidden: hidden.slice(0, 15), brokenImgs, h1: document.querySelectorAll('h1').length };
    });
    const file = `${vp.name}${path.replace(/[/?=]/g, '_')}.png`;
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}/${file}`, fullPage: false });
    report.push({ viewport: vp.name, path, status, overflowX: data.doc.scrollWidth > data.doc.vw, ...data, errors, screenshot: file });
    console.log(vp.name, path, status, 'overflow', data.doc.scrollWidth - data.doc.vw, 'offscreen', data.offscreenCount, 'small', data.smallCount, 'hidden', data.hidden.length, 'err', errors.length);
    await page.close();
    await writeFile(`${out}/sweep.json`, JSON.stringify(report, null, 2));
   } catch (e) { const msg = e.message.split('\n')[0]; console.log('FAIL', vp.name, path, msg); report.push({ viewport: vp.name, path, failed: msg }); }
  }
  await context.close();
}
await browser.close();
await writeFile(`${out}/sweep.json`, JSON.stringify(report, null, 2));
