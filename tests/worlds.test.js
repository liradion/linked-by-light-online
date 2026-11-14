'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {stages,GROUND}=require('../shared/stages');
const core=require('../game-core');const worlds=require('../world-mechanics');
const on=[true,true];
function at(game,role,x,y=GROUND-43){const p=game.players[role];p.x=x-15;p.y=y;p.vx=0;p.vy=0;p.dash=0;p.grounded=true;p.cool=0;return p;}
function pulse(game,role,node,seq){at(game,role,node.x,GROUND-43);game.input[role].abilitySeq=seq-1;core.updateInput(game,role,{left:false,right:false,abilitySeq:seq});core.tick(game,on);}
function frames(g,n){for(let i=0;i<n;i++)core.tick(g,on);}
function activate(g){
 const s=g.level.signature;let seq0=1,seq1=1;
 switch(s.kind){
  case 'flowers':for(const n of s.nodes){at(g,n.role,n.x);frames(g,2);}break;
  case 'forest':for(const n of s.nodes)pulse(g,1,n,seq1++);break;
  case 'tide':for(const n of s.nodes){s.elapsed=s.period*.25;at(g,n.role,n.x);frames(g,1);}break;
  case 'wind':for(const n of s.nodes){const p=at(g,0,n.x,n.y-48);p.grounded=false;frames(g,1);}break;
  case 'constellation':for(const n of s.nodes.slice().sort((a,b)=>a.order-b.order))pulse(g,1,n,seq1++);break;
  case 'prism':case 'city':for(const n of s.nodes)pulse(g,n.role,n,n.role===0?seq0++:seq1++);break;
  case 'river':case 'relay':for(const pair of s.pairs){at(g,0,pair.x0);at(g,1,pair.x1);frames(g,42);}break;
  case 'clock':{
    pulse(g,1,s.nodes[0],seq1++);
    let x=s.barrier.x+76;
    for(;x<g.level.gates[0].x-125;x+=11){
      if(!g.level.floor.some(([a,b])=>x>=a+37&&x<=b-37))continue;
      if(g.level.hazards.some(h=>x>=h.x-45&&x<=h.x+h.w+55))continue;
      if(g.level.platforms.some(p=>x>=p.x-5&&x<=p.x+p.w+40&&p.y<GROUND-50))continue;
      break;
    }
    at(g,0,x);at(g,1,x+12);frames(g,3);break;
  }
  case 'heart':for(const n of s.nodes){if(n.mode==='duo'){
    at(g,0,n.x-6);at(g,1,n.x+9);frames(g,30);
  }else pulse(g,n.role,n,n.role===0?seq0++:seq1++);}break;
 }
 return s.done;
}

test('every one of 99 missions has a unique signature and 11 mechanics',()=>{
 assert.equal(stages.length,99);assert.equal(new Set(stages.map(s=>s.signature.kind)).size,11);
 for(let i=0;i<stages.length;i++){
  assert.equal(stages[i].signature.variant,i%9);
  assert.equal(stages[i].signature.finale,i%9===8);
  assert.ok(stages[i].signature.hint.length>20);
  assert.ok(stages[i].signature.nodes.length+stages[i].signature.pairs.length>0);
 }
});
test('all signature interactables are on walkable floor, with no hazard overlap',()=>{
 for(let i=0;i<stages.length;i++){
  const l=stages[i];
  const all=[...l.signature.nodes.map(n=>n.x),...l.signature.pairs.flatMap(p=>[p.x0,p.x1])];
  if(l.signature.barrier)all.push(l.signature.barrier.x);
  for(const x of all){
   assert.ok(l.floor.some(([a,b])=>x>=a+30&&x<=b-30),`level ${i+1}: node ${x} over pit`);
   assert.ok(l.hazards.every(h=>x<h.x-20||x>h.x+h.w+20),`level ${i+1}: node inside hazard`);
  }
 }
});
test('server-authoritative interactions solve all 99 world signatures',()=>{
 for(let i=0;i<99;i++){
  const g=core.createGame();core.initStage(g,i);g.phase='playing';
  const ok=activate(g);
  assert.equal(ok,true,`level ${i+1}: ${g.level.signature.kind} failed, ${JSON.stringify({active:g.level.signature.nodes.map(n=>n.active),pairs:g.level.signature.pairs.map(p=>p.active),progress:g.level.signature.progress,window:g.level.signature.window})}`);
  assert.equal(core.snapshot(g,on).world.signature.done,true);
 }
});
test('completing both the normal puzzle and signature opens every gate',()=>{
 for(let i=0;i<99;i++){
  const g=core.createGame();core.initStage(g,i);g.phase='playing';
  assert.equal(activate(g),true,`special ${i+1}`);
  for(const w of g.level.walls)w.broken=true;
  for(const c of g.level.crystals)c.on=true;
  if(g.level.puzzle?.pads){for(const pad of g.level.pads)at(g,pad.type,pad.x+pad.w/2);frames(g,25);}
  frames(g,2);
  assert.equal(g.level.gateOpen,true,`gate did not open on level ${i+1}`);
 }
});
test('world logic and timers freeze when one partner disconnects',()=>{
 for(const i of [17,26,35,44,53,62,71,80,89,98]){
  const g=core.createGame();core.initStage(g,i);g.phase='playing';
  const before=g.level.signature.elapsed;framesWhenDisconnected(g,200);
  assert.equal(g.level.signature.elapsed,before,`level ${i+1}`);
 }
});
function framesWhenDisconnected(g,n){for(let i=0;i<n;i++)core.tick(g,[true,false]);}