// headless set runner shared by the tests
const load = require('./load');

const muscle = (seed, n = 220, fast = 0.5) => { const M = load(seed); return {M, m: new M.Muscle(n, fast)}; };
// one dynamic set to failure at a fraction of 1RM; returns reps
const runSet = (m, frac, cadence = 0.45) => {
  m.startSet(true);
  for (let t = 0; t < 400 && !m.failed; t += 0.1) m.step(0.1, frac, true, 1, cadence);
  return m.reps;
};
const rest = (m, seconds) => { for (let t = 0; t < seconds; t += 0.1) m.step(0.1, 0, false, 1, 0.45); };
const mean = a => a.reduce((s, v) => s + v, 0) / a.length;

module.exports = {muscle, runSet, rest, mean};
