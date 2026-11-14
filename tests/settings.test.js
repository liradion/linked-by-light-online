'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function load(){const cache=new Map(),root={};const doc={documentElement:{style:{setProperty(){}},dataset:{}},getElementById:()=>null};const storage={getItem:k=>cache.get(k)||null,setItem:(k,v)=>cache.set(k,v)};
 const navigator={hardwareConcurrency:6,getGamepads:()=>[]};
 const ctx=vm.createContext({window:root,document:doc,localStorage:storage,navigator,Math,JSON,setTimeout,console});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/quality.js'),'utf8'),ctx);
 return {ui:root.GameQuality,cache,doc};}
test('adaptive snapshot delay reacts to high ping and jitter but remains bounded',()=>{
 const {ui}=load();let d=ui.interpolationDelay();assert.ok(d>=85&&d<=235);ui.net(100);assert.ok(ui.interpolationDelay()>=d);
 for(let i=0;i<8;i++)ui.net(i%2?560:180);const high=ui.interpolationDelay();assert.ok(high>d);assert.ok(high<=235);const stats=ui.stats();assert.ok(stats.jitter>10);
});
test('graphics, button geometry and audio settings use safe limits',()=>{
 const {ui,doc}=load();ui.apply();assert.equal(doc.documentElement.dataset.gameGraphics,'high');assert.equal(ui.settings().buttons,54);
 ui.setSound(false);assert.equal(ui.settings().sound,false);
});