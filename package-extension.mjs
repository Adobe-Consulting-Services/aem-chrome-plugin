import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
const outDir = 'release';
const outFile = `${outDir}/aem-chrome-plugin-v${manifest.version}.zip`;

// Only the files actually needed to load/run the extension - no source, no tooling, no dev files.
const INCLUDE = [
  'manifest.json',
  'panel.html',
  'options.html',
  'devtools.html',
  'assets',
  'vendor',
  'dist',
  'LICENSE',
];

const EXCLUDE_GLOBS = [
  'dist/*.map',
];

if (!existsSync('dist')) {
  console.error('dist/ not found - run `npm run build` first.');
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
rmSync(outFile, { force: true });

const missing = INCLUDE.filter((path) => !existsSync(path));
if (missing.length > 0) {
  console.error('Missing expected file(s): ' + missing.join(', '));
  process.exit(1);
}

const args = ['-r', outFile, ...INCLUDE];
EXCLUDE_GLOBS.forEach((glob) => args.push('-x', glob));

execFileSync('zip', args, { stdio: 'inherit' });

console.log(`\nCreated ${outFile}`);
