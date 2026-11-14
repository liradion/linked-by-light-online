'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createGame,initStage,tick,updateInput,snapshot}=require('../game-core');
const {GROUND}=require('../shared/stages');
const online=[true,true];
function game(index=0){const g=createGame();initStage(g,index);g.phase='playing';return g;}
function at(g,i,x,y=GROUND-43){Object.assign(g.players[i],{x,y,vy:0,vx:0,grounded:true,cool:0});}
test('input acknowledgements are authoritative and monotonic',()=>{
 const g=game();updateInput(g,0,{inputSeq:3,right:true});assert.equal(snapshot(g,online).ack[0],3);
 updateInput(g,0,{inputSeq:1,right:true});assert.equal(snapshot(g,online).ack[0],3);
 updateInput(g,0,{inputSeq:15,right:true});assert.equal(snapshot(g,online).ack[0],15);
});
test('boss has three distinct attack phases as alternating abilities land',()=>{
 const g=game(98);g.level.signature.done=true;for(const w of g.level.walls)w.broken=true;for(const c of g.level.crystals)c.on=true;g.level.padLatched=true;
 for(let j=0;j<2;j++)tick(g,online);
 const b=g.adventure.boss;assert.equal(b.phase,1);
 let i=1;while(b.hp>0){const role=b.next;at(g,role,b.x-15);updateInput(g,role,{abilitySeq:i++,left:false,right:false});tick(g,online);}
 assert.equal(b.phase,3);assert.equal(b.hp,0);
});
test('rescue link saves a falling teammate near a grounded partner',()=>{
 const g=game();const ally=g.players[1];at(g,1,310);const p=g.players[0];p.x=320;p.y=785;p.vy=500;
 g.adventure.bond.active=2;g.adventure.bond.shield=1;
 tick(g,online);assert.equal(g.stats.rescues,1);assert.equal(g.stats.deaths,0);assert.equal(g.adventure.bond.active,0);assert.ok(p.y<550);
});
test('failing a level increments deaths and level stats freeze offline',()=>{
 const g=game();const p=g.players[0];p.y=900;tick(g,online);assert.equal(g.stats.deaths,1);
 const stats=JSON.stringify(g.stats);for(let n=0;n<90;n++)tick(g,[true,false]);assert.equal(JSON.stringify(g.stats),stats);
});
test('completion produces a server-scored rating and clear time',()=>{
 const g=game();g.level.gateOpen=true;for(const p of g.players)at(g,p.type,g.level.portal-15);
 for(let n=0;n<130;n++)tick(g,online);
 assert.equal(g.lastResult?.level,0);assert.ok(g.lastResult.elapsed>0);assert.ok([1,2,3].includes(g.lastResult.stars));
 assert.equal(snapshot(g,online).result.level,0);
});
test('different transport roles: Echo activates sail while Spark pilots',()=>{
 const g=game(5),m=g.adventure.arcade;g.level.signature.done=true;for(const w of g.level.walls)w.broken=true;for(const c of g.level.crystals)c.on=true;g.level.padLatched=true;
 for(let j=0;j<4;j++)tick(g,online);at(g,0,m.boat-40);at(g,1,m.boat+25);g.input[0].right=true;g.input[1].right=true;
 for(let j=0;j<10;j++)tick(g,online);assert.equal(m.progress,0,'piloting alone should not be enough');
 updateInput(g,1,{abilitySeq:1,right:true});for(let j=0;j<9;j++)tick(g,online);assert.ok(m.progress>0,'Echo pulse powers sail');
});