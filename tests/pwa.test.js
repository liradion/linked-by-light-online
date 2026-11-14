'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {render}=require('../pwa-icons');
const pub=path.join(__dirname,'../public');
test('installable manifest has stable scope and PNG icons',()=>{
 const m=JSON.parse(fs.readFileSync(path.join(pub,'app.webmanifest'),'utf8'));
 assert.equal(m.name,'Связанные светом — для двоих');
 assert.equal(m.start_url,'/');assert.equal(m.scope,'/');
 assert.equal(m.display,'standalone');
 for(const size of [192,512])assert.ok(m.icons.some(i=>i.sizes===size+'x'+size&&i.type==='image/png'));
});
test('generated Apple and Windows icon bytes are valid PNG',()=>{
 for(const size of [180,192,512]){
  const png=render(size);
  assert.ok(Buffer.isBuffer(png));assert.ok(png.length>100);
  assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10]);
  assert.equal(png.readUInt32BE(16),size);assert.equal(png.readUInt32BE(20),size);
  assert.equal(render(size),png,'cached icon must be stable');
 }
});
test('index references manifest, icons and installer without inline scripts',()=>{
 const html=fs.readFileSync(path.join(pub,'index.html'),'utf8');
 for(const asset of ['/app.webmanifest','/pwa.css?v=14','/pwa.js?v=14','/apple-touch-icon.png'])
  assert.ok(html.includes(asset),asset+' missing');
 assert.equal(/<script(?![^>]*src=)[^>]*>/i.test(html),false,'CSP unsafe inline script');
});
test('service worker never intercepts authentication or realtime requests',()=>{
 const source=fs.readFileSync(path.join(pub,'sw.js'),'utf8'),listeners={};
 const self={location:{origin:'https://example.com'},clients:{claim:async()=>{}},
   skipWaiting:async()=>{},addEventListener:(name,fn)=>{listeners[name]=fn;}};
 const caches={open:async()=>({addAll:async()=>{},match:async()=>null,put:async()=>{}}),
   keys:async()=>[],match:async()=>({})};
 vm.runInNewContext(source,{self,caches,URL,fetch:async()=>({ok:true,type:'basic',clone(){return this}}),Promise});
 assert.ok(typeof listeners.fetch==='function');
 for(const endpoint of ['/api/cloud/status','/api/auth/me','/ws','/?code=private-oauth-code','/?login=ok']){
  let intercepted=false;
  listeners.fetch({request:{url:'https://example.com'+endpoint,mode:'navigate',method:'GET'},respondWith:()=>{intercepted=true;}});
  assert.equal(intercepted,false,'private URL intercepted: '+endpoint);
 }
 let navigated=false;
 listeners.fetch({request:{url:'https://example.com/?room=AAAAAA',mode:'navigate',method:'GET'},
   respondWith:p=>{navigated=true;return p;}});
 assert.equal(navigated,true,'normal app navigation must work');
});
test('server serves actual icon bytes and never exposes private icon module as web file',()=>{
 const server=fs.readFileSync(path.join(__dirname,'../server.js'),'utf8');
 assert.ok(server.includes("pwaIcons.render(iconSize)"));
 assert.ok(server.includes("'.webmanifest':'application/manifest+json; charset=utf-8'"));
 assert.ok(server.includes("'Service-Worker-Allowed':'/'"));
 assert.ok(server.includes("pathname==='/sw.js'?'no-store'"));
});
