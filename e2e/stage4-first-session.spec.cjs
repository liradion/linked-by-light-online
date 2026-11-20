'use strict';
const {test,expect}=require('@playwright/test');

async function dismissIntro(page){
 const dismiss=page.locator('#betaQuickStart .beta-quickstart-dismiss');
 if(await dismiss.isVisible())await dismiss.click();
}
async function codeFor(page){
 await expect(page.locator('#roomCode')).toHaveText(/^[A-HJ-NP-Z2-9]{6}$/,{timeout:16000});
 return (await page.locator('#roomCode').textContent()).trim();
}

test('Stage4: Echo host invites iPhone landscape guest, live readiness and RU/EN labels',async({browser})=>{
 const hostContext=await browser.newContext({viewport:{width:1260,height:810},serviceWorkers:'block'});
 const guestContext=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:2,serviceWorkers:'block'});
 try{
  const host=await hostContext.newPage(),guest=await guestContext.newPage(),errors=[];
  host.on('pageerror',e=>errors.push('host: '+e.message));
  guest.on('pageerror',e=>errors.push('guest: '+e.message));
  await host.goto('/');await dismissIntro(host);
  await expect(host.locator('#stage4LobbyGuide')).toBeHidden();
  await host.locator('#v28RoleSelect').selectOption('1');
  await host.locator('#createBtn').click();
  const code=await codeFor(host);
  const guidance=host.locator('#stage4LobbyGuide');
  await expect(guidance).toHaveAttribute('data-state','hostWaiting');
  await expect(guidance.locator('.stage4-lobby-title')).toHaveText('Пригласите второго игрока');
  await expect(host.locator('#startBtn')).toBeDisabled();
  await guest.goto('/?room='+code);
  await expect(guest.locator('#myRole')).toContainText('Искра',{timeout:16000});
  await expect(guest.locator('#stage4LobbyGuide')).toHaveAttribute('data-state','guest');
  await expect(guest.locator('#startBtn')).toBeDisabled();
  await expect(guidance).toHaveAttribute('data-state','hostReady',{timeout:16000});
  await expect(host.locator('#startBtn')).toBeEnabled();
  await host.locator('#languageSelect').selectOption('en');
  await expect(guidance.locator('.stage4-lobby-title')).toHaveText('You are ready to play together');
  await expect(host.locator('#startBtn')).toHaveText('Start together ✦');
  await guest.locator('#languageSelect').selectOption('en');
  await expect(guest.locator('.stage4-lobby-title')).toHaveText('You have joined the room');
  await host.locator('#startBtn').click();
  await expect(host.locator('#overlay')).toHaveClass(/hidden/,{timeout:16000});
  await expect(guest.locator('#overlay')).toHaveClass(/hidden/,{timeout:16000});
  await expect(guest.locator('#touchControls [data-input="left"]')).toBeVisible();
  await expect(guidance).toBeHidden();
  expect(errors).toEqual([]);
 }finally{await hostContext.close();await guestContext.close();}
});

test('Stage4: solo lobby advertises solo controls and start action in both languages',async({page})=>{
 await page.goto('/');await dismissIntro(page);
 await page.locator('#v28RoleSelect').selectOption('0');
 await page.locator('#v28SoloBtn').click();
 await codeFor(page);
 await expect(page.locator('#stage4LobbyGuide')).toHaveAttribute('data-state','solo');
 await expect(page.locator('#stage4LobbyGuide')).toContainText('переключайте Искру и Эхо');
 await expect(page.locator('#startBtn')).toHaveText('Начать одному ✦');
 await expect(page.locator('#startBtn')).toBeEnabled();
 await page.locator('#languageSelect').selectOption('en');
 await expect(page.locator('#stage4LobbyGuide')).toContainText('You control both heroes');
 await expect(page.locator('#startBtn')).toHaveText('Start solo ✦');
 await page.locator('#startBtn').click();
 await expect(page.locator('#overlay')).toHaveClass(/hidden/,{timeout:16000});
 await expect(page.locator('#stage4LobbyGuide')).toBeHidden();
});
