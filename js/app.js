/*
 * app.js — start-up, routing, header, Robin-Münzen. Loaded last.
 */
(function (root) {
  'use strict';
  var EB = root.EB, U = EB.ui, h = U.h, P = EB.platform, S;

  var content = new EB.Content();
  var store = new EB.Store(P.childId);
  var main = document.getElementById('main');
  var backBtn = document.getElementById('back'), appsLink = document.getElementById('apps-link');
  if (P.homeUrl) { appsLink.href = P.homeUrl; if (P.guest) appsLink.textContent = '‹ Start'; } else appsLink.hidden = true;
  U.useSettings(function () { return store.settings(); });

  var app = {
    content: content, store: store, platform: P, parentOk: false,
    robin: function (pose, size) { return P.robin(pose, size); },
    setView: function (node, opts) {
      opts = opts || {};
      main.innerHTML = ''; main.appendChild(node);
      backBtn.hidden = !opts.back;
      window.scrollTo(0, 0);
    },
    go: function (route) { if (location.hash !== '#/' + route) location.hash = '#/' + route; else render(); },
    start: start, applySettings: applySettings, refreshCoins: function () { showCoins(); }
  };
  EB.app = app;

  function applySettings() {
    var st = store.settings();
    document.documentElement.classList.toggle('font-dyslexic', st.font === 'dyslexic');
    document.documentElement.classList.toggle('big-text', !!st.bigText);
  }
  applySettings();
  backBtn.addEventListener('click', function () { EB.speech.stop(); app.go('home'); });

  // ---------------------------------------------------------------- Robin-Münzen
  // 1 per word / exercise known (spelling slips count), once per word and day · +1 when a difficult word
  // is cracked · at most 60 a day from single answers · round bonus: Heute +5, Probe-KA +8, others +3.
  // Paid into the family balance as ONE entry at the end of a round.
  var pill = document.getElementById('coin-pill'), coinsEl = document.getElementById('coins');
  function showCoins(bump) {
    if (!P.coins.available) return;
    pill.hidden = false; coinsEl.textContent = P.coins.balance();
    if (bump) { pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump'); }
  }
  showCoins();
  app.itemCoins = function (key, r, extra) {
    if (!P.coins.available) return 0;
    var c = store.doc.coins, day = EB.text.dayKey();
    if (!c.paid || c.paid.day !== day) c.paid = { day: day, keys: {} };
    var n = 0;
    if (r.outcome !== 'wrong' && !c.paid.keys[key]) { n = 1; c.paid.keys[key] = 1; }
    if (extra && extra.fixed) n++;
    n = store.takeItemCoins(n);
    store.save();
    return n;
  };
  app.roundEnd = function (sum, itemCoins, bonus, reason) {
    var done = 0;
    if (EB.screens) content.grammar.forEach(function (m) { if (m.items.length && EB.screens.modProgress(store, m).done && store.once('mod:' + m.id)) done++; });
    var total = (itemCoins || 0) + (bonus || 0) + 5 * done, paid = 0;
    if (total > 0) { paid = P.coins.add(total, reason); if (paid) store.logCoins(paid, sum.mode); }
    if (sum.n) P.recordActivity({ mode: sum.mode, total: sum.n, right: sum.right, startedAt: sum.startedAt, endedAt: sum.endedAt });
    showCoins(!!paid);
    return paid;
  };
  app.bonus = function (amount, reason) { var n = P.coins.add(amount, reason); if (n) { store.logCoins(n, reason); showCoins(true); } return n; };

  // ---------------------------------------------------------------- rounds
  var TITLES = { heute: '▶ Heute üben', neu: '🆕 Neue Vokabeln', alt: '🔁 Alte Vokabeln', fehler: '🎯 Meine Fehler', grammatik: '📘 Grammatik',
                 mix: '🔀 Gemischtes Training', ka: '📝 Klassenarbeit üben', probe: '📝 Probe-Klassenarbeit' };
  var EMPTY = {
    fehler: 'Gerade gibt es keine Fehler zum Üben. Super! Neue Fehler sammelt Robin beim Üben für dich.',
    alt: 'Alles Alte ist gerade frisch. Robin meldet sich, wenn wieder etwas fällig ist.',
    neu: 'Für die aktuelle Unit sind noch keine Wörter eingetragen.'
  };
  function start(mode, opts) {
    opts = opts || {};
    var round = EB.session.build(mode, content, store, opts);
    history.replaceState(null, '', '#/runde');
    var title = TITLES[mode] || '';
    if (mode === 'grammatik' && opts.module && content.modById[opts.module]) title = '📘 ' + content.modById[opts.module].title;
    EB.practice.run(app, round, { title: title, empty: EMPTY[mode] });
  }
  app.suggestNext = function () {
    var p = EB.session.preview(content, store), t = store.doc.test, days = t.date ? daysUntil(t.date) : null;
    if (p.hard) return { now: true, mode: 'fehler', button: '🎯 Meine Fehler üben', text: U.plural(p.hard, 'Wort ist', 'Wörter sind') + ' noch schwierig. Ein kurzer Fehler-Durchgang hilft – jetzt oder morgen.' };
    if (days != null && days >= 0 && days <= 10) return { now: true, mode: 'ka', button: '📝 Klassenarbeit üben', text: (days === 0 ? 'Heute' : days === 1 ? 'Morgen' : 'In ' + days + ' Tagen') + ' ist die ' + (t.label || 'Klassenarbeit') + '. Übe die Wörter dafür.' };
    if (p.due > 5) return { now: true, mode: 'alt', button: '🔁 Alte Vokabeln', text: U.plural(p.due, 'altes Wort wartet', 'alte Wörter warten') + ' auf eine Wiederholung.' };
    if (p.currentNew) return { now: false, mode: 'heute', text: 'Morgen wieder „Heute üben“ – dann kommen die nächsten neuen Wörter (noch ' + p.currentNew + ').' };
    return { now: false, mode: 'heute', text: 'Morgen wieder „Heute üben“ – Robin sucht dir die passenden Wörter heraus.' };
  };
  function daysUntil(d) {
    var t = new Date(d + 'T08:00:00'), n = new Date();
    return Math.round((Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()) - Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())) / 86400000);
  }
  app.daysUntil = daysUntil;

  // ---------------------------------------------------------------- router
  function render() {
    S = EB.screens;
    var r = (location.hash || '').replace(/^#\/?/, '');
    EB.speech.stop();
    if (!r || r === 'home') return S.home(app);
    if (/^start\//.test(r)) return start(r.slice(6));
    if (r === 'grammatik') return S.grammar(app);
    if (/^grammatik\//.test(r)) return S.module(app, decodeURIComponent(r.slice(10)));
    if (r === 'klassenarbeit') return S.test(app);
    if (r === 'fortschritt') return S.progress(app);
    if (/^woerter\//.test(r)) return S.unitWords(app, decodeURIComponent(r.slice(8)));
    if (r === 'eltern' || /^eltern\//.test(r)) return EB.parent.open(app, r.slice(7) || 'start');
    if (r === 'runde') return S.home(app);           // a reload during a round → start page
    S.home(app);
  }
  window.addEventListener('hashchange', render);
  render();

  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(function () { /* offline cache is optional */ });
})(typeof window !== 'undefined' ? window : globalThis);
