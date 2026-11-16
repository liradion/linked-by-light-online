'use strict';
// Idempotent mutation acknowledgements survive reconnection and room checkpoints.
// State itself stays fully authoritative on the server.
const crypto=require('node:crypto');
const MAX_RESULTS=128;
const idValid=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,64}$/.test(id);
function fingerprint(message){
 const canonical=Object.fromEntries(Object.entries(message).filter(([k])=>k!=='actionId').sort(([a],[b])=>a.localeCompare(b)));
 return crypto.createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}
function clean(rows){
 const map=new Map();
 for(const item of (Array.isArray(rows)?rows:[]).slice(-MAX_RESULTS)){
  if(!idValid(item?.id)||typeof item.fingerprint!=='string'||!/^[a-f0-9]{64}$/.test(item.fingerprint)
    ||typeof item.ok!=='boolean')continue;
  const result={ok:item.ok};
  if(typeof item.detail==='string')result.detail=item.detail.slice(0,200);
  if(typeof item.error==='string')result.error=item.error.slice(0,200);
  map.set(item.id,{fingerprint:item.fingerprint,...result});
 }
 return map;
}
function lookup(cache,message){
 if(!idValid(message.actionId))return {error:'Некорректный идентификатор действия'};
 const existing=cache.get(message.actionId);
 if(!existing)return null;
 if(existing.fingerprint!==fingerprint(message))
  return {error:'Идентификатор действия уже относится к другой команде'};
 const {fingerprint:_,...result}=existing;
 return {...result,replayed:true};
}
function remember(cache,message,outcome){
 if(!idValid(message.actionId)||!outcome||typeof outcome.ok!=='boolean')return;
 const result={fingerprint:fingerprint(message),ok:outcome.ok};
 if(typeof outcome.detail==='string')result.detail=outcome.detail.slice(0,200);
 if(typeof outcome.error==='string')result.error=outcome.error.slice(0,200);
 cache.set(message.actionId,result);
 while(cache.size>MAX_RESULTS)cache.delete(cache.keys().next().value);
}
function exportResults(cache){
 return Array.from(cache||new Map(),([id,v])=>({id,...v})).slice(-MAX_RESULTS);
}
module.exports={MAX_RESULTS,idValid,fingerprint,clean,lookup,remember,exportResults};
