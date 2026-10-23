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

  /* ISLAND: cada letra abre o significado */
  (function () {
    var btns = [].slice.call(document.querySelectorAll('.isl-l')), box = document.getElementById('isl-mean');
    if (!btns.length || !box) return;
    var ms = [].slice.call(box.querySelectorAll('.isl-m'));
    function pick(k) {
      var b = btns[k], was = b.getAttribute('aria-expanded') === 'true';
      btns.forEach(function (x) { x.setAttribute('aria-expanded', 'false'); });
      ms.forEach(function (m) { m.hidden = true; });
      b.classList.remove('spin'); void b.offsetWidth; b.classList.add('spin');
      if (was) { box.classList.remove('open'); return; }
      b.setAttribute('aria-expanded', 'true'); ms[k].hidden = false; box.classList.add('open');
      var br = b.getBoundingClientRect(), xr = box.getBoundingClientRect();
      box.style.setProperty('--nx', Math.max(16, Math.min(xr.width - 16, br.left + br.width / 2 - xr.left)) + 'px');
    }
    btns.forEach(function (b, k) { b.addEventListener('click', function () { pick(k); }); b.addEventListener('animationend', function () { b.classList.remove('spin', 'hintpulse'); }); });
    if ('IntersectionObserver' in window && !RM) {
      var io = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return; io.disconnect();
        btns.forEach(function (b, k) { setTimeout(function () { if (!b.classList.contains('spin')) b.classList.add('hintpulse'); }, 600 + k * 140); });
      }, { threshold: 0.5 });
      io.observe(box.previousElementSibling);
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
    } else {
      addEventListener('scroll', function () { var r = c.getBoundingClientRect(), k = (r.top + r.height / 2) / innerHeight - .5; py = Math.max(-1, Math.min(1, k * 1.4)); px = Math.sin(scrollY / 260) * .5; if (!f) f = requestAnimationFrame(apply); }, { passive: true });
    }
  })();

  /* depoimentos: duas faixas */
  (function () {
    var box = document.getElementById('tm-rows'); if (!box) return;
    var T = [
      ['Marina A.', 'f1', 'Landing page', 'Eu precisava explicar meu serviço sem aquele site cheio de informação solta. O resultado ficou claro e com um caminho fácil para entrar em contato.', 5],
      ['Rafael M.', 'm1', 'Tráfego pago', 'Gostei de acompanhar o raciocínio das campanhas. As revisões e os próximos passos ficaram muito mais fáceis de entender.', 5],
      ['Camila R.', 'f2', 'Posts para Instagram', 'Meu feed finalmente ficou com a minha cara. Curti demais o cuidado com as cores e o jeito de organizar cada assunto.', 5],
      ['Lucas F.', 'm2', 'Edição de vídeo', 'O corte deu outro ritmo ao material. Legendas bem colocadas e transições na medida.', 5],
      ['Beatriz S.', 'f3', 'Gestão de Instagram', 'Ter um calendário e uma linha de comunicação ajudou a organizar a rotina. As sugestões fizeram sentido para a marca.', 4],
      ['Diego P.', 'm3', 'Site institucional', 'O site ficou rápido no celular e os clientes passaram a chegar já sabendo o que eu faço.', 5],
      ['Juliana T.', 'f4', 'Identidade visual', 'A marca nova deixou tudo mais profissional, do cartão ao Instagram. Agora tudo conversa.', 5],
      ['André L.', 'm4', 'Tráfego pago', 'Os relatórios são simples de ler e eu sei exatamente para onde está indo cada real.', 5],
      ['Patrícia N.', 'f5', 'Vídeos para anúncios', 'A gravação foi leve e o resultado ficou natural. Os vídeos já estão rodando nos anúncios.', 5],
      ['Felipe C.', 'm5', 'Estratégia', 'O diagnóstico mostrou o que fazer primeiro. Saí da reunião com um plano claro.', 5],
      ['Larissa V.', 'f6', 'Landing page', 'Página bonita e objetiva. Os agendamentos ficaram muito mais organizados.', 5],
      ['Gustavo R.', 'm6', 'Conteúdo', 'Finalmente tenho constância nas redes sem precisar pensar em tudo sozinho.', 4]
    ];
    var P = [['#FF7417', '#B5179E'], ['#7B3FE4', '#31D6C2'], ['#FF987F', '#7B3FE4'], ['#31D6C2', '#4B1DB5'], ['#FFB347', '#FF7417'], ['#B99AF5', '#4B1DB5']];
    function card(t, i) {
      t = [t[0], t[2], t[3], t[4], t[1]];
      return '<article class="tm"><p>“' + t[2] + '”</p><div class="tm-who"><img class="tm-av" src="/assets/faces/' + t[4] + '.webp" alt="" width="40" height="40" loading="lazy" decoding="async"><span><b>' + t[0] + '</b><small>' + t[1] + ' · exemplo</small></span><span class="tm-st" aria-label="' + t[3] + ' de 5 estrelas">' + '★★★★★'.slice(0, t[3]) + '</span></div></article>';
    }
    function row(list, cls) { var h = list.map(card).join(''); return '<div class="tm-row ' + cls + '">' + h + h.replace(/<article class="tm">/g, '<article class="tm" aria-hidden="true">') + '</div>'; }
    box.innerHTML = row(T.slice(0, 6), 'l') + row(T.slice(6), 'r');
  })();

  /* botões que levam ao onboarding */
  [].slice.call(document.querySelectorAll('a[href^="https://onboarding.islandcompany.space"]')).forEach(function (a) { a.classList.add('onb'); });

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
    ov.addEventListener('click', function (e) { var b = e.target.closest('[data-pid]'); if (b) { e.preventDefault(); detail(b.getAttribute('data-pid')); } });
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
  window.IslandPortfolio = { open: open, close: close };
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
    var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
    if (u.origin === location.origin && (u.pathname === '/projetos' || u.pathname === '/projetos.html')) { e.preventDefault(); open(); }
  });
})();
