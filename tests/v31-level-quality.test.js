'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createGame,initStage,tick,updateInput,snapshot}=require('../game-core');
const {stages,GROUND}=require('../shared/stages');
const quality=require('../gameplay-quality'),camera=require('../public/v31-camera');
const predictor=require('../public/reconciliation'),hints=require('../public/game-hints');
const online=[true,true];
function game(n){const g=createGame();initStage(g,n);g.phase='playing';return g;}
function run(g,n=1){for(let i=0;i<n;i++)tick(g,online);}
function controller(){
 const seq=[[0,0,0],[0,0,0]];
 return (g,targets,{dash=false,pulse=false,jumpNear=null}={})=>{
  for(let role=0;role<2;role++){
   const p=g.players[role],error=targets[role]-(p.x+15),right=error>12,left=error< -12;
   const wall=g.level.walls.find(w=>!w.broken),crystal=g.level.crystals.find(c=>!c.on);
   const ability=(dash&&role===0&&wall&&p.x+15>wall.x-65&&p.x+15<wall.x&&p.cool<=0)||
    (pulse&&role===1&&crystal&&Math.abs(crystal.x-(p.x+15))<100&&p.cool<=0);
   const jump=Number.isFinite(jumpNear)&&p.grounded&&right&&p.x+15>jumpNear-110&&p.x+15<jumpNear+5;
   if(ability)seq[role][2]++;if(jump)seq[role][1]++;
   updateInput(g,role,{inputSeq:++seq[role][0],left,right,
    jumpSeq:seq[role][1],abilitySeq:seq[role][2]});
  }
  tick(g,online);
 };
}
function travel(g,drive,targets,until,n=1100,opts={}){
 for(let i=0;i<n;i++){drive(g,targets,opts);if(until(g))return;}
 throw Error('stage '+g.stage+' stuck at '+g.players.map(p=>Math.round(p.x))+
  ' towards '+targets+'; gate='+g.level.gateOpen+', arcade='+g.adventure.arcade?.kind+
  ', checkpoint='+g.quality?.active);
}
function finish(g,drive){
 travel(g,drive,[g.level.portal,g.level.portal],x=>x.transition>0,900);
 assert.equal(g.level.gateOpen,true);
}
test('v31 six authored missions have 20+ units jump headroom, safe floor, explicit objectives and checkpoints',()=>{
 const names=['flowers-wall','first-flight','hold-and-sail','rhythm-duo','combine-three','first-boss'];
 for(let i=3;i<=8;i++){
  const l=stages[i];assert.equal(l.onboarding,names[i-3]);
  assert.ok(l.objective.length>=50&&l.hint.length>=35);
  assert.equal(l.hazards.length,0);assert.equal(l.floor[0][0],0);
  assert.equal(l.floor.at(-1)[1],l.width);
  for(const cp of l.checkpoints)assert.ok(quality.safeGround(l,cp),'unsafe checkpoint '+i+':'+cp);
  for(const p of l.platforms){
   assert.equal(p.oneWay,true);
   assert.ok(GROUND-p.y<=65,'too high level '+i);
  }
  for(const p of l.pads)assert.ok(l.floor.some(([a,b])=>p.x+p.w/2>a+20&&p.x+p.w/2<b-20));
  for(const c of l.crystals)assert.ok(l.floor.some(([a,b])=>c.x>a+20&&c.x<b-20));
  assert.equal(!!l.signature.tutorialOnly,i>=4);
 }
 assert.equal(stages[3].signature.nodes.length,2);
 assert.deepEqual(stages[3].signature.nodes.map(n=>n.role),[0,1]);
});
test('v31 level 4: Spark breaks wall; both naturally touch matching flowers and exit',()=>{
 const g=game(3),drive=controller(),wall=g.level.walls[0];
 travel(g,drive,[wall.x+135,320],x=>x.level.walls[0].broken,750,{dash:true});
 travel(g,drive,g.level.signature.nodes.map(n=>n.x),x=>x.level.signature.done,900);
 finish(g,drive);
});
test('v31 level 5: Echo charges crystal and both enter the airborne ring',()=>{
 const g=game(4),drive=controller(),crystal=g.level.crystals[0];
 travel(g,drive,[crystal.x,crystal.x],x=>x.level.crystals[0].on,850,{pulse:true});
 const arcade=g.adventure.arcade;
 assert.equal(arcade.kind,'flight');
 travel(g,drive,[arcade.ringX+15,arcade.ringX+15],
  x=>x.adventure.arcade.flightHits.every(Boolean),1100,{jumpNear:arcade.ringX});
 assert.equal(arcade.done,true);
 finish(g,drive);
});
test('v31 level 6: a real held plate latches bridge, both steer sail with actual inputs',()=>{
 const g=game(5),drive=controller(),pad=g.level.pads[0],boat=g.adventure.arcade;
 travel(g,drive,[pad.x+pad.w/2,510],x=>x.level.padLatched,650);
 assert.equal(g.level.bridgeLatched,true);
 travel(g,drive,[boat.boat-35,boat.boat+25],x=>x.players.every(p=>Math.abs(p.x+15-boat.boat)<85),800);
 assert.equal(boat.started,true);
 updateInput(g,1,{inputSeq:1000,abilitySeq:1});
 updateInput(g,0,{inputSeq:1000,right:true});
 run(g,125);
 assert.equal(boat.done,true);
 finish(g,drive);
});
test('v31 level 7: Echo crystal followed by two distinct synchronized rhythm abilities',()=>{
 const g=game(6),drive=controller(),crystal=g.level.crystals[0];
 travel(g,drive,[crystal.x,crystal.x],x=>x.level.crystals[0].on,800,{pulse:true});
 const m=g.adventure.arcade;assert.equal(m.kind,'rhythm');
 travel(g,drive,[m.ringX,m.ringX+125],x=>
  Math.abs(x.players[0].x+15-m.ringX)<13&&
  Math.abs(x.players[1].x+15-(m.ringX+125))<13,1000);
 updateInput(g,0,{inputSeq:1700,abilitySeq:1});tick(g,online);
 updateInput(g,1,{inputSeq:1700,abilitySeq:2});tick(g,online);
 run(g,2);assert.equal(m.done,true);
 finish(g,drive);
});
test('v31 level 8: dash wall, Echo crystal and two pads solved with real walking',()=>{
 const g=game(7),drive=controller(),wall=g.level.walls[0],crystal=g.level.crystals[0];
 travel(g,drive,[wall.x+135,300],x=>x.level.walls[0].broken,800,{dash:true});
 travel(g,drive,[crystal.x,crystal.x],x=>x.level.crystals[0].on,800,{pulse:true});
 travel(g,drive,g.level.pads.map(p=>p.x+p.w/2),x=>x.level.padLatched,900);
 finish(g,drive);
});
test('v31 level 9: both activate boss and alternate genuinely fired abilities',()=>{
 const g=game(8),drive=controller(),crystal=g.level.crystals[0];
 travel(g,drive,[crystal.x,crystal.x],x=>x.level.crystals[0].on,700,{pulse:true});
 travel(g,drive,g.level.pads.map(p=>p.x+p.w/2),x=>x.level.padLatched,850);
 run(g,2);assert.equal(g.adventure.boss.active,true);
 const boss=g.adventure.boss;
 travel(g,drive,[boss.x-70,boss.x-70],
  x=>x.players.every(p=>Math.abs(p.x+15-(boss.x-70))<14),850);
 let seq=[0,1];
 for(let n=0;n<3;n++){
  const turn=boss.next;
  for(let t=0;t<90&&g.players[turn].cool>0;t++)run(g);
  updateInput(g,turn,{inputSeq:1800+n,abilitySeq:++seq[turn]});
  tick(g,online);
  assert.equal(boss.hp,2-n,'boss alternating attack '+n);
 }
 run(g,2);assert.equal(g.level.gateOpen,true);
 finish(g,drive);
});
test('v31 checkpoint unlock requires BOTH, intact wall blocks it, falling recovers without resetting objectives',()=>{
 const g=game(7),step=controller(),x=g.level.checkpoints[0];
 travel(g,step,[x+80,200],s=>s.players[0].x+15>x+35,760,{dash:true});
 assert.equal(g.quality.active,-1);
 g.level.walls[0].broken=false; // invariant fixture: an intact wall forbids retroactive grant
 g.players.forEach(p=>{p.x=x+80;p.y=GROUND-p.h;p.grounded=true;});
 quality.advance(g);assert.equal(g.quality.active,-1);
 g.level.walls[0].broken=true;quality.advance(g);
 assert.equal(g.quality.active,0);
 const p=g.players[0];p.y=890;p.vy=950;p.grounded=false;run(g);
 assert.ok(Math.abs(p.x-x)<60);
 assert.equal(g.level.walls[0].broken,true);
 assert.equal(snapshot(g,online).world.checkpoint.recoveries[0],1);
});
test('v31 coyote time is longer only in tutorial; prediction exports same jump parameters',()=>{
 const g=game(3),p=g.players[0];p.grounded=false;p.coyote=.13;
 updateInput(g,0,{jumpSeq:1,inputSeq:1});tick(g,online);
 assert.ok(p.vy<0);
 assert.ok('coyote' in snapshot(g,online).players[0]);
 const r=predictor.integrate({...p,grounded:true,coyote:.15,jumpBuffer:0},
  {jump:true,tutorial:true},[],g.level.width,1/60);
 assert.ok(r.vy<0);
 const other=game(10),q=other.players[0];q.grounded=false;q.coyote=0;
 updateInput(other,0,{jumpSeq:1,inputSeq:1});tick(other,online);
 assert.ok(q.vy>=0);
});
test('v31 camera prioritizes local hero when apart; objective hints stay tied to server state',()=>{
 const a={x:180,y:501,vx:0},b={x:1900,y:501,vx:0};
 assert.ok(camera.targetCamera([a,b],1,2500)-camera.targetCamera([a,b],0,2500)>700);
 assert.equal(camera.targetCamera([a,{...b,x:280}],0,2500),
  camera.targetCamera([a,{...b,x:280}],1,2500));
 assert.ok(camera.integrate(0,[a,b],1,2500,1/60)>0);
 assert.equal(camera.targetCamera([a,b],0,950),0);
 const o=camera.objective(stages[7],{walls:[false],crystals:[false],pads:[false,false],gateOpen:false},0);
 assert.equal(o.kind,'wall');assert.equal(o.x,stages[7].walls[0].x);
});
test('v31 all six role-aware RU and EN stalled-help messages are readable',()=>{
 for(let i=3;i<=8;i++)for(const lang of [false,true]){
  const message=hints.adaptivePrompt(stages[i],{gateOpen:false},0,[],25,0,lang);
  assert.ok(message&&message.length>=35,'missing stage '+i);
  if(lang)assert.doesNotMatch(message,/[\u0400-\u04FF]/);
 }
});

test('v31: invalid restored checkpoints cannot bypass locked walls or unlatchable bridge',()=>{
 const g=game(7);g.quality.active=1;
 quality.clean(g);
 assert.equal(g.quality.active,-1,'old checkpoint behind unbroken wall is invalid');
 const sail=game(5);sail.quality.active=1;
 quality.clean(sail);
 assert.equal(sail.quality.active,0,'after bridge, checkpoint must downgrade when bridge not latched');
 sail.level.padLatched=true;sail.level.bridgeLatched=true;
 sail.quality.active=1;quality.clean(sail);
 assert.equal(sail.quality.active,1,'earned bridge permits checkpoint beyond the gap');
});
test('v31: legacy first-act layouts migrate to curated geometry without resetting compatible progress',()=>{
 const {normalizeIntroLevel}=require('../level-repair');
 const l4=game(3),oldFlowers=structuredClone(l4.level.signature.nodes);
 l4.level.width=2400;l4.level.signature.nodes.push({x:1450,role:0,active:false});
 l4.level.signature.nodes[1].active=true;
 assert.equal(normalizeIntroLevel(l4),true);
 assert.equal(l4.level.width,1700);
 assert.equal(l4.level.signature.nodes.length,2);
 assert.equal(l4.level.signature.nodes[1].active,true);
 const l9=game(8);l9.level.width=2600;
 l9.level.crystals[0].on=true;l9.level.pads[0].pressed=true;
 assert.equal(normalizeIntroLevel(l9),true);
 assert.equal(l9.level.width,1880);
 assert.equal(l9.level.crystals[0].on,true);
 assert.equal(l9.level.pads[0].pressed,true);
 assert.deepEqual(oldFlowers.map(n=>n.role),[0,1]);
});
