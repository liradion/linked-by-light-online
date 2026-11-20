'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {summarizeBeta}=require('../g4-beta-metrics');
const {evaluateStage4Evidence}=require('../stage4-acceptance');
const fs=require('node:fs'),path=require('node:path');
test('G4 beta aggregates: missing real cohort fail closed',()=>{
 const r=summarizeBeta({});
 assert.equal(r.status,'HOLD');
 assert.equal(Object.values(r.checks).filter(Boolean).length,0);
 assert.equal(r.percent.inviteJoin,null);
});
test('G4 beta aggregates: exact advertised thresholds still demand independent real evidence audit',()=>{
 const r=summarizeBeta({independentPairs:50,joinsAttempted:50,joinsSucceeded:45,
  startedWithoutHelp:40,firstObjectiveCompleted:26,wouldContinue:35,
  sessions:200,crashFree:199,participantEmail:'do-not-export@example.com'});
 assert.equal(r.status,'METRICS_DECLARED_READY_FOR_EVIDENCE_AUDIT');
 assert.equal(r.percent.unassistedStart,80);
 assert.equal(r.percent.inviteJoin,90);
 assert.equal(r.percent.crashFree,99.5);
 assert.equal(JSON.stringify(r).includes('do-not-export'),false);
 assert.match(r.warning,/not independently verified/);
});
test('G4 beta aggregates: overcounted joins and crashes, too few participants, malformed values HOLD',()=>{
 const a=summarizeBeta({independentPairs:20,startedWithoutHelp:20,
  joinsAttempted:30,joinsSucceeded:40,firstObjectiveCompleted:22,
  wouldContinue:22,sessions:40,crashFree:50});
 assert.equal(a.status,'HOLD');
 assert.equal(a.checks.inviteJoin,false);
 assert.equal(a.checks.crashFree,false);
 assert.equal(a.percent.inviteJoin,null);
 assert.equal(a.percent.crashFree,null);
 const b=summarizeBeta({independentPairs:50,startedWithoutHelp:40,joinsAttempted:50,
  joinsSucceeded:44,firstObjectiveCompleted:25,wouldContinue:35,sessions:200,crashFree:198});
 assert.equal(b.status,'HOLD');
 assert.equal(b.checks.firstObjective,false);
 assert.equal(b.checks.inviteJoin,false);
 assert.equal(b.checks.crashFree,false);
});
test('G4 checked-in evidence template is intentionally unapproved and never contains fake success data',()=>{
 const source=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/G4_EVIDENCE_TEMPLATE.json'),'utf8'));
 const outcome=evaluateStage4Evidence(source);
 assert.equal(outcome.status,'HOLD');
 assert.equal(source.signoff.approved,false);
 assert.equal(source.preview.wssRoomJoinChecked,false);
 assert.equal(source.beta.independentPairs,0);
 assert.equal(source.candidateSha,'');
});
