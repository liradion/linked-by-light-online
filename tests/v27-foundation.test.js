'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {EventEmitter}=require('node:events');
const replay=require('../action-replay-cache');
const {createRuntimeMonitor}=require('../runtime-monitor');
const {attachWebSocket}=require('../websocket-transport');
test('retry acknowledgments are idempotent, bounded and survive sanitized restore',()=>{
 const map=new Map(),msg={t:'v24Action',kind:'kitchen',actionId:'dup-1',ingredient:1};
 assert.equal(replay.lookup(map,msg),null);
 replay.remember(map,msg,{ok:true,detail:'Cooked once'});
 assert.deepEqual(replay.lookup(map,msg),{ok:true,detail:'Cooked once',replayed:true});
 assert.match(replay.lookup(map,{...msg,ingredient:2}).error,/другой/);
 const restored=replay.clean(replay.exportResults(map));
 assert.equal(replay.lookup(restored,msg).replayed,true);
 assert.equal(JSON.stringify(replay.exportResults(restored)).includes('ingredient'),false);
 for(let i=0;i<150;i++)replay.remember(map,{t:'v24Action',actionId:'id'+i,kind:'kitchen',ingredient:i%3},{ok:true});
 assert.equal(map.size,replay.MAX_RESULTS);
 assert.equal(replay.lookup(map,msg),null,'Oldest IDs are evicted as bounded cache fills');
});
test('readiness differentiates cloud outage from healthy liveness',()=>{
 let now=10000;
 const x=createRuntimeMonitor({now:()=>now,storageConfigured:true});
 assert.equal(x.status().ready,true,'Grace period for first backup');
 x.recorded('backup',true,43);
 now+=119000;assert.equal(x.status().ready,true);
 now+=2000;assert.equal(x.status().ready,false);
 x.recorded('backup',false,65);
 assert.equal(x.diagnostics().backupFailures,1);
 x.recorded('backup',true,52);
 assert.equal(x.status().ready,true);
 assert.equal(x.diagnostics().lastErrorCode,null);
 const y=createRuntimeMonitor({now:()=>now,storageConfigured:false,requireDurable:true});
 assert.equal(y.status().ready,false);
 assert.equal(y.status().durableConfigured,false);
});
const masked=(payload,opcode=1,fin=true)=>{
 const bytes=Buffer.isBuffer(payload)?payload:Buffer.from(payload);
 const mask=Buffer.from([1,2,3,4]),header=Buffer.from([0x80*(+fin)+opcode,0x80+bytes.length]);
 const x=Buffer.from(bytes);for(let i=0;i<x.length;i++)x[i]^=mask[i%4];
 return Buffer.concat([header,mask,x]);
};
function fakeSocket(){
 const s=new EventEmitter();s.writable=true;s.destroyed=false;s.writableLength=0;s.frames=[];
 s.write=x=>{s.frames.push(x);return true;};
 s.end=()=>{s.emit('close');};
 s.destroy=()=>{s.destroyed=true;s.emit('close');};
 return s;
}
test('transport accepts fragmented masked JSON and rejects malformed UTF-8',()=>{
 const s=fakeSocket(),seen=[],p=attachWebSocket(s,Buffer.alloc(0),x=>seen.push(x),()=>{});
 const raw=Buffer.from('{"t":"ping"}');
 s.emit('data',masked(raw.subarray(0,5),1,false));
 s.emit('data',masked(raw.subarray(5),0,true));
 assert.deepEqual(seen,[{t:'ping'}]);
 s.emit('data',masked(Buffer.from([0xff]),1,true));
 assert.ok(s.frames.some(x=>x[0]===0x88&&x.readUInt16BE(2)===1007));
 assert.equal(typeof p.ping,'function');
});
test('transport skips obsolete snapshots under backpressure',()=>{
 const s=fakeSocket(),counts={skipped:0},p=attachWebSocket(s,Buffer.alloc(0),()=>{},()=>{},
  {snapshotSkipped:()=>counts.skipped++});
 s.writableLength=24001;
 p.send({t:'snapshot',tick:2});
 p.sendRaw('{"t":"snapshot","tick":3}',true);
 assert.equal(counts.skipped,2);
 p.send({t:'actionResult',ok:true});
 assert.ok(s.frames.length>=1);
});
