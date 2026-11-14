'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),net=require('node:net'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawn}=require('node:child_process');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function port(){return new Promise((resolve,reject)=>{const s=net.createServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{const num=s.address().port;s.close(()=>resolve(num));});});}
async function start(port,dir){const child=spawn(process.execPath,['server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT:String(port),SAVE_DIR:dir},stdio:['ignore','pipe','pipe']});
 await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Server start timeout')),2500);child.stdout.once('data',()=>{clearTimeout(timeout);resolve();});child.once('error',reject);});return child;}
async function open(p){const ws=new WebSocket(`ws://127.0.0.1:${p}/ws`);const messages=[];await new Promise((res,rej)=>{ws.addEventListener('open',res,{once:true});ws.addEventListener('error',rej,{once:true});});ws.addEventListener('message',e=>messages.push(JSON.parse(e.data)));return {ws,messages,send:x=>ws.send(JSON.stringify(x))};}
async function take(client,predicate){for(let i=0;i<150;i++){const k=client.messages.findIndex(predicate);if(k>=0)return client.messages.splice(k,1)[0];await delay(16);}throw Error('Expected packet not received: '+JSON.stringify(client.messages.slice(-2)));}
test('room and private role tokens survive restart on configured persistent disk', {timeout:15000},async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'linked-test-'));
 let child=null,host=null,guest=null,host2=null,guest2=null;
 try{
  const p=await port();child=await start(p,dir);host=await open(p);host.send({t:'create',stage:12,home:[{item:'sofa',slot:4}]});const creator=await take(host,x=>x.t==='joined');
  guest=await open(p);guest.send({t:'join',room:creator.room});const joined=await take(guest,x=>x.t==='joined');
  host.send({t:'start'});await take(host,x=>x.t==='snapshot'&&x.phase==='playing');
  child.kill('SIGTERM');await delay(300);if(!child.killed)child.kill('SIGKILL');host.ws.close();guest.ws.close();
  const saved=JSON.parse(fs.readFileSync(path.join(dir,'linked-light-rooms-v11.json'),'utf8'));
  assert.equal(saved.rooms[0].code,creator.room);assert.equal(saved.rooms[0].game.stage,12);
  const p2=await port();child=await start(p2,dir);host2=await open(p2);host2.send({t:'join',room:creator.room,token:creator.token});const recovered=await take(host2,x=>x.t==='joined');assert.equal(recovered.role,0);
  guest2=await open(p2);guest2.send({t:'join',room:creator.room,token:joined.token});const restored=await take(guest2,x=>x.t==='joined');assert.equal(restored.role,1);
  const s=await take(host2,x=>x.t==='snapshot');assert.equal(s.stage,12);
 }finally{for(const c of [host,guest,host2,guest2]){try{c?.ws.close();}catch(_){}}child?.kill('SIGKILL');fs.rmSync(dir,{recursive:true,force:true});}
});