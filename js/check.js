/*
 * check.js — is Lukas's answer right? No DOM, no randomness: same input → same verdict.
 *
 * word(input, item, opts)        German → English vocabulary (the main exercise)
 * german(input, item)            English → German (meaning only, German spelling is not marked)
 * sentence(input, answers, opts) grammar answers: one word ("went") or a whole sentence
 *
 * Verdicts (what the screen and the statistics do with them):
 *   right      exactly right (maybe with a note, e.g. an American spelling)
 *   caps       right word, capital/small letter wrong (I, Monday, holiday)      → knowledge ✔, small spelling note
 *   typo       one slipped key on the keyboard                                  → knowledge ✔, not a spelling problem
 *   spelling   the word is known but spelt wrong ("dificult")                   → knowledge ✔, spelling ✘
 *   form       right word, wrong form (went for go, apples for apple, a/an)     → knowledge ✔, grammar note
 *   synonym    another right translation the list also has ("large" for groß)   → counts as right
 *   wrongword  another word from the list ("dangerous" for schwierig)          → wrong, but no answer shown yet
 *   order      sentence: all words right, order wrong                           → grammar ✘
 *   grammar    sentence: the grammar point is wrong ("goed", "he play")        → grammar ✘
 *   wrong      not (yet) known
 *   empty      nothing typed
 *
 * The answer is never in the feedback of a 'wrong'/'wrongword'/'grammar'/'order' first try; the
 * practice screen decides when to show it (second try, or "Hilfe").
 */
(function (root) {
  'use strict';
  var T = root.EB.text;

  var KNOWN = { right: 1, caps: 1, typo: 1, spelling: 1, form: 1, synonym: 1 };   // knows the word
  var EXACT = { right: 1, caps: 1, synonym: 1 };                                     // counts as written right

  // ---------------------------------------------------------------- answer forms
  var ARTICLE = /^(a|an|the) (?=\S)/;
  function canon(s) {
    return T.norm(s)
      .replace(/\b(somebody|someone)'s\b|\bsb\.?'s\b/g, 'sbs')
      .replace(/\b(somebody|someone|sb)\b\.?/g, 'sb')
      .replace(/\b(something|sth)\b\.?/g, 'sth')
      .replace(/["]/g, '').replace(/\s*,\s*/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }
  // "(to) go" → ["to go", "go"]; at most 16 versions
  function optionals(s) {
    var out = [s];
    for (var guard = 0; guard < 4; guard++) {
      var next = [], any = false;
      out.forEach(function (x) {
        var m = /\(([^()]*)\)/.exec(x);
        if (!m) { next.push(x); return; }
        any = true;
        next.push(x.slice(0, m.index) + m[1] + x.slice(m.index + m[0].length));
        next.push(x.slice(0, m.index) + x.slice(m.index + m[0].length));
      });
      out = next.map(function (x) { return x.replace(/\s+/g, ' ').trim(); }).filter(Boolean);
      if (!any || out.length > 16) break;
    }
    return out;
  }
  // every string that counts as this answer, compared in canon() form
  function forms(s) {
    var set = {};
    function add(x) {
      x = x.replace(/\s+/g, ' ').trim(); if (!x) return;
      T.expandShort(x).forEach(function (e) { set[e] = 1; });
    }
    optionals(canon(s)).forEach(function (x) {
      add(x);
      var noTo = x.replace(/^to (?=\S)/, ''); add(noTo);
      var noArt = x.replace(ARTICLE, ''); add(noArt);
      var noPh = x.replace(/\b(sb|sth|sbs)\b/g, ' '); add(noPh); add(noPh.replace(/^to (?=\S)/, ''));
      add(x.replace(/^(be|to be) /, ''));
    });
    return Object.keys(set);
  }
  function splitAlts(s) { return String(s || '').split(/\s*;\s*|\s+\/\s+/).map(T.clean).filter(Boolean); }
  // the English answers of an item, as written (for display)
  function answersOf(item) {
    var list = splitAlts(item.en);
    (item.enAlt || []).forEach(function (a) { splitAlts(a).forEach(function (x) { list.push(x); }); });
    var seen = {}, out = [];
    list.forEach(function (x) { var k = canon(x); if (!seen[k]) { seen[k] = 1; out.push(x); } });
    return out;
  }
  function display(x) { return optionals(T.clean(x))[0] || T.clean(x); }   // "(to) go" → "to go"

  // ---------------------------------------------------------------- British / American
  var US_WORDS = { grey: 'gray', mum: 'mom', mummy: 'mommy', programme: 'program', tyre: 'tire', pyjamas: 'pajamas', cheque: 'check',
                   plough: 'plow', aluminium: 'aluminum', jewellery: 'jewelry', practise: 'practice', licence: 'license', defence: 'defense',
                   offence: 'offense', storey: 'story', kerb: 'curb', cosy: 'cozy', moustache: 'mustache', enrol: 'enroll', fulfil: 'fulfill' };
  function american(w) {
    if (US_WORDS[w]) return US_WORDS[w];
    var a = w
      .replace(/(\w{2,})our(s?|ed|ing|ite|ites|ful|able|er)?$/, function (m, s, e) { return /^(f|h|y|t|s|p)$/.test(s) ? m : s + 'or' + (e || ''); })
      .replace(/([^aeiou])re(s?)$/, function (m, c, e) { return /(acre|ogre|mediocre|massacre)$/.test(w) ? m : c + 'er' + e; })
      .replace(/(\w{3,})is(e|ed|es|ing|ation)$/, function (m, s, e) { return /(advert|exerc|surpr|wise|promise|rise|noise|supervise|televise|comprise)/.test(m) || /(rise|noise|wise)$/.test(w) ? m : s + 'iz' + e; })
      .replace(/([aeiou])ll(ed|ing|er)$/, function (m, v, e) { return /(fill|full|spell|sell|tell|well|kill|call|roll|smell|pull)/.test(w) ? m : v + 'l' + e; })
      .replace(/ogue$/, 'og');
    return a === w ? null : a;
  }
  function americanForm(s) {
    var changed = false, out = s.split(' ').map(function (w) { var a = american(w); if (a) { changed = true; return a; } return w; }).join(' ');
    return changed ? out : null;
  }

  // ---------------------------------------------------------------- closeness
  function letters(s) { return T.norm(s).replace(/[^a-z']/g, ''); }
  function closeEnough(inp, tgt) {
    var a = letters(inp), b = letters(tgt), L = b.length;
    if (!a || !b) return false;
    var d = T.dist(a, b), same = T.sound(a) === T.sound(b);
    if (d === 0) return true;
    if (d > Math.ceil(L / 2)) return false;
    if (L <= 3) return d <= 1 && same;
    if (L <= 5) return d <= 1 || (d <= 2 && same);
    if (L <= 8) return d <= 2 || (d <= 3 && same);
    return d <= 3 || (d <= 4 && same);
  }
  function isTypo(inp, tgt) {
    var a = T.norm(inp), b = T.norm(tgt), r = T.align(a, b);
    if (r.dist !== 1) return false;
    var op = r.ops.filter(function (o) { return o.op !== '='; })[0];
    if (op.op === 's') return T.neighbours(op.a, op.b);
    if (op.op === 'd') { var prev = a[op.i - 1], next = a[op.i + 1]; return T.neighbours(op.a, prev) || T.neighbours(op.a, next); }
    return false;
  }

  // ---------------------------------------------------------------- German spelling hints
  function q(s) { return '«' + s + '»'; }
  var SILENT = [
    [/^kn/, 0, 'k', 'Das k am Anfang hört man nicht – man schreibt es aber.'],
    [/^wr/, 0, 'w', 'Das w am Anfang hört man nicht – man schreibt es aber.'],
    [/mb$/, -1, 'b', 'Das b am Ende hört man nicht – man schreibt es aber.'],
    [/gh/, null, 'gh', 'Hier steht ein stilles gh.'],
    [/wh/, null, 'h', 'Englisch: wh (das h nicht vergessen).'],
    [/^h/, 0, 'h', 'Das Wort fängt mit h an.']
  ];
  function chunks(input, target) {
    var r = T.align(input, target), out = [], cur = null;
    r.ops.forEach(function (o) {
      if (o.op === '=') { if (cur) { out.push(cur); cur = null; } return; }
      if (!cur) cur = { inp: '', tgt: '', j: o.j, i: o.i, ops: [] };
      cur.ops.push(o);
      if (o.op === 's' || o.op === 't') { cur.inp += o.a; cur.tgt += o.b; }
      else if (o.op === 'd') cur.inp += o.a;
      else cur.tgt += o.b;
    });
    if (cur) out.push(cur);
    return { dist: r.dist, ops: r.ops, chunks: out };
  }
  function where(target, j, len) {
    if (j === 0) return 'am Anfang';
    if (j + (len || 1) >= target.length) return 'am Ende';
    var before = target.slice(Math.max(0, j - 2), j).replace(/^ /, '');
    return 'nach ' + q(before);
  }
  // German sentences that say what to look at; most specific first, at most 3
  function hintsFor(inp, tgt) {
    var a = T.norm(inp), b = T.norm(tgt), out = [];
    if (!a || !b || a === b) return out;
    if (/sch/.test(a) && !/sch/.test(b) && /sh/.test(b) && a.replace(/sch/g, 'sh') === b) return ['Im Englischen schreibt man ' + q('sh') + ' – nicht ' + q('sch') + '.'];
    if (a.replace(/[- ]/g, '') === b.replace(/[- ]/g, '')) {
      if (/-/.test(b)) return ['Mit Bindestrich: ' + q(tgt) + '.'];
      if (/ /.test(b)) return [q(tgt) + ' schreibt man getrennt.'];
      return [q(tgt) + ' schreibt man zusammen, in einem Wort.'];
    }
    var c = chunks(a, b);
    if (c.chunks.length > 3) return ['Schau dir das Wort genau an – mehrere Stellen sind anders. Sprich es dir in Silben vor: ' + q(syllables(tgt)) + '.'];
    c.chunks.forEach(function (k) {
      var s = null;
      if (k.ops.length === 1 && k.ops[0].op === 't') s = 'Achte auf die Reihenfolge: ' + q(k.tgt) + ' (nicht ' + q(k.inp) + ').';
      else if (!k.inp) {                                                          // missing in the input
        var L = k.tgt;
        if (L === "'") s = 'Es fehlt der Apostroph ' + q("'") + ': ' + q(tgt) + '.';
        else if (L.length === 1 && (b[k.j - 1] === L || b[k.j + 1] === L)) s = 'Achte auf das doppelte ' + q(L) + '.';
        else if (L === 'e' && k.j === b.length - 1) s = 'Am Ende kommt noch ein stummes ' + q('e') + '.';
        else {
          for (var x = 0; x < SILENT.length && !s; x++) {
            var m = SILENT[x][0].exec(b);
            if (!m) continue;
            var at = SILENT[x][1] === 0 ? 0 : SILENT[x][1] === -1 ? b.length - 1 : m.index + (SILENT[x][2] === 'h' ? 1 : 0);
            if (SILENT[x][2].indexOf(L) >= 0 && Math.abs(at - k.j) <= 1) s = SILENT[x][3];
          }
          if (!s) s = 'Es fehlt ' + (L.length === 1 ? 'ein ' + q(L) : q(L)) + ' (' + where(b, k.j, L.length) + ').';
        }
      } else if (!k.tgt) {                                                        // extra in the input
        var E = k.inp;
        if (E.length === 1 && (a[k.i - 1] === E || a[k.i + 1] === E)) s = 'Hier steht nur ein ' + q(E) + '.';
        else s = (E.length === 1 ? 'Das ' + q(E) : q(E)) + ' ist zu viel.';
      } else if (k.inp.length === 1 && k.tgt.length === 1 && T.neighbours(k.inp, k.tgt)) {
        s = 'Vertippt? Hier steht ein ' + q(k.tgt) + ', kein ' + q(k.inp) + '.';
      } else {
        // widen to a readable piece of the word: "ea" not "e"
        var tg = k.tgt, ip = k.inp;
        if (/^[aeiou]$/.test(tg) && /^[aeiou]$/.test(ip)) {
          var nb = b[k.j + 1] && /[aeiou]/.test(b[k.j + 1]) ? b[k.j + 1] : '', pb = !nb && b[k.j - 1] && /[aeiou]/.test(b[k.j - 1]) ? b[k.j - 1] : '';
          if (nb) { tg = tg + nb; ip = ip + nb; } else if (pb) { tg = pb + tg; ip = pb + ip; }
        }
        s = 'Hier schreibt man ' + q(tg) + ', nicht ' + q(ip) + '.';
      }
      if (s && out.indexOf(s) < 0) out.push(s);
    });
    return out.slice(0, 3);
  }

  // coloured comparison: target letters to look at, input letters that are wrong
  function diff(inp, tgt) {
    var a = T.clean(inp), b = T.clean(tgt), r = T.align(a.toLowerCase(), b.toLowerCase());
    var ti = [], ii = [];
    function push(arr, s, k) { var l = arr[arr.length - 1]; if (l && l.k === k) l.s += s; else arr.push({ s: s, k: k }); }
    r.ops.forEach(function (o) {
      if (o.op === '=') {
        var ac = a[o.i], bc = b[o.j];
        push(ti, bc, ac === bc ? 'ok' : 'fix'); push(ii, ac, ac === bc ? 'ok' : 'bad');
      } else if (o.op === 's') { push(ti, b[o.j], 'fix'); push(ii, a[o.i], 'bad'); }
      else if (o.op === 't') { push(ti, b.substr(o.j, 2), 'fix'); push(ii, a.substr(o.i, 2), 'bad'); }
      else if (o.op === 'i') { push(ti, b[o.j], 'fix'); push(ii, '', 'gap'); }
      else push(ii, a[o.i], 'bad');
    });
    ii = ii.filter(function (x, n) { return x.k !== 'gap' || !(ii[n - 1] && ii[n - 1].k === 'gap'); });
    return { target: ti, input: ii };
  }

  // rough English syllables for spelling help: "difficult" → "dif-fi-cult"
  function syllables(word) {
    return String(word).split(' ').map(function (w) {
      if (w.length <= 4) return w;
      var V = /[aeiouy]/i, out = '', i, groups = [];
      // split into vowel groups / consonant groups
      var m = w.match(/[aeiouy]+|[^aeiouy]+/gi) || [w];
      for (i = 0; i < m.length; i++) groups.push(m[i]);
      // silent final e joins the previous part
      if (groups.length > 1 && /^e$/i.test(groups[groups.length - 1]) && !V.test(groups[groups.length - 2])) { var e = groups.pop(); groups[groups.length - 1] += e; }
      var parts = [''];
      for (i = 0; i < groups.length; i++) {
        var g = groups[i], isV = V.test(g[0]);
        if (!isV && i > 0 && i < groups.length - 1) {
          // consonants between vowels: one goes right (ma-ke), two or more split (dif-fi)
          if (g.length === 1) { parts.push(g); }
          else if (/^(ck|sh|ch|th|ph|wh|ng|gh)$/i.test(g)) { parts[parts.length - 1] += g.length > 2 ? g.slice(0, 1) : ''; parts.push(g.length > 2 ? g.slice(1) : g); }
          else { var cut = /(ck|sh|ch|th|ph|wh)$/i.test(g) ? g.length - 2 : g.length - 1; parts[parts.length - 1] += g.slice(0, cut); parts.push(g.slice(cut)); }
        } else parts[parts.length - 1] += g;
      }
      parts = parts.filter(Boolean);
      if (parts.length > 1 && !V.test(parts[parts.length - 1])) { var t = parts.pop(); parts[parts.length - 1] += t; }
      if (parts.length > 1 && !V.test(parts[0])) { var h = parts.shift(); parts[0] = h + parts[0]; }
      return parts.join('-');
    }).join(' ');
  }
  // "Hilfe": 1 = first letter + gaps · 2 = every second letter · (3 = answer, decided by the screen)
  function helpMask(word, level) {
    var w = display(word), n = 0;
    return w.split('').map(function (c) {
      if (!/[a-z]/i.test(c)) return c;
      n++;
      if (level >= 2) return (n % 2 === 1) ? c : '_';
      return n === 1 ? c : '_';
    }).join(' ').replace(/ {3}/g, '   ');
  }

  // ---------------------------------------------------------------- caps
  function capsNote(inp, tgt, multi) {
    var a = T.clean(inp).replace(/[.!?]+$/, ''), b = T.clean(tgt).replace(/[.!?]+$/, '');
    if (a === b || a.toLowerCase() !== b.toLowerCase()) return null;
    var aw = a.split(' '), bw = b.split(' ');
    for (var k = 0; k < bw.length; k++) {
      var x = aw[k] || '', y = bw[k];
      if (x === y) continue;
      if (/^i('|$)/.test(x) && /^I('|$)/.test(y)) return 'Das Wort ' + q('I') + ' (ich) schreibt man im Englischen immer groß.';
      if (/^[A-Z]/.test(y) && /^[a-z]/.test(x) && (k > 0 || !multi)) return q(y) + ' schreibt man groß.';
      if (/^[a-z]/.test(y) && /^[A-Z]/.test(x) && (k > 0 || !multi)) return 'Im Englischen schreibt man das klein: ' + q(y) + '.';
    }
    return null;
  }

  // ---------------------------------------------------------------- word forms (grammar slips in vocabulary)
  var IRR = null;
  function irregular() {
    if (IRR) return IRR;
    IRR = { byForm: {}, byInf: {} };
    ((root.EB.data && root.EB.data.irregular) || []).forEach(function (v) {
      var inf = v.inf.replace(/\s*\(.*\)/, '');
      IRR.byInf[inf] = v;
      v.past.concat(v.pp).forEach(function (f) { f = f.replace(/\s*\(.*\)/, ''); (IRR.byForm[f] = IRR.byForm[f] || []).push(v); });
    });
    return IRR;
  }
  function regularPast(v) {
    if (/e$/.test(v)) return [v + 'd'];
    if (/[^aeiou]y$/.test(v)) return [v.slice(0, -1) + 'ied', v + 'ed'];
    var out = [v + 'ed'];
    if (/^[^aeiou]*[aeiou][^aeiouwxy]$/.test(v)) out.push(v + v.slice(-1) + 'ed');
    return out;
  }
  function ingForm(v) {
    if (/ie$/.test(v)) return [v.slice(0, -2) + 'ying'];
    if (/[^e]e$/.test(v)) return [v.slice(0, -1) + 'ing'];
    var out = [v + 'ing'];
    if (/^[^aeiou]*[aeiou][^aeiouwxy]$/.test(v)) out.push(v + v.slice(-1) + 'ing');
    return out;
  }
  function sForm(v) {
    if (v === 'have') return ['has']; if (v === 'be') return ['is']; if (v === 'do' || v === 'go') return [v + 'es'];
    if (/(s|sh|ch|x|z|o)$/.test(v)) return [v + 'es'];
    if (/[^aeiou]y$/.test(v)) return [v.slice(0, -1) + 'ies'];
    return [v + 's'];
  }
  function plural(n) { return sForm(n).concat([n + 's']); }
  function wordFormSlip(inp, tgt) {
    var a = canon(inp).replace(/^to /, ''), b = canon(display(tgt)).replace(/^to /, '').replace(ARTICLE, '');
    var I = irregular(), v = I.byInf[b];
    if (v) {
      if (v.past.indexOf(a) >= 0) return 'Richtiges Verb, aber das ist die Vergangenheit. Gesucht ist die Grundform: ' + q(display(tgt)) + '.';
      if (v.pp.indexOf(a) >= 0) return 'Richtiges Verb, aber das ist die 3. Form. Gesucht ist die Grundform: ' + q(display(tgt)) + '.';
    }
    if (b.indexOf(' ') < 0 && b.length > 2) {
      if (regularPast(b).indexOf(a) >= 0 && !v) return 'Richtiges Wort, aber in der Vergangenheit. Gesucht ist die Grundform: ' + q(display(tgt)) + '.';
      if (ingForm(b).indexOf(a) >= 0) return 'Richtiges Wort mit -ing. Gesucht ist die Grundform: ' + q(display(tgt)) + '.';
      if (plural(b).indexOf(a) >= 0) return 'Richtiges Wort, aber in der Mehrzahl (oder mit -s). Gesucht: ' + q(display(tgt)) + '.';
      if (plural(a).indexOf(b) >= 0) return 'Richtiges Wort, aber gesucht ist die Mehrzahl: ' + q(display(tgt)) + '.';
    }
    var ma = /^(a|an) (.+)$/.exec(T.norm(inp)), mb = /^(a|an) (.+)$/.exec(T.norm(tgt));
    if (ma && mb && ma[2] === mb[2] && ma[1] !== mb[1]) return mb[1] === 'an' ? 'Vor einem Vokal-Laut heißt es ' + q('an') + ': ' + q(display(tgt)) + '.' : 'Vor einem Konsonanten-Laut heißt es ' + q('a') + ': ' + q(display(tgt)) + '.';
    return null;
  }

  // ---------------------------------------------------------------- vocabulary German → English
  // item: { en, enAlt[], de, ... } · opts: { pool: other items (same list), american: true }
  function word(input, item, opts) {
    opts = opts || {};
    var raw = T.clean(input), res = { input: raw, notes: [], hints: [] };
    var answers = answersOf(item);
    res.answer = display(answers[0] || item.en);
    function done(verdict, target) {
      res.verdict = verdict; res.known = !!KNOWN[verdict]; res.exact = !!EXACT[verdict];
      if (target) res.answer = display(target);
      if (target && (verdict === 'spelling' || verdict === 'typo' || verdict === 'caps')) res.diff = diff(raw, display(target));
      return res;
    }
    if (!T.norm(raw)) return done('empty');
    var inForms = forms(raw), k, f;

    // 0. a / an mixed up ("a apple") — the rest is right
    var mA = /^(a|an) (.+)$/.exec(T.norm(raw));
    for (k = 0; mA && k < answers.length; k++) {
      var mB = /^(a|an) (.+)$/.exec(T.norm(display(answers[k])));
      if (mB && mB[1] !== mA[1] && forms(mB[2]).some(function (x) { return forms(mA[2]).indexOf(x) >= 0; })) {
        res.notes.push(wordFormSlip(raw, answers[k])); return done('form', answers[k]);
      }
    }
    // 1. right (any accepted answer, case-insensitive) — then capital letters
    for (k = 0; k < answers.length; k++) {
      f = forms(answers[k]);
      if (inForms.some(function (x) { return f.indexOf(x) >= 0; })) {
        var cn = capsNote(stripArticleLike(raw, answers[k]), display(answers[k]), /\s/.test(answers[k]));
        if (cn) { res.notes.push(cn + (item.type === 'noun' && /klein/.test(cn) ? ' Auch Nomen schreibt man im Englischen klein.' : '')); return done('caps', answers[k]); }
        return done('right', answers[k]);
      }
    }
    // 2. American spelling of a British answer
    if (opts.american !== false) {
      for (k = 0; k < answers.length; k++) {
        var us = americanForm(canon(display(answers[k])));
        if (us && inForms.indexOf(us) >= 0) { res.notes.push('Richtig – das ist die amerikanische Schreibweise. In der Schule (britisch): ' + q(display(answers[k])) + '.'); return done('right', answers[k]); }
      }
    }
    // 3. another translation from the list (synonym) or another word from the list
    var pool = (opts.pool || []).filter(function (p) { return p !== item && T.norm(p.en) !== T.norm(item.en); });
    for (k = 0; k < pool.length; k++) {
      var pa = answersOf(pool[k]), hit = null;
      for (var z = 0; z < pa.length && !hit; z++) { var pf = forms(pa[z]); if (inForms.some(function (x) { return pf.indexOf(x) >= 0; })) hit = pa[z]; }
      if (!hit) continue;
      if (sameMeaning(pool[k], item)) { res.notes.push(q(display(hit)) + ' passt auch. Gelernt hast du hier: ' + q(res.answer) + '.'); return done('synonym'); }
      res.other = { en: display(hit), de: firstGerman(pool[k].de) };
      res.hints.push('Das ist ein anderes Wort: ' + q(display(hit)) + ' heißt ' + q(res.other.de) + '.');
      return done('wrongword');
    }
    // 4. right word, wrong form
    for (k = 0; k < answers.length; k++) {
      var slip = wordFormSlip(raw, answers[k]);
      if (slip) { res.notes.push(slip); return done('form', answers[k]); }
    }
    // 5. spelt wrong — but only if it is not closer to another word of the list
    var best = null, bestD = 1e9;
    for (k = 0; k < answers.length; k++) {
      var tgt = display(answers[k]), cands = [tgt, tgt.replace(ARTICLE, ''), tgt.replace(/^to /, '')];
      cands.forEach(function (c) {
        var d = T.dist(letters(raw), letters(c));
        if (d < bestD && closeEnough(raw, c)) { bestD = d; best = { show: answers[k], cmp: c }; }
      });
    }
    if (best) {
      var rival = pool.some(function (p) {
        return answersOf(p).some(function (x) { return T.dist(letters(raw), letters(display(x))) < bestD; });
      });
      if (!rival) {
        var cmpIn = alignArticle(raw, best.cmp);
        res.hints = hintsFor(cmpIn, best.cmp);
        var cn2 = capsNote(raw, display(best.show), true);
        if (cn2) res.notes.push(cn2);
        return done(isTypo(cmpIn, best.cmp) ? 'typo' : 'spelling', best.cmp === display(best.show) ? best.show : best.cmp);
      }
    }
    return done('wrong');
  }
  function stripArticleLike(inp, ans) { var a = T.clean(inp), b = display(ans); if (ARTICLE.test(b.toLowerCase()) || !ARTICLE.test(a.toLowerCase())) return a; return a.replace(/^(a|an|the) /i, ''); }
  function alignArticle(inp, tgt) {
    var a = T.clean(inp);
    if (!/^to /i.test(tgt) && /^to /i.test(a)) a = a.slice(3);
    if (!ARTICLE.test(tgt.toLowerCase()) && ARTICLE.test(a.toLowerCase())) a = a.replace(/^(a|an|the) /i, '');
    return a;
  }
  function germanForms(s) {
    var set = {};
    String(s || '').split(/\s*[;,/]\s*/).forEach(function (part) {
      optionals(T.norm(part)).forEach(function (x) {
        x = x.replace(/^(der|die|das|ein|eine|einen|sich) /, '').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[.!?]$/, '').trim();
        if (x) set[x] = 1;
      });
    });
    return Object.keys(set);
  }
  function firstGerman(de) { return T.clean(String(de || '').split(/\s*;\s*/)[0]); }
  function sameMeaning(a, b) {
    var fa = germanForms([a.de].concat(a.deAlt || []).join(';')), fb = germanForms([b.de].concat(b.deAlt || []).join(';'));
    return fa.some(function (x) { return fb.indexOf(x) >= 0; });
  }

  // ---------------------------------------------------------------- English → German (meaning)
  function german(input, item) {
    var raw = T.clean(input), res = { input: raw, notes: [], hints: [], answer: firstGerman(item.de) };
    if (!T.norm(raw)) return fin('empty');
    var targets = germanForms([item.de].concat(item.deAlt || []).join(';')), mine = germanForms(raw);
    if (mine.some(function (x) { return targets.indexOf(x) >= 0; })) return fin('right');
    var close = mine.some(function (x) { return targets.some(function (t) { var d = T.dist(x, t); return t.length >= 4 ? d <= Math.max(1, Math.floor(t.length / 5)) : d === 0; }); });
    if (close) { res.notes.push('Richtig gemeint. Geschrieben: ' + q(res.answer) + '.'); return fin('right'); }
    return fin('wrong');
    function fin(v) { res.verdict = v; res.known = v === 'right'; res.exact = v === 'right'; return res; }
  }

  // ---------------------------------------------------------------- sentences and grammar forms
  function sentCanon(s) {
    return T.clean(s).toLowerCase().replace(/[“”"]/g, '').replace(/\s[-–—]+\s/g, ' ').replace(/\s*[.!?]+\s*$/, '').replace(/\s*[,;:]\s*/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function sentForms(s) { return T.expandShort(sentCanon(s)).map(function (x) { return x.replace(/\bcan not\b/g, 'cannot').replace(/\bcannot\b/g, 'can not'); }); }

  var BE = ['am', 'is', 'are', 'was', 'were'], HAVE = ['have', 'has', 'had'], DO = ['do', 'does', 'did'];
  var SUBJ = { i: 'I', you: 'you', he: 'he', she: 'she', it: 'it', we: 'we', they: 'they' };
  function verbOf(form) {                                   // base form of a verb form, if we can tell
    var I = irregular();
    if (I.byInf[form]) return form;
    if (I.byForm[form]) return I.byForm[form][0].inf.replace(/\s*\(.*\)/, '');
    return null;
  }
  // one wrong word against the right word: a German explanation, or null
  function grammarSlip(w, r, rightToks, j) {
    var I = irregular(), prev = rightToks[j - 1] || '', prev2 = rightToks[j - 2] || '';
    // questions: "Did you go", "Does she like" — the helping verb stands before the subject
    if (!/^(did|does|do|not|to|can|could|must|will|would|should|may|might)$/.test(prev) && SUBJ[prev] && /^(did|does|do|can|could|must|will|would|should|may|might)$/.test(prev2)) prev = prev2;
    var v = verbOf(r), irr = v && I.byInf[v];
    if (irr && irr.past.indexOf(r) >= 0 && regularPast(v).concat([v + 'ed']).indexOf(w) >= 0)
      return q(v) + ' ist ein unregelmäßiges Verb. Die Vergangenheitsform lautet ' + q(r) + '.';
    if (irr && irr.pp.indexOf(r) >= 0 && irr.past.indexOf(r) < 0 && irr.past.indexOf(w) >= 0)
      return 'Hier braucht man die 3. Form (past participle): ' + q(v) + ' – ' + q(irr.past[0]) + ' – ' + q(r) + '.';
    if (irr && irr.pp.indexOf(r) >= 0 && regularPast(v).concat([v + 'ed']).indexOf(w) >= 0)
      return q(v) + ' ist unregelmäßig. Die 3. Form lautet ' + q(r) + '.';
    if (irr && r === v && (irr.past.indexOf(w) >= 0 || irr.pp.indexOf(w) >= 0) && /^(did|does|do|to|can|could|must|will|would|should|may|might)$/.test(prev))
      return 'Nach ' + q(prev) + ' steht die Grundform: ' + q(r) + '.';
    if (irr && r === v && (irr.past.indexOf(w) >= 0) && prev === 'not' && /^(did|does|do)$/.test(prev2))
      return 'Nach ' + q(prev2 + "n't") + ' steht die Grundform: ' + q(r) + ' (die Vergangenheit steckt schon in ' + q('did') + ').';
    if (irr && irr.past.indexOf(r) >= 0 && w === v) return 'Hier steht die Vergangenheit: ' + q(v) + ' → ' + q(r) + '.';
    if (!irr && regularPast(w).indexOf(r) >= 0) return 'Vergangenheit: Verb + ' + q('ed') + ' → ' + q(r) + '.';
    if (!irr && r.length > 3 && regularPast(r).indexOf(w) >= 0 && /^(did|not|to|can|must)$/.test(prev)) return 'Nach ' + q(prev === 'not' ? prev2 + "n't" : prev) + ' steht die Grundform: ' + q(r) + '.';
    if (sForm(w).indexOf(r) >= 0 && !/^(is|has)$/.test(r)) return 'Bei he / she / it kommt ein ' + q(r.slice(w.length)) + ' ans Verb: ' + q(r) + '.';
    if (sForm(r).indexOf(w) >= 0 && /^(does|did|doesn|not|can|must|to)$/.test(prev)) return 'Nach ' + q(prev === 'not' ? prev2 + "n't" : prev) + ' steht das Verb ohne s: ' + q(r) + '.';
    if (sForm(r).indexOf(w) >= 0) return 'Hier ohne -s: ' + q(r) + '.';
    if (BE.indexOf(w) >= 0 && BE.indexOf(r) >= 0) { var s = subjectBefore(rightToks, j); return 'Zu ' + q(s || 'diesem Subjekt') + ' passt ' + q(r) + '.'; }
    if (HAVE.indexOf(w) >= 0 && HAVE.indexOf(r) >= 0) { var s2 = subjectBefore(rightToks, j); return (r === 'has' ? 'Bei he / she / it heißt es ' + q('has') : 'Zu ' + q(s2 || 'diesem Subjekt') + ' passt ' + q(r)) + '.'; }
    if (DO.indexOf(w) >= 0 && DO.indexOf(r) >= 0) {
      if (r === 'did') return 'In der Vergangenheit hilft ' + q('did') + ' – für alle Personen.';
      return r === 'does' ? 'Bei he / she / it heißt es ' + q('does') + '.' : 'Bei I / you / we / they heißt es ' + q('do') + '.';
    }
    if (ingForm(w).indexOf(r) >= 0 || (r.slice(-3) === 'ing' && w + 'ing' === r)) return 'Verlaufsform: Verb + ' + q('ing') + ' → ' + q(r) + '.';
    if (/ing$/.test(r) && /ing$/.test(w) && r !== w) return 'Die ing-Form schreibt man ' + q(r) + '.';
    var COMP = { gooder: 'better', goodest: 'best', badder: 'worse', baddest: 'worst', worser: 'worse', manyer: 'more', mucher: 'more' };
    if (COMP[w] && (COMP[w] === r)) return q(w.replace(/(er|est)$/, '').replace(/^bad$/, 'bad')) + ' ist unregelmäßig: good – better – best / bad – worse – worst.';
    if (/er$/.test(w) && r === 'more') return 'Lange Adjektive steigert man mit ' + q('more') + ' (more interesting), nicht mit -er.';
    if (/est$/.test(w) && r === 'most') return 'Lange Adjektive: ' + q('the most') + ' (the most beautiful), nicht -est.';
    if (r === 'than' && /^(as|that|like|then)$/.test(w)) return 'Beim Vergleich heißt es ' + q('than') + ' (bigger than = größer als), nicht ' + q(w) + '.';
    if (/^(must|can|may)$/.test(r) === false && /^(musted|canned|mayed|mustd)$/.test(w)) return 'Modalverben haben keine -ed-Form. Für die Vergangenheit nimmst du die Ersatzform (had to / was able to / was allowed to).';
    if (/^(his|her|its|their|our|my|your)$/.test(w) && /^(his|her|its|their|our|my|your)$/.test(r)) return 'Das passende Possessivpronomen ist hier ' + q(r) + '.';
    if (/^(he|she|it|they|we|you|i|him|her|them|us|me)$/.test(w) && /^(he|she|it|they|we|you|i|him|her|them|us|me)$/.test(r)) return 'Hier passt das Pronomen ' + q(r === 'i' ? 'I' : r) + '.';
    if ((w === 'a' && r === 'an') || (w === 'an' && r === 'a')) return r === 'an' ? 'Vor einem Vokal-Laut: ' + q('an') + '.' : 'Vor einem Konsonanten-Laut: ' + q('a') + '.';
    return null;
  }
  function subjectBefore(toks, j) {
    for (var k = j - 1; k >= 0 && k >= j - 4; k--) if (SUBJ[toks[k]]) return SUBJ[toks[k]];
    for (k = j + 1; k < toks.length && k <= j + 2; k++) if (SUBJ[toks[k]]) return SUBJ[toks[k]];   // questions: "Are they …"
    return '';
  }
  function missingSlip(word, rightToks, j) {
    if (/^(do|does|did)$/.test(word)) return 'Hier fehlt das Hilfsverb ' + q(word) + ' (Fragen und Verneinung brauchen do / does / did).';
    if (BE.indexOf(word) >= 0 && /ing$/.test(rightToks[j + 1] || '')) return 'Bei der Verlaufsform fehlt ' + q(word) + ': ' + q(word + ' ' + rightToks[j + 1]) + '.';
    if (BE.indexOf(word) >= 0 && /^(allowed|able|going)$/.test(rightToks[j + 1] || '')) return 'Hier fehlt ' + q(word) + ': ' + q(word + ' ' + rightToks[j + 1] + ' to') + '.';
    if (word === 'to' && /^(allowed|able|have|has|had|going)$/.test(rightToks[j - 1] || '')) return 'Nach ' + q(rightToks[j - 1]) + ' kommt ' + q('to') + ': ' + q(rightToks[j - 1] + ' to') + '.';
    if (word === 'not') return 'Hier fehlt ' + q('not') + ' (oder die Kurzform n\'t).';
    if (word === 'than') return 'Beim Vergleich fehlt ' + q('than') + '.';
    if (word === 'the' && /^(most|best|worst)$/.test(rightToks[j + 1] || '')) return 'Vor ' + q(rightToks[j + 1]) + ' steht ' + q('the') + '.';
    if (/^(have|has)$/.test(word)) return 'Hier fehlt ' + q(word) + '.';
    return null;
  }
  function extraSlip(word, rightToks, inToks, i) {
    if (word === 'more' && /er$/.test(inToks[i + 1] || '')) return 'Entweder -er oder more – nicht beides: ' + q(inToks[i + 1]) + '.';
    if (word === 'most' && /est$/.test(inToks[i + 1] || '')) return 'Entweder -est oder most – nicht beides: ' + q(inToks[i + 1]) + '.';
    if (/^(do|does|did)$/.test(word)) return 'Hier braucht man kein ' + q(word) + '.';
    if (BE.indexOf(word) >= 0) return 'Das ' + q(word) + ' ist hier zu viel.';
    if (word === 'to' && /^(can|must|may|could|should|will|would|mustn't|can't)$/.test(inToks[i - 1] || '')) return 'Nach ' + q(inToks[i - 1]) + ' kommt kein ' + q('to') + '.';
    return null;
  }

  // answers: list of right answers (strings); opts: { wrongs: { "<wrong answer>": "explanation" }, question: bool }
  function sentence(input, answers, opts) {
    opts = opts || {};
    var raw = T.clean(input), res = { input: raw, notes: [], hints: [], answer: T.clean(answers[0] || '') };
    function done(v) { res.verdict = v; res.known = !!KNOWN[v]; res.exact = !!EXACT[v]; return res; }
    if (!sentCanon(raw)) return done('empty');
    var mine = sentForms(raw), best = null;
    // 1. right
    for (var k = 0; k < answers.length; k++) {
      var f = sentForms(answers[k]);
      if (mine.some(function (x) { return f.indexOf(x) >= 0; })) {
        res.answer = T.clean(answers[k]);
        var notes = sentenceNotes(raw, res.answer);
        if (notes.length) { res.notes = notes; return done('caps'); }
        return done('right');
      }
    }
    // 1b. a known wrong answer with its own explanation (from the exercise / module)
    var wrongs = opts.wrongs || {};
    for (var wk in wrongs) {
      if (sentForms(wk).some(function (x) { return mine.indexOf(x) >= 0; })) { res.hints.push(wrongs[wk]); res.explained = true; }
    }
    // 2. closest right answer, word by word
    for (k = 0; k < answers.length; k++) {
      var af = sentForms(answers[k]);
      for (var x = 0; x < mine.length; x++) for (var y = 0; y < af.length; y++) {
        var a = mine[x].split(' '), b = af[y].split(' '), r = T.align(a, b);
        var cost = r.ops.reduce(function (s, o) { return s + (o.op === '=' ? 0 : o.op === 's' && closeEnough(o.a, o.b) ? 0.5 : 1); }, 0);
        if (!best || cost < best.cost) best = { cost: cost, ops: r.ops, a: a, b: b, ans: answers[k] };
      }
    }
    res.answer = T.clean(best.ans);
    var spelled = 0, gram = 0, wrong = 0;
    res.words = [];                                                    // for the coloured sentence
    best.ops.forEach(function (o) {
      if (o.op === '=') { res.words.push({ s: o.b, k: 'ok' }); return; }
      if (o.op === 't') { gram++; res.words.push({ s: o.b.join ? o.b.join(' ') : o.b, k: 'fix' }); return; }
      if (o.op === 's') {
        var slip = grammarSlip(o.a, o.b, best.b, o.j);
        if (slip) { gram++; addHint(slip); res.words.push({ s: o.b, k: 'fix', was: o.a }); return; }
        if (closeEnough(o.a, o.b)) { spelled++; hintsFor(o.a, o.b).forEach(function (hh) { addHint(q(o.b) + ': ' + hh); }); res.words.push({ s: o.b, k: 'spell', was: o.a }); return; }
        wrong++; res.words.push({ s: o.b, k: 'fix', was: o.a }); return;
      }
      if (o.op === 'i') { var ms = missingSlip(o.b, best.b, o.j); if (ms) { gram++; addHint(ms); } else wrong++; res.words.push({ s: o.b, k: 'miss' }); return; }
      var ex = extraSlip(o.a, best.b, best.a, o.i); if (ex) { gram++; addHint(ex); } else wrong++;
      res.words.push({ s: o.a, k: 'extra' });
    });
    function addHint(h) { if (res.hints.indexOf(h) < 0) res.hints.push(h); }
    if (best.a.length === best.b.length && best.a.slice().sort().join(' ') === best.b.slice().sort().join(' ')) {
      res.hints.unshift('Alle Wörter stimmen – nur die Reihenfolge nicht.');
      return done('order');
    }
    if (best.b.length === 1 && best.a.length === 1 && !gram && spelled) {
      res.diff = diff(raw, res.answer);
      res.hints = hintsFor(raw, res.answer);
      return done(isTypo(raw, res.answer) ? 'typo' : 'spelling');
    }
    if (!gram && !wrong && spelled) return done('spelling');
    if (res.explained || (gram && wrong <= gram)) return done('grammar');
    return done('wrong');
  }
  function sentenceNotes(raw, ans) {
    var notes = [], a = T.clean(raw), b = T.clean(ans);
    if (/\?$/.test(b) && !/\?$/.test(a)) notes.push('Am Ende einer Frage steht ein Fragezeichen.');
    var aw = a.replace(/[.!?]$/, '').split(' '), bw = b.replace(/[.!?]$/, '').split(' ');
    if (bw.length === 1) return notes;                                  // a gap: capital letters do not matter
    if (/^[a-z]/.test(aw[0]) && /^[A-Z]/.test(bw[0])) notes.push('Ein Satz beginnt mit einem großen Buchstaben.');
    if (aw.some(function (x) { return /^i('|$)/.test(x); })) notes.push(q('I') + ' (ich) schreibt man immer groß.');
    if (aw.length === bw.length) {
      for (var k = 1; k < bw.length; k++) {
        var x = aw[k], y = bw[k];
        if (x === y || x.toLowerCase() !== y.toLowerCase() || /^i('|$)/i.test(y)) continue;
        if (/^[A-Z]/.test(y)) notes.push(q(y) + ' schreibt man groß.');
        else notes.push('Im Englischen klein: ' + q(y) + '.');
      }
    }
    return notes.filter(function (n, i) { return notes.indexOf(n) === i; });
  }

  root.EB.check = {
    word: word, german: german, sentence: sentence,
    hintsFor: hintsFor, diff: diff, syllables: syllables, helpMask: helpMask,
    answersOf: answersOf, display: display, forms: forms, closeEnough: closeEnough, american: americanForm,
    sameMeaning: sameMeaning, firstGerman: firstGerman, germanForms: germanForms,
    regularPast: regularPast, ingForm: ingForm, sForm: sForm,
    KNOWN: KNOWN, EXACT: EXACT
  };
})(typeof window !== 'undefined' ? window : globalThis);
