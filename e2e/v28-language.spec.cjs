'use strict';
const {test,expect}=require('@playwright/test');

test('v28 first-use selector, solo entry and Share language are independent of host role',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');
 const language=page.locator('#languageSelect');
 await language.selectOption('en');
 await expect(page.locator('#v28RoleSelect option[value="1"]')).toHaveText('◈ Echo');
 await expect(page.locator('#v28SoloBtn')).toHaveText('Play solo · switch heroes');
 await page.locator('#v28RoleSelect').selectOption('1');
 await page.locator('#createBtn').click();
 await expect(page.locator('#roomCode')).toHaveText(/^[A-HJ-NP-Z2-9]{6}$/,{timeout:15000});
 await expect(page.locator('#myRole')).toContainText('Echo (host)');
 await expect(page.locator('#v28ShareBtn')).toHaveText('Share invitation');
 await language.selectOption('ru');
 await expect(page.locator('#v28RoleSelect option[value="1"]')).toHaveText('◈ Эхо');
 await expect(page.locator('#v28ShareBtn')).toHaveText('Поделиться приглашением');
 await language.selectOption('en');
 await expect(page.locator('#v28ShareBtn')).toHaveText('Share invitation');
 expect(errors).toEqual([]);
});
