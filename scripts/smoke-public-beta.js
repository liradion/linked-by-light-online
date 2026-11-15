#!/usr/bin/env node
'use strict';
// v22 read-only deployment verification; no room creation or load generation.
// Usage: node scripts/smoke-public-beta.js --url=https://linked-by-light-eu.onrender.com
const assert=require('node:assert/strict');
const urlArg=process.argv.find(s=>s.startsWith('--url='));
const target=(urlArg?urlArg.slice(6):process.env.SMOKE_BASE_URL||'https://linked-by-light-eu.onrender.com').replace(/\/$/,'');
const expectCommit=process.argv.find(s=>s.startsWith('--expect-commit='))?.slice('--expect-commit='.length);
const base=new URL(target);
if(base.protocol!=='https:'&&!(base.protocol==='http:'&&['localhost','127.0.0.1'].includes(base.hostname)))
 throw Error('Smoke check requires HTTPS unless running against localhost');
if(base.username||base.password||base.search||base.hash||base.pathname!=='/')
 throw Error('Provide only the server origin, not credentials or query strings');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function read(path){
 const r=await fetch(new URL(path,base),{signal:AbortSignal.timeout(13000),cache:'no-store'});
 if(!r.ok)throw Error(path+' => HTTP '+r.status);
 return r;
}
async function main(){
 let version;
 for(let attempt=1;attempt<=8;attempt++){
  try{version=await (await read('/version')).json();break;}
  catch(e){if(attempt===8)throw e;await delay(2500);}
 }
 assert.equal(version.version,'22.0.0','Render has not deployed v22 yet');
 assert.equal(version.protocol,3);
 if(expectCommit)assert.equal(String(version.commit||''),expectCommit.slice(0,12),
  'Deployed commit does not match expected revision');
 const health=await (await read('/health')).json();
 assert.equal(health.ok,true);
 const statusResponse=await read('/api/beta/status');
 assert.match(statusResponse.headers.get('content-type')||'',/application\/json/);
 assert.match(statusResponse.headers.get('cache-control')||'',/no-store/);
 const beta=await statusResponse.json();
 assert.equal(beta.version,'22.0.0');assert.equal(beta.beta,true);
 for(const path of ['/','/beta.js','/beta.css','/privacy.html','/terms.html','/shared/v21-stages.js']){
  const r=await read(path);
  assert.match(r.headers.get('x-content-type-options')||'',/nosniff/);
  if(path==='/'){
   const html=await r.text();
   assert.ok(html.includes('/beta.js?v=22'));
   assert.ok(html.includes('/client.js?v=22'));
  }
 }
 const result={ok:true,checkedAt:new Date().toISOString(),origin:base.origin,
  deployedVersion:version.version,commit:version.commit||null,
  beta:{capacityRooms:beta.roomCapacity,cloudConfigured:beta.cloudConfigured,
   diskConfigured:beta.diskConfigured,galleryModeration:beta.galleryModeration},
  note:'Read-only verification; gameplay on Windows/iPhone and cloud writes not tested'};
 console.log(JSON.stringify(result,null,2));
}
main().catch(e=>{console.error('DEPLOYMENT NOT VERIFIED: '+e.message);process.exitCode=1;});
