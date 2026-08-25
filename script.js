const btn=document.querySelector('.menu-toggle');
const nav=document.querySelector('.navlinks');
if(btn&&nav){btn.addEventListener('click',()=>nav.classList.toggle('open'));}
document.querySelectorAll('.navlinks a').forEach(a=>a.addEventListener('click',()=>nav&&nav.classList.remove('open')));

// V6 cache-buster: force browsers to fetch the current high-quality assets.
const ASSET_VERSION='6.3';
document.querySelectorAll('img[src^="assets/"]').forEach(img=>{
  const base=img.getAttribute('src').split('?')[0];
  img.setAttribute('src',`${base}?v=${ASSET_VERSION}`);
});
document.querySelectorAll('[style*="assets/"]').forEach(el=>{
  const style=el.getAttribute('style');
  el.setAttribute('style',style.replace(/(assets\/[A-Za-z0-9._-]+\.(?:webp|png|jpg|jpeg))(?:\?v=[^'\")]+)?/g,`$1?v=${ASSET_VERSION}`));
});

const header=document.querySelector('.site-header');
const syncHeader=()=>header&&header.classList.toggle('scrolled',window.scrollY>18);
syncHeader();
window.addEventListener('scroll',syncHeader,{passive:true});

const revealTargets=[
  ...document.querySelectorAll('.section > .wrap, .card, .split > *, .scene, .info, .action-card, .menu-category, .gallery-grid img, .form-box')
];
revealTargets.forEach((el,i)=>{
  el.classList.add('reveal');
  if(el.classList.contains('card')||el.classList.contains('scene')||el.classList.contains('info')){
    el.classList.add(`reveal-delay-${(i%3)+1}`);
  }
});

if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  },{threshold:.12,rootMargin:'0px 0px -5% 0px'});
  revealTargets.forEach(el=>observer.observe(el));
}else{
  revealTargets.forEach(el=>el.classList.add('in-view'));
}
