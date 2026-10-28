import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, transition, parseSave, isValidSave, getNews, getEvent, dailyInterest } from '../src/engine.js';
import { NEWS, GOODS } from '../src/content.js';
import { NEWS_EDITIONS, NEWS_SOURCES } from '../src/news.js';

const act = (s, command) => { const r = transition(s, command); assert.equal(r.error, null); return r.state; };
const skipEvent = s => { s.event = null; return s; };
test('100 distinct editions retain their market theme and use existing art / valid sources', () => {
  assert.equal(NEWS_EDITIONS.length, 100);
  assert.equal(new Set(NEWS_EDITIONS.map(e => e.id)).size, 100);
  assert.equal(new Set(NEWS_EDITIONS.map(e => e.title)).size, 100);
  assert.equal(new Set(NEWS_EDITIONS.map(e => e.comment)).size, 100);
  for (const e of NEWS_EDITIONS) {
    const theme = NEWS.find(n => n.id === e.topic);
    assert.ok(theme); assert.ok(e.title.length <= 64); assert.ok(e.comment.length <= 100);
    assert.ok(!e.source || NEWS_SOURCES[e.source]?.url.startsWith('https://'));
    assert.ok(Object.keys(theme.factors).every(id => GOODS.some(g => g.id === id)));
  }
});
test('40-day news never repeats, respects topic cooldown and varies between runs', () => {
  const openings = new Set(), day8 = new Set();
  for (let seed = 1; seed <= 100; seed++) {
    let s = newGame('coder', seed); const titles = [], topics = [];
    openings.add(getNews(s).title);
    for (let day = 1; day <= 40; day++) {
      const news = getNews(s);
      assert.ok(!titles.includes(news.title), `seed ${seed} day ${day}`);
      assert.ok(!topics.slice(-3).includes(news.id), `topic cooldown: ${seed}/${day}`);
      const base = NEWS.find(n => n.id === news.id);
      assert.deepEqual(news.factors, base.factors); assert.equal(news.product, base.product);
      assert.ok(isValidSave(s));
      const resumed = parseSave(JSON.stringify(s));
      assert.deepEqual(resumed, s); assert.deepEqual(getNews(resumed), news);
      titles.push(news.title); topics.push(news.id);
      if (day === 8) { assert.equal(news.id, 'free'); day8.add(news.title); }
      if (day === 16) assert.equal(news.id, 'data');
      if (day === 24) assert.equal(news.id, 'enterprise');
      if (day === 32) assert.equal(news.id, 'human');
      if (day === 40) break;
      // Isolate news generation from survival choices while using the real travel path.
      s.cash = 100000; s.health = 100; s.stress = 0; s.debt = 0; s.event = null;
      s = act(s, { type: 'travel', location: 'home' });
    }
    assert.equal(s.newsSeen.length, 40);
  }
  assert.ok(openings.size > 30); assert.equal(day8.size, 5);
});
test('v4 saves keep original headline, quotes and RNG; new news draws only on travel', () => {
  const s = newGame('coder', 97); s.version = 4; delete s.newsEdition; delete s.newsSeen;
  const loaded = parseSave(JSON.stringify(s));
  assert.ok(loaded); assert.equal(getNews(loaded).title, NEWS.find(n => n.id === s.news).title);
  for (const key of ['rng', 'cash', 'debt', 'day']) assert.equal(loaded[key], s[key]);
  for (const key of ['prices', 'inventory', 'history']) assert.deepEqual(loaded[key], s[key]);
  const again = parseSave(JSON.stringify(loaded)); assert.deepEqual(again, loaded);
  const next = act(skipEvent(loaded), { type: 'travel', location: 'home' });
  assert.notEqual(next.newsEdition, loaded.newsEdition);
});
test('malformed or mismatched news history fails closed', () => {
  const s = newGame('coder', 3);
  for (const fields of [{ newsSeen: null }, { newsSeen: [] }, { newsEdition: 'missing' }, { newsSeen: [s.newsEdition, s.newsEdition] }, { newsSeen: ['missing'] }, { news: NEWS.find(n => n.id !== s.news).id }]) {
    assert.equal(parseSave(JSON.stringify({ ...s, ...fields })), null);
  }
});
test('Claw installment branches and Token loan change debt transparently and persist their sequels', () => {
  let s = newGame('coder', 42); s.day = 25; s.event = 'claw-mini'; s.seen.push('claw-mini');
  const bought = act(s, { type: 'choose', index: 0 });
  assert.equal(bought.debt, s.debt + 4800); assert.equal(bought.cash, s.cash);
  assert.ok(dailyInterest(bought) > dailyInterest(s)); assert.deepEqual(parseSave(JSON.stringify(bought)), bought);
  assert.ok(bought.followups.some(f => f.id === 'claw-token-bill' && f.day === 28));
  const cheap = act(s, { type: 'choose', index: 1 });
  assert.equal(cheap.cash, s.cash - 180); assert.equal(cheap.debt, s.debt);
  assert.ok(cheap.followups.some(f => f.id === 'claw-budget-win'));
  const declined = act(s, { type: 'choose', index: 2 }); assert.equal(declined.debt, s.debt); assert.equal(declined.followups.length, 0);
  const broke = { ...s, cash: 0 }; assert.equal(transition(broke, { type: 'choose', index: 1 }).state, broke);
  assert.equal(transition(declined, { type: 'choose', index: 0 }).state, declined);
  let later = bought;
  while (later.day < 29) { later = act(skipEvent(later), { type: 'travel', location: 'home' }); }
  assert.equal(later.event, 'claw-token-bill');
  const loan = act(later, { type: 'choose', index: 0 });
  assert.equal(loan.debt, later.debt + 1800); assert.equal(loan.cash, later.cash);
  assert.ok(loan.followups.some(f => f.id === 'claw-credit-after'));
  assert.deepEqual(parseSave(JSON.stringify(loan)), loan);
  let after = loan; while (after.day < 31) after = act(skipEvent(after), { type: 'travel', location: 'home' });
  assert.equal(after.event, 'claw-credit-after');
  const independent = { ...s, event: 'token-loan' };
  const cashLoan = act(independent, { type: 'choose', index: 0 });
  assert.equal(cashLoan.cash - independent.cash, 1200); assert.equal(cashLoan.debt - independent.debt, 1800);
  assert.ok(getEvent(independent).options.some(o => !o.effects.debt && (o.effects.cash ?? 0) >= 0));
});
