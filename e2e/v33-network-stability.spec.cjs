'use strict';
const {test,expect}=require('@playwright/test');
test('v33: mobile lobby shows variable RTT, stale response and recovery without start bypass',async({browser})=>{
 const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 try{
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  const dismiss=page.locator('#betaQuickStart .beta-quickstart-dismiss');
  if(await dismiss.isVisible())await dismiss.click();
  await page.locator('#createBtn').click();
  await expect(page.locator('#stage4LobbyGuide')).toHaveAttribute('data-state','hostWaiting',{timeout:16000});
  const result=await page.evaluate(()=>{
   const probe=window.GameStage4Lobby.createNetworkProbe();probe.reset(100);
   probe.add(60,200);probe.add(400,300);probe.add(70,400);
   const base={room:'TEST42',phase:'waiting',role:0,hostRole:0,connected:[true,false],ready:true,solo:false,lang:'ru'};
   const view=s=>{
    window.GameStage4Lobby.sync(s);
    const net=document.getElementById('stage4NetworkQuality');
    return {quality:net.dataset.quality,text:net.textContent,startDisabled:document.getElementById('startBtn').disabled};
   };
   const unstable=view({...base,...probe.snapshot(500)});
   const stalled=view({...base,...probe.snapshot(6501),lang:'en'});
   probe.reset(7000);probe.add(70,7100);probe.add(72,7200);probe.add(71,7300);
   const recovered=view({...base,...probe.snapshot(7400),lang:'en'});
   return {unstable,stalled,recovered};
  });
  expect(result.unstable).toMatchObject({quality:'high',text:expect.stringContaining('Разброс RTT (3 замера): 340 мс'),startDisabled:true});
  expect(result.stalled).toMatchObject({quality:'stalled',text:expect.stringContaining('No recent server response'),startDisabled:true});
  expect(result.recovered).toMatchObject({quality:'ok',text:expect.stringContaining('Server RTT · 71 ms'),startDisabled:true});
  expect(errors).toEqual([]);
 }finally{await context.close();}
});
