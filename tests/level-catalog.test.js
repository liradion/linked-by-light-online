'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {audit}=require('../scripts/audit-levels');
test('commercial stage catalogue has 99 base, one bonus and all version chapters',()=>{
 const r=audit();
 assert.equal(r.total,137);
 assert.deepEqual(r.counts,{base:99,bonus:1,v20:12,v21:10,v23:15});
 assert.equal(r.levels[0].title,'Первый контакт');
 assert.equal(r.levels[1].title,'Мост доверия');
 assert.equal(r.levels[2].title,'Один ритм');
 assert.equal(r.levels[99].chapterType,'bonus');
 assert.equal(r.levels[100].chapterType,'v20');
 assert.equal(r.levels[112].chapterType,'v21');
 assert.equal(r.levels[122].chapterType,'v23');
});
test('all 137 current stage entries pass baseline structural geometry checks',()=>{
 const r=audit();
 assert.equal(r.structuralIssues,0,JSON.stringify(r.issuesByStage));
 assert.ok(r.levels.every(x=>x.reviewStatus==='not_playtested'));
});
