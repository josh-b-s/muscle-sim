// shared constants and type curves
(function (M) {
  const l = M.lerp = (a, b, p) => a + (b - a) * p;
  M.cfg = {dt: 0.05, emax: 1.5, rr: 60, thrMax: 0.8, minRate: 8, peakRate: 35, gain: 45,
    cnsRate: 0.0015, cnsRecover: 0.00015,
    ki: 14, kH: 0.08, gUse: 0.02, oxG: 0.006, glyRest: 1.2e-5, packing: 0.42,
    // extra PCr / glycogen pool size of the fastest fibre vs the slowest (0 = equal pools)
    pcrBoost: 0.3, glyBoost: 0.2,
    // 0-1: how much H+ clearance drops with blood-flow occlusion at high force (0 = independent of force)
    clearPerf: 0,
    // energy cost per unit force of the fastest fibre relative to the slowest (2.44 = force ratio)
    fastEconomy: 2.05};
  // per-fibre parameters from type p (0 slow oxidative, 1 fast glycolytic)
  M.type = {
    scale: p => l(0.8, 1.25, p), twitch: p => l(0.09, 0.03, p), cost: p => l(0.009, 0.009 * 2.44 * M.cfg.fastEconomy, p),
    ox: p => l(0.075, 0.008, p), gl: p => l(0.02, 0.2, p), hClear: p => l(0.04, 0.012, p),
    pcrPool: p => l(1, 1 + M.cfg.pcrBoost, p), glyPool: p => l(1, 1 + M.cfg.glyBoost, p)
  };
})(window.M = window.M || {});
// hypertrophy-proxy tracking thresholds
(function (M) {
  M.cfg.tensionThresh = 0.3; // fraction of a fibre's own max force counted as "under real tension"
  M.cfg.stimScale = 20;      // normalises the impulse term into a 0-1 range for display
})(window.M);
