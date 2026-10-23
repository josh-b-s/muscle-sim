// fills the parameter provenance table
(function (M) {
  const LABEL = {lit: 'literature', fit: 'fitted', guess: 'guess'};
  const body = document.getElementById('provBody');
  for (const p of M.provenance) {
    const tr = document.createElement('tr');
    [p.name, String(p.value()), LABEL[p.tag], p.note].forEach((text, i) => {
      const td = document.createElement('td'); td.textContent = text;
      if (i === 2) td.className = 'src src-' + p.tag;
      tr.appendChild(td);
    });
    body.appendChild(tr);
  }
})(window.M);
