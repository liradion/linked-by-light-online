'use strict';
const {test,expect}=require('@playwright/test');

// Run against a local server from playwright.config.cjs; never use the public Render beta.
test('mobile clean mode keeps gameplay controls and can be restored',{timeout:60000},async({browser})=>{
 const options={viewport:{width:844,height:390},hasTouch:true,isMobile:true};
 const hostContext=await browser.newContext(options);
 const guestContext=await browser.newContext(options);
 try{
  const host=await hostContext.newPage();
  const guest=await guestContext.newPage();
  await host.goto('/');
  // New visitors can choose "Create room" without dismissing a blocking tutorial.
  await expect(host.locator('#betaQuickStart')).toBeVisible();
  await expect(host.locator('#betaIntro')).toHaveCount(0);
  await host.locator('#createBtn').click();
  await expect(host.locator('#roomCode')).toHaveText(/^[A-HJ-NP-Z2-9]{6}$/,{timeout:15000});
  await expect(host.locator('#overlay')).toHaveAttribute('data-view','lobby');
  const code=(await host.locator('#roomCode').innerText()).trim();
  expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
  await guest.goto('/?room='+code);
  await expect(guest.locator('#betaQuickStart')).toHaveCount(0);
  await expect(host.locator('#startBtn')).toBeEnabled({timeout:15000});
  await host.locator('#startBtn').click();
  await expect(host.locator('#overlay')).toHaveClass(/hidden/);
  await expect(host.locator('#cleanPlayEntry')).toBeVisible();
  await host.locator('#cleanPlayEntry').click();
  await expect(host.locator('html')).toHaveClass(/clean-play-mode/);
  await expect(host.locator('.topline')).toBeHidden();
  await expect(host.locator('#cleanPlayToggle')).toBeVisible();
  for(const action of ['left','right','jump','ability'])
   await expect(host.locator('#touchControls [data-input="'+action+'"]')).toBeVisible();
  await host.locator('#cleanContextToggle').click();
  await expect(host.locator('#touchControls .adv-extra-controls [data-input="bond"]')).toBeVisible();
  await expect(host.locator('#touchControls .adv-extra-controls [data-input="emote"]')).toBeVisible();
  await host.locator('#cleanPlayToggle').click();
  await expect(host.locator('html')).not.toHaveClass(/clean-play-mode/);
  await expect(host.locator('.topline')).toBeVisible();
  await host.reload();
  await expect(host.locator('html')).not.toHaveClass(/clean-play-mode/);
 }finally{
  await hostContext.close();await guestContext.close();
 }
});
