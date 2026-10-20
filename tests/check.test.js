// node tests/check.test.js — the answer checker: verdicts and the German hints.
const E = require('./load.js')().EB, C = E.check;
let pass = 0, fail = 0;
function ok(cond, msg, info) { if (cond) pass++; else { fail++; console.log('FAIL', msg, info !== undefined ? JSON.stringify(info) : ''); } }

const pool = [
  { en: 'difficult', de: 'schwierig' }, { en: 'dangerous', de: 'gefährlich' }, { en: 'friend', de: 'Freund' }, { en: 'knife', de: 'Messer' },
  { en: 'holiday', de: 'Ferien; Urlaub' }, { en: 'Monday', de: 'Montag' }, { en: '(to) go', de: 'gehen' }, { en: 'big', de: 'groß' },
  { en: 'large', de: 'groß' }, { en: '(to) look after sb.', de: 'auf jdn. aufpassen' }, { en: 'colour', de: 'Farbe' }, { en: 'an apple', de: 'ein Apfel' },
  { en: 'T-shirt', de: 'T-Shirt' }, { en: 'beautiful', de: 'schön' }, { en: 'shop', de: 'Geschäft' }, { en: "I'm sorry.", de: 'Es tut mir leid.' },
  { en: '(to) climb', de: 'klettern' }, { en: '(to) write', de: 'schreiben' }, { en: 'necessary', de: 'notwendig' }, { en: 'island', de: 'Insel' },
  { en: 'cat', de: 'Katze' }, { en: 'car', de: 'Auto' }, { en: 'ice cream', de: 'Eis' }, { en: 'football', de: 'Fußball' }, { en: '(to) favourite', de: 'Lieblings-' },
  { en: 'centre', de: 'Zentrum' }, { en: 'child', de: 'Kind' }, { en: '(to) deal (with)', de: 'sich befassen (mit)' }, { en: 'mum', de: 'Mama' },
  { en: 'the UK', de: 'das Vereinigte Königreich' }, { en: 'English', de: 'Englisch' }
];
const it = en => pool.find(p => p.en === en);
function word(input, en, verdict, hintPart) {
  const r = C.word(input, it(en), { pool });
  ok(r.verdict === verdict, `word("${input}" → ${en}) = ${verdict}`, r.verdict + ' ' + r.hints.concat(r.notes).join(' / '));
  if (hintPart) ok(r.hints.concat(r.notes).join(' ').indexOf(hintPart) >= 0, `hint for "${input}" contains "${hintPart}"`, r.hints.concat(r.notes));
  return r;
}

// right, incl. optional parts, placeholders, articles, case, short forms
word('difficult', 'difficult', 'right');
word('  Difficult ', 'difficult', 'caps', 'klein');                // counts as right, with a note
word('go', '(to) go', 'right'); word('to go', '(to) go', 'right');
word('look after', '(to) look after sb.', 'right'); word('to look after somebody', '(to) look after sb.', 'right'); word('look after someone', '(to) look after sb.', 'right');
word('a holiday', 'holiday', 'right'); word('apple', 'an apple', 'right'); word('an apple', 'an apple', 'right');
word('I am sorry', "I'm sorry.", 'right'); word("I'm sorry", "I'm sorry.", 'right'); word('I’m sorry.', "I'm sorry.", 'right');
word('deal with', '(to) deal (with)', 'right'); word('deal', '(to) deal (with)', 'right');
word('the UK', 'the UK', 'right');
// capital letters
word('monday', 'Monday', 'caps', 'groß'); word('english', 'English', 'caps', 'groß'); word('Holiday', 'holiday', 'caps', 'klein');
word('i\'m sorry', "I'm sorry.", 'caps', 'immer groß');
// American spelling
word('color', 'colour', 'right', 'britisch'); word('center', 'centre', 'right', 'britisch'); word('mom', 'mum', 'right', 'britisch');
// synonyms and other words of the list
word('large', 'big', 'synonym'); word('big', 'large', 'synonym');
let r = word('dangerous', 'difficult', 'wrongword', 'anderes Wort'); ok(r.hints[0].indexOf('gefährlich') >= 0, 'wrongword names the meaning');
ok(r.hints.join(' ').indexOf('difficult') < 0, 'wrongword does not reveal the answer');
word('car', 'cat', 'wrongword');
// word forms
word('went', '(to) go', 'form', 'Vergangenheit'); word('gone', '(to) go', 'form', '3. Form'); word('shops', 'shop', 'form', 'Mehrzahl');
word('a apple', 'an apple', 'form', 'an'); word('writing', '(to) write', 'form', '-ing');
// spelling, with the hint the brief asks for
word('dificult', 'difficult', 'spelling', 'doppelte «f»');
word('freind', 'friend', 'spelling', 'Reihenfolge');
word('nife', 'knife', 'spelling', 'k am Anfang');
word('rite', '(to) write', 'spelling', 'w am Anfang');
word('clim', '(to) climb', 'spelling', 'b am Ende');
word('necesary', 'necessary', 'spelling', 'doppelte «s»');
word('neccessary', 'necessary', 'spelling', 'nur ein «c»');
word('beutiful', 'beautiful', 'spelling', '«a»');
word('schop', 'shop', 'spelling', 'sh');
word('t shirt', 'T-shirt', 'spelling', 'Bindestrich'); word('icecream', 'ice cream', 'spelling', 'getrennt'); word('foot ball', 'football', 'spelling', 'zusammen');
word('im sorry', "I'm sorry.", 'spelling', 'Apostroph');
word('iland', 'island', 'spelling');
word('holyday', 'holiday', 'spelling', '«i»');
// a slipped key
word('difficulr', 'difficult', 'typo', 'Vertippt');
word('frienf', 'friend', 'typo');
// wrong / empty
word('xyz', 'big', 'wrong'); word('', 'big', 'empty'); word('   ', 'big', 'empty');
word('elephant', 'difficult', 'wrong');
word('kat', 'cat', 'spelling');
word('cut', 'cat', 'spelling');                      // short word, one vowel off: spelling, the screen shows the right word
// what the screen does with verdicts
ok(C.KNOWN.spelling && C.KNOWN.typo && C.KNOWN.form && !C.KNOWN.wrong && !C.KNOWN.wrongword, 'KNOWN set');
ok(C.EXACT.right && C.EXACT.caps && C.EXACT.synonym && !C.EXACT.spelling, 'EXACT set');

// diff: missing f marked in the target, a gap in the input
r = C.word('dificult', it('difficult'), { pool });
ok(r.diff && r.diff.target.some(s => s.k === 'fix' && s.s === 'f'), 'diff marks the missing f', r.diff);
ok(r.diff && r.diff.input.some(s => s.k === 'gap'), 'diff shows a gap in the input', r.diff);

// German (English → German)
const g = (input, en, v) => { const x = C.german(input, it(en)); ok(x.verdict === v, `german("${input}" for ${en}) = ${v}`, x); };
g('schwierig', 'difficult', 'right'); g('Ferien', 'holiday', 'right'); g('urlaub', 'holiday', 'right'); g('der Urlaub', 'holiday', 'right');
g('Fussball', 'football', 'right'); g('Freundd', 'friend', 'right'); g('Hund', 'friend', 'wrong'); g('', 'friend', 'empty');
g('sich befassen', '(to) deal (with)', 'right'); g('befassen mit', '(to) deal (with)', 'right');

// sentences / grammar
function sent(input, answers, verdict, hintPart, opts) {
  const x = C.sentence(input, [].concat(answers), opts);
  ok(x.verdict === verdict, `sentence("${input}") = ${verdict}`, x.verdict + ' | ' + x.hints.concat(x.notes).join(' / '));
  if (hintPart) ok(x.hints.concat(x.notes).join(' ').indexOf(hintPart) >= 0, `sentence hint for "${input}" contains "${hintPart}"`, x.hints.concat(x.notes));
  return x;
}
sent('went', 'went', 'right'); sent('Went', 'went', 'right');
sent('goed', 'went', 'grammar', 'Die Vergangenheitsform lautet «went»');
sent('buyed', 'bought', 'grammar', 'unregelmäßig');
sent('wnet', 'went', 'spelling');
sent("I don't like fish.", "I don't like fish.", 'right'); sent('I do not like fish', "I don't like fish.", 'right');
sent("She's got a dog.", 'She has got a dog.', 'right'); sent("He isn't at home.", 'He is not at home.', 'right'); sent("He's not at home.", "He isn't at home.", 'right');
sent('i can not swim', "I can't swim.", 'caps', 'groß'); sent('I cannot swim.', "I can't swim.", 'right');
sent('Do you like pizza', 'Do you like pizza?', 'caps', 'Fragezeichen');
sent('you do like pizza?', 'Do you like pizza?', 'order', 'Reihenfolge');
sent('Yesterday Tom goed to school.', 'Yesterday Tom went to school.', 'grammar', 'went');
sent('He play football.', 'He plays football.', 'grammar', 's');
sent("She doesn't plays tennis.", "She doesn't play tennis.", 'grammar', 'ohne s');
sent('They is happy.', 'They are happy.', 'grammar', '«they»');
sent("I didn't went home.", "I didn't go home.", 'grammar', 'Grundform');
sent('Did you went to the cinema?', 'Did you go to the cinema?', 'grammar', 'Grundform');
sent('He is more bigger than me.', 'He is bigger than me.', 'grammar', 'nicht beides');
sent('She is gooder than him.', 'She is better than him.', 'grammar', 'good');
sent('Tom is older then Jack.', 'Tom is older than Jack.', 'grammar', 'than');
sent('She swiming.', 'She is swimming.', 'grammar', 'is');
sent('I have went to the shop.', 'I have gone to the shop.', 'grammar', '3. Form');
sent('He musted go home.', 'He had to go home.', 'grammar', 'Ersatzform');
sent('Were you allowed use the map?', 'Were you allowed to use the map?', 'grammar', 'to');
sent('He can to swim.', 'He can swim.', 'grammar', 'kein «to»');
sent('He have to clean the kitchen.', 'He has to clean the kitchen.', 'grammar', 'has');
sent('Does she likes music?', 'Does she like music?', 'grammar', 'ohne s');
sent('Can you give I the ball?', 'Can you give me the ball?', 'grammar', 'me');
sent('My dog is very nice.', 'My dog is bigger than your dog.', 'wrong');
sent('', 'went', 'empty');
sent('Wee were tired.', 'We were tired.', 'spelling');
sent('goed', 'went', 'grammar', 'EXTRA', { wrongs: { goed: 'EXTRA: eigene Erklärung' } });
sent('went gone', ['went gone'], 'right'); sent('went – gone', ['went gone'], 'right'); sent('went, gone', ['went gone'], 'right');

// syllables and help masks
ok(C.syllables('difficult') === 'dif-fi-cult', 'syllables difficult', C.syllables('difficult'));
ok(C.syllables('beautiful') === 'beau-ti-ful', 'syllables beautiful', C.syllables('beautiful'));
ok(C.syllables('holiday') === 'ho-li-day', 'syllables holiday', C.syllables('holiday'));
ok(C.helpMask('difficult', 1) === 'd _ _ _ _ _ _ _ _', 'mask 1', C.helpMask('difficult', 1));
ok(C.helpMask('difficult', 2) === 'd _ f _ i _ u _ t', 'mask 2', C.helpMask('difficult', 2));
ok(/^i _ _ _ _ _ _ _ _ _ _   ?/.test(C.helpMask("ice cream", 1)) || C.helpMask('ice cream', 1).indexOf('i _ _') === 0, 'mask keeps the space', C.helpMask('ice cream', 1));

// every built-in exercise accepts its own answers (and their short/long forms), never its task text (fix / ordnen excepted)
const content = new E.Content({ getItem: () => null, setItem: () => {} });
let nEx = 0;
content.grammar.forEach(m => {
  ok(!m.errors.length, 'module ' + m.id + ' parses', m.errors);
  m.items.forEach(x => {
    nEx++;
    x.answers.forEach(a => { const v = C.sentence(a, x.answers); ok(v.verdict === 'right', 'own answer right: ' + x.id + ' "' + a + '"', v.verdict); });
    if (x.type === 'fix') { const v = C.sentence(x.q, x.answers); ok(!v.exact, 'fix task itself is not right: ' + x.id, x.q); }
    if (x.type === 'ordnen') { const words = x.q.split(/\s*\/\s*/); ok(words.length >= 3, 'ordnen has words: ' + x.id); const v = C.sentence(words.join(' '), x.answers); ok(!v.exact || words.join(' ') === x.answers[0].replace(/[.?!]$/, ''), 'ordnen shuffled: ' + x.id); }
  });
});
ok(nEx > 500, 'many exercises (' + nEx + ')');
// every vocabulary word accepts its own answer; English→German accepts its German
content.words.forEach(w => {
  const v = C.word(C.display(w.en), w, { pool: content.words });
  ok(v.verdict === 'right', 'word right: ' + w.en, v.verdict);
  const gde = C.german(C.firstGerman(w.de), w); ok(gde.verdict === 'right', 'german right: ' + w.de, gde.verdict);
});

console.log(`check: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
