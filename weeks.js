// weekly layer: turns one simulated session into a multi-week muscle size projection
//
// the shape and scale of the dose-response come from weekly-volume meta-analyses
// (see provenance.js for each number's source). how a session's sets and leftover
// damage feed into it is the model's own assumption.
(function (M) {
  const {cfg} = M;
  Object.assign(cfg, {
    // literature, Pelland 2024 (preprint): square-root fit of hypertrophy vs weekly sets,
    // marginal slope 0.24 %-size per extra set at the average 12.25 weekly sets
    volSlope: 0.24, volMeanSets: 12.25,
    // assumption: the meta-regression's gains are read as a typical 12 week study (the
    // median in Schoenfeld 2017); Pelland adjusts for duration but the coefficient was not
    // extractable, and gains are taken as linear in time
    volWeeks: 12,
    // assumption: a set counts toward weekly volume when it ends in failure at or above this
    // load (% of 1RM); the volume studies count sets taken close to failure
    hardSetMinLoad: 30
  });
  // slope of k * sqrt(S) is k / (2 sqrt(S)), so the slope at the mean volume fixes k
  const k = () => cfg.volSlope * 2 * Math.sqrt(cfg.volMeanSets);

  // % size change after `weeks` at a steady dose of `sets` effective weekly sets
  M.sizeGain = (sets, weeks) => k() * Math.sqrt(Math.max(0, sets)) * weeks / cfg.volWeeks;

  // session: {hardSets, dmg} where dmg is the strength-weighted damage the session left.
  // sessions are spaced evenly through the week. damage left over from earlier sessions
  // (same decay as the next-day projection) removes part of a session's dose: a muscle
  // that is still weak does less useful work. returns the dose actually delivered per week
  M.projectWeeks = (session, perWeek, weeks) => {
    const decay = Math.exp(-168 / perWeek / cfg.tauStrength);
    let left = 0, sets = 0;
    for (let w = 0; w < Math.max(1, weeks); w++) {
      sets = 0;
      for (let s = 0; s < perWeek; s++) {
        sets += session.hardSets * (1 - cfg.dmgStrength * left);
        left = Math.min(1, left + session.dmg) * decay;
      }
    }
    const nominal = session.hardSets * perWeek;
    return {nominal, sets, lost: nominal > 0 ? 1 - sets / nominal : 0, gain: M.sizeGain(sets, weeks)};
  };
})(window.M);
