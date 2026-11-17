'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createTelemetry,EVENTS}=require('../v28-telemetry');
const v28=require('../v28-core');
test('v28 anonymized funnel accepts only allowlisted counters and stage indices',()=>{
 const z=createTelemetry();
 assert.equal(z.record('visit'),true);
 assert.equal(z.record('roomCreated'),true);
 assert.equal(z.record('stageEntered',0),true);
 assert.equal(z.record('playerDisconnected',0),true);
 assert.equal(z.record('stageCompleted',0),true);
 assert.equal(z.record('stageCompleted',136),true);
 assert.equal(z.record('stageCompleted',500),true);
 assert.equal(z.record('playerEmail','test@example.com'),false);
 const a=z.snapshot();
 assert.deepEqual(a.stages.filter(Boolean),[1,1]);
 assert.ok(!JSON.stringify(a).includes('test@example.com'));
 assert.equal(a.counters.stageCompleted,3);
 assert.equal(a.reached[0],1);assert.equal(a.exits[0],1);
 const restored=createTelemetry(a).snapshot();
 assert.deepEqual(a,restored);
 assert.equal(restored.stages.length,137);
 assert.ok(EVENTS.includes('inviteOpened'));
});
test('v28 host role does not depend on seat or device',()=>{
 assert.equal(v28.roleChoice(1),1);
 assert.equal(v28.roleChoice('1'),0);
 assert.equal(v28.owner({hostRole:1},1),true);
 assert.equal(v28.owner({hostRole:1},0),false);
 assert.equal(v28.roleChoice(undefined),0);
});
test('v28 pings stay within server-authoritative level and approved kinds',()=>{
 const level={width:2300};
 assert.equal(v28.validPing({x:2200,y:510,kind:'help'},level),true);
 for(const ping of [{x:2201.1,y:510,kind:'help'},{x:2301,y:5,kind:'here'},{x:0,y:-1,kind:'go'},{x:50,y:20,kind:'script'},{x:'40',y:20,kind:'wait'}])
  assert.equal(v28.validPing(ping,level),false);
 const event=v28.pingData({x:10,y:300,kind:'go',token:'SECRET'},0);
 assert.deepEqual(Object.keys(event).sort(),['at','kind','role','t','x','y']);
 assert.equal(JSON.stringify(event).includes('SECRET'),false);
});
test('v28 level-specific intel is private to roles and safe to expose',()=>{
 const spark=v28.cluesFor(123,0),echo=v28.cluesFor(123,1);
 assert.equal(spark.length,1);assert.equal(echo.length,1);
 assert.ok(spark[0].text.includes('Искра'));
 assert.ok(echo[0].text.includes('Эхо'));
 assert.deepEqual(v28.cluesFor(123,-1),[]);
 assert.deepEqual(v28.cluesFor(24,0),[]);
 assert.deepEqual(v28.cluesFor(136,1).map(x=>x.id),['guard']);
});
test('v28 contextual tutorial covers first ten stages, not story registry',()=>{
 for(let stage=0;stage<10;stage++)assert.equal(v28.tutorial(stage,stage%2,15).stage,stage);
 assert.equal(v28.tutorial(10,0),null);
 assert.equal(v28.tutorial(-1,1),null);
 assert.match(v28.tutorial(0,1,42).text,/Подсказка/);
});

test('v28 Echo host controls leadership actions without taking over Spark mechanics',()=>{
 const {action,initial}=require('../v24-world');
 const r={hostRole:1,v24World:initial()};
 assert.equal(action(r,0,'recipe_select',{value:2}).ok,false);
 assert.equal(action(r,1,'recipe_select',{value:2}).ok,true);
 assert.equal(action(r,0,'expedition_start').ok,false);
 assert.equal(action(r,1,'expedition_start').ok,true);
 assert.equal(action(r,0,'minigame_start',{value:'race'}).ok,false);
 assert.equal(action(r,1,'minigame_start',{value:'race'}).ok,true);
 assert.equal(action(r,0,'kitchen',{ingredient:0}).ok,true,'The physical Spark still starts the duet recipe');
});
