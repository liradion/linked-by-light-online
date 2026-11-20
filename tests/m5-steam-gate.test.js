'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {audit}=require('../scripts/audit-steam-prepayment.cjs');
const metadata=JSON.parse(fs.readFileSync(path.join(__dirname,'../steam/prepayment-metadata.json'),'utf8'));
const clone=()=>JSON.parse(JSON.stringify(metadata));
test('Steam pre-payment packet reports only content readiness, not actual onboarding',()=>{
 const r=audit(clone());
 assert.equal(r.status,'PREPAYMENT_CONTENT_PACKET_READY_FOR_OWNER_REVIEW');
 assert.deepEqual(r.errors,[]);
 assert.match(r.caveat,/No Steam login/);
});
test('Steam pre-payment gate fails closed on invented money/AppID, store review or legal release',()=>{
 for(const flip of [
  x=>{x.steamworks.feePaid=true;},
  x=>{x.steamworks.appId=123456;},
  x=>{x.steamworks.reviewRequested=true;},
  x=>{x.steamworks.comingSoonPublished=true;},
  x=>{x.publisher.rightsApproved=true;},
  x=>{x.artwork.clearedForStoreUse=true;},
  x=>{x.externalGate.g4Verified=true;},
  x=>{x.publisher.legalName='PRIVATE PERSON';},
  x=>{x.commercial.price=9.99;}
 ]){
  const x=clone();flip(x);assert.equal(audit(x).status,'BLOCKED');
 }
});
test('Steam metadata flags unsupported retail claims and leaves confidential fields null',()=>{
 assert.equal(metadata.publisher.legalName,null);
 assert.equal(metadata.steamworks.appId,null);
 assert.equal(metadata.commercial.releaseDate,null);
 for(const claim of ['Steam Friend Pass','Steam achievements','Steam Cloud','iOS native build']){
  assert.ok(metadata.excludeFromPublishedClaims.includes(claim));
 }
});
test('SteamPipe preview-only templates are deliberately unusable until partner ownership',()=>{
 const vdf=fs.readFileSync(path.join(__dirname,'../steam/steampipe/app_build.template.vdf'),'utf8');
 assert.match(vdf,/"AppID" "__STEAM_APP_ID__"/);
 assert.match(vdf,/"__STEAM_DEPOT_ID__"/);
 assert.match(vdf,/"Preview" "1"/);
 assert.doesNotMatch(vdf,/SteamGuard|login\s+"|password\s+"/i);
});
