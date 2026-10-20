/*
 * ui.js — small DOM helpers shared by all screens.
 */
(function (root) {
  'use strict';
  var EB = root.EB;

  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    attrs = attrs || {};
    for (var k in attrs) {
      var v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'rich') e.appendChild(rich(v));
      else if (k === 'value') e.value = v;
      else if (k.indexOf('on') === 0 && typeof v === 'function') e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    (kids || []).forEach(function (c) { if (c != null && c !== false) e.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c); });
    return e;
  }
  // tiny markup: **bold**, *italic*, ~~struck~~, «word» (an English word, highlighted)
  function rich(text) {
    var frag = document.createDocumentFragment(), re = /\*\*([^*]+)\*\*|\*([^*]+)\*|~~([^~]+)~~|«([^»]+)»/g, last = 0, m, s = String(text == null ? '' : text);
    while ((m = re.exec(s))) {
      if (m.index > last) frag.appendChild(document.createTextNode(s.slice(last, m.index)));
      if (m[1]) frag.appendChild(h('strong', { text: m[1] }));
      else if (m[2]) frag.appendChild(h('em', { text: m[2] }));
      else if (m[3]) frag.appendChild(h('s', { text: m[3] }));
      else frag.appendChild(h('span', { class: 'w', text: m[4] }));
      last = re.lastIndex;
    }
    if (last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
    return frag;
  }
  // an explanation text: lines, "- " bullets
  function textBlock(text) {
    var box = h('div', { class: 'textblock' }), ul = null;
    String(text || '').split(/\n/).forEach(function (line) {
      if (/^\s*- /.test(line)) { if (!ul) { ul = h('ul'); box.appendChild(ul); } ul.appendChild(h('li', { rich: line.replace(/^\s*- /, '') })); }
      else if (line.trim()) { ul = null; box.appendChild(h('p', { rich: line })); }
    });
    return box;
  }

  var settingsRef = null;
  function speak(text, lang) {
    var st = settingsRef ? settingsRef() : {};
    return EB.speech.speak(text, { lang: lang || 'en', rate: st.rate || 0.85, voice: st.voice || '' });
  }
  function sayButton(getText, lang, label) {
    if (!EB.speech.supported) return null;
    return h('button', { class: 'btn soft say', type: 'button', 'aria-label': label || 'Vorlesen',
      onclick: function () { speak(typeof getText === 'function' ? getText() : getText, lang); } }, [label || '🔊']);
  }
  function robinSays(robinEl, text, cls) { return h('div', { class: 'robin-says ' + (cls || '') }, [robinEl, h('p', { class: 'bubble', rich: text })]); }
  function coin(size) { var c = h('span', { class: 'eb-coin', 'aria-hidden': 'true' }); if (size) c.style.width = c.style.height = size + 'px'; return c; }
  function coinFloat(anchor, n) {
    if (!anchor || !anchor.getBoundingClientRect || !n) return;
    var r = anchor.getBoundingClientRect(), f = h('div', { class: 'coin-float' }, [coin(22), h('span', { text: '+' + n })]);
    f.style.left = Math.round(r.left + r.width / 2) + 'px'; f.style.top = Math.round(r.top + 6) + 'px';
    document.body.appendChild(f); setTimeout(function () { f.remove(); }, 1100);
  }
  function modal(title, body, opts) {
    opts = opts || {};
    var close, box = h('div', { class: 'modal ' + (opts.cls || ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': title }, [
      h('div', { class: 'modal-head' }, [h('h2', { text: title }), h('button', { class: 'link modal-x', type: 'button', 'aria-label': 'Schließen', text: '✕', onclick: function () { close(); } })]),
      body]);
    var back = h('div', { class: 'modal-back', onclick: function (e) { if (e.target === back) close(); } }, [box]);
    close = function () { back.remove(); document.removeEventListener('keydown', esc); if (opts.onClose) opts.onClose(); };
    function esc(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', esc);
    document.body.appendChild(back);
    var f = box.querySelector('input, textarea, select, .btn.primary') || box.querySelector('button');
    if (f) setTimeout(function () { f.focus(); }, 30);
    return close;
  }
  function confirmBox(title, text, yes, onYes, danger) {
    var close = modal(title, h('div', {}, [h('p', { rich: text }), h('div', { class: 'row' }, [
      h('button', { class: 'btn ' + (danger ? 'danger' : 'primary'), type: 'button', text: yes, onclick: function () { close(); onYes(); } }),
      h('button', { class: 'btn soft', type: 'button', text: 'Abbrechen', onclick: function () { close(); } })])]));
  }
  function bar(v, cls) { var pct = Math.round(Math.max(0, Math.min(1, v || 0)) * 100); return h('span', { class: 'mbar ' + (cls || ''), title: pct + ' %' }, [h('span', { class: 'mbar-fill', style: 'width:' + pct + '%' })]); }
  // stacked bar of the four stages
  function stageBar(c) {
    var tot = c.total || 1, wrap = h('span', { class: 'sbar', role: 'img', 'aria-label': c.sicher + ' sicher, ' + c.fast + ' fast sicher, ' + c.lernt + ' werden gelernt, ' + c.neu + ' neu' });
    ['sicher', 'fast', 'lernt', 'neu'].forEach(function (k) { if (c[k]) wrap.appendChild(h('span', { class: 'sb-' + k, style: 'width:' + (100 * c[k] / tot) + '%' })); });
    return wrap;
  }
  function stageChip(stage) { return h('span', { class: 'stage st-' + stage, text: EB.srs.stageLabel(stage) }); }
  function download(name, text, type) {
    var blob = new Blob([text], { type: type || 'application/json' }), a = h('a', { href: URL.createObjectURL(blob), download: name });
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function readFile(accept, cb) {
    var inp = h('input', { type: 'file', accept: accept, style: 'display:none' });
    inp.addEventListener('change', function () {
      var f = inp.files && inp.files[0]; if (!f) return;
      var r = new FileReader(); r.onload = function () { cb(String(r.result), f.name); inp.remove(); }; r.readAsText(f, 'utf-8');
    });
    document.body.appendChild(inp); inp.click();
  }
  function input(attrs) {
    return h('input', Object.assign({ type: 'text', autocomplete: 'off', autocorrect: 'off', autocapitalize: 'off', spellcheck: 'false' }, attrs || {}));
  }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function diffView(segs) {
    return h('span', { class: 'diff' }, segs.map(function (s) {
      if (s.k === 'gap') return h('span', { class: 'd-gap', 'aria-label': 'hier fehlt etwas', text: '‸' });
      return h('span', { class: 'd-' + s.k, text: s.s });
    }));
  }

  EB.ui = { h: h, rich: rich, textBlock: textBlock, speak: speak, sayButton: sayButton, robinSays: robinSays, coin: coin, coinFloat: coinFloat,
            modal: modal, confirm: confirmBox, bar: bar, stageBar: stageBar, stageChip: stageChip, download: download, readFile: readFile, input: input,
            plural: plural, diffView: diffView, useSettings: function (fn) { settingsRef = fn; } };
})(typeof window !== 'undefined' ? window : globalThis);
