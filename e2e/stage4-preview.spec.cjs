'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const gallery=path.join(process.cwd(),'preview-artifacts');
fs.mkdirSync(gallery,{recursive:true});
const screenshot=(page,name,project)=>page.screenshot({
 path:path.join(gallery,project.toLowerCase()+'-'+name+'.png'),fullPage:true,
 animations:'disabled'
});
async function roomCode(page){
 await expect(page.locator('#roomCode')).toHaveText(/^[A-HJ-NP-Z2-9]{6}$/,{timeout:16000});
 return (await page.locator('#roomCode').textContent()).trim();
}

test('Stage4 preview: chapter navigation uses consumer labels in Russian and English',async({page},info)=>{
 await page.addInitScript(()=>localStorage.setItem('linked-light-language-v1','ru'));
 await page.goto('/');
 await expect(page.locator('#createBtn')).toBeVisible();
 await expect(page.getByRole('button',{name:'✦ Физика света',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:/v23/})).toHaveCount(0);
 await screenshot(page,'01-first-menu',info.project.name);
 await page.locator('#v28SoloBtn').click();
 await roomCode(page);
 await expect(page.locator('#stage4LobbyGuide')).toHaveAttribute('data-state','solo');
 await expect(page.locator('#startBtn')).toHaveText('Начать одному ✦');
 await page.addStyleTag({content:'#roomCode{filter:blur(14px)}'});
 await screenshot(page,'01b-solo-lobby',info.project.name);
 await page.locator('#startBtn').click();
 await expect(page.locator('#overlay')).toHaveClass(/hidden/,{timeout:15000});
 // Chapter buttons are intentionally grouped inside the consumer quick menu.
 await page.locator('.game-menu-trigger').click();
 await expect(page.locator('#gameQuickMenu')).toHaveClass(/is-open/);
 const toggle=page.locator('.v2346-toggle');
 await expect(toggle).toBeVisible();
 await expect(toggle).toHaveText('✦ Новые миры');
 await toggle.click();
 const dialog=page.locator('.v2346-dialog');
 await expect(dialog).toBeVisible();
 await expect(dialog.locator('.v2346-header strong')).toHaveText('Linked by Light · Новые миры');
 await expect(dialog.locator('[data-future-tab="physics"]')).toHaveText('Физика');
 await expect(dialog.locator('[data-future-tab="world"]')).toHaveText('Мир');
 await expect(dialog.locator('[data-future-tab="endless"]')).toHaveText('Повторы');
 await expect(dialog.locator('[data-future-tab="access"]')).toHaveText('Доступность');
 await page.addStyleTag({content:'#roomCode{filter:blur(14px)}'});
 await screenshot(page,'02-new-worlds-ru',info.project.name);
 await page.evaluate(()=>GameI18n.setLanguage('en'));
 await expect(dialog.locator('.v2346-header strong')).toHaveText('Linked by Light · New worlds');
 await expect(dialog.locator('[data-future-tab="physics"]')).toHaveText('Physics');
 await expect(dialog.locator('[data-future-tab="world"]')).toHaveText('World');
 await expect(dialog.locator('[data-future-tab="endless"]')).toHaveText('Replays');
 await expect(dialog.locator('[data-future-tab="access"]')).toHaveText('Accessibility');
 await screenshot(page,'03-new-worlds-en',info.project.name);
});

test('Stage4 preview: mobile landscape solo touch view renders without blocking overlay',async({browser},info)=>{
 const context=await browser.newContext({
  viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:2,
  serviceWorkers:'block'
 });
 try{
  await context.addInitScript(()=>localStorage.setItem('linked-light-language-v1','ru'));
  const page=await context.newPage();
  await page.goto('/');
  await expect(page.locator('#v28SoloBtn')).toBeVisible();
  await screenshot(page,'04-phone-landscape-menu',info.project.name);
  await page.locator('#v28RoleSelect').selectOption('1');
  await page.locator('#v28SoloBtn').tap();
  await roomCode(page);
  await expect(page.locator('#stage4LobbyGuide')).toHaveAttribute('data-state','solo');
  await expect(page.locator('#startBtn')).toBeEnabled();
  await page.locator('#startBtn').tap();
  await expect(page.locator('#overlay')).toHaveClass(/hidden/,{timeout:15000});
  await expect(page.locator('#touchControls [data-input="left"]')).toBeVisible();
  await expect(page.locator('#v28PingToggle')).toBeVisible();
  await page.addStyleTag({content:'#roomCode{filter:blur(14px)}'});
  await screenshot(page,'05-phone-landscape-game',info.project.name);
 }finally{await context.close();}
});
