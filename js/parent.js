/*
 * parent.js — Elternbereich: words, import, units, grammar, Klassenarbeit, settings, data.
 * Protected by the family PIN (Robin's Bobins) — or, when the app runs on its own, by a small
 * multiplication task, so a child cannot change things by accident.
 */
(function (root) {
  'use strict';
  var EB = root.EB, U = EB.ui, h = U.h, C = EB.check, SRS = EB.srs, T = EB.text, K = EB.content;

  var TABS = [['start', 'Übersicht'], ['woerter', 'Vokabeln'], ['neu', 'Hinzufügen'], ['units', 'Units'], ['grammatik', 'Grammatik'],
              ['ka', 'Klassenarbeit'], ['einstellungen', 'Einstellungen'], ['daten', 'Daten']];

  function open(app, tab) {
    if (!app.parentOk) return gate(app, tab);
    var v = h('section', { class: 'parent' }, [h('h1', { class: 'screen-h', text: 'Elternbereich' })]);
    var nav = h('nav', { class: 'ptabs', 'aria-label': 'Bereiche' });
    TABS.forEach(function (t) { nav.appendChild(h('a', { class: 'ptab' + (t[0] === tab ? ' on' : ''), href: '#/eltern/' + t[0], text: t[1] })); });
    v.appendChild(nav);
    var body = h('div', { class: 'pbody' });
    v.appendChild(body);
    (VIEWS[tab] || VIEWS.start)(app, body, tab);
    app.setView(v, { back: true });
  }

  function gate(app, tab) {
    var P = app.platform, v = h('section', { class: 'menu narrow' }, [h('h1', { class: 'screen-h', text: 'Elternbereich' })]);
    var a = 6 + Math.floor(Math.random() * 7), b = 12 + Math.floor(Math.random() * 8);
    var usePin = P.parentHasPin();
    v.appendChild(h('p', { text: usePin ? 'Bitte die Eltern-PIN eingeben.' : 'Nur für Erwachsene: Wie viel ist ' + a + ' × ' + b + '?' }));
    var inp = U.input({ class: 'answer-in pin', inputmode: 'numeric', type: usePin ? 'password' : 'text', 'aria-label': usePin ? 'Eltern-PIN' : 'Ergebnis' });
    var msg = h('p', { class: 'soft-line' });
    v.appendChild(h('form', { class: 'answer-row', onsubmit: function (e) {
      e.preventDefault();
      var ok = usePin ? P.parentCheck(inp.value) : +inp.value === a * b;
      if (ok) { app.parentOk = true; open(app, tab); } else { msg.textContent = usePin ? 'Die PIN stimmt nicht.' : 'Das stimmt nicht.'; inp.value = ''; inp.focus(); }
    } }, [inp, h('button', { class: 'btn primary', type: 'submit', text: 'Öffnen' })]));
    v.appendChild(msg);
    app.setView(v, { back: true });
    setTimeout(function () { inp.focus(); }, 30);
  }

  function field(label, el, note) { return h('label', { class: 'field' }, [h('span', { class: 'f-lab', text: label }), el, note ? h('span', { class: 'f-note', text: note }) : null]); }
  function sel(options, value, attrs) {
    var s = h('select', attrs || {});
    options.forEach(function (o) { var op = h('option', { value: o[0], text: o[1] }); if (String(o[0]) === String(value)) op.selected = true; s.appendChild(op); });
    return s;
  }
  function unitOptions(content, withEmpty) {
    var o = withEmpty ? [['', '– keine Unit –']] : [];
    content.units.forEach(function (u) { o.push([u.id, content.unitLabel(u.id)]); });
    return o;
  }
  function when(t) { return t ? new Date(t).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }) : '—'; }
  function toast(text) { var t = h('div', { class: 'toast', role: 'status', text: text }); document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2600); }

  var VIEWS = {};

  // ---------------------------------------------------------------- overview
  VIEWS.start = function (app, body) {
    var content = app.content, store = app.store, all = content.uniqueWords(), c = store.counts(all);
    body.appendChild(h('div', { class: 'nums' }, [numBox(c.total, 'Wörter'), numBox(c.sicher, 'sicher'), numBox(c.fast, 'fast sicher'), numBox(c.lernt, 'werden gelernt'), numBox(c.due, 'fällig'), numBox(c.hard, 'schwierig'), numBox(c.spell, 'Rechtschreibung')]));
    var rounds = store.doc.rounds.filter(function (r) { return r.t > Date.now() - 7 * SRS.DAY; });
    var mins = Math.round(rounds.reduce(function (s, r) { return s + Math.min(r.secs || 0, 3600); }, 0) / 60);
    body.appendChild(h('p', { text: 'Letzte 7 Tage: ' + U.plural(rounds.length, 'Runde', 'Runden') + ', etwa ' + mins + ' Minuten, ' + store.activity(7).reduce(function (s, a) { return s + a.n; }, 0) + ' Aufgaben.' }));
    var active = EB.session.activeUnits(content, store);
    body.appendChild(h('p', { class: 'note', text: 'Aktuelle Units: ' + active.map(function (u) { return content.unitLabel(u); }).join(', ') + (store.settings().activeUnits.length ? '' : ' (automatisch: neueste Unit – unter „Units“ festlegen)') }));

    var hard = all.filter(function (w) { var s = store.stat(w.key); return s && s.hard; });
    section(body, 'Schwierige Wörter (' + hard.length + ')', hard.length ? wordTable(app, hard, true) : h('p', { class: 'note', text: 'Keine.' }));
    var spell = all.filter(function (w) { var s = store.stat(w.key); return s && s.spell.hard; });
    var sp = h('div', { class: 'ptable' });
    spell.forEach(function (w) { var s = store.stat(w.key); sp.appendChild(h('div', { class: 'pt-row' }, [h('span', { class: 'en', lang: 'en', text: C.display(w.en) }), h('span', { class: 'mine', text: s.spell.last ? 'zuletzt: ' + s.spell.last : '' }), h('span', { class: 'note', text: s.spell.slips + '× verschrieben' })])); });
    section(body, 'Rechtschreib-Wörter (' + spell.length + ')', spell.length ? sp : h('p', { class: 'note', text: 'Keine.' }));
    var cw = store.commonWrongs(20), cwt = h('div', { class: 'ptable' });
    cw.forEach(function (x) { var w = content.byKey[x.key] && content.byKey[x.key][0]; if (!w) return; cwt.appendChild(h('div', { class: 'pt-row' }, [h('span', { class: 'mine', lang: 'en', text: x.answer }), h('span', { text: '→ ' + C.display(w.en) + ' (' + w.de + ')' }), h('span', { class: 'note', text: x.n + '×' })])); });
    section(body, 'Wiederkehrende Fehler', cw.length ? cwt : h('p', { class: 'note', text: 'Noch keine.' }));
    var gt = h('div', { class: 'ptable' });
    Object.keys(store.doc.gram).map(function (k) { return { k: k, s: store.doc.gram[k] }; }).filter(function (x) { return x.s.wrong || x.s.known; })
      .sort(function (a, b) { return (b.s.wrong + b.s.known / 2) - (a.s.wrong + a.s.known / 2); }).slice(0, 12).forEach(function (x) {
        var p = x.k.split('/'), m = content.modById[p[0]];
        var wr = Object.keys(x.s.wrongs || {}).slice(0, 3).join(' · ');
        gt.appendChild(h('div', { class: 'pt-row' }, [h('span', { text: (m ? m.title : p[0]) + (m && m.concepts[p[1]] && p[1] !== p[0] ? ' – ' + m.concepts[p[1]] : '') }), U.stageChip(SRS.stage(x.s)), h('span', { class: 'note', text: x.s.wrong + '× falsch' + (wr ? ' · z. B. ' + wr : '') })]));
      });
    section(body, 'Grammatik: wo es hakt', gt.children.length ? gt : h('p', { class: 'note', text: 'Noch keine Fehler.' }));
    var rl = h('div', { class: 'ptable' });
    store.doc.rounds.slice(-10).reverse().forEach(function (r) { rl.appendChild(h('div', { class: 'pt-row' }, [h('span', { text: new Date(r.t).toLocaleString('de-DE', { weekday: 'short', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' }) }), h('span', { text: r.mode }), h('span', { class: 'note', text: r.n + ' Aufgaben · ' + r.right + ' sofort richtig · ' + Math.round((r.secs || 0) / 60) + ' min' })])); });
    section(body, 'Letzte Runden', rl.children.length ? rl : h('p', { class: 'note', text: 'Noch keine.' }));
  };
  function numBox(n, l) { return h('div', { class: 'num' }, [h('span', { class: 'num-v', text: String(n) }), h('span', { class: 'num-l', text: l })]); }
  function section(body, title, el) { body.appendChild(h('h2', { class: 'group-h', text: title })); body.appendChild(el); }

  // ---------------------------------------------------------------- words
  function wordTable(app, words, compact) {
    var store = app.store, content = app.content, t = h('div', { class: 'ptable words' });
    words.forEach(function (w) {
      var s = store.stat(w.key);
      t.appendChild(h('button', { class: 'pt-row click', type: 'button', onclick: function () { editWord(app, w); } }, [
        h('span', { class: 'en', lang: 'en', text: C.display(w.en) }), h('span', { class: 'de', text: w.de }),
        compact ? null : h('span', { class: 'note', text: content.unitShort(w.unit) + (w.src === 'demo' ? ' · Demo' : '') }),
        U.stageChip(SRS.stage(s)), h('span', { class: 'note', text: s ? s.right + '✓ ' + s.wrong + '✗' : '' })]));
    });
    return t;
  }
  VIEWS.woerter = function (app, body) {
    var content = app.content, store = app.store;
    var q = U.input({ placeholder: 'suchen (englisch oder deutsch)', 'aria-label': 'Suche' });
    var u = sel([['', 'alle Units']].concat(unitOptions(content)), '', { 'aria-label': 'Unit' });
    var stg = sel([['', 'alle Stufen'], ['neu', 'Neu'], ['lernt', 'Wird gelernt'], ['fast', 'Fast sicher'], ['sicher', 'Sicher'], ['hard', 'schwierig']], '', { 'aria-label': 'Stufe' });
    var out = h('div', {}), count = h('p', { class: 'note' });
    function draw() {
      var term = T.norm(q.value), list = content.words.filter(function (w) {
        if (u.value && w.unit !== u.value) return false;
        if (term && T.norm(w.en).indexOf(term) < 0 && T.norm(w.de).indexOf(term) < 0) return false;
        var s = store.stat(w.key);
        if (stg.value === 'hard') return !!(s && (s.hard || s.spell.hard));
        if (stg.value && SRS.stage(s) !== stg.value) return false;
        return true;
      });
      count.textContent = U.plural(list.length, 'Wort', 'Wörter');
      out.innerHTML = ''; out.appendChild(wordTable(app, list.slice(0, 400)));
      if (list.length > 400) out.appendChild(h('p', { class: 'note', text: 'Nur die ersten 400 – bitte filtern.' }));
    }
    q.addEventListener('input', draw); u.addEventListener('change', draw); stg.addEventListener('change', draw);
    body.appendChild(h('div', { class: 'filters' }, [q, u, stg, h('button', { class: 'btn soft small', type: 'button', text: '+ Neues Wort', onclick: function () { editWord(app, null); } })]));
    body.appendChild(count); body.appendChild(out);
    draw();
  };
  function editWord(app, w) {
    var content = app.content, store = app.store, isNew = !w;
    w = w || { en: '', de: '', year: 6, unit: (EB.session.activeUnits(content, store)[0] || ''), type: '' };
    var f = {
      en: U.input({ value: w.en, lang: 'en' }), enAlt: U.input({ value: (w.enAlt || []).join('; '), lang: 'en' }),
      de: U.input({ value: w.de }), deAlt: U.input({ value: (w.deAlt || []).join('; ') }),
      example: U.input({ value: w.example || '', lang: 'en' }), exampleDe: U.input({ value: w.exampleDe || '' }),
      type: sel([['', '–']].concat(Object.keys(K.TYPES).map(function (k) { return [k, K.TYPES[k]]; })), w.type || ''),
      year: sel([[5, 'Klasse 5'], [6, 'Klasse 6'], [7, 'Klasse 7'], [8, 'Klasse 8'], [9, 'Klasse 9'], [10, 'Klasse 10']], w.year || 6),
      unit: sel(unitOptions(content, true), w.unit || ''), page: U.input({ value: w.page || '', inputmode: 'numeric' }),
      tags: U.input({ value: (w.tags || []).join('; ') }), note: U.input({ value: w.note || '' })
    };
    var box = h('div', { class: 'edit' }, [
      h('div', { class: 'grid2' }, [field('Englisch', f.en, '(to) go = „go“ und „to go“ sind richtig; sb. / sth. dürfen fehlen'), field('Deutsch', f.de, 'mehrere Bedeutungen mit ; trennen')]),
      h('div', { class: 'grid2' }, [field('Englisch – auch richtig', f.enAlt, 'mit ; trennen'), field('Deutsch – auch richtig', f.deAlt)]),
      h('div', { class: 'grid2' }, [field('Beispielsatz', f.example), field('Beispiel auf Deutsch', f.exampleDe)]),
      h('div', { class: 'grid4' }, [field('Wortart', f.type), field('Klasse', f.year), field('Unit', f.unit), field('Seite', f.page)]),
      h('div', { class: 'grid2' }, [field('Tags', f.tags), field('Notiz (wird beim Lernen gezeigt)', f.note)])
    ]);
    var s = !isNew && store.stat(w.key);
    if (!isNew) {
      var st = h('div', { class: 'stat-box' });
      st.appendChild(h('p', { text: s ? 'Gefragt: ' + s.n + '× · sofort richtig: ' + s.right + ' · fast: ' + s.known + ' · falsch: ' + s.wrong + ' · in Folge richtig: ' + s.streak : 'Noch nie geübt.' }));
      if (s) st.appendChild(h('p', { text: 'Zuletzt: ' + when(s.last) + ' · nächste Wiederholung: ' + when(s.due) + (s.hard ? ' · schwierig' : '') + (s.spell.hard ? ' · Rechtschreibung üben' : '') }));
      if (s && Object.keys(s.wrongs).length) st.appendChild(h('p', { text: 'Falsche Antworten: ' + Object.keys(s.wrongs).map(function (a) { return a + ' (' + s.wrongs[a] + '×)'; }).join(', ') }));
      var stageSel = sel([['', 'Stufe ändern …'], ['neu', 'Neu'], ['lernt', 'Wird gelernt'], ['fast', 'Fast sicher'], ['sicher', 'Sicher']], '');
      stageSel.addEventListener('change', function () { if (stageSel.value) { store.setStage(w.key, stageSel.value); toast('Stufe gesetzt: ' + SRS.stageLabel(stageSel.value)); close(); } });
      st.appendChild(h('div', { class: 'row' }, [h('span', {}, ['Lernstand: ', U.stageChip(SRS.stage(s))]), stageSel,
        h('button', { class: 'btn soft small', type: 'button', text: 'Lernstand zurücksetzen', onclick: function () { store.resetWord(w.key); toast('Lernstand zurückgesetzt'); close(); } })]));
      if ((content.byKey[w.key] || []).length > 1) st.appendChild(h('p', { class: 'note', text: 'Dieses Wort steht auch in: ' + content.byKey[w.key].filter(function (x) { return x !== w; }).map(function (x) { return content.unitShort(x.unit); }).join(', ') + ' – gemeinsamer Lernstand.' }));
      box.appendChild(st);
    }
    var msg = h('p', { class: 'soft-line' });
    box.appendChild(msg);
    box.appendChild(h('div', { class: 'row' }, [
      h('button', { class: 'btn primary', type: 'button', text: 'Speichern', onclick: save }),
      isNew ? null : h('button', { class: 'btn danger', type: 'button', text: 'Löschen', onclick: function () { U.confirm('Wort löschen?', '«' + w.en + '» wird gelöscht. Der Lernstand bleibt erhalten, falls das Wort wieder eingetragen wird.', 'Löschen', function () { content.deleteWord(w.id); close(); refresh(app); }, true); } }),
      h('button', { class: 'btn soft', type: 'button', text: 'Abbrechen', onclick: function () { close(); } })]));
    var close = U.modal(isNew ? 'Neues Wort' : 'Wort bearbeiten', box, { cls: 'wide' });
    function save() {
      if (!T.clean(f.en.value) || !T.clean(f.de.value)) { msg.textContent = 'Englisch und Deutsch werden gebraucht.'; return; }
      var x = { id: isNew ? null : w.id, src: isNew ? 'parent' : w.src, en: f.en.value, enAlt: f.enAlt.value, de: f.de.value, deAlt: f.deAlt.value, example: f.example.value, exampleDe: f.exampleDe.value,
                type: f.type.value, year: +f.year.value, unit: f.unit.value, page: f.page.value, tags: f.tags.value, note: f.note.value, added: w.added };
      if (isNew) { var key = K.wordKey(x), dup = (content.byKey[key] || []).filter(function (d) { return d.unit === x.unit; })[0]; if (dup) { msg.textContent = 'Dieses Wort gibt es in dieser Unit schon.'; return; } }
      content.saveWord(x); close(); toast('Gespeichert'); refresh(app);
    }
  }
  function refresh(app) { var r = (location.hash || '').replace(/^#\/?/, ''); if (/^eltern/.test(r)) open(app, r.slice(7) || 'start'); }

  // ---------------------------------------------------------------- add / import
  VIEWS.neu = function (app, body) {
    var content = app.content, store = app.store;
    var defUnit = EB.session.activeUnits(content, store)[0] || '';
    body.appendChild(h('p', { class: 'note', text: 'Wörter, die du hier einträgst, sind auf diesem Gerät gespeichert. Für andere Geräte: „Daten → Sicherung“ übertragen – oder die Listen schicken, dann kommen sie fest in die App.' }));
    // one word
    body.appendChild(h('h2', { class: 'group-h', text: '1. Ein Wort eintragen' }));
    body.appendChild(h('div', { class: 'row' }, [h('button', { class: 'btn primary', type: 'button', text: '+ Neues Wort', onclick: function () { editWord(app, null); } })]));
    // paste
    body.appendChild(h('h2', { class: 'group-h', text: '2. Liste einfügen' }));
    var ta = h('textarea', { class: 'paste', rows: 8, 'aria-label': 'Liste', placeholder: 'Eine Zeile pro Wort, z. B.\nholiday – Ferien; Urlaub\n(to) remember = sich erinnern\nisland\tInsel\tSkye is an island.' });
    var unit = sel(unitOptions(content, true), defUnit, { 'aria-label': 'Unit für die Liste' });
    var year = sel([[5, 'Klasse 5'], [6, 'Klasse 6'], [7, 'Klasse 7'], [8, 'Klasse 8']], 6, { 'aria-label': 'Klasse' });
    var prev = h('div', { class: 'preview' });
    body.appendChild(ta);
    body.appendChild(h('div', { class: 'row' }, [field('Unit', unit), field('Klasse', year), h('button', { class: 'btn primary', type: 'button', text: 'Vorschau', onclick: function () {
      var res = content.parsePaste(ta.value, { unit: unit.value, year: +year.value });
      preview(app, prev, res.rows, { unit: unit.value, year: +year.value, swapped: res.swapped });
    } })]));
    body.appendChild(h('p', { class: 'note', text: 'Trennzeichen: Tabulator, „ – “, „ = “, „ - “, „ | “ oder „;“. Lautschrift in [eckigen Klammern] wird entfernt. Eine dritte Spalte wird als Beispielsatz übernommen.' }));
    body.appendChild(prev);
    // CSV
    body.appendChild(h('h2', { class: 'group-h', text: '3. CSV-Datei importieren' }));
    var prev2 = h('div', { class: 'preview' });
    body.appendChild(h('div', { class: 'row' }, [
      h('button', { class: 'btn primary', type: 'button', text: 'CSV-Datei wählen …', onclick: function () {
        U.readFile('.csv,.txt,text/csv', function (text) { var res = content.parseCsv(text, { unit: unit.value, year: +year.value }); if (res.error) { prev2.textContent = res.error; return; } preview(app, prev2, res.rows, { unit: unit.value, year: +year.value, csv: true }); });
      } }),
      h('button', { class: 'btn soft', type: 'button', text: 'Vorlage herunterladen', onclick: function () { U.download('english-bobins-vorlage.csv', content.csvTemplate(), 'text/csv;charset=utf-8'); } })]));
    body.appendChild(h('p', { class: 'note', text: 'Spalten: englisch; deutsch; englisch_auch; deutsch_auch; beispiel; beispiel_deutsch; wortart; klasse; unit; seite; tags. Nur englisch und deutsch sind nötig. Excel: „Speichern unter → CSV UTF-8“.' }));
    body.appendChild(prev2);
    body.appendChild(h('h2', { class: 'group-h', text: '4. Foto einer Vokabelliste' }));
    body.appendChild(h('p', { class: 'note', text: 'Noch nicht in der App: Fotos der Vokabelseiten an Claude schicken – die Wörter werden dann geprüft und fest eingebaut.' }));
  };
  function preview(app, box, rows, opts) {
    var content = app.content;
    box.innerHTML = '';
    if (!rows.length) { box.appendChild(h('p', { class: 'soft-line', text: 'Keine Wörter erkannt.' })); return; }
    if (opts.swapped) box.appendChild(h('p', { class: 'note', text: 'Die Spalten sahen vertauscht aus (Deutsch zuerst) – sie wurden getauscht. Bitte kontrollieren.' }));
    var t = h('div', { class: 'ptable preview-t' });
    t.appendChild(h('div', { class: 'pt-row head' }, [h('span', { text: 'übernehmen' }), h('span', { text: 'Englisch' }), h('span', { text: 'Deutsch' }), h('span', { text: 'Hinweis' })]));
    rows.forEach(function (r) {
      var cb = h('input', { type: 'checkbox', 'aria-label': 'übernehmen' }); cb.checked = !r.problems.length && !(r.dup && r.dup.kind === 'same');
      var en = U.input({ value: r.en, lang: 'en', 'aria-label': 'Englisch' }), de = U.input({ value: r.de, 'aria-label': 'Deutsch' });
      var note = h('span', { class: 'note' });
      var rowEl;
      function upd() { r.en = en.value; r.de = de.value; content.checkRow(r, opts); if (rowEl) rowEl.classList.toggle('bad', !!r.problems.length); note.textContent = r.problems.join(', ') || (r.dup ? (r.dup.kind === 'same' ? 'schon in dieser Unit' : 'kennt er schon aus ' + content.unitShort(r.dup.word.unit) + ' – Lernstand wird übernommen') : (r.unit && /^new:/.test(r.unit) ? 'neue Unit: ' + r.unit.slice(4) : '')); }
      en.addEventListener('input', upd); de.addEventListener('input', upd);
      cb.addEventListener('change', function () { r.skip = !cb.checked; });
      r.skip = !cb.checked;
      upd();
      rowEl = h('div', { class: 'pt-row' + (r.problems.length ? ' bad' : '') }, [cb, en, de, note]);
      t.appendChild(rowEl);
    });
    box.appendChild(t);
    box.appendChild(h('div', { class: 'row' }, [
      h('button', { class: 'btn soft small', type: 'button', text: '⇄ Spalten tauschen', onclick: function () { rows.forEach(function (r) { var x = r.en; r.en = r.de; r.de = x; }); preview(app, box, rows, Object.assign({}, opts, { swapped: false })); } }),
      h('button', { class: 'btn primary', type: 'button', text: 'Speichern (' + rows.length + ')', onclick: function () {
        rows.forEach(function (r) { r.skip = r.skip || !!r.problems.length; });
        var res = content.importRows(rows, { unit: opts.unit, year: opts.year });
        toast(res.added + ' neu gespeichert' + (res.skipped ? ', ' + res.skipped + ' übersprungen' : ''));
        box.innerHTML = ''; box.appendChild(h('p', { class: 'ok-line', text: '✓ ' + res.added + ' Wörter gespeichert' + (res.skipped ? ' · ' + res.skipped + ' übersprungen' : '') + '.' }));
      } })]));
  }

  // ---------------------------------------------------------------- units
  VIEWS.units = function (app, body) {
    var content = app.content, store = app.store, st = store.settings();
    var active = EB.session.activeUnits(content, store);
    body.appendChild(h('p', { class: 'note', text: '„Aktuell“ = diese Units kommen in „Neue Vokabeln“ und bekommen in „Heute üben“ die meiste Übung. Alles andere wird über die Wiederholung weiter geübt – nichts geht verloren.' }));
    var t = h('div', { class: 'ptable units' });
    content.units.forEach(function (u) {
      var n = content.wordsIn([u.id]).length;
      var cb = h('input', { type: 'checkbox', 'aria-label': 'aktuell' }); cb.checked = active.indexOf(u.id) >= 0;
      cb.addEventListener('change', function () {
        var list = (st.activeUnits.length ? st.activeUnits : active).filter(function (x) { return x !== u.id; });
        if (cb.checked) list.push(u.id);
        store.set('activeUnits', list); toast('Gespeichert');
      });
      t.appendChild(h('div', { class: 'pt-row' }, [h('label', { class: 'cb' }, [cb, ' aktuell']), h('span', { text: content.unitLabel(u.id) }), h('span', { class: 'note', text: n + ' Wörter' + (u.src === 'demo' ? ' · Demo' : u.src === 'book' ? ' · fest eingebaut' : '') }),
        h('span', { class: 'pt-actions' }, [
          h('button', { class: 'btn soft small', type: 'button', text: 'Wörter', onclick: function () { location.hash = '#/eltern/woerter'; setTimeout(function () { var s = document.querySelector('.filters select'); if (s) { s.value = u.id; s.dispatchEvent(new Event('change')); } }, 50); } }),
          h('button', { class: 'btn soft small', type: 'button', text: 'Bearbeiten', onclick: function () { editUnit(app, u); } })])]));
    });
    body.appendChild(t);
    body.appendChild(h('div', { class: 'row' }, [h('button', { class: 'btn primary', type: 'button', text: '+ Neue Unit', onclick: function () { editUnit(app, null); } })]));
  };
  function editUnit(app, u) {
    var content = app.content, isNew = !u;
    u = u || { year: 6, book: 'Green Line 2', name: 'Unit ' + (content.units.filter(function (x) { return x.src !== 'demo'; }).length + 1), title: '' };
    var f = { year: sel([[5, 'Klasse 5'], [6, 'Klasse 6'], [7, 'Klasse 7'], [8, 'Klasse 8'], [9, 'Klasse 9'], [10, 'Klasse 10']], u.year), book: U.input({ value: u.book || '' }), name: U.input({ value: u.name || '' }), title: U.input({ value: u.title || '' }), order: U.input({ value: u.order || '', inputmode: 'numeric' }) };
    var box = h('div', { class: 'edit' }, [h('div', { class: 'grid2' }, [field('Buch', f.book, 'z. B. Green Line 2'), field('Klasse', f.year)]), h('div', { class: 'grid2' }, [field('Name', f.name, 'z. B. Unit 2'), field('Titel (optional)', f.title)]), field('Reihenfolge', f.order, 'kleinere Zahl = weiter vorne')]);
    box.appendChild(h('div', { class: 'row' }, [
      h('button', { class: 'btn primary', type: 'button', text: 'Speichern', onclick: function () { content.saveUnit({ id: isNew ? null : u.id, year: +f.year.value, book: f.book.value, name: f.name.value, title: f.title.value, order: +f.order.value || u.order }); close(); refresh(app); } }),
      isNew ? null : h('button', { class: 'btn danger', type: 'button', text: 'Unit löschen', onclick: function () { U.confirm('Unit löschen?', 'Die Unit und ihre ' + content.wordsIn([u.id]).length + ' Wörter werden gelöscht (der Lernstand bleibt gespeichert).', 'Löschen', function () { content.deleteUnit(u.id); close(); refresh(app); }, true); } }),
      h('button', { class: 'btn soft', type: 'button', text: 'Abbrechen', onclick: function () { close(); } })]));
    var close = U.modal(isNew ? 'Neue Unit' : 'Unit bearbeiten', box, { cls: 'wide' });
  }

  // ---------------------------------------------------------------- grammar
  VIEWS.grammatik = function (app, body) {
    var content = app.content, store = app.store, st = store.settings();
    var active = EB.session.activeModules(content, store).map(function (m) { return m.id; });
    body.appendChild(h('p', { class: 'note', text: '„Aktiv“ = kommt in „Heute üben“ und „Grammatik gemischt“. Alle Themen kann Lukas jederzeit unter „Grammatik“ einzeln üben.' }));
    var t = h('div', { class: 'ptable mods' });
    content.grammar.forEach(function (m) {
      var cb = h('input', { type: 'checkbox', 'aria-label': 'aktiv' }); cb.checked = active.indexOf(m.id) >= 0;
      cb.addEventListener('change', function () {
        var list = active.filter(function (x) { return x !== m.id; }); if (cb.checked) list.push(m.id);
        active = list; store.set('activeGrammar', list); toast('Gespeichert');
      });
      var local = !!content.local.grammar[m.id], builtIn = (EB.data.grammar || []).some(function (x) { return x.id === m.id; });
      var pr = EB.screens.modProgress(store, m);
      t.appendChild(h('div', { class: 'pt-row' }, [h('label', { class: 'cb' }, [cb, ' aktiv']), h('span', { text: m.title + ' (Kl. ' + m.year + ')' }),
        h('span', { class: 'note', text: m.items.length + ' Aufgaben · ' + Math.round(pr.share * 100) + ' %' + (local && builtIn ? ' · geändert' : !builtIn ? ' · eigenes Modul' : '') + (m.errors.length ? ' · ⚠ ' + m.errors.length + ' Fehler' : '') }),
        h('span', { class: 'pt-actions' }, [h('button', { class: 'btn soft small', type: 'button', text: 'Bearbeiten', onclick: function () { editModule(app, m); } })])]));
    });
    body.appendChild(t);
    body.appendChild(h('div', { class: 'row' }, [h('button', { class: 'btn primary', type: 'button', text: '+ Neues Grammatik-Modul', onclick: function () { editModule(app, null); } })]));
    body.appendChild(formatHelp());
  };
  function formatHelp() {
    return h('details', { class: 'help' }, [h('summary', { text: 'So schreibt man Aufgaben' }), h('pre', { text:
      'Art [Thema] | Aufgabe | richtige Antwort ; auch richtig | Erklärung\n\n' +
      'lücke | My sister ___ twelve. | is\n' +
      'form [irr] | Yesterday Tom ___ (go) to school. | went | «go» ist unregelmäßig: go – went – gone.\n' +
      '~ goed = «go» ist unregelmäßig. Die Vergangenheitsform lautet «went».\n' +
      'verneinen | She likes fish. | She doesn\'t like fish.\n' +
      'frage | You saw the match. | Did you see the match?\n' +
      'ordnen | | What did you do yesterday?        (Wörter werden automatisch gemischt)\n' +
      'übersetzen | Ich bin müde. | I am tired.\n' +
      'korrigieren | He go to school. | He goes to school.\n\n' +
      '! Anweisung für die folgenden Zeilen\n' +
      '@ irr = unregelmäßige Verben      (Name eines Themas)\n' +
      '# Kommentar\n\n' +
      'Kurzformen (don\'t / do not) werden automatisch beide akzeptiert. Ein Thema wird nach Fehlern später mit einem ANDEREN Satz geübt – also mehrere Sätze pro Thema schreiben.'
    })]);
  }
  function editModule(app, m) {
    var content = app.content, store = app.store, isNew = !m;
    var src = m ? (content.local.grammar[m.id] || (EB.data.grammar || []).filter(function (x) { return x.id === m.id; })[0] || m) : { title: '', year: 6, level: 2, intro: '', examples: '', mistakes: '', exercises: '' };
    function txt(v) { return Array.isArray(v) ? v.map(function (x) { return typeof x === 'string' ? x : (x.wrong ? x.wrong + ' => ' + x.right + ' => ' + (x.why || '') : x.en + ' = ' + x.de); }).join('\n') : (v || ''); }
    var f = {
      title: U.input({ value: src.title }), year: sel([[5, 'Klasse 5'], [6, 'Klasse 6'], [7, 'Klasse 7'], [8, 'Klasse 8']], src.year || 6), unit: U.input({ value: src.unit || '' }),
      level: sel([[1, 'leicht'], [2, 'mittel'], [3, 'schwer']], src.level || 2),
      intro: h('textarea', { rows: 7, text: src.intro || '' }), examples: h('textarea', { rows: 4, text: txt(src.examples) }),
      mistakes: h('textarea', { rows: 3, text: txt(src.mistakes) }), exercises: h('textarea', { rows: 14, class: 'mono', text: txt(src.exercises) })
    };
    var info = h('div', { class: 'parse-info' });
    function test() {
      var c = EB.grammar.compile({ id: (m && m.id) || 'neu', title: f.title.value, exercises: f.exercises.value, gen: src.gen, examples: f.examples.value, mistakes: f.mistakes.value });
      info.innerHTML = '';
      info.appendChild(h('p', { class: c.errors.length ? 'soft-line' : 'ok-line', text: c.items.length + ' Aufgaben erkannt' + (c.errors.length ? ', ' + c.errors.length + ' Zeilen mit Fehler:' : ' ✓') }));
      c.errors.forEach(function (e) { info.appendChild(h('p', { class: 'err', text: 'Zeile ' + e.line + ': ' + e.why + ' – „' + e.text + '“' })); });
      return c;
    }
    f.exercises.addEventListener('input', function () { clearTimeout(f._t); f._t = setTimeout(test, 400); });
    var box = h('div', { class: 'edit' }, [
      h('div', { class: 'grid4' }, [field('Titel', f.title), field('Klasse', f.year), field('Unit / Seite', f.unit), field('Schwierigkeit', f.level)]),
      field('Erklärung (Deutsch)', f.intro, '**fett**, Zeilen mit „- “ werden Aufzählungen'),
      h('div', { class: 'grid2' }, [field('Beispiele', f.examples, 'eine Zeile: English sentence = Deutscher Satz'), field('Typische Fehler', f.mistakes, 'falsch => richtig => warum')]),
      field('Aufgaben', f.exercises), src.gen && src.gen.length ? h('p', { class: 'note', text: 'Dazu kommen automatisch erzeugte Aufgaben (' + src.gen.join(', ') + ').' }) : null, info, formatHelp()
    ]);
    var builtIn = m && (EB.data.grammar || []).some(function (x) { return x.id === m.id; });
    box.appendChild(h('div', { class: 'row' }, [
      h('button', { class: 'btn primary', type: 'button', text: 'Speichern', onclick: function () {
        var c = test();
        if (!T.clean(f.title.value)) { info.appendChild(h('p', { class: 'err', text: 'Bitte einen Titel eingeben.' })); return; }
        if (!c.items.length) { info.appendChild(h('p', { class: 'err', text: 'Es gibt noch keine gültige Aufgabe.' })); return; }
        content.saveModule({ id: m ? m.id : null, title: f.title.value, year: +f.year.value, unit: f.unit.value, level: +f.level.value, order: src.order || 100, active: src.active !== false,
          intro: f.intro.value, examples: f.examples.value, mistakes: f.mistakes.value, exercises: f.exercises.value, gen: src.gen || [], src: builtIn ? 'edited' : 'parent' });
        close(); toast('Gespeichert'); refresh(app);
      } }),
      m && content.local.grammar[m.id] && builtIn ? h('button', { class: 'btn soft', type: 'button', text: 'Original wiederherstellen', onclick: function () { delete content.local.grammar[m.id]; content.save(); content.rebuild(); close(); refresh(app); } }) : null,
      m && !builtIn ? h('button', { class: 'btn danger', type: 'button', text: 'Löschen', onclick: function () { U.confirm('Modul löschen?', '«' + m.title + '» wird gelöscht.', 'Löschen', function () { content.deleteModule(m.id); close(); refresh(app); }, true); } }) : null,
      m ? h('button', { class: 'btn soft', type: 'button', text: 'Lernstand zurücksetzen', onclick: function () { store.resetModule(m.id); toast('Zurückgesetzt'); } }) : null,
      h('button', { class: 'btn soft', type: 'button', text: 'Abbrechen', onclick: function () { close(); } })]));
    var close = U.modal(isNew ? 'Neues Grammatik-Modul' : m.title, box, { cls: 'wide' });
    test();
  }

  // ---------------------------------------------------------------- Klassenarbeit
  VIEWS.ka = function (app, body) {
    var content = app.content, store = app.store, t = store.doc.test;
    var date = h('input', { type: 'date', value: t.date || '' }), label = U.input({ value: t.label || 'Klassenarbeit' });
    body.appendChild(h('div', { class: 'grid2' }, [field('Datum', date), field('Bezeichnung', label, 'z. B. Englisch-Arbeit, Vokabeltest')]));
    body.appendChild(h('h2', { class: 'group-h', text: 'Welche Units kommen dran?' }));
    var uBox = h('div', { class: 'checks' }), mBox = h('div', { class: 'checks' });
    content.units.forEach(function (u) { var cb = h('input', { type: 'checkbox', value: u.id }); cb.checked = (t.units || []).indexOf(u.id) >= 0; uBox.appendChild(h('label', { class: 'cb' }, [cb, ' ' + content.unitLabel(u.id)])); });
    body.appendChild(uBox);
    body.appendChild(h('h2', { class: 'group-h', text: 'Welche Grammatik?' }));
    content.grammar.forEach(function (m) { var cb = h('input', { type: 'checkbox', value: m.id }); cb.checked = (t.modules || []).indexOf(m.id) >= 0; mBox.appendChild(h('label', { class: 'cb' }, [cb, ' ' + m.title + ' (Kl. ' + m.year + ')'])); });
    body.appendChild(mBox);
    body.appendChild(h('div', { class: 'row' }, [h('button', { class: 'btn primary', type: 'button', text: 'Speichern', onclick: function () {
      store.setTest({ date: date.value, label: T.clean(label.value) || 'Klassenarbeit',
        units: [].slice.call(uBox.querySelectorAll('input:checked')).map(function (x) { return x.value; }),
        modules: [].slice.call(mBox.querySelectorAll('input:checked')).map(function (x) { return x.value; }) });
      toast('Gespeichert');
    } }), h('button', { class: 'btn soft', type: 'button', text: 'Klassenarbeit entfernen', onclick: function () { store.setTest({ date: '', units: [], modules: [] }); refresh(app); } })]));
    body.appendChild(h('p', { class: 'note', text: 'Lukas sieht dann einen Countdown und kann „Für die Klassenarbeit üben“ (schwächste Wörter zuerst) oder eine Probe-Klassenarbeit schreiben (ohne Hilfe, Auswertung am Ende).' }));
  };

  // ---------------------------------------------------------------- settings
  VIEWS.einstellungen = function (app, body) {
    var store = app.store, st = store.settings();
    function numIn(v, min, max) { return h('input', { type: 'number', min: min, max: max, value: v, class: 'num-in' }); }
    var mix = { neu: numIn(st.mix.neu, 0, 100), alt: numIn(st.mix.alt, 0, 100), fehler: numIn(st.mix.fehler, 0, 100) };
    var daily = { neu: numIn(st.daily.neu, 0, 30), alt: numIn(st.daily.alt, 0, 30), fehler: numIn(st.daily.fehler, 0, 30), gram: numIn(st.daily.gram, 0, 20) };
    var size = numIn(st.roundSize, 5, 50), enDe = numIn(st.enDe, 0, 60), rate = h('input', { type: 'range', min: 0.6, max: 1.1, step: 0.05, value: st.rate || 0.85 });
    var am = h('input', { type: 'checkbox' }); am.checked = st.american !== false;
    var retry = h('input', { type: 'checkbox' }); retry.checked = st.retry !== false;
    var auto = h('input', { type: 'checkbox' }); auto.checked = !!st.autoSpeak;
    var big = h('input', { type: 'checkbox' }); big.checked = !!st.bigText;
    var font = sel([['', 'Atkinson Hyperlegible (Standard)'], ['dyslexic', 'OpenDyslexic']], st.font || '');
    var voice = sel([['', 'automatisch (britisch bevorzugt)']], st.voice || '');
    EB.speech.onVoices(function () { var cur = voice.value || st.voice; voice.innerHTML = ''; [['', 'automatisch (britisch bevorzugt)']].concat(EB.speech.voices('en').map(function (v) { return [v.name, v.name + ' (' + v.lang + ')']; })).forEach(function (o) { var op = h('option', { value: o[0], text: o[1] }); if (o[0] === cur) op.selected = true; voice.appendChild(op); }); });
    body.appendChild(h('h2', { class: 'group-h', text: 'Heute üben (Aufgaben pro Runde)' }));
    body.appendChild(h('div', { class: 'grid4' }, [field('aktuelle Unit', daily.neu), field('Wiederholung', daily.alt), field('schwierige Wörter', daily.fehler), field('Grammatik', daily.gram)]));
    body.appendChild(h('p', { class: 'note', text: 'Fehlt etwas (z. B. keine schwierigen Wörter), wird mit anderen Wörtern aufgefüllt. ~22 Aufgaben ≈ 10–15 Minuten.' }));
    body.appendChild(h('h2', { class: 'group-h', text: 'Gemischtes Training (Prozent)' }));
    body.appendChild(h('div', { class: 'grid4' }, [field('aktuelle Unit', mix.neu), field('ältere, fällige', mix.alt), field('schwierige', mix.fehler), field('Wörter pro Runde', size)]));
    body.appendChild(h('h2', { class: 'group-h', text: 'Abfrage' }));
    body.appendChild(h('div', { class: 'grid2' }, [field('Englisch → Deutsch (Prozent bei bekannten Wörtern)', enDe, 'Hauptsache ist Deutsch → Englisch'), field('Sprechtempo', rate)]));
    body.appendChild(h('div', { class: 'checks' }, [
      h('label', { class: 'cb' }, [retry, ' Zweiter Versuch, bevor die Lösung gezeigt wird']),
      h('label', { class: 'cb' }, [am, ' Amerikanische Schreibweise als richtig zählen (mit Hinweis auf britisch)']),
      h('label', { class: 'cb' }, [auto, ' Englische Wörter automatisch vorlesen']),
      h('label', { class: 'cb' }, [big, ' Extra große Schrift'])]));
    body.appendChild(h('div', { class: 'grid2' }, [field('Schrift', font), field('Englische Stimme', voice)]));
    body.appendChild(h('div', { class: 'row' }, [h('button', { class: 'btn primary', type: 'button', text: 'Speichern', onclick: function () {
      function n(e, d) { var v = parseInt(e.value, 10); return isNaN(v) ? d : Math.max(+e.min, Math.min(+e.max, v)); }
      store.set('mix', { neu: n(mix.neu, 60), alt: n(mix.alt, 25), fehler: n(mix.fehler, 15) });
      store.set('daily', { neu: n(daily.neu, 8), alt: n(daily.alt, 6), fehler: n(daily.fehler, 4), gram: n(daily.gram, 4) });
      store.set('roundSize', n(size, 20)); store.set('enDe', n(enDe, 20)); store.set('rate', +rate.value);
      store.set('american', am.checked); store.set('retry', retry.checked); store.set('autoSpeak', auto.checked); store.set('bigText', big.checked);
      store.set('font', font.value); store.set('voice', voice.value);
      app.applySettings(); toast('Gespeichert');
    } }), EB.speech.supported ? h('button', { class: 'btn soft', type: 'button', text: '🔊 Stimme testen', onclick: function () { EB.speech.speak('Hello Lukas! This is your English trainer.', { lang: 'en', voice: voice.value, rate: +rate.value }); } }) : null]));
  };

  // ---------------------------------------------------------------- data
  VIEWS.daten = function (app, body) {
    var content = app.content, store = app.store;
    body.appendChild(h('div', { class: 'card warn' }, [h('p', { rich: '**Wo die Daten liegen:** Wörter, Grammatik-Änderungen und Lernstand sind nur **in diesem Browser auf diesem Gerät** gespeichert. Sie werden nicht automatisch auf andere Geräte übertragen und gehen verloren, wenn die Browserdaten gelöscht werden.' }),
      h('p', { rich: 'Darum regelmäßig eine **Sicherung** herunterladen. Mit Robin\'s Bobins ist English-Bobins auch in der Familien-Sicherung (Elternbereich dort) enthalten.' })]));
    body.appendChild(h('h2', { class: 'group-h', text: 'Sicherung' }));
    body.appendChild(h('div', { class: 'row' }, [
      h('button', { class: 'btn primary', type: 'button', text: '⬇ Sicherung herunterladen', onclick: function () {
        U.download('english-bobins-sicherung-' + T.dayKey() + '.json', JSON.stringify({ format: 'english-bobins-backup', version: 1, exportedAt: new Date().toISOString(), child: store.childId, content: content.exportLocal(), progress: store.export() }, null, 1));
      } }),
      h('button', { class: 'btn soft', type: 'button', text: '⬆ Sicherung einspielen …', onclick: function () {
        U.readFile('.json,application/json', function (text) {
          var d; try { d = JSON.parse(text); } catch (e) { return toast('Die Datei ist kein JSON.'); }
          if (!d || d.format !== 'english-bobins-backup') return toast('Das ist keine English-Bobins-Sicherung.');
          U.confirm('Sicherung einspielen?', 'Wörter und Grammatik werden **ergänzt**, der Lernstand wird durch den aus der Sicherung (' + new Date(d.exportedAt).toLocaleString('de-DE') + ') **ersetzt**.', 'Einspielen', function () {
            try { content.importLocal(d.content, 'merge'); if (d.progress) store.import(d.progress); toast('Eingespielt'); refresh(app); } catch (e) { toast(e.message); }
          });
        });
      } })]));
    body.appendChild(h('h2', { class: 'group-h', text: 'Vokabeln als Tabelle' }));
    body.appendChild(h('div', { class: 'row' }, [
      h('button', { class: 'btn soft', type: 'button', text: '⬇ Alle Vokabeln als CSV', onclick: function () { U.download('english-bobins-vokabeln-' + T.dayKey() + '.csv', content.toCsv(), 'text/csv;charset=utf-8'); } }),
      h('button', { class: 'btn soft', type: 'button', text: '⬇ CSV-Vorlage', onclick: function () { U.download('english-bobins-vorlage.csv', content.csvTemplate(), 'text/csv;charset=utf-8'); } })]));
    body.appendChild(h('h2', { class: 'group-h', text: 'Demo-Inhalte' }));
    var demoOn = !content.local.demoOff;
    body.appendChild(h('p', { text: 'Demo-Wörter (selbst geschrieben, nicht die Klett-Liste): ' + (demoOn ? 'eingeschaltet' : 'ausgeschaltet') + '.' }));
    body.appendChild(h('div', { class: 'row' }, [
      h('button', { class: 'btn soft', type: 'button', text: demoOn ? 'Demo-Wörter ausschalten' : 'Demo-Wörter einschalten', onclick: function () { content.setDemo(!demoOn); var ids = store.settings().activeUnits.filter(function (u) { return content.unitById[u]; }); store.set('activeUnits', ids); refresh(app); } }),
      store.doc.sample ? h('button', { class: 'btn soft', type: 'button', text: 'Beispiel-Lernstand entfernen', onclick: function () { removeSample(store); toast('Beispiel-Lernstand entfernt'); refresh(app); } })
        : h('button', { class: 'btn soft', type: 'button', text: 'Beispiel-Lernstand anlegen (zum Ausprobieren)', onclick: function () { addSample(content, store); toast('Beispiel-Lernstand angelegt'); refresh(app); } })]));
    body.appendChild(h('p', { class: 'note', text: 'Der Beispiel-Lernstand füllt die Statistik mit erfundenen Antworten zu den Demo-Wörtern – zum Ansehen. Er lässt sich hier wieder vollständig entfernen.' }));
    body.appendChild(h('h2', { class: 'group-h', text: 'Zurücksetzen' }));
    body.appendChild(h('div', { class: 'row' }, [h('button', { class: 'btn danger', type: 'button', text: 'Gesamten Lernstand löschen', onclick: function () {
      U.confirm('Gesamten Lernstand löschen?', 'Alle Lernstufen, Fehler und Statistiken von ' + app.platform.childName + ' werden gelöscht. Die Wörter bleiben. Vorher am besten eine Sicherung herunterladen.', 'Löschen', function () { store.resetAll(); refresh(app); }, true);
    } })]));
  };

  // ---------------------------------------------------------------- sample progress (demo words only, removable)
  function addSample(content, store) {
    var rnd = T.rng(7), now = Date.now(), keys = [];
    content.uniqueWords(content.words.filter(function (w) { return w.src === 'demo'; })).forEach(function (w, k) {
      if (store.stat(w.key)) return;
      var s = store.ensure(w.key); keys.push(w.key);
      var n = 1 + Math.floor(rnd() * 5);
      for (var j = 0; j < n; j++) {
        var t = now - (10 - j * 2) * SRS.DAY - Math.floor(rnd() * 3600000), o = rnd() < 0.65 ? 'exact' : rnd() < 0.5 ? 'spelling' : 'wrong';
        SRS.update(s, o, t, { introduced: true });
        if (o === 'spelling') SRS.spelling(s, false, t, w.en.slice(0, -1));
        store.doc.log.push({ t: t, k: 'w', id: w.key, v: o === 'exact' ? 'right' : o, o: o, d: 'de-en', m: 'heute', s: 1 });
      }
      if (k % 5 === 0) { s.wrongs['xyz'] = 1; }
    });
    store.doc.sample = keys;
    store.doc.log.sort(function (a, b) { return a.t - b.t; });
    store.save();
  }
  function removeSample(store) {
    (store.doc.sample || []).forEach(function (k) { delete store.doc.words[k]; });
    store.doc.log = store.doc.log.filter(function (e) { return !e.s; });
    store.doc.sample = false; store.save();
  }

  EB.parent = { open: open, addSample: addSample, removeSample: removeSample };
})(typeof window !== 'undefined' ? window : globalThis);
