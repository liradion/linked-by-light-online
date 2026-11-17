'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const net=require('node:net');
const {spawn}=require('node:child_process');
const path=require('node:path');
const {once}=require('node:events');
const delay=ms=>new Promise(r=>setTimeout(r,ms));

function freePort(){return new Promise((resolve,reject)=>{
 const server=net.createServer();
 server.once('error',reject);
 server.listen(0,'127.0.0.1',()=>{
  const port=server.address().port;server.close(()=>resolve(port));
 });
});}
async function client(port){
 const ws=new WebSocket('ws://127.0.0.1:'+port+'/ws'),messages=[];
 await new Promise((resolve,reject)=>{
  ws.addEventListener('open',resolve,{once:true});
  ws.addEventListener('error',reject,{once:true});
 });
 ws.addEventListener('message',e=>{try{messages.push(JSON.parse(e.data));}catch(_){}});
 return {ws,messages,send:m=>ws.send(JSON.stringify(m))};
}
async function receive(c,pred,timeout=6000){
 const deadline=Date.now()+timeout;
 while(Date.now()<deadline){
  const index=c.messages.findIndex(pred);
  if(index>=0)return c.messages.splice(index,1)[0];
  await delay(15);
 }
 throw Error('Timed out waiting for message; recent: '+JSON.stringify(c.messages.slice(-4)));
}
test('demo session: invite, stage restrictions and restart are server-authoritative',{timeout:25000},async()=>{
 const port=await freePort(),child=spawn(process.execPath,['server.js'],{
  cwd:path.join(__dirname,'..'),
  env:{...process.env,PORT:String(port),BETA_MAX_ROOMS:'16',SAVE_DIR:'',
   SUPABASE_URL:'',SUPABASE_SECRET_KEY:'',SUPABASE_SERVICE_ROLE_KEY:''},
  stdio:['ignore','pipe','pipe']
 });
 let host,guest;
 try{
  await Promise.race([once(child.stdout,'data'),delay(3500).then(()=>{throw Error('Server startup timeout');})]);
  host=await client(port);host.send({t:'hello',protocol:4});await receive(host,m=>m.t==='hello');
  // A malicious/future client requesting stage 122 must still start stage 0.
  host.send({t:'create',stage:122,demo:true});
  const joined=await receive(host,m=>m.t==='joined');
  assert.equal(joined.role,0);assert.match(joined.room,/^[A-HJ-NP-Z2-9]{6}$/);
  const initial=await receive(host,m=>m.t==='snapshot');
  assert.equal(initial.demo,true);assert.equal(initial.stage,0);
  guest=await client(port);guest.send({t:'hello',protocol:4});await receive(guest,m=>m.t==='hello');
  guest.send({t:'join',room:joined.room});
  const seated=await receive(guest,m=>m.t==='joined');assert.equal(seated.role,1);
  assert.equal((await receive(guest,m=>m.t==='snapshot')).demo,true);
  host.send({t:'start'});
  assert.equal((await receive(host,m=>m.t==='snapshot'&&m.phase==='playing')).demo,true);
  host.send({t:'selectStage',stage:9});
  const error=await receive(host,m=>m.t==='error');
  assert.match(error.message,/Демоверсия проходится по порядку/);
  host.send({t:'restart'});
  const restarted=await receive(host,m=>m.t==='snapshot'&&m.stage===0&&m.phase==='playing');
  assert.equal(restarted.demo,true);
  assert.equal(restarted.stage,0);
  // Cross-mode gameplay commands must not replace the curated first act, even
  // when sent by the legitimate host using a handcrafted WebSocket message.
  for(const payload of [
   {t:'v21GalleryPlay',actionId:'demo-gallery-1',id:'nonexistent'},
   {t:'v25Generate',actionId:'demo-generator-1',seed:123},
   {t:'v21Action',actionId:'demo-world-1',kind:'transform'},
   {t:'v23Action',actionId:'demo-world-2',kind:'phase'},
   {t:'coopAction',actionId:'demo-world-3',kind:'tether_attach'}
  ]){
    host.send(payload);
    const blocked=await receive(host,m=>m.t==='error');
    assert.match(blocked.message,/недоступна в демоверсии/,payload.t);
  }
  host.send({t:'resetStage'});
  const reset=await receive(host,m=>m.t==='snapshot'&&m.stage===0&&m.phase==='playing');
  assert.equal(reset.demo,true,'reset must preserve server-owned demo flag');
  // A second player reconnects with its original seat token and resumes the
  // exact same demo, rather than getting an unrelated full-campaign room.
  guest.ws.close();
  await receive(host,m=>m.t==='members'&&!m.connected[1]);
  const rejoinedClient=await client(port);
  guest=rejoinedClient;
  guest.send({t:'hello',protocol:4});await receive(guest,m=>m.t==='hello');
  guest.send({t:'join',room:joined.room,token:seated.token});
  assert.equal((await receive(guest,m=>m.t==='joined')).role,1);
  const resumed=await receive(guest,m=>m.t==='snapshot');
  assert.equal(resumed.demo,true);
  assert.equal(resumed.stage,0);
  assert.equal(resumed.phase,'playing');
 }finally{
  host?.ws.close();guest?.ws.close();child.kill();
 }
});
