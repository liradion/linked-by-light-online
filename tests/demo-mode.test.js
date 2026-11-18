'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const demo=require('../shared/demo-mode');
const {createGame,initStage,tick}=require('../game-core');
const connected=[true,true];

test('demo chapter has exactly nine existing ordered stages and a dedicated ending',()=>{
 assert.deepEqual(demo.stages,[0,1,2,3,4,5,6,7,8]);
 assert.equal(demo.last,8);
 assert.equal(demo.chapters.length,9);
 assert.equal(demo.next(8),null);
 assert.equal(demo.next(7),8);
 assert.equal(demo.next(99),null);
 assert.equal(demo.progress(0),1);
 assert.equal(demo.progress(8),9);
 assert.equal(demo.includes(9),false);
 assert.equal(demo.ending.kind,'demo');
});

test('demo advances through stage 0–8, then ends without leaking into stage 9',()=>{
 const game=createGame();
 game.demo=true;game.phase='playing';
 for(let index=0;index<demo.stages.length;index++){
   assert.equal(game.stage,index);
   assert.equal(game.phase,'playing');
   // This tests a previously completed level's transition and doesn't pretend
   // to validate playability of nine human-operated puzzles.
   game.transition=1/120;
   tick(game,connected);
   if(index<demo.last)assert.equal(game.stage,index+1);
   else{
     assert.equal(game.stage,8);
     assert.equal(game.phase,'win');
   }
   assert.equal(game.demo,true);
 }
});

test('ordinary campaign keeps stage 8 → 9 transition intact',()=>{
 const game=createGame();
 initStage(game,8);
 game.phase='playing';game.transition=1/120;
 tick(game,connected);
 assert.equal(game.stage,9);
 assert.equal(game.phase,'playing');
 assert.equal(game.demo,false);
});

test('demo reset to start never clears demo flag and pause remains authoritative',()=>{
 const game=createGame();game.demo=true;initStage(game,5);game.phase='playing';
 const before=game.tick;
 game.transition=1/120;
 tick(game,[true,false]);
 assert.equal(game.stage,5);
 assert.equal(game.transition,1/120);
 assert.equal(game.tick,before+1);
 initStage(game,0);
 assert.equal(game.demo,true);
 assert.equal(game.stage,0);
});

test('completed results remain visible across natural stage transitions',()=>{
 const game=createGame();game.demo=true;game.phase='playing';
 game.lastResult={level:0,completed:true,stars:3,elapsed:15};
 initStage(game,1);
 assert.equal(game.lastResult?.level,0,'result must remain visible for existing scoreboard');
 assert.equal(game.demo,true);
 game.lastResult={level:1,completed:true,stars:2,elapsed:25};
 game.transition=1/120;
 tick(game,connected);
 assert.equal(game.stage,2);
 assert.equal(game.lastResult?.level,1,'natural transition retains short-lived result');
});
