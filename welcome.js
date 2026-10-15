(() => {
  'use strict';
  const overlay=document.getElementById('welcome-intro');
  if(!overlay)return;
  const key='apostles-welcome-seen';
  let seen=false;
  try{seen=sessionStorage.getItem(key)==='1';}catch{try{seen=!!document.referrer&&new URL(document.referrer).origin===location.origin;}catch{}}
  if(seen)return;
  try{sessionStorage.setItem(key,'1');}catch{}
  const reduced=typeof window.matchMedia==='function'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const skip=document.getElementById('welcome-skip');
  const previousFocus=document.activeElement;
  const background=[...document.body.children].filter(el=>el!==overlay&&!['SCRIPT','STYLE'].includes(el.tagName));
  const previousInert=background.map(el=>el.hasAttribute('inert'));
  let done=false,timer;
  overlay.hidden=false;
  overlay.classList.toggle('welcome-no-motion',reduced);
  document.body.classList.add('welcome-running');
  background.forEach(el=>el.setAttribute('inert',''));
  skip.focus({preventScroll:true});
  function finish(){
    if(done)return;done=true;clearTimeout(timer);
    overlay.classList.add('welcome-leaving');
    setTimeout(()=>{
      overlay.hidden=true;
      document.body.classList.remove('welcome-running');
      background.forEach((el,i)=>{if(!previousInert[i])el.removeAttribute('inert');});
      document.removeEventListener('keydown',onKey);
      if(previousFocus&&previousFocus!==document.body){previousFocus.focus({preventScroll:true});}
      else{const main=document.getElementById('main');main?.setAttribute('tabindex','-1');main?.focus({preventScroll:true});}
    },reduced?0:320);
  }
  function onKey(event){if(event.key==='Escape'){event.preventDefault();finish();}else if(event.key==='Tab'){event.preventDefault();skip.focus({preventScroll:true});}}
  skip.addEventListener('click',finish);
  document.addEventListener('keydown',onKey);
  timer=setTimeout(finish,reduced?650:(window.matchMedia('(max-width: 767px)').matches?900:2200));
  window.addEventListener('pageshow',event=>{if(event.persisted)finish();},{once:true});
})();
