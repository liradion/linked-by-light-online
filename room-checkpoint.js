'use strict';
// v27 checkpoint journal. v26's linked-light-rooms-v11.json remains fully
// readable: changing this module never changes the legacy profile or room schema.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const MAX_BYTES=8_000_000;
const LIMIT=200;
function validate(payload){
 if(!payload||typeof payload!=='object'||Array.isArray(payload)||payload.version!==11
   ||!Array.isArray(payload.rooms)||payload.rooms.length>LIMIT)return false;
 return payload.rooms.every(r=>r&&typeof r==='object'
   &&/^[A-HJ-NP-Z2-9]{6}$/.test(r.code||'')
   &&r.game&&Number.isInteger(r.game.stage)&&r.game.stage>=0&&r.game.stage<=136
   &&Array.isArray(r.seats)&&r.seats.length===2);
}
function digest(payload){return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');}
function wrap(payload,revision=1,now=Date.now()){
 if(!validate(payload))throw Error('Invalid legacy v11 checkpoint');
 return {format:'linked-light-room-checkpoint',schema:27,revision,createdAt:now,
  sha256:digest(payload),payload};
}
function unwrap(input){
 if(input?.format!=='linked-light-room-checkpoint'||input.schema!==27
  ||!Number.isSafeInteger(input.revision)||input.revision<1
  ||!Number.isSafeInteger(input.createdAt)||input.createdAt<0
  ||typeof input.sha256!=='string'||!/^[a-f0-9]{64}$/.test(input.sha256)
  ||!validate(input.payload)||digest(input.payload)!==input.sha256)throw Error('Checkpoint integrity failed');
 return input.payload;
}
function readCandidate(file,isEnvelope){
 const stat=fs.statSync(file);if(stat.size>MAX_BYTES)throw Error('Checkpoint is oversized');
 const data=JSON.parse(fs.readFileSync(file,'utf8'));
 const payload=isEnvelope?unwrap(data):data;
 if(!validate(payload))throw Error('Invalid checkpoint shape');
 return {payload,source:file,modifiedAt:stat.mtimeMs,revision:isEnvelope?data.revision:0};
}
function load(filename,warning=()=>{}){
 const items=[[filename+'.v27',true],[filename+'.v27.bak',true],[filename,false]];
 const candidates=[];
 for(const [file,envelope] of items)if(fs.existsSync(file)){
  try{candidates.push(readCandidate(file,envelope));}
  catch(err){warning({file:path.basename(file),error:err.message});}
 }
 // A newer v26 rollback may update the old snapshot after v27's journal.
 candidates.sort((a,b)=>b.modifiedAt-a.modifiedAt||b.revision-a.revision);
 return candidates[0]||null;
}
function atomicWrite(filename,value){
 const target=filename+'.'+process.pid+'.tmp';
 const data=JSON.stringify(value);
 if(Buffer.byteLength(data)>MAX_BYTES)throw Error('Checkpoint exceeds size limit');
 try{
  fs.writeFileSync(target,data,{encoding:'utf8',mode:0o600,flag:'w'});
  fs.renameSync(target,filename);
 }finally{try{fs.unlinkSync(target);}catch(_){}}
}
function save(filename,payload,now=Date.now()){
 if(!validate(payload))throw Error('Invalid checkpoint payload');
 fs.mkdirSync(path.dirname(filename),{recursive:true});
 const journal=filename+'.v27';
 let lastRevision=0;
 try{lastRevision=readCandidate(journal,true).revision;}catch(_){}
 const revision=lastRevision+1;
 if(fs.existsSync(journal)){
  try{
   readCandidate(journal,true);
   fs.copyFileSync(journal,journal+'.bak');
  }catch(_){} // Never overwrite the good previous backup with a corrupt primary.
 }
 // Keep a checksummed journal and v26-compatible legacy checkpoint on disk.
 atomicWrite(journal,wrap(payload,revision,now));
 atomicWrite(filename,payload);
 return {revision,sha256:digest(payload)};
}
module.exports={MAX_BYTES,validate,wrap,unwrap,load,save,digest};
