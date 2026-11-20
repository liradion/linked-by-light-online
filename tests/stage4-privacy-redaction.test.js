'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {normalizeFeedback,cleanFeedback}=require('../public-beta');
test('Stage4: free-text feedback strips common user identifiers before persistence',()=>{
 const raw='На iPhone кнопка не сработала. Email: person@example.com. Телефон +7 700 111 22 33. '+
  'Ссылка https://example.com/?room=ABCD23 и token=secretXYZ123. Код ABCD23.';
 const item=normalizeFeedback({kind:'bug',message:raw,consent:true,platform:'iphone'});
 assert.ok(item);
 for(const value of ['person@example.com','700 111 22 33','https://example.com','secretXYZ123','ABCD23'])
  assert.equal(item.message.includes(value),false,'private literal must be redacted: '+value);
 assert.ok(item.message.includes('[email removed]'));
 assert.ok(item.message.includes('[link removed]'));
 assert.equal(item.platform,'iphone');
 assert.equal(item.email,undefined);assert.equal(item.token,undefined);
});
test('Stage4: restoring older feedback applies the same best-effort redaction',()=>{
 const items=cleanFeedback([{id:'1234567890abcdef',kind:'bug',
  message:'I accidentally entered email me@sample.net and link https://sample.net/private',
  platform:'windows',created:1}]);
 assert.equal(items.length,1);
 assert.equal(items[0].message.includes('me@sample.net'),false);
 assert.equal(items[0].message.includes('https://sample.net'),false);
});
