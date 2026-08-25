const btn=document.querySelector('.menu-toggle');
const nav=document.querySelector('.navlinks');
if(btn){btn.addEventListener('click',()=>nav.classList.toggle('open'));}
document.querySelectorAll('.navlinks a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));

// V6 cache-buster: force browsers to fetch the current high-quality assets.
const ASSET_VERSION='6.2';
document.querySelectorAll('img[src^="assets/"]').forEach(img=>{
  const base=img.getAttribute('src').split('?')[0];
  img.setAttribute('src',`${base}?v=${ASSET_VERSION}`);
});
document.querySelectorAll('[style*="assets/"]').forEach(el=>{
  const style=el.getAttribute('style');
  el.setAttribute('style',style.replace(/(assets\/[A-Za-z0-9._-]+\.(?:webp|png|jpg|jpeg))(?:\?v=[^'\")]+)?/g,`$1?v=${ASSET_VERSION}`));
});
