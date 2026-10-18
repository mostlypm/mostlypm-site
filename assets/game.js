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
    1: { name: 'Focus Monday', classic: true, mult: 1, hi: "It's Focus Monday, so the site opens in classic mode." },
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
  if (newWeek) { S.lastWeek = S.week; S.week = WEEK; S.done = {}; S.weekXp = 0; }
  S.classic = S.modeDay === TODAY ? !!S.classic : MOOD.classic;
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
    document.documentElement.classList.toggle('classic', !!S.classic);
    $$('[data-quest-link]').forEach(function (q) {
      q.textContent = S.classic ? 'Play the quest' : 'Quest';
      if (S.classic) q.removeAttribute('aria-current'); else if (location.pathname === '/') q.setAttribute('aria-current', 'page');
    });
    $$('[data-mode-toggle]').forEach(function (b) { b.textContent = S.classic ? 'Game mode' : 'Classic mode'; b.setAttribute('aria-label', S.classic ? 'Switch to game mode' : 'Not feeling playful? Switch to classic mode'); });
  }
  function setMode(classic) { S.classic = classic; S.modeDay = TODAY; save(); applyMode(); if (classic) hideGuide(true); else if (isHub) showGuide(); }
  $$('[data-mode-toggle]').forEach(function (b) { b.addEventListener('click', function () { setMode(!S.classic); }); });
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
  $$('[data-mood-note]').forEach(function (n) { if (DOW === 1) { n.hidden = false; } });

  /* Post pages: a "play this level" banner */
  $$('[data-level-link]').forEach(function (a) { var l = a.getAttribute('data-level-link'); a.href = '/#play-' + l; });

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
  function close() { overlay.hidden = true; renderMap(); if (lastFocus && lastFocus.focus) lastFocus.focus(); if (!S.classic) setTimeout(showGuide, 300); }
  $('#close').addEventListener('click', close);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !overlay.hidden) close(); });

  function finish(l, big, text) {
    var fb = el('div', 'fb'); fb.appendChild(el('div', 'big', big)); fb.appendChild(el('p', null, text));
    var row = el('div', 'row');
    var nextMap = { 0: '1', 1: '2', 2: '3', side: '3', 3: 'boss' };
    var nx = nextMap[l];
    var nb = el('button', 'btn', nx === 'boss' ? 'Boss level →' : 'Next level →');
    nb.addEventListener('click', function () { if (nx === 'boss') { location.href = '/work/'; } else play(nx); });
    var rd = el('a', 'btn ghost', 'Read the post'); rd.href = postUrl(l);
    row.appendChild(nb); row.appendChild(rd);
    if (l === 2 && !S.done.side) { var sq = el('button', 'btn ghost', 'Side quest'); sq.addEventListener('click', function () { play('side'); }); row.appendChild(sq); }
    fb.appendChild(row); pbody.appendChild(fb);
    if (!S.done[l]) { S.done[l] = true; if (BADGE[l]) S.badges[BADGE[l]] = true; markWeek(); save(); renderMap(); }
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

  function scene() { if (WORLD && WORLD.scene) { var d = el('div', 'scene'); d.appendChild(el('b', null, 'The setting: ')); d.appendChild(document.createTextNode(WORLD.scene)); pbody.appendChild(d); } }

  /* ---------- Level 0 ---------- */
  function lvl0() {
    var q = Q.start[weekIndex % Q.start.length];
    open('Start · this week', 'When building is cheap');
    pbody.appendChild(el('p', 'brief', q.q));
    quiz(q.options, function (ok, b) { if (ok) gain(XP[0], b); finish(0, ok ? 'Correct. +' + XP[0] * MOOD.mult + ' XP' : 'Not quite.', q.lesson); });
  }

  /* ---------- Level 1: shadow the user ---------- */
  function lvl1() {
    var d = WORLD.desk;
    open('Level 1 · Understand · ' + WORLD.name, 'Find the real problem');
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
    open('Level 2 · Prove · ' + WORLD.name, 'Test the AI');
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
    var si = el('div', 'scene'); si.appendChild(el('b', null, 'The setting: ')); si.appendChild(document.createTextNode(Q.sideIntro)); pbody.appendChild(si);
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
    open('Level 3 · Shape & ship · ' + WORLD.name, 'Plan the first version');
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

  /* ---------- guide ---------- */
  var guide = $('#guide'), say = $('#guide-say'), choices = $('#guide-choices'), moBtn = $('#mo-btn');
  var typing = null;
  function typeText(t) {
    if (typing) clearInterval(typing);
    if (reduce) { say.textContent = t; return; }
    var i = 0; say.textContent = '';
    typing = setInterval(function () { i += 2; say.textContent = t.slice(0, i); if (i >= t.length) { clearInterval(typing); typing = null; } }, 18);
  }
  function choice(label, cls, fn) { var b = el('button', 'btn sm ' + (cls || ''), label); b.type = 'button'; b.addEventListener('click', fn); choices.appendChild(b); return b; }
  function goRead() { S.guide.mode = 'read'; S.guide.seen = true; save(); hideGuide(); var t = $('#log'); if (t) t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }
  function goPlay() { S.guide.mode = 'play'; S.guide.seen = true; save(); hideGuide(); play(nextLevel()); }
  function script() {
    choices.innerHTML = '';
    var nx = nextLevel(), name = WORLD ? WORLD.name : '';
    if (!S.guide.seen) {
      typeText("Hi, I'm Mo, Gayatri's quest guide. This site is a little game: four one-minute levels that teach how she builds AI products. This week's world is " + name + '. ' + (MOOD.mult > 1 ? MOOD.hi + ' ' : '') + 'Want to play, or just read?');
      choice('Play the quest', '', goPlay); choice('Just read', 'ghost', goRead); choice('Classic mode', 'ghost', function () { S.guide.seen = true; setMode(true); });
    } else if (newWeek && S.lastWeek) {
      typeText('Welcome back! New week, new world: ' + name + '. The levels are fresh. Your lifetime XP and streak are safe.' + (MOOD.mult > 1 ? ' ' + MOOD.hi : ''));
      choice('Play this week', '', goPlay); choice('Just read', 'ghost', goRead);
    } else if (nx !== 'boss') {
      typeText((MOOD.hi ? MOOD.hi + ' ' : '') + (S.done[0] ? 'Next up: level ' + nx + '. It takes about a minute.' : 'Ready when you are. Level one takes about a minute.'));
      choice(S.done[0] ? 'Continue' : 'Play', '', goPlay); choice('Just read', 'ghost', goRead);
    } else {
      typeText("You cleared this week's quest. A new world arrives next week. Meanwhile, read the notes or meet the boss.");
      choice('Read notes', 'ghost', goRead); choice('Work with Gayatri', '', function () { location.href = '/work/'; });
    }
  }
  function showGuide() { if (!guide || S.classic || !overlay.hidden) return; guide.hidden = false; moBtn.hidden = true; script(); }
  function hideGuide(quiet) { if (!guide) return; guide.hidden = true; if (typing) { clearInterval(typing); typing = null; } moBtn.hidden = !!S.classic; if (!quiet) moBtn.focus({ preventScroll: true }); }
  $('#guide-hide').addEventListener('click', function () { S.guide.seen = true; save(); hideGuide(); });
  moBtn.addEventListener('click', showGuide);

  /* deep link from a post: /#play-2 */
  var h = (location.hash || '').replace('#play-', '');
  if (location.hash.indexOf('#play-') === 0 && games[h] && unlocked(h)) { play(h); }
  else if (!S.classic) {
    if (S.guide.seen && S.guide.mode === 'read' && !newWeek) { guide.hidden = true; moBtn.hidden = false; }
    else setTimeout(showGuide, reduce ? 0 : 500);
  } else { guide.hidden = true; moBtn.hidden = true; }
})();
