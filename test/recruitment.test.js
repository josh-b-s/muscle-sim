// recruitment, damage shape and light-vs-heavy similarity near failure
const test = require('node:test'), assert = require('node:assert/strict');
const {muscle, runSet} = require('./helpers');

const recruitedShare = (M, m) => { const s = M.summarise(m.fibres); return (s.slow.recruited + s.fast.recruited) / m.fibres.length; };
const holdFor = (m, frac, secs) => { m.startSet(false); for (let t = 0; t < secs; t += 0.1) m.step(0.1, frac, true, 1, 0.45); };

test('size principle: slow fibres are recruited before fast, and breadth grows with load', () => {
  let prev = 0;
  for (const load of [0.1, 0.3, 0.6, 0.9]) {
    const {M, m} = muscle(1); holdFor(m, load, 3);
    const s = M.summarise(m.fibres), share = recruitedShare(M, m);
    assert.ok(share >= prev, `recruited share fell at ${load}`);
    assert.ok(s.slow.recruited / s.slow.n >= s.fast.recruited / s.fast.n, `fast ahead of slow at ${load}`);
    prev = share;
  }
});
test('30% and 80% to failure recruit about the same share of fibres', () => {
  const shares = [0.3, 0.8].map(load => { const {M, m} = muscle(1); runSet(m, load); return recruitedShare(M, m); });
  assert.ok(Math.abs(shares[0] - shares[1]) <= 0.1, shares.join(' vs '));
});
test('damage shape: a single at 95% is lower than 85%, light work is lowest', () => {
  const dmg = load => { const {M, m} = muscle(1); runSet(m, load); return M.totals(m.fibres).dmg; };
  const [d30, d85, d95] = [0.3, 0.85, 0.95].map(dmg);
  assert.ok(d95 < d85 && d30 < d95, [d30, d85, d95].join(' '));
});
