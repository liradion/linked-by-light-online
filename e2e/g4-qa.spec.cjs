'use strict';
const {test,expect}=require('@playwright/test');

test('G4: actual two-client room exports separate safe, opt-in diagnostics without room codes',async({browser})=>{
 const hostContext=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'});
 const guestContext=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,
  serviceWorkers:'block',reducedMotion:'reduce'});
 try{
  const host=await hostContext.newPage(),guest=await guestContext.newPage();
  await host.goto('/');
  await expect(host.locator('#g4QaOpen')).toBeVisible();
  await host.locator('#createBtn').click();
  await expect(host.locator('#roomCode')).toHaveText(/^[A-HJ-NP-Z2-9]{6}$/,{timeout:16000});
  const room=(await host.locator('#roomCode').textContent()).trim();
  await guest.goto('/?room='+room);
  await expect(host.locator('#startBtn')).toBeEnabled({timeout:16000});
  await host.locator('#startBtn').click();
  await expect(host.locator('#overlay')).toHaveClass(/hidden/,{timeout:16000});
  await expect(guest.locator('#overlay')).toHaveClass(/hidden/,{timeout:16000});
  for(const [page,expectedRole] of [[host,0],[guest,1]]){
   await page.locator('#g4QaOpen').click();
   const dialog=page.locator('#g4QaDialog');
   await expect(dialog).toBeVisible();
   const item=JSON.parse(await page.locator('#g4QaPreview').textContent());
   expect(item.schema).toBe('linked-light-g4-local-v1');
   expect(item.playerRole).toBe(expectedRole);
   expect(item.phase).toBe('playing');
   expect(item.connection.bothPlayersConnected).toEqual([true,true]);
   expect(item.play).toHaveProperty('deaths');
   expect(item.performance).toHaveProperty('rttMs');
   const json=JSON.stringify(item);
   expect(json).not.toContain(room);
   expect(json).not.toContain('lightroom:');
   expect(json).not.toContain('http://');
   expect(json).not.toContain('https://');
   expect(json).not.toContain('userAgent');
   expect(json).not.toContain('token');
   await page.locator('#g4QaClose').click();
   await expect(dialog).toBeHidden();
  }
 }finally{await hostContext.close();await guestContext.close();}
});
test('G4: iPhone landscape safe-area report can be opened, reviewed and localized without upload',async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,
  deviceScaleFactor:2,serviceWorkers:'block',reducedMotion:'reduce'});
 try{
  const page=await context.newPage();
  const requests=[];
  page.on('request',r=>{if(/g4|diagnostic/i.test(r.url())&&r.method()!=='GET')requests.push(r.url());});
  await page.goto('/');
  // The game has an explicit motion setting independent of the OS media query.
  await page.evaluate(()=>GameQuality.setReducedMotion(true));
  const open=page.locator('#g4QaOpen');
  await expect(open).toContainText('Диагностика G4');
  await open.click();
  const dialog=page.locator('#g4QaDialog');
  await expect(dialog).toBeVisible();
  await expect(page.locator('#g4QaPreview')).toContainText('linked-light-g4-local-v1');
  await expect(page.locator('#g4QaDescription')).toContainText('не отправляются автоматически');
  const box=await dialog.boundingBox();
  expect(box).toBeTruthy();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x+box.width).toBeLessThanOrEqual(844);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y+box.height).toBeLessThanOrEqual(390);
  await page.locator('#g4QaRefresh').click();
  const report=JSON.parse(await page.locator('#g4QaPreview').textContent());
  expect(report.display.touch).toBe(true);
  expect(report.display.landscape).toBe(true);
  expect(report.display.reducedMotion).toBe(true);
  await page.locator('#g4QaClose').click();
  await page.locator('#languageSelect').selectOption('en');
  await expect(open).toContainText('G4 diagnostics');
  await open.click();
  await expect(page.locator('#g4QaDescription')).toContainText('Nothing is uploaded automatically');
  expect(requests).toEqual([]);
 }finally{await context.close();}
});
