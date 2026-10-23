(() => {
  const backgrounds = document.querySelectorAll('.deferred-bg');
  if ('IntersectionObserver' in window) {
    const backgroundObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {entry.target.classList.remove('deferred-bg'); backgroundObserver.unobserve(entry.target);}
      });
    }, {rootMargin: '300px'});
    backgrounds.forEach(element => backgroundObserver.observe(element));
  } else backgrounds.forEach(element => element.classList.remove('deferred-bg'));
  const header = document.getElementById('h');
  const nav = document.getElementById('nav');
  const menu = document.getElementById('mb');
  const closeMenu = () => {
    nav?.classList.remove('o');
    menu?.setAttribute('aria-expanded', 'false');
    menu?.setAttribute('aria-label', 'Abrir menu');
  };
  const updateHeader = () => header?.classList.toggle('s', scrollY > 40);
  updateHeader();
  addEventListener('scroll', updateHeader, {passive: true});
  menu?.addEventListener('click', () => {
    const open = nav.classList.toggle('o');
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  });
  nav?.addEventListener('click', event => {if (event.target.closest('a')) closeMenu();});
  addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav?.classList.contains('o')) {closeMenu(); menu.focus();}
  });
  matchMedia('(min-width:861px)').addEventListener('change', event => {if (event.matches) closeMenu();});

  // Content is visible without JavaScript. Only offscreen content receives an entrance.
  if ('IntersectionObserver' in window) {
    document.documentElement.classList.add('js-motion');
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.remove('pending'); observer.unobserve(entry.target);
      }
    }, {threshold: 0.08});
    document.querySelectorAll('.rv').forEach(element => {
      if (element.getBoundingClientRect().top > innerHeight) {element.classList.add('pending');observer.observe(element);}
    });
  }

  const cards = [...document.querySelectorAll('[data-project]')];
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(el => el.setAttribute('aria-pressed', String(el === button)));
    let count = 0;
    cards.forEach(card => {
      card.hidden = filter !== 'all' && card.dataset.category !== filter;
      card.classList.remove('pending');
      if (!card.hidden) count++;
    });
    const status = document.querySelector('.project-count');
    if (status) status.textContent = `${count} ${count === 1 ? 'projeto disponível' : 'projetos disponíveis'}`;
  }));
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-view]').forEach(el => el.setAttribute('aria-pressed', String(el === button)));
    document.querySelector('.projects-grid').dataset.preview = button.dataset.view;
  }));
  // Carry only campaign parameters between Island pages, with no new trackers or storage.
  const campaign = new URLSearchParams(location.search);
  document.querySelectorAll('a[href]').forEach(link => {
    const raw = link.getAttribute('href');
    if (!raw || raw.startsWith('#')) return;
    const target = new URL(raw, location.href);
    if (target.origin !== location.origin) return;
    for (const key of ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','fbclid']) {
      if (campaign.has(key) && !target.searchParams.has(key)) target.searchParams.set(key, campaign.get(key));
    }
    link.href = target.href;
  });
})();
