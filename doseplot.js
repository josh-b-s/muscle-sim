// dose-response plot: size change after a fixed time vs weekly hard sets, with this plan marked
(function (M) {
  const MAX_SETS = 30;
  M.plotDose = (ctx, w, h, weeks, plan) => {
    ctx.clearRect(0, 0, w, h);
    const d = devicePixelRatio, top = M.sizeGain(MAX_SETS, weeks);
    const X = s => s / MAX_SETS * (w - 12 * d) + 6 * d, Y = v => h - 14 * d - v / top * (h - 22 * d);
    ctx.font = 10 * d + 'px system-ui'; ctx.fillStyle = ctx.strokeStyle = '#888'; ctx.lineWidth = 1;
    for (const s of [10, 20, 30]) ctx.fillText(s, X(s) - 6 * d, h - 3 * d);
    ctx.fillText('+' + top.toFixed(0) + '%', 4 * d, 10 * d);
    ctx.beginPath();
    for (let s = 0; s <= MAX_SETS; s += 0.5) ctx[s ? 'lineTo' : 'moveTo'](X(s), Y(M.sizeGain(s, weeks)));
    ctx.strokeStyle = '#2a9d8f'; ctx.lineWidth = 2 * d; ctx.stroke();
    if (plan.sets > 0) {
      ctx.beginPath(); ctx.arc(X(Math.min(MAX_SETS, plan.sets)), Y(plan.gain), 4 * d, 0, 6.283);
      ctx.fillStyle = '#d0382e'; ctx.fill();
    }
  };
})(window.M);
