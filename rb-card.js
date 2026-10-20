/*
 * rb-card.js — the one line Robin's Bobins shows on English-Bobins' card
 * ("Noch 9 Tage bis zur Klassenarbeit · heute 14 Aufgaben"). Loaded by the Robin's Bobins home page
 * (and the guest start page) from ../english-bobins/rb-card.js; reads only this app's own storage.
 */
(function (root) {
  'use strict';
  function days(d) {
    var t = new Date(d + 'T08:00:00'), n = new Date();
    return Math.round((Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()) - Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())) / 86400000);
  }
  root.RBEnglish = {
    cardInfo: function (childId) {
      var doc = null;
      try { doc = JSON.parse(root.localStorage.getItem('english-bobins:' + childId) || 'null'); } catch (e) { doc = null; }
      var parts = [], today = new Date().toDateString();
      var t = doc && doc.test;
      if (t && t.date) {
        var d = days(t.date), label = t.label || 'Klassenarbeit';
        if (d > 1) parts.push('Noch ' + d + ' Tage bis zur ' + label); else if (d === 1) parts.push('Morgen: ' + label); else if (d === 0) parts.push('Heute: ' + label);
      }
      var n = doc ? (doc.log || []).filter(function (e) { return new Date(e.t).toDateString() === today; }).length : 0;
      if (n) parts.push('heute ' + n + (n === 1 ? ' Aufgabe' : ' Aufgaben'));
      return parts.join(' · ') || 'Vokabeln, Rechtschreibung & Grammatik';
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
