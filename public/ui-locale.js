/* Linked by Light — UI labels and exact Russian server-error translations.
   The server protocol stays language-neutral and unchanged. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.GameUILocale=api;
})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const RU=Object.freeze({
  'quality.open':'⚙ Настройки','quality.title':'⚙ Настройки игры','quality.close':'Закрыть',
  'quality.graphics':'Графика','quality.auto':'Авто','quality.low':'Низкая','quality.medium':'Средняя','quality.high':'Высокая',
  'quality.buttons':'Размер кнопок iPhone','quality.opacity':'Прозрачность кнопок',
  'quality.lift':'Поднять кнопки выше','quality.inset':'Отступ кнопок от краёв',
  'quality.sound':'Музыка и эффекты','quality.motion':'Меньше анимаций','quality.diagnostics':'FPS и диагностика соединения',
  'quality.note':'🎮 Геймпад: левый стик/крестовина — движение. Кнопки A/B/X/Y можно изменить через «🎮 Геймпад» в меню. Схема сохраняется только на этом устройстве.',
  'quality.apply':'Применить','quality.stats':'FPS {fps} · RTT {rtt} мс · Джиттер {jitter} мс · Буфер {buffer} мс · Снимки {snapshotHz} Гц · {quality}',
  'controls.open':'⌨ Клавиши','controls.openLabel':'Изменить управление клавиатурой',
  'controls.title':'⌨ Управление клавиатурой','controls.close':'Закрыть настройки клавиш',
  'controls.note':'Настройки действуют на этом устройстве. У каждого героя свои клавиши. Сенсорное управление и геймпад остаются прежними.',
  'controls.spark':'✦ Искра','controls.echo':'◈ Эхо','controls.left':'Влево','controls.right':'Вправо',
  'controls.jump':'Прыжок','controls.ability':'Способность','controls.reset':'По умолчанию',
  'controls.done':'Готово','controls.space':'Пробел','controls.assign':'Назначить {action} для {hero}: {key}',
  'controls.capture':'Нажмите новую клавишу. Esc — отменить. Системные сочетания и клавиши других действий недоступны.',
  'controls.wait':'Нажмите клавишу…','controls.cancelled':'Изменение отменено.',
  'controls.invalid':'Нельзя назначить {key}: клавиша недоступна или уже занята действием этого героя.',
  'controls.saved':'Сохранено на этом устройстве.','controls.restored':'Стандартное управление восстановлено.',
  'pad.open':'🎮 Геймпад','pad.openLabel':'Настроить кнопки геймпада','pad.title':'🎮 Настройка геймпада',
  'pad.close':'Закрыть настройки геймпада',
  'pad.note':'Подключите стандартный геймпад. Левый стик и крестовина — движение. Нажмите действие, отпустите все кнопки и нажмите новую. Старт, меню и ←/→ крестовины зарезервированы.',
  'pad.jump':'Прыжок','pad.ability':'Способность','pad.bond':'Связь','pad.emote':'Эмоция',
  'pad.assign':'Назначить {action}: {key}','pad.reset':'По умолчанию','pad.done':'Готово',
  'pad.wait':'Ждём кнопку…','pad.missing':'Подключите геймпад и нажмите любую назначаемую кнопку.',
  'pad.ready':'Теперь нажмите кнопку на геймпаде. Кнопки меню и движения зарезервированы.',
  'pad.saved':'Сохранено: {action} — {key}. Отпустите кнопку.',
  'pad.invalid':'Кнопка занята другим действием. Отпустите её и выберите другую.',
  'pad.capture':'Отпустите все кнопки геймпада перед назначением: {action}.',
  'pad.restored':'Стандартная схема восстановлена.',
  'hints.open':'? Подсказка','hints.openLabel':'Открыть подсказку по уровню',
  'hints.cleanLabel':'Подсказка по текущему уровню','hints.more':'Подробнее','hints.close':'Закрыть',
  'network.roomHelp':'Комната не найдена. Сначала создайте новую комнату на первом устройстве и отправьте свежую ссылку. После перезапуска сервера прежние коды исчезают.',
  'network.lost':'Связь прервалась. Автоматически переподключаемся…',
  'network.retry':'Нет связи с сервером. Повторная попытка…',
  'network.copyFailed':'Не удалось скопировать автоматически. Код: {room} — {url}',
  'network.manualCopy':'Скопируйте ссылку вручную: {url}',
  'network.createFirst':'Сначала создайте комнату.',
  'network.spectatorLink':'Ссылка наблюдателю: {url}'
 });
 const EN=Object.freeze({
  'quality.open':'⚙ Settings','quality.title':'⚙ Game settings','quality.close':'Close',
  'quality.graphics':'Graphics','quality.auto':'Auto','quality.low':'Low','quality.medium':'Medium','quality.high':'High',
  'quality.buttons':'Touch button size','quality.opacity':'Touch button opacity',
  'quality.lift':'Raise touch buttons','quality.inset':'Touch button edge spacing',
  'quality.sound':'Music and sound effects','quality.motion':'Reduce animations','quality.diagnostics':'FPS and connection diagnostics',
  'quality.note':'🎮 Gamepad: move with the left stick or D-pad. Customize A/B/X/Y in “🎮 Gamepad” from the menu. Settings are stored on this device only.',
  'quality.apply':'Apply','quality.stats':'FPS {fps} · RTT {rtt} ms · Jitter {jitter} ms · Buffer {buffer} ms · Snapshots {snapshotHz} Hz · {quality}',
  'controls.open':'⌨ Keyboard','controls.openLabel':'Customize keyboard controls',
  'controls.title':'⌨ Keyboard controls','controls.close':'Close keyboard settings',
  'controls.note':'These settings apply to this device. Each hero has separate keys. Touchscreen and gamepad controls stay unchanged.',
  'controls.spark':'✦ Spark','controls.echo':'◈ Echo','controls.left':'Left','controls.right':'Right',
  'controls.jump':'Jump','controls.ability':'Ability','controls.reset':'Restore defaults',
  'controls.done':'Done','controls.space':'Space','controls.assign':'Assign {action} for {hero}: {key}',
  'controls.capture':'Press a new key. Esc cancels. System shortcuts and keys used by this hero cannot be assigned.',
  'controls.wait':'Press a key…','controls.cancelled':'Change cancelled.',
  'controls.invalid':'Cannot assign {key}: this key is unavailable or already used by this hero.',
  'controls.saved':'Saved on this device.','controls.restored':'Default keyboard controls restored.',
  'pad.open':'🎮 Gamepad','pad.openLabel':'Customize gamepad buttons','pad.title':'🎮 Gamepad settings',
  'pad.close':'Close gamepad settings',
  'pad.note':'Connect a standard gamepad. Use the left stick or D-pad to move. Select an action, release all buttons, then press the new button. Menu and left/right D-pad buttons are reserved.',
  'pad.jump':'Jump','pad.ability':'Ability','pad.bond':'Bond','pad.emote':'Emote',
  'pad.assign':'Assign {action}: {key}','pad.reset':'Restore defaults','pad.done':'Done',
  'pad.wait':'Press a button…','pad.missing':'Connect a gamepad, then press an assignable button.',
  'pad.ready':'Now press a gamepad button. Menu and movement buttons are reserved.',
  'pad.saved':'Saved: {action} — {key}. Release the button.',
  'pad.invalid':'Button already belongs to another action. Release it and choose a different one.',
  'pad.capture':'Release all gamepad buttons before assigning: {action}.',
  'pad.restored':'Default gamepad layout restored.',
  'hints.open':'? Hint','hints.openLabel':'Open a level hint',
  'hints.cleanLabel':'Hint for this level','hints.more':'More detail','hints.close':'Close',
  'network.roomHelp':'Room not found. Create a new room on the first device and share a fresh invitation. Old room codes may disappear after a server restart.',
  'network.lost':'Connection lost. Reconnecting automatically…',
  'network.retry':'Cannot reach the server. Retrying…',
  'network.copyFailed':'Could not copy automatically. Code: {room} — {url}',
  'network.manualCopy':'Copy the link manually: {url}',
  'network.createFirst':'Create a room first.',
  'network.spectatorLink':'Spectator link: {url}'
 });
 const ERROR_EN=Object.freeze({
  'Ошибка авторизации':'Authorization failed.',
  'Эта комната работает в одиночном режиме. Создайте совместную комнату.':'This is a solo room. Create a co-op room to play together.',
  'Недоступно переключение героев':'Character switching is unavailable.',
  'Команда не распознана':'Command not recognized.',
  'Галерея временно закрыта: модератор ещё не подключён':'Gallery submissions are paused until moderation is enabled.',
  'Только ведущий может публиковать авторскую карту':'Only the host can publish a custom map.',
  'Не более двух публичных карт от команды':'A team can have no more than two public maps.',
  'Сначала создайте карту с платформами в редакторе':'Create a map with platforms in the editor first.',
  'Не удалось отправить жалобу':'Could not submit the report.',
  'Жалоба уже получена':'Report already received.',
  'Для публикации нужен совместный режим':'Co-op mode is required to publish a map.',
  'Карта отсутствует':'Map not found.',
  'Помощь по голосованию доступна вдвоём':'Assist voting is available in co-op only.',
  'Действие неизвестно':'Unknown action.',
  'Ведущий может создать испытание только вдвоём':'The host can generate challenges only with both players.',
  'Необходимо выбрать действительный seed или ежедневный режим':'Choose a valid seed or daily mode.',
  'Не удалось создать безопасный уровень':'Unable to generate a validated stage.',
  'Пока нет записанных прохождений':'No saved replays yet.',
  'В комнате уже два игрока.':'This room already has two players.',
  'Вы уже в комнате.':'You are already in a room.',
  'Вы уже находитесь в комнате.':'You are already in a room.',
  'Демоверсия проходится по порядку. Чтобы сыграть другую главу, создайте новую обычную комнату.':'The demo is played in order. Create a regular room to explore other chapters.',
  'Для новой главы необходимы два клиента v26.':'Both players need client v26 for this chapter.',
  'Для новой главы нужен клиент v21 на обоих устройствах.':'Both devices need client v21 for this chapter.',
  'Для новой кампании обновите игру на обоих устройствах.':'Update the game on both devices to play this campaign.',
  'Для новой физики необходим клиент v26.':'Client v26 is required for the new physics.',
  'Для новых глав нужна версия v26.':'Version v26 is required for these chapters.',
  'Для этой главы нужен обновлённый клиент v26.':'This chapter requires an updated v26 client.',
  'Для этой команды необходим клиент v20.':'This action requires client v20.',
  'Записка должна содержать от 1 до 160 символов.':'The note must contain 1–160 characters.',
  'Испытание v21 ещё не открыто.':'This v21 challenge is still locked.',
  'Комната не найдена. Проверьте код.':'Room not found. Check the code.',
  'Не больше 12 записок в минуту.':'You can send up to 12 notes per minute.',
  'Неверное значение режима.':'Invalid mode value.',
  'Неверный номер уровня.':'Invalid level number.',
  'Некорректный идентификатор действия':'Invalid action identifier.',
  'Некорректный идентификатор команды':'Invalid command identifier.',
  'Оба игрока должны обновить игру до v20.':'Both players must update to v20.',
  'Оба игрока должны обновить игру до v21.':'Both players must update to v21.',
  'Оба игрока должны обновить игру до v26.':'Both players must update to v26.',
  'Оба игрока должны открыть v21 для новых испытаний.':'Both players must open v21 for these challenges.',
  'Обновите игру до v20, чтобы открыть новую кампанию.':'Update the game to v20 to open this campaign.',
  'Обновите игру до версии 21':'Update the game to version 21.',
  'Обновите клиент до v26.':'Update your client to v26.',
  'Обновите страницу до v20, чтобы присоединиться к новой истории.':'Refresh the page to v20 to join the new story.',
  'Обновите страницу до v21.':'Refresh the page to v21.',
  'Сервер заполнен. Попробуйте позже.':'The server is full. Try again later.',
  'Слишком много голосований.':'Too many votes. Try again later.',
  'Слишком много действий за минуту.':'Too many actions per minute.',
  'Слишком много игровых команд':'Too many game commands.',
  'Слишком много команд в минуту':'Too many commands per minute.',
  'Слишком много комнат за минуту.':'Too many rooms created per minute.',
  'Слишком много попыток входа.':'Too many join attempts.',
  'Сначала найдите все 11 секретных рун.':'Find all 11 secret runes first.',
  'У комнаты уже четыре наблюдателя.':'This room already has four spectators.',
  'Уровень ещё не открыт.':'This level is still locked.',
  'Эта функция недоступна в демоверсии. Создайте обычную комнату.':'This feature is unavailable in the demo. Create a regular room.',
  'Этот уровень ещё не открыт.':'This level is still locked.'
 });
 function format(template,vars){
  if(!vars)return template;
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g,(match,key)=>
   Object.hasOwn(vars,key)?String(vars[key]):match);
 }
 function text(key,language='ru',vars){
  const dict=language==='en'?EN:RU;
  return Object.hasOwn(dict,key)?format(dict[key],vars):key;
 }
 function error(message,language='ru'){
  if(typeof message!=='string')return '';
  return language==='en'&&Object.hasOwn(ERROR_EN,message)?ERROR_EN[message]:message;
 }
 return Object.freeze({RU,EN,ERROR_EN,text,error});
});
