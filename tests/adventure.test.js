'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const core=require('../game-core');
const adventure=require('../adventure-core');
const {stages,GROUND,BONUS_STAGE}=require('../shared/stages');
const online=[true,true];
function make(idx){const g=core.createGame();core.initStage(g,idx);g.phase='playing';return g;}
function at(g,type,x,y=GROUND-43){const p=g.players[type];p.x=x-15;p.y=y;p.vx=p.vy=0;p.grounded=true;p.cool=0;return p;}
function solved(g){g.level.signature.done=true;for(const w of g.level.walls)w.broken=true;for(const c of g.level.crystals)c.on=true;g.level.padLatched=true;}
function frames(g,n){for(let i=0;i<n;i++)core.tick(g,online);}
test('11 distinct bosses appear on every ninth stage, plus bonus final',()=>{
 for(let act=0;act<11;act++){
  const g=make(act*9+8),boss=g.adventure.boss;
  assert.ok(boss,`boss missing in act ${act+1}`);
  assert.equal(boss.name,adventure.BOSS_NAMES[act]);
  assert.equal(boss.style,act);assert.ok(boss.hp>=3);
 }
 assert.equal(stages.length,99);assert.equal(BONUS_STAGE.bonus,true);
 assert.equal(make(99).adventure.boss.name,'Последняя Тень');
});
test('each boss takes alternating role attacks and gates stay locked until defeated',()=>{
 const g=make(8);solved(g);frames(g,4);
 assert.equal(g.adventure.boss.active,true);assert.equal(g.level.gateOpen,false);
 const boss=g.adventure.boss;let seq=[1,1];
 while(boss.hp>0){const role=boss.next,p=at(g,role,boss.x-12);p.cool=0;p.face=role===0?1:-1;
  core.updateInput(g,role,{abilitySeq:seq[role]++,left:false,right:false});
  core.tick(g,online);
 }
 frames(g,2);assert.equal(g.level.gateOpen,true);
});
test('bond power charges when nearby; triggering tether gives both protective shield',()=>{
 const g=make(0);at(g,0,150);at(g,1,185);frames(g,130);
 assert.ok(g.adventure.bond.power>.43);
 core.updateInput(g,0,{bondSeq:1});core.tick(g,online);
 assert.ok(g.adventure.bond.active>3);assert.ok(g.adventure.bond.shield>2);
 const before=g.adventure.bond.power;frames(g,5);
 assert.ok(g.adventure.bond.power<before+.05);
});
test('both players can emote and trigger a synchronized heart moment',()=>{
 const g=make(0);at(g,0,195);at(g,1,240);
 core.updateInput(g,0,{emoteSeq:1});core.tick(g,online);
 core.updateInput(g,1,{emoteSeq:1});core.tick(g,online);
 assert.equal(g.adventure.bond.hearts,1);
 assert.ok(core.snapshot(g,online).world.adventure.emotes.every(x=>x>0));
});
test('rare pets and secret runes are collectable and do not block regular levels',()=>{
 for(let act=0;act<11;act++){
  const pet=make(act*9+4);at(pet,0,pet.adventure.pet.x);frames(pet,2);assert.equal(pet.adventure.pet.collected,true);
  const rune=make(act*9+7);at(rune,1,rune.adventure.secret.x,rune.adventure.secret.y-21.5);frames(rune,2);assert.equal(rune.adventure.secret.collected,true);
 }
});
test('four mini-game variants are actually playable through server rules',()=>{
 for(const [stage,kind] of [[2,'chase'],[4,'flight'],[5,'sail'],[6,'rhythm']]){
  const g=make(stage);assert.equal(g.adventure.arcade.kind,kind);solved(g);frames(g,3);
  const m=g.adventure.arcade;assert.equal(m.started,true);
  if(kind==='chase'){at(g,0,m.ringX+70);at(g,1,m.ringX+90);frames(g,3);}
  if(kind==='flight'){at(g,0,m.ringX,GROUND-147).grounded=false;at(g,1,m.ringX+8,GROUND-147).grounded=false;frames(g,3);}
  if(kind==='rhythm'){
   for(let role=0;role<2;role++){
    at(g,role,m.ringX+role*125);
    core.updateInput(g,role,{abilitySeq:1,left:false,right:false});core.tick(g,online);
   }frames(g,2);
  }
  if(kind==='sail'){
   at(g,0,m.boat-40);at(g,1,m.boat+30);g.input[0].right=true;g.input[1].right=true;frames(g,135);
  }
  assert.equal(m.done,true,kind);
 }
});
test('bonus 100 ends the story, regular 99 still ends main campaign',()=>{
 const g=make(99);assert.equal(g.level.bonus,true);
 g.level.gateOpen=true;for(const p of g.players){p.x=g.level.portal-15;p.y=GROUND-43;p.vx=p.vy=0;p.grounded=true;}
 frames(g,130);assert.equal(g.phase,'win');assert.equal(g.stage,99);
});
test('boss, bond, emote and timed mini-games freeze while teammate is disconnected',()=>{
 const g=make(8);solved(g);frames(g,2);const before=JSON.stringify(g.adventure);
 for(let i=0;i<200;i++)core.tick(g,[true,false]);
 assert.equal(JSON.stringify(g.adventure),before);
});