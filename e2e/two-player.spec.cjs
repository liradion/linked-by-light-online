'use strict';
const {test,expect}=require('@playwright/test');
test('two real browsers form one v26-compatible v23 cooperative room',async({browser})=>{
 const hostContext=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'});
 const guestContext=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,serviceWorkers:'block'});
 try{
  for(const c of [hostContext,guestContext])
   await c.addInitScript(()=>{try{localStorage.setItem('linked-light-v22-intro','done');}catch(_){}});
  const host=await hostContext.newPage(),guest=await guestContext.newPage();
  const pageErrors=[];host.on('pageerror',e=>pageErrors.push(e.message));
  await host.goto('/');
  const diagnostic=await host.evaluate(()=>({
   future:!!window.GameFuture,menu:!!document.getElementById('menuView'),
   buttons:[...document.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(x=>/Физика|Создать/.test(x))
  }));
  console.log('Initial browser state:',JSON.stringify({diagnostic,pageErrors}));
  const newChapter=host.getByRole('button',{name:/Физика света v23/}).first();
  await expect(newChapter).toBeVisible({timeout:12000});
  await newChapter.click();
  const codeEl=host.locator('#roomCode');
  await expect(codeEl).toHaveText(/^[A-HJ-NP-Z2-9]{6}$/,{timeout:12000});
  const code=(await codeEl.textContent()).trim();
  await guest.goto('/');
  await guest.locator('#roomInput').fill(code);
  await guest.locator('#joinBtn').click();
  await expect(host.locator('#startBtn')).toBeEnabled({timeout:12000});
  await host.locator('#startBtn').click();
  await expect(host.locator('#game')).toBeVisible();
  await expect(guest.locator('#game')).toBeVisible();
  await expect(host.locator('.v2346-toggle')).toBeVisible({timeout:12000});
  await host.locator('.v2346-toggle').click();
  await expect(host.locator('.v2346-dialog')).toBeVisible();
  await expect(host.locator('.v2346-content')).toContainText('Физика света');
  await host.locator('.v2346-header button').click();
  // Reload guest to exercise reconnect; the browser retains seat ownership.
  await guest.reload();
  await expect(guest.locator('.v2346-toggle')).toBeVisible({timeout:15000});
  await expect(host.locator('#game')).toBeVisible();
 }finally{
  await hostContext.close();await guestContext.close();
 }
});
