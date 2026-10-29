import test from 'node:test';
import assert from 'node:assert/strict';
import { nextGuide } from '../src/guidance.js';
import { newGame, transition } from '../src/engine.js';

test('first-day guidance follows real actions without modifying the save', () => {
  let s = newGame('coder', 42);
  const before = JSON.stringify(s);
  assert.equal(nextGuide(s).id, 'work');
  assert.equal(JSON.stringify(s), before);
  s = transition(s, { type: 'action', id: 'work' }).state;
  assert.equal(nextGuide(s).id, 'rest');
  s = transition(s, { type: 'action', id: 'rest' }).state;
  assert.equal(nextGuide(s).ui, 'end-day');
});
test('guidance keeps an existing project reachable and day 40 manually finishable', () => {
  const s = newGame('coder', 42);
  s.project = { progress: 3, need: 3, change: 'pending' }; s.ap = 0;
  assert.equal(nextGuide(s).ui, 'projects');
  s.project.change = 'accepted';
  assert.equal(nextGuide(s).id, 'deliver');
  s.project = null; s.day = 40; s.ap = 2;
  assert.equal(nextGuide(s).ui, 'finish');
});
