(() => {
  'use strict';
  const config = window.CHURCH_CONFIG || {};
  const $ = (selector) => document.querySelector(selector);
  const safeHttps = value => { try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; } };
  const youtube = safeHttps(config.youtubeChannel) || 'https://www.youtube.com/@Apostleschurchofchristdubai';
  const facebook = safeHttps(config.facebookPage) || 'https://www.facebook.com/apostlesdubai/';
  const broadcastId = typeof config.youtubeBroadcastId==='string'&&/^[\w-]{11}$/.test(config.youtubeBroadcastId)?config.youtubeBroadcastId:'';
  let toastTimer;
  function notify(message) { const el=$('#toast'); if(!el)return; el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),4000); }
  async function copyText(text, success) { try { await navigator.clipboard.writeText(text); notify(success); return true; } catch { notify('Select the text and copy it manually.'); return false; } }
  if($('#year'))$('#year').textContent=new Date().getFullYear();
  const menu=$('.menu-toggle');
  function closeMenu() { $('#navigation').classList.remove('open'); menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open menu'); }
  menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close menu':'Open menu');$('#navigation').classList.toggle('open',open);});
  $('#navigation')?.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu?.getAttribute('aria-expanded')==='true'){closeMenu();menu.focus();}});
  function openDialog(dialog){if(typeof dialog.showModal==='function'){dialog.showModal();}else{dialog.setAttribute('open','');dialog.classList.add('dialog-fallback');document.body.classList.add('fallback-modal-open');dialog.querySelector('.close-dialog')?.focus();}}
  function closeDialog(dialog){if(typeof dialog.close==='function'){dialog.close();}else{dialog.removeAttribute('open');dialog.classList.remove('dialog-fallback');document.body.classList.remove('fallback-modal-open');dialog.dispatchEvent(new Event('close'));}}
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){const fallback=document.querySelector('dialog.dialog-fallback[open]');if(fallback){event.preventDefault();closeDialog(fallback);}}});
  document.querySelectorAll('.close-dialog').forEach(button=>button.addEventListener('click',()=>closeDialog(button.closest('dialog'))));
  document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDialog(dialog);}}));
  $('#privacy-open')?.addEventListener('click',()=>openDialog($('#privacy-dialog')));
  let opener=null;
  document.querySelectorAll('[data-video]').forEach(button=>button.addEventListener('click',()=>{stopLiveMedia();restorePoster();opener=button;const id=button.dataset.video;if(!/^[\w-]{11}$/.test(id))return;const iframe=document.createElement('iframe');iframe.src='https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&rel=0';iframe.title='Ministry of the Apostles — Worship Vibe';iframe.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';iframe.referrerPolicy='strict-origin-when-cross-origin';iframe.allowFullscreen=true;$('#dialog-player').replaceChildren(iframe);openDialog($('#video-dialog'));}));
  $('#video-dialog')?.addEventListener('close',()=>{$('#dialog-player').replaceChildren();opener?.focus();});
  $('#copy-address')?.addEventListener('click',()=>copyText('Hall 601, 6th Floor, Bank Melliran Building, Al Mankhool, Bur Dubai, Dubai, UAE — near Sharaf DG Metro Station','Church address copied.'));
  // Actual intro animation + a slowly revolving logo in the section background.
  const brandVideo=$('#brand-loop');
  const pauseButton=$('#pause-brand');
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let animationPaused=reducedMotion.matches;
  let brandInView=false;
  function updateBrandAnimation() { if(!brandVideo)return; const paused=animationPaused||reducedMotion.matches; brandVideo.closest('.identity-section').classList.toggle('identity-paused',paused);pauseButton.textContent=paused?'Play animation ▷':'Pause animation Ⅱ';pauseButton.setAttribute('aria-label',paused?'Play logo animation':'Pause logo animation');if(paused||!brandInView){brandVideo.pause();}else{if(!brandVideo.getAttribute('src')){brandVideo.src=brandVideo.dataset.src;brandVideo.load();}brandVideo.play().catch(()=>{animationPaused=true;brandVideo.closest('.identity-section').classList.add('identity-paused');pauseButton.textContent='Play animation ▷';pauseButton.setAttribute('aria-label','Play logo animation');});} }
  if(brandVideo){if(reducedMotion.matches){brandVideo.autoplay=false;brandVideo.pause();}if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{brandInView=entries[0].isIntersecting;updateBrandAnimation();},{threshold:0.1});observer.observe(brandVideo);}else{brandInView=true;updateBrandAnimation();}pauseButton.addEventListener('click',()=>{animationPaused=!animationPaused;updateBrandAnimation();});const onMotionChange=()=>{animationPaused=reducedMotion.matches;updateBrandAnimation();};if(typeof reducedMotion.addEventListener==='function'){reducedMotion.addEventListener('change',onMotionChange);}else{reducedMotion.addListener?.(onMotionChange);}}
  // Shared video/audio player on Home and Live.
  let hls=null;
  let generation=0;
  let youtubeLive=null;
  let autoLive=true;
  const area=$('#player-area');
  function showYouTubeBroadcast(){
    if(!area||!['live','selected'].includes(youtubeLive?.state))return;
    const confirmedLive=youtubeLive.state==='live';setStatus(confirmedLive?'Live now':'Church broadcast',confirmedLive);
    $('#player-notice').textContent=confirmedLive?'The church is live. Use the player controls to turn on sound.':'Use the player controls to turn on sound. If the video cannot play here, select Watch on YouTube.';
    const existing=area.querySelector('iframe[data-live-id]');
    if(existing?.dataset.liveId===youtubeLive.videoId)return;
    stopLiveMedia();area.replaceChildren();
    const iframe=document.createElement('iframe');
    iframe.src='https://www.youtube-nocookie.com/embed/'+youtubeLive.videoId+'?autoplay=1&mute=1&playsinline=1&rel=0';
    iframe.title=youtubeLive.title||'Church live broadcast';iframe.dataset.liveId=youtubeLive.videoId;
    iframe.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.allowFullscreen=true;iframe.referrerPolicy='strict-origin-when-cross-origin';
    area.append(iframe);
  }
  function stopLiveMedia() { generation++;if(hls){hls.destroy();hls=null;}const video=area?.querySelector('video');if(video){video.pause();video.removeAttribute('src');video.load();}area?.querySelector('iframe')?.remove();const audio=$('#live-audio');if(audio){audio.pause();audio.removeAttribute('src');audio.load();audio.hidden=true;} }
  function setStatus(text,playing=false){if(!area)return;$('#broadcast-status').textContent=text;$('.status-dot').classList.toggle('available',playing);}
  function restorePoster(){if(!area)return;area.replaceChildren();const img=document.createElement('img');img.src='assets/intro-poster.jpg';img.alt='Apostles Church of Christ';area.append(img);if($('#watch-tab').getAttribute('aria-selected')==='true'){const button=document.createElement('button');button.className='intro-play';button.id='intro-play';button.setAttribute('aria-label','Play the church introduction');button.innerHTML='<span aria-hidden="true">▶</span><small>MEET OUR CHURCH</small>';button.addEventListener('click',playIntro);area.append(button);}setStatus('Church online');}
  function playIntro(){if(!area)return;autoLive=false;stopLiveMedia();const current=generation;area.replaceChildren();const video=document.createElement('video');video.controls=true;video.playsInline=true;video.src='assets/intro.mp4';video.poster='assets/intro-poster.jpg';video.setAttribute('aria-label','Church introduction');area.append(video);$('#player-notice').textContent='Apostles Church of Christ — our church introduction.';video.play().catch(()=>{if(current===generation)notify('Press play to watch the introduction.');});}
  function attachStream(media,url,current,onError){const start=()=>{if(current!==generation)return;media.play().catch(()=>{if(current===generation)notify('Press play in the player to start.');});};media.addEventListener('error',()=>{if(current===generation)onError();},{once:true});if(!/\.m3u8(?:\?|$)/i.test(url)||media.canPlayType('application/vnd.apple.mpegurl')){media.src=url;start();}else if(window.Hls?.isSupported()){hls=new window.Hls();hls.loadSource(url);hls.attachMedia(media);hls.on(window.Hls.Events.MANIFEST_PARSED,start);hls.on(window.Hls.Events.ERROR,(_event,data)=>{if(data.fatal&&current===generation){onError();hls?.destroy();hls=null;}});}else{onError();}}
  if(area){
    const clock=()=>{$('#dubai-time').textContent=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Dubai',hour:'2-digit',minute:'2-digit'}).format(new Date())+' GST';};clock();setInterval(clock,60000);
    const videoUrl=safeHttps(config.videoHlsUrl);const audioUrl=safeHttps(config.audioStreamUrl);
    $('#intro-play').addEventListener('click',playIntro);
    if(videoUrl)$('#watch-live').innerHTML='Watch broadcast <span>▷</span>';
    $('#watch-live').addEventListener('click',()=>{autoLive=true;if(youtubeLive?.state==='live'){showYouTubeBroadcast();return;}if(youtubeLive?.state==='external'){window.open('https://www.youtube.com/watch?v='+youtubeLive.videoId,'_blank','noopener,noreferrer');return;}if(!videoUrl){window.open(broadcastId?'https://www.youtube.com/watch?v='+broadcastId:youtube+'/live','_blank','noopener,noreferrer');return;}stopLiveMedia();const current=generation;area.replaceChildren();const video=document.createElement('video');video.controls=true;video.playsInline=true;video.setAttribute('aria-label','Church video broadcast');area.append(video);$('#player-notice').textContent='Connecting to the broadcast…';video.addEventListener('playing',()=>{if(current!==generation)return;$('#player-notice').textContent='You are watching the church broadcast.';setStatus('Broadcast playing',true);});attachStream(video,videoUrl,current,()=>{$('#player-notice').textContent='The broadcast is unavailable right now. Please try again later or visit our YouTube channel.';setStatus('Broadcast unavailable');});});
    const tabs=[$('#watch-tab'),$('#listen-tab')];
    function selectTab(index){stopLiveMedia();tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;});restorePoster();$('#watch-panel').hidden=index!==0;$('#listen-panel').hidden=index!==1;$('#player-notice').textContent=index===1?'Audio mode selected. Video playback has stopped.':'Explore our church introduction, or visit our YouTube channel for broadcasts.';if(index===1&&audioUrl)$('#audio-description').textContent='Listen to our audio broadcast without downloading video. Press play to begin.';autoLive=index===0;if(index===0&&['live','selected'].includes(youtubeLive?.state))showYouTubeBroadcast();}
    tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>selectTab(i));tab.addEventListener('keydown',event=>{let next=null;if(['ArrowRight','ArrowLeft'].includes(event.key))next=1-i;if(event.key==='Home')next=0;if(event.key==='End')next=1;if(next!==null){event.preventDefault();selectTab(next);tabs[next].focus();}});});
    if(audioUrl){$('#audio-description').textContent='Listen to our audio broadcast without downloading video. Press play to begin.';$('#audio-start').hidden=false;}
    $('#audio-start').addEventListener('click',()=>{stopLiveMedia();restorePoster();const current=generation;const audio=$('#live-audio');audio.hidden=false;$('#audio-description').textContent='Connecting to the audio broadcast…';audio.addEventListener('playing',()=>{if(current!==generation)return;$('#audio-description').textContent='You are listening to the church audio broadcast.';setStatus('Audio playing',true);$('#player-notice').textContent='Audio only — no video is being downloaded.';},{once:true});attachStream(audio,audioUrl,current,()=>{$('#audio-description').textContent='The audio broadcast is unavailable right now. Please try again later.';$('#player-notice').textContent='Audio unavailable. Visit YouTube for other recordings.';setStatus('Audio unavailable');});});

    // A selected broadcast is not evidence that the church is currently live.
    if(broadcastId){youtubeLive={state:'selected',videoId:broadcastId,title:'Apostles Church of Christ Dubai — broadcast'};showYouTubeBroadcast();}

    // Status is read by a separate Worker; no credential is sent to visitors.
    const liveStatusUrl=safeHttps(config.liveStatusUrl);
    if(liveStatusUrl&&window.ChurchLiveStatus){
      const monitor=window.ChurchLiveStatus.monitor({url:liveStatusUrl,onStatus(data){
        youtubeLive=data;
        $('#watch-live').textContent=data.state==='live'?'Watch live':data.state==='external'?'Watch live on YouTube':'Watch on YouTube';
        if($('#watch-tab').getAttribute('aria-selected')!=='true'||!autoLive)return;
        if(data.state==='live'){
          if(!$('#video-dialog')?.open)showYouTubeBroadcast();
        }else{
          if(area.querySelector('iframe[data-live-id]')){stopLiveMedia();restorePoster();}
          setStatus(data.state==='external'?'Live on YouTube':'No live broadcast right now',data.state==='external');
          $('#player-notice').textContent=data.state==='external'?'The church is live on YouTube. Select Watch live on YouTube to join.':'Join us for our next gathering, or explore our YouTube recordings.';
        }
      },onError(){
        if($('#watch-tab').getAttribute('aria-selected')!=='true'||!autoLive)return;
        setStatus('Broadcast status unavailable');
        $('#player-notice').textContent='We could not check the broadcast right now. You can still visit our YouTube channel.';
      }});
      monitor.start();document.addEventListener('visibilitychange',()=>{if(!document.hidden)monitor.start();});
      window.addEventListener('pagehide',()=>monitor.stop(),{once:true});
    }
  }
  // Prayer draft: no network submission, storage or automatic messaging.
  const prayerForm=$('#prayer-form');
  if(prayerForm){const message=$('#prayer-message');$('#prayer-name').addEventListener('input',()=>$('#prayer-preview').hidden=true);$('#prayer-topic').addEventListener('change',()=>$('#prayer-preview').hidden=true);message.addEventListener('input',()=>{$('#prayer-count').textContent=message.value.length+' / 2000';$('#prayer-preview').hidden=true;});prayerForm.addEventListener('submit',event=>{event.preventDefault();const request=message.value.trim();if(!request){message.setCustomValidity('Please write your prayer request.');message.reportValidity();message.addEventListener('input',()=>message.setCustomValidity(''),{once:true});return;}const name=$('#prayer-name').value.trim();const topic=$('#prayer-topic').value;const text='Prayer request'+(name?' from '+name:'')+'\nFocus: '+topic+'\n\n'+request;$('#prayer-draft').textContent=text;$('#prayer-preview').hidden=false;$('#prayer-preview').scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth',block:'center'});notify('Your draft is ready. Nothing has been sent.');});$('#copy-prayer').addEventListener('click',()=>copyText($('#prayer-draft').textContent,'Prayer request copied. Paste it into a message to the church.'));$('#prayer-send').href=facebook;}
  document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',()=>copyText(button.dataset.copy,(button.dataset.copyLabel||'Details')+' copied.')));
  // Optional confirmed public checkout URL.
  const checkout=$('#giving-checkout');
  if(checkout){const url=safeHttps(config.donationUrl);if(url){checkout.href=url;$('#giving-ready').hidden=false;}$('#giving-contact').href=facebook;}
  if(typeof config.contactEmail==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.contactEmail)){document.querySelectorAll('.configured-email').forEach(a=>{a.textContent=config.contactEmail;a.href='mailto:'+config.contactEmail;a.hidden=false;});}
  if(typeof config.contactPhone==='string'&&/^\+?[0-9\s()-]{7,22}$/.test(config.contactPhone)){document.querySelectorAll('.configured-phone').forEach(a=>{a.textContent=config.contactPhone;a.href='tel:'+config.contactPhone.replace(/[^+\d]/g,'');a.hidden=false;});}
  const events=Array.isArray(config.upcomingEvents)?config.upcomingEvents:[];
  if($('#upcoming-events'))events.filter(e=>e&&typeof e.title==='string'&&Number.isFinite(Date.parse(e.startsAt))&&Date.parse(e.startsAt)>Date.now()).sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt)).forEach(e=>{const article=document.createElement('article');article.className='upcoming-item';const h=document.createElement('h3');h.textContent=e.title;const p=document.createElement('p');p.textContent=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Dubai',dateStyle:'full',timeStyle:'short'}).format(new Date(e.startsAt))+' GST · '+(e.location||'Hall 601');article.append(h,p);$('#upcoming-events').append(article);});
  const schema={'@context':'https://schema.org','@type':'Church',name:'Apostles Church of Christ Dubai',image:new URL('assets/logo.png',location.href).href,address:{'@type':'PostalAddress',streetAddress:'Hall 601, 6th Floor, Bank Melliran Building, Al Mankhool',addressLocality:'Dubai',addressCountry:'AE'},sameAs:[youtube,facebook,'https://www.instagram.com/apostles_church_of_christ/']};const metadata=document.createElement('script');metadata.type='application/ld+json';metadata.textContent=JSON.stringify(schema);document.head.append(metadata);
})();
