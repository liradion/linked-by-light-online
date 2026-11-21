'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {describe}=require('../public/v34-steps.js');
const {stages}=require('../shared/stages');
const pair=[{x:100},{x:160}];
const state=(overrides={})=>({gateOpen:false,walls:[],crystals:[],pads:[],padLatched:false,...overrides});
test('v34: role-specific first objective is grounded in the real stage',()=>{
 const level=stages[0];
 assert.equal(describe(level,state(),0,pair,'ru').key,'pad-own');
 assert.match(describe(level,state(),0,pair,'ru').text,/оранжевую/);
 assert.match(describe(level,state(),1,pair,'en').text,/blue plate/);
 assert.equal(describe(level,state({pads:[true,false]}),0,pair,'en').key,'pad-hold');
 assert.equal(describe(level,state({gateOpen:true}),0,pair,'en').key,'portal');
});
test('v34: bridge sequence honors actual wall/plate/crystal state',()=>{
 const level=stages[1];
 assert.equal(describe(level,state({walls:[false],crystals:[false]}),0,pair).key,'wall-dash');
 assert.equal(describe(level,state({walls:[false],crystals:[false]}),1,pair).key,'wall-support');
 const cleared=state({walls:[true],crystals:[false],pads:[true]});
 assert.equal(describe(level,cleared,0,pair,'en').key,'bridge-hold');
 assert.equal(describe(level,cleared,1,pair,'en').key,'bridge-echo');
 assert.equal(describe(level,state({walls:[true],crystals:[true]}),0,pair,'en').key,'team');
});
test('v34: jump hint disappears after first gap, then assigns colored plates',()=>{
 const level=stages[2];
 assert.equal(describe(level,state(),0,pair,'en').key,'jump-gap');
 assert.equal(describe(level,state(),1,[{x:600},{x:600}],'en').key,'pad-own');
});
test('v34: first-act authored mechanics keep real progress order',()=>{
 const flow=[
  [3,{walls:[false]},0,'wall-dash'],
  [4,{crystals:[false]},1,'crystal-pulse'],
  [5,{padLatched:false},0,'sail-hold'],
  [5,{padLatched:true,adventure:{arcade:{started:true,done:false}}},1,'sail-pulse'],
  [6,{crystals:[true]},0,'rhythm'],
  [7,{walls:[true],crystals:[false]},1,'crystal-pulse'],
  [8,{crystals:[true],pads:[true,true],padLatched:true,adventure:{boss:{active:true,hp:2,next:1}}},1,'boss-turn']
 ];
 for(const [index,extra,role,key]of flow)
  assert.equal(describe(stages[index],state(extra),role,pair,'en').key,key,'stage '+index);
});
test('v34: does not show false progress for unknown/custom states',()=>{
 for(const value of [null,{},false,42])
  assert.equal(describe(value,state(),0,pair),null);
 assert.equal(describe(stages[0],null,0,pair),null);
 assert.equal(describe(stages[0],state(),-1,pair),null);
 assert.equal(describe({...stages[0],act:3},state(),0,pair),null);
 assert.equal(describe({...stages[0],onboarding:null},state(),0,pair),null);
});
test('v34: guidance is pure, does not serialize personal or room data',()=>{
 const world=state({room:'SUPERSECRET',token:'PRIVATEKEY',pads:[false,false]});
 const before=JSON.stringify(world);
 const hint=describe(stages[0],world,0,pair,'en');
 assert.equal(JSON.stringify(world),before);
 assert.ok(!hint.text.includes('SUPERSECRET'));
 assert.ok(!hint.text.includes('PRIVATEKEY'));
});
