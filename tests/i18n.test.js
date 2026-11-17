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
  assert.equal(locale.stageTitle(12,stages[12].title),'Twilight Forest · Stronger Together');
  assert.equal(locale.stageObjective(12,stages[12].objective),'Spark destroys the barrier. Activate both plates.');
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
  assert.match(locale.formatGoal('БОСС Страж · 2/4 HP · атакует Эхо',8),/BOSS · 2\/4 HP · Echo attacks/);
  assert.match(locale.formatGoal('МИНИ-ИГРА: гонка до светового рубежа',8),/MINIGAME: Both race/);
  assert.match(locale.formatGoal('МИНИ-ИГРА: активируйте два ритмических узла',8),/rhythm/);
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
  assert.match(locale.localizeHint('Оригинальное описание',20,0,2),/moon lantern/);
  assert.equal(locale.localizeHint('Оригинальное описание',137,0,2),'Оригинальное описание');
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

test('G2 all 137 authored stages have human-readable English titles, objectives and hints',()=>{
 const catalog=require('../public/stage-locale');
 const main=require('../shared/stages'),v20=require('../shared/v20-stages'),v21=require('../shared/v21-stages'),v23=require('../shared/v23-stages');
 const levels=[...main.stages,main.BONUS_STAGE,...v20.stages,...v21.stages,...v23.stages];
 assert.equal(levels.length,137);
 assert.equal(catalog.WORLDS.length,11);
 assert.equal(catalog.MISSIONS.length,9);
 assert.equal(catalog.EXTRA.length,38);
 assert.equal(catalog.has(136),true);
 assert.equal(catalog.has(137),false);
 withEnglish(()=>{
  for(let index=0;index<levels.length;index++){
   for(const [name,value] of [
    ['title',locale.stageTitle(index,levels[index].title)],
    ['objective',locale.stageObjective(index,levels[index].objective)],
    ['hint',locale.stageHint(index,levels[index].hint)],
    ['world',locale.stageWorld(index)]
   ]){
    assert.equal(typeof value,'string','Bad '+name+' type in stage '+index);
    assert.ok(value.length>5,'Empty '+name+' in stage '+index);
    assert.ok(!/[\u0400-\u04FF]/.test(value),'Cyrillic in '+name+' for stage '+index+': '+value);
   }
   assert.equal(locale.localizeHint(levels[index].objective,index,0,1),
    locale.stageObjective(index,levels[index].objective),'Contextual first-level hint mismatch at '+index);
  }
  assert.match(locale.stageTitle(99,levels[99].title),/Hundredth Light/);
  assert.match(locale.stageTitle(100,levels[100].title),/First Knot/);
  assert.match(locale.stageTitle(112,levels[112].title),/Bridge of Footprints/);
  assert.match(locale.stageTitle(122,levels[122].title),/Two Gravities/);
  assert.match(locale.stageTitle(136,levels[136].title),/Eye of Two Worlds/);
 });
});
test('G2 stage signature and reality hints cover every authored base-world mechanic',()=>{
 const catalog=require('../public/stage-locale');
 withEnglish(()=>{
  for(const [kind,value] of Object.entries(catalog.SIGNATURES)){
   assert.ok(value.label.length>=5);
   assert.ok(locale.signatureTip(kind).length>=30,'Missing signature tip for '+kind);
  }
  for(const kind of ['mirror','chronicle','gravity']){
   assert.ok(locale.realityLabel(kind).length>=7);
   assert.ok(locale.realityTip(kind).length>=30);
  }
  assert.equal(locale.stageTitle(137,'custom stage'),'custom stage');
  assert.equal(locale.stageObjective(-1,'custom objective'),'custom objective');
  assert.match(locale.localizeHint('Нажмите «Нить», пока стоите рядом',100,0,2),/Thread/);
  assert.match(locale.localizeHint('Найдите голубую плиту',25,1,2),/blue plate/);
  assert.match(locale.formatGoal('Порядок звёзд: 2/6. Активируйте их по номерам.',42),/2\/6/);
  assert.match(locale.formatGoal('Пока идут часы, ОБА перейдите временную дверь. Осталось 7 с.',72),/7 s remaining/);
  assert.match(locale.formatGoal('Прошлое активировано. Эхо: включите будущее! Осталось 5 с.',76),/5 s remaining/);
  assert.match(locale.formatGoal('Антигравитация: коснитесь ядра оба! 1/2 · 6 с.',78),/1\/2 · 6 s/);
  assert.match(locale.formatGoal('БОСС Страж · 2/4 HP · атакует Эхо',111),/2\/4 HP/);
  assert.match(locale.formatGoal('Печати активированы. Оба к порталу!',111),/portal/);
  assert.match(locale.formatGoal('Найдите созвездие и активируйте его (2/5)',36),/2\/5/);
 });
});
