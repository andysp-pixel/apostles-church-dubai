import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createLiveWorker } from '../cloudflare-live-api/worker.mjs';
const root=path.resolve(import.meta.dirname,'..'),dist=fs.existsSync(path.join(root,'dist'))?path.join(root,'dist'):root;
let clock=Date.now();
const channel='UC'+'A'.repeat(22),id='abcdefghijk';
const env={YOUTUBE_CLIENT_ID:'test-client',YOUTUBE_CLIENT_SECRET:'test-secret',YOUTUBE_REFRESH_TOKEN:'test-refresh',YOUTUBE_CHANNEL_ID:channel};
const live={id,snippet:{channelId:channel,title:'Church service'},status:{privacyStatus:'public',lifeCycleStatus:'live'},contentDetails:{enableEmbed:true}};
const req=(query='',origin='https://apostleschurchdubai.org')=>new Request('https://worker.example/api/live'+query,{headers:{Origin:origin}});
function fixture(items=[live],failure=false){
 const calls=[],entries=new Map();
 const cache={async match(key){const entry=entries.get(key.url);return entry&&entry.expires>clock?entry.response.clone():undefined;},async put(key,response){entries.set(key.url,{response:response.clone(),expires:clock+120000});}};
 const fetcher=async(url,options)=>{
  calls.push({url:String(url),options});
  if(failure)throw new Error('private provider detail test-secret test-refresh');
  if(String(url).includes('oauth2'))return Response.json({access_token:'test-access',expires_in:3600});
  assert.equal(options.headers.Authorization,'Bearer test-access');
  assert.equal(new URL(url).searchParams.get('broadcastStatus'),'active');
  return Response.json({items});
 };
 return {worker:createLiveWorker({fetcher,now:()=>clock,cache}),calls};
}
let f=fixture();
let response=await f.worker.fetch(req(),env);
assert.equal(response.status,200);assert.equal(response.headers.get('Access-Control-Allow-Origin'),'https://apostleschurchdubai.org');
assert.equal((await response.json()).videoId,id);assert.equal(f.calls.length,2);
response=await f.worker.fetch(req('?cacheBust=anything','https://www.apostleschurchdubai.org'),env);
assert.equal(response.headers.get('Access-Control-Allow-Origin'),'https://www.apostleschurchdubai.org');assert.equal(f.calls.length,2,'Query strings must not bypass cache');
clock+=121000;await f.worker.fetch(req(),env);assert.equal(f.calls.filter(c=>c.url.includes('oauth2')).length,1,'Reuse the still-valid access token');
assert.equal(f.calls.length,3);
assert.equal((await f.worker.fetch(req('', 'https://unrelated.example'),env)).status,403);
const before=f.calls.length;response=await f.worker.fetch(req(),{});assert.equal(response.status,503);assert.equal(f.calls.length,before,'Unconfigured API must not request Google');
assert.equal((await f.worker.fetch(new Request('https://worker.example/api/live',{method:'POST'}),env)).status,405);
assert.equal((await f.worker.fetch(new Request('https://worker.example/api/live',{method:'OPTIONS',headers:{Origin:'https://apostleschurchdubai.org'}}),env)).status,204);
assert.equal((await f.worker.fetch(new Request('https://worker.example/anything'),env)).status,404);
for(const [items,state] of [[[],'offline'],[[{...live,contentDetails:{enableEmbed:false}}],'external'],[[{...live,status:{privacyStatus:'private',lifeCycleStatus:'live'}}],'offline'],[[{...live,status:{privacyStatus:'unlisted',lifeCycleStatus:'live'}}],'offline'],[[{...live,snippet:{channelId:'UC'+'B'.repeat(22),title:'Other channel'}}],'offline'],[[{...live,status:{privacyStatus:'public',lifeCycleStatus:'testing'}}],'offline']]){
 f=fixture(items);assert.equal((await (await f.worker.fetch(req(),env)).json()).state,state);
}
f=fixture([],true);response=await f.worker.fetch(req(),env);assert.equal(response.status,503);
const errorText=await response.text();assert.equal(JSON.parse(errorText).state,'unavailable');assert.ok(!errorText.includes('test-secret')&&!errorText.includes('test-refresh'));
await f.worker.fetch(req(),env);assert.equal(f.calls.length,1,'Failed authorization must have a cooldown');
f=fixture();await Promise.all(Array.from({length:10},()=>f.worker.fetch(req(),env)));assert.equal(f.calls.length,2,'Concurrent visitors share discovery');
const front={window:{},URL,Date,AbortController,setTimeout:()=>1,clearTimeout(){},document:{hidden:false}};
vm.runInNewContext(fs.readFileSync(path.join(dist,'live-status.js'),'utf8'),front);
const api=front.window.ChurchLiveStatus;
assert.throws(()=>api.monitor({url:'http://insecure.example'}),/HTTPS/);
assert.throws(()=>api.validate({state:'live',videoId:'bad',checkedAt:new Date().toISOString()}),/Invalid video/);
assert.throws(()=>api.validate({state:'offline',checkedAt:'bad'}),/Invalid live status/);
let got=null,errors=0;
let mon=api.monitor({url:'https://worker.example/api/live',onStatus:data=>got=data,onError:()=>errors++,fetcher:async()=>Response.json({state:'live',videoId:id,checkedAt:new Date().toISOString()})});
await mon.start();assert.equal(got.videoId,id);mon.stop();
mon=api.monitor({url:'https://worker.example/api/live',onStatus(){throw new Error('Should not report offline');},onError:()=>errors++,fetcher:async()=>new Response('',{status:503})});
await mon.start();assert.equal(errors,1);mon.stop();
let requests=0;mon=api.monitor({url:'https://worker.example/api/live',onStatus(){},onError(){},isVisible:()=>false,fetcher:async()=>{requests++;}});await mon.start();assert.equal(requests,0);mon.stop();
// Run the real app with a minimal DOM to verify mode switching and iframe lifecycle.
class El{
 constructor(tag='div'){this.tag=tag;this.children=[];this.attrs={};this.dataset={};this.events={};this.classList={toggle(){},add(){},remove(){}};this.hidden=false;this.open=false;}
 append(...nodes){for(const node of nodes){node.parent=this;this.children.push(node);}}
 replaceChildren(...nodes){this.children=[];this.append(...nodes);}
 addEventListener(name,fn){this.events[name]=fn;}
 getAttribute(name){return this.attrs[name]??null;}
 setAttribute(name,value){this.attrs[name]=String(value);}
 removeAttribute(name){delete this.attrs[name];}
 querySelector(sel){return this.children.find(n=>sel==='iframe[data-live-id]'?n.tag==='iframe'&&n.dataset.liveId:n.tag===sel)||null;}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);}
 pause(){}load(){}play(){return Promise.resolve();}focus(){}
}
const names=['player-area','broadcast-status','dubai-time','intro-play','watch-live','watch-tab','listen-tab','watch-panel','listen-panel','player-notice','live-audio','audio-description','audio-start','video-dialog'];
const els=Object.fromEntries(names.map(name=>['#'+name,new El()]));els['.status-dot']=new El();els['#watch-tab'].setAttribute('aria-selected','true');els['#listen-tab'].setAttribute('aria-selected','false');
let callbacks;
const browser={window:{CHURCH_CONFIG:{liveStatusUrl:'https://worker.example/api/live'},matchMedia:()=>({matches:false}),addEventListener(){},open(){},ChurchLiveStatus:{monitor(opts){callbacks=opts;return{start(){},stop(){}};}}},document:{querySelector:sel=>els[sel]||null,querySelectorAll:()=>[],addEventListener(){},createElement:tag=>new El(tag),head:new El(),hidden:false},URL,Intl,Date,location:{href:'https://apostleschurchdubai.org/live.html'},setInterval(){},setTimeout(){},clearTimeout(){},navigator:{}};
vm.runInNewContext(fs.readFileSync(path.join(dist,'app.js'),'utf8'),browser);
callbacks.onStatus({state:'live',videoId:id,title:'Church service'});
const area=els['#player-area'],first=area.querySelector('iframe[data-live-id]');assert.ok(first);assert.ok(first.src.includes('mute=1'));assert.equal(first.dataset.liveId,id);
callbacks.onStatus({state:'live',videoId:id,title:'Church service'});assert.equal(area.querySelector('iframe[data-live-id]'),first,'Polling must not reload the playing iframe');
callbacks.onError();assert.equal(area.querySelector('iframe[data-live-id]'),first,'Transient failure must keep the viewer player available');
els['#listen-tab'].events.click();assert.equal(area.querySelector('iframe[data-live-id]'),null);
callbacks.onStatus({state:'live',videoId:id,title:'Church service'});assert.equal(area.querySelector('iframe[data-live-id]'),null,'No video download while audio is selected');
els['#watch-tab'].events.click();assert.ok(area.querySelector('iframe[data-live-id]'));
callbacks.onStatus({state:'offline'});assert.equal(area.querySelector('iframe[data-live-id]'),null);
els['#intro-play'].events.click();assert.ok(area.querySelector('video'));
callbacks.onStatus({state:'live',videoId:id,title:'Church service'});assert.ok(area.querySelector('video'),'Live discovery must not interrupt a deliberately selected introduction');
// A fixed public event can play before discovery is activated, without a false live claim.
function selectedBroadcast(value,withApi=false){
 const nodes=Object.fromEntries(names.map(name=>['#'+name,new El()]));nodes['.status-dot']=new El();nodes['#watch-tab'].setAttribute('aria-selected','true');
 let opened='',status;
 const context={...browser,window:{...browser.window,CHURCH_CONFIG:{youtubeBroadcastId:value,liveStatusUrl:withApi?'https://worker.example/api/live':''},open:url=>opened=url,ChurchLiveStatus:{monitor(opts){status=opts;return{start(){},stop(){}};}}},document:{...browser.document,querySelector:sel=>nodes[sel]||null,head:new El()}};
 vm.runInNewContext(fs.readFileSync(path.join(dist,'app.js'),'utf8'),context);
 return {nodes,get opened(){return opened;},get status(){return status;}};
}
const selected=selectedBroadcast('5F8Do2ssXno');
assert.ok(selected.nodes['#player-area'].querySelector('iframe[data-live-id]').src.includes('/5F8Do2ssXno?'));
assert.equal(selected.nodes['#broadcast-status'].textContent,'Church broadcast','A fixed link must not be labelled live');
selected.nodes['#watch-live'].events.click();assert.equal(selected.opened,'https://www.youtube.com/watch?v=5F8Do2ssXno');
selected.nodes['#listen-tab'].events.click();assert.equal(selected.nodes['#player-area'].querySelector('iframe[data-live-id]'),null);
selected.nodes['#watch-tab'].events.click();assert.ok(selected.nodes['#player-area'].querySelector('iframe[data-live-id]'));
for(const bad of ['bad','https://example.com',{},12345678901])assert.equal(selectedBroadcast(bad).nodes['#player-area'].querySelector('iframe[data-live-id]'),null);
const automatic=selectedBroadcast('5F8Do2ssXno',true);
const sameVideo=automatic.nodes['#player-area'].querySelector('iframe[data-live-id]');
automatic.status.onStatus({state:'live',videoId:'5F8Do2ssXno',title:'Church broadcast'});
assert.equal(automatic.nodes['#broadcast-status'].textContent,'Live now');
assert.equal(automatic.nodes['#player-area'].querySelector('iframe[data-live-id]'),sameVideo,'Confirming a selected video must not reload it');
automatic.status.onStatus({state:'live',videoId:id,title:'New church broadcast'});
assert.equal(automatic.nodes['#player-area'].querySelector('iframe[data-live-id]').dataset.liveId,id);
automatic.status.onStatus({state:'offline'});assert.equal(automatic.nodes['#player-area'].querySelector('iframe[data-live-id]'),null);
console.log('PASS: read-only OAuth, token reuse, cache/query handling, concurrent visitors, public/channel/embed filtering, unavailable distinction, secret redaction, CORS and API methods.');
console.log('PASS: client HTTPS/status validation, error/hidden-page handling, automatic muted live iframe, no reload on polling, Watch/Listen switching, offline removal and intro preference.');
console.log('PASS: selected public broadcast embed, neutral status, exact YouTube fallback, audio/video switching, invalid ID rejection and future automatic discovery.');
