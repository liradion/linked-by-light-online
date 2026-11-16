'use strict';
// v28 opt-in-free, anonymous aggregate operational funnel.
// No IPs, room codes, action payloads, browser fingerprints or player tokens.
const N=137;
const EVENTS=['visit','roomCreated','partnerJoined','stageEntered','soloStarted','coopStarted','stageCompleted','playerDisconnected','playerRecovered','inviteOpened','inviteShared'];
const clamp=(n,min,max)=>Number.isInteger(n)?Math.max(min,Math.min(max,n)):min;
function createTelemetry(raw){
 const counters=Object.fromEntries(EVENTS.map(k=>[k,0]));
 const stages=new Array(N).fill(0),reached=new Array(N).fill(0),exits=new Array(N).fill(0);
 let activeDays=0,lastUtc='';
 const restore=v=>{
  if(!v||typeof v!=='object'||Array.isArray(v))return;
  for(const key of EVENTS)counters[key]=clamp(v.counters?.[key],0,10_000_000);
  for(let i=0;i<N;i++){stages[i]=clamp(v.stages?.[i],0,10_000_000);reached[i]=clamp(v.reached?.[i],0,10_000_000);exits[i]=clamp(v.exits?.[i],0,10_000_000);}
  activeDays=clamp(v.activeDays,0,999999);
  lastUtc=typeof v.lastUtc==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v.lastUtc)?v.lastUtc:'';
 };
 restore(raw);
 function record(event,stage){
  if(!Object.hasOwn(counters,event))return false;
  counters[event]=Math.min(10_000_000,counters[event]+1);
  if(Number.isInteger(stage)&&stage>=0&&stage<N){
   const target=event==='stageCompleted'?stages:event==='stageEntered'?reached:event==='playerDisconnected'?exits:null;
   if(target)target[stage]=Math.min(10_000_000,target[stage]+1);
  }
  const date=new Date().toISOString().slice(0,10);
  if(lastUtc!==date){lastUtc=date;activeDays++;}
  return true;
 }
 const snapshot=()=>({schema:28,counters:{...counters},stages:stages.slice(),reached:reached.slice(),exits:exits.slice(),activeDays,lastUtc});
 // Admin reads aggregated totals only; endpoint must remain auth-protected.
 return {record,snapshot,restore};
}
module.exports={createTelemetry,EVENTS};
