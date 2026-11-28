'use strict';
const {test,expect}=require('@playwright/test');

const sizes=[
 {name:'desktop',viewport:{width:1280,height:720}},
 {name:'short desktop',viewport:{width:1024,height:600}},
 {name:'phone landscape',viewport:{width:844,height:390},isMobile:true,hasTouch:true}
];
for(const {name,...options} of sizes){
 test('v38: '+name+' can reach and activate solo entry without forced input',async({browser})=>{
  const context=await browser.newContext({...options,serviceWorkers:'block'});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto('/');
   const overlay=page.locator('#overlay'),card=overlay.locator('.overlay-card'),solo=page.locator('#v28SoloBtn');
   await expect(overlay).toHaveAttribute('data-view','menu');
   await expect(solo).toBeVisible();
   await expect(solo).toBeEnabled();
   // The top of oversized content must remain reachable at scroll origin.
   await overlay.evaluate(el=>{el.scrollTop=0;});
   const layout=await overlay.evaluate(el=>{
    const card=el.querySelector('.overlay-card'),r=el.getBoundingClientRect(),c=card.getBoundingClientRect();
    return {top:c.top-r.top,scrollable:getComputedStyle(el).overflowY,
      animation:getComputedStyle(card).animationName};
   });
   expect(layout.top).toBeGreaterThanOrEqual(-1);
   expect(layout.scrollable).toBe('auto');
   expect(layout.animation).toMatch(/^(v38MenuFade|none)$/);
   await solo.scrollIntoViewIfNeeded();
   // Require actual user-input actionability, not a synthetic DOM click.
   if(options.hasTouch)await solo.tap();else await solo.click();
   await expect(page.locator('#roomCode')).toHaveText(/^[A-HJ-NP-Z2-9]{6}$/,{timeout:20000});
   await expect(page.locator('#startBtn')).toBeEnabled();
   if(options.hasTouch)await page.locator('#startBtn').tap();else await page.locator('#startBtn').click();
   await expect(overlay).toHaveClass(/hidden/,{timeout:20000});
   expect(errors).toEqual([]);
  }finally{await context.close();}
 });
}
