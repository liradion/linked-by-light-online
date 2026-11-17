'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createGame,initStage,updateInput,tick,snapshot}=require('../game-core');
const both=[true,true];

function run(game,steps=18){for(let i=0;i<steps;i++)tick(game,both);}
function placeOnPad(game,role,pad){
 const player=game.players[role];
 player.x=pad.x+Math.min(18,pad.w/4);
 player.y=501;player.vx=0;player.vy=0;player.grounded=true;
}
test('G1 stage 0: both color-matched pads must be held together to activate',()=>{
 const game=createGame();game.phase='playing';
 const pads=game.level.pads;
 assert.equal(game.stage,0);
 assert.deepEqual(pads.map(p=>p.type),[0,1]);
 placeOnPad(game,0,pads[0]);
 run(game,18);
 assert.equal(game.level.padLatched,false,'only Spark cannot solve the two-player objective');
 placeOnPad(game,1,pads[1]);
 run(game,18);
 assert.equal(game.level.padLatched,true,'both players hold pads long enough');
 const state=snapshot(game,both);
 assert.deepEqual(state.world.pads,[true,true]);
});
test('G1 stage 1: Spark dash breaks the wall and Echo pulse lights the crystal',()=>{
 const game=createGame();initStage(game,1);game.phase='playing';
 const wall=game.level.walls[0],crystal=game.level.crystals[0];
 assert.ok(wall&&!wall.broken&&crystal&&!crystal.on);
 const spark=game.players[0];
 spark.x=wall.x-48;spark.y=501;spark.vx=0;spark.vy=0;spark.face=1;
 updateInput(game,0,{left:false,right:true,abilitySeq:1,inputSeq:1});
 run(game,10);
 assert.equal(wall.broken,true,'Spark wall should break during the dash');
 const echo=game.players[1];
 echo.x=crystal.x-15;echo.y=501;echo.vx=0;echo.vy=0;
 updateInput(game,1,{left:false,right:false,abilitySeq:1,inputSeq:1});
 run(game,1);
 assert.equal(crystal.on,true,'Echo crystal should light near pulse radius');
 assert.equal(game.level.bridgeLatched,true,'the bridge remains usable after charging');
});
test('G1 stage 2: paired pads latch but neither role can complete them alone',()=>{
 const game=createGame();initStage(game,2);game.phase='playing';
 assert.equal(game.level.pads.length,2);
 placeOnPad(game,0,game.level.pads[0]);
 run(game,20);
 assert.equal(game.level.padLatched,false);
 placeOnPad(game,1,game.level.pads[1]);
 run(game,20);
 assert.equal(game.level.padLatched,true);
});
test('G1 network contract: missing co-op partner pauses movement and puzzle time',()=>{
 const game=createGame();game.phase='playing';
 updateInput(game,0,{right:true,inputSeq:1});
 const x=game.players[0].x,elapsed=game.stats.elapsed;
 for(let n=0;n<90;n++)tick(game,[true,false]);
 assert.equal(game.players[0].x,x);
 assert.equal(game.stats.elapsed,elapsed);
 run(game,2);
 assert.ok(game.players[0].x>x,'movement resumes when both players connect');
});
