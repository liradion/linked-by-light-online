#!/usr/bin/env node
'use strict';
// Reproducible *structural* inventory. It cannot prove a stage is fun or passable.
const base=require('../shared/stages');
const v20=require('../shared/v20-stages');
const v21=require('../shared/v21-stages');
const v23=require('../shared/v23-stages');
const registry=[...base.stages,base.BONUS_STAGE,...v20.stages,...v21.stages,...v23.stages];

function inspect(stage,index){
 const issues=[];
 const validX=n=>Number.isFinite(n)&&n>=0&&n<=stage.width;
 if(!Number.isFinite(stage.width)||stage.width<900)issues.push('invalid_width');
 if(typeof stage.title!=='string'||!stage.title.trim())issues.push('missing_title');
 if(!Array.isArray(stage.spawn)||stage.spawn.length!==2||!stage.spawn.every(validX))issues.push('invalid_spawn');
 if(!Array.isArray(stage.floor)||!stage.floor.length)issues.push('missing_floor');
 else{
  let last=0;
  for(const [start,end] of stage.floor){
   if(!Number.isFinite(start)||!Number.isFinite(end)||start<last||end<=start||end>stage.width)
    issues.push('invalid_floor_segment');
   last=end;
  }
 }
 if(!validX(stage.portal))issues.push('invalid_portal');
 if(!Array.isArray(stage.gates)||!stage.gates.every(g=>validX(g.x)&&validX(g.x+g.w)))issues.push('invalid_gates');
 if(!Array.isArray(stage.platforms)||!Array.isArray(stage.pads)||!Array.isArray(stage.crystals))
  issues.push('missing_object_collections');
 const chapterType=stage.v23?'v23':stage.v21?'v21':stage.v20?'v20':stage.bonus?'bonus':'base';
 const essentialInputs=['left','right','jump','ability'];
 const specialActions=chapterType==='v20'?
  ({tether:['tether_attach'],phase:['phase_shift'],time:['time_lock','time_echo'],combo:['tether_attach','phase_shift','time_lock','time_echo']}[stage.v20?.kind]||[]):
  chapterType==='v21'?['v21_chapter_dialog']:
  chapterType==='v23'?['v23_chapter_dialog']:[];
 if(stage.signature?.kind)specialActions.push('signature_mechanic');
 if(stage.reality?.kind)specialActions.push('reality_mechanic');
 return {
  index,chapterType,title:stage.title,chapter:stage.chapter||null,
  width:stage.width,objective:stage.objective||stage.hint||'',
  essentialInputs,specialActions,geometryIssues:issues,
  reviewStatus:'not_playtested',playtestScore:null
 };
}
function audit(){
 const levels=registry.map(inspect);
 const bad=levels.filter(x=>x.geometryIssues.length>0);
 return {schema:'linked-light-commercial-level-audit-v1',total:levels.length,
  counts:{base:base.stages.length,bonus:1,v20:v20.stages.length,v21:v21.stages.length,v23:v23.stages.length},
  structuralIssues:bad.length,issuesByStage:bad.map(x=>({index:x.index,issues:x.geometryIssues})),levels};
}
function markdown(result){
 const lines=['# Stage audit — structural inventory','',
 'Generated from shared stage definitions. **NOT a passability or gameplay certification.**','',
 `Total levels: ${result.total}; geometry entries requiring review: ${result.structuralIssues}`,'',
 '| Index | Chapter | Title | Special actions | Structural issues | Review |',
 '|---:|---|---|---|---|---|'];
 for(const s of result.levels)lines.push(
  `| ${s.index} | ${s.chapterType} | ${String(s.title).replace(/\|/g,'/')} | ${s.specialActions.join(', ')||'—'} | ${s.geometryIssues.join(', ')||'—'} | ${s.reviewStatus} |`);
 return lines.join('\n');
}
if(require.main===module){
 const result=audit();
 console.log(process.argv.includes('--json')?JSON.stringify(result,null,2):markdown(result));
 if(result.total!==137||result.structuralIssues>0)process.exitCode=1;
}
module.exports={audit,inspect,markdown};
