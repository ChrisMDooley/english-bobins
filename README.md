# English-Bobins

Englisch üben für Lukas (Gymnasium Hessen, Klasse 6, Klett *Green Line 1/2*): Vokabeln mit Wiederholung
in Abständen, Rechtschreib-Hilfen für Legasthenie, Grammatik zum Selberschreiben, Klassenarbeit-Vorbereitung.
Teil von **Robin's Bobins** (gleiche Familien-PIN, gleiche Robin-Münzen), läuft aber auch allein.

Live (sobald veröffentlicht): https://chrismdooley.github.io/english-bobins/

## Starten

Kein Build, keine Abhängigkeiten. Irgendeinen kleinen Webserver im Ordner *über* `english-bobins/` starten
(damit `../robins-bobins/` gefunden wird – ohne läuft die App einfach allein als Lukas):

```
cd ..            # der Ordner, in dem english-bobins/ (und robins-bobins/) liegen
python3 -m http.server 8000
# → http://localhost:8000/english-bobins/
```

Direkt per Doppelklick (`file://`) geht es auch, nur ohne Offline-Cache.

## Für Lukas

Startseite: **Heute üben** (≈ 22 Aufgaben, 10–15 Minuten: neue Wörter, fällige alte, schwierige, Grammatik) und
*Neue Vokabeln · Alte Vokabeln wiederholen · Meine Fehler · Grammatik · Gemischtes Training · Klassenarbeit
vorbereiten · Mein Lernfortschritt*.

- Neue Wörter werden erst gezeigt (Deutsch, Englisch, Silben, 🔊, Beispielsatz), dann abgefragt.
- Abgefragt wird vor allem **Deutsch → Englisch, geschrieben**. Bei bekannten Wörtern manchmal Englisch → Deutsch.
- **Richtig** → weiter. **Fast richtig** (Rechtschreibung) → was genau anders ist (farbig) + ein deutscher Hinweis
  („Achte auf das doppelte f.“), dann einmal richtig abschreiben. **Noch nicht** → keine Lösung, sondern der erste
  Buchstabe als Tipp und ein zweiter Versuch. Danach die Lösung in Silben, einmal abschreiben; das Wort kommt in
  derselben Runde noch einmal.
- Unterschieden werden: Tippfehler · Rechtschreibung · falsche Form (went statt go, Mehrzahl, a/an) · anderes Wort
  aus der Liste · nicht gewusst. Wortwissen und Rechtschreibung werden getrennt gezählt.
- Groß/klein wird nicht als Fehler gewertet, aber erwähnt (Monday, I, Nomen klein). Amerikanische Schreibweise
  zählt (abschaltbar), mit Hinweis auf die britische.

## Elternbereich (`Eltern` oben rechts)

Mit Robin's Bobins: die Familien-PIN. Allein: eine kleine Rechenaufgabe (gegen versehentliches Ändern).

| Bereich | |
|---|---|
| Übersicht | schwierige Wörter, Rechtschreib-Wörter mit der falschen Schreibung, wiederkehrende Fehler, Grammatik-Schwachstellen, letzte Runden |
| Vokabeln | suchen, filtern, bearbeiten, löschen; Lernstufe ansehen und **von Hand setzen**, Lernstand eines Worts zurücksetzen |
| Hinzufügen | ein Wort · **Liste einfügen** (mit Vorschau zum Korrigieren) · **CSV-Import** (mit Vorschau) · CSV-Vorlage |
| Units | Units anlegen, **„aktuell“** markieren (die bekommen die meiste Übung) |
| Grammatik | Themen aktiv schalten, bearbeiten, eigene Module schreiben (mit Prüfung jeder Zeile) |
| Klassenarbeit | Datum, Units, Grammatik → Countdown, „Für die Klassenarbeit üben“, Probe-Klassenarbeit |
| Einstellungen | Mischung (60/25/15), Heute-üben-Plan, Englisch→Deutsch-Anteil, Stimme, Tempo, Schrift (OpenDyslexic), große Schrift |
| Daten | Sicherung herunterladen / einspielen, alle Vokabeln als CSV, Demo-Wörter an/aus, Beispiel-Lernstand an/aus, alles zurücksetzen |

### Vokabeln eintragen

- **Liste einfügen:** eine Zeile pro Wort, `holiday – Ferien; Urlaub` (Trennzeichen: Tab, ` – `, ` = `, ` - `, `|`, `;`).
  Lautschrift `[ˈhɒlədeɪ]` wird entfernt, eine dritte Spalte ist der Beispielsatz. Vorschau prüfen → Speichern.
- **CSV:** `englisch;deutsch;englisch_auch;deutsch_auch;beispiel;beispiel_deutsch;wortart;klasse;unit;seite;tags`
  (nur die ersten zwei sind nötig; Excel: „CSV UTF-8“). Unbekannte Units werden beim Speichern angelegt.
- Schreibweise: `(to) go` → „go“ und „to go“ sind richtig. `sb.`/`sth.` dürfen fehlen. Mehrere Bedeutungen mit `;`.
  Weitere richtige Antworten in „englisch_auch“.
- Dasselbe Wort in zwei Units teilt einen Lernstand (Schlüssel: englisch + erste deutsche Bedeutung).
- Fest eingebaut (auf jedem Gerät): `data/vocab.js`. Eingetragenes im Elternbereich liegt **nur auf diesem Gerät**.

### Grammatik schreiben

Ein Modul hat Titel, Klasse, Erklärung (Deutsch, `**fett**`, `- Aufzählung`), Beispiele (`English = Deutsch`),
typische Fehler (`falsch => richtig => warum`) und Aufgaben, eine pro Zeile:

```
Art [Thema] | Aufgabe | richtige Antwort ; auch richtig | Erklärung nach einem Fehler
lücke | My sister ___ twelve. | is
form [irr] | Yesterday Tom ___ (go) to school. | went | «go» ist unregelmäßig: go – went – gone.
~ goed = «go» ist ein unregelmäßiges Verb. Die Vergangenheitsform lautet «went».
verneinen | She likes fish. | She doesn't like fish.
frage | You saw the match. | Did you see the match?
ordnen | | What did you do yesterday?
übersetzen | Ich bin müde. | I am tired.
korrigieren | He go to school. | He goes to school.
! Anweisung für die folgenden Zeilen   ·   @ irr = Name eines Themas   ·   # Kommentar
```

Kurz- und Langformen (don't / do not, he's / he is / he has) werden automatisch beide akzeptiert. Fehler bei einem
Thema kommen später **mit einem anderen Satz desselben Themas** wieder – also mehrere Sätze pro Thema schreiben.
Typische Grammatikfehler erkennt die App selbst und erklärt sie (goed, he play, didn't went, more bigger, gooder,
than/then, have went, musted, can to …).

Eingebaut: Klasse 5 (to be, have got, simple present, present progressive, Pronomen/Possessiv, Wortstellung) und
Klasse 6 (simple past, unregelmäßige Verben S. 206–207 mit 89 Verben, past progressive, Steigerung,
Modalverben + Ersatzformen G16, present perfect). Alle Sätze und Erklärungen sind selbst geschrieben.

## Wie geplant wird (Wiederholung)

Leitner-Kästen 0–6, absichtlich einfach (`js/srs.js`):

| | Kasten | nächste Wiederholung |
|---|---|---|
| sofort richtig | +1 | 1 · 2 · 4 · 8 · 16 · 35 Tage |
| gewusst, aber falsch geschrieben | bleibt | morgen (Rechtschreibung extra) |
| erst beim 2. Versuch | −1 | morgen |
| nicht gewusst | 1 | gleich in der Runde + morgen |

Neu (0) → Wird gelernt (1–2) → Fast sicher (3–4) → Sicher (5–6). Ein altes Wort, das beim allerersten Abfragen
sitzt, springt auf 3. „Schwierig“: zweimal falsch – bis es dreimal hintereinander an zwei Tagen richtig war.
Auch „Sicher“ kommt alle 5 Wochen wieder.

## Robin-Münzen

1 pro gewusstem Wort / gelöster Aufgabe (Rechtschreibfehler zählen mit, jedes Wort einmal am Tag),
+1 wenn ein schwieriges Wort geknackt ist, Rundenbonus (Heute +5, Probe-Klassenarbeit +8, sonst +3, ab 8 Aufgaben),
+5 einmal pro geschafftem Grammatik-Thema; höchstens 60 am Tag aus einzelnen Antworten. Eine Buchung pro Runde
auf das Familienkonto. Keine Strafen, keine Streak-Verluste.

## Aufbau

```
index.html              Seite; lädt ../robins-bobins/shared/rb.js + robin.js optional
js/text.js              Normalisieren, Edit-Distanz mit Schritten, Klang-Schlüssel, Kurzformen
js/check.js             Antwort prüfen (Wort, Deutsch, Satz), deutsche Hinweise, farbiger Vergleich, Silben
js/grammar.js           Aufgaben-Zeilenformat, Generatoren für unregelmäßige Verben
js/content.js           Inhalte: eingebaut + Eltern-Änderungen; Einfügen/CSV mit Vorschau, Duplikate
js/srs.js · js/store.js Wiederholung; Lernstand je Kind (ein JSON-Dokument)
js/session.js           welche Aufgaben in eine Runde kommen (alle Modi)
js/practice.js          die Runde · js/screens.js Lukas' Seiten · js/parent.js Elternbereich · js/app.js Start
js/platform.js          einzige Stelle, die Robin's Bobins kennt
data/vocab.js           Vokabeln aus dem Buch (fest eingebaut) · data/irregular.js · data/grammar.js · data/demo.js
rb-card.js              Zeile auf der Robin's-Bobins-Karte
```

Speicher: `localStorage['english-bobins:content']` (Eltern-Änderungen) und `localStorage['english-bobins:<kind>']`
(Lernstand). Beides ist in der Robin's-Bobins-Familien-Sicherung enthalten. **Daten bleiben im Browser dieses
Geräts** – kein automatischer Abgleich zwischen Geräten, und sie sind weg, wenn die Browserdaten gelöscht werden.
Darum: Elternbereich → Daten → Sicherung. Alle Zugriffe laufen über `load()/save()` in `store.js`/`content.js`;
die Dokumente haben IDs und Zeitstempel, ein späterer Sync muss nur diese Stellen ersetzen.

## Tests

```
node tests/check.test.js      # Antwortprüfung (~1000 Prüfungen, inkl. jeder eingebauten Aufgabe)
node tests/logic.test.js      # Import, Wiederholung, Speichern, Runden, ein simulierter Monat
python3 tests/e2e.py <shots-dir> [--with-platform ../robins-bobins]   # echter Browser (Playwright)
```

## Noch offen

- Die echten Vokabeln aus Green Line 1 und 2 (Unit für Unit) in `data/vocab.js`.
- Foto einer Vokabelliste direkt in der App einlesen (heute: Fotos an Claude schicken).
- Aufgenommene Aussprache statt Browser-Stimme.
- Synchronisierung zwischen Geräten.
- Gast-Zugang für Mitschüler (wie bei den anderen Apps), wenn gewünscht.
