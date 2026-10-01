// rolling plot of force, raw (pre-force-velocity) capacity, target and drive
(function (M) {
  M.Trace = class {
    constructor(max) { this.d = []; this.max = max; }
    push(force, raw, target, drive) { this.d.push([force, raw, target, drive]); if (this.d.length > this.max) this.d.shift(); }
    clear() { this.d = []; }
    draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const line = (i, color, dash, width) => {
        ctx.beginPath();
        this.d.forEach((v, k) => { const x = k / this.max * w, y = h - 4 - Math.min(1, v[i]) * (h - 8); ctx[k ? 'lineTo' : 'moveTo'](x, y); });
        ctx.setLineDash(dash); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
      };
      // draw order: target (background reference) under raw capacity under actual
      // force under drive, so the line the person actually cares about (force) sits
      // on top rather than getting buried under the others
      line(2, '#aaa', [6, 4], 2.5);
      line(1, '#e0954a', [2, 2], 1.5);
      line(0, '#d0382e', [], 2);
      line(3, '#3b82c4', [], 1.5);
    }
  };
})(window.M);

