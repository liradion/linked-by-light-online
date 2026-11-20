'use strict';
const {test,expect}=require('@playwright/test');
test('v30: first game starts without hidden flower gate; adaptive hint appears only after a stall',async({page})=>{
 await page.goto('/');
 await page.locator('#v28SoloBtn').click();
 await expect(page.locator('#roomCode')).toHaveText(/^[A-HJ-NP-Z2-9]{6}$/,{timeout:20000});
 await page.locator('#startBtn').click();
 await expect(page.locator('#overlay')).toHaveClass(/hidden/,{timeout:20000});
 await expect(page.locator('#gameHintNudge')).toBeHidden();
 const stage=await page.evaluate(()=>({
   onboarding:window.GameStages?.stages?.[0]?.onboarding,
   flowers:window.GameStages?.stages?.[0]?.signature?.nodes?.length,
   skip:window.GameStages?.stages?.[0]?.signature?.tutorialOnly
 }));
 expect(stage).toEqual({onboarding:'paired-pads',flowers:0,skip:true});
 // Only the UI stall clock is simulated. No authoritative game state or
 // players are modified; this exercises the real browser-facing hint handler.
 await page.evaluate(()=>{
  window.GameHints.onSnapshot({
   stage:0,phase:'playing',stats:{elapsed:99,deaths:0},
   world:{gateOpen:false,pads:[false,false],padLatched:false,signature:{done:true}},
   players:[{x:80},{x:160}]
  });
 });
 await expect(page.locator('#gameHintNudge')).toBeVisible();
 await expect(page.locator('#gameHintNudge')).toContainText('Искра');
 await page.locator('#gameHintNudge').click();
 await expect(page.locator('#gameHintNudge')).toBeHidden();
 await expect(page.locator('#gameHintPanel')).toBeVisible();
 await expect(page.locator('.game-hint-text')).toContainText('оранжевую плиту');
});
test('v30: mobile landscape nudge respects available screen and remains dismissible',async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,
  hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});
 try{
  const page=await context.newPage();
  await page.goto('/');
  await page.locator('#v28SoloBtn').tap();
  await expect(page.locator('#roomCode')).toHaveText(/^[A-HJ-NP-Z2-9]{6}$/,{timeout:20000});
  await page.locator('#startBtn').tap();
  await expect(page.locator('#overlay')).toHaveClass(/hidden/,{timeout:20000});
  await page.evaluate(()=>window.GameHints.onSnapshot({
   stage:0,phase:'playing',stats:{elapsed:2,deaths:3},
   world:{gateOpen:false,pads:[false,false],padLatched:false,signature:{done:true}},
   players:[{x:80},{x:160}]
  }));
  await expect(page.locator('#gameHintNudge')).toBeVisible();
  const bounds=await page.locator('#gameHintNudge').boundingBox();
  expect(bounds).toBeTruthy();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x+bounds.width).toBeLessThanOrEqual(844);
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.y+bounds.height).toBeLessThanOrEqual(390);
  await page.locator('#gameHintNudge').tap();
  await expect(page.locator('#gameHintPanel')).toBeVisible();
 }finally{await context.close();}
});
