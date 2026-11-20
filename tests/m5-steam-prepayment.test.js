'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {FORMATS,scene}=require('../scripts/generate-steam-concepts.cjs');
const {dimensions,report}=require('../scripts/validate-steam-assets.cjs');
const ROOT=path.resolve(__dirname,'..');
test('M5 store concepts cover official 2026 Steam capsule and library sizes',()=>{
 const expected={
  'store-header':[920,430],'store-small':[462,174],'store-main':[1232,706],
  'store-vertical':[748,896],'library-capsule':[600,900],
  'library-hero':[3840,1240],'library-logo':[1280,720],
  'library-header':[920,430],'shortcut-icon':[256,256],'app-icon':[184,184]
 };
 assert.equal(FORMATS.length,Object.keys(expected).length);
 for(const d of FORMATS){
  assert.deepEqual([d.w,d.h],expected[d.id]);
  assert.match(scene(d),new RegExp('width="'+d.w+'" height="'+d.h+'"'));
  assert.doesNotMatch(scene(d),/https?:\/\//);
  assert.doesNotMatch(scene(d),/mock screenshot|player review|price|trailer/i);
 }
});
test('M5 images cannot be marked complete without actual files',()=>{
 const empty=path.join(__dirname,'nonexistent-steam-artifacts');
 const r=report(empty);
 assert.equal(r.status,'INCOMPLETE');
 assert.ok(r.errors.length>=15);
});
test('M5 PNG image header reader validates exact dimensions',()=>{
 const bytes=Buffer.alloc(30);
 Buffer.from('89504e470d0a1a0a','hex').copy(bytes,0);
 bytes.writeUInt32BE(920,16);bytes.writeUInt32BE(430,20);
 const tmp=require('node:os').tmpdir(),p=path.join(tmp,'m5-steam-asset-'+process.pid+'.png');
 try{fs.writeFileSync(p,bytes);const x=dimensions(p);assert.equal(x.width,920);assert.equal(x.height,430);assert.equal(x.format,'png');}
 finally{fs.rmSync(p,{force:true});}
});
test('M5 materials do not claim Steam onboarding or payment was performed',()=>{
 const docs=fs.readFileSync(path.join(ROOT,'docs/M5_STEAMWORKS_ENTRY.md'),'utf8');
 assert.match(docs,/PRE-INTEGRATION/);
 const content=fs.readFileSync(path.join(ROOT,'scripts/generate-steam-concepts.cjs'),'utf8');
 assert.match(content,/not gameplay screenshots/i);
});
