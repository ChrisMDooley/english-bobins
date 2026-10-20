/*
 * session.js — which questions go into a round. No DOM.
 *
 * Steps in a round:
 *   { kind: 'learn', word }                   a new word is shown first (English, German, example, 🔊)
 *   { kind: 'word', word, dir, introduced }   dir: 'de-en' (main) · 'en-de' · 'listen' (hear it, write it)
 *   { kind: 'gram', item }                    a grammar exercise
 *
 * Modes:
 *   heute     daily plan: ~8 current-unit, ~6 due old, ~4 difficult, ~4 grammar (adapts to what exists)
 *   neu       only the units the parent marked "aktuell" — new words are shown before they are asked
 *   alt       older units / years, due reviews first (spaced repetition), then words not seen for long
 *   fehler    difficult words, spelling words (listen & write), grammar concepts with mistakes
 *   grammatik one module (or all due concepts)
 *   mix       vocabulary in the parent's proportions (default 60 % current · 25 % old · 15 % difficult)
 *   ka        Klassenarbeit üben: the test units + modules, weakest first, with feedback
 *   probe     Probe-Klassenarbeit: written, no feedback until the end
 */
(function (root) {
  'use strict';
  var T = root.EB.text, S = root.EB.srs;

  function ctx(content, store, rnd, units) {
    var st = store.settings();
    var unitIds = units && units.length ? units : activeUnits(content, store);
    var set = {}; unitIds.forEach(function (u) { set[u] = 1; });
    var current = content.uniqueWords(content.words.filter(function (w) { return set[w.unit]; }));
    var curKeys = {}; current.forEach(function (w) { curKeys[w.key] = 1; });
    var old = content.uniqueWords(content.words.filter(function (w) { return !curKeys[w.key]; }));
    return { content: content, store: store, st: st, rnd: rnd || Math.random, unitIds: unitIds, current: current, old: old, all: current.concat(old), now: Date.now() };
  }
  // the parent's "aktuell" units; without a choice: the newest real unit (or the demo units)
  function activeUnits(content, store) {
    var chosen = (store.settings().activeUnits || []).filter(function (u) { return content.unitById[u]; });
    if (chosen.length) return chosen;
    var withWords = content.units.filter(function (u) { return content.words.some(function (w) { return w.unit === u.id; }); });
    var real = withWords.filter(function (u) { return u.src !== 'demo'; });
    if (real.length) return [real[real.length - 1].id];
    return withWords.map(function (u) { return u.id; });
  }
  function stat(c, w) { return c.store.stat(w.key); }
  function due(c, w) { return S.isDue(stat(c, w), c.now); }
  function seen(c, w) { var s = stat(c, w); return !!(s && (s.n || s.box)); }

  // current units: unseen first (book order), then still learning (due first), then the rest by box
  function pickCurrent(c, n, taken) {
    var pool = c.current.filter(function (w) { return !taken[w.key]; });
    var fresh = pool.filter(function (w) { return !seen(c, w); });
    var learning = pool.filter(function (w) { return seen(c, w); }).sort(function (a, b) {
      var sa = stat(c, a), sb = stat(c, b);
      return (due(c, b) - due(c, a)) || (sa.box - sb.box) || (sa.last - sb.last);
    });
    // new words are limited per round (each one is shown first, then asked)
    var k = Math.min(fresh.length, c.newLeft, Math.max(3, Math.ceil(n * 0.6)));
    var out = fresh.slice(0, k).concat(learning).slice(0, n);
    if (out.length < n) { var more = Math.min(c.newLeft - k, n - out.length); out = out.concat(fresh.slice(k, k + Math.max(0, more))); }
    c.newLeft -= out.filter(function (w) { return !seen(c, w); }).length;
    return out;
  }
  // older material: due first (most overdue), then never asked ("kennst du das noch?"), then oldest seen
  function pickOld(c, n, taken, neverShare) {
    var pool = c.old.filter(function (w) { return !taken[w.key]; });
    var d = pool.filter(function (w) { return due(c, w); }).sort(function (a, b) { return S.overdue(stat(c, b), c.now) - S.overdue(stat(c, a), c.now); });
    var out = d.slice(0, n);
    if (out.length < n) {
      var never = T.shuffle(pool.filter(function (w) { return !seen(c, w); }), c.rnd);
      out = out.concat(never.slice(0, Math.max(0, Math.min(n - out.length, Math.ceil(n * (neverShare || 0.5))))));
    }
    if (out.length < n) {
      var inOut = {}; out.forEach(function (w) { inOut[w.key] = 1; });
      var rest = pool.filter(function (w) { return seen(c, w) && !inOut[w.key]; }).sort(function (a, b) { return stat(c, a).last - stat(c, b).last; });
      out = out.concat(rest.slice(0, n - out.length));
    }
    return out;
  }
  function hardWords(c) {
    return c.all.filter(function (w) { var s = stat(c, w); return s && s.hard; })
      .sort(function (a, b) { return stat(c, b).last - stat(c, a).last; });
  }
  function spellWords(c) {
    return c.all.filter(function (w) { var s = stat(c, w); return s && s.spell.hard && !s.hard; })
      .sort(function (a, b) { return stat(c, b).last - stat(c, a).last; });
  }
  function pickHard(c, n, taken) {
    var out = hardWords(c).concat(spellWords(c)).filter(function (w) { return !taken[w.key]; });
    return out.slice(0, n);
  }

  // ---------------------------------------------------------------- grammar
  function activeModules(c) {
    var ids = c.st.activeGrammar || [], mods = c.content.grammar.filter(function (m) { return m.items.length; });
    if (ids.length) { var chosen = mods.filter(function (m) { return ids.indexOf(m.id) >= 0; }); if (chosen.length) return chosen; }
    return mods.filter(function (m) { return m.active; });
  }
  // concepts of the modules, weakest / due first; then pick a sentence not used lately for each
  function pickGram(c, mods, n, opts) {
    opts = opts || {};
    var items = c.store.doc.items, concepts = [];
    mods.forEach(function (m) {
      Object.keys(m.concepts).forEach(function (cid) {
        var its = m.items.filter(function (it) { return it.concept === cid; });
        if (!its.length) return;
        var s = c.store.gstat(m.id, cid);
        var pr = !s ? 2 : (s.hard ? 0 : S.isDue(s, c.now) ? 1 : 3 + s.box);
        concepts.push({ m: m, cid: cid, items: its, pr: pr + c.rnd() * 0.9 });
      });
    });
    concepts.sort(function (a, b) { return a.pr - b.pr; });
    if (opts.onlyWeak) concepts = concepts.filter(function (x) { return x.pr < 2; });
    var out = [], usedNow = {}, round = 0;
    while (out.length < n && concepts.length && round < 6) {
      for (var i = 0; i < concepts.length && out.length < n; i++) {
        var cand = concepts[i].items.filter(function (it) { return !usedNow[it.id]; });
        if (!cand.length) continue;
        // a sentence not used for the longest time; never the one that was wrong last time
        cand.sort(function (a, b) {
          var ia = items[a.id], ib = items[b.id];
          return ((ia ? ia.last : 0) - (ib ? ib.last : 0)) || (c.rnd() - 0.5);
        });
        var pick = cand[0];
        usedNow[pick.id] = 1;
        out.push({ kind: 'gram', item: pick });
      }
      round++;
      if (opts.onePerConcept) break;
    }
    return out;
  }

  // ---------------------------------------------------------------- direction
  function dirFor(c, w, mode) {
    if (mode === 'neu') return 'de-en';
    var s = stat(c, w), share = (+c.st.enDe || 0) / 100;
    if (mode === 'fehler' && s && s.spell.hard && !s.hard && root.EB.speechOk) return 'listen';
    if (s && s.box >= 2 && !s.hard && c.rnd() < share) return 'en-de';
    return 'de-en';
  }
  function asks(c, words, mode, opts) {
    opts = opts || {};
    return words.map(function (w) { return { kind: 'word', word: w, dir: opts.dir || dirFor(c, w, mode), introduced: !!opts.introduced }; });
  }
  // new words: blocks of up to 4 cards, then the same 4 asked (mixed); reviews in between
  function withCards(c, curWords, others) {
    var fresh = [], known = [];
    curWords.forEach(function (w) { (seen(c, w) ? known : fresh).push(w); });
    var steps = [], rest = T.shuffle(known.map(function (w) { return { kind: 'word', word: w, dir: dirFor(c, w, 'neu') }; }).concat(others), c.rnd);
    for (var i = 0; i < fresh.length; i += 4) {
      var block = fresh.slice(i, i + 4);
      block.forEach(function (w) { steps.push({ kind: 'learn', word: w }); });
      steps = steps.concat(rest.splice(0, 2));
      steps = steps.concat(T.shuffle(block, c.rnd).map(function (w) { return { kind: 'word', word: w, dir: 'de-en', introduced: true }; }));
    }
    return steps.concat(rest);
  }
  function mark(list, taken) { list.forEach(function (w) { taken[w.key] = 1; }); return list; }

  // ---------------------------------------------------------------- build
  function build(mode, content, store, opts) {
    opts = opts || {};
    var c = ctx(content, store, opts.rnd, opts.units), st = c.st, taken = {}, steps = [], plan = {};
    c.newLeft = opts.maxNew || ({ heute: 6, neu: 8, mix: 6, ka: 8 })[mode] || 0;
    var size = +st.roundSize || 20;
    if (mode === 'heute') {
      var D = st.daily || { neu: 8, alt: 6, fehler: 4, gram: 4 };
      var hard = mark(pickHard(c, D.fehler, taken), taken);
      var cur = mark(pickCurrent(c, D.neu, taken), taken);
      var old = mark(pickOld(c, D.alt, taken), taken);
      var mods = activeModules(c), gram = pickGram(c, mods, D.gram);
      // fill up what is missing so a round always has about the same length
      var want = D.neu + D.alt + D.fehler + D.gram, have = hard.length + cur.length + old.length + gram.length;
      if (have < want) old = old.concat(mark(pickOld(c, want - have, taken, 1), taken));
      have = hard.length + cur.length + old.length + gram.length;
      if (have < want) cur = cur.concat(mark(pickCurrent(c, want - have, taken), taken));
      have = hard.length + cur.length + old.length + gram.length;
      if (have < want && mods.length) gram = gram.concat(pickGram(c, mods, want - have).filter(function (g) { return !gram.some(function (x) { return x.item.id === g.item.id; }); }));
      plan = { neu: cur.length, alt: old.length, fehler: hard.length, gram: gram.length };
      steps = withCards(c, cur, asks(c, old, 'alt').concat(asks(c, hard, 'fehler')));
      // grammar spread over the second half
      gram.forEach(function (g, k) { var at = Math.min(steps.length, Math.floor(steps.length / 2) + Math.round((k + 1) * steps.length / (2 * (gram.length + 1)))); steps.splice(at + k, 0, g); });
    } else if (mode === 'neu') {
      var cw = pickCurrent(c, Math.max(12, Math.min(size, 16)), taken);
      plan = { neu: cw.length };
      steps = withCards(c, cw, []);
    } else if (mode === 'alt') {
      var ow = pickOld(c, size, taken);
      plan = { alt: ow.length };
      steps = T.shuffle(asks(c, ow, 'alt'), c.rnd);
    } else if (mode === 'fehler') {
      var hw = pickHard(c, size, taken);
      var gw = pickGram(c, c.content.grammar.filter(function (m) { return m.items.length; }), 6, { onlyWeak: true });
      plan = { fehler: hw.length, gram: gw.length };
      steps = T.shuffle(asks(c, hw, 'fehler'), c.rnd).concat(gw);
    } else if (mode === 'grammatik') {
      var m = opts.module ? [content.modById[opts.module]].filter(Boolean) : activeModules(c);
      steps = pickGram(c, m, opts.n || 10);
      plan = { gram: steps.length };
    } else if (mode === 'mix') {
      var mix = st.mix || { neu: 60, alt: 25, fehler: 15 }, tot = (mix.neu + mix.alt + mix.fehler) || 1;
      var nH = Math.round(size * mix.fehler / tot), nO = Math.round(size * mix.alt / tot), nC = size - nH - nO;
      var h2 = mark(pickHard(c, nH, taken), taken), c2 = mark(pickCurrent(c, nC + (nH - h2.length), taken), taken);
      var o2 = mark(pickOld(c, size - h2.length - c2.length, taken, 1), taken);
      if (h2.length + c2.length + o2.length < size) c2 = c2.concat(mark(pickCurrent(c, size - h2.length - c2.length - o2.length, taken), taken));
      plan = { neu: c2.length, alt: o2.length, fehler: h2.length };
      steps = withCards(c, c2, asks(c, o2, 'alt').concat(asks(c, h2, 'fehler')));
    } else if (mode === 'ka' || mode === 'probe') {
      var test = store.doc.test || {}, tu = (test.units || []).filter(function (u) { return content.unitById[u]; });
      if (!tu.length) tu = c.unitIds;
      var tw = content.uniqueWords(content.wordsIn(tu));
      var tm = (test.modules || []).map(function (id) { return content.modById[id]; }).filter(Boolean);
      if (!tm.length && !(test.units || []).length) tm = activeModules(c);
      if (mode === 'probe') {
        var nW = Math.min(tw.length, opts.words || 20), pick = T.shuffle(tw, c.rnd).slice(0, nW);
        var nEn = Math.round(nW * 0.25);
        steps = pick.map(function (w, k) { return { kind: 'word', word: w, dir: k < nEn ? 'en-de' : 'de-en', test: true }; });
        steps = T.shuffle(steps, c.rnd);
        var tg = pickGram(c, tm, Math.min(8, Math.max(tm.length * 3, 0)));
        tg.forEach(function (g) { g.test = true; });
        steps = steps.concat(tg);
        plan = { words: nW, gram: tg.length };
      } else {
        // weakest first: difficult, due, unseen, learning
        var weak = tw.slice().sort(function (a, b) {
          var sa = stat(c, a), sb = stat(c, b);
          var ra = !sa ? 1.5 : sa.hard ? 0 : due(c, a) ? 1 : 2 + sa.box, rb = !sb ? 1.5 : sb.hard ? 0 : due(c, b) ? 1 : 2 + sb.box;
          return ra - rb;
        }).slice(0, Math.max(12, size - 4));
        var kg = pickGram(c, tm, tm.length ? 6 : 0);
        var kNew = weak.filter(function (w) { return !seen(c, w); }).slice(0, c.newLeft), kOld = weak.filter(function (w) { return seen(c, w); });
        plan = { words: kNew.length + kOld.length, gram: kg.length };
        steps = withCards(c, kNew, asks(c, kOld, 'alt'));
        kg.forEach(function (g, k) { steps.splice(Math.min(steps.length, (k + 1) * Math.ceil(steps.length / (kg.length + 1)) + k), 0, g); });
      }
    }
    return { mode: mode, steps: steps, plan: plan, test: mode === 'probe', units: c.unitIds };
  }

  // what Lukas sees on the home screen before he starts
  function preview(content, store) {
    var c = ctx(content, store);
    return {
      current: c.current.length, currentNew: c.current.filter(function (w) { return !seen(c, w); }).length,
      due: c.old.filter(function (w) { return due(c, w); }).length + c.current.filter(function (w) { return due(c, w); }).length,
      hard: hardWords(c).length, spell: spellWords(c).length,
      gramDue: activeModules(c).reduce(function (n, m) { return n + Object.keys(m.concepts).filter(function (k) { var s = store.gstat(m.id, k); return s && (s.hard || S.isDue(s, c.now)); }).length; }, 0),
      units: c.unitIds
    };
  }

  root.EB.session = { build: build, preview: preview, activeUnits: activeUnits, activeModules: function (content, store) { return activeModules(ctx(content, store)); } };
})(typeof window !== 'undefined' ? window : globalThis);
