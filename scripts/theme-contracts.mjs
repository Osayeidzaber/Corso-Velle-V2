import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

export function validateSettings(settings = [], context = 'settings') {
  const issues = [];
  const ids = new Set();
  for (const setting of settings) {
    if (!setting.id) continue;
    const key = `${context}.${setting.id}`;
    if (ids.has(setting.id)) issues.push(`${key}: duplicate setting ID`);
    ids.add(setting.id);
    if (setting.type === 'range') {
      const { min, max, default: value, step = 1 } = setting;
      if (![min, max, value, step].every(Number.isFinite) || max <= min || step <= 0 || value < min || value > max) {
        issues.push(`${key}: invalid range/default`);
      } else if (Math.abs((value - min) / step - Math.round((value - min) / step)) > 0.00001) {
        issues.push(`${key}: default does not land on a step`);
      }
    }
    if (setting.options) {
      const values = setting.options.map((option) => option.value);
      if (new Set(values).size !== values.length) issues.push(`${key}: duplicate option value`);
      if (Object.hasOwn(setting, 'default') && !values.includes(setting.default)) issues.push(`${key}: default missing from options`);
    }
    if (setting.definition) issues.push(...validateSettings(setting.definition, key));
  }
  return issues;
}

export function validateComposition(schema, context = 'schema') {
  const issues = validateSettings(schema.settings, context);
  const blocks = schema.blocks ?? [];
  const types = blocks.map((block) => block.type);
  if (new Set(types).size !== types.length) issues.push(`${context}: duplicate block type`);
  if (types.includes('@theme') && blocks.some((block) => !block.type.startsWith('@'))) issues.push(`${context}: cannot mix theme blocks with local section blocks`);
  for (const block of blocks) issues.push(...validateSettings(block.settings, `${context}/${block.type}`));
  for (const preset of schema.presets ?? []) {
    const checkBlocks = (items) => {
      for (const block of Array.isArray(items) ? items : Object.values(items ?? {})) {
        if (!types.includes('@theme') && !types.includes(block.type)) issues.push(`${context}: preset references unknown block ${block.type}`);
      }
    };
    checkBlocks(preset.blocks);
  }
  return issues;
}

export function validateOrder(items, order, context = 'template') {
  const issues = [];
  if (new Set(order ?? []).size !== (order ?? []).length) issues.push(`${context}: duplicate order entry`);
  for (const id of order ?? []) if (!Object.hasOwn(items ?? {}, id)) issues.push(`${context}: ordered item ${id} does not exist`);
  return issues;
}

export function checkTheme(theme) {
  const issues = [];
  const parse = (file) => JSON.parse(readFileSync(file, 'utf8').replace(/^\s*\/\*[\s\S]*?\*\//, ''));
  const globals = parse(join(theme, 'config/settings_schema.json'));
  issues.push(...validateSettings(globals.flatMap((group) => group.settings ?? []), 'global'));
  for (const directory of ['sections', 'blocks']) {
    for (const file of readdirSync(join(theme, directory)).filter((file) => file.endsWith('.liquid'))) {
      const context = `${directory}/${file}`;
      const source = readFileSync(join(theme, context), 'utf8');
      const schema = source.match(/{%\s*schema\s*%}([\s\S]*?){%\s*endschema\s*%}/);
      if (!schema) { issues.push(`${context}: missing schema`); continue; }
      try { issues.push(...validateComposition(JSON.parse(schema[1]), context)); }
      catch (error) { issues.push(`${context}: invalid schema JSON (${error.message})`); }
    }
  }
  for (const directory of ['templates', 'sections']) {
    for (const file of readdirSync(join(theme, directory)).filter((file) => file.endsWith('.json'))) {
      const data = parse(join(theme, directory, file));
      issues.push(...validateOrder(data.sections, data.order, file));
      for (const [id, section] of Object.entries(data.sections ?? {})) {
        if (!existsSync(join(theme, 'sections', `${section.type}.liquid`))) issues.push(`${file}/${id}: missing section ${section.type}`);
        issues.push(...validateOrder(section.blocks, section.block_order, `${file}/${id}`));
      }
    }
  }
  return issues;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const issues = checkTheme(resolve(import.meta.dirname, '../theme'));
  if (issues.length) { console.error(issues.join('\n')); process.exitCode = 1; }
  else console.log('theme-contracts: settings, schemas, presets and template references pass');
}
