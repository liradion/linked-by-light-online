'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const net=require('node:net');
const {spawn}=require('node:child_process');
const {once}=require('node:events');
function freePort(){return new Promise((resolve,reject)=>{
 const server=net.createServer();server.once('error',reject);server.listen(0,'127.0.0.1',()=>{const {port}=server.address();server.close(()=>resolve(port));});
});}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function openWs(port){const ws=new WebSocket(`ws://127.0.0.1:${port}/ws`),messages=[];
 await new Promise((res,rej)=>{ws.addEventListener('open',res,{once:true});ws.addEventListener('error',rej,{once:true});});
 ws.addEventListener('message',e=>messages.push(JSON.parse(e.data)));
 return {ws,messages,send:data=>ws.send(JSON.stringify(data))};
}
async function receive(c,fn,timeout=4000){const until=Date.now()+timeout;
 while(Date.now()<until){const n=c.messages.findIndex(fn);if(n!==-1)return c.messages.splice(n,1)[0];await delay(15);}
 throw Error('No matching WebSocket response: '+JSON.stringify(c.messages.slice(-2)));
}
test('две разные вкладки, авторитетное состояние и восстановление роли', {timeout:15_000},async()=>{
 const port=await freePort();const child=spawn(process.execPath,['server.js'],{cwd:require('node:path').join(__dirname,'..'),env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});
 let a,b,c;
 try{
   await Promise.race([once(child.stdout,'data'),delay(2000).then(()=>{throw Error('Server startup timeout');})]);
   a=await openWs(port);a.send({t:'create'});const creator=await receive(a,m=>m.t==='joined');
   assert.equal(creator.role,0);assert.equal(creator.room.length,6);
   b=await openWs(port);b.send({t:'join',room:creator.room});const partner=await receive(b,m=>m.t==='joined');
   assert.equal(partner.role,1);
   a.send({t:'start'});await receive(b,m=>m.t==='members'&&m.phase==='playing');
   const first=await receive(a,m=>m.t==='snapshot'&&m.phase==='playing');
   a.send({t:'input',right:true,jumpSeq:0,abilitySeq:0});b.send({t:'input',right:true,jumpSeq:0,abilitySeq:0});
   const after=await receive(a,m=>m.t==='snapshot'&&m.players[0].x>first.players[0].x+30&&m.players[1].x>first.players[1].x+30);
   const other=await receive(b,m=>m.t==='snapshot'&&m.tick===after.tick);
   assert.deepEqual(other.world,after.world);assert.deepEqual(other.players,after.players);
   b.ws.close();await receive(a,m=>m.t==='members'&&!m.connected[1]);
   a.messages.splice(0);const frozen=await receive(a,m=>m.t==='snapshot'&&!m.connected[1]);
   const frozenLater=await receive(a,m=>m.t==='snapshot'&&m.tick>frozen.tick+8);
   assert.deepEqual(frozenLater.players,frozen.players);
   c=await openWs(port);c.send({t:'join',room:creator.room,token:partner.token});const restored=await receive(c,m=>m.t==='joined');
   assert.equal(restored.role,1);assert.deepEqual(restored.connected,[true,true]);
 }finally{for(const peer of [a,b,c]){try{peer?.ws.close();}catch(_){}}child.kill('SIGTERM');}
});

test('room shares wardrobes and home edits; secret level requires eleven collected runes', {timeout:15_000},async()=>{
 const port=await freePort(),child=spawn(process.execPath,['server.js'],{cwd:require('node:path').join(__dirname,'..'),env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});
 let a,b,c;
 try{
  await Promise.race([once(child.stdout,'data'),delay(2000).then(()=>{throw Error('Server startup timeout');})]);
  a=await openWs(port);a.send({t:'create',stage:99,secrets:0,home:[{item:'lamp',slot:1}]});
  const room=await receive(a,m=>m.t==='joined');
  const snap=await receive(a,m=>m.t==='snapshot');
  assert.equal(snap.stage,98,'locked bonus must not be selectable without secrets');
  b=await openWs(port);b.send({t:'join',room:room.room});const guest=await receive(b,m=>m.t==='joined');
  assert.deepEqual(guest.home,[{item:'lamp',slot:1}]);
  b.send({t:'customize',skin:'galaxy',pet:'fox'});
  const outfit=await receive(a,m=>m.t==='looks'&&m.looks[1]?.skin==='galaxy');
  assert.deepEqual(outfit.looks[1],{skin:'galaxy',pet:'fox'});
  a.send({t:'home',items:[{item:'plant',slot:3},{item:'sofa',slot:8}]});
  const deco=await receive(b,m=>m.t==='home'&&m.items[0]?.item==='plant');
  assert.equal(deco.items[1].slot,8);
  c=await openWs(port);c.send({t:'create',stage:99,secrets:11});
  await receive(c,m=>m.t==='joined');const bonus=await receive(c,m=>m.t==='snapshot');
  assert.equal(bonus.stage,99,'bonus should be accessible with all eleven runes');
 }finally{for(const peer of [a,b,c]){try{peer?.ws.close();}catch(_){}}child.kill('SIGTERM');}
});

test('host can choose unlocked stages for both players without leaving their room', {timeout:15_000},async()=>{
 const port=await freePort(),child=spawn(process.execPath,['server.js'],{cwd:require('node:path').join(__dirname,'..'),env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});let a,b;
 try{
  await Promise.race([once(child.stdout,'data'),delay(2000).then(()=>{throw Error('Server startup timeout');})]);
  a=await openWs(port);a.send({t:'create',stage:20});const created=await receive(a,m=>m.t==='joined');
  b=await openWs(port);b.send({t:'join',room:created.room});await receive(b,m=>m.t==='joined');
  a.send({t:'start'});await receive(b,m=>m.t==='snapshot'&&m.phase==='playing');
  a.send({t:'selectStage',stage:5});const chosen=await receive(b,m=>m.t==='snapshot'&&m.stage===5);
  assert.equal(chosen.stage,5);assert.equal(chosen.phase,'playing');
  b.send({t:'selectStage',stage:60});
  a.send({t:'selectStage',stage:80});const denied=await receive(a,m=>m.t==='error'&&m.message.includes('открыт'));
  assert.ok(denied.message.includes('открыт'));
 }finally{for(const peer of [a,b])try{peer?.ws.close();}catch(_){}child.kill('SIGTERM');}
});