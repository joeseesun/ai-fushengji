import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, transition, getEvent, parseSave, isValidSave, actionInfo } from '../src/engine.js';
import { EVENTS } from '../src/content.js';
import { MEME_EVENTS, FOLLOWUPS, MEME_CATALOG, rheostat } from '../src/memes.js';
import { MODELS } from '../src/models.js';
const act = (s, c) => { const r = transition(s, c); assert.equal(r.error, null); return r.state; };
const ready = seed => act(newGame('coder', seed), { type: 'choose', index: 0 });

test('meme sources, positive risk weights and free choices remain usable', () => {
  assert.equal(new Set(MEME_CATALOG.map(e => e.id)).size, MEME_CATALOG.length);
  for (const e of [...EVENTS, ...FOLLOWUPS]) {
    assert.ok(e.options.some(o => (o.effects.cash ?? 0) >= 0), e.id);
    for (const o of e.options.filter(o => o.outcomes)) {
      assert.equal(o.outcomes.reduce((n, r) => n + r.weight, 0), 100);
      assert.ok(o.outcomes.every(r => r.weight > 0 && (r.effects.cash ?? 0) >= 0));
    }
  }
});
test('risk outcomes consume persistent RNG once and survive reload without reroll', () => {
  const s = ready(75); s.event = 'leather-jacket';
  const a = act(s, { type: 'choose', index: 0 });
  const b = act(parseSave(JSON.stringify(s)), { type: 'choose', index: 0 });
  assert.deepEqual(a, b); assert.notEqual(a.rng, s.rng);
  assert.ok([s.cash - 200, s.cash + 1600].includes(a.cash));
  assert.equal(transition(a, { type: 'choose', index: 0 }).state, a);
});
test('slider has three gameplay bands; invalid positions do not alter state', () => {
  const s = ready(3); s.event = 'rheostat';
  for (const stance of [0, 34, 67, 100]) {
    const next = act(s, { type: 'choose', index: 0, stance });
    for (const [k, n] of Object.entries(rheostat(stance).effects)) assert.equal(next[k], s[k] + n);
    assert.equal(next.ap, s.ap); assert.equal(next.stance, stance);
  }
  for (const stance of [-1, 101, NaN, '90']) assert.equal(transition(s, { type: 'choose', index: 0, stance }).state, s);
});
test('feeding fish schedules a sequel which waits through fixed storyline days', () => {
  let s = ready(6); s.day = 3; s.event = 'fish-rice'; s.seen.push('fish-rice');
  s = act(s, { type: 'choose', index: 0 }); assert.deepEqual(s.followups, [{ id: 'fish-return', day: 7 }]);
  while (s.day < 10) {
    if (s.event) s = act(s, { type: 'choose', index: getEvent(s).options.findIndex(o => (o.effects.cash ?? 0) >= 0) });
    s = act(s, { type: 'travel', location: 'home' });
  }
  assert.equal(s.event, 'fish-return'); assert.ok(!s.followups.some(f => f.id === 'fish-return'));
  assert.ok(s.seen.includes('fish-return')); assert.ok(isValidSave(s));
});
test('v1 save migrates new fields and goods while preserving cash, quotes and RNG', () => {
  const s = ready(97); s.version = 1;
  for (const k of ['seen', 'followups', 'lastEvent', 'stance', 'model', 'modelUntil']) delete s[k];
  s.eventDeck = s.eventDeck.filter(id => !MEME_EVENTS.some(e => e.id === id));
  for (const id of ['claude', 'rtx']) for (const key of ['prices', 'previousPrices', 'history', 'inventory']) delete s[key][id];
  const next = parseSave(JSON.stringify(s)); assert.ok(next); assert.equal(next.rng, s.rng);
  assert.equal(next.cash, s.cash); assert.equal(next.prices.compute, s.prices.compute);
  assert.equal(next.inventory.claude.qty, 0); assert.equal(next.model, null);
  assert.equal(next.eventDeck.length, EVENTS.length);
});
test('all verified models can be hired; contracts cost game money, expire and never auto-renew', () => {
  assert.ok(MODELS.length >= 20); assert.ok(!MODELS.some(m => /command|cohere/i.test(`${m.id} ${m.name}`)));
  for (const m of MODELS) {
    const s = ready(4); s.event = null; const p = m;
    const hired = act(s, { type: 'model', id: m.id });
    assert.equal(hired.cash, s.cash - p.fee); assert.equal(hired.ap, 2);
    assert.equal(actionInfo(hired, 'work').effects.cash - actionInfo(s, 'work').effects.cash, p.work);
    assert.equal(actionInfo(hired, 'learn').effects.skill - actionInfo(s, 'learn').effects.skill, p.learn);
    assert.equal(transition(hired, { type: 'model', id: m.id }).state, hired);
    hired.day = 6;
    assert.equal(actionInfo(hired, 'work').effects.cash, actionInfo(s, 'work').effects.cash);
    assert.ok(isValidSave(hired));
  }
});
test('market shock is already in quote history and never reapplied on reload', () => {
  let s = ready(8); s.day = 11;
  s = act(s, { type: 'travel', location: 'market' });
  assert.equal(s.event, 'router-launch'); assert.equal(s.history.claude.at(-1), s.prices.claude);
  const restored = parseSave(JSON.stringify(s)); assert.deepEqual(restored.prices, s.prices);
  assert.ok(!getEvent(s).title.includes('{model}'));
});
test('black-market rumors are rare, persisted in the quote and never rerolled on reload', async () => {
  const { RUMORS } = await import('../src/content.js');
  const { priceHeat, referencePrice } = await import('../src/engine.js');
  let s = ready(11), rumorDays = 0;
  for (let day = 1; day < 39 && s.status === 'playing'; day++) {
    if (s.event) s = act(s, { type: 'choose', index: getEvent(s).options.findIndex(o => (o.effects.cash ?? 0) >= 0 && !o.stance) });
    s = act(s, { type: 'travel', location: 'home' });
    if (!s.rumor) continue;
    rumorDays++;
    const r = RUMORS.find(r => r.id === s.rumor);
    assert.equal(s.history[r.good].at(-1), s.prices[r.good]);
    assert.ok(Number.isSafeInteger(s.prices[r.good]) && s.prices[r.good] >= 8);
    assert.deepEqual(parseSave(JSON.stringify(s)).prices, s.prices);
    assert.ok(referencePrice(s, r.good) > 0 && priceHeat(s, r.good).label);
  }
  assert.ok(rumorDays > 3 && rumorDays < 30, `rumor days ${rumorDays}`);
  const bad = structuredClone(s); bad.rumor = 'made-up';
  assert.equal(isValidSave(bad), false);
});
test('price heat labels follow the ratio to the reference quote', async () => {
  const { priceHeat, referencePrice } = await import('../src/engine.js');
  const s = ready(5), ref = referencePrice(s, 'avatar');
  for (const [ratio, id] of [[2.1, 'hot'], [1.4, 'high'], [1, 'fair'], [.7, 'cheap'], [.4, 'crash']]) {
    s.prices.avatar = Math.round(ref * ratio); assert.equal(priceHeat(s, 'avatar').id, id);
  }
});
test('saves from before the new meme events load with RNG intact and the new events appended', () => {
  const s = ready(21); const fresh = new Set(['absolutely-right', 'invite-code', 'scaling-wall']);
  s.eventDeck = s.eventDeck.filter(id => !fresh.has(id)); delete s.rumor;
  const next = parseSave(JSON.stringify(s));
  assert.ok(next); assert.equal(next.rng, s.rng); assert.equal(next.rumor, null);
  assert.equal(next.eventDeck.length, EVENTS.length);
  assert.deepEqual(next.eventDeck.slice(0, s.eventDeck.length), s.eventDeck);
});
test('identities change real numbers, not only opening stats', async () => {
  const { ROLES } = await import('../src/content.js');
  const { productIncome, modelFee } = await import('../src/engine.js');
  const base = id => { const s = act(newGame(id, 9), { type: 'choose', index: 0 }); s.skill = 20; s.reputation = 20; s.location = 'market'; s.techDebt = 0; s.products = 2; return s; };
  assert.equal(ROLES.length, 5);
  assert.equal(actionInfo(base('coder'), 'work').effects.cash, Math.round(actionInfo(base('worker'), 'work').effects.cash * 1.2));
  assert.equal(actionInfo(base('coder'), 'rush').effects.techDebt, 5);
  assert.equal(actionInfo(base('worker'), 'work').effects.stress, Math.round(8 * .6));
  assert.equal(actionInfo(base('grad'), 'learn').effects.skill, actionInfo(base('worker'), 'learn').effects.skill + 4);
  assert.ok(productIncome(base('opc')) > productIncome(base('worker')));
  assert.equal(modelFee(base('grad'), MODELS[0]), MODELS[0].fee / 2);
  const creator = actionInfo(base('creator'), 'write').outcomes, worker = actionInfo(base('worker'), 'write').outcomes;
  assert.equal(creator[0].effects.cash, Math.round(worker[0].effects.cash * 1.5));
  assert.equal(creator.reduce((n, o) => n + o.weight, 0), 100);
  assert.equal(worker.reduce((n, o) => n + o.weight, 0), 100);
});
test('writing is a persisted gacha that never rerolls and keeps money non-negative', () => {
  const seen = new Set();
  for (let seed = 1; seed <= 120; seed++) {
    const s = ready(seed); s.event = null;
    const a = act(s, { type: 'action', id: 'write' });
    const b = act(parseSave(JSON.stringify(s)), { type: 'action', id: 'write' });
    assert.deepEqual(a, b); assert.equal(a.ap, s.ap - 1); assert.ok(a.cash >= 0 && a.debt >= 0);
    assert.ok(isValidSave(a)); seen.add(a.lastWrite);
  }
  assert.ok(seen.has('viral') && seen.has('hospital') && seen.has('gacha'), [...seen].join());
});
test('arrivals happen at their own station, pay listed amounts and survive reload', async () => {
  const { ARRIVALS } = await import('../src/content.js');
  const { getArrival } = await import('../src/engine.js');
  let fares = new Set();
  for (let seed = 1; seed <= 80; seed++) {
    const s = ready(seed); s.event = null;
    const next = act(s, { type: 'travel', location: 'launch' });
    if (!next.arrival) continue;
    const a = ARRIVALS.find(a => a.id === next.arrival.id);
    assert.equal(a.loc, 'launch'); assert.ok(getArrival(next).note);
    if (a.id === 'fare') { fares.add(next.arrival.amount); assert.ok(next.journal.some(j => j.kind === 'arrival')); }
    assert.deepEqual(parseSave(JSON.stringify(next)), next);
  }
  assert.deepEqual([...fares].sort((x, y) => x - y), [500, 800, 1000]);
  const bad = ready(2); bad.arrival = { id: 'fare', amount: 999 }; assert.equal(isValidSave(bad), false);
});
test('v2 saves holding retired goods are cashed out at their last quote, keeping RNG', () => {
  const s = ready(33); s.version = 2;
  for (const id of ['invite', 'claude', 'lesson']) for (const k of ['inventory', 'prices', 'previousPrices', 'history']) delete s[k][id];
  delete s.arrival; delete s.lastWrite;
  s.inventory.b300 = { qty: 2, cost: 1500 }; s.prices.b300 = 800; s.previousPrices.b300 = 780; s.history.b300 = [800];
  const next = parseSave(JSON.stringify(s));
  assert.ok(next); assert.equal(next.rng, s.rng); assert.equal(next.cash, s.cash + 720 * 2);
  assert.equal(next.inventory.b300, undefined); assert.equal(next.inventory.invite.qty, 0);
  assert.equal(next.version, 4); assert.match(next.journal[0].text, /折现/);
});
test('a save holding a contract with a retired model still loads, with the contract ended', () => {
  const s = ready(44); s.version = 2; s.model = 'stepfun/step-5-preview'; s.modelUntil = 5;
  const next = parseSave(JSON.stringify(s));
  assert.ok(next); assert.equal(next.model, null); assert.equal(next.modelUntil, 0); assert.equal(next.rng, s.rng);
});
test('every action can crit or flop with shown odds, persisted and never rerolled', async () => {
  const { ACTION_ROLLS, ACTION_FLAVOR } = await import('../src/content.js');
  const seen = {};
  for (const id of Object.keys(ACTION_ROLLS)) {
    for (let seed = 1; seed <= 150; seed++) {
      const s = ready(seed); s.event = null; s.skill = 40; s.cash = 5000; s.techDebt = 30;
      const info = actionInfo(s, id);
      assert.equal(info.outcomes.reduce((n, o) => n + o.weight, 0), 100);
      const a = act(s, { type: 'action', id }), b = act(parseSave(JSON.stringify(s)), { type: 'action', id });
      assert.deepEqual(a, b); assert.ok(isValidSave(a)); assert.ok(a.cash >= 0);
      assert.equal(a.lastAction.id, id);
      const o = info.outcomes.find(o => o.id === a.lastAction.outcome);
      if (o.effects.cash) assert.equal(a.cash, s.cash + info.effects.cash + o.effects.cash);
      if (o.id === 'normal') assert.ok(ACTION_FLAVOR[id][a.lastAction.flavor]);
      (seen[id] ??= new Set()).add(o.id);
    }
    assert.equal(seen[id].size, ACTION_ROLLS[id].length + 1, `${id}: ${[...seen[id]]}`);
  }
  const bad = ready(3); bad.lastAction = { id: 'work', outcome: 'eureka', flavor: 0 }; assert.equal(isValidSave(bad), false);
});
test('each station deals in 8 of 12 goods a day; others cannot be traded there', async () => {
  const { GOODS, OPENING_GOODS } = await import('../src/content.js');
  assert.equal(GOODS.length, 12);
  let s = ready(15); assert.deepEqual(s.available, OPENING_GOODS);
  const seen = new Set();
  for (let d = 0; d < 12; d++) {
    if (s.event) s = act(s, { type: 'choose', index: getEvent(s).options.findIndex(o => (o.effects.cash ?? 0) >= 0 && !o.stance) });
    s = act(s, { type: 'travel', location: 'market' });
    assert.equal(s.available.length, 8); s.available.forEach(id => seen.add(id));
    const away = GOODS.find(g => !s.available.includes(g.id));
    if (!s.event) assert.equal(transition(s, { type: 'buy', id: away.id, qty: 1 }).state, s);
    assert.deepEqual(parseSave(JSON.stringify(s)).available, s.available);
  }
  assert.equal(seen.size, 12);
});
test('daily quests pay out once when met, and expanding storage costs cash but no action', async () => {
  const { QUESTS } = await import('../src/content.js');
  let s = ready(19); s.event = null;
  s.quest = { id: 'cash', base: { tradeProfit: s.tradeProfit, debt: s.debt, skill: s.skill, cash: s.cash - 900, reputation: s.reputation } };
  const before = s.reputation, done = act(s, { type: 'travel', location: 'home' });
  assert.equal(done.questsDone, 1); assert.ok(done.reputation >= before + QUESTS.find(q => q.id === 'cash').reward.reputation - 2);
  assert.ok(done.journal.some(j => j.kind === 'quest'));
  const e = ready(5); e.event = null; e.cash = 5000;
  const bigger = act(e, { type: 'expand' });
  assert.equal(bigger.capacity, 28); assert.equal(bigger.ap, e.ap); assert.equal(bigger.cash, 4300);
  e.cash = 10; assert.equal(transition(e, { type: 'expand' }).state, e);
});
test('stations visited leave intel for the map, and angels drink at launch parties', () => {
  let s = ready(23); s.event = null;
  s = act(s, { type: 'travel', location: 'stream' });
  assert.equal(s.intel.stream.day, s.day); assert.ok(s.intel.market);
  s.event = null; s.location = 'launch';
  assert.equal(actionInfo(s, 'social').outcomes.find(o => o.id === 'investor').weight, 14);
  s.location = 'home';
  assert.equal(actionInfo(s, 'social').outcomes.find(o => o.id === 'investor').weight, 8);
});
test('model prices differ by model; at most two per company; v3 saves gain the new goods', async () => {
  const fees = new Set(MODELS.map(m => m.fee)); assert.ok(fees.size >= 10);
  const perCompany = {}; for (const m of MODELS) perCompany[m.id.split('/')[0]] = (perCompany[m.id.split('/')[0]] ?? 0) + 1;
  assert.ok(Object.values(perCompany).every(n => n <= 2), JSON.stringify(perCompany));
  assert.ok(!MODELS.some(m => /llama|spark-open|haiku|terra|astra|sensenova/i.test(m.id)));
  const s = ready(8); s.version = 3;
  for (const id of ['whale', 'minecard', 'deck', 'robot']) for (const k of ['inventory', 'prices', 'previousPrices', 'history']) delete s[k][id];
  for (const k of ['available', 'intel', 'quest', 'questsDone']) delete s[k];
  const next = parseSave(JSON.stringify(s));
  assert.ok(next); assert.equal(next.version, 4); assert.equal(next.rng, s.rng); assert.equal(next.inventory.robot.qty, 0); assert.equal(next.available.length, 8);
});
