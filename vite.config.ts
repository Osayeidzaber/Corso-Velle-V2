/// <reference types="vitest/config" />
import { readdirSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// Every file in src/entries becomes one page-level module: src/entries/product.ts -> nk-product.js.
const entriesDir = resolve(import.meta.dirname, 'src/entries');
const input = Object.fromEntries(
  readdirSync(entriesDir)
    .filter((file) => file.endsWith('.ts'))
    .map((file) => [basename(file, '.ts'), resolve(entriesDir, file)]),
);

export default defineConfig({
  // The theme serves assets from Shopify's CDN; relative imports between flat siblings resolve there.
  base: './',
  publicDir: false,
  plugins: [tailwindcss()],
  build: {
    // Built into a staging folder; scripts/sync-assets.mjs copies owned files into theme/assets.
    outDir: '.build',
    emptyOutDir: true,
    manifest: true,
    target: 'es2022',
    // Minified output. The Shopify Theme Store rejects minified .css (ES modules and third-party
    // libraries are exempt); a Theme Store build would set cssMinify: false (see PRODUCTION_READINESS.md).
    minify: true,
    cssCodeSplit: true,
    modulePreload: false,
    assetsInlineLimit: 0,
    rolldownOptions: {
      input,
      output: {
        // Entries are hashed and loaded by bare URL (no ?v=), the same URL chunks use when they
        // import an entry (shared helpers live in it; quick add imports the product entry). With
        // "nk-global.js?v=…" on the page and "./nk-global.js" in chunks the browser saw two URLs,
        // made two module instances and ran the whole entry twice: every listener doubled.
        entryFileNames: 'nk-[name]-[hash].js',
        chunkFileNames: 'nk-chunk-[name]-[hash].js',
        // Entry CSS keeps a stable name (asset_url adds ?v=); CSS of lazy chunks is fetched by
        // relative URL without ?v=, so it carries a content hash for cache-busting.
        assetFileNames: (info) =>
          ['global.css', 'product.css'].some((name) => info.names.includes(name))
            ? 'nk-[name][extname]'
            : 'nk-[name]-[hash][extname]',
      },
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/unit/**/*.test.ts'],
  },
});
