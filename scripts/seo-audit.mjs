// Read-only audit of Shopify-rendered HTML and its native public sitemap. No Admin writes.
import { Window } from 'happy-dom';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const arg = (name, fallback) => args[args.indexOf(name) + 1] && args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const base = arg('--base', 'http://127.0.0.1:9292');
const origin = arg('--origin', 'https://corsovelle.com');
const output = resolve(arg('--out', 'docs/evidence/seo-2026-10-25/baseline'));
await mkdir(output, { recursive: true });
const window = new Window({ settings: { enableJavaScriptEvaluation: false, disableCSSFileLoading: true } });
const parse = (html) => new window.DOMParser().parseFromString(html, 'text/html');
const text = (node) => node?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
const fetchPage = async (url) => {
  const chain = [];
  for (let hop = 0; hop < 6; hop++) {
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(45000) });
    chain.push({ url, status: response.status });
    if ([301, 302, 303, 307, 308].includes(response.status) && response.headers.get('location')) {
      url = new URL(response.headers.get('location'), url).href;
      continue;
    }
    return { url, status: response.status, chain, html: await response.text(), robotsHeader: response.headers.get('x-robots-tag') };
  }
  throw new Error(`Redirect chain exceeds six hops: ${url}`);
};
const robots = await fetchPage(`${origin}/robots.txt`);
await writeFile(`${output}/robots.txt`, robots.html);
const sitemap = await fetchPage(`${origin}/sitemap.xml`);
await writeFile(`${output}/sitemap.xml`, sitemap.html);
const locs = (xml) => [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1].replaceAll('&amp;', '&'));
const sitemapUrls = [];
const sitemapFiles = [];
for (const url of locs(sitemap.html).filter((url) => /sitemap_(products|collections|pages|blogs)_/.test(url))) {
  const result = await fetchPage(url);
  sitemapFiles.push({ url, status: result.status, count: locs(result.html).length });
  sitemapUrls.push(...locs(result.html));
}
const catalogResponse = await fetchPage(`${origin}/products.json?limit=250`);
const products = JSON.parse(catalogResponse.html).products ?? [];
const catalog = {
  products: products.length,
  images: products.flatMap((product) => product.images).length,
  missingImageAlt: products.flatMap((product) => product.images).filter((image) => !image.alt?.trim()).length,
  variants: products.flatMap((product) => product.variants).length,
  missingSku: products.flatMap((product) => product.variants).filter((variant) => !variant.sku?.trim()).length,
  duplicateTitles: Object.entries(Object.groupBy(products, (product) => product.title.toLowerCase().trim())).filter(([, items]) => items.length > 1).map(([title, items]) => ({ title, handles: items.map((product) => product.handle) })),
  shortDescriptions: products.filter((product) => text(parse(product.body_html).body).length < 120).map((product) => product.handle),
  // Shopify's public JSON is not an authenticated feed or app inventory.
  source: `${origin}/products.json?limit=250`,
};
const paths = [...new Set([
  '/', ...sitemapUrls.map((url) => new URL(url).pathname),
  '/collections/all', '/collections/all?page=2', '/collections/all?sort_by=price-ascending',
  '/collections/all?filter.v.availability=1', '/search?q=shirt', '/search?q=seo-no-match-2026',
  '/cart', '/pages/contact', '/blogs/news', '/policies/shipping-policy', '/policies/refund-policy',
  '/policies/contact-information', '/products/seo-nonexistent-2026',
  ...(products[0] ? [`/products/${products[0].handle}?variant=${products[0].variants[0].id}`, `/collections/all/products/${products[0].handle}`, `/products/${products[0].handle}?utm_source=seo-audit`] : []),
])];
const pages = [];
let cursor = 0;
await Promise.all(Array.from({ length: 3 }, async () => {
  while (cursor < paths.length) {
    const path = paths[cursor++];
    try {
      const result = await fetchPage(new URL(path, base).href);
      const document = parse(result.html);
      const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')];
      const schemas = scripts.map((script) => { try { return JSON.parse(script.textContent); } catch (error) { return { parseError: error.message }; } });
      const images = [...document.querySelectorAll('main img')];
      const links = [...new Set([...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((href) => href && !href.startsWith('#')))];
      pages.push({
        path, status: result.status, redirects: result.chain, robotsHeader: result.robotsHeader,
        bytes: Buffer.byteLength(result.html), title: text(document.querySelector('title')),
        titleCount: document.querySelectorAll('title').length,
        descriptions: [...document.querySelectorAll('meta[name="description"]')].map((meta) => meta.content),
        canonicals: [...document.querySelectorAll('link[rel="canonical"]')].map((link) => link.href),
        robots: [...document.querySelectorAll('meta[name="robots"]')].map((meta) => meta.content),
        h1: [...document.querySelectorAll('h1')].map(text),
        headings: [...document.querySelectorAll('main h1, main h2, main h3')].map((node) => ({ level: node.tagName, text: text(node) })),
        images: { count: images.length, missingAlt: images.filter((img) => !img.hasAttribute('alt')).length, emptyAlt: images.filter((img) => img.alt === '').length, missingDimensions: images.filter((img) => !img.width || !img.height).length, highPriority: images.filter((img) => img.getAttribute('fetchpriority') === 'high').map((img) => ({ src: img.src, loading: img.loading, sizes: img.sizes })) },
        schemas, links,
        liquidErrors: [...result.html.matchAll(/Liquid (?:error|syntax error)[^<\n]*/g)].map((match) => match[0]),
      });
      if (['/', '/collections/all?page=2', '/pages/contact'].includes(path) || path.includes('?variant=')) {
        await writeFile(`${output}/${encodeURIComponent(path)}.html`, result.html);
      }
    } catch (error) { pages.push({ path, error: error.message }); }
  }
}));
pages.sort((a, b) => a.path.localeCompare(b.path));
const linkedPaths = new Set(pages.flatMap((page) => page.links ?? []).map((href) => { try { return new URL(href, origin).pathname; } catch { return ''; } }));
const report = {
  capturedAt: new Date().toISOString(), base, origin, sitemap: { status: sitemap.status, files: sitemapFiles, urls: sitemapUrls, foreignHosts: sitemapUrls.filter((url) => new URL(url).host !== new URL(origin).host) }, catalog, pages,
  // Candidates only: a navigation/sitemap sample cannot prove a page is orphaned.
  unlinkedSitemapCandidates: sitemapUrls.filter((url) => !linkedPaths.has(new URL(url).pathname)),
};
await writeFile(`${output}/audit.json`, JSON.stringify(report, null, 2));
const failed = pages.filter((page) => page.error || page.status !== (page.path === '/products/seo-nonexistent-2026' ? 404 : 200) || page.liquidErrors?.length || page.schemas?.some((schema) => schema.parseError) || page.titleCount !== 1 || page.canonicals?.length !== 1);
console.log(JSON.stringify({ output, pages: pages.length, failed, catalog, sitemap: report.sitemap.files }, null, 2));
if (failed.length) process.exitCode = 1;
await window.happyDOM.abort();
window.close();
