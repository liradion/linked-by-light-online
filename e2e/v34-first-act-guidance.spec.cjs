'use strict';
const {test,expect}=require('@playwright/test');
test('v34: real co-op first act shows independent Spark/Echo tasks in desktop/iPhone landscape',async({browser})=>{
 const hostCtx=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'});
 const guestCtx=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 try{
  const host=await hostCtx.newPage(),guest=await guestCtx.newPage();
  await host.goto('/');await host.locator('#createBtn').click();
  await expect(host.locator('#roomCode')).toHaveText(/^[A-HJ-NP-Z2-9]{6}$/,{timeout:16000});
  const room=(await host.locator('#roomCode').textContent()).trim();
  await guest.goto('/?room='+room);
  await expect(host.locator('#startBtn')).toBeEnabled({timeout:16000});
  await host.locator('#startBtn').click();
  await expect(host.locator('#overlay')).toHaveClass(/hidden/,{timeout:16000});
  await expect(guest.locator('#overlay')).toHaveClass(/hidden/,{timeout:16000});
  await expect(host.locator('.v28-tip-text')).toContainText('оранжевую');
  await expect(guest.locator('.v28-tip-text')).toContainText('голубую');
  const model=await guest.evaluate(()=>{
   const level=window.GameStages.stages[1];
   const state={gateOpen:false,walls:[true],crystals:[false],pads:[true]};
   return window.GameV34Steps.describe(level,state,1,[{x:750},{x:1200}],'en');
  });
  expect(model).toMatchObject({key:'bridge-echo',text:expect.stringContaining('Cross it')});
 }finally{await hostCtx.close();await guestCtx.close();}
});
