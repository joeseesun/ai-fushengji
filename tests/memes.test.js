import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, transition, getEvent, parseSave, isValidSave, actionInfo } from '../src/engine.js';
import { EVENTS } from '../src/content.js';
import { MEME_EVENTS, FOLLOWUPS, MEME_CATALOG, rheostat } from '../src/memes.js';
import { MODELS, PROFILES } from '../src/models.js';
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
  for (const id of ['b300', 'rtx']) for (const key of ['prices', 'previousPrices', 'history', 'inventory']) delete s[key][id];
  const next = parseSave(JSON.stringify(s)); assert.ok(next); assert.equal(next.rng, s.rng);
  assert.equal(next.cash, s.cash); assert.equal(next.prices.compute, s.prices.compute);
  assert.equal(next.inventory.b300.qty, 0); assert.equal(next.model, null);
  assert.equal(next.eventDeck.length, EVENTS.length);
});
test('all verified models can be hired; contracts cost game money, expire and never auto-renew', () => {
  assert.ok(MODELS.length >= 30); assert.ok(!MODELS.some(m => /command|cohere/i.test(`${m.id} ${m.name}`)));
  for (const m of MODELS) {
    const s = ready(4); s.event = null; const p = PROFILES[m.profile];
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
  assert.equal(s.event, 'router-launch'); assert.equal(s.history.b300.at(-1), s.prices.b300);
  const restored = parseSave(JSON.stringify(s)); assert.deepEqual(restored.prices, s.prices);
  assert.ok(!getEvent(s).title.includes('{model}'));
});
