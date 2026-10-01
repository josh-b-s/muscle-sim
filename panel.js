// builds one muscle panel's DOM and returns its elements keyed by data-k
(function (M) {
  M.sliders = [
    {k: 'load', text: 'Target load', min: 0, max: 100, val: 40, fmt: v => v + '%'},
    {k: 'len', text: 'Muscle length', min: 70, max: 130, val: 100, fmt: v => v + '%'},
    {k: 'cad', text: 'Cadence', min: 10, max: 100, val: 45, fmt: v => (v / 100).toFixed(2) + ' Hz'},
    {k: 'n', text: 'Fibres', min: 60, max: 400, val: 220, step: 10, fmt: v => v, build: true},
    {k: 'fast', text: 'Fast twitch share', min: 0, max: 100, val: 50, fmt: v => v + '%', build: true}
  ];
  const grid = items => `<div class="stats">${items.map(([k, t]) => `<div>${t}<span data-k="${k}"></span></div>`).join('')}</div>`;
  const slider = s => `<label>${s.text} <b data-k="v_${s.k}"></b></label><input data-k="${s.k}" type="range" min="${s.min}" max="${s.max}" step="${s.step || 1}" value="${s.val}">`;
  const LIVE = [['sRec', 'Units active'], ['sF', 'Force / target'], ['sD', 'Neural drive'], ['sT', 'Sim time'], ['sP', 'Mean PCr'],
    ['sG', 'Mean glycogen'], ['sReps', 'Reps'], ['sStatus', 'Status'], ['sCns', 'CNS fatigue'], ['sMax', '1RM (force units)'], ['sEff', 'Load (own 1RM)']];
  const SUM = [['sSlowN', 'Slow recruited'], ['sSlowS', 'Slow score'], ['sFastN', 'Fast recruited'], ['sFastS', 'Fast score']];
  const PROJ = [['sStim', 'Stimulus (mean)'], ['sDmg', 'Damage (mean)'], ['sD24', 'Deficit at 24h'], ['sD48', 'Deficit at 48h'],
    ['sSore', 'Soreness peak'], ['sRatio', 'Stimulus / damage']];
  M.buildPanel = label => {
    const root = document.createElement('section'); root.className = 'card lane';
    root.innerHTML = `<header><span class="tag tag${label}">${label}</span>
      <select data-k="preset"><option value="">Preset...</option>${M.presets.map((p, i) => `<option value="${i}">${p.name}</option>`).join('')}</select></header>
      <canvas class="cv" data-k="cv"></canvas><canvas class="trace" data-k="trace"></canvas>
      <div class="key"><span style="color:#d0382e">force</span><span style="color:#e0954a">raw capacity</span><span style="color:#aaa">target</span><span style="color:#3b82c4">drive</span></div>
      ${M.sliders.map(slider).join('')}
      <label class="chk" ${label === 'A' ? 'hidden' : ''}><input data-k="abs" type="checkbox"> Same absolute load as A</label>
      <label class="chk" ${label === 'A' ? 'hidden' : ''}><input data-k="size" type="checkbox"> Match A's total strength (same size)</label>
      <label class="chk"><input data-k="dyn" type="checkbox"> Dynamic reps (concentric/eccentric)</label>
      <div class="row"><button data-k="regen">Reshuffle</button><button data-k="copy" ${label === 'A' ? 'hidden' : ''}>Copy A's fibres</button></div>
      ${grid(LIVE)}
      <h2>Next-day projection (proxy)</h2><canvas class="proj" data-k="proj"></canvas>
      <div class="key"><span style="color:#d0382e">strength deficit</span><span style="color:#a04bd0">soreness</span></div>${grid(PROJ)}
      <h2>Session summary (proxy)</h2>${grid(SUM)}`;
    const el = {root};
    root.querySelectorAll('[data-k]').forEach(n => { el[n.dataset.k] = n; });
    return el;
  };
})(window.M);
