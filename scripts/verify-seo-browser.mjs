// Optional browser evidence. Set PLAYWRIGHT_MODULE to the installed Playwright module URL.
// Uses fresh sessions and read-only interactions; it does not add to cart or submit forms.
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const base = process.env.SEO_BASE ?? 'http://127.0.0.1:9292';
const output = resolve(process.argv[2] ?? 'docs/evidence/seo-2026-10-25/browser-baseline');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
const reports = [];
const paths = ['/', '/collections/all', '/products/amaya-embroidered-shacket'];
async function navigate(page, url) {
  // Theme-dev can briefly return an authentication response while refreshing its session.
  // Never mistake that error page's fast paint for storefront performance.
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await page.goto(url, { waitUntil: 'load' });
    if (response.status() === 200) {
      await page.locator('main h1').waitFor({ state: 'attached' });
      return response;
    }
    if (![401, 429, 503].includes(response.status()) || attempt === 2) throw new Error(`Storefront ${url} returned ${response.status()}`);
  }
}
try {
  for (const width of [390, 1440]) {
    for (const path of paths) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, isMobile: width === 390, hasTouch: width === 390 });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await context.addInitScript(() => {
        const metrics = window.__seoMetrics = { lcp: 0, cls: 0, longTasks: 0, longTaskMs: 0 };
        let sessionValue = 0, firstShift = 0, lastShift = 0;
        for (const type of ['largest-contentful-paint', 'layout-shift', 'longtask']) {
          try {
            new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                if (type === 'largest-contentful-paint') { metrics.lcp = entry.startTime; metrics.lcpElement = entry.element?.tagName; }
                if (type === 'longtask') { metrics.longTasks++; metrics.longTaskMs += entry.duration; }
                if (type === 'layout-shift' && !entry.hadRecentInput) {
                  if (entry.startTime - lastShift > 1000 || entry.startTime - firstShift > 5000) { sessionValue = 0; firstShift = entry.startTime; }
                  lastShift = entry.startTime; sessionValue += entry.value; metrics.cls = Math.max(metrics.cls, sessionValue);
                }
              }
            }).observe({ type, buffered: true });
          } catch { /* Performance APIs differ across browsers. */ }
        }
      });
      const response = await navigate(page, `${base}${path}`);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(() => [...document.querySelectorAll('nk-text[play-on-load]')].every((node) => node.hasAttribute('data-done') || node.getAttribute('style')?.includes('opacity: 1') || node.querySelector('.nk-w')));
      await page.screenshot({ path: `${output}/${width}-${path === '/' ? 'home' : path.startsWith('/products') ? 'product' : 'collection'}.png` });
      const initial = await page.evaluate(() => ({
        metrics: window.__seoMetrics,
        navigation: performance.getEntriesByType('navigation').map(({ responseStart, domContentLoadedEventEnd, loadEventEnd }) => ({ responseStart, domContentLoadedEventEnd, loadEventEnd })),
        resources: performance.getEntriesByType('resource').map(({ name, initiatorType, transferSize, duration }) => ({ name, initiatorType, transferSize, duration })),
        h1: [...document.querySelectorAll('h1')].map((node) => node.textContent.replace(/\s+/g, ' ').trim()),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        lenis: document.documentElement.classList.contains('lenis'),
        gallery: document.querySelector('nk-gallery')?.dataset.layout,
        lens: !!document.querySelector('.gallery__lens'),
      }));
      const modules = initial.resources.filter((item) => /nk-chunk-gsap/.test(item.name));
      let triggers = null;
      if (modules[0]) {
        triggers = await page.evaluate(async (url) => { const { ScrollTrigger } = await import(url); return ScrollTrigger.getAll().length; }, modules[0].name);
      }
      const target = page.locator('[data-stagger-item]').last();
      if (await target.count()) {
        await target.scrollIntoViewIfNeeded();
        await page.waitForFunction(() => [...document.querySelectorAll('[data-stagger-item]')].every((node) => getComputedStyle(node).opacity !== '0'));
      }
      reports.push({ width, path, status: response.status(), errors, ...initial, scrollTriggers: triggers });
      await context.close();
    }
  }
  // Prove the product/collection content and links survive both disabled JS and failed modules.
  for (const mode of ['no-js', 'blocked-modules']) {
    for (const path of paths) {
      const context = await browser.newContext({ javaScriptEnabled: mode !== 'no-js', viewport: { width: 390, height: 900 } });
      if (mode === 'blocked-modules') await context.route(/nk-.*\.js(?:\?|$)/, (route) => route.abort());
      const page = await context.newPage();
      await navigate(page, `${base}${path}`);
      await page.waitForFunction(() => document.querySelectorAll('h1').length > 0 && [...document.querySelectorAll('h1')].every((node) => {
        for (let current = node; current; current = current.parentElement) if (getComputedStyle(current).opacity === '0' || getComputedStyle(current).visibility === 'hidden') return false;
        return true;
      }));
      reports.push({ mode, path, ...await page.evaluate(() => ({
        h1: [...document.querySelectorAll('h1')].map((node) => node.textContent.trim()),
        productLinks: [...document.querySelectorAll('main a[href*="/products/"]')].length,
        description: document.querySelector('.product__info .rte')?.textContent.trim(),
        optionLinks: document.querySelectorAll('a[href*="option_values="]').length,
      })) });
      await context.close();
    }
  }
  await writeFile(`${output}/report.json`, JSON.stringify({ capturedAt: new Date().toISOString(), browser: browser.version(), base, note: 'Unthrottled local-preview lab observations, one run per viewport/page. Not CrUX, INP, or a Lighthouse score.', reports }, null, 2));
  console.log(JSON.stringify(reports.map(({ resources, ...report }) => ({ ...report, resources: resources?.length })), null, 2));
} finally { await browser.close(); }
