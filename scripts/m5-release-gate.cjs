'use strict';
/* Conservative structural preflight. No Steamworks credentials, fake entitlement
 * success or software-signing bypass. Evidence truth must be audited by humans. */
const fs=require('node:fs'),path=require('node:path');
const {evaluateStage4Evidence}=require('../stage4-acceptance');
const isSha=x=>typeof x==='string'&&/^[0-9a-f]{40}$/.test(x);
const isHash=x=>typeof x==='string'&&/^[0-9a-f]{64}$/i.test(x);
const truth=x=>x===true;
function evaluate(data={},g4={}){
 const x=data&&typeof data==='object'?data:{};
 const g4Result=evaluateStage4Evidence(g4),fail=[];
 const check=(id,ok)=>{if(!ok)fail.push(id);};
 check('exact-candidate-sha',isSha(x.candidateSha));
 check('g4-matching-audited-evidence',g4Result.status==='EVIDENCE_DECLARED_READY_FOR_AUDIT'&&x.candidateSha===g4Result.candidateSha);
 check('windows-installer-sha256',isHash(x.windows?.installerSha256));
 check('windows-valid-signature',truth(x.windows?.authenticodeValid));
 check('windows-publisher-verified',truth(x.windows?.signerOwnershipReviewed));
 check('windows-10-real-device',truth(x.windows?.windows10Physical));
 check('windows-11-real-device',truth(x.windows?.windows11Physical));
 check('windows-gamepad-reconnect',truth(x.windows?.controllerAndReconnectPhysical));
 check('steamworks-account',truth(x.steam?.partnerAccountVerified));
 check('steamworks-entitlement-backend',truth(x.steam?.serverSideOwnershipVerified));
 check('steamworks-friend-refund',truth(x.steam?.guestAndRefundVerified));
 check('steamworks-store-approval',truth(x.steam?.storeSubmissionReviewed));
 check('commercial-rights',truth(x.compliance?.rightsApproved));
 check('privacy-security',truth(x.compliance?.privacyAndSecurityReviewed));
 check('release-owner-human-signoff',truth(x.owner?.exactShaApproved)&&
  typeof x.owner?.reviewer==='string'&&x.owner.reviewer.trim().length>=3);
 return {status:fail.length?'HOLD':'METADATA_COMPLETE_HUMAN_AUDIT_REQUIRED',
   candidateSha:isSha(x.candidateSha)?x.candidateSha:null,missing:fail,
   warning:'Metadata does not prove Steam license, a real Windows install, signature ownership, G4 acceptance or legal approval. Human verification and a separate release action are mandatory.'};
}
if(require.main===module){
 const flag=(key)=>{const arg=process.argv.find(x=>x.startsWith('--'+key+'='));return arg?.slice(key.length+3);};
 try{
  const file=flag('evidence'),g4=flag('g4');
  if(!file||!g4)throw Error('Usage: node scripts/m5-release-gate.cjs --evidence=PRIVATE_M5.json --g4=PRIVATE_G4.json');
  const result=evaluate(JSON.parse(fs.readFileSync(path.resolve(file),'utf8')),
   JSON.parse(fs.readFileSync(path.resolve(g4),'utf8')));
  console.log(JSON.stringify(result,null,2));
  if(result.status!=='METADATA_COMPLETE_HUMAN_AUDIT_REQUIRED')process.exitCode=1;
 }catch(error){console.error('M5 HOLD:',error.message);process.exitCode=1;}
}
module.exports={evaluate};
