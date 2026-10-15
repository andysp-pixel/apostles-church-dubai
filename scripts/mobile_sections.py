"""Mobile-only content and responsive-image markup; keep desktop content intact."""
from html import escape
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parent.parent
PATHS={
 'book':'M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-2H4z M20 4h-4a3 3 0 0 0-3 3 M20 4v15h-4a4 4 0 0 0-3 2',
 'people':'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
 'cross':'M12 3v18 M5 9h14',
 'hands':'M3 14h4l3 3h5a2 2 0 0 0 0-4h-3l-3-3H6 M3 10v11h4l11-2 3-5a2 2 0 0 0-3-2l-2 3 M3 14v-4',
 'calendar':'M5 5h14v16H5z M8 3v4 M16 3v4 M5 10h14 M8 14h3 M8 17h6',
 'pin':'M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0 M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
 'phone':'M5 3h4l2 5-3 2a15 15 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A18 18 0 0 1 3 5a2 2 0 0 1 2-2',
 'mail':'M3 5h18v14H3z M3 5l9 8 9-8',
 'play':'M9 7l8 5-8 5z M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0'
}
def icon(name):
 return '<svg class="mobile-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+PATHS[name]+'"/></svg>'
def navigation(current):
 links=[('Home','index.html','Our Church'),('About Us','about.html','About'),('Our Beliefs','about.html#our-values',''),('Services','index.html#service-times',''),('Sermons','sermons.html','Sermons'),('Events','index.html#events',''),('Gallery','index.html#church-gallery',''),('Live Stream','live.html','Live'),('Get Involved','index.html#get-involved',''),('Contact','index.html#contact','')]
 items=''.join('<a class="mobile-menu-link'+(' is-current' if active==current else '')+'" href="'+url+'"'+(' aria-current="page"' if active==current else '')+'>'+label+'</a>' for label,url,active in links)
 return '<div class="mobile-nav-panel"><p class="mobile-menu-label">WELCOME HOME</p><div class="mobile-menu-links">'+items+'</div><a class="button mobile-nav-visit" href="visit.html"'+(' aria-current="page"' if current=='Visit Us' else '')+'>Plan Your Visit</a><p class="mobile-menu-note">A place to belong. A faith to live.</p></div>'
def quick_links():
 return '<section class="mobile-only mobile-shortcuts" aria-label="Explore our community"><div class="wrap">'+''.join('<a href="'+url+'"><span>'+icon(name)+'</span><strong>'+label+'</strong></a>' for name,label,url in [('book','Word','sermons.html'),('people','Community','about.html'),('hands','Service','#service-times')])+'</div></section>'
def values():
 return '<div class="mobile-only mobile-value-grid">'+''.join('<article><span>'+icon(name)+'</span><h3>'+title+'</h3><p>'+text+'</p></article>' for name,title,text in [('cross','Worship','Honouring Jesus together.'),('book','Discipleship','Growing through God’s Word.'),('people','Community','A place to belong.'),('hands','Impact','Sharing hope and His love.')])+'</div>'
def events():
 return '<section class="mobile-only mobile-events section" id="events"><div class="wrap"><p class="eyebrow">LIFE TOGETHER</p><h2>Coming up.</h2><p class="mobile-section-intro">There’s a place for you at our next gathering.</p><div id="mobile-upcoming-events" class="mobile-event-list"><a class="mobile-event-fallback" href="visit.html">See our weekly gatherings</a></div></div></section>'
def location():
 query='Bank+Melliran+Building+Al+Mankhool+Bur+Dubai'
 return '<section class="mobile-only mobile-location section" id="location"><div class="wrap"><p class="eyebrow">COME AS YOU ARE</p><h2>Our Location</h2><p class="mobile-location-name">Al Mankhool, Bur Dubai</p><p>Near Sharaf DG Metro Station.</p><div class="mobile-map" data-map-src="https://www.google.com/maps?q='+query+'&amp;output=embed"><button type="button" class="mobile-map-load">'+icon('pin')+'<span>Show our location on the map</span></button></div><a class="button" href="https://www.google.com/maps/search/?api=1&amp;query='+query+'" target="_blank" rel="noopener noreferrer">Get Directions</a></div></section>'
def contact():
 return '<section class="mobile-only mobile-contact section" id="contact"><div class="wrap"><p class="eyebrow">WE’D LOVE TO HEAR FROM YOU</p><h2>Let’s connect.</h2><div class="mobile-contact-cards"><a class="mobile-contact-email" href="https://www.facebook.com/apostlesdubai/" target="_blank" rel="noopener noreferrer">'+icon('mail')+'<span><strong>Email Us</strong><small>Request our email on Facebook</small></span></a><a class="mobile-contact-phone" href="tel:+971524373611">'+icon('phone')+'<span><strong>Call Us</strong><small>+971 52 437 3611</small></span></a><a href="visit.html">'+icon('pin')+'<span><strong>Visit Us</strong><small>Plan a gathering in Dubai</small></span></a></div><a class="button" href="https://www.facebook.com/apostlesdubai/" target="_blank" rel="noopener noreferrer">Send a Message</a><div class="mobile-involvement" id="get-involved"><h3>Take your next step.</h3><p>Join a gathering, reach out for prayer, or support the church.</p><div><a href="prayer.html">Request prayer</a><a href="donate.html">Explore giving</a></div></div></div></section>'
def decorate(html):
 html=html.replace('<h1 data-reveal>Find hope.<br>Grow in <span>faith.</span></h1>','<h1 data-reveal>Find hope.<br>Grow in <span>faith.</span></h1>')
 html=html.replace('A place to belong. A faith to live.<br>We’re a church for the nations, centred on Jesus.','A place to belong. A faith to live.<span class="desktop-copy"><br>We’re a church for the nations, centred on Jesus.</span>')
 html=html.replace('href="live.html">Church online</a>','href="live.html"><span class="desktop-copy">Church online</span><span class="mobile-copy">Watch Live</span></a>')
 html=html.replace('<h2 data-reveal>We’re glad<br>you’re here.</h2>','<h2 data-reveal><span class="desktop-copy">We’re glad<br>you’re here.</span><span class="mobile-copy">A Christ-centered community in Dubai</span></h2>')
 # Add a concise values grid within the existing welcome copy, without moving desktop sections.
 needle='<p class="lead" data-reveal>Many stories. One hope. A community growing together in Christ.</p>'
 if needle in html: html=html.replace(needle,needle+values())
 for day,title in [('Sunday','Sunday Service'),('Thursday','Thursday Fellowship'),('Saturday','Saturday Prayer')]:
  html=html.replace('<h3>'+day+'</h3>','<span class="mobile-only service-mobile-icon">'+icon('calendar' if day!='Saturday' else 'hands')+'</span><h3><span class="desktop-copy">'+day+'</span><span class="mobile-copy">'+title+'</span></h3>')
 html=html.replace('<h2>Quote of<br>the Day.</h2>','<h2><span class="desktop-copy">Quote of<br>the Day.</span><span class="mobile-copy">Verse of the day</span></h2>')
 html=html.replace('<h1>One church.<br><em>Wherever you are.</em></h1>','<h1><span class="desktop-copy">One church.<br><em>Wherever you are.</em></span><span class="mobile-copy">Worship with us from anywhere.</span></h1>')
 html=html.replace('<p class="eyebrow">CHURCH ONLINE</p>','<p class="eyebrow"><span class="desktop-copy">CHURCH ONLINE</span><span class="mobile-copy">LIVE · CHURCH ONLINE</span></p>')
 social='<div class="mobile-only mobile-live-links"><a href="https://www.youtube.com/@Apostleschurchofchristdubai/live" target="_blank" rel="noopener noreferrer">YouTube</a><a href="https://www.facebook.com/apostlesdubai/" target="_blank" rel="noopener noreferrer">Facebook</a><a class="mobile-restream" href="https://restream.io/" target="_blank" rel="noopener noreferrer" aria-label="Restream streaming platform">Restream</a></div>'
 html=html.replace('<div class="online-side">',social+'<div class="online-side">')
 html=html.replace('<p>YouTube connects only after you choose to play a YouTube video or open a YouTube link.', '<p>When the live API is activated, the Live page checks broadcast availability and can load a public YouTube player automatically, initially muted. Other YouTube players connect when you choose to play. The mobile location map connects to Google only after you select Show our location on the map.')
 html=html.replace('aria-label="Church photographs"','aria-label="Church photographs. Swipe left or right to explore."')
 html=html.replace('<span>Drag or swipe to explore</span>','<span>Drag or swipe to explore</span>')
 # The source set applies only to mobile. Desktop fallback image URLs remain unchanged.
 manifest=ROOT/'scripts/mobile_images.json'
 if manifest.exists():
  images=json.loads(manifest.read_text())['images']
  def picture(match):
   tag=match.group(0);src=re.search(r'\bsrc="([^"]+)"',tag)
   if not src or src.group(1) not in images or src.group(1)=='assets/intro-poster.jpg':return tag
   data=images[src.group(1)]; variants=data['variants']
   srcset=', '.join(escape(v['src'])+' '+str(v['width'])+'w' for v in variants)
   return '<picture class="responsive-photo"><source media="(max-width: 767px)" type="image/webp" srcset="'+srcset+'" sizes="calc(100vw - 36px)">'+tag+'</picture>'
  html=re.sub(r'<img\b[^>]*>',picture,html)
 return html
