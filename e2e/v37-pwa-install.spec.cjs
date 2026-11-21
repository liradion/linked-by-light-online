'use strict';
const {test,expect}=require('@playwright/test');
test('v37: iPhone Safari-sized install dialog translates RU to EN without losing focus controls',async({browser})=>{
 const ctx=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,
  userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
  serviceWorkers:'block'});
 try{
  const page=await ctx.newPage();await page.goto('/');
  // Install control is intentionally moved into the responsive game drawer.
  await expect(page.locator('.game-menu-trigger')).toBeVisible();
  await page.locator('.game-menu-trigger').click();
  await expect(page.locator('#gameQuickMenu')).toHaveClass(/is-open/);
  await expect(page.locator('#installGameBtn')).toBeVisible();
  await page.locator('#installGameBtn').click();
  await expect(page.locator('#installGameDialog')).toBeVisible();
  await expect(page.locator('#installGameSteps')).toContainText('На экран Домой');
  // A modal dialog blocks the header language select. Use the real app
  // language setter to exercise live translation while the dialog is open.
  await page.evaluate(()=>window.GameI18n.setLanguage('en'));
  await expect(page.locator('#installGameTitle')).toContainText('Linked by Light');
  await expect(page.locator('#installGameSteps')).toContainText('Add to Home Screen');
  await page.locator('#installGameClose').click();
  await expect(page.locator('#installGameDialog')).toBeHidden();
 }finally{await ctx.close();}
});
