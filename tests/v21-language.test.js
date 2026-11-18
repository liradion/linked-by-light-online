'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const locale=require('../public/v21-locale');

const read=name=>fs.readFileSync(path.resolve(__dirname,'../public',name),'utf8');
function scene(language='en'){
 const context={
  GameV21Locale:locale,GameI18n:{getLanguage:()=>language},
  GameV21Stages:{stages:Array.from({length:10},(_,i)=>({title:'Level '+i,objective:'Objective '+i}))}
 };
 vm.runInNewContext(read('v21.js'),context,{filename:'v21.js'});
 return {game:context.GameV21,setLanguage:next=>{language=next;}};
}
test('v21 authored RU/EN catalog covers puzzle, story, music, seasonal events and photos',()=>{
 assert.ok(Object.keys(locale.EN).length>=160);
 for(const [source,translation] of Object.entries(locale.EN)){
  assert.ok(source.length>0&&translation.length>0,'missing v21 resource '+source);
  assert.ok(!/[\u0400-\u04ff]/.test(translation),'untranslated English v21 resource '+source);
  assert.equal(locale.text(source,'ru'),source);
  assert.equal(locale.text(source,'en'),translation);
 }
 const {game,setLanguage}=scene('en');
 assert.equal(game.localize('Глава v21 · 10 испытаний'),'Chapter v21 · 10 challenges');
 assert.equal(game.localize('Мост из следов'),'Trail bridge');
 assert.equal(game.localize('Запечатанные послания'),'Sealed letters');
 assert.equal(game.localize('Музыкальная комната'),'Music room');
 assert.equal(game.localize('Сезонные главы'),'Seasonal chapters');
 assert.equal(game.localize('📷 Создать памятное фото'),'📷 Save a memory photo');
 setLanguage('ru');
 assert.equal(game.localize('Музыкальная комната'),'Музыкальная комната');
});
test('v21 user content, codes and room commands are preserved',()=>{
 const {game}=scene();
 for(const authored of ['LL1.personal-xxx','Моя карта с другом','Private message','Aiko 123','Игрок', '✦ OUR CUSTOM STAGE'])
  assert.equal(game.localize(authored),authored);
 const source=read('v21.js');
 assert.match(source,/api\.send\?\.\(\{t:'v21Action',kind,\.\.\.params,actionId:nonce/);
 assert.match(source,/request\('v21Publish'/);
 assert.match(source,/api\.send\?\.\(\{t:'selectStage',stage:112\+i\}\)/);
 assert.match(source,/paraRaw\(diary,\(item\.day\|\|''\)\+' · '\+item\.title\)/);
 assert.match(source,/item\.body/);
 assert.match(source,/node\('strong','',item\.title\)/);
 assert.doesNotMatch(source,/innerHTML\s*=/);
});
test('v21 dialog uses local language, official stage catalog and preserves unsent drafts',()=>{
 const source=read('v21.js'),html=read('index.html');
 assert.match(html,/\/v21-locale\.js\?v=1/);
 assert.match(html,/\/v21\.js\?v=21\.3/);
 assert.ok(html.indexOf('/v21-locale.js?v=1')<html.indexOf('/v21.js?v=21.3'));
 assert.match(source,/GameI18n\?\.stageTitle\?\.\(112\+i,level\.title\)/);
 assert.match(source,/GameI18n\?\.stageObjective\?\.\(stage,/);
 assert.match(source,/mountDialogLanguage\?\.\(dialog\)/);
 assert.match(source,/drafts\.letter=currentLetter\.value/);
 assert.match(source,/drafts\.photo=currentPhoto\.value/);
 assert.match(source,/editor\.id='v21-letter-draft'/);
 assert.match(source,/focusedId==='v21-letter-draft'/);
 assert.match(source,/root\.GameI18n\?\.subscribe\?\.\(\(\)=>/);
});
