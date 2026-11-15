#!/usr/bin/env node
'use strict';
// Linked by Light: isolated WebSocket 50/100/200/400-player capacity benchmark.
// Uses only localhost. Results DO NOT measure Render Free or geographic latency.
const {spawn}=require('node:child_process');
const {performance}=require('node:perf_hooks');
const {randomBytes}=require('node:crypto');
const {createServer}=require('node:net');
const os=require('node:os'),fs=require('node:fs'),path=require('node:path');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function option(name,fallback){return process.argv.find(x=>x.startsWith('--'+name+'='))?.split('=').slice(1).join('=')??fallback;}
const targets=option('cases','50,100,200,400').split(',').map(Number);
const duration=Number(option('duration','8')),warmup=Number(option('warmup','2')),inputHz=Number(option('input-hz','25'));
const outDir=path.resolve(option('out','artifacts'));
if(!targets.length||targets.some((n,i)=>!Number.isInteger(n)||n<2||n>400||n%2||(i&&n<=targets[i-1])))throw Error('cases must be increasing even numbers, max 400');
if(duration<3||duration>120||warmup<0||warmup>15||inputHz<1||inputHz>40)throw Error('Invalid benchmark options');
const percentile=(a,q)=>{if(!a.length)return null;const s=a.slice().sort((x,y)=>x-y);return Math.round(s[Math.max(0,Math.ceil(s.length*q)-1)]*100)/100;};
const fixed=n=>Math.round(n*100)/100;
let server,port,token,serverExited=false,serverLog='',timer,measuring=false,peers=[],rooms=[],rtt=[],intervals=[];
async function freePort(){return new Promise((resolve,reject)=>{const s=createServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});}
async function peer(index){
 const ws=new WebSocket('ws://127.0.0.1:'+port+'/ws');
 const p={ws,index,inbox:[],waiters:[],snapshots:0,disconnects:0,latestTick:0,lastSnapshot:0,
  inputSeq:0,nextInput:performance.now()+index%29*4,nextPing:performance.now()+index%97*12};
 p.send=m=>{if(ws.readyState===WebSocket.OPEN&&ws.bufferedAmount<500000){ws.send(JSON.stringify(m));return true;}return false;};
 p.wait=(predicate,ms=12000)=>new Promise((ok,no)=>{
  const found=p.inbox.findIndex(predicate);if(found>=0)return ok(p.inbox.splice(found,1)[0]);
  const w={predicate,ok,no};w.timer=setTimeout(()=>{p.waiters=p.waiters.filter(x=>x!==w);no(Error('timeout waiting room event, peer '+index));},ms);
  p.waiters.push(w);
 });
 p.close=()=>{try{ws.close();}catch(_){}};
 ws.addEventListener('message',event=>{
  let m;try{m=JSON.parse(event.data);}catch(_){return;}
  if(m.t==='snapshot'){
   p.snapshots++;p.latestTick=m.tick;
   const now=performance.now();
   if(measuring&&p.index%13===0&&p.lastSnapshot>0&&intervals.length<30000)intervals.push(now-p.lastSnapshot);
   p.lastSnapshot=now;
  }else if(m.t==='pong'&&Number.isFinite(m.sent)){
   if(measuring&&rtt.length<20000)rtt.push(Math.max(0,performance.now()-m.sent));
  }
  if(m.t==='snapshot'||m.t==='pong')return;
  const at=p.waiters.findIndex(w=>w.predicate(m));
  if(at>=0){const [w]=p.waiters.splice(at,1);clearTimeout(w.timer);w.ok(m);}
  else if(p.inbox.length<20)p.inbox.push(m);
 });
 ws.addEventListener('close',()=>{p.disconnects++;for(const w of p.waiters){clearTimeout(w.timer);w.no(Error('socket closed'));}p.waiters=[];});
 await new Promise((ok,no)=>{
  const t=setTimeout(()=>no(Error('open timeout')),12000);
  ws.addEventListener('open',()=>{clearTimeout(t);ok();},{once:true});
  ws.addEventListener('error',()=>{clearTimeout(t);no(Error('socket error'));},{once:true});
 });
 return p;
}
async function createPair(i){
 const host=await peer(i*2);peers.push(host);host.send({t:'hello',protocol:2});
 const one=host.wait(m=>m.t==='joined');
 host.send({t:'create',stage:100});const a=await one;
 if(!a.room||a.role!==0)throw Error('Invalid host room');
 const guest=await peer(i*2+1);peers.push(guest);guest.send({t:'hello',protocol:2});
 const two=guest.wait(m=>m.t==='joined');guest.send({t:'join',room:a.room});const b=await two;
 if(b.role!==1||b.room!==a.room)throw Error('Invalid guest room');
 host.send({t:'start'});rooms.push({code:a.room,host,guest});
}
async function increase(n){
 const count=n/2;
 for(let i=rooms.length;i<count;i+=8){
  if(serverExited)throw Error('Server exited during ramp');
  await Promise.all(Array.from({length:Math.min(8,count-i)},(_,k)=>createPair(i+k)));
  await sleep(20);
 }
 if(rooms.length!==count||peers.length!==n)throw Error('Room and user count mismatch');
}
function inputs(){
 const now=performance.now(),step=1000/inputHz;
 for(const p of peers){
  if(p.ws.readyState!==WebSocket.OPEN)continue;
  if(now>=p.nextInput){
   p.nextInput=now+step;const right=(Math.floor(now/1400)+p.index)%2===0;
   p.send({t:'input',inputSeq:++p.inputSeq,left:!right,right,
    jumpSeq:0,abilitySeq:0,bondSeq:0,emoteSeq:0});
  }
  if(now>=p.nextPing){p.nextPing=now+1000;p.send({t:'ping',sent:performance.now()});}
 }
}
async function admin(reset=false){
 const r=await fetch('http://127.0.0.1:'+port+'/__bench'+(reset?'?reset=1':''),
  {headers:{'x-bench-token':token},signal:AbortSignal.timeout(12000)});
 if(!r.ok)throw Error('Benchmark metrics endpoint HTTP '+r.status);
 return r.json();
}
async function healthy(){
 for(let i=0;i<180;i++){
  if(serverExited)throw Error('Server exited: '+serverLog.slice(-1500));
  try{const r=await fetch('http://127.0.0.1:'+port+'/health',{signal:AbortSignal.timeout(500)});if(r.ok)return;}catch(_){}
  await sleep(50);
 }
 throw Error('Server health timed out: '+serverLog.slice(-1500));
}
async function run(n){
 await increase(n);await sleep(warmup*1000);
 for(const p of peers){p.snapshots=0;p.disconnects=0;p.lastSnapshot=0;}
 rtt=[];intervals=[];await admin(true);
 const start=performance.now(),cpu=process.cpuUsage();measuring=true;
 await sleep(duration*1000);measuring=false;
 const elapsed=(performance.now()-start)/1000,stats=await admin();
 const hz=peers.map(p=>p.snapshots/elapsed),alive=peers.filter(p=>p.snapshots>0&&p.ws.readyState===WebSocket.OPEN).length;
 const disconnected=peers.reduce((a,p)=>a+p.disconnects,0),usage=process.cpuUsage(cpu);
 const x={
  players:n,rooms:stats.rooms,playingRooms:stats.playingRooms,activePlayers:stats.activePlayers,
  durationSec:fixed(elapsed),inputsHz:inputHz,snapshotHzMedian:percentile(hz,.5),
  snapshotHzP05:percentile(hz,.05),snapshotHzP95:percentile(hz,.95),
  rttMsP50:percentile(rtt,.5),rttMsP95:percentile(rtt,.95),
  snapshotGapMsP95:percentile(intervals,.95),rttSamples:rtt.length,
  serverCpuCorePct:stats.cpuCorePct,serverRssMB:stats.rssMB,serverHeapMB:stats.heapUsedMB,
  serverEventLoopP95Ms:stats.eventLoopDelayP95Ms,serverEventLoopP99Ms:stats.eventLoopDelayP99Ms,
  serverTickWorkP95Ms:stats.tickWorkP95Ms,serverTickGapP95Ms:stats.tickGapP95Ms,
  serverSnapshotBatches:stats.broadcastFrames,skippedSnapshotFrames:stats.skippedSnapshots,
  clientCpuCorePct:fixed(((usage.user+usage.system)/1000)/(elapsed*1000)*100),
  clientRssMB:fixed(process.memoryUsage().rss/1048576),
  alive,disconnected
 };
 x.meetsCiTarget=alive===n&&disconnected===0&&stats.playingRooms===n/2
  &&stats.tickGapP95Ms<=25&&stats.tickWorkP95Ms<=16.7&&x.snapshotHzMedian>=25;
 console.log('CASE '+JSON.stringify(x));return x;
}
function markdown(results,error,environment){
 const names=['Игроки','Комнаты','CPU сервера, % ядра','RAM, МБ','Время тика p95, мс','Интервал тиков p95, мс','Снимки, Гц медиана','RTT p95, мс','Пропуск снимков','Цель CI'];
 const rows=['| '+names.join(' | ')+' |','|'+names.map(()=>'---').join('|')+'|'];
 for(const r of results)rows.push('| '+[r.players,r.rooms,r.serverCpuCorePct,r.serverRssMB,
  r.serverTickWorkP95Ms,r.serverTickGapP95Ms,r.snapshotHzMedian,r.rttMsP95??'—',
  r.skippedSnapshotFrames,r.meetsCiTarget?'Да':'Нет'].join(' | ')+' |');
 return '# Linked by Light — изолированный нагрузочный тест\n\n'+
  '> Сценарии запущены на localhost в CI. Нельзя переносить результаты напрямую на Render Free, реальный iPhone или задержки между городами.\n\n'+
  '- Node '+environment.node+', CPU '+environment.cpuModel+', логических CPU '+environment.logicalCpus+'\n'+
  '- Длительность '+duration+' с на сценарий, прогрев '+warmup+' с; ввод '+inputHz+' пакетов/с на игрока.\n\n'+rows.join('\n')+'\n\n'+
  'Критерии: 100% клиентов получают снимки и сохраняют соединение, все комнаты активны, p95 интервала ≤25 мс, p95 времени игрового цикла ≤16,7 мс, медиана снимков ≥25 Гц.\n\n'+
  (error?'**Сбой:** '+error.slice(0,700)+'\n':'');
}
async function main(){
 if(typeof WebSocket!=='function')throw Error('Node.js 22+ with WebSocket required');
 fs.mkdirSync(outDir,{recursive:true});
 token=randomBytes(32).toString('hex');port=await freePort();
 // Never carry production persistence / connected-account credentials into a test.
 const env={...process.env,PORT:String(port),LL_BENCH_TOKEN:token,SAVE_DIR:'',
  SUPABASE_URL:'',SUPABASE_SECRET_KEY:'',SUPABASE_SERVICE_ROLE_KEY:'',DATABASE_URL:''};
 server=spawn(process.execPath,['server.js'],{cwd:path.resolve(__dirname,'..'),env,stdio:['ignore','pipe','pipe']});
 server.once('exit',()=>{serverExited=true;});
 server.stdout.on('data',b=>{serverLog=(serverLog+b.toString()).slice(-12000);});
 server.stderr.on('data',b=>{serverLog=(serverLog+b.toString()).slice(-12000);});
 const results=[],startedAt=new Date().toISOString(),environment={
  node:process.version,cpuModel:os.cpus()[0]?.model,logicalCpus:os.availableParallelism?.()||os.cpus().length,
  totalRamGB:fixed(os.totalmem()/1073741824),platform:process.platform
 };
 let error='';
 try{await healthy();timer=setInterval(inputs,10);for(const n of targets)results.push(await run(n));}
 catch(e){error=String(e?.stack||e);console.error(error);}
 finally{measuring=false;clearInterval(timer);for(const p of peers)p.close();server?.kill('SIGTERM');}
 fs.writeFileSync(path.join(outDir,'load-test.json'),JSON.stringify({
  timestamp:startedAt,environment,targets,duration,warmup,inputHz,results,error,scope:'localhost GitHub runner, NOT Render Free'
 },null,2));
 const md=markdown(results,error,environment);
 fs.writeFileSync(path.join(outDir,'load-test.md'),md);
 console.log('\n'+md);
 if(error)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
