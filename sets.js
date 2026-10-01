// saved-sets table: one row per finished set
(function (M) {
  M.SetLog = class {
    constructor(body) { this.body = body; this.n = {}; }
    add(r) {
      const num = this.n[r.label] = (this.n[r.label] || 0) + 1, pct = v => Math.round(v * 100) + '%';
      const cells = [r.label + num, r.load + '%' + (r.dyn ? '' : ' hold'), r.dyn ? r.reps : '-', r.end, r.time.toFixed(0) + 's',
        r.stim.toFixed(2) + ' (+' + r.dStim.toFixed(2) + ')', pct(r.dmg) + ' (+' + pct(r.dDmg) + ')', r.dDmg > 0.005 ? (r.dStim / r.dDmg).toFixed(1) : '-', pct(r.def24), r.setup];
      const tr = document.createElement('tr');
      cells.forEach((c, i) => {
        const td = document.createElement('td'); td.textContent = c;
        if (i === 0) td.className = 'tag' + r.label;
        tr.appendChild(td);
      });
      this.body.appendChild(tr); this.body.parentNode.parentNode.scrollTop = 1e6;
    }
    clear() { this.body.textContent = ''; this.n = {}; }
  };
})(window.M);
