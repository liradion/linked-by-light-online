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