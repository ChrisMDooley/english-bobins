/*
 * speech.js — text-to-speech via the browser (Web Speech API): English words in a British voice,
 * German prompts in a German voice. Voices differ per device; we rank them and a parent can pick one.
 * Nothing is sent anywhere by the app (some systems use online voices themselves).
 */
(function (root) {
  'use strict';
  var synth = root.speechSynthesis;
  var voices = { en: [], de: [] }, listeners = [];

  function score(v, lang) {
    var n = v.name.toLowerCase(), s = 0;
    if (lang === 'en') {
      if (/^en[-_]gb/i.test(v.lang)) s += 30; else if (/^en[-_](ie|au|nz)/i.test(v.lang)) s += 8; else if (/^en/i.test(v.lang)) s += 4;
      if (/daniel|serena|kate|arthur|martha|stephanie|oliver|libby|sonia|ryan|maisie|thomas|hazel|george|susan/.test(n)) s += 10;
      if (/uk english|british/.test(n)) s += 12;
    } else {
      if (/^de[-_]de/i.test(v.lang)) s += 20; else if (/^de/i.test(v.lang)) s += 10;
      if (/anna|petra|markus|helena|katja|conrad|amala|seraphina|florian/.test(n)) s += 10;
    }
    if (/natural|neural|online/.test(n)) s += 30;
    if (/premium|enhanced|erweitert|verbessert/.test(n)) s += 25;
    if (/google/.test(n)) s += 15;
    if (/eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley|oma|opa|bubbles|bells|boing|jester|whisper|zarvox|trinoids|albert|bahh|cellos|organ|superstar|wobble|junior|fred|ralph|kathy/.test(n)) s -= 40;
    if (v.localService) s += 2;
    return s;
  }
  function refresh() {
    if (!synth) return;
    var all = synth.getVoices() || [];
    ['en', 'de'].forEach(function (lang) {
      voices[lang] = all.filter(function (v) { return new RegExp('^' + lang, 'i').test(v.lang); }).sort(function (a, b) { return score(b, lang) - score(a, lang); });
    });
    listeners.forEach(function (fn) { try { fn(voices); } catch (e) { /* ignore */ } });
  }
  if (synth) {
    refresh();
    if ('onvoiceschanged' in synth) synth.addEventListener('voiceschanged', refresh);
    var tries = 0, poll = setInterval(function () { tries++; refresh(); if (voices.en.length || tries > 20) clearInterval(poll); }, 250);
  }
  function pick(lang, name) {
    var list = voices[lang] || [];
    if (name) for (var i = 0; i < list.length; i++) if (list[i].name === name) return list[i];
    return list[0] || null;
  }
  var current = null;   // Chrome can garbage-collect an utterance mid-sentence
  function speak(text, opts) {
    opts = opts || {};
    var lang = opts.lang || 'en';
    return new Promise(function (resolve) {
      if (!synth || !text) { resolve(false); return; }
      synth.cancel();
      var u = new root.SpeechSynthesisUtterance(String(text));
      var v = pick(lang, lang === 'en' ? opts.voice : opts.voiceDe);
      if (v) u.voice = v;
      u.lang = v ? v.lang : (lang === 'en' ? 'en-GB' : 'de-DE');
      u.rate = opts.rate || 0.85; u.pitch = 1;
      u.onend = function () { resolve(true); };
      u.onerror = function () { resolve(false); };
      current = u;
      setTimeout(function () { synth.speak(u); }, 60);
    });
  }
  function stop() { if (synth) synth.cancel(); }
  root.EB = root.EB || {};
  root.EB.speechOk = !!synth;
  root.EB.speech = { supported: !!synth, speak: speak, stop: stop, voices: function (lang) { return (voices[lang || 'en'] || []).slice(); },
                     onVoices: function (fn) { listeners.push(fn); if (voices.en.length) fn(voices); }, pick: pick, _current: function () { return current; } };
})(typeof window !== 'undefined' ? window : globalThis);
