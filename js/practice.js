/*
 * practice.js — one round: new-word cards, vocabulary questions, grammar exercises, the end screen.
 *
 * A vocabulary question (German → English):
 *   1st try right                → "Richtig!"
 *   1st try known but spelt wrong → "Fast richtig!" + what to look at, then Lukas writes it once correctly
 *   1st try wrong                → "Noch nicht." (no answer shown) + first letter as a tip → 2nd try
 *   2nd try wrong / "Hilfe" 3×   → the answer, in syllables, and Lukas copies it once
 * Words he did not know come back once later in the same round.
 * Probe-Klassenarbeit: one try, no feedback until the end.
 */
(function (root) {
  'use strict';
  var EB = root.EB, U = EB.ui, h = U.h, C = EB.check, G = EB.grammar;

  var MODE_REASON = { heute: 'Heute geübt', neu: 'Neue Vokabeln', alt: 'Vokabeln wiederholt', fehler: 'Fehler geübt', grammatik: 'Grammatik geübt',
                      mix: 'Gemischtes Training', ka: 'Für die Klassenarbeit geübt', probe: 'Probe-Klassenarbeit', verbessern: 'Fehler verbessert' };
  var BONUS = { heute: 5, probe: 8, verbessern: 3 };

  function run(app, round, opts) {
    opts = opts || {};
    var store = app.store, content = app.content, st = store.settings();
    var steps = round.steps.slice(), i = 0, results = [], startedAt = Date.now(), coins = 0, requeued = {}, test = !!round.test;
    var asked = 0, firstRight = 0, known = 0, wrong = 0, improved = {}, hardFixed = 0, weakWords = {}, weakGram = {};
    var view = h('section', { class: 'run' + (test ? ' test' : '') });
    var head = h('div', { class: 'run-head' });
    var countEl = h('span', { class: 'run-count' }), prog = h('span', { class: 'run-prog' }, [h('span', { class: 'run-prog-fill' })]);
    head.appendChild(h('span', { class: 'run-title', text: opts.title || '' }));
    head.appendChild(prog); head.appendChild(countEl);
    head.appendChild(h('button', { class: 'link small', type: 'button', text: 'Beenden', onclick: function () { if (asked && !test) finish(); else app.go('home'); } }));
    var body = h('div', { class: 'run-body' });
    view.appendChild(head); view.appendChild(body);
    app.setView(view, { back: false });

    if (!steps.length) {
      body.appendChild(U.robinSays(app.robin('thinking', 64), opts.empty || 'Gerade gibt es hier nichts zu üben. Schau, ob deine Eltern schon Wörter eingetragen haben.'));
      body.appendChild(h('div', { class: 'row' }, [h('button', { class: 'btn primary', type: 'button', text: 'Zur Startseite', onclick: function () { app.go('home'); } })]));
      return;
    }
    next();

    function updateHead() {
      var total = steps.filter(function (s) { return s.kind !== 'learn'; }).length, done = steps.slice(0, i).filter(function (s) { return s.kind !== 'learn'; }).length;
      countEl.textContent = Math.min(done + 1, total) + ' / ' + total;
      prog.firstChild.style.width = Math.round(100 * done / Math.max(1, total)) + '%';
    }
    function next() {
      EB.speech.stop();
      if (i >= steps.length) return finish();
      updateHead();
      var s = steps[i];
      body.innerHTML = '';
      window.__ebStep = s;
      if (s.kind === 'learn') learnCard(s);
      else if (s.kind === 'word') wordStep(s);
      else gramStep(s);
      window.scrollTo(0, 0);
    }
    function advance() { i++; next(); }
    function continueButton(label) {
      var b = h('button', { class: 'btn primary next', type: 'button', text: label || 'Weiter ›', onclick: advance });
      setTimeout(function () { b.focus(); }, 30);
      return b;
    }

    // ---------------------------------------------------------------- new word
    function learnCard(s) {
      var w = s.word, en = C.display(w.en);
      var card = h('div', { class: 'card learn' }, [
        h('p', { class: 'kicker', text: 'Neues Wort' }),
        h('div', { class: 'learn-pair' }, [
          h('div', { class: 'lp-de' }, [h('span', { class: 'lab', text: 'Deutsch' }), h('span', { class: 'big', text: DE(w.de) })]),
          h('div', { class: 'lp-en' }, [h('span', { class: 'lab', text: 'Englisch' }), h('span', { class: 'big en', lang: 'en', text: en }), U.sayButton(en, 'en', '🔊 Anhören')])
        ]),
        /-/.test(C.syllables(en.replace(/^to /, ''))) ? h('p', { class: 'syll' }, [h('span', { class: 'lab', text: 'In Silben: ' }), h('span', { lang: 'en', text: C.syllables(en.replace(/^to /, '')) })]) : null,
        w.note ? h('p', { class: 'note-line', text: w.note }) : null,
        w.example ? h('p', { class: 'example', lang: 'en' }, [h('span', { text: w.example }), ' ', U.sayButton(w.example, 'en', '🔊')]) : null
      ]);
      var inp = U.input({ class: 'answer-in', 'aria-label': 'Schreib das Wort einmal ab', placeholder: 'einmal abschreiben (freiwillig)', lang: 'en' });
      var fb = h('div', { class: 'feedback' });
      var form = h('form', { class: 'answer-row', onsubmit: function (e) { e.preventDefault(); if (inp.value.trim()) { var r = C.word(inp.value, w); if (r.exact) { fb.innerHTML = ''; fb.appendChild(h('p', { class: 'ok-line', text: '✓ Genau so.' })); setTimeout(advance, 450); return; } fb.innerHTML = ''; fb.appendChild(compare(r, w)); return; } advance(); } }, [inp, h('button', { class: 'btn primary', type: 'submit', text: 'Weiter ›' })]);
      card.appendChild(form); card.appendChild(fb);
      body.appendChild(card);
      if (st.autoSpeak) U.speak(en, 'en');
      setTimeout(function () { inp.focus(); }, 30);
    }

    // ---------------------------------------------------------------- vocabulary question
    function wordStep(s) {
      var w = s.word, dir = s.dir, en = C.display(w.en);
      var state = { tries: 0, help: 0, first: null, second: null, shown: false, phase: 'ask', firstInput: '', copies: 0 };
      var pool = content.words;
      var card = h('div', { class: 'card q' });
      var kicker = dir === 'en-de' ? 'Was heißt das auf Deutsch?' : dir === 'listen' ? 'Hör zu und schreib das Wort auf Englisch.' : 'Wie heißt das auf Englisch?';
      card.appendChild(h('p', { class: 'kicker', text: s.again ? kicker + ' (noch einmal)' : kicker }));
      var promptRow = h('div', { class: 'prompt-row' });
      if (dir === 'en-de') { promptRow.appendChild(h('span', { class: 'prompt en', lang: 'en', text: en })); var sb = U.sayButton(en, 'en'); if (sb) promptRow.appendChild(sb); }
      else if (dir === 'listen') { promptRow.appendChild(h('button', { class: 'btn primary listen', type: 'button', text: '🔊 Noch einmal hören', onclick: function () { U.speak(en, 'en'); } })); promptRow.appendChild(h('span', { class: 'prompt-sub', text: '(' + DE(w.de) + ')' })); }
      else { promptRow.appendChild(h('span', { class: 'prompt', text: DE(w.de) })); var sd = U.sayButton(DE(w.de), 'de'); if (sd) promptRow.appendChild(sd); }
      card.appendChild(promptRow);
      if (dir !== 'en-de' && w.type === 'verb' && !/^\(?to\)? /.test(T(w.en))) card.appendChild(h('p', { class: 'meta', text: 'Verb' }));
      var inp = U.input({ class: 'answer-in', 'aria-label': dir === 'en-de' ? 'deine Antwort auf Deutsch' : 'deine Antwort auf Englisch', lang: dir === 'en-de' ? 'de' : 'en' });
      var checkBtn = h('button', { class: 'btn primary check', type: 'submit', text: test ? 'Weiter ›' : 'Prüfen' });
      var form = h('form', { class: 'answer-row', onsubmit: function (e) { e.preventDefault(); submit(inp.value); } }, [inp, checkBtn]);
      card.appendChild(form);
      var tools = h('div', { class: 'tools' });
      var helpBtn = h('button', { class: 'btn soft small', type: 'button', text: '💡 Hilfe', onclick: help });
      if (!test) tools.appendChild(helpBtn);
      card.appendChild(tools);
      var tip = h('div', { class: 'tip' }), fb = h('div', { class: 'feedback', 'aria-live': 'polite' });
      card.appendChild(tip); card.appendChild(fb);
      body.appendChild(card);
      if (dir === 'listen') setTimeout(function () { U.speak(en, 'en'); }, 200);
      setTimeout(function () { inp.focus(); }, 30);
      window.__ebTest = function () { return { kind: 'word', dir: dir, answer: dir === 'en-de' ? C.firstGerman(w.de) : en, phase: state.phase, word: w }; };

      function check(v) { return dir === 'en-de' ? C.german(v, w) : C.word(v, w, { pool: pool, american: st.american !== false }); }
      function submit(v) {
        if (state.phase === 'done') return advance();
        if (state.phase === 'copy') return copyCheck(v);
        var r = check(v);
        if (r.verdict === 'empty' && !test) { tip.innerHTML = ''; tip.appendChild(h('p', { class: 'soft-line', text: 'Schreib deine Antwort hinein – oder nimm die Hilfe.' })); inp.focus(); return; }
        state.tries++;
        if (state.tries === 1) { state.first = r.verdict; state.firstInput = v; } else state.second = r.verdict;
        if (test) { results.push({ step: s, r: r, input: v }); record(); return advance(); }
        fb.innerHTML = ''; tip.innerHTML = '';
        if (r.exact) return done(true, r);
        if (r.known) {
          fb.appendChild(nearly(r, w, dir));
          if (dir === 'en-de') return done(false, r, true);
          state.phase = 'copy'; askCopy(r.verdict === 'typo');
          return;
        }
        if (state.tries === 1 && st.retry !== false) {
          var box = h('div', { class: 'fb-box no' }, [h('p', { class: 'fb-title', text: 'Noch nicht.' })]);
          (r.hints || []).forEach(function (x) { box.appendChild(h('p', { rich: x })); });
          box.appendChild(h('p', { text: 'Versuch es noch einmal.' }));
          fb.appendChild(box);
          if (dir !== 'en-de') { state.help = Math.max(state.help, 1); showMask(1); }
          inp.value = ''; inp.focus();
          return;
        }
        reveal();
      }
      function help() {
        if (state.phase !== 'ask') return;
        state.help++;
        if (state.help >= 3 || dir === 'en-de' && state.help >= 1) return reveal();
        showMask(state.help);
        inp.focus();
      }
      function showMask(level) {
        tip.innerHTML = '';
        tip.appendChild(h('p', { class: 'mask', lang: 'en', 'aria-label': 'Tipp' }, [h('span', { class: 'lab', text: 'Tipp: ' }), C.helpMask(en.replace(/^to /, ''), level)]));
        helpBtn.textContent = level >= 2 ? '💡 Lösung zeigen' : '💡 Mehr Hilfe';
      }
      function reveal() {
        state.shown = true; fb.innerHTML = ''; tip.innerHTML = '';
        var ans = dir === 'en-de' ? DE(w.de) : en;
        var box = h('div', { class: 'fb-box show' }, [h('p', { class: 'fb-title', text: 'Das richtige Wort:' }),
          h('p', { class: 'answer-big', lang: dir === 'en-de' ? 'de' : 'en' }, [ans, ' ', U.sayButton(en, 'en')])]);
        if (dir !== 'en-de' && /-/.test(C.syllables(en.replace(/^to /, '')))) box.appendChild(h('p', { class: 'syll' }, [h('span', { class: 'lab', text: 'In Silben: ' }), C.syllables(en.replace(/^to /, ''))]));
        if (w.note) box.appendChild(h('p', { class: 'note-line', text: w.note }));
        if (state.firstInput && state.first === 'wrongword') box.appendChild(h('p', { class: 'soft-line', rich: '«' + state.firstInput + '» war ein anderes Wort aus deiner Liste.' }));
        fb.appendChild(box);
        if (dir === 'en-de') return done(false, null, true);
        state.phase = 'copy'; askCopy(false);
      }
      function askCopy(optional) {
        helpBtn.hidden = true;
        card.insertBefore(fb, form); card.insertBefore(tip, form);
        inp.value = ''; inp.classList.add('copy');
        inp.setAttribute('aria-label', 'Schreib das Wort richtig ab');
        checkBtn.textContent = 'Fertig';
        tip.innerHTML = '';
        tip.appendChild(h('p', { class: 'copy-line', text: optional ? 'Schreib es noch einmal richtig – oder klick auf „Weiter“.' : 'Jetzt schreib es einmal richtig:' }));
        if (optional) tools.appendChild(h('button', { class: 'btn soft small', type: 'button', text: 'Weiter ›', onclick: function () { state.phase = 'ask'; done(false, null, true); } }));
        inp.focus();
      }
      function copyCheck(v) {
        var r = C.word(v, w);
        state.copies++;
        if (r.exact) { tip.innerHTML = ''; tip.appendChild(h('p', { class: 'ok-line', text: '✓ Gut! Genau so.' })); return done(false, null, true); }
        tip.innerHTML = '';
        tip.appendChild(h('div', { class: 'fb-box spell' }, [h('p', { text: state.copies >= 2 ? 'Fast. Schau es dir noch einmal in Ruhe an:' : 'Schau noch einmal genau hin:' }), compare(r, w)]));
        if (state.copies >= 2) tip.appendChild(h('div', { class: 'row' }, [h('button', { class: 'btn soft', type: 'button', text: 'Weiter ›', onclick: function () { done(false, null, true); } })]));
        inp.value = ''; inp.focus();
      }
      function done(success, r, quiet) {
        if (state.phase === 'done') return;
        var res = record();
        state.phase = 'done';
        inp.disabled = true; checkBtn.hidden = true; helpBtn.hidden = true;
        tools.innerHTML = '';
        if (success) {
          var box = h('div', { class: 'fb-box ok' }, [h('p', { class: 'fb-title', text: state.tries > 1 ? 'Jetzt stimmt\'s!' : pick(['Richtig!', 'Super!', 'Genau!', 'Klasse!']) })]);
          if (dir !== 'en-de' && r && r.answer && T(r.answer) !== T(state.firstInput)) box.appendChild(h('p', { lang: 'en', text: r.answer }));
          (r && r.notes || []).forEach(function (x) { box.appendChild(h('p', { class: 'note-line', rich: x })); });
          if (dir === 'en-de') box.appendChild(h('p', { text: en + ' = ' + DE(w.de) }));
          fb.innerHTML = ''; fb.appendChild(box);
          if (st.autoSpeak && dir !== 'listen') U.speak(en, 'en');
        }
        if (res.coins) { U.coinFloat(card, res.coins); }
        if (res.up && res.after === 'sicher') fb.appendChild(h('p', { class: 'up-line', text: '⭐ «' + en + '» ist jetzt sicher!' }));
        if (res.fixed) fb.appendChild(h('p', { class: 'up-line', text: '💪 Das war ein schwieriges Wort – jetzt klappt es!' }));
        fb.appendChild(h('div', { class: 'row' }, [continueButton()]));
      }
      function record() {
        if (state.recorded) return state.recorded;
        var r = store.recordWord(w, { first: state.first, second: state.second, help: state.help, shown: state.shown, dir: dir, mode: round.mode, answer: state.firstInput, introduced: s.introduced, test: test });
        asked++;
        if (r.outcome === 'exact') firstRight++; else if (r.outcome === 'wrong') { wrong++; weakWords[w.key] = w; } else { known++; weakWords[w.key] = weakWords[w.key] || (r.outcome === 'spelling' ? w : null); }
        if (STAGE_UP(r)) improved[w.key] = 1;
        var fixed = r.wasHard && !r.nowHard;
        if (fixed) hardFixed++;
        var n = test ? 0 : app.itemCoins(w.key, r, { fixed: fixed });
        coins += n;
        if (!test && r.outcome === 'wrong' && !requeued[w.key]) { requeued[w.key] = 1; steps.splice(Math.min(steps.length, i + 4), 0, { kind: 'word', word: w, dir: dir === 'en-de' ? 'de-en' : dir, again: true }); }
        state.recorded = { coins: n, up: STAGE_UP(r), after: r.after, fixed: fixed };
        return state.recorded;
      }
    }

    // ---------------------------------------------------------------- grammar exercise
    function gramStep(s) {
      var it = s.item, mod = content.modById[it.mod], t = G.task(it);
      var state = { tries: 0, help: 0, first: null, second: null, shown: false, phase: 'ask', firstInput: '' };
      var card = h('div', { class: 'card q gram' });
      card.appendChild(h('p', { class: 'kicker' }, [h('span', { text: mod ? mod.title : 'Grammatik' }), h('span', { class: 'kicker-sub', text: ' · ' + (mod && mod.concepts[it.concept] && it.concept !== it.mod ? mod.concepts[it.concept] : t.typeName) })]));
      card.appendChild(h('p', { class: 'instr', rich: t.instr }));
      var qEl = h('p', { class: 'gq', lang: t.de ? 'de' : 'en' });
      if (t.words) t.words.forEach(function (wd) { qEl.appendChild(h('button', { class: 'chip word', type: 'button', text: wd, onclick: function () { inp.value = (inp.value ? inp.value.replace(/\s+$/, '') + ' ' : '') + wd; inp.focus(); } })); });
      else String(t.q).split(/(_{2,})/).forEach(function (part) { qEl.appendChild(/^_{2,}$/.test(part) ? h('span', { class: 'gap', text: '…' }) : document.createTextNode(part)); });
      card.appendChild(h('div', { class: 'prompt-row' }, [qEl, t.de ? null : U.sayButton(it.q.replace(/_{2,}/g, '…').replace(/\([^)]*\)/g, ''), 'en')]));
      var inp = U.input({ class: 'answer-in' + (t.whole ? ' wide' : ''), 'aria-label': t.whole ? 'der ganze Satz auf Englisch' : 'das fehlende Wort', lang: 'en', placeholder: t.whole ? 'Schreib den ganzen Satz …' : '' });
      var checkBtn = h('button', { class: 'btn primary check', type: 'submit', text: test ? 'Weiter ›' : 'Prüfen' });
      var gform = h('form', { class: 'answer-row' + (t.whole ? ' col' : ''), onsubmit: function (e) { e.preventDefault(); submit(inp.value); } }, [inp, checkBtn]);
      card.appendChild(gform);
      var tools = h('div', { class: 'tools' });
      if (t.words) tools.appendChild(h('button', { class: 'btn soft small', type: 'button', text: '↺ Leeren', onclick: function () { inp.value = ''; inp.focus(); } }));
      var ruleBtn = mod ? h('button', { class: 'btn soft small', type: 'button', text: '📘 Regel', onclick: function () { showRule(app, mod); } }) : null;
      var helpBtn = h('button', { class: 'btn soft small', type: 'button', text: '💡 Lösung zeigen', onclick: function () { if (state.phase === 'ask') { state.help = 3; reveal(); } } });
      if (!test) { if (ruleBtn) tools.appendChild(ruleBtn); tools.appendChild(helpBtn); }
      card.appendChild(tools);
      var fb = h('div', { class: 'feedback', 'aria-live': 'polite' });
      card.appendChild(fb);
      body.appendChild(card);
      setTimeout(function () { inp.focus(); }, 30);
      window.__ebTest = function () { return { kind: 'gram', answer: it.answers[0], item: it, phase: state.phase }; };
      var wrongs = Object.assign({}, mod ? mod.moduleWrongs : {}, it.wrongs || {});

      function submit(v) {
        if (state.phase === 'done') return advance();
        if (state.phase === 'copy') {
          var c = C.sentence(v, it.answers);
          if (c.exact) return done(false);
          fb.appendChild(h('p', { class: 'soft-line', text: 'Schau noch einmal genau hin.' })); inp.value = ''; inp.focus(); return;
        }
        var r = C.sentence(v, it.answers, { wrongs: wrongs });
        if (r.verdict === 'empty' && !test) { fb.innerHTML = ''; fb.appendChild(h('p', { class: 'soft-line', text: 'Schreib deine Antwort hinein.' })); return; }
        state.tries++;
        if (state.tries === 1) { state.first = r.verdict; state.firstInput = v; } else state.second = r.verdict;
        if (test) { results.push({ step: s, r: r, input: v }); record(); return advance(); }
        fb.innerHTML = '';
        if (r.exact) return done(true, r);
        if (r.verdict === 'spelling' || r.verdict === 'typo') {
          var box = h('div', { class: 'fb-box spell' }, [h('p', { class: 'fb-title', text: 'Fast richtig! Die Grammatik stimmt.' })]);
          if (r.diff) box.appendChild(compareRaw(r));
          else box.appendChild(sentenceView(r));
          (r.hints || []).forEach(function (x) { box.appendChild(h('p', { rich: x })); });
          fb.appendChild(box);
          if (!t.whole) { state.phase = 'copy'; inp.value = ''; checkBtn.textContent = 'Fertig'; fb.appendChild(h('p', { class: 'copy-line', text: 'Schreib es einmal richtig:' })); card.insertBefore(fb, gform); inp.focus(); return; }
          return done(false);
        }
        if (state.tries === 1 && st.retry !== false) {
          var nb = h('div', { class: 'fb-box no' }, [h('p', { class: 'fb-title', text: r.verdict === 'order' ? 'Fast!' : 'Noch nicht.' })]);
          (r.hints || []).forEach(function (x) { nb.appendChild(h('p', { rich: x })); });
          if (!(r.hints || []).length && mod) nb.appendChild(h('p', { text: 'Schau dir die Regel an (📘) und versuch es noch einmal.' }));
          else nb.appendChild(h('p', { text: 'Versuch es noch einmal.' }));
          fb.appendChild(nb);
          inp.focus(); inp.select();
          return;
        }
        reveal(r);
      }
      function reveal(r) {
        state.shown = true; fb.innerHTML = '';
        var box = h('div', { class: 'fb-box show' }, [h('p', { class: 'fb-title', text: 'So ist es richtig:' }), h('p', { class: 'answer-big', lang: 'en' }, [G.filled(it, it.answers[0]), ' ', U.sayButton(G.filled(it, it.answers[0]), 'en')])]);
        if (r && r.words && t.whole) { box.appendChild(h('p', { class: 'lab', text: 'Was anders war:' })); box.appendChild(sentenceView(r)); }
        if (it.why) box.appendChild(h('p', { rich: it.why }));
        else (r && r.hints || []).forEach(function (x) { box.appendChild(h('p', { rich: x })); });
        if (it.answers.length > 1) box.appendChild(h('p', { class: 'soft-line', text: 'Auch richtig: ' + it.answers.slice(1).join(' · ') }));
        fb.appendChild(box);
        if (!t.whole) { state.phase = 'copy'; inp.value = ''; checkBtn.textContent = 'Fertig'; fb.appendChild(h('p', { class: 'copy-line', text: 'Schreib es einmal richtig:' })); card.insertBefore(fb, gform); inp.focus(); return; }
        done(false);
      }
      function done(success, r) {
        if (state.phase === 'done') return;
        var res = record();
        state.phase = 'done'; inp.disabled = true; checkBtn.hidden = true; tools.innerHTML = '';
        if (success) {
          var box = h('div', { class: 'fb-box ok' }, [h('p', { class: 'fb-title', text: state.tries > 1 ? 'Jetzt stimmt\'s!' : pick(['Richtig!', 'Super!', 'Genau!', 'Klasse!']) })]);
          if (!t.whole) box.appendChild(h('p', { lang: 'en', text: G.filled(it, (r && r.answer) || it.answers[0]) }));
          (r && r.notes || []).forEach(function (x) { box.appendChild(h('p', { class: 'note-line', rich: x })); });
          fb.innerHTML = ''; fb.appendChild(box);
        }
        if (res.coins) U.coinFloat(card, res.coins);
        fb.appendChild(h('div', { class: 'row' }, [continueButton()]));
      }
      function record() {
        if (state.recorded) return state.recorded;
        var r = store.recordGram(it, { first: state.first, second: state.second, help: state.help, shown: state.shown, mode: round.mode, answer: state.firstInput });
        asked++;
        if (r.outcome === 'exact') firstRight++; else if (r.outcome === 'wrong') { wrong++; weakGram[it.mod + '/' + it.concept] = { mod: mod, concept: it.concept }; } else known++;
        var n = test ? 0 : app.itemCoins('g:' + it.id, r, {});
        coins += n;
        state.recorded = { coins: n };
        return state.recorded;
      }
    }

    // ---------------------------------------------------------------- end
    function finish() {
      EB.speech.stop();
      window.__ebTest = null;
      var endedAt = Date.now();
      if (test) return testResult(endedAt);
      var bonus = asked >= 8 ? (BONUS[round.mode] || 3) : 0;
      var sum = { mode: round.mode, n: asked, right: firstRight, known: known, wrong: wrong, startedAt: startedAt, endedAt: endedAt };
      var paid = app.roundEnd(sum, coins, bonus, MODE_REASON[round.mode] || 'Englisch geübt');
      sum.coins = paid; store.logRound(sum);
      summary(sum, paid);
    }
    function summary(sum, paid) {
      var v = h('section', { class: 'summary narrow' });
      var share = sum.n ? sum.right / sum.n : 0;
      var pose = share >= 0.8 ? 'celebrating' : share >= 0.5 ? 'happy' : 'encouraging';
      var line = !sum.n ? 'Bis zum nächsten Mal!' : share >= 0.8 ? 'Stark, ' + app.platform.childName + '! Fast alles auf Anhieb.' : share >= 0.5 ? 'Gut gemacht! Jedes Üben bringt dich weiter.' : 'Super, dass du drangeblieben bist – genau so lernt man.';
      v.appendChild(h('h1', { class: 'screen-h', text: 'Geschafft!' }));
      v.appendChild(U.robinSays(app.robin(pose, 72), line));
      var nums = h('div', { class: 'nums' }, [
        num(sum.n, 'Aufgaben'), num(sum.right, 'sofort richtig'), num(sum.known, 'fast richtig'), num(Object.keys(improved).length, 'Wörter besser')
      ]);
      v.appendChild(nums);
      if (paid) v.appendChild(h('p', { class: 'coins-line' }, [U.coin(26), ' +' + paid + ' Robin-Münzen']));
      if (hardFixed) v.appendChild(h('p', { class: 'up-line', text: '💪 ' + U.plural(hardFixed, 'schwieriges Wort', 'schwierige Wörter') + ' geknackt!' }));
      var ww = Object.keys(weakWords).map(function (k) { return weakWords[k]; }).filter(Boolean);
      var wg = Object.keys(weakGram).map(function (k) { return weakGram[k]; });
      if (ww.length || wg.length) {
        v.appendChild(h('h2', { class: 'group-h', text: 'Das üben wir noch einmal' }));
        var ul = h('ul', { class: 'weak' });
        ww.slice(0, 12).forEach(function (w) { ul.appendChild(h('li', {}, [h('span', { class: 'en', lang: 'en', text: C.display(w.en) }), h('span', { class: 'de', text: ' = ' + DE(w.de) }), ' ', U.sayButton(C.display(w.en), 'en')])); });
        wg.forEach(function (g) { if (g.mod) ul.appendChild(h('li', {}, [h('span', { text: '📘 ' + g.mod.title + (g.mod.concepts[g.concept] && g.concept !== g.mod.id ? ' – ' + g.mod.concepts[g.concept] : '') })])); });
        v.appendChild(ul);
      }
      var nx = app.suggestNext();
      v.appendChild(h('div', { class: 'next-box' }, [h('p', { class: 'lab', text: 'Vorschlag fürs nächste Mal' }), h('p', { class: 'next-text', text: nx.text })]));
      v.appendChild(h('div', { class: 'row' }, [
        nx.mode && nx.now ? h('button', { class: 'btn primary', type: 'button', text: nx.button, onclick: function () { app.start(nx.mode); } }) : null,
        h('button', { class: nx.mode && nx.now ? 'btn soft' : 'btn primary', type: 'button', text: 'Zur Startseite', onclick: function () { app.go('home'); } })]));
      app.setView(v, { back: false });
    }
    function testResult(endedAt) {
      var v = h('section', { class: 'summary probe-result' });
      var nW = 0, okW = 0, nearW = 0, nG = 0, okG = 0, wrongSteps = [];
      results.forEach(function (x) {
        var g = x.step.kind === 'gram';
        if (g) { nG++; if (x.r.exact) okG++; else wrongSteps.push(x.step); }
        else { nW++; if (x.r.exact) okW++; else { if (x.r.known) nearW++; wrongSteps.push(x.step); } }
      });
      var sum = { mode: 'probe', n: results.length, right: okW + okG, known: nearW, wrong: results.length - okW - okG - nearW, startedAt: startedAt, endedAt: endedAt };
      var paid = app.roundEnd(sum, 0, results.length >= 8 ? BONUS.probe : 0, MODE_REASON.probe);
      sum.coins = paid; store.logRound(sum);
      v.appendChild(h('h1', { class: 'screen-h', text: 'Deine Probe-Klassenarbeit' }));
      var pct = results.length ? (okW + okG + nearW * 0.5) / results.length : 0;
      v.appendChild(U.robinSays(app.robin(pct >= 0.8 ? 'celebrating' : 'encouraging', 72), pct >= 0.8 ? 'Das sieht richtig gut aus!' : 'Gut, dass du geübt hast. Jetzt weißt du genau, was noch fehlt.'));
      v.appendChild(h('div', { class: 'nums' }, [num(okW + '/' + nW, 'Vokabeln richtig'), num(nearW, 'Vokabeln fast (Schreibung)'), nG ? num(okG + '/' + nG, 'Grammatik richtig') : null]));
      if (paid) v.appendChild(h('p', { class: 'coins-line' }, [U.coin(26), ' +' + paid + ' Robin-Münzen fürs Durchhalten']));
      var table = h('div', { class: 'res-list' });
      results.forEach(function (x, k) {
        var s = x.step, ok = x.r.exact, near = !ok && x.r.known, q, right;
        if (s.kind === 'gram') { q = G.task(s.item).q; right = G.filled(s.item, s.item.answers[0]); }
        else { q = s.dir === 'en-de' ? C.display(s.word.en) : DE(s.word.de); right = s.dir === 'en-de' ? DE(s.word.de) : C.display(s.word.en); }
        table.appendChild(h('div', { class: 'res ' + (ok ? 'ok' : near ? 'near' : 'no') }, [
          h('span', { class: 'res-n', text: (k + 1) + '.' }),
          h('span', { class: 'res-q', text: q }),
          h('span', { class: 'res-a' }, [h('span', { class: 'mine', text: x.input || '—' }), ok ? null : h('span', { class: 'right', text: ' → ' + right })]),
          h('span', { class: 'res-mark', text: ok ? '✓' : near ? '≈' : '✗', 'aria-label': ok ? 'richtig' : near ? 'fast richtig' : 'falsch' })
        ]));
      });
      v.appendChild(table);
      v.appendChild(h('p', { class: 'note', text: '≈ = Wort gewusst, aber anders geschrieben. Das ist keine Note – nur ein Blick, wo du stehst.' }));
      v.appendChild(h('div', { class: 'row' }, [
        wrongSteps.length ? h('button', { class: 'btn primary', type: 'button', text: '✏️ Fehler verbessern (' + wrongSteps.length + ')', onclick: function () {
          run(app, { mode: 'verbessern', steps: wrongSteps.map(function (s) { var c = Object.assign({}, s); delete c.test; return c; }) }, { title: '✏️ Fehler verbessern' });
        } }) : null,
        h('button', { class: wrongSteps.length ? 'btn soft' : 'btn primary', type: 'button', text: 'Zur Startseite', onclick: function () { app.go('home'); } })]));
      app.setView(v, { back: false });
    }
    function num(n, label) { return h('div', { class: 'num' }, [h('span', { class: 'num-v', text: String(n) }), h('span', { class: 'num-l', text: label })]); }
  }

  function STAGE_UP(r) { var R = { neu: 0, lernt: 1, fast: 2, sicher: 3 }; return R[r.after] > R[r.before]; }
  function T(s) { return EB.text.norm(s || ''); }
  function DE(s) { return String(s || '').replace(/\s*;\s*/g, ', '); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  // "Du: dificult" / "Richtig: difficult" with the places coloured
  function compare(r, w) {
    var d = r.diff || C.diff(r.input, C.display(w.en));
    return h('div', { class: 'compare' }, [
      h('p', { class: 'cmp-row' }, [h('span', { class: 'lab', text: 'Du: ' }), h('span', { lang: 'en' }, [U.diffView(d.input)])]),
      h('p', { class: 'cmp-row' }, [h('span', { class: 'lab', text: 'Richtig: ' }), h('span', { lang: 'en', class: 'strong' }, [U.diffView(d.target)])])
    ]);
  }
  function compareRaw(r) { return compare(r, { en: r.answer }); }
  function nearly(r, w, dir) {
    var title = r.verdict === 'typo' ? 'Fast richtig – nur vertippt!' : r.verdict === 'form' ? 'Fast richtig – das Wort stimmt!' : r.verdict === 'caps' ? 'Richtig!' : 'Fast richtig!';
    var box = h('div', { class: 'fb-box spell' }, [h('p', { class: 'fb-title', text: title })]);
    if (dir !== 'en-de' && r.verdict !== 'form') box.appendChild(compare(r, w));
    else if (r.verdict === 'form') box.appendChild(h('p', {}, [h('span', { class: 'lab', text: 'Richtig: ' }), h('strong', { lang: 'en', text: r.answer })]));
    (r.hints || []).forEach(function (x) { box.appendChild(h('p', { class: 'hint-line', rich: x })); });
    (r.notes || []).forEach(function (x) { box.appendChild(h('p', { class: 'note-line', rich: x })); });
    return box;
  }
  function sentenceView(r) {
    return h('p', { class: 'sent', lang: 'en' }, (r.words || []).map(function (x) {
      if (x.k === 'extra') return h('span', { class: 'sw-extra', title: 'zu viel', text: x.s + ' ' });
      return h('span', { class: 'sw-' + x.k, title: x.was ? 'du: ' + x.was : '', text: x.s + ' ' });
    }));
  }
  function showRule(app, mod) {
    var body = h('div', { class: 'rule' }, [U.textBlock(mod.intro)]);
    if (mod.examples.length) {
      var ex = h('div', { class: 'examples' });
      mod.examples.forEach(function (e) { ex.appendChild(h('p', {}, [h('span', { class: 'en', lang: 'en', text: e.en }), ' ', U.sayButton(e.en, 'en'), e.de ? h('span', { class: 'de', text: e.de }) : null])); });
      body.appendChild(ex);
    }
    U.modal(mod.title, body, { cls: 'wide' });
  }

  EB.practice = { run: run, showRule: showRule, compare: compare, sentenceView: sentenceView };
})(typeof window !== 'undefined' ? window : globalThis);
