'use strict';
const {test,expect}=require('@playwright/test');

test('v32: lobby RTT guidance remains visible in mobile RU/EN with no start bypass',async({browser})=>{
 const ctx=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:2,serviceWorkers:'block'});
 try{
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  const dismiss=page.locator('#betaQuickStart .beta-quickstart-dismiss');
  if(await dismiss.isVisible())await dismiss.click();
  await page.locator('#createBtn').click();
  await expect(page.locator('#stage4LobbyGuide')).toHaveAttribute('data-state','hostWaiting',{timeout:16000});
  const net=page.locator('#stage4NetworkQuality');
  await expect(net).toBeVisible();
  await expect(net).toHaveAttribute('data-quality',/^(measuring|ok|moderate|high)$/,{timeout:16000});
  await page.evaluate(()=>window.GameStage4Lobby.sync({
   room:'TEST42',phase:'waiting',role:0,hostRole:0,connected:[true,false],
   ready:true,solo:false,lang:'ru',latency:475
  }));
  await expect(net).toHaveAttribute('data-quality','high');
  await expect(net).toContainText('475 мс');
  await expect(page.locator('#startBtn')).toBeDisabled();
  await page.evaluate(()=>window.GameStage4Lobby.sync({
   room:'TEST42',phase:'waiting',role:0,hostRole:0,connected:[true,false],
   ready:true,solo:false,lang:'en',latency:150
  }));
  await expect(net).toHaveAttribute('data-quality','ok');
  await expect(net).toContainText('Server RTT · 150 ms');
  await page.evaluate(()=>window.GameStage4Lobby.sync({
   room:'TEST42',phase:'waiting',role:0,hostRole:0,connected:[true,false],
   ready:false,solo:false,lang:'en',latency:150
  }));
  await expect(net).toHaveAttribute('data-quality','offline');
  await expect(net).toContainText('reconnecting');
  expect(errors).toEqual([]);
 }finally{await ctx.close();}
});
