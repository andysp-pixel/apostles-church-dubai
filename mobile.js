(() => {
  'use strict';
  const mobile=window.matchMedia('(max-width: 767px)');
  const nav=document.getElementById('navigation'), toggle=document.querySelector('.menu-toggle');
  function syncMenu(focus=false){
    if(!nav||!toggle)return;
    const open=mobile.matches&&toggle.getAttribute('aria-expanded')==='true';
    document.body.classList.toggle('mobile-menu-open',open);
    nav.inert=mobile.matches&&!open;
    if(open&&focus)nav.querySelector('.mobile-menu-link')?.focus({preventScroll:true});
  }
  toggle?.addEventListener('click',()=>syncMenu(true));
  nav?.addEventListener('click',event=>{if(event.target.closest('a'))syncMenu();});
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'){syncMenu();return;}
    if(event.key!=='Tab'||!mobile.matches||toggle?.getAttribute('aria-expanded')!=='true')return;
    const links=[toggle,...nav.querySelectorAll('.mobile-nav-panel a[href]')].filter(Boolean);
    if(!links.length)return;
    if(event.shiftKey&&document.activeElement===links[0]){event.preventDefault();links.at(-1).focus();}
    else if(!event.shiftKey&&document.activeElement===links.at(-1)){event.preventDefault();links[0].focus();}
  });
  const changed=()=>{nav?.classList.remove('open');toggle?.setAttribute('aria-expanded','false');toggle?.setAttribute('aria-label','Open menu');syncMenu();};
  if(mobile.addEventListener)mobile.addEventListener('change',changed);else mobile.addListener?.(changed);
  syncMenu();
  // Existing pageshow restoration should not leave the body locked after Back.
  window.addEventListener('pageshow',()=>syncMenu());
  const events=document.getElementById('mobile-upcoming-events');
  if(events&&window.ChurchSchedule){
    const names={sunday:'Sunday Service',thursday:'Thursday Fellowship',saturday:'Saturday Prayer'};
    const times={sunday:'8:00 PM – 11:00 PM',thursday:'8:00 PM – 11:00 PM',saturday:'3:00 AM – 6:00 AM'};
    function refreshEvents(){
      const weekly=Object.keys(names).map(key=>({title:names[key],date:window.ChurchSchedule.next(key).start,time:times[key],location:'Al Mankhool, Bur Dubai',href:'visit.html'}));
      const supplied=(Array.isArray(window.CHURCH_CONFIG?.upcomingEvents)?window.CHURCH_CONFIG.upcomingEvents:[]).filter(e=>e&&typeof e.title==='string'&&Date.parse(e.startsAt)>Date.now()).map(e=>({title:e.title,date:new Date(e.startsAt),time:new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Dubai',hour:'numeric',minute:'2-digit',hour12:true}).format(new Date(e.startsAt))+' GST',location:e.location||'Al Mankhool, Bur Dubai',href:'visit.html'}));
      events.replaceChildren();
      [...supplied,...weekly].sort((a,b)=>a.date-b.date).slice(0,3).forEach(item=>{
        const card=document.createElement('a');card.className='mobile-event-card';card.href=item.href;
        const date=document.createElement('time');date.dateTime=item.date.toISOString();
        const day=document.createElement('strong');day.textContent=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Dubai',day:'2-digit'}).format(item.date);
        const month=document.createElement('span');month.textContent=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Dubai',month:'short'}).format(item.date);date.append(day,month);
        const detail=document.createElement('div'),name=document.createElement('h3'),time=document.createElement('p'),place=document.createElement('p');
        name.textContent=item.title;time.textContent=item.time;place.textContent=item.location;detail.append(name,time,place);card.append(date,detail);events.append(card);
      });
    }
    refreshEvents();setInterval(refreshEvents,60000);
  }
  // Maps are requested by the visitor; a hidden desktop section makes no request.
  document.querySelectorAll('[data-map-src]').forEach(box=>box.querySelector('button')?.addEventListener('click',()=>{
    if(!mobile.matches)return;
    const url=new URL(box.dataset.mapSrc);if(url.protocol!=='https:'||url.hostname!=='www.google.com')return;
    const frame=document.createElement('iframe');frame.src=url.href;frame.title='Map search for our church in Al Mankhool, Bur Dubai';frame.width='640';frame.height='300';frame.loading='lazy';frame.referrerPolicy='strict-origin-when-cross-origin';box.replaceChildren(frame);
  }));
  const email=window.CHURCH_CONFIG?.contactEmail;
  if(typeof email==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))document.querySelectorAll('.mobile-contact-email').forEach(link=>{link.href='mailto:'+email;link.removeAttribute('target');link.querySelector('small').textContent=email;});
  const restream=window.CHURCH_CONFIG?.restreamWatchUrl;
  if(typeof restream==='string'){try{const url=new URL(restream);if(url.protocol==='https:')document.querySelectorAll('.mobile-restream').forEach(link=>{link.href=url.href;link.setAttribute('aria-label','Watch our church through Restream');});}catch{}}
  if(mobile.matches){
    // No decorative background-video downloads on phones.
    document.getElementById('brand-loop')?.pause();
  }
})();
