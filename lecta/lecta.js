/* Lecta, l'assistente agli acquisti di Selecta Offerte (16 novembre 2026).
   Un solo file per tutte le pagine: <script src="/lecta/lecta.js" defer></script>
   - si mostra solo se GET https://api.selectaofferte.it/lecta risponde "attiva": true;
   - pulsante rotondo in basso a destra; i pulsanti della pagina con data-lecta-open lo aprono,
     quelli con data-lecta-q="domanda" lo aprono e mandano la domanda;
   - window.Lecta = { active, open({q, send}), mount(contenitore), onReady(fn) };
   - la conversazione resta solo nella pagina: niente localStorage, niente cookie;
   - anteprima: ?demo_lecta=1 (oppure window.LECTA_DEMO = true prima di questo file).
   Nessuna emoticon nell'interfaccia. */
(function(){
  'use strict';
  if (window.Lecta) return;
  var API = 'https://api.selectaofferte.it';
  var Q = new URLSearchParams(location.search);
  var DEMO = Q.get('demo_lecta') === '1' || window.LECTA_DEMO === true;
  var MAXQ = 300, WAIT = 60000, HIST = 6;
  var WAITING = ['Leggo la domanda…', 'Cerco tra le offerte di Selecta…', 'Controllo le recensioni…', 'Preparo i consigli…'];
  var ICON = '<svg class="lecta-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" d="M6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 3.5V17A2.5 2.5 0 0 1 4 14.5v-8A2.5 2.5 0 0 1 6.5 4Z"/><path fill="currentColor" d="M12 7c.2 1.85 1.65 3.3 3.5 3.5-1.85.2-3.3 1.65-3.5 3.5-.2-1.85-1.65-3.3-3.5-3.5 1.85-.2 3.3-1.65 3.5-3.5Z"/></svg>';
  var I = {
    x: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    send: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    mic: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    cam: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.7l1.3-2h5l1.3 2h1.7A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="12" cy="12.5" r="3.3" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
    up: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 11v9H4v-9zM7 11l4-7c1.5 0 2.5 1 2.2 2.6L12.6 10H18a2 2 0 0 1 2 2.3l-1.1 6A2 2 0 0 1 17 20H7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    ext: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14 5h5v5M19 5l-8 8M17 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    bell: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    cart: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 4h2.2l2.1 10.2a1.5 1.5 0 0 0 1.5 1.2h8.5a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.1" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9.5" cy="19.5" r="1.4" fill="currentColor"/><circle cx="17" cy="19.5" r="1.4" fill="currentColor"/></svg>',
    share: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="17.5" cy="6" r="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="6.5" cy="12" r="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="17.5" cy="18" r="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="m8.7 10.8 6.6-3.6M8.7 13.2l6.6 3.6" stroke="currentColor" stroke-width="1.7"/></svg>',
    copy: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="8" y="8" width="11" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M5 15V6a2 2 0 0 1 2-2h8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>'
  };

  /* ---------------------------------------------------------------- aspetto */
  var CSS = [
    '.lecta-ico{width:1.25em;height:1.25em;flex:none;display:block}',
    '.lecta-ask{display:inline-flex;align-items:center;gap:.5rem;min-height:44px;padding:0 1.15rem 0 1rem;border-radius:999px;border:1px solid #14233B;background:#14233B;color:#F4EEE2;font:600 .95rem/1 Outfit,system-ui,sans-serif;cursor:pointer;text-decoration:none;white-space:nowrap}',
    '.lecta-ask .lecta-ico{color:#D4AF6A}',
    '.lecta-ask:hover{background:#1B2C47}',
    '.lecta-ask:focus-visible,.lecta-fab:focus-visible,.lecta button:focus-visible,.lecta a:focus-visible,.lecta textarea:focus-visible,.lecta summary:focus-visible,.lecta__tbl:focus-visible{outline:2px solid #B8924A;outline-offset:2px}',
    '.lecta-ask--q{background:#FBF8F2;color:#14233B;font-weight:500;white-space:normal;text-align:left;line-height:1.3;padding:.55rem 1.1rem .55rem .9rem}',
    '.lecta-ask--q .lecta-ico{color:#8A6A2E}',
    '.lecta-fab{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:61;width:56px;height:56px;border-radius:50%;border:1px solid rgba(212,175,106,.55);background:#14233B;color:#D4AF6A;display:grid;place-items:center;cursor:pointer;box-shadow:0 10px 26px -10px rgba(10,18,30,.7);transition:bottom .2s ease,transform .2s ease}',
    '.lecta-fab .lecta-ico{width:28px;height:28px}',
    '.lecta-fab:hover{transform:translateY(-2px)}',
    '.lecta-fab[hidden],.lecta-ask[hidden],.lecta[hidden]{display:none!important}',
    '.lecta-spacer{height:0}',
    '@media (max-width:720px){.lecta-spacer{height:76px}}',
    'html.lecta-lock,html.lecta-lock body{overflow:hidden}',
    '.lecta{position:fixed;inset:0;z-index:95;overflow:hidden;display:flex;align-items:flex-end;justify-content:flex-end;padding:0 16px 16px 16px;font:400 15px/1.5 Outfit,system-ui,sans-serif;color:#14233B}',
    '.lecta__scrim{position:absolute;inset:0;background:rgba(8,14,26,.45)}',
    '.lecta__box{position:relative;display:flex;flex-direction:column;width:min(440px,100%);height:min(720px,calc(100dvh - 32px));background:#FBF8F2;border-radius:22px;overflow:hidden;box-shadow:0 30px 70px -20px rgba(8,14,26,.6)}',
    '.lecta--inline{position:static;display:block;padding:0;z-index:auto}',
    '.lecta--inline .lecta__box{width:100%;height:min(760px,calc(100dvh - 120px));min-height:520px;box-shadow:0 1px 0 rgba(20,35,59,.06),0 20px 50px -30px rgba(20,35,59,.45);border:1px solid rgba(20,35,59,.1)}',
    '@media (max-width:720px){.lecta{padding:0}.lecta__box{width:100%;height:100dvh;border-radius:0}.lecta--inline .lecta__box{height:calc(100dvh - 140px);border-radius:18px}}',
    '.lecta__head{display:flex;align-items:center;gap:12px;padding:14px 14px 12px 16px;background:#14233B;color:#F4EEE2}',
    '.lecta__logo{width:40px;height:40px;border-radius:50%;background:rgba(212,175,106,.14);color:#D4AF6A;display:grid;place-items:center;flex:none}',
    '.lecta__logo .lecta-ico{width:24px;height:24px}',
    '.lecta__who{flex:1;min-width:0}',
    '.lecta__who h2{margin:0;font:400 26px/1 "Instrument Serif",Georgia,serif;color:#F4EEE2;letter-spacing:.01em}',
    '.lecta__who p{margin:3px 0 0;font-size:13px;line-height:1.35;color:rgba(244,238,226,.78)}',
    '.lecta__x{width:44px;height:44px;border-radius:50%;border:1px solid rgba(244,238,226,.25);background:transparent;color:#F4EEE2;display:grid;place-items:center;cursor:pointer;flex:none}',
    '.lecta__x svg{width:18px;height:18px}',
    '.lecta__warn{margin:0;padding:7px 16px;background:#101D31;color:rgba(244,238,226,.74);font-size:12px;line-height:1.4}',
    '.lecta__log{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:16px 16px 8px;display:flex;flex-direction:column;gap:14px}',
    '.lecta__hello h3{margin:4px 0 6px;font:400 28px/1.1 "Instrument Serif",Georgia,serif;color:#14233B}',
    '.lecta__hello h3 i{color:#9A7536}',
    '.lecta__hello p{margin:0 0 12px;color:#3A4558}',
    '.lecta__chips{display:flex;flex-wrap:wrap;gap:8px}',
    '.lecta__chip{min-height:40px;padding:8px 14px;border-radius:999px;border:1px solid rgba(184,146,74,.55);background:#fff;color:#14233B;font:500 14px/1.3 Outfit,system-ui,sans-serif;cursor:pointer;text-align:left}',
    '.lecta__chip:hover{background:#F4EEE2}',
    '.lecta__u{align-self:flex-end;max-width:85%;background:#14233B;color:#F4EEE2;border-radius:18px 18px 4px 18px;padding:10px 14px;white-space:pre-wrap;overflow-wrap:anywhere}',
    '.lecta__u img{display:block;max-width:180px;max-height:180px;border-radius:10px;margin:0 0 8px auto}',
    '.lecta__a{align-self:stretch;display:flex;flex-direction:column;gap:12px}',
    '.lecta__txt p{margin:0 0 8px}.lecta__txt p:last-child{margin:0}',
    '.lecta__wait{align-self:flex-start;display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:18px;background:#F4EEE2;color:#3A4558;font-size:14px}',
    '.lecta__dots{display:inline-flex;gap:4px}.lecta__dots i{width:6px;height:6px;border-radius:50%;background:#B8924A;opacity:.35;animation:lectaDot 1.2s infinite}',
    '.lecta__dots i:nth-child(2){animation-delay:.2s}.lecta__dots i:nth-child(3){animation-delay:.4s}',
    '@keyframes lectaDot{0%,80%,100%{opacity:.25}40%{opacity:1}}',
    '@media (prefers-reduced-motion:reduce){.lecta__dots i{animation:none;opacity:.7}.lecta-fab{transition:none}}',
    '.lecta__err{align-self:flex-start;padding:10px 14px;border-radius:14px;background:#FBEAE5;color:#7A2716;font-size:14px}',
    '.lecta__can{display:grid;gap:10px;grid-template-columns:1fr}',
    '@media (min-width:480px){.lecta--inline .lecta__can{grid-template-columns:1fr 1fr}}',
    '.lecta__can div{background:#fff;border:1px solid rgba(20,35,59,.1);border-radius:14px;padding:10px 12px}',
    '.lecta__can h4{margin:0 0 4px;font:600 13px/1.3 Outfit,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#8A6A2E}',
    '.lecta__can ul{margin:0;padding-left:18px}.lecta__can li{margin:2px 0}',
    '.lecta__p{background:#fff;border:1px solid rgba(20,35,59,.1);border-radius:16px;padding:12px;display:grid;grid-template-columns:84px minmax(0,1fr);gap:4px 12px}',
    '.lecta__p--no{grid-template-columns:minmax(0,1fr)}',
    '.lecta__ph{grid-row:span 3;width:84px;height:84px;border-radius:12px;background:#fff;box-shadow:0 0 0 1px rgba(20,35,59,.08);display:grid;place-items:center;overflow:hidden}',
    '.lecta__ph img{width:100%;height:100%;object-fit:contain;padding:4px;box-sizing:border-box}',
    '.lecta__tag{justify-self:start;font:600 11px/1 Outfit,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#14233B;background:#D4AF6A;border-radius:999px;padding:5px 9px}',
    '.lecta__p h4{margin:2px 0 0;font:500 15px/1.3 Outfit,system-ui,sans-serif;color:#14233B}',
    '.lecta__price{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 8px;font-variant-numeric:tabular-nums}',
    '.lecta__price b{font-size:20px;font-weight:600}.lecta__price s{color:#5A6375;font-size:13px}',
    '.lecta__off{font:600 12px/1 Outfit,system-ui,sans-serif;background:#14233B;color:#F4EEE2;border-radius:6px;padding:4px 6px}',
    '.lecta__seen{font-size:12px;color:#5A6375}',
    '.lecta__full{grid-column:1/-1}',
    '.lecta__why{margin:0;color:#3A4558;font-size:14px}',
    '.lecta__hist{margin:4px 0 0;font-size:13.5px;color:#3A4558}',
    '.lecta__chart{display:block;width:100%;height:56px;margin-top:6px}',
    '.lecta__cap{font-size:11.5px;color:#5A6375;margin-top:2px}',
    '.lecta__when{margin:4px 0 0;padding:8px 10px;border-radius:10px;background:rgba(212,175,106,.22);border-left:3px solid #B8924A;font-size:14px;font-weight:500}',
    '.lecta__na{font-size:14px;color:#5A6375}',
    '.lecta__btns{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}',
    '.lecta__btn{display:inline-flex;align-items:center;gap:6px;min-height:42px;padding:0 14px;border-radius:999px;border:1px solid rgba(20,35,59,.22);background:#FBF8F2;color:#14233B;font:500 14px/1 Outfit,system-ui,sans-serif;text-decoration:none;cursor:pointer;white-space:nowrap}',
    '.lecta__btn svg{width:16px;height:16px;flex:none}',
    '.lecta__btn--main{background:#14233B;border-color:#14233B;color:#F4EEE2}',
    '.lecta__btn--gold{background:#D4AF6A;border-color:#D4AF6A;color:#14233B;font-weight:600}',
    '.lecta__btn:hover{border-color:#B8924A}',
    '.lecta__tbl{overflow-x:auto;border:1px solid rgba(20,35,59,.12);border-radius:14px;background:#fff;-webkit-overflow-scrolling:touch}',
    '.lecta__tbl table{border-collapse:collapse;min-width:100%;font-size:13.5px}',
    '.lecta__tbl th,.lecta__tbl td{padding:8px 10px;border-bottom:1px solid rgba(20,35,59,.08);text-align:left;vertical-align:top;min-width:120px}',
    '.lecta__tbl thead th{background:#F4EEE2;font-weight:600}',
    '.lecta__tbl tbody th{font-weight:600;color:#3A4558;min-width:96px;position:sticky;left:0;background:#fff}',
    '.lecta__tbl tr:last-child th,.lecta__tbl tr:last-child td{border-bottom:0}',
    '.lecta__sec{font:600 12px/1.3 Outfit,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#8A6A2E;margin:0 0 6px}',
    '.lecta__src{font-size:12.5px;color:#5A6375}',
    '.lecta__src summary{cursor:pointer;display:inline-block;padding:4px 0}',
    '.lecta__src ul{margin:4px 0 0;padding-left:18px}.lecta__src a{color:#5A6375;overflow-wrap:anywhere}',
    '.lecta__note{margin:0;font-size:12px;color:#5A6375}',
    '.lecta__vote{display:flex;align-items:center;gap:8px;font-size:13px;color:#5A6375}',
    '.lecta__vote button{display:inline-flex;align-items:center;gap:5px;min-height:36px;padding:0 12px;border-radius:999px;border:1px solid rgba(20,35,59,.18);background:transparent;color:#14233B;font:500 13px Outfit,system-ui,sans-serif;cursor:pointer}',
    '.lecta__vote button svg{width:15px;height:15px}.lecta__vote button.dn svg{transform:rotate(180deg)}',
    '.lecta__form{border-top:1px solid rgba(20,35,59,.1);background:#fff;padding:10px 12px 8px}',
    '.lecta__pv{display:flex;align-items:center;gap:10px;margin:0 0 8px}',
    '.lecta__pv img{width:52px;height:52px;object-fit:cover;border-radius:10px;box-shadow:0 0 0 1px rgba(20,35,59,.12)}',
    '.lecta__pv p{flex:1;margin:0;font-size:12.5px;line-height:1.35;color:#7A2716}',
    '.lecta__pv button{width:36px;height:36px;border-radius:50%;border:1px solid rgba(20,35,59,.2);background:#fff;color:#14233B;display:grid;place-items:center;cursor:pointer;flex:none}',
    '.lecta__pv button svg{width:14px;height:14px}',
    '.lecta__row{display:flex;align-items:flex-end;gap:6px}',
    '.lecta__row textarea{flex:1;min-width:0;min-height:44px;max-height:120px;resize:none;border:1px solid rgba(20,35,59,.2);border-radius:14px;padding:10px 12px;font:400 16px/1.4 Outfit,system-ui,sans-serif;color:#14233B;background:#FBF8F2}',
    '.lecta__row textarea:focus{border-color:#B8924A;outline:none;box-shadow:0 0 0 2px rgba(212,175,106,.35)}',
    '.lecta__ib{width:44px;height:44px;border-radius:50%;border:1px solid rgba(20,35,59,.18);background:#fff;color:#14233B;display:grid;place-items:center;cursor:pointer;flex:none}',
    '.lecta__ib svg{width:20px;height:20px}',
    '.lecta__ib[aria-pressed="true"]{background:#7A2716;border-color:#7A2716;color:#fff}',
    '.lecta__ib--send{background:#14233B;border-color:#14233B;color:#D4AF6A}',
    '.lecta__ib:disabled{opacity:.45;cursor:default}',
    '.lecta__meta{display:flex;justify-content:space-between;gap:10px;margin-top:6px;font-size:11.5px;color:#5A6375}',
    '.lecta__vh{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}',
    '.lecta__demo{margin:0;padding:6px 16px;background:#D4AF6A;color:#14233B;font:600 12px/1.3 Outfit,system-ui,sans-serif}'
  ].join('\n');

  /* ---------------------------------------------------------------- utilità */
  function el(t, c, x){ var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function html(t, c, h){ var e = el(t, c); e.innerHTML = h; return e; }
  function str(v){ return typeof v === 'string' ? v.trim() : (typeof v === 'number' ? String(v) : ''); }
  function arr(v){ return Array.isArray(v) ? v : []; }
  /* link: solo https; prodotti e carrello solo verso Selecta e Amazon */
  var SHOP = /^https:\/\/((www\.)?selectaofferte\.it|(www\.)?amazon\.it|amzn\.eu)(\/|$)/i;
  function safe(u, shop){ u = str(u); if (!/^https:\/\//i.test(u) || /[\s<>"]/.test(u)) return ''; return !shop || SHOP.test(u) ? u : ''; }
  function link(href, cls, label, ic, sponsored){
    var a = el('a', cls); a.href = href; a.target = '_blank';
    a.rel = sponsored ? 'sponsored nofollow noopener' : 'noopener nofollow';
    a.innerHTML = (ic || '') + '<span></span>'; a.lastChild.textContent = label;
    a.appendChild(el('span', 'lecta__vh', ' (si apre in una nuova scheda)'));
    return a;
  }
  function euro(v){
    if (typeof v === 'number' && isFinite(v)) return v.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
    return str(v);
  }
  function pct(v){ if (typeof v === 'number' && isFinite(v)) return '-' + Math.abs(Math.round(v)) + '%'; return str(v); }
  /* «visto il GG/MM alle HH:MM», ora italiana */
  function seen(v){
    if (v == null || v === '') return '';
    var d = typeof v === 'number' ? new Date(v < 1e12 ? v * 1000 : v) : new Date(String(v));
    if (isNaN(d)) return '';
    try {
      var f = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d);
      var p = {}; f.forEach(function(x){ p[x.type] = x.value; });
      return 'visto il ' + p.day + '/' + p.month + ' alle ' + p.hour + ':' + p.minute;
    } catch (e) { return ''; }
  }
  /* testo con a capo e **grassetto**, sempre come testo (niente HTML dalla risposta) */
  function prose(t){
    var box = el('div', 'lecta__txt');
    str(t).split(/\n{2,}/).forEach(function(par){
      if (!par.trim()) return;
      var p = el('p');
      par.split(/(\*\*[^*]+\*\*)/).forEach(function(bit, i){
        if (/^\*\*[^*]+\*\*$/.test(bit)) p.appendChild(el('strong', null, bit.slice(2, -2)));
        else bit.split('\n').forEach(function(line, j){ if (j) p.appendChild(el('br')); if (line) p.appendChild(document.createTextNode(line)); });
      });
      box.appendChild(p);
    });
    return box;
  }
  function num(x){ if (typeof x === 'number') return x; if (x && typeof x === 'object') return +(x.p != null ? x.p : x.prezzo != null ? x.prezzo : x.v != null ? x.v : NaN); if (Array.isArray(x)) return +x[1]; return parseFloat(String(x).replace(',', '.')); }

  /* ---------------------------------------------------------------- chiamate */
  function get(){
    if (DEMO) return Promise.resolve(DEMO_INFO);
    var ctl = window.AbortController ? new AbortController() : null, t = setTimeout(function(){ if (ctl) ctl.abort(); }, 8000);
    return fetch(API + '/lecta', { signal: ctl && ctl.signal, credentials: 'omit' }).then(function(r){ clearTimeout(t); return r.json(); });
  }
  function post(path, body, ms){
    if (DEMO) return new Promise(function(ok){ setTimeout(function(){ ok(path === '/lecta' ? demoAnswer(body) : { ok: true }); }, path === '/lecta' ? 4200 : 300); });
    var ctl = window.AbortController ? new AbortController() : null, t = setTimeout(function(){ if (ctl) ctl.abort(); }, ms || WAIT);
    return fetch(API + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctl && ctl.signal, credentials: 'omit' })
      .then(function(r){ clearTimeout(t); return r.json(); }, function(e){ clearTimeout(t); throw e; });
  }

  /* ---------------------------------------------------------------- stato */
  var INFO = null, active = false, readyFns = [], css = false;
  var ui = null, fab = null, opened = false, inline = false, busy = false, hist = [], img = '', back = null, rec = null;
  function addCss(){ if (css) return; css = true; var s = el('style'); s.id = 'lecta-css'; s.textContent = CSS; document.head.appendChild(s); }

  /* ---------------------------------------------------------------- il pannello */
  function build(isInline){
    addCss();
    var root = el('div', 'lecta' + (isInline ? ' lecta--inline' : ''));
    if (!isInline) { root.hidden = true; root.appendChild(el('div', 'lecta__scrim')).addEventListener('click', close); }
    var box = el('section', 'lecta__box');
    if (!isInline) { box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); }
    box.setAttribute('aria-labelledby', 'lecta-name');
    var head = el('div', 'lecta__head');
    head.appendChild(html('span', 'lecta__logo', ICON));
    var who = el('div', 'lecta__who'), h2 = el('h2', null, str(INFO.nome) || 'Lecta'); h2.id = 'lecta-name';
    who.appendChild(h2); if (str(INFO.sottotitolo)) who.appendChild(el('p', null, str(INFO.sottotitolo)));
    head.appendChild(who);
    if (!isInline) { var x = html('button', 'lecta__x', I.x); x.type = 'button'; x.setAttribute('aria-label', 'Chiudi Lecta'); x.onclick = close; head.appendChild(x); }
    box.appendChild(head);
    if (DEMO) box.appendChild(el('p', 'lecta__demo', 'Anteprima: risposte d\'esempio, non vere.'));
    if (str(INFO.avviso)) box.appendChild(el('p', 'lecta__warn', str(INFO.avviso)));
    var log = el('div', 'lecta__log'); log.setAttribute('role', 'log'); log.setAttribute('aria-label', 'Conversazione con Lecta'); log.tabIndex = -1;
    /* benvenuto */
    var hello = el('div', 'lecta__hello');
    if (str(INFO.titolo)) hello.appendChild(el('h3', null, str(INFO.titolo)));
    if (str(INFO.testo)) hello.appendChild(prose(INFO.testo));
    var chips = el('div', 'lecta__chips');
    arr(INFO.suggerimenti).forEach(function(s){ s = str(s && s.testo || s); if (!s) return; var b = el('button', 'lecta__chip', s); b.type = 'button'; b.onclick = function(){ ask(s); }; chips.appendChild(b); });
    if (chips.firstChild) hello.appendChild(chips);
    log.appendChild(hello);
    box.appendChild(log);
    /* come si scrive */
    var form = el('form', 'lecta__form'); form.noValidate = true;
    var pv = el('div', 'lecta__pv'); pv.hidden = true;
    var pvImg = el('img'); pvImg.alt = 'La foto che stai per mandare';
    var pvRm = html('button', null, I.x); pvRm.type = 'button'; pvRm.setAttribute('aria-label', 'Togli la foto');
    pv.appendChild(pvImg); pv.appendChild(el('p', null, 'Non mandare foto con persone o dati personali.')); pv.appendChild(pvRm);
    form.appendChild(pv);
    var row = el('div', 'lecta__row');
    var ta = el('textarea'); ta.id = 'lecta-q'; ta.rows = 1; ta.maxLength = MAXQ; ta.placeholder = 'Scrivi la tua domanda'; ta.setAttribute('aria-label', 'La tua domanda per Lecta');
    var file = el('input'); file.type = 'file'; file.accept = 'image/*'; file.hidden = true; file.tabIndex = -1; file.setAttribute('aria-hidden', 'true');
    var cam = html('button', 'lecta__ib', I.cam); cam.type = 'button'; cam.setAttribute('aria-label', 'Aggiungi una foto');
    var mic = html('button', 'lecta__ib', I.mic); mic.type = 'button'; mic.setAttribute('aria-label', 'Detta la domanda'); mic.setAttribute('aria-pressed', 'false');
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) mic.hidden = true;
    var go = html('button', 'lecta__ib lecta__ib--send', I.send); go.type = 'submit'; go.setAttribute('aria-label', 'Manda la domanda');
    row.appendChild(cam); row.appendChild(mic); row.appendChild(ta); row.appendChild(go); row.appendChild(file);
    form.appendChild(row);
    var meta = el('div', 'lecta__meta'), priv = el('span', null, 'Lecta non salva le conversazioni né le foto.'), cnt = el('span', null, '0/' + MAXQ);
    cnt.setAttribute('aria-hidden', 'true'); meta.appendChild(priv); meta.appendChild(cnt); form.appendChild(meta);
    var live = el('p', 'lecta__vh'); live.setAttribute('aria-live', 'polite'); form.appendChild(live);
    box.appendChild(form);
    root.appendChild(box);

    function grow(){ ta.style.height = 'auto'; ta.style.height = Math.min(120, ta.scrollHeight + 2) + 'px'; cnt.textContent = ta.value.length + '/' + MAXQ; }
    ta.addEventListener('input', grow);
    ta.addEventListener('keydown', function(e){ if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : submit(e); } });
    function submit(e){ if (e) e.preventDefault(); var q = ta.value.trim(); if (!q) { live.textContent = img ? 'Scrivi cosa vuoi sapere della foto.' : 'Scrivi una domanda.'; ta.focus(); return; } ask(q); }
    form.addEventListener('submit', submit);
    cam.onclick = function(){ file.click(); };
    file.onchange = function(){
      var f = file.files && file.files[0]; file.value = '';
      if (!f || !/^image\//.test(f.type)) return;
      shrink(f).then(function(d){ img = d; pvImg.src = d; pv.hidden = false; live.textContent = 'Foto pronta. Non mandare foto con persone o dati personali.'; ta.focus(); },
                     function(){ live.textContent = 'Non riesco a leggere questa foto. Provane un\'altra.'; });
    };
    pvRm.onclick = function(){ img = ''; pv.hidden = true; pvImg.removeAttribute('src'); ta.focus(); };
    mic.onclick = function(){
      if (rec) { rec.stop(); return; }
      try {
        rec = new SR(); rec.lang = 'it-IT'; rec.interimResults = false; rec.maxAlternatives = 1;
        rec.onresult = function(ev){ var t = ''; for (var i = ev.resultIndex; i < ev.results.length; i++) t += ev.results[i][0].transcript; ta.value = (ta.value ? ta.value.replace(/\s*$/, ' ') : '') + t.trim(); ta.value = ta.value.slice(0, MAXQ); grow(); };
        rec.onend = function(){ rec = null; mic.setAttribute('aria-pressed', 'false'); mic.setAttribute('aria-label', 'Detta la domanda'); };
        rec.onerror = function(){ live.textContent = 'La dettatura non è disponibile adesso.'; };
        rec.start(); mic.setAttribute('aria-pressed', 'true'); mic.setAttribute('aria-label', 'Ferma la dettatura'); live.textContent = 'Ti ascolto.';
      } catch (e) { rec = null; mic.hidden = true; }
    };
    if (!isInline) root.addEventListener('keydown', function(e){
      if (e.key !== 'Tab') return;
      var f = [].filter.call(box.querySelectorAll('a[href],button:not([disabled]),textarea,summary,[tabindex="0"]'), function(n){ return !n.hidden && n.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    });
    return { root: root, log: log, ta: ta, go: go, live: live, pv: pv, pvImg: pvImg, grow: grow, hello: hello };
  }

  /* foto: lato lungo al massimo 1280 px, JPEG 0,85 */
  function shrink(f){
    function draw(src, w, h){
      var k = Math.min(1, 1280 / Math.max(w, h)), c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
      var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(src, 0, 0, c.width, c.height);
      return c.toDataURL('image/jpeg', 0.85);
    }
    if (window.createImageBitmap) return createImageBitmap(f, { imageOrientation: 'from-image' }).then(function(b){ var d = draw(b, b.width, b.height); if (b.close) b.close(); return d; });
    return new Promise(function(ok, ko){ var u = URL.createObjectURL(f), im = new Image(); im.onload = function(){ URL.revokeObjectURL(u); ok(draw(im, im.naturalWidth, im.naturalHeight)); }; im.onerror = function(){ URL.revokeObjectURL(u); ko(); }; im.src = u; });
  }

  /* ---------------------------------------------------------------- domanda e risposta */
  /* si scorre solo la conversazione, mai la pagina sotto */
  function scroll(n){
    if (!n || !ui) return; var log = ui.log;
    var top = n.getBoundingClientRect().top - log.getBoundingClientRect().top + log.scrollTop - 8;
    try { log.scrollTo({ top: top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); } catch (e) { log.scrollTop = top; }
  }
  function ask(q){
    q = str(q).slice(0, MAXQ);
    if (!q || busy || !ui) return;
    busy = true; ui.go.disabled = true;
    var u = el('div', 'lecta__u'), sentImg = img;
    if (sentImg) { var im = el('img'); im.src = sentImg; im.alt = 'La tua foto'; u.appendChild(im); }
    u.appendChild(document.createTextNode(q));
    ui.log.appendChild(u);
    ui.ta.value = ''; ui.grow(); img = ''; ui.pv.hidden = true; ui.pvImg.removeAttribute('src');
    var w = el('div', 'lecta__wait'); w.innerHTML = '<span class="lecta__dots" aria-hidden="true"><i></i><i></i><i></i></span><span></span>';
    var wt = w.lastChild, k = 0; wt.textContent = WAITING[0]; ui.live.textContent = WAITING[0];
    var tick = setInterval(function(){ k = Math.min(k + 1, WAITING.length - 1); wt.textContent = WAITING[k]; }, 3500);
    ui.log.appendChild(w); scroll(u);
    var body = { q: q, h: hist.slice(-HIST) };
    if (sentImg) body.img = sentImg;
    post('/lecta', body).then(function(r){
      clearInterval(tick); w.remove();
      if (!r || r.ok === false) { var m = el('div', 'lecta__err', str(r && (r.errore || r.testo || r.messaggio)) || 'Lecta adesso non riesce a rispondere. Riprova tra poco.'); ui.log.appendChild(m); ui.live.textContent = m.textContent; scroll(m); return; }
      hist.push({ r: 'u', t: q }); hist.push({ r: 'a', t: str(r.testo) });
      hist = hist.slice(-HIST);
      var a = answer(r); ui.log.appendChild(a); ui.live.textContent = 'Lecta ha risposto.'; scroll(a);
    }, function(e){
      clearInterval(tick); w.remove();
      var m = el('div', 'lecta__err', e && e.name === 'AbortError' ? 'Lecta ci sta mettendo troppo. Riprova tra poco.' : 'Non riesco a raggiungere Lecta. Controlla la connessione e riprova.');
      ui.log.appendChild(m); ui.live.textContent = m.textContent; scroll(m);
    }).then(function(){ busy = false; ui.go.disabled = false; });
  }

  function chart(pts){
    var v = pts.map(num).filter(function(x){ return isFinite(x); });
    if (v.length < 2) return null;
    var W = 300, H = 56, P = 4, lo = Math.min.apply(null, v), hi = Math.max.apply(null, v), span = hi - lo || 1;
    var xy = v.map(function(y, i){ return [P + i * (W - 2 * P) / (v.length - 1), P + (hi - y) * (H - 2 * P) / span]; });
    var d = xy.map(function(p, i){ return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('');
    var last = xy[xy.length - 1];
    var s = '<svg class="lecta__chart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="Andamento del prezzo: da ' + euro(v[0]) + ' a ' + euro(v[v.length - 1]) + ', minimo ' + euro(lo) + ', massimo ' + euro(hi) + '">' +
      '<path d="' + d + '" fill="none" stroke="#B8924A" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<circle cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="3.5" fill="#14233B"/></svg>';
    return html('div', null, s).firstChild;
  }
  function product(p){
    var off = p.in_offerta === true, name = str(p.nome || p.n), card = el('article', 'lecta__p' + (off ? '' : ' lecta__p--no'));
    var href = safe(p.link || p.url, true), avv = safe(p.avviso, false);
    if (off) {
      var ph = el('div', 'lecta__ph'), src = safe(p.foto, false);
      if (src) { var im = el('img'); im.src = src; im.alt = name; im.loading = 'lazy'; im.referrerPolicy = 'no-referrer'; im.onerror = function(){ im.remove(); }; ph.appendChild(im); }
      card.appendChild(ph);
      card.appendChild(el('span', 'lecta__tag', 'In offerta su Selecta'));
      card.appendChild(el('h4', null, name));
      var pr = el('div', 'lecta__price');
      if (euro(p.prezzo)) pr.appendChild(el('b', null, euro(p.prezzo)));
      if (euro(p.listino)) { var s = el('s', null, euro(p.listino)); s.setAttribute('aria-label', 'Prezzo di listino ' + euro(p.listino)); pr.appendChild(s); }
      if (pct(p.sconto)) pr.appendChild(el('span', 'lecta__off', pct(p.sconto)));
      var sv = seen(p.visto_il); if (sv) pr.appendChild(el('span', 'lecta__seen', sv));
      card.appendChild(pr);
      var full = el('div', 'lecta__full');
      if (str(p.perche)) full.appendChild(el('p', 'lecta__why', str(p.perche)));
      var st = p.storico;
      if (st && typeof st === 'object') {
        if (str(st.frase)) full.appendChild(el('p', 'lecta__hist', str(st.frase)));
        var c = chart(arr(st.punti));
        if (c) { full.appendChild(c); var g = parseInt(st.giorni, 10); full.appendChild(el('p', 'lecta__cap', 'Prezzi visti da Selecta negli ultimi ' + (g > 0 ? g + ' giorni' : 'giorni'))); }
      } else if (str(st)) full.appendChild(el('p', 'lecta__hist', str(st)));
      var qn = str(p.quando && p.quando.testo || p.quando); if (qn) full.appendChild(el('p', 'lecta__when', qn));
      var b = el('div', 'lecta__btns');
      if (href) b.appendChild(link(href, 'lecta__btn lecta__btn--main', 'Vedi l\'offerta', I.ext, true));
      if (avv) b.appendChild(link(avv, 'lecta__btn', 'Avvisami quando scende', I.bell, false));
      if (b.firstChild) full.appendChild(b);
      card.appendChild(full);
    } else {
      card.appendChild(el('h4', null, name));
      if (str(p.perche)) card.appendChild(el('p', 'lecta__why', str(p.perche)));
      card.appendChild(el('p', 'lecta__na', 'Prezzo aggiornato su Amazon'));
      var b2 = el('div', 'lecta__btns');
      if (href) b2.appendChild(link(href, 'lecta__btn lecta__btn--main', 'Vedi su Amazon', I.ext, true));
      if (avv) b2.appendChild(link(avv, 'lecta__btn', 'Avvisami quando scende', I.bell, false));
      if (b2.firstChild) card.appendChild(b2);
    }
    return card;
  }
  function table(c){
    var cols = arr(c.prodotti || c.colonne || c.intestazioni).map(function(x){ return str(x && (x.nome || x.n) || x); });
    var rows = arr(c.righe).map(function(r){ return Array.isArray(r) ? { voce: str(r[0]), valori: r.slice(1) } : { voce: str(r && (r.voce || r.nome)), valori: arr(r && (r.valori || r.v)) }; }).filter(function(r){ return r.voce || r.valori.length; });
    if (!cols.length || !rows.length) return null;
    var wrap = el('div'), t = el('div', 'lecta__tbl'), tb = el('table');
    t.tabIndex = 0; t.setAttribute('role', 'region'); t.setAttribute('aria-label', 'Confronto tra i prodotti (scorre di lato)');
    if (str(c.titolo)) wrap.appendChild(el('p', 'lecta__sec', str(c.titolo)));
    var th = el('thead'), tr = el('tr'); tr.appendChild(el('td'));
    cols.forEach(function(n){ var h = el('th', null, n); h.scope = 'col'; tr.appendChild(h); });
    th.appendChild(tr); tb.appendChild(th);
    var body = el('tbody');
    rows.forEach(function(r){ var row = el('tr'), h = el('th', null, r.voce); h.scope = 'row'; row.appendChild(h); cols.forEach(function(_, i){ row.appendChild(el('td', null, str(r.valori[i]))); }); body.appendChild(row); });
    tb.appendChild(body); t.appendChild(tb); wrap.appendChild(t);
    return wrap;
  }
  function answer(r){
    var a = el('div', 'lecta__a');
    if (str(r.testo)) a.appendChild(prose(r.testo));
    if (r.aiuto === true && (arr(r.puoi).length || arr(r.non_posso).length)) {
      var can = el('div', 'lecta__can');
      [['Posso', r.puoi], ['Non posso', r.non_posso]].forEach(function(x){
        var l = arr(x[1]).map(str).filter(Boolean); if (!l.length) return;
        var d = el('div'); d.appendChild(el('h4', null, x[0])); var ul = el('ul'); l.forEach(function(t){ ul.appendChild(el('li', null, t)); }); d.appendChild(ul); can.appendChild(d);
      });
      a.appendChild(can);
    }
    arr(r.prodotti).forEach(function(p){ if (p && typeof p === 'object' && str(p.nome || p.n)) a.appendChild(product(p)); });
    if (r.confronto && typeof r.confronto === 'object') { var t = table(r.confronto); if (t) a.appendChild(t); }
    var acts = el('div', 'lecta__btns');
    var cart = safe(typeof r.carrello === 'string' ? r.carrello : r.carrello && (r.carrello.url || r.carrello.link), true);
    if (cart) acts.appendChild(link(cart, 'lecta__btn lecta__btn--gold', 'Metti tutto nel carrello Amazon', I.cart, true));
    var sh = r.condividi && typeof r.condividi === 'object' ? r.condividi : null;
    if (sh) {
      var wa = safe(sh.whatsapp, false), su = safe(sh.url, false);
      if (wa) acts.appendChild(link(wa, 'lecta__btn', 'Manda questo consiglio', I.share, false));
      if (su) {
        var cp = html('button', 'lecta__btn', I.copy + '<span>Copia il link</span>'); cp.type = 'button';
        cp.onclick = function(){ (navigator.clipboard ? navigator.clipboard.writeText(su) : Promise.reject()).then(function(){ cp.lastChild.textContent = 'Copiato'; if (ui) ui.live.textContent = 'Link copiato.'; }, function(){ prompt('Il link del consiglio:', su); }); };
        acts.appendChild(cp);
      }
    }
    if (acts.firstChild) a.appendChild(acts);
    var dq = str(r.domanda && r.domanda.testo || r.domanda);
    if (dq) { var ch = el('div', 'lecta__chips'), b = el('button', 'lecta__chip', dq); b.type = 'button'; b.onclick = function(){ ask(dq); }; ch.appendChild(b); a.appendChild(ch); }
    var src = arr(r.fonti).map(function(f){ return typeof f === 'string' ? { t: f, u: safe(f, false) } : { t: str(f && (f.titolo || f.nome || f.url)), u: safe(f && (f.url || f.link), false) }; }).filter(function(f){ return f.t; });
    if (src.length) {
      var det = el('details', 'lecta__src'); det.appendChild(el('summary', null, 'Fonti (' + src.length + ')'));
      var ul = el('ul'); src.forEach(function(f){ var li = el('li'); if (f.u) { var x = el('a', null, f.t === f.u ? f.u.replace(/^https:\/\/(www\.)?/, '') : f.t); x.href = f.u; x.target = '_blank'; x.rel = 'noopener nofollow'; li.appendChild(x); } else li.textContent = f.t; ul.appendChild(li); });
      det.appendChild(ul); a.appendChild(det);
    }
    if (str(r.nota)) a.appendChild(el('p', 'lecta__note', str(r.nota)));
    var vote = el('div', 'lecta__vote'); vote.appendChild(el('span', null, 'Ti è stato utile?'));
    [[1, 'Utile', ''], [-1, 'Non utile', 'dn']].forEach(function(x){
      var b = html('button', x[2], I.up + '<span>' + x[1] + '</span>'); b.type = 'button';
      b.onclick = function(){ [].forEach.call(vote.querySelectorAll('button'), function(n){ n.disabled = true; }); post('/lecta/voto', { v: x[0] }, 15000).catch(function(){}); vote.textContent = 'Grazie'; if (ui) ui.live.textContent = 'Grazie per il voto.'; };
      vote.appendChild(b);
    });
    a.appendChild(vote);
    return a;
  }

  /* ---------------------------------------------------------------- aprire e chiudere */
  function open(o){
    if (!active) return false;
    o = o || {};
    if (!ui) { ui = build(false); document.body.appendChild(ui.root); }
    if (!inline) {
      if (!opened) { back = document.activeElement; opened = true; ui.root.hidden = false; document.documentElement.classList.add('lecta-lock'); if (fab) fab.setAttribute('aria-expanded', 'true'); }
    }
    var q = str(o.q).slice(0, MAXQ);
    if (q && o.send) ask(q);
    else if (q) { ui.ta.value = q; ui.grow(); }
    setTimeout(function(){ ui.ta.focus({ preventScroll: true }); }, 30);
    return true;
  }
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && opened && !inline) { e.preventDefault(); close(); } });
  function close(){
    if (!opened || inline) return;
    opened = false; ui.root.hidden = true; document.documentElement.classList.remove('lecta-lock');
    if (rec) rec.stop();
    if (fab) fab.setAttribute('aria-expanded', 'false');
    if (back && back.focus) back.focus();
  }
  function mount(box){
    if (!active || !box) return false;
    inline = true; ui = build(true); box.appendChild(ui.root);
    if (fab) fab.hidden = true;
    return true;
  }

  /* il pulsante rotondo: sopra la barra del carrello e le barre in basso, mai sopra un pulsante */
  function place(){
    if (!fab || fab.hidden) return;
    var lift = 0;
    [].forEach.call(document.querySelectorAll('.sx-cart, .follow, .dock, [data-lecta-avoid]'), function(n){
      if (n === fab) return;
      var cs = getComputedStyle(n); if (cs.position !== 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') return;
      var r = n.getBoundingClientRect();
      /* conta solo una barra attaccata al fondo che passa sotto l'angolo del pulsante */
      if (!r.height || r.bottom < innerHeight - 4 || r.right < innerWidth - 80 || r.left > innerWidth - 16) return;
      lift = Math.max(lift, innerHeight - r.top);
    });
    fab.style.bottom = 'calc(' + (16 + Math.round(lift)) + 'px + ' + (lift ? '0px' : 'env(safe-area-inset-bottom,0px)') + ')';
  }
  function showFab(){
    if (fab || inline || document.querySelector('[data-lecta-nofab]')) return;
    fab = html('button', 'lecta-fab', ICON); fab.type = 'button';
    fab.setAttribute('aria-label', 'Chiedi a ' + (str(INFO.nome) || 'Lecta') + ', l\'assistente agli acquisti'); fab.setAttribute('aria-haspopup', 'dialog'); fab.setAttribute('aria-expanded', 'false');
    fab.onclick = function(){ open(); };
    document.body.appendChild(fab);
    document.body.appendChild(el('div', 'lecta-spacer')).setAttribute('aria-hidden', 'true');
    place();
    addEventListener('resize', place);
    /* le barre in basso entrano scorrendo, con un'animazione: si ricontrolla allo scorrimento e alla fine delle animazioni */
    var sc = 0; addEventListener('scroll', function(){ if (!sc) sc = requestAnimationFrame(function(){ sc = 0; place(); }); }, { passive: true });
    document.addEventListener('transitionend', function(e){ if (e.target !== fab) place(); });
    var t = 0;
    new MutationObserver(function(m){
      if (m.every(function(x){ return x.target === fab || (x.target.closest && x.target.closest('.lecta')); })) return;
      cancelAnimationFrame(t); t = requestAnimationFrame(place);
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'class', 'style'] });
  }
  function wire(root){
    [].forEach.call((root || document).querySelectorAll('[data-lecta-open], [data-lecta-q]'), function(b){
      if (b.__lecta) return; b.__lecta = 1;
      if (b.hasAttribute('data-lecta-open') && !b.querySelector('.lecta-ico')) b.insertAdjacentHTML('afterbegin', ICON);
      b.hidden = false;
      b.addEventListener('click', function(e){
        var q = b.getAttribute('data-lecta-q');
        if (open(q ? { q: q, send: true } : {})) e.preventDefault();
      });
    });
  }
  function onReady(fn){ if (INFO) fn(active); else readyFns.push(fn); }

  window.Lecta = { get active(){ return active; }, open: open, close: close, mount: mount, onReady: onReady, wire: wire, icon: ICON };

  function start(){
    get().then(function(r){
      INFO = r && typeof r === 'object' ? r : {};
      active = INFO.attiva === true;
    }, function(){ INFO = {}; active = false; }).then(function(){
      if (active) { addCss(); showFab(); wire(); }
      readyFns.splice(0).forEach(function(fn){ try { fn(active); } catch (e) {} });
      try { document.dispatchEvent(new CustomEvent('lecta:ready', { detail: { active: active } })); } catch (e) {}
    });
  }
  /* ---------------------------------------------------------------- anteprima (?demo_lecta=1): dati d'esempio, mai sul sito vero */
  var DEMO_INFO = {
    attiva: true, nome: 'Lecta', sottotitolo: 'L\'assistente agli acquisti di Selecta',
    avviso: 'Lecta è un\'intelligenza artificiale e può sbagliare: controlla sempre prezzo e dettagli su Amazon prima di comprare.',
    titolo: 'Ciao, sono Lecta', testo: 'Dimmi cosa cerchi, per chi è e quanto vuoi spendere: ti consiglio tra le offerte di Selecta e ti dico se è il momento giusto per comprare.',
    suggerimenti: ['Cosa posso chiederti?', 'Cuffie per correre sotto i 60 euro', 'Un regalo per mia mamma che ama cucinare', 'Meglio friggitrice ad aria da 4 o 6 litri?']
  };
  function demoAnswer(b){
    var svg = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 84"><rect width="84" height="84" fill="#F4EEE2"/><circle cx="42" cy="40" r="20" fill="none" stroke="#14233B" stroke-width="5"/><rect x="18" y="38" width="9" height="20" rx="4" fill="#14233B"/><rect x="57" y="38" width="9" height="20" rx="4" fill="#14233B"/></svg>');
    if (/cosa posso chiederti/i.test(b.q)) return {
      ok: true, aiuto: true, testo: 'Posso aiutarti a scegliere tra le offerte di Selecta e a capire se un prezzo è buono.',
      puoi: ['consigliarti prodotti per un budget o per una persona', 'confrontare due o tre prodotti', 'dirti come è andato il prezzo negli ultimi giorni', 'guardare la foto di un prodotto e trovare offerte simili'],
      non_posso: ['comprare al posto tuo o vedere il tuo account Amazon', 'garantire che il prezzo resti uguale', 'darti consigli medici o legali'],
      nota: 'Esempio per l\'anteprima.'
    };
    var now = Date.now();
    return {
      ok: true,
      testo: 'Per correre ti consiglio cuffie leggere, resistenti al sudore e che restano ferme. Qui sotto trovi **una in offerta su Selecta** e una alternativa da guardare su Amazon.\n\nSe vuoi spendere meno, la prima è la scelta più sicura.',
      prodotti: [
        { nome: 'Cuffie sportive Bluetooth (esempio)', in_offerta: true, foto: svg, prezzo: 39.99, listino: 69.99, sconto: 43, visto_il: new Date(now - 3 * 3600e3).toISOString(),
          storico: { frase: 'È il prezzo più basso visto da Selecta negli ultimi 30 giorni.', punti: [59.9, 59.9, 54.9, 57.5, 49.9, 52.9, 44.9, 47.9, 39.99], giorni: 30 },
          quando: 'Buon momento per comprare: il prezzo è sceso del 20% in una settimana.',
          link: 'https://selectaofferte.it/?a=B0ESEMPIO1&t=gt-tech-21', avviso: 'https://t.me/SelectaOfferte_bot?start=avviso_esempio',
          perche: 'Leggere, resistenti al sudore, con gli archetti che le tengono ferme.' },
        { nome: 'Cuffie a conduzione ossea (esempio)', in_offerta: false, perche: 'Lasciano le orecchie libere: senti il traffico mentre corri.', link: 'https://www.amazon.it/dp/B0ESEMPIO2?tag=gt-tech-21', avviso: 'https://t.me/SelectaOfferte_bot?start=avviso_esempio2' }
      ],
      confronto: { prodotti: ['Cuffie sportive', 'Conduzione ossea'], righe: [
        { voce: 'Prezzo', valori: ['39,99 € (in offerta)', 'su Amazon'] },
        { voce: 'Autonomia', valori: ['circa 9 ore', 'circa 8 ore'] },
        { voce: 'Sudore', valori: ['IPX5', 'IP67'] },
        { voce: 'Orecchie libere', valori: ['no', 'sì'] } ] },
      carrello: 'https://www.amazon.it/gp/aws/cart/add.html?AssociateTag=gt-tech-21&ASIN.1=B0ESEMPIO1&Quantity.1=1',
      condividi: { whatsapp: 'https://wa.me/?text=' + encodeURIComponent('Il consiglio di Lecta: https://selectaofferte.it/lecta/#c=j.esempio'), url: 'https://selectaofferte.it/lecta/#c=j.esempio' },
      domanda: 'Quali tengono meglio con gli occhiali?',
      fonti: [{ titolo: 'Scheda del prodotto su Amazon', url: 'https://www.amazon.it/' }, { titolo: 'Storico prezzi di Selecta', url: 'https://selectaofferte.it/' }],
      nota: 'Prezzi visti da Selecta: su Amazon possono essere cambiati. Esempio per l\'anteprima.'
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
