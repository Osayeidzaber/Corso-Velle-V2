// Mobile QA harness (MOBILE_TESTING_REPORT.md). Needs Playwright and Chrome:
//   PLAYWRIGHT_MODULE=<path or URL of playwright/index.mjs>  CHROME_PATH=<chrome.exe>  BASE=http://127.0.0.1:9292
// Runs against a Shopify CLI development preview (shopify theme dev), never a production store.
// Chrome trace of a phone homepage load + touch scroll at 4x CPU; attribute long tasks to scripts.
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const BASE = process.env.BASE ?? 'http://127.0.0.1:9292';
const path = process.argv[2] ?? '/';
const out = process.argv[3];
const cpu = Number(process.argv[4] ?? 4);
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
const swipe = async (dy) => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 196, y: 650 }] }); for (let i = 1; i <= 15; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 196, y: 650 + dy * i / 15 }] }); await new Promise((r) => setTimeout(r, 16)); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
await browser.startTracing(page, { path: `${out}/trace${path.replace(/\//g, '_')}.json`, categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'v8.execute', 'blink.user_timing'] });
await page.goto(BASE + path, { waitUntil: 'load' });
await page.waitForTimeout(5000);
for (let i = 0; i < 10; i++) { await swipe(-500); await page.waitForTimeout(500); }
await page.waitForTimeout(1500);
await browser.stopTracing();
await browser.close();

const trace = JSON.parse(await readFile(`${out}/trace${path.replace(/\//g, '_')}.json`, 'utf8'));
const events = trace.traceEvents ?? trace;
// Main renderer thread = thread with most RunTask time in the page's renderer.
const tasks = events.filter((e) => e.name === 'RunTask' && e.ph === 'X' && e.dur);
const byThread = {};
for (const t of tasks) byThread[`${t.pid}:${t.tid}`] = (byThread[`${t.pid}:${t.tid}`] ?? 0) + t.dur;
const main = Object.entries(byThread).sort((a, b) => b[1] - a[1])[0][0];
const [pid, tid] = main.split(':').map(Number);
const onMain = events.filter((e) => e.pid === pid && e.tid === tid && e.ph === 'X' && e.dur);
const t0 = Math.min(...onMain.map((e) => e.ts));
const long = onMain.filter((e) => e.name === 'RunTask' && e.dur > 50000);
const short = (u) => (u || '').split('/').pop().split('?')[0] || '(inline/none)';
const report = [];
for (const task of long) {
  const inside = onMain.filter((e) => e.ts >= task.ts && e.ts + e.dur <= task.ts + task.dur && e !== task);
  const sums = {};
  for (const e of inside) {
    let key = null;
    if (['EvaluateScript', 'v8.compile', 'v8.compileModule', 'v8.evaluateModule'].includes(e.name)) key = `${e.name} ${short(e.args?.data?.url ?? e.args?.fileName)}`;
    else if (e.name === 'FunctionCall') key = `FunctionCall ${short(e.args?.data?.url)}:${e.args?.data?.functionName || ''}`;
    else if (['Layout', 'UpdateLayoutTree', 'Paint', 'ParseHTML', 'TimerFire', 'FireAnimationFrame', 'EventDispatch', 'ParseAuthorStyleSheet', 'Decode Image'].includes(e.name)) key = e.name + (e.name === 'EventDispatch' ? ' ' + (e.args?.data?.type ?? '') : '');
    if (key) sums[key] = (sums[key] ?? 0) + e.dur;
  }
  report.push({ atMs: Math.round((task.ts - t0) / 1000), durMs: Math.round(task.dur / 1000), top: Object.entries(sums).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k} ${Math.round(v / 1000)}ms`) });
}
// Totals by script across the whole trace (self-ish: FunctionCall/EvaluateScript durations, nested double counting possible).
const totals = {};
for (const e of onMain) if (['EvaluateScript', 'FunctionCall', 'v8.compileModule', 'v8.evaluateModule'].includes(e.name)) { const k = short(e.args?.data?.url ?? e.args?.fileName); totals[k] = (totals[k] ?? 0) + e.dur; }
const layout = onMain.filter((e) => e.name === 'Layout').reduce((a, e) => a + e.dur, 0);
const style = onMain.filter((e) => e.name === 'UpdateLayoutTree').reduce((a, e) => a + e.dur, 0);
const summary = { path, cpu, longTasks: long.length, longTaskMs: Math.round(long.reduce((a, t) => a + t.dur, 0) / 1000), layoutMs: Math.round(layout / 1000), styleMs: Math.round(style / 1000), scriptTotals: Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => `${k} ${Math.round(v / 1000)}ms`), long: report };
await writeFile(`${out}/trace-summary${path.replace(/\//g, '_')}.json`, JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 1));
