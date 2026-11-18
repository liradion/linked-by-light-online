'use strict';
const {test,expect}=require('@playwright/test');

test('G3.2 WebKit/Chromium: silent invite join is re-attempted without minting a new seat',async({browser})=>{
 const desktop=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'});
 const mobile=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,serviceWorkers:'block'});
 try{
  const host=await desktop.newPage(),guest=await mobile.newPage();
  await host.goto('/');
  await host.locator('#demoBtn').click();
  await expect(host.locator('#roomCode')).toHaveText(/^[A-HJ-NP-Z2-9]{6}$/,{timeout:15000});
  const code=(await host.locator('#roomCode').textContent()).trim();
  await guest.addInitScript(()=>{
   // Open WebSocket, but silently drop one join command as if lost in transport.
   const NativeSocket=window.WebSocket;
   window.WebSocket=class extends NativeSocket{
    send(payload){
     let message;
     try{message=JSON.parse(payload);}catch(_){return super.send(payload);}
     if(message?.t==='join'&&sessionStorage.getItem('g3DroppedJoin')!=='yes'){
      sessionStorage.setItem('g3DroppedJoin','yes');
      return;
     }
     return super.send(payload);
    }
   };
  });
  await guest.goto('/?room='+code);
  await expect.poll(()=>guest.evaluate(()=>sessionStorage.getItem('g3DroppedJoin')),{timeout:4000}).toBe('yes');
  await expect(host.locator('#startBtn')).toBeEnabled({timeout:23000});
  await expect(guest.locator('#myRole')).toContainText('Эхо');
  const token=await guest.evaluate(id=>localStorage.getItem('lightroom:'+id),code);
  expect(token).toMatch(/^[0-9a-f]{48}$/);
  await host.locator('#startBtn').click();
  await expect(guest.locator('#overlay')).toHaveClass(/hidden/,{timeout:16000});
  await expect(guest.locator('#levelLabel')).toHaveText('ДЕМО · ИСПЫТАНИЕ 1 / 9');
  expect(await guest.evaluate(id=>localStorage.getItem('lightroom:'+id),code)).toBe(token);
 }finally{await desktop.close();await mobile.close();}
});

test('G3.2 WebKit/Chromium: triple phone refresh recovers original running seat',async({browser})=>{
 const desktop=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'});
 const mobile=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,serviceWorkers:'block'});
 try{
  const host=await desktop.newPage(),guest=await mobile.newPage(),errors=[];
  guest.on('pageerror',e=>errors.push(e.message));
  await host.goto('/');
  await host.locator('#demoBtn').click();
  await expect(host.locator('#roomCode')).toHaveText(/^[A-HJ-NP-Z2-9]{6}$/,{timeout:15000});
  const code=(await host.locator('#roomCode').textContent()).trim();
  await guest.goto('/?room='+code);
  await expect(host.locator('#startBtn')).toBeEnabled({timeout:16000});
  const saved=await guest.evaluate(id=>localStorage.getItem('lightroom:'+id),code);
  expect(saved).toMatch(/^[0-9a-f]{48}$/);
  await host.locator('#startBtn').click();
  await expect(guest.locator('#overlay')).toHaveClass(/hidden/,{timeout:16000});
  for(let i=0;i<3;i++){
   await guest.reload();
   await expect(guest.locator('#overlay'),'Refresh #'+(i+1)+': must recover game phase').toHaveClass(/hidden/,{timeout:19000});
   await expect(guest.locator('#myRole')).toContainText('Эхо');
   await expect(guest.locator('#levelLabel')).toHaveText('ДЕМО · ИСПЫТАНИЕ 1 / 9');
   await expect(host.locator('#waitingBanner')).toHaveClass(/hidden/,{timeout:16000});
   expect(await guest.evaluate(id=>localStorage.getItem('lightroom:'+id),code)).toBe(saved);
  }
  expect(errors).toEqual([]);
 }finally{await desktop.close();await mobile.close();}
});
