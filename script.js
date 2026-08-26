const btn=document.querySelector('.menu-toggle');
const nav=document.querySelector('.navlinks');
if(btn&&nav){btn.addEventListener('click',()=>nav.classList.toggle('open'));}
document.querySelectorAll('.navlinks a').forEach(a=>a.addEventListener('click',()=>nav&&nav.classList.remove('open')));

const ASSET_VERSION='6.4';
document.querySelectorAll('img[src^="assets/"]').forEach(img=>{const base=img.getAttribute('src').split('?')[0];img.setAttribute('src',`${base}?v=${ASSET_VERSION}`);});
document.querySelectorAll('[style*="assets/"]').forEach(el=>{const style=el.getAttribute('style');el.setAttribute('style',style.replace(/(assets\/[A-Za-z0-9._-]+\.(?:webp|png|jpg|jpeg))(?:\?v=[^'\")]+)?/g,`$1?v=${ASSET_VERSION}`));});

document.querySelectorAll('.brand span').forEach(el=>{el.textContent='52 South Cafe & Restaurant';});
document.querySelectorAll('.brand img').forEach(img=>{img.style.borderRadius='50%';img.style.objectFit='cover';});
const heroTitle=document.querySelector('.hero h1');if(heroTitle&&heroTitle.textContent.trim()==='52 South'){heroTitle.textContent='52 South Cafe & Restaurant';}

const FACEBOOK_URL='https://www.facebook.com/share/1HKZzzKNUb/?mibextid=wwXIfr';
const INSTAGRAM_URL='https://www.instagram.com/52south.au?igsi=MXIwc3phMmdqM2Jkcg%3D%3D&utm_source=qr';
const fbIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 22v-9h3l.5-3h-3.5V8.1c0-.9.3-1.6 1.8-1.6H17V3.8c-.5-.1-1.3-.2-2.4-.2-2.4 0-4.1 1.5-4.1 4.2V10H8v3h2.5v9h3z"/></svg>';
const igIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm10.5 1.5a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg>';
if(nav&&!nav.querySelector('.nav-socials')){const socialWrap=document.createElement('div');socialWrap.className='nav-socials';socialWrap.innerHTML=`<a class="social-icon" href="${FACEBOOK_URL}" target="_blank" rel="noopener" aria-label="52 South on Facebook" title="Facebook">${fbIcon}</a><a class="social-icon" href="${INSTAGRAM_URL}" target="_blank" rel="noopener" aria-label="52 South on Instagram" title="Instagram">${igIcon}</a>`;nav.appendChild(socialWrap);}
const footerExplore=document.querySelector('.footer-grid > div:last-child p');if(footerExplore&&!footerExplore.querySelector('.footer-socials')){const social=document.createElement('span');social.className='footer-socials';social.innerHTML=`<br><a href="${FACEBOOK_URL}" target="_blank" rel="noopener">Facebook</a> · <a href="${INSTAGRAM_URL}" target="_blank" rel="noopener">Instagram</a>`;footerExplore.appendChild(social);}

if(!document.getElementById('brand-social-fixes')){const style=document.createElement('style');style.id='brand-social-fixes';style.textContent=`
.brand img{border-radius:50%!important;overflow:hidden}.brand span{font-size:.92rem;letter-spacing:.035em;text-transform:none}.nav-socials{display:flex;gap:8px;align-items:center;margin-left:2px}.social-icon{width:34px;height:34px;border:1px solid #3a3a3a;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:#f7f5f0;transition:color .25s ease,border-color .25s ease,transform .25s ease}.social-icon:hover{color:var(--accent);border-color:var(--accent);transform:translateY(-2px)}.social-icon svg{width:19px;height:19px;display:block}.footer-socials a{color:var(--accent);text-decoration:none}.footer-socials a:hover{text-decoration:underline}
@media(max-width:800px){.brand span{font-size:.78rem;line-height:1.15;max-width:175px}.nav-socials{margin-top:6px}.hero h1{font-size:clamp(2.7rem,13vw,5rem)}}
`;document.head.appendChild(style);}

const todayGrid=document.querySelector('.today-grid');
if(todayGrid){
  const todayCards=[...todayGrid.querySelectorAll('.today-card')];
  if(todayCards[0])todayCards[0].classList.add('today-lunch-card');
  if(todayCards[1])todayCards[1].classList.add('today-special-card');
  if(!document.querySelector('.today-swipe-hint')){
    const hint=document.createElement('div');hint.className='today-swipe-hint';hint.innerHTML='<span class="swipe-hand">☝︎</span><span>Swipe left for Dinner Special</span><span class="swipe-arrow">→</span>';todayGrid.insertAdjacentElement('afterend',hint);
  }
  const style=document.createElement('style');style.id='today-card-colours';style.textContent=`
.today-grid{perspective:1400px}.today-card{position:relative;border-radius:22px;transform-style:preserve-3d;transition:transform .45s cubic-bezier(.2,.8,.2,1),box-shadow .45s ease,border-color .35s ease;isolation:isolate}.today-card:before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:3;background:linear-gradient(125deg,rgba(255,255,255,.16),transparent 22%,transparent 72%,rgba(255,255,255,.035));box-shadow:inset 1px 1px 0 rgba(255,255,255,.16),inset -1px -1px 0 rgba(0,0,0,.4)}.today-card img{position:relative;z-index:1}.today-card-body{position:relative;z-index:4;transform:translateZ(18px)}.today-card:hover{transform:perspective(1100px) rotateX(2deg) rotateY(-3deg) translateY(-10px);z-index:5}
.today-lunch-card{background:linear-gradient(145deg,#17351f,#0c1710);border-color:#47875a;box-shadow:12px 14px 0 rgba(45,111,62,.22),0 30px 60px rgba(0,0,0,.48),inset 0 1px rgba(255,255,255,.08)}.today-lunch-card:hover{box-shadow:16px 20px 0 rgba(45,111,62,.20),0 40px 70px rgba(0,0,0,.55)}.today-lunch-card .today-badge{background:#77cb8b;color:#07120a;box-shadow:0 7px 18px rgba(75,180,100,.22)}.today-lunch-card h3{color:#e0f8e5;text-shadow:0 2px 10px rgba(0,0,0,.3)}
.today-special-card{background:linear-gradient(145deg,#3a1d14,#160e0b);border-color:#a15339;box-shadow:12px 14px 0 rgba(154,70,42,.22),0 30px 60px rgba(0,0,0,.48),inset 0 1px rgba(255,255,255,.08)}.today-special-card:hover{box-shadow:16px 20px 0 rgba(154,70,42,.20),0 40px 70px rgba(0,0,0,.55)}.today-special-card .today-badge{background:#f08c61;color:#1b0904;box-shadow:0 7px 18px rgba(224,105,64,.24)}.today-special-card h3{color:#ffe4d8;text-shadow:0 2px 10px rgba(0,0,0,.3)}
.today-swipe-hint{display:none}
@media(max-width:800px){.today-card{border-radius:20px;box-shadow:8px 10px 0 rgba(0,0,0,.28),0 24px 45px rgba(0,0,0,.42)}.today-card:hover{transform:none}.today-lunch-card{box-shadow:8px 10px 0 rgba(45,111,62,.22),0 24px 45px rgba(0,0,0,.45)}.today-special-card{box-shadow:8px 10px 0 rgba(154,70,42,.22),0 24px 45px rgba(0,0,0,.45)}.today-swipe-hint{display:flex;align-items:center;justify-content:center;gap:8px;margin:18px 0 0;padding:11px 15px;border-radius:999px;background:linear-gradient(145deg,rgba(217,182,111,.16),rgba(217,182,111,.06));border:1px solid rgba(217,182,111,.4);box-shadow:0 8px 22px rgba(0,0,0,.28),inset 0 1px rgba(255,255,255,.08);color:#ecd9aa;font-size:.88rem;font-weight:800}.swipe-hand{display:inline-block;transform:rotate(90deg);font-size:1.05rem;animation:swipeHint 1.5s ease-in-out infinite}.swipe-arrow{font-size:1.15rem}}
@keyframes swipeHint{0%,100%{transform:translateX(-3px) rotate(90deg)}50%{transform:translateX(5px) rotate(90deg)}}`;
  document.head.appendChild(style);
}

const header=document.querySelector('.site-header');const syncHeader=()=>header&&header.classList.toggle('scrolled',window.scrollY>18);syncHeader();window.addEventListener('scroll',syncHeader,{passive:true});
const revealTargets=[...document.querySelectorAll('.section > .wrap, .card, .split > *, .scene, .info, .action-card, .menu-category, .gallery-grid img, .form-box, .review-card')];
revealTargets.forEach((el,i)=>{el.classList.add('reveal');if(el.classList.contains('card')||el.classList.contains('scene')||el.classList.contains('info')||el.classList.contains('review-card')){el.classList.add(`reveal-delay-${(i%3)+1}`);}});
const showAll=()=>revealTargets.forEach(el=>el.classList.add('in-view'));
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in-view');observer.unobserve(entry.target);}});},{threshold:.05,rootMargin:'0px 0px 80px 0px'});revealTargets.forEach(el=>observer.observe(el));setTimeout(showAll,900);}else{showAll();}
window.addEventListener('pageshow',showAll);
