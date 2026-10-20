/*
 * grammar.js — grammar modules: the text format a parent can write, and the exercise generators.
 *
 * A module (built in: data/grammar.js; a parent's own: saved in the content layer):
 *   { id, title, year, unit, order, level (1–3), intro: "German explanation, **bold**, - bullets",
 *     examples: "English = Deutsch" lines, mistakes: "wrong => right => why" lines,
 *     exercises: lines (below), gen: ['irr-past', …] generators, active: true }
 *
 * Exercise lines:
 *   ! Setze das Verb ins simple past.                      instruction for the following lines
 *   @ past-irr = unregelmäßige Verben                      a concept and its name
 *   lücke [past-irr] | Yesterday Tom ___ (go) to school. | went | «go» ist unregelmäßig: go – went – gone.
 *   ~ goed = «go» ist unregelmäßig. Die Vergangenheitsform lautet «went».      (explains one wrong answer)
 *   # a comment
 * Fields: type [concept] | task | right answer ; another right answer | explanation (shown after a mistake)
 * Types: lücke · form · verneinen · frage · ordnen · übersetzen · korrigieren
 *   lücke/form: Lukas types only the missing word(s); the others: the whole sentence.
 *   ordnen: the task is the words, separated by " / " (or empty: the words of the answer, mixed).
 *
 * The same concept has many exercises, so a mistake comes back later with a DIFFERENT sentence.
 */
(function (root) {
  'use strict';
  var T = root.EB.text;

  var TYPE_ALIASES = {
    'lücke': 'luecke', luecke: 'luecke', fill: 'luecke', gap: 'luecke', 'lückentext': 'luecke',
    form: 'form', verbform: 'form', 'verb form': 'form',
    verneinen: 'neg', verneinung: 'neg', negative: 'neg', neg: 'neg',
    frage: 'frage', fragen: 'frage', question: 'frage',
    ordnen: 'ordnen', order: 'ordnen', reihenfolge: 'ordnen', 'sätze ordnen': 'ordnen',
    'übersetzen': 'trans', uebersetzen: 'trans', translate: 'trans', 'übersetzung': 'trans',
    korrigieren: 'fix', korrektur: 'fix', correct: 'fix', 'fehler finden': 'fix'
  };
  var TYPE = {
    luecke: { name: 'Lücke', instr: 'Setze das fehlende Wort ein.', whole: false },
    form: { name: 'Verbform', instr: 'Setze das Verb in der richtigen Form ein.', whole: false },
    neg: { name: 'Verneinen', instr: 'Verneine den Satz.', whole: true },
    frage: { name: 'Frage bilden', instr: 'Bilde eine Frage.', whole: true },
    ordnen: { name: 'Ordnen', instr: 'Bring die Wörter in die richtige Reihenfolge.', whole: true },
    trans: { name: 'Übersetzen', instr: 'Übersetze ins Englische.', whole: true },
    fix: { name: 'Korrigieren', instr: 'Im Satz ist ein Fehler. Schreib den Satz richtig.', whole: true }
  };

  function hash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); }
  function lines(v) { return Array.isArray(v) ? v : String(v || '').split(/\r?\n/); }

  // text → items; errors are reported for the parent editor (line number + reason)
  function parseExercises(text, modId) {
    var items = [], errors = [], concepts = {}, instr = null, last = null, seen = {};
    lines(text).forEach(function (rawLine, n) {
      var l = T.clean(rawLine);
      if (!l || l[0] === '#') return;
      if (l[0] === '!') { instr = T.clean(l.slice(1)) || null; return; }
      if (l[0] === '@') { var c = /^@\s*([\w-]+)\s*=\s*(.+)$/.exec(l); if (c) concepts[c[1]] = T.clean(c[2]); else errors.push({ line: n + 1, text: l, why: 'So: @ name = Bezeichnung' }); return; }
      if (l[0] === '~') {
        var w = /^~\s*(.+?)\s+=\s+(.+)$/.exec(l);
        if (!w || !last) { errors.push({ line: n + 1, text: l, why: 'So: ~ falsche Antwort = Erklärung (direkt unter einer Aufgabe)' }); return; }
        last.wrongs[T.clean(w[1])] = T.clean(w[2]); return;
      }
      var parts = l.split(/\s*\|\s*/);
      var head = /^([^\[]+?)\s*(?:\[\s*([\w-]+)\s*\])?$/.exec(parts[0] || '');
      var type = head && TYPE_ALIASES[T.norm(head[1])];
      if (!type) { errors.push({ line: n + 1, text: l, why: 'Unbekannte Art „' + (parts[0] || '') + '“. Möglich: lücke, form, verneinen, frage, ordnen, übersetzen, korrigieren' }); return; }
      if (parts.length < 3 || !T.clean(parts[2])) { errors.push({ line: n + 1, text: l, why: 'Es fehlt die richtige Antwort (Art | Aufgabe | Antwort | Erklärung)' }); return; }
      var answers = parts[2].split(/\s*;\s*/).map(T.clean).filter(Boolean);
      var q = T.clean(parts[1] || '');
      if (type === 'ordnen' && !q) q = T.shuffle(answers[0].replace(/[.!?]$/, '').split(' '), T.rng(parseInt(hash(answers[0]), 36))).join(' / ');
      if (type !== 'ordnen' && !q) { errors.push({ line: n + 1, text: l, why: 'Die Aufgabe fehlt' }); return; }
      var id = modId + ':' + hash(type + '|' + q);
      if (seen[id]) id += '-' + n; seen[id] = 1;
      last = { id: id, mod: modId, type: type, concept: head[2] || modId, instr: instr || TYPE[type].instr, q: q, answers: answers,
               why: T.clean(parts.slice(3).join(' | ')), wrongs: {}, line: n + 1 };
      items.push(last);
    });
    return { items: items, errors: errors, concepts: concepts };
  }

  function parseExamples(v) {
    return lines(v).map(function (l) {
      if (typeof l === 'object' && l) return { en: l.en || l[0], de: l.de || l[1] || '' };
      var p = String(l).split(/\s+=\s+/); return p[0] && T.clean(p[0]) ? { en: T.clean(p[0]), de: T.clean(p[1] || '') } : null;
    }).filter(Boolean);
  }
  function parseMistakes(v) {
    return lines(v).map(function (l) {
      if (typeof l === 'object' && l) return { wrong: l.wrong || l[0], right: l.right || l[1], why: l.why || l[2] || '' };
      var p = String(l).split(/\s*=>\s*/); return p.length >= 2 ? { wrong: T.clean(p[0]), right: T.clean(p[1]), why: T.clean(p[2] || '') } : null;
    }).filter(Boolean);
  }

  // ---------------------------------------------------------------- irregular verb generators
  function verbs() { return (root.EB.data && root.EB.data.irregular) || []; }
  function frames() { return (root.EB.data && root.EB.data.irregularFrames) || {}; }
  function slash(a) { return a.join(' / '); }
  var GEN = {
    'irr-past': function (modId) {
      return verbs().map(function (v) {
        return { id: modId + ':past-' + v.id, mod: modId, type: 'form', concept: 'irr-past', gen: 'irr-past', verb: v.id,
          instr: 'Wie heißt das simple past (2. Form)?', q: v.inf + ' (' + v.de + ') → ___', answers: v.past.map(function (p) { return p.replace(/\s*\(.*\)/, ''); }),
          why: v.inf + ' – ' + slash(v.past) + ' – ' + slash(v.pp), wrongs: {} };
      });
    },
    'irr-pp': function (modId) {
      return verbs().map(function (v) {
        return { id: modId + ':pp-' + v.id, mod: modId, type: 'form', concept: 'irr-pp', gen: 'irr-pp', verb: v.id,
          instr: 'Wie heißt das past participle (3. Form)?', q: v.inf + ' – ' + slash(v.past) + ' – ___', answers: v.pp.map(function (p) { return p.replace(/\s*\(.*\)/, ''); }),
          why: v.inf + ' – ' + slash(v.past) + ' – ' + slash(v.pp), wrongs: {} };
      });
    },
    'irr-both': function (modId) {
      return verbs().map(function (v) {
        var ans = [];
        v.past.forEach(function (p) { v.pp.forEach(function (q) { ans.push(p.replace(/\s*\(.*\)/, '') + ' ' + q.replace(/\s*\(.*\)/, '')); }); });
        return { id: modId + ':both-' + v.id, mod: modId, type: 'form', concept: 'irr-both', gen: 'irr-both', verb: v.id,
          instr: 'Schreib die 2. und die 3. Form (mit Leerzeichen dazwischen).', q: v.inf + ' (' + v.de + ') – ___ – ___', answers: ans,
          why: v.inf + ' – ' + slash(v.past) + ' – ' + slash(v.pp), wrongs: {} };
      });
    },
    'irr-frame': function (modId) {
      var F = frames(), out = [];
      verbs().forEach(function (v) {
        (F[v.id] || []).forEach(function (f, k) {
          out.push({ id: modId + ':frame-' + v.id + '-' + k, mod: modId, type: 'form', concept: 'irr-past', gen: 'irr-frame', verb: v.id,
            instr: 'Setze das Verb ins simple past.', q: f, answers: v.past.map(function (p) { return p.replace(/\s*\(.*\)/, ''); }),
            why: v.inf + ' ist unregelmäßig: ' + v.inf + ' – ' + slash(v.past) + ' – ' + slash(v.pp) + '.', wrongs: {} });
        });
      });
      return out;
    }
  };
  var GEN_CONCEPTS = { 'irr-past': '2. Form (simple past)', 'irr-pp': '3. Form (past participle)', 'irr-both': '2. und 3. Form' };

  function compile(m) {
    if (m && m._compiled) return m;
    var ex = parseExercises(m.exercises, m.id), items = ex.items.slice(), concepts = Object.assign({}, ex.concepts);
    (m.gen || []).forEach(function (g) {
      if (!GEN[g]) { ex.errors.push({ line: 0, text: g, why: 'Unbekannter Generator' }); return; }
      GEN[g](m.id).forEach(function (it) { items.push(it); if (!concepts[it.concept]) concepts[it.concept] = GEN_CONCEPTS[it.concept] || it.concept; });
    });
    items.forEach(function (it) { if (!concepts[it.concept]) concepts[it.concept] = it.concept === m.id ? m.title : it.concept; });
    var mistakes = parseMistakes(m.mistakes), wrongs = {};
    mistakes.forEach(function (x) { if (x.why) wrongs[x.wrong] = x.why; });
    return Object.assign({}, m, {
      _compiled: true, year: +m.year || 6, level: +m.level || 1, order: +m.order || 0, active: m.active !== false,
      examples: parseExamples(m.examples), mistakes: mistakes, moduleWrongs: wrongs, items: items, concepts: concepts, errors: ex.errors,
      source: { examples: m.examples, mistakes: m.mistakes, exercises: m.exercises }
    });
  }

  // what the screen shows for a task: the instruction, the sentence (with "___"), whether one word or a whole sentence
  function task(it) {
    var t = TYPE[it.type];
    return { instr: it.instr || t.instr, q: it.q, whole: t.whole, typeName: t.name,
             words: it.type === 'ordnen' ? it.q.split(/\s*\/\s*/) : null, de: it.type === 'trans' };
  }
  // does the expected answer go into the gap? ("went" into "Tom ___ (go) to school.") → sentence for read-aloud / solution
  function filled(it, answer) {
    if (TYPE[it.type].whole) return answer;
    var gaps = (it.q.match(/_{2,}/g) || []).length, a = String(answer).split(' '), k = 0;
    var s = it.q.replace(/_{2,}/g, function () {
      if (gaps > 1 && a.length === gaps) return a[k++];
      return k++ ? '' : answer;
    });
    return s.replace(/\s*\([^)]*\)/g, '').replace(/\s*→\s*/, ' → ').replace(/\s+([.,!?])/g, '$1').replace(/\s+/g, ' ').trim();
  }
  function stringify(items) {          // back to text (parent editor: "edit the exercises of a built-in module")
    return items.filter(function (it) { return !it.gen; }).map(function (it) {
      var name = { luecke: 'lücke', form: 'form', neg: 'verneinen', frage: 'frage', ordnen: 'ordnen', trans: 'übersetzen', fix: 'korrigieren' }[it.type];
      var s = name + (it.concept && it.concept !== it.mod ? ' [' + it.concept + ']' : '') + ' | ' + it.q + ' | ' + it.answers.join(' ; ') + (it.why ? ' | ' + it.why : '');
      Object.keys(it.wrongs || {}).forEach(function (w) { s += '\n~ ' + w + ' = ' + it.wrongs[w]; });
      return s;
    }).join('\n');
  }

  root.EB.grammar = { compile: compile, parseExercises: parseExercises, task: task, filled: filled, stringify: stringify, TYPE: TYPE, GEN: GEN, hash: hash };
})(typeof window !== 'undefined' ? window : globalThis);
