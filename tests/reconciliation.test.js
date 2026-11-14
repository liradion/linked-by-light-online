'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createPredictor,integrate,geometry,DT}=require('../public/reconciliation');
const {createGame,initStage,tick,updateInput,snapshot}=require('../game-core');
const {stages}=require('../shared/stages');
const online=[true,true];

test('physics for simple horizontal platform and wall agrees with authoritative server',()=>{
 const g=createGame();initStage(g,0);g.phase='playing';
 const world=snapshot(g,online).world,solids=geometry(g.level,world);
 let p={...g.players[0]};
 for(let i=0;i<60;i++){
  updateInput(g,0,{right:true});tick(g,online);
  p=integrate(p,{right:true,left:false},solids,g.level.width,DT);
 }
 assert.ok(Math.abs(p.x-g.players[0].x)<1,`sim x ${p.x}, server x ${g.players[0].x}`);
 assert.ok(Math.abs(p.y-g.players[0].y)<1,`sim y ${p.y}, server y ${g.players[0].y}`);
});
test('server ACK is only issued after the authoritative physics tick',()=>{
 const g=createGame();g.phase='playing';updateInput(g,0,{inputSeq:42,right:true});
 assert.equal(snapshot(g,online).ack[0],0);
 tick(g,online);assert.equal(snapshot(g,online).ack[0],42);
 updateInput(g,0,{inputSeq:22,left:true});tick(g,[true,false]);
 assert.equal(snapshot(g,[true,false]).ack[0],42);
});
test('reconciliation discards acknowledged inputs and keeps unprocessed commands',()=>{
 const p=createPredictor(),level=stages[0],ground={x:90,y:501,vx:0,vy:0,grounded:true,cool:0,dash:0,face:1,type:0,w:30,h:43};
 for(let i=1;i<=10;i++)p.send({inputSeq:i,right:true,jumpSeq:i===8?1:0},i*40);
 p.reconcile(ground,6,level,{pads:[false,false],crystals:[],walls:[],gateOpen:false},0,430,{jumpSeq:0});
 assert.equal(p.pending(),4);
 assert.ok(p.display(0.016).x>=ground.x);
 p.reconcile({...ground,x:160},10,level,{},0,450,{jumpSeq:1});
 assert.equal(p.pending(),0);
 assert.ok(Number.isFinite(p.display(0.016).x));
});
test('extreme server correction snaps, small drift eases',()=>{
 const p=createPredictor(),level=stages[0],a={x:100,y:501,vx:0,vy:0,grounded:true,type:0,w:30,h:43};
 p.reconcile(a,0,level,{},0,0);assert.equal(Math.round(p.display(.016).x),100);
 p.reconcile({...a,x:120},0,level,{},0,0);const eased=p.display(.016).x;
 assert.ok(eased>100&&eased<120);
 p.reconcile({...a,x:620},0,level,{},0,0);
 assert.equal(p.display(.016).x,620);
});
test('reset removes unacknowledged prediction history after a stage change',()=>{
 const p=createPredictor(),level=stages[0],a={x:90,y:501,vx:0,vy:0,grounded:true,type:0,w:30,h:43};
 p.send({inputSeq:21,right:true},22);p.reconcile(a,0,level,{},0,100);
 assert.equal(p.pending(),1);p.reconcile(a,0,stages[1],{},1,100);
 assert.equal(p.pending(),0);
});
test('local movement responds before another network snapshot arrives',()=>{
 const p=createPredictor(),level=stages[0],state={x:90,y:501,vx:0,vy:0,grounded:true,type:0,w:30,h:43};
 p.reconcile(state,0,level,{},0,100);
 const before=p.display(.016).x;
 p.send({inputSeq:1,right:true},100);
 const after=p.display(.016,{left:false,right:true},level,{},.22).x;
 assert.ok(after>before,`expected immediate rightwards movement ${after} > ${before}`);
});
test('stage transitions preserve input event sequence to avoid phantom jumps',()=>{
 const g=createGame();initStage(g,42);g.phase='playing';
 updateInput(g,0,{inputSeq:50,jumpSeq:9,abilitySeq:4});tick(g,online);
 initStage(g,43);assert.equal(g.input[0].jumpSeq,9);assert.equal(g.input[0].abilitySeq,4);
 updateInput(g,0,{inputSeq:51,jumpSeq:9,abilitySeq:4});
 assert.equal(g.input[0].jumpQueued,false);assert.equal(g.input[0].abilityQueued,false);
});