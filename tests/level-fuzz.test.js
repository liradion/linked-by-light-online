'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createGame,initStage,tick,snapshot,updateInput}=require('../game-core');
const {stages}=require('../shared/stages');

test('100 stages tolerate seeded random co-op inputs without NaN, crashes or invalid snapshots',{timeout:60000},()=>{
 let seed=0xdecafbad;
 const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let level=0;level<=99;level++){
  const g=createGame();initStage(g,level);g.phase='playing';
  const seq=[0,0],abilities=[0,0],jump=[0,0];
  for(let t=0;t<600;t++){
   for(let role=0;role<2;role++){
    if(t%12===0){const r=rand();updateInput(g,role,{inputSeq:++seq[role],left:r<.23,right:r>.27,jumpSeq:rand()<.4?++jump[role]:jump[role],abilitySeq:rand()<.2?++abilities[role]:abilities[role]});}
   }
   tick(g,[true,true]);
   if(t%60===0){const snap=snapshot(g,[true,true]);assert.equal(snap.players.length,2);assert.ok(snap.players.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.vy)),`Non-finite player on level ${level+1}`);assert.ok(snap.world.signature!=null);}
  }
 }
});