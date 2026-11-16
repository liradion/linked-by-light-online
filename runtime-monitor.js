'use strict';
// Operational state without tokens, addresses, user content or raw SQL errors.
function createRuntimeMonitor({now=Date.now,storageConfigured=false,requireDurable=false,graceMs=90000}={}){
 const started=now(),stat={backupAttempts:0,backupSuccesses:0,backupFailures:0,
  restoreSuccesses:0,restoreFailures:0,lastBackupAt:0,lastFailureAt:0,
  lastRestoreAt:0,lastBackupDurationMs:null,lastErrorCode:null};
 function recorded(kind,ok,duration=0){
  const t=now();
  if(kind==='backup'){
   stat.backupAttempts++;
   if(ok){stat.backupSuccesses++;stat.lastBackupAt=t;stat.lastErrorCode=null;}
   else{stat.backupFailures++;stat.lastFailureAt=t;stat.lastErrorCode='backup_failure';}
   stat.lastBackupDurationMs=Math.max(0,Math.round(duration));
  }else if(kind==='restore'){
   if(ok){stat.restoreSuccesses++;stat.lastRestoreAt=t;}
   else{stat.restoreFailures++;stat.lastFailureAt=t;stat.lastErrorCode='restore_failure';}
  }
 }
 function status(){
  const t=now(),age=stat.lastBackupAt?t-stat.lastBackupAt:null;
  const recent=age!==null&&age<=120000;
  const grace=t-started<graceMs;
  const archiveReady=!!storageConfigured&&(recent||grace&&!stat.backupFailures&&!stat.restoreFailures);
  return {ready:(!requireDurable||storageConfigured)&&(!storageConfigured||archiveReady),
   durableConfigured:!!storageConfigured,requireDurable:!!requireDurable,
   cloudBackupHealthy:!!storageConfigured&&recent,lastBackupAgeSec:age===null?null:Math.floor(age/1000),
   restoringOrStarting:grace&&age===null};
 }
 function diagnostics(){return {...status(),...stat,uptimeSec:Math.floor((now()-started)/1000)};}
 return {recorded,status,diagnostics};
}
module.exports={createRuntimeMonitor};
