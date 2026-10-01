// fibre state and metabolism
(function (M) {
  const {cfg, type} = M, clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  M.fibre = (x, y, p) => {
    const s = type.scale(p);
    return {x, y, p, s, fmax: s * s / 0.64, atp: 1, pcr: 1, gly: 1, h: 0, ionic: 0, a: 0, cap: 0, oxAct: 0, poly: null,
      imp: 0, tut: 0, stress: 0, everActive: false, dmg: 0};
  };
  // fresh-state copy of a fibre's geometry and type, for cloning a muscle
  M.cloneFibre = f => { const g = M.fibre(f.x, f.y, f.p); g.r = f.r; g.poly = f.poly; return g; };
  // ionic/excitation-coupling fatigue: builds slowly during any sustained activity and
  // clears slowly at rest, independent of PCr/glycolysis. This is what eventually ends
  // even a low-intensity, oxidatively-supported set; without it, a fibre whose oxidative
  // supply covers its own demand has no reason to ever fatigue, which real muscle does
  M.quality = f => (1 - 0.55 * (1 - f.pcr)) * (1 - 0.45 * f.h) * (1 - 0.9 * f.ionic * f.ionic) * (0.5 + 0.5 * Math.min(1, f.atp / 0.8));
  // supply order by response speed: PCr answers almost instantly but its buffering
  // capacity fades as the store empties, oxidative ramps in over roughly 20-30s and
  // covers steady demand, and glycolysis runs in parallel with PCr from the start
  // (not only once PCr is exhausted) since that is what real sustained high-intensity
  // effort actually does, and is what produces the H+ that drives most of the fatigue
  M.metabolise = (f, dt, fusion, rateFrac, perf) => {
    const d = type.cost(f.p) * (0.7 * fusion + 0.3 * rateFrac);
    const oxMax = type.ox(f.p) * perf;
    f.oxAct += (oxMax - f.oxAct) * (1 - Math.exp(-dt / 6));
    const ox = Math.min(d, f.oxAct);
    let need = d - ox;
    const glShare = need > 0 && f.gly > 0.001 ? Math.min(need * 0.4, type.gl(f.p)) : 0;
    need -= glShare;
    // pools are in demand units: a bigger pool depletes more slowly in fraction terms
    const pcrPool = type.pcrPool(f.p), glyPool = type.glyPool(f.p);
    const pcRate = f.pcr * pcrPool * 1.4; // buffering capacity fades as the store empties
    const pc = Math.min(need, pcRate, f.pcr * pcrPool / dt); need -= pc;
    const glExtra = need > 0 && f.gly > 0.001 ? Math.min(need, type.gl(f.p) - glShare) : 0; need -= glExtra;
    const gl = glShare + glExtra;
    const rest = fusion < 0.02, surplus = Math.max(0, f.oxAct - ox);
    f.atp = clamp(f.atp - need * dt, 0, 1);
    // PCr resynthesis needs oxidative surplus AND is capped by a ~20s recovery time
    // constant; it should not be able to snap back to full within a couple of seconds
    // just because one phase of a rep happens to be less demanding
    const resyn = Math.min(surplus * 1.5 / pcrPool, 0.06 * (1 - f.pcr));
    f.pcr = clamp(f.pcr - pc * dt / pcrPool + resyn * dt, 0, 1);
    f.gly = clamp(f.gly - (gl * cfg.gUse + ox * cfg.oxG) * dt / glyPool + (rest ? cfg.glyRest * dt : 0), 0, 1);
    f.h = clamp(f.h + (gl * cfg.kH - f.h * type.hClear(f.p) * (rest ? 3 : 1) * (1 - cfg.clearPerf * (1 - perf))) * dt, 0, 1);
    // slow fibres are what sustain light-moderate loads almost indefinitely via
    // oxidative supply alone, so they need this pathway to matter more; fast fibres
    // already have a hard ceiling from PCr/glycolytic fatigue and don't need as much
    const ionicRate = fusion > 0.05 ? 0.009 * (0.3 + 0.7 * fusion) : -0.0025;
    f.ionic = clamp(f.ionic + ionicRate * dt, 0, 1);
  };
})(window.M);
