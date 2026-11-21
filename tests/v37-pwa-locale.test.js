'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {guidance}=require('../public/pwa.js');
test('v37: English iPhone Safari installation steps are localized and native-app claim is absent',()=>{
 const x=guidance(true,'en');
 assert.match(x.title,/Linked by Light/);
 assert.match(x.intro,/Safari/);
 assert.deepEqual(x.steps,['Tap Share in Safari.','Choose Add to Home Screen.','Tap Add.']);
 assert.match(x.hint,/internet/);
 assert.doesNotMatch(JSON.stringify(x),/App Store|TestFlight|native iOS|Steamworks/);
});
test('v37: RU Windows/Chrome and iOS steps differ without collecting personal info',()=>{
 const desktop=guidance(false,'ru'),phone=guidance(true,'ru');
 assert.match(desktop.intro,/Chrome|Edge/);
 assert.match(phone.intro,/iPhone/);
 assert.equal(desktop.steps.length,2);
 for(const payload of [desktop,phone])assert.doesNotMatch(JSON.stringify(payload),/room=|password|token|email/);
});
test('v37: invalid locale falls back to RU',()=>{
 assert.deepEqual(guidance(false,'unknown'),guidance(false,'ru'));
 const a=guidance(true,'ru');a.steps.push('injected');
 assert.equal(guidance(true,'ru').steps.length,3);
});
