'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {describe}=require('../public/stage4-lobby.js');
const basic={room:'TEST42',role:0,hostRole:0,phase:'waiting',connected:[true,false],ready:true,solo:false,lang:'ru'};
test('Stage4: no lobby guidance on menu or in active game',()=>{
 assert.equal(describe({...basic,room:''}).hidden,true);
 assert.equal(describe({...basic,phase:'playing'}).hidden,true);
});
test('Stage4: host waits until server marks both players connected',()=>{
 const waiting=describe(basic);
 assert.equal(waiting.key,'hostWaiting');assert.equal(waiting.canStart,false);
 assert.match(waiting.detail,/Отправьте ссылку/);
 const ready=describe({...basic,connected:[true,true]});
 assert.equal(ready.key,'hostReady');assert.equal(ready.canStart,true);
});
test('Stage4: Echo can host independently of device role',()=>{
 const host=describe({...basic,role:1,hostRole:1,connected:[true,false]});
 assert.equal(host.key,'hostWaiting');
 const guest=describe({...basic,role:0,hostRole:1,connected:[true,true]});
 assert.equal(guest.key,'guest');assert.equal(guest.canStart,false);
});
test('Stage4: solo, spectator and network failure never claim two human players',()=>{
 const solo=describe({...basic,solo:true,connected:[true,false]});
 assert.equal(solo.key,'solo');assert.equal(solo.canStart,true);
 assert.match(solo.startLabel,/одному/);
 const spectator=describe({...basic,role:-1,connected:[true,true]});
 assert.equal(spectator.key,'spectator');assert.equal(spectator.canStart,false);
 const offline=describe({...basic,ready:false,connected:[true,true]});
 assert.equal(offline.key,'offline');assert.equal(offline.canStart,false);
});
test('Stage4: English strings stay authored and do not expose room codes',()=>{
 for(const role of [0,1,-1])for(const solo of [false,true]){
  const model=describe({...basic,lang:'en',role,solo});
  assert.ok(model.heading.length&&model.detail.length&&model.status.length);
  assert.equal(model.heading.includes(basic.room),false);
  assert.equal(model.detail.includes(basic.room),false);
 }
 assert.equal(describe({...basic,lang:'en',connected:[true,true]}).startLabel,'Start together ✦');
});
