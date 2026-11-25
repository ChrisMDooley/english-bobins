/*
 * ka2-book.js — second part of the Englischarbeit-Nr.-2 package, from photos of Lukas's book (25 Nov 2026):
 *   Green Line 2, Unit 2 "London: Wow!" (Across cultures 1 S. 34–35, Check-in S. 36–39, Station 1 S. 40–41,
 *   Station 2 S. 42–43) and Grammar G1 (S. 189–191), G2 + G3 (S. 192–193).
 *
 * Words: from the word boxes and texts on those pages, German added by us (the official Vocabulary pages
 * at the back of the book are still missing). Rules: the book's points, explained in our own words.
 * Texts: short summaries in our own words — the book's texts are not copied.
 * Load after grammar.js, vocab.js and ka2-london.js.
 */
(function (root) {
  'use strict';
  var D = root.EB.data, UNIT = 'gl2-u2';

  // ------------------------------------------------------------------ vocabulary (book pages)
  var unit = { id: UNIT, year: 6, book: 'Green Line 2', name: 'Unit 2', short: 'Unit 2', title: 'London: Wow! (Wörter von S. 34–43)', order: 20 };
  var W = [
    // S. 34–35 Across cultures: London, a world city
    ['34', 'attraction', 'Attraktion; Sehenswürdigkeit', 'noun', 'The London Eye is a big attraction.'],
    ['34', 'business', 'Geschäft; Wirtschaft', 'noun', 'London is a city of business.'],
    ['34', 'capital city', 'Hauptstadt', 'noun', 'Berlin is the capital city of Germany.'],
    ['34', 'century', 'Jahrhundert', 'noun', 'The Tower was built in the 11th century.'],
    ['34', 'culture', 'Kultur', 'noun', 'London has a lot of culture: museums, theatres and music.'],
    ['34', 'politics', 'Politik', 'noun', 'The Houses of Parliament are the centre of British politics.'],
    ['34', 'river', 'Fluss', 'noun', 'The Thames is the river in London.'],
    ['34', '(to) have much to offer', 'viel zu bieten haben', 'verb', 'London has much to offer for teenagers.', { enAlt: ['have much to offer', 'to have a lot to offer'] }],
    ['34', 'important', 'wichtig', 'adj', 'London is an important city.'],
    ['34', 'international', 'international', 'adj', 'London has six international airports.'],
    ['35', 'world city', 'Weltstadt', 'noun', 'London is a world city.'],
    ['35', 'language', 'Sprache', 'noun', 'You can hear over 300 languages in London.'],
    ['35', 'neighbourhood', 'Viertel; Stadtteil; Nachbarschaft', 'noun', 'Chinatown is a famous neighbourhood.', { enAlt: ['neighborhood'] }],
    ['35', 'tourist tip', 'Tipp für Touristen', 'noun', 'Here are my top five tourist tips.', { deAlt: ['Touristentipp'] }],
    ['35', 'carnival', 'Karneval', 'noun', 'The Notting Hill Carnival is a big festival.'],
    // S. 36–37 Check-in
    ['36', '(to) compare', 'vergleichen', 'verb', 'Compare the two parks.'],
    ['36', 'directions', 'Wegbeschreibung', 'noun', 'Can you give me directions to the station?', { deAlt: ['Richtungsangaben', 'Wegangaben'] }],
    ['37', 'statue', 'Statue', 'noun', 'There is a statue of Lord Nelson on top of the column.'],
    ['37', 'column', 'Säule', 'noun', 'Nelson\'s Column is in Trafalgar Square.'],
    ['37', 'street artist', 'Straßenkünstler; Straßenkünstlerin', 'noun', 'You can watch street artists in Covent Garden.'],
    ['37', 'wedding', 'Hochzeit', 'noun', 'The Royal Family likes to have weddings in St Paul\'s Cathedral.'],
    ['37', 'Royal Family', 'Königsfamilie', 'noun', 'The Royal Family lives in Buckingham Palace.', { enAlt: ['the Royal Family', 'royal family'], deAlt: ['königliche Familie'] }],
    ['37', 'around the corner', 'um die Ecke', 'phrase', 'The café is just around the corner.', { enAlt: ['round the corner'] }],
    ['37', '(to) take a selfie', 'ein Selfie machen', 'verb', 'Let\'s take a selfie on the bridge!'],
    // S. 38–39 transport and the Kwan story
    ['38', 'transport', 'Verkehrsmittel; Transport', 'noun', 'What forms of transport are there in your town?'],
    ['38', 'cab', 'Taxi', 'noun', 'Black cabs are famous in London.', { enAlt: ['taxi'] }],
    ['38', 'Tube stop', 'U-Bahn-Haltestelle', 'noun', 'Baker Street is a famous Tube stop.', { enAlt: ['tube stop', 'Tube station'], deAlt: ['U-Bahn-Station'] }],
    ['38', 'smartcard', 'Chipkarte', 'noun', 'An Oyster card is a smartcard.', { enAlt: ['smart card'] }],
    ['38', '(to) top up', 'aufladen (Guthaben)', 'verb', 'You can top up your Oyster card at the station.', { deAlt: ['aufladen'] }],
    ['38', 'credit', 'Guthaben', 'noun', 'There isn\'t much credit on my card.'],
    ['38', 'cheap', 'billig; günstig', 'adj', 'The bus is cheaper than a cab.'],
    ['38', 'wheelchair access', 'rollstuhlgerechter Zugang', 'noun', 'Does the station have wheelchair access?', { deAlt: ['Zugang für Rollstühle', 'Zugang für Rollstuhlfahrer'] }],
    ['39', 'wheelchair', 'Rollstuhl', 'noun', 'Mrs Kwan is going to use her wheelchair today.'],
    ['39', 'selfish', 'egoistisch; selbstsüchtig', 'adj', 'Don\'t be so selfish!'],
    ['39', '(to) get around', 'herumkommen; sich fortbewegen', 'verb', 'It isn\'t easy to get around in a wheelchair.'],
    ['39', 'cobblestone', 'Pflasterstein; Kopfsteinpflaster', 'noun', 'Wheelchairs don\'t like cobblestones.', { deAlt: ['Kopfsteinpflaster'] }],
    ['39', 'colourful', 'bunt; farbenfroh', 'adj', 'Neal\'s Yard is very colourful.', { enAlt: ['colorful'] }],
    ['39', 'snack', 'Imbiss; Snack', 'noun', 'Let\'s have a snack in the park.'],
    ['39', 'expensive', 'teuer', 'adj', 'Cabs are expensive.'],
    ['39', 'tight', 'knapp; eng', 'adj', 'Money is tight this month.'],
    // S. 40–41 Station 1
    ['40', 'access', 'Zugang', 'noun', 'There is no access for wheelchairs here.'],
    ['40', 'building', 'Gebäude', 'noun', 'The new building has a lift.'],
    ['40', 'driver', 'Fahrer; Fahrerin', 'noun', 'The bus driver can help you.'],
    ['40', 'lift', 'Aufzug; Fahrstuhl', 'noun', 'Let\'s take the lift, not the stairs.', { enAlt: ['elevator'] }],
    ['40', 'passenger', 'Fahrgast; Passagier', 'noun', 'The bus has 80 passengers.', { deAlt: ['Passagierin'] }],
    ['40', 'ramp', 'Rampe', 'noun', 'London buses have ramps for wheelchairs.'],
    ['40', 'stairs', 'Treppe', 'noun', 'There are lots of stairs at this station.', { deAlt: ['Treppen'] }],
    ['40', '(to) arrive', 'ankommen', 'verb', 'When does the bus arrive?'],
    ['40', 'public transport', 'öffentliche Verkehrsmittel', 'noun', 'London has very good public transport.', { deAlt: ['öffentlicher Verkehr', 'Nahverkehr'] }],
    ['40', 'website', 'Website; Internetseite', 'noun', 'Look at the museum\'s website first.', { enAlt: ['web site'] }],
    ['40', 'a bit of fun', 'ein bisschen Spaß', 'phrase', 'Let\'s have a bit of fun!'],
    ['41', 'twins', 'Zwillinge', 'noun', 'The twins are going to give the singer some money.'],
    ['41', 'jewellery', 'Schmuck', 'noun', 'She is selling handmade jewellery.', { enAlt: ['jewelry'] }],
    ['41', 'handmade', 'handgemacht', 'adj', 'These earrings are handmade.'],
    ['41', 'special', 'besondere(r, s); besonders', 'adj', 'Are you going to do anything special this weekend?', { deAlt: ['besonders', 'besondere', 'besonderer', 'besonderes'] }],
    // S. 42–43 Station 2
    ['42', 'price', 'Preis', 'noun', 'The prices are higher here than in Greenwich.'],
    ['42', 'high', 'hoch', 'adj', 'The Shard is very high.'],
    ['42', 'cute', 'süß; niedlich', 'adj', 'Look at that dog – it\'s so cute!'],
    ['42', 'class trip', 'Klassenfahrt; Klassenausflug', 'noun', 'We went to London on a class trip.', { deAlt: ['Klassenausflug'] }],
    ['42', 'art museum', 'Kunstmuseum', 'noun', 'The Tate Modern is an art museum.'],
    ['42', 'relaxing', 'entspannend; erholsam', 'adj', 'A walk in the park is very relaxing.'],
    ['42', '(to) waste', 'verschwenden', 'verb', 'Don\'t waste your money!'],
    ['42', 'way to travel', 'Art zu reisen; Fortbewegungsart', 'noun', 'The bus is the cheapest way to travel.', { deAlt: ['Reiseart'] }],
    ['42', '(to) worry about', 'sich Sorgen machen um', 'verb', 'Don\'t worry about the money.', { deAlt: ['sich Sorgen machen über', 'sich sorgen um'] }],
    ['43', 'comparative', 'Komparativ (1. Steigerung)', 'noun', '"Bigger" is a comparative.', { deAlt: ['Komparativ', '1. Steigerung'] }],
    ['43', 'superlative', 'Superlativ (2. Steigerung)', 'noun', '"The biggest" is a superlative.', { deAlt: ['Superlativ', '2. Steigerung'] }],
    ['43', 'boring', 'langweilig', 'adj', 'Greenwich isn\'t boring!'],
    ['43', 'wonderful', 'wunderbar; wundervoll', 'adj', 'They are wonderful friends.'],
    ['43', 'angry', 'wütend; böse', 'adj', 'Sophie was angry.'],
    ['43', 'by heart', 'auswendig', 'phrase', 'You must learn the irregular forms by heart.']
  ];
  var words = W.map(function (x) {
    var o = x[5] || {};
    var slug = x[1].toLowerCase().replace(/^\(to\)\s*/, '').replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
    return { id: UNIT + '-' + slug, en: x[1], de: x[2], type: x[3], example: x[4] || '', unit: UNIT, year: 6, page: x[0],
             enAlt: o.enAlt, deAlt: o.deAlt, tags: ['Buchseite'] };
  });
  D.vocab.units.push(unit);
  D.vocab.words = D.vocab.words.concat(words);

  // ------------------------------------------------------------------ grammar: the book's rules
  var mod = {}; D.grammar.forEach(function (m) { mod[m.id] = m; });
  function more(id, lines) { if (mod[id]) mod[id].exercises = mod[id].exercises + '\n' + lines.join('\n'); }

  // G1 simple past (S. 189–191)
  if (mod['k6-past']) {
    mod['k6-past'].unit = 'G1 (Buch S. 189–190)';
    mod['k6-past'].intro = 'Das **simple past** benutzt du für Dinge, die *in der Vergangenheit abgeschlossen* sind – vor allem in **Berichten und Geschichten**.\n' +
      'Signalwörter: **last** week / month / year · two days **ago** · **yesterday**.\nDie Form ist für **alle Personen gleich**: I, you, he, she, it, we, they **played**.\n' +
      '**Regelmäßige Verben:** Grundform + **-ed**. Achte auf die Schreibung:\n- normal: play → play**ed** · stummes -e: like → like**d**\n- einfacher Konsonant nach kurzem Vokal: plan → pla**nn**ed · y nach Konsonant: try → tr**ied**\n' +
      '**Aussprache von -ed:** [d] loved · [t] helped, liked · [ɪd] nach t oder d: need**ed**, paint**ed**\n' +
      '**Unregelmäßige Verben** lernst du auswendig (S. 206–207): come → came, do → did, go → went, give → gave, have → had, make → made, put → put, see → saw, take → took.\n' +
      '**be** hat zwei Formen: I / he / she / it **was** · we / you / they **were**.\n' +
      '**Verneinung:** **didn\'t** + Grundform – They **didn\'t take** the ship. Mit be: **wasn\'t / weren\'t**.\n' +
      '**Frage:** **Did** + Subjekt + Grundform – **Did** you **arrive** at Heathrow? – Yes, I **did**. / No, I **didn\'t**.\nMit be: **Was** he nervous? – Yes, he **was**. · **Were** they happy? – No, they **weren\'t**.\n' +
      'Nach **did / didn\'t** steht immer die **Grundform** – die Vergangenheit steckt schon in did.\n' +
      'Im Deutschen sagst du oft das Perfekt (*wir haben gesammelt*), im Englischen bei abgeschlossenen Sachen trotzdem das simple past.';
    more('k6-past', [
      '@ say = Aussprache von -ed',
      '@ was = was / were',
      '@ short = Kurzantworten',
      '! Schreibung: Setze das Verb ins simple past.',
      'form [ed-spell] | The girls ___ (carry) their bags to the bus. | carried',
      'form [ed-spell] | We ___ (shop) in Covent Garden. | shopped',
      'form [ed-spell] | Lily ___ (love) the street artists. | loved',
      'form [ed-spell] | Mum ___ (organise) a nice day for us. | organised ; organized',
      'form [ed] | Sophie ___ (help) her mum with the wheelchair. | helped',
      'form [ed] | We ___ (need) a map. | needed',
      '! Wie spricht man -ed aus? Schreib d, t oder id.',
      'lücke [say] | needed – painted: -ed klingt wie ___ | id ; ɪd | Nach t oder d spricht man -ed als eigene Silbe [ɪd].',
      'lücke [say] | helped – liked: -ed klingt wie ___ | t | Nach stimmlosen Lauten (p, k, s, sh, ch, f) klingt -ed wie [t].',
      'lücke [say] | loved – organised: -ed klingt wie ___ | d | Nach Vokalen und stimmhaften Lauten klingt -ed wie [d].',
      '! was oder were?',
      'lücke [was] | Yesterday I ___ in the park. | was',
      'lücke [was] | Lily and Sophie ___ in London last Saturday. | were',
      'lücke [was] | ___ you at home last night? | Were',
      'lücke [was] | The Tube station ___ very crowded. | was',
      'verneinen [was] | Mrs Kwan was happy about the cab. | Mrs Kwan wasn\'t happy about the cab.',
      'verneinen [was] | The tickets were expensive. | The tickets weren\'t expensive.',
      'frage [was] | The girls were tired. | Were the girls tired?',
      '! Kurzantworten.',
      'lücke [short] | Did you take the Tube? – Yes, I ___ . | did',
      'lücke [short] | Did Lily go to Covent Garden? – No, she ___ . | didn\'t ; did not',
      'lücke [short] | Was Sophie angry? – Yes, she ___ . | was',
      'lücke [short] | Were the prices high? – Yes, they ___ . | were',
      'lücke [short] | Were the parks crowded? – No, they ___ . | weren\'t ; were not',
      'verneinen [did] | They took the bus. | They didn\'t take the bus.',
      'frage [did] | Lily visited the Tate Modern. | Did Lily visit the Tate Modern?',
      'übersetzen [ed] | Letztes Jahr haben wir viel Geld gesammelt. | Last year we raised lots of money. ; Last year we raised a lot of money. ; Last year we collected lots of money. ; Last year we collected a lot of money. ; We raised a lot of money last year. ; We collected a lot of money last year.',
      'hören [ed] | Last Saturday we visited the Tate Modern.'
    ]);
  }

  // G1 d) questions with question words (S. 191)
  if (mod['k6-qwords']) {
    mod['k6-qwords'].unit = 'G1 d (Buch S. 191)';
    mod['k6-qwords'].intro = mod['k6-qwords'].intro +
      '\n**Mit was / were:** Where **were** you last night? – I was at the cinema. · What **was** the problem?\n' +
      '**Mit not:** not hängt direkt am Hilfsverb: Why **didn\'t** you go home? · Why **weren\'t** you at home?\n' +
      '**Subjektfrage oder Objektfrage?**\n- **Who told** you? = *Wer* hat es dir erzählt? → who ist Subjekt: **kein did**\n- **Who did** you **tell**? = *Wem* hast du es erzählt? → who ist Objekt: **mit did**\n' +
      '**Verb + Präposition bleiben zusammen** (die Präposition steht am Ende):\n- Who did you **talk to**? = Mit wem hast du gesprochen?\n- Where does she **come from**? · What are you **waiting for**? · What did you **find out about**?';
    more('k6-qwords', [
      '@ be = Fragen mit was / were',
      '@ not = Fragen mit not',
      '@ subj = Subjekt- oder Objektfrage',
      '@ prep = Verb + Präposition',
      'lücke [be] | Where ___ you last night? – I was at the cinema. | were',
      'lücke [be] | What ___ the problem with your bike? | was',
      'lücke [be] | Why ___ Sophie angry? | was',
      'frage [be] | The girls were in Neal\'s Yard. (Where …?) | Where were the girls?',
      'übersetzen [not] | Warum bist du nach dem Film nicht nach Hause gegangen? | Why didn\'t you go home after the film? ; Why did you not go home after the film?',
      'übersetzen [not] | Warum warst du nicht in der Schule? | Why weren\'t you at school? ; Why were you not at school?',
      '! Frag nach dem Teil in Klammern. Achtung: Subjekt oder Objekt?',
      'frage [subj] | Sophie helped her mum. (Who …? – frag nach Sophie) | Who helped her mum? ; Who helped her mother?',
      'frage [subj] | Sophie helped her mum. (Who …? – frag nach her mum) | Who did Sophie help?',
      'frage [subj] | Something happened at the station. (What …?) | What happened at the station?',
      'frage [subj] | Lily bought a scarf. (What …? – frag nach a scarf) | What did Lily buy?',
      'korrigieren [subj] | Who did find the old coin? | Who found the old coin?',
      'korrigieren [subj] | What did happen? | What happened?',
      '! Verb + Präposition: die Präposition kommt ans Ende.',
      'übersetzen [prep] | Mit wem hast du gesprochen? | Who did you talk to? ; Who did you speak to? ; Who were you talking to?',
      'übersetzen [prep] | Woher kommt Mrs Kwan? | Where does Mrs Kwan come from? ; Where is Mrs Kwan from?',
      'übersetzen [prep] | Auf wen wartest du? | Who are you waiting for? ; Who do you wait for?',
      'übersetzen [prep] | Was hast du über London herausgefunden? | What did you find out about London?',
      'korrigieren [prep] | To who did you talk? | Who did you talk to?',
      'korrigieren [prep] | For what are you waiting? | What are you waiting for?',
      'ordnen [prep] | | Who did Lily talk to?'
    ]);
  }

  // G2 going to (S. 192)
  if (mod['k6-goingto']) {
    mod['k6-goingto'].unit = 'G2 (Buch S. 192)';
    mod['k6-goingto'].intro = mod['k6-goingto'].intro +
      '\n**Kurzantworten:** Are you going to go to London tomorrow? – Yes, I **am**. / No, I**\'m not**.\nIs she going to buy a sandwich? – No, she **isn\'t**.\n' +
      'going to für **feste Pläne und Absichten** in der nahen Zukunft – und wenn man **jetzt schon Anzeichen** sieht: Our tour of London **is going to be** fun.';
    more('k6-goingto', [
      '@ short = Kurzantworten',
      'lücke [short] | Are you going to meet your friends this weekend? – Yes, I ___ . | am',
      'lücke [short] | Are you going to ride your bike after school? – No, I\'m ___ . | not',
      'lücke [short] | Is the woman in the green jacket going to buy a sandwich? – No, she ___ . | isn\'t ; is not',
      'lücke [short] | Are the twins going to give the singer money? – Yes, they ___ . | are',
      'form [form] | Lily and Sophie ___ (have) fish and chips today. | are going to have ; \'re going to have',
      'form [form] | Mrs Kwan ___ (use) her wheelchair all day. | is going to use ; \'s going to use',
      'form [form] | Our tour of London ___ (be) fun! | is going to be ; \'s going to be',
      'frage [q] | Mrs Kwan is going to use her wheelchair. (Why …?) | Why is Mrs Kwan going to use her wheelchair?',
      'frage [q] | They are going to meet at City Hall. (Where …?) | Where are they going to meet?',
      'frage [q] | You are going to do something special this evening. | Are you going to do anything special this evening? ; Are you going to do something special this evening?',
      'verneinen [neg] | Lily is going to see her friends in Covent Garden. | Lily isn\'t going to see her friends in Covent Garden.',
      'übersetzen [q] | Was wirst du auf der Party anziehen? | What are you going to wear at the party? ; What are you going to wear to the party?',
      'hören [form] | We\'re going to meet the others at City Hall this afternoon. >> Where are they going to meet the others? | at City Hall ; City Hall ; they are going to meet the others at City Hall ; they\'re going to meet them at City Hall'
    ]);
  }

  // G3 comparison (S. 192–193)
  if (mod['k6-compare']) {
    mod['k6-compare'].unit = 'G3 (Buch S. 192–193)';
    mod['k6-compare'].intro = 'Mit der **Steigerung** beschreibst und vergleichst du Personen und Dinge. Welche Form, hängt von den **Silben** ab:\n' +
      '**-er / -est:** einsilbige Adjektive und zweisilbige auf **-y**\n- hard → hard**er** → the hard**est**\n- big → bi**gg**er → the bi**gg**est (Endkonsonant nach kurzem Vokal verdoppelt)\n- nice → nic**er** → the nic**est** (stummes -e fällt weg)\n- easy → eas**ier** → the eas**iest** · funny → funn**ier** (y → i; *außer* shy → shy**er**)\n' +
      '**more / most:** fast alle anderen zweisilbigen und alle längeren Adjektive\n- interesting → **more** interesting → **the most** interesting · awful → more awful\n' +
      '**Achtung:** zweisilbig auf **-le, -ow, -er** → mit -er/-est: simple → simpl**er** · narrow → narrow**er** · clever → clever**er**\n' +
      '**Unregelmäßig** (auswendig lernen!): good – **better** – **the best** · bad – **worse** – **the worst**\n' +
      '**Vergleichen:**\n- gleich: **as** big **as** (genauso groß wie)\n- verschieden: **not as** big **as** (nicht so groß wie) oder bigg**er than** (größer als)\n' +
      '- You\'re cooler than **me** = cooler than **I am**.\n**than** (als) ≠ **then** (dann): First we met my friends, **then** we went to the Tower.\nNie beides zusammen: ~~more bigger~~.';
    more('k6-compare', [
      '@ 2syl = simple, narrow, clever, shy',
      '@ as = as … as / not as … as',
      '! -er/-est oder more/most?',
      'form [er] | The London Eye is ___ (high) than Tower Bridge. | higher',
      'form [er] | Greenwich is ___ (small) than central London. | smaller',
      'form [er] | It\'s the ___ (cool) museum in London! | coolest',
      'form [er] | This was the ___ (easy) test this year. | easiest',
      'form [er] | Your joke is ___ (funny) than mine. | funnier',
      'form [er] | This is the ___ (nice) café near the river. | nicest',
      'form [2syl] | This exercise is ___ (simple) than the last one. | simpler',
      'form [2syl] | The streets in the old town are ___ (narrow) than here. | narrower',
      'form [2syl] | My sister is ___ (clever) than me. | cleverer ; more clever',
      'form [2syl] | Tom is ___ (shy) than his brother. | shyer',
      'form [more] | For me, St James\'s Park is ___ (relaxing) than Hyde Park. | more relaxing',
      'form [more] | You get the ___ (fantastic) view from City Hall. | most fantastic',
      'form [more] | Cabs are the ___ (expensive) way to travel. | most expensive',
      'form [more] | This film is ___ (awful) than the first one. | more awful',
      'form [more] | They are the ___ (wonderful) friends in the world. | most wonderful',
      'form [irr] | Wasting money is bad, but wasting it on a cab is the ___ (bad) thing! | worst',
      'form [irr] | Mum\'s Chinese food is ___ (good) than the food in the restaurant. | better',
      '! as … as oder than? Und than oder then?',
      'lücke [as] | Our school is as big ___ your school. (genauso groß wie) | as',
      'lücke [as] | Greenwich isn\'t ___ crowded ___ Covent Garden. (nicht so voll wie) | as as',
      'lücke [as] | Hyde Park is ___ beautiful ___ St James\'s Park. (genauso schön wie) | as as',
      'lücke [than] | Karam is older ___ Ryan. | than',
      'lücke [than] | First we went to the park, ___ we had fish and chips. | then',
      'lücke [than] | I\'m faster ___ you! | than',
      'übersetzen [as] | Das Museum ist nicht so groß wie die Kathedrale. | The museum isn\'t as big as the cathedral. ; The museum is not as big as the cathedral.',
      'übersetzen [than] | Du bist cooler als ich. | You are cooler than me. ; You\'re cooler than me. ; You are cooler than I am. ; You\'re cooler than I am.',
      'übersetzen [more] | Geschichte ist interessanter als Naturwissenschaften. | History is more interesting than science.',
      'korrigieren [2syl] | This is more simple than I thought. | This is simpler than I thought.',
      'korrigieren [irr] | That was the baddest day of my holiday. | That was the worst day of my holiday.'
    ]);
  }

  // texts of Unit 2, summarised in our own words
  var KWAN = 'Lily, her sister Sophie and their mum, Mrs Kwan, are spending a Saturday together in London. Mrs Kwan can\'t walk well at the moment, so today she is going to use her wheelchair. ' +
    'Lily wants to go to Covent Garden and Neal\'s Yard to meet her friends. But Covent Garden is very crowded, the streets have cobblestones and the Tube station has no wheelchair access. ' +
    'Mum also wants somewhere quiet and not expensive, because money is tight this month. So Sophie has an idea: they are going to meet the friends at City Hall, next to the Thames, with a great view of the river and Tower Bridge.';
  var DAY = 'First the Kwans go to St James\'s Park. For them it is the most beautiful park in London and more relaxing than Hyde Park. Then they have fish and chips. ' +
    'In the shops the prices are higher than in Greenwich. Near the river they see the Tate Modern, an art museum. Lily loves art. ' +
    'At the end the girls want to take a cab, because cabs are cooler and have easy wheelchair access. Mum says cabs are the most expensive way to travel – but the girls are paying!';
  var FACTS = 'London was first a Roman town called Londinium. Today it is the capital of England and of the UK. More than eight million people live there, and you can hear over 300 languages. ' +
    'Big Ben is not the name of the clock tower – it is the name of the bell. The Tube is more than 150 years old. It is the oldest underground train system in the world. ' +
    'London is famous for red buses, black cabs and the Tube. The cheapest way to travel is with an Oyster card, a smartcard you can top up.';
  var SIGHTS = 'In Trafalgar Square there is a statue of Lord Nelson on top of a tall column. In Covent Garden you find lots of shops and street artists. ' +
    'Neal\'s Yard is very colourful and feels like a little village. From the Millennium Bridge you have a nice view of St Paul\'s Cathedral, where the Royal Family likes to have weddings.';

  D.grammar.push({ id: 'gl2-u2-texts', title: 'Unit 2: London & die Kwans (Texte)', year: 6, order: 66, level: 2, active: true, unit: 'Unit 2 (Buch S. 34–43)',
    intro: 'Hier übst du **Lesen** und **Hören** mit den Themen aus Unit 2 – kurz und mit eigenen Worten erzählt (die Texte im Buch sind länger).\n\n' +
      '**Die Kwans (S. 38–39):** *' + KWAN + '*\n\n**Ihr Tag (S. 42):** *' + DAY + '*\n\n**London facts (S. 35):** *' + FACTS + '*\n\n**Sights (S. 37):** *' + SIGHTS + '*\n\n' +
      'Tipp für die Arbeit: Lies zuerst die **Fragen**, dann den Text (*scanning*). Antworte kurz – oft reichen ein paar Wörter.',
    examples: 'Why is Mrs Kwan going to use her wheelchair? = Warum wird Mrs Kwan ihren Rollstuhl benutzen?\nWhere are they going to meet the friends? – At City Hall.',
    mistakes: '',
    exercises: [
      '@ kwan = die Kwans (S. 38–39)',
      '@ day = ihr Tag in London (S. 42)',
      '@ facts = London facts (S. 34–35)',
      '@ sights = Sehenswürdigkeiten (S. 36–37)',
      '! Lies den Text. Richtig oder falsch? Schreib true oder false.',
      'lesen [kwan] | ' + KWAN + ' >> Mrs Kwan is going to walk all day. | false ; wrong ; falsch | Sie benutzt heute ihren Rollstuhl.',
      'lesen [kwan] | ' + KWAN + ' >> The Tube station in Covent Garden has wheelchair access. | false ; wrong ; falsch',
      'lesen [kwan] | ' + KWAN + ' >> Money is tight this month. | true ; right ; richtig',
      'lesen [day] | ' + DAY + ' >> For the Kwans, Hyde Park is more relaxing than St James\'s Park. | false ; wrong ; falsch | Es ist umgekehrt: St James\'s Park is more relaxing.',
      'lesen [day] | ' + DAY + ' >> The prices are higher than in Greenwich. | true ; right ; richtig',
      'lesen [facts] | ' + FACTS + ' >> Big Ben is the name of the clock tower. | false ; wrong ; falsch | Big Ben ist die Glocke.',
      'lesen [facts] | ' + FACTS + ' >> The Tube is the oldest underground train system in the world. | true ; right ; richtig',
      '! Lies den Text und antworte kurz auf Englisch.',
      'lesen [kwan] | ' + KWAN + ' >> Where does Lily want to go? | to Covent Garden and Neal\'s Yard ; to Covent Garden ; Covent Garden ; Covent Garden and Neal\'s Yard ; to Neal\'s Yard ; she wants to go to Covent Garden ; she wants to go to Covent Garden and Neal\'s Yard',
      'lesen [kwan] | ' + KWAN + ' >> Where are they going to meet the friends? | at City Hall ; City Hall ; they are going to meet the friends at City Hall ; they\'re going to meet them at City Hall',
      'lesen [day] | ' + DAY + ' >> What do they eat? | fish and chips ; they have fish and chips ; they eat fish and chips',
      'lesen [day] | ' + DAY + ' >> Why do the girls want to take a cab? | because cabs are cooler and have easy wheelchair access ; because cabs have wheelchair access ; because cabs have easy wheelchair access ; cabs are cooler and have wheelchair access ; because they are cooler and have wheelchair access ; because cabs are cooler',
      'lesen [facts] | ' + FACTS + ' >> What was London\'s Roman name? | Londinium ; it was Londinium ; the Roman name was Londinium',
      'lesen [facts] | ' + FACTS + ' >> What is the cheapest way to travel in London? | with an Oyster card ; an Oyster card ; Oyster card ; the Oyster card ; with the Oyster card',
      'lesen [sights] | ' + SIGHTS + ' >> Whose statue is in Trafalgar Square? | Lord Nelson\'s ; Lord Nelson ; Nelson ; Nelson\'s ; a statue of Lord Nelson ; the statue of Lord Nelson',
      'lesen [sights] | ' + SIGHTS + ' >> What can you find in Covent Garden? | lots of shops and street artists ; shops and street artists ; shops ; street artists ; you can find lots of shops and street artists',
      '! Hör zu und antworte kurz auf Englisch.',
      'hören [facts] | More than eight million people live in London, and you can hear over 300 languages there. >> How many languages can you hear in London? | over 300 ; more than 300 ; 300 ; over three hundred ; three hundred ; over 300 languages ; more than 300 languages',
      'hören [day] | First we went to St James\'s Park. Then we had fish and chips, and after that we saw the Tate Modern. >> What did they do first? | they went to St James\'s Park ; St James\'s Park ; to St James\'s Park ; went to St James\'s Park ; they went to the park',
      'hören [kwan] | Mum is going to use her wheelchair today, so we aren\'t going to take the Tube. >> How are they not going to travel? | by Tube ; the Tube ; by the Tube ; they aren\'t going to take the Tube ; not by Tube',
      'hören [sights] | The Tube is more than 150 years old.',
      'hören [sights] | Covent Garden is very crowded at the weekend.',
      '! Fragen zum Text: Bilde die Frage.',
      'frage [kwan] | Lily wants to meet her friends. (Who …? – frag nach her friends) | Who does Lily want to meet?',
      'frage [day] | The Kwans had fish and chips. (What …?) | What did the Kwans have?',
      'frage [facts] | London was a Roman town. (What …?) | What was London?'
    ].join('\n') });

  // ------------------------------------------------------------------ Klassenarbeit: now with the book unit (new id → applied once more)
  D.defaultTest = {
    id: 'ka2-2026-12-07-book', date: '2026-12-07', label: 'Englischarbeit Nr. 2', units: [UNIT, 'ka2-london'],
    modules: ['k6-past', 'k6-irregular', 'k6-goingto', 'k6-tenses', 'k6-compare', 'k6-qwords', 'k6-directions', 'ka2-mudlark', 'gl2-u2-texts'],
    activeUnits: [UNIT, 'ka2-london']
  };
})(typeof window !== 'undefined' ? window : globalThis);
