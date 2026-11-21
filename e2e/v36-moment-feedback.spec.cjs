'use strict';
const {test,expect}=require('@playwright/test');
test('v36: co-op milestone toast is readable on physical-phone viewport and announces to assistive tech',async({browser})=>{
 const ctx=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 try{
  const page=await ctx.newPage();await page.goto('/');
  const state=await page.evaluate(()=>{
   const toast=document.querySelector('#toast');
   window.GameV36Moments.apply(
    {stage:3,phase:'playing',world:{checkpoint:{index:-1}}},
    {stage:3,phase:'playing',world:{checkpoint:{index:0}}},
    'ru',(text)=>{toast.textContent=text;toast.classList.add('visible');},null,toast);
   return {role:toast.getAttribute('role'),live:toast.getAttribute('aria-live'),
    milestone:toast.dataset.milestone,text:toast.textContent,
    transition:getComputedStyle(toast).transitionDuration};
  });
  expect(state).toMatchObject({role:'status',live:'polite',milestone:'checkpoint',text:expect.stringContaining('точка восстановления')});
  expect(state.transition).toBe('0s');
  await expect(page.locator('#toast')).toBeVisible();
 }finally{await ctx.close();}
});
