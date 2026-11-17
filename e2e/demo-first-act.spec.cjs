'use strict';
const {test,expect}=require('@playwright/test');

test('two devices can opt into a separate nine-stage first-act demo',async({browser})=>{
 const hostContext=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'});
 const guestContext=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,serviceWorkers:'block'});
 try{
  const host=await hostContext.newPage(),guest=await guestContext.newPage();
  await host.goto('/');
  await expect(host.locator('#demoBtn')).toBeVisible();
  await host.locator('#demoBtn').click();
  await expect(host.locator('#roomCode')).toHaveText(/^[A-HJ-NP-Z2-9]{6}$/,{timeout:15000});
  const code=(await host.locator('#roomCode').textContent()).trim();
  await guest.goto('/?room='+code);
  await expect(host.locator('#startBtn')).toBeEnabled({timeout:15000});
  await host.locator('#startBtn').click();
  await expect(host.locator('#overlay')).toHaveClass(/hidden/);
  await expect(host.locator('#levelLabel')).toHaveText('ДЕМО · ИСПЫТАНИЕ 1 / 9');
  await expect(guest.locator('#levelLabel')).toHaveText('ДЕМО · ИСПЫТАНИЕ 1 / 9');
  await expect(host.locator('#actProgress')).toHaveText('ДЕМО 01/09');
  await expect(guest.locator('#game')).toBeVisible();
  await expect(host.locator('#demoBackBtn')).toBeHidden();
  const saved=await host.evaluate(()=>localStorage.getItem('linked-light-checkpoint-v99'));
  expect(saved).toBeNull();
  // Safari/Chrome mobile refresh: recover original seat and demo mode rather
  // than treating the invited player as a spectator or normal-campaign host.
  await guest.reload();
  await expect(guest.locator('#overlay')).toHaveClass(/hidden/,{timeout:15000});
  await expect(guest.locator('#levelLabel')).toHaveText('ДЕМО · ИСПЫТАНИЕ 1 / 9');
  await expect(guest.locator('#actProgress')).toHaveText('ДЕМО 01/09');
  await expect(guest.locator('#myRole')).toContainText('Эхо');
  await expect(guest.locator('#touchControls [data-input="left"]')).toBeVisible();
  await expect(host.locator('#waitingBanner')).toHaveClass(/hidden/,{timeout:15000});
  expect(await guest.evaluate(()=>localStorage.getItem('linked-light-checkpoint-v99'))).toBeNull();
 }finally{await hostContext.close();await guestContext.close();}
});

test('main campaign is still a different launch path',async({page})=>{
 await page.addInitScript(()=>{localStorage.setItem('linked-light-v22-intro','done');});
 await page.goto('/');
 await page.locator('#createBtn').click();
 await expect(page.locator('#roomCode')).toHaveText(/^[A-HJ-NP-Z2-9]{6}$/,{timeout:15000});
 const debug=await page.evaluate(()=>({
  demoLaunch:!!document.getElementById('demoBtn'),
  lobbyText:document.getElementById('lobbyHint')?.textContent
 }));
 expect(debug.demoLaunch).toBe(true);
 expect(debug.lobbyText).not.toContain('Демо:');
});

test('phone can host a demo and a desktop can join as Echo',async({browser})=>{
 const phoneContext=await browser.newContext({
  viewport:{width:844,height:390},hasTouch:true,isMobile:true,serviceWorkers:'block'
 });
 const desktopContext=await browser.newContext({
  viewport:{width:1280,height:800},serviceWorkers:'block'
 });
 try{
  const phone=await phoneContext.newPage(),desktop=await desktopContext.newPage();
  await phone.goto('/');
  await expect(phone.locator('#demoBtn')).toBeVisible();
  await phone.locator('#demoBtn').click();
  await expect(phone.locator('#roomCode')).toHaveText(/^[A-HJ-NP-Z2-9]{6}$/,{timeout:15000});
  await expect(phone.locator('#shareInviteBtn')).toBeVisible();
  const room=(await phone.locator('#roomCode').textContent()).trim();
  await desktop.goto('/?room='+room);
  await expect(phone.locator('#startBtn')).toBeEnabled({timeout:15000});
  await phone.locator('#startBtn').click();
  await expect(phone.locator('#overlay')).toHaveClass(/hidden/);
  await expect(desktop.locator('#overlay')).toHaveClass(/hidden/);
  await expect(phone.locator('#myRole')).toContainText('Искра');
  await expect(desktop.locator('#myRole')).toContainText('Эхо');
  await expect(phone.locator('#levelLabel')).toHaveText('ДЕМО · ИСПЫТАНИЕ 1 / 9');
  await expect(desktop.locator('#levelLabel')).toHaveText('ДЕМО · ИСПЫТАНИЕ 1 / 9');
  for(const action of ['left','right','jump','ability'])
   await expect(phone.locator('#touchControls [data-input="'+action+'"]')).toBeVisible();
 }finally{await phoneContext.close();await desktopContext.close();}
});
