/* Linked by Light v23–v26: mobile-ready multiplayer expansion interface.
 * All shared gameplay state is server-authoritative. */
(function(root){'use strict';
const $=id=>document.getElementById(id);
const loc=value=>root.GameV23Locale?.text(value,root.GameI18n?.getLanguage?.())??value;
const el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;};
const button=(txt,fn,disabled=false)=>{const b=el('button','v2346-button',loc(txt));b.type='button';b.disabled=disabled;b.addEventListener('click',fn);return b;};
const row=(parent,label,value,raw=false)=>{const x=el('div','v2346-row');x.append(el('span','',loc(label)),el('strong','',raw?String(value):loc(String(value))));parent.append(x);};
const section=(parent,title)=>{const x=el('section','v2346-section');x.append(el('h3','',loc(title)));parent.append(x);return x;};
const p=(parent,txt)=>{parent.append(el('p','v2346-paragraph',loc(txt)));};
const pRaw=(parent,txt)=>{parent.append(el('p','v2346-paragraph',txt));};
const actions=(parent,items)=>{const x=el('div','v2346-actions');for(const item of items)x.append(item);parent.append(x);};
const storage='linked-light-v26-accessibility';
const defaults={largeControls:false,highContrast:false,reducedMotion:false,colorNames:true,ghostVisible:true};
function loadSettings(){try{const x=JSON.parse(localStorage.getItem(storage)||'{}');return {...defaults,...Object.fromEntries(Object.entries(x).filter(([k,v])=>Object.hasOwn(defaults,k)&&typeof v==='boolean'))};}catch(_){return {...defaults};}}
let settings=loadSettings(),api={},state=null,social=null,meta=null,dialog,content,toggle,tab='physics',nonce='',serial=0,stage=0,room='',lastRender=0,ghost=[],replay={id:'',stage:-1,frames:[],received:0,total:0},playback=false,playbackAt=0;
const giftDraft={theme:'stars',message:''};
const v23=()=>stage>=122&&stage<=136;
const role=()=>api.role?.()??-1;
const send=(t,params={})=>{if(!api.inRoom?.()||role()<0)return api.announce?.(loc('Сначала создайте комнату вдвоём'));api.send?.({t,...params,actionId:nonce+'-'+(++serial)});};
const levelAction=(kind,params={})=>send('v23Action',{kind,...params});
const lifeAction=(kind,params={})=>send('v24Action',{kind,...params});
const lvls=GameV23Stages.stages;
const labels={gravity_duet:'Две гравитации',prism:'Зеркальный луч'};
const toFile=(name,object)=>{
 const blob=new Blob([JSON.stringify(object,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=el('a','');
 a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
};
function saveSettings(){try{localStorage.setItem(storage,JSON.stringify(settings));}catch(_){}applySettings();}
function applySettings(){
 const r=document.documentElement;
 for(const [key,value] of Object.entries(settings))r.dataset[key]=value?'true':'false';
 if(typeof GameQuality!=='undefined'&&GameQuality.setReducedMotion)GameQuality.setReducedMotion(settings.reducedMotion);
}
function sync(){
 if(!dialog?.open)return;
 lastRender=performance.now();
 const message=content.querySelector('[data-gift-message]');
 const theme=content.querySelector('[data-gift-theme]');
 if(message)giftDraft.message=message.value;
 if(theme)giftDraft.theme=theme.value;
 const active=document.activeElement?.dataset?.giftMessage!==undefined?'message':document.activeElement?.dataset?.giftTheme!==undefined?'theme':null;
 const selection=active==='message'&&message?[message.selectionStart,message.selectionEnd]:null;
 content.replaceChildren();
 if(!api.inRoom?.()&&tab!=='access'){
  p(content,'Создайте игровую комнату и пригласите второго участника для совместных действий. Сюжетные возможности требуют двух игроков.');
 }
 if(tab==='physics')physics();
 else if(tab==='world')living();
 else if(tab==='endless')endless();
 else if(tab==='access')access();
 if(active==='message'){const input=content.querySelector('[data-gift-message]');if(input){input.focus({preventScroll:true});if(selection)input.setSelectionRange(...selection);}}
 if(active==='theme')content.querySelector('[data-gift-theme]')?.focus({preventScroll:true});
}
function physics(){
 const container=section(content,'v23 · Физика света и пять хранителей');
 p(container,'15 новых уровней. Находясь у обозначенного механизма, нажимайте соответствующую кнопку. Сервер проверяет расстояние и роли.');
 if(v23()&&state?.world?.v23){
  const z=state.world.v23,level=lvls[stage-122];
  p(container,root.GameI18n?.stageObjective?.(stage,level.objective)||level.objective);
  row(container,'Испытание',String(stage-121)+'/15 · '+(root.GameI18n?.stageTitle?.(stage,level.title)||level.title));
  row(container,'Статус',z.done?'Завершено':'Ожидает совместного решения');
  if(z.boss)row(container,'Здоровье хранителя',z.boss.hp+'/'+z.boss.max);
  if(z.kind==='prism')row(container,'Зажжено призм',z.step+loc('/3 · зеркало ')+(z.mirror+1));
  if(z.kind==='world-switch')row(container,'Печати',z.switches.filter(Boolean).length+'/2');
  if(z.kind==='water')row(container,'Речные жемчужины',z.water.pearls+'/3');
  if(z.kind==='rhythm')row(container,'Ритм',z.rhythm.progress+'/4');
  if(z.kind==='conductor')row(container,'Секции',z.path.walker+'/4');
  if(z.kind==='shadows')row(container,'Следы тени',z.shadow.length);
  const a=[];
  const push=(label,kind,data={},disabled=false)=>a.push(button(label,()=>levelAction(kind,data),disabled));
  if(z.kind==='gravity-duet'){
   push('◈ Эхо: удерживать поле','gravity_hold',{},role()!==1);
   push('✦ Искра: перевернуть гравитацию','gravity_flip',{},role()!==0);
   push('✦ Искра: коснуться печати','gravity_seal',{},role()!==0);
  }
  if(z.kind==='prism'){
   push('◈ Повернуть зеркало','mirror_rotate',{},role()!==1);
   push('✦ Выпустить луч','beam_emit',{},role()!==0);
  }
  if(z.kind==='resize'){
   push('Изменить размер','resize_form');
   push('Активировать личную печать','resize_seal');
  }
  if(z.kind==='pendulum'){
   push('✦ Запустить маятник','swing_anchor',{},role()!==0);
   push('◈ Закрепить второй якорь','swing_release',{},role()!==1);
  }
  if(z.kind==='shadows')push('◈ Сохранить теневой мост','shadow_lock',{},role()!==1);
  if(z.kind==='world-switch'){
   push('Переключить свою реальность','world_toggle');
   push('Зажечь колонну','world_seal');
  }
  if(z.kind==='water'){
   push('✦ Течение вправо','water_flow',{value:1},role()!==0);
   push('✦ Остановить реку','water_flow',{value:0},role()!==0);
   push('◈ Взять жемчужину','water_pearl',{},role()!==1);
  }
  if(z.kind==='magnets'){
   push('Северный полюс (+)','magnet_polarity',{value:1});
   push('Южный полюс (−)','magnet_polarity',{value:-1});
   row(container,'Положение кристалла',Math.round(z.magnet.x));
  }
  if(z.kind==='rhythm'){
   p(container,role()===0?'Ваши символы: 0 = ✦, 1 = ◈. Действуйте на нечётных шагах.':'Ваши символы: 2 = ☾, 3 = ☀. Действуйте на чётных шагах.');
   for(let i=0;i<4;i++)push(['✦','◈','☾','☀'][i],'rhythm_beat',{value:i});
  }
  if(z.kind==='conductor'){
   push('✦ Построить секцию','conductor_route',{},role()!==0);
   push('◈ Перейти секцию','conductor_cross',{},role()!==1);
  }
  if(z.kind.startsWith('boss-')){
   push('◈ Ослабить защиту','boss_guard',{},role()!==1);
   if(z.kind==='boss-mirror')push('◈ Заманить двойника','boss_mirror_trap',{},role()!==1);
   if(z.kind==='boss-titan')push('◈ Открыть печать','boss_titan_seal',{},role()!==1);
   push('✦ Нанести удар','boss_strike',{},role()!==0);
  }
  actions(container,a);
 }else p(container,'Выберите уровень главы v23 ниже. Первая карта доступна сразу.');
 const grid=section(content,'Выбрать испытание');
 if(role()===0){
  const unlocked=state?.v23Unlocked??122;
  const g=el('div','v2346-level-grid');
  lvls.forEach((l,i)=>g.append(button((i+1)+'. '+(root.GameI18n?.stageTitle?.(i+122,l.title)||l.title),()=>api.send?.({t:'selectStage',stage:i+122}),i+122>unlocked)));
  grid.append(g);
 }else p(grid,'Новый уровень может выбрать ведущий (Искра).');
}
const quests=[['keeper','Хранитель рассвета'],['navigator','Звёздный картограф'],['hermit','Странствующий мастер'],['secret','Тайный путешественник']];
const pretty={keeper:'Хранитель',navigator:'Картограф',hermit:'Мастер',secret:'Тайный'};
function living(){
 const z=social||{};
 const intro=section(content,'v24 · Живой мир');
 p(intro,'Побочные задания и совместные развлечения не влияют на результаты основной кампании и не требуют покупок.');
 const npc=section(content,'Новые персонажи и побочные задания');
 for(const [id,title] of quests){
  const here=(z.npcs||[]).includes(id),progress=z.quests?.[id]||0;
  const line=el('div','v2346-quest');
  line.append(el('strong','',loc(title)),el('span','',here?loc('История ')+progress+'/3':loc('Ещё не знаком')));
  line.append(button(here?'Продолжить историю':'Познакомиться',()=>lifeAction(here?'npc_quest':'npc_meet',{npc:id}),here&&progress>=3));
  npc.append(line);
 }
 const kitchen=section(content,'Совместная кухня');
 row(kitchen,'Готовность',(z.kitchen?.step||0)+'/8');
 const recipes=['Лунный хлеб','Звёздный суп','Ягодный пирог','Солнечный чай'];
 for(let i=0;i<4;i++)kitchen.append(button(recipes[i],()=>lifeAction('recipe_select',{value:i}),role()!==0));
 p(kitchen,'Выбирайте ингредиенты в порядке 1 → 2 → 3 → 4, повторите дважды. Роли чередуются.');
 const ingredients=el('div','v2346-actions');
 for(let i=0;i<4;i++)ingredients.append(button(loc('Ингредиент ')+(i+1),()=>lifeAction('kitchen',{ingredient:i})));
 kitchen.append(ingredients);
 const ex=section(content,'Экспедиция на пять комнат');
 row(ex,'Пройдено комнат',String(z.expedition?.room||0)+'/5');
 row(ex,'Собрано находок',z.expedition?.loot||0);
 ex.append(button('Отправиться в экспедицию',()=>lifeAction('expedition_start'),role()!==0||!!z.expedition?.active));
 if(z.expedition?.active){
  const required=((z.expedition.seed||0)+(z.expedition.room||0)*7)%3;
  p(ex,loc('Подсказка для следующей двери: ')+(required+1));
  for(let i=0;i<3;i++)ex.append(button(loc('Дверь ')+(i+1),()=>lifeAction('expedition_step',{value:i})));
 }
 const obs=section(content,'Небесная обсерватория');
 row(obs,'Звёзды',String(z.observatory?.progress||0)+'/8');
 row(obs,'Созвездий',z.observatory?.constellations||0);
 p(obs,'Соберите узор ✧ → ☀ → ☾ → ◈ → ◈ → ☾ → ☀ → ✧, чередуя роли.');
 actions(obs,[0,1,2,3].map(i=>button(['☀','◈','✧','☾'][i],()=>lifeAction('observatory',{value:i}))));
 const craft=section(content,'Мастерская изобретений');
 p(craft,'Найдите детали в экспедиции и соберите созвездие, чтобы изготовить предмет для общего дома.');
 const crafted=z.workshop?.crafted||[];
 actions(craft,[['sky-lantern','Небесный фонарь'],['compass','Компас'],['glider','Планер']].map(([v,t])=>button(t,()=>lifeAction('craft',{value:v}),role()!==0||crafted.includes(v))));
 const games=section(content,'Домашний мини-турнир');
 row(games,'Счёт',(z.minigame?.score||[0,0]).join(' : '));
 row(games,'Раунд',(z.minigame?.round||0)+'/6');
 actions(games,[['race','Гонка'],['search','Поиск'],['puzzle','Головоломка']].map(([v,t])=>button(t,()=>lifeAction('minigame_start',{value:v}),role()!==0)));
 actions(games,[0,1,2].map(i=>button(loc('Действие ')+(i+1),()=>lifeAction('minigame_move',{value:i}),!z.minigame?.active)));
 const narrative=section(content,'Сюжетные развилки и диалоги');
 row(narrative,'Совместный выбор',z.narrative?.path?'Путь смелости':'Путь заботы');
 actions(narrative,[button('Путь заботы',()=>lifeAction('branch_vote',{value:0})),button('Путь смелости',()=>lifeAction('branch_vote',{value:1}))]);
 p(narrative,'Пять необязательных вопросов о совместных приключениях. Выберите подходящий ответ.');
 row(narrative,'Ваши ответы',String(z.narrative?.answers?.[role()]?.length||0)+'/5');
 actions(narrative,[0,1,2].map(i=>button(['Исследовать','Помочь','Вернуться'][i],()=>lifeAction('dialogue_answer',{value:i}))));
 const ending=section(content,'Эпилоги с последствиями');
 row(ending,'Выбранный финал',z.narrative?.epilogue||'Не открыт');
 actions(ending,[['Рассвет',0],['Обещание',1],['Сияние',2]].map(([title,value])=>button(title,()=>lifeAction('ending_vote',{value}),!!z.narrative?.epilogue)));
 if(z.events?.length){const journal=section(content,'Последние события');z.events.slice(-8).reverse().forEach(item=>pRaw(journal,item.text));}
}
function endless(){
 const box=section(content,'v25 · Endless Together');
 p(box,'Общие seed-карты собираются сервером из заранее проверенных платформ. Один seed — одинаковая геометрия на обоих устройствах.');
 actions(box,[button('✧ Ежедневное испытание',()=>send('v25Generate',{mode:'daily'}),role()!==0)]);
 const seed=el('input','v2346-input');seed.inputMode='numeric';seed.placeholder='Seed: 1…4294967295';seed.maxLength=10;
 box.append(seed);
 box.append(button('Создать испытание по seed',()=>{
  const n=Number(seed.value);
  if(!Number.isInteger(n)||n<=0||n>0xffffffff)return api.announce?.(loc('Введите целый положительный seed до 4294967295'));
  send('v25Generate',{seed:n,mode:'custom'});
 },role()!==0));
 if(meta){
  row(box,'Текущий seed',meta.seed||'—');
  row(box,'Ежедневный мир',meta.dailyKey||loc('Не выбран'),true);
  row(box,'Лучшее время сегодня',meta.bests?.[meta.dailyKey]||'—');
 }
 const ghostBox=section(content,'Призрачные повторы и история');
 p(ghostBox,'Сервер сохраняет короткую запись координат без звука и персональных сообщений. После завершения можно выгрузить JSON-повтор или видеть призраков в игре.');
 row(ghostBox,'Последний повтор',(meta?.replayStages||[]).map(x=>loc('Уровень ')+(x.stage+1)).join(', ')||loc('Пусто'));
 row(ghostBox,'Сохранённые кадры',meta?.ghostFrames||0);
 actions(ghostBox,[
  button('Получить последний повтор',()=>send('v25ReplayGet',{stage:meta?.replayStages?.at(-1)?.stage}),!meta?.replayStages?.length),
  button('Получить Ghost Replay',()=>send('v25ReplayGet',{which:'ghost'}),!(meta?.ghostFrames>0)),
  button('Просмотреть запись',()=>{if(replay.frames.length){playback=true;playbackAt=performance.now();api.announce?.(loc('Призраки повторяют прохождение в игровом окне'));}},!replay.frames.length),
  button('Сохранить запись JSON',()=>toFile('linked-by-light-replay.json',{version:25,stage:replay.stage,frames:replay.frames}),!replay.frames.length)
 ]);
 row(ghostBox,'Загрузка записи',replay.total?replay.received+'/'+replay.total:'—');
 ghostBox.append(button(settings.ghostVisible?'Скрыть призраков':'Показать призраков',()=>{
  settings.ghostVisible=!settings.ghostVisible;saveSettings();sync();
 }));
 const notice=section(content,'Как работает просмотр');
 p(notice,'Повтор показывает траектории игроков в текущем уровне. Это не записанное видео. Чтобы воспроизвести запись, выберите уровень с тем же номером и включите «Просмотреть запись».');
}
function access(){
 const box=section(content,'v26 · Доступность и управление');
 p(box,'Настройки сохраняются только на этом устройстве. Основная физика игры остаётся общей для двух игроков.');
 const options=[
  ['largeControls','Крупные сенсорные кнопки'],
  ['highContrast','Повышенная контрастность'],
  ['reducedMotion','Уменьшение движения эффектов'],
  ['colorNames','Подписи героев вместо только цвета']
 ];
 for(const [key,title] of options){
  const line=el('label','v2346-choice');
  const check=el('input');check.type='checkbox';check.checked=settings[key];check.addEventListener('change',()=>{settings[key]=check.checked;saveSettings();});
  line.append(check,document.createTextNode(loc(title)));box.append(line);
 }
 const assist=section(content,'Совместный режим без спешки');
 p(assist,'Чтобы замедлить серверное время задач, оба участника должны подтвердить режим. Результаты с помощью не участвуют в соревновательной таблице.');
 row(assist,'Состояние',state?.assistMode?'Включён':'Обычный темп');
 row(assist,'Голоса',(state?.assistVotes||[false,false]).filter(Boolean).length+'/2');
 actions(assist,[button('Включить / подтвердить',()=>send('v26AssistVote',{enabled:true})),
  button('Отключить / подтвердить',()=>send('v26AssistVote',{enabled:false}))]);
 const invite=section(content,'Подарочное приглашение');
 p(invite,'Подготовьте персональное приглашение в комнату, выбрав открытку и короткую подпись. Адрес комнаты добавляется только при отправке вами.');
 const theme=el('select','v2346-input');
 for(const [v,t] of [['stars','Звёзды'],['forest','Волшебный лес'],['aurora','Сияние']]){const opt=el('option','',loc(t));opt.value=v;theme.append(opt);}
 theme.dataset.giftTheme='';theme.value=giftDraft.theme;theme.addEventListener('change',()=>giftDraft.theme=theme.value);
 const input=el('input','v2346-input');input.dataset.giftMessage='';input.maxLength=60;input.placeholder=loc('Короткое приглашение (без личных данных)');input.value=giftDraft.message;input.addEventListener('input',()=>giftDraft.message=input.value);
 invite.append(theme,input);
 invite.append(button('Скопировать красивое приглашение',async()=>{
  const code=api.room?.();if(!code)return api.announce?.(loc('Сначала создайте комнату'));
  const message=input.value.normalize('NFC').replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,60);
  const url=new URL(location.pathname,location.origin);url.searchParams.set('room',code);url.searchParams.set('gift',theme.value);
  if(message)url.searchParams.set('wish',message);
  const greeting=[loc('✦ Приглашаю в приключение для двоих!'),message, url.href].filter(Boolean).join('\n');
  try{await navigator.clipboard.writeText(greeting);api.announce?.(loc('Приглашение скопировано'));}
  catch(_){api.announce?.(loc('Не удалось скопировать: ')+url.href);}
 }));
}
function draw(ctx,level,players,z,time,who,stats){
 ctx.save();
 if(level?.v23&&z){
 const c=level.v23;
 ctx.textAlign='center';ctx.font='bold 15px system-ui';
 function mark(x,y,title,active=false){
  ctx.strokeStyle=active?'#8ef6de':'#ffdb9c';ctx.lineWidth=3;ctx.shadowBlur=active?12:5;ctx.shadowColor='#c8a5fa';
  ctx.beginPath();ctx.arc(x,y,25,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='#fff';ctx.fillText(title,x,y-37);ctx.shadowBlur=0;
 }
 mark(c.anchor,510,root.GameI18n?.stageTitle?.(stage,level.title)||level.title,z.done);mark(c.goal,507,loc(z.boss?'Хранитель':'Вторая печать'),z.done);
 if(z.branch===1){ctx.fillStyle='#b6c1f9b3';ctx.fillRect(c.anchor+300,390,175,17);}
 if(z.kind==='boss-perception')ctx.fillText(loc(who===0?'✦ Видимое слабое место':'◈ Заметный защитный контур'),c.goal,310);
 const plat=(x,y,w,h,col)=>{ctx.fillStyle=col;ctx.fillRect(x,y,w,h);};
 if(z.kind==='gravity-duet'){
  ctx.strokeStyle='#a8eaffaa';ctx.lineWidth=3;
  for(let i=0;i<7;i++){
   const x=c.anchor+120+i*88,y=320+Math.sin(time*2+i)*18;
   ctx.beginPath();ctx.moveTo(x,y+35);ctx.lineTo(x,y);ctx.moveTo(x-7,y+9);ctx.lineTo(x,y);ctx.lineTo(x+7,y+9);ctx.stroke();
  }
 }
 if(z.kind==='prism'){
  const prismX=[c.anchor+250,c.anchor+460,c.anchor+670];
  ctx.lineWidth=3;ctx.strokeStyle='#ffeab6';ctx.beginPath();ctx.moveTo(c.anchor,473);
  ctx.lineTo(c.anchor+140+z.beam*190,395-(z.mirror%3)*14);ctx.stroke();
  prismX.forEach((x,i)=>{ctx.save();ctx.translate(x,418);ctx.rotate(Math.PI/4+time*.1);
    ctx.fillStyle=i<z.step?'#95ffec':'#a4b5f09a';ctx.fillRect(-15,-15,30,30);ctx.restore();});
 }
 if(z.kind==='rhythm'){
  for(let i=0;i<4;i++){
   const x=c.anchor+150+i*125,h=48+Math.sin(time*4+i)*14;
   ctx.fillStyle=i<z.rhythm.progress?'#98f9cf':'#a8abdc77';
   ctx.fillRect(x,495-h,43,h);
  }
 }
 if(z.kind==='water'){
  ctx.strokeStyle='#71d6efbb';ctx.lineWidth=5;
  ctx.beginPath();
  for(let i=0;i<=22;i++){const x=c.anchor+i*39,y=524+Math.sin(time*3+i*.65)*5;if(!i)ctx.moveTo(x,y);else ctx.lineTo(x,y);}
  ctx.stroke();ctx.fillStyle='#c8f1ff';ctx.fillText(loc(z.water.direction===1?'➜ ТЕЧЕНИЕ':z.water.direction===-1?'⬅ ТЕЧЕНИЕ':'◈ ВОДА'),c.anchor+350,515);
 }
 if(z.kind==='magnets'){
  for(let i=0;i<2;i++){
   const x=c.anchor+140+i*150,y=487;
   ctx.strokeStyle=i===0?'#eeb1a1':'#a4d9ee';ctx.lineWidth=5;
   ctx.beginPath();ctx.arc(x,y,24,Math.PI*.25,Math.PI*1.75);ctx.stroke();
   ctx.fillStyle='#fff';ctx.fillText(z.magnet.polarity[i]>0?'+':z.magnet.polarity[i]<0?'−':'○',x,y+6);
  }
 }

 if(z.kind==='gravity-duet'&&z.gravity[0]===-1)plat(c.anchor+100,260,690,15,'#aeebfc8d');
 if(z.kind==='resize'){
  if(z.scale[1]!==.5)plat(c.anchor+250,406,24,138,'#bba1f3a0');
  if(z.scale[0]===2)plat(c.anchor+460,468,175,18,'#f9d39a7a');
  players.forEach((p,i)=>{if(z.scale[i]!==1){ctx.fillStyle='#fff';ctx.fillText(loc(z.scale[i]===2?'ВЕЛИКАН':'МИНИ'),p.x+15,p.y-12);}});
 }
 if(z.kind==='pendulum'){
  if(who===0||who===-1)plat(c.anchor+205,475,190,16,'#a3ccf8a0');
  if(z.swing)plat(c.anchor+355+Math.sin(z.swing)*230,410,145,17,'#efd0ffac');
 }
 if(z.kind==='shadows'){
  if(who===0||who===-1)plat(c.anchor+220,491,730,15,'#9cb3e88a');
  if(who===1||who===-1)for(const x of z.shadow)plat(x,463,110,12,'#b0baf9b8');
 }
 if(z.kind==='world-switch')plat(c.anchor+240+(z.mode+who+2)%2*370,438,170,18,'#e1c4ffab');
 if(z.kind==='water'&&z.water.direction!==0)plat(c.anchor+250,482,570,17,'#7dddfbb7');
 if(z.kind==='magnets'){ctx.fillStyle='#f6ddaa';ctx.fillText('◆',z.magnet.x,482);}
 if(z.kind==='conductor')for(let i=0;i<z.path.segments;i++)plat(c.anchor+180+i*155,456-i%2*45,165,16,'#d2c0ffa8');
 if(z.boss){
  const x=c.goal;
  ctx.fillStyle=z.boss.shield?'#8fe9f2':'#d18cdf';
  ctx.shadowBlur=25;ctx.shadowColor='#d9b1ff';ctx.beginPath();ctx.arc(x,410,55,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  if(z.kind==='boss-spider'){
   ctx.strokeStyle='#eecafa';ctx.lineWidth=7;
   for(let i=0;i<8;i++){const angle=i*Math.PI/4+time*.15;
    ctx.beginPath();ctx.moveTo(x+Math.cos(angle)*32,410+Math.sin(angle)*28);
    ctx.lineTo(x+Math.cos(angle)*102,405+Math.sin(angle)*75);ctx.stroke();}
  }else if(z.kind==='boss-dragon'){
   ctx.fillStyle='#a4a2ee88';ctx.beginPath();ctx.moveTo(x-26,402);ctx.lineTo(x-140,340+Math.sin(time*2)*15);ctx.lineTo(x-99,445);
   ctx.lineTo(x,434);ctx.lineTo(x+140,340+Math.sin(time*2)*15);ctx.lineTo(x+99,445);ctx.closePath();ctx.fill();
  }else if(z.kind==='boss-mirror'){
   ctx.strokeStyle='#f9e2ff';ctx.lineWidth=3;ctx.strokeRect(x-94,332,188,150);
   ctx.save();ctx.globalAlpha=.35;ctx.translate(2*x,0);ctx.scale(-1,1);
   ctx.beginPath();ctx.arc(x,410,40+Math.sin(time*2)*8,0,Math.PI*2);ctx.stroke();ctx.restore();
  }else if(z.kind==='boss-titan'){
   ctx.fillStyle='#b7b6cf8a';ctx.fillRect(x-74,458,54,76);ctx.fillRect(x+20,458,54,76);
   for(let i=0;i<4;i++){ctx.fillStyle=i<4-z.boss.hp?'#89ffdb':'#ecbafa';
    ctx.fillRect(x-44+i*26,460,19,19);}
  }else if(z.kind==='boss-perception'){
   ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(x,405,58,32,0,0,Math.PI*2);ctx.stroke();
   ctx.fillStyle='#181d45';ctx.beginPath();ctx.arc(x,405,14+Math.sin(time*3)*4,0,Math.PI*2);ctx.fill();
  }
  ctx.fillStyle='#221c43';ctx.fillText(loc('Босс · ')+z.boss.hp+'/'+z.boss.max,x,415);
 }
 }
 // Local-only ghost overlay; servers send coordinates, not video.
 if(settings.ghostVisible&&replay.frames.length&&replay.stage===api.stage?.()){
  const idx=playback?Math.min(replay.frames.length-1,Math.floor((performance.now()-playbackAt)/100))
   :Math.min(replay.frames.length-1,Math.floor((stats?.elapsed||0)*10));
  const f=replay.frames[idx];
  if(f){ctx.globalAlpha=.35;ctx.fillStyle='#fff4d8';ctx.beginPath();ctx.arc(f[1]+15,f[2]+21,17,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#b5f1ff';ctx.beginPath();ctx.arc(f[3]+15,f[4]+21,17,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
  if(playback&&idx>=replay.frames.length-1)playback=false;
 }
 ctx.restore();
}
function onMessage(m){
 if(m.t==='v24State'){social=m.data;if(role()>=0)GameAdventure.syncV24(m.data);}
 if(m.t==='v25Meta')meta=m.data;
 if(m.t==='v25Replay'){
  if(replay.id!==m.id)replay={id:m.id,stage:m.stage,frames:[],received:0,total:m.total,parts:[]};
  if(!replay.parts[m.index]){replay.parts[m.index]=m.frames;replay.received++;}
  if(replay.received===replay.total){replay.frames=replay.parts.flat();ghost=replay.frames;}
 }
 if(m.t==='actionResult'&&/^v2346-/.test(m.actionId||'')&&m.error)api.announce?.(m.error,3);
 if(dialog?.open&&performance.now()-lastRender>110)sync();
}
function onSnapshot(s){
 state=s;stage=s?.stage??stage;
 if(dialog?.open&&performance.now()-lastRender>950)sync();
 if(toggle)toggle.style.display=api.inRoom?.()?'block':'none';
}
function open(which='physics'){
 tab=which;
 if(!dialog.open)dialog.showModal();
 sync();
}
function init(callbacks){
 api=callbacks;
 nonce='v2346-'+Math.random().toString(36).slice(2,10);
 applySettings();
 toggle=button('✦ Новые миры v23–v26',()=>open('physics'));
 toggle.classList.add('v2346-toggle');
 const host=document.querySelector('.frame')||document.body;host.append(toggle);
 dialog=el('dialog','v2346-dialog');
 const header=el('header','v2346-header');
 header.append(el('strong','', 'Linked by Light · v23–v26'),button('Закрыть ✕',()=>dialog.close()));dialog.append(header);
 const tabs=el('nav','v2346-tabs');
 const tabLabels=[['physics','v23 · Физика'],['world','v24 · Мир'],['endless','v25 · Повторы'],['access','v26 · Доступность']];
 for(const [key,label] of tabLabels){const item=button(label,()=>open(key));item.dataset.futureTab=key;tabs.append(item);}
 dialog.append(tabs);content=el('div','v2346-content');dialog.append(content);document.body.append(dialog);
 root.GameI18n?.mountDialogLanguage?.(dialog);
 const menuButtons=[],menu=$('createBtn')?.parentElement;
 if(menu){
  const create=button('✦ Физика света v23',()=>api.create?.(122));menu.append(create);menuButtons.push([create,'✦ Физика света v23','']);
  const done=GameAdventure.data()?.v23?.unlockedStages||[];
  let max=122;for(let i=122;i<=136;i++){if(!done.includes('v23-'+String(i-121).padStart(2,'0')))break;max=i;}
  if(max>122){const suffix=(max-121)+'/15';const resume=button(loc('Продолжить v23 · ')+suffix,()=>api.create?.(max));menu.append(resume);menuButtons.push([resume,'Продолжить v23 · ',suffix]);}
 }
 let giftMessage='',giftPreview=null;
 const gift=new URLSearchParams(location.search);
 if(['stars','forest','aurora'].includes(gift.get('gift'))){
  const wish=(gift.get('wish')||'').replace(/[\u0000-\u001f<>]/g,'').slice(0,60);
  giftMessage=wish||loc('Вас пригласили в совместное приключение!');
  giftPreview=$('networkError');
  if(giftPreview)giftPreview.textContent=loc('✦ Подарочное приглашение: ')+giftMessage;
 }
 root.GameI18n?.subscribe?.(()=>{
  toggle.textContent=loc('✦ Новые миры v23–v26');
  header.querySelector('.v2346-button').textContent=loc('Закрыть ✕');
  for(const [key,label] of tabLabels){
   const item=tabs.querySelector('[data-future-tab="'+key+'"]');
   if(item)item.textContent=loc(label);
  }
  for(const [item,label,suffix] of menuButtons)item.textContent=loc(label)+suffix;
  if(giftPreview)giftPreview.textContent=loc('✦ Подарочное приглашение: ')+(wishFromGift()||loc('Вас пригласили в совместное приключение!'));
  if(dialog.open)sync();
 });
 function wishFromGift(){return (gift.get('wish')||'').replace(/[\u0000-\u001f<>]/g,'').slice(0,60);}
}
root.GameFuture={init,onMessage,onSnapshot,draw,open,applySettings,settings:()=>({...settings}),localize:loc};
})(typeof window!=='undefined'?window:globalThis);
