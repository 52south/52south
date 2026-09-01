// Meta Pixel tracking for 52 South
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','4099745546996426');
fbq('track','PageView');
if(location.pathname.replace(/\/+$/,'')==='/booking-confirmed'){fbq('track','Schedule',{content_name:'Table booking'});}

const btn=document.querySelector('.menu-toggle');
const nav=document.querySelector('.navlinks');
if(btn){
  btn.setAttribute('aria-label','Open navigation');
  btn.innerHTML='<span class="hamburger-line"></span><span class="hamburger-line"></span><span class="hamburger-line"></span>';
}
if(btn&&nav){btn.addEventListener('click',()=>{nav.classList.toggle('open');btn.classList.toggle('active',nav.classList.contains('open'));btn.setAttribute('aria-label',nav.classList.contains('open')?'Close navigation':'Open navigation');});}
if(nav&&!nav.querySelector('a[href="/book-a-table/"]')){const bookingLink=document.createElement('a');bookingLink.href='/book-a-table/';bookingLink.textContent='Book a Table';nav.appendChild(bookingLink);}

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

document.querySelectorAll('.navlinks a').forEach(a=>a.addEventListener('click',()=>{if(nav)nav.classList.remove('open');if(btn)btn.classList.remove('active');}));

const ASSET_VERSION='6.7';
document.querySelectorAll('img[src^="assets/"]').forEach(img=>{const base=img.getAttribute('src').split('?')[0];img.setAttribute('src',`${base}?v=${ASSET_VERSION}`);});
document.querySelectorAll('[style*="assets/"]').forEach(el=>{const style=el.getAttribute('style');el.setAttribute('style',style.replace(/(assets\/[A-Za-z0-9._-]+\.(?:webp|png|jpg|jpeg))(?:\?v=[^'\")]+)?/g,`$1?v=${ASSET_VERSION}`));});

document.querySelectorAll('.brand span').forEach(el=>{el.textContent='52 South Cafe & Restaurant';});
document.querySelectorAll('.brand img').forEach(img=>{img.style.borderRadius='50%';img.style.objectFit='cover';});
const FACEBOOK_URL='https://www.facebook.com/52southRestaurant';
const INSTAGRAM_URL='https://www.instagram.com/52south.au/';
const WHATSAPP_URL='https://wa.me/61492144209';
const fbIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 22v-9h3l.5-3h-3.5V8.1c0-.9.3-1.6 1.8-1.6H17V3.8c-.5-.1-1.3-.2-2.4-.2-2.4 0-4.1 1.5-4.1 4.2V10H8v3h2.5v9h3z"/></svg>';
const igIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm10.5 1.5a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg>';
const waIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-1.5-.7-2.5-1.7-3.2-3.1-.1-.2 0-.4.1-.5l.6-.7c.1-.2.2-.4.1-.6l-.7-1.7c-.1-.3-.3-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.7.7-1 1.6-1 2.6 0 1.5 1.1 3 1.3 3.2.2.2 2.2 3.4 5.4 4.6.8.3 1.4.5 1.8.6.8.2 1.5.2 2.1.1.7-.1 1.4-.6 1.6-1.2.2-.6.2-1.1.1-1.2-.1-.2-.3-.3-.6-.4z"/></svg>';
if(nav&&!nav.querySelector('.nav-socials')){const socialWrap=document.createElement('div');socialWrap.className='nav-socials';socialWrap.innerHTML=`<a class="social-icon" href="${FACEBOOK_URL}" target="_blank" rel="noopener" aria-label="52 South on Facebook">${fbIcon}</a><a class="social-icon" href="${INSTAGRAM_URL}" target="_blank" rel="noopener" aria-label="52 South on Instagram">${igIcon}</a><a class="social-icon" href="${WHATSAPP_URL}" target="_blank" rel="noopener" aria-label="Message 52 South on WhatsApp">${waIcon}</a>`;nav.appendChild(socialWrap);}
const footerExplore=document.querySelector('.footer-grid > div:last-child p');
if(footerExplore&&!footerExplore.querySelector('a[href="/privacy/"]'))footerExplore.insertAdjacentHTML('beforeend','<br><a href="/privacy/">Privacy</a>');
if(!document.querySelector('.mobile-contact-bar')){const contactBar=document.createElement('nav');contactBar.className='mobile-contact-bar';contactBar.setAttribute('aria-label','Quick contact');contactBar.innerHTML=`<a href="tel:+61492144209">Call</a><a href="${WHATSAPP_URL}" target="_blank" rel="noopener">WhatsApp</a><a href="/book-a-table/">Book</a>`;document.body.appendChild(contactBar);}
if(!document.getElementById('brand-social-fixes')){const style=document.createElement('style');style.id='brand-social-fixes';style.textContent=`
.brand img{border-radius:50%!important;overflow:hidden}.brand span{font-size:.92rem;letter-spacing:.035em;text-transform:none}.nav-socials{display:flex;gap:8px;align-items:center}.social-icon{width:34px;height:34px;border:1px solid #3a3a3a;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:#f7f5f0}.social-icon svg{width:19px;height:19px}
.menu-toggle{width:48px;height:48px;padding:0!important;display:inline-flex!important;flex-direction:column;align-items:center;justify-content:center;gap:5px;border-radius:14px;line-height:1;background:rgba(15,15,15,.72);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}.hamburger-line{display:block;width:22px;height:2px;border-radius:999px;background:#f6f4ef;transition:transform .25s ease,opacity .2s ease}.menu-toggle.active .hamburger-line:nth-child(1){transform:translateY(7px) rotate(45deg)}.menu-toggle.active .hamburger-line:nth-child(2){opacity:0}.menu-toggle.active .hamburger-line:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
.hero .actions{perspective:950px;gap:16px}.hero .actions .btn{position:relative;overflow:hidden;border-radius:16px;padding:15px 24px;transform-style:preserve-3d;box-shadow:0 9px 0 rgba(0,0,0,.34),0 18px 34px rgba(0,0,0,.30),inset 0 1px rgba(255,255,255,.38);transition:transform .22s ease,box-shadow .22s ease,filter .22s ease}.hero .actions .btn:before{content:"";position:absolute;left:8px;right:8px;top:5px;height:42%;border-radius:12px;background:linear-gradient(180deg,rgba(255,255,255,.28),rgba(255,255,255,0));pointer-events:none}.hero .actions .btn:hover{transform:translateY(-7px) rotateX(4deg);box-shadow:0 14px 0 rgba(0,0,0,.32),0 28px 44px rgba(0,0,0,.40),inset 0 1px rgba(255,255,255,.45);filter:brightness(1.05)}.hero .actions .btn:active{transform:translateY(2px) scale(.985);box-shadow:0 3px 0 rgba(0,0,0,.32),0 8px 16px rgba(0,0,0,.25)}.hero .actions .btn.primary{background:linear-gradient(145deg,#fff,#dcdcdc);border-color:#fff;color:#111}.hero .actions .btn.gold{background:linear-gradient(145deg,#f1d083,#c79d4e);border-color:#edca77;color:#111}.hero .actions .btn:not(.primary):not(.gold){background:linear-gradient(145deg,rgba(30,30,30,.96),rgba(7,7,7,.98));border-color:rgba(255,255,255,.72);color:#fff;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
@media(max-width:800px){.brand span{font-size:.78rem;line-height:1.15;max-width:175px}.menu-toggle{width:46px;height:46px}.hero .actions{display:grid;grid-template-columns:1fr 1fr;gap:12px}.hero .actions .btn{text-align:center;padding:14px 12px;border-radius:14px;box-shadow:0 7px 0 rgba(0,0,0,.32),0 14px 24px rgba(0,0,0,.28)}.hero .actions .btn:hover{transform:none}.hero .actions .btn:active{transform:translateY(3px) scale(.98);box-shadow:0 3px 0 rgba(0,0,0,.30),0 7px 14px rgba(0,0,0,.22)}}
.mobile-contact-bar{display:none}@media(max-width:800px){body{padding-bottom:64px}.mobile-contact-bar{position:fixed;z-index:9999;left:0;right:0;bottom:0;display:grid;grid-template-columns:repeat(3,1fr);background:#0d0d0d;border-top:1px solid #3a3a3a;box-shadow:0 -8px 24px rgba(0,0,0,.35)}.mobile-contact-bar a{padding:15px 8px;text-align:center;color:#fff;text-decoration:none;font-weight:800;border-right:1px solid #333}.mobile-contact-bar a:last-child{border-right:0;background:#d9c277;color:#111}}
`;document.head.appendChild(style);}

const homeHero=document.querySelector('.hero');
if(homeHero&&!document.getElementById('experience-52')){const experience=document.createElement('section');experience.id='experience-52';experience.className='section experience-section';experience.innerHTML=`<div class="wrap"><div class="eyebrow">From our kitchen and dining room</div><h2>Come for the flavour. Stay for the welcome.</h2><p class="lede">A glimpse of the real dishes and relaxed space waiting for you at 52 South.</p><div class="experience-grid"><article class="experience-card wide"><video autoplay muted loop playsinline preload="metadata" poster="assets/52-south-interior-wide.webp"><source src="assets/52-south-venue-best-quality.mp4" type="video/mp4"></video><div><span>Inside 52 South</span><strong>A welcoming table in Rosetta</strong></div></article><article class="experience-card"><img src="assets/sri-lankan-rice-curry-plate.webp" alt="Sri Lankan rice and curry served at 52 South"><div><span>Made here</span><strong>Homestyle Sri Lankan food</strong></div></article><article class="experience-card"><img src="assets/sri-lankan-hoppers-promo.webp" alt="Fresh Sri Lankan hoppers at 52 South"><div><span>Friday and Saturday</span><strong>Fresh hoppers</strong></div></article></div><div class="actions"><a class="btn" href="/gallery/">See the gallery</a><a class="btn gold" href="/book-a-table/">Book a Table</a></div></div></section>`;homeHero.insertAdjacentElement('afterend',experience);}

const reviewsSection=document.getElementById('reviews');
if(reviewsSection&&!document.getElementById('guest-actions')){const guestActions=document.createElement('div');guestActions.id='guest-actions';guestActions.className='guest-actions';guestActions.innerHTML=`<div><strong>Enjoyed your visit?</strong><span>Your feedback helps more Hobart diners find us.</span></div><div class="actions"><a class="btn gold" href="https://www.google.com/maps/search/?api=1&query=52+South+Cafe+and+Restaurant+52+Marys+Hope+Road+Rosetta+TAS+7010" target="_blank" rel="noopener">Leave a Google Review</a><a class="btn" href="/loyalty/">Join 52 South Rewards</a></div>`;reviewsSection.querySelector('.wrap')?.appendChild(guestActions);}

const header=document.querySelector('.site-header');const syncHeader=()=>header&&header.classList.toggle('scrolled',window.scrollY>18);syncHeader();window.addEventListener('scroll',syncHeader,{passive:true});
const revealTargets=[...document.querySelectorAll('.section > .wrap, .card, .split > *, .scene, .info, .action-card, .menu-category, .gallery-grid img, .form-box, .review-card')];
revealTargets.forEach(el=>el.classList.add('reveal'));
const showAll=()=>revealTargets.forEach(el=>el.classList.add('in-view'));
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in-view');observer.unobserve(entry.target);}});},{threshold:.05,rootMargin:'0px 0px 80px 0px'});revealTargets.forEach(el=>observer.observe(el));setTimeout(showAll,900);}else{showAll();}
window.addEventListener('pageshow',showAll);
