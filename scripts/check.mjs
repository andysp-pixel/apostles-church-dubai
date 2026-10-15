import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'), dist=fs.existsSync(path.join(root,'dist'))?path.join(root,'dist'):root;
const assert=(ok,text)=>{if(!ok)throw new Error(text);};
const pages=['index.html','live.html','sermons.html','prayer.html','donate.html','about.html','visit.html'];
for(const name of ['app.js','config.js','live-status.js','welcome.js','schedule.js','church.js','gallery.js','mobile.js'])execFileSync(process.execPath,['--check',path.join(dist,name)]);
const contents=new Map(pages.map(p=>[p,fs.readFileSync(path.join(dist,p),'utf8')]));
for(const [file,html] of contents){
 assert(/^<!doctype html>/i.test(html),'Missing HTML5 doctype in '+file);
 assert((html.match(/<main\b/g)||[]).length===1,'Expected one main in '+file);
 assert((html.match(/<h1\b/g)||[]).length===1,'Expected one h1 in '+file);
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert(ids.length===new Set(ids).size,'Duplicate ids in '+file);
 for(const m of html.matchAll(/(?:src|href|data-src|poster)="([^"]+)"/g)){
  const ref=m[1];if(ref.startsWith('tel:')){assert(/^tel:\+?[0-9]+$/.test(ref),'Invalid call link');continue;}if(ref.startsWith('mailto:'))continue;if(/^(https?:|data:)/.test(ref)){if(ref.startsWith('http'))assert(new URL(ref).protocol==='https:','Insecure link');continue;}
  const [queryTarget,anchor]=ref.split('#');const target=queryTarget.split('?')[0];const asset=target||file;
  assert(fs.existsSync(path.join(dist,asset)),'Missing local target '+ref+' in '+file);
  if(anchor){const targetHtml=contents.get(asset)||fs.readFileSync(path.join(dist,asset),'utf8');assert(targetHtml.includes('id="'+anchor+'"'),'Missing anchor '+ref+' in '+file);}
 }
 const nav=html.match(/<nav id="navigation"[\s\S]*?<\/nav>/)?.[0];
 assert(nav,'Missing primary nav in '+file);
 for(const target of pages.filter(p=>p!=='visit.html'))assert(nav.includes('href="'+target+'"'),'Missing page link in '+file);
 const header=html.match(/<header\b[\s\S]*?<\/header>/)[0];
 const desktopHeader=header.replace(/<div class="mobile-nav-panel">[\s\S]*?<\/nav>/,'</nav>');
 assert((desktopHeader.match(/aria-current="page"/g)||[]).length===1,'Missing desktop active page in '+file);
 const mobileNav=header.match(/<div class="mobile-nav-panel">[\s\S]*?<\/nav>/)?.[0];
 const mobileCurrent=(mobileNav?.match(/aria-current="page"/g)||[]).length;
 assert(mobileNav&&mobileCurrent===(['prayer.html','donate.html'].includes(file)?0:1),'Invalid mobile active page in '+file);
 assert(header.includes('href="visit.html"'),'Visit button missing');
 assert(html.includes('<address>'),'Missing footer address in '+file);
 const count=(html.match(/Bank Melliran Building/g)||[]).length;assert(count===(file==='visit.html'?2:1),'Repeated address in '+file);
 assert(nav.split('<div class="mobile-nav-panel">')[0].includes('>Our Church</a>'),'Desktop Home label must be Our Church');
 assert(nav.includes('>Home</a>'),'Mobile Home link missing');
 assert(html.includes('id="welcome-intro"')&&html.includes('id="welcome-skip"'),'Welcome controls missing');
 assert(html.includes('Welcome to<br><em>Our Church</em>'),'Welcome wording mismatch');
 assert(html.includes('footer-column'),'Missing detailed footer in '+file);
 assert(!/[↗↑↓→←✦♡⌖⧉]/.test(html),'Decorative arrow or symbol in '+file);
 assert(html.includes('assets/flag-uae.svg')&&html.includes('assets/flag-burundi.svg'),'Footer flags missing in '+file);
 assert(html.includes('https://www.instagram.com/apostles_church_of_christ/'),'Instagram missing in '+file);
 for(const m of html.matchAll(/aria-(?:controls|labelledby)="([^"]+)"/g))for(const id of m[1].split(' '))assert(ids.includes(id),'Missing ARIA target '+id+' in '+file);
 assert(!/\b(LIVE NOW|Every Sunday|1000 members)\b/.test(html),'Unverified claim in '+file);
}
const home=contents.get('index.html');const sections=[...home.matchAll(/<section\b[^>]*\bid="([^"]+)"/g)].map(m=>m[1]);assert(sections[0]==='home'&&sections[1]==='service-times','Weekly gatherings must follow the home hero');
assert(!home.includes('id="player-area"'),'Full player belongs on Live');
const liveMain=contents.get('live.html').match(/<main[^>]*>([\s\S]*?)<\/main>/)[1];assert((liveMain.match(/<section\b/g)||[]).length===1&&liveMain.includes('id="live"'),'Live page must contain only its live section');
assert(contents.get('prayer.html').includes('id="prayer-form"'),'Prayer form missing');
const donate=contents.get('donate.html');
const accounts=JSON.parse(fs.readFileSync(path.join(root,'scripts/donation_accounts.json'),'utf8'));
for(const key of ['iban','accountNumber','paypalBotimPhone','westernUnionPhone'])assert(donate.includes('data-copy="'+accounts[key]+'"'),'Wrong copied giving detail: '+key);
for(const key of ['bankBeneficiary','paypalBotimBeneficiary','westernUnionBeneficiary'])assert(donate.includes(accounts[key]),'Missing exact beneficiary '+key);
const iban=accounts.iban;assert(/^AE\d{21}$/.test(iban),'Invalid IBAN length');const numeric=(iban.slice(4)+iban.slice(0,4)).replace(/[A-Z]/g,c=>String(c.charCodeAt(0)-55));assert(BigInt(numeric)%97n===1n,'IBAN transcription checksum mismatch');
const css=fs.readFileSync(path.join(dist,'styles.css'),'utf8');assert(css.includes('@keyframes logo-turn')&&css.includes('65s linear infinite'),'Rotating logo missing');assert(css.includes('prefers-reduced-motion'),'Motion preference missing');assert((css.match(/{/g)||[]).length===(css.match(/}/g)||[]).length,'CSS brace mismatch');
for(const m of fs.readFileSync(path.join(dist,'assets/fonts.css'),'utf8').matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g))assert(fs.existsSync(path.join(dist,'assets',m[1])),'Missing local font');
const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(dist,'config.js'),'utf8'),context);const config=context.window.CHURCH_CONFIG;
assert(Array.isArray(config.upcomingEvents),'Events must be an array');
for(const key of ['videoHlsUrl','audioStreamUrl','liveStatusUrl','donationUrl','restreamWatchUrl'])if(config[key])assert(new URL(config[key]).protocol==='https:','Public URL must use HTTPS');
for(const e of config.upcomingEvents)assert(typeof e.title==='string'&&/\+04:00$/.test(e.startsAt)&&Number.isFinite(Date.parse(e.startsAt)),'Invalid future event');
assert(fs.statSync(path.join(dist,'assets/intro.mp4')).size>10000,'Intro missing');
const scheduleContext={window:{}};vm.runInNewContext(fs.readFileSync(path.join(dist,'schedule.js'),'utf8'),scheduleContext);const schedule=scheduleContext.window.ChurchSchedule;
assert(schedule.next('saturday',new Date('2026-10-16T22:59:00Z')).start.toISOString()==='2026-10-16T23:00:00.000Z','Saturday 3 AM Dubai must fall on Friday 23:00 UTC');
assert(schedule.next('saturday',new Date('2026-10-16T23:01:00Z')).start.toISOString()==='2026-10-23T23:00:00.000Z','Past start must advance one week');
assert(schedule.next('sunday',new Date('2026-10-18T15:59:00Z')).start.toISOString()==='2026-10-18T16:00:00.000Z','Sunday 8 PM Dubai conversion');
assert(schedule.next('thursday',new Date('2026-10-15T16:01:00Z')).start.toISOString()==='2026-10-22T16:00:00.000Z','Thursday recurrence boundary');
assert(schedule.next('saturday',new Date('2026-12-31T00:00:00Z')).start.toISOString()==='2027-01-01T23:00:00.000Z','Year boundary');
const ics=schedule.calendar('saturday',new Date('2026-10-16T22:59:00Z'));
for(const line of ['DTSTART;TZID=Asia/Dubai:20261017T030000','DTEND;TZID=Asia/Dubai:20261017T060000','RRULE:FREQ=WEEKLY;BYDAY=SA','Hall 601\\, 6th Floor'])assert(ics.includes(line),'Invalid calendar: '+line);
assert(ics.includes('\r\n'),'Calendar CRLF required');
assert(Array.isArray(config.sermons),'Sermons configuration required');
for(const p of ['index.html','prayer.html']){const html=contents.get(p);assert(html.includes('id="daily-verse"')&&html.includes('Powered by BibleGateway.com')&&html.includes('Biblica'),'Daily verse attribution missing');}
assert(fs.readFileSync(path.join(dist,'_headers'),'utf8').includes('script-src \'self\' https://www.biblegateway.com'),'Daily verse blocked by CSP');
assert(contents.get('sermons.html').includes('id="sermon-search"')&&contents.get('sermons.html').includes('data-sermon-filter="sermon"'),'Sermon browsing missing');
const about=contents.get('about.html');
for(const label of ['Our Values','Our Vision','Our Mission'])assert(about.includes(label),'About pillar missing: '+label);
assert(about.includes('Turn back the hearts of the fathers to the children')&&about.includes('Luke 1:17')&&about.includes('Amplified Bible, Classic Edition'),'Supplied Vision verse missing/mislabelled');
for(const p of ['index.html','about.html']){const html=contents.get(p);assert(html.includes('data-gallery')&&html.includes('data-gallery-pause')&&html.includes('gallery.js'),'Gallery controls missing in '+p);}
const gallery=JSON.parse(fs.readFileSync(path.join(root,'scripts/gallery.json'),'utf8'));
assert(gallery.length>0,'Gallery has no supplied media');
for(const item of gallery){
 assert(fs.existsSync(path.join(dist,item.src)),'Missing gallery media');
 assert(item.src.startsWith('assets/gallery/'),'Old portrait, announcement or decorative artwork must not appear in the new gallery');
 assert(createHash('sha256').update(fs.readFileSync(path.join(dist,item.src))).digest('hex')===item.sha256,'Gallery photograph changed from supplied original');
}
console.log('PASS: seven HTML5 pages, links/assets/ARIA, navigation, Live-only player, exact giving details, welcome, address placement, fonts, motion, JS syntax, Dubai time boundaries and recurring calendars, NIV attribution/CSP, sermon browsing configuration.');
console.log('PASS: Luke 1:17 Vision, About pillars, Instagram, two footer flags, removed decorative glyphs, supplied gallery media and controls.');

execFileSync(process.execPath,[path.join(root,'scripts/check-gallery.mjs')],{stdio:'inherit'});
