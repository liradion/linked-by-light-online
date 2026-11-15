#!/usr/bin/env node
'use strict';
// Isolated Render-Free-class simulation. This never connects to public services.
// Real WebSocket connections; server runs in a separate 0.1-CPU / 512-MiB container.
const {performance}=require('node:perf_hooks');
const {randomBytes}=require('node:crypto');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const get=(key,defaultValue)=>process.argv.find(x=>x.startsWith('--'+key+'='))?.split('=').slice(1).join('=')??defaultValue;
const profile=get('profile','capacity');
const port=Number(get('port','43567')),outDir=path.resolve(get('out','artifacts/render-free'));
const seconds=Number(get('duration',profile==='unstable'?'25':'10'));
const warmup=Number(get('warmup','3')),hz=Number(get('input-hz','40'));
const counts=get('cases',profile==='unstable'?'20':'20,50,100,200,400').split(',').map(Number);
const uplink=Number(get('uplink-ms',profile==='unstable'?'75':'0'));
const downlink=Number(get('downlink-ms',profile==='unstable'?'75':'0'));
const jitter=Number(get('jitter-ms',profile==='unstable'?'30':'0'));
const loss=Number(get('input-loss-pct',profile==='unstable'?'2':'0'));
const outage=Number(get('outage-sec',profile==='unstable'?'10':'0'));
const token=process.env.LL_BENCH_TOKEN||'';
if(!['capacity','unstable'].includes(profile)||token.length<24||!Number.isInteger(port)||port<1000||port>65535)throw Error('Invalid benchmark profile/token/port');
if(!counts.length||counts.some(x=>x<2||x>400||x%2||!Number.isInteger(x)))throw Error('Use even counts 2..400');
if(!Number.isFinite(seconds)||seconds<5||seconds>180||warmup<0||warmup>15||hz<1||hz>40||loss<0||loss>20||uplink<0||downlink<0||jitter<0||outage<0||outage>30)throw Error('Invalid load parameters');
const pctl=(a,p)=>{if(!a.length)return null;const l=a.slice().sort((x,y)=>x-y);return Number(l[Math.min(l.length-1,Math.max(0,Math.ceil(l.length*p)-1))].toFixed(2));};
const waitFor=async(predicate,ms=18000,interval=30)=>{
 const start=performance.now();while(performance.now()-start<ms){if(predicate())return true;await delay(interval);}return false;
};
let clients=[],rooms=[],measure=false,samples=[],rtts=[],lostInputs=0,scheduled=0,pingTimer,phase='connecting',serverExited=false;
const rand=(i)=>{let n=Math.sin((i+1)*12.9898+performance.now()*.0001)*43758.5453;return n-Math.floor(n);};
function networkDelay(base){return Math.max(0,base+(rand(scheduled++)*2-1)*jitter);}
function newClient(index){
 return new Promise((resolve,reject)=>{
  const ws=new WebSocket('ws://127.0.0.1:'+port+'/ws'),c={
   index,ws,role:-2,token:'',room:'',lastTick:-1,phase:'connecting',snapshots:0,lastSnapshot:0,disconnections:0,
   rttLast:0,pending:[],inbox:[],inputSeq:0,nextInput:performance.now()+index%11*3,nextPing:performance.now()+index%53*13
  };
  c.send=(packet)=>{
   if(ws.readyState!==WebSocket.OPEN)return false;
   const queued=(packet.t==='input'||packet.t==='ping')&&uplink>0;
   if(packet.t==='input'&&loss>0&&rand(scheduled++)*100<loss){lostInputs++;return true;}
   if(queued){
    setTimeout(()=>{if(ws.readyState===WebSocket.OPEN&&ws.bufferedAmount<512000)ws.send(JSON.stringify(packet));},networkDelay(uplink));
   }else if(ws.bufferedAmount<512000)ws.send(JSON.stringify(packet));
   return true;
  };
  c.expect=(fn,ms=24000)=>new Promise((ok,no)=>{
   const n=c.inbox.findIndex(fn);
   if(n>=0){ok(c.inbox.splice(n,1)[0]);return;}
   const waiter={fn,ok,no};
   waiter.timer=setTimeout(()=>{c.pending=c.pending.filter(x=>x!==waiter);no(Error('Timeout waiting for event from client '+index));},ms);
   c.pending.push(waiter);
  });
  c.close=()=>ws.close();
  ws.addEventListener('close',()=>{
   c.disconnections++;
   for(const w of c.pending){clearTimeout(w.timer);w.no(Error('Disconnected during waiting event'));}
   c.pending=[];
  });
  function processPacket(raw){
   if(ws.readyState!==WebSocket.OPEN)return;
   let m;try{m=JSON.parse(raw);}catch(_){return;}
   if(m.t==='snapshot'){
    if(measure&&c.lastSnapshot>0&&index%17===0&&samples.length<15000)samples.push(performance.now()-c.lastSnapshot);
    c.lastSnapshot=performance.now();c.lastTick=m.tick;c.phase=m.phase;c.snapshots++;
   }else if(m.t==='pong'&&Number.isFinite(m.sent)){
    if(measure&&rtts.length<18000)rtts.push(performance.now()-m.sent);
   }
   const n=c.pending.findIndex(w=>w.fn(m));
   if(n>=0){const [w]=c.pending.splice(n,1);clearTimeout(w.timer);w.ok(m);}
   else if(m.t!=='snapshot'&&m.t!=='pong'&&c.inbox.length<30)c.inbox.push(m);
  }
  ws.addEventListener('message',e=>{
   const raw=e.data;
   if(downlink>0)setTimeout(()=>processPacket(raw),networkDelay(downlink));
   else processPacket(raw);
  });
  let settled=false;
  const timeout=setTimeout(()=>{if(!settled){settled=true;reject(Error('WebSocket connect timeout'));ws.close();}},24000);
  ws.addEventListener('open',()=>{
   if(!settled){settled=true;clearTimeout(timeout);resolve(c);}
  },{once:true});
  ws.addEventListener('error',()=>{
   if(!settled){settled=true;clearTimeout(timeout);reject(Error('WebSocket connect error'));}
  },{once:true});
 });
}
async function makeRoom(id){
 const h=await newClient(id*2);
 clients[id*2]=h;h.send({t:'hello',protocol:2});
 const a=h.expect(m=>m.t==='joined');h.send({t:'create',stage:100});
 const host=await a;if(host.role!==0||!host.room)throw Error('create failed');
 h.role=host.role;h.token=host.token;h.room=host.room;
 const g=await newClient(id*2+1);clients[id*2+1]=g;g.send({t:'hello',protocol:2});
 const b=g.expect(m=>m.t==='joined');g.send({t:'join',room:host.room});
 const guest=await b;
 if(guest.role!==1||guest.room!==host.room)throw Error('join failed');
 g.role=guest.role;g.token=guest.token;g.room=guest.room;
 h.send({t:'start'});
 rooms[id]={host:h,guest:g,code:host.room};
}
async function ramp(n){
 for(let from=rooms.length;from<n/2;from+=4){
  const count=Math.min(4,n/2-from);
  await Promise.all(Array.from({length:count},(_,i)=>makeRoom(from+i)));
 }
 if(clients.length!==n||rooms.length!==n/2)throw Error('Incorrect user/room count');
}
function sendInputs(){
 const now=performance.now();
 for(const c of clients){
  if(!c||c.ws.readyState!==WebSocket.OPEN)continue;
  if(now>=c.nextInput){
   c.nextInput=now+1000/hz;
   const right=(Math.floor(now/1500)+c.index)%2===0;
   c.send({t:'input',inputSeq:++c.inputSeq,left:!right,right,jumpSeq:0,abilitySeq:0,bondSeq:0,emoteSeq:0});
  }
  if(now>=c.nextPing){
   c.nextPing=now+1000;
   c.send({t:'ping',sent:performance.now()});
  }
 }
}
async function metric(reset=false){
 const response=await fetch('http://127.0.0.1:'+port+'/__bench'+(reset?'?reset=1':''),
  {headers:{'x-bench-token':token},signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error('Bench endpoint HTTP '+response.status);
 return response.json();
}
async function caseRun(n){
 await ramp(n);
 await delay(warmup*1000);
 for(const c of clients){c.snapshots=0;c.disconnections=0;c.lastSnapshot=0;}
 measure=false;samples=[];rtts=[];lostInputs=0;
 await metric(true);
 const start=performance.now();measure=true;phase='measuring';
 await delay(seconds*1000);measure=false;
 const secs=(performance.now()-start)/1000;
 const server=await metric();
 const snapshotHz=clients.map(c=>c.snapshots/secs);
 const disconnected=clients.reduce((a,c)=>a+c.disconnections,0);
 const data={
  players:n,rooms:server.rooms,activePlayers:server.activePlayers,playingRooms:server.playingRooms,
  seconds:Number(secs.toFixed(2)),inputHz:hz,serverCpuCorePct:server.cpuCorePct,
  serverCpuQuotaPct:10,serverRssMB:server.rssMB,serverHeapUsedMB:server.heapUsedMB,
  tickGapP95Ms:server.tickGapP95Ms,tickWorkP95Ms:server.tickWorkP95Ms,
  eventLoopDelayP95Ms:server.eventLoopDelayP95Ms,eventLoopDelayP99Ms:server.eventLoopDelayP99Ms,
  snapshotHzP05:pctl(snapshotHz,.05),snapshotHzMedian:pctl(snapshotHz,.5),
  rttP50Ms:pctl(rtts,.5),rttP95Ms:pctl(rtts,.95),
  snapshotGapP95Ms:pctl(samples,.95),samplesRtt:rtts.length,
  missedInputPackets:lostInputs,skippedServerSnapshots:server.skippedSnapshots,
  disconnected,connectedWithSnapshots:clients.filter(c=>c.snapshots>0&&c.ws.readyState===WebSocket.OPEN).length
 };
 data.passes=data.playingRooms===n/2&&data.connectedWithSnapshots===n&&disconnected===0&&
  data.snapshotHzP05>=25&&data.tickGapP95Ms<=25&&data.tickWorkP95Ms<=16.7;
 console.log('CASE '+JSON.stringify(data),{flush:true});
 return data;
}
async function recovery(){
 const targets=rooms.slice(0,Math.min(5,rooms.length));
 const initial=targets.map(x=>({room:x.code,tick:x.host.lastTick,index:x.guest.index,token:x.guest.token}));
 for(const r of targets)r.guest.close();
 await delay(outage*1000);
 let success=0,roleRestored=0,ticksResumed=0;
 for(let i=0;i<targets.length;i++){
  const old=targets[i].guest;
  const c=await newClient(old.index);
  clients[c.index]=c;c.send({t:'hello',protocol:2});
  const a=c.expect(m=>m.t==='joined');
  c.send({t:'join',room:initial[i].room,token:initial[i].token});
  const joined=await a;
  if(joined.room===initial[i].room)success++;
  if(joined.role===1&&joined.token===initial[i].token)roleRestored++;
  c.role=joined.role;c.token=joined.token;c.room=joined.room;
  targets[i].guest=c;
 }
 const ok=await waitFor(()=>targets.every((r,i)=>r.guest.lastTick>initial[i].tick&&r.host.lastTick>initial[i].tick),16000);
 if(ok)ticksResumed=targets.length;
 const report={expectedReconnects:targets.length,connected:success,rolesRestored:roleRestored,
  ticksResumed,secondsOffline:outage,pass:roleRestored===targets.length&&ticksResumed===targets.length};
 console.log('RECOVERY '+JSON.stringify(report));
 return report;
}
function writeReport(report){
 fs.mkdirSync(outDir,{recursive:true});
 const table=['| Игроки | Комнаты | CPU ядра, % | RAM, МБ | Тики p95, мс | Интервал p95, мс | Снимки p05, Гц | RTT p95, мс | Разрывы | Успех |',
 '|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|'];
 for(const d of report.cases)table.push('| '+[d.players,d.rooms,d.serverCpuCorePct,d.serverRssMB,d.tickWorkP95Ms,d.tickGapP95Ms,d.snapshotHzP05,d.rttP95Ms,d.disconnected,d.passes?'Да':'Нет'].join(' | ')+' |');
 const doc=['# Linked by Light — тест с ограничениями Render Free','',
 '> ЭМУЛЯЦИЯ: локальный Docker с жёсткой квотой 0,1 CPU и RAM 512 МБ, а не экземпляр Render. Не подтверждает реальную ёмкость Render.',
 '', 'Сетевой профиль: '+report.profile+', ввод: '+report.config.hz+' Гц, задержка отправки '+report.config.uplink+
 ' мс, задержка получения '+report.config.downlink+' мс, jitter ±'+report.config.jitter+
 ' мс, пропуск '+report.config.loss+'% игровых команд на уровне приложения.','',
 ...table,'',report.recovery?'Восстановление: '+JSON.stringify(report.recovery):'',
 '',report.error?'Ошибка: '+report.error:'',''];
 fs.writeFileSync(path.join(outDir,'report.json'),JSON.stringify(report,null,2));
 fs.writeFileSync(path.join(outDir,'report.md'),doc.join('\n'));
 console.log(doc.join('\n'));
}
async function main(){
 const report={timestamp:new Date().toISOString(),profile,environment:{node:process.version,
  runnerCpu:os.cpus()[0]?.model,availableCpus:os.availableParallelism?.()||os.cpus().length,
  note:'Container cgroup limit required: 100000us CPU per 1000000us, memory.max=536870912 bytes'},
  config:{counts,seconds,warmup,hz,uplink,downlink,jitter,loss,outage},cases:[],recovery:null,error:''};
 try{
  const ready=await waitFor(async()=>true,10); // initialize timer hooks
  void ready;
  const deadline=performance.now()+40000;
  let ok=false;
  while(performance.now()<deadline){
   try{const r=await fetch('http://127.0.0.1:'+port+'/health',{signal:AbortSignal.timeout(1500)});if(r.ok){ok=true;break;}}catch(_){}
   await delay(150);
  }
  if(!ok)throw Error('Isolated container health not available');
  const probe=await metric();
  if(!Number.isFinite(probe.tickGapP95Ms))throw Error('Metrics unavailable');
  pingTimer=setInterval(sendInputs,20);
  for(const n of counts){
   const c=await caseRun(n);report.cases.push(c);
   // Stop at the first failed point to protect the host test runner.
   if(!c.passes&&profile==='capacity')break;
  }
  if(profile==='unstable')report.recovery=await recovery();
 }catch(e){report.error=String(e?.stack||e);console.error(report.error);}
 finally{measure=false;clearInterval(pingTimer);for(const p of clients)if(p)try{p.close();}catch(_){}writeReport(report);}
 if(report.error)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
