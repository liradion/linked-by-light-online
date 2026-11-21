'use strict';
const {test,expect}=require('@playwright/test');

// Inspect the immediate DOM update atomically: the live server's PONG event can
// replace simulated RTT/language values before a polling locator assertion.
async function inspectSync(page,state){
 return page.evaluate(sample=>{
  window.GameStage4Lobby.sync(sample);
  const net=document.getElementById('stage4NetworkQuality');
  return {
   quality:net&&net.dataset.quality,
   text:net&&net.textContent,
   startDisabled:document.getElementById('startBtn').disabled
  };
 },state);
}

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
  const common={room:'TEST42',phase:'waiting',role:0,hostRole:0,connected:[true,false],solo:false};
  const high=await inspectSync(page,{...common,ready:true,lang:'ru',latency:475});
  expect(high).toMatchObject({quality:'high',text:expect.stringContaining('475 мс'),startDisabled:true});
  const ok=await inspectSync(page,{...common,ready:true,lang:'en',latency:150});
  expect(ok).toMatchObject({quality:'ok',text:expect.stringContaining('Server RTT · 150 ms'),startDisabled:true});
  const offline=await inspectSync(page,{...common,ready:false,lang:'en',latency:150});
  expect(offline).toMatchObject({quality:'offline',text:expect.stringContaining('reconnecting'),startDisabled:true});
  expect(errors).toEqual([]);
 }finally{await ctx.close();}
});
