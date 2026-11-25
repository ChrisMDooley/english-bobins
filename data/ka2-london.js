/*
 * ka2-london.js — package for Lukas's Englischarbeit Nr. 2 (7.12.2026), from the topic list in his exercise book:
 *   simple past (G1) · going to future (G2) · all tenses (simple present, present progressive) ·
 *   comparison of adjectives (G3) · questions with question words · telling the way (dialogue) ·
 *   reading, writing, listening · Unit 2: London and its sights, story "I'm a mudlark".
 *
 * Everything here is written for this app (own words, own sentences, own mini-story about a mudlark).
 * It is NOT the Klett vocabulary list — when the Unit 2 list arrives it is added as its own unit and
 * words that are in both share one learning history.
 *
 * Also sets a built-in Klassenarbeit (applied once per device, then the parent's settings win).
 */
(function (root) {
  'use strict';
  root.EB = root.EB || {};
  var D = root.EB.data = root.EB.data || {};
  var UNIT = 'ka2-london';

  // ------------------------------------------------------------------ vocabulary
  var unit = { id: UNIT, year: 6, book: 'Eigene Liste', name: 'London & Weg erklären', short: 'London', title: 'Englischarbeit Nr. 2 – London', order: 920 };
  var W = [
    // London and its sights
    ['sight', 'Sehenswürdigkeit', 'noun', 'Big Ben is one of the most famous sights in London.'],
    ['(to) go sightseeing', 'Sehenswürdigkeiten besichtigen', 'verb', 'On Saturday we went sightseeing in London.', { deAlt: ['eine Besichtigungstour machen'] }],
    ['capital', 'Hauptstadt', 'noun', 'London is the capital of the United Kingdom.'],
    ['the Thames', 'die Themse', 'noun', 'Tower Bridge goes over the Thames.', { enAlt: ['Thames', 'the River Thames', 'River Thames'], deAlt: ['Themse'] }],
    ['bridge', 'Brücke', 'noun', 'We walked across the bridge.'],
    ['river bank', 'Flussufer', 'noun', 'There were lots of people on the river bank.', { enAlt: ['riverbank'], deAlt: ['Ufer'] }],
    ['tower', 'Turm', 'noun', 'The Tower of London is more than 900 years old.'],
    ['palace', 'Palast; Schloss', 'noun', 'The King lives in Buckingham Palace.'],
    ['king', 'König', 'noun', 'The King of England lives in London.'],
    ['queen', 'Königin', 'noun', 'The Queen had lots of dogs.'],
    ['cathedral', 'Kathedrale; Dom', 'noun', "St Paul's Cathedral has a big dome."],
    ['square', 'Platz', 'noun', 'There are lots of pigeons in Trafalgar Square.', { deAlt: ['Platz in der Stadt'] }],
    ['the Underground', 'die (Londoner) U-Bahn', 'noun', 'We took the Underground to Oxford Circus.', { enAlt: ['the Tube', 'Underground', 'Tube'], deAlt: ['U-Bahn'] }],
    ['double-decker', 'Doppeldecker(bus)', 'noun', 'We sat at the top of a red double-decker.', { enAlt: ['double-decker bus', 'double decker'], deAlt: ['Doppeldecker', 'Doppeldeckerbus'] }],
    ['tourist', 'Tourist; Touristin', 'noun', 'In summer London is full of tourists.'],
    ['guide', 'Fremdenführer; Fremdenführerin', 'noun', 'Our guide told us a lot about the Tower.', { deAlt: ['Führer', 'Führerin'] }],
    ['famous', 'berühmt', 'adj', 'Tower Bridge is very famous.'],
    ['crowded', 'überfüllt; voll', 'adj', 'The Underground is very crowded in the morning.'],
    ['history', 'Geschichte (früher)', 'noun', 'London has a long history.', { deAlt: ['Geschichte'] }],
    ['view', 'Aussicht; Blick', 'noun', 'From the London Eye you have a great view of the city.'],
    ['ticket', 'Eintrittskarte; Fahrkarte', 'noun', 'How much is a ticket for the London Eye?', { deAlt: ['Karte', 'Ticket'] }],
    // the mudlark story
    ['mudlark', 'Schlammsucher; Schlammsucherin (sucht am Themseufer nach alten Dingen)', 'noun', 'A mudlark looks for old things in the mud of the Thames.', { deAlt: ['Schlammsammler', 'Schlammsammlerin'] }],
    ['mud', 'Schlamm', 'noun', 'My shoes were full of mud.', { deAlt: ['Matsch'] }],
    ['low tide', 'Ebbe', 'noun', 'At low tide you can walk on the river bank.'],
    ['high tide', 'Flut', 'noun', 'At high tide the water comes back.'],
    ['treasure', 'Schatz', 'noun', 'Mudlarks look for treasure.'],
    ['coin', 'Münze', 'noun', 'I found an old coin in the mud.'],
    ['(to) dig', 'graben', 'verb', 'Please don\'t dig in the mud.', { note: 'dig – dug – dug', tags: ['unregelmäßig'] }],
    ['(to) look for', 'suchen', 'verb', 'I am looking for my keys.', { deAlt: ['suchen nach'] }],
    ['dirty', 'schmutzig; dreckig', 'adj', 'After two hours our hands were very dirty.'],
    ['glove', 'Handschuh', 'noun', 'Always wear gloves when you are mudlarking.'],
    ['(to) be careful', 'vorsichtig sein', 'verb', 'Be careful! The mud is slippery.', { enAlt: ['be careful', 'careful'] }],
    ['(to) belong to', 'gehören (zu)', 'verb', 'This old pipe belonged to a sailor.', { deAlt: ['gehören'] }],
    ['(to) touch', 'berühren; anfassen', 'verb', 'Don\'t touch it with your hands!'],
    // telling the way
    ['Excuse me.', 'Entschuldigung. (um jemanden anzusprechen)', 'phrase', 'Excuse me, how do I get to the station?', { deAlt: ['Entschuldigung', 'Entschuldigen Sie'] }],
    ['How do I get to the station?', 'Wie komme ich zum Bahnhof?', 'phrase', '', { enAlt: ['How can I get to the station?'] }],
    ['Can you tell me the way to the museum?', 'Kannst du mir den Weg zum Museum sagen?', 'phrase', '', { deAlt: ['Können Sie mir den Weg zum Museum sagen?', 'Kannst du mir den Weg zum Museum zeigen?', 'Können Sie mir den Weg zum Museum zeigen?'], enAlt: ['Could you tell me the way to the museum?'] }],
    ['(to) turn left', 'links abbiegen', 'verb', 'Turn left at the traffic lights.'],
    ['(to) turn right', 'rechts abbiegen', 'verb', 'Turn right into Baker Street.'],
    ['(to) go straight on', 'geradeaus gehen', 'verb', 'Go straight on for two minutes.', { enAlt: ['go straight ahead', 'go straight'], deAlt: ['geradeaus'] }],
    ['(to) go along', 'entlanggehen', 'verb', 'Go along the river.', { deAlt: ['entlang gehen'] }],
    ['(to) cross', 'überqueren', 'verb', 'Cross the road at the traffic lights.', { deAlt: ['über die Straße gehen'] }],
    ['Take the second turning on the left.', 'Nimm die zweite Straße links.', 'phrase', '', { enAlt: ['Take the second street on the left.', 'Take the second road on the left.'], deAlt: ['Nehmen Sie die zweite Straße links.', 'Nimm die zweite Abzweigung links.'] }],
    ['traffic lights', 'Ampel', 'noun', 'Turn right at the traffic lights.', { enAlt: ['the traffic lights'] }],
    ['crossroads', 'Kreuzung', 'noun', 'Go straight on at the crossroads.'],
    ['corner', 'Ecke', 'noun', 'The shop is on the corner.'],
    ['on the left', 'links; auf der linken Seite', 'prep', 'The museum is on the left.'],
    ['on the right', 'rechts; auf der rechten Seite', 'prep', 'You can see the church on the right.'],
    ['opposite', 'gegenüber', 'prep', 'The bank is opposite the post office.'],
    ['next to', 'neben', 'prep', 'The café is next to the cinema.'],
    ['between', 'zwischen', 'prep', 'The station is between the hotel and the park.'],
    ['in front of', 'vor (Ort)', 'prep', 'Meet me in front of the museum.', { deAlt: ['vor'] }],
    ['behind', 'hinter', 'prep', 'The car park is behind the supermarket.'],
    ['near', 'in der Nähe von; nahe', 'prep', 'Is there a bank near here?', { deAlt: ['in der Nähe'] }],
    ['far', 'weit', 'adj', 'Is it far to the station?', { deAlt: ['weit weg'] }],
    ['map', 'Karte; Stadtplan', 'noun', 'Let\'s look at the map.', { deAlt: ['Landkarte'] }],
    ['bus stop', 'Bushaltestelle', 'noun', 'The bus stop is in front of the bank.', { deAlt: ['Haltestelle'] }],
    ['station', 'Bahnhof', 'noun', 'How do I get to the station?', { deAlt: ['Station'] }],
    ['(to) get lost', 'sich verlaufen; sich verirren', 'verb', 'We got lost in the old town.', { note: 'get – got – got', deAlt: ['verloren gehen'] }],
    ["You can't miss it.", 'Du kannst es nicht verfehlen.', 'phrase', '', { deAlt: ['Sie können es nicht verfehlen.', 'Du kannst es nicht übersehen.', 'Sie können es nicht übersehen.'], enAlt: ['You cannot miss it.'] }],
    ["It's about five minutes from here.", 'Es ist ungefähr fünf Minuten von hier.', 'phrase', '', { enAlt: ['It is about five minutes from here.', "It's about 5 minutes from here."], deAlt: ['Es sind ungefähr fünf Minuten von hier.', 'Es ist etwa fünf Minuten von hier.', 'Es sind etwa fünf Minuten von hier.'] }]
  ];
  var words = W.map(function (x, k) {
    var o = x[4] || {};
    var slug = x[0].toLowerCase().replace(/^\(to\)\s*/, '').replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
    return { id: UNIT + '-' + slug, en: x[0], de: x[1], type: x[2], example: x[3] || '', unit: UNIT, year: 6,
             enAlt: o.enAlt, deAlt: o.deAlt, note: o.note, tags: ['eigene Liste'].concat(o.tags || []) };
  });

  if (D.vocab) { D.vocab.units.push(unit); D.vocab.words = D.vocab.words.concat(words); }
  else D.vocab = { src: 'book', units: [unit], words: words };

  // ------------------------------------------------------------------ grammar
  var STORY = 'Last Saturday Mia went to the Thames with her uncle Joe. It was low tide, so they walked down to the river bank. ' +
    'The mud was cold and wet. Uncle Joe gave Mia some gloves. "Mudlarks never touch things with their bare hands," he said. ' +
    'They looked for treasure for two hours. Mia found an old clay pipe and a small coin. "This coin is more than 300 years old!" said Uncle Joe. ' +
    'Then the water came back and they went home. Next Saturday they are going to look for treasure again.';

  var modules = [
    { id: 'k6-goingto', title: 'going to future', year: 6, order: 12, level: 2, active: true, unit: 'G2',
      intro: 'Mit **going to** sagst du, was jemand **vorhat** (Pläne) oder was man **schon kommen sieht**.\n' +
        '**Form:** am / is / are + **going to** + Grundform\n- I**\'m going to visit** London. · She**\'s going to buy** a ticket. · They**\'re going to play**.\n' +
        '**Verneinung:** I**\'m not going to** … · He **isn\'t going to** … · We **aren\'t going to** …\n' +
        '**Frage:** **Are** you **going to** …? · **Is** he **going to** …? · What **are** you **going to** do?\n' +
        '**Vorhersage:** Look at the clouds! It**\'s going to rain**.\nSignalwörter: tomorrow, next week, next Saturday, tonight, this summer.',
      examples: "I'm going to visit my grandma tomorrow. = Ich werde morgen meine Oma besuchen. (Ich habe es vor.)\n" +
        "We aren't going to take the bus. = Wir werden nicht den Bus nehmen.\nWhat are you going to do next weekend? = Was hast du nächstes Wochenende vor?\n" +
        "Look at the sky – it's going to rain. = Schau den Himmel an – es wird gleich regnen.",
      mistakes: "I going to visit London. => I'm going to visit London. => Vor «going to» fehlt am / is / are.\n" +
        "She is going to visits her aunt. => She is going to visit her aunt. => Nach «going to» kommt die Grundform – ohne -s.\n" +
        "He are going to play. => He is going to play. => Bei he / she / it heißt es «is».\n" +
        "We are going visit the Tower. => We are going to visit the Tower. => «to» nicht vergessen: going TO visit.",
      exercises: [
        '@ form = am / is / are + going to + Grundform',
        '@ neg = Verneinung',
        '@ q = Fragen mit going to',
        '! Was haben sie vor? Setze die going-to-Form ein.',
        'form [form] | Next Saturday we ___ (visit) the Tower of London. | are going to visit ; \'re going to visit',
        'form [form] | I ___ (take) a lot of photos on the London Eye. | am going to take ; \'m going to take',
        'form [form] | My sister ___ (buy) a T-shirt in Camden. | is going to buy ; \'s going to buy',
        'form [form] | Tomorrow the children ___ (go) on a boat trip on the Thames. | are going to go ; \'re going to go',
        'form [form] | Look at those clouds! It ___ (rain). | is going to rain ; \'s going to rain | Wenn man etwas schon kommen sieht: going to.',
        'form [form] | Mia ___ (look) for treasure again next weekend. | is going to look ; \'s going to look',
        'lücke [form] | We are going ___ see Big Ben. | to',
        'lücke [form] | He ___ going to ride on a double-decker. | is',
        'verneinen [neg] | I am going to take the Underground. | I\'m not going to take the Underground.',
        'verneinen [neg] | Tom is going to visit the museum. | Tom isn\'t going to visit the museum.',
        'verneinen [neg] | They are going to walk across Tower Bridge. | They aren\'t going to walk across Tower Bridge.',
        'frage [q] | You are going to visit Buckingham Palace. | Are you going to visit Buckingham Palace?',
        'frage [q] | She is going to meet her friends. (Frage mit Where …?) | Where is she going to meet her friends?',
        'frage [q] | They are going to do something next weekend. (Frage mit What …?) | What are they going to do next weekend?',
        'korrigieren [form] | I going to visit my uncle in London. | I\'m going to visit my uncle in London.',
        'korrigieren [form] | She is going to buys a map. | She is going to buy a map.',
        'korrigieren [form] | We are going visit the London Eye. | We are going to visit the London Eye.',
        'übersetzen [form] | Ich werde morgen ins Museum gehen. (Plan) | I\'m going to go to the museum tomorrow. ; Tomorrow I\'m going to go to the museum. ; I\'m going to visit the museum tomorrow. ; Tomorrow I\'m going to visit the museum.',
        'übersetzen [q] | Was wirst du in London machen? | What are you going to do in London?',
        'ordnen [q] | | What are you going to see in London?',
        'ordnen [neg] | | We aren\'t going to take the bus.',
        'hören [form] | Next summer my family is going to visit London. We are going to stay in a small hotel near the Thames. >> Where are they going to stay? | in a small hotel ; in a small hotel near the Thames ; in a hotel near the Thames ; in a hotel ; near the Thames ; they are going to stay in a small hotel near the Thames ; they are going to stay in a small hotel',
        'hören [form] | I\'m going to visit the Tower tomorrow.'
      ].join('\n') },

    { id: 'k6-tenses', title: 'Alle Zeiten mischen', year: 6, order: 14, level: 3, active: true, unit: 'Klassenarbeit Nr. 2',
      intro: 'In der Arbeit kommen die Zeiten **gemischt** vor. Achte auf die **Signalwörter**:\n' +
        '- **simple present** – *immer, oft, jeden Tag*: always, often, usually, never, every day → I **play** · he **plays**\n' +
        '- **present progressive** – *jetzt gerade*: now, at the moment, Look!, Listen! → I **am playing**\n' +
        '- **simple past** – *vorbei*: yesterday, last week, two days ago, in 2020 → I **played** · I **went**\n' +
        '- **going to future** – *Plan*: tomorrow, next week, tonight → I**\'m going to play**\n' +
        'Frage dich jedes Mal: **Wann** passiert es? **Immer** – **jetzt** – **vorbei** – **geplant**?',
      examples: "Tom often takes the bus. = Tom fährt oft mit dem Bus. (immer wieder)\nLook! Tom is taking the bus. = Schau! Tom fährt gerade mit dem Bus. (jetzt)\n" +
        "Yesterday Tom took the bus. = Gestern fuhr Tom mit dem Bus. (vorbei)\nTomorrow Tom is going to take the bus. = Morgen fährt Tom mit dem Bus. (Plan)",
      mistakes: "He play football every day. => He plays football every day. => he / she / it – das s muss mit!\n" +
        "Look! The bus come. => Look! The bus is coming. => «Look!» = jetzt gerade → present progressive.\n" +
        "Yesterday I go to the zoo. => Yesterday I went to the zoo. => «yesterday» = vorbei → simple past.\n" +
        "I am play football every Saturday. => I play football every Saturday. => «every Saturday» = immer wieder → simple present, ohne am.",
      exercises: [
        '@ sp = simple present (immer, oft)',
        '@ pp = present progressive (jetzt gerade)',
        '@ past = simple past (vorbei)',
        '@ gt = going to (Plan)',
        '! Welche Zeit passt? Achte auf das Signalwort.',
        'form [sp] | My brother ___ (play) football every Saturday. | plays | «every Saturday» → simple present. he / she / it: das s!',
        'form [sp] | We usually ___ (go) to school by bus. | go',
        'form [sp] | London ___ (have) a lot of famous sights. | has',
        'form [sp] | Mia never ___ (touch) things in the mud with her hands. | touches | Nach ch und sh: -es → touches.',
        'form [pp] | Look! The tourists ___ (take) photos of Big Ben. | are taking | «Look!» → jetzt gerade: present progressive.',
        'form [pp] | Listen! Somebody ___ (sing) in the street. | is singing',
        'form [pp] | At the moment we ___ (sit) on a double-decker. | are sitting',
        'form [pp] | Be quiet! I ___ (read) the map. | am reading ; \'m reading',
        'form [past] | Last summer we ___ (visit) London. | visited',
        'form [past] | Two days ago Mia ___ (find) an old coin. | found',
        'form [past] | Yesterday we ___ (take) the Underground. | took',
        'form [past] | In 1666 a big fire ___ (destroy) many houses in London. | destroyed',
        'form [gt] | Tomorrow we ___ (walk) across Tower Bridge. | are going to walk ; \'re going to walk',
        'form [gt] | Next week my dad ___ (show) me the Houses of Parliament. | is going to show ; \'s going to show',
        '! Gemischt: Lies den ganzen Satz, bevor du schreibst.',
        'form [past] | Yesterday it ___ (rain) all day, so we ___ (go) to a museum. | rained went | Schreib beide Formen mit Leerzeichen.',
        'form [pp] | It\'s 4 o\'clock. Mum ___ (cook) dinner in the kitchen. | is cooking ; \'s cooking',
        'korrigieren [sp] | My sister go to the park every day. | My sister goes to the park every day.',
        'korrigieren [pp] | Look! The boy run to the bus stop. | Look! The boy is running to the bus stop.',
        'korrigieren [past] | Last week I see the London Eye. | Last week I saw the London Eye.',
        'korrigieren [sp] | I am going to school every day by bike. | I go to school by bike every day. ; I go to school every day by bike. ; Every day I go to school by bike.',
        'übersetzen [pp] | Schau! Der Bus kommt. | Look! The bus is coming. ; Look, the bus is coming.',
        'übersetzen [past] | Letztes Jahr haben wir London besucht. | Last year we visited London. ; We visited London last year.',
        'frage [sp] | Tom likes London. | Does Tom like London?',
        'frage [pp] | They are waiting for the bus. | Are they waiting for the bus?',
        'frage [past] | Mia found a coin. | Did Mia find a coin?',
        'verneinen [sp] | He lives in London. | He doesn\'t live in London.',
        'verneinen [past] | We took the bus. | We didn\'t take the bus.'
      ].join('\n') },

    { id: 'k6-qwords', title: 'Fragen mit Fragewörtern', year: 6, order: 35, level: 2, active: true, unit: 'Klassenarbeit Nr. 2',
      intro: '**Fragewörter:**\n- **who** = wer · **what** = was · **where** = wo / wohin · **when** = wann · **why** = warum\n' +
        '- **how** = wie · **which** = welche(r, s) · **whose** = wessen · **what time** = um wie viel Uhr\n' +
        '- **how much** = wie viel (nicht zählbar, Preis) · **how many** = wie viele (zählbar) · **how old** = wie alt\n' +
        '**Satzbau:** Fragewort + **Hilfsverb** + Subjekt + Verb …\n' +
        '- Where **do** you live? · Where **does** she live? · Where **did** you go?\n' +
        '- What **are** you doing? · When **are** you **going to** visit London?\n' +
        '- Mit be: Where **is** the station? · Who **was** at the door?\n' +
        '**Achtung:** Fragst du nach dem **Subjekt** (wer?), gibt es **kein do/does/did**: **Who lives** here? **Who found** the coin?',
      examples: "Where do you live? = Wo wohnst du?\nWhat did you see in London? = Was hast du in London gesehen?\n" +
        "How many sights did you visit? = Wie viele Sehenswürdigkeiten hast du besucht?\nWho found the coin? = Wer hat die Münze gefunden?",
      mistakes: "Where you live? => Where do you live? => Nach dem Fragewort fehlt do / does / did.\n" +
        "Where does she lives? => Where does she live? => Nach «does» steht die Grundform.\n" +
        "What did you saw? => What did you see? => Nach «did» steht die Grundform.\n" +
        "Who did find the coin? => Who found the coin? => Frage nach dem Subjekt (wer?): ohne did.",
      exercises: [
        '@ word = das richtige Fragewort',
        '@ aux = do / does / did / is / are',
        '@ build = ganze Fragen bilden',
        '! Setze das passende Fragewort ein.',
        'lücke [word] | ___ is the station? – It\'s next to the bank. | Where',
        'lücke [word] | ___ did you go to London? – Last summer. | When',
        'lücke [word] | ___ is your favourite sight? – Tower Bridge. | What ; Which',
        'lücke [word] | ___ are you crying? – Because I lost my ticket. | Why',
        'lücke [word] | ___ old is Big Ben? – More than 160 years. | How',
        'lücke [word] | ___ many people live in London? – About nine million. | How',
        'lücke [word] | ___ much is a ticket for the London Eye? – About 30 pounds. | How',
        'lücke [word] | ___ found the coin? – Mia did. | Who',
        'lücke [word] | ___ bag is this? – It\'s Tom\'s. | Whose',
        'lücke [word] | ___ time does the museum open? – At ten o\'clock. | What',
        'lücke [word] | ___ do you get to school? – By bus. | How',
        '! Setze do, does, did, is oder are ein.',
        'lücke [aux] | Where ___ your grandparents live? | do',
        'lücke [aux] | What ___ Mia find in the mud? (gestern) | did',
        'lücke [aux] | When ___ the museum close? (jeden Tag) | does',
        'lücke [aux] | What ___ you doing at the moment? | are',
        'lücke [aux] | Where ___ the nearest bus stop? | is',
        'lücke [aux] | What ___ you going to do tomorrow? | are',
        '! Frag nach dem unterstrichenen Teil – hier in Klammern.',
        'frage [build] | Tom lives in London. (Where …?) | Where does Tom live?',
        'frage [build] | They visited the Tower yesterday. (What …?) | What did they visit yesterday?',
        'frage [build] | The museum opens at ten. (When …?) | When does the museum open? ; What time does the museum open?',
        'frage [build] | We are going to see a musical. (What …?) | What are you going to see? ; What are we going to see?',
        'frage [build] | Mia is looking for treasure. (What …?) | What is Mia looking for?',
        'frage [build] | Uncle Joe gave Mia some gloves. (Who …? – nach dem Subjekt) | Who gave Mia some gloves?',
        'frage [build] | She went to London by train. (How …?) | How did she go to London?',
        'korrigieren [aux] | Where you live? | Where do you live?',
        'korrigieren [aux] | What did you saw in London? | What did you see in London?',
        'korrigieren [aux] | Where does she lives? | Where does she live?',
        'korrigieren [build] | Who did find the old pipe? | Who found the old pipe?',
        'übersetzen [build] | Wo ist die nächste U-Bahn-Station? | Where is the nearest Underground station? ; Where is the nearest Tube station? ; Where\'s the nearest Underground station? ; Where\'s the nearest Tube station?',
        'übersetzen [build] | Wie viele Brücken hast du gesehen? | How many bridges did you see?',
        'ordnen [build] | | Why did you go to London?',
        'ordnen [build] | | How much is the ticket?'
      ].join('\n') },

    { id: 'k6-directions', title: 'Den Weg erklären (Dialog)', year: 6, order: 60, level: 2, active: true, unit: 'Unit 2',
      intro: '**Nach dem Weg fragen** – immer höflich:\n- **Excuse me**, how do I get to the station?\n- Excuse me, can you tell me the way to the museum, please?\n- Is there a bank near here?\n' +
        '**Den Weg erklären** (Befehlsform = Grundform):\n- **Go straight on.** · **Go along** King Street. · **Turn left / right** into Baker Street.\n' +
        '- **Take the first / second turning on the left.** · **Cross** the road. · **at the traffic lights / at the crossroads**\n' +
        '**Wo ist es?** It\'s **on the left / on the right** · **next to** · **opposite** · **between** … **and** … · **in front of** · **behind** · **on the corner**\n' +
        '**Zum Schluss:** It\'s about five minutes from here. · You can\'t miss it. – **Thank you!** – **You\'re welcome.**',
      examples: "Excuse me, how do I get to the station? = Entschuldigung, wie komme ich zum Bahnhof?\n" +
        "Go straight on and turn left at the traffic lights. = Geh geradeaus und bieg an der Ampel links ab.\n" +
        "The museum is opposite the church. = Das Museum ist gegenüber der Kirche.\nYou can't miss it. = Du kannst es nicht verfehlen.",
      mistakes: "Turn on the left. => Turn left. => Beim Abbiegen: turn left / turn right – ohne «on the».\n" +
        "The bank is opposite of the church. => The bank is opposite the church. => «opposite» ohne «of».\n" +
        "The café is next the cinema. => The café is next to the cinema. => «next to» – das «to» gehört dazu.\n" +
        "Go straight. => Go straight on. => Im britischen Englisch: go straight on.",
      exercises: [
        '@ ask = nach dem Weg fragen',
        '@ tell = den Weg erklären',
        '@ where = wo ist es? (Präpositionen)',
        '! Ergänze den Dialog.',
        'lücke [ask] | ___ me, how do I get to the station? | Excuse',
        'lücke [ask] | How do I ___ to the British Museum? | get',
        'lücke [ask] | Can you tell me the ___ to Tower Bridge, please? | way',
        'lücke [ask] | Is there a bus stop ___ here? | near',
        'lücke [tell] | Go straight ___ and then turn left. | on',
        'lücke [tell] | ___ right at the traffic lights. | Turn',
        'lücke [tell] | Take the second ___ on the left. | turning ; street ; road',
        'lücke [tell] | ___ the road at the crossroads. | Cross',
        'lücke [tell] | Go ___ the river until you see the bridge. | along',
        'lücke [tell] | It\'s about five minutes from here. You can\'t ___ it. | miss',
        'lücke [tell] | Thank you! – You\'re ___ . | welcome',
        '! Wo ist es? Setze die richtige Präposition ein.',
        'lücke [where] | The café is ___ ___ the cinema. (neben) | next to',
        'lücke [where] | The bank is ___ the post office. (gegenüber) | opposite',
        'lücke [where] | The park is ___ the station and the hotel. (zwischen) | between',
        'lücke [where] | Meet me ___ ___ ___ the museum. (vor) | in front of',
        'lücke [where] | The car park is ___ the supermarket. (hinter) | behind',
        'lücke [where] | The museum is on the ___ . (links) | left',
        'lücke [where] | The shop is on the ___ of King Street and Baker Street. (Ecke) | corner',
        'korrigieren [tell] | Turn on the left at the traffic lights. | Turn left at the traffic lights.',
        'korrigieren [where] | The bank is opposite of the church. | The bank is opposite the church.',
        'korrigieren [where] | The café is next the cinema. | The café is next to the cinema.',
        '! Übersetze – du erklärst einem Touristen den Weg.',
        'übersetzen [ask] | Entschuldigung, wie komme ich zum Bahnhof? | Excuse me, how do I get to the station? ; Excuse me, how can I get to the station? ; Excuse me, can you tell me the way to the station?',
        'übersetzen [tell] | Geh geradeaus und bieg an der Ampel links ab. | Go straight on and turn left at the traffic lights. ; Go straight on and then turn left at the traffic lights. ; Go straight ahead and turn left at the traffic lights.',
        'übersetzen [tell] | Nimm die erste Straße rechts. | Take the first turning on the right. ; Take the first street on the right. ; Take the first road on the right. ; Take the first right.',
        'übersetzen [where] | Das Museum ist gegenüber der Kirche. | The museum is opposite the church.',
        'übersetzen [tell] | Es ist ungefähr zehn Minuten von hier. | It\'s about ten minutes from here. ; It is about ten minutes from here. ; It\'s about 10 minutes from here.',
        'ordnen [ask] | | Can you tell me the way to the station?',
        'ordnen [tell] | | Turn right at the crossroads.',
        'ordnen [where] | | The bank is between the café and the hotel.',
        '! Lies die Wegbeschreibung. Du stehst am Bahnhof.',
        'lesen [tell] | Go straight on along Station Road. At the traffic lights turn left into King Street. The museum is on the right, opposite the bank. >> Where do you turn left? | at the traffic lights ; at the lights ; you turn left at the traffic lights',
        'lesen [where] | Go straight on along Station Road. At the traffic lights turn left into King Street. The museum is on the right, opposite the bank. >> What is opposite the museum? | the bank ; a bank ; the bank is opposite the museum',
        'lesen [tell] | Take the second turning on the right. Go along the river for two minutes. The café is between the cinema and the post office. >> Where is the café? | between the cinema and the post office ; it is between the cinema and the post office ; it\'s between the cinema and the post office ; the café is between the cinema and the post office',
        'hören [tell] | Excuse me, how do I get to the station? – Go straight on and take the second turning on the left. The station is next to the big supermarket. >> Where is the station? | next to the big supermarket ; next to the supermarket ; it is next to the supermarket ; it\'s next to the supermarket ; it is next to the big supermarket ; it\'s next to the big supermarket',
        'hören [tell] | Cross the road and turn right at the crossroads. The museum is about five minutes from here. >> How far is the museum? | about five minutes ; five minutes ; about 5 minutes ; 5 minutes ; it is about five minutes from here ; it\'s about five minutes from here ; about five minutes from here',
        'hören [tell] | Turn left at the traffic lights.',
        'hören [where] | The bank is opposite the church.'
      ].join('\n') },

    { id: 'ka2-mudlark', title: 'Mia, the mudlark (Geschichte)', year: 6, order: 65, level: 2, active: true, unit: 'Unit 2',
      intro: 'Eine **eigene kleine Geschichte** über einen Mudlark (so ähnlich wie die Story in deinem Buch). Mudlarks suchen bei Ebbe im Schlamm der Themse nach alten Dingen.\n\n' +
        '*' + STORY + '*\n\n' +
        'Geschichten erzählt man im **simple past**: went, was, walked, gave, said, found, came …\nPläne am Ende: **going to** – they **are going to look** for treasure again.',
      examples: "Mia went to the Thames. = Mia ging zur Themse.\nIt was low tide. = Es war Ebbe.\nMia found an old coin. = Mia fand eine alte Münze.\nThey are going to look for treasure again. = Sie werden wieder nach Schätzen suchen.",
      mistakes: "Mia finded a coin. => Mia found a coin. => find – found – found ist unregelmäßig.\nUncle Joe gived her gloves. => Uncle Joe gave her gloves. => give – gave – given.",
      exercises: [
        '@ story = die Geschichte im simple past',
        '@ read = Leseverstehen',
        '@ listen = Hörverstehen',
        '! Erzähl die Geschichte im simple past.',
        'form [story] | Last Saturday Mia ___ (go) to the Thames with her uncle Joe. | went',
        'form [story] | It ___ (be) low tide. | was',
        'form [story] | They ___ (walk) down to the river bank. | walked',
        'form [story] | Uncle Joe ___ (give) Mia some gloves. | gave',
        'form [story] | "Never touch things with your bare hands," he ___ (say). | said',
        'form [story] | They ___ (look) for treasure for two hours. | looked',
        'form [story] | Mia ___ (find) an old clay pipe and a small coin. | found',
        'form [story] | Then the water ___ (come) back and they ___ (go) home. | came went | Schreib beide Formen mit Leerzeichen.',
        'form [story] | Next Saturday they ___ (look) for treasure again. | are going to look ; \'re going to look | «Next Saturday» = Plan → going to.',
        'frage [story] | Mia found a coin. (What …?) | What did Mia find?',
        'frage [story] | They went to the Thames. (Where …?) | Where did they go?',
        'verneinen [story] | Mia touched the things with her hands. | Mia didn\'t touch the things with her hands.',
        '! Lies die Geschichte. Richtig oder falsch? Schreib true oder false.',
        'lesen [read] | ' + STORY + ' >> Mia went to the Thames with her dad. | false ; wrong ; falsch | Sie ging mit ihrem Onkel Joe.',
        'lesen [read] | ' + STORY + ' >> It was high tide. | false ; wrong ; falsch | Es war Ebbe (low tide).',
        'lesen [read] | ' + STORY + ' >> Mia wore gloves. | true ; right ; richtig | Uncle Joe gave her some gloves.',
        'lesen [read] | ' + STORY + ' >> The coin is more than 300 years old. | true ; right ; richtig',
        '! Lies die Geschichte und antworte kurz auf Englisch.',
        'lesen [read] | ' + STORY + ' >> How long did they look for treasure? | for two hours ; two hours ; for 2 hours ; 2 hours ; they looked for treasure for two hours',
        'lesen [read] | ' + STORY + ' >> What did Mia find? | an old clay pipe and a small coin ; a clay pipe and a coin ; an old pipe and a coin ; a pipe and a coin ; she found an old clay pipe and a small coin ; she found a pipe and a coin ; an old clay pipe and a coin',
        'lesen [read] | ' + STORY + ' >> When are they going to look for treasure again? | next Saturday ; on Saturday ; next Saturday they are going to look for treasure again',
        '! Hör zu und antworte kurz auf Englisch.',
        'hören [listen] | My name is Sam. Yesterday I went mudlarking with my sister. We found three old coins and a small blue bottle. >> What did they find? | three old coins and a small blue bottle ; three coins and a bottle ; three old coins and a blue bottle ; three coins and a blue bottle ; 3 coins and a bottle ; three old coins and a bottle ; we found three old coins and a small blue bottle',
        'hören [listen] | My name is Sam. Yesterday I went mudlarking with my sister. We found three old coins and a small blue bottle. >> Who did Sam go with? | his sister ; with his sister ; with her sister ; her sister ; sam went with his sister',
        'hören [listen] | Mudlarks look for treasure at low tide.',
        'hören [listen] | Yesterday we found an old coin in the mud.'
      ].join('\n') }
  ];

  // a few listening dictations for comparison (G3) — added to the existing module
  var cmpExtra = [
    'hören [er] | The Shard is taller than Big Ben.',
    'hören [more] | The London Eye is the most famous wheel in the world. >> What is the most famous wheel in the world? | the London Eye ; London Eye ; it is the London Eye ; it\'s the London Eye',
    'form [more] | For me, the Tower is ___ (exciting) than the museum. | more exciting',
    'form [irr] | The weather in London was ___ (bad) than in Germany. | worse',
    'form [er] | Tower Bridge is one of the ___ (famous) bridges in the world. | most famous',
    'übersetzen [than] | London ist größer als Berlin. | London is bigger than Berlin. ; London is larger than Berlin.'
  ];

  D.grammar = (D.grammar || []).concat(modules);
  D.grammar.forEach(function (m) {
    if (m.id === 'k6-compare' && !m._ka2) { m.exercises = (m.exercises || '') + '\n' + cmpExtra.join('\n'); m._ka2 = true; }
  });

  // ------------------------------------------------------------------ the Klassenarbeit (applied once per device)
  D.defaultTest = {
    id: 'ka2-2026-12-07', date: '2026-12-07', label: 'Englischarbeit Nr. 2', units: [UNIT],
    modules: ['k6-past', 'k6-irregular', 'k6-goingto', 'k6-tenses', 'k6-compare', 'k6-qwords', 'k6-directions', 'ka2-mudlark'],
    activeUnits: [UNIT]
  };
})(typeof window !== 'undefined' ? window : globalThis);
