'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const net=require('node:net');
const {spawn}=require('node:child_process');
const {once}=require('node:events');
const checkpoint=require('../room-checkpoint');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function freePort(){return new Promise((res,rej)=>{
 const socket=net.createServer();
 socket.once('error',rej);
 socket.listen(0,'127.0.0.1',()=>{const {port}=socket.address();socket.close(()=>res(port));});
});}
async function openWs(port){
 const ws=new WebSocket('ws://127.0.0.1:'+port+'/ws'),messages=[];
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 ws.addEventListener('message',e=>{try{messages.push(JSON.parse(e.data));}catch(_){}});
 return {ws,messages,send:x=>ws.send(JSON.stringify(x))};
}
async function receive(client,predicate,timeout=6000){
 const until=Date.now()+timeout;
 while(Date.now()<until){
  const found=client.messages.findIndex(predicate);
  if(found!==-1)return client.messages.splice(found,1)[0];
  await delay(15);
 }
 throw Error('Expected socket event not received: '+JSON.stringify(client.messages.slice(-4)));
}
async function closeWs(client){
 if(!client||client.ws.readyState===WebSocket.CLOSED)return;
 client.ws.close();
 await Promise.race([once(client.ws,'close'),delay(1200)]);
}
async function stop(child){
 if(!child||child.exitCode!==null)return;
 child.kill('SIGTERM');
 await Promise.race([once(child,'exit'),delay(4500).then(()=>{child.kill('SIGKILL');})]);
}
test('G1: demo survives graceful server shutdown + v11 journal reload with both original seats',{timeout:24000},async()=>{
 const saveDir=fs.mkdtempSync(path.join(os.tmpdir(),'linked-light-demo-'));
 const port=await freePort(),filename=path.join(saveDir,'linked-light-rooms-v11.json');
 const env={...process.env,PORT:String(port),SAVE_DIR:saveDir,BETA_MAX_ROOMS:'8',
  SUPABASE_URL:'',SUPABASE_SECRET_KEY:'',SUPABASE_SERVICE_ROLE_KEY:'',
  LL_REQUIRE_DURABLE_STORAGE:'0',LL_V27_ARCHIVE:'0'};
 const start=async()=>{
  const child=spawn(process.execPath,['server.js'],{cwd:path.resolve(__dirname,'..'),env,stdio:['ignore','pipe','pipe']});
  await Promise.race([once(child.stdout,'data'),delay(4000).then(()=>{throw Error('Server startup timeout');})]);
  return child;
 };
 let serverA,serverB,host,guest;
 try{
  serverA=await start();
  host=await openWs(port);
  host.send({t:'hello',protocol:4});await receive(host,m=>m.t==='hello');
  host.send({t:'create',demo:true,stage:136});
  const created=await receive(host,m=>m.t==='joined');
  assert.equal((await receive(host,m=>m.t==='snapshot')).demo,true);
  guest=await openWs(port);
  guest.send({t:'hello',protocol:4});await receive(guest,m=>m.t==='hello');
  guest.send({t:'join',room:created.room});
  const joined=await receive(guest,m=>m.t==='joined');
  await receive(guest,m=>m.t==='snapshot'&&m.demo===true);
  host.send({t:'start'});
  await receive(host,m=>m.t==='snapshot'&&m.phase==='playing'&&m.demo===true);
  await closeWs(host);await closeWs(guest);
  await stop(serverA);serverA=null;
  const saved=checkpoint.load(filename);
  assert.ok(saved,'graceful shutdown must persist room');
  assert.equal(saved.payload.version,11,'room backup format must remain v11');
  const room=saved.payload.rooms.find(x=>x.code===created.room);
  assert.ok(room,'demo room must exist on disk');
  assert.equal(room.game.demo,true);
  assert.equal(room.game.stage,0);
  serverB=await start();
  host=await openWs(port);host.send({t:'hello',protocol:4});await receive(host,m=>m.t==='hello');
  host.send({t:'join',room:created.room,token:created.token});
  const restoredHost=await receive(host,m=>m.t==='joined');
  assert.equal(restoredHost.role,0);
  const restored=await receive(host,m=>m.t==='snapshot');
  assert.equal(restored.demo,true);
  assert.equal(restored.phase,'playing');
  assert.equal(restored.stage,0);
  guest=await openWs(port);guest.send({t:'hello',protocol:4});await receive(guest,m=>m.t==='hello');
  guest.send({t:'join',room:created.room,token:joined.token});
  assert.equal((await receive(guest,m=>m.t==='joined')).role,1);
  const synced=await receive(guest,m=>m.t==='snapshot');
  assert.equal(synced.demo,true);
  assert.equal(synced.stage,0);
 }finally{
  await closeWs(host).catch(()=>{});
  await closeWs(guest).catch(()=>{});
  await stop(serverA).catch(()=>{});
  await stop(serverB).catch(()=>{});
  fs.rmSync(saveDir,{recursive:true,force:true});
 }
});
