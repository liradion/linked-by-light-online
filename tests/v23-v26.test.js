'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createGame,initStage,tick,snapshot}=require('../game-core');
const puzzle=require('../v23-core'),social=require('../v24-world'),endless=require('../v25-endless'),creator=require('../expansion-core');
const setup=id=>{const g=createGame();initStage(g,id);g.phase='playing';return g;};
const near=(g,role,x)=>{g.players[role].x=x-15;g.players[role].y=501;};
const press=(g,role,kind,values={})=>puzzle.action(g,role,kind,values);
test('v23 has fifteen independent physical levels without changing v19–v21 indices',()=>{
 for(let stage=122;stage<=136;stage++){
  const g=setup(stage),s=snapshot(g,[true,true]);
  assert.equal(s.stage,stage);
  assert.equal(s.world.v23.kind,g.level.v23.kind);
  assert.equal(g.level.gateOpen,false);
  assert.ok(g.level.shards.length===5&&g.level.portal<g.level.width);
  assert.equal(g.adventure.boss,null);
  tick(g,[true,true]);
  assert.equal(g.level.gateOpen,false,'Gate cannot open without a puzzle solution: '+stage);
 }
 for(let stage of [0,99,100,111,112,121])assert.equal(setup(stage).v23,null);
 assert.equal(puzzle.getStage(137),null);
});
test('all 15 v23 mechanics can complete under server-validated role actions',()=>{
 for(let stage=122;stage<=136;stage++){
  const g=setup(stage),z=g.v23,c=g.level.v23;
  const accept=(role,kind,data)=>assert.equal(press(g,role,kind,data).ok,true,stage+': '+kind);
  switch(z.kind){
   case 'gravity-duet':
    near(g,1,c.anchor);accept(1,'gravity_hold');
    near(g,0,c.anchor);accept(0,'gravity_flip');
    near(g,0,c.goal);accept(0,'gravity_seal');
    break;
   case 'prism':
    near(g,0,c.anchor);near(g,1,c.anchor+180);
    for(let i=0;i<3;i++){if(i)accept(1,'mirror_rotate');accept(0,'beam_emit');}
    break;
   case 'resize':
    near(g,0,c.anchor);near(g,1,c.anchor+180);
    accept(0,'resize_form');accept(1,'resize_form');
    near(g,0,c.goal-115);near(g,1,c.goal+125);
    accept(0,'resize_seal');accept(1,'resize_seal');break;
   case 'pendulum':
    near(g,0,c.anchor);near(g,1,c.goal);
    accept(0,'swing_anchor');accept(1,'swing_release');break;
   case 'shadows':
    near(g,1,c.goal);
    for(let i=0;i<7;i++){near(g,0,c.anchor+85+i*100);g.players[0].vx=160;puzzle.afterStep(g,1/60);}
    accept(1,'shadow_lock');break;
   case 'world-switch':
    near(g,0,c.anchor);near(g,1,c.anchor+380);
    accept(0,'world_toggle');accept(1,'world_toggle');
    near(g,0,c.goal+170);near(g,1,c.goal-170);
    accept(0,'world_seal');accept(1,'world_seal');break;
   case 'water':
    near(g,0,c.anchor);accept(0,'water_flow',{value:1});
    for(let i=0;i<3;i++){near(g,1,c.anchor+320+i*160);accept(1,'water_pearl');}
    break;
   case 'magnets':
    near(g,0,c.anchor);near(g,1,c.anchor+150);
    accept(0,'magnet_polarity',{value:1});accept(1,'magnet_polarity',{value:-1});
    for(let i=0;i<520;i++)puzzle.beforeStep(g,1/60);
    break;
   case 'rhythm':
    near(g,0,c.anchor);near(g,1,c.anchor+260);
    for(const [i,value] of [0,2,1,3].entries())accept(i%2,'rhythm_beat',{value});
    break;
   case 'conductor':
    for(let i=0;i<4;i++){
     near(g,0,c.anchor+i*155);accept(0,'conductor_route');
     near(g,1,c.anchor+160+i*155);accept(1,'conductor_cross');
    }
    break;
   default:
    assert.ok(z.boss,'Boss required: '+stage);
    near(g,0,c.goal);near(g,1,c.goal);
    for(let i=0;i<4;i++){
     if(z.kind==='boss-mirror')accept(1,'boss_mirror_trap');
     else if(z.kind==='boss-titan')accept(1,'boss_titan_seal');
     else accept(1,'boss_guard');
     g.tick+=30;accept(0,'boss_strike');
    }
  }
  puzzle.afterStep(g,1/60);
  assert.equal(z.done,true,'Puzzle not solved: '+stage+' '+z.kind);
  tick(g,[true,true]);assert.equal(g.level.gateOpen,true,'Gate not open: '+stage);
 }
});
test('server rejects wrong roles, remote actions and impossible progression',()=>{
 const g=setup(123),c=g.level.v23;
 assert.equal(press(g,1,'beam_emit').ok,false);
 assert.equal(press(g,0,'mirror_rotate').ok,false);
 assert.equal(press(g,0,'beam_emit').ok,false);
 near(g,0,c.anchor);assert.equal(press(g,0,'beam_emit').ok,true);
 assert.equal(press(g,0,'beam_emit').ok,false);
 assert.equal(g.v23.step,1);
});
test('v23 inverse gravity and role-specific platforms are real physics state',()=>{
 const g=setup(122),c=g.level.v23;
 near(g,1,c.anchor);press(g,1,'gravity_hold');near(g,0,c.anchor);press(g,0,'gravity_flip');
 assert.equal(puzzle.gravity(g,g.players[0]),-1300);
 assert.equal(puzzle.gravity(g,g.players[1]),1300);
 assert.ok(puzzle.platforms(g,0).some(x=>x.kind==='v23-ceiling'));
 assert.equal(puzzle.platforms(g,1).some(x=>x.kind==='v23-ceiling'),false);
});
test('v24 quests unlock secret NPC and collaborative epilogues',()=>{
 const r={game:setup(122),v24World:social.initial()};
 const act=(role,kind,data={})=>social.action(r,role,kind,data);
 for(const npc of ['keeper','navigator','hermit']){
  assert.equal(act(0,'npc_meet',{npc}).ok,true);
  for(let i=0;i<3;i++)assert.equal(act(i%2,'npc_quest',{npc}).ok,true);
 }
 assert.equal(act(1,'npc_meet',{npc:'secret'}).ok,true);
 assert.ok(r.v24World.achievements.includes('secret'));
 for(let role=0;role<2;role++)for(let i=0;i<3;i++)assert.equal(act(role,'dialogue_answer',{value:i%3}).ok,true);
 assert.equal(act(0,'ending_vote',{value:2}).ok,true);
 assert.equal(r.v24World.narrative.epilogue,null);
 assert.equal(act(1,'ending_vote',{value:2}).ok,true);
 assert.equal(r.v24World.narrative.epilogue,'aurora');
});
test('v24 cooking, expeditions, observatory, inventions and mini-tournament are duet turn-based',()=>{
 const r={v24World:social.initial(),game:setup(122)},act=(i,k,data={})=>social.action(r,i,k,data);
 assert.equal(act(1,'kitchen',{ingredient:0}).ok,false);
 for(let i=0;i<8;i++)assert.equal(act(i%2,'kitchen',{ingredient:i%4}).ok,true);
 assert.deepEqual(r.v24World.kitchen.finished,['moon-bread']);
 assert.equal(act(0,'expedition_start').ok,true);
 for(let i=0;i<5;i++){
  const value=(r.v24World.expedition.seed+i*7)%3;
  assert.equal(act(i%2,'expedition_step',{value}).ok,true);
 }
 assert.equal(r.v24World.expedition.loot,2);
 for(const [i,n] of [2,0,3,1,1,3,0,2].entries())
  assert.equal(act(i%2,'observatory',{value:n}).ok,true);
 assert.equal(r.v24World.observatory.constellations,1);
 assert.equal(act(0,'craft',{value:'sky-lantern'}).ok,true);
 assert.ok(r.v24World.workshop.crafted.includes('sky-lantern'));
 assert.equal(act(0,'minigame_start',{value:'race'}).ok,true);
 for(let i=0;i<6;i++)assert.equal(act(i%2,'minigame_move',{value:1}).ok,true);
 assert.equal(r.v24World.minigame.active,false);
 assert.ok(r.v24World.achievements.includes('rivals'));
});
test('v24 server state sanitizer bounds arbitrary user-supplied room saves',()=>{
 const clean=social.clean({npcs:['keeper','unsafe','secret'],
 quests:{keeper:9999,navigator:3},kitchen:{step:900,finished:['moon-bread','invalid']},
 narrative:{answers:[new Array(100).fill(2),[]]},events:new Array(40).fill({at:123456,text:'x'.repeat(500)})});
 assert.deepEqual(clean.npcs,['keeper','secret']);
 assert.equal(clean.quests.keeper,0);
 assert.equal(clean.quests.navigator,3);
 assert.equal(clean.kitchen.step,0);
 assert.equal(clean.narrative.answers[0].length,5);
 assert.ok(clean.events.length<=20);
});
test('v25 procedural stage is deterministic and accepted by existing editor sanitizer',()=>{
 for(const seed of [1,2,1024,999999,0xffffffff]){
  const a=endless.generate(seed),b=endless.generate(seed);
  assert.deepEqual(a,b);
  assert.equal(a.platforms.length,7);
  assert.ok(creator.cleanBlueprint(a));
  assert.equal(creator.cleanBlueprint(a).platforms.length,7);
 }
 assert.throws(()=>endless.generate(-1));
});
test('v25 bounded replay, ghost and chunk boundaries exclude private content',()=>{
 const r={game:setup(122),v25:endless.initial()};
 const g=r.game;
 for(let i=0;i<36;i++){
  g.tick=i*6;
  g.players[0].x=100+i*7;g.players[1].x=145+i*9;
  endless.capture(r);
 }
 g.stats.elapsed=7;g.lastResult={completed:true,level:122,elapsed:6,deaths:0};
 g.tick+=6;endless.capture(r);
 const meta=endless.meta(r);
 assert.equal(meta.ghostStage,122);assert.equal(meta.replayStages.length,1);
 const frames=endless.replayChunks(r,'ghost');
 assert.equal(frames.length,1);
 assert.equal(frames[0].frames.length>20,true);
 assert.equal(JSON.stringify(frames).includes('token'),false);
 const restored=endless.clean(endless.persist(r.v25));
 assert.ok(restored.ghost.length<=80);
 assert.equal(restored.replays[0].stage,122);
});
test('v26 assistance slows authoritative room simulation without changing default mode',()=>{
 const a=setup(0),b=setup(0);b.assistMode=true;
 tick(a,[true,true]);tick(b,[true,true]);
 assert.equal(a.stats.elapsed>0,true);
 assert.equal(b.stats.elapsed,0);
 tick(b,[true,true]);assert.equal(b.stats.elapsed>0,true);
});

test('v24 story branch creates a real alternate collidable route in v23',()=>{
 const g=setup(123),base=puzzle.platforms(g,0).length;
 g.v23.branch=1;
 assert.equal(puzzle.platforms(g,0).length,base+1);
 assert.equal(puzzle.snapshot(g).branch,1);
});
test('dragon guard has an expiring time window and mirror/titan need special actions',()=>{
 const dragon=setup(133),d=dragon.level.v23;
 near(dragon,1,d.goal);assert.equal(press(dragon,1,'boss_guard').ok,true);
 near(dragon,0,d.goal);puzzle.beforeStep(dragon,6);
 assert.equal(dragon.v23.boss.shield,false);
 assert.equal(press(dragon,0,'boss_strike').ok,false);
 const mirror=setup(134),m=mirror.level.v23;
 near(mirror,1,m.goal);assert.equal(press(mirror,1,'boss_guard').ok,false);
 near(mirror,0,m.goal);assert.equal(press(mirror,1,'boss_mirror_trap').ok,true);
 assert.equal(press(mirror,0,'boss_strike').ok,true);
 const titan=setup(135),t=titan.level.v23;
 near(titan,1,t.goal-150);assert.equal(press(titan,1,'boss_guard').ok,false);
 assert.equal(press(titan,1,'boss_titan_seal').ok,true);
});
