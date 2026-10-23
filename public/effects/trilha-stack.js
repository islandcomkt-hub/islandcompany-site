(function(){
  var SITES=[
    {id:'trilha',t:'Trilha Motos',l:'Catálogo digital',u:'https://trilha.islandcompany.space'},
    {id:'trilhalp',t:'Trilha LP',l:'Landing page',u:'https://trilhalp.islandcompany.space'},
    {id:'tm',t:'TM · Identidade Trilha',l:'Identidade digital',u:'https://tm.islandcompany.space'}
  ];

  var LAYERS=[{id:'tm',y:-40,z:-70,b:.62},{id:'trilhalp',y:-20,z:-35,b:.82}],gSig='',gCard=null;
  function stackCard(){return document.querySelector('.circular-carousel__card[data-cc-index="0"]')}
  function cardRect(c){var ts=c.querySelectorAll(':scope > .circular-carousel__tile'),l=1e9,t=1e9,r=-1e9,b=-1e9;
    for(var i=0;i<ts.length;i++){var q=ts[i].getBoundingClientRect();l=Math.min(l,q.left);t=Math.min(t,q.top);r=Math.max(r,q.right);b=Math.max(b,q.bottom)}
    return ts.length?{left:l,top:t,width:r-l,height:b-t}:c.getBoundingClientRect()}
  function syncGhosts(){
    var c=stackCard();if(!c)return;
    var ts=c.querySelectorAll(':scope > .circular-carousel__tile'),sig='';
    for(var i=0;i<ts.length;i++)sig+=ts[i].getAttribute('style')+'|';
    if(c===gCard&&sig===gSig&&c.querySelector('.ts-ghost'))return;
    gCard=c;gSig=sig;
    c.querySelectorAll('.ts-ghost,.ts-badge').forEach(function(n){n.remove()});
    LAYERS.forEach(function(L){
      var g=document.createElement('div');g.className='ts-ghost';g.setAttribute('aria-hidden','true');
      g.style.transform='translate3d(0,'+L.y+'px,'+L.z+'px)';
      for(var i=0;i<ts.length;i++){var k=ts[i].cloneNode(true);k.querySelectorAll('.ts-badge').forEach(function(n){n.remove()});var im=k.querySelector('img');if(im){im.src='/assets/projects/'+L.id+'-carousel.webp';im.style.filter='brightness('+L.b+')'}g.appendChild(k)}
      c.insertBefore(g,c.firstChild);
    });
    if(ts.length){var bd=document.createElement('span');bd.className='ts-badge';bd.setAttribute('aria-hidden','true');bd.textContent='3 sites';ts[0].appendChild(bd)}
  }
  setInterval(syncGhosts,500);
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches, open=null;
  function el(tag,cls,parent){var e=document.createElement(tag);if(cls)e.className=cls;if(parent)parent.appendChild(e);return e}
  function openStack(opts){
    if(open)return; opts=opts||{};
    var prevFocus=document.activeElement, o=el('div','ts-overlay',document.body);
    o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.setAttribute('aria-label','Sites da Trilha Motos');
    var back=el('div','ts-back',o), row=el('div','ts-row',o), cards=[], slots=[];
    SITES.forEach(function(s,i){
      var slot=el('div','ts-slot',row); slot.style.setProperty('--d',[26,38,26][i]*(1+(i===1?0:.2)));
      var a=el('a','ts-card',slot);a.href=s.u;a.target='_blank';a.rel='noopener noreferrer';
      var im=el('img','',a);im.src='/assets/projects/'+s.id+'-carousel.webp';im.alt='';im.decoding='async';
      var c=el('span','ts-cap',a);el('small','',c).textContent='Trilha Motos';el('b','',c).textContent=s.t;el('i','',c).textContent=s.l+' ↗';
      a.addEventListener('click',function(){setTimeout(function(){close(true)},60)});
      cards.push(a);slots.push(slot);
    });
    var x=el('button','ts-x',o);x.type='button';x.setAttribute('aria-label','Fechar');x.textContent='✕';
    el('div','ts-hint',o).textContent='Toque fora para voltar';
    var sc0=stackCard(),anims=[],closing=false,origin=(sc0&&cardRect(sc0))||opts.origin||{left:innerWidth/2-100,top:innerHeight/2-100,width:200,height:200};
    var ox=origin.left+origin.width/2, oy=origin.top+origin.height/2;
    if(sc0)sc0.style.visibility='hidden';
    var ba=back.animate([{opacity:0},{opacity:1}],{duration:reduce?1:520,easing:'ease-out',fill:'both'});anims.push(ba);
    cards.forEach(function(c,i){
      var r=c.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
      var sc=Math.min(origin.width/r.width,origin.height/r.height)*.92,off=(i)*-9;
      var from='translate3d('+(ox-cx)+'px,'+(oy-cy+off)+'px,'+(-80*i)+'px) scale('+sc+') rotateX(8deg)';
      var an=c.animate([{transform:from,opacity:i?0:1,offset:0},{transform:'translate3d(0,0,0) scale(1) rotateX(0)',opacity:1,offset:1}],
        {duration:reduce?1:760,delay:reduce?0:i*90,easing:'cubic-bezier(.2,.8,.2,1)',fill:'both'});
      anims.push(an);
    });
    function move(e){var w=innerWidth,h=innerHeight;o.style.setProperty('--px',((e.clientX/w-.5)*2).toFixed(3));o.style.setProperty('--py',((e.clientY/h-.5)*2).toFixed(3));slots.forEach(function(s){s.style.setProperty('--px',o.style.getPropertyValue('--px'));s.style.setProperty('--py',o.style.getPropertyValue('--py'))});cards.forEach(function(c){c.style.setProperty('--px',o.style.getPropertyValue('--px'));c.style.setProperty('--py',o.style.getPropertyValue('--py'))})}
    o.addEventListener('pointermove',move);
    function close(fast){
      if(closing)return;closing=true;document.removeEventListener('keydown',key,true);
      var done=0,n=anims.length;
      function fin(){if(++done<n)return;o.remove();if(sc0)sc0.style.visibility='';open=null;document.documentElement.style.overflow=prevOv;
        try{prevFocus&&prevFocus.focus&&prevFocus.focus({preventScroll:true})}catch(e){}
        opts.onClose&&opts.onClose()}
      anims.forEach(function(a){a.onfinish=null;a.reverse();a.finished.then(fin,fin)});
      cards.forEach(function(c,i){});
    }
    function key(e){if(e.key==='Escape'){e.preventDefault();close()}
      if(e.key==='Tab'){var f=[x].concat(cards),i=f.indexOf(document.activeElement);e.preventDefault();f[(i+(e.shiftKey?-1:1)+f.length)%f.length].focus()}}
    document.addEventListener('keydown',key,true);
    o.addEventListener('click',function(e){if(!e.target.closest('.ts-card'))close()});
    var prevOv=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';
    cards[0].focus({preventScroll:true});
    open={close:close};
  }
  document.addEventListener('click',function(e){var c=e.target.closest&&e.target.closest('.circular-carousel__card[data-cc-index="0"]');if(c&&!e.defaultPrevented)e.preventDefault()},true);
  window.TrilhaStack={open:openStack,isOpen:function(){return !!open}};
})();
