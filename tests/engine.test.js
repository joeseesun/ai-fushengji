import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, transition, getEvent, usedSpace, isValidSave, parseSave, salePrice, inventoryValue, actionInfo, dailyCost, dailyInterest, productIncome, endingFor, shareText } from '../src/engine.js';
import { GOODS, EVENTS, MILESTONES } from '../src/content.js';

const ready = (seed = 42) => transition(newGame('coder', seed), { type: 'choose', index: 0 }).state;
const act = (s, command) => { const r = transition(s, command); assert.equal(r.error, null, r.error); return r.state; };

test('deterministic seeds, RNG persisted, no re-roll on reload', () => {
  const a = newGame('coder', 123), b = newGame('coder', 123);
  assert.deepEqual(a, b);
  const restored = parseSave(JSON.stringify(a));
  assert.deepEqual(restored, a);
  const next = s => act(act(s, { type: 'choose', index: 0 }), { type: 'travel', location: 'home' });
  assert.deepEqual(next(a), next(restored));
  assert.notDeepEqual(a.prices, newGame('coder', 124).prices);
});
test('pending events block trading, travel, repayment and work', () => {
  const s = newGame();
  for (const c of [{ type: 'buy', id: 'prompt', qty: 1 }, { type: 'travel', location: 'home' }, { type: 'repay', amount: 1 }, { type: 'action', id: 'work' }]) {
    const r = transition(s, c); assert.ok(r.error); assert.equal(r.state, s);
  }
});
test('a same-day round trip loses only the spread, conserving holdings and AP', () => {
  const s = ready(), amount = 3;
  const bought = act(s, { type: 'buy', id: 'prompt', qty: amount });
  assert.equal(bought.cash, s.cash - s.prices.prompt * amount);
  assert.equal(usedSpace(bought), amount); assert.equal(bought.ap, 2);
  const sold = act(bought, { type: 'sell', id: 'prompt', qty: amount });
  assert.equal(sold.cash, s.cash - (s.prices.prompt - salePrice(s, 'prompt')) * amount);
  assert.deepEqual(sold.inventory.prompt, { qty: 0, cost: 0 });
  assert.equal(sold.tradeProfit, sold.cash - s.cash);
  assert.ok(isValidSave(sold));
});
test('invalid quantities, inventory overflow and overspending are atomic', () => {
  const s = ready();
  for (const qty of [0, -1, .5, NaN, Infinity, '1', 1001]) {
    const r = transition(s, { type: 'buy', id: 'prompt', qty }); assert.ok(r.error); assert.equal(r.state, s);
  }
  for (const command of [{ type: 'sell', id: 'prompt', qty: 1 }, { type: 'buy', id: 'model', qty: 18 }, { type: 'buy', id: 'missing', qty: 1 }, { type: 'action', id: 'missing' }]) assert.equal(transition(s, command).state, s);
  s.cash = 1e5;
  assert.equal(transition(s, { type: 'buy', id: 'prompt', qty: 19 }).state, s);
});
test('partial sales preserve exact total book cost after liquidation', () => {
  let s = ready(); s.cash = 1e5;
  s = act(s, { type: 'buy', id: 'prompt', qty: 7 });
  s.prices.prompt += 13;
  s = act(s, { type: 'buy', id: 'prompt', qty: 4 });
  const totalCost = s.inventory.prompt.cost, sale = salePrice(s, 'prompt');
  for (let i = 0; i < 11; i++) s = act(s, { type: 'sell', id: 'prompt', qty: 1 });
  assert.equal(s.inventory.prompt.cost, 0); assert.equal(s.tradeProfit, sale * 11 - totalCost);
});
test('exactly two actions per day and resting really restores health', () => {
  let s = ready(); const start = s;
  s = act(s, { type: 'action', id: 'work' });
  assert.equal(s.ap, 1); assert.ok(s.cash > start.cash); assert.ok(s.health < start.health);
  s = act(s, { type: 'action', id: 'rest' });
  assert.equal(s.ap, 0); assert.ok(s.health > start.health); assert.ok(s.stress < start.stress);
  assert.equal(transition(s, { type: 'action', id: 'work' }).state, s);
});
test('repayment reduces compound interest immediately and can never mint cash', () => {
  let s = ready(); s = act(s, { type: 'repay', amount: 2000 });
  assert.equal(s.cash, 1000); assert.equal(s.debt, 6000);
  for (const amount of [-1, 0, 1001, Infinity]) assert.equal(transition(s, { type: 'repay', amount }).state, s);
  const next = act(s, { type: 'travel', location: 'home' });
  assert.equal(next.debt, 6000 + Math.ceil(6000 * .018));
  assert.equal(next.cash, 1000 - dailyCost(s)); assert.equal(next.ap, 2); assert.equal(next.day, 2);
});
test('daily shortages are added to debt without negative cash', () => {
  let s = ready(); s.cash = 0;
  const next = act(s, { type: 'travel', location: 'home' });
  assert.equal(next.cash, 0); assert.equal(next.debt, s.debt + dailyCost(s) + dailyInterest(s));
  assert.equal(next.receipts[0].shortage, dailyCost(s)); assert.ok(isValidSave(next));
});
test('product requires skill, money and three actions, earns only on day end', () => {
  let s = ready(); s.cash = 10000; s.debt = 0;
  const before = s.cash;
  s = act(s, { type: 'action', id: 'build' }); s = act(s, { type: 'action', id: 'build' });
  assert.equal(s.products, 0); assert.equal(s.progress, 2); assert.equal(s.cash, before - 520);
  s = act(s, { type: 'travel', location: 'home' }); s = safeEvent(s);
  s = act(s, { type: 'action', id: 'build' }); assert.equal(s.products, 1); assert.equal(s.progress, 0);
  const cash = s.cash, income = productIncome(s), cost = dailyCost(s);
  const next = act(s, { type: 'travel', location: 'home' }); assert.equal(next.cash, cash + income - cost);
  s = ready(); s.skill = 19; assert.ok(transition(s, { type: 'action', id: 'build' }).error);
});
test('maintenance increases product revenue and does not underflow tech debt', () => {
  let s = ready(); s.products = 3; s.techDebt = 60; s.news = 'normal';
  const income = productIncome(s); s = act(s, { type: 'action', id: 'maintain' });
  assert.ok(productIncome(s) > income); s.techDebt = 1; s = act(s, { type: 'action', id: 'maintain' }); assert.equal(s.techDebt, 0);
});
test('credit is rate limited and is debt, not earned income', () => {
  const s = ready(), b = act(s, { type: 'borrow' });
  assert.equal(b.cash - s.cash, 1500); assert.equal(b.debt - s.debt, 1500); assert.equal(b.totalEarned, s.totalEarned);
  assert.ok(transition(b, { type: 'borrow' }).error);
});
test('unaffordable event choices and double submission do not mutate state', () => {
  let s = ready(); s.event = 'course'; s.cash = 100;
  const r = transition(s, { type: 'choose', index: 0 }); assert.ok(r.error); assert.equal(r.state, s);
  s = act(s, { type: 'choose', index: 1 }); assert.equal(s.event, null);
  assert.ok(transition(s, { type: 'choose', index: 1 }).error);
});
test('death and burnout stop every subsequent action', () => {
  let s = ready(); s.health = 4; s = act(s, { type: 'action', id: 'work' });
  assert.equal(s.status, 'ended'); assert.equal(s.ending.id, 'health'); assert.ok(isValidSave(s));
  assert.equal(transition(s, { type: 'action', id: 'rest' }).state, s);
  s = ready(); s.stress = 95; s = act(s, { type: 'action', id: 'rush' });
  assert.equal(s.status, 'ended'); assert.equal(s.ending.id, 'burnout'); assert.ok(isValidSave(s));
});
test('day 40 still has actions; final settlement bills once, sells at bid, pays debts', () => {
  let s = ready(); s.day = 40; s.cash = 1500; s.debt = 200; s.inventory.prompt = { qty: 3, cost: 300 };
  const cash = s.cash, value = inventoryValue(s), bill = dailyCost(s), interest = dailyInterest(s);
  assert.ok(transition(s, { type: 'travel', location: 'home' }).error);
  assert.equal(transition(s, { type: 'action', id: 'rest' }).state.ap, 1);
  s = act(s, { type: 'finish' });
  assert.equal(s.cash, cash + value - bill - 200 - interest); assert.equal(s.debt, 0); assert.equal(usedSpace(s), 0);
  assert.equal(s.receipts.length, 1); assert.equal(transition(s, { type: 'finish' }).state, s); assert.ok(isValidSave(s));
});
test('every event has a zero-cost way forward and unique identity', () => {
  const list = [...EVENTS, ...Object.values(MILESTONES)];
  assert.equal(new Set(list.map(e => e.id)).size, list.length);
  for (const e of list) assert.ok(e.options.some(o => (o.effects.cash ?? 0) >= 0), e.id);
});
test('bad saves fail closed while real saves resume', () => {
  assert.equal(parseSave('{'), null); assert.equal(parseSave('null'), null); assert.equal(parseSave('{}'), null);
  for (const mutate of [s => s.cash = -1, s => s.health = 999, s => s.rng = 0, s => s.inventory.prompt.qty = 1000, s => s.event = 'bogus', s => s.eventDeck[0] = 'bogus', s => s.history.prompt = null, s => s.journal = [{}], s => s.prices.prompt = 0, s => s.ap = 3]) {
    const s = ready(); mutate(s); assert.equal(parseSave(JSON.stringify(s)), null);
  }
  assert.ok(parseSave(JSON.stringify(ready())));
});
test('different earned endings are reachable and share card describes the actual run', () => {
  const s = ready(); s.day = 40; s.debt = 0; s.health = 90; s.stress = 20;
  assert.equal(endingFor(s).id, 'human'); s.products = 3; s.reputation = 50;
  assert.equal(endingFor(s).id, 'company'); s.health = 30; s.cash = 30000;
  assert.equal(endingFor(s).id, 'rich'); assert.match(shareText(s), /第 40 \/ 40 天/);
});

function safeEvent(s) {
  const e = getEvent(s); if (!e) return s;
  const options = e.options.map((o, i) => ({ i, o })).filter(({ o }) => s.cash + (o.effects.cash ?? 0) >= 0);
  options.sort((a, b) => score(b.o) - score(a.o));
  return act(s, { type: 'choose', index: options[0].i });
}
const score = o => (o.effects.cash ?? 0) / 130 + (o.effects.health ?? 0) * 1.5 - (o.effects.stress ?? 0) * 1.5 + (o.effects.reputation ?? 0) * .7 + (o.effects.skill ?? 0) * .7 - (o.effects.techDebt ?? 0) * .5;

test('100 complete seeded games preserve numeric and save invariants after every command', () => {
  let survivors = 0, cleared = 0;
  for (let seed = 1; seed <= 100; seed++) {
    let s = newGame('coder', seed);
    while (s.status === 'playing') {
      s = safeEvent(s); assert.ok(isValidSave(s), `event seed ${seed}`);
      if (s.status === 'ended') break;
      while (s.ap && s.status === 'playing') {
        const action = s.health < 70 || s.stress > 35 ? 'rest' : 'work';
        s = act(s, { type: 'action', id: action }); assert.ok(isValidSave(s), `action seed ${seed}`);
      }
      if (s.status === 'ended') break;
      const repayment = Math.min(s.debt, Math.max(0, s.cash - 800));
      if (repayment) s = act(s, { type: 'repay', amount: repayment });
      s = act(s, s.day === 40 ? { type: 'finish' } : { type: 'travel', location: s.health < 65 ? 'home' : 'jobs' });
      assert.ok(isValidSave(s), `day seed ${seed}`); assert.ok(s.cash >= 0); assert.ok(s.debt >= 0);
    }
    survivors += s.day === 40; cleared += s.debt === 0;
  }
  assert.equal(survivors, 100, 'a conservative work/rest policy should be viable');
  assert.ok(cleared >= 90, `debt cleared ${cleared}/100`);
});
