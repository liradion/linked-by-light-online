'use strict';
// Public Beta v22: anonymous aggregate diagnostics, consent-based feedback,
// bounded abuse protection and authenticated moderation. Never stores IPs,
// room invitations, player tokens, emails or browser fingerprints in reports.
const crypto=require('node:crypto');
const {monitorEventLoopDelay,performance}=require('node:perf_hooks');
const FEEDBACK_TYPES=new Set(['bug','idea','experience']);
const PLATFORM_TYPES=new Set(['windows','iphone','android','mac','other']);
const safeText=(value,max)=>typeof value==='string'
 ?value.normalize('NFC').replace(/[\u0000-\u001f\u007f-\u009f<>]/g,'').trim().slice(0,max):'';
const MAX_REPORTS=100;
const percentile=(values,p)=>{
 if(!values.length)return 0;
 const sorted=values.slice().sort((a,b)=>a-b);
 return Math.round(sorted[Math.min(sorted.length-1,Math.ceil(sorted.length*p)-1)]*100)/100;
};
const validToken=t=>typeof t==='string'&&t.length>=32&&t.length<=256;
const normalizeFeedback=(raw,now=Date.now())=>{
 if(!raw||typeof raw!=='object'||raw.consent!==true)return null;
 const kind=FEEDBACK_TYPES.has(raw.kind)?raw.kind:null;
 const message=safeText(raw.message,800);
 const platform=PLATFORM_TYPES.has(raw.platform)?raw.platform:'other';
 const stage=Number.isInteger(raw.stage)&&raw.stage>=0&&raw.stage<=136?raw.stage:null;
 const rating=Number.isInteger(raw.rating)&&raw.rating>=1&&raw.rating<=5?raw.rating:null;
 if(!kind||message.length<10||message.length>800)return null;
 return {id:crypto.randomBytes(8).toString('hex'),kind,message,platform,stage,rating,created:now};
};
const cleanFeedback=raw=>(Array.isArray(raw)?raw:[]).slice(-MAX_REPORTS).flatMap(entry=>{
 if(!entry||typeof entry!=='object'||!/^[a-f0-9]{16}$/.test(entry.id||'')
  ||!FEEDBACK_TYPES.has(entry.kind))return [];
 const message=safeText(entry.message,800);
 if(message.length<10)return [];
 return [{id:entry.id,kind:entry.kind,message,
  platform:PLATFORM_TYPES.has(entry.platform)?entry.platform:'other',
  rating:Number.isInteger(entry.rating)&&entry.rating>=1&&entry.rating<=5?entry.rating:null,
  stage:Number.isInteger(entry.stage)&&entry.stage>=0&&entry.stage<=136?entry.stage:null,
  created:Number.isFinite(entry.created)?entry.created:0}];
});
function createPublicBeta(options={}){
 const now=options.now||Date.now;
 const token=options.adminToken??process.env.LL_ADMIN_TOKEN??'';
 const adminEnabled=validToken(token);
 const maxRooms=Number.isInteger(options.maxRooms)&&options.maxRooms>=1&&options.maxRooms<=200
  ?options.maxRooms:200;
 const windows=new Map(),counters={
  wsAccepted:0,roomCreated:0,guestJoined:0,seatRecovered:0,stageCompleted:0,
  blockedCreates:0,blockedJoins:0,feedbackReceived:0,moderationApproved:0,
  moderationRejected:0,moderationFlagged:0
 };
 let feedback=[],start=now(),lastTickAt=0,lastTickDurations=[],tickIntervals=[];
 const lag=monitorEventLoopDelay({resolution:20});lag.enable();
 function record(key){
  if(Object.hasOwn(counters,key))counters[key]++;
 }
 function allow(scope,ip,limit,ms=60000){
  const id=scope+':'+String(ip||'unknown').slice(0,100);
  const t=now(),entry=windows.get(id)||{start:t,count:0};
  if(t-entry.start>=ms){entry.start=t;entry.count=0;}
  entry.count++;windows.set(id,entry);
  if(windows.size>1200)for(const [k,v] of windows)if(t-v.start>ms*2)windows.delete(k);
  return entry.count<=limit;
 }
 function tick(started,ended){
  const at=ended??performance.now();
  if(lastTickAt)tickIntervals.push(at-lastTickAt);
  lastTickAt=at;lastTickDurations.push(Math.max(0,at-started));
  if(tickIntervals.length>1200)tickIntervals.shift();
  if(lastTickDurations.length>1200)lastTickDurations.shift();
 }
 function admin(req){
  if(!adminEnabled)return false;
  const header=String(req.headers.authorization||'');
  if(!header.startsWith('Bearer '))return false;
  const supplied=header.slice(7);
  if(!validToken(supplied))return false;
  const a=Buffer.from(token),b=Buffer.from(supplied);
  return a.length===b.length&&crypto.timingSafeEqual(a,b);
 }
 function getStatus(rooms,storage={}){
  let players=0,activeRooms=0;
  for(const r of rooms.values()){
   const online=r.seats?.filter(s=>s?.online).length||0;
   players+=online;
   if(online)activeRooms++;
  }
  return {version:'26.0.0',beta:true,playersOnline:players,roomsOnline:activeRooms,
   roomCapacity:maxRooms,cloudConfigured:!!storage.cloudConfigured,
   diskConfigured:!!storage.diskConfigured,
   durableRooms:!!storage.cloudConfigured||!!storage.diskConfigured,
   galleryModeration:adminEnabled};
 }
 function getDiagnostics(rooms,storage={}){
  const publicStatus=getStatus(rooms,storage);
  return {...publicStatus,uptimeSec:Math.round((now()-start)/1000),
   totalRooms:rooms.size,feedbackCount:feedback.length,counters:{...counters},
   tickWorkP95Ms:percentile(lastTickDurations,.95),
   tickIntervalP95Ms:percentile(tickIntervals,.95),
   eventLoopDelayP95Ms:Math.round(lag.percentile(95)/1e6*100)/100,
   memoryRssMB:Math.round(process.memoryUsage().rss/1048576*100)/100};
 }
 function acceptFeedback(body){
  const entry=normalizeFeedback(body,now());if(!entry)return null;
  feedback.push(entry);if(feedback.length>MAX_REPORTS)feedback.shift();
  record('feedbackReceived');return {id:entry.id};
 }
 function restoreFeedback(items){feedback=cleanFeedback(items);}
 function feedbackBackup(){return feedback.slice();}
 function feedbackQueue(){return feedback.slice(-MAX_REPORTS).reverse();}
 function pendingGallery(gallery){
  return (gallery||[]).filter(x=>x.status==='pending'||x.status==='flagged')
   .slice(0,40).map(x=>({id:x.id,title:x.title,status:x.status,
    created:x.created,reports:x.reports?.length||0,platforms:x.blueprint?.platforms?.length||0}));
 }
 function moderateGallery(items,id,decision){
  if(!/^[a-f0-9]{12}$/.test(id||'')||!['approve','reject','hide'].includes(decision))return null;
  const found=(items||[]).find(x=>x.id===id);if(!found)return null;
  if(decision==='approve'){found.status='approved';found.hidden=false;found.reports=[];record('moderationApproved');}
  else{found.status='rejected';found.hidden=true;record('moderationRejected');}
  return {id:found.id,status:found.status};
 }
 return {adminEnabled,maxRooms,record,allow,tick,admin,getStatus,getDiagnostics,
  acceptFeedback,restoreFeedback,feedbackBackup,feedbackQueue,pendingGallery,moderateGallery};
}
module.exports={createPublicBeta,normalizeFeedback,cleanFeedback,percentile};
