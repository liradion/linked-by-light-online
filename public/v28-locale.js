/* v28 First Experience: device-local authored text; user wishes and room tokens remain untouched. */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.GameV28Locale=api;
})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const EN=Object.freeze({
 "Иди сюда": "Come here",
 "Подожди": "Wait",
 "Помоги": "Help",
 "Опасность": "Danger",
 "Вперёд": "Go",
 "Посмотри": "Look",
 "Освойте движение и прыжок. Двигайтесь к порталу вдвоём.": "Learn to move and jump. Reach the portal together.",
 "Исследуйте платформы и синхронизируйте прыжки.": "Explore platforms and time your jumps together.",
 "Искра использует рывок, Эхо — импульс.": "Spark uses a dash; Echo uses a pulse.",
 "Один герой удерживает механизм, второй проходит.": "One hero holds the mechanism while the other passes.",
 "Не отходите слишком далеко от партнёра.": "Stay close enough to your partner.",
 "Посмотрите на светящиеся площадки и разделите действия.": "Find the glowing plates and divide the tasks.",
 "Связь на G помогает взаимодействовать друг с другом.": "Press G to bond and help each other.",
 "Нажмите T, чтобы оставить партнёру метку на карте.": "Press T to place a marker for your partner.",
 "Сначала активируйте механизм, затем откройте ворота.": "Activate the mechanism before opening the gate.",
 "Используйте движение, способности и помощь в финале обучения.": "Use movement, abilities and teamwork in the tutorial finale.",
 "Соло · ": "Solo · ",
 "Обучение · ": "Tutorial · ",
 "Уровень ": "Stage ",
 "Преграда впереди: попробуйте рывок F (или кнопку способности).": "Obstacle ahead: try your dash with F or the ability button.",
 "Преграду может разрушить Искра. Попросите её применить рывок.": "Spark can break that barrier. Ask them to dash.",
 "Кристалл рядом: нажмите Enter (или кнопку способности).": "Crystal nearby: press Enter or the ability button.",
 "Попросите Эхо активировать кристалл своим импульсом.": "Ask Echo to activate the crystal with their pulse.",
 "Подсказка: ": "Hint: ",
 " Нажмите Tab для смены героя.": " Press Tab to switch heroes.",
 "Связь ещё устанавливается. Проверяем сервер и повторяем подключение.": "Still connecting. Checking the server and retrying.",
 "Сервер пробуждается… Подключение повторится автоматически.": "Server is waking up… Connection retries automatically.",
 "Метки доступны во время игры": "Markers are available during gameplay.",
 "Нажмите на точку игрового поля для метки: ": "Click or tap the playfield to mark: ",
 "Сначала присоединитесь к комнате": "Join a room first.",
 "Искра": "Spark",
 "Эхо": "Echo",
 "📍 Метка · T": "📍 Marker · T",
 "Сначала создайте комнату": "Create a room first.",
 "Связанные светом": "Linked by Light",
 "Сыграем вместе в Linked by Light?": "Shall we play Linked by Light together?",
 "Ссылка скопирована": "Invite link copied.",
 "Ссылка: ": "Link: ",
 "Выберите своего героя (устройство не имеет значения)": "Choose your hero (any device)",
 "✦ Искра": "✦ Spark",
 "◈ Эхо": "◈ Echo",
 "Играть одному · переключать героев": "Play solo · switch heroes",
 "Поделиться приглашением": "Share invitation",
 "Обучение": "Tutorial",
 "Скрыть подсказку": "Dismiss tutorial hint",
 "Сервер пробуждается…": "Server waking up…",
 "Повторить сейчас": "Retry now",
 "Искра: уязвимость открывается после сигнала Эха": "Spark: the weak point opens after Echo's signal",
 "Эхо: останови защитный контур перед ударом Искры": "Echo: disable the shield before Spark strikes",
 "Искра: выпусти луч, когда зеркало правильно направлено": "Spark: fire the beam when the mirror is aligned",
 "Эхо: изменяй направление призмы": "Echo: adjust the prism's direction",
 "Не удалось поделиться": "Could not share",
 "Ожидание сервера": "Waiting for server",
 " Коснитесь кнопки смены героя.": " Tap the switch-hero button.",
 "Переключить на Эхо": "Switch to Echo",
 "Переключить на Искру": "Switch to Spark",
 "Поставить метку": "Place a marker"
});
 function text(source,language='ru'){
  if(typeof source!=='string'||language!=='en')return source;
  return Object.hasOwn(EN,source)?EN[source]:source;
 }
 return Object.freeze({EN,text});
});
