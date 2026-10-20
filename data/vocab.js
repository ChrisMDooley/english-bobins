/*
 * vocab.js — Lukas's school vocabulary, built into the app (the same on every device).
 *
 * Green Line 1 (Klasse 5, 2025/26) and Green Line 2 (Klasse 6, 2026/27), unit by unit.
 * Only English/German word pairs (plus an own example sentence where useful) — no textbook text.
 * Words a parent adds in the app are stored on that device; send the lists to be added here so
 * they are on every device.
 *
 * Unit  { id, year, book, name, short, title, order }
 * Word  { id, en, de, enAlt?, deAlt?, type?, unit, year, page?, example?, tags? }
 *   en:  "(to) go" = "go" and "to go" are both right · "a / an" alternatives with " ; "
 *        "sb." / "sth." may be typed or left out
 */
(function (root) {
  'use strict';
  root.EB = root.EB || {};
  root.EB.data = root.EB.data || {};

  var units = [
    { id: 'gl2-irr', year: 6, book: 'Green Line 2', name: 'Unregelmäßige Verben', short: 'Verben', title: 'Grammar S. 206–207', order: 900 }
  ];
  var words = [];

  // the irregular verbs from the grammar pages, as vocabulary (German → English infinitive)
  ((root.EB.data.irregular) || []).forEach(function (v) {
    words.push({ id: 'gl2-irr-' + v.id, en: '(to) ' + v.inf, de: v.de, type: 'verb', unit: 'gl2-irr', year: 6, page: v.id < 'hu' ? '206' : '207',
                 note: v.inf + ' – ' + v.past.join(' / ') + ' – ' + v.pp.join(' / '), tags: ['unregelmäßig'] });
  });

  root.EB.data.vocab = { src: 'book', units: units, words: words };
})(typeof window !== 'undefined' ? window : globalThis);
