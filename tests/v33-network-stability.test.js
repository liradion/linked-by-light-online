'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createNetworkProbe,describeNetwork,describe}=require('../public/stage4-lobby.js');
const base={room:'PRIVATE6',role:0,hostRole:0,phase:'waiting',connected:[true,true],ready:true,solo:false,lang:'en'};

test('v33: sliding median and spread use at most eight recent RTT replies',()=>{
 const probe=createNetworkProbe();probe.reset(100);
 for(let i=0;i<10;i++)assert.equal(probe.add((i+1)*10,110+i*50),true);
 const sample=probe.snapshot(900);
 assert.deepEqual(sample,{latency:65,variation:70,samples:8,stalled:false});
});
test('v33: transient spikes are reported as variation, not misleading median latency',()=>{
 const probe=createNetworkProbe();probe.reset(0);
 for(const [i,value]of [55,60,560,57].entries())probe.add(value,100+i*100);
 const sample=probe.snapshot(600);
 assert.equal(sample.latency,59);
 assert.equal(sample.variation,505);
 const hint=describeNetwork({...base,...sample},'en');
 assert.equal(hint.key,'high');assert.match(hint.text,/Unstable server RTT/);
 assert.match(hint.text,/RTT spread \(4 samples\): 505 ms/);
});
test('v33: no stale classifications from first two samples or invalid spread',()=>{
 const probe=createNetworkProbe();probe.reset(20);probe.add(80,100);probe.add(900,200);
 const sample=probe.snapshot(250);
 assert.equal(sample.variation,null);
 assert.equal(describeNetwork({...base,...sample},'en').key,'moderate');
 for(const v of [-1,Infinity,NaN,'500',null]){
  assert.equal(describeNetwork({...base,latency:80,variation:v,samples:5},'en').key,'ok');
 }
});
test('v33: stalled after six seconds without a response, recovers on valid pong',()=>{
 const probe=createNetworkProbe();probe.reset(1000);
 assert.equal(probe.snapshot(7000).stalled,false);
 assert.equal(probe.snapshot(7001).stalled,true);
 assert.equal(describeNetwork({...base,...probe.snapshot(7001)},'ru').key,'stalled');
 assert.equal(probe.add(110,7200),true);
 assert.equal(probe.snapshot(8000).stalled,false);
 assert.equal(describeNetwork({...base,...probe.snapshot(8000)},'en').key,'ok');
 assert.equal(probe.snapshot(13201).stalled,true);
});
test('v33: reconnect resets old green/red state without leaking RTT history',()=>{
 const probe=createNetworkProbe();probe.reset(0);
 probe.add(400,20);probe.add(600,30);probe.add(550,40);
 assert.equal(probe.snapshot(50).samples,3);
 probe.reset(9000);
 assert.deepEqual(probe.snapshot(9001),{latency:0,variation:null,samples:0,stalled:false});
 assert.equal(describeNetwork({...base,...probe.snapshot(9001)},'en').key,'measuring');
 assert.equal(describeNetwork({...base,...probe.snapshot(9001),ready:false},'ru').key,'offline');
});
test('v33: malformed or backwards samples cannot refresh the last-seen clock',()=>{
 const probe=createNetworkProbe();probe.reset(100);
 for(const invalid of [-1,0,NaN,Infinity,60001,'140',null,{}])assert.equal(probe.add(invalid,150),false);
 assert.equal(probe.add(140,1000),true);
 assert.equal(probe.add(60,999),false);
 assert.equal(probe.snapshot(7001).stalled,true);
 assert.equal(probe.snapshot(7001).samples,1);
});
test('v33: UI guidance is bilingual and cannot change server-owned start permissions',()=>{
 const s={...base,latency:80,variation:120,samples:5};
 const ru=describeNetwork(s,'ru'),en=describeNetwork(s,'en');
 assert.equal(ru.key,'moderate');assert.equal(en.key,'moderate');
 assert.match(ru.text,/Разброс RTT \(5 замеров\): 120 мс/);
 assert.match(en.text,/Variable server RTT/);
 assert.equal(describe(s).canStart,true);
 assert.equal(describe({...s,role:1}).canStart,false);
 assert.equal(describe({...s,connected:[true,false]}).canStart,false);
 assert.equal(describeNetwork({...s,ready:false,stalled:true},'en').key,'offline');
});
test('v33: no tokens, room code or user identifiers in diagnostics',()=>{
 const raw={...base,room:'SECRET',token:'HIDE-ME',user:'PERSON',latency:100,variation:300,samples:5};
 for(const lang of ['ru','en'])for(const stalled of [false,true]){
  const result=describeNetwork({...raw,stalled},lang);
  for(const secret of ['SECRET','HIDE-ME','PERSON'])assert.ok(!result.text.includes(secret));
 }
});
test('v33: threshold boundaries use inclusive RTT-spread severity',()=>{
 for(const [spread,key]of [[0,'ok'],[99,'ok'],[100,'moderate'],[249,'moderate'],[250,'high']]){
  assert.equal(describeNetwork({...base,latency:60,variation:spread,samples:8},'en').key,key);
 }
});
