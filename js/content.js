/*
 * content.js — all vocabulary, units and grammar modules. No DOM.
 *
 * Two layers, merged every time the app starts:
 *   1. built in (in the code, the same on every device):  data/vocab.js (Lukas's school lists),
 *      data/demo.js (demo words, can be switched off), data/grammar.js (grammar modules)
 *   2. the parent's own changes, in localStorage['english-bobins:content'] (this device only):
 *      added or edited words / units / grammar modules (stored as whole copies by id), deleted ids,
 *      "demo off". Built-in entries are never changed in place, so a new app version can add words
 *      without overwriting what a parent edited.
 *
 * Learning progress is NOT stored here but per child (store.js), keyed by word.key, so the same word
 * in two units ("old" = alt, Unit 1 and Unit 4) shares one learning history.
 *
 * Word  { id, en, enAlt[], de, deAlt[], example, exampleDe, type, year, unit, page, tags[], added, src }
 * Unit  { id, year, book, name, title, order }
 * Module (grammar) see grammar.js
 */
(function (root) {
  'use strict';
  var T = root.EB.text, C = root.EB.check;
  var KEY = 'english-bobins:content';
  var TYPES = { noun: 'Nomen', verb: 'Verb', adj: 'Adjektiv', adv: 'Adverb', phrase: 'Wendung', prep: 'Präposition', pron: 'Pronomen', conj: 'Konjunktion', num: 'Zahl', other: 'Sonstiges' };

  function wordKey(w) { return T.norm(C.display(String(w.en).split(/\s*;\s*/)[0])).replace(/[.!?]$/, '') + '|' + T.norm(C.firstGerman(w.de)); }
  function fixWord(w) {
    var x = {
      id: w.id || T.uid('w'), en: T.clean(w.en), enAlt: list(w.enAlt), de: T.clean(w.de), deAlt: list(w.deAlt),
      example: T.clean(w.example || ''), exampleDe: T.clean(w.exampleDe || ''), type: TYPES[w.type] ? w.type : guessType(w),
      year: +w.year || 6, unit: w.unit || '', page: w.page ? String(w.page) : '', tags: list(w.tags), added: w.added || T.dayKey(), src: w.src || 'parent', note: T.clean(w.note || '')
    };
    x.key = wordKey(x);
    return x;
  }
  function list(v) { if (!v) return []; if (Array.isArray(v)) return v.map(T.clean).filter(Boolean); return String(v).split(/\s*;\s*/).map(T.clean).filter(Boolean); }
  function guessType(w) {
    var e = T.norm(w.en);
    if (/^\(?to\)? /.test(e)) return 'verb';
    if (/^(a|an|the) /.test(e)) return 'noun';
    if (/ /.test(e)) return 'phrase';
    return 'other';
  }

  function Content(storage) {
    this.storage = storage || root.localStorage || null;
    this.local = this.loadLocal();
    this.rebuild();
  }
  var P = Content.prototype;
  P.blankLocal = function () { return { v: 1, words: {}, deleted: {}, units: {}, unitsDeleted: {}, grammar: {}, grammarDeleted: {}, demoOff: false, changed: 0 }; };
  P.loadLocal = function () {
    var d = null, b = this.blankLocal();
    try { d = JSON.parse(this.storage && this.storage.getItem(KEY) || 'null'); } catch (e) { d = null; }
    if (!d || d.v !== 1) return b;
    for (var k in b) if (!(k in d)) d[k] = b[k];
    return d;
  };
  P.save = function () {
    this.local.changed = Date.now();
    try { this.storage && this.storage.setItem(KEY, JSON.stringify(this.local)); return true; } catch (e) { return false; }
  };

  // ---------------------------------------------------------------- merge
  P.builtIn = function () {
    var D = root.EB.data || {}, words = [], units = [], mods = [];
    [D.vocab, this.local.demoOff ? null : D.demo].forEach(function (set) {
      if (!set) return;
      (set.units || []).forEach(function (u) { units.push(Object.assign({ src: set.src || 'book' }, u)); });
      (set.words || []).forEach(function (w) { words.push(fixWord(Object.assign({ src: set.src || 'book' }, w))); });
    });
    (D.grammar || []).forEach(function (m) { mods.push(m); });
    return { words: words, units: units, grammar: mods };
  };
  P.rebuild = function () {
    var L = this.local, b = this.builtIn(), byId = {}, words = [], self = this;
    b.words.forEach(function (w) { if (!L.deleted[w.id]) { byId[w.id] = w; words.push(w); } });
    Object.keys(L.words).forEach(function (id) {
      var w = fixWord(L.words[id]);
      if (L.deleted[id] || (L.demoOff && w.src === 'demo')) return;
      if (byId[id]) words[words.indexOf(byId[id])] = w; else words.push(w);
      byId[id] = w;
    });
    this.words = words; this.byId = byId;
    var units = {}, uorder = [];
    b.units.concat(Object.keys(L.units).map(function (k) { return L.units[k]; })).forEach(function (u) {
      if (L.unitsDeleted[u.id]) return;
      if (!units[u.id]) uorder.push(u.id);
      units[u.id] = Object.assign({}, units[u.id] || {}, u);
    });
    // units that only exist in words (e.g. typed on import)
    words.forEach(function (w) { if (w.unit && !units[w.unit]) { units[w.unit] = { id: w.unit, year: w.year, name: w.unit, book: '', order: 900, src: 'auto' }; uorder.push(w.unit); } });
    this.units = uorder.map(function (id) { return units[id]; }).sort(function (a, c) { return (a.year - c.year) || ((a.order || 0) - (c.order || 0)) || String(a.name).localeCompare(String(c.name), 'de', { numeric: true }); });
    this.unitById = units;
    var G = root.EB.grammar, mods = {}, morder = [];
    b.grammar.concat(Object.keys(L.grammar).map(function (k) { return L.grammar[k]; })).forEach(function (m) {
      if (L.grammarDeleted[m.id]) return;
      if (!mods[m.id]) morder.push(m.id);
      mods[m.id] = G ? G.compile(m) : m;
    });
    this.grammar = morder.map(function (id) { return mods[id]; }).sort(function (a, c) { return (a.year - c.year) || ((a.order || 0) - (c.order || 0)); });
    this.modById = mods;
    // index: key → words (a word in two units)
    var byKey = {};
    words.forEach(function (w) { (byKey[w.key] = byKey[w.key] || []).push(w); });
    this.byKey = byKey;
    self.version = (self.version || 0) + 1;
  };

  // ---------------------------------------------------------------- queries
  P.word = function (id) { return this.byId[id] || null; };
  P.wordsIn = function (unitIds) {
    var set = {}; (unitIds || []).forEach(function (u) { set[u] = 1; });
    return this.words.filter(function (w) { return set[w.unit]; });
  };
  P.unitLabel = function (id) {
    if (/^new:/.test(id || '')) return id.slice(4) + ' (neu)';
    var u = this.unitById[id];
    if (!u) return id || 'ohne Unit';
    return (u.book ? u.book + ' · ' : 'Klasse ' + u.year + ' · ') + u.name + (u.title ? ' – ' + u.title : '');
  };
  P.unitShort = function (id) { var u = this.unitById[id]; return u ? (u.short || u.name) : (id || '–'); };
  // one entry per learning key (for statistics): the most recent unit wins
  P.uniqueWords = function (words) {
    var seen = {}, out = [];
    (words || this.words).slice().reverse().forEach(function (w) { if (!seen[w.key]) { seen[w.key] = 1; out.push(w); } });
    return out.reverse();
  };
  P.isDemo = function (w) { return w.src === 'demo'; };
  P.hasDemo = function () { return this.words.some(function (w) { return w.src === 'demo'; }); };
  P.hasReal = function () { return this.words.some(function (w) { return w.src !== 'demo'; }); };

  // ---------------------------------------------------------------- parent changes
  P.saveWord = function (w) {
    var x = fixWord(w);
    if (!w.src) x.src = this.byId[x.id] ? this.byId[x.id].src : 'parent';
    this.local.words[x.id] = x; delete this.local.deleted[x.id];
    this.save(); this.rebuild();
    return this.byId[x.id];
  };
  P.deleteWord = function (id) { this.local.deleted[id] = 1; delete this.local.words[id]; this.save(); this.rebuild(); };
  P.saveUnit = function (u) {
    var id = u.id || ('u-' + T.norm(u.name).replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36).slice(-3));
    var x = { id: id, year: +u.year || 6, book: T.clean(u.book || ''), name: T.clean(u.name || id), title: T.clean(u.title || ''), order: +u.order || (this.units.length + 1) * 10, src: (this.unitById[id] && this.unitById[id].src) || 'parent' };
    this.local.units[id] = x; delete this.local.unitsDeleted[id];
    this.save(); this.rebuild();
    return x;
  };
  P.deleteUnit = function (id) {
    var self = this;
    this.wordsIn([id]).forEach(function (w) { self.local.deleted[w.id] = 1; delete self.local.words[w.id]; });
    this.local.unitsDeleted[id] = 1; delete this.local.units[id];
    this.save(); this.rebuild();
  };
  P.saveModule = function (m) {
    var x = JSON.parse(JSON.stringify(m)); if (!x.id) x.id = 'g-' + Date.now().toString(36);
    if (!x.src) x.src = 'parent';
    this.local.grammar[x.id] = x; delete this.local.grammarDeleted[x.id];
    this.save(); this.rebuild();
    return this.modById[x.id];
  };
  P.deleteModule = function (id) { this.local.grammarDeleted[id] = 1; delete this.local.grammar[id]; this.save(); this.rebuild(); };
  P.setDemo = function (on) { this.local.demoOff = !on; this.save(); this.rebuild(); };

  // ---------------------------------------------------------------- import (paste / CSV)
  // A line: "holiday – Ferien" · "holiday = Ferien" · "holiday<TAB>Ferien<TAB>example" · "holiday; Ferien"
  // IPA in brackets ([ˈhɒlədeɪ]) is removed. Returns rows for the preview (nothing is saved yet).
  function stripIpa(s) { return s.replace(/\[[^\]]*\]/g, ' ').replace(/\/[^/ ]*[ˈˌəɪʊʃʒθðŋæɒɔʌɜː][^/]*\//g, ' ').replace(/ +/g, ' ').replace(/ *\t */g, '\t').trim(); }
  function splitLine(line) {
    var l = line.replace(/\r/g, '');
    if (/\t/.test(l)) return l.split('\t');
    var seps = [/\s+=\s+/, /\s+[–—]\s+/, /\s+-\s+/, /\s*\|\s*/, /\s*;\s*/, /\s*:\s+/];
    for (var i = 0; i < seps.length; i++) { var p = l.split(seps[i]); if (p.length >= 2) return p; }
    var c = l.split(/\s*,\s*/); if (c.length === 2) return c;
    return [l];
  }
  function germanLooking(s) { return /[äöüß]/i.test(s) || /\b(der|die|das|ein|eine|sich|jdn|jdm|etw)\b/.test(s); }
  P.parsePaste = function (text, defaults) {
    defaults = defaults || {};
    var rows = [], swapVotes = 0;
    String(text || '').split(/\n/).forEach(function (line, n) {
      var l = T.clean(line);
      if (!l || /^#/.test(l)) return;
      var p = splitLine(stripIpa(line)).map(T.clean);
      var row = { line: n + 1, raw: l, en: p[0] || '', de: p[1] || '', example: p[2] || '', problems: [] };
      if (germanLooking(row.en) && !germanLooking(row.de)) swapVotes++; else if (germanLooking(row.de)) swapVotes--;
      rows.push(row);
    });
    var swapped = swapVotes > 0 && swapVotes >= rows.length / 3;
    if (swapped) rows.forEach(function (r) { var t = r.en; r.en = r.de; r.de = t; });
    var self = this;
    rows.forEach(function (r) { self.checkRow(r, defaults); });
    return { rows: rows, swapped: swapped };
  };
  P.checkRow = function (r, defaults) {
    defaults = defaults || {};
    r.problems = [];
    r.year = r.year || defaults.year || 6; r.unit = r.unit != null && r.unit !== '' ? r.unit : (defaults.unit || '');
    if (!r.en) r.problems.push('Englisch fehlt');
    if (!r.de) r.problems.push('Deutsch fehlt');
    var key = wordKey({ en: r.en || '', de: r.de || '' }), same = this.byKey[key] || [];
    r.dup = null;
    if (same.length) {
      var inUnit = same.filter(function (w) { return w.unit === r.unit; })[0];
      r.dup = inUnit ? { kind: 'same', word: inUnit } : { kind: 'other', word: same[0] };
    }
    return r;
  };
  // save the checked rows; duplicates in the same unit are skipped (or updated when update=true)
  P.importRows = function (rows, opts) {
    opts = opts || {};
    var added = 0, skipped = 0, updated = 0, self = this, now = T.dayKey();
    rows.forEach(function (r) {
      if (/^new:/.test(r.unit || '')) r.unit = self.unitIdFor(r.unit.slice(4), r.year || opts.year);
      if (r.skip || !r.en || !r.de) { skipped++; return; }
      var base = { en: r.en, enAlt: r.enAlt, de: r.de, deAlt: r.deAlt, example: r.example, exampleDe: r.exampleDe, type: r.type, year: r.year || opts.year || 6, unit: r.unit || opts.unit || '', page: r.page, tags: r.tags, added: now, src: 'parent' };
      if (r.dup && r.dup.kind === 'same') {
        if (!opts.update) { skipped++; return; }
        var w = Object.assign({}, r.dup.word, base, { id: r.dup.word.id, src: r.dup.word.src, added: r.dup.word.added });
        self.local.words[w.id] = fixWord(w); updated++; return;
      }
      var x = fixWord(base); self.local.words[x.id] = x; added++;
    });
    this.save(); this.rebuild();
    return { added: added, skipped: skipped, updated: updated };
  };

  // ---------------------------------------------------------------- CSV
  var CSV_COLS = ['englisch', 'deutsch', 'englisch_auch', 'deutsch_auch', 'beispiel', 'beispiel_deutsch', 'wortart', 'klasse', 'unit', 'seite', 'tags'];
  var CSV_ALIASES = { english: 'englisch', en: 'englisch', german: 'deutsch', de: 'deutsch', alternatives_en: 'englisch_auch', alt_en: 'englisch_auch',
    alternatives_de: 'deutsch_auch', alt_de: 'deutsch_auch', example: 'beispiel', beispielsatz: 'beispiel', example_de: 'beispiel_deutsch', type: 'wortart',
    word_type: 'wortart', year: 'klasse', class: 'klasse', schuljahr: 'klasse', page: 'seite', s: 'seite', tag: 'tags' };
  function parseCsv(text) {
    text = String(text || '').replace(/^﻿/, '');
    var first = text.split(/\r?\n/)[0] || '', delim = (first.match(/;/g) || []).length >= (first.match(/,/g) || []).length ? ';' : ',';
    if ((first.match(/\t/g) || []).length > (first.match(new RegExp(delim, 'g')) || []).length) delim = '\t';
    var rows = [], row = [], cell = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; continue; }
      if (c === '"') q = true;
      else if (c === delim) { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (x) { return T.clean(x); }); });
  }
  P.parseCsv = function (text, defaults) {
    var raw = parseCsv(text), self = this;
    if (!raw.length) return { rows: [], error: 'Die Datei ist leer.' };
    var head = raw[0].map(function (h) { h = T.norm(h).replace(/[^a-zäöüß_ ]/g, '').replace(/ /g, '_'); return CSV_ALIASES[h] || h; });
    var hasHead = head.indexOf('englisch') >= 0 && head.indexOf('deutsch') >= 0;
    var cols = hasHead ? head : CSV_COLS;
    var data = hasHead ? raw.slice(1) : raw;
    var rows = data.map(function (r, n) {
      var o = {}; cols.forEach(function (c, k) { o[c] = T.clean(r[k] || ''); });
      var row = { line: n + (hasHead ? 2 : 1), en: stripIpa(o.englisch), de: o.deutsch, enAlt: list(o.englisch_auch), deAlt: list(o.deutsch_auch),
        example: o.beispiel, exampleDe: o.beispiel_deutsch, type: typeFrom(o.wortart), year: +o.klasse || '', unit: o.unit ? (self.findUnit(o.unit) || 'new:' + o.unit) : '', page: o.seite, tags: list(o.tags) };
      return self.checkRow(row, defaults);
    });
    return { rows: rows, header: hasHead };
  };
  function typeFrom(s) {
    s = T.norm(s || '');
    if (!s) return '';
    if (TYPES[s]) return s;
    for (var k in TYPES) if (T.norm(TYPES[k]) === s || T.norm(TYPES[k]).indexOf(s) === 0) return k;
    return ({ n: 'noun', v: 'verb', adj: 'adj', adjective: 'adj', adverb: 'adv', ph: 'phrase', 'phr': 'phrase' })[s] || 'other';
  }
  // a unit typed in a CSV ("Unit 2", "GL2-U2") → an existing unit id, or a new unit
  P.findUnit = function (name) {
    var n = T.norm(name);
    for (var i = 0; i < this.units.length; i++) { var u = this.units[i]; if (T.norm(u.id) === n || T.norm(u.name) === n || T.norm(u.short || '') === n) return u.id; }
    return null;
  };
  P.unitIdFor = function (name, year) { return this.findUnit(name) || this.saveUnit({ name: T.clean(name), year: year || 6 }).id; };
  function csvCell(v) { v = v == null ? '' : String(v); return /[";\n,]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  P.toCsv = function (words) {
    var self = this, lines = [CSV_COLS.join(';')];
    (words || this.words).forEach(function (w) {
      lines.push([w.en, w.de, w.enAlt.join('; '), w.deAlt.join('; '), w.example, w.exampleDe, TYPES[w.type] || '', w.year, self.unitShort(w.unit), w.page, w.tags.join('; ')].map(csvCell).join(';'));
    });
    return '﻿' + lines.join('\r\n') + '\r\n';
  };
  P.csvTemplate = function () {
    return '﻿' + CSV_COLS.join(';') + '\r\n' +
      ['difficult', 'schwierig', '', 'schwer', 'This exercise is difficult.', 'Diese Übung ist schwierig.', 'Adjektiv', '6', 'Unit 1', '160', ''].map(csvCell).join(';') + '\r\n' +
      ['(to) go (went, gone)', 'gehen; fahren', 'go', '', 'We go to school by bus.', '', 'Verb', '6', 'Unit 1', '160', 'unregelmäßig'].map(csvCell).join(';') + '\r\n';
  };

  // ---------------------------------------------------------------- backup of the parent layer
  P.exportLocal = function () { return JSON.parse(JSON.stringify(this.local)); };
  P.importLocal = function (d, mode) {
    if (!d || d.v !== 1 || typeof d.words !== 'object') throw new Error('Das ist keine Inhalte-Sicherung von English-Bobins.');
    if (mode === 'merge') {
      var L = this.local;
      ['words', 'deleted', 'units', 'unitsDeleted', 'grammar', 'grammarDeleted'].forEach(function (k) { Object.assign(L[k], d[k] || {}); });
      if ('demoOff' in d) L.demoOff = d.demoOff;
    } else this.local = Object.assign(this.blankLocal(), d);
    this.save(); this.rebuild();
  };

  root.EB.Content = Content;
  root.EB.content = { wordKey: wordKey, fixWord: fixWord, TYPES: TYPES, parseCsvRaw: parseCsv, stripIpa: stripIpa, KEY: KEY };
})(typeof window !== 'undefined' ? window : globalThis);
