// next-day projection from session damage and central fatigue
(function (M) {
  const {cfg} = M, e = Math.exp;
  Object.assign(cfg, {dmgStrength: 0.6, tauStrength: 48, tauRise: 16, tauSore: 60});
  // soreness lags the session, then fades; normalised to peak 1
  const tp = Math.log(cfg.tauSore / cfg.tauRise) * cfg.tauSore * cfg.tauRise / (cfg.tauSore - cfg.tauRise);
  const pk = e(-tp / cfg.tauSore) - e(-tp / cfg.tauRise);
  const shape = h => (e(-h / cfg.tauSore) - e(-h / cfg.tauRise)) / pk;
  // assumes local energy is refuelled; returns strength deficit and soreness (0-1) per hour
  M.project = (m, hours) => {
    let w = 0, dw = 0, d = 0;
    for (const f of m.fibres) { w += f.fmax; dw += f.fmax * f.dmg; d += f.dmg; }
    const dmgW = dw / w, dmgMean = d / m.fibres.length;
    return hours.map(h => {
      const cns = Math.max(0, m.cns - cfg.cnsRecover * 3600 * h);
      const dmg = cfg.dmgStrength * dmgW * e(-h / cfg.tauStrength);
      return {h, deficit: 1 - (1 - dmg) * (1 - 0.5 * cns), sore: dmgMean * shape(h)};
    });
  };
})(window.M);
