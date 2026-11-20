'use strict';
const {test,expect}=require('@playwright/test');
test('Stage4: beta notices open in the selected language and stay publicly accessible',async({page})=>{
 await page.goto('/');
 const privacy=page.locator('[data-beta-policy="privacy"]'),terms=page.locator('[data-beta-policy="terms"]');
 await expect(privacy).toHaveAttribute('href','/privacy.html');
 await expect(terms).toHaveAttribute('href','/terms.html');
 await page.locator('#languageSelect').selectOption('en');
 await expect(privacy).toHaveText('Privacy');
 await expect(privacy).toHaveAttribute('href','/privacy-en.html');
 await expect(terms).toHaveText('Terms');
 await expect(terms).toHaveAttribute('href','/terms-en.html');
 const response=await page.request.get('/privacy-en.html');
 expect(response.ok()).toBeTruthy();
 expect(await response.text()).toContain('legal compliance certification');
 await page.goto('/terms-en.html');
 await expect(page.locator('h1')).toHaveText('Terms of use');
 await expect(page.getByRole('link',{name:'Русский'})).toHaveAttribute('href','/terms.html');
});
