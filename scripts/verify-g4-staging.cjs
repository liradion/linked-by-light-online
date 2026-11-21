'use strict';
/* Read-only HTTP + WebSocket connectivity check against a separately provisioned
 * staging service. Never creates rooms, writes cloud data or calls production. */
const {URL}=require('node:url');
const PROD='linked-by-light-eu.onrender.com';
const shaPattern=/^[a-f0-9]{40}$/i;
function parseTarget(raw){
 if(typeof raw!=='string'||!raw)throw Error('Missing staging HTTPS URL');
 let url;try{url=new URL(raw);}catch(_){throw Error('Invalid staging HTTPS URL');}
 if(url.protocol!=='https:'||!url.hostname||url.username||url.password||
   url.pathname!=='/'||url.search||url.hash||url.port||
   url.hostname.toLowerCase()===PROD||
   /^(localhost|127(?:\.\d+){3}|0\.0\.0\.0|\[?::1\]?)$/i.test(url.hostname))
  throw Error('Only a separate staging HTTPS origin is allowed (never production)');
 return url;
}
function expectedCommit(value){
 if(typeof value!=='string'||!shaPattern.test(value))throw Error('Exact 40-digit commit SHA required');
 return value.toLowerCase().slice(0,12);
}
async function probe(raw,sha,timeoutMs=16000){
 const url=parseTarget(raw),commit=expectedCommit(sha);
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),timeoutMs);
 const result={origin:url.origin,expectedCommit:commit};
 try{
  async function get(path){
   const response=await fetch(new URL(path,url),{method:'GET',redirect:'error',cache:'no-store',signal:controller.signal});
   if(!response.ok)throw Error(path+' returned HTTP '+response.status);
   const raw=await response.text();
   if(raw.length>100000)throw Error(path+' response too large');
   if(path==='/version')return JSON.parse(raw);
   return response.status;
  }
  const version=await get('/version');
  if(version.protocol!==4||typeof version.commit!=='string'||version.commit!==commit)
   throw Error('Unexpected protocol or staging commit: expected '+commit);
  await get('/health');await get('/ready');
  result.version=version.version;result.protocol=version.protocol;
  result.commit=version.commit;result.health='ok';result.ready='ok';
  const destination=new URL(url.toString());destination.protocol='wss:';destination.pathname='/ws';
  await new Promise((resolve,reject)=>{
   const ws=new WebSocket(destination);
   const timer=setTimeout(()=>{ws.close();reject(Error('Staging WSS handshake timed out'));},timeoutMs);
   ws.addEventListener('open',()=>{clearTimeout(timer);ws.close();resolve();},{once:true});
   ws.addEventListener('error',()=>{clearTimeout(timer);ws.close();reject(Error('Staging WSS handshake failed'));},{once:true});
  });
  result.wss='handshake-ok';result.ok=true;return result;
 }finally{clearTimeout(timer);}
}
if(require.main===module){
 const arg=key=>{const val=process.argv.find(x=>x.startsWith('--'+key+'='));return val?val.slice(key.length+3):undefined;};
 probe(arg('url'),arg('expect-commit')).then(x=>{console.log(JSON.stringify(x,null,2));}).catch(e=>{console.error('G4 STAGING HOLD:',e.message);process.exitCode=1;});
}
module.exports={parseTarget,expectedCommit,probe};
