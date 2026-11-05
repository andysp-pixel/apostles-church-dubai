import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),dist=fs.existsSync(path.join(root,'dist'))?path.join(root,'dist'):root;
const pages=['index.html','live.html','sermons.html','prayer.html','donate.html','about.html','visit.html'];
const htmls=new Map(pages.map(p=>[p,fs.readFileSync(path.join(dist,p),'utf8')]));
for(const name of fs.readdirSync(dist).filter(p=>p.endsWith('.js')))execFileSync(process.execPath,['--check',path.join(dist,name)]);
for(const [name,html] of htmls){
 assert.equal((html.match(/<main\b/g)||[]).length,1,name+' main');assert.equal((html.match(/<h1\b/g)||[]).length,1,name+' heading');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,name+' duplicate ID');
 for(const m of html.matchAll(/(?:src|href|poster|data-src)="([^"]+)"/g)){
  const ref=m[1].replaceAll('&amp;','&');if(/^(https:|tel:|mailto:|data:)/.test(ref))continue;
  assert.ok(!ref.startsWith('http:'),'Insecure reference');const [target,anchor]=ref.split('#');const file=target.split('?')[0]||name;
  assert.ok(fs.existsSync(path.join(dist,file)),name+' missing '+ref);
  if(anchor)assert.ok((htmls.get(file)||fs.readFileSync(path.join(dist,file),'utf8')).includes('id="'+anchor+'"'),name+' missing anchor '+ref);
 }
 const nav=html.match(/<nav id="navigation"[^>]*>(.*?)<\/nav>/s)?.[1];assert.ok(nav,name+' navigation');
 assert.equal((nav.match(/aria-current="page"/g)||[]).length,1,name+' active navigation');
 for(const p of pages)assert.equal((nav.match(new RegExp('href="'+p.replace('.','\\.')+'"','g'))||[]).length,1,'Unique menu destination '+p);
 for(const m of html.matchAll(/aria-(?:controls|labelledby)="([^"]+)"/g))for(const id of m[1].split(' '))assert.ok(ids.includes(id),name+' invalid ARIA '+id);
 assert.ok(html.includes('design.css?v=20261105-1'));assert.ok(html.includes('id="privacy-open"'));
 assert.ok(!html.includes('7 photographs')&&!html.includes('Our church in pictures')&&!html.includes('Follow us on Instagram'));
}
const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(dist,'config.js'),'utf8'),context);assert.equal(context.window.CHURCH_CONFIG.youtubeBroadcastId,'5F8Do2ssXno');
const accounts=JSON.parse(fs.readFileSync(path.join(root,'scripts/donation_accounts.json'),'utf8')),donate=htmls.get('donate.html');
for(const key of ['iban','accountNumber','paypalBotimPhone','westernUnionPhone'])assert.ok(donate.includes('data-copy="'+accounts[key]+'"'),'Copied giving detail '+key);
for(const key of ['bankBeneficiary','paypalBotimBeneficiary','westernUnionBeneficiary'])assert.ok(donate.includes(accounts[key]));
const numeric=(accounts.iban.slice(4)+accounts.iban.slice(0,4)).replace(/[A-Z]/g,c=>String(c.charCodeAt(0)-55));assert.equal(BigInt(numeric)%97n,1n);
const gallery=JSON.parse(fs.readFileSync(path.join(root,'scripts/gallery.json'),'utf8'));
for(const item of gallery)assert.equal(createHash('sha256').update(fs.readFileSync(path.join(dist,item.src))).digest('hex'),item.sha256,'Preserve photograph');
const sc={window:{}};vm.runInNewContext(fs.readFileSync(path.join(dist,'schedule.js'),'utf8'),sc);const schedule=sc.window.ChurchSchedule;
assert.equal(schedule.next('saturday',new Date('2026-10-16T22:59:00Z')).start.toISOString(),'2026-10-16T23:00:00.000Z');
assert.equal(schedule.next('sunday',new Date('2026-10-18T15:59:00Z')).start.toISOString(),'2026-10-18T16:00:00.000Z');
assert.equal(schedule.next('thursday',new Date('2026-10-15T16:01:00Z')).start.toISOString(),'2026-10-22T16:00:00.000Z');
assert.ok(schedule.calendar('saturday',new Date('2026-10-16T22:59:00Z')).includes('DTSTART;TZID=Asia/Dubai:20261017T030000'));
assert.ok(htmls.get('prayer.html').includes('id="prayer-form"'));
assert.ok(htmls.get('live.html').includes('id="player-area"'));
console.log('PASS: seven pages, unique IDs/headings, all internal links and anchors, unified navigation, ARIA targets, JS syntax, broadcast ID, exact giving details, preserved photographs, Dubai calendar boundaries.');
