'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const locale=require('../public/v28-locale');
const source=name=>fs.readFileSync(path.resolve(__dirname,'../public',name),'utf8');

test('v28 first-experience strings have complete RU/EN parity; unknown user content is not translated',()=>{
 assert.ok(Object.keys(locale.EN).length>=53,'missing authored first-experience translations');
 for(const [original,english] of Object.entries(locale.EN)){
  assert.ok(original.length>0&&english.length>0);
  assert.doesNotMatch(english,/[\u0400-\u04ff]/,'incomplete English: '+original);
  assert.equal(locale.text(original,'en'),english);
  assert.equal(locale.text(original,'ru'),original);
 }
 for(const custom of ['Личное сообщение','Моя Искра', '◈ Мой герой', 'ABC123','Player-defined stage','Запрос игрока'])
  assert.equal(locale.text(custom,'en'),custom);
});
test('v28 role, ping, Share and tutorial labels follow local device language',()=>{
 let language='en';
 const context={GameV28Locale:locale,GameI18n:{getLanguage:()=>language},performance:{now:()=>100}};
 vm.runInNewContext(source('v28.js'),context,{filename:'v28.js'});
 const game=context.GameV28;
 assert.equal(game.localize('Выберите своего героя (устройство не имеет значения)'),'Choose your hero (any device)');
 assert.equal(game.localize('Играть одному · переключать героев'),'Play solo · switch heroes');
 assert.equal(game.localize('Поделиться приглашением'),'Share invitation');
 assert.equal(game.localize('📍 Метка · T'),'📍 Marker · T');
 assert.equal(game.localize('Сервер пробуждается…'),'Server waking up…');
 assert.equal(game.localize('Искра: выпусти луч, когда зеркало правильно направлено'),'Spark: fire the beam when the mirror is aligned');
 language='ru';
 assert.equal(game.localize('Эхо'),'Эхо');
});
test('v28 language file loads before first-experience UI and uses live notifications',()=>{
 const html=source('index.html'),client=source('client.js'),s=source('v28.js');
 assert.ok(html.indexOf('/v28-locale.js?v=1')<html.indexOf('/v28.js?v=28.1'));
 assert.ok(html.indexOf('/v28.js?v=28.1')<html.indexOf('/client.js?v=26.15'));
 assert.match(s,/root\.GameI18n\?\.subscribe\?\.\(refreshLanguage\)/);
 assert.match(s,/hint\.querySelector\('\.v28-tip-text'\)\.textContent/);
 assert.match(s,/ctx\.fillText\(loc\(c\.text\)/);
 assert.match(client,/GameV28\.onSnapshot\(s\)/);
 assert.match(client,/GameV28\.message\(m\)/);
 assert.match(client,/GameV28\.init\(/);
});
