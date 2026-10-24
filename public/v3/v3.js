(function () {
  var ONB = 'https://onboarding.islandcompany.space';
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* ---------- entradas entre seções ---------- */
  if ('IntersectionObserver' in window && !RM) {
    root.classList.add('v3-motion');
    var blocks = [].slice.call(document.querySelectorAll('.blk'));
    blocks.forEach(function (b) {
      if (b.getBoundingClientRect().top < innerHeight * 0.9) { b.classList.add('blk-on', 'blk-done'); return; }
      b.addEventListener('transitionend', function (e) { if (e.target === b && e.propertyName === 'clip-path') b.classList.add('blk-done'); });
    });
    var bo = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('blk-on'); bo.unobserve(e.target); setTimeout(function () { e.target.classList.add('blk-done'); }, 1400); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    blocks.forEach(function (b) { if (!b.classList.contains('blk-done')) bo.observe(b); });

    var ups = [].slice.call(document.querySelectorAll('[data-up]'));
    var groups = new Map();
    ups.forEach(function (el) {
      var p = el.parentElement, n = groups.get(p) || 0; groups.set(p, n + 1);
      el.style.setProperty('--dl', (n * 0.09) + 's');
      el.addEventListener('transitionend', function f(e) { if (e.propertyName !== 'transform') return; el.removeEventListener('transitionend', f); el.removeAttribute('data-up'); el.classList.remove('up-on'); el.style.removeProperty('--dl'); });
    });
    var uo = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('up-on'); uo.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    ups.forEach(function (el) { uo.observe(el); });
  }

  /* ---------- serviços → barco até a ilha ---------- */
  function waitScroll(cb) {
    var last = -1, still = 0, t0 = performance.now();
    (function poll() {
      var y = scrollY;
      if (Math.abs(y - last) < 1) still++; else still = 0;
      last = y;
      if (still > 6 || performance.now() - t0 > 2200) cb(); else requestAnimationFrame(poll);
    })();
  }
  document.addEventListener('click', function (e) {
    var c = e.target.closest && e.target.closest('.svc[data-island]');
    if (!c) return;
    var id = c.getAttribute('data-island'), isl = document.getElementById('isl');
    c.classList.remove('go-on'); void c.offsetWidth; c.classList.add('go-on');
    if (!isl) return;
    var hd = document.querySelector('.svc-head'), mob = matchMedia('(max-width: 820px)').matches;
    var rw = document.querySelector('.svc-row'), y = mob ? (rw || isl).getBoundingClientRect().top + scrollY - 72 - 12 : (hd ? hd.getBoundingClientRect().top + scrollY - 72 - 16 : isl.getBoundingClientRect().top + scrollY - 80);
    scrollTo({ top: y, behavior: RM ? 'auto' : 'smooth' });
    waitScroll(function () {
      isl.classList.remove('isl-ping'); void isl.offsetWidth; isl.classList.add('isl-ping');
      var tries = 0;
      (function go() {
        var X = window.IslandExplorer;
        if (X && typeof X.go === 'function' && !X.failed) { X.go(id); return; }
        if (++tries < 40) setTimeout(go, 150);
      })();
    });
  });

  /* card de serviço acompanha a ilha ativa */
  (function () {
    var cards = [].slice.call(document.querySelectorAll('.svc[data-island]'));
    if (!cards.length || !window.ISLAND_DATA) return;
    var ids = window.ISLAND_DATA.islands.map(function (d) { return d.id; }), last = null;
    setInterval(function () {
      var X = window.IslandExplorer; if (!X) return;
      var cur = (X.state === 'focused' || X.state === 'travelling' || X.state === 'approaching') && X.current >= 0 ? ids[X.current] : null;
      if (cur === last) return; last = cur;
      cards.forEach(function (c) { c.classList.toggle('on', c.getAttribute('data-island') === cur); });
    }, 250);
  })();

  /* painel da ilha: botão no meio das setas, "ver todas" embaixo da ilha, cards ficando para trás */
  (function () {
    var panel = document.getElementById('isl-panel'), allx = document.querySelector('.isl-allx');
    if (!panel) return;
    function fix() {
      var nav = panel.querySelector('.isl-nav'), cta = panel.querySelector(':scope > .isl-cta'), prev = nav && nav.querySelector('[data-act=prev]');
      if (nav && cta && prev) prev.after(cta);
    }
    new MutationObserver(fix).observe(panel, { childList: true });
    fix();
    if (allx) allx.addEventListener('click', function () { var X = window.IslandExplorer; if (X && X.all) X.all(); });
    var cards = [].slice.call(document.querySelectorAll('.svc[data-island]')), row = document.querySelector('.svc-row');
    var ids = window.ISLAND_DATA ? window.ISLAND_DATA.islands.map(function (d) { return d.id; }) : [], lastState = '', lastIdx = 0;
    function cardPos(i) { var id = ids[i]; for (var k = 0; k < cards.length; k++) if (cards[k].getAttribute('data-island') === id) return k; return i * 0.6; }
    setInterval(function () {
      var X = window.IslandExplorer; if (!X) return;
      var st = X.state;
      if (allx) allx.hidden = !(st === 'focused' || st === 'travelling');
      if ((st === 'travelling' || st === 'approaching') && lastState !== st && !RM) {
        var from = lastIdx, to = X.dest;
        if (to >= 0 && from >= 0 && to !== from) {
          var dir = cardPos(to) > cardPos(from) ? 1 : -1;
          cards.forEach(function (c, k) {
            c.animate([{ transform: 'translateX(0) rotateY(0)' }, { transform: 'translateX(' + (-dir * 26) + 'px) rotateY(' + (dir * 9) + 'deg)', offset: .35 }, { transform: 'translateX(' + (-dir * 10) + 'px) rotateY(' + (dir * 3) + 'deg)', offset: .75 }, { transform: 'translateX(0) rotateY(0)' }], { duration: 2400, delay: k * 60, easing: 'cubic-bezier(.3,.7,.3,1)' });
          });
        }
      }
      if (st === 'focused' && X.current >= 0) lastIdx = X.current;
      lastState = st;
    }, 120);
    if (row) row.style.perspective = '900px';
  })();

  /* adesivos do final: seguem o mouse de leve e dá pra arrastar */
  (function () {
    var sec = document.querySelector('.fin2'); if (!sec || RM) return;
    var stks = [].slice.call(sec.querySelectorAll('.stk'));
    sec.addEventListener('pointermove', function (e) { var r = sec.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 2 - 1, y = (e.clientY - r.top) / r.height * 2 - 1; stks.forEach(function (s) { s.style.setProperty('--px', x.toFixed(3)); s.style.setProperty('--py', y.toFixed(3)); }); });
    stks.forEach(function (s) {
      var sx, sy, ox = 0, oy = 0, dragging = false;
      s.addEventListener('pointerdown', function (e) { dragging = true; sx = e.clientX - ox; sy = e.clientY - oy; s.setPointerCapture(e.pointerId); s.style.cursor = 'grabbing'; s.style.zIndex = 5; });
      s.addEventListener('pointermove', function (e) { if (!dragging) return; ox = e.clientX - sx; oy = e.clientY - sy; s.style.translate = ox + 'px ' + oy + 'px'; s.style.animationPlayState = 'paused'; });
      s.addEventListener('pointerup', function () { dragging = false; s.style.cursor = ''; });
    });
  })();

  /* manifesto: palavras animadas quando entram na tela */
  (function () {
    var m = document.querySelector('.man2'), g = m && m.querySelector('.mf-grow'); if (!m) return;
    if (g && !g.querySelector('i')) g.innerHTML = g.textContent.split('').map(function (ch, i) { return '<i style="--i:' + i + '">' + ch + '</i>'; }).join('');
    if (!('IntersectionObserver' in window)) { m.classList.add('mf-go'); return; }
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { m.classList.add('mf-go'); io.disconnect(); } }, { threshold: .45 });
    io.observe(m);
  })();

  /* topo: parallax do título com o mouse (computador) */
  (function () {
    var h = document.querySelector('.hero'), t = document.getElementById('t1');
    if (!h || !t || RM || !matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    var f = 0, x = 0, y = 0;
    h.addEventListener('pointermove', function (e) { x = e.clientX / innerWidth * 2 - 1; y = e.clientY / innerHeight * 2 - 1; if (!f) f = requestAnimationFrame(function () { f = 0; t.style.setProperty('--hx', x.toFixed(3)); t.style.setProperty('--hy', y.toFixed(3)); }); });
    h.addEventListener('pointerleave', function () { t.style.setProperty('--hx', 0); t.style.setProperty('--hy', 0); });
  })();

  /* entradas 3D extras: títulos, textos e botões que ainda não tinham entrada */
  (function () {
    if (RM || !('IntersectionObserver' in window)) return;
    var sel = 'main section:not(.hero) h2, main section:not(.hero) .blk-lead, main section:not(.hero) p.l, main section:not(.hero) .btn, .portfolio-heading p, .carousel-details .btn, .word, .fd-wrap, .testimonial-disclosure, .eyebrow';
    var els = [].slice.call(document.querySelectorAll(sel)).filter(function (e) { return !e.matches('#sobre h2, .fd-wrap') && !e.hasAttribute('data-up') && !e.closest('[data-up]') && !e.closest('.isl-panel') && e.getBoundingClientRect().top > innerHeight * .95; });
    var seen = new Map();
    els.forEach(function (e) { var p = e.parentElement, n = seen.get(p) || 0; seen.set(p, n + 1); e.style.setProperty('--dl', (n * .08) + 's'); e.classList.add('cine-x'); });
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('cine-in'); io.unobserve(en.target); setTimeout(function () { en.target.classList.remove('cine-x', 'cine-in'); en.target.style.removeProperty('--dl'); }, 1600); } }); }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e) { io.observe(e); });
    // botões do carrossel são montados depois
    setTimeout(function () { [].slice.call(document.querySelectorAll('.carousel-details .btn')).forEach(function (b) { if (b.getBoundingClientRect().top > innerHeight) { b.classList.add('cine-x'); io.observe(b); } }); }, 1500);
  })();

  /* mini card "+ contatos": contador ao vivo */
  (function () {
    var n = document.querySelector('.ads-n'), k = document.querySelector('.ads-kpi'); if (!n) return;
    var to = +n.getAttribute('data-to') || 48, cur = 0;
    function run() {
      if (RM) { n.textContent = to; cur = to; return; }
      var t0 = performance.now();
      (function step(t) { var p = Math.min(1, (t - t0) / 1600), e = 1 - Math.pow(1 - p, 3); n.textContent = Math.round(to * e); if (p < 1) requestAnimationFrame(step); else { cur = to; live(); } })(t0);
    }
    function live() { setInterval(function () { if (document.hidden) return; cur += 1 + Math.round(Math.random()); n.textContent = cur; k.classList.remove('bump'); void k.offsetWidth; k.classList.add('bump'); }, 3800); }
    if (!('IntersectionObserver' in window)) return run();
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); run(); } }, { threshold: .4 });
    io.observe(n);
  })();

  /* biografia: entrada do card e do título */
  (function () {
    var ab = document.querySelector('.ab'); if (!ab) return;
    if (RM || !('IntersectionObserver' in window)) { ab.classList.add('bio-in'); return; }
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { ab.classList.add('bio-in'); io.disconnect(); } }, { threshold: .25 });
    io.observe(ab);
  })();

  /* ISLAND: a letra de cima desce e vira a palavra (sem repetir); ao trocar, a anterior volta para o lugar */
  (function () {
    var btns = [].slice.call(document.querySelectorAll('.isl-l')), stage = document.getElementById('word-stage'), word = document.querySelector('.word');
    if (!btns.length || !stage) return;
    var cur = -1, busy = false, EZ = 'cubic-bezier(.65,0,.35,1)', OUT = 'cubic-bezier(.16,1,.3,1)';
    function T(dx, dy, s, extra) { return 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ') ' + (extra || ''); }
    function clone(b, r, clip) {
      var cs = getComputedStyle(b), c = document.createElement('span');
      c.className = 'w2-fly'; c.textContent = b.textContent;
      c.style.cssText = 'position:fixed;left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px;font:' + cs.font + ';line-height:' + cs.lineHeight + ';color:#00C85A;display:grid;place-items:center;z-index:60;transform-origin:50% 50%;will-change:transform,opacity;pointer-events:none;' + (clip ? 'clip-path:' + clip + ';' : '');
      document.body.appendChild(c); return c;
    }
    function done(a) { return new Promise(function (r) { a.onfinish = r; a.oncancel = r; }); }
    // voo da letra: cada significado tem o seu
    function fly(b, fx, sr, tr, back) {
      var s = tr.height / sr.height, dx = (tr.left + tr.width / 2) - (sr.left + sr.width / 2), dy = (tr.top + tr.height / 2) - (sr.top + sr.height / 2);
      var P = function (k, extra, kk) { var q = kk == null ? k : kk; return T(dx * k, dy * q, 1 + (s - 1) * k, extra); };
      var kf, opt = { duration: 900, easing: EZ, fill: 'forwards' }, list = [];
      if (back) { var c0 = clone(b, sr); var a0 = c0.animate([{ transform: 'none', opacity: 1 }, { transform: P(1), opacity: 1 }], { duration: 520, easing: EZ, fill: 'forwards' }); return done(a0).then(function () { c0.remove(); }); }
      if (fx === 'segmentacao') {
        var cuts = ['inset(0 0 66% 0)', 'inset(33% 0 33% 0)', 'inset(66% 0 0 0)'], offs = [-60, 50, -40];
        cuts.forEach(function (cl, i) {
          var c = clone(b, sr, cl);
          list.push(done(c.animate([{ transform: 'none' }, { transform: P(.45, 'translateX(' + offs[i] + 'px) rotate(' + (offs[i] / 6) + 'deg)'), offset: .5 }, { transform: P(1) }], { duration: 900, delay: i * 70, easing: EZ, fill: 'forwards' })).then(function () { c.remove(); }));
        });
        return Promise.all(list);
      }
      var c = clone(b, sr);
      switch (fx) {
        case 'imersao': kf = [{ transform: 'none', opacity: 1 }, { transform: P(.15, 'scaleY(.85)', .45), opacity: .9, offset: .25 }, { transform: P(.5, '', 1.25), opacity: .15, offset: .55 }, { transform: P(.85, '', 1.05), opacity: .9, offset: .8 }, { transform: P(1), opacity: 1 }]; opt.duration = 1000; break;
        case 'lapidacao': kf = [{ transform: 'none', clipPath: 'polygon(0 0,100% 0,100% 100%,0 100%)' }, { transform: P(.3, 'rotateY(180deg)'), clipPath: 'polygon(20% 0,100% 15%,85% 100%,0 80%)', offset: .3 }, { transform: P(.6, 'rotateY(300deg)'), clipPath: 'polygon(10% 10%,90% 0,100% 90%,15% 100%)', offset: .6 }, { transform: P(1, 'rotateY(360deg)'), clipPath: 'polygon(0 0,100% 0,100% 100%,0 100%)' }]; opt.duration = 1000; break;
        case 'ativacao': kf = [{ transform: 'none', opacity: 1, textShadow: 'none' }, { opacity: .15, offset: .1 }, { opacity: 1, textShadow: '0 0 30px #FFB36B', offset: .18 }, { opacity: .2, offset: .26 }, { opacity: 1, textShadow: '0 0 40px #FF9A45', transform: 'scale(1.12)', offset: .4 }, { transform: P(1), opacity: 1, textShadow: '0 0 24px rgba(255,140,60,.8)' }]; opt.duration = 950; break;
        case 'navegacao': kf = [{ transform: 'none' }, { transform: P(.2, 'rotate(10deg)', .1), offset: .2 }, { transform: P(.4, 'rotate(-9deg)', .45), offset: .4 }, { transform: P(.6, 'rotate(8deg)', .55), offset: .6 }, { transform: P(.8, 'rotate(-6deg)', .9), offset: .8 }, { transform: P(1) }]; opt.duration = 1100; opt.easing = 'cubic-bezier(.45,0,.55,1)'; break;
        default: kf = [{ transform: 'none' }, { transform: P(.5, 'scale(.35)'), offset: .35 }, { transform: P(.75, 'scale(.7)'), offset: .55 }, { transform: P(.9, 'scale(1.1)'), offset: .78 }, { transform: P(1) }]; opt.duration = 1000; opt.easing = 'cubic-bezier(.4,0,.2,1)';
      }
      return done(c.animate(kf, opt)).then(function () { c.remove(); });
    }
    function charIn(fx, i, off) {
      switch (fx) {
        case 'imersao': return [{ transform: 'translate(' + (-off) + 'px,55%)', opacity: 0 }, { transform: 'translate(0,-8%)', opacity: 1, offset: .7 }, { transform: 'none', opacity: 1 }];
        case 'segmentacao': return [{ transform: 'translate(' + (-off) + 'px,' + (i % 3 - 1) * 60 + '%)', opacity: 0 }, { transform: 'none', opacity: 1 }];
        case 'lapidacao': return [{ transform: 'translate(' + (-off) + 'px,0) rotateY(90deg) scale(1.3)', opacity: 0 }, { transform: 'none', opacity: 1 }];
        case 'ativacao': return [{ opacity: 0 }, { opacity: 1, offset: .2 }, { opacity: .1, offset: .35 }, { opacity: 1, offset: .5 }, { opacity: .3, offset: .62 }, { opacity: 1 }];
        case 'navegacao': return [{ transform: 'translate(' + (-off) + 'px,' + (Math.sin(i * 1.3) * 30) + '%) rotate(' + (i % 2 ? 8 : -8) + 'deg)', opacity: 0 }, { transform: 'none', opacity: 1 }];
        default: return [{ transform: 'translate(' + (-off) + 'px,0) scaleY(0)', opacity: 0, transformOrigin: '50% 100%' }, { transform: 'scaleY(1.15)', opacity: 1, offset: .7, transformOrigin: '50% 100%' }, { transform: 'none', opacity: 1, transformOrigin: '50% 100%' }];
      }
    }
    function collapse() {
      if (cur < 0) return Promise.resolve();
      var ob = btns[cur], chars = [].slice.call(stage.querySelectorAll('.ws2-w i')), rest = [].slice.call(stage.querySelectorAll('.ws2-t, .ws-bars'));
      if (!chars.length) { ob.classList.remove('away', 'on'); return Promise.resolve(); }
      var x0 = chars[0].getBoundingClientRect().left, ps = [];
      rest.forEach(function (e) { ps.push(done(e.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' }))); });
      chars.slice(1).forEach(function (c, i, arr) { var off = c.getBoundingClientRect().left - x0; ps.push(done(c.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateX(' + (-off) + 'px)', opacity: 0 }], { duration: 320, delay: (arr.length - i) * 15, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }))); });
      return Promise.all(ps).then(function () {
        var fr = chars[0].getBoundingClientRect(); chars[0].style.opacity = 0;
        var tr = ob.getBoundingClientRect();
        return fly(ob, '', fr, tr, true);
      }).then(function () { ob.classList.remove('away', 'on'); stage.innerHTML = ''; });
    }
    function pick(k) {
      if (cur === k || busy) return;
      busy = true;
      var b = btns[k], fx = b.getAttribute('data-fx'), w = b.getAttribute('data-w'), t = b.getAttribute('data-t');
      collapse().then(function () {
        cur = k; word.classList.add('has-on');
        btns.forEach(function (x) { x.setAttribute('aria-expanded', x === b ? 'true' : 'false'); });
        stage.className = 'word-stage ws2 fx-' + fx;
        stage.innerHTML = '<b class="ws2-w">' + w.split('').map(function (c) { return '<i>' + c + '</i>'; }).join('') + '</b><p class="ws2-t">' + t.split(' ').map(function (x) { return '<i>' + x + '</i>'; }).join(' ') + '</p>' ;
        var wEl = stage.querySelector('.ws2-w'), avail = stage.clientWidth * .96;
        if (wEl.scrollWidth > avail) wEl.style.fontSize = (parseFloat(getComputedStyle(wEl).fontSize) * avail / wEl.scrollWidth).toFixed(1) + 'px';
        var chars = [].slice.call(stage.querySelectorAll('.ws2-w i')), ws = [].slice.call(stage.querySelectorAll('.ws2-t i')), bars = [].slice.call(stage.querySelectorAll('.ws-bars i'));
        b.classList.add('on', 'away');
        if (RM) { return; }
        chars.concat(ws, bars).forEach(function (e) { e.style.opacity = 0; });
        var sr = b.getBoundingClientRect(), tr = chars[0].getBoundingClientRect();
        return fly(b, fx, sr, tr).then(function () {
          chars[0].style.opacity = 1;
          var x0 = chars[0].getBoundingClientRect().left;
          chars.slice(1).forEach(function (c, i) {
            var off = c.getBoundingClientRect().left - x0;
            var a = c.animate(charIn(fx, i, off), { duration: fx === 'ativacao' ? 420 : 640, delay: i * (fx === 'navegacao' ? 60 : fx === 'desenvolvimento' ? 55 : 35), easing: fx === 'ativacao' ? 'linear' : OUT, fill: 'forwards' });
            a.onfinish = function () { c.style.opacity = 1; a.cancel(); };
          });
          var base = 280 + chars.length * 40;
          ws.forEach(function (e, i) { var a = e.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 500, delay: base + i * 45, easing: OUT, fill: 'forwards' }); a.onfinish = function () { e.style.opacity = 1; a.cancel(); }; });
          bars.forEach(function (e, i) { var a = e.animate([{ opacity: 0, transform: 'scaleY(0)' }, { opacity: 1, transform: 'none' }], { duration: 500, delay: base + i * 90, easing: 'cubic-bezier(.3,1.5,.5,1)', fill: 'forwards' }); a.onfinish = function () { e.style.opacity = 1; a.cancel(); }; });
        });
      }).then(function () { busy = false; }, function () { busy = false; });
    }
    btns.forEach(function (b, k) { b.addEventListener('click', function () { if (cur === k && !busy) { busy = true; collapse().then(function () { cur = -1; word.classList.remove('has-on'); stage.innerHTML = '<p class="ws-hint">Toque em uma letra para descobrir o significado</p>'; busy = false; }); return; } pick(k); }); });
    if ('IntersectionObserver' in window && !RM) {
      var io = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return; io.disconnect();
        btns.forEach(function (b, k) { setTimeout(function () { if (cur < 0) { b.classList.add('hint'); setTimeout(function () { b.classList.remove('hint'); }, 900); } }, 500 + k * 130); });
      }, { threshold: 0.5 });
      io.observe(word);
    }
  })();

  /* fundador: card 3D com parallax */
  (function () {
    var c = document.querySelector('.fd-card'); if (!c || RM) return;
    var fine = matchMedia('(hover:hover) and (pointer:fine)').matches, f = 0, px = 0, py = 0;
    function apply() { f = 0; c.style.setProperty('--ry', (px * 14).toFixed(2) + 'deg'); c.style.setProperty('--rx', (-py * 10).toFixed(2) + 'deg'); c.style.setProperty('--px', px.toFixed(3)); c.style.setProperty('--py', py.toFixed(3)); }
    if (fine) {
      var wrap = c.parentElement;
      wrap.addEventListener('pointermove', function (e) { var r = c.getBoundingClientRect(); px = Math.max(-1, Math.min(1, (e.clientX - r.left) / r.width * 2 - 1)); py = Math.max(-1, Math.min(1, (e.clientY - r.top) / r.height * 2 - 1)); c.classList.add('live'); if (!f) f = requestAnimationFrame(apply); });
      wrap.addEventListener('pointerleave', function () { px = py = 0; c.classList.remove('live'); if (!f) f = requestAnimationFrame(apply); });
    }
    addEventListener('scroll', function () { if (c.classList.contains('live')) return; var r = c.getBoundingClientRect(), k = (r.top + r.height / 2) / innerHeight - .5; py = Math.max(-1, Math.min(1, k * 1.4)); px = Math.sin(scrollY / 260) * .5; if (!f) f = requestAnimationFrame(apply); }, { passive: true });
  })();

  /* depoimentos: duas faixas */
  (function () {
    var box = document.getElementById('tm-rows'); if (!box) return;
    var T = [
      ['Marina A.', 'f1', 'Landing page', 'Eu precisava explicar meu serviço sem aquele site cheio de informação solta. O resultado ficou claro e com um caminho fácil para entrar em contato', 5],
      ['Rafael M.', 'm1', 'Tráfego pago', 'Gostei de acompanhar o raciocínio das campanhas. As revisões e os próximos passos ficaram muito mais fáceis de entender', 5],
      ['Camila R.', 'f2', 'Posts para Instagram', 'Meu feed finalmente ficou com a minha cara. Curti demais o cuidado com as cores e o jeito de organizar cada assunto', 5],
      ['Lucas F.', 'm2', 'Edição de vídeo', 'O corte deu outro ritmo ao material. Legendas bem colocadas e transições na medida', 5],
      ['Beatriz S.', 'f3', 'Gestão de Instagram', 'Ter um calendário e uma linha de comunicação ajudou a organizar a rotina. As sugestões fizeram sentido para a marca', 4],
      ['Diego P.', 'm3', 'Site institucional', 'O site ficou rápido no celular e os clientes passaram a chegar já sabendo o que eu faço', 5],
      ['Juliana T.', 'f4', 'Identidade visual', 'A marca nova deixou tudo mais profissional, do cartão ao Instagram. Agora tudo conversa', 5],
      ['André L.', 'm4', 'Tráfego pago', 'Os relatórios são simples de ler e eu sei exatamente para onde está indo cada real', 5],
      ['Patrícia N.', 'f5', 'Vídeos para anúncios', 'A gravação foi leve e o resultado ficou natural. Os vídeos já estão rodando nos anúncios', 5],
      ['Felipe C.', 'm5', 'Estratégia', 'O diagnóstico mostrou o que fazer primeiro. Saí da reunião com um plano claro', 5],
      ['Larissa V.', 'f6', 'Landing page', 'Página bonita e objetiva. Os agendamentos ficaram muito mais organizados', 5],
      ['Gustavo R.', 'm6', 'Conteúdo', 'Finalmente tenho constância nas redes sem precisar pensar em tudo sozinho', 4]
    ];
    var P = [['#FF7417', '#B5179E'], ['#7B3FE4', '#31D6C2'], ['#FF987F', '#7B3FE4'], ['#31D6C2', '#4B1DB5'], ['#FFB347', '#FF7417'], ['#B99AF5', '#4B1DB5']];
    function card(t, i) {
      t = [t[0], t[2], t[3], t[4], t[1]];
      return '<article class="tm"><p>“' + t[2] + '”</p><div class="tm-who"><img class="tm-av" src="/assets/faces/' + t[4] + '.webp" alt="" width="40" height="40" loading="lazy" decoding="async"><span><b>' + t[0] + '</b><small>' + t[1] + '</small></span><span class="tm-st" aria-label="' + t[3] + ' de 5 estrelas">' + '★★★★★'.slice(0, t[3]) + '</span></div></article>';
    }
    function row(list, cls) { var h = list.map(card).join(''); return '<div class="tm-row ' + cls + '">' + h + h.replace(/<article class="tm">/g, '<article class="tm" aria-hidden="true">') + '</div>'; }
    box.innerHTML = row(T.slice(0, 6), 'l') + row(T.slice(6), 'r');
  })();

  /* botões que levam ao onboarding */
  [].slice.call(document.querySelectorAll('a[href^="https://onboarding.islandcompany.space"], #nav a[href^="https://wa.me"]')).forEach(function (a) { a.classList.add('onb'); });

  /* ---------- portfólio dentro do site ---------- */
  var data = null, ov = null, sheet, body, title, sub, back, lastFocus = null;
  function load() {
    if (data) return Promise.resolve(data);
    return fetch('/assets/projects/manifest.json').then(function (r) { return r.json(); }).then(function (m) { data = m.projects; return data; });
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function img(id, kind) { return '/assets/projects/' + id + '-' + kind + '.webp'; }
  function build() {
    ov = document.createElement('div'); ov.className = 'pfm'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Portfólio Island');
    ov.innerHTML = '<div class="pfm-bg"></div><div class="pfm-sheet"><div class="pfm-top"><button type="button" class="pfm-ib pfm-back" aria-label="Voltar para todos os projetos" hidden>←</button><div><h2>Portfólio</h2><small></small></div><span class="pfm-sp"></span><a class="btn p" href="' + ONB + '">Quero um projeto</a><button type="button" class="pfm-ib pfm-x" aria-label="Fechar portfólio">✕</button></div><div class="pfm-body"></div></div>';
    document.body.appendChild(ov);
    sheet = ov.querySelector('.pfm-sheet'); body = ov.querySelector('.pfm-body'); title = ov.querySelector('h2'); sub = ov.querySelector('.pfm-top small'); back = ov.querySelector('.pfm-back');
    ov.querySelector('.pfm-bg').addEventListener('click', close);
    ov.querySelector('.pfm-x').addEventListener('click', close);
    back.addEventListener('click', function () { grid(); });
    ov.addEventListener('click', function (e) { var b = e.target.closest('[data-pid]'); if (b) { e.preventDefault(); phone(b.getAttribute('data-pid')); } });
    document.addEventListener('keydown', function (e) {
      if (!ov.classList.contains('on')) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      if (e.key === 'Tab') { var f = [].slice.call(sheet.querySelectorAll('a,button:not([hidden])')); var i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } }
    });
  }
  function grid() {
    title.textContent = 'Portfólio'; sub.textContent = data.length + ' projetos reais no ar'; back.hidden = true;
    body.innerHTML = '<div class="pfm-grid">' + data.map(function (p, k) {
      return '<button type="button" class="pfm-card" data-pid="' + esc(p.id) + '" style="--k:' + k + '"><span class="im"><img src="' + img(p.id, 'carousel') + '" alt="" loading="lazy" decoding="async"><span class="tg">' + esc(p.group) + '</span></span><b>' + esc(p.name) + '</b><span class="lb">' + esc(p.label) + '</span></button>';
    }).join('') + '</div>';
    body.scrollTop = 0;
  }
  function detail(id) {
    var p = data.filter(function (x) { return x.id === id; })[0]; if (!p) return grid();
    title.textContent = p.name; sub.textContent = p.group + ' · ' + p.label; back.hidden = false;
    var others = data.filter(function (x) { return x.id !== id; });
    var host = p.url.replace(/^https?:\/\//, '');
    body.innerHTML = '<div class="pfm-det"><div class="pfm-shots"><div class="pfm-browser"><div class="bar"><i></i><i></i><i></i><span>' + esc(host) + '</span></div><img alt="Captura do site ' + esc(p.name) + ' no computador" src="' + img(p.id, 'desktop') + '"></div><div class="pfm-phone"><img alt="Captura do site ' + esc(p.name) + ' no celular" src="' + img(p.id, 'mobile') + '"></div></div>' +
      '<div class="pfm-info"><p class="eyebrow">' + esc(p.group) + '</p><h3>' + esc(p.name) + '</h3><p>' + esc(p.description) + '</p><div class="cta"><a class="btn p" href="' + ONB + '">Quero um projeto assim <i>→</i></a><a class="btn" href="' + esc(p.url) + '" target="_blank" rel="noopener noreferrer">Visitar o site ↗</a></div>' +
      '<div class="pfm-more"><small>Outros projetos</small><div>' + others.map(function (o) { return '<button type="button" data-pid="' + esc(o.id) + '" aria-label="' + esc(o.name) + '"><img src="' + img(o.id, 'carousel') + '" alt="" loading="lazy"></button>'; }).join('') + '</div></div></div></div>';
    var br = body.querySelector('.pfm-browser img'), sh = body.querySelector('.pfm-shots');
    br.addEventListener('error', function () { br.parentNode.remove(); sh.classList.add('solo'); });
    var ph = body.querySelector('.pfm-phone img'); ph.addEventListener('error', function () { ph.parentNode.remove(); });
    body.scrollTop = 0;
  }
  function open(id) {
    if (id) { phone(id); return; }
    lastFocus = document.activeElement;
    load().then(function () {
      if (!ov) build();
      if (id) detail(id); else grid();
      ov.hidden = false; root.style.overflow = 'hidden';
      requestAnimationFrame(function () { requestAnimationFrame(function () { ov.classList.add('on'); }); });
      setTimeout(function () { ov.querySelector('.pfm-x').focus({ preventScroll: true }); }, 60);
    }).catch(function () { location.href = id ? (data && data.filter(function (x) { return x.id === id; })[0] || {}).url || '/projetos' : '/projetos'; });
  }
  function close() {
    if (!ov || !ov.classList.contains('on')) return;
    ov.classList.remove('on'); root.style.overflow = '';
    setTimeout(function () { if (!ov.classList.contains('on')) ov.hidden = true; }, RM ? 0 : 720);
    try { lastFocus && lastFocus.focus({ preventScroll: true }); } catch (e) {}
  }

  /* ---------- projeto aberto dentro de um iPhone ---------- */
  var NOFRAME = { letnacif: 1, marinelli: 1 }, pv = null, pvFocus = null;
  function phone(id) {
    load().then(function () {
      var p = data.filter(function (x) { return x.id === id; })[0]; if (!p) return;
      pvFocus = document.activeElement;
      if (pv) pv.remove();
      pv = document.createElement('div'); pv.className = 'phv'; pv.setAttribute('role', 'dialog'); pv.setAttribute('aria-modal', 'true'); pv.setAttribute('aria-label', 'Projeto ' + p.name);
      var inner = NOFRAME[id]
        ? '<div class="phv-shot"><img src="' + img(id, 'mobile') + '" alt="Captura do site ' + esc(p.name) + ' no celular"></div>'
        : '<iframe src="' + esc(p.url) + '" title="Site ' + esc(p.name) + '" loading="eager" sandbox="allow-scripts allow-same-origin allow-forms" referrerpolicy="no-referrer-when-downgrade"></iframe><div class="phv-load">Carregando</div>';
      pv.innerHTML = '<div class="phv-bg"></div><div class="phv-wrap"><div class="phv-phone"><div class="phv-screen">' + inner + '<span class="phv-island" aria-hidden="true"></span></div>' +
        '<button type="button" class="phv-x" aria-label="Fechar visualização"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
        '<div class="phv-cap"><b>' + esc(p.name) + '</b></div></div>';
      document.body.appendChild(pv); root.style.overflow = 'hidden';
      var fr = pv.querySelector('iframe'), ld = pv.querySelector('.phv-load'), scr = pv.querySelector('.phv-screen');
      function fit() { if (scr) scr.style.setProperty('--k', (scr.clientWidth / 393).toFixed(4)); }
      fit(); requestAnimationFrame(fit); addEventListener('resize', fit);
      if (fr) { fr.addEventListener('load', function () { ld.classList.add('off'); }); setTimeout(function () { ld.classList.add('off'); }, 6000); }
      pv.querySelector('.phv-bg').addEventListener('click', closePhone);
      pv.querySelector('.phv-x').addEventListener('click', closePhone);
      requestAnimationFrame(function () { requestAnimationFrame(function () { pv.classList.add('on'); }); });
      setTimeout(function () { pv && pv.querySelector('.phv-x').focus({ preventScroll: true }); }, 80);
    });
  }
  function closePhone() {
    if (!pv) return; var el = pv; pv = null; el.classList.remove('on');
    if (!(ov && ov.classList.contains('on'))) root.style.overflow = '';
    setTimeout(function () { el.remove(); }, RM ? 0 : 650);
    try { pvFocus && pvFocus.focus({ preventScroll: true }); } catch (e) {}
  }
  document.addEventListener('keydown', function (e) { if (pv && e.key === 'Escape') { e.stopImmediatePropagation(); closePhone(); } }, true);
  window.IslandPhone = { open: phone, close: closePhone };
  window.IslandPortfolio = { open: open, close: close };
  document.addEventListener('click', function (e) { var c = e.target.closest && e.target.closest('.circular-carousel__card'); if (c) e.preventDefault(); }, true);
  /* arrastar o carrossel segurando em cima do card (desktop): o <a> nativo puxava um "drag" de link e cancelava o gesto */
  document.addEventListener('dragstart', function (e) { if (e.target.closest && e.target.closest('.circular-carousel')) e.preventDefault(); }, true);
  (function () {
    var sx = 0, sy = 0, moved = false, down = false;
    document.addEventListener('pointerdown', function (e) { if (!(e.target.closest && e.target.closest('.circular-carousel'))) return; down = true; moved = false; sx = e.clientX; sy = e.clientY; }, true);
    document.addEventListener('pointermove', function (e) { if (down && !moved && Math.hypot(e.clientX - sx, e.clientY - sy) > 6) moved = true; }, true);
    document.addEventListener('pointerup', function () { down = false; setTimeout(function () { moved = false; }, 0); }, true);
    document.addEventListener('click', function (e) { if (moved && e.target.closest && e.target.closest('.circular-carousel')) { e.preventDefault(); e.stopImmediatePropagation(); moved = false; } }, true);
  })();
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
    var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
    if (u.origin === location.origin && (u.pathname === '/projetos' || u.pathname === '/projetos.html')) { e.preventDefault(); open(); }
  });
})();
