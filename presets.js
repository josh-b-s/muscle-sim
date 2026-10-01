// control presets and side-by-side scenarios (values are slider units)
(function (M) {
  const p = (name, load, dyn, cad) => ({name, load, dyn, cad, len: 100});
  M.presets = [
    p('Max single (95%)', 95, true, 45),
    p('Strength (85%)', 85, true, 45),
    p('Hypertrophy (70%)', 70, true, 45),
    p('Light to failure (30%)', 30, true, 45),
    p('Slow tempo (60%)', 60, true, 20),
    p('Isometric hold (50%)', 50, false, 45)
  ];
  const P = i => M.presets[i];
  M.scenarios = [
    {name: 'Heavy (85%) vs light (30%), to failure', a: P(1), b: P(3)},
    {name: 'Fast vs slow tempo at 70%', a: {...P(2), cad: 80}, b: {...P(2), cad: 20}},
    {name: 'Slow vs fast twitch dominant (same size, same weight)', a: {...P(2), fast: 20}, b: {...P(2), fast: 80, abs: true, size: true}}
  ];
})(window.M);
