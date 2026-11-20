'use strict';
const {test,expect}=require('@playwright/test');

test('evolution: true two-player synchronized abilities award a visible server-owned combo',async({browser})=>{
 const a=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'});
 const b=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'});
 try{
  const host=await a.newPage(),guest=await b.newPage();
  await host.goto('/');
  await expect(host.locator('#evolutionToggle')).toHaveAttribute('aria-pressed','true');
  await host.locator('#createBtn').click();
  await expect(host.locator('#roomCode')).toHaveText(/^[A-HJ-NP-Z2-9]{6}$/,{timeout:15000});
  const code=(await host.locator('#roomCode').textContent()).trim();
  await guest.goto('/?room='+code);
  await expect(host.locator('#startBtn')).toBeEnabled({timeout:15000});
  await host.locator('#startBtn').click();
  await expect(host.locator('#overlay')).toHaveClass(/hidden/,{timeout:15000});
  await expect(guest.locator('#overlay')).toHaveClass(/hidden/,{timeout:15000});
  await expect(host.locator('#evolutionHUD')).toBeVisible();
  await expect(host.locator('#evolutionRibbon')).toContainText('Первый контакт');
  // Press each player's *real* ability on its own connection.
  await Promise.all([host.keyboard.press('f'),guest.keyboard.press('Enter')]);
  await expect(host.locator('#evolutionHUD .evo-sync-count')).toContainText('1',{timeout:10000});
  await expect(guest.locator('#evolutionHUD .evo-sync-count')).toContainText('1',{timeout:10000});
  await expect(host.locator('#evolutionRibbon')).toContainText('Резонанс света');
  await expect(host.locator('#evolutionHUD .evo-hud-label')).not.toContainText('· 35%');
  const view=await host.evaluate(()=>({
   syncs:window.GameEvolution.getState().lastSyncs,
   stage:window.GameEvolution.getState().lastStage
  }));
  expect(view).toEqual({syncs:1,stage:0});
 }finally{await a.close();await b.close();}
});

test('evolution: accessible optional story, persistence, reduced-motion and mobile safe layout',async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,
   reducedMotion:'reduce',serviceWorkers:'block'});
 try{
  const page=await context.newPage();
  await page.goto('/');
  const toggle=page.locator('#evolutionToggle');
  await expect(toggle).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('link[href*="evolution.css"]')).toHaveCount(1);
  await page.evaluate(()=>document.getElementById('evolutionToggle').click());
  await expect(toggle).toHaveAttribute('aria-pressed','false');
  expect(await page.evaluate(()=>localStorage.getItem('linked-light-evolution-story-v1'))).toBe('0');
  await page.reload();
  await expect(toggle).toHaveAttribute('aria-pressed','false');
  await page.locator('#v28SoloBtn').tap();
  await expect(page.locator('#roomCode')).toHaveText(/^[A-HJ-NP-Z2-9]{6}$/,{timeout:15000});
  await page.locator('#startBtn').tap();
  await expect(page.locator('#overlay')).toHaveClass(/hidden/,{timeout:15000});
  await expect(page.locator('#evolutionHUD')).toBeVisible();
  await expect(page.locator('#evolutionRibbon')).toBeHidden();
  const rect=await page.locator('#evolutionHUD').boundingBox();
  expect(rect).not.toBeNull();
  expect(rect.x).toBeGreaterThanOrEqual(0);
  expect(rect.x+rect.width).toBeLessThanOrEqual(844);
  expect(rect.y+rect.height).toBeLessThanOrEqual(390);
 }finally{await context.close();}
});
