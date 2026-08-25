const btn=document.querySelector('.menu-toggle');
const nav=document.querySelector('.navlinks');
if(btn){btn.addEventListener('click',()=>nav.classList.toggle('open'));}
document.querySelectorAll('.navlinks a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));
