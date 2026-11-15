'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process'),net=require('node:net'),path=require('node:path');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const freePort=()=>new Promise((resolve,reject)=>{const socket=net.createServer();socket.once('error',reject);
 socket.listen(0,'127.0.0.1',()=>{const n=socket.address().port;socket.close(()=>resolve(n));});});
async function wsClient(port){
 const ws=new WebSocket('ws://127.0.0.1:'+port+'/ws'),events=[];
 ws.addEventListener('message',e=>{try{events.push(JSON.parse(e.data));}catch(_){}});
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 return {ws,events,send:e=>ws.send(JSON.stringify(e)),close:()=>ws.close()};
}
async function next(client,filter,timeout=4500){
 const deadline=Date.now()+timeout;
 while(Date.now()<deadline){
  const index=client.events.findIndex(filter);
  if(index>=0)return client.events.splice(index,1)[0];
  await sleep(12);
 }
 throw Error('Timed out waiting for event; recent '+JSON.stringify(client.events.slice(-6)));
}
test('v23–v26 real WebSocket rooms, private story updates, daily seeds and assisted sessions',{timeout:25000},async()=>{
 const port=await freePort(),server=spawn(process.execPath,['server.js'],{
  cwd:path.resolve(__dirname,'..'),
  env:{...process.env,PORT:String(port),SAVE_DIR:'',SUPABASE_URL:'',SUPABASE_SECRET_KEY:'',SUPABASE_SERVICE_ROLE_KEY:'',BETA_MAX_ROOMS:'12'},
  stdio:['ignore','pipe','pipe']});
 let host,guest,stale,observer,rejoined;
 try{
  let ok=false;
  for(let i=0;i<110;i++){
   try{const response=await fetch('http://127.0.0.1:'+port+'/version');if(response.ok){
    const data=await response.json();assert.equal(data.version,'26.0.0');assert.equal(data.protocol,4);ok=true;break;
   }}catch(_){}
   await sleep(45);
  }
  assert.equal(ok,true,'Server did not become ready');
  const html=await (await fetch('http://127.0.0.1:'+port+'/')).text();
  assert.ok(html.includes('/shared/v23-stages.js'));
  assert.ok(html.includes('/v23plus.js?v=26'));
  for(const endpoint of ['/shared/v23-stages.js','/v23plus.js','/v23plus.css']){
   assert.equal((await fetch('http://127.0.0.1:'+port+endpoint)).status,200,endpoint);
  }
  host=await wsClient(port);host.send({t:'hello',protocol:4});
  host.send({t:'create',stage:122});
  const joined=await next(host,m=>m.t==='joined');
  assert.equal(joined.role,0);assert.equal(joined.protocol,4);
  const room=joined.room;
  guest=await wsClient(port);guest.send({t:'hello',protocol:4});guest.send({t:'join',room});
  const invited=await next(guest,m=>m.t==='joined');
  assert.equal(invited.role,1);
  stale=await wsClient(port);stale.send({t:'hello',protocol:3});stale.send({t:'join',room});
  const legacy=await next(stale,m=>m.t==='error');
  assert.match(legacy.message,/v26/);
  host.send({t:'start'});
  await next(host,m=>m.t==='snapshot'&&m.stage===122&&m.phase==='playing');
  observer=await wsClient(port);observer.send({t:'hello',protocol:4});
  observer.send({t:'join',room,spectate:true});
  const watch=await next(observer,m=>m.t==='joined');
  assert.equal(watch.role,-1);
  host.send({t:'v24Action',actionId:'npc-0',kind:'npc_meet',npc:'keeper'});
  assert.equal((await next(host,m=>m.t==='actionResult'&&m.actionId==='npc-0')).ok,true);
  const world=await next(guest,m=>m.t==='v24State'&&m.data.npcs.includes('keeper'));
  assert.equal(world.data.npcs.length,1);
  assert.equal(observer.events.some(m=>m.t==='v24State'),false);
  host.send({t:'v24Action',actionId:'kitchen-0',kind:'kitchen',ingredient:0});
  assert.equal((await next(host,m=>m.t==='actionResult'&&m.actionId==='kitchen-0')).ok,true);
  guest.send({t:'v24Action',actionId:'kitchen-1',kind:'kitchen',ingredient:1});
  assert.equal((await next(guest,m=>m.t==='actionResult'&&m.actionId==='kitchen-1')).ok,true);
  host.send({t:'v24Action',actionId:'kitchen-0',kind:'kitchen',ingredient:0});
  assert.equal((await next(host,m=>m.t==='actionResult'&&m.actionId==='kitchen-0')).ok,false);
  host.send({t:'v26AssistVote',enabled:true});
  await next(host,m=>m.t==='snapshot'&&m.assistVotes?.[0]===true);
  guest.send({t:'v26AssistVote',enabled:true});
  const slow=await next(host,m=>m.t==='snapshot'&&m.assistMode===true);
  assert.equal(slow.assistMode,true);
  assert.equal(slow.assistVotes[0],null);
  host.send({t:'v23Action',actionId:'invalid-gravity',kind:'gravity_flip'});
  assert.equal((await next(host,m=>m.t==='actionResult'&&m.actionId==='invalid-gravity')).ok,false);
  host.send({t:'v25Generate',actionId:'seed-map',seed:12345,mode:'custom'});
  assert.equal((await next(host,m=>m.t==='actionResult'&&m.actionId==='seed-map')).ok,true);
  const generated=await next(guest,m=>m.t==='snapshot'&&m.customLevel?.title?.startsWith('Бесконечный свет'));
  assert.equal(generated.customLevel.platforms.length,7);
  const metadata=await next(host,m=>m.t==='v25Meta'&&m.data.seed===12345);
  assert.equal(metadata.data.seed,12345);
  host.send({t:'v25ReplayGet',actionId:'empty-replay'});
  assert.equal((await next(host,m=>m.t==='actionResult'&&m.actionId==='empty-replay')).ok,false);
  guest.close();await sleep(100);
  rejoined=await wsClient(port);rejoined.send({t:'hello',protocol:4});
  rejoined.send({t:'join',room,token:invited.token});
  assert.equal((await next(rejoined,m=>m.t==='joined')).role,1);
  const recovered=await next(rejoined,m=>m.t==='snapshot'&&m.assistMode===true);
  assert.equal(recovered.v23Unlocked,122);
  const restored=await next(rejoined,m=>m.t==='v24State');
  assert.equal(restored.data.kitchen.step,2);
  assert.equal(restored.data.npcs.includes('keeper'),true);
  const recoveredMeta=await next(rejoined,m=>m.t==='v25Meta');
  assert.equal(recoveredMeta.data.seed,12345);
 }finally{
  for(const c of [host,guest,stale,observer,rejoined])try{c?.close();}catch(_){}
  server.kill('SIGTERM');
 }
});
