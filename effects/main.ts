// Keep the document usable before React or WebGL starts, and if either fails.
const hero = document.getElementById('topography-root');
const portfolio = document.getElementById('carousel-root');
if (hero) {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    void import('./Hero').then(module => module.mountHero(hero)).catch(error => console.error('Topography:',error));
  }));
}
const method = document.getElementById('method-root');
if (method) void import('./IslandMethod').then(module=>module.mountMethod(method)).catch(error=>console.error('ISLAND:',error));
for (const id of ['specialties-root','founder-root']) {
  const element = document.getElementById(id);
  if (!element) continue;
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry=>entry.isIntersecting)) return;
    observer.disconnect();
    void import('./NativeSections').then(module=>{
      if (id==='specialties-root') module.mountSpecialties(element);
      else module.mountFounder(element);
    }).catch(error=>console.error('Framer:',error));
  },{rootMargin:'600px'});
  observer.observe(element);
}
if (portfolio) {
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    void import('./Portfolio').then(module => module.mountPortfolio(portfolio)).catch(() => {});
  }, { rootMargin: '300px' });
  observer.observe(portfolio);
}

for (const id of ['manifesto-root','testimonials-root']) {
 const element=document.getElementById(id); if (!element) continue;
 const observer=new IntersectionObserver(entries=>{if(!entries.some(e=>e.isIntersecting))return; observer.disconnect(); void import('./RevealSections').then(m=>id==='manifesto-root'?m.mountManifesto(element):m.mountTestimonials(element)).catch(console.error);},{rootMargin:'500px'}); observer.observe(element);
}
