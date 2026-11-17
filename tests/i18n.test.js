'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const locale=require('../public/i18n');
const {stages}=require('../shared/stages');
function withEnglish(fn){locale.setLanguage('en');try{fn();}finally{locale.setLanguage('ru');}}
test('G2 i18n preserves original Russian defaults and rejects unsupported locales',()=>{
 locale.setLanguage('ru');
 assert.equal(locale.getLanguage(),'ru');
 assert.equal(locale.setLanguage('de'),false);
 assert.equal(locale.getLanguage(),'ru');
 assert.equal(locale.stageTitle(0,stages[0].title),'Первый контакт');
 assert.equal(locale.stageObjective(0,stages[0].objective),stages[0].objective);
});
test('G2 English first act includes 9 translated stage names and objectives',()=>{
 withEnglish(()=>{
  for(let i=0;i<9;i++){
   assert.equal(typeof locale.stageTitle(i,stages[i].title),'string');
   assert.equal(typeof locale.stageObjective(i,stages[i].objective),'string');
   assert.ok(!/[\u0400-\u04FF]/.test(locale.stageTitle(i,stages[i].title)),'Untranslated title '+i);
   assert.ok(!/[\u0400-\u04FF]/.test(locale.stageObjective(i,stages[i].objective)),'Untranslated objective '+i);
   assert.ok(locale.stageTitle(i,stages[i].title).length>=7);
   assert.ok(locale.stageObjective(i,stages[i].objective).length>=25);
  }
  assert.equal(locale.stageTitle(12,stages[12].title),stages[12].title,
   'Do not misrepresent untranslated chapters as fully localized');
 });
});
test('G2 English HUD handles dynamic gate, wall, crystal and exact co-op counts',()=>{
 withEnglish(()=>{
  assert.match(locale.formatGoal('Ворота открыты! Доберитесь до портала вдвоём.',0),/gate is open/i);
  assert.match(locale.formatGoal('Искра: у светящейся стены нажмите способность (K на ПК или ✦ на телефоне).',1,'K','L'),/\(K on PC/);
  assert.match(locale.formatGoal('Эхо: у кристалла нажмите способность (L на ПК или ✦ на телефоне).',1,'K','L'),/\(L on PC/);
  assert.match(locale.formatGoal('Плиты: Искра — оранжевая, Эхо — голубая. Вместе 1/2',0),/1\/2/);
  assert.match(locale.formatGoal('Встаньте одновременно на плиты: 2/2',2),/2\/2/);
  assert.match(locale.formatGoal('Подойдите к цветам света (4/6)',2),/4\/6/);
  assert.equal(locale.formatGoal('Hello world',42),'Hello world');
  assert.match(locale.formatGoal('Испытание пройдено! Оба к порталу.',4),/portal/);
 });
});
test('G2 English onboarding and demo ending language catalog is complete',()=>{
 withEnglish(()=>{
  for(let i=0;i<5;i++){
   assert.ok(locale.t('chapter'+i).length>=9);
   assert.ok(locale.t('chapter'+i+'Text').length>=50);
  }
  assert.match(locale.t('onboardingStep',{step:2,total:5}),/2 \/ 5/);
  assert.match(locale.translateExact('Два игрока — одно приключение'),/Two players/);
  assert.match(locale.translateExact('Как играть'),/How to play/);
  assert.match(locale.t('demoEndingText'),/completed the demo/);
  assert.match(locale.t('copyInviteMessage',{url:'https://test.invalid/?room=ABC123',room:'ABC123'}),/ABC123/);
 });
});
test('G2 hint localization stays role-specific in English first chapter',()=>{
 withEnglish(()=>{
  const spark=locale.localizeHint('Найдите оранжевую плиту',0,0,2);
  const echo=locale.localizeHint('Найдите голубую плиту',0,1,2);
  assert.match(spark,/orange/);
  assert.match(echo,/blue/);
  assert.ok(!/[\u0400-\u04FF]/.test(spark+echo));
  assert.match(locale.localizeHint('Коснитесь цветами',0,0,1),/orange plate/);
  assert.equal(locale.localizeHint('Оригинальное описание',20,0,2),'Оригинальное описание');
 });
});
test('G2 per-device language preference survives reload without server state changes',()=>{
 const original=globalThis.localStorage;
 const values=new Map([['linked-light-language-v1','en']]);
 globalThis.localStorage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};
 try{
  assert.equal(locale.init(),'en');
  assert.equal(locale.getLanguage(),'en');
  assert.equal(locale.setLanguage('ru'),true);
  assert.equal(values.get('linked-light-language-v1'),'ru');
  assert.equal(locale.init(),'ru');
 }finally{
  if(original===undefined)delete globalThis.localStorage;
  else globalThis.localStorage=original;
  locale.setLanguage('ru');
 }
});
