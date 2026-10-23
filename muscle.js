// muscle model: builds the pool and advances time in fixed substeps
(function (M) {
  const {cfg} = M;
  M.lengthTension = L => Math.max(0.05, 1 - ((L - 1) / 0.45) ** 2);
  M.Muscle = class {
    // src: optional muscle whose fibre layout is copied (fresh state, no recalibration)
    constructor(n, share, src) {
      this.fibres = src ? src.fibres.map(M.cloneFibre) : M.place(n, share);
      if (!src) M.cells(this.fibres);
      this.units = M.makeUnits(this.fibres);
      this.max = this.baseMax = this.fibres.reduce((s, f) => s + f.fmax, 0);
      this.E = this.force = this.rawForce = this.t = this.target = this.vel = 0;
      this.dynamic = false; this.pos = 1; this.phase = 'concentric'; this.reps = 0; this.failed = false; this.stall = 0; this.repT = 0;
      // central (CNS) fatigue: reduced voluntary drive capacity from the nervous system
      // itself, distinct from anything happening in the muscle tissue. It builds slowly
      // during hard effort and clears far more slowly than local energy stores, so unlike
      // everything reset() touches, it survives a quick "Rest + refuel" - a real nervous
      // system doesn't recover on that timescale even though local PCr/glycogen can
      this.cns = 0;
      // "100% load" should mean the heaviest weight a fresh muscle can actually complete
      // through the full range of motion in one real attempt - not an idealised snapshot
      // taken independently at each point in the ROM with no fatigue carried between
      // them, which understates how hard a real single is (you do arrive at the sticking
      // point having already spent some PCr getting there, not teleported to it fresh)
      this.trueMax = src ? src.trueMax : this.findTrueMax(0.45);
      this.reset(); this.clearSession();
    }
    // binary search for the heaviest load a fresh attempt can carry through pos 1 -> 0
    findTrueMax(cadence) {
      const attempt = target => {
        this.reset(); this.dynamic = true; this.target = target;
        const h = cfg.dt;
        for (let t = 0; t < 20 && !this.failed && this.pos > 0.001; t += h) {
          this.solveAt(h, 0.8 + 0.35 * this.pos, true, cadence);
          if (!this.failed) M.stepRep(this, h, cadence);
        }
        return this.pos <= 0.001 && !this.failed;
      };
      let lo = 0, hi = this.max;
      for (let i = 0; i < 14; i++) { const m = (lo + hi) / 2; attempt(m) ? lo = m : hi = m; }
      return lo;
    }
    // session totals (tension exposure, damage) survive reset() so several sets add up
    clearSession() {
      this.fibres.forEach(f => Object.assign(f, {tut: 0, repTut: 0, effReps: 0, everActive: false, dmg: 0}));
    }
    // begin a set from the bottom of the range with counters cleared
    startSet(dynamic) {
      Object.assign(this, {pos: 1, phase: 'concentric', reps: 0, failed: false, stall: 0, vel: 0, dynamic, repT: 0});
      this.fibres.forEach(f => { f.repTut = 0; });
    }
    // scale every fibre's strength so total capacity is `total`, then recalibrate 1RM (fresh session)
    setCapacity(total) {
      const k = total / this.max;
      this.fibres.forEach(f => { f.fmax *= k; });
      this.max = total; this.newSession();
      this.trueMax = this.findTrueMax(0.45); this.newSession();
    }
    newSession() { this.reset(); this.clearSession(); this.cns = 0; }
    reset() {
      this.fibres.forEach(f => Object.assign(f, {atp: 1, pcr: 1, gly: 1, h: 0, ionic: 0, a: 0, oxAct: 0}));
      this.units.forEach(u => { u.a = 0; });
      this.E = this.force = this.rawForce = this.t = this.vel = 0;
      this.pos = 1; this.phase = 'concentric'; this.reps = 0; this.failed = false; this.stall = 0;
    }
    // one contraction/relaxation solve at a fixed length, used both for static holds
    // and, each substep, at whatever length the current rep position implies
    solveAt(h, length, on, cadence) {
      // central fatigue derates effective capacity the same way length-tension does,
      // and consistently for both the real solve here and the chooseDrive/estimateRaw
      // capacity picture below, since both need to agree on what's actually available
      const lt = M.lengthTension(length) * (1 - 0.5 * this.cns);
      const perf = Math.max(0.15, 1 - 0.85 * Math.min(1, Math.max(0, (this.force / this.max - 0.2) / 0.4)));
      // dynamic reps: pick drive by attempting the intended cadence first (see dynamics.js);
      // static holds: keep the old force-matching integral controller. the drive itself
      // is smoothed toward its solved target rather than snapping instantly, the same way
      // fibre activation has its own lag - real neural drive ramps, it doesn't step.
      // dropping is faster than rising: two cascaded lags (drive, then activation) both
      // chasing a target that suddenly falls (e.g. the concentric-to-eccentric transition)
      // otherwise overshoot each other - drive lingering high keeps pulling activation up
      // past the point where less effort is actually needed, producing a bigger force
      // spike than a real, quicker-to-disengage neural drive would allow
      if (this.dynamic && on) {
        const targetE = M.chooseDrive(this, lt, cadence).E;
        const tau = targetE > this.E ? 0.15 : 0.02;
        this.E += (targetE - this.E) * (1 - Math.exp(-h / tau));
      }
      let force = 0;
      for (const u of this.units) {
        const r = M.rate(u, this.E), tgt = M.fusion(u, r);
        u.a += (tgt - u.a) * (1 - Math.exp(-h / (u.tc * (tgt > u.a ? 1.2 : 3))));
        u.capSum = 0;
        for (const f of u.fibres) {
          f.cap = f.fmax * M.quality(f) * lt; u.capSum += f.cap; f.a = u.a;
          M.metabolise(f, h, u.a, r / cfg.peakRate, perf);
          M.trackTension(f, h);
          M.trackDamage(f, h, this.dynamic && this.phase === 'eccentric', length, this.trueMax ? this.target / this.trueMax : 1);
        }
        force += u.a * u.capSum;
      }
      this.rawForce = force;
      this.force = this.dynamic ? force * M.fvFromVel(this.vel) : force;
      if (!this.dynamic || !on) this.E = M.controller(this.E, this.target, this.force, this.max, h, on);
    }
    step(simDt, load, on, length, cadence) {
      const n = Math.min(100, Math.ceil(simDt / cfg.dt)), h = simDt / n;
      this.target = on ? load * this.trueMax : 0;
      if (this.dynamic && !on) { this.dynamic = false; }
      for (let i = 0; i < n; i++) {
        const L = this.dynamic ? 0.8 + 0.35 * this.pos : length;
        this.solveAt(h, L, on, cadence);
        if (this.dynamic && on && !this.failed) {
          const before = this.reps;
          this.repT += h; M.stepRep(this, h, cadence);
          if (this.reps > before) { M.closeRep(this.fibres, this.repT); this.repT = 0; }
        }
      }
      // central fatigue builds with the square of relative drive (so near-max efforts
      // cost disproportionately more than moderate ones, matching how central fatigue
      // is reported to scale with intensity) and clears slowly at rest regardless
      const drive = on ? this.E / cfg.emax : 0;
      const dCns = on ? cfg.cnsRate * drive * drive : -cfg.cnsRecover;
      this.cns = Math.min(1, Math.max(0, this.cns + dCns * simDt));
      this.t += simDt;
    }
  };
})(window.M);
