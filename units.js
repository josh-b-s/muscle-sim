// motor units, rate coding, twitch summation
(function (M) {
  const {cfg, type} = M;
  // same-type fibres scattered across the muscle, small slow units first
  M.makeUnits = fs => {
    const sorted = [...fs].sort((a, b) => a.p - b.p), units = [];
    for (let i = 0; i < sorted.length;) {
      const fibres = sorted.slice(i, i + Math.round(4 + 26 * sorted[i].p)); i += fibres.length;
      const p = fibres.reduce((s, f) => s + f.p, 0) / fibres.length;
      units.push({fibres, p, tc: type.twitch(p), a: 0, capSum: 0});
    }
    units.forEach((u, k) => {
      u.thr = cfg.thrMax * Math.pow(cfg.rr, k / Math.max(1, units.length - 1) - 1);
      u.fibres.forEach(f => { f.unit = k; });
    });
    return units;
  };
  // firing rate rises with drive above threshold
  M.rate = (u, E) => E <= u.thr ? 0 : Math.min(cfg.peakRate, cfg.minRate + cfg.gain * (E - u.thr));
  // slow units fuse at lower rates than fast ones
  M.fusion = (u, r) => r > 0 ? 1 - Math.exp(-(((r * u.tc) / 0.55) ** 2)) : 0;
})(window.M);
