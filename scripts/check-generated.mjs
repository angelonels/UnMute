import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const targets = [
  'backend/openapi',
  'frontend/src/api/generated',
  'frontend/src/theme/unmute.css',
  'frontend/src/theme/unmute.js',
  'frontend/src/theme/unmute.d.ts',
  'frontend/src/theme/unmute.variants.d.ts',
];

function filesAt(path) {
  const entries = readdirSync(path, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const child = resolve(path, entry.name);
    return entry.isDirectory() ? filesAt(child) : [child];
  });
}

function snapshot() {
  return new Map(
    targets.flatMap((target) => {
      const path = resolve(root, target);
      const files = statSync(path).isDirectory() ? filesAt(path) : [path];
      return files.map((file) => [
        relative(root, file),
        createHash('sha256').update(readFileSync(file)).digest('hex'),
      ]);
    }),
  );
}

const before = snapshot();
execFileSync('pnpm', ['generate'], { cwd: root, stdio: 'inherit' });
execFileSync('pnpm', ['theme:build'], { cwd: root, stdio: 'inherit' });
const after = snapshot();

const paths = new Set([...before.keys(), ...after.keys()]);
const changed = [...paths].filter((path) => before.get(path) !== after.get(path));

if (changed.length > 0) {
  console.error(
    `Generated artifacts were stale:\n${changed.map((path) => `- ${path}`).join('\n')}`,
  );
  process.exitCode = 1;
}
