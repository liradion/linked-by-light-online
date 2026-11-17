'use strict';
const {test,expect}=require('@playwright/test');
test('role-aware hint stays usable on desktop and phone, including immersive mode',async({browser})=>{
 const desktop=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'});
 const phone=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 try{
  const host=await desktop.newPage(),guest=await phone.newPage();
  const errors=[];
  host.on('pageerror',error=>errors.push(error.message));
  await host.goto('/');
  const diagnostics=await host.evaluate(async()=>({
   script:document.querySelector('script[src*="game-hints"]')?.getAttribute('src')||null,
   hintsType:typeof window.GameHints,
   hasFrame:!!document.getElementById('frame'),
   hasHeader:!!document.querySelector('.topline > div:last-child'),
   hintButton:document.getElementById('gameHintBtn')?.outerHTML||null,
   hintUrl:(await fetch('/game-hints.js?v=5')).status
  }));
  expect(diagnostics.hintUrl,JSON.stringify({diagnostics,errors})).toBe(200);
  expect(diagnostics.hintsType,JSON.stringify({diagnostics,errors})).toBe('object');
  expect(diagnostics.hintButton,JSON.stringify({diagnostics,errors})).toContain('gameHintBtn');
  expect(errors,JSON.stringify({diagnostics,errors})).toEqual([]);
  await host.locator('#createBtn').click();
  await expect(host.locator('#roomCode')).toHaveText(/^[A-HJ-NP-Z2-9]{6}$/,{timeout:15000});
  const room=(await host.locator('#roomCode').textContent()).trim();
  await guest.goto('/?room='+room);
  await expect(host.locator('#startBtn')).toBeEnabled({timeout:15000});
  await host.locator('#startBtn').click();
  await expect(host.locator('#overlay')).toHaveClass(/hidden/);
  await expect(guest.locator('#overlay')).toHaveClass(/hidden/);
  await host.locator('.game-menu-trigger').click();
  await expect(host.locator('#gameHintBtn')).toBeVisible();
  await host.locator('#gameHintBtn').click();
  await expect(host.locator('#gameHintPanel')).toBeVisible();
  await expect(host.locator('.game-hint-text')).toContainText('Искра');
  await host.locator('.game-hint-actions button').first().click();
  await expect(host.locator('.game-hint-text')).toContainText('оранжевую плиту');
  await host.locator('.game-hint-actions button').last().click();
  await expect(host.locator('#gameHintPanel')).toBeHidden();
  await host.locator('#cleanPlayEntry').click();
  await expect(host.locator('#gameHintCleanBtn')).toBeVisible();
  await host.locator('#gameHintCleanBtn').click();
  await expect(host.locator('#gameHintPanel')).toBeVisible();
  await expect(host.locator('#cleanPlayToggle')).toBeVisible();
  await host.locator('#cleanPlayToggle').click();
  await expect(host.locator('#gameHintPanel')).toBeVisible();
  await guest.locator('.game-menu-trigger').click();
  await guest.locator('#gameHintBtn').click();
  await expect(guest.locator('#gameHintPanel')).toBeVisible();
  await guest.locator('.game-hint-actions button').first().click();
  await expect(guest.locator('.game-hint-text')).toContainText('голубую плиту');
  await expect(guest.locator('#touchControls [data-input="ability"]')).toBeVisible();
 }finally{await desktop.close();await phone.close();}
});
