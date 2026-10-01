// fibre placement and cell geometry
(function (M) {
  const {type, cfg} = M;
  // dart-throw centres in a unit circle, size follows type
  M.place = (n, share) => {
    const ps = Array.from({length: n}, () => Math.random() < share ? 0.5 + Math.random() / 2 : Math.random() / 2);
    const avg = ps.reduce((s, p) => s + type.scale(p) ** 2, 0) / n;
    const base = Math.sqrt(cfg.packing / (n * avg)), out = [];
    for (const p of ps) {
      const r = base * type.scale(p);
      for (let k = 0; k < 60; k++) {
        const a = Math.random() * 6.283, d = Math.sqrt(Math.random()) * (1 - 1.5 * r);
        const x = Math.cos(a) * d, y = Math.sin(a) * d;
        if (out.every(o => (o.x - x) ** 2 + (o.y - y) ** 2 > (o.r + r) ** 2 * 1.02)) {
          const f = M.fibre(x, y, p); f.r = r; out.push(f); break;
        }
      }
    }
    return out;
  };
  // power-diagram cells clipped by neighbours, shrunk for endomysium gaps
  M.cells = fs => {
    const w = f => f.x * f.x + f.y * f.y - f.r * f.r;
    for (const f of fs) {
      let poly = Array.from({length: 8}, (_, i) => [f.x + Math.cos(i * 0.785) * f.r * 1.5, f.y + Math.sin(i * 0.785) * f.r * 1.5]);
      for (const g of fs) {
        if (g === f || (g.x - f.x) ** 2 + (g.y - f.y) ** 2 > (f.r * 6) ** 2) continue;
        const ax = 2 * (g.x - f.x), ay = 2 * (g.y - f.y), c = w(g) - w(f), next = [];
        const val = v => ax * v[0] + ay * v[1] - c;
        poly.forEach((v, i) => {
          const u = poly[(i + 1) % poly.length], a = val(v), b = val(u);
          if (a <= 0) next.push(v);
          if (a * b < 0) { const t = a / (a - b); next.push([v[0] + (u[0] - v[0]) * t, v[1] + (u[1] - v[1]) * t]); }
        });
        poly = next;
        if (poly.length < 3) break;
      }
      f.poly = poly.map(v => [f.x + (v[0] - f.x) * 0.9, f.y + (v[1] - f.y) * 0.9]);
    }
  };
})(window.M);
