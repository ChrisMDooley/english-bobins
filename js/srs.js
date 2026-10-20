/*
 * srs.js — spaced repetition, kept deliberately simple (Leitner boxes). No DOM.
 *
 * Every word (and every grammar concept) has a box 0–6. Box 0 = never practised.
 *   right at once (no help) ........ one box up        → review later (see DAYS)
 *   right, but spelt wrong ......... box stays (min 1) → again tomorrow (spelling is practised separately)
 *   right at the 2nd try ........... one box down      → again tomorrow
 *   not known (answer shown) ....... back to box 1     → again in this round and tomorrow
 * A word answered right the very first time it is ever asked (old material Lukas already knows)
 * jumps to box 3, so known Klasse-5 words do not clog the reviews.
 * Even box 6 ("sicher") comes back every 5 weeks — mastered words are never forgotten.
 *
 * Stages shown to Lukas: Neu (0) · Wird gelernt (1–2) · Fast sicher (3–4) · Sicher (5–6).
 * "Schwierig": wrong at least twice, or wrong last time with box ≤ 1 — until right 3 times in a row
 * on at least 2 different days. Spelling problems have their own list with the same rule.
 */
(function (root) {
  'use strict';
  var T = root.EB.text;
  var DAY = 86400000;
  var DAYS = [0, 1, 2, 4, 8, 16, 35];                // box → days until the next review
  var STAGES = [
    { id: 'neu', label: 'Neu', boxes: [0] },
    { id: 'lernt', label: 'Wird gelernt', boxes: [1, 2] },
    { id: 'fast', label: 'Fast sicher', boxes: [3, 4] },
    { id: 'sicher', label: 'Sicher', boxes: [5, 6] }
  ];
  var STAGE_BOX = { neu: 0, lernt: 1, fast: 3, sicher: 5 };

  function blank() {
    return { n: 0, right: 0, known: 0, wrong: 0, streak: 0, box: 0, due: 0, last: 0, first: 0,
             hard: false, hardDays: [], spell: { n: 0, slips: 0, hard: false, days: [], last: '' }, wrongs: {}, history: [] };
  }
  function stage(s) {
    var b = s ? s.box : 0;
    return b >= 5 ? 'sicher' : b >= 3 ? 'fast' : b >= 1 ? 'lernt' : 'neu';
  }
  function stageLabel(id) { for (var i = 0; i < STAGES.length; i++) if (STAGES[i].id === id) return STAGES[i].label; return id; }

  // outcome: 'exact' | 'spelling' | 'second' | 'wrong'   (help counts as 'wrong' when the answer was shown)
  function update(s, outcome, t, opts) {
    opts = opts || {};
    t = t || Date.now();
    var day = T.dayKey(t), firstEver = !s.n, before = stage(s), prevBox = s.box;
    s.n++; s.last = t; if (!s.first) s.first = t;
    if (outcome === 'exact') {
      s.right++; s.streak++;
      s.box = firstEver && !opts.introduced ? 3 : Math.min(6, s.box + 1);
    } else if (outcome === 'spelling') {
      s.known++; s.streak = 0; s.box = Math.max(1, Math.min(s.box, 4));
    } else if (outcome === 'second') {
      s.known++; s.streak = 0; s.box = Math.max(1, s.box - 1);
    } else {
      s.wrong++; s.streak = 0; s.box = 1;
    }
    var days = outcome === 'wrong' ? 0 : outcome === 'exact' ? DAYS[s.box] : 1;
    s.due = outcome === 'wrong' ? t + 10 * 60000 : startOfDay(t) + days * DAY + 4 * 3600000;   // early next morning
    // difficult words
    if (outcome === 'wrong' || outcome === 'second') {
      if (s.wrong >= 2 || (outcome === 'wrong' && prevBox <= 1 && s.n > 1) || s.hard) { s.hard = true; s.hardDays = []; }
    } else if (outcome === 'exact' && s.hard) {
      if (s.hardDays.indexOf(day) < 0) s.hardDays.push(day);
      if (s.streak >= 3 && s.hardDays.length >= 2) { s.hard = false; s.hardDays = []; }
    }
    s.history.push([t, outcome[0]]);
    if (s.history.length > 30) s.history = s.history.slice(-30);
    return { before: before, after: stage(s), firstEver: firstEver };
  }
  // spelling, separately: ok = written right on the first try
  function spelling(s, ok, t, answer) {
    t = t || Date.now();
    var sp = s.spell, day = T.dayKey(t);
    sp.n++;
    if (!ok) { sp.slips++; sp.hard = true; sp.days = []; sp.last = answer || sp.last; sp.streak = 0; return; }
    sp.streak = (sp.streak || 0) + 1;
    if (sp.hard) {
      if (sp.days.indexOf(day) < 0) sp.days.push(day);
      if (sp.streak >= 3 && sp.days.length >= 2) { sp.hard = false; sp.days = []; }
    }
  }
  function noteWrong(s, answer) {
    var a = T.clean(answer).toLowerCase(); if (!a) return;
    s.wrongs[a] = (s.wrongs[a] || 0) + 1;
    var keys = Object.keys(s.wrongs);
    if (keys.length > 8) { keys.sort(function (x, y) { return s.wrongs[x] - s.wrongs[y]; }); delete s.wrongs[keys[0]]; }
  }
  function isDue(s, t) { return !!s && (s.n > 0 || s.box > 0) && s.due <= (t || Date.now()); }
  function overdue(s, t) { return s && s.n ? ((t || Date.now()) - s.due) / DAY : -Infinity; }
  // parent override: set a stage by hand
  function setStage(s, id, t) {
    t = t || Date.now();
    s.box = STAGE_BOX[id] != null ? STAGE_BOX[id] : s.box;
    if (id === 'neu') { var keep = s.history; var b = blank(); for (var k in b) s[k] = b[k]; s.history = keep; return; }
    s.due = startOfDay(t) + DAYS[s.box] * DAY + 4 * 3600000;
    if (id === 'sicher') { s.hard = false; s.spell.hard = false; }
  }
  function startOfDay(t) { var d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); }

  root.EB.srs = { blank: blank, update: update, spelling: spelling, noteWrong: noteWrong, stage: stage, stageLabel: stageLabel, isDue: isDue, overdue: overdue,
                  setStage: setStage, STAGES: STAGES, DAYS: DAYS, DAY: DAY, startOfDay: startOfDay };
})(typeof window !== 'undefined' ? window : globalThis);
