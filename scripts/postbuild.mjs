import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const walk = async dir => (await Promise.all((await readdir(dir, { withFileTypes: true })).map(async e => e.isDirectory() ? walk(`${dir}/${e.name}`) : `${dir}/${e.name}`))).flat();
const files = (await walk('dist')).filter(p => !p.endsWith('/sw.js') && !p.endsWith('/version.json')).sort();
const hash = createHash('sha256');
hash.update(await readFile(new URL(import.meta.url))); // A worker-logic fix must also get a new cache.
for (const f of files) hash.update(await readFile(f));
const digest = hash.digest('hex');
let commit = 'local'; try { commit = execFileSync('git', ['rev-parse', 'HEAD'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch {}
await writeFile('dist/version.json', JSON.stringify({ version: '0.1.0', commit, contentHash: digest }));
const urls = ['/', ...files.map(f => f.slice(4))];
await writeFile('dist/sw.js', `const CACHE='ai-fushengji-${digest.slice(0, 12)}';
const FILES=${JSON.stringify(urls)};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('ai-fushengji-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin||u.pathname==='/version.json')return;
if(e.request.mode==='navigate'){e.respondWith(caches.open(CACHE).then(c=>c.match('/')).then(hit=>hit||fetch(e.request)));return;}
e.respondWith(caches.open(CACHE).then(c=>c.match(e.request,{ignoreVary:true})).then(hit=>hit||fetch(e.request)));});\n`);
console.log(`Offline cache: ${urls.length} files, ${digest.slice(0, 12)}`);
