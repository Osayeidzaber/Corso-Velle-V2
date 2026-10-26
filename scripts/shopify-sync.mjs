// Moves changes between `main` (theme in theme/) and `shopify` (theme at the top level, connected to Shopify).
//   node scripts/shopify-sync.mjs pull    Theme Editor commits on origin/shopify -> theme/ in the working tree
//   node scripts/shopify-sync.mjs deploy  committed main:theme -> new commit on origin/shopify (fast-forward, never forced)
import { execFileSync } from 'node:child_process';

const BOT = 'shopify[bot]';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim();
const fail = (message) => { console.error(`shopify-sync: ${message}`); process.exit(1); };

git('fetch', '--quiet', 'origin', 'shopify');
const log = git('log', '--format=%H%x09%an', 'origin/shopify').split('\n').map((line) => line.split('\t'));
const baseIndex = log.findIndex(([, author]) => author !== BOT);
if (baseIndex < 0) fail('origin/shopify has no commit made from main');
const base = log[baseIndex][0];
const editorCommits = log.slice(0, baseIndex);
// Files Shopify changed since the last deploy, and whether main already has Shopify's version of each.
const editorFiles = editorCommits.length ? git('diff', '--name-only', base, 'origin/shopify').split('\n').filter(Boolean) : [];
const blob = (path) => { try { return git('rev-parse', '--verify', '--quiet', path); } catch { return null; } };
const unpulled = editorFiles.filter((file) => blob(`origin/shopify:${file}`) !== blob(`main:theme/${file}`));

const command = process.argv[2];
if (command === 'pull') {
  if (!unpulled.length) { console.log('shopify-sync: main already has every Theme Editor change'); process.exit(0); }
  const patch = git('diff', '--binary', base, 'origin/shopify', '--', ...unpulled) + '\n';
  execFileSync('git', ['apply', '--3way', '--directory=theme'], { input: patch, stdio: ['pipe', 'inherit', 'inherit'] });
  console.log(`shopify-sync: applied ${editorCommits.length} Theme Editor commit(s) to theme/:\n  ${unpulled.join('\n  ')}`);
  console.log('Review, run `npm run check`, commit on main, then deploy.');
} else if (command === 'deploy') {
  if (unpulled.length) fail(`origin/shopify has Theme Editor changes main doesn't: ${unpulled.join(', ')}. Run pull first.`);
  const tree = git('rev-parse', 'main:theme');
  if (tree === git('rev-parse', 'origin/shopify^{tree}')) { console.log('shopify-sync: shopify already matches main'); process.exit(0); }
  const commit = git('commit-tree', tree, '-p', 'origin/shopify', '-m', `Deploy main ${git('rev-parse', '--short', 'main')}`);
  execFileSync('git', ['push', 'origin', `${commit}:refs/heads/shopify`], { stdio: 'inherit' });
  git('fetch', '--quiet', 'origin', 'shopify');
  console.log(`shopify-sync: shopify is now ${commit.slice(0, 7)}`);
} else {
  fail('usage: node scripts/shopify-sync.mjs pull|deploy');
}
