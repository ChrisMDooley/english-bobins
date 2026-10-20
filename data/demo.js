/*
 * demo.js — DEMONSTRATION vocabulary, written for this app. NOT the official Klett list.
 * It is there so the app works on the first start; switch it off in Eltern → Daten → "Demo-Wörter".
 */
(function (root) {
  'use strict';
  var U5 = 'demo-5', U6 = 'demo-6';
  root.EB = root.EB || {};
  root.EB.data = root.EB.data || {};
  root.EB.data.demo = {
    src: 'demo',
    units: [
      { id: U5, year: 5, book: 'Demo', name: 'Demo A', title: 'Alltag', order: 1 },
      { id: U6, year: 6, book: 'Demo', name: 'Demo B', title: 'Unterwegs', order: 1 }
    ],
    words: [
      { id: 'demo-friend', en: 'friend', de: 'Freund; Freundin', type: 'noun', unit: U5, year: 5, example: 'Mia is my best friend.' },
      { id: 'demo-monday', en: 'Monday', de: 'Montag', type: 'noun', unit: U5, year: 5, example: 'We have PE on Monday.' },
      { id: 'demo-knife', en: 'knife', de: 'Messer', type: 'noun', unit: U5, year: 5, example: 'Be careful with that knife!' },
      { id: 'demo-write', en: '(to) write', de: 'schreiben', type: 'verb', unit: U5, year: 5, example: 'Please write your name on the paper.' },
      { id: 'demo-shop', en: 'shop', de: 'Geschäft; Laden', type: 'noun', unit: U5, year: 5, example: 'The shop opens at nine.' },
      { id: 'demo-apple', en: 'an apple', de: 'ein Apfel', type: 'noun', unit: U5, year: 5, example: 'I eat an apple every day.' },
      { id: 'demo-colour', en: 'colour', de: 'Farbe', type: 'noun', unit: U5, year: 5, example: 'What colour is your bike?' },
      { id: 'demo-tshirt', en: 'T-shirt', de: 'T-Shirt', type: 'noun', unit: U5, year: 5, example: 'I like your new T-shirt.' },
      { id: 'demo-sorry', en: "I'm sorry.", de: 'Es tut mir leid.', type: 'phrase', unit: U5, year: 5, example: "I'm sorry, I'm late." },
      { id: 'demo-big', en: 'big', de: 'groß', type: 'adj', unit: U5, year: 5, example: 'They live in a big house.' },
      { id: 'demo-climb', en: '(to) climb', de: 'klettern', type: 'verb', unit: U5, year: 5, example: 'The cat can climb trees.' },
      { id: 'demo-kitchen', en: 'kitchen', de: 'Küche', type: 'noun', unit: U5, year: 5, example: 'Dad is cooking in the kitchen.' },
      { id: 'demo-difficult', en: 'difficult', de: 'schwierig', deAlt: ['schwer'], type: 'adj', unit: U6, year: 6, example: 'The test was really difficult.' },
      { id: 'demo-dangerous', en: 'dangerous', de: 'gefährlich', type: 'adj', unit: U6, year: 6, example: 'Swimming in the river is dangerous.' },
      { id: 'demo-holiday', en: 'holiday', de: 'Ferien; Urlaub', type: 'noun', unit: U6, year: 6, example: 'We spent our holiday in Wales.' },
      { id: 'demo-beautiful', en: 'beautiful', de: 'schön', type: 'adj', unit: U6, year: 6, example: 'What a beautiful beach!' },
      { id: 'demo-island', en: 'island', de: 'Insel', type: 'noun', unit: U6, year: 6, example: 'Skye is an island in Scotland.' },
      { id: 'demo-weather', en: 'weather', de: 'Wetter', type: 'noun', unit: U6, year: 6, example: 'The weather was great all week.' },
      { id: 'demo-journey', en: 'journey', de: 'Reise; Fahrt', type: 'noun', unit: U6, year: 6, example: 'The journey to London took five hours.' },
      { id: 'demo-afraid', en: '(to) be afraid (of)', de: 'Angst haben (vor)', type: 'phrase', unit: U6, year: 6, example: 'My little sister is afraid of spiders.' },
      { id: 'demo-castle', en: 'castle', de: 'Burg; Schloss', type: 'noun', unit: U6, year: 6, example: 'We visited an old castle on the hill.' },
      { id: 'demo-luggage', en: 'luggage', de: 'Gepäck', type: 'noun', unit: U6, year: 6, example: 'Put your luggage in the car.' },
      { id: 'demo-lookafter', en: '(to) look after sb.', de: 'auf jdn. aufpassen; sich um jdn. kümmern', type: 'phrase', unit: U6, year: 6, example: 'Can you look after my dog this weekend?' },
      { id: 'demo-large', en: 'large', de: 'groß', type: 'adj', unit: U6, year: 6, example: 'A large pizza, please.' },
      { id: 'demo-remember', en: '(to) remember', de: 'sich erinnern (an)', type: 'verb', unit: U6, year: 6, example: 'I can\'t remember his name.' },
      { id: 'demo-quiet', en: 'quiet', de: 'leise; ruhig', type: 'adj', unit: U6, year: 6, example: 'Please be quiet, the baby is sleeping.' }
    ]
  };
})(typeof window !== 'undefined' ? window : globalThis);
