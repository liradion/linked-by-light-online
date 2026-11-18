'use strict';
// G3: Black-box process restart and tamper-recovery checks for v28 authority.
// Real Node server + real WebSocket clients; isolated temporary disk only.
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net');
const {spawn}=require('node:child_process');
const {once}=require('node:events');
const checkpoint=require('../room-checkpoint');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const root=path.resolve(__dirname,'..');

async function freePort(){
 return new Promise((resolve,reject)=>{
  const sock=net.createServer();
  sock.once('error',reject);
  sock.listen(0,'127.0.0.1',()=>{const port=sock.address().port;sock.close(()=>resolve(port));});
 });
}
async function launch(port,dir){
 const env={...process.env,PORT:String(port),SAVE_DIR:dir,BETA_MAX_ROOMS:'12',
  SUPABASE_URL:'',SUPABASE_SECRET_KEY:'',SUPABASE_SERVICE_ROLE_KEY:'',
  RENDER:'',RENDER_SERVICE_ID:'',RENDER_GIT_COMMIT:'',
  LL_REQUIRE_DURABLE_STORAGE:'0',LL_V27_ARCHIVE:'0'};
 const child=spawn(process.execPath,['server.js'],{cwd:root,env,stdio:['ignore','pipe','pipe']});
 let stderr='';
 child.stderr.on('data',b=>{stderr=(stderr+b.toString()).slice(-2000);});
 const deadline=Date.now()+6500;
 while(Date.now()<deadline){
  if(child.exitCode!==null)break;
  try{const res=await fetch('http://127.0.0.1:'+port+'/health');
   if(res.ok)return child;
  }catch(_){}
  await delay(35);
 }
 child.kill('SIGKILL');
 throw Error('Server boot failed: '+stderr);
}
async function stop(child){
 if(!child||child.exitCode!==null||child.signalCode!==null)return;
 const exited=once(child,'exit').catch(()=>{});
 child.kill('SIGTERM');
 await Promise.race([exited,delay(5500)]);
 if(child.exitCode===null&&child.signalCode===null)child.kill('SIGKILL');
}
async function connect(port){
 const ws=new WebSocket('ws://127.0.0.1:'+port+'/ws'),events=[];
 await new Promise((resolve,reject)=>{
  ws.addEventListener('open',resolve,{once:true});
  ws.addEventListener('error',reject,{once:true});
 });
 ws.addEventListener('message',event=>{
  try{events.push(JSON.parse(event.data));}catch(_){}
 });
 return {ws,events,send:obj=>ws.send(JSON.stringify(obj))};
}
async function receive(peer,predicate,timeout=4400){
 const until=Date.now()+timeout;
 while(Date.now()<until){
  const i=peer.events.findIndex(predicate);
  if(i!==-1)return peer.events.splice(i,1)[0];
  await delay(12);
 }
 throw Error('WebSocket packet not received; last types: '+JSON.stringify(peer.events.slice(-8).map(x=>x.t)));
}
async function close(peer){
 if(!peer||peer.ws.readyState===WebSocket.CLOSED)return;
 const closed=once(peer.ws,'close').catch(()=>{});
 peer.ws.close();
 await Promise.race([closed,delay(900)]);
}
function temp(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'linked-g3-v28-'));
 return {dir,file:path.join(dir,'linked-light-rooms-v11.json')};
}
function noSecrets(snapshot,...tokens){
 for(const token of tokens)assert.equal(JSON.stringify(snapshot).includes(token),false,'No seat tokens in shared snapshot');
 assert.equal(Object.hasOwn(snapshot,'v28Intel'),false);
}
test('G3: Echo host and Spark guest keep physical roles, ownership and private intel after server restart',{timeout:27000},async()=>{
 const {dir,file}=temp(),port=await freePort();
 let app,host,guest,spectator,afterHost,afterGuest,afterSpectator;
 try{
  app=await launch(port,dir);
  host=await connect(port);
  host.send({t:'hello',protocol:4});await receive(host,m=>m.t==='hello');
  host.send({t:'create',stage:123,hostRole:1,unlockedV23:['v23-01','v23-02']});
  const created=await receive(host,m=>m.t==='joined');
  assert.equal(created.role,1);assert.equal(created.hostRole,1);
  assert.deepEqual((await receive(host,m=>m.t==='v28Intel')).items.map(x=>x.id),['mirror']);
  guest=await connect(port);guest.send({t:'hello',protocol:4});
  guest.send({t:'join',room:created.room});
  const joined=await receive(guest,m=>m.t==='joined');
  assert.equal(joined.role,0);assert.equal(joined.hostRole,1);
  assert.deepEqual((await receive(guest,m=>m.t==='v28Intel')).items.map(x=>x.id),['source']);
  spectator=await connect(port);spectator.send({t:'hello',protocol:4});
  spectator.send({t:'join',room:created.room,spectate:true});
  assert.equal((await receive(spectator,m=>m.t==='joined')).role,-1);
  assert.equal(spectator.events.some(m=>m.t==='v28Intel'),false);
  guest.send({t:'start'});
  await delay(90);
  assert.equal(host.events.some(m=>m.t==='snapshot'&&m.phase==='playing'),false);
  host.send({t:'start'});
  const playing=await receive(host,m=>m.t==='snapshot'&&m.phase==='playing');
  assert.equal(playing.stage,123);noSecrets(playing,created.token,joined.token);

  await close(spectator);await close(guest);await close(host);
  await stop(app);app=null;
  const saved=checkpoint.load(file);
  assert.ok(saved,'Disk checkpoint must exist');
  assert.equal(saved.payload.version,11,'v11 room schema is preserved');
  const record=saved.payload.rooms.find(x=>x.code===created.room);
  assert.ok(record);
  assert.equal(record.hostRole,1);
  assert.equal(record.solo,false);
  assert.equal(record.game.stage,123);
  assert.equal(record.game.phase,'playing');

  app=await launch(port,dir);
  afterHost=await connect(port);afterHost.send({t:'hello',protocol:4});
  afterHost.send({t:'join',room:created.room,token:created.token});
  const recovered=await receive(afterHost,m=>m.t==='joined');
  assert.equal(recovered.role,1);assert.equal(recovered.hostRole,1);
  assert.deepEqual((await receive(afterHost,m=>m.t==='v28Intel')).items.map(x=>x.id),['mirror']);
  afterGuest=await connect(port);afterGuest.send({t:'hello',protocol:4});
  afterGuest.send({t:'join',room:created.room,token:joined.token});
  assert.equal((await receive(afterGuest,m=>m.t==='joined')).role,0);
  assert.deepEqual((await receive(afterGuest,m=>m.t==='v28Intel')).items.map(x=>x.id),['source']);
  afterSpectator=await connect(port);afterSpectator.send({t:'hello',protocol:4});
  afterSpectator.send({t:'join',room:created.room,spectate:true});
  assert.equal((await receive(afterSpectator,m=>m.t==='joined')).role,-1);
  assert.equal(afterSpectator.events.some(x=>x.t==='v28Intel'),false);
  const restored=await receive(afterHost,m=>m.t==='snapshot'&&m.phase==='playing');
  assert.equal(restored.stage,123);assert.equal(restored.hostRole,1);noSecrets(restored,created.token,joined.token);
  afterGuest.send({t:'selectStage',stage:122});
  await delay(130);
  assert.equal(afterHost.events.some(m=>m.t==='snapshot'&&m.stage===122),false,'Guest cannot select after restart');
  afterHost.send({t:'selectStage',stage:122});
  const advanced=await receive(afterGuest,m=>m.t==='snapshot'&&m.stage===122);
  assert.equal(advanced.hostRole,1,'Echo remains host after restart');
  assert.equal(afterSpectator.events.some(x=>x.t==='v28Intel'),false);
 }finally{
  for(const c of [host,guest,spectator,afterHost,afterGuest,afterSpectator])await close(c).catch(()=>{});
  await stop(app).catch(()=>{});
  fs.rmSync(dir,{recursive:true,force:true});
 }
});

test('G3: Echo-only solo room restores Spark active-role, movement and exclusive seat after restart',{timeout:25000},async()=>{
 const {dir,file}=temp(),port=await freePort();
 let app,host,rogue,restored,another;
 try{
  app=await launch(port,dir);
  host=await connect(port);host.send({t:'hello',protocol:4});
  host.send({t:'create',stage:0,hostRole:1,solo:true});
  const joined=await receive(host,m=>m.t==='joined');
  assert.deepEqual([joined.role,joined.hostRole,joined.soloActiveRole],[1,1,1]);
  host.send({t:'start'});
  await receive(host,m=>m.t==='snapshot'&&m.phase==='playing');
  host.send({t:'v28SoloSwitch',activeRole:0});
  const switched=await receive(host,m=>m.t==='snapshot'&&m.soloActiveRole===0&&m.phase==='playing');
  assert.equal(switched.solo,true);
  host.send({t:'input',inputSeq:1,right:true,left:false,jumpSeq:0,abilitySeq:0,bondSeq:0,emoteSeq:0});
  const moved=await receive(host,m=>m.t==='snapshot'&&m.tick>switched.tick+6);
  assert.ok(moved.players[0].x>switched.players[0].x,'Spark moves under solo input');
  rogue=await connect(port);rogue.send({t:'hello',protocol:4});
  rogue.send({t:'join',room:joined.room});
  assert.match((await receive(rogue,m=>m.t==='error')).message,/одиночном режиме/);

  await close(rogue);await close(host);
  await stop(app);app=null;
  const saved=checkpoint.load(file);assert.ok(saved);
  const record=saved.payload.rooms.find(x=>x.code===joined.room);assert.ok(record);
  assert.equal(record.hostRole,1);
  assert.equal(record.solo,true);
  assert.equal(record.soloActiveRole,0);
  assert.equal(record.seats[0],null,'No phantom second player is persisted');

  app=await launch(port,dir);
  restored=await connect(port);restored.send({t:'hello',protocol:4});
  restored.send({t:'join',room:joined.room,token:joined.token});
  const back=await receive(restored,m=>m.t==='joined');
  assert.deepEqual([back.role,back.hostRole,back.solo,back.soloActiveRole],[1,1,true,0]);
  const play=await receive(restored,m=>m.t==='snapshot'&&m.phase==='playing'&&m.soloActiveRole===0);
  assert.deepEqual(play.connected,[true,true],'Single seat emulates two in solo mode');
  assert.equal(play.stats.elapsed>=0,true);
  restored.send({t:'input',inputSeq:1,right:true,left:false,jumpSeq:0,abilitySeq:0,bondSeq:0,emoteSeq:0});
  const next=await receive(restored,m=>m.t==='snapshot'&&m.tick>play.tick+6);
  assert.ok(next.players[0].x>play.players[0].x,'Restored solo Spark still moves');
  another=await connect(port);another.send({t:'hello',protocol:4});
  another.send({t:'join',room:joined.room});
  assert.match((await receive(another,m=>m.t==='error')).message,/одиночном режиме/);
  restored.send({t:'v28SoloSwitch',activeRole:1});
  const echo=await receive(restored,m=>m.t==='snapshot'&&m.soloActiveRole===1);
  assert.equal(echo.hostRole,1,'Original Echo stays server owner');
 }finally{
  for(const c of [host,rogue,restored,another])await close(c).catch(()=>{});
  await stop(app).catch(()=>{});
  fs.rmSync(dir,{recursive:true,force:true});
 }
});

test('G3: corrupted primary journal and legacy snapshot restore verified backup without elevating room roles',{timeout:30000},async()=>{
 const {dir,file}=temp(),port=await freePort();
 let app,host,restored,third;
 try{
  app=await launch(port,dir);
  host=await connect(port);host.send({t:'hello',protocol:4});
  host.send({t:'create',hostRole:1,solo:true,stage:0});
  const joined=await receive(host,m=>m.t==='joined');
  host.send({t:'start'});
  await receive(host,m=>m.t==='snapshot'&&m.phase==='playing');
  host.send({t:'v28SoloSwitch',activeRole:0});
  await receive(host,m=>m.t==='snapshot'&&m.soloActiveRole===0);
  await close(host);await stop(app);app=null;

  // The second valid checkpoint creates a checksum-verified .bak generation.
  app=await launch(port,dir);
  restored=await connect(port);restored.send({t:'hello',protocol:4});
  restored.send({t:'join',room:joined.room,token:joined.token});
  await receive(restored,m=>m.t==='joined');
  await close(restored);await stop(app);app=null;
  assert.ok(fs.existsSync(file+'.v27.bak'),'Expected previous verified journal generation');

  // Simulate interrupted/tampered latest saves; do not write private data to logs.
  fs.writeFileSync(file+'.v27','{"format":"linked-light-room-checkpoint","schema":27,"sha256":"bad"}');
  fs.writeFileSync(file,'{"version":11,"rooms":[truncated');
  const candidate=checkpoint.load(file);
  assert.ok(candidate);
  assert.equal(candidate.source,file+'.v27.bak');
  app=await launch(port,dir);
  restored=await connect(port);restored.send({t:'hello',protocol:4});
  restored.send({t:'join',room:joined.room,token:joined.token});
  const recovered=await receive(restored,m=>m.t==='joined');
  assert.deepEqual([recovered.role,recovered.hostRole,recovered.soloActiveRole,recovered.solo],[1,1,0,true]);
  third=await connect(port);third.send({t:'hello',protocol:4});
  third.send({t:'join',room:joined.room});
  assert.match((await receive(third,m=>m.t==='error')).message,/одиночном режиме/);
  const snap=await receive(restored,m=>m.t==='snapshot');
  noSecrets(snap,joined.token);
  assert.equal(snap.hostRole,1);
 }finally{
  for(const c of [host,restored,third])await close(c).catch(()=>{});
  await stop(app).catch(()=>{});
  fs.rmSync(dir,{recursive:true,force:true});
 }
});
