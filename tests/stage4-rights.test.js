'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {inventory}=require('../scripts/audit-stage4-rights');
test('rights audit walks assets deterministically and never marks them licensed',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'stage4-rights-'));
 try{
  fs.mkdirSync(path.join(root,'public','art'),{recursive:true});
  fs.writeFileSync(path.join(root,'public','art','background.png'),Buffer.alloc(8));
  fs.writeFileSync(path.join(root,'public','test.html'),'<script src="https://cdn.example.com/code.js"></script>');
  fs.writeFileSync(path.join(root,'public','test.css'),'@import url("https://cdn.example.com/skin.css");');
  const v=inventory(root);
  assert.equal(v.status,'RIGHTS_REVIEW_REQUIRED');
  assert.equal(v.assets.length,1);
  assert.equal(v.assets[0].licence,'UNVERIFIED');
  assert.equal(v.externalScriptsAndStyles.length,2);
  assert.ok(v.notes.some(s=>s.includes('licensing clearance')));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('real-repository rights inventory is report-only and cannot claim approval',()=>{
 const actual=inventory(path.join(__dirname,'..'));
 assert.equal(actual.status,'RIGHTS_REVIEW_REQUIRED');
 assert.ok(Array.isArray(actual.assets));
 assert.ok(Array.isArray(actual.externalScriptsAndStyles));
});
