// whole-muscle session aggregates: mean stimulus score and mean damage
(function (M) {
  M.totals = fibres => {
    let s = 0, d = 0;
    for (const f of fibres) { s += M.stimScore(f); d += f.dmg; }
    return {stim: s / fibres.length, dmg: d / fibres.length};
  };
})(window.M);
