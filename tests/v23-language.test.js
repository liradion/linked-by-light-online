'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const locale=require('../public/v23-locale');

const file=name=>fs.readFileSync(path.join(__dirname,'..','public',name),'utf8');

test('v23-v26 exact authored strings have English matches without translated user content',()=>{
 const ui=file('v23plus.js');
 const cyrillic=[...new Set([...ui.matchAll(/'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)"/g)]
  .map(match=>match[1]??match[2]).filter(x=>/[\u0400-\u04ff]/.test(x)))];
 assert.ok(cyrillic.length>=174,'unexpectedly incomplete v23 source inventory');
 assert.ok(Object.keys(locale.EN).length>=175,'unexpectedly incomplete v23 translation catalog');
 for(const value of cyrillic)assert.ok(Object.hasOwn(locale.EN,value),'missing exact v23 string: '+value);
 for(const [original,english] of Object.entries(locale.EN)){
  assert.ok(english.length>0);
  assert.doesNotMatch(english,/[\u0400-\u04ff]/,'not translated: '+original);
  assert.equal(locale.text(original,'en'),english);
  assert.equal(locale.text(original,'ru'),original);
 }
 for(const userValue of ['Личный текст · Aleksandr','Свой уровень','Напиши мне завтра','user:7','🎨 12✦','private note ✦']){
  assert.equal(locale.text(userValue,'en'),userValue);
 }
});

test('v23-v26 module localizes chapter controls without changing authoritative actions',()=>{
 const context={
  GameV23Locale:locale,GameI18n:{getLanguage:()=>language,stageTitle:(_,title)=>title},
  GameV23Stages:{stages:Array.from({length:15},(_,i)=>({title:'Уровень '+(i+1),objective:'Операция '+(i+1)}))}
 };
 let language='en';
 vm.runInNewContext(file('v23plus.js'),context,{filename:'v23plus.js'});
 const future=context.GameFuture;
 assert.equal(future.localize('Здоровье хранителя'),'Guardian health');
 assert.equal(future.localize('Совместная кухня'),'Shared kitchen');
 assert.equal(future.localize('Призрачные повторы и история'),'Ghost replays and history');
 assert.equal(future.localize('Крупные сенсорные кнопки'),'Large touch controls');
 assert.equal(future.localize('Подарочное приглашение'),'Gift invitation');
 assert.equal(future.localize('Выбранный финал'),'Chosen ending');
 language='ru';assert.equal(future.localize('Выбранный финал'),'Выбранный финал');
 const source=file('v23plus.js');
 for(const action of ['v23Action','v24Action','v25Generate','v25ReplayGet','v26AssistVote']){
  assert.ok(source.includes("'"+action+"'"),'missing server-authoritative action '+action);
 }
 assert.match(source,/api\.send\?\.\(\{t,\.\.\.params,actionId:nonce/);
 assert.match(source,/pRaw\(journal,item\.text\)/);
 assert.match(source,/url\.searchParams\.set\('wish',message\)/);
 assert.doesNotMatch(source,/innerHTML\s*=/);
});

test('v23-v26 official stage language and invitation draft survive tab and locale switches',()=>{
 const source=file('v23plus.js'),html=file('index.html'),i18n=file('i18n.js');
 assert.ok(html.indexOf('/v23-locale.js?v=1')<html.indexOf('/v23plus.js?v=26.1'));
 assert.match(i18n,/\.v2346-header/);
 assert.match(source,/root\.GameI18n\?\.stageTitle\?\.\(stage,level\.title\)/);
 assert.match(source,/root\.GameI18n\?\.stageTitle\?\.\(i\+122,l\.title\)/);
 assert.match(source,/root\.GameI18n\?\.stageObjective\?\.\(stage,level\.objective\)/);
 assert.match(source,/root\.GameI18n\?\.mountDialogLanguage\?\.\(dialog\)/);
 assert.match(source,/root\.GameI18n\?\.subscribe\?\.\(\(\)=>/);
 assert.match(source,/giftDraft\.message=message\.value/);
 assert.match(source,/giftDraft\.theme=theme\.value/);
 assert.match(source,/input\.value=giftDraft\.message/);
 assert.match(source,/theme\.value=giftDraft\.theme/);
 assert.match(source,/input\.dataset\.giftMessage=''/);
 assert.match(source,/theme\.dataset\.giftTheme=''/);
 assert.match(source,/if\(dialog\.open\)sync\(\)/);
});
