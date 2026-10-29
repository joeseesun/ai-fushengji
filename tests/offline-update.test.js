import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const source = await readFile('dist/sw.js', 'utf8');
const harness = () => {
  const handlers = {}, removed = [], cachesByName = new Map(); let skipped = 0, offline = false;
  const cacheFor = name => {
    if (!cachesByName.has(name)) cachesByName.set(name, { addAll: async () => {}, match: async key => key === '/' ? new Response('offline shell') : undefined });
    return cachesByName.get(name);
  };
  const self = { location: { origin: 'https://game.test' }, addEventListener: (name, fn) => handlers[name] = fn, skipWaiting: async () => { skipped++; }, clients: { claim: async () => {}, matchAll: async () => [{ id: 'old' }] } };
  vm.runInNewContext(source, { self, URL, Response, Map, Set, caches: { open: async name => cacheFor(name), keys: async () => [...cachesByName.keys()], delete: async name => { removed.push(name); return true; }, match: async () => undefined }, fetch: async () => { if (offline) throw new Error('offline'); return new Response('current network shell'); } });
  const request = async () => { let response; handlers.fetch({request:{url:'https://game.test/',method:'GET',mode:'navigate'}, respondWith:p=>response=p});return (await response).text(); };
  const install = async () => { let work; handlers.install({waitUntil:p=>work=p}); await work; };
  const activate = async () => { let work; handlers.activate({waitUntil:p=>work=p}); await work; };
  const message = async (id, entry) => { let work; handlers.message({data:{type:'APP_READY',entry},source:{id},waitUntil:p=>work=p}); await work; };
  const entry = JSON.parse(source.match(/const FILES=(.*);/)[1]).find(p=>p.startsWith('/assets/')&&p.endsWith('.js'));
  return { request, install, activate, message, entry, removed, seedOld: () => cacheFor('ai-fushengji-old'), skipped: () => skipped, offline: () => offline = true };
};
test('manual navigation gets current HTML online, with cached shell offline', async () => { const h=harness(); await h.install(); assert.equal(await h.request(),'current network shell'); h.offline();assert.equal(await h.request(),'offline shell'); });
test('a fully cached worker can activate without closing every old tab', async () => { const h=harness();await h.install();assert.equal(h.skipped(),1); });

test('old assets remain until every open page acknowledges the current bundle', async () => {
  const h = harness(); h.seedOld(); await h.install(); await h.activate();
  assert.deepEqual(h.removed, []);
  await h.message('old', '/assets/outdated.js'); assert.deepEqual(h.removed, []);
  await h.message('different-page', h.entry); assert.deepEqual(h.removed, []);
  await h.message('old', h.entry); assert.deepEqual(h.removed, ['ai-fushengji-old']);
});
