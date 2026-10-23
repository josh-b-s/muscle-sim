// one muscle: panel, controls, set tracking and per-frame update
(function (M) {
  const HOURS = Array.from({length: 97}, (_, i) => i), pct = v => Math.round(v * 100) + '%';
  const KEYS = ['load', 'len', 'cad', 'n', 'fast'];
  M.Lane = class {
    // src: optional lane whose controls and fibre layout are copied
    constructor(host, label, onSet, src) {
      this.label = label; this.onSet = onSet; this.live = false; this.ref = null; this.onBuild = null;
      const el = this.el = M.buildPanel(label); host.appendChild(el.root);
      this.trace = new M.Trace(600);
      this.view = M.webglOK() ? new M.View3D(el.cv, []) : null;
      if (!this.view) el.cv.replaceWith(Object.assign(document.createElement('p'), {className: 'note', textContent: 'The 3D view needs WebGL, which this browser does not provide.'}));
      this.tctx = el.trace.getContext('2d'); this.pctx = el.proj.getContext('2d'); this.dctx = el.dose.getContext('2d');
      for (const s of M.weekSliders) el[s.k].oninput = () => this.labels();
      for (const s of M.sliders) {
        el[s.k].oninput = () => this.labels();
        if (s.build) el[s.k].onchange = () => this.build();
      }
      el.abs.onchange = () => { el.load.disabled = el.abs.checked; this.labels(); };
      el.size.onchange = () => this.matchSize();
      el.dyn.onchange = () => { el.len.disabled = el.dyn.checked; };
      el.preset.onchange = () => { const p = M.presets[el.preset.value]; el.preset.value = ''; if (p) this.apply(p); };
      el.regen.onclick = () => this.build();
      if (src) this.write(src.vals());
      this.labels(); this.build(src && src.muscle); this.fit();
    }
    vals() {
      const v = {dyn: this.el.dyn.checked};
      KEYS.forEach(k => { v[k] = +this.el[k].value; });
      return v;
    }
    // set controls without rebuilding
    write(v) {
      KEYS.forEach(k => { if (v[k] !== undefined) this.el[k].value = v[k]; });
      if (v.dyn !== undefined) this.el.dyn.checked = v.dyn;
      if (v.abs !== undefined) this.el.abs.checked = v.abs;
      if (v.size !== undefined) this.el.size.checked = v.size;
      this.el.len.disabled = this.el.dyn.checked; this.el.load.disabled = this.el.abs.checked; this.labels();
    }
    // load as a fraction of this muscle's own 1RM; in absolute mode it matches the reference lane's weight
    frac(v) {
      if (!this.el.abs.checked || !this.ref) return v.load / 100;
      return this.ref.vals().load / 100 * this.ref.muscle.trueMax / this.muscle.trueMax;
    }
    // set controls, rebuilding the muscle only if its composition changed
    apply(v) {
      if (v.load !== undefined && v.abs === undefined) this.el.abs.checked = false;
      const a = this.vals(), sz = this.el.size.checked; this.write(v); const b = this.vals();
      if (a.n !== b.n || a.fast !== b.fast) this.build();
      else if (sz !== this.el.size.checked) this.matchSize();
    }
    labels() { for (const s of [...M.sliders, ...M.weekSliders]) this.el['v_' + s.k].textContent = s.fmt(+this.el[s.k].value); }
    build(src) {
      const v = this.vals(); this.live = false; this.hardSets = 0;
      this.muscle = src ? new M.Muscle(0, 0, src) : new M.Muscle(v.n, v.fast / 100);
      this.matchSize(); this.trace.clear();
      if (this.view) this.view.build(this.muscle.fibres);
      if (this.onBuild) this.onBuild();
    }
    // scale to A's total strength when ticked, back to natural size when not
    matchSize() {
      const m = this.muscle, target = this.el.size.checked && this.ref ? this.ref.muscle.max : m.baseMax;
      if (Math.abs(m.max - target) < 1e-6) return;
      this.live = false; m.setCapacity(target); this.trace.clear();
    }
    newSession() { this.live = false; this.hardSets = 0; this.muscle.newSession(); this.trace.clear(); }
    rest() { this.stop(false); this.muscle.reset(); this.trace.clear(); }
    fit() {
      const d = devicePixelRatio, e = this.el;
      if (this.view) this.view.resize();
      e.trace.width = e.trace.clientWidth * d; e.trace.height = e.trace.clientHeight * d;
      e.proj.width = e.proj.clientWidth * d; e.proj.height = e.proj.clientHeight * d;
      e.dose.width = e.dose.clientWidth * d; e.dose.height = e.dose.clientHeight * d;
    }
    start() {
      const v = this.vals(); this.muscle.startSet(v.dyn); this.abs0 = this.el.abs.checked; this.frac0 = this.frac(v);
      this.t0 = M.totals(this.muscle.fibres); this.setT = 0; this.v0 = v; this.live = true;
    }
    stop(failed) {
      if (!this.live) return;
      this.live = false;
      if (this.setT < 1) return;
      const m = this.muscle, v = this.v0, b = M.totals(m.fibres);
      if (failed && v.dyn && this.frac0 * 100 >= M.cfg.hardSetMinLoad) this.hardSets++;
      this.onSet({
        label: this.label, load: Math.round(this.frac0 * 100), dyn: v.dyn, reps: m.reps, end: failed ? 'fail' : 'stop', time: this.setT,
        now: b, before: this.t0, dmg: b.dmg, dDmg: b.dmg - this.t0.dmg, def24: M.project(m, [24])[0].deficit,
        setup: `${(v.cad / 100).toFixed(2)} Hz, ${v.fast}% fast, ${v.n} fibres` + (v.dyn ? '' : `, length ${v.len}%`) + (this.abs0 ? ', same weight as A' : '')
      });
    }
    step(simDt) {
      const m = this.muscle, v = this.vals();
      m.step(simDt, this.frac(v), this.live, v.len / 100, v.cad / 100);
      if (this.live) { this.setT += simDt; if (m.failed) this.stop(true); }
      this.trace.push(m.force / m.max, m.rawForce / m.max, m.target / m.max, m.E / M.cfg.emax);
    }
    update(mode) {
      const m = this.muscle, e = this.el, mean = k => m.fibres.reduce((s, f) => s + f[k], 0) / m.fibres.length;
      if (this.view) this.view.draw(m.fibres, mode, m.dynamic ? 0.8 + 0.35 * m.pos : this.vals().len / 100); this.trace.draw(this.tctx, e.trace.width, e.trace.height);
      e.sRec.textContent = m.units.filter(u => u.a > 0.05).length + '/' + m.units.length;
      e.sF.textContent = m.target > 0 ? pct(m.force / m.target) : '-';
      e.sD.textContent = m.E.toFixed(2);
      e.sT.textContent = Math.floor(m.t / 60) + ':' + String(Math.floor(m.t % 60)).padStart(2, '0');
      e.sP.textContent = pct(mean('pcr')); e.sG.textContent = pct(mean('gly'));
      const fr = this.frac(this.vals());
      e.sMax.textContent = m.trueMax.toFixed(0); e.sEff.textContent = pct(fr);
      if (e.abs.checked && this.ref) { e.load.value = this.ref.vals().load; e.v_load.textContent = pct(fr) + ' of own 1RM'; }
      e.sReps.textContent = m.reps; e.sCns.textContent = pct(m.cns);
      e.sStatus.textContent = m.failed ? 'FAILED' : m.dynamic ? m.phase : this.live ? 'holding' : 'resting';
      e.sStatus.classList.toggle('fail', m.failed);
      const t = M.totals(m.fibres), s = t.slow, f = t.fast, secs = v => v.toFixed(0) + ' s';
      e.sSlowN.textContent = s.recruited + '/' + s.n; e.sFastN.textContent = f.recruited + '/' + f.n;
      e.sSlowT.textContent = secs(s.tut); e.sFastT.textContent = secs(f.tut);
      e.sSlowR.textContent = s.effReps.toFixed(1); e.sFastR.textContent = f.effReps.toFixed(1);
      const pj = M.project(m, HOURS), pk = pj.reduce((a, p) => p.sore > a.sore ? p : a, pj[0]);
      M.plotProjection(this.pctx, e.proj.width, e.proj.height, pj);
      e.sDmg.textContent = pct(t.dmg);
      e.sD24.textContent = pct(pj[24].deficit); e.sD48.textContent = pct(pj[48].deficit);
      e.sSore.textContent = pk.sore > 0.005 ? pct(pk.sore) + ' @ ' + pk.h + 'h' : '-';
      const wk = M.projectWeeks({hardSets: this.hardSets, dmg: M.weightedDamage(m.fibres)}, +e.perWeek.value, +e.weeks.value);
      M.plotDose(this.dctx, e.dose.width, e.dose.height, +e.weeks.value, wk);
      e.sHard.textContent = this.hardSets; e.sWSets.textContent = wk.sets > 0 ? wk.sets.toFixed(1) : '-';
      e.sGain.textContent = wk.sets > 0 ? '+' + wk.gain.toFixed(1) + '%' : '-'; e.sLost.textContent = wk.sets > 0 ? pct(wk.lost) : '-';
    }
    destroy() { this.el.root.remove(); }
  };
})(window.M);
