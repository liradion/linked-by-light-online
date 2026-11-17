'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const strings=require('../public/ui-locale');
const i18n=require('../public/i18n');

function withLanguage(language,callback){
 const previous=i18n.getLanguage();
 i18n.setLanguage(language);
 try{callback();}finally{i18n.setLanguage(previous);}
}
test('all exact server-sent Russian errors have safe, nonempty English translations',()=>{
 const server=fs.readFileSync(path.resolve(__dirname,'../server.js'),'utf8');
 const errors=[...server.matchAll(/error\(\s*(['"])(.+?)\1\)/g)].map(x=>x[2]);
 assert.ok(errors.length>=35,'Server error registry unexpectedly shrank');
 withLanguage('en',()=>{
  for(const original of errors){
   const translated=i18n.networkError(original);
   assert.ok(translated.length>=10,'Empty English server error: '+original);
   assert.ok(!/[\u0400-\u04FF]/.test(translated),'Untranslated server error: '+original);
   assert.notEqual(translated,original);
  }
 });
 withLanguage('ru',()=>{
  for(const original of errors)assert.equal(i18n.networkError(original),original);
 });
});
test('unknown server messages remain untouched; no markup or user-provided text is guessed',()=>{
 const unknown='Custom room name: <img src=x onerror=alert(1)> {unknown}';
 withLanguage('en',()=>{
  assert.equal(i18n.networkError(unknown),unknown);
  assert.equal(i18n.networkError('constructor'),'constructor');
  assert.equal(i18n.networkError('toString'),'toString');
  assert.equal(strings.error(null,'en'),'');
  assert.equal(i18n.networkError('Комната не найдена. Проверьте код.'),'Room not found. Check the code.');
 });
});
test('bilingual settings catalogs contain matching keys and formatted variables',()=>{
 const russian=Object.keys(strings.RU).sort(),english=Object.keys(strings.EN).sort();
 assert.deepEqual(russian,english,'RU/EN settings dictionaries drifted');
 assert.ok(russian.length>=65,'Missing UI settings keys');
 for(const key of russian){
  assert.ok(strings.EN[key].trim().length>0,'Empty English text: '+key);
  assert.ok(strings.RU[key].trim().length>0,'Empty Russian text: '+key);
  assert.ok(!/[\u0400-\u04FF]/.test(strings.EN[key]),'Cyrillic in English UI: '+key);
  const ruVars=[...strings.RU[key].matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map(x=>x[1]).sort();
  const enVars=[...strings.EN[key].matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map(x=>x[1]).sort();
  assert.deepEqual(enVars,ruVars,'Different placeholders in '+key);
 }
});
test('quality, keyboard, gamepad and reconnect strings switch at runtime',()=>{
 withLanguage('en',()=>{
  assert.equal(i18n.ui('quality.graphics'),'Graphics');
  assert.equal(i18n.ui('controls.right'),'Right');
  assert.equal(i18n.ui('pad.ability'),'Ability');
  assert.equal(i18n.ui('hints.more'),'More detail');
  assert.equal(i18n.ui('network.roomHelp').startsWith('Room not found.'),true);
  assert.equal(i18n.ui('network.copyFailed',{room:'ABCDEF',url:'https://example.test/?room=ABCDEF'}),
   'Could not copy automatically. Code: ABCDEF — https://example.test/?room=ABCDEF');
 });
 withLanguage('ru',()=>{
  assert.equal(i18n.ui('controls.right'),'Вправо');
  assert.equal(i18n.ui('pad.ability'),'Способность');
  assert.equal(i18n.ui('hints.more'),'Подробнее');
  assert.equal(i18n.ui('network.lost'),'Связь прервалась. Автоматически переподключаемся…');
 });
});
test('localization never modifies gamepad and keyboard saved layouts',()=>{
 const keyboard=require('../public/keybinds'),pad=require('../public/gamepad-bindings');
 const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};};
 keyboard.init({storage:memory()});pad.init({storage:memory()});
 keyboard.reset();pad.reset();
 keyboard.set(0,'right','j');pad.set('ability',5);
 const beforeKeyboard=keyboard.current(),beforePad=pad.current();
 withLanguage('en',()=>{i18n.ui('controls.right');i18n.ui('pad.ability');});
 assert.deepEqual(keyboard.current(),beforeKeyboard);
 assert.deepEqual(pad.current(),beforePad);
 keyboard.reset();pad.reset();
});
