'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createCloudSaveQueue}=require('../cloud-save-queue');

const deferred=()=>{
 let resolve,reject;
 const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});
 return {promise,resolve,reject};
};
async function eventually(check){
 for(let i=0;i<300;i++){
  if(check())return;
  await new Promise(resolve=>setTimeout(resolve,2));
 }
 throw Error('Pending cloud write did not reach expected state');
}

test('G3.2: coalesce concurrent forced saves into exactly one serialized latest snapshot',async()=>{
 const gates=[deferred(),deferred()],writes=[],observed=[];
 let stage=0;
 const queue=createCloudSaveQueue({
  capture:()=>({version:11,rooms:[{code:'ABCDEF',game:{stage},seats:[null,null]}]}),
  write:async state=>{writes.push(state.rooms[0].game.stage);return gates[writes.length-1].promise;},
  observe:(ok)=>observed.push(ok)
 });
 const initial=queue.save();
 await eventually(()=>writes.length===1);
 assert.deepEqual(writes,[0]);
 const periodic=queue.save(false);
 assert.strictEqual(periodic,initial,'Non-forced periodic writes reuse the in-flight one');
 const firstForce=queue.save(true),secondForce=queue.save(true);
 assert.strictEqual(firstForce,secondForce,'Concurrent force requests share one next flush');
 stage=1;
 gates[0].resolve(true);
 assert.equal(await initial,true);
 await eventually(()=>writes.length===2);
 assert.deepEqual(writes,[0,1],'Latest state must be captured AFTER the previous write completes');
 gates[1].resolve(true);
 assert.equal(await firstForce,true);
 assert.deepEqual(observed,[true,true]);
 assert.equal(writes.length,2,'No stale concurrent third write');
});

test('G3.2: failed cloud writes unblock next forced write and notify observers',async()=>{
 const first=deferred(),states=[],events=[];
 let version=1,attempt=0;
 const q=createCloudSaveQueue({
  capture:()=>({version}),
  write:async state=>{
   states.push(state.version);
   attempt++;
   if(attempt===1)return first.promise;
   return true;
  },
  observe:(ok,elapsed,error)=>events.push({ok,elapsed,error:!!error})
 });
 const old=q.save();
 await eventually(()=>states.length===1);
 version=2;
 const forced=q.save(true);
 first.reject(Error('mock Supabase timeout'));
 assert.equal(await old,false);
 assert.equal(await forced,true,'A failed first write must not discard the latest forced state');
 assert.deepEqual(states,[1,2]);
 assert.deepEqual(events.map(v=>v.ok),[false,true]);
 assert.equal(events[0].error,true);
 assert.ok(events.every(v=>v.elapsed>=0));
});

test('G3.2: a new force arriving during a queued flush must produce a later third generation',async()=>{
 const gates=[deferred(),deferred(),deferred()],states=[];
 let value=10;
 const q=createCloudSaveQueue({
  capture:()=>({value}),
  write:state=>{states.push(state.value);return gates[states.length-1].promise;}
 });
 const first=q.save();
 await eventually(()=>states.length===1);
 const second=q.save(true);
 value=20;gates[0].resolve(true);
 await first;await eventually(()=>states.length===2);
 assert.deepEqual(states,[10,20]);
 value=30;
 const third=q.save(true);
 assert.notStrictEqual(second,third);
 gates[1].resolve(true);
 assert.equal(await second,true);
 await eventually(()=>states.length===3);
 assert.deepEqual(states,[10,20,30]);
 gates[2].resolve(true);
 assert.equal(await third,true);
});

test('G3.2: failed or rejected storage writes resolve false rather than unhandled promises',async()=>{
 const observed=[];
 const q=createCloudSaveQueue({
  capture:()=>({version:11}),
  write:()=>{throw Error('unavailable');},
  observe:(ok,_elapsed,error)=>observed.push({ok,error:error?.message})
 });
 assert.equal(await q.save(true),false);
 assert.equal(await q.save(true),false);
 assert.deepEqual(observed,[{ok:false,error:'unavailable'},{ok:false,error:'unavailable'}]);
 assert.throws(()=>createCloudSaveQueue({capture:null,write:()=>{}}),/Invalid cloud save queue/);
});
