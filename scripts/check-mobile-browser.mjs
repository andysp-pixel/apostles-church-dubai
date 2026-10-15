// Run in a local development environment or GitHub Actions with Playwright browsers installed.
// This is a browser geometry test, separate from the DOM simulations.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
const {chromium,webkit}=await import('playwright');
const root=path.resolve(import.meta.dirname,'..'),dist=fs.existsSync(path.join(root,'dist'))?path.join(root,'dist'):root;
const output=path.join(root,'test-results/mobile');fs.mkdirSync(output,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.woff2':'font/woff2','.mp4':'video/mp4'};
const server=http.createServer((req,res)=>{
 let filename;try{filename=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
 const local=path.resolve(dist,'.'+(filename==='/'?'/index.html':filename));
 if(!local.startsWith(dist+path.sep)||!fs.existsSync(local)||!fs.statSync(local).isFile()){res.writeHead(404).end();return;}
 res.writeHead(200,{'Content-Type':mime[path.extname(local)]||'application/octet-stream'});fs.createReadStream(local).pipe(res);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const pages=['index.html','about.html','live.html','sermons.html','prayer.html','donate.html','visit.html'];
const widths=[320,360,375,390,412,430],report=[];
async function noOverflow(page,label){
 const result=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,html:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
 assert.ok(result.html<=result.viewport+1&&result.body<=result.viewport+1,label+': '+JSON.stringify(result));
}
let failed=false;
try{
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await type.launch();
  try{
   for(const width of widths){
    const context=await browser.newContext({viewport:{width,height:width===320?568:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,reducedMotion:'reduce'});
    await context.addInitScript(()=>sessionStorage.setItem('apostles-welcome-seen','1'));
    await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    try{
     for(const file of pages){
      await page.goto(origin+'/'+file,{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);await noOverflow(page,engine+' '+width+' '+file);
      const header=await page.locator('.header').boundingBox();assert.ok(header.height>=65&&header.height<=80);
      await page.locator('.menu-toggle').tap();assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');await noOverflow(page,'open menu');
      await page.keyboard.press('Escape');assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
      if(file==='index.html'){
       const heroButtons=page.locator('.photo-hero .actions a');for(const link of await heroButtons.all()){const b=await link.boundingBox();assert.ok(b.height>=50&&b.x>=0&&b.x+b.width<=width+1);}
       const cta=await heroButtons.last().boundingBox();assert.ok(cta.y+cta.height<=(width===320?568:844)+1,'Hero actions should fit the first screen');
       await page.locator('.gallery-viewport').first().evaluate(el=>el.scrollBy({left:240,behavior:'instant'}));await noOverflow(page,'swiped gallery');
       const galleryImage=await page.locator('.gallery-slide img').first().evaluate(img=>({src:img.currentSrc,width:img.getBoundingClientRect().width,height:img.getBoundingClientRect().height,fit:getComputedStyle(img).objectFit}));assert.ok(galleryImage.src.includes('/assets/mobile/'));assert.equal(galleryImage.fit,'cover');assert.ok(Math.abs(galleryImage.width/galleryImage.height-4/3)<0.02);
       await page.locator('.mobile-map-load').tap();const map=await page.locator('.mobile-map iframe').boundingBox();assert.ok(map.width<=width-35);
       await page.screenshot({path:path.join(output,engine+'-'+width+'-home.png'),fullPage:true});
      }
      if(file==='live.html'){const box=await page.locator('.player-area').boundingBox();assert.ok(Math.abs(box.width/box.height-16/9)<0.02,'16:9 player');assert.ok(box.x>=0&&box.x+box.width<=width+1);}
      if(file==='prayer.html')assert.ok(await page.locator('#prayer-message').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=16));
      report.push({engine,width,page:file,result:'passed'});
     }
     assert.deepEqual(errors,[],'No uncaught page errors');
    }finally{await context.close();}
   }
   // Check the transitions into the tablet/desktop presentation as well.
   for(const width of [768,1023,1024,1440]){
    const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});await context.addInitScript(()=>sessionStorage.setItem('apostles-welcome-seen','1'));
    await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());const page=await context.newPage();
    try{for(const file of pages){await page.goto(origin+'/'+file);await page.evaluate(()=>document.fonts.ready);await noOverflow(page,engine+' '+width+' '+file);report.push({engine,width,page:file,result:'passed'});}}finally{await context.close();}
   }
  }finally{await browser.close();}
 }
}catch(error){failed=true;report.push({result:'failed',error:error.stack});console.error(error);}
finally{await new Promise(resolve=>server.close(resolve));fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));}
if(failed)process.exitCode=1;else console.log('PASS: Chromium and WebKit, six phone widths and four tablet/desktop widths; all seven pages. See test-results/mobile/report.json.');
