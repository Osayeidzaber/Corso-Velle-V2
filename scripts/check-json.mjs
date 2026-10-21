// Strict JSON check for theme config, templates, section groups and locales.
// Shopify tolerates a leading /* */ banner in editor-managed files; nothing else (no trailing commas).
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const theme = resolve(import.meta.dirname, '..', 'theme');
const dirs = ['config', 'locales', 'templates', 'sections'];
let failures = 0;

for (const dir of dirs) {
  for (const name of readdirSync(join(theme, dir)).filter((f) => f.endsWith('.json'))) {
    const text = readFileSync(join(theme, dir, name), 'utf8').replace(/^\s*\/\*[\s\S]*?\*\//, '');
    try {
      JSON.parse(text);
    } catch (error) {
      failures++;
      console.error(`${dir}/${name}: ${error.message}`);
    }
  }
}

if (failures) process.exit(1);
console.log('check-json: all theme JSON files parse strictly');
