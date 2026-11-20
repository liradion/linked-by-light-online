'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const required=['store-header','store-small','store-main','store-vertical','library-capsule',
 'library-hero','library-logo','library-header','shortcut-icon','app-icon'];
function audit(metadata){
 const m=metadata||{},errors=[];
 const check=(ok,msg)=>{if(!ok)errors.push(msg);};
 check(m.schemaVersion===1,'Unexpected schema version');
 check(m.title==='Linked by Light','Product title is absent or unexpectedly changed');
 check(m.titleRu==='Связанные светом','Russian title missing');
 for(const language of ['ru','en'])check(
  typeof m.shortDescription?.[language]==='string'&&m.shortDescription[language].length>=80,
  'Short store copy needs human editorial review: '+language);
 check(m.contentStatus==='DRAFT_NOT_PUBLISHED','Cannot mark a store product published');
 check(m.serverRequired===true,'Do not advertise an offline-only game');
 check(m.steamworks?.feePaid===false,'Payment status must not be fabricated');
 check(m.steamworks?.appId===null,'No App ID before documented Steam onboarding');
 check(m.steamworks?.reviewRequested===false,'No Valve review requested');
 check(m.steamworks?.comingSoonPublished===false,'Coming Soon has not been published');
 check(m.publisher?.rightsApproved===false,'Rights have not passed legal review');
 check(m.artwork?.clearedForStoreUse===false,'Draft graphics are not cleared for store');
 check(m.externalGate?.g4Verified===false&&m.externalGate?.g5Verified===false,
  'Do not assert real beta/Steam release gates from prepayment media');
 check(m.commercial?.price===null&&m.commercial?.releaseDate===null,
  'Never invent Steam price or launch date');
 check(m.publisher?.legalName===null,'Keep private legal identity out of repository');
 check(m.publisher?.supportContact===null,'Do not invent unverified publisher contact');
 for(const file of ['docs/STORE_COPY_RU_EN.md','docs/RELEASE_CHECKLIST.md',
  'steam/STEAM_DIRECT_BEFORE_PAYMENT_RU.md','scripts/generate-steam-concepts.cjs',
  'e2e/steam-prepayment-capture.spec.cjs']){
  check(fs.existsSync(path.join(root,file)),'Missing preparation source: '+file);
 }
 const formats=require('./generate-steam-concepts.cjs').FORMATS;
 check(required.every(key=>formats.some(x=>x.id===key)),'Missing official standard image slots');
 check((m.excludeFromPublishedClaims||[]).includes('Steam Friend Pass'),'Friend Pass claim must be withheld');
 return {status:errors.length?'BLOCKED':'PREPAYMENT_CONTENT_PACKET_READY_FOR_OWNER_REVIEW',
  errors,
  caveat:'This is a source-and-structure audit only. No Steam login, signed agreement, payment, rights, publisher identity, physical QA or Valve review is verified.'};
}
if(require.main===module){
 try{
  const m=JSON.parse(fs.readFileSync(path.join(root,'steam/prepayment-metadata.json'),'utf8'));
  const output=audit(m);console.log(JSON.stringify(output,null,2));
  if(output.errors.length)process.exitCode=1;
 }catch(e){console.error(e.message);process.exitCode=2;}
}
module.exports={audit};
