// builds one muscle panel's DOM and returns its elements keyed by data-k
(function (M) {
  M.sliders = [
    {k: 'load', text: 'Target load', min: 0, max: 100, val: 40, fmt: v => v + '%'},
    {k: 'len', text: 'Muscle length', min: 70, max: 130, val: 100, fmt: v => v + '%'},
    {k: 'cad', text: 'Cadence', min: 10, max: 100, val: 45, fmt: v => (v / 100).toFixed(2) + ' Hz'},
    {k: 'n', text: 'Fibres', min: 60, max: 400, val: 220, step: 10, fmt: v => v, build: true},
    {k: 'fast', text: 'Fast twitch share', min: 0, max: 100, val: 50, fmt: v => v + '%', build: true}
  ];
  M.weekSliders = [
    {k: 'perWeek', text: 'Sessions per week', min: 1, max: 7, val: 3, fmt: v => v},
    {k: 'weeks', text: 'Weeks', min: 4, max: 24, val: 12, fmt: v => v}
  ];
  const grid = items => `<div class="stats">${items.map(([k, t]) => `<div>${t}<span data-k="${k}"></span></div>`).join('')}</div>`;
  const slider = s => `<label>${s.text} <b data-k="v_${s.k}"></b></label><input data-k="${s.k}" type="range" min="${s.min}" max="${s.max}" step="${s.step || 1}" value="${s.val}">`;
  const LIVE = [['sRec', 'Units active'], ['sF', 'Force / target'], ['sD', 'Neural drive'], ['sT', 'Sim time'], ['sP', 'Mean PCr'],
    ['sG', 'Mean glycogen'], ['sReps', 'Reps'], ['sStatus', 'Status'], ['sCns', 'CNS fatigue'], ['sMax', '1RM (force units)'], ['sEff', 'Load (own 1RM)']];
  const SUM = [['sSlowN', 'Slow recruited'], ['sFastN', 'Fast recruited'], ['sSlowT', 'Slow high-tension time'], ['sFastT', 'Fast high-tension time'],
    ['sSlowR', 'Slow effective reps'], ['sFastR', 'Fast effective reps']];
  const PROJ = [['sDmg', 'Damage (mean)'], ['sD24', 'Deficit at 24h'], ['sD48', 'Deficit at 48h'], ['sSore', 'Soreness peak']];
  const WEEK = [['sHard', 'Hard sets this session'], ['sWSets', 'Weekly sets delivered'], ['sGain', 'Size change'], ['sLost', 'Dose lost to fatigue']];
  const tag = (cls, text) => `<span class="src src-${cls}">${text}</span>`;
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
      <h2>Next-day projection ${tag('guess', 'guessed constants')}</h2><canvas class="proj" data-k="proj"></canvas>
      <div class="key"><span style="color:#d0382e">strength deficit</span><span style="color:#a04bd0">soreness</span></div>${grid(PROJ)}
      <h2>Tension exposure, this session ${tag('raw', 'raw counts')}</h2>${grid(SUM)}
      <h2>Weekly projection ${tag('lit', 'literature-based')}</h2>
      ${M.weekSliders.map(slider).join('')}
      <canvas class="proj" data-k="dose"></canvas>
      <div class="key"><span style="color:#2a9d8f">size change vs weekly sets</span><span style="color:#d0382e">this plan</span></div>${grid(WEEK)}
      <p class="note">Counts sets that ended in failure at 30% load or more. Illustrates diminishing returns; it does not predict your growth.</p>`;
    const el = {root};
    root.querySelectorAll('[data-k]').forEach(n => { el[n.dataset.k] = n; });
    return el;
  };
})(window.M);
