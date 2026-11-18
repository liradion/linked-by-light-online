'use strict';
// Coalesced, strictly serialized cloud room checkpoints.
// A forced request during an in-flight write waits for a NEW snapshot after it.
// This prevents an older slow request from overwriting a newer acknowledged state.
function createCloudSaveQueue({capture,write,observe=()=>{}}){
 if(typeof capture!=='function'||typeof write!=='function')throw Error('Invalid cloud save queue');
 let active=null,pending=null,resolvePending=null;
 function start(){
  const started=performance.now();
  const work=Promise.resolve().then(()=>write(capture())).then(
   result=>{
    const ok=result!==false;
    try{observe(ok,performance.now()-started,null);}catch(_){}
    return ok;
   },
   error=>{
    try{observe(false,performance.now()-started,error);}catch(_){}
    return false;
   }
  );
  active=work;
  void work.then(()=>{
   if(active!==work)return;
   active=null;
   if(!pending)return;
   const resolve=resolvePending;
   pending=null;resolvePending=null;
   // Capture the latest snapshot after the previous remote write completes.
   const newer=start();
   void newer.then(resolve);
  });
  return work;
 }
 function save(force=false){
  if(!active)return start();
  if(!force)return active;
  if(!pending)pending=new Promise(resolve=>{resolvePending=resolve;});
  return pending;
 }
 return {save};
}
module.exports={createCloudSaveQueue};
