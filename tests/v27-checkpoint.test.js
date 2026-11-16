'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {wrap,unwrap,digest,load,save,validate}=require('../room-checkpoint');
const room=(code='ABCDEF',stage=0)=>({code,game:{stage,phase:'waiting'},seats:[{token:'a'.repeat(48)},null]});
const state=(...rooms)=>({version:11,rooms,v21Gallery:[],v21Board:[],betaFeedback:[]});
test('v27 journal keeps v26-readable snapshots and monotonic revisions',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ll-v27-')),file=path.join(dir,'linked-light-rooms-v11.json');
 try{
  const a=state(room()),b=state(room('ABCDEF',122));
  assert.equal(save(file,a,1000).revision,1);
  assert.equal(save(file,b,2000).revision,2);
  assert.deepEqual(JSON.parse(fs.readFileSync(file,'utf8')),b);
  assert.equal(JSON.parse(fs.readFileSync(file+'.v27','utf8')).revision,2);
  assert.equal(JSON.parse(fs.readFileSync(file+'.v27.bak','utf8')).revision,1);
  assert.equal(load(file).payload.rooms[0].game.stage,122);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('v27 rejects tampering and returns a previous verified checkpoint',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ll-v27-')),file=path.join(dir,'rooms.json');
 try{
  save(file,state(room('ABCDEF',0)),1000);
  save(file,state(room('ABCDEF',123)),2000);
  fs.writeFileSync(file,'{"version":11,"rooms":[not-json');
  const journal=JSON.parse(fs.readFileSync(file+'.v27','utf8'));
  journal.payload.rooms[0].game.stage=124;fs.writeFileSync(file+'.v27',JSON.stringify(journal));
  const warnings=[],got=load(file,x=>warnings.push(x));
  assert.equal(got.payload.rooms[0].game.stage,0);
  assert.ok(warnings.some(x=>x.file.endsWith('.v27')));
  assert.ok(warnings.some(x=>x.file==='rooms.json'));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('v27 can roll back: a newer v26 snapshot overrides old v27 journal',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ll-v27-')),file=path.join(dir,'rooms.json');
 try{
  save(file,state(room('ABCDEF',0)),1000);
  const legacy=state(room('ABCDEF',99));
  fs.writeFileSync(file,JSON.stringify(legacy));
  const newer=new Date(Date.now()+10000);fs.utimesSync(file,newer,newer);
  assert.equal(load(file).payload.rooms[0].game.stage,99);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('envelope refuses unsupported and oversized state shapes',()=>{
 const s=state(room()),e=wrap(s,5,12345);
 assert.equal(e.schema,27);assert.deepEqual(unwrap(e),s);
 assert.equal(digest(s),e.sha256);
 e.payload.rooms[0].game.stage=200;
 assert.throws(()=>unwrap(e),/integrity/i);
 assert.equal(validate({version:11,rooms:[{code:'BAD',game:{stage:0},seats:[]}]}),false);
 assert.equal(validate({version:10,rooms:[]}),false);
 assert.equal(validate({version:11,rooms:new Array(201).fill(room())}),false);
});
