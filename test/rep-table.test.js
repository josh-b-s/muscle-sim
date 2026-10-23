// reps to failure vs load, 220 fibres, 50% fast, mean over seeds. the expected values are the
// model's own table in the README, so this catches drift; "tables" is the approximate
// reference, and the gap to it is pinned so it cannot quietly grow
const test = require('node:test'), assert = require('node:assert/strict');
const {muscle, runSet, mean} = require('./helpers');

const SEEDS = [1, 2, 3];
const CASES = [ // load %, model reps (README), reference-table reps
  [95, 1, 2], [85, 4, 6], [70, 10, 12], [60, 16, 17], [50, 22, 22]
];
for (const [load, expected, table] of CASES) {
  test(`reps at ${load}% stay near ${expected}`, () => {
    const reps = mean(SEEDS.map(s => { const {m} = muscle(s); return runSet(m, load / 100); }));
    assert.ok(Math.abs(reps - expected) <= Math.max(1, expected * 0.2), `got ${reps}, expected ${expected}`);
    assert.ok(table - reps <= Math.max(1, table * 0.35), `gap to the rep table grew: ${reps} vs ${table}`);
  });
}
test('reps at 30% stay near 45', () => {
  const {m} = muscle(1);
  const reps = runSet(m, 0.3);
  assert.ok(reps >= 38 && reps <= 52, `got ${reps}`);
});
