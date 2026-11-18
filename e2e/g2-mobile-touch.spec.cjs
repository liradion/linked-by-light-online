'use strict';
const {test,expect}=require('@playwright/test');

async function mobileBrowser(browser){
 return browser.newContext({
  viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:2,
  serviceWorkers:'block'
 });
}
async function newRoom(page,solo){
 await page.goto('/');
 await expect(page.locator('#v28PingToggle')).toBeHidden();
 await expect(page.locator('#v28PingWheel')).toBeHidden();
 await page.locator('#v28RoleSelect').selectOption('1');
 await (solo?page.locator('#v28SoloBtn'):page.locator('#createBtn')).tap();
 await expect(page.locator('#roomCode')).toHaveText(/^[A-HJ-NP-Z2-9]{6}$/,{timeout:16000});
 await expect(page.locator('#v28PingToggle')).toBeHidden();
}

test('G2 iPhone-size solo button switches once per acknowledged request and resumes after reload',async({browser})=>{
 const context=await mobileBrowser(browser);
 try{
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await newRoom(page,true);
  const code=(await page.locator('#roomCode').textContent()).trim();
  await expect(page.locator('#startBtn')).toBeEnabled();
  await page.locator('#startBtn').tap();
  const switcher=page.locator('#v28PingToggle');
  await expect(switcher).toBeVisible({timeout:15000});
  await expect(switcher).toHaveAttribute('aria-label','Переключить на Искру');
  await expect(page.locator('#v28PingWheel')).toBeHidden();
  await expect(page.locator('#v28Tutorial .v28-tip-text')).toContainText('Коснитесь кнопки смены героя');
  const queued=await page.evaluate(()=>[GameV28.requestSoloSwitch(),GameV28.requestSoloSwitch()]);
  expect(queued).toEqual([true,false],'duplicate requests must be rejected while waiting on the server');
  await expect(switcher).toHaveAttribute('aria-label','Переключить на Эхо',{timeout:15000});
  await expect(switcher).toBeEnabled({timeout:10000});
  await switcher.tap();
  await expect(switcher).toHaveAttribute('aria-label','Переключить на Искру',{timeout:15000});

  // A new browser document must reclaim the same authenticated solo seat.
  await page.reload();
  await expect(page.locator('#roomCode')).toHaveText(code,{timeout:15000});
  await expect(switcher).toBeVisible({timeout:15000});
  await expect(switcher).toHaveAttribute('aria-label','Переключить на Искру');
  await expect(page.locator('#v28PingWheel')).toBeHidden();
  expect(errors).toEqual([]);
 }finally{await context.close();}
});

test('G2 landscape touch co-op sends server-validated marker and restores guest seat on reload',async({browser})=>{
 const hostContext=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'});
 const guestContext=await mobileBrowser(browser);
 try{
  for(const c of [hostContext,guestContext])await c.addInitScript(()=>{
   try{localStorage.setItem('linked-light-v22-intro','done');}catch(_){}
  });
  const host=await hostContext.newPage(),guest=await guestContext.newPage(),errors=[];
  host.on('pageerror',e=>errors.push('host: '+e.message));
  guest.on('pageerror',e=>errors.push('guest: '+e.message));
  await host.goto('/');
  await host.locator('#createBtn').click();
  await expect(host.locator('#roomCode')).toHaveText(/^[A-HJ-NP-Z2-9]{6}$/,{timeout:16000});
  const code=(await host.locator('#roomCode').textContent()).trim();
  await guest.goto('/?room='+code);
  await expect(guest.locator('#myRole')).toContainText('Эхо (партнёр)',{timeout:16000});
  await expect(guest.locator('#v28PingToggle')).toBeHidden();
  await expect(host.locator('#startBtn')).toBeEnabled();
  await host.locator('#startBtn').click();
  await expect(guest.locator('#v28PingToggle')).toBeVisible({timeout:16000});
  await expect(guest.locator('#v28PingToggle')).toHaveAttribute('aria-label','Поставить метку');

  const marker=guest.locator('#v28PingToggle');
  const wheel=guest.locator('#v28PingWheel');
  const frame=await guest.locator('#frame').boundingBox();
  const button=await marker.boundingBox();
  expect(frame&&button).toBeTruthy();
  expect(button.y).toBeGreaterThanOrEqual(frame.y-1);
  expect(button.y+button.height).toBeLessThanOrEqual(frame.y+frame.height+1);

  await host.evaluate(()=>{
   window.__g2Pings=[];
   const previous=window.GameV28.message;
   window.GameV28.message=function(m){
    if(m?.t==='v28Ping')window.__g2Pings.push(m);
    return previous(m);
   };
  });
  await marker.tap();
  await expect(wheel).toBeVisible();
  const wheelBox=await wheel.boundingBox();
  expect(wheelBox).toBeTruthy();
  expect(wheelBox.y+wheelBox.height).toBeLessThanOrEqual(frame.y+frame.height+1);
  await wheel.locator('[data-ping-kind="help"]').tap();
  await expect(wheel).toBeHidden();
  await guest.locator('#game').tap({position:{x:100,y:110}});
  await expect.poll(()=>host.evaluate(()=>window.__g2Pings?.length||0),{timeout:7000}).toBeGreaterThan(0);
  const received=await host.evaluate(()=>window.__g2Pings[0]);
  expect(received).toMatchObject({t:'v28Ping',kind:'help',role:1});
  expect(received.x).toBeGreaterThanOrEqual(0);
  expect(received.y).toBeGreaterThanOrEqual(0);
  expect(received.y).toBeLessThanOrEqual(650);

  await guest.reload();
  await expect(guest.locator('#roomCode')).toHaveText(code,{timeout:16000});
  await expect(guest.locator('#v28PingToggle')).toBeVisible({timeout:16000});
  await expect(guest.locator('#v28PingWheel')).toBeHidden();
  expect(errors).toEqual([]);
 }finally{await hostContext.close();await guestContext.close();}
});
