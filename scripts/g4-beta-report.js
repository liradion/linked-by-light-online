'use strict';
// Offline and on-demand only. Never upload raw beta inputs to GitHub.
const fs=require('node:fs');
const {summarizeBeta}=require('../g4-beta-metrics');
if(process.argv.length!==3){
 console.error('Usage: node scripts/g4-beta-report.js <private-anonymous-aggregate.json>');
 process.exitCode=2;
}else{
 try{
  const input=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
  const report=summarizeBeta(input);
  console.log(JSON.stringify(report,null,2));
  process.exitCode=report.status==='HOLD'?1:0;
 }catch(e){
  console.error('Aggregate cannot be read or parsed: '+e.message);
  process.exitCode=2;
 }
}
