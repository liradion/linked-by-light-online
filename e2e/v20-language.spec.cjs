'use strict';
const {test,expect}=require('@playwright/test');

test('the Intertwined Worlds story modal switches RU/EN without blocking access',async({page})=>{
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.locator('#languageSelect').selectOption('en');
 // v27 moves chapter controls into the menu, not the game canvas.
 await page.locator('.game-menu-trigger').click();
 const open=page.locator('.v20-toggle');
 await expect(open).toBeVisible();
 await expect(open).toContainText('Story / Home');
 await open.click();
 const dialog=page.locator('.v20-dialog');
 await expect(dialog).toBeVisible();
 await expect(dialog.locator('.v20-top strong')).toHaveText('Intertwined Worlds');
 await expect(dialog.locator('.v20-body')).toContainText('New story');
 await expect(dialog.locator('.v20-body')).toContainText('Connection');
 await dialog.locator('[data-dialog-language]').selectOption('ru');
 await expect(dialog.locator('.v20-top strong')).toHaveText('Переплетение миров');
 await expect(dialog.locator('.v20-body')).toContainText('Новая история');
 await dialog.locator('[data-dialog-language]').selectOption('en');
 await expect(dialog.locator('.v20-body')).toContainText('Create a story room');
 await dialog.locator('.v20-top button').click();
 await expect(dialog).not.toBeVisible();
 await expect(page.locator('.v20-toggle')).toContainText('Story / Home');
 expect(errors).toEqual([]);
});
