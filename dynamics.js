// force-velocity relation and rep-based movement
(function (M) {
  const cfg = M.cfg;
  cfg.vmax = 4.2; cfg.cadenceDefault = 0.45; cfg.stallLimit = 0.6;
  // Hill curve: v>0 shortening (concentric, force drops), v<0 lengthening (eccentric, force rises)
  M.forceVelocity = v => {
    if (v >= 0) { const a = 0.25; return Math.max(0, (1 - v / cfg.vmax)) / (1 + v / (a * cfg.vmax)); }
    const vn = -v / cfg.vmax; return Math.min(1.6, 1 + 0.6 * vn / (0.15 + vn));
  };
  // muscle.pos decreases during concentric (shortening) and increases during eccentric
  // (lengthening), which is the opposite sign convention forceVelocity expects, so every
  // pos-velocity value must be negated before it reaches forceVelocity
  M.fvFromVel = v => M.forceVelocity(-v);
  // instantaneous capacity estimate at a hypothetical drive level, ignoring activation lag
  // (the lag itself is still applied for real by u.a's own dynamics in solveAt)
  M.estimateRaw = (units, E, lt) => {
    let s = 0;
    for (const u of units) {
      const fu = M.fusion(u, M.rate(u, E));
      let capSum = 0;
      for (const f of u.fibres) capSum += f.fmax * M.quality(f) * lt;
      s += fu * capSum;
    }
    return s;
  };
  // real recruitment attempts the intended movement speed first, and only falls back
  // to a slower, harder-driven grind when even maximal effort cannot sustain it. this
  // picks the minimal drive (plus a safety margin, since there's a one-substep lag
  // between choosing a drive level and the fibres actually reaching it) that clears
  // the intended cadence, or maximal drive if the cadence is not achievable at all.
  M.chooseDrive = (muscle, lt, cadence) => {
    const desired = (muscle.phase === 'concentric' ? -1 : 1) * cadence, fv0 = M.fvFromVel(desired);
    const margin = 1.15;
    const feasible = E => M.estimateRaw(muscle.units, E, lt) * fv0 >= muscle.target * margin;
    if (!feasible(cfg.emax)) return {E: cfg.emax, full: false};
    let lo = 0, hi = cfg.emax;
    for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; feasible(m) ? hi = m : lo = m; }
    return {E: hi, full: true};
  };
  // advances one rep cycle, returns whether the rep just failed
  M.stepRep = (muscle, simDt, cadence) => {
    const desired = (muscle.phase === 'concentric' ? -1 : 1) * cadence;
    const base = muscle.rawForce;
    const fv0 = M.fvFromVel(desired);
    let vel;
    if (base * fv0 >= muscle.target * 0.98) vel = desired;
    else if (base >= muscle.target) {
      let lo = 0, hi = Math.abs(desired), sign = Math.sign(desired) || (muscle.phase === 'concentric' ? -1 : 1);
      for (let i = 0; i < 15; i++) { const m = (lo + hi) / 2; (base * M.fvFromVel(sign * m) >= muscle.target) ? lo = m : hi = m; }
      vel = sign * lo;
    } else vel = 0;
    if (vel === 0) {
      muscle.stall = (muscle.stall || 0) + simDt;
      if (muscle.stall > cfg.stallLimit) { muscle.failed = true; muscle.dynamic = false; return true; }
    } else muscle.stall = 0;
    // muscle.vel here only feeds the force-velocity multiplier (position/timing use the
    // local, unsmoothed 'vel' above); real velocity reversal at the top of a rep isn't
    // instantaneous either, so smoothing this is what keeps the eccentric transition from
    // spiking as hard as an instant sign-flip would - without touching rep timing at all
    const tauV = 0.06;
    muscle.vel += (vel - muscle.vel) * (1 - Math.exp(-simDt / tauV));
    muscle.pos = Math.min(1, Math.max(0, muscle.pos + vel * simDt));
    if (muscle.phase === 'concentric' && muscle.pos <= 0) muscle.phase = 'eccentric';
    else if (muscle.phase === 'eccentric' && muscle.pos >= 1) { muscle.phase = 'concentric'; muscle.reps++; }
    return false;
  };
})(window.M);
