// whole-muscle session aggregates: tension exposure by fibre type and mean damage
(function (M) {
  M.totals = fibres => ({...M.summarise(fibres), dmg: fibres.reduce((s, f) => s + f.dmg, 0) / fibres.length});
})(window.M);
