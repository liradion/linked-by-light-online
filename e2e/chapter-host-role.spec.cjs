'use strict';
const {test,expect}=require('@playwright/test');

test('existing two-player room keeps host-only level controls across all chapter screens',async({browser})=>{
 const desktop=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'});
 const phone=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,serviceWorkers:'block'});
 try{
  const host=await desktop.newPage(),guest=await phone.newPage();
  const errors=[];
  host.on('pageerror',err=>errors.push('host: '+err.message));
  guest.on('pageerror',err=>errors.push('guest: '+err.message));
  await host.goto('/');
  await expect(host.locator('#languageSelect')).toHaveValue('ru');
  await host.locator('#createBtn').click();
  await expect(host.locator('#roomCode')).toHaveText(/^[A-HJ-NP-Z2-9]{6}$/,{timeout:15000});
  const code=(await host.locator('#roomCode').textContent()).trim();
  await guest.goto('/?room='+code);
  await expect(host.locator('#startBtn')).toBeEnabled({timeout:15000});
  await host.locator('#startBtn').click();
  await expect(host.locator('#overlay')).toHaveClass(/hidden/);
  await expect(guest.locator('#overlay')).toHaveClass(/hidden/);

  // Exercise the same chapter controls that PR #8 will make role-independent.
  for(const page of [host,guest]){
   await page.locator('.game-menu-trigger').click();
   await page.locator('.v20-toggle').click();
   await expect(page.locator('.v20-dialog')).toBeVisible();
  }
  await expect(host.locator('.v20-dialog .v20-levels button')).toHaveCount(12);
  await expect(guest.locator('.v20-dialog .v20-levels button')).toHaveCount(0);
  await expect(guest.locator('.v20-dialog .v20-body')).toContainText('Историю запускает ведущий');
  for(const page of [host,guest])await page.locator('.v20-dialog .v20-top button').click();

  for(const page of [host,guest]){
   await page.evaluate(()=>window.GameV21.open('level'));
   await expect(page.locator('.v21-dialog')).toBeVisible();
  }
  await expect(host.locator('.v21-dialog .v21-levels button')).toHaveCount(10);
  await expect(guest.locator('.v21-dialog .v21-levels button')).toHaveCount(0);
  await expect(guest.locator('.v21-dialog .v21-body')).toContainText('Попросите ведущего выбрать новый уровень');
  for(const page of [host,guest])await page.locator('.v21-dialog .v21-top button').click();

  for(const page of [host,guest]){
   await page.evaluate(()=>window.GameFuture.open('physics'));
   await expect(page.locator('.v2346-dialog')).toBeVisible();
  }
  await expect(host.locator('.v2346-dialog .v2346-level-grid button')).toHaveCount(15);
  await expect(guest.locator('.v2346-dialog .v2346-level-grid button')).toHaveCount(0);
  await expect(guest.locator('.v2346-dialog .v2346-content')).toContainText('Новый уровень может выбрать ведущий.');
  await host.evaluate(()=>{
   const api=window.GameRoomAuthority;
   if(api.isHost({isHost:()=>true},1)!==true||api.isHost({isHost:()=>false},0)!==false)
    throw Error('host authority callback semantics failed in browser');
  });
  expect(errors).toEqual([]);
 }finally{
  await desktop.close();
  await phone.close();
 }
});
