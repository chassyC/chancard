(function(){
  if(window.__chancardInit)return;window.__chancardInit=true;
  document.documentElement.classList.add('js');
  document.addEventListener('touchstart',function(){},{passive:true});
  var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  var still=matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* sheet: tap, backdrop, swipe down */
  $$('[data-open]').forEach(function(b){b.addEventListener('click',function(){document.getElementById(b.dataset.open).showModal()})});
  $$('dialog').forEach(function(d){
    d.querySelector('[data-close]').addEventListener('click',function(){d.close()});
    d.addEventListener('click',function(e){if(e.target===d)d.close()});
    var y0=null;
    d.addEventListener('touchstart',function(e){y0=e.touches[0].clientY},{passive:true});
    d.addEventListener('touchmove',function(e){if(y0===null)return;var dy=Math.max(0,e.touches[0].clientY-y0);d.style.transition='none';d.style.transform='translateY('+dy+'px)'},{passive:true});
    d.addEventListener('touchend',function(e){var dy=e.changedTouches[0].clientY-y0;y0=null;d.style.transition='transform .3s cubic-bezier(.2,.8,.2,1)';
      if(dy>90){d.style.transform='translateY(100%)';setTimeout(function(){d.close();d.style.transform='';d.style.transition=''},260)}else{d.style.transform='';setTimeout(function(){d.style.transition=''},300)}},{passive:true});
  });

  /* map coordinates: Mercator, world width 1000 */
  var P={kin:[542.5,511.96],pavia:[525.44,358.98],hop:[301.33,370.36],ny:[294.4,376.07],dxb:[653.5,427.6],auh:[651,429.9],win:[496.36,334.51],lon:[499.67,332.51],lyon:[513.44,356.72],hfarm:[534.31,357.2],chi:[497.83,335.48],sha:[837.42,408.61],tok:[888.03,393.78]};
  var CH=[
    {c:[542,480],w:170,s:104,pins:[['kin','DR Congo','t','congo']]},
    {c:[532,420],w:360,s:72,arcs:[['kin','pavia']],pins:[['kin'],['pavia','Italy','r','italy']]},
    {c:[506,343],w:66,s:68,arcs:[['lyon','win'],['win','lon']],pins:[['lyon','Lyon','l','lyon'],['win','Winchester','l','winchester'],['lon','London','r','london']]},
    {c:[400,365],w:345,s:68,arcs:[['pavia','hop']],pins:[['pavia'],['hop','Boston','t','boston'],['ny','New York','b','ny']]},
    {c:[600,398],w:300,s:68,arcs:[['pavia','dxb']],pins:[['pavia'],['dxb','Dubai','r','dubai'],['auh','Abu Dhabi','l','abudhabi']]},
    {c:[516,343],w:104,s:72,pins:[['chi','Chichester','l','chichester'],['hfarm','H-FARM','l','hfarm']]},
    {c:[712,376],w:470,s:72,arcs:[['hfarm','sha'],['sha','tok']],pins:[['hfarm'],['sha','China','l','china'],['tok','Japan','t','japan']]}
  ];
  function pic(n){return 'img/pl/'+n+(n==='congo'?'.webp':'.jpg')}
  CH.forEach(function(ch){ch.pins.forEach(function(p){if(p[3])new Image().src=pic(p[3])})});
  var DWELL=4200;
  var stage=document.getElementById('stage');
  if(stage){(function(){
    var land=document.getElementById('land'),arcs=$$('#over .arc'),pinsEl=document.getElementById('pins'),bars=document.getElementById('bars'),caps=$$('#caps .cap'),prev=document.getElementById('prev'),next=document.getElementById('next');
    var W=0,H=0,cam={c:CH[0].c.slice(),w:CH[0].w},cur=-1,raf=0,timer=0,auto=true,pins=[],active=[];
    CH.forEach(function(_,i){var b=document.createElement('button');b.type='button';b.setAttribute('aria-label','Step '+(i+1)+' of '+CH.length);b.innerHTML='<i><b></b></i>';b.addEventListener('click',function(){stop();go(i)});bars.appendChild(b)});
    var barEls=$$('button',bars);
    function size(){W=stage.clientWidth;H=stage.clientHeight;draw(1);clampTags()}
    function sx(p){return (p[0]-cam.c[0])/cam.w*W+W/2}
    function sy(p){return (p[1]-cam.c[1])/cam.w*W+H/2}
    function draw(progress){
      var h=cam.w*H/W;
      land.setAttribute('viewBox',(cam.c[0]-cam.w/2)+' '+(cam.c[1]-h/2)+' '+cam.w+' '+h);
      arcs.forEach(function(a,i){
        var s=active[i];
        if(!s){a.setAttribute('d','');return}
        var A=P[s[0]],B=P[s[1]],x1=sx(A),y1=sy(A),x2=sx(B),y2=sy(B),d=Math.hypot(x2-x1,y2-y1),mx=(x1+x2)/2,my=(y1+y2)/2,nx=-(y2-y1)/(d||1),ny=(x2-x1)/(d||1);
        if(ny>0){nx=-nx;ny=-ny}
        var lift=d*.24;
        a.setAttribute('d','M'+x1.toFixed(1)+' '+y1.toFixed(1)+'Q'+(mx+nx*lift).toFixed(1)+' '+(my+ny*lift).toFixed(1)+' '+x2.toFixed(1)+' '+y2.toFixed(1));
        var n=active.length,t=Math.max(0,Math.min(1,progress*n-i));
        a.style.strokeDashoffset=(1-t).toFixed(4);
      });
      pins.forEach(function(p){p.el.style.transform='translate('+sx(P[p.k]).toFixed(1)+'px,'+sy(P[p.k]).toFixed(1)+'px)'});
    }
    function clampTags(){
      var ch=CH[cur],gap=13,m=8,top=26;if(!ch)return;
      $$('.pin',pinsEl).forEach(function(el,n){
        var cd=el.querySelector('.pc');if(!cd)return;
        var p=ch.pins[n],Q=P[p[0]],x=(Q[0]-ch.c[0])/ch.w*W+W/2,y=(Q[1]-ch.c[1])/ch.w*W+H/2,w=cd.offsetWidth,h=cd.offsetHeight,s=p[2],l,t;
        if(s==='t'){l=-w/2;t=-h-gap}else if(s==='b'){l=-w/2;t=gap}else if(s==='l'){l=-w-gap;t=-h/2}else{l=gap;t=-h/2}
        l=Math.max(m-x,Math.min(W-m-x-w,l));t=Math.max(top-y,Math.min(H-m-y-h,t));
        cd.style.left=l+'px';cd.style.top=t+'px';
        var ax=Math.max(16,Math.min(w-16,-l)),ay=Math.max(16,Math.min(h-16,-t));
        if(s==='t'||s==='b'){cd.style.setProperty('--ax',ax+'px');cd.style.setProperty('--ay',s==='t'?'100%':'0%');cd.style.transformOrigin=ax+'px '+(s==='t'?'100%':'0')}
        else{cd.style.setProperty('--ax',s==='l'?'100%':'0%');cd.style.setProperty('--ay',ay+'px');cd.style.transformOrigin=(s==='l'?'100%':'0')+' '+ay+'px'}
      })
    }
    function ease(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}
    function go(i,instant){
      if(i===cur)return;cur=i;var ch=CH[i];
      caps.forEach(function(c,n){c.classList.toggle('on',n===i)});
      prev.disabled=i===0;next.disabled=i===CH.length-1;
      barEls.forEach(function(b,n){b.className=n<i?'done':n===i?(auto?'live':'held'):'';b.setAttribute('aria-current',n===i?'step':'false')});
      pinsEl.innerHTML='';pins=ch.pins.map(function(p){var el=document.createElement('div');el.className=p[1]?'pin':'pin o';el.style.setProperty('--s',(ch.s||64)+'px');el.innerHTML='<span class="dot"></span>'+(p[1]?'<span class="pc"><img src="'+pic(p[3])+'" alt="" draggable="false"><b>'+p[1]+'</b></span>':'');pinsEl.appendChild(el);return{k:p[0],el:el}});clampTags();
      active=ch.arcs||[];
      cancelAnimationFrame(raf);clearTimeout(timer);
      var from={c:cam.c.slice(),w:cam.w},dur=(still||instant)?0:1250,t0=performance.now();
      var arrive=function(){pins.forEach(function(p,n){setTimeout(function(){p.el.classList.add('on')},n*140)})};
      var lit=false;
      (function frame(now){
        var t=dur?Math.min(1,(now-t0)/dur):1,e=ease(t);
        cam.c[0]=from.c[0]+(ch.c[0]-from.c[0])*e;cam.c[1]=from.c[1]+(ch.c[1]-from.c[1])*e;
        /* interpolate zoom geometrically so the flight feels constant */
        cam.w=Math.exp(Math.log(from.w)+(Math.log(ch.w)-Math.log(from.w))*e);
        draw(Math.max(0,(t-.2)/.8));
        if(!lit&&t>=.72){lit=true;arrive()}
        if(t<1)raf=requestAnimationFrame(frame);
      })(t0);
      if(auto&&i<CH.length-1)timer=setTimeout(function(){go(i+1)},DWELL);
      else if(auto){timer=setTimeout(function(){stop()},DWELL)}
    }
    function stop(){auto=false;clearTimeout(timer);barEls.forEach(function(b,n){if(n===cur)b.className='held'})}
    prev.addEventListener('click',function(){stop();if(cur>0)go(cur-1)});
    next.addEventListener('click',function(){stop();if(cur<CH.length-1)go(cur+1)});
    var sx0=null,sy0=null;
    stage.addEventListener('touchstart',function(e){sx0=e.touches[0].clientX;sy0=e.touches[0].clientY},{passive:true});
    stage.addEventListener('touchend',function(e){if(sx0===null)return;var dx=e.changedTouches[0].clientX-sx0,dy=e.changedTouches[0].clientY-sy0;sx0=null;
      if(Math.abs(dx)>36&&Math.abs(dx)>Math.abs(dy)*1.4){stop();var n=cur+(dx<0?1:-1);if(n>=0&&n<CH.length)go(n)}
    },{passive:true});
    document.documentElement.style.setProperty('--dwell',DWELL+'ms');
    if(window.ResizeObserver)new ResizeObserver(size).observe(stage);else addEventListener('resize',size);
    W=stage.clientWidth;H=stage.clientHeight;
    /* first frame is ready before it is seen; autoplay begins when it is in view */
    var started=false;auto=false;go(0,true);pins.forEach(function(p){p.el.classList.add('on')});
    barEls[0].className='held';
    if('IntersectionObserver' in window&&!still){new IntersectionObserver(function(es,o){
      if(es[0].isIntersecting&&!started){started=true;o.disconnect();auto=true;barEls[0].className='live';timer=setTimeout(function(){go(1)},DWELL)}
    },{threshold:.55}).observe(stage)}
    window.__journey={go:function(i){stop();go(i,true);pins.forEach(function(p){p.el.classList.add('on')});draw(1);clampTags()},count:CH.length};
  })()}

  if(!('IntersectionObserver' in window)){document.documentElement.classList.remove('js');return}
  /* one shared entrance for every tile */
  var rev=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;var t=e.target;t.classList.add('shown');rev.unobserve(t);setTimeout(function(){t.classList.add('settled')},900)})},{threshold:.08,rootMargin:'0px 0px -6% 0px'});
  $$('.tile').forEach(function(t){rev.observe(t)});
  /* gentle depth on the first screen */
  if(!still&&innerWidth<860){var ph=document.querySelector('.hero-photo'),nm=document.querySelector('h1'),hh=document.querySelector('.hero'),tick=false;
    var par=function(){tick=false;var y=Math.max(0,scrollY);if(y>hh.offsetHeight+80)return;ph.style.transform='translateY('+(y*.16).toFixed(1)+'px)';nm.style.transform='translateY('+(y*.3).toFixed(1)+'px)'};
    addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(par)}},{passive:true});}
  var svgs=function(el){return $$('svg',el).filter(function(s){return s.querySelector('animateMotion')})};
  $$('svg').forEach(function(s){if(s.querySelector('animateMotion')&&s.pauseAnimations)s.pauseAnimations()});
  var once=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');once.unobserve(e.target)}})},{threshold:.3});
  $$('.anim').forEach(function(e){once.observe(e)});
  var loops=new IntersectionObserver(function(es){es.forEach(function(e){
    var on=e.isIntersecting&&!still;e.target.classList.toggle('run',on);
    svgs(e.target).forEach(function(s){on?s.unpauseAnimations():s.pauseAnimations()});
  })},{threshold:.15});
  $$('.loop').forEach(function(e){loops.observe(e)});
  var dock=document.getElementById('dock');
  new IntersectionObserver(function(es){
    var show=!es[0].isIntersecting;
    dock.classList.toggle('on',show);dock.setAttribute('aria-hidden',show?'false':'true');
    $$('a',dock).forEach(function(a){show?a.removeAttribute('tabindex'):a.setAttribute('tabindex','-1')});
  }).observe(document.querySelector('.panel'));
})();
