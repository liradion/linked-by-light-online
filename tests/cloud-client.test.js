'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync(require('node:path').join(__dirname,'../public/cloud.js'),'utf8');
function app(){const window={};vm.runInNewContext(src,{window,localStorage:{getItem:()=>null},crypto:{getRandomValues:x=>{x.fill(171);return x}}});return window.GameCloud;}
test('client creates a strong random recovery token and validates it',()=>{const c=app(),key=c.generate();assert.equal(key.length,48);assert.ok(c.validateKey(key));assert.ok(!c.validateKey('ABC'));});
test('two device backups merge completed levels, collected secrets and best scores',()=>{
 const c=app(),one={version:11,checkpoint:18,records:{'3':{stars:2,elapsed:120}},adventure:{secrets:[0,2],pets:[1],achievements:['together'],shards:5,skin:'royal',pet:'fox',home:[{item:'lamp',slot:0}]}};
 const two={version:11,checkpoint:41,records:{'3':{stars:3,elapsed:160},'20':{stars:1,elapsed:210}},adventure:{secrets:[2,5],pets:[4],achievements:['keeper'],shards:9,skin:'classic',pet:'none',home:[]}};
 const m=c.merge(one,two);assert.equal(m.checkpoint,41);assert.equal(m.records['3'].stars,3);assert.deepEqual(Array.from(m.adventure.secrets),[0,2,5]);assert.equal(m.adventure.shards,9);
});