'use strict';
// G4 field beta aggregate calculator: input must already be anonymized counts.
// This NEVER accepts participant IDs, device fingerprints, rooms or raw sessions.
// An arithmetic PASS is not an external-evidence or release approval.
const numericKeys=['independentPairs','joinsAttempted','joinsSucceeded','startedWithoutHelp',
 'firstObjectiveCompleted','wouldContinue','sessions','crashFree'];
function rate(a,b){return b>0?Math.round(a/b*10000)/100:null;}
function summarizeBeta(raw){
 const source=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 const counts={};
 for(const key of numericKeys)counts[key]=Number.isSafeInteger(source[key])&&
  source[key]>=0&&source[key]<=100000000?source[key]:null;
 const {independentPairs:pairs,joinsAttempted:attempted,joinsSucceeded:joined,
  startedWithoutHelp:started,firstObjectiveCompleted:completed,wouldContinue:continued,
  sessions,crashFree}=counts;
 const validPairs=pairs!==null&&pairs>=50;
 const validSessions=sessions!==null&&sessions>=50;
 const validAttempts=attempted!==null&&attempted>=50;
 const subset=(a,b)=>a!==null&&b!==null&&a<=b;
 const checks={
  independentPairs:validPairs,
  unassistedStart:validPairs&&subset(started,pairs)&&started/pairs>=.8,
  inviteJoin:validAttempts&&subset(joined,attempted)&&joined/attempted>=.9,
  firstObjective:validPairs&&subset(completed,pairs)&&completed/pairs>.5,
  continueIntent:validPairs&&subset(continued,pairs)&&continued/pairs>=.7,
  crashFree:validSessions&&subset(crashFree,sessions)&&crashFree/sessions>=.995
 };
 return {status:Object.values(checks).every(Boolean)?'METRICS_DECLARED_READY_FOR_EVIDENCE_AUDIT':'HOLD',
  counts,percent:{
   unassistedStart:subset(started,pairs)?rate(started,pairs):null,
   inviteJoin:subset(joined,attempted)?rate(joined,attempted):null,
   firstObjective:subset(completed,pairs)?rate(completed,pairs):null,
   continueIntent:subset(continued,pairs)?rate(continued,pairs):null,
   crashFree:subset(crashFree,sessions)?rate(crashFree,sessions):null
  },checks,
  warning:'Reported aggregate counts are not independently verified; real devices, CI, rights, staging and human G4 signoff are separately required.'};
}
module.exports={summarizeBeta,numericKeys};
