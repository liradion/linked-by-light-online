'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {describe,describeNetwork}=require('../public/stage4-lobby.js');
const baseline={room:'PRIVATE6',role:0,hostRole:0,phase:'waiting',connected:[true,true],ready:true,solo:false,lang:'ru'};

test('v32: RTT boundaries classify only this client-to-server round trip',()=>{
 for(const [latency,key] of [[1,'ok'],[179,'ok'],[180,'moderate'],[349,'moderate'],[350,'high'],[900,'high']]){
  assert.equal(describeNetwork({...baseline,latency},'ru').key,key);
 }
});
test('v32: unknown and invalid RTTs fail to measuring, never to good',()=>{
 for(const latency of [0,-1,NaN,Infinity,-Infinity,60001,'50',null,undefined,{},[]]){
  assert.equal(describeNetwork({...baseline,latency},'ru').key,'measuring');
 }
});
test('v32: disconnected state takes precedence over previous RTT',()=>{
 for(const latency of [1,500,NaN]){
  const m=describeNetwork({...baseline,ready:false,latency},'ru');
  assert.equal(m.key,'offline');
  assert.match(m.text,/восстанавливаем/i);
 }
});
test('v32: English and Russian label server RTT, not zero lag',()=>{
 const ru=describeNetwork({...baseline,latency:400},'ru');
 const en=describeNetwork({...baseline,latency:400},'en');
 assert.match(ru.text,/400 мс/);
 assert.match(en.text,/400 ms/);
 assert.match(en.text,/server RTT/i);
 assert.ok(!/zero lag/i.test(en.text));
});
test('v32: preflight never embeds room ID or access tokens',()=>{
 const secretRoom='PRIVATE6',secretToken='private-access-token-DO-NOT-SHARE';
 for(const lang of ['en','ru'])for(const ready of [false,true])for(const latency of [0,50,250,500,Infinity]){
  const result=describeNetwork({...baseline,ready,latency,room:secretRoom,token:secretToken},lang);
  assert.ok(!result.text.includes(secretRoom));
  assert.ok(!result.text.includes(secretToken));
 }
});
test('v32: no change to server-owned lobby start permissions',()=>{
 const host=describe({...baseline,latency:550});
 assert.equal(host.network.key,'high');
 assert.equal(host.canStart,true);
 const guest=describe({...baseline,role:1,latency:25});
 assert.equal(guest.network.key,'ok');
 assert.equal(guest.canStart,false);
 const unpaired=describe({...baseline,connected:[true,false],latency:25});
 assert.equal(unpaired.canStart,false);
 assert.equal(describe({...baseline,phase:'playing'}).hidden,true);
 assert.equal(describe({...baseline,room:''}).hidden,true);
});
