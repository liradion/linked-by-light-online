'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createGame,initStage,tick,snapshot}=require('../game-core');
const v20=require('../v20-core');
const registry=require('../shared/v20-stages');
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');

function fresh(index){
 const g=createGame();initStage(g,index);g.phase='playing';return g;
}
function configureTether(g){
 assert.equal(v20.action(g,0,'tether_attach').ok,true);
 const [x,y]=g.level.v20.tether;
 g.players[0].x=x-15;g.players[1].x=y-15;
 v20.afterStep(g,1/60);assert.equal(g.v20.flags.tether,true);
}
function configurePhase(g){
 const [x,y]=g.level.v20.phase;
 g.players[0].x=x-15;g.players[1].x=y-15;
 assert.equal(v20.action(g,0,'phase_shift').ok,true);
 assert.equal(v20.action(g,1,'phase_shift').ok,true);
 assert.equal(g.v20.flags.phase,true);
}
function configureTime(g){
 const [x,y]=g.level.v20.time;
 g.players[0].x=x-15;g.players[1].x=y-15;
 assert.equal(v20.action(g,0,'time_lock').ok,true);
 assert.equal(v20.action(g,1,'time_echo').ok,true);
 assert.equal(g.v20.flags.time,true);
}
test('v20 has twelve independent stages and does not change 100 original stage indexes',()=>{
 assert.equal(registry.stages.length,12);
 for(let id=100;id<=111;id++){
  const g=fresh(id),state=snapshot(g,[true,true]);
  assert.equal(g.level.v20Id,'v20-'+String(id-99).padStart(2,'0'));
  assert.equal(state.world.v20.stageId,g.level.v20Id);
  assert.ok(g.level.portal<g.level.width);
  assert.equal(g.adventure.boss,null);
  assert.equal(g.adventure.arcade,null);
 }
 assert.equal(fresh(0).v20,null);assert.equal(fresh(99).v20,null);
});
test('cooperative tether, phases, time and combination can each be completed',()=>{
 for(const id of [100,101,102,106]){
  const g=fresh(id),kind=g.v20.kind;
  if(['tether','combo'].includes(kind))configureTether(g);
  if(['phase','combo'].includes(kind))configurePhase(g);
  if(['time','combo'].includes(kind))configureTime(g);
  v20.afterStep(g,1/60);
  assert.equal(g.v20.complete,true,'stage '+id);
  assert.equal(v20.completed(g),true);
 }
});
test('tether force stays bounded and is inactive after disconnect',()=>{
 const g=fresh(100);
 assert.equal(v20.action(g,0,'tether_attach').ok,true);
 g.players[0].x=100;g.players[1].x=430;
 for(let i=0;i<60;i++)v20.beforeStep(g,1/60);
 for(const p of g.players)assert.ok(Number.isFinite(p.vx)&&Math.abs(p.vx)<=740);
 g.players[1].x=800;v20.beforeStep(g,1/60);assert.equal(g.v20.tether.active,false);
 const before=g.players.map(p=>p.x);
 tick(g,[true,false]);assert.deepEqual(g.players.map(p=>p.x),before);
});
test('boss stages have distinct bosses and alternate authorized role hits',()=>{
 for(const id of [103,107,111]){
  const g=fresh(id);
  const kind=g.v20.kind;
  if(['tether','combo'].includes(kind))configureTether(g);
  if(['phase','combo'].includes(kind))configurePhase(g);
  if(['time','combo'].includes(kind))configureTime(g);
  v20.afterStep(g,1/60);
  const boss=g.v20.boss;assert.ok(boss&&g.v20.complete);
  for(let i=0,n=boss.max;i<n;i++){
   v20.afterStep(g,1/60);
   const role=boss.next;g.players[role].x=boss.x-15;
   v20.onAbility(g,g.players[role]);
   if(i===n-2)assert.equal(boss.phase,3,'boss must reach third phase before death');
  }
  assert.equal(boss.hp,0);assert.equal(v20.completed(g),true);
 }
});
test('story requires matching votes by both authorized players',()=>{
 const room={game:fresh(101),v20Story:v20.cleanStory()};
 const item=v20.scene(101);
 assert.equal(item.choices.length,2);
 assert.equal(v20.vote(room,0,item.id,0).committed,false);
 assert.equal(v20.vote(room,1,item.id,1).disagree,true);
 assert.equal(v20.vote(room,1,item.id,0).committed,true);
 assert.equal(room.v20Story.choices[item.id],0);
 assert.equal(v20.vote(room,1,'scene-12',0).ok,false);
});
test('home garden and memory need both players and award only once',()=>{
 const room={v20Home:v20.cleanHome()};
 assert.equal(v20.homeAction(room,1,'reflect').ok,false);
 for(let i=0;i<6;i++)assert.equal(v20.homeAction(room,i%2,i%2?'reflect':'shine').ok,true);
 assert.equal(room.v20Home.garden.completed,true);
 assert.equal(v20.homeAction(room,0,'shine').ok,false);
 for(let i=0;i<8;i++)assert.equal(v20.homeAction(room,i%2,i%2?'place':'reveal').ok,true);
 assert.equal(room.v20Home.memory.completed,true);
 assert.equal(v20.homeAction(room,0,'flower').ok,true);
 assert.equal(room.v20Home.decor.length,1);
});
test('v19 cloud profiles retain old values and merge v20 records',()=>{
 const localStorage={getItem:()=>null};const sandbox={window:{},localStorage};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/cloud.js'),'utf8'),sandbox);
 const a={version:11,checkpoint:12,adventure:{secrets:[2],pets:[1],achievements:['together'],memories:[],v20:{unlockedStages:['v20-01'],records:{'v20-01':{stars:2,elapsed:70}},unlockedDecor:['flower']}}};
 const b={version:11,checkpoint:17,adventure:{secrets:[3],pets:[2],achievements:[],memories:[],v20:{unlockedStages:['v20-02'],records:{'v20-01':{stars:3,elapsed:85}},unlockedDecor:['crystal']}}};
 const m=sandbox.window.GameCloud.merge(a,b);
 assert.equal(m.checkpoint,17);assert.equal(m.adventure.v20.records['v20-01'].stars,3);
 assert.equal(m.adventure.v20.unlockedStages.length,2);
 assert.equal(m.adventure.secrets.length,2);
});

test('client geometry reconciles role-specific phase ledges and temporal motion',()=>{
 const predictor=require('../public/reconciliation.js');
 const level=v20.getStage(101);
 const world={v20:{kind:'phase',phase:{flags:[true,false],state:'shadow'}}};
 const p0=predictor.geometry(level,world,0),p1=predictor.geometry(level,world,1);
 assert.ok(p0.some(x=>x.x===900&&x.y===438));
 assert.ok(p1.some(x=>x.x===1340&&x.y===438));
 const other=v20.getStage(102);
 other.platforms.push({x:1120,y:414,w:142,h:18,temporal:true});
 const time=predictor.geometry(other,{v20:{time:{platformX:1207}}},0);
 assert.ok(time.some(x=>x.temporal&&x.x===1207));
});
