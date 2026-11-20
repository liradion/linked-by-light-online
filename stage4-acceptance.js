'use strict';
// M4 evidence gate. Evaluates reported evidence structure; independent human verification is still required.
// Never submit room codes, private reconnect tokens, IP addresses, email or real participant identities.
const requiredChecks=['node','browsers','commercial','preview'];
const requiredFieldTests=['windowsIphoneWifi','windowsIphoneCellular','safariBackgroundRecovery','fullCampaignHuman','isolatedStagingRestore','interRegionLatency'];
const validEvidenceLink=x=>typeof x==='string'&&x.startsWith('https://')&&x.length<1024&&/^https:\/\/[a-z0-9.-]+\//i.test(x);
const validDate=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(x)&&Number.isFinite(Date.parse(x));
const count=(x)=>Number.isSafeInteger(x)&&x>=0?x:null;
function evaluateStage4Evidence(source){
 const data=source&&typeof source==='object'?source:{};
 const failed=[],results=[];
 const check=(name,ok,details)=>{results.push({name,status:ok?'PASS':'HOLD'});if(!ok)failed.push({name,details});};
 const sha=data.candidateSha;
 const candidate=typeof sha==='string'&&/^[a-f0-9]{40}$/.test(sha);
 check('candidate-commit',candidate,'Record the exact 40-character Git commit SHA.');
 for(const name of requiredChecks){
  const item=data.ci?.[name];
  check('ci-'+name,candidate&&item?.sha===sha&&item?.conclusion==='success'&&validEvidenceLink(item?.url),
   'A successful check URL is required for the exact candidate commit.');
 }
 for(const name of requiredFieldTests){
  const item=data.field?.[name];
  check('field-'+name,item?.passed===true&&validEvidenceLink(item?.evidenceUrl)&&validDate(item?.executedAt),
   'Attach actual device, real-user, full-playthrough or isolated staging evidence with UTC timestamp.');
 }
 const pairs=count(data.beta?.independentPairs),joins=count(data.beta?.joinsAttempted),
  joined=count(data.beta?.joinsSucceeded),started=count(data.beta?.startedWithoutHelp),
  completed=count(data.beta?.firstObjectiveCompleted),wouldContinue=count(data.beta?.wouldContinue);
 check('beta-pairs',pairs!==null&&pairs>=50&&validEvidenceLink(data.beta?.evidenceUrl),
  'A human-verified report of 50+ independent anonymized pairs is required.');
 check('beta-start',pairs!==null&&started!==null&&started<=pairs&&started>=Math.ceil(.8*pairs),
  'At least 80% of independent pairs must start without developer help.');
 check('beta-join',joins!==null&&joins>=50&&joined!==null&&joined<=joins&&joined/joins>=.9,
  'At least 90% of actual invitation join attempts must succeed (sample >=50).');
 check('beta-objective',pairs!==null&&completed!==null&&completed<=pairs&&completed>pairs/2,
  'A majority of pairs must complete the first objective.');
 check('beta-desire-to-continue',pairs!==null&&wouldContinue!==null&&wouldContinue<=pairs&&wouldContinue/pairs>=.7,
  'At least 70% of independent pairs should report intent to continue.');
 const sessions=count(data.stability?.sessions),crashFree=count(data.stability?.crashFree);
 check('beta-crash-free',sessions!==null&&sessions>=50&&crashFree!==null&&crashFree<=sessions
  &&crashFree/sessions>=.995&&validEvidenceLink(data.stability?.evidenceUrl),
  'Attach measured closed-beta >=99.5% crash-free sessions, 50+ observed sessions.');
 check('beta-no-blockers',data.issues?.openP0===0&&data.issues?.openBlockingP1===0&&validEvidenceLink(data.issues?.triageUrl),
  'Known P0 and blocking P1 issues must be resolved, with an inspectable triage record.');
 check('rights',data.compliance?.rightsApproved===true&&validEvidenceLink(data.compliance?.rightsEvidenceUrl),
  'Commercial asset and source rights must be reviewed and approved by the rights holder.');
 check('privacy',data.compliance?.privacyReviewed===true&&validEvidenceLink(data.compliance?.privacyEvidenceUrl),
  'Privacy and beta telemetry retention require human review.');
 check('ugc',data.compliance?.ugcSafe===true&&validEvidenceLink(data.compliance?.ugcEvidenceUrl),
  'Public UGC must remain disabled until review/moderation or documented safe restriction.');
 const preview=data.preview;
 check('live-isolated-preview',candidate&&preview?.verifiedSha===sha&&preview?.httpsUrl?.startsWith('https://')
  &&preview?.wssRoomJoinChecked===true&&preview?.separateSecretsAndStorage===true
  &&validEvidenceLink(preview?.evidenceUrl),
  'CI screenshots do not replace a real isolated HTTPS/WSS live preview with separate secrets.');
 check('human-g4-review',data.signoff?.approved===true&&validDate(data.signoff?.at)
  &&typeof data.signoff?.reviewer==='string'&&data.signoff.reviewer.trim().length>=3
  &&validEvidenceLink(data.signoff?.evidenceUrl),
  'Human release owner must inspect real supporting evidence and record approval.');
 return {status:failed.length?'HOLD':'EVIDENCE_DECLARED_READY_FOR_AUDIT',candidateSha:candidate?sha:null,
  summary:{passed:results.length-failed.length,total:results.length},
  results,failed,
  warning:'This validator checks the supplied evidence metadata, not the truth of external reports or actual physical testing. Human audit is mandatory.'};
}
module.exports={evaluateStage4Evidence,requiredChecks,requiredFieldTests};
