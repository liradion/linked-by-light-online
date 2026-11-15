'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process'),net=require('node:net'),path=require('node:path');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const freePort=()=>new Promise((resolve,reject)=>{const s=net.createServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{const n=s.address().port;s.close(()=>resolve(n));});});
async function link(port){
 const ws=new WebSocket('ws://127.0.0.1:'+port+'/ws'),messages=[];
 ws.addEventListener('message',event=>{try{messages.push(JSON.parse(event.data));}catch(_){}});
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 return {ws,messages,send(m){ws.send(JSON.stringify(m));},close(){ws.close();}};
}
async function take(peer,predicate,limit=4500){
 const end=Date.now()+limit;
 while(Date.now()<end){
  const i=peer.messages.findIndex(predicate);
  if(i>=0)return peer.messages.splice(i,1)[0];
  await sleep(12);
 }
 throw Error('No matching WebSocket event: '+JSON.stringify(peer.messages.slice(-8)));
}
test('v21 genuine WebSocket campaign, story, home, gallery and reconnection',{timeout:22000},async()=>{
 const port=await freePort(),server=spawn(process.execPath,['server.js'],{cwd:path.resolve(__dirname,'..'),
  env:{...process.env,PORT:String(port),SUPABASE_URL:'',SUPABASE_SECRET_KEY:'',SUPABASE_SERVICE_ROLE_KEY:'',SAVE_DIR:'',LL_ADMIN_TOKEN:'TestServerAdminTokenForIntegration0123456789abcdefgh'},
  stdio:['ignore','pipe','pipe']});
 let host,guest,observer,stale,rejoined;
 try{
  let ready=false;
  for(let i=0;i<110;i++){try{const r=await fetch('http://127.0.0.1:'+port+'/version');if(r.ok){const v=await r.json();assert.equal(v.version,'26.0.0');assert.equal(v.protocol,4);ready=true;break;}}catch(_){}await sleep(60);}
  assert.equal(ready,true);
  for(const file of ['/shared/v21-stages.js','/v21.js','/v21.css']){
   const r=await fetch('http://127.0.0.1:'+port+file);assert.equal(r.status,200,file);
  }
  const html=await (await fetch('http://127.0.0.1:'+port+'/')).text();
  assert.ok(html.indexOf('/shared/v21-stages.js')<html.indexOf('/v21.js'));
  assert.ok(html.indexOf('/v21.js')<html.indexOf('/client.js?v=26'));
  host=await link(port);host.send({t:'hello',protocol:3});
  host.send({t:'create',stage:112,unlockedV21:['v21-01','v21-02']});const joined=await take(host,m=>m.t==='joined');
  assert.equal(joined.role,0);assert.equal(joined.protocol,4);
  guest=await link(port);guest.send({t:'hello',protocol:3});
  guest.send({t:'join',room:joined.room});const invited=await take(guest,m=>m.t==='joined');
  assert.equal(invited.role,1);
  stale=await link(port);stale.send({t:'hello',protocol:2});
  stale.send({t:'join',room:joined.room});
  assert.match((await take(stale,m=>m.t==='error')).message,/v21/);
  host.send({t:'start'});const game=await take(host,m=>m.t==='snapshot'&&m.stage===112&&m.phase==='playing');
  assert.equal(game.world.v21.kind,'trails');
  host.send({t:'v21Action',actionId:'story-prequel',kind:'prequel'});
  assert.equal((await take(host,m=>m.t==='actionResult'&&m.actionId==='story-prequel')).ok,true);
  assert.equal((await take(guest,m=>m.t==='v21State'&&m.data.prequel?.[0]===1)).data.prequel[0],1);
  host.send({t:'v21Action',actionId:'dupe-1',kind:'garden_tend'});
  assert.equal((await take(host,m=>m.t==='actionResult'&&m.actionId==='dupe-1')).ok,true);
  host.send({t:'v21Action',actionId:'dupe-1',kind:'garden_tend'});
  assert.equal((await take(host,m=>m.t==='actionResult'&&m.actionId==='dupe-1')).ok,false);
  guest.send({t:'v21Action',actionId:'garden-2',kind:'garden_tend'});
  assert.equal((await take(guest,m=>m.t==='actionResult'&&m.actionId==='garden-2')).ok,true);
  host.send({t:'v21Action',actionId:'paint-left',kind:'paint_cell',x:1,y:2,value:4});
  assert.equal((await take(host,m=>m.t==='actionResult'&&m.actionId==='paint-left')).ok,true);
  guest.send({t:'v21Action',actionId:'paint-illegal',kind:'paint_cell',x:1,y:2,value:3});
  assert.equal((await take(guest,m=>m.t==='actionResult'&&m.actionId==='paint-illegal')).ok,false);
  guest.send({t:'v21Action',actionId:'paint-right',kind:'paint_cell',x:6,y:2,value:3});
  assert.equal((await take(guest,m=>m.t==='actionResult'&&m.actionId==='paint-right')).ok,true);
  host.send({t:'v21Action',actionId:'letter',kind:'letter_send',value:'До встречи на рассвете'});
  assert.equal((await take(host,m=>m.t==='actionResult'&&m.actionId==='letter')).ok,true);
  observer=await link(port);observer.send({t:'hello',protocol:3});
  observer.send({t:'join',room:joined.room,spectate:true});
  const o=await take(observer,m=>m.t==='joined');assert.equal(o.role,-1);
  await take(observer,m=>m.t==='v21State');
  assert.equal(observer.messages.some(m=>m.t==='v21Private'),false);
  host.send({t:'v21Publish',actionId:'publish',blueprint:{v:1,title:'Дорога двух огней',platforms:[{x:500,y:399,w:110,h:16}]}});
  assert.equal((await take(host,m=>m.t==='actionResult'&&m.actionId==='publish')).ok,true);
  guest.send({t:'v21GalleryList'});
  const beforeModeration=await take(guest,m=>m.t==='v21Gallery');
  assert.equal(beforeModeration.items.length,0,'Unreviewed map must not be public');
  const overview=await fetch('http://127.0.0.1:'+port+'/api/admin/v22/overview',{
   headers:{Authorization:'Bearer TestServerAdminTokenForIntegration0123456789abcdefgh'}
  });
  assert.equal(overview.status,200);
  const pending=(await overview.json()).pendingGallery;
  assert.equal(pending.length,1);
  const decision=await fetch('http://127.0.0.1:'+port+'/api/admin/v22/gallery',{
   method:'POST',headers:{'Content-Type':'application/json',
    Authorization:'Bearer TestServerAdminTokenForIntegration0123456789abcdefgh'},
   body:JSON.stringify({id:pending[0].id,decision:'approve'})
  });
  assert.equal(decision.status,200);
  guest.send({t:'v21GalleryList'});const gallery=await take(guest,m=>m.t==='v21Gallery'&&m.items.length>0);
  assert.equal(gallery.items[0].title,'Дорога двух огней');
  assert.equal(JSON.stringify(gallery.items).includes(joined.room),false);
  guest.send({t:'v21Weekly'});const board=await take(guest,m=>m.t==='v21WeeklyBoard');
  assert.ok(board.target>=112&&board.target<=121);
  host.send({t:'selectStage',stage:113});
  await take(host,m=>m.t==='snapshot'&&m.stage===113);
  const unlockedLetters=await take(guest,m=>m.t==='v21Private'&&m.data?.letters?.length===1);
  assert.equal(unlockedLetters.data.letters[0].body,'До встречи на рассвете');
  await sleep(90);
  assert.equal(observer.messages.some(m=>m.t==='v21Private'),false);
  guest.close();await sleep(80);
  rejoined=await link(port);rejoined.send({t:'hello',protocol:3});
  rejoined.send({t:'join',room:joined.room,token:invited.token});
  assert.equal((await take(rejoined,m=>m.t==='joined')).role,1);
  const recovered=await take(rejoined,m=>m.t==='v21State');
  assert.equal(recovered.data.garden.growth,1);
  assert.equal(recovered.data.painting[17],4);
  assert.equal(recovered.data.painting[22],3);
  assert.equal((await take(rejoined,m=>m.t==='v21Private')).data.letters.length,1);
 }finally{
  for(const client of [host,guest,observer,stale,rejoined])try{client?.close();}catch(_){}
  server.kill('SIGTERM');
 }
});
