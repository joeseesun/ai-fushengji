import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, transition, projectOffers, projectChoice, parseSave, commandRisk, netWorth } from '../src/engine.js';
import { cleanCommand } from '../src/run-proof.js';

const act = (s, command) => {
  const r = transition(s, command); assert.equal(r.error, null, r.error);
  assert.deepEqual(parseSave(JSON.stringify(r.state)), r.state);
  return r.state;
};
const project = (s, id) => act(s, { type: 'project', id });
const night = s => act(s, { type: 'travel', location: s.location });
const pending = () => night(project(project(project(newGame('coder', 42), 'take-0'), 'steady'), 'steady'));

test('offer browsing is pure; signing earns nothing and allows only one project', () => {
  const s = newGame('coder', 42), before = structuredClone(s);
  assert.deepEqual(projectOffers(s), projectOffers(s)); assert.deepEqual(s, before);
  assert.deepEqual(projectOffers({ ...s, items: { bowl: 2 } }), projectOffers(s), 'one-use work items cannot inflate every project quote for free');
  const accepted = project(s, 'take-0');
  assert.equal(accepted.cash, s.cash); assert.equal(accepted.ap, s.ap); assert.equal(accepted.rng, s.rng);
  const invalid = transition(accepted, { type: 'project', id: 'take-1' });
  assert.ok(invalid.error); assert.equal(invalid.state, accepted);
  assert.deepEqual(cleanCommand({ type: 'project', id: 'steady', reward: 99999 }), { type: 'project', id: 'steady' });
});

test('cross-day scope choice and real work precede a single payment', () => {
  let s = pending();
  assert.equal(s.day, 2); assert.equal(s.project.progress, 2); assert.equal(s.project.change, 'pending');
  for (const id of ['steady', 'deliver', 'reuse', 'negotiate']) {
    const r = transition(s, { type: 'project', id }); assert.ok(r.error); assert.equal(r.state, s);
  }
  const initial = s.project.reward;
  s = project(s, 'trim'); assert.equal(s.project.reward, Math.round(initial * .8));
  const cash = s.cash; s = project(s, 'steady'); assert.equal(s.cash, cash - 80);
  const reward = s.project.reward, before = s.cash;
  s = project(s, 'deliver'); assert.equal(s.cash, before + reward); assert.equal(s.projectsDone, 1); assert.equal(s.project, null);
  const duplicate = transition(s, { type: 'project', id: 'deliver' }); assert.ok(duplicate.error); assert.equal(duplicate.state, s);
  assert.equal(projectOffers(s).length, 2); // A new day permits one new commitment.
});

test('trust negotiates more time and pay; skill or a product absorbs scope', () => {
  const s = pending(), original = structuredClone(s.project);
  s.reputation = 40;
  const negotiated = project(s, 'negotiate');
  assert.equal(negotiated.project.due, original.due + 1);
  assert.equal(negotiated.project.need, original.need + 1);
  assert.equal(negotiated.project.reward, Math.round(original.reward * 1.2));
  s.skill = 40;
  const reused = project(s, 'reuse'); assert.equal(reused.project.need, original.need); assert.equal(reused.project.reward, original.reward);
  s.skill = 14; s.products = 1; assert.equal(project(s, 'reuse').project.change, 'reuse');
  s.project.due = 40; assert.match(projectChoice(s, 'negotiate').reason, /无法再延期/);
});

test('risky progress uses visible odds, checks funds atomically and preserves replay', () => {
  let s = project(newGame('coder', 17), 'take-1');
  s.stress = 60; const rng = s.rng;
  assert.equal(projectChoice(s, 'rush').outcomes[1].weight, 45);
  assert.equal(s.rng, rng);
  assert.deepEqual(transition(s, { type: 'project', id: 'rush' }), transition(parseSave(JSON.stringify(s)), { type: 'project', id: 'rush' }));
  assert.equal(projectChoice(s, 'rush').effects.techDebt, 2);
  const worker = project(newGame('worker', 42), 'take-0'); worker.perks = ['headphones'];
  assert.equal(projectChoice(worker, 'steady').effects.stress, 2);
  s.cash = 79;
  const failed = transition(s, { type: 'project', id: 'steady' });
  assert.ok(failed.error); assert.equal(failed.state, s); assert.equal(s.rng, rng);
  s.cash = 1000; s.stress = 84;
  assert.equal(commandRisk(s, { type: 'project', id: 'rush' }).probability, 60);
});

test('an ignored scope request does not lock other play; deadline forfeits once and warns', () => {
  let s = pending();
  s = act(s, { type: 'action', id: 'rest' });
  s = act(s, { type: 'repay', amount: 1 });
  s = night(s); assert.equal(s.day, 3); assert.ok(s.project);
  s.stress = 90;
  assert.equal(commandRisk(s, { type: 'travel', location: s.location }).probability, 100);
  s.stress = 20;
  const rep = s.reputation; s = night(s); assert.equal(s.project, null); assert.equal(s.reputation, rep - 6);
  const cleared = s.reputation; s = night(s); assert.equal(s.reputation, cleared);
});

test('late-game projects can deliver on day 40; unfinished work is not auto-paid', () => {
  let s = newGame('coder', 42); s.day = 38; s.health = 100;
  s = project(s, 'take-0'); s = project(s, 'steady'); s = project(s, 'steady');
  s = night(s); s.skill = 40; s = project(s, 'reuse'); s = project(s, 'steady');
  const unfinished = night(s); assert.equal(unfinished.day, 40);
  assert.equal(projectOffers(unfinished).length, 0);
  const delivered = project(unfinished, 'deliver'); assert.equal(delivered.project, null);
  const ended = act(unfinished, { type: 'finish' }); assert.equal(ended.project, null); assert.equal(ended.projectsDone, 0);
  assert.ok(netWorth(ended) < netWorth(delivered));
});

test('v10 saves migrate without changing balances, market or RNG; bad projects are rejected', () => {
  const old = newGame('creator', 99); old.version = 10;
  delete old.project; delete old.projectDay; delete old.projectsDone;
  const loaded = parseSave(JSON.stringify(old));
  assert.equal(loaded.rng, old.rng); assert.equal(loaded.cash, old.cash); assert.deepEqual(loaded.prices, old.prices);
  assert.equal(loaded.project, null); assert.equal(loaded.proof, null);
  const invalid = project(newGame('worker', 33), 'take-0'); invalid.project.progress = 999;
  assert.equal(parseSave(JSON.stringify(invalid)), null);
});
