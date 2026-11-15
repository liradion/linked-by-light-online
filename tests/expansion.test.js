'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const expansion=require('../expansion-core');
const {createGame,initStage,updateInput,tick,snapshot}=require('../game-core');
const {stages}=require('../shared/stages');
const net=require('node:net'),{spawn}=require('node:child_process'),{once}=require('node:events');
const path=require('node:path'),fs=require('node:fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
test('living worlds have deterministic weather and preserve the tutorial physics',()=>{
 const g=createGame();g.phase='playing';
 assert.equal(g.expansion.kind,'clear');
 for(let i=0;i<60;i++)tick(g,[true,true]);
 assert.equal(g.expansion.wind,0);
 initStage(g,9);assert.equal(g.expansion.kind,'wind');
 for(let i=0;i<35;i++)tick(g,[true,true]);
 assert.ok(Number.isFinite(g.expansion.wind));
 assert.ok(Math.abs(g.expansion.wind)<=43.1);
 assert.equal(snapshot(g,[true,true]).world.expansion.kind,'wind');
 initStage(g,99);assert.equal(g.expansion.kind,'clear');
});
test('cooperative resonance only activates after two distinct nearby abilities',()=>{
 const g=createGame();g.phase='playing';g.players[0].x=90;g.players[1].x=150;
 updateInput(g,0,{inputSeq:1,abilitySeq:1});
 tick(g,[true,true]);assert.equal(g.expansion.duets,0);
 updateInput(g,1,{inputSeq:1,abilitySeq:1});tick(g,[true,true]);
 assert.equal(g.expansion.duets,1);assert.ok(g.adventure.bond.shield>1.5);
 assert.equal(g.stats.duets,1);
 updateInput(g,0,{inputSeq:2,abilitySeq:2});tick(g,[true,false]);
 assert.equal(g.expansion.duets,1,'no processing when second player offline');
});
test('level builder checks geometry and does not modify 100 campaign levels',()=>{
 const bad={v:1,title:'Escape',platforms:[{x:-1,y:400,w:100}]};
 assert.equal(expansion.cleanBlueprint(bad),null);
 assert.equal(expansion.cleanBlueprint({v:1,title:'',platforms:[]}),null);
 assert.equal(expansion.cleanBlueprint({v:1,title:'OK',platforms:Array.from({length:9},()=>({x:250,y:400,w:80}))}),null);
 const raw={v:1,title:'Два маяка',platforms:[{x:240,y:448,w:100,h:9999}]};
 const good=expansion.cleanBlueprint(raw);
 assert.deepEqual(good.platforms[0],{x:240,y:448,w:100,h:16});
 const g=createGame();assert.equal(expansion.applyBlueprint(g,raw),true);
 assert.equal(g.customChallenge,true);assert.equal(g.level.title,'Два маяка');
 assert.equal(g.level.platforms.length,1);assert.equal(g.level.signature.done,true);
 assert.equal(g.level.gateOpen,false,'custom maps cannot grant exit');
 assert.equal(stages[0].title,'Первый контакт','campaign template untouched');
});
test('room note limits and three deterministic endings',()=>{
 assert.equal(expansion.cleanNote('  '),null);
 assert.equal(expansion.cleanNote('hello\u0003 world'),'hello world');
 assert.equal(expansion.cleanNote('x'.repeat(500)).length,160);
 const room={game:{stats:{hearts:0}},storyChoices:{}};
 assert.equal(expansion.endingFor(room).kind,'dawn');
 room.game.stats.hearts=3;assert.equal(expansion.endingFor(room).kind,'promise');
 room.storyChoices={0:0,1:1,2:0,3:1,4:1};assert.equal(expansion.endingFor(room).kind,'aurora');
});
test('browser expansion is loaded before client and supports touch and secure text content',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
 const client=fs.readFileSync(path.join(__dirname,'../public/client.js'),'utf8');
 const ui=fs.readFileSync(path.join(__dirname,'../public/expansion-ui.js'),'utf8');
 assert.ok(html.indexOf('/expansion-ui.js?v=19')<html.indexOf('/client.js?v=19'));
 assert.match(client,/GameExpansion\.onSnapshot\(s\)/);
 assert.match(ui,/textContent=text/);
 assert.match(ui,/canvas\.addEventListener\('click'/);
 assert.match(ui,/GameExpansion=\{init/);
});
async function freePort(){return new Promise((resolve,reject)=>{
 const s=net.createServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});
});}
async function socket(port){const ws=new WebSocket('ws://127.0.0.1:'+port+'/ws'),messages=[];
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 ws.addEventListener('message',e=>{try{messages.push(JSON.parse(e.data));}catch(_){}});return{ws,messages,send:o=>ws.send(JSON.stringify(o))};
}
async function take(peer,filter,wait=4000){const end=Date.now()+wait;while(Date.now()<end){
 const index=peer.messages.findIndex(filter);if(index>=0)return peer.messages.splice(index,1)[0];await sleep(12);
}throw Error('No message: '+JSON.stringify(peer.messages.slice(-2)));}
test('two real WebSocket players share authored room, notes and quick signals',{timeout:13000},async()=>{
 const port=await freePort(),env={...process.env,PORT:String(port)};
 delete env.SUPABASE_URL;delete env.SUPABASE_SECRET_KEY;delete env.SUPABASE_SERVICE_ROLE_KEY;
 const child=spawn(process.execPath,['server.js'],{cwd:path.join(__dirname,'..'),env,stdio:['ignore','pipe','pipe']});let a,b;
 try{
  await Promise.race([once(child.stdout,'data'),sleep(2500).then(()=>{throw Error('start timeout')})]);
  a=await socket(port);
  const blueprint={v:1,title:'Мы вместе',platforms:[{x:350,y:440,w:110}]};
  a.send({t:'create',stage:0,blueprint});
  const joined=await take(a,m=>m.t==='joined');
  const state=await take(a,m=>m.t==='snapshot'&&m.customLevel);
  assert.equal(state.customLevel.title,blueprint.title);
  b=await socket(port);b.send({t:'join',room:joined.room});const j2=await take(b,m=>m.t==='joined');
  assert.equal(j2.role,1);
  a.send({t:'note',text:'Привет из нашей игры ❤️'});
  const note=await take(b,m=>m.t==='note');
  assert.equal(note.note.text,'Привет из нашей игры ❤️');
  b.send({t:'quick',kind:'heart'});
  assert.equal((await take(a,m=>m.t==='quick')).kind,'heart');
  a.send({t:'start'});
  const begin=await take(b,m=>m.t==='snapshot'&&m.phase==='playing');
  assert.equal(begin.customLevel.title,blueprint.title);
  assert.equal(begin.world.expansion.kind,'clear');
  a.send({t:'note',text:''});
  assert.match((await take(a,m=>m.t==='error')).message,/Записка/);
  b.ws.close();await sleep(100);
  const again=await socket(port);
  try{again.send({t:'join',room:joined.room,token:j2.token});
   const restored=await take(again,m=>m.t==='joined');
   assert.equal(restored.notes.length,1,'notes restored on reconnect');
  }finally{again.ws.close();}
 }finally{try{a?.ws.close();b?.ws.close();}catch(_){}child.kill('SIGTERM');}
});
