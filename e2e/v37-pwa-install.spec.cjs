'use strict';
const {test,expect}=require('@playwright/test');
test('v37: iPhone Safari-sized install dialog translates RU to EN without losing focus controls',async({browser})=>{
 const ctx=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,
  userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
  serviceWorkers:'block'});
 try{
  const page=await ctx.newPage();await page.goto('/');
  await page.locator('#installGameBtn').click();
  await expect(page.locator('#installGameDialog')).toBeVisible();
  await expect(page.locator('#installGameSteps')).toContainText('На экран Домой');
  await page.locator('#languageSelect').selectOption('en',{force:true});
  await expect(page.locator('#installGameTitle')).toContainText('Linked by Light');
  await expect(page.locator('#installGameSteps')).toContainText('Add to Home Screen');
  await page.locator('#installGameClose').click();
  await expect(page.locator('#installGameDialog')).toBeHidden();
 }finally{await ctx.close();}
});
