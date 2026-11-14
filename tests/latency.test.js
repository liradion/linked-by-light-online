'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const net=require('node:net');
const {spawn}=require('node:child_process');
const {once}=require('node:events');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const root=path.join(__dirname,'..');
function quality(){
 const window={};const sandbox={window,
  document:{getElementById(){return null}},
  localStorage:{getItem(){return null},setItem(){}},
  navigator:{hardwareConcurrency:8},console};
 vm.runInNewContext(fs.readFileSync(path.join(root,'public/quality.js'),'utf8'),sandbox);
 return window.GameQuality;
}
test('adaptive interpolation is faster on stable networks and protects against real jitter',()=>{
 const q=quality();q.net(350);
 for(let time=1000;time<1400;time+=33)q.snapshotArrived(time);
 const stable=q.stats();
 assert.ok(stable.buffer>=45&&stable.buffer<=75,'stable high RTT must not impose an unnecessary 85ms+ buffer');
 assert.ok(stable.snapshotHz>=25&&stable.snapshotHz<=35,'report measured snapshot cadence');
 let t=1450;
 for(const gap of [120,30,110,30,130,30]){t+=gap;q.snapshotArrived(t);}
 assert.ok(q.interpolationDelay()>stable.buffer,'jitter should increase safety margin');
 assert.ok(q.interpolationDelay()<=165,'buffer remains bounded');
});
test('client uses responsive input cadence and retains immediate key transmission',()=>{
 const client=fs.readFileSync(path.join(root,'public/client.js'),'utf8');
 assert.match(client,/sendInput\(\);\},25\)/,'40Hz periodic input stream');
 assert.match(client,/sent:performance\.now\(\)\}\);\},1000\)/,'1Hz RTT probes');
 assert.match(client,/GameQuality\.snapshotArrived\(receivedAt\)/);
 assert.match(client,/input\.left=keys\.has/,'existing immediate key input retained');
});
async function freePort(){return new Promise((resolve,reject)=>{
 const server=net.createServer();server.once('error',reject);
 server.listen(0,'127.0.0.1',()=>{const p=server.address().port;server.close(()=>resolve(p));});
});}
async function socket(port){
 const ws=new WebSocket('ws://127.0.0.1:'+port+'/ws');
 const messages=[];
 await new Promise((resolve,reject)=>{
  ws.addEventListener('open',resolve,{once:true});
  ws.addEventListener('error',reject,{once:true});
 });
 ws.addEventListener('message',event=>{try{messages.push(JSON.parse(event.data));}catch(_){}});
 return {ws,messages,send(value){ws.send(JSON.stringify(value));}};
}
async function take(peer,check,timeout=4500){
 const end=Date.now()+timeout;
 while(Date.now()<end){
  const i=peer.messages.findIndex(check);
  if(i!==-1)return peer.messages.splice(i,1)[0];
  await sleep(15);
 }
 throw Error('Missing expected server response '+JSON.stringify(peer.messages.slice(-2)));
}
test('two-player live rooms receive ~30Hz snapshots with less idle traffic',{timeout:12000},async()=>{
 const port=await freePort(),env={...process.env,PORT:String(port)};
 delete env.SUPABASE_URL;delete env.SUPABASE_SECRET_KEY;delete env.SUPABASE_SERVICE_ROLE_KEY;
 const server=spawn(process.execPath,['server.js'],{cwd:root,env,stdio:['ignore','pipe','pipe']});
 let a,b;
 try{
  await Promise.race([once(server.stdout,'data'),sleep(3000).then(()=>{throw Error('server did not start')})]);
  a=await socket(port);a.send({t:'create'});const room=await take(a,m=>m.t==='joined');
  b=await socket(port);b.send({t:'join',room:room.room});await take(b,m=>m.t==='joined');
  a.send({t:'start'});await take(b,m=>m.t==='snapshot'&&m.phase==='playing');
  a.messages.length=0;
  await sleep(1500);
  const count=a.messages.filter(m=>m.t==='snapshot'&&m.phase==='playing').length;
  assert.ok(count>=34&&count<=80,'expected 30Hz snapshots, got '+count);
  // All gameplay packets remain authoritative; no client-side room bypass.
  a.send({t:'input',inputSeq:8,right:true,abilitySeq:1});
  const responded=await take(a,m=>m.t==='snapshot'&&m.ack?.[0]>=8);
  assert.ok(responded.tick>0,'server confirmed processed input');
 }finally{for(const peer of [a,b])try{peer?.ws.close();}catch(_){}
  server.kill('SIGTERM');}
});
test('server drops obsolete queued snapshots instead of buffering arbitrary seconds',()=>{
 const server=fs.readFileSync(path.join(root,'server.js'),'utf8');
 assert.match(server,/MAX_SNAPSHOT_BACKLOG=24_000/);
 assert.match(server,/socket\.writableLength>MAX_SNAPSHOT_BACKLOG/);
 assert.match(server,/lastBroadcast%2===0/);
 assert.match(server,/lastBroadcast%30===0/);
});
