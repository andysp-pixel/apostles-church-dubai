(() => {
  'use strict';
  const $=selector=>document.querySelector(selector);
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if(!reduced&&'IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-revealed');observer.unobserve(entry.target);}}),{threshold:0.08,rootMargin:'0px 0px -30px 0px'});
    document.querySelectorAll('[data-reveal]').forEach(el=>observer.observe(el));document.documentElement.classList.add('motion-ready');
  }
  if(window.ChurchSchedule){
    const updateNext=()=>{const el=$('#next-gathering');if(!el)return;const s=window.ChurchSchedule.earliest();const text=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Dubai',weekday:'long',day:'numeric',month:'short',hour:'numeric',minute:'2-digit',hour12:true}).format(s.start);el.textContent='Next gathering · '+text+' GST';};updateNext();setInterval(updateNext,60000);
    document.querySelectorAll('[data-add-calendar]').forEach(button=>button.addEventListener('click',()=>{const content=window.ChurchSchedule.calendar(button.dataset.addCalendar);if(!content)return;const blob=new Blob([content],{type:'text/calendar;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='apostles-'+button.dataset.addCalendar+'.ics';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}));
  }
  // Bible Gateway's official daily NIV JSONP response avoids CORS and requires no API key.
  if($('#daily-verse')){
    let request=null,lastLoad=0,timeout;
    const plain=value=>{const parser=new DOMParser();return parser.parseFromString(String(value||''),'text/html').body.textContent.trim();};
    const unavailable=()=>{if(!$('#daily-verse-text').dataset.loaded){$('#daily-verse-text').textContent='Today’s verse is temporarily unavailable. Please check back shortly.';$('#daily-verse-reference').textContent='';}};
    window.apostlesDailyVerse=payload=>{
      clearTimeout(timeout);const v=payload?.votd;if(!v||v.version_id!=='NIV'||!v.text||!v.reference){unavailable();return;}
      $('#daily-verse-text').textContent=plain(v.text);$('#daily-verse-text').dataset.loaded='true';$('#daily-verse-reference').textContent=plain(v.reference)+' · NIV';
      request?.remove();request=null;
    };
    const load=()=>{lastLoad=Date.now();request?.remove();request=document.createElement('script');request.src='https://www.biblegateway.com/votd/get/?format=json&version=NIV&callback=apostlesDailyVerse&_='+Math.floor(Date.now()/3600000);request.async=true;request.onerror=()=>{clearTimeout(timeout);unavailable();request?.remove();};document.head.append(request);timeout=setTimeout(unavailable,10000);};
    load();setInterval(load,3600000);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastLoad>1800000)load();});
  }
  // Only real recordings supplied by the church are added; no sample sermons.
  const results=$('#sermon-results');const recent=$('#recent-configured-sermons');
  const entries=Array.isArray(window.CHURCH_CONFIG?.sermons)?window.CHURCH_CONFIG.sermons:[];
  const valid=entries.filter(v=>v&&typeof v.title==='string'&&v.title.trim()&&/^[\w-]{11}$/.test(v.videoId)).slice().sort((a,b)=>(Date.parse(b.publishedAt)||0)-(Date.parse(a.publishedAt)||0));
  if(results){valid.forEach(v=>{const card=document.createElement('article');card.className='sermon-recording';card.dataset.recordingCategory=v.category==='worship'?'worship':'sermon';card.dataset.recordingTitle=v.title+' '+(v.speaker||'');const img=document.createElement('img');img.src='assets/gallery/worship-hall.jpg';img.alt='Photograph from our church worship gathering';img.loading='lazy';const art=document.createElement('a');art.className='recording-thumb';art.href='https://www.youtube.com/watch?v='+v.videoId;art.target='_blank';art.rel='noopener noreferrer';art.append(img);const category=document.createElement('p');category.className='recording-meta';category.textContent=card.dataset.recordingCategory.toUpperCase();const h=document.createElement('h3');const a=document.createElement('a');a.href=art.href;a.target='_blank';a.rel='noopener noreferrer';a.textContent=v.title+' ';h.append(a);const detail=document.createElement('p');detail.textContent=v.speaker||'Apostles Church of Christ Dubai';card.append(art,category,h,detail);results.append(card);});
    let filter='all';const apply=()=>{const term=($('#sermon-search')?.value||'').trim().toLowerCase();let count=0;results.querySelectorAll('[data-recording-category]').forEach(card=>{const match=(filter==='all'||card.dataset.recordingCategory===filter)&&card.dataset.recordingTitle.toLowerCase().includes(term);card.hidden=!match;if(match)count++;});$('#sermon-empty').hidden=count!==0;};document.querySelectorAll('[data-sermon-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.sermonFilter;document.querySelectorAll('[data-sermon-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));apply();}));$('#sermon-search')?.addEventListener('input',apply);apply();
  }
  if(recent){valid.filter(v=>v.category!=='worship').slice(0,2).forEach(v=>{const a=document.createElement('a');a.href='https://www.youtube.com/watch?v='+v.videoId;a.target='_blank';a.rel='noopener noreferrer';a.className='recent-added-sermon';a.textContent=v.title+' ';recent.append(a);});if(recent.children.length){recent.previousElementSibling.textContent='Explore the latest messages shared by our church.';}}
})();
