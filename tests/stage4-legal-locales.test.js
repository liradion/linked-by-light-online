'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=name=>fs.readFileSync(path.resolve(__dirname,'../public',name),'utf8');
test('stage4 RU/EN privacy documents are linked and honest about limits',()=>{
 const ru=read('privacy.html'),en=read('privacy-en.html');
 assert.match(ru,/hreflang="en"/);assert.match(en,/hreflang="ru"/);
 assert.match(en,/localStorage/);assert.match(en,/feedback is only submitted/i);
 assert.match(en,/100 latest feedback reports/);assert.match(en,/legal compliance certification/);
});
test('stage4 RU/EN terms explain moderation and no beta purchases',()=>{
 const ru=read('terms.html'),en=read('terms-en.html');
 assert.match(ru,/hreflang="en"/);assert.match(en,/hreflang="ru"/);
 assert.match(en,/no paid items/i);assert.match(en,/before approval/i);
 assert.match(en,/contact information and a legal review remain outstanding/i);
});
test('stage4 beta policy links select language dynamically without private user state',()=>{
 const script=read('beta.js');
 assert.match(script,/dataset\.betaPolicy=type/);
 assert.match(script,/link\.href=\(privacy\?'\/privacy':'\/terms'\)/);
 assert.match(script,/refreshLanguage\(\);\s*\}/);
});
