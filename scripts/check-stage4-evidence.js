'use strict';
// npm-independent, never auto-approves release or deployment.
const fs=require('node:fs');
const {evaluateStage4Evidence}=require('../stage4-acceptance');
const path=process.argv[2];
if(!path){console.error('Usage: node scripts/check-stage4-evidence.js evidence.json');process.exitCode=2;}
else{
 try{
  const obj=JSON.parse(fs.readFileSync(path,'utf8'));
  const result=evaluateStage4Evidence(obj);
  console.log(JSON.stringify(result,null,2));
  process.exitCode=result.status==='HOLD'?1:0;
 }catch(error){
  console.error('Evidence cannot be read or parsed: '+error.message);
  process.exitCode=2;
 }
}
