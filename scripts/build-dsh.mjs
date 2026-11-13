import { execFileSync } from 'node:child_process';
import { cp, mkdir, readFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const metadata = join(root, 'dsh');
const manifest = JSON.parse(await readFile(join(metadata, 'package.json'), 'utf8'));
const web = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
if (manifest.version !== web.version) throw new Error('DSH and game versions must match.');

const output = join(root, 'release', manifest.name);
const game = join(output, 'game');
await mkdir(output, { recursive: true });
await build({ root, mode: 'dsh', build: { outDir: game, emptyOutDir: true } });

// Only the game and its bundled notices are needed at the store's nested URL.
const files = new Set(['index.html', 'assets', 'art', 'icon.svg', 'THIRD-PARTY-NOTICES.txt']);
for (const file of await readdir(game)) {
  if (!files.has(file)) await rm(join(game, file), { recursive: true });
}
for (const file of await readdir(metadata)) {
  await cp(join(metadata, file), join(output, file), { recursive: true });
}
await cp(join(root, 'LICENSE'), join(output, 'LICENSE'));
execFileSync('npm', ['pack', output, '--pack-destination', join(root, 'release')], { stdio: 'inherit' });
