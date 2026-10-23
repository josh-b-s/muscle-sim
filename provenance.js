// where each model number comes from. tags: lit (from published data), fit (tuned to a rep
// table that is itself approximate), guess (chosen by feel or as an assumption).
// nothing in this model is a direct measurement.
(function (M) {
  const {cfg} = M, c = k => () => cfg[k];
  M.provenance = [
    {name: 'Recruitment order (size principle)', value: () => 'structure', tag: 'lit', note: 'Small slow units first, large fast units later. The ordering is established; the threshold range (rr, thrMax) is a guess.'},
    {name: 'Recruitment threshold range', value: () => cfg.rr + ' x, top ' + cfg.thrMax, tag: 'guess', note: 'cfg.rr, cfg.thrMax'},
    {name: 'Rate coding limits', value: () => cfg.minRate + '-' + cfg.peakRate + ' Hz', tag: 'guess', note: 'cfg.minRate, cfg.peakRate'},
    {name: 'Rep-to-failure calibration', value: () => 'drive, energy, cadence terms', tag: 'fit', note: 'Tuned to %1RM rep tables. Mean fits well at 50-70%; 85% gives about 4 reps vs about 6 in tables.'},
    {name: 'Fast fibre energy cost', value: c('fastEconomy'), tag: 'guess', note: 'Drives most of the fibre-type endurance gap.'},
    {name: 'Local recovery and H+ / ionic constants', value: () => 'in fibre.js', tag: 'guess', note: 'PCr resynthesis rate, H+ clearance, ionic fatigue rates, oxidative ramp time.'},
    {name: 'PCr and glycogen pool boost', value: () => cfg.pcrBoost + ' / ' + cfg.glyBoost, tag: 'guess', note: 'cfg.pcrBoost, cfg.glyBoost'},
    {name: 'CNS fatigue build and clearance', value: () => cfg.cnsRate + ' / ' + cfg.cnsRecover, tag: 'guess', note: 'Tuned by eye to a 10-25% rep drop by the third set.'},
    {name: 'High-tension threshold', value: c('tensionThresh'), tag: 'guess', note: 'Share of a fibre\'s max force counted as real tension. Similar to "effective reps" but not established.'},
    {name: 'Effective rep share', value: c('effRepShare'), tag: 'guess', note: 'Share of a rep a fibre must spend above the threshold.'},
    {name: 'Damage rates and weights', value: () => cfg.dmgRate + ' / ' + cfg.dmgConc, tag: 'guess', note: 'cfg.dmgRate, cfg.dmgConc, plus length and fibre-type weights in damage.js.'},
    {name: 'Recovery time constants', value: () => cfg.tauStrength + ' / ' + cfg.tauRise + ' / ' + cfg.tauSore + ' h', tag: 'guess', note: 'Round numbers within the range reported for DOMS studies, not fitted.'},
    {name: 'Strength loss per unit damage', value: c('dmgStrength'), tag: 'guess', note: 'cfg.dmgStrength'},
    {name: 'Volume dose-response shape', value: () => 'square root', tag: 'lit', note: 'Pelland 2024 preprint: hypertrophy rises with weekly sets with diminishing returns. Also compatible with a plateau or inverted U.'},
    {name: 'Volume slope', value: () => cfg.volSlope + '% per set at ' + cfg.volMeanSets + ' sets', tag: 'lit', note: 'Pelland 2024 marginal slope. Schoenfeld 2017 found about 0.37% per set, linear, up to about 12 sets.'},
    {name: 'Study length behind the slope', value: () => cfg.volWeeks + ' weeks', tag: 'guess', note: 'Median study length in Schoenfeld 2017; time scaling and linearity in time are assumptions.'},
    {name: 'Frequency has no direct effect', value: () => 'volume only', tag: 'lit', note: 'Pelland 2024: negligible frequency effect once weekly volume is matched.'},
    {name: 'What counts as a hard set', value: () => 'failure, >= ' + cfg.hardSetMinLoad + '% 1RM', tag: 'guess', note: 'Volume studies count sets taken near failure; the load floor is from low-load trials.'},
    {name: 'Leftover damage reduces dose', value: () => 'dose x (1 - deficit)', tag: 'guess', note: 'The recovery limit on frequency. No source; it only matters at high frequency.'}
  ];
})(window.M);
