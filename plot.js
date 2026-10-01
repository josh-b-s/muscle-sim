// projection plot: strength deficit and soreness over hours
(function (M) {
  M.plotProjection = (ctx, w, h, pts) => {
    ctx.clearRect(0, 0, w, h);
    const d = devicePixelRatio, top = Math.max(0.1, ...pts.map(p => Math.max(p.deficit, p.sore)));
    const last = pts[pts.length - 1].h, X = t => t / last * (w - 8 * d) + 4 * d, Y = v => h - 14 * d - v / top * (h - 22 * d);
    ctx.font = 10 * d + 'px system-ui'; ctx.fillStyle = ctx.strokeStyle = '#888'; ctx.lineWidth = 1;
    for (const t of [24, 48, 72]) {
      ctx.beginPath(); ctx.moveTo(X(t), 4 * d); ctx.lineTo(X(t), h - 14 * d); ctx.globalAlpha = 0.3; ctx.stroke(); ctx.globalAlpha = 1;
      ctx.fillText(t + 'h', X(t) - 8 * d, h - 3 * d);
    }
    ctx.fillText(Math.round(top * 100) + '%', 4 * d, 10 * d);
    const line = (k, color) => {
      ctx.beginPath(); pts.forEach((p, i) => ctx[i ? 'lineTo' : 'moveTo'](X(p.h), Y(p[k])));
      ctx.strokeStyle = color; ctx.lineWidth = 2 * d; ctx.stroke();
    };
    line('sore', '#a04bd0'); line('deficit', '#d0382e');
  };
})(window.M);
