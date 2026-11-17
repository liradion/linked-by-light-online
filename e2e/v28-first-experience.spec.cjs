'use strict';
const {test,expect}=require('@playwright/test');
test('v28 Web Share invitation auto-joins mobile guest, Echo can host and players place a ping',async({browser})=>{
 const hostContext=await browser.newContext({viewport:{width:1280,height:850},serviceWorkers:'block'});
 const guestContext=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,serviceWorkers:'block'});
 try{
  await hostContext.addInitScript(()=>{
   Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{sessionStorage.setItem('v28-last-shared',JSON.stringify(data));}});
  });
  const host=await hostContext.newPage(),guest=await guestContext.newPage();
  const errors=[];host.on('pageerror',e=>errors.push(e.message));guest.on('pageerror',e=>errors.push(e.message));
  await host.goto('/');
  // The integrated clean-play UI uses a nonblocking quick-start card, not an automatic modal.
  await expect(host.locator('#betaQuickStart')).toBeVisible({timeout:6000});
  await host.locator('#betaQuickStart .beta-quickstart-dismiss').click();
  await expect(host.locator('#v28RoleSelect')).toBeVisible();
  await host.locator('#v28RoleSelect').selectOption('1');
  await host.locator('#createBtn').click();
  await expect(host.locator('#roomCode')).toHaveText(/^[A-HJ-NP-Z2-9]{6}$/,{timeout:16000});
  await expect(host.locator('#myRole')).toContainText('Эхо (ведущий)');
  await host.locator('#v28ShareBtn').click();
  const shared=await host.evaluate(()=>JSON.parse(sessionStorage.getItem('v28-last-shared')||'null'));
  expect(shared.url).toContain('?room=');
  await guest.goto(shared.url);
  await expect(guest.locator('#myRole')).toContainText('Искра (партнёр)',{timeout:16000});
  await expect(host.locator('#startBtn')).toBeEnabled({timeout:16000});
  await host.locator('#startBtn').click();
  await expect(host.locator('#overlay')).toHaveClass(/hidden/);
  await expect(guest.locator('#overlay')).toHaveClass(/hidden/);
  await expect(host.locator('#v28Tutorial')).toBeVisible();
  await host.keyboard.press('t');
  await expect(host.locator('#v28PingWheel')).toBeVisible();
  await host.locator('#v28PingWheel').getByRole('button',{name:/Помоги/}).click();
  await host.locator('#game').click({position:{x:165,y:150}});
  await expect(host.locator('#v28PingWheel')).toBeHidden();
  expect(errors).toEqual([]);
 }finally{await hostContext.close();await guestContext.close();}
});
test('v28 solo creates one-seat authoritative game and Tab switches active character',async({browser})=>{
 const context=await browser.newContext({viewport:{width:1100,height:800},serviceWorkers:'block'});
 try{
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('#betaQuickStart')).toBeVisible({timeout:6000});
  await page.locator('#betaQuickStart .beta-quickstart-dismiss').click();
  await page.locator('#v28RoleSelect').selectOption('1');
  await page.locator('#v28SoloBtn').click();
  await expect(page.locator('#roomCode')).toHaveText(/^[A-HJ-NP-Z2-9]{6}$/,{timeout:16000});
  await expect(page.locator('#startBtn')).toBeEnabled({timeout:16000});
  await page.locator('#startBtn').click();
  await expect(page.locator('#v28Tutorial')).toBeVisible({timeout:10000});
  await expect(page.locator('#v28PingToggle')).toContainText('Эхо');
  await page.keyboard.press('Tab');
  await expect(page.locator('#v28PingToggle')).toContainText('Искра',{timeout:10000});
  expect(errors).toEqual([]);
 }finally{await context.close();}
});
