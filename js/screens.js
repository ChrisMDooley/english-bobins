/*
 * screens.js — Lukas's screens: start page, grammar, Klassenarbeit, progress, word lists.
 */
(function (root) {
  'use strict';
  var EB = root.EB, U = EB.ui, h = U.h, C = EB.check, SRS = EB.srs;

  function modProgress(store, m) {
    var ids = Object.keys(m.concepts).filter(function (k) { return m.items.some(function (it) { return it.concept === k; }); });
    if (!ids.length) return { share: 0, done: false, seen: false, n: 0 };
    var sum = 0, seen = false, done = true;
    ids.forEach(function (k) { var s = store.gstat(m.id, k); if (s) seen = true; var b = s ? s.box : 0; sum += Math.min(b, 3) / 3; if (b < 3) done = false; });
    return { share: sum / ids.length, done: done, seen: seen, n: ids.length };
  }
  function tile(icon, title, sub, onclick, cls) {
    return h('button', { class: 'tile ' + (cls || ''), type: 'button', onclick: onclick }, [h('span', { class: 'tile-icon', 'aria-hidden': 'true', text: icon }), h('span', { class: 'tile-title', text: title }), sub ? h('span', { class: 'tile-sub' }, [].concat(sub)) : null]);
  }

  // ---------------------------------------------------------------- start page
  function home(app) {
    var content = app.content, store = app.store, P = app.platform, st = store.settings();
    var p = EB.session.preview(content, store), t = store.doc.test;
    var v = h('section', { class: 'home' });
    var today = store.todayCount(), streak = store.streakDays();
    var line = today >= 15 ? 'Wow – heute schon ' + today + ' Aufgaben!' : today ? 'Schön, dass du heute schon geübt hast!' : streak >= 2 ? streak + ' Tage hintereinander geübt. Weiter so!' : 'Bereit für ein bisschen Englisch?';
    var days = t.date ? app.daysUntil(t.date) : null;
    v.appendChild(h('div', { class: 'hero' }, [app.robin(today ? 'happy' : 'normal', 92), h('div', {}, [
      h('h1', { text: 'Hi ' + P.childName + '!' }),
      h('p', { class: 'hero-line', text: line }),
      days != null && days >= 0 ? h('p', { class: 'countdown', text: days === 0 ? 'Heute: ' + (t.label || 'Klassenarbeit') + ' – du schaffst das!' : days === 1 ? 'Morgen: ' + (t.label || 'Klassenarbeit') : 'Noch ' + days + ' Tage bis zur ' + (t.label || 'Klassenarbeit') }) : null
    ])]));
    var D = st.daily || {}, nToday = (D.neu || 0) + (D.alt || 0) + (D.fehler || 0) + (D.gram || 0);
    v.appendChild(h('button', { class: 'today-btn', type: 'button', onclick: function () { app.start('heute'); } }, [
      h('span', { class: 'tb-icon', 'aria-hidden': 'true', text: '▶' }),
      h('span', { class: 'tb-text' }, [h('span', { class: 'tb-title', text: 'Heute üben' }), h('span', { class: 'tb-sub', text: 'ca. ' + nToday + ' Aufgaben · 10–15 Minuten · neue Wörter, Wiederholung und Grammatik' })])]));
    if (p.hard) v.appendChild(h('button', { class: 'problem-card', type: 'button', onclick: function () { app.start('fehler'); } }, [h('span', { class: 'pc-icon', text: '🎯' }), h('span', { text: U.plural(p.hard, 'Wort ist', 'Wörter sind') + ' noch schwierig – üben wir sie?' })]));
    var unitNames = p.units.map(function (u) { return content.unitShort(u); }).join(', ');
    var mods = EB.session.activeModules(content, store);
    var c = store.counts(content.uniqueWords());
    var tiles = h('div', { class: 'tiles' }, [
      tile('🆕', 'Neue Vokabeln üben', [unitNames ? unitNames + ' · ' : '', p.currentNew ? p.currentNew + ' neu' : p.current + ' Wörter'], function () { app.start('neu'); }),
      tile('🔁', 'Alte Vokabeln wiederholen', p.due ? p.due + ' fällig' : 'nichts fällig – trotzdem üben', function () { app.start('alt'); }),
      tile('🎯', 'Meine Fehler üben', p.hard + p.spell ? U.plural(p.hard + p.spell, 'Wort', 'Wörter') + (p.gramDue ? ' · Grammatik' : '') : 'gerade keine', function () { app.start('fehler'); }),
      tile('📘', 'Grammatik üben', mods.length ? mods.map(function (m) { return m.title; }).slice(0, 2).join(' · ') + (mods.length > 2 ? ' …' : '') : 'Themen ansehen', function () { app.go('grammatik'); }),
      tile('🔀', 'Gemischtes Training', (st.mix ? st.mix.neu + ' % neu · ' + st.mix.alt + ' % alt · ' + st.mix.fehler + ' % Fehler' : ''), function () { app.start('mix'); }),
      tile('📝', 'Klassenarbeit vorbereiten', days != null && days >= 0 ? (days === 0 ? 'heute!' : 'in ' + U.plural(days, 'Tag', 'Tagen')) : 'Probe-Arbeit schreiben', function () { app.go('klassenarbeit'); }),
      tile('📈', 'Mein Lernfortschritt', [U.stageBar(c), ' ' + c.sicher + ' sicher'], function () { app.go('fortschritt'); })
    ]);
    v.appendChild(tiles);
    if (content.hasDemo() && !content.words.some(function (w) { return w.src === 'parent' || (w.src === 'book' && w.unit !== 'gl2-irr'); }))
      v.appendChild(h('p', { class: 'demo-note', text: 'Hinweis: Bis die Wörter aus deinem Buch eingetragen sind, übst du mit Demo-Wörtern und den unregelmäßigen Verben.' }));
    app.setView(v);
  }

  // ---------------------------------------------------------------- grammar
  function grammar(app) {
    var content = app.content, store = app.store;
    var v = h('section', { class: 'menu' }, [h('h1', { class: 'screen-h', text: '📘 Grammatik' }), h('p', { class: 'screen-sub', text: 'Lies zuerst die Erklärung, dann übe. Fehler kommen später mit anderen Sätzen wieder.' })]);
    var active = EB.session.activeModules(content, store).map(function (m) { return m.id; });
    if (active.length) v.appendChild(h('div', { class: 'row' }, [h('button', { class: 'btn primary', type: 'button', text: '▶ Gemischt üben (aktuelle Themen)', onclick: function () { app.start('grammatik'); } })]));
    [6, 5, 7, 8].forEach(function (year) {
      var mods = content.grammar.filter(function (m) { return m.year === year && m.items.length; });
      if (!mods.length) return;
      v.appendChild(h('h2', { class: 'group-h', text: 'Klasse ' + year + (year < 6 ? ' – Wiederholung' : '') }));
      var list = h('div', { class: 'tiles' });
      mods.forEach(function (m) {
        var pr = modProgress(store, m);
        list.appendChild(h('div', { class: 'tile module' + (pr.done ? ' done' : '') + (active.indexOf(m.id) >= 0 ? ' current' : '') }, [
          h('span', { class: 'tile-title', text: m.title }),
          h('span', { class: 'tile-sub' }, [U.bar(pr.share), pr.done ? '✓ geschafft' : pr.seen ? Math.round(pr.share * 100) + ' %' : 'noch nicht geübt', active.indexOf(m.id) >= 0 ? h('span', { class: 'tag ok', text: 'aktuell' }) : null]),
          h('span', { class: 'tile-actions' }, [
            h('button', { class: 'btn soft small', type: 'button', text: 'Erklärung', onclick: function () { app.go('grammatik/' + encodeURIComponent(m.id)); } }),
            h('button', { class: 'btn primary small', type: 'button', text: 'Üben', onclick: function () { app.start('grammatik', { module: m.id }); } })])
        ]));
      });
      v.appendChild(list);
    });
    app.setView(v, { back: true });
  }
  function module(app, id) {
    var m = app.content.modById[id], store = app.store;
    if (!m) return grammar(app);
    var v = h('section', { class: 'menu narrow module-page' }, [h('h1', { class: 'screen-h', text: m.title }), h('p', { class: 'screen-sub', text: 'Klasse ' + m.year + (m.unit ? ' · ' + m.unit : '') })]);
    v.appendChild(h('div', { class: 'card' }, [U.textBlock(m.intro)]));
    if (m.examples.length) {
      v.appendChild(h('h2', { class: 'group-h', text: 'Beispiele' }));
      var ex = h('div', { class: 'card examples' });
      m.examples.forEach(function (e) { ex.appendChild(h('p', {}, [h('span', { class: 'en', lang: 'en', text: e.en }), ' ', U.sayButton(e.en, 'en'), e.de ? h('span', { class: 'de', text: e.de }) : null])); });
      v.appendChild(ex);
    }
    if (m.mistakes.length) {
      v.appendChild(h('h2', { class: 'group-h', text: 'Typische Fehler' }));
      var mi = h('div', { class: 'card mistakes' });
      m.mistakes.forEach(function (x) { mi.appendChild(h('p', {}, [h('s', { class: 'wrong', lang: 'en', text: x.wrong }), ' → ', h('strong', { lang: 'en', text: x.right }), x.why ? h('span', { class: 'why', rich: x.why }) : null])); });
      v.appendChild(mi);
    }
    var cl = h('div', { class: 'concepts' });
    Object.keys(m.concepts).forEach(function (k) {
      if (!m.items.some(function (it) { return it.concept === k; })) return;
      var s = store.gstat(m.id, k);
      cl.appendChild(h('p', { class: 'concept' }, [h('span', { text: m.concepts[k] }), U.stageChip(SRS.stage(s))]));
    });
    v.appendChild(h('h2', { class: 'group-h', text: 'Dein Stand' }));
    v.appendChild(cl);
    v.appendChild(h('div', { class: 'row' }, [h('button', { class: 'btn primary', type: 'button', text: '▶ 10 Aufgaben üben', onclick: function () { app.start('grammatik', { module: m.id }); } })]));
    app.setView(v, { back: true });
  }

  // ---------------------------------------------------------------- Klassenarbeit
  function test(app) {
    var content = app.content, store = app.store, t = store.doc.test, days = t.date ? app.daysUntil(t.date) : null;
    var v = h('section', { class: 'menu narrow' }, [h('h1', { class: 'screen-h', text: '📝 Klassenarbeit vorbereiten' })]);
    var units = (t.units || []).filter(function (u) { return content.unitById[u]; });
    var mods = (t.modules || []).map(function (id) { return content.modById[id]; }).filter(Boolean);
    var label = t.label || 'Klassenarbeit';
    v.appendChild(U.robinSays(app.robin('glasses', 64), days != null && days >= 0 ?
      (days === 0 ? 'Heute ist die ' + label + '. Kurz die schwierigen Wörter ansehen – und dann los!' : 'Die ' + label + ' ist am ' + new Date(t.date + 'T08:00').toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }) + ' – noch ' + U.plural(days, 'Tag', 'Tage') + '.') :
      'Wenn deine Eltern eintragen, was drankommt, übst du hier genau das.'));
    var box = h('div', { class: 'card' });
    var tw = content.uniqueWords(content.wordsIn(units.length ? units : EB.session.activeUnits(content, store)));
    var c = store.counts(tw);
    box.appendChild(h('p', { class: 'lab', text: 'Was drankommt' }));
    box.appendChild(h('p', { text: (units.length ? units : EB.session.activeUnits(content, store)).map(function (u) { return content.unitLabel(u); }).join(' · ') || '—' }));
    if (mods.length) box.appendChild(h('p', { text: 'Grammatik: ' + mods.map(function (m) { return m.title; }).join(' · ') }));
    box.appendChild(h('p', { class: 'ready' }, [U.stageBar(c), ' ' + (c.sicher + c.fast) + ' von ' + c.total + ' Wörtern sitzen schon (fast) sicher']));
    v.appendChild(box);
    v.appendChild(h('div', { class: 'list big-actions' }, [
      h('button', { class: 'list-item', type: 'button', onclick: function () { app.start('ka'); } }, [h('span', { class: 'li-icon', text: '🏋️' }), h('span', { class: 'li-text' }, [h('strong', { text: 'Für die Klassenarbeit üben' }), h('span', { class: 'note', text: 'Die Wörter, die noch nicht sitzen, zuerst – mit Hilfe und Erklärungen.' })])]),
      h('button', { class: 'list-item', type: 'button', onclick: function () { app.start('probe'); } }, [h('span', { class: 'li-icon', text: '📝' }), h('span', { class: 'li-text' }, [h('strong', { text: 'Probe-Klassenarbeit schreiben' }), h('span', { class: 'note', text: 'Wie in der Schule: aufschreiben, keine Hilfe. Am Ende siehst du alles – und verbesserst deine Fehler.' })])])
    ]));
    app.setView(v, { back: true });
  }

  // ---------------------------------------------------------------- progress
  function progress(app) {
    var content = app.content, store = app.store;
    var all = content.uniqueWords(), c = store.counts(all);
    var v = h('section', { class: 'menu' }, [h('h1', { class: 'screen-h', text: '📈 Mein Lernfortschritt' })]);
    v.appendChild(h('div', { class: 'nums' }, [
      num(c.sicher, 'sicher', 'st-sicher'), num(c.fast, 'fast sicher', 'st-fast'), num(c.lernt, 'werden gelernt', 'st-lernt'), num(c.neu, 'neu', 'st-neu'), num(c.due, 'heute fällig')]));
    v.appendChild(h('p', {}, [U.stageBar(c)]));
    var imp = store.improved(7).length;
    v.appendChild(h('p', { class: 'up-line', text: imp ? '⭐ Diese Woche ' + U.plural(imp, 'Wort', 'Wörter') + ' eine Stufe weiter.' : 'Diese Woche ist noch kein Wort eine Stufe weiter – los geht\'s!' }));
    // this week
    var act = store.activity(7), max = Math.max(10, Math.max.apply(null, act.map(function (a) { return a.n; })));
    var week = h('div', { class: 'week', role: 'img', 'aria-label': 'Aufgaben pro Tag in den letzten 7 Tagen: ' + act.map(function (a) { return a.n; }).join(', ') });
    act.forEach(function (a) {
      var d = new Date(a.day + 'T12:00');
      week.appendChild(h('div', { class: 'wk-day' }, [h('span', { class: 'wk-n', text: a.n ? String(a.n) : '' }), h('span', { class: 'wk-bar' }, [h('span', { class: 'wk-fill', style: 'height:' + Math.round(100 * a.n / max) + '%' })]), h('span', { class: 'wk-l', text: d.toLocaleDateString('de-DE', { weekday: 'short' }) })]));
    });
    v.appendChild(h('h2', { class: 'group-h', text: 'Diese Woche geübt' }));
    v.appendChild(week);
    // improvement over time
    var wk = store.weekly(6).filter(function (w) { return w.n; });
    if (wk.length >= 2) {
      v.appendChild(h('h2', { class: 'group-h', text: 'Sofort richtig – Woche für Woche' }));
      var tr = h('div', { class: 'trend' });
      wk.forEach(function (w) { tr.appendChild(h('div', { class: 'tr-w' }, [h('span', { class: 'tr-v', text: Math.round(w.rate * 100) + ' %' }), U.bar(w.rate), h('span', { class: 'tr-l', text: 'ab ' + new Date(w.from).toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' }) })])); });
      v.appendChild(tr);
    }
    // grammar
    var mods = content.grammar.filter(function (m) { return m.items.length; }), doneN = mods.filter(function (m) { return modProgress(store, m).done; }).length;
    v.appendChild(h('h2', { class: 'group-h', text: 'Grammatik: ' + doneN + ' von ' + mods.length + ' Themen geschafft' }));
    var gl = h('div', { class: 'list' });
    mods.filter(function (m) { return modProgress(store, m).seen; }).forEach(function (m) {
      var pr = modProgress(store, m);
      gl.appendChild(h('button', { class: 'list-item', type: 'button', onclick: function () { app.go('grammatik/' + encodeURIComponent(m.id)); } }, [h('span', { class: 'li-text' }, [h('strong', { text: m.title })]), U.bar(pr.share), h('span', { class: 'note', text: pr.done ? '✓' : Math.round(pr.share * 100) + ' %' })]));
    });
    if (!gl.children.length) gl.appendChild(h('p', { class: 'note', text: 'Noch keine Grammatik geübt.' }));
    v.appendChild(gl);
    // units
    v.appendChild(h('h2', { class: 'group-h', text: 'Wörter nach Units' }));
    var ul = h('div', { class: 'list' });
    content.units.forEach(function (u) {
      var ws = content.uniqueWords(content.wordsIn([u.id]));
      if (!ws.length) return;
      var uc = store.counts(ws);
      ul.appendChild(h('button', { class: 'list-item', type: 'button', onclick: function () { app.go('woerter/' + encodeURIComponent(u.id)); } }, [
        h('span', { class: 'li-text' }, [h('strong', { text: content.unitLabel(u.id) }), h('span', { class: 'note', text: uc.sicher + ' sicher · ' + uc.fast + ' fast · ' + uc.lernt + ' lernen · ' + uc.neu + ' neu' })]), U.stageBar(uc)]));
    });
    v.appendChild(ul);
    app.setView(v, { back: true });
  }
  function num(n, label, cls) { return h('div', { class: 'num ' + (cls || '') }, [h('span', { class: 'num-v', text: String(n) }), h('span', { class: 'num-l', text: label })]); }

  function unitWords(app, id) {
    var content = app.content, store = app.store, ws = content.wordsIn([id]);
    var v = h('section', { class: 'menu narrow' }, [h('h1', { class: 'screen-h', text: content.unitLabel(id) })]);
    v.appendChild(h('div', { class: 'row' }, [h('button', { class: 'btn primary', type: 'button', text: '▶ Diese Unit üben', onclick: function () { app.start('neu', { units: [id] }); } })]));
    var list = h('div', { class: 'wordlist' });
    ws.forEach(function (w) {
      var s = store.stat(w.key), en = C.display(w.en);
      list.appendChild(h('div', { class: 'wl-row' }, [
        h('span', { class: 'wl-en', lang: 'en', text: en }), U.sayButton(en, 'en'), h('span', { class: 'wl-de', text: w.de }), U.stageChip(SRS.stage(s)),
        w.note ? h('span', { class: 'wl-note', text: w.note }) : null
      ]));
    });
    v.appendChild(list);
    app.setView(v, { back: true });
  }

  EB.screens = { home: home, grammar: grammar, module: module, test: test, progress: progress, unitWords: unitWords, modProgress: modProgress };
})(typeof window !== 'undefined' ? window : globalThis);
