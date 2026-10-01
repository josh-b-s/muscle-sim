// cross-section drawing and colour modes
(function (M) {
  const dark = () => matchMedia('(prefers-color-scheme: dark)').matches;
  const heat = t => `hsl(${50 - 50 * t} 90% ${62 - 17 * t}%)`;
  const col = {
    energy: f => { const e = 0.5 * f.pcr + 0.5 * f.gly; return `hsl(0 ${55 + 25 * e}% ${86 - 54 * e}%)`; },
    tension: f => f.a > 0.02 ? heat(Math.min(1, f.a * f.cap / f.fmax)) : (dark() ? '#3a3431' : '#e6ddd5'),
    fatigue: f => `hsl(${280 - 240 * (1 - M.quality(f))} 55% ${dark() ? 42 : 55}%)`,
    unit: f => `hsl(${(f.unit * 137.5) % 360} 60% ${dark() ? 48 : 58}%)`,
    type: f => `hsl(${215 - 180 * f.p} 65% 55%)`,
    damage: f => { const d = Math.min(1, f.dmg / 0.5); return `hsl(330 ${15 + 70 * d}% ${(dark() ? 55 : 88) - 40 * d}%)`; },
    stimulus: f => `hsl(${140 - 140 * M.stimScore(f)} 65% ${dark() ? 45 : 55}%)`
  };
  M.draw = (ctx, w, m, mode) => {
    ctx.clearRect(0, 0, w, w);
    const c = w / 2, R = w * 0.47;
    ctx.beginPath(); ctx.arc(c, c, R * 1.02, 0, 6.283);
    ctx.fillStyle = dark() ? '#2c2624' : '#f1dcd0'; ctx.fill();
    ctx.strokeStyle = dark() ? '#5a4d47' : '#c9a595'; ctx.lineWidth = 3; ctx.stroke();
    for (const f of m.fibres) {
      ctx.beginPath();
      f.poly.forEach((v, i) => ctx[i ? 'lineTo' : 'moveTo'](c + v[0] * R, c + v[1] * R));
      ctx.closePath(); ctx.fillStyle = col[mode](f); ctx.fill();
      ctx.lineWidth = f.a > 0.02 ? 1 + 1.5 * f.a : 0.5;
      ctx.strokeStyle = f.a > 0.02 ? (dark() ? '#fff' : '#3a0d0a') : 'rgba(0,0,0,.25)'; ctx.stroke();
    }
  };
})(window.M);
