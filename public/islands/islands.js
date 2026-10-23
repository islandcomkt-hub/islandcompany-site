/* Explorador de ilhas 3D da Island Company.
   Cena única em Three.js (assets/scene3d.js): oceano, seis ilhas modeladas em código e o barco. Câmera cinematográfica,
   barco em trajetória curva com rastro. Estados: overview | approaching | focused | travelling | returning.
   Dados: window.ISLAND_DATA (gerado por tools/build-islands.py). Sem rastreamento, sem armazenamento, sem rede além dos próprios arquivos.
   Se o WebGL falhar, a lista estática das seis ilhas (com os mesmos CTAs) aparece no lugar. */
(function () {
  'use strict';
  var D = window.ISLAND_DATA, root = document.getElementById('isl');
  if (!D || !root) return;

  var stage = document.getElementById('isl-stage'), world = document.getElementById('isl-world');
  var panel = document.getElementById('isl-panel'), live = document.getElementById('isl-live');
  var RM = matchMedia('(prefers-reduced-motion: reduce)'), MQ = matchMedia('(max-width: 820px)');
  var N = D.islands.length;

  var W = 0, HO = 0, HF = 0, mobile = false;
  var nodes = [], sc = null, canvas = null, failed = false, loaded = false, loading = null;
  var state = 'overview', cur = -1, boatAt = 0, boatSide = 1, boatRy = 0, dest = -2, pending = null, tk = 0, lastTrigger = null;
  var cam = null, curHO = 0, hoverIdx = -1, raf = 0, anim = null, inView = false;

  function el(tag, cls, parent) { var e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function norm(a) { return ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; }
  var easeIO = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  function setState(s) { state = s; root.dataset.state = s; world.inert = s !== 'overview'; }

  /* ---------- botões-rótulo (acessíveis; ficam sobre a cena na visão geral) ---------- */
  D.islands.forEach(function (d, i) {
    var b = el('button', 'isl-i', world); b.type = 'button'; b.dataset.id = d.id; b.dataset.i = i;
    b.style.setProperty('--ac', d.accent);
    b.setAttribute('aria-label', d.name + ': ' + d.description + '. Abrir detalhes, ilha ' + (i + 1) + ' de ' + N);
    var lb = el('span', 'isl-lb', b); el('i', '', lb); var nm = el('b', '', lb), pre = el('span', 'isl-pre', nm); pre.textContent = 'Island '; nm.appendChild(document.createTextNode(String(d.name).replace(/^Island\s+/, ''))); var sm = el('small', '', lb); sm.textContent = pad(i + 1);
    b.addEventListener('click', function () { lastTrigger = b; request(i); });
    b.addEventListener('pointerenter', function () { hoverIdx = i; if (sc) { sc.setHover(i); renderNow(); } });
    b.addEventListener('pointerleave', function () { hoverIdx = -1; if (sc) { sc.setHover(-1); renderNow(); } });
    b.addEventListener('focus', function () { if (sc) { sc.setHover(i); renderNow(); } });
    b.addEventListener('blur', function () { if (sc) { sc.setHover(-1); renderNow(); } });
    nodes.push(b);
  });

  /* ---------- medidas ---------- */
  function measure() {
    mobile = MQ.matches; W = Math.round(root.clientWidth); HO = Math.round(W * (mobile ? 0.64 : 0.56));
    if (!mobile) { var sec = root.closest('section'), hd = sec && (sec.querySelector('.svc-head') || sec), off = hd ? root.getBoundingClientRect().top - hd.getBoundingClientRect().top : 0; HO = Math.round(Math.max(W * 0.36, Math.min(HO, innerHeight - 72 - 16 - off - 20))); }
    HF = HO;
    if (canvas) canvas.style.height = HO + 'px';
  }
  function vfrac() { return 1; }
  function camOverview() { return sc.camFor(-1, W / HO); }
  /* entrada por scroll: a câmera desce sobre o arquipélago e o palco se revela conforme a seção entra na tela */
  var enterK = 1, enterDone = false;
  function introCam(c, k) { if (k <= 0.001) return c; var o = {}; for (var q in c) o[q] = c[q]; o.d = c.d * (1 + 0.42 * k); o.el = c.el + 0.34 * k; o.az = c.az + 0.5 * k; return o; }
  function enterProgress() { var r = root.getBoundingClientRect(); return Math.max(0, Math.min(1, (innerHeight - r.top) / (innerHeight * (mobile ? 0.62 : 0.78)))); }
  var enRaf = 0;
  function applyEnter() {
    enRaf = 0; if (RM.matches) { enterK = 0; stage.style.removeProperty('--en'); world.style.removeProperty('opacity'); return; }
    var p = enterProgress(), e = 1 - Math.pow(1 - p, 3); enterK = 1 - e;
    stage.style.setProperty('--en', e.toFixed(3)); world.style.opacity = Math.max(0, (e - 0.55) / 0.45).toFixed(3);
    if (sc && state === 'overview' && !anim) { cam = introCam(camOverview(), enterK); sc.setCam(cam); wake(); }
  }
  function onScrollEnter() { if (!enRaf) enRaf = requestAnimationFrame(applyEnter); }
  addEventListener('scroll', onScrollEnter, { passive: true });
  function camFocus(i) { return sc.camFor(i, W / HO, vfrac()); }
  function hoFor(i) { return i >= 0 ? HF : HO; }
  function setHO(h) { curHO = h; stage.style.setProperty('--ho', h.toFixed(1) + 'px'); }
  function applyCam(c, ho) { cam = c; sc.setCam(c); setHO(ho == null ? curHO : ho); }

  function updateLabels() {
    if (!sc || state !== 'overview') return;
    for (var i = 0; i < N; i++) {
      var p = sc.project(i), n = nodes[i], r = p.r, w = r * 2.1, top = Math.max(0, p.top - r * 0.1), bottom = p.y + r * 0.62;
      n.style.left = (p.x - w / 2).toFixed(1) + 'px'; n.style.top = top.toFixed(1) + 'px'; n.style.width = w.toFixed(1) + 'px'; n.style.height = Math.max(60, bottom - top).toFixed(1) + 'px';
    }
  }

  /* ---------- laço de renderização (só roda quando precisa) ---------- */
  function renderNow() { if (!sc) return; sc.render(performance.now()); if (state === 'overview') updateLabels(); }
  function needLoop() { return !!anim || (!RM.matches && inView); }
  function tick(now) {
    raf = 0;
    if (anim) anim(now);
    if (sc) { sc.render(now); if (state === 'overview') updateLabels(); }
    if (needLoop() && !document.hidden) raf = requestAnimationFrame(tick);
  }
  function wake() { if (!raf && !document.hidden && sc) raf = requestAnimationFrame(tick); }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) wake(); });

  /* ---------- painel ---------- */
  function ctaUrl(d) { return 'https://onboarding.islandcompany.space'; }
  function words(text, d0, step, cls) {
    return String(text).split(' ').map(function (w, k) { return '<span class="isw"><span style="--w:' + k + '">' + esc(w) + '</span></span>'; }).join(' ');
  }
  function personCard(d, k) {
    var p = d.person;
    return '<div class="isl-person isl-p3 pi" style="--i:' + k + '"><div class="p3-in">' +
      '<div class="p3-ph"><img src="' + esc(p.photo) + '" alt="' + esc(p.alt) + '" width="480" height="420" decoding="async"><span class="p3-gl" aria-hidden="true"></span><span class="p3-cn" aria-hidden="true"></span><b class="p3-nm">' + esc(p.name) + '</b></div>' +
      '<div class="p3-inf"><p>' + esc(p.role) + '</p>' +
      '<a href="' + esc(D.instagramSamuel) + '" target="_blank" rel="noopener">' + esc(p.instagramLabel) + '</a>' +
      (d.showcaseUrl ? '<a href="' + esc(d.showcaseUrl) + '" target="_blank" rel="noopener">Ver showcase</a>' : '<small>' + esc(p.showcasePending) + '</small>') + '</div></div></div>';
  }
  function renderPanel(i) {
    var d = D.islands[i], pv = D.islands[(i - 1 + N) % N], nx = D.islands[(i + 1) % N], k = 0;
    panel.style.setProperty('--ac', d.accent); root.style.setProperty('--ac', d.accent);
    panel.style.setProperty('--cr', (i % 2 ? 1 : -1) * (10 + (i % 3) * 3) + 'deg'); panel.style.setProperty('--cx', (i % 2 ? -1 : 1) * (34 + (i % 3) * 8) + 'px');
    var h = '<div class="isl-meta pi" style="--i:' + (k++) + '">' + esc(d.name) + '<span>' + pad(i + 1) + ' / ' + pad(N) + '</span></div>' +
      '<h3 class="isl-t" tabindex="-1" id="isl-h">' + words(d.title) + '</h3>';
    if (d.person) h += personCard(d, k++);
    h += '<p class="isl-d">' + words(d.description) + '</p>' +
      '<ul class="isl-ft pi" style="--i:' + (k += 6) + '">' + d.features.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>';
    h += '<a class="btn p isl-cta pi" data-cta href="' + ctaUrl(d) + '" style="--i:' + (k++ + 1) + '">' + esc(d.cta) + '</a>' +
      '<div class="isl-nav pi" style="--i:' + (k++ + 1) + '">' +
      '<button type="button" class="isl-nb" data-act="prev" aria-label="Ilha anterior: ' + esc(pv.name) + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>' +
      '<div class="isl-dots" aria-hidden="true">' + D.islands.map(function (_, j) { return '<i' + (j === i ? ' class="on"' : '') + '></i>'; }).join('') + '</div>' +
      '<button type="button" class="isl-nb" data-act="next" aria-label="Próxima ilha: ' + esc(nx.name) + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>' +
      '<button type="button" class="isl-all" data-act="all">Ver todas as ilhas</button></div>';
    panel.classList.toggle('has-p3', !!d.person); panel.innerHTML = h; panel.style.setProperty('--dw', d.person ? '1180ms' : '520ms'); bindTilt();
  }
  /* card 3D do parceiro: inclina com o ponteiro; sem ponteiro fino, balança sozinho */
  var tiltOff = null;
  function bindTilt() {
    if (tiltOff) { tiltOff(); tiltOff = null; }
    var c = panel.querySelector('.isl-p3'); if (!c) return;
    var inn = c.querySelector('.p3-in'), fine = matchMedia('(hover:hover) and (pointer:fine)').matches, f = 0, tx = 0, ty = 0;
    if (RM.matches) return;
    function apply() { f = 0; inn.style.setProperty('--rx', tx.toFixed(2) + 'deg'); inn.style.setProperty('--ry', ty.toFixed(2) + 'deg'); inn.style.setProperty('--gx', (50 + ty * 3.2).toFixed(1) + '%'); inn.style.setProperty('--gy', (50 - tx * 3.2).toFixed(1) + '%'); }
    function mv(e) { var r = c.getBoundingClientRect(); var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; ty = x * 18; tx = -y * 14; if (!f) f = requestAnimationFrame(apply); }
    function lv() { tx = ty = 0; if (!f) f = requestAnimationFrame(apply); c.classList.remove('hot'); }
    function en() { c.classList.add('hot'); }
    if (fine) { c.addEventListener('pointermove', mv); c.addEventListener('pointerenter', en); c.addEventListener('pointerleave', lv); c.classList.add('fine'); }
    tiltOff = function () { c.removeEventListener('pointermove', mv); c.removeEventListener('pointerenter', en); c.removeEventListener('pointerleave', lv); if (f) cancelAnimationFrame(f); };
  }
  panel.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-act]'); if (!b) return;
    var act = b.dataset.act;
    if (act === 'all') request(-1); else request(step(act === 'next' ? 1 : -1));
  });
  function step(dir) { var base = pending && pending.i >= 0 ? pending.i : (dest >= 0 ? dest : cur); return (base + dir + N) % N; }
  function closePanel() { if (panel.dataset.open === 'true') { panel.dataset.open = 'false'; } panel.inert = true; }
  function openPanel() { panel.dataset.open = 'true'; panel.inert = false; }

  /* ---------- carregamento progressivo (sem tela de loading) ---------- */
  function fail(why) {
    if (failed) return; failed = true; tk++; anim = null;
    root.classList.add('isl-nogl'); setState('overview');
    if (live) live.textContent = 'A cena 3D não está disponível neste dispositivo. Veja a lista das ilhas abaixo.';
    if (window.console) console.warn('[ilhas] cena 3D indisponível:', why);
  }
  function preload() {
    if (loading) return loading;
    loading = import('./scene3d.js').then(function (mod) {
      measure();
      canvas = el('canvas', 'isl-cv', stage); canvas.setAttribute('aria-hidden', 'true'); stage.insertBefore(canvas, stage.firstChild); canvas.style.height = HO + 'px';
      canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); fail('contexto perdido'); });
      try { sc = mod.createScene(canvas, D); } catch (e) { fail(e && e.message || e); return; }
      sc.layout(mobile); sizeCanvas();
      boatRy = sc.dockBoat(boatAt, boatSide);
      applyEnter(); setHO(HO); applyCam(introCam(camOverview(), enterK), HO); sc.setFocus(-1);
      var extra = D.islands.filter(function (d) { return d.person; }).map(function (d) { return new Promise(function (r) { var p = new Image(); p.onload = p.onerror = r; p.src = d.person.photo; }); });
      return Promise.all(extra).then(function () {
        renderNow(); loaded = true; stage.classList.add('ready'); nodes.forEach(function (n) { n.classList.add('ready'); n.tabIndex = 0; });
        updateLabels(); wake();
      });
    }, function (e) { fail(e && e.message || e); });
    return loading;
  }
  function sizeCanvas() { if (!sc) return; sc.resize(W, HO, Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2)); }

  /* ---------- transições ---------- */
  function request(target) {
    if (failed) return;
    if (!loaded) { preload().then(function () { if (loaded) request(target); }); return; }
    var busy = state === 'approaching' || state === 'travelling' || state === 'returning';
    if (busy) { pending = { i: target }; return; }
    if (target === -1 && state === 'overview') return;
    if (target >= 0 && target === cur && state === 'focused') return;
    transit(target);
  }
  function run(ms, id, fn) {
    return new Promise(function (res) {
      var t0 = null;
      anim = function (now) {
        if (id !== tk) { anim = null; return res(false); }
        if (t0 === null) t0 = now;
        var e = now - t0; fn(Math.min(e, ms), now);
        if (e >= ms) { anim = null; res(true); }
      };
      wake();
    });
  }
  function dimFor(i) { nodes.forEach(function (n, j) { n.classList.toggle('dim', i >= 0 && j !== i); }); }
  function activeAct() {
    var a = document.activeElement;
    if (a && panel.contains(a)) return a.dataset && a.dataset.act ? a.dataset.act : (a.id === 'isl-h' ? 'h' : null);
    return null;
  }

  function transit(target) {
    var id = ++tk, from = state === 'overview' ? -1 : cur, act = activeAct();
    if (target < 0 && cur >= 0) lastTrigger = nodes[cur];
    var toFocus = target >= 0, travelBoat = toFocus && boatAt !== target;
    dest = target; pending = null;
    setState(from === -1 ? 'approaching' : (toFocus ? 'travelling' : 'returning'));
    if (toFocus && from === -1 && mobile) { var r = root.getBoundingClientRect(); if (r.top < 70 || r.top > innerHeight * 0.35) root.scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: 'start' }); }
    if (act) { root.tabIndex = -1; root.focus({ preventScroll: true }); }
    closePanel(); dimFor(toFocus ? target : -1); sc.setFocus(toFocus ? target : -1);

    var c0 = cam, c1 = toFocus ? camFocus(target) : camOverview(), ho0 = curHO, ho1 = hoFor(toFocus ? target : -1);
    var T = RM.matches ? 0 : (travelBoat ? 2500 : (toFocus ? 1200 : 1050));
    var path = null, side = boatSide, nry = boatRy;
    if (travelBoat) {
      var A = sc.dock(boatAt), B = sc.dock(target); side = B.x >= A.x ? 1 : -1;
      path = sc.makePath(boatAt, target, boatRy, sc.dockHeading(target, side));
      if (!RM.matches) T = Math.max(2600, Math.min(5200, Math.round(1500 + path.len * 38)));
    }
    var lift = (from >= 0 && toFocus) ? Math.max(c0.d, c1.d) * 0.5 : 0;
    var BS = 250, BE = T - 450, sRot = boatRy, lastNow = 0, lastRy = boatRy;

    function finish() {
      if (travelBoat) { boatAt = target; boatSide = side; boatRy = sc.dockBoat(target, side); }
      applyCam(c1, ho1); sc.clearWake(); renderNow();
      cur = toFocus ? target : -1; dest = -2;
      if (toFocus) {
        renderPanel(target); setState('focused'); openPanel();
        if (act === 'prev' || act === 'next' || act === 'all') { var b = panel.querySelector('[data-act="' + act + '"]'); if (b) b.focus({ preventScroll: true }); }
        else if (act === 'h' || from === -1) { var h = panel.querySelector('#isl-h'); if (h) h.focus({ preventScroll: true }); }
        if (act) live.textContent = D.islands[target].name + ', ilha ' + (target + 1) + ' de ' + N;
        nodes.forEach(function (n) { n.tabIndex = -1; });
      } else {
        setState('overview'); nodes.forEach(function (n) { n.tabIndex = 0; }); updateLabels();
        var t = lastTrigger || nodes[0]; root.removeAttribute('tabindex'); if (t) t.focus({ preventScroll: true });
        live.textContent = 'Todas as ilhas';
      }
      if (root.getAttribute('tabindex') === '-1' && toFocus) root.removeAttribute('tabindex');
      if (pending) { var p = pending.i; pending = null; request(p); }
    }
    if (T === 0) { finish(); return; }

    run(T, id, function (e, now) {
      var c = easeIO(e / T), bp = null;
      if (travelBoat) {
        var b = Math.max(0, Math.min(1, (e - BS) / (BE - BS))), s = path.at(easeIO(b)), dt = lastNow ? Math.min((now - lastNow) / 1000, 0.1) : 0.016; lastNow = now;
        var tr = Math.atan2(-s.tz, s.tx), k = 1 - Math.exp(-dt * 8);
        if (b >= 1) tr = sc.dockHeading(target, side);
        sRot = sRot + norm(tr - sRot) * k; var turn = norm(sRot - lastRy) / (dt || 0.016); lastRy = sRot;
        var bank = Math.max(-0.14, Math.min(0.14, -turn * 0.06));
        sc.placeBoat(s.x, s.z, sRot, bank); bp = s; boatRy = sRot;
        if (b > 0 && b < 1) sc.emitWake(s.x, s.z, s.tx, s.tz, now);
      }
      applyCam(sc.mixCam(c0, c1, c, lift, bp, travelBoat ? 0.22 : 0), lerp(ho0, ho1, c));
    }).then(function (ok) { if (ok) finish(); });
  }

  /* ---------- teclado ---------- */
  root.addEventListener('keydown', function (e) {
    var t = e.target; if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'Escape' && state !== 'overview') { e.preventDefault(); request(-1); }
    else if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && (state === 'focused' || state === 'travelling' || state === 'approaching')) {
      e.preventDefault(); request(step(e.key === 'ArrowRight' ? 1 : -1));
    }
  });

  /* ---------- ciclo de vida: prefetch, pausa fora da tela, resize ---------- */
  measure(); setState('overview'); setHO(HO); nodes.forEach(function (n) { n.tabIndex = -1; });
  new IntersectionObserver(function (es) { if (es[0].isIntersecting) preload(); }, { rootMargin: '900px 0px' }).observe(root);
  new IntersectionObserver(function (es) {
    inView = es[0].isIntersecting; root.classList.toggle('isl-off', !inView);
    if (inView) { wake(); } else if (!anim && raf) { cancelAnimationFrame(raf); raf = 0; }
  }, { rootMargin: '80px 0px' }).observe(root);
  var lastW = 0;
  function onResize() {
    var w = Math.round(root.clientWidth); if (w === lastW && mobile === MQ.matches) return; lastW = w;
    var endIdx = dest !== -2 ? dest : (state === 'overview' ? -1 : cur), busy = dest !== -2;
    tk++; anim = null; pending = null;
    measure();
    if (!sc) return;
    sc.clearWake(); sc.layout(mobile); sizeCanvas();
    if (busy) { cur = endIdx; dest = -2; if (endIdx >= 0) { boatAt = endIdx; boatSide = boatSide; } setState(endIdx >= 0 ? 'focused' : 'overview'); if (endIdx >= 0) { renderPanel(endIdx); openPanel(); dimFor(endIdx); } else { dimFor(-1); } sc.setFocus(endIdx); }
    boatRy = sc.dockBoat(boatAt, boatSide);
    applyCam(cur >= 0 ? camFocus(cur) : introCam(camOverview(), enterK), hoFor(cur));
    if (cur >= 0) { panel.inert = false; panel.dataset.open = 'true'; }
    renderNow(); wake();
  }
  lastW = Math.round(root.clientWidth);
  if (window.ResizeObserver) new ResizeObserver(onResize).observe(root); else addEventListener('resize', onResize);
  addEventListener('resize', function () { if (!mobile) onResize(); });
  if (MQ.addEventListener) MQ.addEventListener('change', onResize);
  if (RM.addEventListener) RM.addEventListener('change', function () { wake(); renderNow(); });
  window.addEventListener('pagehide', function () { tk++; });

  /* leitura para testes e diagnóstico (somente leitura) */
  window.IslandExplorer = {
    go: function (i) { if (typeof i === 'string') i = D.islands.findIndex(function (d) { return d.id === i; }); if (i >= 0 && i < N) request(i); },
    get state() { return state; }, get current() { return cur; }, get ready() { return loaded; }, get failed() { return failed; },
    boat: function () { return sc ? { x: sc.boatState.x, z: sc.boatState.z, ry: sc.boatState.ry } : null; },
    camera: function () { return cam; }, wake: function () { return sc ? sc.wakeActive() : 0; }, get looping() { return !!raf; },
    stats: function () { return sc ? { calls: sc.info.render.calls, tris: sc.info.render.triangles, geos: sc.info.memory.geometries } : null; }
  };
})();
