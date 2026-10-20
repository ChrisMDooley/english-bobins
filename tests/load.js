// Loads the app's logic files (no DOM) into one shared context for node tests.
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const FILES = ['js/text.js', 'data/irregular.js', 'js/check.js', 'data/demo.js', 'data/grammar.js', 'data/vocab.js',
  'js/grammar.js', 'js/content.js', 'js/srs.js', 'js/store.js', 'js/session.js', 'rb-card.js'];
module.exports = function load(extra, store) {
  store = store || {};
  const ctx = { console, Math, Date, JSON, Object, Array, String, Number, Error, RegExp, isNaN, isFinite, parseInt, parseFloat,
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; },
                    key: i => Object.keys(store)[i], get length() { return Object.keys(store).length; } } };
  ctx.window = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  FILES.concat(extra || []).forEach(f => { if (fs.existsSync(path.join(ROOT, f))) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f }); });
  ctx.__store = store;
  return ctx;
};
