'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {evaluateStage4Evidence,requiredChecks,requiredFieldTests}=require('../stage4-acceptance');
const sha='a'.repeat(40),link='https://github.com/liradion/linked-by-light-online/issues/23',now='2026-11-20T06:00:00Z';
function fixture(){
 return {
  candidateSha:sha,
  ci:Object.fromEntries(requiredChecks.map(name=>[name,{sha,conclusion:'success',url:link}])),
  field:Object.fromEntries(requiredFieldTests.map(name=>[name,{passed:true,evidenceUrl:link,executedAt:now}])),
  beta:{independentPairs:50,joinsAttempted:50,joinsSucceeded:49,startedWithoutHelp:42,
   firstObjectiveCompleted:30,wouldContinue:40,evidenceUrl:link},
  stability:{sessions:200,crashFree:199,evidenceUrl:link},
  issues:{openP0:0,openBlockingP1:0,triageUrl:link},
  compliance:{rightsApproved:true,rightsEvidenceUrl:link,privacyReviewed:true,privacyEvidenceUrl:link,
   ugcSafe:true,ugcEvidenceUrl:link},
  preview:{verifiedSha:sha,httpsUrl:'https://staging.example.org',wssRoomJoinChecked:true,
   separateSecretsAndStorage:true,evidenceUrl:link},
  signoff:{approved:true,at:now,reviewer:'Human reviewer',evidenceUrl:link}
 };
}
test('Stage4 gate default is HOLD with no evidence; never implies CI alone is acceptance',()=>{
 const r=evaluateStage4Evidence(null);
 assert.equal(r.status,'HOLD');assert.ok(r.failed.length>=15);
});
test('Stage4 gate accepts only structurally complete, hypothetical human evidence',()=>{
 const r=evaluateStage4Evidence(fixture());
 assert.equal(r.status,'EVIDENCE_DECLARED_READY_FOR_AUDIT');
 assert.equal(r.summary.passed,r.summary.total);
 assert.match(r.warning,/Human audit is mandatory/);
});
test('Stage4 gate requires the exact candidate SHA for every check and interactive preview',()=>{
 const x=fixture();x.ci.browsers.sha='b'.repeat(40);x.preview.verifiedSha='b'.repeat(40);
 const r=evaluateStage4Evidence(x);
 assert.equal(r.status,'HOLD');assert.deepEqual(r.failed.map(x=>x.name),['ci-browsers','live-isolated-preview']);
});
test('Stage4 gate distinguishes 50 pairs from successful network joins and actual crashes',()=>{
 const x=fixture();
 x.beta.independentPairs=49;x.beta.joinsSucceeded=39;x.stability.crashFree=198;
 const names=evaluateStage4Evidence(x).failed.map(x=>x.name);
 for(const key of ['beta-pairs','beta-join','beta-crash-free'])assert.ok(names.includes(key));
});
test('Stage4 gate cannot be bypassed with synthetic CI checks and missing rights',()=>{
 const x=fixture();x.compliance.rightsApproved=false;x.field.windowsIphoneCellular.evidenceUrl='';
 x.issues.openP0=1;x.signoff.approved=false;
 const names=evaluateStage4Evidence(x).failed.map(x=>x.name);
 for(const key of ['rights','field-windowsIphoneCellular','beta-no-blockers','human-g4-review'])
  assert.ok(names.includes(key));
});
