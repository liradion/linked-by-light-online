'use strict';
const {test,expect}=require('@playwright/test');

test('mock gamepad can remap ability, suppress actions in dialog and restore mapping after reload',async({browser})=>{
 const hostContext=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'});
 const guestContext=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'});
 const outbound=[];
 try{
  const host=await hostContext.newPage(),guest=await guestContext.newPage();
  await host.addInitScript(()=>{
   const buttons=Array.from({length:16},()=>({pressed:false,value:0}));
   window.__testPad={connected:true,buttons,axes:[0,0]};
   Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>window.__testPad.connected?[{
    id:'E2E standard gamepad',index:0,connected:true,mapping:'standard',buttons:window.__testPad.buttons,axes:window.__testPad.axes
   }]:[]});
  });
  host.on('websocket',socket=>socket.on('framesent',frame=>{
   try{const obj=JSON.parse(frame.payload);if(obj.t==='input')outbound.push(obj);}catch(_){}
  }));
  await host.goto('/');
  await host.locator('#createBtn').click();
  await expect(host.locator('#roomCode')).toHaveText(/^[A-HJ-NP-Z2-9]{6}$/,{timeout:15000});
  const room=(await host.locator('#roomCode').textContent()).trim();
  await guest.goto('/?room='+room);
  await expect(host.locator('#startBtn')).toBeEnabled({timeout:15000});
  await host.locator('#startBtn').click();
  await expect(host.locator('#overlay')).toHaveClass(/hidden/);
  await host.locator('.game-menu-trigger').click();
  await expect(host.locator('#gamepadOpen')).toBeVisible();
  await host.locator('#gamepadOpen').click();
  await expect(host.locator('#gamepadDialog')).toBeVisible();
  const ability=host.locator('#gamepadDialog [data-pad-action="ability"]');
  await expect(ability).toContainText('B');
  await ability.click();
  await expect(host.locator('#gamepadNotice')).toContainText('Теперь нажмите кнопку');
  await host.evaluate(()=>{window.__testPad.buttons[5]={pressed:true,value:1};});
  await expect(ability).toContainText('RB');
  await expect(host.locator('#gamepadNotice')).toContainText('Сохранено');
  // The remapping press is not itself a gameplay ability while the dialog is open.
  expect(outbound.some(packet=>packet.abilitySeq>0)).toBe(false);
  await host.evaluate(()=>{window.__testPad.buttons[5]={pressed:false,value:0};});
  await host.locator('#gamepadClose').click();
  const start=outbound.length;
  await host.evaluate(()=>{window.__testPad.buttons[5]={pressed:true,value:1};});
  await expect.poll(()=>outbound.slice(start).some(packet=>packet.abilitySeq>0)).toBe(true);
  await host.evaluate(()=>{window.__testPad.buttons[5]={pressed:false,value:0};});
  const maxSeq=Math.max(...outbound.map(packet=>packet.abilitySeq));
  await host.evaluate(()=>{window.__testPad.buttons[1]={pressed:true,value:1};});
  await host.waitForTimeout(220);
  await host.evaluate(()=>{window.__testPad.buttons[1]={pressed:false,value:0};});
  expect(Math.max(...outbound.map(packet=>packet.abilitySeq))).toBe(maxSeq);
  await host.reload();
  await host.locator('.game-menu-trigger').click();
  await host.locator('#gamepadOpen').click();
  await expect(host.locator('#gamepadDialog [data-pad-action="ability"]')).toContainText('RB');
  await host.locator('#gamepadDefault').click();
  await expect(host.locator('#gamepadDialog [data-pad-action="ability"]')).toContainText('B');
  await host.locator('#gamepadClose').click();
 }finally{await hostContext.close();await guestContext.close();}
});

test('gamepad loss releases movement and settings popup blocks directional input',async({browser})=>{
 const hostContext=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'});
 const guestContext=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'});
 const packets=[];
 try{
  const host=await hostContext.newPage(),guest=await guestContext.newPage();
  await host.addInitScript(()=>{
   window.__testPad={connected:true,axes:[0,0],buttons:Array.from({length:16},()=>({pressed:false,value:0}))};
   Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>window.__testPad.connected?[{
    id:'E2E pad',connected:true,mapping:'standard',axes:window.__testPad.axes,buttons:window.__testPad.buttons
   }]:[]});
  });
  host.on('websocket',socket=>socket.on('framesent',frame=>{
   try{const obj=JSON.parse(frame.payload);if(obj.t==='input')packets.push(obj);}catch(_){}
  }));
  await host.goto('/');
  await host.locator('#createBtn').click();
  await expect(host.locator('#roomCode')).toHaveText(/^[A-HJ-NP-Z2-9]{6}$/,{timeout:15000});
  await guest.goto('/?room='+(await host.locator('#roomCode').textContent()).trim());
  await expect(host.locator('#startBtn')).toBeEnabled({timeout:15000});
  await host.locator('#startBtn').click();
  await expect(host.locator('#overlay')).toHaveClass(/hidden/);
  await host.evaluate(()=>{window.__testPad.axes[0]=.85;});
  await expect.poll(()=>packets.some(p=>p.right===true)).toBe(true);
  await host.evaluate(()=>{window.__testPad.connected=false;});
  await expect.poll(()=>packets.slice(-8).some(p=>p.right===false)).toBe(true);
  await host.evaluate(()=>{window.__testPad.connected=true;window.__testPad.axes[0]=.9;});
  await expect.poll(()=>packets.slice(-8).some(p=>p.right===true)).toBe(true);
  await host.locator('.game-menu-trigger').click();
  await host.locator('#gamepadOpen').click();
  await expect(host.locator('#gamepadDialog')).toBeVisible();
  await expect.poll(()=>packets.slice(-8).some(p=>p.right===false)).toBe(true);
 }finally{await hostContext.close();await guestContext.close();}
});
