// central drive: integral feedback on force error, zero when relaxed
(function (M) {
  const {cfg} = M;
  M.controller = (E, target, force, max, h, on) =>
    on ? Math.min(cfg.emax, Math.max(0, E + cfg.ki * (target - force) / max * h)) : 0;
})(window.M);
