'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const mod=require('../public/keybinds');
function storage(){
 const entries=new Map();
 return {
  getItem:key=>entries.has(key)?entries.get(key):null,
  setItem:(key,value)=>entries.set(key,value),
  entries
 };
}
test('M2 keyboard defaults remain backwards-compatible for Spark and Echo',()=>{
 const mem=storage();
 mod.init({storage:mem});
 mod.reset();
 assert.deepEqual(mod.current(),[
  {left:'a',right:'d',jump:'w',ability:'f'},
  {left:'arrowleft',right:'arrowright',jump:'arrowup',ability:'enter'}
 ]);
 assert.equal(mod.labelFor(0,'left'),'A');
 assert.equal(mod.labelFor(1,'ability'),'Enter');
 assert.equal(mod.normalize(' '),'space');
 assert.equal(mod.normalize('ArrowRight'),'arrowright');
 assert.equal(mod.normalize('Spacebar'),'space');
});
test('M2 keyboard remaps are persistent, allow different roles and reject collisions',()=>{
 const mem=storage();const history=[];
 mod.init({storage:mem,onChange:layout=>history.push(layout)});
 mod.reset();
 assert.equal(mod.set(0,'right','j'),true);
 assert.equal(mod.keyFor(0,'right'),'j');
 assert.equal(mod.keyFor(1,'right'),'arrowright');
 assert.equal(mod.set(0,'jump',' '),true);
 assert.equal(mod.keyFor(0,'jump'),'space');
 assert.equal(mod.set(0,'left','j'),false,'cannot reuse a direction key');
 assert.equal(mod.set(0,'jump','r'),false,'restart remains reserved');
 assert.equal(mod.set(0,'ability','g'),false,'co-op bond remains reserved');
 assert.equal(mod.set(0,'ability','Escape'),false);
 assert.equal(mod.set(0,'ability','Tab'),false);
 assert.equal(mod.set(0,'ability','Control'),false);
 assert.equal(mod.set(0,'ability','?'),false);
 assert.equal(mod.set(0,'ability','f'),true,'reassigning same key is idempotent');
 assert.ok(history.length>=4);
 const persisted=JSON.parse(mem.getItem(mod.KEY));
 assert.equal(persisted[0].right,'j');
 assert.equal(persisted[0].jump,'space');
 mod.reset();
 assert.equal(mod.keyFor(0,'right'),'d');
 mod.read(mem);
 assert.equal(mod.keyFor(0,'right'),'d');
 mem.setItem(mod.KEY,JSON.stringify(persisted));
 mod.read(mem);
 assert.equal(mod.keyFor(0,'right'),'j');
 assert.equal(mod.keyFor(0,'jump'),'space');
 assert.equal(mod.keyFor(1,'right'),'arrowright');
});
test('M2 corrupted or malicious stored controls cannot override reserved shortcuts',()=>{
 const mem=storage();mod.init({storage:mem});
 const invalid=[
  [{left:'r',right:'d',jump:'w',ability:'f'},null],
  [{left:'j',right:'j',jump:'w',ability:'f'},{}],
  'invalid',null
 ];
 for(const data of invalid){
  mem.setItem(mod.KEY,JSON.stringify(data));
  mod.read(mem);
  const m=mod.current();
  for(const role of m){
   const values=Object.values(role);
   assert.equal(new Set(values).size,4);
   assert.ok(values.every(key=>!mod.RESERVED.has(key)));
  }
 }
 mem.setItem(mod.KEY,'not JSON');
 assert.deepEqual(mod.read(mem)[0],{left:'a',right:'d',jump:'w',ability:'f'});
 assert.equal(mod.set(-1,'left','j'),false);
 assert.equal(mod.set(2,'left','j'),false);
 assert.equal(mod.set(0,'invalid','j'),false);
 assert.equal(mod.set(0,'ability','F5'),false);
});
test('M2 mapping API cannot be modified through current() result',()=>{
 const mem=storage();mod.init({storage:mem});mod.reset();
 const snapshot=mod.current();
 snapshot[0].left='h';snapshot[1].right='f';
 assert.equal(mod.keyFor(0,'left'),'a');
 assert.equal(mod.keyFor(1,'right'),'arrowright');
});

test('remapped ability key propagates to current cooperative hints',()=>{
 const {stages}=require('../shared/stages');
 const hints=require('../public/game-hints');
 const store=storage();mod.init({storage:store});mod.reset();
 assert.equal(mod.set(0,'ability','k'),true);
 assert.equal(mod.set(1,'ability','l'),true);
 const base={gateOpen:false,walls:[false],crystals:[false],padLatched:false,adventure:{}};
 const spark=hints.hint(stages[1],base,0,2);
 const echo=hints.hint(stages[1],{...base,walls:[true]},1,2);
 assert.match(spark,/K на ПК/);
 assert.match(echo,/L на ПК/);
 assert.doesNotMatch(spark,/ F на ПК/);
 assert.doesNotMatch(echo,/Enter на ПК/);
 mod.reset();
});
