import { writeFile } from 'node:fs/promises';
const source = 'https://openrouter.ai/api/v1/models';
const r = await fetch(source); if (!r.ok) throw new Error(`Model directory returned ${r.status}`);
const { data } = await r.json();
if (!Array.isArray(data) || data.length < 30) throw new Error('Model directory unexpectedly empty');
const models = data.filter(m => !m.id.startsWith('cohere/')).map(({ id, name }) => ({ id, name }));
await writeFile(new URL('../src/model-snapshot.json', import.meta.url), JSON.stringify({ source, fetchedAt: new Date().toISOString(), models }));
console.log(`Saved ${models.length} models. Review curated versions in src/models.js; run tests before release.`);
