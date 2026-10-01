// per-fibre damage proxy: builds under high tension, mostly while lengthening
(function (M) {
  const {cfg} = M, clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  Object.assign(cfg, {dmgRate: 0.15, dmgConc: 0.15});
  // ecc: fibre is lengthening under load, L: relative muscle length, load: fraction of 1RM
  M.trackDamage = (f, h, ecc, L, load) => {
    const t = f.cap > 0 ? f.a * f.cap / f.fmax : 0;
    if (t < cfg.tensionThresh) return;
    const len = 0.5 + (clamp(L, 0.7, 1.3) - 0.7) / 0.6, type = 0.05 + 0.95 * f.p * f.p, tired = 2 - M.quality(f);
    f.dmg = clamp(f.dmg + cfg.dmgRate * t * t * (ecc ? 1 : cfg.dmgConc) * load * load * len * type * tired * h, 0, 1);
  };
})(window.M);
