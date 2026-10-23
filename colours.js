// fibre colour for each view mode; top is the largest time-under-tension in the muscle
(function (M) {
  const dark = () => matchMedia('(prefers-color-scheme: dark)').matches;
  const heat = t => `hsl(${50 - 50 * t} 90% ${62 - 17 * t}%)`;
  M.colour = {
    energy: f => { const e = 0.5 * f.pcr + 0.5 * f.gly; return `hsl(0 ${55 + 25 * e}% ${86 - 54 * e}%)`; },
    tension: f => f.a > 0.02 ? heat(Math.min(1, f.a * f.cap / f.fmax)) : (dark() ? '#3a3431' : '#e6ddd5'),
    fatigue: f => `hsl(${280 - 240 * (1 - M.quality(f))} 55% ${dark() ? 42 : 55}%)`,
    unit: f => `hsl(${(f.unit * 137.5) % 360} 60% ${dark() ? 48 : 58}%)`,
    type: f => `hsl(${215 - 180 * f.p} 65% 55%)`,
    damage: f => { const d = Math.min(1, f.dmg / 0.5); return `hsl(330 ${15 + 70 * d}% ${(dark() ? 55 : 88) - 40 * d}%)`; },
    tut: (f, top) => { const t = f.tut / top; return `hsl(175 ${20 + 60 * t}% ${(dark() ? 52 : 90) - 42 * t}%)`; }
  };
})(window.M);
