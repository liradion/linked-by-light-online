'use strict';
const {test,expect}=require('@playwright/test');
test('v31: separated co-op players see safe off-screen partner and goal guidance',async({browser})=>{
 const hostContext=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'});
 const guestContext=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,serviceWorkers:'block'});
 try{
  const host=await hostContext.newPage(),guest=await guestContext.newPage();
  await host.goto('/');
  await expect(host.locator('script[src*="/v31-camera.js"]')).toHaveCount(1);
  await host.locator('#createBtn').click();
  await expect(host.locator('#roomCode')).toHaveText(/^[A-HJ-NP-Z2-9]{6}$/,{timeout:15000});
  const code=(await host.locator('#roomCode').textContent()).trim();
  await guest.goto('/?room='+code);
  await expect(host.locator('#startBtn')).toBeEnabled({timeout:15000});
  await host.locator('#startBtn').click();
  await expect(host.locator('#overlay')).toHaveClass(/hidden/,{timeout:15000});
  await expect(guest.locator('#overlay')).toHaveClass(/hidden/,{timeout:15000});
  const diagnostics=await guest.evaluate(()=>{
   const camera=window.GameV31Camera;
   const stage=window.GameStages.stages[7];
   const world={gateOpen:false,walls:[false],crystals:[false],pads:[false,false]};
   camera.frame([{x:130,y:501},{x:1880,y:501}],1,650,1200,stage,world,false);
   return {target:camera.targetCamera([{x:130},{x:1880}],1,2300),
     marker:document.getElementById('v31PartnerMarker')?.textContent,
     goal:document.getElementById('v31ObjectiveMarker')?.textContent,
     count:stage.checkpoints.length};
  });
  expect(diagnostics.target).toBeGreaterThan(0);
  expect(diagnostics.marker).toContain('Искра');
  expect(diagnostics.goal).toContain('Цель');
  expect(diagnostics.count).toBe(2);
  // These markers are display-only and the active animation loop can hide
  // them when both actual players are back on screen.
  await expect(guest.locator('#touchControls [data-input="jump"]')).toBeVisible();
 }finally{await hostContext.close();await guestContext.close();}
});
test('v31: phone controls remain pressed until ALL pointers are released',async({browser})=>{
 const ctx=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,
  serviceWorkers:'block',reducedMotion:'reduce'});
 try{
  const page=await ctx.newPage();
  await page.goto('/');
  await page.locator('#v28SoloBtn').tap();
  await expect(page.locator('#roomCode')).toHaveText(/^[A-HJ-NP-Z2-9]{6}$/,{timeout:15000});
  await page.locator('#startBtn').tap();
  await expect(page.locator('#overlay')).toHaveClass(/hidden/,{timeout:15000});
  const right=page.locator('#touchControls [data-input="right"]');
  await expect(right).toBeVisible();
  const info=await page.evaluate(()=>{
   const button=document.querySelector('#touchControls [data-input="right"]');
   const down=id=>button.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerId:id,pointerType:'touch'}));
   const up=id=>button.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,cancelable:true,pointerId:id,pointerType:'touch'}));
   down(55);down(56);const first=button.classList.contains('pressed');
   up(55);const second=button.classList.contains('pressed');
   up(56);const third=button.classList.contains('pressed');
   const jump=document.querySelector('#touchControls [data-input="jump"]');
   return {first,second,third,size:jump.getBoundingClientRect().width,focus:window.getComputedStyle(jump).touchAction};
  });
  expect(info).toMatchObject({first:true,second:true,third:false});
  expect(info.size).toBeGreaterThanOrEqual(48);
  expect(info.focus).toBe('none');
 }finally{await ctx.close();}
});
