/* mostlypm — Product Quest engine.
   Weekly rotation: the world and the cases are picked from the ISO week, so every visitor
   sees the same quest this week and a fresh one next week. Progress lives in localStorage. */
(function () {
  'use strict';
  var Q = window.QUESTS || {};
  var KEY = 'mpm-quest-v2';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var XP = { 0: 100, 1: 200, 2: 300, side: 150, 3: 300 };
  var MAX = 1050;  /* a perfect week; Friday doubles can top it up but the bar caps at full */
  var POSTS = { 0: 'when-building-is-cheap', 1: 'understand', 2: 'prove', side: 'ai-feature-eval-harness', 3: 'shape-and-ship' };
  var BADGE = { 1: 'u', 2: 'p', side: 'd', 3: 's' };

  /* ---------- week + seeded random ---------- */
  function isoWeek(d) {
    var t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    var day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
    var y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return { year: t.getUTCFullYear(), week: Math.ceil(((t - y0) / 864e5 + 1) / 7) };
  }
  var now = new Date(), wk = isoWeek(now);
  var WEEK = wk.year + '-W' + (wk.week < 10 ? '0' : '') + wk.week;
  var weekIndex = Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 864e5 + 3) / 7);
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var rand = rng(wk.year * 100 + wk.week);
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var TODAY = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();
  var DOW = now.getDay();
  var MOODS = {
    0: { name: 'Weekend quest', classic: false, mult: 1, hi: 'Weekend quest: no rush.' },
    1: { name: 'Fresh-start Monday', classic: true, mult: 1, hi: '' },
    2: { name: 'Build Tuesday', classic: false, mult: 1, hi: '' },
    3: { name: 'Midweek', classic: false, mult: 1, hi: '' },
    4: { name: 'Ship Thursday', classic: false, mult: 1, hi: '' },
    5: { name: 'Double XP Friday', classic: false, mult: 2, hi: "It's Double XP Friday: every level is worth 2× XP." },
    6: { name: 'Weekend quest', classic: false, mult: 1, hi: 'Weekend quest: no rush.' }
  };
  var MOOD = MOODS[DOW];
  var worlds = Q.worlds || [];
  var WORLD = worlds.length ? worlds[weekIndex % worlds.length] : null;

  /* ---------- state ---------- */
  function fresh() { return { xp: 0, badges: {}, week: WEEK, done: {}, weekXp: 0, weeks: [], guide: { seen: false, mode: '' }, classic: false, lastWeek: '' }; }
  var S = fresh();
  try { var saved = JSON.parse(localStorage.getItem(KEY) || 'null'); if (saved && typeof saved === 'object') S = Object.assign(fresh(), saved); } catch (e) {}
  var newWeek = S.week !== WEEK;
  var returning = S.weeks.length > 0 || S.xp > 0 || (S.guide && S.guide.seen);
  if (newWeek) { S.lastWeek = S.week; S.week = WEEK; S.done = {}; S.weekXp = 0; }
  /* First-time visitors land on classic. Anyone who has chosen the game lands in the game next time, until they switch back. */
  S.classic = S.modeDay === TODAY ? !!S.classic : S.pref !== 'game';
  var FIXED = document.documentElement.getAttribute('data-fixed-mode') === 'classic';
  if (location.hash.indexOf('#play') === 0) { S.classic = false; S.modeDay = TODAY; }
  /* analytics hook: works with Plausible, PostHog or Google Analytics if one is on the page */
  function track(name, props) {
    props = props || {};
    try { if (window.plausible) window.plausible(name, { props: props }); } catch (e) {}
    try { if (window.posthog && window.posthog.capture) window.posthog.capture(name, props); } catch (e) {}
    try { if (window.gtag) window.gtag('event', name, props); } catch (e) {}
  }
  window.mpmTrack = track;
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function markWeek() { if (S.weeks.indexOf(WEEK) === -1) { S.weeks.push(WEEK); S.weeks = S.weeks.slice(-60); } }
  function streak() {
    var n = 0, idx = weekIndex;
    var set = {}; S.weeks.forEach(function (w) { set[w] = 1; });
    for (;;) {
      var d = new Date((idx * 7 - 3) * 864e5 + 3 * 864e5), k = isoWeek(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
      var key = k.year + '-W' + (k.week < 10 ? '0' : '') + k.week;
      if (set[key]) { n++; idx--; } else break;
    }
    return n;
  }
  save();

  /* ---------- helpers ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function postUrl(l) { return '/notes/' + POSTS[l] + '/'; }

  /* ---------- Mo, the guide (pixel sprite) ---------- */
  var MO = ['...kkkkkk...', '..kyyyyyyk..', '.kyywyywyyk.', '.kyykyykyyk.', '.kyyyyyyyyk.', '.kyykkkkyyk.', '..kyyyyyyk..', '...kkkkkk...', '..kbbbbbbk..', '.kbbwbbwbbk.', '..kbbbbbbk..', '...kk..kk...'];
  var MOC = { k: '#0A0820', y: '#FFD23F', w: '#FFFFFF', b: '#5B8CFF' };
  function moSvg(cls) {
    var r = '';
    MO.forEach(function (row, y) { for (var x = 0; x < row.length; x++) { var c = MOC[row[x]]; if (c) r += '<rect x="' + x + '" y="' + y + '" width="1.02" height="1.02" fill="' + c + '"/>'; } });
    return '<svg class="' + (cls || '') + '" viewBox="-1 -1 14 14" shape-rendering="crispEdges" aria-hidden="true">' + r + '</svg>';
  }
  $$('[data-mo]').forEach(function (n) { n.innerHTML = moSvg(n.getAttribute('data-mo')); });

  /* ---------- classic / game mode ---------- */
  function applyMode() {
    document.documentElement.classList.toggle('classic', FIXED || !!S.classic);
    $$('[data-quest-link]').forEach(function (q) {
      q.textContent = 'Quest';
      if (S.classic) q.removeAttribute('aria-current'); else if (location.pathname === '/') q.setAttribute('aria-current', 'page');
    });
    $$('.nav-home').forEach(function (h) {
      if (S.classic && location.pathname === '/') h.setAttribute('aria-current', 'page'); else h.removeAttribute('aria-current');
    });
    $$('[data-mode-toggle]').forEach(function (b) { if (!b.classList.contains('link-btn')) b.textContent = S.classic ? 'Play the quest' : 'Classic mode'; b.setAttribute('aria-label', S.classic ? 'Switch to game mode' : 'Not feeling playful? Switch to classic mode'); });
  }
  function setMode(classic) { S.pref = classic ? 'classic' : 'game'; track('mode_switch', { to: classic ? 'classic' : 'game' }); window.scrollTo({ top: 0, behavior: 'auto' }); S.classic = classic; S.modeDay = TODAY; save(); applyMode(); if (classic) hideGuide(true); else if (isHub) showGuide(); }
  $$('[data-mode-toggle]').forEach(function (b) { b.addEventListener('click', function () { setMode(!S.classic); }); });
  /* links from classic pages into the game */
  function toGame() { S.pref = 'game'; S.classic = false; S.modeDay = TODAY; save(); track('mode_switch', { to: 'game', from: location.pathname }); }
  $$('[data-play-game], [data-level-link]').forEach(function (a) { a.addEventListener('click', toGame); });
  $$('[data-quest-link]').forEach(function (q) { q.addEventListener('click', function (e) {
    if (!S.classic) return;
    e.preventDefault(); setMode(false);
    if (location.pathname !== '/') location.href = '/'; else window.scrollTo(0, 0);
  }); });
  applyMode();

  /* ---------- HUD ---------- */
  function renderHud() {
    var f = $('#xpfill'), t = $('#xptext');
    if (f) f.style.width = Math.min(100, S.weekXp / MAX * 100) + '%';
    if (t) t.textContent = S.weekXp + ' / ' + MAX;
    var lvlOf = { u: 1, p: 2, s: 3, d: 'side' };
    ['u', 'p', 'd', 's'].forEach(function (b) { var n = $('#b-' + b); if (!n) return; var got = !!S.done[lvlOf[b]]; n.classList.toggle('got', got); n.setAttribute('aria-label', n.title + (got ? ', cleared' : ', not cleared yet')); });
    var st = $('#streak'); if (st) { var n = streak(); st.innerHTML = n ? 'Streak <b>' + n + ' wk' + (n > 1 ? 's' : '') + '</b>' : 'Lifetime <b>' + S.xp + ' XP</b>'; }
  }
  renderHud();
  $$('[data-mood]').forEach(function (n) { n.textContent = MOOD.name; });

  /* Post pages: a "play this level" banner */
  $$('[data-level-link]').forEach(function (a) { var l = a.getAttribute('data-level-link'); a.href = '/#play-' + l; });

  track('visit', { visitor: returning ? 'returning' : 'new', mood: MOOD.name, mode: S.classic ? 'classic' : 'game' });
  var isHub = !!$('#levels');
  if (!isHub) return;

  /* ---------- hub: world, map ---------- */
  var wn = $('#world-name'); if (wn && WORLD) wn.textContent = WORLD.name;
  var wp = $('#week-label'); if (wp) wp.textContent = 'Week ' + wk.week;
  var levels = $$('.lvl');
  function unlocked(l) {
    if (l === '0') return true;
    if (l === '1') return !!S.done[0];
    if (l === '2') return !!S.done[1];
    if (l === 'side' || l === '3') return !!S.done[2];
    if (l === 'boss') return !!S.done[3];
    return false;
  }
  function nextLevel() { var order = ['0', '1', '2', '3', 'boss']; for (var i = 0; i < order.length; i++) if (!S.done[order[i]] && order[i] !== 'boss') return order[i]; return 'boss'; }
  function renderMap() {
    var nx = nextLevel();
    levels.forEach(function (b) {
      var l = b.getAttribute('data-l'), st = $('.st', b);
      b.classList.remove('done', 'next', 'locked');
      if (S.done[l]) { b.classList.add('done'); st.textContent = 'Cleared'; b.disabled = false; }
      else if (unlocked(l)) { b.classList.add(l === nx || l === 'side' ? 'next' : 'next'); st.textContent = l === 'boss' ? 'Open' : l === 'side' ? 'Optional' : 'Play'; b.disabled = false; }
      else { b.classList.add('locked'); st.textContent = 'Locked'; b.disabled = true; }
      b.setAttribute('aria-label', $('.nm', b).textContent + ': ' + $('.sub', b).textContent + ', ' + st.textContent);
    });
    renderHud();
  }

  function gain(n, from) {
    n = n * MOOD.mult;
    S.xp += n; S.weekXp = Math.min(MAX, S.weekXp + n); markWeek(); save(); renderHud();
    if (reduce || !from || !from.getBoundingClientRect) return;
    var r = from.getBoundingClientRect(), p = el('div', 'pop', '+' + n + ' XP');
    p.style.left = (r.left + r.width / 2 - 40) + 'px'; p.style.top = (r.top - 10) + 'px';
    document.body.appendChild(p); setTimeout(function () { p.remove(); }, 1000);
  }

  /* ---------- panel ---------- */
  var overlay = $('#overlay'), panel = $('#panel'), pbody = $('#pbody'), ptitle = $('#ptitle'), pkick = $('#pkick');
  var lastFocus = null;
  function open(kick, title) { lastFocus = document.activeElement; pkick.textContent = kick; ptitle.textContent = title; pbody.innerHTML = ''; overlay.hidden = false; panel.scrollTop = 0; panel.focus(); hideGuide(true); }
  var close = function () { overlay.hidden = true; renderMap(); if (lastFocus && lastFocus.focus) lastFocus.focus(); if (!S.classic) setTimeout(function () { showGuide(); }, 300); };
  function closeRef() { close(); }
  $('#close').addEventListener('click', closeRef);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !overlay.hidden) close(); });

  function finish(l, big, text) {
    var fb = el('div', 'fb'); fb.appendChild(el('div', 'big', big)); fb.appendChild(el('p', null, text));
    var row = el('div', 'row');
    var nextMap = { 0: '1', 1: '2', 2: '3', side: '3', 3: 'boss' };
    var nx = nextMap[l];
    var nb = el('button', 'btn', nx === 'boss' ? 'Unlock co-op mode →' : 'Next level →');
    nb.addEventListener('click', function () { if (nx === 'boss') { location.href = '/work/'; } else play(nx); });
    var rd = el('a', 'btn ghost', 'Read the post'); rd.href = postUrl(l);
    row.appendChild(nb); row.appendChild(rd);
    if (l === 2 && !S.done.side) { var sq = el('button', 'btn ghost', 'Side quest'); sq.addEventListener('click', function () { play('side'); }); row.appendChild(sq); }
    fb.appendChild(row); pbody.appendChild(fb);
    if (!S.done[l]) { track('level_cleared', { level: String(l), world: WORLD ? WORLD.id : '' }); S.done[l] = true; if (BADGE[l]) S.badges[BADGE[l]] = true; markWeek(); save(); renderMap(); }
    fb.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }); nb.focus({ preventScroll: true });
  }

  function quiz(opts, done, host) {
    var box = el('div', 'opts'); (host || pbody).appendChild(box); var answered = false;
    opts.forEach(function (o) {
      var b = el('button', 'opt', o[0]);
      b.addEventListener('click', function () {
        if (answered) return; answered = true;
        $$('button', box).forEach(function (x, j) { x.disabled = true; if (opts[j][1]) x.classList.add('right'); });
        if (!o[1]) b.classList.add('wrong');
        done(o[1], b);
      });
      box.appendChild(b);
    });
    return box;
  }

  function scene(text) {
    var d = el('div', 'scene');
    var r = el('p', 'role'); r.appendChild(el('b', null, 'You play: ')); r.appendChild(document.createTextNode('a product manager (PM), the person who decides what gets built and why.')); d.appendChild(r);
    var s = text || (WORLD && WORLD.scene);
    if (s) { var q = el('p'); q.appendChild(el('b', null, 'The setting: ')); q.appendChild(document.createTextNode(s)); d.appendChild(q); }
    pbody.appendChild(d);
  }

  /* ---------- Level 0 ---------- */
  function lvl0() {
    var q = Q.start[weekIndex % Q.start.length];
    open('Start · this week', 'When building is cheap');
    scene('AI tools now let anyone build a working app in hours.');
    pbody.appendChild(el('p', 'brief', q.q));
    quiz(q.options, function (ok, b) { if (ok) gain(XP[0], b); finish(0, ok ? 'Correct. +' + XP[0] * MOOD.mult + ' XP' : 'Not quite.', q.lesson); });
  }

  /* ---------- Level 1: shadow the user ---------- */
  function lvl1() {
    var d = WORLD.desk;
    open('Level 1 · Understand', 'Find the real problem');
    scene();
    pbody.appendChild(el('p', 'step-label', 'Step 1 of 2 · Spot the hacks'));
    pbody.appendChild(el('p', 'brief', d.brief));
    var desk = el('div', 'desk'); pbody.appendChild(desk);
    var found = el('p', 'found'); pbody.appendChild(found);
    var said = el('p', 'verdict'); said.setAttribute('aria-live', 'polite'); pbody.appendChild(said);
    var hits = 0, tries = 0, need = d.things.filter(function (t) { return t.hit; }).length, earned = 0;
    function upd() { found.innerHTML = 'Hacks found: <b>' + hits + ' / ' + need + '</b>'; }
    upd();
    shuffle(d.things).forEach(function (t) {
      var b = el('button', 'thing'); b.appendChild(el('span', null, t.label));
      b.addEventListener('click', function () {
        if (b.disabled) return; b.disabled = true; tries++;
        if (t.hit) { hits++; b.classList.add('right'); if (tries <= need + 1) { earned += 25; gain(25, b); } }
        else b.classList.add('wrong');
        said.className = 'verdict ' + (t.hit ? 'ok' : 'no'); said.textContent = t.why || '';
        upd();
        if (hits === need) { $$('.thing', desk).forEach(function (x) { x.disabled = true; }); stage2(); }
      });
      desk.appendChild(b);
    });
    function stage2() {
      var wrap = el('div'); wrap.style.marginTop = '20px'; pbody.appendChild(wrap);
      wrap.appendChild(el('p', 'step-label', 'Step 2 of 2 · Name the real problem'));
      wrap.appendChild(el('p', 'brief', 'Those hacks are clues. ' + d.pain.q));
      quiz(d.pain.options, function (ok, b) {
        var pts = ok ? 125 : 0; if (ok) gain(pts, b);
        finish(1, 'Empath badge · +' + (earned + pts) * MOOD.mult + ' XP', d.lesson);
      }, wrap);
      wrap.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    }
  }

  /* ---------- Level 2: eval arena + set the bar ---------- */
  function lvl2() {
    var E = WORLD.evals;
    var cases = shuffle(E.cases).slice(0, 4);
    var p = cases.filter(function (c) { return c.pass; }).length;
    if (p === 0 || p === 4) { var swap = E.cases.filter(function (c) { return c.pass !== cases[0].pass; })[0]; if (swap) cases[3] = swap; }
    open('Level 2 · Prove', 'Test the AI');
    scene();
    pbody.appendChild(el('p', 'step-label', 'Step 1 of 2 · Check the AI\'s answers'));
    var gs = el('div', 'explain');
    gs.appendChild(el('b', null, 'What is a golden set? '));
    gs.appendChild(document.createTextNode('Real inputs, each with the answer a person checked and signed off. You compare the AI against it. Different words are fine. A missing or invented fact is a fail.'));
    pbody.appendChild(gs);
    pbody.appendChild(el('p', 'brief', E.rule + ' Below are 4 real examples. Pass or fail each AI answer.'));
    var ans = cases.map(function () { return null; });
    var go = el('button', 'btn', 'Score my evals'); go.disabled = true;
    cases.forEach(function (cs, i) {
      var c = el('div', 'card');
      c.appendChild(el('div', 'lab', 'Case ' + (i + 1) + ' · input'));
      c.appendChild(el('div', 'said', cs.said));
      var cmp = el('div', 'cmp');
      var ex = el('div', 'cmp-row exp'); ex.appendChild(el('span', 'cmp-k', 'Golden answer')); ex.appendChild(el('span', 'cmp-v', cs.expected || '')); cmp.appendChild(ex);
      var ai = el('div', 'cmp-row got'); ai.appendChild(el('span', 'cmp-k', 'AI said')); ai.appendChild(el('span', 'cmp-v', cs.ai)); cmp.appendChild(ai);
      c.appendChild(cmp);
      var pf = el('div', 'pf'), pb = el('button', 'pass', 'Pass'), fb = el('button', 'fail', 'Fail');
      [pb, fb].forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      function pick(v) { ans[i] = v; pb.classList.toggle('sel', v); fb.classList.toggle('sel', !v); pb.setAttribute('aria-pressed', String(v)); fb.setAttribute('aria-pressed', String(!v)); go.disabled = ans.indexOf(null) !== -1; }
      pb.addEventListener('click', function () { pick(true); }); fb.addEventListener('click', function () { pick(false); });
      pf.appendChild(pb); pf.appendChild(fb); c.appendChild(pf);
      cs._v = el('div', 'verdict'); c.appendChild(cs._v); cs._pf = pf;
      pbody.appendChild(c);
    });
    var row = el('div', 'row'); row.appendChild(go); pbody.appendChild(row);
    go.addEventListener('click', function () {
      var score = 0;
      cases.forEach(function (cs, i) {
        var ok = ans[i] === cs.pass; if (ok) score++;
        cs._v.className = 'verdict ' + (ok ? 'ok' : 'no');
        cs._v.textContent = (ok ? 'Right call. ' : 'This one is a ' + (cs.pass ? 'pass. ' : 'fail. ')) + cs.why;
        $$('button', cs._pf).forEach(function (b) { b.disabled = true; });
      });
      var pts = score * 60; gain(pts, go); row.remove();
      var wrap = el('div'); wrap.style.marginTop = '20px'; pbody.appendChild(wrap);
      wrap.appendChild(el('p', 'step-label', 'You scored ' + score + ' / 4 · Step 2 of 2 · Decide when it\'s good enough'));
      wrap.appendChild(el('p', 'brief', Q.bar.q));
      quiz(Q.bar.options, function (ok, b) { if (ok) gain(60, b); finish(2, 'Evaluator badge · +' + (pts + (ok ? 60 : 0)) * MOOD.mult + ' XP', Q.bar.lesson); }, wrap);
      wrap.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  /* ---------- Side quest: from the eval harness case study ---------- */
  function lvlSide() {
    var qs = shuffle(Q.side).slice(0, 2), earned = 0;
    open('Side quest · real case study', 'The AI testing tool');
    scene(Q.sideIntro);
    pbody.appendChild(el('p', 'brief', 'Two questions.'));
    function ask(i) {
      var q = qs[i], wrap = el('div'); if (i) wrap.style.marginTop = '20px'; pbody.appendChild(wrap);
      wrap.appendChild(el('p', 'step-label', 'Question ' + (i + 1) + ' of 2'));
      wrap.appendChild(el('p', 'brief', q.q));
      quiz(q.options, function (ok, b) {
        if (ok) { earned += 75; gain(75, b); }
        wrap.appendChild(el('p', 'verdict ' + (ok ? 'ok' : 'no'), q.lesson));
        if (i === 0) ask(1); else finish('side', 'Debugger badge · +' + earned * MOOD.mult + ' XP', 'The full story, with screenshots, is in the case study.');
      }, wrap);
      if (i) wrap.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    }
    ask(0);
  }

  /* ---------- Level 3: pick the MVP ---------- */
  function lvl3() {
    var M = WORLD.mvp, feats = shuffle(M.feats), picked = [];
    open('Level 3 · Shape & ship', 'Plan the first version');
    scene();
    pbody.appendChild(el('p', 'brief', M.brief));
    var slots = el('div', 'slots'); pbody.appendChild(slots);
    var box = el('div', 'opts'); pbody.appendChild(box);
    var go = el('button', 'btn', 'Ship it'); go.disabled = true;
    function upd() { slots.innerHTML = 'Slots used: <b>' + picked.length + ' / 3</b>'; go.disabled = picked.length !== 3; }
    feats.forEach(function (f, i) {
      var b = el('button', 'opt', f[0]); b.setAttribute('aria-pressed', 'false'); f._b = b;
      b.addEventListener('click', function () {
        var at = picked.indexOf(i);
        if (at > -1) picked.splice(at, 1); else if (picked.length < 3) picked.push(i);
        b.classList.toggle('pick', picked.indexOf(i) > -1); b.setAttribute('aria-pressed', String(picked.indexOf(i) > -1)); upd();
      });
      box.appendChild(b);
    });
    upd();
    var row = el('div', 'row'); row.appendChild(go); pbody.appendChild(row);
    go.addEventListener('click', function () {
      go.disabled = true; $$('button', box).forEach(function (b) { b.disabled = true; });
      var bar = el('div', 'buildbar'), fill = el('i'); bar.appendChild(fill); pbody.insertBefore(bar, row);
      bar.setAttribute('role', 'progressbar'); bar.setAttribute('aria-label', 'Building the release');
      requestAnimationFrame(function () { fill.style.width = '100%'; });
      setTimeout(function () {
        var score = 0;
        feats.forEach(function (f, i) {
          f._b.classList.remove('pick');
          if (f[1]) f._b.classList.add('right'); else if (picked.indexOf(i) > -1) f._b.classList.add('wrong');
          if (f[1] && picked.indexOf(i) > -1) score++;
        });
        row.remove(); gain(score * 100, slots);
        finish(3, score === 3 ? 'Shipper badge · perfect MVP · +' + 300 * MOOD.mult + ' XP' : 'Shipper badge · ' + score + ' / 3 · +' + score * 100 * MOOD.mult + ' XP', M.lesson);
      }, reduce ? 50 : 1300);
    });
  }

  var games = { '0': lvl0, '1': lvl1, '2': lvl2, 'side': lvlSide, '3': lvl3 };
  function play(l) { if (l === 'boss') { location.href = '/work/'; return; } if (!WORLD || !games[l]) return; games[l](); }
  levels.forEach(function (b) { b.addEventListener('click', function () { if (!b.disabled) play(b.getAttribute('data-l')); }); });
  renderMap();

  /* ---------- guide: Mo hops around the page ---------- */
  var guide = $('#guide'), say = $('#guide-say'), choices = $('#guide-choices'), moBtn = $('#mo-btn');
  var sprite = $('.mo-sprite', guide), bubble = $('.bubble', guide);
  var typing = null, here = null, cur = { x: 0, y: 0 }, busy = false;
  function typeText(t) {
    if (typing) clearInterval(typing);
    if (reduce) { say.textContent = t; return; }
    var i = 0; say.textContent = '';
    typing = setInterval(function () { i += 2; say.textContent = t.slice(0, i); if (i >= t.length) { clearInterval(typing); typing = null; } }, 16);
  }
  function choice(label, cls, fn) { var b = el('button', 'btn sm ' + (cls || ''), label); b.type = 'button'; b.addEventListener('click', fn); choices.appendChild(b); return b; }
  function nodeOf(l) { var b = $('.lvl[data-l="' + l + '"] .node'); return b; }
  /* where Mo stands for a target: sitting on top of it, or beside a heading */
  function spot(t) {
    var r = t.getBoundingClientRect(), sx = window.scrollX, sy = window.scrollY, size = sprite.offsetWidth || 72;
    var x, y;
    if (t.classList.contains('node')) { x = r.left + r.width / 2 - size / 2; y = r.top - size + 10; }
    else { x = Math.min(r.right + 12, window.innerWidth - size - 16); y = r.top + r.height / 2 - size / 2; if (x < r.left) { x = r.left; y = r.top - size - 4; } }
    return { x: Math.round(x + sx), y: Math.round(y + sy) };
  }
  function placeBubble() {
    var vw = document.documentElement.clientWidth, size = sprite.offsetWidth || 72;
    bubble.style.left = ''; bubble.style.right = ''; bubble.style.top = '';
    var bw = Math.min(380, vw - 32), vx = cur.x - window.scrollX;
    bubble.style.width = bw + 'px';
    var narrow = vw < 720;
    if (narrow) { var th = here && here.classList.contains('node') ? here.offsetHeight - 10 : 0; bubble.style.top = (size + th + 12) + 'px'; bubble.style.left = (16 - vx) + 'px'; guide.classList.add('below'); guide.classList.remove('left'); return; }
    guide.classList.remove('below');
    if (vx + size + 14 + bw <= vw - 16) { bubble.style.left = (size + 14) + 'px'; guide.classList.remove('left'); }
    else { bubble.style.left = (-bw - 14) + 'px'; guide.classList.add('left'); }
    bubble.style.top = '-6px';
  }
  function setPos(p) { cur = p; guide.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px)'; }
  function hudH() { var h = $('.hud'); return h ? h.getBoundingClientRect().bottom : 0; }
  function inView(t) { var r = t.getBoundingClientRect(), narrow = document.documentElement.clientWidth < 720; return r.top > hudH() + 90 && r.bottom < window.innerHeight - (narrow ? 260 : 40); }
  function scrollTo(t) {
    var r = t.getBoundingClientRect(), narrow = document.documentElement.clientWidth < 720;
    var y = narrow ? r.top + window.scrollY - hudH() - 96 : r.top + window.scrollY - window.innerHeight / 2 + r.height / 2;
    window.scrollTo({ top: Math.max(0, y), behavior: reduce ? 'auto' : 'smooth' });
  }
  function hop(t, then) {
    if (!t) { then && then(); return; }
    here = t; busy = true; bubble.classList.add('away');
    function go() {
      var to = spot(t), from = cur;
      if (reduce || guide.hidden || !guide.dataset.placed) { guide.dataset.placed = '1'; setPos(to); arrive(); return; }
      var dx = to.x - from.x, dy = to.y - from.y, lift = Math.min(160, 60 + Math.abs(dx) * 0.15);
      sprite.classList.add('jumping');
      var a = guide.animate([
        { transform: 'translate(' + from.x + 'px,' + from.y + 'px)' },
        { transform: 'translate(' + (from.x + dx * 0.5) + 'px,' + (Math.min(from.y, to.y) - lift) + 'px)', offset: 0.5 },
        { transform: 'translate(' + to.x + 'px,' + to.y + 'px)' }
      ], { duration: 650, easing: 'cubic-bezier(.4,0,.3,1)' });
      a.onfinish = function () { setPos(to); sprite.classList.remove('jumping'); sprite.classList.add('land'); setTimeout(function () { sprite.classList.remove('land'); }, 220); arrive(); };
    }
    function arrive() { busy = false; placeBubble(); bubble.classList.remove('away'); then && then(); }
    if (!inView(t)) { scrollTo(t); setTimeout(go, reduce ? 0 : 500); }
    else go();
  }
  function stop(t, text, opts) { hop(t, function () { choices.innerHTML = ''; typeText(text); (opts || []).forEach(function (o) { choice(o[0], o[1], o[2]); }); }); }
  function celebrate() {
    if (reduce || guide.hidden) return;
    sprite.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-34px) rotate(-8deg)' }, { transform: 'translateY(0)' }, { transform: 'translateY(-18px) rotate(8deg)' }, { transform: 'translateY(0)' }], { duration: 700, easing: 'ease-out' });
  }

  function goRead() { S.guide.mode = 'read'; S.guide.seen = true; save(); track('mode_switch', { to: 'read' }); location.href = '/notes/'; }
  function goPlay() { S.guide.mode = 'play'; S.guide.seen = true; save(); hideGuide(true); play(nextLevel()); }
  var tour = [
    function () { stop(nodeOf('0'), 'Each tile is a one-minute level. Start here. Every level teaches one idea about building AI products.', [['Next', '', nextTour], ['Skip tour', 'ghost', endTour]]); },
    function () { stop(nodeOf('2'), 'In this one you test an AI\'s answers against answers a person signed off. It\'s how real AI products get checked.', [['Next', '', nextTour], ['Skip tour', 'ghost', endTour]]); },
    function () { stop(nodeOf('side'), 'This optional side quest comes from a real project Gayatri worked on.', [['Next', '', nextTour], ['Skip tour', 'ghost', endTour]]); },
    function () { stop(nodeOf('boss'), 'Clear the levels to unlock co-op mode: working with Gayatri on your own idea, as a team.', [['Next', '', nextTour], ['Skip tour', 'ghost', endTour]]); },
    function () { stop($('.read-instead'), 'Every level is also a post. If you\'d rather read, the notes and how to work with Gayatri are always one click away.', [['Play the quest', '', goPlay], ['Just read', 'ghost', goRead]]); }
  ];
  var tourAt = 0;
  function nextTour() { tourAt++; if (tour[tourAt]) tour[tourAt](); else endTour(); }
  function startTour() { track('tour_started'); S.guide.seen = true; save(); tourAt = 0; tour[0](); }
  function endTour() { S.guide.seen = true; save(); script(); }

  function script() {
    var nx = nextLevel(), name = WORLD ? WORLD.name : '';
    if (!S.guide.seen) {
      stop(nodeOf('0'), "Hi, I'm Mo! You play a product manager: the person who decides what gets built. This week's product: " + name + '. ' + (MOOD.mult > 1 ? MOOD.hi + ' ' : '') + 'Want a quick tour?',
        [['Show me around', '', startTour], ['Play now', 'ghost', goPlay], ['Just read', 'ghost', goRead], ['Classic mode', 'ghost', function () { S.guide.seen = true; setMode(true); }]]);
    } else if (newWeek && S.lastWeek && !S.weekGreeted) {
      S.weekGreeted = WEEK; save();
      stop(nodeOf(nx), 'Welcome back! New week, new product: ' + name + '. The levels are fresh. Your lifetime XP and streak are safe.' + (MOOD.mult > 1 ? ' ' + MOOD.hi : ''), [['Play this week', '', goPlay], ['Just read', 'ghost', goRead]]);
    } else if (nx !== 'boss') {
      var lbl = { '0': 'the first level', '1': 'level 1', '2': 'level 2', '3': 'level 3' }[nx];
      stop(nodeOf(nx), (MOOD.hi ? MOOD.hi + ' ' : '') + 'Next up: ' + lbl + '. It takes about a minute.', [[S.done[0] ? 'Continue' : 'Play', '', goPlay], ['Show me around', 'ghost', startTour], ['Just read', 'ghost', goRead]]);
    } else {
      stop(nodeOf('boss'), "You cleared this week's quest! A new product arrives next week. Co-op mode is open: build your own idea with Gayatri. Or read the notes.", [['Work with Gayatri', '', function () { location.href = '/work/'; }], ['Read notes', 'ghost', goRead]]);
    }
  }
  function showGuide(fresh) {
    if (!guide || S.classic || !overlay.hidden) return;
    var was = guide.hidden; guide.hidden = false; moBtn.hidden = true;
    if (was) { guide.dataset.placed = ''; }
    script();
    if (fresh) setTimeout(celebrate, reduce ? 0 : 700);
  }
  function hideGuide(quiet) { if (!guide) return; guide.hidden = true; if (typing) { clearInterval(typing); typing = null; } moBtn.hidden = !!S.classic; if (!quiet) moBtn.focus({ preventScroll: true }); }
  $('#guide-hide').addEventListener('click', function () { S.guide.seen = true; save(); hideGuide(); });
  moBtn.addEventListener('click', function () { showGuide(); });
  window.addEventListener('resize', function () { if (!guide.hidden && here && !busy) { setPos(spot(here)); placeBubble(); } });
  /* Mo cheers and hops on when a level is cleared */
  var lastDone = Object.keys(S.done).length;
  close = function () {
    overlay.hidden = true; renderMap(); if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    if (S.classic) return;
    var n = Object.keys(S.done).length, fresh = n > lastDone; lastDone = n;
    setTimeout(function () { showGuide(fresh); }, 320);
  };

  /* deep link from a post: /#play-2 */
  var h = (location.hash || '').replace('#play-', '');
  if (location.hash.indexOf('#play-') === 0 && games[h] && unlocked(h)) { play(h); }
  else if (!S.classic) {
    if (S.guide.seen && S.guide.mode === 'read' && !newWeek) { guide.hidden = true; moBtn.hidden = false; }
    else setTimeout(function () { showGuide(); }, reduce ? 0 : 600);
  } else { guide.hidden = true; moBtn.hidden = true; }
})();
