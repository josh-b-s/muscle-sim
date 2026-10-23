// set-to-set behaviour: 70% load, 90 s rest, three sets to failure (about 9/5/3)
const test = require('node:test'), assert = require('node:assert/strict');
const {muscle, runSet, rest, mean} = require('./helpers');

const run = seed => {
  const {M, m} = muscle(seed), reps = [], tut = [];
  for (let i = 0; i < 3; i++) { reps.push(runSet(m, 0.7)); tut.push(M.summarise(m.fibres).fast.effReps); rest(m, 90); }
  return {reps, tut};
};
const runs = [1, 2, 3].map(run);

test('reps fall across sets, roughly 9 / 5 / 3', () => {
  const [a, b, c] = [0, 1, 2].map(i => mean(runs.map(r => r.reps[i])));
  assert.ok(a >= 8 && a <= 11, `set 1: ${a}`);
  assert.ok(b >= 4 && b <= 6.5, `set 2: ${b}`);
  assert.ok(c >= 2 && c <= 5, `set 3: ${c}`);
  assert.ok(a > b && b > c);
});
test('later sets still add effective reps (the old score saturated at set 1)', () => {
  for (const r of runs) assert.ok(r.tut[1] > r.tut[0] && r.tut[2] > r.tut[1], r.tut.join(','));
});
