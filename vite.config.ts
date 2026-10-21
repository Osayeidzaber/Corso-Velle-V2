/// <reference types="vitest/config" />
import { readdirSync } from 'node:fs';
import { basename, resolve } from 'node:path';
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
  build: {
    // Built into a staging folder; scripts/sync-assets.mjs copies owned files into theme/assets.
    outDir: '.build',
    emptyOutDir: true,
    manifest: true,
    target: 'es2022',
    // Readable output (Shopify compresses on the CDN); keeps a future Theme Store path open.
    minify: false,
    cssCodeSplit: true,
    modulePreload: false,
    assetsInlineLimit: 0,
    rolldownOptions: {
      input,
      output: {
        entryFileNames: 'nk-[name].js',
        chunkFileNames: 'nk-chunk-[name]-[hash].js',
        assetFileNames: 'nk-[name][extname]',
      },
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/unit/**/*.test.ts'],
  },
});
