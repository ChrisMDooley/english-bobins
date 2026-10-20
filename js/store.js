/*
 * store.js — one child's learning progress and settings. No DOM.
 * Stored as ONE JSON document in localStorage['english-bobins:<child>'] (the Robin's Bobins backup
 * picks it up by the prefix). All access goes through load()/save(), so a later sync backend only has
 * to replace those two (the document has ids and timestamps; merge = newer stat wins, logs union).
 *
 * doc = {
 *   words:  { <word key>: stat (srs.js) }          learning history per word (shared by all units)
 *   gram:   { <module>/<concept>: stat }            grammar concepts, same boxes as words
 *   items:  { <exercise id>: { n, ok, last } }      which grammar sentences were used (for variety)
 *   log:    [ { t, k:'w'|'g', id, v (first verdict), o (outcome), d (direction), m (mode), a (wrong answer) } ]
 *   rounds: [ { t, mode, n, right, known, wrong, secs, coins } ]
 *   coins:  { days: { 'YYYY-MM-DD': n }, once: { … }, log: [ … ] }
 *   settings, test
 * }
 */
(function (root) {
  'use strict';
  var T = root.EB.text, S = root.EB.srs;
  var PREFIX = 'english-bobins:';
  var DAILY_ITEM_CAP = 60;

  function defaults() {
    return {
      activeUnits: [], activeGrammar: [], mix: { neu: 60, alt: 25, fehler: 15 }, roundSize: 20,
      daily: { neu: 8, alt: 6, fehler: 4, gram: 4 }, enDe: 20, american: true, retry: true,
      font: '', voice: '', rate: 0.85, autoSpeak: false, bigText: false
    };
  }
  function Store(childId, storage) {
    this.childId = childId;
    this.key = PREFIX + childId;
    this.storage = storage || root.localStorage || null;
    this.doc = this.load();
  }
  var P = Store.prototype;
  P.blank = function () {
    return { v: 1, created: Date.now(), words: {}, gram: {}, items: {}, log: [], rounds: [], coins: { days: {}, once: {}, log: [] },
             settings: defaults(), test: { date: '', label: 'Klassenarbeit', units: [], modules: [] }, sample: false };
  };
  P.load = function () {
    var d = null;
    try { d = JSON.parse(this.storage && this.storage.getItem(this.key) || 'null'); } catch (e) { d = null; }
    var b = this.blank();
    if (!d || d.v !== 1) return b;
    for (var k in b) if (!(k in d)) d[k] = b[k];
    var ds = defaults();
    for (var s in ds) if (!(s in d.settings)) d.settings[s] = ds[s];
    for (var c in b.coins) if (!(c in d.coins)) d.coins[c] = b.coins[c];
    return d;
  };
  P.save = function () {
    var d = this.doc;
    if (d.log.length > 4000) d.log = d.log.slice(-3000);
    if (d.rounds.length > 600) d.rounds = d.rounds.slice(-500);
    if (d.coins.log.length > 600) d.coins.log = d.coins.log.slice(-500);
    try { this.storage && this.storage.setItem(this.key, JSON.stringify(d)); return true; } catch (e) { return false; }
  };
  P.settings = function () { return this.doc.settings; };
  P.set = function (k, v) { this.doc.settings[k] = v; this.save(); };
  P.setTest = function (t) { this.doc.test = Object.assign(this.doc.test, t); this.save(); };

  // ---------------------------------------------------------------- stats
  P.stat = function (key) { return this.doc.words[key] || null; };
  P.ensure = function (key) { return this.doc.words[key] || (this.doc.words[key] = S.blank()); };
  P.gstat = function (mod, concept) { return this.doc.gram[mod + '/' + concept] || null; };
  P.gensure = function (mod, concept) { var k = mod + '/' + concept; return this.doc.gram[k] || (this.doc.gram[k] = S.blank()); };
  P.stageOf = function (key) { return S.stage(this.doc.words[key]); };

  // first: verdict of the first try · second: verdict of the second try (or null) · help: 0–3 (3 = answer shown)
  // → outcome for the boxes: exact | spelling | second | wrong
  function outcomeOf(r) {
    var C = root.EB.check;
    if (r.help >= 3 || r.shown) return 'wrong';
    if (C.EXACT[r.first] || r.first === 'typo') return r.help ? 'second' : 'exact';
    if (C.KNOWN[r.first]) return r.help ? 'second' : (r.first === 'form' ? 'second' : 'spelling');
    if (r.second && (C.KNOWN[r.second] || C.EXACT[r.second])) return 'second';
    return 'wrong';
  }
  P.outcomeOf = outcomeOf;

  // a vocabulary answer. word: content word · r: { first, second, help, shown, dir, mode, answer, introduced, test }
  P.recordWord = function (word, r, t) {
    t = t || Date.now();
    var s = this.ensure(word.key), o = outcomeOf(r), wasHard = s.hard, before = S.stage(s);
    var C = root.EB.check;
    if (r.dir === 'en-de' && o === 'exact' && s.box >= 2 && !s.hard) {
      // understanding the English word is easier than writing it: no promotion beyond box 2 from here
      s.n++; s.right++; s.last = t; s.streak++; s.history.push([t, 'e']);
      s.due = Math.max(s.due, S.startOfDay(t) + S.DAY + 4 * 3600000);
    } else {
      S.update(s, o, t, { introduced: r.introduced || r.dir === 'en-de' });
    }
    if (r.dir !== 'en-de') {
      var spellOk = !!(C.EXACT[r.first] || r.first === 'typo');
      if (C.KNOWN[r.first] || spellOk) S.spelling(s, spellOk, t, r.answer);
      else if (r.second === 'spelling') S.spelling(s, false, t, r.answer);
    }
    if (r.first && !C.EXACT[r.first] && r.answer) S.noteWrong(s, r.answer);
    var e = { t: t, k: 'w', id: word.key, v: r.first || '', o: o, d: r.dir || 'de-en', m: r.mode || '' };
    if (r.answer && !C.EXACT[r.first]) e.a = String(r.answer).slice(0, 60);
    var after = S.stage(s);
    if (STAGE_RANK[after] > STAGE_RANK[before]) e.up = 1;
    this.doc.log.push(e);
    this.save();
    return { outcome: o, before: before, after: after, wasHard: wasHard, nowHard: s.hard, stat: s };
  };
  var STAGE_RANK = { neu: 0, lernt: 1, fast: 2, sicher: 3 };
  P.STAGE_RANK = STAGE_RANK;

  // a grammar answer. item: compiled exercise · r: { first, second, help, shown, mode, answer }
  P.recordGram = function (item, r, t) {
    t = t || Date.now();
    var s = this.gensure(item.mod, item.concept), o = outcomeOf(r), before = S.stage(s);
    S.update(s, o, t, { introduced: true });
    var it = this.doc.items[item.id] || (this.doc.items[item.id] = { n: 0, ok: 0, last: 0 });
    it.n++; it.last = t; if (o === 'exact') it.ok++; else it.bad = (it.bad || 0) + 1;
    if (r.answer && o !== 'exact') S.noteWrong(s, r.answer);
    var e = { t: t, k: 'g', id: item.id, c: item.mod + '/' + item.concept, v: r.first || '', o: o, m: r.mode || '' };
    if (r.answer && o !== 'exact') e.a = String(r.answer).slice(0, 80);
    this.doc.log.push(e);
    this.save();
    return { outcome: o, before: before, after: S.stage(s), stat: s };
  };

  P.logRound = function (sum) {
    this.doc.rounds.push({ t: sum.endedAt || Date.now(), mode: sum.mode, n: sum.n, right: sum.right, known: sum.known, wrong: sum.wrong,
                           secs: Math.round(((sum.endedAt || Date.now()) - (sum.startedAt || Date.now())) / 1000), coins: sum.coins || 0 });
    this.save();
  };

  // ---------------------------------------------------------------- Robin-Münzen bookkeeping (the bank is the platform's)
  P.itemCoinsLeft = function (t) { return Math.max(0, DAILY_ITEM_CAP - (this.doc.coins.days[T.dayKey(t)] || 0)); };
  P.takeItemCoins = function (n, t) { var left = this.itemCoinsLeft(t), k = Math.min(n, left); if (k > 0) { var d = T.dayKey(t); this.doc.coins.days[d] = (this.doc.coins.days[d] || 0) + k; } return k; };
  P.once = function (flag) { if (this.doc.coins.once[flag]) return false; this.doc.coins.once[flag] = Date.now(); this.save(); return true; };
  P.logCoins = function (n, why) { this.doc.coins.log.push({ t: Date.now(), n: n, why: why }); this.save(); };

  // ---------------------------------------------------------------- views for the progress screens
  P.counts = function (words) {
    var self = this, c = { neu: 0, lernt: 0, fast: 0, sicher: 0, due: 0, hard: 0, spell: 0, total: 0 }, seen = {}, now = Date.now();
    (words || []).forEach(function (w) {
      if (seen[w.key]) return; seen[w.key] = 1;
      var s = self.doc.words[w.key];
      c.total++; c[S.stage(s)]++;
      if (S.isDue(s, now)) c.due++;
      if (s && s.hard) c.hard++;
      if (s && s.spell.hard) c.spell++;
    });
    return c;
  };
  // questions per day for the last n days (oldest first)
  P.activity = function (n) {
    var out = [], byDay = {}, now = Date.now();
    this.doc.log.forEach(function (e) { var d = T.dayKey(e.t); byDay[d] = (byDay[d] || 0) + 1; });
    for (var i = n - 1; i >= 0; i--) { var d = T.dayKey(now - i * S.DAY); out.push({ day: d, n: byDay[d] || 0 }); }
    return out;
  };
  // words that moved up a stage in the last 7 days
  P.improved = function (days) {
    var since = Date.now() - (days || 7) * S.DAY, set = {};
    this.doc.log.forEach(function (e) { if (e.k === 'w' && e.up && e.t >= since) set[e.id] = 1; });
    return Object.keys(set);
  };
  // first-try accuracy per week, last n weeks (improvement over time)
  P.weekly = function (n) {
    var out = [], now = Date.now();
    for (var i = n - 1; i >= 0; i--) {
      var from = now - (i + 1) * 7 * S.DAY, to = now - i * 7 * S.DAY, tot = 0, ok = 0;
      this.doc.log.forEach(function (e) { if (e.t >= from && e.t < to) { tot++; if (e.o === 'exact') ok++; } });
      out.push({ from: from, n: tot, rate: tot ? ok / tot : null });
    }
    return out;
  };
  // typical wrong answers across all words (for the parent): [{ key, answer, n }]
  P.commonWrongs = function (limit) {
    var out = [], W = this.doc.words;
    Object.keys(W).forEach(function (k) { Object.keys(W[k].wrongs || {}).forEach(function (a) { out.push({ key: k, answer: a, n: W[k].wrongs[a] }); }); });
    return out.sort(function (a, b) { return b.n - a.n; }).slice(0, limit || 30);
  };
  P.streakDays = function () {
    var days = {}, n = 0, d = Date.now();
    this.doc.log.forEach(function (e) { days[T.dayKey(e.t)] = 1; });
    if (!days[T.dayKey(d)]) d -= S.DAY;                          // today not yet practised: count up to yesterday
    while (days[T.dayKey(d)]) { n++; d -= S.DAY; }
    return n;
  };
  P.todayCount = function () { var d = T.dayKey(); return this.doc.log.filter(function (e) { return T.dayKey(e.t) === d; }).length; };

  // ---------------------------------------------------------------- parent: reset / override / backup
  P.resetWord = function (key) { delete this.doc.words[key]; this.doc.log = this.doc.log.filter(function (e) { return e.id !== key; }); this.save(); };
  P.setStage = function (key, stage) { S.setStage(this.ensure(key), stage); this.save(); };
  P.resetModule = function (modId) {
    var G = this.doc.gram, I = this.doc.items;
    Object.keys(G).forEach(function (k) { if (k.indexOf(modId + '/') === 0) delete G[k]; });
    Object.keys(I).forEach(function (k) { if (k.indexOf(modId + ':') === 0) delete I[k]; });
    this.save();
  };
  P.resetAll = function () { var st = this.doc.settings, test = this.doc.test; this.doc = this.blank(); this.doc.settings = st; this.doc.test = test; this.save(); };
  P.export = function () { return JSON.parse(JSON.stringify(this.doc)); };
  P.import = function (d) {
    if (!d || d.v !== 1 || typeof d.words !== 'object') throw new Error('Das ist keine Lernstand-Sicherung von English-Bobins.');
    this.doc = d; this.doc = this.load.call({ storage: { getItem: function () { return JSON.stringify(d); } }, key: 'x', blank: this.blank }); this.save();
  };

  root.EB.Store = Store;
  root.EB.store = { PREFIX: PREFIX, defaults: defaults, DAILY_ITEM_CAP: DAILY_ITEM_CAP };
})(typeof window !== 'undefined' ? window : globalThis);
