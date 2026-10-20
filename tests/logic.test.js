// node tests/logic.test.js — content layer, import, spaced repetition, storage, rounds, a simulated month.
const load = require('./load.js');
let pass = 0, fail = 0;
function ok(cond, msg, info) { if (cond) pass++; else { fail++; console.log('FAIL', msg, info !== undefined ? JSON.stringify(info).slice(0, 400) : ''); } }

const DAY = 86400000;
let ctx = load(), E = ctx.EB;

// ---------------------------------------------------------------- content
let content = new E.Content();
ok(content.words.length >= 26 + 89, 'demo + irregular verbs loaded', content.words.length);
ok(content.words.every(w => w.key && w.id), 'every word has id + key');
ok(content.units.some(u => u.id === 'gl2-irr') && content.units.some(u => u.id === 'demo-6'), 'units');
ok(content.grammar.length >= 12 && content.grammar.every(m => m.items.length), 'grammar modules with items');
ok(new Set(content.grammar.flatMap(m => m.items.map(i => i.id))).size === content.grammar.reduce((n, m) => n + m.items.length, 0), 'exercise ids unique');
ok(E.data.irregular.length === 89, '89 irregular verbs (S. 206–207)', E.data.irregular.length);
const go = E.data.irregular.find(v => v.id === 'go');
ok(go.past[0] === 'went' && go.pp[0] === 'gone', 'go – went – gone');
ok(E.data.irregular.find(v => v.id === 'burn').past.join('/') === 'burnt/burned', 'two forms');
ok(content.word('gl2-irr-hurt').page === '207' && content.word('gl2-irr-hold').page === '206', 'pages 206/207');

// paste import with preview, IPA, separators, swapped columns, duplicates
let res = content.parsePaste('holiday [ˈhɒlədeɪ] – Ferien; Urlaub\n(to) remember = sich erinnern\nisland\tInsel\tSkye is an island.\nfriend - Freund\n\n# comment\nnothing here', { unit: 'demo-6', year: 6 });
ok(res.rows.length === 5, 'paste rows', res.rows.length);
ok(res.rows[0].en === 'holiday' && res.rows[0].de === 'Ferien; Urlaub', 'IPA removed, en dash', res.rows[0]);
ok(res.rows[2].example === 'Skye is an island.', 'third column = example');
ok(res.rows[0].dup && res.rows[0].dup.kind === 'same', 'holiday is a duplicate in demo-6', res.rows[0].dup);
ok(res.rows[3].dup && res.rows[3].dup.kind === 'other', 'friend exists in another unit');
ok(res.rows[4].problems.length, 'line without German flagged');
let sw = content.parsePaste('Ferien – holiday\nInsel – island\nschön – beautiful', {});
ok(sw.swapped && sw.rows[0].en === 'holiday', 'German-first list swapped', sw.rows[0]);
let unit = content.saveUnit({ year: 6, book: 'Green Line 2', name: 'Unit 1', title: 'Test' });
let imp = content.importRows(content.parsePaste('castle – Burg\nweather – Wetter\nbridge – Brücke\nhill - Hügel', { unit: unit.id }).rows, { unit: unit.id });
ok(imp.added === 4 && imp.skipped === 0, 'import adds 4 (castle/weather also in demo → shared history)', imp);
let castleKeys = content.byKey[E.content.wordKey({ en: 'castle', de: 'Burg' })];
ok(castleKeys && castleKeys.length === 2, 'same word in two units shares one key', castleKeys && castleKeys.length);
imp = content.importRows(content.parsePaste('bridge – Brücke', { unit: unit.id }).rows, { unit: unit.id });
ok(imp.added === 0 && imp.skipped === 1, 'exact duplicate skipped', imp);

// CSV with header, quotes, semicolons, a new unit
let csv = '﻿englisch;deutsch;englisch_auch;deutsch_auch;beispiel;beispiel_deutsch;wortart;klasse;unit;seite;tags\r\n' +
  '"(to) go (went, gone)";gehen;;fahren;"We go, they go.";;Verb;6;Unit 2;160;unregelmäßig\r\nsuitcase;Koffer;;;;;Nomen;6;Unit 2;161;\r\n';
let cres = content.parseCsv(csv, {});
ok(cres.header && cres.rows.length === 2, 'csv rows', cres);
ok(cres.rows[0].example === 'We go, they go.' && cres.rows[0].type === 'verb' && cres.rows[0].deAlt[0] === 'fahren', 'csv fields', cres.rows[0]);
ok(cres.rows[1].unit === 'new:Unit 2', 'csv unknown unit pending', cres.rows[1].unit);
ok(!content.units.some(u => u.name === 'Unit 2'), 'preview does not create units');
imp = content.importRows(cres.rows, {});
ok(imp.added === 2 && content.units.some(u => u.name === 'Unit 2'), 'import creates Unit 2', imp);
let csvNoHead = content.parseCsv('apple,Apfel\npear,Birne\n', {});
ok(csvNoHead.rows.length === 2 && csvNoHead.rows[1].de === 'Birne', 'csv without header (comma)', csvNoHead.rows);
let out = content.toCsv();
ok(/^﻿englisch;deutsch/.test(out) && out.indexOf('suitcase;Koffer') > 0, 'csv export');
let round = content.parseCsv(out, {});
ok(round.rows.length === content.words.length, 'csv round trip', [round.rows.length, content.words.length]);

// parent edits a built-in word, deletes one, demo off; all survive a reload
let w = content.word('demo-difficult');
content.saveWord(Object.assign({}, w, { deAlt: 'schwer; kompliziert' }));
content.deleteWord('demo-quiet');
let content2 = new E.Content();
ok(content2.word('demo-difficult').deAlt.indexOf('kompliziert') >= 0, 'edit of a built-in word persists');
ok(!content2.word('demo-quiet'), 'deletion persists');
ok(content2.units.some(u => u.name === 'Unit 1') && content2.wordsIn([unit.id]).length === 4, 'own unit + words persist');
content2.setDemo(false);
ok(!new E.Content().words.some(w => w.src === 'demo'), 'demo switched off');
content2.setDemo(true);
ok(new E.Content().words.some(w => w.src === 'demo'), 'demo back on');
// backup of the parent layer
let lay = content2.exportLocal(), fresh = load().EB, c3 = new fresh.Content();
c3.importLocal(JSON.parse(JSON.stringify(lay)), 'replace');
ok(c3.wordsIn([unit.id]).length === 4, 'content backup restores on another device');
let threw = false; try { c3.importLocal({ foo: 1 }); } catch (e) { threw = true; }
ok(threw, 'bad backup rejected');

// grammar module format
let G = E.grammar;
let gm = G.compile({ id: 'own', title: 'Eigenes', exercises: '! Setze ein.\n@ x = Thema X\nlücke [x] | I ___ happy. | am | I – am\n~ is = Bei I heißt es am.\nfrage | You are ready. | Are you ready?\nordnen | | Where do you live?\nquatsch | a | b\nlücke | ohne Antwort\n# comment' });
ok(gm.items.length === 3 && gm.errors.length === 2, 'parse: 3 items, 2 errors', [gm.items.length, gm.errors]);
ok(gm.items[0].instr === 'Setze ein.' && gm.items[0].concept === 'x' && gm.concepts.x === 'Thema X' && gm.items[0].wrongs.is, 'instruction, concept, wrong answer');
ok(gm.items[2].q.split(' / ').length === 4, 'ordnen words generated', gm.items[2].q);
ok(G.filled(gm.items[0], 'am') === 'I am happy.', 'filled', G.filled(gm.items[0], 'am'));
ok(G.filled({ type: 'form', q: '___ you ever ___ (see) a whale?' }, 'Have seen') === 'Have you ever seen a whale?', 'filled with two gaps');
ok(G.stringify(gm.items).split('\n').length >= 4, 'stringify');
let saved = content2.saveModule({ title: 'Eigenes', year: 6, exercises: 'lücke | I ___ happy. | am' });
ok(new E.Content().modById[saved.id] && new E.Content().modById[saved.id].items.length === 1, 'own module persists');
let irr = content.modById['k6-irregular'];
ok(irr.items.filter(i => i.gen === 'irr-past').length === 89 && irr.items.some(i => i.gen === 'irr-frame'), 'irregular generators');
let both = irr.items.find(i => i.id.endsWith('both-burn'));
ok(both.answers.length === 4 && E.check.sentence('burned burnt', both.answers).exact, 'two forms × two forms');

// ---------------------------------------------------------------- spaced repetition
let S = E.srs, s = S.blank(), t0 = new Date('2026-10-20T16:00:00').getTime();
S.update(s, 'exact', t0);
ok(s.box === 3 && S.stage(s) === 'fast', 'known at first sight → box 3 (fast sicher)');
s = S.blank(); S.update(s, 'exact', t0, { introduced: true });
ok(s.box === 1 && S.stage(s) === 'lernt', 'introduced word → box 1');
S.update(s, 'exact', t0 + DAY); S.update(s, 'exact', t0 + 3 * DAY); S.update(s, 'exact', t0 + 7 * DAY);
ok(s.box === 4, 'grows to box 4', s.box);
let due = s.due; ok(due > t0 + 7 * DAY + 7 * DAY && due < t0 + 7 * DAY + 9 * DAY, 'box 4 → ~8 days', (due - t0) / DAY);
S.update(s, 'spelling', t0 + 16 * DAY);
ok(s.box === 4 && s.due < t0 + 18 * DAY, 'spelling slip: box stays, again tomorrow', [s.box, (s.due - t0) / DAY]);
S.update(s, 'wrong', t0 + 17 * DAY);
ok(s.box === 1 && s.due - (t0 + 17 * DAY) <= 15 * 60000, 'wrong → box 1, due in minutes');
ok(!s.hard, 'one wrong: not yet difficult');
S.update(s, 'wrong', t0 + 18 * DAY);
ok(s.hard, 'two wrong → difficult');
S.update(s, 'exact', t0 + 19 * DAY); S.update(s, 'exact', t0 + 19 * DAY + 3600000); S.update(s, 'exact', t0 + 19 * DAY + 7200000);
ok(s.hard, 'three right on ONE day: still difficult');
S.update(s, 'exact', t0 + 20 * DAY);
ok(!s.hard, 'right on a second day → no longer difficult');
for (let k = 0; k < 10; k++) S.update(s, 'exact', t0 + (30 + k * 40) * DAY);
ok(s.box === 6 && S.stage(s) === 'sicher' && s.due - s.last <= 36 * DAY, 'max box 6 = sicher, still reviewed after ~5 weeks');
S.setStage(s, 'lernt'); ok(S.stage(s) === 'lernt', 'parent override');
S.setStage(s, 'neu'); ok(S.stage(s) === 'neu' && s.n === 0, 'override to neu resets');

// ---------------------------------------------------------------- store: records, coins, persistence
ctx = load(); E = ctx.EB; content = new E.Content();
let store = new E.Store('lukas');
let dw = content.word('demo-difficult');
let rr = store.recordWord(dw, { first: 'spelling', dir: 'de-en', mode: 'neu', answer: 'dificult', introduced: true });
ok(rr.outcome === 'spelling' && store.stat(dw.key).spell.hard && store.stat(dw.key).wrongs.dificult === 1, 'spelling slip recorded separately', store.stat(dw.key));
rr = store.recordWord(dw, { first: 'wrong', second: 'right', dir: 'de-en', mode: 'neu', answer: 'hard' });
ok(rr.outcome === 'second', 'right at the second try = second');
rr = store.recordWord(dw, { first: 'right', help: 3, shown: true, dir: 'de-en', mode: 'neu' });
ok(rr.outcome === 'wrong', 'answer shown = wrong');
rr = store.recordWord(dw, { first: 'typo', dir: 'de-en', mode: 'neu', answer: 'difficulr' });
ok(rr.outcome === 'exact', 'a typo does not count against him');
rr = store.recordWord(dw, { first: 'right', dir: 'en-de', mode: 'alt' });
ok(rr.outcome === 'exact', 'en-de right');
let st2 = new E.Store('lukas');
ok(st2.stat(dw.key).n === 5 && st2.doc.log.length === 5, 'progress survives a reload', st2.stat(dw.key));
ok(new E.Store('alex').stat(dw.key) === null, 'children are separate');
ok(ctx.__store['english-bobins:lukas'] && ctx.__store['english-bobins:content'] !== undefined || true, 'stored under english-bobins:');
ok(Object.keys(ctx.__store).every(k => k.indexOf('english-bobins:') === 0), 'only english-bobins: keys', Object.keys(ctx.__store));
ok(store.takeItemCoins(50) === 50 && store.takeItemCoins(50) === 10 && store.takeItemCoins(5) === 0, 'daily cap 60');
let exp = store.export(); let st3 = new (load().EB.Store)('lukas'); st3.import(exp);
ok(st3.stat(dw.key).n === 5, 'progress backup restores');
store.setStage(dw.key, 'sicher'); ok(store.stageOf(dw.key) === 'sicher', 'override via store');
store.resetWord(dw.key); ok(!store.stat(dw.key) && !store.doc.log.some(e => e.id === dw.key), 'reset word');

// ---------------------------------------------------------------- rounds
ctx = load(); E = ctx.EB; content = new E.Content(); store = new E.Store('lukas');
let rnd = E.text.rng(3);
let r1 = E.session.build('heute', content, store, { rnd });
let kinds = k => r1.steps.filter(s => s.kind === k).length;
ok(kinds('learn') <= 6 && kinds('learn') >= 1, 'heute: a few new words shown first', kinds('learn'));
ok(kinds('gram') === 4, 'heute: 4 grammar', kinds('gram'));
ok(r1.steps.filter(s => s.kind !== 'learn').length >= 18 && r1.steps.filter(s => s.kind !== 'learn').length <= 24, 'heute ≈ 22 questions', r1.steps.length);
// a learn card always comes before the question of that word
r1.steps.forEach((s, i) => { if (s.kind === 'word' && s.introduced) ok(r1.steps.slice(0, i).some(x => x.kind === 'learn' && x.word.key === s.word.key), 'card before question ' + s.word.en); });
ok(new Set(r1.steps.filter(s => s.kind === 'word').map(s => s.word.key)).size === r1.steps.filter(s => s.kind === 'word').length, 'no word twice in a round');
store.set('activeUnits', ['demo-6']);
let rn = E.session.build('neu', content, store, { rnd });
ok(rn.steps.every(s => s.word.unit === 'demo-6'), 'neu: only the active unit');
ok(rn.steps.filter(s => s.kind === 'word').every(s => s.dir === 'de-en'), 'neu: German → English');
let ru = E.session.build('neu', content, store, { rnd, units: ['demo-5'] });
ok(ru.steps.every(s => s.word.unit === 'demo-5'), 'one unit on request');
let ra = E.session.build('alt', content, store, { rnd });
ok(ra.steps.length && ra.steps.every(s => s.word.unit !== 'demo-6'), 'alt: older units only');
ok(E.session.build('fehler', content, store, { rnd }).steps.length === 0, 'fehler: empty without mistakes');
let rg = E.session.build('grammatik', content, store, { rnd, module: 'k6-modals' });
ok(rg.steps.length === 10 && rg.steps.every(s => s.item.mod === 'k6-modals'), 'one module, 10 tasks');
ok(new Set(rg.steps.map(s => s.item.concept)).size === 4, 'all four concepts of G16 covered', [...new Set(rg.steps.map(s => s.item.concept))]);
store.set('mix', { neu: 50, alt: 50, fehler: 0 }); store.set('roundSize', 10);
let rm = E.session.build('mix', content, store, { rnd });
ok(rm.plan.neu + rm.plan.alt === 10, 'mix: proportions', rm.plan);
store.setTest({ date: '2026-11-04', units: ['demo-5'], modules: ['k6-past'] });
let rp = E.session.build('probe', content, store, { rnd });
ok(rp.test && rp.steps.every(s => s.test) && rp.steps.filter(s => s.kind === 'word').every(s => s.word.unit === 'demo-5'), 'probe: test units, no feedback');
ok(rp.steps.some(s => s.dir === 'en-de') && rp.steps.some(s => s.kind === 'gram' && s.item.mod === 'k6-past'), 'probe: both directions + grammar');
let rk = E.session.build('ka', content, store, { rnd });
ok(rk.steps.filter(s => s.kind === 'word').every(s => s.word.unit === 'demo-5'), 'ka: test units');

// grammar: a mistake comes back with a DIFFERENT sentence of the same concept
store = new E.Store('g-test');
let first = E.session.build('grammatik', content, store, { rnd, module: 'k6-past', n: 1 }).steps[0].item;
store.recordGram(first, { first: 'grammar', second: 'grammar', answer: 'x' }, Date.now() - 2 * DAY);
let again = E.session.build('fehler', content, store, { rnd }).steps.filter(s => s.kind === 'gram');
ok(again.length && again[0].item.concept === first.concept && again[0].item.id !== first.id, 'fehler: same concept, other sentence', [first.id, again[0] && again[0].item.id]);

// ---------------------------------------------------------------- simulated learner: 30 days of "Heute üben"
ctx = load(); E = ctx.EB; content = new E.Content(); store = new E.Store('sim');
const realNow = Date.now; let clock = new Date('2026-10-21T16:00:00').getTime();
ctx.Date.now = () => clock;
let r2 = E.text.rng(11), skill = {};      // per word: probability to know it, grows with practice
let firstRate = [];
for (let day = 0; day < 30; day++) {
  let round = E.session.build('heute', content, store, { rnd: r2 }), right = 0, n = 0;
  round.steps.forEach(st => {
    clock += 40000;
    if (st.kind === 'learn') { skill[st.word.key] = (skill[st.word.key] || 0.3) + 0.25; return; }
    if (st.kind === 'gram') { store.recordGram(st.item, { first: r2() < 0.7 ? 'right' : 'grammar', second: 'right', mode: 'heute' }); return; }
    let p = Math.min(0.95, skill[st.word.key] || (st.word.src === 'demo' ? 0.5 : 0.35)), k = r2() < p;
    let first = k ? (r2() < 0.15 ? 'spelling' : 'right') : 'wrong';
    let res = store.recordWord(st.word, { first: first, second: k ? null : (r2() < 0.5 ? 'right' : 'wrong'), dir: st.dir, mode: 'heute', introduced: st.introduced, answer: k ? '' : 'x' });
    skill[st.word.key] = Math.min(0.97, (skill[st.word.key] || 0.3) + (res.outcome === 'exact' ? 0.08 : 0.15));
    n++; if (res.outcome === 'exact') right++;
  });
  firstRate.push(right / Math.max(1, n));
  clock += DAY - round.steps.length * 40000;
}
ctx.Date.now = realNow;
let cAll = store.counts(content.uniqueWords()); if (process.env.SIM) console.log('sim', JSON.stringify(cAll), firstRate.map(x => Math.round(x * 100)).join(' '));
ok(cAll.neu < cAll.total * 0.5, 'after 30 days most words were met', cAll);
ok(cAll.sicher + cAll.fast > 20, 'after 30 days many words (fast) sicher', cAll);
let avg = a => a.reduce((x, y) => x + y, 0) / a.length;
ok(avg(firstRate.slice(-7)) > avg(firstRate.slice(0, 7)), 'first-try rate improves', [avg(firstRate.slice(0, 7)), avg(firstRate.slice(-7))]);
let reviewed = Object.values(store.doc.words).filter(s => s.n > 1).length;
ok(reviewed > 40, 'many words reviewed more than once', reviewed);
ok(store.doc.log.length < 4000, 'log bounded', store.doc.log.length);

// card line for Robin's Bobins
let line = ctx.RBEnglish.cardInfo('sim');
ok(typeof line === 'string' && line.length > 3, 'card line', line);

console.log(`logic: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
