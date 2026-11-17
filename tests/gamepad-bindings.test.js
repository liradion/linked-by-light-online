'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const gamepad=require('../public/gamepad-bindings');
function storage(){
 const map=new Map();
 return {getItem:key=>map.get(key)||null,setItem:(key,val)=>map.set(key,String(val)),map};
}
function controller(pressedIndices=[]){
 return {connected:true,mapping:'standard',axes:[0,0],buttons:Array.from({length:16},(_,i)=>({
  pressed:pressedIndices.includes(i),value:pressedIndices.includes(i)?1:0
 }))};
}
test('M2 gamepad defaults use standard face buttons and reserve D-pad movement',()=>{
 const store=storage();gamepad.init({storage:store});gamepad.reset();
 assert.deepEqual(gamepad.current(),{jump:0,ability:1,bond:2,emote:3});
 assert.deepEqual([...gamepad.ACTIONS],['jump','ability','bond','emote']);
 assert.equal(gamepad.buttonFor('ability'),1);
 assert.equal(gamepad.buttonFor('unknown'),null);
 for(const reserved of [8,9,14,15]){
  assert.equal(gamepad.ALLOWED.includes(reserved),false);
  assert.equal(gamepad.set('jump',reserved),false);
 }
 assert.equal(gamepad.set('jump',-1),false);
 assert.equal(gamepad.set('jump',16),false);
 assert.equal(gamepad.set('jump','5'),false);
});
test('M2 remapping persists, rejects collisions and restores defaults',()=>{
 const store=storage();gamepad.init({storage:store});gamepad.reset();
 assert.equal(gamepad.set('ability',5),true);
 assert.equal(gamepad.buttonFor('ability'),5);
 assert.equal(gamepad.set('jump',5),false,'a second action cannot use the same button');
 assert.equal(gamepad.set('emote',7),true);
 assert.equal(gamepad.set('bogus',6),false);
 const snapshot=gamepad.current();
 snapshot.ability=9;
 assert.equal(gamepad.buttonFor('ability'),5);
 assert.equal(gamepad.read(store).ability,5);
 assert.deepEqual(JSON.parse(store.getItem(gamepad.KEY)),{jump:0,ability:5,bond:2,emote:7});
 gamepad.reset();
 assert.deepEqual(gamepad.current(),{jump:0,ability:1,bond:2,emote:3});
});
test('M2 corrupted input and duplicate saved assignments cannot break controls',()=>{
 const store=storage();gamepad.init({storage:store});
 for(const value of ['not json','null','{}','{"jump":5,"ability":5,"bond":2,"emote":3}',
  '{"jump":15,"ability":1,"bond":2,"emote":3}']){
  store.setItem(gamepad.KEY,value);
  const current=gamepad.read(store);
  assert.deepEqual(current,{jump:0,ability:1,bond:2,emote:3},value);
 }
 store.setItem(gamepad.KEY,'{"jump":4,"ability":1,"bond":2,"emote":3}');
 assert.equal(gamepad.read(store).jump,4);
});
test('M2 pressed gamepad button is resolved to the mapped action',()=>{
 const store=storage();gamepad.init({storage:store});gamepad.reset();
 const pad=controller([1,4]);
 assert.equal(gamepad.active(pad,'ability'),true);
 assert.equal(gamepad.active(pad,'jump'),false);
 assert.equal(gamepad.set('ability',5),true);
 assert.equal(gamepad.active(pad,'ability'),false);
 assert.equal(gamepad.set('jump',4),true);
 assert.equal(gamepad.active(pad,'jump'),true);
 assert.equal(gamepad.active(controller([5]),'ability'),true);
 assert.equal(gamepad.active(null,'ability'),false);
 assert.equal(gamepad.pressed(controller([6]),6),true);
 assert.equal(gamepad.pressed(controller(),6),false);
});
test('M2 quality input polls bindings and releases movement on gamepad removal',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const quality=fs.readFileSync(path.join(__dirname,'../public/quality.js'),'utf8');
 assert.match(quality,/root\.GamePadBindings/);
 assert.match(quality,/bindings\.active\(pad,action\)/);
 assert.match(quality,/document\.querySelector\('dialog\[open\]'\)/);
 assert.match(quality,/let pads=\[\]/);
 assert.doesNotMatch(quality,/typeof navigator\.getGamepads!=='function'\)return/);
});
