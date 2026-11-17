'use strict';
const {test,expect}=require('@playwright/test');

test('all 137 English stage titles and authored goals are available in both browsers',async({page})=>{
 await page.goto('/');
 await page.locator('#languageSelect').selectOption('en');
 const translated=await page.evaluate(()=>{
  const result=[],stage=window.GameStageLocale,i18n=window.GameI18n;
  for(let n=0;n<137;n++){
   result.push({
    stage:n,title:i18n.stageTitle(n,'untranslated'),
    goal:i18n.stageObjective(n,'untranslated'),
    hint:i18n.stageHint(n,'untranslated'),
    world:i18n.stageWorld(n)
   });
  }
  return {locale:document.documentElement.lang,hasCatalog:typeof stage?.world==='function',result};
 });
 expect(translated.locale).toBe('en');
 expect(translated.hasCatalog).toBe(true);
 expect(translated.result).toHaveLength(137);
 for(const item of translated.result){
  expect(item.title,'Stage '+item.stage).not.toMatch(/[\u0400-\u04FF]/);
  expect(item.goal,'Stage '+item.stage).not.toMatch(/[\u0400-\u04FF]/);
  expect(item.hint,'Stage '+item.stage).not.toMatch(/[\u0400-\u04FF]/);
  expect(item.world,'Stage '+item.stage).not.toMatch(/[\u0400-\u04FF]/);
  expect(item.goal.length).toBeGreaterThan(20);
 }
 expect(translated.result[9].title).toBe('Twilight Forest · Together');
 expect(translated.result[99].title).toContain('Hundredth Light');
 expect(translated.result[100].title).toBe('The First Knot');
 expect(translated.result[112].title).toBe('Bridge of Footprints');
 expect(translated.result[122].title).toBe('Two Gravities');
 expect(translated.result[136].title).toBe('Eye of Two Worlds');
 await page.locator('#languageSelect').selectOption('ru');
 const original=await page.evaluate(()=>window.GameI18n.stageTitle(100,'Первый узел'));
 expect(original).toBe('Первый узел');
});

test('live objectives retain progress counters and timed mechanics in EN',async({page})=>{
 await page.goto('/');
 await page.locator('#languageSelect').selectOption('en');
 const goals=await page.evaluate(()=>{
  const t=window.GameI18n;
  return {
   star:t.formatGoal('Порядок звёзд: 2/6. Активируйте их по номерам.',42),
   flower:t.formatGoal('Пробудите цветы (3/5)',45),
   timed:t.formatGoal('Прошлое активировано. Эхо: включите будущее! Осталось 5 с.',76),
   gravity:t.formatGoal('Антигравитация: коснитесь ядра оба! 1/2 · 6 с.',78),
   boss:t.formatGoal('БОСС Страж · 2/4 HP · атакует Эхо',111),
   late:t.localizeHint('Искра направляет световой луч, Эхо настраивает зеркала. Активируйте три призмы.',123,1,1)
  };
 });
 expect(goals.star).toContain('2/6');
 expect(goals.flower).toContain('3/5');
 expect(goals.timed).toContain('5 s remaining');
 expect(goals.gravity).toContain('1/2 · 6 s');
 expect(goals.boss).toContain('2/4 HP');
 expect(goals.late).toContain('Echo adjusts the mirrors');
});
