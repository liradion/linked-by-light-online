'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const resonance=require('../coop-resonance');
const adventure=require('../adventure-core');
const {createGame,snapshot,initStage}=require('../game-core');
const evolution=require('../public/evolution.js');

function localBond(){
 return {power:.35,active:0,shield:0,hearts:0};
}
const near=[{x:100,y:501},{x:160,y:501}];
const far=[{x:100,y:501},{x:500,y:501}];
test('Real distinct abilities within 1.25 s and 225 px generate one authoritative combo and bond shield',()=>{
 const b=localBond();
 assert.equal(resonance.ability(b,0,near,false),false);
 assert.equal(b.syncs,0);
 resonance.advance(b,.7);
 assert.equal(resonance.ability(b,1,near,false),true);
 assert.equal(b.syncs,1);
 assert.equal(b.power,.58);
 assert.equal(b.shield,.72);
 assert.equal(b.resonance,4.5);
 assert.equal(b.syncCooldown,2.5);
 assert.deepEqual(b.syncWindow,[0,0]);
 // Repeated press or stale ability cannot farm server resources.
 assert.equal(resonance.ability(b,1,near,false),false);
 assert.equal(resonance.ability(b,0,near,false),false);
 assert.equal(b.syncs,1);
});
test('Reject distant, stale, solo and invalid actions; only actual distinct abilities work',()=>{
 for(const invalid of [{role:2,people:near,solo:false},{role:0,people:far,solo:false},
   {role:0,people:near,solo:true},{role:0,people:[],solo:false}]){
  const b=localBond();
  assert.equal(resonance.ability(b,invalid.role,invalid.people,invalid.solo),false);
  assert.equal(b.syncs,0);
 }
 const b=localBond();
 assert.equal(resonance.ability(b,0,near,false),false);
 resonance.advance(b,1.25);
 assert.equal(resonance.ability(b,1,near,false),false);
 assert.equal(b.syncs,0);
});
test('Resonance expires in server time; cooldown prevents rapid repeats then allows a new pair',()=>{
 const b=localBond();resonance.ability(b,0,near);resonance.ability(b,1,near);
 for(let i=0;i<150;i++)resonance.advance(b,1/60);
 assert.ok(b.syncCooldown<.05);
 for(let i=0;i<150;i++)resonance.advance(b,1/60);
 assert.equal(b.resonance,0);
 resonance.ability(b,1,near);assert.equal(resonance.ability(b,0,near),true);
 assert.equal(b.syncs,2);
});
test('Legacy v11 checkpoint bond without optional fields is safe and preserves existing power/hearts',()=>{
 const b={power:.8,shield:1,active:0,hearts:3};
 assert.equal(resonance.ensure(b),true);
 assert.equal(b.power,.8);assert.equal(b.hearts,3);
 assert.deepEqual(b.syncWindow,[0,0]);
 assert.equal(b.syncs,0);
 resonance.advance(b,1/60);
 assert.equal(resonance.ability(b,1,near),false);
 assert.equal(resonance.ability(b,0,near),true);
 assert.equal(b.power,1);
 assert.equal(b.hearts,3);
});
test('Game snapshot publishes server-owned resonance through existing v4 adventure.bond field',()=>{
 const g=createGame();g.phase='playing';g.players[0].x=90;g.players[1].x=166;
 adventure.onAbility(g,g.players[0]);
 adventure.onAbility(g,g.players[1]);
 const s=snapshot(g,[true,true]);
 assert.equal(s.world.adventure.bond.syncs,1);
 assert.equal(s.world.adventure.bond.resonance,4.5);
 assert.equal(s.world.adventure.bond.power,.58);
 assert.equal(s.world.adventure.bond.shield,.72);
 assert.equal(s.stage,0);
 initStage(g,1);
 assert.equal(snapshot(g,[true,true]).world.adventure.bond.syncs,0);
});
test('Solo cannot earn cooperative bonus by switching active roles',()=>{
 const g=createGame();g.solo=true;
 adventure.onAbility(g,g.players[0]);
 adventure.onAbility(g,g.players[1]);
 assert.equal(g.adventure.bond.syncs,0);
});
test('Story beats are localized, bounded, and do not expose room tokens',()=>{
 assert.deepEqual(evolution.moment(0),[
  'Первый контакт','Искра удерживает янтарный свет, Эхо — голубой. Найдите обе плиты и встаньте на них одновременно.']);
 assert.equal(evolution.moment(99),null);
 assert.equal(evolution.moment(-1),null);
 assert.ok(evolution.moment(9)[0].includes('2'));
 assert.ok(evolution.moment(112)[0].includes('Навстречу'));
 assert.ok(evolution.moment(122)[0].includes('Физика'));
 assert.ok(evolution.comboText(3)[1].includes('3'));
});
test('World-space light thread is visual-only, bounded by player distance and quality',()=>{
 let paths=0;
 const context={
  save(){},restore(){},createLinearGradient(){return {addColorStop(){}}},
  beginPath(){paths++},moveTo(){},quadraticCurveTo(){},stroke(){},arc(){},fill(){},
  set lineCap(v){},set strokeStyle(v){},set lineWidth(v){},
  set globalAlpha(v){},set shadowColor(v){},set shadowBlur(v){},set fillStyle(v){}
 };
 const pair=[{x:90,y:500},{x:166,y:500}];
 evolution.link(context,pair,{power:.7,resonance:0},1,{graphics:'low',reducedMotion:true});
 assert.ok(paths>=1);
 paths=0;evolution.link(context,[pair[0],{x:999,y:500}],{power:1},1,{graphics:'high'});
 assert.equal(paths,0);
});
