'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
test.use({viewport:{width:1920,height:1080},deviceScaleFactor:1,serviceWorkers:'block'});
const dir=path.join(process.cwd(),'artifacts','steam-prepayment','gameplay-captures');
const capture=async(page,name)=>{
 fs.mkdirSync(dir,{recursive:true});
 await page.screenshot({path:path.join(dir,name+'.png'),fullPage:false,animations:'disabled',type:'png'});
};
test('Capture five authentic 1920x1080 frames from a local single-player test room',async({page})=>{
 // Every frame comes from the actual game. No generated or invented scenes.
 await page.addInitScript(()=>localStorage.setItem('linked-light-language-v1','en'));
 await page.goto('/');
 await expect(page.locator('#v28SoloBtn')).toBeVisible();
 await page.locator('#v28RoleSelect').selectOption('0');
 await page.locator('#v28SoloBtn').click();
 await expect(page.locator('#stage4LobbyGuide')).toHaveAttribute('data-state','solo',{timeout:20000});
 await expect(page.locator('#roomCode')).toHaveText(/^[A-HJ-NP-Z2-9]{6}$/);
 await page.locator('#startBtn').click();
 await expect(page.locator('#overlay')).toHaveClass(/hidden/,{timeout:20000});
 // Prevent any accidental invite tokens or room codes in store media.
 await page.addStyleTag({content:'#roomCode,#roomInput,#copyBtn{visibility:hidden!important}'});
 await capture(page,'01-first-coop-room');
 await page.keyboard.down('d');await page.waitForTimeout(750);await page.keyboard.up('d');
 await capture(page,'02-first-steps');
 await page.keyboard.down('w');await page.waitForTimeout(260);await page.keyboard.up('w');
 await capture(page,'03-first-jump');
 await page.keyboard.press('Tab');
 await page.keyboard.down('ArrowRight');await page.waitForTimeout(650);await page.keyboard.up('ArrowRight');
 await capture(page,'04-second-hero');
 await page.keyboard.press('g');await page.waitForTimeout(300);
 await capture(page,'05-shared-light');
 const report={type:'ACTUAL_GAME_LOCAL_SERVER_SCREENSHOTS',status:'REVIEW_REQUIRED',
  width:1920,height:1080,frames:5,server:'isolated-local-only',
  note:'Captured with real game client, not photo-realistic generated scenes. Verify actual playability, framing, no personal data, trademark rights and clarity before submitting to Steam.'};
 fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(report,null,2)+'\n');
});
