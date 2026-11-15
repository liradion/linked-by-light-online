'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createGame,initStage,tick,snapshot}=require('../game-core');
const v21=require('../v21-core'),social=require('../v21-social');
const expansion=require('../expansion-core');
const park=(g,role,x)=>{g.players[role].x=x-15;g.players[role].y=501;};
const setup=(id)=>{const g=createGame();initStage(g,id);g.phase='playing';return g;};
const act=(g,role,kind,value)=>v21.action(g,role,kind,value===undefined?{}:{value});
test('v21 has ten new authoritative stages; v19 and v20 remain stable',()=>{
 for(let i=112;i<=121;i++){
  const g=setup(i),state=snapshot(g,[true,true]);
  assert.equal(state.world.v21.stageId,'v21-'+String(i-111).padStart(2,'0'));
  assert.equal(g.level.shards.length,5);assert.equal(g.level.portal<g.level.width,true);
  assert.equal(g.adventure.boss,null);
 }
 assert.equal(setup(0).v21,null);
 assert.equal(setup(99).v21,null);
 assert.equal(setup(100).v21,null);
 assert.equal(v21.getStage(122),null);
});
test('all ten distinct puzzles complete by two server-validated participants',()=>{
 for(let stage=112;stage<=121;stage++){
  const g=setup(stage),z=g.v21,c=g.level.v21;
  if(z.kind==='trails'){
   for(let i=0;i<4;i++){
    g.tick+=30;g.players[0].vx=200;park(g,0,420+i*100);park(g,1,420+i*100);
    v21.afterStep(g,1/60);
   }
  }else if(z.kind==='transfer'){
   park(g,0,c.anchor);assert.equal(act(g,0,'transfer_send').ok,true);
   park(g,1,c.goal);assert.equal(act(g,1,'transfer_receive').ok,true);
   park(g,1,c.goal+370);assert.equal(act(g,1,'transfer_deliver').ok,true);
  }else if(z.kind==='knowledge'){
   park(g,1,c.anchor+200);for(const value of [2,0,1])assert.equal(act(g,1,'knowledge_symbol',value).ok,true);
  }else if(z.kind==='lantern'){
   park(g,0,c.anchor);assert.equal(act(g,0,'lantern_toggle').ok,true);
   park(g,1,c.goal);v21.afterStep(g,1/60);
   assert.equal(act(g,0,'lantern_toggle').ok,true);
  }else if(z.kind==='transform'){
   park(g,0,c.anchor);park(g,1,c.anchor+440);
   assert.equal(act(g,0,'transform').ok,true);assert.equal(act(g,1,'transform').ok,true);
   park(g,0,c.anchor+150);park(g,1,c.anchor+550);
   assert.equal(act(g,0,'transform_collect').ok,true);assert.equal(act(g,1,'transform_collect').ok,true);
  }else if(z.kind==='weather'){
   park(g,0,c.anchor);park(g,1,c.goal);
   assert.equal(act(g,0,'weather_wind').ok,true);assert.equal(act(g,1,'weather_rain').ok,true);
   park(g,0,c.goal);for(let i=0;i<130;i++)v21.afterStep(g,1/60);
  }else if(z.kind==='cargo'){
   for(let i=0;i<3;i++){
    park(g,0,z.cargo.x);park(g,1,z.cargo.x);
    assert.equal(act(g,0,'cargo_push').ok,true);
    assert.equal(act(g,1,'cargo_push').ok,true);
   }
  }else if(z.kind==='tree'){
   for(let i=0;i<6;i++){
    park(g,i%2,c.anchor+i*115);
    assert.equal(act(g,i%2,'tree_grow').ok,true);
   }
  }else if(z.kind==='maze'){
   park(g,1,c.anchor);
   for(let i=0;i<3;i++){
    assert.equal(act(g,1,'maze_rotate').ok,true);park(g,0,c.anchor+370+i*150);
    assert.equal(act(g,0,'maze_checkpoint').ok,true);
   }
  }else if(z.kind==='asymmetry'){
   park(g,1,c.anchor);park(g,0,c.anchor+220);
   assert.equal(act(g,1,'asym_action').ok,true);assert.equal(act(g,0,'asym_cross').ok,true);
   park(g,0,c.anchor+430);park(g,1,c.anchor+670);
   assert.equal(act(g,0,'asym_action').ok,true);assert.equal(act(g,1,'asym_cross').ok,true);
  }
  v21.afterStep(g,1/60);
  assert.equal(z.completed,true,'Puzzle incomplete: '+stage+' / '+z.kind);
  tick(g,[true,true]);
  assert.equal(g.level.gateOpen,true,'Puzzle exit unavailable: '+stage);
 }
});
test('wrong roles and impossible commands cannot bypass stage mechanics',()=>{
 const g=setup(113),c=g.level.v21;
 park(g,1,c.goal);
 assert.equal(act(g,1,'transfer_receive').ok,false);
 assert.equal(act(g,1,'transfer_send').ok,false);
 assert.equal(act(g,0,'transfer_deliver').ok,false);
 v21.afterStep(g,1/60);
 assert.equal(g.v21.completed,false);
});
test('branching route modifies only new physics stage',()=>{
 const g=setup(114),base=v21.platformRects(g,0).length;
 g.v21.branch=1;
 assert.equal(v21.platformRects(g,0).length,base+1);
 assert.equal(setup(99).level.v21,undefined);
});
test('story mode requires unanimity and prequel is role-scoped',()=>{
 const r={code:'ABCDEF',game:setup(112),v21World:social.roomsProfile()};
 assert.equal(social.act(r,0,'mode_vote',{value:'romance'}).ok,true);
 assert.equal(r.v21World.mode,'friends');
 assert.equal(social.act(r,1,'mode_vote',{value:'romance'}).ok,true);
 assert.equal(r.v21World.mode,'romance');
 assert.equal(social.act(r,0,'prequel').ok,true);
 assert.deepEqual(r.v21World.prequel,[1,0]);
 assert.equal(social.act(r,0,'branch_vote',{value:1}).ok,true);
 assert.equal(social.act(r,1,'branch_vote',{value:1}).ok,true);
 assert.equal(r.v21World.branch,1);
});
test('time-capsule messages are private until next stage and deletable by author only',()=>{
 const r={code:'ABCDEF',game:setup(112),v21World:social.roomsProfile()};
 assert.equal(social.act(r,0,'letter_send',{value:'Встретимся у звёзд'}).ok,true);
 assert.equal(social.privateState(r,1).letters.length,0);
 assert.equal(social.act(r,0,'letter_send',{value:'another'}).ok,false);
 r.game.stage=113;
 assert.equal(social.privateState(r,1).letters.length,1);
 const id=r.v21World.letters[0].id;
 assert.equal(social.act(r,1,'letter_delete',{value:id}).ok,false);
 assert.equal(social.act(r,0,'letter_delete',{value:id}).ok,true);
 assert.equal(social.privateState(r,1).letters.length,0);
});
test('living home requires alternating duet, painting respects halves, melody cannot be spammed',()=>{
 const r={code:'ABCDEF',game:setup(112),v21World:social.roomsProfile()};
 assert.equal(social.act(r,1,'garden_tend').ok,false);
 for(let i=0;i<8;i++)assert.equal(social.act(r,i%2,'garden_tend').ok,true);
 assert.equal(r.v21World.garden.growth,4);
 assert.equal(social.act(r,1,'paint_cell',{x:1,y:2,value:4}).ok,false);
 assert.equal(social.act(r,0,'paint_cell',{x:1,y:2,value:4}).ok,true);
 assert.equal(r.v21World.painting[17],4);
 assert.equal(social.act(r,1,'music_note',{value:3}).ok,false);
 for(let i=0;i<16;i++)assert.equal(social.act(r,i%2,'music_note',{value:i%8}).ok,true);
 assert.equal(r.v21World.melody.length,16);
 assert.equal(social.act(r,0,'music_note',{value:1}).ok,false);
});
test('seasonal tale requires completion of 2 levels, both roles, four scenes',()=>{
 const r={code:'ABCDEF',game:setup(112),v21World:social.roomsProfile()};
 assert.equal(social.act(r,0,'season_step').ok,false);
 r.v21World.completed=['v21-01','v21-02'];
 for(let i=0;i<4;i++)assert.equal(social.act(r,i%2,'season_step').ok,true);
 assert.equal(r.v21World.seasons.length,1);
 assert.equal(r.v21World.trophies.length,1);
 assert.equal(social.act(r,0,'season_step').ok,false);
});
test('community validates safe geometry and public gallery never leaks room owner',()=>{
 const blueprint={v:1,title:'Дорога двух огней',platforms:[{x:500,y:399,w:110,h:16}]};
 const item=social.published(blueprint,'ABCDEF',expansion.cleanBlueprint);
 assert.ok(item&&/^[a-f0-9]{12}$/.test(item.id));
 const unpublished=social.publicGallery([item]);
 assert.equal(item.status,'pending');
 assert.equal(unpublished.length,0);
 item.status='approved';
 const list=social.publicGallery([item]);
 assert.equal(list.length,1);
 assert.equal(JSON.stringify(list).includes('ABCDEF'),false);
 assert.equal(social.published({v:1,title:'Bad',platforms:[{x:-500,y:0,w:100,h:16}]},'ABCDEF',expansion.cleanBlueprint),null);
});
test('server-only completed stage awards diary, firefly, medal once',()=>{
 const r={code:'ABCDEF',game:setup(112),v21World:social.roomsProfile()},board=[];
 r.game.lastResult={completed:true,level:112,elapsed:45,stars:3,deaths:0};
 social.completed(r,board);social.completed(r,board);
 assert.equal(r.v21World.completed.length,1);
 assert.equal(r.v21World.aquarium.length,1);
 assert.equal(r.v21World.trophies.length,1);
 assert.equal(r.v21World.diary.length,1);
});

test('trail bridge is physically necessary to cross asymmetric floor gap',()=>{
 const game=setup(112),c=game.level.v21;
 assert.equal(game.level.floor.length,2);
 assert.ok(game.level.floor[0][1]<game.level.floor[1][0]);
 const bridge=v21.platformRects(game,0).find(x=>x.kind==='v21-spark-route');
 assert.ok(bridge);
 assert.equal(v21.platformRects(game,1).some(x=>x.kind==='v21-spark-route'),false);
 const renderer=require('../public/reconciliation.js');
 const host=renderer.geometry(game.level,{v21:v21.snapshot(game)},0);
 const guest=renderer.geometry(game.level,{v21:v21.snapshot(game)},1);
 assert.ok(host.some(x=>x.x===bridge.x));
 assert.equal(guest.some(x=>x.x===bridge.x&&x.w===bridge.w),false);
});
test('orb form requires both players and adds a real extra platform',()=>{
 const game=setup(116),anchor=game.level.v21.anchor,goal=game.level.v21.goal;
 park(game,0,anchor);park(game,1,anchor+440);
 for(let i=0;i<2;i++){
  assert.equal(v21.action(game,0,'transform').ok,true);
  assert.equal(v21.action(game,1,'transform').ok,true);
 }
 assert.deepEqual(game.v21.transform.forms,['orb','orb']);
 assert.equal(v21.action(game,0,'transform_orb_link').ok,false);
 park(game,0,goal);park(game,1,goal);
 assert.equal(v21.action(game,0,'transform_orb_link').ok,true);
 assert.equal(game.v21.transform.orbLink,true);
 assert.ok(v21.platformRects(game,0).some(x=>x.kind==='v21-orb'));
});
test('role-specific bridges, tunnel and story branch affect collision prediction',()=>{
 const prediction=require('../public/reconciliation.js');
 const light=v21.getStage(115);
 assert.ok(light.floor.length===2,'Lantern level must have physical floor gap');
 const world={v21:{kind:'lantern',branch:1,lantern:{lit:false}}};
 const host=prediction.geometry(light,world,0),guest=prediction.geometry(light,world,1);
 assert.ok(host.some(x=>x.x===light.v21.anchor+310));
 assert.equal(guest.some(x=>x.x===light.v21.anchor+360&&x.y===459),false);
 world.v21.lantern.lit=true;
 assert.ok(prediction.geometry(light,world,1).some(x=>x.x===light.v21.anchor+360));
 assert.ok(prediction.geometry(light,world,0).some(x=>x.x===light.v21.anchor+310&&x.y===399));
 const fox=v21.getStage(116);
 assert.ok(prediction.geometry(fox,{v21:{kind:'transform',transform:{forms:['normal','normal']}}},1).some(x=>x.x===fox.v21.anchor+320));
 assert.equal(prediction.geometry(fox,{v21:{kind:'transform',transform:{forms:['normal','fox']}}},1).some(x=>x.x===fox.v21.anchor+320),false);
});
test('cloud profile merges v21 milestones and best records with v19/v20 intact',()=>{
 const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
 const sandbox={window:{},localStorage:{getItem:()=>null}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/cloud.js'),'utf8'),sandbox);
 const base=()=>({version:11,checkpoint:15,records:{},adventure:{
  secrets:[1],pets:[],memories:[],achievements:['together'],
  v20:{unlockedStages:['v20-01'],records:{'v20-01':{stars:2,elapsed:80}}},
  v21:{unlockedStages:[],completed:[],trophies:[],aquarium:[],garden:{growth:0,steps:0},records:{},diary:[]}
 }});
 const a=base(),b=base();
 a.adventure.v21={unlockedStages:['v21-01'],records:{'v21-01':{stars:2,elapsed:32}},completed:['v21-01'],garden:{growth:2,steps:4},trophies:['trophy-v21-01'],diary:[{type:'event',stage:112,kind:'win',title:'Победа'}]};
 b.adventure.v21={unlockedStages:['v21-02'],records:{'v21-01':{stars:3,elapsed:52}},completed:['v21-02'],garden:{growth:3,steps:6},aquarium:['ember'],diary:[]};
 const merged=sandbox.window.GameCloud.merge(a,b);
 assert.equal(merged.adventure.v21.records['v21-01'].stars,3);
 assert.equal(merged.adventure.v21.unlockedStages.length,2);
 assert.equal(merged.adventure.v21.completed.length,2);
 assert.equal(merged.adventure.v21.garden.growth,3);
 assert.equal(merged.adventure.v20.unlockedStages.length,1);
 assert.equal(merged.adventure.secrets.length,1);
});
