const btn=document.querySelector('.menu-toggle');
const nav=document.querySelector('.navlinks');
if(btn&&nav){btn.addEventListener('click',()=>nav.classList.toggle('open'));}

document.querySelectorAll('a[href]').forEach(a=>{
  const href=a.getAttribute('href');
  const clean={
    'index.html':'/',
    'menu.html':'/menu/',
    'gallery.html':'/gallery/',
    'venue-hire.html':'/venue-hire/',
    'contact.html':'/contact/'
  };
  if(clean[href]) a.setAttribute('href',clean[href]);
});

document.querySelectorAll('.navlinks a').forEach(a=>a.addEventListener('click',()=>nav&&nav.classList.remove('open')));

const ASSET_VERSION='6.5';
document.querySelectorAll('img[src^="assets/"]').forEach(img=>{const base=img.getAttribute('src').split('?')[0];img.setAttribute('src',`${base}?v=${ASSET_VERSION}`);});
document.querySelectorAll('[style*="assets/"]').forEach(el=>{const style=el.getAttribute('style');el.setAttribute('style',style.replace(/(assets\/[A-Za-z0-9._-]+\.(?:webp|png|jpg|jpeg))(?:\?v=[^'\")]+)?/g,`$1?v=${ASSET_VERSION}`));});

document.querySelectorAll('.brand span').forEach(el=>{el.textContent='52 South Cafe & Restaurant';});
document.querySelectorAll('.brand img').forEach(img=>{img.style.borderRadius='50%';img.style.objectFit='cover';});
const FACEBOOK_URL='https://www.facebook.com/share/1HKZzzKNUb/?mibextid=wwXIfr';
const INSTAGRAM_URL='https://www.instagram.com/52south.au?igsi=MXIwc3phMmdqM2Jkcg%3D%3D&utm_source=qr';
const fbIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 22v-9h3l.5-3h-3.5V8.1c0-.9.3-1.6 1.8-1.6H17V3.8c-.5-.1-1.3-.2-2.4-.2-2.4 0-4.1 1.5-4.1 4.2V10H8v3h2.5v9h3z"/></svg>';
const igIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm10.5 1.5a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg>';
if(nav&&!nav.querySelector('.nav-socials')){const socialWrap=document.createElement('div');socialWrap.className='nav-socials';socialWrap.innerHTML=`<a class="social-icon" href="${FACEBOOK_URL}" target="_blank" rel="noopener" aria-label="52 South on Facebook">${fbIcon}</a><a class="social-icon" href="${INSTAGRAM_URL}" target="_blank" rel="noopener" aria-label="52 South on Instagram">${igIcon}</a>`;nav.appendChild(socialWrap);}
if(!document.getElementById('brand-social-fixes')){const style=document.createElement('style');style.id='brand-social-fixes';style.textContent=`.brand img{border-radius:50%!important;overflow:hidden}.brand span{font-size:.92rem;letter-spacing:.035em;text-transform:none}.nav-socials{display:flex;gap:8px;align-items:center}.social-icon{width:34px;height:34px;border:1px solid #3a3a3a;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:#f7f5f0}.social-icon svg{width:19px;height:19px}@media(max-width:800px){.brand span{font-size:.78rem;line-height:1.15;max-width:175px}}`;document.head.appendChild(style);}
const header=document.querySelector('.site-header');const syncHeader=()=>header&&header.classList.toggle('scrolled',window.scrollY>18);syncHeader();window.addEventListener('scroll',syncHeader,{passive:true});
const revealTargets=[...document.querySelectorAll('.section > .wrap, .card, .split > *, .scene, .info, .action-card, .menu-category, .gallery-grid img, .form-box, .review-card')];
revealTargets.forEach(el=>el.classList.add('reveal'));
const showAll=()=>revealTargets.forEach(el=>el.classList.add('in-view'));
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in-view');observer.unobserve(entry.target);}});},{threshold:.05,rootMargin:'0px 0px 80px 0px'});revealTargets.forEach(el=>observer.observe(el));setTimeout(showAll,900);}else{showAll();}
window.addEventListener('pageshow',showAll);
