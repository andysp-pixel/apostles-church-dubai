import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),dist=fs.existsSync(path.join(root,'dist'))?path.join(root,'dist'):root;
const read=name=>fs.readFileSync(path.join(dist,name),'utf8');
const widths=[320,360,375,390,412,430];
// This hash belongs to the desktop stylesheet before the mobile work.
assert.equal(createHash('sha256').update(read('styles.css')).digest('hex'),'06e8dcdde5431272af37c82f552ee683e6ec3b277bb63d151a3856f8b7ea58ed','Desktop stylesheet changed');
const css=read('mobile.css');
assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length);
assert.equal(css.slice(0,css.indexOf('@media')).replace(/\/\*[\s\S]*?\*\//g,'').replace(/\s/g,''),'.mobile-only,.mobile-copy,.mobile-nav-panel{display:none}.responsive-photo{display:contents}','Unexpected global layout change');
for(const token of ['safe-area-inset-top','safe-area-inset-bottom','minmax(0,1fr)','aspect-ratio:16/9','scroll-snap-type:x mandatory','font-size:16px','prefers-reduced-motion'])assert.ok(css.includes(token),token);
assert.ok(css.includes('backdrop-filter:none;-webkit-backdrop-filter:none'),'Fixed mobile navigation must escape the desktop blur containing block');
assert.ok(css.includes('100dvh - var(--mobile-header)'),'Navigation height must be based on the viewport');
for(const file of ['index.html','prayer.html']){
 const html=read(file),section=html.match(/<section class="daily-verse-section[\s\S]*?<\/section>/)[0];
 assert.ok(section.includes('id="daily-verse-text"')&&section.includes('id="daily-verse-reference"'));
 assert.ok(!/BibleGateway|Bible Gateway|Biblica|daily-verse-date|daily-verse-link|verse-attribution/.test(section),'Verse card should contain only scripture and reference');
 const privacy=html.match(/<dialog id="privacy-dialog"[\s\S]*?<\/dialog>/)[0];assert.ok(privacy.includes('Powered by BibleGateway.com')&&privacy.includes('Biblica'),'Credits remain accessible in Privacy');
 assert.ok(!/\d+ photographs/.test(html),'Gallery count should not be rendered');
 assert.ok(html.includes('class="mobile-only mobile-footer"')&&html.includes('<details class="mobile-footer-more">'));
}
const manifest=JSON.parse(fs.readFileSync(path.join(root,'scripts/mobile_images.json'),'utf8'));
for(const [source,photo] of Object.entries(manifest.images)){
 assert.equal(createHash('sha256').update(fs.readFileSync(path.join(dist,source))).digest('hex'),photo.sha256,'Source photo changed');
 for(const item of photo.variants){assert.ok(item.width<=photo.width);assert.equal(fs.statSync(path.join(dist,item.src)).size,item.bytes);assert.ok(Math.abs(item.height/item.width-photo.height/photo.width)<0.004,'Image proportions changed');}
}
for(const file of fs.readdirSync(dist).filter(n=>n.endsWith('.html'))){
 const html=read(file);assert.ok(html.includes('viewport-fit=cover'));assert.ok(html.includes('src="mobile.js?v=20261015-2"'));assert.ok(html.includes('href="mobile.css?v=20261015-2"'));
 for(const set of html.matchAll(/srcset="([^"]+)"/g))for(const item of set[1].split(','))assert.ok(fs.existsSync(path.join(dist,item.trim().split(' ')[0])),'Missing responsive photo');
}
class El{
 constructor(tag='div'){this.tag=tag;this.children=[];this.attrs={};this.dataset={};this.handlers={};this.classes=new Set();this.classList={toggle:(n,on)=>{if(on===undefined)on=!this.classes.has(n);on?this.classes.add(n):this.classes.delete(n);},add:n=>this.classes.add(n),remove:n=>this.classes.delete(n)};}
 append(...nodes){this.children.push(...nodes);}replaceChildren(...nodes){this.children=[...nodes];}
 addEventListener(n,fn){(this.handlers[n]??=[]).push(fn);}dispatch(n,event={}){for(const f of this.handlers[n]||[])f(event);}
 getAttribute(n){return this.attrs[n]??null;}setAttribute(n,v){this.attrs[n]=String(v);}removeAttribute(n){delete this.attrs[n];}
 querySelector(s){return s==='button'?this.children.find(e=>e.tag==='button'):s==='small'?this.children.find(e=>e.tag==='small'):null;}
 querySelectorAll(){return this.children;}focus(){doc.activeElement=this;}pause(){}load(){}play(){return Promise.resolve();}
}
let doc;
for(const width of widths){
 const menu=new El('button'),nav=new El('nav'),body=new El('body'),events=new El(),box=new El(),mapButton=new El('button'),email=new El('a'),restream=new El('a');
 menu.setAttribute('aria-expanded','false');nav.children=Array.from({length:11},()=>new El('a'));nav.querySelector=()=>nav.children[0];box.append(mapButton);box.dataset.mapSrc='https://www.google.com/maps?q=Al+Mankhool&output=embed';email.append(new El('small'));
 const media=new El();media.matches=width<=767;
 doc=new El('document');doc.body=body;doc.hidden=false;doc.head=new El();doc.createElement=tag=>new El(tag);doc.getElementById=id=>({'navigation':nav,'mobile-upcoming-events':events}[id]||null);
 doc.querySelector=s=>({'.menu-toggle':menu,'#navigation':nav,'#video-dialog':new El()}[s]||null);
 doc.querySelectorAll=s=>({'[data-map-src]':[box],'.mobile-contact-email':[email],'.mobile-restream':[restream]}[s]||[]);
 const win=new El('window');win.matchMedia=s=>s.includes('max-width: 767px')?media:{matches:false};win.CHURCH_CONFIG={contactEmail:'office@example.org',restreamWatchUrl:'https://player.restream.io/test',upcomingEvents:[{title:'<script>literal event title</script>',startsAt:'2099-10-14T20:00:00+04:00',location:'Dubai'}]};
 const context={window:win,document:doc,URL,Date,Intl,setInterval(){},setTimeout(){},clearTimeout(){},navigator:{},location:{href:'https://apostleschurchdubai.org/'}};
 vm.runInNewContext(read('schedule.js'),context);vm.runInNewContext(read('app.js'),context);vm.runInNewContext(read('mobile.js'),context);
 assert.equal(nav.inert,true);menu.dispatch('click');assert.equal(menu.getAttribute('aria-expanded'),'true');assert.equal(nav.inert,false);assert.ok(body.classes.has('mobile-menu-open'));assert.equal(doc.activeElement,nav.children[0]);
 nav.children.at(-1).focus();let prevented=false;doc.dispatch('keydown',{key:'Tab',shiftKey:false,preventDefault(){prevented=true;}});assert.ok(prevented);assert.equal(doc.activeElement,menu);
 doc.dispatch('keydown',{key:'Escape'});assert.equal(nav.inert,true);assert.ok(!body.classes.has('mobile-menu-open'));assert.equal(doc.activeElement,menu);
 menu.dispatch('click');nav.dispatch('click',{target:{closest:()=>nav.children[0]}});assert.equal(nav.inert,true);assert.ok(!body.classes.has('mobile-menu-open'));
 assert.equal(events.children.length,3);for(const card of events.children){assert.equal(card.href,'visit.html');assert.equal(card.children[0].tag,'time');assert.equal(card.children[1].children.length,3);}
 mapButton.dispatch('click');assert.equal(box.children[0].tag,'iframe');assert.equal(box.children[0].loading,'lazy');assert.ok(box.children[0].src.startsWith('https://www.google.com/'));
 assert.equal(email.href,'mailto:office@example.org');assert.equal(restream.href,'https://player.restream.io/test');
 menu.dispatch('click');media.matches=false;media.dispatch('change');assert.equal(nav.inert,false);assert.equal(menu.getAttribute('aria-expanded'),'false');assert.ok(!body.classes.has('mobile-menu-open'));
 console.log('PASS: '+width+'px configuration — navigation, focus/Escape, anchor closing, breakpoint reset, event cards, map consent and contact configuration (DOM simulation).');
}
console.log('PASS: desktop CSS unchanged; mobile-only scope, safe areas, responsive image files/proportions and original photo hashes. Browser geometry is not verified by this script.');
// The simplified verse card deliberately has no date/link/provider nodes.
const verseEls=Object.fromEntries(['daily-verse','daily-verse-text','daily-verse-reference'].map(id=>['#'+id,new El()]));
const bibleWindow={matchMedia:()=>({matches:true})};
const bibleDocument={querySelector:s=>verseEls[s]||null,querySelectorAll:()=>[],createElement:tag=>Object.assign(new El(tag),{remove(){}}),head:new El(),addEventListener(){},hidden:false};
class PlainParser{parseFromString(text){return{body:{textContent:String(text).replace(/<[^>]*>/g,'')}};}}
vm.runInNewContext(read('church.js'),{window:bibleWindow,document:bibleDocument,DOMParser:PlainParser,URL,Date,Intl,setTimeout:()=>1,clearTimeout(){},setInterval(){}});
bibleWindow.apostlesDailyVerse({votd:{version_id:'NIV',text:'God is our refuge.',reference:'Psalm 46:1',year:'2026',month:'10',day:'15',permalink:'https://www.biblegateway.com/'}});
assert.equal(verseEls['#daily-verse-text'].textContent,'God is our refuge.');assert.equal(verseEls['#daily-verse-reference'].textContent,'Psalm 46:1 · NIV');
assert.equal(verseEls['#daily-verse-text'].dataset.loaded,'true');
console.log('PASS: daily NIV callback updates the simplified verse card without requiring removed provider/date/link elements.');
