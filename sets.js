// saved-sets table: one row per finished set
(function (M) {
  M.SetLog = class {
    constructor(body) { this.body = body; this.n = {}; }
    add(r) {
      const num = this.n[r.label] = (this.n[r.label] || 0) + 1, pct = v => Math.round(v * 100) + '%';
      // "slow / fast" cells; tension figures also show the change from this set
      const both = f => ['slow', 'fast'].map(f).join(' / ');
      const recruited = both(t => r.now[t].n ? pct(r.now[t].recruited / r.now[t].n) : '-');
      const grew = (k, digits) => both(t => r.now[t][k].toFixed(digits) + ' (+' + (r.now[t][k] - r.before[t][k]).toFixed(digits) + ')');
      const cells = [r.label + num, r.load + '%' + (r.dyn ? '' : ' hold'), r.dyn ? r.reps : '-', r.end, r.time.toFixed(0) + 's',
        recruited, grew('tut', 0), grew('effReps', 1), pct(r.dmg) + ' (+' + pct(r.dDmg) + ')', pct(r.def24), r.setup];
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
