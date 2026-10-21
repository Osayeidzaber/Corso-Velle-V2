// Rebuilds on change and re-syncs theme/assets. Run alongside `npm run dev` (shopify theme dev).
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { build } from 'vite';

const sync = resolve(import.meta.dirname, 'sync-assets.mjs');
const watcher = await build({ build: { watch: {} } });

watcher.on('event', (event) => {
  if (event.code === 'BUNDLE_END') {
    event.result?.close?.();
    spawnSync(process.execPath, [sync], { stdio: 'inherit' });
  }
  if (event.code === 'ERROR') console.error(event.error);
});
