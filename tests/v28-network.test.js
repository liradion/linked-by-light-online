'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process'),net=require('node:net'),path=require('node:path');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function port(){return new Promise((resolve,reject)=>{const s=net.createServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});}
async function server(p){
 const app=spawn(process.execPath,['server.js'],{cwd:path.resolve(__dirname,'..'),
  env:{...process.env,PORT:String(p),SAVE_DIR:'',SUPABASE_URL:'',SUPABASE_SECRET_KEY:'',SUPABASE_SERVICE_ROLE_KEY:'',LL_V27_ARCHIVE:'0',BETA_MAX_ROOMS:'8'},stdio:['ignore','pipe','pipe']});
 let logs='';app.stderr.on('data',b=>{logs=(logs+b.toString()).slice(-2000);});
 for(let i=0;i<130;i++){try{const r=await fetch('http://127.0.0.1:'+p+'/health');if(r.ok)return app;}catch(_){}await sleep(35);}
 app.kill();throw Error('Server startup: '+logs);
}
async function ws(p){
 const socket=new WebSocket('ws://127.0.0.1:'+p+'/ws'),msgs=[];
 socket.addEventListener('message',e=>{try{msgs.push(JSON.parse(e.data));}catch(_){}});
 await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
 return {socket,msgs,send:m=>socket.send(JSON.stringify(m)),close:()=>socket.close()};
}
async function take(c,fn,timeout=3500){
 const end=Date.now()+timeout;while(Date.now()<end){const index=c.msgs.findIndex(fn);if(index>=0)return c.msgs.splice(index,1)[0];await sleep(10);}
 throw Error('No matching message: '+JSON.stringify(c.msgs.slice(-8)));
}
test('v28 selected Echo host creates multiplayer room with Spark guest and role-only intel',{timeout:21000},async()=>{
 const p=await port(),app=await server(p);let a,b,observer;
 try{
  a=await ws(p);a.send({t:'hello',protocol:4});a.send({t:'v28Visit'});a.send({t:'create',hostRole:1,stage:123,unlockedV23:['v23-01','v23-02']});
  const joined=await take(a,m=>m.t==='joined');
  assert.equal(joined.role,1);assert.equal(joined.hostRole,1);assert.equal(joined.solo,false);
  const hint=await take(a,m=>m.t==='v28Intel');assert.deepEqual(hint.items.map(x=>x.id),['mirror']);
  b=await ws(p);b.send({t:'hello',protocol:4});b.send({t:'join',room:joined.room});
  const guest=await take(b,m=>m.t==='joined');assert.equal(guest.role,0);assert.equal(guest.hostRole,1);
  const spark=await take(b,m=>m.t==='v28Intel');assert.deepEqual(spark.items.map(x=>x.id),['source']);
  observer=await ws(p);observer.send({t:'hello',protocol:4});observer.send({t:'join',room:joined.room,spectate:true});
  const watch=await take(observer,m=>m.t==='joined');assert.equal(watch.role,-1);
  assert.equal(observer.msgs.some(m=>m.t==='v28Intel'),false);
  b.send({t:'start'});
  await sleep(100);
  assert.equal(a.msgs.some(m=>m.t==='snapshot'&&m.phase==='playing'),false,'Guest cannot start a host-owned room');
  a.send({t:'start'});
  await take(a,m=>m.t==='snapshot'&&m.phase==='playing');
  a.send({t:'v28Ping',kind:'help',x:300,y:440,token:'ignore-me'});
  const ping=await take(b,m=>m.t==='v28Ping'&&m.kind==='help');
  assert.equal(ping.role,1);assert.equal(ping.x,300);assert.equal(JSON.stringify(ping).includes('ignore-me'),false);
  assert.equal(observer.msgs.some(m=>m.t==='v28Ping'),false);
  a.send({t:'v28Ping',kind:'danger',x:100000,y:100});
  await sleep(100);assert.equal(b.msgs.some(m=>m.t==='v28Ping'&&m.kind==='danger'),false);
  const publicStatus=await (await fetch('http://127.0.0.1:'+p+'/api/beta/status')).text();
  assert.equal(publicStatus.includes('funnel'),false);
  assert.equal((await fetch('http://127.0.0.1:'+p+'/api/admin/v22/overview')).status,404);
 }finally{for(const c of [a,b,observer])try{c?.close();}catch(_){}app.kill();}
});
test('v28 solo is one authenticated seat controlling two simulated heroes, no second guest',{timeout:21000},async()=>{
 const p=await port(),app=await server(p);let a,b;
 try{
  a=await ws(p);a.send({t:'hello',protocol:4});a.send({t:'create',stage:0,hostRole:1,solo:true});
  const joined=await take(a,m=>m.t==='joined');
  assert.equal(joined.role,1);assert.equal(joined.solo,true);assert.equal(joined.soloActiveRole,1);
  b=await ws(p);b.send({t:'hello',protocol:4});b.send({t:'join',room:joined.room});
  assert.match((await take(b,m=>m.t==='error')).message,/одиночном режиме/);
  a.send({t:'start'});
  const game=await take(a,m=>m.t==='snapshot'&&m.phase==='playing');
  assert.equal(game.solo,true);assert.deepEqual(game.connected,[true,true]);
  const x1=game.players[1].x;
  a.send({t:'input',inputSeq:1,right:true,left:false,jumpSeq:0,abilitySeq:0,bondSeq:0,emoteSeq:0});
  await sleep(270);
  const move=await take(a,m=>m.t==='snapshot'&&m.tick>game.tick+8);
  assert.ok(move.players[1].x>x1,'Echo moves under server input');
  a.send({t:'v28SoloSwitch',activeRole:0});
  const switched=await take(a,m=>m.t==='snapshot'&&m.soloActiveRole===0);
  a.send({t:'input',inputSeq:2,right:true,left:false,jumpSeq:0,abilitySeq:0,bondSeq:0,emoteSeq:0});
  await sleep(250);
  const spark=await take(a,m=>m.t==='snapshot'&&m.tick>switched.tick+8);
  assert.ok(spark.players[0].x>100,'Spark moves after authoritative role switch');
  a.send({t:'v28SoloSwitch',activeRole:2});
  assert.match((await take(a,m=>m.t==='error')).message,/Недоступно/);
 }finally{for(const c of [a,b])try{c?.close();}catch(_){}app.kill();}
});
