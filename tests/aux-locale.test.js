'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const catalog=require('../public/aux-locale');
const i18n=require('../public/i18n');

function runIn(lang,callback){
 const before=i18n.getLanguage();
 i18n.setLanguage(lang);
 try{callback();}finally{i18n.setLanguage(before);}
}
test('cloud, account, editor and v21 gallery RU/EN resources have full key parity and placeholders',()=>{
 const russian=Object.keys(catalog.RU).sort(),english=Object.keys(catalog.EN).sort();
 assert.deepEqual(russian,english,'Auxiliary UI dictionaries have mismatched keys');
 assert.ok(russian.length>=95,'Unexpectedly small UI catalog');
 for(const key of russian){
  assert.ok(catalog.RU[key].trim().length>0,'Missing RU value '+key);
  assert.ok(catalog.EN[key].trim().length>0,'Missing EN value '+key);
  assert.ok(!/[\u0400-\u04FF]/.test(catalog.EN[key]),'Untranslated English '+key);
  const placeholders=s=>[...s.matchAll(/\{(\w+)\}/g)].map(x=>x[1]).sort();
  assert.deepEqual(placeholders(catalog.EN[key]),placeholders(catalog.RU[key]),'Mismatched variables '+key);
 }
});
test('cloud keys, Google account and community gallery messages are localized per-device',()=>{
 runIn('en',()=>{
  assert.equal(i18n.aux('cloud.keyLabel'),'Recovery key');
  assert.equal(i18n.aux('cloud.keyPlaceholder'),'48 characters');
  assert.equal(i18n.aux('cloud.disabled').includes('not configured'),true);
  assert.equal(i18n.aux('auth.guest').includes('guest'),true);
  assert.equal(i18n.aux('auth.signedIn',{name:'Aiko'}),'Signed in: Aiko');
  assert.equal(i18n.aux('gallery.platforms',{count:5,author:'Artist'}),'5 platforms · Artist');
  assert.equal(i18n.aux('editor.codePlaceholder').includes('friend'),true);
  assert.equal(i18n.aux('gallery.report'),'Report');
 });
 runIn('ru',()=>{
  assert.equal(i18n.aux('cloud.keyLabel'),'Ключ восстановления');
  assert.equal(i18n.aux('auth.signedIn',{name:'Aiko'}),'Вход выполнен: Aiko');
  assert.equal(i18n.aux('gallery.platforms',{count:5,author:'Artist'}),'5 платформ · Artist');
  assert.equal(i18n.aux('editor.codePlaceholder').includes('код друга'),true);
 });
});
test('unknown auxiliary UI keys and personal content are not auto-translated',()=>{
 runIn('en',()=>{
  assert.equal(i18n.aux('not.catalogued'),'not.catalogued');
  assert.equal(i18n.aux('auth.signedIn',{name:'Пользователь'}),'Signed in: Пользователь');
  assert.equal(i18n.aux('gallery.platforms',{count:2,author:'Автор'}),'2 platforms · Автор');
  assert.equal(catalog.text('gallery.platforms','en',{author:'A',count:4}),'4 platforms · A');
 });
});
test('localization only touches presentation and preserves cloud encryption, auth endpoints and editor export grammar',()=>{
 const read=name=>fs.readFileSync(path.resolve(__dirname,'../public/'+name),'utf8');
 const cloud=read('cloud.js'),auth=read('auth.js'),editor=read('expansion-ui.js'),gallery=read('v21.js');
 assert.match(cloud,/function merge\(a,b\)/);
 assert.match(cloud,/async function sync\(\)/);
 assert.match(cloud,/key\}\)/);
 assert.match(auth,/\/api\/auth\//);
 assert.match(auth,/profilePayload\(\)/);
 assert.match(editor,/return 'LL1\.'\+btoa/);
 assert.match(editor,/body\.querySelector\('#exp-note-draft'\)/);
 assert.match(editor,/body\.querySelector\('#exp-map-code'\)/);
 assert.match(gallery,/node\('strong','',item\.title\)/,'Public author map title must stay untouched');
});
