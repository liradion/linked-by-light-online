'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createGame,updateInput,tick}=require('../game-core');
const demo=require('../shared/demo-mode');
const {GROUND}=require('../shared/stages');

// This test exercises nine actual server-authoritative objectives and the
// finale without directly writing "solved" flags. Player relocation between
// interactables is a TEST FIXTURE, not proof of navigable geometry.
const both=[true,true];
const y=GROUND-43;
let seq=[0,0];
function step(g,n=1){for(let i=0;i<n;i++)tick(g,both);}
function move(g,role,x,py=y){
 const p=g.players[role];
 p.x=x-15;p.y=py;p.vx=0;p.vy=0;p.dash=0;p.grounded=py===y;
 g.input[role].left=false;g.input[role].right=false;
}
function pulse(g,role){
 seq[role]++;
 g.players[role].cool=0; // isolated event test; cooldown gets dedicated tests
 updateInput(g,role,{left:false,right:false,abilitySeq:seq[role],inputSeq:seq[role]});
 step(g);
}
function solve(g,idx){
 assert.equal(g.stage,idx);
 const level=g.level;
 // The first act contains automatic flowers, each requiring its assigned
 // player to stand close enough on solid ground.
 const signature=level.signature;
 assert.equal(signature?.kind,'flowers','first-act mechanic unexpectedly changed');
 for(const node of signature.nodes){
  move(g,node.role,node.x);
  step(g,3);
  assert.equal(node.active,true,'unreachable flower receiver in stage '+idx);
 }
 assert.equal(signature.done,true,'signature must be completed by actual steps');
 for(const wall of level.walls){
  move(g,0,wall.x-39);
  g.players[0].face=1;
  pulse(g,0);
  step(g,9);
  assert.equal(wall.broken,true,'dash must break wall in stage '+idx);
 }
 for(const pad of level.pads)move(g,pad.type,pad.x+pad.w/2);
 if(level.pads.length){
  step(g,22);
  assert.equal(level.padLatched,true,'pressure plates must hold after synchronization in stage '+idx);
 }
 for(const crystal of level.crystals){
  move(g,1,crystal.x);
  pulse(g,1);
  assert.equal(crystal.on,true,'Echo pulse must light crystal in stage '+idx);
 }
 step(g,2);
 const arcade=g.adventure.arcade;
 if(arcade){
  assert.equal(arcade.started,true,'arcade should activate after base goals in stage '+idx);
  if(arcade.kind==='chase'){
   move(g,0,arcade.ringX+190);
   move(g,1,arcade.ringX+210);
   step(g,2);
  }else if(arcade.kind==='flight'){
   move(g,0,arcade.ringX,GROUND-145);
   move(g,1,arcade.ringX,GROUND-145);
   step(g,2);
  }else if(arcade.kind==='rhythm'){
   move(g,0,arcade.ringX);
   move(g,1,arcade.ringX+125);
   pulse(g,0);pulse(g,1);
  }else if(arcade.kind==='sail'){
   move(g,0,arcade.boat-30);
   move(g,1,arcade.boat+35);
   pulse(g,1);
   g.input[0].right=true;
   step(g,117);
   g.input[0].right=false;
  }else throw Error('Unrecognized arcade '+arcade.kind);
  assert.equal(arcade.done,true,'arcade cannot finish by normal event triggers: '+idx+' / '+arcade.kind);
 }
 const boss=g.adventure.boss;
 if(boss){
  assert.equal(boss.active,true,'boss must activate after the puzzle');
  for(const role of [0,1,0]){
   move(g,role,boss.x);
   pulse(g,role);
   if(boss.hp>0)step(g,67);
  }
  assert.equal(boss.hp,0,'alternating co-op attacks must defeat stage '+idx);
 }
 step(g,2);
 assert.equal(level.gateOpen,true,'gate must become traversable after completing stage '+idx);
 move(g,0,level.portal);
 move(g,1,level.portal);
 step(g,41);
 assert.ok(g.transition>0||g.phase==='win','both players must trigger portal in stage '+idx);
}
test('G1 semantic playthrough: all nine co-op puzzles and mini-games reach their portal, demo ends at 8',()=>{
 const g=createGame();
 g.demo=true;g.phase='playing';
 for(let i=0;i<demo.stages.length;i++){
  solve(g,i);
  step(g,55);
  if(i<8){assert.equal(g.stage,i+1);assert.equal(g.phase,'playing');}
 }
 assert.equal(g.stage,8);
 assert.equal(g.phase,'win');
 assert.equal(g.demo,true);
});
