// per-fibre hypertrophy-proxy metrics, tracked live, reset with the muscle
//
// this is explicitly a proxy, not a growth model: it tracks three things the
// literature points at (recruitment breadth, time under real tension, and
// metabolic stress) so you can see how a rep scheme distributes them across
// fibre types. it does not compute or claim to compute actual muscle growth.
(function (M) {
  const {cfg} = M;
  // called once per substep, after activation and capacity are set for the frame
  M.trackStimulus = (f, h, glyBefore) => {
    f.imp += f.a * f.cap * h;
    if (f.cap > 0 && (f.a * f.cap) / f.fmax > cfg.tensionThresh) f.tut += h;
    if (f.a > 0.05) f.everActive = true;
    f.stress += f.h * h * 4 + (glyBefore - f.gly) * 3;
  };
  // 0-1 composite score: half recruitment/duration, half metabolic stress
  M.stimScore = f => {
    const dur = Math.min(1, f.tut / cfg.stimScale);
    const imp = Math.min(1, f.imp / (f.fmax * cfg.stimScale));
    const str = Math.min(1, f.stress);
    return (f.everActive ? 1 : 0) * 0.15 + dur * 0.35 + imp * 0.2 + str * 0.3;
  };
  // aggregate by type for the session summary panel
  M.summarise = fibres => {
    const by = p => fibres.filter(f => (p === 'slow') === (f.p < 0.5));
    const stats = g => g.length ? {
      n: g.length, recruited: g.filter(f => f.everActive).length,
      tut: g.reduce((s, f) => s + f.tut, 0) / g.length,
      score: g.reduce((s, f) => s + M.stimScore(f), 0) / g.length
    } : {n: 0, recruited: 0, tut: 0, score: 0};
    return {slow: stats(by('slow')), fast: stats(by('fast'))};
  };
})(window.M);
