// weekly layer: literature anchors, diminishing returns, recovery limit
const test = require('node:test'), assert = require('node:assert/strict');
const M = require('./load')(1);

test('slope at the mean volume equals the published marginal slope', () => {
  const s = M.cfg.volMeanSets, per = M.cfg.volWeeks, h = 0.01;
  const slope = (M.sizeGain(s + h, per) - M.sizeGain(s - h, per)) / (2 * h);
  assert.ok(Math.abs(slope - M.cfg.volSlope) < 1e-3, slope);
});
test('zero sets gives zero gain, gain rises with sets, returns diminish', () => {
  assert.equal(M.sizeGain(0, 12), 0);
  const g = s => M.sizeGain(s, 12);
  assert.ok(g(8) > g(4) && g(16) > g(8));
  assert.ok(g(8) - g(4) > g(20) - g(16));
});
test('gain scales linearly with weeks', () => {
  assert.ok(Math.abs(M.sizeGain(10, 24) - 2 * M.sizeGain(10, 12)) < 1e-9);
});
test('leftover damage costs dose, more at higher frequency, none for an undamaging session', () => {
  const lost = pw => M.projectWeeks({hardSets: 4, dmg: 0.3}, pw, 12).lost;
  assert.ok(lost(1) < lost(3) && lost(3) < lost(7));
  assert.equal(M.projectWeeks({hardSets: 4, dmg: 0}, 7, 12).lost, 0);
});
test('no hard sets projects nothing', () => {
  const r = M.projectWeeks({hardSets: 0, dmg: 0.2}, 3, 12);
  assert.equal(r.gain, 0); assert.equal(r.lost, 0);
});
