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
  var P={kin:[542.5,511.96],pavia:[525.44,358.98],hop:[301.33,370.36],win:[496.36,334.51],lon:[499.67,332.51],lyon:[513.44,356.72],hfarm:[534.31,357.2],chi:[497.83,335.48],sha:[837.42,408.61],tok:[888.03,393.78]};
  var CH=[
    {c:[542,505],w:170,pins:[['kin','DR Congo','t']]},
    {c:[532,420],w:360,arcs:[['kin','pavia']],pins:[['kin'],['pavia','Italy','t']]},
    {c:[412,348],w:345,arcs:[['pavia','hop']],pins:[['pavia'],['hop','Massachusetts','b']]},
    {c:[506,343],w:66,pins:[['win','Winchester','l'],['lon','London','r'],['lyon','Lyon','b']]},
    {c:[516,343],w:104,pins:[['chi','Chichester','t'],['hfarm','H-FARM','b']]},
    {c:[712,376],w:470,arcs:[['hfarm','sha'],['sha','tok']],pins:[['hfarm'],['sha','China','b'],['tok','Japan','t']]}
  ];
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
    function clampTags(){var s=stage.getBoundingClientRect();$$('.tag',pinsEl).forEach(function(t){t.style.translate='none';var r=t.getBoundingClientRect(),m=8,dx=0;if(r.left<s.left+m)dx=s.left+m-r.left;else if(r.right>s.right-m)dx=s.right-m-r.right;if(dx)t.style.translate=dx+'px 0'})}
    function ease(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}
    function go(i,instant){
      if(i===cur)return;cur=i;var ch=CH[i];
      caps.forEach(function(c,n){c.classList.toggle('on',n===i)});
      prev.disabled=i===0;next.disabled=i===CH.length-1;
      barEls.forEach(function(b,n){b.className=n<i?'done':n===i?(auto?'live':'held'):'';b.setAttribute('aria-current',n===i?'step':'false')});
      pinsEl.innerHTML='';pins=ch.pins.map(function(p){var el=document.createElement('div');el.className=p[1]?'pin':'pin o';el.innerHTML='<span class="dot"></span>'+(p[1]?'<span class="tag '+p[2]+'">'+p[1]+'</span>':'');pinsEl.appendChild(el);return{k:p[0],el:el}});
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
        if(t<1)raf=requestAnimationFrame(frame);else clampTags();
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

  if(!('IntersectionObserver' in window))return;
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
