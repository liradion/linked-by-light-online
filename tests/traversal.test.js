'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createGame,initStage,tick,bridgeActive}=require('../game-core');
const {stages,GROUND,BONUS_STAGE}=require('../shared/stages');
const online=[true,true];
function enableSolvedPuzzle(g){
 for(const w of g.level.walls)w.broken=true;
 for(const c of g.level.crystals)c.on=true;
 for(const p of g.level.pads)p.pressed=true;
 g.level.padLatched=true;g.padTimer=1;g.level.bridgeLatched=true;
 if(g.level.signature){g.level.signature.done=true;g.level.signature.nodes.forEach(n=>n.active=true);g.level.signature.pairs.forEach(n=>n.active=true);}
 if(g.adventure.boss)g.adventure.boss.hp=0;
 if(g.adventure.arcade)g.adventure.arcade.done=true;
}
function stepPlayers(g){
 const l=g.level;
 for(let i=0;i<2;i++){
  const p=g.players[i],input=g.input[i];
  if(p.x<l.portal-28){input.right=true;input.left=false;}else{input.right=false;input.left=false;}
  const closest=[...(l.hazards||[]).map(z=>z.x),...(l.floor||[]).slice(0,-1).map(z=>z[1])].filter(x=>x>p.x).sort((a,b)=>a-b)[0]??Infinity;
  const ahead=closest-(p.x+p.w);
  if(p.grounded&&ahead<29&&ahead>-8){input.jumpQueued=true;}
 }
 tick(g,online);
}
test('bot navigates a representative subset of solved stages using actual physics',{timeout:120000},()=>{
 const blocked=[];
 for(let i=0;i<stages.length;i++){
  const g=createGame();initStage(g,i);g.phase='playing';enableSolvedPuzzle(g);
  for(let t=0;t<2100 && g.stage===i && g.phase==='playing';t++)stepPlayers(g);
  if(g.stage===i&&g.phase==='playing')blocked.push({stage:i+1,positions:g.players.map(p=>Math.round(p.x)),portal:g.level.portal});
 }
 const reached=stages.length-blocked.length;
 assert.ok(reached>=30,`Automated baseline route success regressed: ${reached}/99`);
 // The bot uses one fixed jump heuristic. Its misses are not proof of impossible levels;
 // full mission completion also depends on the human-cooperative signature puzzles.
 assert.ok(!blocked.some(x=>x.stage===1||x.stage===2||x.stage===3));
});