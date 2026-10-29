import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, actionInfo, transition, parseSave, activeVips, upcomingVips, SAVE_KEY } from '../src/engine.js';
import { SLOTS_KEY, readSlots, writeSlots } from '../src/saves.js';

test('capability and trust unlock better offers and change delivery risks', () => {
  const s = newGame('coder', 42);
  s.skill = 39; s.reputation = 29;
  const basic = actionInfo(s, 'work'), debt = actionInfo(s, 'rush').effects.techDebt;
  s.skill = 40;
  assert.match(actionInfo(s, 'work').name, /专业单/);
  assert.ok(actionInfo(s, 'work').effects.cash > basic.effects.cash);
  assert.equal(actionInfo(s, 'rush').effects.techDebt, debt - 2);
  s.reputation = 30;
  assert.equal(actionInfo(s, 'work').outcomes.find(o => o.id === 'stiffed').weight, 5);
  s.reputation = 60; s.skill = 60;
  assert.match(actionInfo(s, 'work').name, /专家单/);
  assert.equal(actionInfo(s, 'work').outcomes.find(o => o.id === 'stiffed').weight, 0);
});

test('stress increases rush risk without rerolling inspection; resting reverses it', () => {
  const s = newGame('coder', 91), rng = s.rng;
  for (const [stress, odds] of [[24, 15], [50, 25], [70, 35]]) {
    s.stress = stress;
    const a = actionInfo(s, 'rush');
    assert.equal(a.outcomes.find(o => o.id === 'spaghetti').weight, odds);
    assert.equal(a.outcomes.reduce((n, o) => n + o.weight, 0), 100);
    assert.equal(s.rng, rng);
  }
  s.stress = 50;
  const result = transition(s, { type: 'action', id: 'rest' });
  assert.equal(result.error, null);
  assert.ok(result.state.stress < 50);
});

test('VIP preview, quiet days and one-day departure are deterministic', () => {
  let s = newGame('worker', 42);
  assert.equal(activeVips(s).length, 0);
  assert.equal(upcomingVips(s).length, 0);
  // Bounded seven-day scenario; this is not a full campaign simulation.
  while (s.day < 7) {
    const before = s;
    const result = transition(s, { type: 'travel', location: 'home' });
    assert.equal(result.error, null); s = result.state;
    if (s.day === 3) assert.equal(upcomingVips(s)[0].from, 4);
    if (s.day === 4) assert.equal(activeVips(s)[0].until, 4);
    if (s.day === 5) assert.equal(activeVips(s).length, 0);
    assert.deepEqual(parseSave(JSON.stringify(s)), s);
    assert.deepEqual(transition(before, { type: 'travel', location: 'home' }).state, s);
  }
});

test('legacy migration and independent slots preserve RNG, quotes and progress', () => {
  const old = newGame('creator', 19); old.version = 9;
  const memory = new Map([[SAVE_KEY, JSON.stringify(old)]]);
  const storage = { getItem: k => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, v) };
  const library = readSlots(storage), first = library.slots[0].state;
  assert.equal(first.rng, old.rng); assert.deepEqual(first.prices, old.prices);
  assert.equal(first.cash, old.cash); assert.equal(first.proof, null);
  const second = newGame('grad', 31);
  library.slots.push({ id: 'second', state: second }); library.active = 'second';
  writeSlots(storage, library);
  const loaded = readSlots(storage);
  assert.deepEqual(loaded.slots[0].state, first);
  assert.deepEqual(loaded.slots[1].state, second);
  assert.equal(memory.get(SAVE_KEY), JSON.stringify(old));
  memory.set(SLOTS_KEY, '{broken');
  assert.throws(() => readSlots(storage));
  assert.equal(memory.get(SLOTS_KEY), '{broken');
});
