'use strict';
const {test,expect}=require('@playwright/test');

test('remapped Spark movement sends actual network input and survives a page reload',async({browser})=>{
 const hostContext=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'});
 const guestContext=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'});
 const outbound=[];
 try{
  const host=await hostContext.newPage(),guest=await guestContext.newPage();
  host.on('websocket',socket=>socket.on('framesent',frame=>{
   try{const data=JSON.parse(frame.payload);if(data.t==='input')outbound.push(data);}catch(_){}
  }));
  await host.goto('/');
  await host.locator('#createBtn').click();
  await expect(host.locator('#roomCode')).toHaveText(/^[A-HJ-NP-Z2-9]{6}$/,{timeout:15000});
  const code=(await host.locator('#roomCode').textContent()).trim();
  await guest.goto('/?room='+code);
  await expect(host.locator('#startBtn')).toBeEnabled({timeout:15000});
  await host.locator('#startBtn').click();
  await expect(host.locator('#overlay')).toHaveClass(/hidden/);
  await host.locator('.game-menu-trigger').click();
  await expect(host.locator('#controlsOpen')).toBeVisible();
  await host.locator('#controlsOpen').click();
  await expect(host.locator('#controlsDialog')).toBeVisible();
  const right=host.locator('#controlsDialog [data-role="0"][data-action="right"]');
  await expect(right).toHaveText('D');
  await right.click();
  await host.keyboard.press('j');
  await expect(right).toHaveText('J');
  await expect(host.locator('#controlsNotice')).toContainText('Сохранено');
  // The primary role must not be able to shadow its own movement or a global shortcut.
  await host.locator('#controlsDialog [data-role="0"][data-action="left"]').click();
  await host.keyboard.press('j');
  await expect(host.locator('#controlsNotice')).toContainText('занята');
  await host.keyboard.press('Escape');
  await host.locator('#controlsClose').click();
  await expect(host.locator('#amberControlsGuide')).toContainText('J');
  const previous=outbound.length;
  await host.keyboard.down('j');
  await expect.poll(()=>outbound.slice(previous).some(p=>p.right===true)).toBe(true);
  await host.keyboard.up('j');
  await expect.poll(()=>outbound.slice(previous).some(p=>p.right===false)).toBe(true);
  await host.reload();
  await expect(host.locator('#amberControlsGuide')).toContainText('J');
  await host.locator('.game-menu-trigger').click();
  await host.locator('#controlsOpen').click();
  await expect(host.locator('#controlsDialog [data-role="0"][data-action="right"]')).toHaveText('J');
  await expect(host.locator('#controlsDialog [data-role="1"][data-action="right"]')).toHaveText('→');
  await host.locator('#controlsDialog button').filter({hasText:'По умолчанию'}).click();
  await expect(host.locator('#controlsDialog [data-role="0"][data-action="right"]')).toHaveText('D');
  await host.locator('#controlsClose').click();
 }finally{await hostContext.close();await guestContext.close();}
});
