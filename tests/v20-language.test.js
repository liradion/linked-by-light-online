'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const read=file=>fs.readFileSync(path.resolve(__dirname,'../public/',file),'utf8');
function makeGame(language='ru'){
 const context={GameI18n:{getLanguage:()=>language}};
 vm.runInNewContext(read('v20.js'),context,{filename:'v20.js'});
 return {game:context.GameV20,language:next=>{language=next;}};
}
test('v20 story, controls and HUD translate by local device language',()=>{
 const scene=makeGame('en'),tr=scene.game.translate;
 assert.equal(tr('Связанные светом · История и дом'),'Linked by Light · Story & Home');
 assert.equal(tr('⛓ Соединить нить'),'⛓ Attach tether');
 assert.equal(tr('◈ Переключить мир'),'◈ Shift dimension');
 assert.equal(tr('◷ Восстановить эхо'),'◷ Restore echo');
 assert.equal(tr('Искра · нить'),'Spark · tether');
 assert.equal(tr('Помочь друг другу'),'Help each other');
 assert.equal(tr('Гостиная'),'Living room');
 assert.equal(tr('Питомец и украшения'),'Pet and decorations');
 assert.equal(tr('Искра: «Ты ещё слышишь меня?»'),'Spark: “Can you still hear me?”');
 assert.equal(tr('Герои: «Дорогу для следующих».'),
 'Heroes: “A path for those who follow.”');
 scene.language('ru');
 assert.equal(tr('Искра: «Ты ещё слышишь меня?»'),'Искра: «Ты ещё слышишь меня?»');
 assert.equal(tr('Гостиная'),'Гостиная');
});
test('v20 locale never rewrites unknown names, personal text, tokens or map codes',()=>{
 const {game}=makeGame('en');
 for(const authored of ['Авторская карта','Личный текст','LL1.abcd1234','Aiko','✦ Spark & Echo','unknown-token']){
  assert.equal(game.translate(authored),authored);
 }
 assert.equal(game.translate('Любая новая строка'),'Любая новая строка');
});
test('v20 selector refreshes visible controls without altering multiplayer action protocol',()=>{
 const src=read('v20.js'),i18n=read('i18n.js'),html=read('index.html');
 assert.match(src,/GameI18n\?\.subscribe\?\.\(refreshLanguage\)/);
 assert.match(src,/GameI18n\?\.mountDialogLanguage\?\.\(dialog\)/);
 assert.match(i18n,/\.v20-top/);
 assert.match(src,/if\(dialog\?\.open\)render\(\)/);
 assert.match(html,/\/v20\.js\?v=20\.1/);
 assert.match(src,/api\.send\?\.\(\{t:type,actionId,kind,\.\.\.extra\}\)/);
 assert.match(src,/t:'selectStage'/);
 assert.match(src,/stage:100/);
 assert.doesNotMatch(src,/innerHTML\s*=/);
});
