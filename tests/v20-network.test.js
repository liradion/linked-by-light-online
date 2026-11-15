'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process'),net=require('node:net'),path=require('node:path');
const sleep=t=>new Promise(resolve=>setTimeout(resolve,t));
async function freePort(){return new Promise((resolve,reject)=>{const s=net.createServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{const n=s.address().port;s.close(()=>resolve(n));});});}
async function socket(port){
 const ws=new WebSocket('ws://127.0.0.1:'+port+'/ws'),messages=[];
 ws.addEventListener('message',e=>{try{messages.push(JSON.parse(e.data));}catch(_){}});
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 return {ws,messages,send(obj){ws.send(JSON.stringify(obj));},close(){ws.close();}};
}
async function take(peer,predicate,timeout=4500){
 const deadline=Date.now()+timeout;
 while(Date.now()<deadline){const i=peer.messages.findIndex(predicate);if(i>=0)return peer.messages.splice(i,1)[0];await sleep(15);}
 throw Error('No expected WebSocket message; tail='+JSON.stringify(peer.messages.slice(-5)));
}
test('v20 real WebSocket room, actions, observer isolation and seat recovery',{timeout:16000},async()=>{
 const port=await freePort(),child=spawn(process.execPath,['server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});
 let a,b,c,rejoined;
 try{
  for(let attempt=0;attempt<80;attempt++){try{const res=await fetch('http://127.0.0.1:'+port+'/version');if(res.ok){const info=await res.json();assert.equal(info.version,'26.0.0');break;}}catch(_){}await sleep(50);}
  for(const asset of ['/shared/v20-stages.js','/v20.js','/v20.css']){
   const resp=await fetch('http://127.0.0.1:'+port+asset);
   assert.equal(resp.status,200,'asset must be served: '+asset);
   assert.ok((await resp.text()).length>200,'asset must not be empty: '+asset);
  }
  const page=await (await fetch('http://127.0.0.1:'+port+'/')).text();
  assert.ok(page.indexOf('/shared/v20-stages.js')<page.indexOf('/v20.js'));
  assert.ok(page.indexOf('/v20.js')<page.indexOf('/client.js?v=26'));
  a=await socket(port);a.send({t:'hello',protocol:2});a.send({t:'create',stage:100});const j=await take(a,m=>m.t==='joined');
  assert.equal(j.role,0);
  b=await socket(port);b.send({t:'hello',protocol:2});b.send({t:'join',room:j.room});const j2=await take(b,m=>m.t==='joined');
  assert.equal(j2.role,1);
  a.send({t:'start'});
  const live=await take(a,m=>m.t==='snapshot'&&m.phase==='playing'&&m.stage===100);
  assert.equal(live.world.v20.stageId,'v20-01');
  a.send({t:'coopAction',actionId:'attach-01',kind:'tether_attach'});
  assert.equal((await take(a,m=>m.t==='actionResult'&&m.actionId==='attach-01')).ok,true);
  assert.equal((await take(b,m=>m.t==='snapshot'&&m.world.v20?.tether?.active)).world.v20.tether.active,true);
  a.send({t:'coopAction',actionId:'attach-01',kind:'tether_attach'});
  assert.equal((await take(a,m=>m.t==='actionResult'&&m.actionId==='attach-01')).ok,false);
  a.send({t:'homeAction',actionId:'garden-1',kind:'shine'});
  assert.equal((await take(a,m=>m.t==='actionResult'&&m.actionId==='garden-1')).ok,true);
  b.send({t:'homeAction',actionId:'garden-2',kind:'reflect'});
  assert.equal((await take(b,m=>m.t==='actionResult'&&m.actionId==='garden-2')).ok,true);
  const home=await take(a,m=>m.t==='v20Home'&&m.home.garden.step===2);
  assert.equal(home.home.garden.step,2);
  c=await socket(port);c.send({t:'hello',protocol:2});c.send({t:'join',room:j.room,spectate:true});const watch=await take(c,m=>m.t==='joined');
  assert.equal(watch.role,-1);
  c.send({t:'homeAction',actionId:'illegal',kind:'flower'});
  await sleep(160);
  assert.equal(a.messages.some(m=>m.t==='v20Home'&&m.home.decor?.length),false);
  b.close();await sleep(90);
  rejoined=await socket(port);rejoined.send({t:'hello',protocol:2});rejoined.send({t:'join',room:j.room,token:j2.token});
  const jr=await take(rejoined,m=>m.t==='joined');assert.equal(jr.role,1);
  const state=await take(rejoined,m=>m.t==='snapshot'&&m.world?.v20);
  assert.equal(state.v20Home.garden.step,2);
  assert.equal(state.world.v20.tether.active,true);
 }finally{for(const s of [a,b,c,rejoined]){try{s?.close();}catch(_){}}child.kill('SIGTERM');}
});
