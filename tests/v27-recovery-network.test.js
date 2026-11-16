'use strict';
// Browser-compatible WebSocket E2E through a real spawned Node HTTP/WS server.
// This is not a substitute for manually validating Safari/WebKit rendering.
const {test}=require('node:test'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const net=require('node:net'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function freePort(){return new Promise((resolve,reject)=>{const s=net.createServer();s.once('error',reject);
 s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});}
async function launch(port,dir){
 const p=spawn(process.execPath,['server.js'],{cwd:path.resolve(__dirname,'..'),stdio:['ignore','pipe','pipe'],
  env:{...process.env,PORT:String(port),SAVE_DIR:dir,RENDER:'',RENDER_SERVICE_ID:'',RENDER_GIT_COMMIT:'',
   LL_V27_ARCHIVE:'0',LL_REQUIRE_DURABLE_STORAGE:'0',
   SUPABASE_URL:'',SUPABASE_SECRET_KEY:'',SUPABASE_SERVICE_ROLE_KEY:'',BETA_MAX_ROOMS:'5'}});
 let stderr='';p.stderr.on('data',b=>{stderr=(stderr+b.toString()).slice(-3000);});
 for(let i=0;i<120;i++){
  try{const r=await fetch('http://127.0.0.1:'+port+'/health');if(r.ok)return p;}
  catch(_){}
  if(p.exitCode!==null)break;
  await sleep(40);
 }
 p.kill('SIGKILL');throw Error('Boot failed '+stderr);
}
async function stop(p){
 if(!p||p.exitCode!==null||p.signalCode!==null)return;
 const done=new Promise(resolve=>p.once('exit',resolve));p.kill('SIGTERM');
 await Promise.race([done,sleep(7500)]);
 if(p.exitCode===null&&p.signalCode===null)p.kill('SIGKILL');
}
async function connect(port){
 const ws=new WebSocket('ws://127.0.0.1:'+port+'/ws'),events=[];
 ws.addEventListener('message',event=>{try{events.push(JSON.parse(event.data));}catch(_){}});
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 return {ws,events,send:x=>ws.send(JSON.stringify(x)),close:()=>ws.close()};
}
async function get(peer,match,wait=4000){
 const end=Date.now()+wait;
 while(Date.now()<end){
  const i=peer.events.findIndex(match);if(i>=0)return peer.events.splice(i,1)[0];
  await sleep(12);
 }
 throw Error('Message missing: '+JSON.stringify(peer.events.slice(-4)));
}
test('v27 two-player mutation is exactly-once across retries, reconnect and restart',{timeout:26000},async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'linked-v27-e2e-')),port=await freePort();
 let app,host,guest,host2,host3,guest3;
 const request={t:'v24Action',actionId:'once-and-only-once',kind:'kitchen',ingredient:0};
 try{
  app=await launch(port,dir);
  assert.equal((await fetch('http://127.0.0.1:'+port+'/ready')).status,200);
  host=await connect(port);host.send({t:'hello',protocol:4});host.send({t:'create',stage:122});
  const welcome=await get(host,m=>m.t==='joined');
  guest=await connect(port);guest.send({t:'hello',protocol:4});
  guest.send({t:'join',room:welcome.room});
  const joined=await get(guest,m=>m.t==='joined');assert.equal(joined.role,1);
  host.send({t:'start'});
  await get(host,m=>m.t==='snapshot'&&m.phase==='playing');
  host.send(request);
  assert.equal((await get(host,m=>m.t==='actionResult'&&m.actionId===request.actionId)).ok,true);
  host.send(request);
  const replayed=await get(host,m=>m.t==='actionResult'&&m.actionId===request.actionId);
  assert.equal(replayed.replayed,true);assert.equal(replayed.ok,true);
  host.send({...request,ingredient:1});
  const collision=await get(host,m=>m.t==='actionResult'&&m.actionId===request.actionId);
  assert.equal(collision.ok,undefined);assert.match(collision.error,/другой/);
  guest.send({t:'v24Action',actionId:'partner-step-1',kind:'kitchen',ingredient:1});
  assert.equal((await get(guest,m=>m.t==='actionResult'&&m.actionId==='partner-step-1')).ok,true);
  host2=await connect(port);host2.send({t:'hello',protocol:4});
  host2.send({t:'join',room:welcome.room,token:welcome.token});
  assert.equal((await get(host2,m=>m.t==='joined')).role,0);
  host2.send(request);
  assert.equal((await get(host2,m=>m.t==='actionResult'&&m.actionId===request.actionId)).replayed,true);
  await stop(app);app=null;
  const legacy=path.join(dir,'linked-light-rooms-v11.json');
  assert.ok(fs.existsSync(legacy));
  assert.ok(fs.existsSync(legacy+'.v27'));
  assert.equal(JSON.parse(fs.readFileSync(legacy,'utf8')).version,11);
  app=await launch(port,dir);
  host3=await connect(port);host3.send({t:'hello',protocol:4});
  host3.send({t:'join',room:welcome.room,token:welcome.token});
  assert.equal((await get(host3,m=>m.t==='joined')).role,0);
  guest3=await connect(port);guest3.send({t:'hello',protocol:4});
  guest3.send({t:'join',room:welcome.room,token:joined.token});
  assert.equal((await get(guest3,m=>m.t==='joined')).role,1);
  const world=await get(host3,m=>m.t==='v24State');
  assert.equal(world.data.kitchen.step,2);
  host3.send(request);
  assert.equal((await get(host3,m=>m.t==='actionResult'&&m.actionId===request.actionId)).replayed,true);
  const state=await get(host3,m=>m.t==='v24State',100).catch(()=>world);
  assert.equal(state.data.kitchen.step,2,'No second mutation after restart');
 }finally{
  for(const p of [host,guest,host2,host3,guest3])try{p?.close();}catch(_){}
  await stop(app);fs.rmSync(dir,{recursive:true,force:true});
 }
});
