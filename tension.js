// raw tension exposure per fibre: recruited or not, time above the tension threshold, effective reps
//
// these are measured quantities, not a growth score. nothing here is weighted or
// combined, so each one can be read (and challenged) on its own.
(function (M) {
  const {cfg} = M;
  cfg.tensionThresh = 0.3; // fraction of a fibre's own max force counted as "under real tension"
  cfg.effRepShare = 0.5;   // share of a rep a fibre must spend above the threshold for the rep to count for it

  // called once per substep, after activation and capacity are set for the frame
  M.trackTension = (f, h) => {
    if (f.a > 0.05) f.everActive = true;
    if (f.cap > 0 && (f.a * f.cap) / f.fmax > cfg.tensionThresh) { f.tut += h; f.repTut += h; }
  };
  // called when a rep completes; repTime is how long that rep took
  M.closeRep = (fibres, repTime) => {
    for (const f of fibres) {
      if (f.repTut >= cfg.effRepShare * repTime) f.effReps++;
      f.repTut = 0;
    }
  };
  // means per fibre type for the session panel and the set log
  M.summarise = fibres => {
    const by = p => fibres.filter(f => (p === 'slow') === (f.p < 0.5));
    const mean = (g, k) => g.reduce((s, f) => s + f[k], 0) / g.length;
    const stats = g => g.length ? {
      n: g.length, recruited: g.filter(f => f.everActive).length, tut: mean(g, 'tut'), effReps: mean(g, 'effReps')
    } : {n: 0, recruited: 0, tut: 0, effReps: 0};
    return {slow: stats(by('slow')), fast: stats(by('fast'))};
  };
})(window.M);
