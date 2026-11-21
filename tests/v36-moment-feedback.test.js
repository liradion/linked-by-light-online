'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {detect,apply}=require('../public/v36-moments.js');
const snap=(world,stage=3)=>({stage,phase:'playing',world});
test('v36: shared checkpoint is announced only once per server-owned transition',()=>{
 const before=snap({checkpoint:{index:-1}}),after=snap({checkpoint:{index:0}});
 const event=detect(before,after,'ru');
 assert.equal(event.key,'checkpoint');
 assert.match(event.text,/точка восстановления/);
 assert.equal(detect(after,after),null);
 assert.equal(detect(after,snap({checkpoint:{index:0}},4)),null);
});
test('v36: bridge and pad confirmation are original localized signals',()=>{
 assert.equal(detect(snap({bridgeLatched:false}),snap({bridgeLatched:true}),'en').key,'bridge');
 assert.match(detect(snap({padLatched:false}),snap({padLatched:true}),'en').text,/Cooperative/);
});
test('v36: gate and missing snapshot never duplicate existing gate announcement',()=>{
 assert.equal(detect(snap({checkpoint:{index:-1}}),snap({checkpoint:{index:0},gateOpen:true})),null);
 assert.equal(detect(null,snap({bridgeLatched:true})),null);
 assert.equal(detect(snap({bridgeLatched:false}),{stage:3,phase:'waiting',world:{bridgeLatched:true}}),null);
});
test('v36: no room tokens, private fields or speculative progression in hints',()=>{
 const a=snap({checkpoint:{index:-1},room:'ABCDEF',token:'secret'});
 const b=snap({checkpoint:{index:0},room:'ABCDEF',token:'secret'});
 const before=JSON.stringify(b),event=detect(a,b,'en');
 assert.ok(event&&!event.text.includes('ABCDEF')&&!event.text.includes('secret'));
 assert.equal(JSON.stringify(b),before);
});
test('v36: feedback dispatch does not mutate world and respects optional audio',()=>{
 const a=snap({bridgeLatched:false}),b=snap({bridgeLatched:true});
 const toasts=[],tones=[],toast={dataset:{}};
 const ok=apply(a,b,'en',(...args)=>toasts.push(args),(...args)=>tones.push(args),toast);
 assert.equal(ok,true);assert.equal(toast.dataset.milestone,'bridge');
 assert.equal(toasts.length,1);assert.equal(tones.length,1);
 assert.equal(b.world.bridgeLatched,true);
 assert.equal(apply(b,b,'en',()=>{throw Error('not expected')},null,toast),false);
});
