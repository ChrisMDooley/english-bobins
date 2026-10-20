/*
 * text.js — string helpers for English-Bobins. No DOM.
 *
 * norm()            what we compare: trimmed, one space, straight apostrophes, lower case
 * align(a, b)       Damerau-Levenshtein distance with the edit steps (for hints and the coloured diff)
 * sound(word)       a rough English "sounds like" key (Metaphone-style), to tell a spelling slip
 *                   ("frend") from a different word
 * expandShort(s)    all full forms of a sentence with short forms (don't → do not, he's → he is / he has)
 * neighbours(a, b)  true when two letters sit next to each other on a German (QWERTZ) keyboard
 */
(function (root) {
  'use strict';

  function clean(s) {
    return String(s == null ? '' : s)
      .replace(/[‘’‛′´`]/g, "'")
      .replace(/[“”„]/g, '"')
      .replace(/[‐-―]/g, '-')
      .replace(/ /g, ' ')
      .replace(/\s+/g, ' ').trim();
  }
  // lower case, no final full stop / ! / ? (questions are checked separately)
  function norm(s) { return clean(s).toLowerCase().replace(/\s*[.!?]+$/, '').replace(/\s+([,;:])/g, '$1'); }
  function letters(s) { return norm(s).replace(/[^a-zäöüß']/g, ''); }

  // ---------------------------------------------------------------- edit distance with steps
  // ops: {op:'=',a,b} same · {op:'s',a,b} other letter · {op:'d',a} letter only in a (extra in input)
  //      {op:'i',b} letter only in b (missing in input) · {op:'t',a:'ei',b:'ie'} two letters swapped
  function align(a, b) {
    if (!Array.isArray(a)) a = String(a);
    if (!Array.isArray(b)) b = String(b);
    var n = a.length, m = b.length, d = [], i, j;
    for (i = 0; i <= n; i++) { d.push(new Array(m + 1)); d[i][0] = i; }
    for (j = 0; j <= m; j++) d[0][j] = j;
    for (i = 1; i <= n; i++) for (j = 1; j <= m; j++) {
      var c = a[i - 1] === b[j - 1] ? 0 : 1;
      var v = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1] && a[i - 1] !== a[i - 2]) v = Math.min(v, d[i - 2][j - 2] + 1);
      d[i][j] = v;
    }
    var ops = [];
    i = n; j = m;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && a[i - 1] === b[j - 1] && d[i][j] === d[i - 1][j - 1]) { ops.push({ op: '=', a: a[i - 1], b: b[j - 1], i: i - 1, j: j - 1 }); i--; j--; }
      else if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1] && a[i - 1] !== a[i - 2] && d[i][j] === d[i - 2][j - 2] + 1) { ops.push({ op: 't', a: Array.isArray(a) ? [a[i - 2], a[i - 1]] : a[i - 2] + a[i - 1], b: Array.isArray(b) ? [b[j - 2], b[j - 1]] : b[j - 2] + b[j - 1], i: i - 2, j: j - 2 }); i -= 2; j -= 2; }
      else if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + 1) { ops.push({ op: 's', a: a[i - 1], b: b[j - 1], i: i - 1, j: j - 1 }); i--; j--; }
      else if (j > 0 && d[i][j] === d[i][j - 1] + 1) { ops.push({ op: 'i', b: b[j - 1], i: i, j: j - 1 }); j--; }
      else { ops.push({ op: 'd', a: a[i - 1], i: i - 1, j: j }); i--; }
    }
    ops.reverse();
    return { dist: d[n][m], ops: ops };
  }
  function dist(a, b) { return align(a, b).dist; }

  // ---------------------------------------------------------------- keyboard (QWERTZ)
  var ROWS = ['1234567890ß', 'qwertzuiopü', 'asdfghjklöä', 'yxcvbnm,.-'];
  var POS = {};
  ROWS.forEach(function (r, y) { for (var x = 0; x < r.length; x++) POS[r[x]] = [x + y * 0.4, y]; });
  function neighbours(a, b) {
    var p = POS[a], q = POS[b];
    if (!p || !q || a === b) return false;
    return Math.abs(p[1] - q[1]) <= 1 && Math.abs(p[0] - q[0]) <= 1.05;
  }

  // ---------------------------------------------------------------- sounds-like key
  function sound(w) {
    w = String(w).toLowerCase().replace(/[^a-z]/g, '');
    if (!w) return '';
    w = w.replace(/^kn|^gn|^pn|^wr/, function (m) { return m[1]; })
         .replace(/^x/, 's').replace(/mb$/, 'm')
         .replace(/(.)\1+/g, '$1');                         // doubled letters sound single
    var out = '', i, c, nx;
    for (i = 0; i < w.length; i++) {
      c = w[i]; nx = w[i + 1] || '';
      if ('aeiouy'.indexOf(c) >= 0) { if (i === 0) out += 'A'; continue; }
      switch (c) {
        case 'c': out += (nx === 'h') ? 'X' : ('eiy'.indexOf(nx) >= 0 ? 'S' : 'K'); if (nx === 'h' || nx === 'k') i++; break;
        case 'k': case 'q': out += 'K'; break;
        case 'g': if (nx === 'h') { i++; if (i + 1 >= w.length || 'aeiou'.indexOf(w[i + 1]) < 0) { if (w.slice(i - 3, i + 1) === 'ough' && /enough|rough|tough/.test(w)) out += 'F'; break; } out += 'K'; }
                  else out += ('eiy'.indexOf(nx) >= 0 ? 'J' : 'K'); break;
        case 'j': out += 'J'; break;
        case 'p': if (nx === 'h') { out += 'F'; i++; } else out += 'P'; break;
        case 'f': case 'v': out += 'F'; break;
        case 's': if (nx === 'h') { out += 'X'; i++; } else out += 'S'; break;
        case 'z': out += 'S'; break;
        case 'x': out += 'KS'; break;
        case 't': if (nx === 'h') { out += '0'; i++; } else if (w.slice(i, i + 3) === 'tio') out += 'X'; else out += 'T'; break;
        case 'd': out += 'T'; break;
        case 'b': out += 'P'; break;
        case 'w': if ('aeiou'.indexOf(nx) >= 0) out += 'W'; break;
        case 'h': if ('aeiou'.indexOf(nx) >= 0 && (i === 0 || 'aeiou'.indexOf(w[i - 1]) < 0)) out += 'H'; break;
        case 'l': case 'm': case 'n': case 'r': out += c.toUpperCase(); break;
        default: out += c.toUpperCase();
      }
    }
    return out.replace(/(.)\1+/g, '$1');
  }

  // ---------------------------------------------------------------- short forms
  var SHORT = {
    "can't": ['can not'], "cannot": ['can not'], "won't": ['will not'], "shan't": ['shall not'], "ain't": ['am not', 'is not', 'are not'],
    "i'm": ['i am'], "let's": ['let us']
  };
  function wordForms(t) {
    if (SHORT[t]) return SHORT[t];
    var m;
    if ((m = /^(.+)n't$/.exec(t))) return [m[1] + ' not'];
    if ((m = /^(.+)'re$/.exec(t))) return [m[1] + ' are'];
    if ((m = /^(.+)'ve$/.exec(t))) return [m[1] + ' have'];
    if ((m = /^(.+)'ll$/.exec(t))) return [m[1] + ' will'];
    if ((m = /^(.+)'d$/.exec(t))) return [m[1] + ' would', m[1] + ' had'];
    if ((m = /^(he|she|it|that|what|where|who|there|here|how|this|everything|nobody|everybody|somebody)'s$/.exec(t))) return [m[1] + ' is', m[1] + ' has', t];
    return [t];
  }
  // all full forms of s (already norm()ed); bounded
  function expandShort(s) {
    var toks = s.split(' '), outs = [''];
    for (var k = 0; k < toks.length; k++) {
      var f = wordForms(toks[k]), next = [];
      for (var a = 0; a < outs.length && next.length < 32; a++) for (var b = 0; b < f.length; b++) next.push(outs[a] ? outs[a] + ' ' + f[b] : f[b]);
      outs = next;
    }
    return outs;
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function uid(prefix) { return (prefix || 'x') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8); }
  function dayKey(t) { var d = new Date(t == null ? Date.now() : t); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function shuffle(arr, rnd) {
    rnd = rnd || Math.random;
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  // small seeded random (tests, reproducible sessions)
  function rng(seed) { var s = (seed >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

  root.EB = root.EB || {};
  root.EB.text = { clean: clean, norm: norm, letters: letters, align: align, dist: dist, neighbours: neighbours, sound: sound,
                   expandShort: expandShort, esc: esc, uid: uid, dayKey: dayKey, shuffle: shuffle, rng: rng };
})(typeof window !== 'undefined' ? window : globalThis);
