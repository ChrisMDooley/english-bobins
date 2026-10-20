"""
English-Bobins in a real browser (headless Chromium): start page, a whole "Heute üben" round (new-word
cards, right / spelling / wrong answers, help, copying, grammar), persistence after reload, all modes,
Probe-Klassenarbeit with correction, parent area (gate, paste + CSV import, editing, units, grammar editor,
Klassenarbeit, settings, backup download), phone layout; with --with-platform also the launch from
Robin's Bobins (coins on the family balance, activity, card line).

  python3 tests/e2e.py <shots-dir> [--with-platform ../robins-bobins]
"""
import http.server, threading, functools, os, sys, json, re
from playwright.sync_api import sync_playwright

args = [a for a in sys.argv[1:] if not a.startswith('--')]
OUT = args[0] if args else os.path.join(os.path.dirname(os.path.abspath(__file__)), 'shots')
os.makedirs(OUT, exist_ok=True)
APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
platform = '--with-platform' in sys.argv
ROOT = os.path.dirname(APP)

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=ROOT))
threading.Thread(target=srv.serve_forever, daemon=True).start()
PORT = srv.server_address[1]
BASE = 'http://127.0.0.1:%d/' % PORT
URL = BASE + os.path.basename(APP) + '/index.html'
UNLOCK = "try { localStorage.setItem('rb:gate', 'c623d5d8fdd2353ef1861b66169370d4a168aeb62f94cf63e08da88cddb06639'); } catch (e) {}"
MOCK_SPEECH = """
  window.__spoken = [];
  (function () {
    var fake = { getVoices: function () { return [{ name: 'Daniel', lang: 'en-GB', localService: true }, { name: 'Anna', lang: 'de-DE', localService: true }]; },
      speak: function (u) { window.__spoken.push(u.text); setTimeout(function () { u.onend && u.onend(); }, 5); }, cancel: function () {}, speaking: false, addEventListener: function () {} };
    Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true });
    window.SpeechSynthesisUtterance = function (t) { this.text = t; };
  })();
"""
passed, failed = 0, 0
def check(cond, msg, info=''):
    global passed, failed
    if cond: passed += 1
    else: failed += 1; print('  FAIL', msg, ' → ', str(info)[:300])

def step(pg):
    return pg.evaluate("""() => { const s = window.__ebStep, t = window.__ebTest && window.__ebTest();
      if (!s) return null;
      return { kind: s.kind, dir: s.dir || null, test: !!s.test, en: s.word ? s.word.en : null, de: s.word ? s.word.de : null, wid: s.word ? s.word.id : null,
               answer: t ? t.answer : null, phase: t ? t.phase : null, answers: s.item ? s.item.answers : null, type: s.item ? s.item.type : null, item: s.item ? s.item.id : null }; }""")
def in_round(pg): return pg.locator('.run-body').count() > 0 and pg.locator('.run-body .card').count() > 0
def wrong_for(s):
    return 'qqq' if s['kind'] == 'word' else 'zzz qqq'
def answer(pg, text):
    pg.fill('.run-body .answer-in:not([disabled])', text)
    pg.press('.run-body .answer-in:not([disabled])', 'Enter')
    pg.wait_for_timeout(40)
def finish_step(pg):
    """after feedback: copy if asked, then continue"""
    for _ in range(4):
        s = step(pg)
        if pg.locator('.run-body .next').count(): pg.click('.run-body .next'); pg.wait_for_timeout(40); return
        if s and s.get('phase') == 'copy':
            answer(pg, right_text(s)); continue
        break
def right_text(s):
    if s['kind'] == 'gram': return s['answers'][0]
    return s['answer']
def play(pg, how='right', limit=80):
    """play the current round to its end; how: right | wrong-first | mixed"""
    n = 0
    while in_round(pg) and n < limit:
        s = step(pg)
        if not s: break
        n += 1
        if s['kind'] == 'learn':
            pg.click('.run-body form .btn.primary'); pg.wait_for_timeout(30); continue
        if s.get('test'):
            answer(pg, right_text(s) if n % 3 else 'qqq'); continue
        mode = how if how != 'mixed' else ['right', 'wrong-first', 'wrong-twice'][n % 3]
        if mode == 'wrong-first':
            answer(pg, wrong_for(s)); answer(pg, right_text(s))
        elif mode == 'wrong-twice':
            answer(pg, wrong_for(s)); answer(pg, wrong_for(s))
        else:
            answer(pg, right_text(s))
        finish_step(pg)
    return n

with sync_playwright() as p:
    br = p.chromium.launch()
    ctx = br.new_context(viewport={'width': 1100, 'height': 900}, accept_downloads=True)
    ctx.add_init_script(UNLOCK); ctx.add_init_script(MOCK_SPEECH)
    pg = ctx.new_page()
    errors = []
    pg.on('pageerror', lambda e: (errors.append('pageerror: ' + str(e)), print('  PAGEERROR', e)))
    pg.on('console', lambda m: m.type == 'error' and errors.append('console: ' + m.text))
    pg.on('response', lambda r: r.status >= 400 and errors.append('HTTP %d %s' % (r.status, r.url)))

    # ------------------------------------------------------------ start page
    pg.goto(URL + '?child=lukas'); pg.wait_for_selector('.today-btn')
    check(pg.locator('.tile').count() == 7, '7 tiles on the start page', pg.locator('.tile').count())
    for t in ['Neue Vokabeln üben', 'Alte Vokabeln wiederholen', 'Meine Fehler üben', 'Grammatik üben', 'Gemischtes Training', 'Klassenarbeit vorbereiten', 'Mein Lernfortschritt']:
        check(pg.locator('.tile-title', has_text=t).count() == 1, 'tile ' + t)
    check('Lukas' in pg.inner_text('.hero h1'), 'greets Lukas')
    pg.screenshot(path=os.path.join(OUT, '01-home.png'), full_page=True)

    # ------------------------------------------------------------ the brief's example: schwierig → dificult
    pg.evaluate("() => { const st = EB.app.store; st.set('activeUnits', ['demo-6']); }")
    pg.click('.tile:has-text("Neue Vokabeln")'); pg.wait_for_selector('.run-body .card')
    seen_learn = False
    for _ in range(40):
        s = step(pg)
        if s['kind'] == 'learn':
            seen_learn = True
            if s['wid'] == 'demo-difficult': pg.screenshot(path=os.path.join(OUT, '02-learn-card.png'))
            pg.click('.run-body form .btn.primary'); pg.wait_for_timeout(30); continue
        if s['wid'] == 'demo-difficult': break
        answer(pg, right_text(s)); finish_step(pg)
    check(seen_learn, 'new words are shown first')
    s = step(pg)
    check(s and s['wid'] == 'demo-difficult', 'reached schwierig', s)
    check('schwierig' in pg.inner_text('.run-body .prompt'), 'German prompt shown')
    check(pg.locator('.run-body .fb-box').count() == 0, 'no answer shown before the first try')
    answer(pg, 'dificult')
    fb = pg.inner_text('.run-body .feedback')
    check('Fast richtig' in fb and 'doppelte' in fb and 'f' in fb, 'Fast richtig + doppelte f', fb)
    check(pg.locator('.run-body .d-fix').count() >= 1 and pg.locator('.run-body .d-gap').count() >= 1, 'coloured comparison')
    check(step(pg)['phase'] == 'copy', 'must write it once correctly')
    pg.screenshot(path=os.path.join(OUT, '03-fast-richtig.png'))
    answer(pg, 'dificult')
    check('genau' in pg.inner_text('.run-body .tip').lower(), 'wrong copy → look again', pg.inner_text('.run-body .tip'))
    answer(pg, 'difficult')
    check(pg.locator('.run-body .next').count() == 1, 'after the correct copy: Weiter')
    pg.click('.run-body .next')

    # wrong → tip (first letter) → wrong again → answer + copy; the word comes back later
    s = step(pg)
    while s['kind'] == 'learn': pg.click('.run-body form .btn.primary'); s = step(pg)
    target = s['answer']; wid = s['wid']
    answer(pg, 'qqq')
    fb = pg.inner_text('.run-body .feedback'); tip = pg.inner_text('.run-body .tip')
    check('Noch nicht' in fb and target not in fb, 'Noch nicht – answer not revealed', fb)
    check('_' in tip, 'first-letter tip after a wrong try', tip)
    answer(pg, 'qqq')
    fb = pg.inner_text('.run-body .feedback')
    check(target.replace('to ', '') in fb, 'second wrong → answer shown', fb)
    pg.screenshot(path=os.path.join(OUT, '04-reveal.png'))
    answer(pg, target); finish_step(pg)
    later = []
    for _ in range(12):
        s = step(pg)
        if not s or not in_round(pg): break
        later.append(s.get('wid'))
        if s['kind'] == 'learn': pg.click('.run-body form .btn.primary'); continue
        answer(pg, right_text(s)); finish_step(pg)
    check(wid in later, 'unknown word comes back in the same round', later)
    play(pg, 'right')
    check(pg.locator('.summary').count() == 1, 'end screen')
    sm = pg.inner_text('.summary')
    check('Aufgaben' in sm and 'sofort richtig' in sm and 'Vorschlag' in sm, 'summary: numbers + suggestion', sm[:300])
    check('Das üben wir noch einmal' in sm, 'summary lists what to practise', sm[:400])
    pg.screenshot(path=os.path.join(OUT, '05-summary.png'), full_page=True)

    # ------------------------------------------------------------ help button
    pg.goto(URL + '?child=lukas#/home'); pg.wait_for_selector('.today-btn')
    pg.click('.tile:has-text("Alte Vokabeln")'); pg.wait_for_selector('.run-body .card')
    s = step(pg)
    if s['dir'] != 'en-de':
        pg.click('.run-body .tools .btn:has-text("Hilfe")')
        check('_' in pg.inner_text('.run-body .tip'), 'Hilfe 1: mask')
        pg.click('.run-body .tools .btn:has-text("Hilfe")')
        pg.click('.run-body .tools .btn:has-text("Lösung")')
        check(step(pg)['phase'] == 'copy', 'Hilfe 3: answer shown, copy')
        answer(pg, right_text(step(pg))); finish_step(pg)
    play(pg, 'mixed')
    check(pg.locator('.summary').count() == 1, 'alt round finished')

    # ------------------------------------------------------------ Heute üben (incl. grammar) and persistence
    pg.goto(URL + '?child=lukas#/home'); pg.wait_for_selector('.today-btn')
    pg.click('.today-btn'); pg.wait_for_selector('.run-body .card')
    gram_seen, goed = 0, False
    n = 0
    while in_round(pg) and n < 60:
        s = step(pg); n += 1
        if s['kind'] == 'learn': pg.click('.run-body form .btn.primary'); continue
        if s['kind'] == 'gram':
            gram_seen += 1
            if gram_seen == 1:
                pg.screenshot(path=os.path.join(OUT, '06-grammar.png'))
                answer(pg, 'zzz qqq')
                check(pg.locator('.run-body .fb-box.no').count() == 1, 'grammar: first wrong → Noch nicht')
                answer(pg, 'zzz qqq')
                check(pg.locator('.run-body .fb-box.show').count() == 1, 'grammar: second wrong → solution')
                finish_step(pg); continue
        answer(pg, right_text(s)); finish_step(pg)
    check(gram_seen >= 3, 'Heute üben includes grammar', gram_seen)
    pg.wait_for_selector('.summary')
    pg.reload(); pg.wait_for_selector('.today-btn')
    stored = pg.evaluate("() => { const d = JSON.parse(localStorage.getItem('english-bobins:lukas')); return { words: Object.keys(d.words).length, log: d.log.length, rounds: d.rounds.length, gram: Object.keys(d.gram).length }; }")
    check(stored['words'] >= 10 and stored['rounds'] >= 3 and stored['gram'] >= 1, 'progress stored', stored)
    pg.goto(URL + '?child=lukas#/fortschritt'); pg.wait_for_selector('.week')
    txt = pg.inner_text('main')
    check('sicher' in txt and 'Diese Woche geübt' in txt and 'Wörter nach Units' in txt, 'progress page', txt[:200])
    pg.screenshot(path=os.path.join(OUT, '07-progress.png'), full_page=True)

    # grammar goed → explanation (direct exercise)
    pg.goto(URL + '?child=lukas#/grammatik'); pg.wait_for_selector('.tile.module')
    check(pg.locator('.tile.module').count() >= 12, 'grammar modules listed', pg.locator('.tile.module').count())
    pg.goto(URL + '?child=lukas#/grammatik/k6-modals'); pg.wait_for_selector('.module-page')
    check('be allowed to' in pg.inner_text('.module-page') and pg.locator('.mistakes p').count() >= 2, 'module page: rule + mistakes')
    pg.screenshot(path=os.path.join(OUT, '08-module.png'), full_page=True)
    pg.evaluate("""() => { const it = EB.app.content.modById['k6-past'].items.find(i => /goed|___ \\(go\\)/.test(i.q) || i.answers[0] === 'went');
      EB.practice.run(EB.app, { mode: 'grammatik', steps: [{ kind: 'gram', item: it }] }, { title: 'x' }); }""")
    pg.wait_for_selector('.run-body .card')
    answer(pg, 'goed')
    fb = pg.inner_text('.run-body .feedback')
    check('unregelmäßiges Verb' in fb and 'went' in fb, 'goed → irregular explanation', fb)
    answer(pg, 'went'); finish_step(pg)

    # ------------------------------------------------------------ Fehler mode now has words
    pg.goto(URL + '?child=lukas#/home'); pg.wait_for_selector('.today-btn')
    pg.click('.tile:has-text("Meine Fehler")'); pg.wait_for_timeout(200)
    check(pg.locator('.run-body .card').count() == 1, 'Meine Fehler has something to practise')
    play(pg, 'right')

    # ------------------------------------------------------------ parent area: gate
    pg.goto(URL + '?child=lukas#/eltern'); pg.wait_for_selector('.answer-in')
    q = pg.inner_text('main')
    m = re.search(r'(\d+) × (\d+)', q)
    if m:
        pg.fill('.answer-in', '1'); pg.press('.answer-in', 'Enter'); pg.wait_for_timeout(50)
        check(pg.locator('.ptabs').count() == 0, 'wrong answer keeps the parent area closed')
        pg.fill('.answer-in', str(int(m.group(1)) * int(m.group(2)))); pg.press('.answer-in', 'Enter')
    else:
        pg.fill('.answer-in', os.environ.get('RB_PARENT_PIN', '')); pg.press('.answer-in', 'Enter')
    pg.wait_for_selector('.ptabs')
    check(pg.locator('.ptab').count() == 8, '8 parent tabs')
    pg.screenshot(path=os.path.join(OUT, '09-parent-overview.png'), full_page=True)

    # units: a new unit, marked aktuell
    pg.click('.ptab:has-text("Units")'); pg.wait_for_selector('.ptable.units')
    pg.click('text=+ Neue Unit'); pg.wait_for_selector('.modal')
    pg.fill('.modal .field:has-text("Name") input', 'Unit 2'); pg.fill('.modal .field:has-text("Titel") input', 'A trip to Scotland')
    pg.click('.modal .btn.primary'); pg.wait_for_timeout(100)
    check(pg.locator('.ptable.units .pt-row', has_text='Unit 2').count() == 1, 'unit created')
    pg.locator('.ptable.units .pt-row', has_text='Unit 2').locator('input[type=checkbox]').check(); pg.wait_for_timeout(50)

    # paste import with preview
    pg.click('.ptab:has-text("Hinzufügen")'); pg.wait_for_selector('textarea.paste')
    unit_id = pg.evaluate("() => EB.app.content.units.find(u => u.name === 'Unit 2').id")
    pg.select_option('.row .field:has-text("Unit") select', unit_id)
    pg.fill('textarea.paste', 'bagpipes [ˈbæɡpaɪps] – Dudelsack\n(to) explore = erkunden\nloch\tSee (in Schottland)\tLoch Ness is a loch.\nweather – Wetter\nkilt')
    pg.click('button:has-text("Vorschau")'); pg.wait_for_selector('.preview-t')
    rows = pg.locator('.preview-t .pt-row:not(.head)')
    check(rows.count() == 5, 'preview shows 5 lines', rows.count())
    check('kennt er schon' in pg.inner_text('.preview-t') and 'Deutsch fehlt' in pg.inner_text('.preview-t'), 'preview: known word + missing German', pg.inner_text('.preview-t'))
    rows.nth(4).locator('input[aria-label=Deutsch]').fill('Schottenrock')
    rows.nth(4).locator('input[type=checkbox]').check()
    pg.screenshot(path=os.path.join(OUT, '10-import-preview.png'), full_page=True)
    pg.click('.preview button:has-text("Speichern")'); pg.wait_for_timeout(100)
    check('5 Wörter gespeichert' in pg.inner_text('.preview'), 'saved 5', pg.inner_text('.preview'))
    # CSV import through the file chooser
    csv_path = os.path.join(OUT, 'test-import.csv')
    with open(csv_path, 'w', encoding='utf-8') as f:
        f.write('englisch;deutsch;englisch_auch;deutsch_auch;beispiel;beispiel_deutsch;wortart;klasse;unit;seite;tags\n"castle";Burg;;Schloss;;;Nomen;6;Unit 2;12;\nghost;Geist;;Gespenst;"The castle has a ghost.";;Nomen;6;Unit 2;12;\n')
    with pg.expect_file_chooser() as fc:
        pg.click('button:has-text("CSV-Datei wählen")')
    fc.value.set_files(csv_path); pg.wait_for_selector('.preview-t >> nth=0')
    pg.locator('.preview').nth(1).locator('button:has-text("Speichern")').click(); pg.wait_for_timeout(100)
    check('2 Wörter gespeichert' in pg.locator('.preview').nth(1).inner_text(), 'csv import saved 2', pg.locator('.preview').nth(1).inner_text())
    with pg.expect_download() as dl:
        pg.click('button:has-text("Vorlage herunterladen")')
    check(open(dl.value.path(), encoding='utf-8-sig').read().startswith('englisch;deutsch'), 'csv template download')

    # words: search + edit + override, survives reload
    pg.click('.ptab:has-text("Vokabeln")'); pg.wait_for_selector('.ptable.words')
    pg.fill('.filters input', 'bagpipes'); pg.wait_for_timeout(80)
    check(pg.locator('.ptable.words .pt-row').count() == 1, 'search finds bagpipes')
    pg.click('.ptable.words .pt-row'); pg.wait_for_selector('.modal')
    pg.fill('.modal .field:has-text("Beispielsatz") input', 'He plays the bagpipes.')
    pg.click('.modal .btn.primary'); pg.wait_for_timeout(80)
    pg.reload(); pg.wait_for_selector('.answer-in, .ptabs')
    if pg.locator('.ptabs').count() == 0:
        q = pg.inner_text('main'); m = re.search(r'(\d+) × (\d+)', q)
        pg.fill('.answer-in', str(int(m.group(1)) * int(m.group(2))) if m else os.environ.get('RB_PARENT_PIN', '')); pg.press('.answer-in', 'Enter'); pg.wait_for_selector('.ptabs')
    ex = pg.evaluate("() => { const w = EB.app.content.words.find(w => w.en === 'bagpipes'); return w && w.example; }")
    check(ex == 'He plays the bagpipes.', 'edited word survives reload', ex)
    n_unit2 = pg.evaluate("() => EB.app.content.wordsIn([EB.app.content.units.find(u => u.name === 'Unit 2').id]).length")
    check(n_unit2 == 7, '7 words in Unit 2', n_unit2)

    # grammar editor: a new module with one error line
    pg.goto(URL + '?child=lukas#/eltern/grammatik'); pg.wait_for_selector('.ptable.mods')
    pg.click('text=+ Neues Grammatik-Modul'); pg.wait_for_selector('.modal textarea.mono')
    pg.fill('.modal .field:has-text("Titel") input', 'Going to-future')
    pg.fill('.modal textarea.mono', "form | Look at the clouds! It ___ (rain). | is going to rain\nfrage | You are going to visit Edinburgh. | Are you going to visit Edinburgh?\nquatsch | x | y")
    pg.wait_for_timeout(600)
    info = pg.inner_text('.modal .parse-info')
    check('2 Aufgaben' in info and 'Zeile 3' in info, 'editor shows count + error line', info)
    pg.click('.modal .btn.primary'); pg.wait_for_timeout(100)
    check(pg.locator('.ptable.mods .pt-row', has_text='Going to-future').count() == 1, 'own module saved')

    # Klassenarbeit
    pg.click('.ptab:has-text("Klassenarbeit")'); pg.wait_for_selector('input[type=date]')
    pg.fill('input[type=date]', '2026-12-01')
    pg.locator('.checks').first.locator('label', has_text='Unit 2').locator('input').check()
    pg.locator('.checks').nth(1).locator('label', has_text='Simple past').locator('input').check()
    pg.click('.pbody .btn.primary:has-text("Speichern")'); pg.wait_for_timeout(80)
    # settings
    pg.click('.ptab:has-text("Einstellungen")'); pg.wait_for_selector('.num-in')
    pg.locator('.cb', has_text='Extra große Schrift').locator('input').check()
    pg.click('.pbody .btn.primary:has-text("Speichern")'); pg.wait_for_timeout(80)
    check(pg.evaluate("() => document.documentElement.classList.contains('big-text')"), 'big text applied')
    pg.locator('.cb', has_text='Extra große Schrift').locator('input').uncheck(); pg.click('.pbody .btn.primary:has-text("Speichern")')
    # data: backup download
    pg.click('.ptab:has-text("Daten")'); pg.wait_for_selector('.card.warn')
    check('nur' in pg.inner_text('.card.warn') and 'Gerät' in pg.inner_text('.card.warn'), 'storage warning shown')
    with pg.expect_download() as dl:
        pg.click('button:has-text("Sicherung herunterladen")')
    bk = json.load(open(dl.value.path(), encoding='utf-8'))
    check(bk['format'] == 'english-bobins-backup' and len(bk['content']['words']) >= 7 and len(bk['progress']['words']) >= 10, 'backup has words + progress')
    with pg.expect_download() as dl:
        pg.click('button:has-text("Alle Vokabeln als CSV")')
    check('bagpipes' in open(dl.value.path(), encoding='utf-8-sig').read(), 'csv export has own words')
    pg.click('button:has-text("Beispiel-Lernstand anlegen")'); pg.wait_for_timeout(80)
    check(pg.locator('button:has-text("Beispiel-Lernstand entfernen")').count() == 1, 'sample progress can be removed')
    pg.click('button:has-text("Beispiel-Lernstand entfernen")'); pg.wait_for_timeout(80)
    pg.screenshot(path=os.path.join(OUT, '11-parent-data.png'), full_page=True)
    # overview now lists problems
    pg.click('.ptab:has-text("Übersicht")'); pg.wait_for_selector('.nums')
    check('Schwierige Wörter' in pg.inner_text('.pbody') and 'Grammatik: wo es hakt' in pg.inner_text('.pbody'), 'overview sections')

    # ------------------------------------------------------------ Klassenarbeit: countdown, Probe, Fehler verbessern
    pg.goto(URL + '?child=lukas#/home'); pg.wait_for_selector('.today-btn')
    check('Klassenarbeit' in pg.inner_text('.hero'), 'countdown on the start page', pg.inner_text('.hero'))
    pg.click('.tile:has-text("Klassenarbeit")'); pg.wait_for_selector('.big-actions')
    check('Unit 2' in pg.inner_text('main') and 'Simple past' in pg.inner_text('main'), 'test page shows what comes up')
    pg.click('.list-item:has-text("Probe-Klassenarbeit")'); pg.wait_for_selector('.run-body .card')
    check(pg.locator('.run-body .tools .btn').count() == 0, 'probe: no help button')
    k = 0
    while in_round(pg) and k < 40:
        s = step(pg); k += 1
        check(s['test'], 'probe step is a test step')
        answer(pg, right_text(s) if k % 3 else 'qqq')
        check(pg.locator('.run-body .fb-box').count() == 0, 'probe: no feedback during the test')
    pg.wait_for_selector('.probe-result')
    check(pg.locator('.res.no').count() >= 1 and pg.locator('.res.ok').count() >= 1, 'probe result list')
    pg.screenshot(path=os.path.join(OUT, '12-probe-result.png'), full_page=True)
    pg.click('button:has-text("Fehler verbessern")'); pg.wait_for_selector('.run-body .card')
    check(pg.locator('.run-body .tools .btn').count() >= 1, 'correction round has help again')
    play(pg, 'right')
    check(pg.locator('.summary').count() == 1, 'correction round finished')

    # mix, grammar mixed, ka run without errors
    for mode in ['mix', 'grammatik', 'ka']:
        pg.goto(URL + '?child=lukas#/start/' + mode); pg.wait_for_timeout(150)
        check(in_round(pg), 'round ' + mode + ' starts')
        play(pg, 'mixed')
        check(pg.locator('.summary').count() == 1, 'round ' + mode + ' ends')

    # ------------------------------------------------------------ phone
    ph = br.new_context(viewport={'width': 390, 'height': 800}, device_scale_factor=2, is_mobile=True, has_touch=True)
    ph.add_init_script(UNLOCK); ph.add_init_script(MOCK_SPEECH)
    pp = ph.new_page(); pp.on('pageerror', lambda e: errors.append('phone: ' + str(e)))
    pp.goto(URL + '?child=lukas'); pp.wait_for_selector('.today-btn')
    over = lambda: pp.evaluate('() => document.documentElement.scrollWidth - window.innerWidth')
    check(over() <= 0, 'phone: no horizontal scroll (home)', over())
    pp.screenshot(path=os.path.join(OUT, '13-phone-home.png'), full_page=True)
    pp.click('.today-btn'); pp.wait_for_selector('.run-body .card')
    check(over() <= 0, 'phone: no horizontal scroll (round)', over())
    pp.screenshot(path=os.path.join(OUT, '14-phone-card.png'))
    for _ in range(6):
        s = step(pp)
        if s['kind'] == 'learn': pp.click('.run-body form .btn.primary'); continue
        if s['kind'] == 'word' and s['dir'] == 'de-en':
            t = s['answer'].replace('to ', '')
            answer(pp, t[0] + t[2:] if len(t) > 4 else 'qqq')
            pp.screenshot(path=os.path.join(OUT, '15-phone-feedback.png'))
            check(over() <= 0, 'phone: no horizontal scroll (feedback)', over())
            break
        answer(pp, right_text(s)); finish_step(pp)
    pp.goto(URL + '?child=lukas#/eltern'); pp.wait_for_selector('.answer-in')
    m = re.search(r'(\d+) × (\d+)', pp.inner_text('main'))
    pp.fill('.answer-in', str(int(m.group(1)) * int(m.group(2))) if m else os.environ.get('RB_PARENT_PIN', '')); pp.press('.answer-in', 'Enter'); pp.wait_for_selector('.ptabs')
    pp.click('.ptab:has-text("Vokabeln")'); pp.wait_for_timeout(100)
    check(over() <= 0, 'phone: no horizontal scroll (parent words)', over())
    pp.screenshot(path=os.path.join(OUT, '16-phone-parent.png'))
    ph.close()

    # ------------------------------------------------------------ standalone (no Robin's Bobins files)
    sa = br.new_context(viewport={'width': 1000, 'height': 800})
    sa.add_init_script(MOCK_SPEECH)
    sp = sa.new_page(); sa_err = []
    sp.on('pageerror', lambda e: sa_err.append(str(e)))
    sp.route('**/robins-bobins/**', lambda r: r.fulfill(status=404, body=''))
    sp.goto(URL); sp.wait_for_selector('.today-btn')
    check(not sa_err and 'Lukas' in sp.inner_text('.hero h1'), 'standalone: runs as Lukas', sa_err)
    check(sp.locator('#coin-pill').is_hidden() and sp.locator('#apps-link').is_hidden(), 'standalone: no coins, no app link')
    sp.click('.today-btn'); sp.wait_for_selector('.run-body .card'); play(sp, 'right')
    check(sp.locator('.summary').count() == 1 and not sa_err, 'standalone round works', sa_err)
    sa.close()

    # ------------------------------------------------------------ with Robin's Bobins
    if platform:
        rb = br.new_context(viewport={'width': 1100, 'height': 900}, service_workers='block')
        rb.add_init_script(UNLOCK); rb.add_init_script(MOCK_SPEECH)
        rp = rb.new_page(); rb_err = []
        rp.on('pageerror', lambda e: rb_err.append(str(e)))
        # the registry entry is hidden until the site is live — show it for the test
        def unhide(route):
            r = route.fetch(); body = r.text().replace("grantTo: ['lukas'],\n    hidden: true", "grantTo: ['lukas']")
            route.fulfill(response=r, body=body)
        rp.route('**/robins-bobins/apps/registry.js*', unhide)
        rp.goto(BASE + 'robins-bobins/index.html#/c/lukas'); rp.wait_for_selector('.app-card')
        card = rp.locator('.app-card[data-app=english]')
        check(card.count() == 1, 'English-Bobins card on Lukas\'s home')
        check('Vokabeln' in card.inner_text() or 'Aufgaben' in card.inner_text(), 'card line', card.inner_text())
        before = rp.evaluate("() => RB.coins.balance('lukas')")
        rp.screenshot(path=os.path.join(OUT, '17-rb-home.png'), full_page=True)
        card.click(); rp.wait_for_selector('.today-btn')
        check('child=lukas' in rp.url, 'opened with ?child=lukas', rp.url)
        check(rp.locator('#coin-pill').is_visible() and rp.locator('#apps-link').is_visible(), 'coin pill + ‹ Meine Apps')
        rp.click('.today-btn'); rp.wait_for_selector('.run-body .card'); play(rp, 'right')
        rp.wait_for_selector('.summary')
        after = rp.evaluate("() => RB.coins.balance('lukas')")
        check(after > before, 'Robin-Münzen paid into the family balance', [before, after])
        acts = rp.evaluate("() => RB.activity.list('lukas').filter(a => a.app === 'english').length")
        check(acts >= 1, 'activity recorded (streak)', acts)
        check('Robin-Münzen' in rp.inner_text('.summary'), 'end screen shows coins')
        home_url = rp.get_attribute('#apps-link', 'href')
        check('robins-bobins/index.html#/c/lukas' in home_url, '‹ Meine Apps goes to Lukas\'s home', home_url)
        rp.click('#apps-link'); rp.wait_for_selector('.app-card'); rp.wait_for_timeout(300)
        check('heute' in rp.locator('.app-card[data-app=english]').inner_text(), 'card shows today\'s count', rp.locator('.app-card[data-app=english]').inner_text())
        bk = rp.evaluate("() => Object.keys(RB.backup.exportAll().data).filter(k => k.indexOf('english-bobins:') === 0)")
        check('english-bobins:lukas' in bk, 'family backup includes English-Bobins', bk)
        check(not rb_err, 'no errors with the platform', rb_err)
        rb.close()

    check(not [e for e in errors if 'favicon' not in e], 'no page errors', errors[:5])
    br.close()

print('e2e: %d passed, %d failed' % (passed, failed))
sys.exit(1 if failed else 0)
