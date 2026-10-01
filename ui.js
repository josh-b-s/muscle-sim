// global controls, compare mode, scenarios and main loop
(function (M) {
  const $ = id => document.getElementById(id);
  const LEG = {
    energy: ['linear-gradient(90deg,hsl(0 55% 86%),hsl(0 80% 32%))', 'depleted', 'full'],
    stimulus: ['linear-gradient(90deg,hsl(140 65% 50%),hsl(0 65% 50%))', 'low stimulus', 'high stimulus'],
    tension: ['linear-gradient(90deg,hsl(50 90% 62%),hsl(0 90% 45%))', 'low force', 'high force'],
    fatigue: ['linear-gradient(90deg,hsl(280 55% 55%),hsl(40 55% 55%))', 'none', 'high force loss'],
    damage: ['linear-gradient(90deg,hsl(330 15% 88%),hsl(330 85% 48%))', 'none', 'heavily damaged'],
    unit: ['linear-gradient(90deg,#c55,#5c5,#55c)', 'one colour per unit', ''],
    type: ['linear-gradient(90deg,hsl(215 65% 55%),hsl(35 65% 55%))', 'slow (I)', 'fast (IIx)']
  };
  const host = $('lanes'), log = new M.SetLog($('logBody')), lanes = [];
  let on = false, last = performance.now();
  const onSet = row => log.add(row);
  const fitAll = () => { host.classList.toggle('two', lanes.length > 1); lanes.forEach(l => l.fit()); };
  const goText = () => { $('go').textContent = (on ? 'Relax' : lanes.length > 1 ? 'Contract both' : 'Contract') + ' (space)'; };
  const setOn = v => {
    on = v; $('go').classList.toggle('on', v); goText();
    lanes.forEach(l => (v ? l.start() : l.stop(false)));
  };
  const addB = () => {
    const b = new M.Lane(host, 'B', onSet, lanes[0]); b.ref = lanes[0];
    b.el.copy.onclick = () => { b.write(lanes[0].vals()); b.build(lanes[0].muscle); };
    lanes.push(b); if (on) b.start(); goText(); fitAll();
  };
  const removeB = () => { lanes.pop().destroy(); goText(); fitAll(); };
  const setCompare = v => { $('cmp').checked = v; if (v && lanes.length < 2) addB(); if (!v && lanes.length > 1) removeB(); };
  const runScenario = s => {
    setOn(false); setCompare(true);
    const [a, b] = lanes;
    a.apply(s.a); a.newSession();
    b.write({...a.vals(), abs: false, size: false}); b.build(a.muscle); b.apply(s.b);
  };
  const legend = () => { const l = LEG[$('mode').value]; $('leg').style.background = l[0]; $('l0').textContent = l[1]; $('l1').textContent = l[2]; };

  M.scenarios.forEach((s, i) => $('scn').add(new Option(s.name, i)));
  $('scn').onchange = () => { const s = M.scenarios[$('scn').value]; $('scn').value = ''; if (s) runScenario(s); };
  $('cmp').onchange = () => setCompare($('cmp').checked);
  $('mode').onchange = legend; $('go').onclick = () => setOn(!on);
  $('reset').onclick = () => { setOn(false); lanes.forEach(l => l.rest()); };
  $('clearLog').onclick = () => log.clear();
  $('speed').oninput = () => { $('vSpeed').textContent = $('speed').value + 'x'; };
  addEventListener('keydown', e => {
    if (e.code === 'Space' && !/SELECT|TEXTAREA/.test(e.target.tagName)) { e.preventDefault(); setOn(!on); }
  });
  addEventListener('resize', fitAll);

  function frame(now) {
    const simDt = Math.min(0.1, (now - last) / 1000) * +$('speed').value; last = now;
    lanes.forEach(l => { l.step(simDt); l.update($('mode').value); });
    if (on && lanes.every(l => !l.live)) setOn(false);
    requestAnimationFrame(frame);
  }
  lanes.push(new M.Lane(host, 'A', onSet));
  lanes[0].onBuild = () => { if (lanes[1]) lanes[1].matchSize(); };
  $('speed').oninput(); legend(); goText(); fitAll(); requestAnimationFrame(frame);
})(window.M);
