'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process'),net=require('node:net'),path=require('node:path');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const port=()=>new Promise((resolve,reject)=>{const srv=net.createServer();srv.once('error',reject);srv.listen(0,'127.0.0.1',()=>{const n=srv.address().port;srv.close(()=>resolve(n));});});
async function peer(n){
 const ws=new WebSocket('ws://127.0.0.1:'+n+'/ws'),messages=[];
 ws.addEventListener('message',e=>{try{messages.push(JSON.parse(e.data));}catch(_){}});
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 return {ws,messages,send:x=>ws.send(JSON.stringify(x)),close:()=>ws.close()};
}
async function next(client,match,limit=4000){
 const end=Date.now()+limit;
 while(Date.now()<end){const i=client.messages.findIndex(match);if(i!==-1)return client.messages.splice(i,1)[0];await sleep(15);}
 throw Error('Missing WebSocket event, last: '+JSON.stringify(client.messages.slice(-5)));
}
test('legacy server is authoritative when a guest forges an Echo-host claim',{timeout:15000},async()=>{
 const n=await port(),server=spawn(process.execPath,['server.js'],{
  cwd:path.resolve(__dirname,'..'),
  env:{...process.env,PORT:String(n),SAVE_DIR:'',SUPABASE_URL:'',SUPABASE_SECRET_KEY:'',SUPABASE_SERVICE_ROLE_KEY:''},
  stdio:['ignore','pipe','pipe']
 });
 let host,guest;
 try{
  let ready=false;
  for(let i=0;i<90;i++){try{const response=await fetch('http://127.0.0.1:'+n+'/version');if(response.ok){ready=true;assert.equal((await response.json()).protocol,4);break;}}catch(_){}await sleep(60);}
  assert.equal(ready,true);
  host=await peer(n);
  host.send({t:'hello',protocol:4});
  host.send({t:'create'});
  const h=await next(host,m=>m.t==='joined');
  assert.equal(h.role,0);
  guest=await peer(n);
  guest.send({t:'hello',protocol:4});
  guest.send({t:'join',room:h.room});
  const g=await next(guest,m=>m.t==='joined');
  assert.equal(g.role,1);

  // A malicious or broken frontend may claim its local isHost() is true.
  // The server must not trust any client supplied role/ownership hints.
  guest.send({t:'v24Action',actionId:'forged-recipe',kind:'recipe_select',value:1,hostRole:1,isHost:true});
  const rejectedRecipe=await next(guest,m=>m.t==='actionResult'&&m.actionId==='forged-recipe');
  assert.equal(rejectedRecipe.ok,false);
  guest.send({t:'v25Generate',actionId:'forged-seed',mode:'custom',seed:12345,hostRole:1,isHost:true});
  const rejectedSeed=await next(guest,m=>m.t==='actionResult'&&m.actionId==='forged-seed');
  assert.equal(rejectedSeed.ok,false);

  guest.send({t:'selectStage',stage:100,hostRole:1,isHost:true});
  guest.send({t:'start',hostRole:1,isHost:true});
  await sleep(200);
  assert.equal(host.messages.some(m=>m.t==='snapshot'&&m.stage===100),false,'guest cannot choose a chapter');
  assert.equal(host.messages.some(m=>m.t==='snapshot'&&m.phase==='playing'),false,'guest cannot start a game');

  host.send({t:'v24Action',actionId:'real-recipe',kind:'recipe_select',value:1});
  assert.equal((await next(host,m=>m.t==='actionResult'&&m.actionId==='real-recipe')).ok,true);
  host.send({t:'selectStage',stage:100});
  await next(host,m=>m.t==='snapshot'&&m.stage===100);
  host.send({t:'start'});
  await next(host,m=>m.t==='snapshot'&&m.stage===100&&m.phase==='playing');

  guest.send({t:'selectStage',stage:112,hostRole:1,isHost:true});
  await sleep(180);
  assert.equal(host.messages.some(m=>m.t==='snapshot'&&m.stage===112),false,'a guest cannot change the active chapter');
 }finally{
  for(const p of [host,guest])try{p?.close();}catch(_){}
  server.kill('SIGTERM');
 }
});
