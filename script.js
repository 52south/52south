// Consent-controlled measurement for 52 South
const SOUTH_MEASUREMENT_ID='G-DJDKKQMYCD';
const SOUTH_META_PIXEL_ID='1352737030376286';
const SOUTH_TIKTOK_PIXEL_ID=''; // Add the business-owned TikTok Pixel ID after Ads Manager access is available.
const SOUTH_CONSENT_KEY='52south-consent-v1';
let southMeasurementLoaded=false;

window.dataLayer=window.dataLayer||[];
window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});

function southLoadScript(src,id){
  if(id&&document.getElementById(id))return;
  const script=document.createElement('script');
  if(id)script.id=id;
  script.async=true;
  script.src=src;
  document.head.appendChild(script);
}

function southTrack(eventName,parameters={}){
  if(localStorage.getItem(SOUTH_CONSENT_KEY)!=='all')return;
  gtag('event',eventName,{...parameters,send_to:SOUTH_MEASUREMENT_ID,transport_type:'beacon'});
}

function southMetaTrack(eventName,parameters={},custom=false){
  if(localStorage.getItem(SOUTH_CONSENT_KEY)!=='all'||typeof fbq!=='function')return;
  fbq(custom?'trackCustom':'track',eventName,parameters);
}

function southTikTokTrack(eventName,parameters={}){
  if(localStorage.getItem(SOUTH_CONSENT_KEY)!=='all'||!SOUTH_TIKTOK_PIXEL_ID||!window.ttq)return;
  ttq.track(eventName,parameters);
}

function southLoadMeasurement(){
  if(southMeasurementLoaded)return;
  southMeasurementLoaded=true;
  gtag('consent','update',{analytics_storage:'granted',ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted'});
  gtag('js',new Date());
  gtag('config',SOUTH_MEASUREMENT_ID,{anonymize_ip:true});
  southLoadScript(`https://www.googletagmanager.com/gtag/js?id=${SOUTH_MEASUREMENT_ID}`,'south-ga4');

  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init',SOUTH_META_PIXEL_ID);
  fbq('consent','grant');
  fbq('track','PageView');

  if(SOUTH_TIKTOK_PIXEL_ID){
    !function(w,d,t){w.TiktokAnalyticsObject=t;const ttq=w[t]=w[t]||[];ttq.methods=['page','track','identify','instances','debug','on','off','once','ready','alias','group','enableCookie','disableCookie','holdConsent','revokeConsent','grantConsent'];ttq.setAndDefer=function(o,m){o[m]=function(){o.push([m].concat([].slice.call(arguments,0)));};};for(let i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(id){const s=d.createElement('script');s.async=true;s.src='https://analytics.tiktok.com/i18n/pixel/events.js?sdkid='+id+'&lib='+t;const x=d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s,x);};ttq.load(SOUTH_TIKTOK_PIXEL_ID);ttq.grantConsent();ttq.page();}(window,document,'ttq');
  }
  southTrackPagePurpose();
}

function southTrackPagePurpose(){
  const path=location.pathname.replace(/\/+$/,'')||'/';
  if(path==='/menu'||path==='/menu.html'){
    southTrack('view_menu',{page_type:'restaurant_menu'});
    southMetaTrack('ViewContent',{content_name:'52 South menu',content_category:'Restaurant menu'});
    southTikTokTrack('ViewContent',{content_name:'52 South menu',content_type:'product_group'});
  }
}

function southSetConsent(choice){
  localStorage.setItem(SOUTH_CONSENT_KEY,choice);
  document.querySelector('.cookie-consent')?.remove();
  if(choice==='all')southLoadMeasurement();
  else{
    gtag('consent','update',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    if(typeof fbq==='function')fbq('consent','revoke');
    if(window.ttq?.revokeConsent)ttq.revokeConsent();
  }
}

function southShowConsent(){
  document.querySelector('.cookie-consent')?.remove();
  const banner=document.createElement('section');
  banner.className='cookie-consent';
  banner.setAttribute('role','dialog');
  banner.setAttribute('aria-label','Cookie choices');
  banner.innerHTML='<div><strong>Your privacy choices</strong><p>We use optional analytics and advertising cookies to measure bookings, menu views, calls and ordering clicks. You can accept them or continue with essential website features only. <a href="/privacy/">Privacy information</a></p></div><div class="cookie-actions"><button type="button" data-consent="essential">Essential only</button><button class="cookie-accept" type="button" data-consent="all">Accept analytics & ads</button></div>';
  banner.addEventListener('click',event=>{const choice=event.target.closest('[data-consent]')?.dataset.consent;if(choice)southSetConsent(choice);});
  document.body.appendChild(banner);
}

const southSavedConsent=localStorage.getItem(SOUTH_CONSENT_KEY);
if(southSavedConsent==='all')southLoadMeasurement();
else if(!southSavedConsent)window.addEventListener('DOMContentLoaded',southShowConsent,{once:true});

window.southAnalytics={track:southTrack,meta:southMetaTrack,tiktok:southTikTokTrack,showConsent:southShowConsent};

const btn=document.querySelector('.menu-toggle');
const nav=document.querySelector('.navlinks');

const southTrackedOutboundClicks=new WeakMap();
function southTrackOutboundClick(event){
  const link=event.target.closest('a[href]');
  if(!link)return;
  const now=Date.now();
  if(now-(southTrackedOutboundClicks.get(link)||0)<1500)return;
  const href=link.href||'';
  if(href.startsWith('tel:')){
    southTrackedOutboundClicks.set(link,now);
    southTrack('click_to_call',{link_url:href,link_text:link.textContent.trim()});
    southMetaTrack('Contact',{contact_method:'phone'});
    southTikTokTrack('Contact',{contact_method:'phone'});
  }else if(/ubereats\.com/i.test(href)){
    southTrackedOutboundClicks.set(link,now);
    southTrack('order_online_click',{provider:'Uber Eats',link_url:href});
    southMetaTrack('InitiateCheckout',{content_name:'Uber Eats order'});
    southTikTokTrack('InitiateCheckout',{content_name:'Uber Eats order'});
  }else if(event.type==='click'&&/\/book-a-table\/?(?:$|[?#])/i.test(href)&&!location.pathname.startsWith('/book-a-table')){
    southTrack('booking_cta_click',{link_url:href,link_text:link.textContent.trim()});
  }
}
document.addEventListener('pointerdown',southTrackOutboundClick,true);
document.addEventListener('click',southTrackOutboundClick,true);
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
const footerLast=document.querySelector('.footer-grid > div:last-child');
if(footerLast&&!footerLast.querySelector('.cookie-settings-button')){const settingsButton=document.createElement('button');settingsButton.type='button';settingsButton.className='cookie-settings-button';settingsButton.textContent='Cookie settings';settingsButton.addEventListener('click',southShowConsent);footerLast.appendChild(settingsButton);}
if(!document.querySelector('.mobile-contact-bar')){const contactBar=document.createElement('nav');const bookingPage=location.pathname.replace(/\/+$/,'')==='/book-a-table';contactBar.className='mobile-contact-bar';contactBar.setAttribute('aria-label','Quick contact');contactBar.innerHTML=bookingPage?`<a href="tel:+61492144209">Call</a><a href="${WHATSAPP_URL}" target="_blank" rel="noopener">WhatsApp</a><a href="/book-a-table/#reservation-form">Request table</a>`:`<a href="tel:+61492144209">Call</a><a href="${WHATSAPP_URL}" target="_blank" rel="noopener">WhatsApp</a><a href="/book-a-table/">Book</a>`;document.body.appendChild(contactBar);}
if(!document.getElementById('brand-social-fixes')){const style=document.createElement('style');style.id='brand-social-fixes';style.textContent=`
.brand img{border-radius:50%!important;overflow:hidden}.brand span{font-size:.92rem;letter-spacing:.035em;text-transform:none}.nav-socials{display:flex;gap:8px;align-items:center}.social-icon{width:34px;height:34px;border:1px solid #3a3a3a;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:#f7f5f0}.social-icon svg{width:19px;height:19px}
.menu-toggle{width:48px;height:48px;padding:0!important;display:inline-flex!important;flex-direction:column;align-items:center;justify-content:center;gap:5px;border-radius:14px;line-height:1;background:rgba(15,15,15,.72);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}.hamburger-line{display:block;width:22px;height:2px;border-radius:999px;background:#f6f4ef;transition:transform .25s ease,opacity .2s ease}.menu-toggle.active .hamburger-line:nth-child(1){transform:translateY(7px) rotate(45deg)}.menu-toggle.active .hamburger-line:nth-child(2){opacity:0}.menu-toggle.active .hamburger-line:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
.hero .actions{perspective:950px;gap:16px}.hero .actions .btn{position:relative;overflow:hidden;border-radius:16px;padding:15px 24px;transform-style:preserve-3d;box-shadow:0 9px 0 rgba(0,0,0,.34),0 18px 34px rgba(0,0,0,.30),inset 0 1px rgba(255,255,255,.38);transition:transform .22s ease,box-shadow .22s ease,filter .22s ease}.hero .actions .btn:before{content:"";position:absolute;left:8px;right:8px;top:5px;height:42%;border-radius:12px;background:linear-gradient(180deg,rgba(255,255,255,.28),rgba(255,255,255,0));pointer-events:none}.hero .actions .btn:hover{transform:translateY(-7px) rotateX(4deg);box-shadow:0 14px 0 rgba(0,0,0,.32),0 28px 44px rgba(0,0,0,.40),inset 0 1px rgba(255,255,255,.45);filter:brightness(1.05)}.hero .actions .btn:active{transform:translateY(2px) scale(.985);box-shadow:0 3px 0 rgba(0,0,0,.32),0 8px 16px rgba(0,0,0,.25)}.hero .actions .btn.primary{background:linear-gradient(145deg,#fff,#dcdcdc);border-color:#fff;color:#111}.hero .actions .btn.gold{background:linear-gradient(145deg,#f1d083,#c79d4e);border-color:#edca77;color:#111}.hero .actions .btn:not(.primary):not(.gold){background:linear-gradient(145deg,rgba(30,30,30,.96),rgba(7,7,7,.98));border-color:rgba(255,255,255,.72);color:#fff;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
@media(max-width:800px){.brand span{font-size:.78rem;line-height:1.15;max-width:175px}.menu-toggle{width:46px;height:46px}.hero .actions{display:grid;grid-template-columns:1fr 1fr;gap:12px}.hero .actions .btn{text-align:center;padding:14px 12px;border-radius:14px;box-shadow:0 7px 0 rgba(0,0,0,.32),0 14px 24px rgba(0,0,0,.28)}.hero .actions .btn:hover{transform:none}.hero .actions .btn:active{transform:translateY(3px) scale(.98);box-shadow:0 3px 0 rgba(0,0,0,.30),0 7px 14px rgba(0,0,0,.22)}}
.mobile-contact-bar{display:none}@media(max-width:800px){body{padding-bottom:64px}.mobile-contact-bar{position:fixed;z-index:9999;left:0;right:0;bottom:0;display:grid;grid-template-columns:repeat(3,1fr);background:#0d0d0d;border-top:1px solid #3a3a3a;box-shadow:0 -8px 24px rgba(0,0,0,.35)}.mobile-contact-bar a{padding:15px 8px;text-align:center;color:#fff;text-decoration:none;font-weight:800;border-right:1px solid #333}.mobile-contact-bar a:last-child{border-right:0;background:#d9c277;color:#111}}
.cookie-consent{position:fixed;z-index:10050;left:18px;right:18px;bottom:18px;display:flex;align-items:center;justify-content:space-between;gap:24px;max-width:980px;margin:auto;padding:20px 22px;border:1px solid #575047;border-radius:18px;background:rgba(13,13,13,.98);color:#f7f5f0;box-shadow:0 24px 70px rgba(0,0,0,.65);font-family:Arial,sans-serif}.cookie-consent strong{display:block;font-size:1.05rem}.cookie-consent p{max-width:650px;margin:6px 0 0;color:#c9c5bd;font-size:.88rem;line-height:1.5}.cookie-consent a{color:#ead08d}.cookie-actions{display:flex;gap:10px;flex:0 0 auto}.cookie-actions button,.cookie-settings-button{border:1px solid #6a645b;border-radius:10px;background:#171717;color:#fff;padding:11px 14px;font:700 .82rem Arial,sans-serif;cursor:pointer}.cookie-actions .cookie-accept{background:#d9c277;border-color:#d9c277;color:#111}.cookie-settings-button{margin-top:8px;padding:8px 11px;color:#d8d3c9}.cookie-actions button:focus-visible,.cookie-settings-button:focus-visible{outline:3px solid #fff;outline-offset:2px}@media(max-width:720px){.cookie-consent{bottom:76px;display:block;padding:18px}.cookie-actions{display:grid;grid-template-columns:1fr;margin-top:14px}.cookie-actions button{min-height:46px}}
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

// Cinematic gallery experience
const galleryGrid=document.querySelector('.gallery-grid');
if(galleryGrid){
  document.body.classList.add('gallery-page');
  const gallerySection=galleryGrid.closest('.section');
  const galleryWrap=galleryGrid.closest('.wrap');
  gallerySection?.removeAttribute('style');
  gallerySection?.classList.add('gallery-collection');
  const galleryHeading=galleryWrap?.querySelector('h1');
  const galleryEyebrow=galleryWrap?.querySelector('.eyebrow');
  const galleryLede=galleryWrap?.querySelector('.lede');
  if(galleryHeading)galleryHeading.textContent='Stories from our table';
  if(galleryEyebrow)galleryEyebrow.textContent='Food · Family · Rosetta';
  if(galleryLede)galleryLede.textContent='Real dishes, warm hospitality and the moments that make 52 South feel like home.';

  const sourceImages=[...galleryGrid.querySelectorAll('img')];
  const categoryFor=img=>{
    const src=img.getAttribute('src')||'';
    if(/interior|exterior|dining-room|venue/i.test(src))return 'restaurant';
    if(/promo|special/i.test(src))return 'specials';
    return 'food';
  };
  const hero=document.createElement('section');
  hero.className='gallery-cinema';
  const featured=[sourceImages[0],sourceImages[4],sourceImages[15],sourceImages[31],sourceImages[16],sourceImages[32],sourceImages[27]].filter(Boolean);
  hero.innerHTML=`<div class="gallery-cinema-shade"></div><div class="gallery-cinema-copy"><span class="gallery-kicker">Authentic Sri Lankan flavours in Rosetta</span><img class="gallery-mark" src="assets/52-south-logo.png?v=${ASSET_VERSION}" alt="52 South"><h1><span>A taste of</span><span>Sri Lanka</span><span>Made in</span><span>Rosetta</span></h1><p>Come for the flavour. Stay for the welcome.</p><div class="gallery-hero-actions"><a class="btn gold" href="/book-a-table/">Book a Table</a><a class="btn gallery-ghost" href="/menu/">View Our Menu</a></div></div><div class="gallery-filmstrip" aria-label="Featured moments from 52 South"></div><a class="gallery-scroll-cue" href="#gallery-stories" aria-label="Explore the gallery"><span>Explore</span><i></i></a>`;
  const filmstrip=hero.querySelector('.gallery-filmstrip');
  featured.forEach((img,index)=>{const frame=document.createElement('div');frame.className='gallery-frame';const clone=img.cloneNode();clone.removeAttribute('loading');clone.classList.remove('reveal','in-view');clone.alt='';clone.setAttribute('aria-hidden','true');frame.appendChild(clone);if(index===Math.floor(featured.length/2)){const badge=document.createElement('span');badge.className='gallery-frame-badge';badge.textContent='52';frame.appendChild(badge);}filmstrip.appendChild(frame);});
  gallerySection?.insertAdjacentElement('beforebegin',hero);
  if(galleryWrap)galleryWrap.id='gallery-stories';

  const filters=document.createElement('div');
  filters.className='gallery-filters';
  filters.setAttribute('aria-label','Filter gallery');
  filters.innerHTML='<button class="active" type="button" data-filter="all">All moments</button><button type="button" data-filter="food">Food</button><button type="button" data-filter="restaurant">Our restaurant</button><button type="button" data-filter="specials">Specials</button>';
  galleryGrid.insertAdjacentElement('beforebegin',filters);

  const tiles=sourceImages.map((img,index)=>{
    const tile=document.createElement('button');
    tile.type='button';
    tile.className='gallery-tile';
    tile.dataset.category=categoryFor(img);
    tile.dataset.index=String(index);
    tile.setAttribute('aria-label',`Open image: ${img.alt}`);
    const caption=document.createElement('span');
    caption.textContent=img.alt.replace(/ at 52 South(?: in Rosetta)?/i,'');
    img.parentNode.insertBefore(tile,img);
    tile.append(img,caption);
    return tile;
  });

  filters.addEventListener('click',event=>{
    const button=event.target.closest('button[data-filter]');
    if(!button)return;
    filters.querySelectorAll('button').forEach(item=>item.classList.toggle('active',item===button));
    tiles.forEach(tile=>{tile.hidden=button.dataset.filter!=='all'&&tile.dataset.category!==button.dataset.filter;});
  });

  const lightbox=document.createElement('div');
  lightbox.className='gallery-lightbox';
  lightbox.setAttribute('role','dialog');
  lightbox.setAttribute('aria-modal','true');
  lightbox.setAttribute('aria-label','Gallery image viewer');
  lightbox.hidden=true;
  lightbox.innerHTML='<button class="gallery-lightbox-close" type="button" aria-label="Close image">×</button><button class="gallery-lightbox-nav prev" type="button" aria-label="Previous image">‹</button><figure><img alt=""><figcaption></figcaption></figure><button class="gallery-lightbox-nav next" type="button" aria-label="Next image">›</button>';
  document.body.appendChild(lightbox);
  let activeImage=0;
  const showImage=index=>{activeImage=(index+sourceImages.length)%sourceImages.length;const source=sourceImages[activeImage];const image=lightbox.querySelector('img');image.src=source.currentSrc||source.src;image.alt=source.alt;lightbox.querySelector('figcaption').textContent=source.alt;lightbox.hidden=false;document.body.classList.add('lightbox-open');};
  const closeLightbox=()=>{lightbox.hidden=true;document.body.classList.remove('lightbox-open');};
  tiles.forEach(tile=>tile.addEventListener('click',()=>showImage(Number(tile.dataset.index))));
  lightbox.querySelector('.prev').addEventListener('click',()=>showImage(activeImage-1));
  lightbox.querySelector('.next').addEventListener('click',()=>showImage(activeImage+1));
  lightbox.querySelector('.gallery-lightbox-close').addEventListener('click',closeLightbox);
  lightbox.addEventListener('click',event=>{if(event.target===lightbox)closeLightbox();});
  document.addEventListener('keydown',event=>{if(lightbox.hidden)return;if(event.key==='Escape')closeLightbox();if(event.key==='ArrowLeft')showImage(activeImage-1);if(event.key==='ArrowRight')showImage(activeImage+1);});
}
