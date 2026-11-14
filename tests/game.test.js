'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createGame,initStage,updateInput,tick,snapshot,bridgeActive}=require('../game-core');
const on=[true,true];
function run(g,n){for(let i=0;i<n;i++)tick(g,on);}
function putOnPlate(p,pad){p.x=pad.x+25;p.y=544-43;p.vx=0;p.vy=0;p.grounded=true;}

test('без двух подключений физика останавливается (авторитетный сервер)',()=>{
 const g=createGame();g.phase='playing';updateInput(g,0,{right:true});
 tick(g,[true,false]);assert.equal(g.players[0].x,g.level.spawn[0]);
 tick(g,[true,true]);assert.ok(g.players[0].x>g.level.spawn[0]);
});

test('первая глава: две разные плиты одновременно открывают ворота',()=>{
 const g=createGame();g.phase='playing';g.level.signature.done=true;
 putOnPlate(g.players[0],g.level.pads[0]);run(g,20);
 assert.equal(g.level.gateOpen,false);
 putOnPlate(g.players[1],g.level.pads[1]);run(g,20);
 assert.equal(g.level.gateOpen,true);
 const s=snapshot(g,on);assert.equal(s.world.gateOpen,true);assert.deepEqual(s.world.pads,[true,true]);
});

test('вторая глава: рывок ломает стену, плита создаёт мост, импульс закрепляет',()=>{
 const g=createGame();initStage(g,1);g.phase='playing';g.level.signature.done=true;
 g.players[0].x=525;g.players[0].y=501;g.players[0].grounded=true;
 updateInput(g,0,{right:true,abilitySeq:1});run(g,3);
 assert.equal(g.level.walls[0].broken,true);
 putOnPlate(g.players[0],g.level.pads[0]);run(g,2);
 assert.equal(bridgeActive(g),true);
 g.players[1].x=1210;g.players[1].y=501;g.players[1].grounded=true;
 updateInput(g,1,{abilitySeq:1});run(g,2);
 assert.equal(g.level.crystals[0].on,true);
 assert.equal(g.level.gateOpen,true);
 assert.equal(g.level.bridgeLatched,true);
});

test('третья глава: кристалл и две плиты необходимы вместе',()=>{
 const g=createGame();initStage(g,2);g.phase='playing';g.level.signature.done=true;
 putOnPlate(g.players[0],g.level.pads[0]);putOnPlate(g.players[1],g.level.pads[1]);
 run(g,20);assert.equal(g.level.gateOpen,false);
 g.level.crystals[0].on=true;g.adventure.arcade.done=true;run(g,20);
 assert.equal(g.level.gateOpen,true);
});

test('завершение главы происходит, только когда оба героя в портале',()=>{
 const g=createGame();g.phase='playing';g.level.gateOpen=true;
 g.players[0].x=g.level.portal-15;g.players[0].y=501;g.players[0].grounded=true;
 run(g,60);assert.equal(g.stage,0);
 g.players[1].x=g.level.portal-15;g.players[1].y=501;g.players[1].grounded=true;
 run(g,120);assert.equal(g.stage,1);
});