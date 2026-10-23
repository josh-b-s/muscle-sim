// loads the DOM-free model files into an isolated context with a seeded Math.random
const fs = require('fs'), path = require('path'), vm = require('vm');
const FILES = ['config', 'fibre', 'layout', 'units', 'controller', 'dynamics', 'tension', 'damage', 'recovery', 'totals', 'weeks', 'muscle'];
const root = path.join(__dirname, '..');

// mulberry32: small, fast, good enough to make fibre layouts repeatable
const seeded = seed => () => {
  seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

module.exports = (seed = 1) => {
  const ctx = vm.createContext({});
  vm.runInContext('var window = this; Math.random = (' + seeded.toString() + ')(' + seed + ');', ctx);
  for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(root, f + '.js'), 'utf8'), ctx, {filename: f + '.js'});
  return ctx.M;
};
