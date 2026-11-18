'use strict';
const {test,expect}=require('@playwright/test');

test('graphics, keyboard, gamepad and hints translate instantly while controls are open',async({page})=>{
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');
 await page.locator('#languageSelect').selectOption('en');
 await page.locator('.game-menu-trigger').click();
 await page.locator('#qualityOpen').click();
 await expect(page.locator('#qualityDialog')).toBeVisible();
 await expect(page.locator('#qualityDialog .quality-head strong')).toContainText('Game settings');
 await expect(page.locator('#qualityGraphics').locator('..')).toContainText('Graphics');
 await expect(page.locator('#qualityGraphics option[value="low"]')).toHaveText('Low');
 await page.evaluate(()=>window.GameI18n.setLanguage('ru'));
 await expect(page.locator('#qualityDialog .quality-head strong')).toContainText('Настройки игры');
 await page.evaluate(()=>window.GameI18n.setLanguage('en'));
 await expect(page.locator('#qualitySave')).toHaveText('Apply');
 await page.locator('#qualityClose').click();

 await page.locator('.game-menu-trigger').click();
 await page.locator('#controlsOpen').click();
 await expect(page.locator('#controlsDialog')).toBeVisible();
 await expect(page.locator('#controlsDialog .controls-head strong')).toContainText('Keyboard controls');
 await expect(page.locator('#controlsDialog .controls-role').first()).toContainText('Spark');
 await expect(page.locator('#controlsDialog [data-role="0"][data-action="right"]')).toHaveText('D');
 await page.evaluate(()=>window.GameI18n.setLanguage('ru'));
 await expect(page.locator('#controlsDialog .controls-head strong')).toContainText('Управление клавиатурой');
 await expect(page.locator('#controlsDialog .controls-role').first()).toContainText('Искра');
 await expect(page.locator('#controlsDialog [data-role="0"][data-action="right"]')).toHaveText('D');
 await page.evaluate(()=>window.GameI18n.setLanguage('en'));
 await page.locator('#controlsClose').click();

 await page.locator('.game-menu-trigger').click();
 await page.locator('#gamepadOpen').click();
 await expect(page.locator('#gamepadDialog')).toBeVisible();
 await expect(page.locator('#gamepadDialog .gamepad-head strong')).toContainText('Gamepad settings');
 await expect(page.locator('#gamepadDialog .gamepad-row').first()).toContainText('Jump');
 await expect(page.locator('#gamepadDialog [data-pad-action="ability"]')).toContainText('B');
 await page.evaluate(()=>window.GameI18n.setLanguage('ru'));
 await expect(page.locator('#gamepadDialog .gamepad-head strong')).toContainText('Настройка геймпада');
 await expect(page.locator('#gamepadDialog .gamepad-row').first()).toContainText('Прыжок');
 await page.evaluate(()=>window.GameI18n.setLanguage('en'));
 await expect(page.locator('#gamepadDefault')).toHaveText('Restore defaults');
 await page.locator('#gamepadClose').click();
 await expect(page.locator('#languageSelect')).toHaveValue('en');
 expect(errors).toEqual([]);
});

test('real room-not-found server response switches RU and EN without a second network request',async({page})=>{
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');
 await page.locator('#languageSelect').selectOption('en');
 await page.locator('#roomInput').fill('ZZZZZZ');
 await page.locator('#joinBtn').click();
 await expect(page.locator('#networkError')).toContainText('Room not found.',{timeout:15000});
 await expect(page.locator('#networkError')).toContainText('fresh invitation');
 await page.locator('#languageSelect').selectOption('ru');
 await expect(page.locator('#networkError')).toContainText('Комната не найдена.');
 await expect(page.locator('#networkError')).toContainText('свежую ссылку');
 await page.locator('#languageSelect').selectOption('en');
 await expect(page.locator('#networkError')).toContainText('Room not found.');
 expect(errors).toEqual([]);
});
