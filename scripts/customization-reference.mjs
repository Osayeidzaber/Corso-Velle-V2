// Keep the implemented settings reference tied to the actual native Shopify schemas.
// Handwritten behavior notes above the marker remain merchant/developer maintained.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const target = join(root, 'docs', 'SETTINGS-REFERENCE.md');
const marker = '<!-- schema-reference:start -->';
const schemaLocale = JSON.parse(readFileSync(join(root, 'theme/locales/en.default.schema.json'), 'utf8'));
const translate = (value) => {
  if (typeof value !== 'string' || !value.startsWith('t:')) return value;
  return value.slice(2).split('.').reduce((node, key) => node?.[key], schemaLocale) ?? value;
};
const cell = (value) => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', '<br>');
const label = (value) => cell(translate(value));
const code = (value) => `\`${cell(value)}\``;
const lines = [marker, '## Implemented schema reference', '',
  'Generated from current source schemas with `node scripts/customization-reference.mjs`. Run with `--check` to detect stale tables. Do not edit generated tables. These are schema defaults, not saved merchant values. Blank resource fields require selection; a preset may supply different values. A declared setting is not a runtime guarantee: see the [customization guide](../CUSTOMIZATION.md) for behavior and limitations.', ''];

function settingsTable(settings = []) {
  const entries = settings.filter((setting) => setting.id);
  if (!entries.length) { lines.push('No local settings.', ''); return; }
  lines.push('| Setting ID / label | Type | Schema default | Choices / range / help |', '| --- | --- | --- | --- |');
  for (const setting of entries) {
    const details = [];
    if (setting.options) details.push(setting.options.map((option) => `${code(option.value)}: ${label(option.label)}`).join('; '));
    if (setting.type === 'range') details.push(`${setting.min}–${setting.max}${setting.unit ?? ''}, step ${setting.step ?? 1}`);
    if (setting.limit) details.push(`Picker limit ${setting.limit}`);
    if (setting.info) details.push(label(setting.info));
    if (setting.visible_if) details.push(`Shown when ${code(setting.visible_if)}`);
    const initial = Object.hasOwn(setting, 'default') ? code(setting.default) : 'Not specified';
    lines.push(`| ${code(setting.id)} — ${label(setting.label)} | ${code(setting.type)} | ${initial} | ${details.join('; ')} |`);
    if (setting.definition) {
      lines.push('');
      lines.push(`Color scheme fields for ${code(setting.id)}:`, '');
      settingsTable(setting.definition);
      lines.push('| Setting ID / label | Type | Schema default | Choices / range / help |', '| --- | --- | --- | --- |');
    }
  }
  lines.push('');
}

const globals = JSON.parse(readFileSync(join(root, 'theme/config/settings_schema.json'), 'utf8'));
lines.push('### Theme settings', '', 'Source: `theme/config/settings_schema.json`; token consumer: `theme/snippets/css-variables.liquid`; runtime policy: `theme/snippets/nk-config.liquid` → `src/core/config.ts`.', '');
for (const group of globals.filter((entry) => entry.name !== 'theme_info')) {
  lines.push(`#### ${label(group.name)}`, '');
  settingsTable(group.settings);
}
for (const directory of ['sections', 'blocks']) {
  lines.push(`### Theme ${directory}`, '');
  for (const name of readdirSync(join(root, 'theme', directory)).filter((name) => name.endsWith('.liquid')).sort()) {
    const file = `theme/${directory}/${name}`;
    const source = readFileSync(join(root, file), 'utf8');
    const schema = JSON.parse(source.match(/{%\s*schema\s*%}([\s\S]*?){%\s*endschema\s*%}/)[1]);
    const stem = name.replace('.liquid', '');
    lines.push(`#### ${label(schema.name)} (${stem})`, '', `Source: ${code(file)}. Editor: ${directory === 'blocks' ? 'Add block inside a compatible theme-block section/group' : 'select this section in its template or section group'}.`, '');
    if (schema.enabled_on) lines.push(`Available contexts: ${code(JSON.stringify(schema.enabled_on))}.`, '');
    if (schema.disabled_on) lines.push(`Excluded contexts: ${code(JSON.stringify(schema.disabled_on))}.`, '');
    if (schema.limit) lines.push(`Section instance limit: ${schema.limit}.`, '');
    if (schema.max_blocks) lines.push(`Current section block cap: ${schema.max_blocks}.`, '');
    settingsTable(schema.settings);
    for (const block of schema.blocks ?? []) {
      lines.push(`Supported block: **${label(block.name ?? block.type)}** (${code(block.type)})${block.limit ? `; type limit ${block.limit}` : ''}.`, '');
      if (!['@theme', '@app'].includes(block.type)) settingsTable(block.settings);
    }
    if (schema.presets?.length) {
      lines.push('Add-menu presets:', '');
      for (const preset of schema.presets) lines.push(`- ${label(preset.name)}${preset.settings ? ` — ${code(JSON.stringify(preset.settings))}` : ''}${preset.blocks ? `; initial blocks ${code(JSON.stringify(preset.blocks))}` : ''}.`);
      lines.push('');
    } else lines.push('No add-menu preset: rendered by an existing template/layout/group or used as a rendering endpoint.', '');
  }
}
const previous = readFileSync(target, 'utf8');
const prefix = previous.split(marker)[0].trimEnd();
const result = `${prefix}\n\n${lines.join('\n').trimEnd()}\n`;
if (process.argv.includes('--check')) {
  if (previous !== result) { console.error('Customization schema reference is stale. Run node scripts/customization-reference.mjs.'); process.exit(1); }
  console.log('customization-reference: current');
} else {
  writeFileSync(target, result);
  console.log('customization-reference: updated docs/SETTINGS-REFERENCE.md');
}
