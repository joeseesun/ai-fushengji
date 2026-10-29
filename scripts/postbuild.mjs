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
await writeFile('dist/version.json', JSON.stringify({ version: JSON.parse(await readFile('package.json', 'utf8')).version, commit, contentHash: digest }));
const urls = ['/', ...files.map(f => f.slice(4))];
await writeFile('dist/sw.js', `const CACHE='ai-fushengji-${digest.slice(0, 12)}';
const FILES=${JSON.stringify(urls)};
const ENTRY=FILES.find(p=>p.startsWith('/assets/')&&p.endsWith('.js'));
const readyClients=new Set();
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
// Never reload a running game. Retain older assets until every open page has
// acknowledged the current entry bundle; old games may still need those files.
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('message',e=>{if(e.data?.type!=='APP_READY'||e.data.entry!==ENTRY||!e.source?.id)return;readyClients.add(e.source.id);e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(clients=>{if(clients.length&&clients.every(c=>readyClients.has(c.id)))return caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('ai-fushengji-')&&k!==CACHE).map(k=>caches.delete(k))));}));});
async function oldAsset(request){for(const key of await caches.keys()){if(key.startsWith('ai-fushengji-')&&key!==CACHE){const hit=await(await caches.open(key)).match(request,{ignoreVary:true});if(hit)return hit;}}}
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin||u.pathname==='/version.json'||u.pathname.startsWith('/api/'))return;
if(e.request.mode==='navigate'){e.respondWith(fetch(e.request,{cache:'no-cache'}).then(response=>{if(!response.ok)throw new Error('navigation unavailable');return response;}).catch(()=>caches.open(CACHE).then(c=>c.match('/'))));return;}
e.respondWith(caches.open(CACHE).then(c=>c.match(e.request,{ignoreVary:true})).then(async hit=>hit||await oldAsset(e.request)||fetch(e.request)));});\n`);
console.log(`Offline cache: ${urls.length} files, ${digest.slice(0, 12)}`);
