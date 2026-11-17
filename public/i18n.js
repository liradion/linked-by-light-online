/* Linked by Light — bilingual first-experience layer, deliberately not a full
   137-level translation. Pure formatting functions also run in Node tests. */
(function(root,factory){
 'use strict';
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.GameI18n=api;
})(typeof window!=='undefined'?window:globalThis,function(root){
 'use strict';
 const KEY='linked-light-language-v1';
 const stageLocale=(typeof module==='object'&&module.exports)?require('./stage-locale'):root.GameStageLocale;
 const uiLocale=(typeof module==='object'&&module.exports)?require('./ui-locale'):root.GameUILocale;
 const auxLocale=(typeof module==='object'&&module.exports)?require('./aux-locale'):root.GameAuxLocale;
 const EN={
  brand:'LINKED BY LIGHT',online:'ONLINE ADVENTURE · 2 PLAYERS',
  titleA:'TWO HEROES.',titleB:'ONE PATH.',
  intro:'One world, two heroes, one shared journey. Connect from different devices, help one another and solve puzzles together.',
  demoTag:'✦ DEMO · CHAPTER ONE',demoTitle:'Begin your journey together',
  demoIntro:'Nine challenges: two abilities, co-op puzzles and the first chapter finale.',
  demoPlay:'Play the demo ✦',create:'Create room ✦',newCampaign:'New game from level 1',
  campaignInfo:'99 levels across 11 worlds await.',join:'Join →',
  roomPlaceholder:'ROOM CODE',roomInfo:'The creator plays Spark; the guest plays Echo. Send your friend a link or six-character room code.',
  lobbyTag:'ROOM CREATED · A SHARED ADVENTURE',lobbyTitleA:'ALMOST',lobbyTitleB:'TOGETHER.',
  inviteCode:'Invitation code:',sparkCreator:'✦ Spark · host',echoGuest:'◈ Echo · guest',
  copyInvite:'Copy invitation',start:'Start together ✦',demoExit:'Choose adventure',
  replayDemo:'Play demo again ↻',replay:'Play again ↻',
  waiting:'Waiting…',online:'● Online',offline:'○ Disconnected',awaitPlayer:'○ Waiting for player',
  lobbyHost:'Send your invitation. When both players join, select “Start together”.',
  lobbyGuest:'You are connected. Waiting for the host to start.',
  demoHost:'Demo: nine challenges. Share the invitation, then start together.',
  demoGuest:'Demo: wait for the host to start your co-op journey.',
  youSpark:'Spark (host)',youEcho:'Echo (guest)',youSpectator:'Spectator',
  winTitle:'YOU DID IT.',winTogether:'TOGETHER.',
  demoEndingTitle:'Our first journey together',
  demoEndingText:'You completed the demo as a team. Thanks for playing! The adventure continues in the full campaign.',
  demoEndingTag:'DEMO · CHAPTER ONE · 9 CHALLENGES',
  readyDash:'· Dash ready',readyPulse:'· Pulse ready',
  inviteCopied:'Copied ✓',networkOnline:'Connected',networkOffline:'Disconnected',networkConnecting:'Connecting…',
  connectionLost:'Partner disconnected. Game paused. Rejoining with the same link preserves their role.',
  demoTitlePrefix:'DEMO · CHALLENGE',demoProgressPrefix:'DEMO',
  roomInvalid:'Enter a valid six-character room code.',
  act:'ACT',level:'LEVEL',chapter:'CHAPTER',
  goalGate:'The gate is open! Both players must reach the portal.',
  goalWall:'Spark: approach the glowing wall and use your ability ({key} on PC or ✦ on mobile).',
  goalCrystal:'Echo: approach the crystal and use your ability ({key} on PC or ✦ on mobile).',
  goalBridge:'Spark holds the plate while Echo crosses the bridge to charge the crystal.',
  goalPads:'Stand on both plates at once: {on}/{total}',
  goalFirstPads:'Plates: Spark — orange, Echo — blue. Together: {on}/{total}',
  goalBothPortal:'Challenge complete! Both players to the portal.',
  gameHelp:'? Hint',language:'Language',menu:'☰ Menu',
  helpIntro:'How to play',feedback:'Feedback',
  firstGuideTitle:'Two players — one adventure',
  firstGuideDescription:'Create a room and invite your partner with a link.',
  firstGuideDismiss:'Got it',firstGuideButton:'How to play',
  onboardingStep:'Step {step} / {total}',onboardingNext:'Next',onboardingStart:'Start playing',onboardingBack:'Back',onboardingSkip:'✕ Skip',
  chapter0:'Welcome to Linked by Light',
  chapter0Text:'A two-player co-op game. One player creates the room; the other joins through an invitation. No account is needed to play.',
  chapter1:'Create a room',
  chapter1Text:'Choose “Create room”. The lobby shows a six-character code. Do not post the code or invitation link publicly.',
  chapter2:'Invite your partner',
  chapter2Text:'Use “Copy invitation” and share the link with a friend. It works in a phone browser or on a computer.',
  chapter3:'Start together',
  chapter3Text:'Once both players connect, the host selects “Start together”. Spark and Echo must solve puzzles as a team.',
  chapter4:'Controls and recovery',
  chapter4Text:'On a phone, use the on-screen arrows, jump and ability controls. On PC, open “Keyboard” in the menu to view or customize bindings. Reconnecting with the same link retains your role.',
  chapter4Mobile:'On phones: touch arrows, jump and ability controls. Landscape orientation is recommended.',
  chapter4Desktop:'On desktop: Spark uses A/D, W, F; Echo uses arrows, Up and Enter by default. Configure keys in the menu.',
  serverTemporary:'Rooms on this server may reset after a restart. Export your progress if needed.',
  serverDurable:'Persistent storage is configured. Keep a backup of your progress.',
  copyInviteMessage:'Play Linked by Light with me! Open the link on your phone or computer: {url} (room {room})'
 };
 const RU={
  waiting:'Ожидаем…',online:'● В сети',offline:'○ Нет подключения',awaitPlayer:'○ Ожидаем игрока',
  lobbyHost:'Отправьте приглашение. Когда оба игрока подключатся, нажмите «Начать вдвоём».',
  lobbyGuest:'Вы подключены. Ждём, когда создатель комнаты запустит игру.',
  demoHost:'Демо: девять испытаний. Поделитесь приглашением и начните вместе.',
  demoGuest:'Демо: дождитесь начала совместного приключения.',
  youSpark:'Искра (ведущий)',youEcho:'Эхо (гость)',youSpectator:'Наблюдатель',
  demoEndingTitle:'Наш первый общий путь',
  demoEndingText:'Вы прошли демоверсию вместе. Спасибо за игру! Основное приключение продолжается в полной кампании.',
  demoEndingTag:'ДЕМО · ПЕРВАЯ ГЛАВА · 9 ИСПЫТАНИЙ',
  readyDash:'· Рывок готов',readyPulse:'· Импульс готов',
  networkOnline:'На связи',networkOffline:'Нет связи',networkConnecting:'Подключение…',
  connectionLost:'Партнёр отключился. Игра остановлена. Переподключение через прежнюю ссылку сохранит его роль.',
  replayDemo:'Пройти демо снова ↻',replay:'Сыграть сначала ↻',
  roomInvalid:'Введите шестизначный код комнаты.',
  act:'АКТ',level:'УРОВЕНЬ',chapter:'ГЛАВА',
  demoTitlePrefix:'ДЕМО · ИСПЫТАНИЕ',demoProgressPrefix:'ДЕМО',
  copyInvite:'Скопировать приглашение',
  copyInviteMessage:'Сыграем вместе в «Связанные светом»? Открой ссылку на компьютере или телефоне: {url} (код {room})'
 };
 const titleEn=stageLocale.FIRST_TITLES;
 const objectiveEn=stageLocale.FIRST_OBJECTIVES;
 const BINDINGS=Object.freeze({
  '#menuView > .eyebrow':'online','#menuView > .intro-copy:first-of-type':'intro',
  '#menuView .demo-launch-tag':'demoTag','#menuView .demo-launch > strong':'demoTitle',
  '#menuView .demo-launch > p':'demoIntro','#demoBtn':'demoPlay',
  '#createBtn':'create','#newCampaignBtn':'newCampaign','#roomInput':'roomPlaceholder',
  '#joinBtn':'join','#menuView > .intro-copy:last-of-type':'roomInfo',
  '#lobbyView > .eyebrow':'lobbyTag','#lobbyView > .intro-copy:first-of-type':'inviteCode',
  '#lobbyView .lobby-slot:first-child > b':'sparkCreator',
  '#lobbyView .lobby-slot:last-child > b':'echoGuest','#copyBtn':'copyInvite',
  '#startBtn':'start','#demoBackBtn':'demoExit'
 });
 let lang='ru',store=null,listeners=[];
 function getLanguage(){return lang;}
 function ui(key,vars){return uiLocale?.text(key,lang,vars)||key;}
 function aux(key,vars){return auxLocale?.text(key,lang,vars)||key;}
 function networkError(message){return uiLocale?.error(message,lang)??message;}
 function isEnglish(){return lang==='en';}
 function t(key,vars){
  let value=isEnglish()?EN[key]:RU[key];
  if(value===undefined)return key;
  if(vars)for(const [name,v] of Object.entries(vars))value=value.replaceAll('{'+name+'}',String(v));
  return value;
 }
 function translateExact(value){
  if(!isEnglish())return value;
  if(typeof value!=='string')return value;
  return ({'Подключение…':EN.networkConnecting,
   'На связи':EN.networkOnline,'Нет связи':EN.networkOffline,
   'Подключение к серверу…':EN.networkConnecting,
   'Два игрока — одно приключение':EN.firstGuideTitle,
   'Создайте комнату и пригласите второго игрока по ссылке.':EN.firstGuideDescription,
   'Как играть':EN.firstGuideButton,'Понятно':EN.firstGuideDismiss,
   'Далее':EN.onboardingNext,'Назад':EN.onboardingBack,
   'Начать играть':EN.onboardingStart,'✕ Пропустить':EN.onboardingSkip,
   'ⓘ Как играть':'ⓘ How to play','✎ Отзыв':'✎ Feedback'
  })[value]||value;
 }
 function formatGoal(goal,index,abilitySpark='F',abilityEcho='Enter'){
  if(!isEnglish()||typeof goal!=='string')return goal;
  if(goal.includes('Ворота открыты!'))return EN.goalGate;
  if(goal.startsWith('Искра: у светящейся стены'))return t('goalWall',{key:abilitySpark});
  if(goal.startsWith('Эхо: у кристалла'))return t('goalCrystal',{key:abilityEcho});
  if(goal.startsWith('Искра держит плиту'))return EN.goalBridge;
  let m=goal.match(/^Плиты:.*?(\d+)\/(\d+)/);
  if(m)return t('goalFirstPads',{on:m[1],total:m[2]});
  m=goal.match(/^Встаньте одновременно на плиты:\s*(\d+)\/(\d+)/);
  if(m)return t('goalPads',{on:m[1],total:m[2]});
  if(index>=0&&index<9&&goal.startsWith('БОСС ')){
   const hp=goal.match(/(\d+)\/(\d+) HP/);
   const turn=goal.endsWith('Эхо')?'Echo':'Spark';
   return hp?'BOSS · '+hp[1]+'/'+hp[2]+' HP · '+turn+' attacks':'BOSS · Coordinate your attacks';
  }
  if(index>=0&&index<9&&goal.startsWith('МИНИ-ИГРА: ')){
   if(goal.includes('гонка'))return 'MINIGAME: Both race to the finish line';
   if(goal.includes('пролетите'))return 'MINIGAME: Both fly through the ring';
   if(goal.includes('ритмических'))return 'MINIGAME: Activate both rhythm nodes';
   if(goal.includes('паруса'))return 'MINIGAME: Steer right together near the sail';
   return 'MINIGAME: Work together';
  }
  if(goal.startsWith('Испытание пройдено!'))return EN.goalBothPortal;
  // Prioritize live flower counters over generic first-act descriptions.
  if(index>=0&&index<9&&/\(\d+\/\d+\)$/.test(goal))
   return objectiveEn[index]+' '+goal.match(/\(\d+\/\d+\)$/)[0];
  if(index>=0&&index<9&&/[\u0400-\u04FF]/.test(goal))return objectiveEn[index];
  if(stageLocale?.has(index)){
   let n;
   if(goal.startsWith('БОСС ')){
    const hp=goal.match(/(\d+)\/(\d+) HP/);
    const turn=goal.endsWith('Эхо')?'Echo':'Spark';
    return hp?'BOSS · '+hp[1]+'/'+hp[2]+' HP · '+turn+' attacks':'BOSS · Work together';
   }
   if(goal.startsWith('МИНИ-ИГРА: '))return 'MINIGAME: '+stageLocale.objective(index,goal);
   if(goal.startsWith('Печати активированы.'))return EN.goalBothPortal;
   if(goal.startsWith('Пока идут часы,')&&(n=goal.match(/Осталось (\d+) с/)))
    return 'Clock running: BOTH heroes must cross the timed gate! '+n[1]+' s remaining.';
   if(goal.startsWith('Эхо: запусти часы'))return 'Echo: start the clock with a pulse. The gate stays open briefly.';
   if(goal.startsWith('Порядок звёзд:')&&(n=goal.match(/(\d+)\/(\d+)/)))
    return 'Activate the numbered stars in order: '+n[1]+'/'+n[2];
   if(goal.startsWith('Прошлое активировано.')&&(n=goal.match(/Осталось (\d+) с/)))
    return 'Past activated! Echo: enable the future. '+n[1]+' s remaining.';
   if(goal.startsWith('Антигравитация:')){
    const count=goal.match(/(\d+)\/(\d+)/),secs=goal.match(/· (\d+) с/);
    return 'Anti-gravity: both touch the core! '+(count?count[1]+'/'+count[2]:'')+(secs?' · '+secs[1]+' s':'');
   }
   if((n=goal.match(/Печати (\d+)\/(\d+)/)))
    return 'Spark sees solar bridges; Echo sees lunar bridges. Charge your seals: '+n[1]+'/'+n[2];
   if(goal.startsWith('Искра видит солнечные мосты'))return 'Spark sees solar bridges; Echo sees lunar bridges. Activate both personal seals with your abilities.';
   if(goal.startsWith('Искра запускает прошлое рывком'))return 'Spark starts the past with a dash; Echo has 12 seconds to activate the future with a pulse.';
   if(goal.startsWith('Оба одновременно встаньте на цветные печати'))return 'Stand together on the colored seals, then both touch the high core in anti-gravity.';
   if((n=goal.match(/\((\d+)\/(\d+)\)$/))&&index<99){
    const kind=['flowers','forest','tide','wind','constellation','prism','city','river','clock','relay','heart'][Math.floor(index/9)];
    return (stageLocale.SIGNATURES[kind]?.tip||stageLocale.objective(index,goal))+' ('+n[1]+'/'+n[2]+')';
   }
   if(/[\u0400-\u04FF]/.test(goal))return stageLocale.objective(index,goal);
  }
  return goal;
 }
 function localizeHint(message,index,role,depth){
  if(!isEnglish()||!stageLocale?.has(index)||typeof message!=='string')return message;
  if(index>=9){
   if(depth<=1)return stageLocale.objective(index,message);
   if(/ворота открыты|порталу/i.test(message))return EN.goalGate;
   if(/стен|преград|рывком/i.test(message))
    return role===0?'Spark: dash into the cracked wall.':'Echo: help Spark reach and break the cracked wall.';
   if(/кристалл|импульс/i.test(message))
    return role===1?'Echo: use your pulse to charge the glowing crystal.':'Spark: hold the bridge or plate while Echo charges the crystal.';
   if(/плит[уыае]|оранжев|голуб/i.test(message))
    return role===0?'Spark: stand on the orange plate until Echo reaches the blue one.'
      :'Echo: stand on the blue plate while Spark holds the orange one.';
   if(index<99){
    const kind=['flowers','forest','tide','wind','constellation','prism','city','river','clock','relay','heart'][Math.floor(index/9)];
    return stageLocale.SIGNATURES[kind]?.tip||stageLocale.objective(index,message);
   }
   return stageLocale.objective(index,message)+' Open the chapter actions menu (⋯) when a special ability is required.';
  }
  if(depth<=1)return objectiveEn[index];
  if(/Ворота открыты|портал/.test(message))return EN.goalGate;
  if(/оранжевую плиту|голубую плиту|плиты|цветные/.test(message))
   return role===1?'Find the blue plate and stand on it while Spark holds the orange one.'
     :'Find the orange plate and stand on it while Echo holds the blue one.';
  if(/стен|преград|рывком/.test(message))
   return role===0?'Spark: approach the glowing wall and press your dash ability.'
     :'Echo: help Spark reach the glowing wall; Spark must break it using a dash.';
  if(/кристалл|импульс/.test(message))
   return role===1?'Echo: approach the unlit crystal and use your pulse ability.'
     :'Spark: help Echo reach the crystal and keep the bridge open.';
  if(/цвет|особенност|поток|узор/.test(message))
   return 'Work together to activate the glowing mechanisms using each hero’s abilities.';
  return objectiveEn[index];
 }
 function stageTitle(index,fallback){return isEnglish()&&stageLocale?.has(index)?stageLocale.title(index,fallback):fallback;}
 function stageObjective(index,fallback){return isEnglish()&&stageLocale?.has(index)?stageLocale.objective(index,fallback):fallback;}
 function stageHint(index,fallback){return isEnglish()&&stageLocale?.has(index)?stageLocale.hint(index,fallback):fallback;}
 function stageWorld(index){return isEnglish()?stageLocale?.world(index)||'':'';}
 function signatureTip(kind){return isEnglish()?stageLocale?.SIGNATURES[kind]?.tip||'':'';}
 function realityTip(kind){return isEnglish()?stageLocale?.REALITIES[kind]?.tip||'':'';}
 function realityLabel(kind){return isEnglish()?stageLocale?.REALITIES[kind]?.label||'':'';}
 function applyStatic(){
  if(typeof document==='undefined')return;
  document.documentElement.lang=lang;
  for(const [selector,key] of Object.entries(BINDINGS)){
   const el=document.querySelector(selector);
   if(!el)continue;
   // Preserve the initial Russian source for reverse switching.
   if(el.dataset.i18nRu===undefined)el.dataset.i18nRu=(key==='roomPlaceholder'?el.getAttribute('placeholder'):el.textContent)||'';
   const value=isEnglish()?EN[key]:el.dataset.i18nRu;
   if(key==='roomPlaceholder')el.setAttribute('placeholder',value);
   else el.textContent=value;
  }
  const headline=document.querySelector('#menuView > .hero-title');
  if(headline){
   const em=headline.querySelector('em');
   if(headline.firstChild?.nodeType===3)headline.firstChild.textContent=isEnglish()?EN.titleA:'ДВА ГЕРОЯ.';
   if(em)em.textContent=isEnglish()?EN.titleB:'ОДИН ПУТЬ.';
  }
  const lobby=document.querySelector('#lobbyView > .hero-title');
  if(lobby){const em=lobby.querySelector('em');if(lobby.firstChild?.nodeType===3)lobby.firstChild.textContent=isEnglish()?EN.lobbyTitleA:'ВЫ ';
   if(em)em.textContent=isEnglish()?EN.lobbyTitleB:'ПОЧТИ ВМЕСТЕ.';}
  const banner=document.getElementById('waitingBanner');
  if(banner){
   banner.replaceChildren();
   const rows=(isEnglish()?EN.connectionLost:RU.connectionLost).split('. ');
   banner.append(document.createTextNode(rows[0]+'.'));
   banner.append(document.createElement('br'),document.createTextNode(rows.slice(1).join('. ')));
  }
  const sel=document.getElementById('languageSelect');
  if(sel&&sel.value!==lang)sel.value=lang;
 }
 function setLanguage(next){
  if(next!=='ru'&&next!=='en')return false;
  const previous=lang;lang=next;
  try{store?.setItem(KEY,next);}catch(_){}
  applyStatic();
  if(previous!==lang)listeners.forEach(fn=>{try{fn(lang);}catch(_){}});
  return true;
 }
 function subscribe(callback){if(typeof callback==='function')listeners.push(callback);}
 function mountDialogLanguage(dialog){
  if(typeof document==='undefined'||!dialog||dialog.querySelector('[data-dialog-language]'))return;
  const header=dialog.querySelector('.quality-head,.controls-head,.gamepad-head,.adv-dialog-head,.v21-top,.v20-top')||dialog;
  const wrap=document.createElement('label');wrap.className='dialog-language-control';
  const sel=document.createElement('select');
  sel.dataset.dialogLanguage='';sel.setAttribute('aria-label','Язык / Language');
  for(const value of ['ru','en']){
   const option=document.createElement('option');option.value=value;
   option.textContent=value.toUpperCase();sel.append(option);
  }
  sel.value=lang;
  sel.addEventListener('change',()=>setLanguage(sel.value));
  wrap.append(sel);header.append(wrap);
  subscribe(()=>{if(sel.value!==lang)sel.value=lang;});
 }
 function init(){
  try{store=root.localStorage;const saved=store?.getItem(KEY);lang=saved==='en'?'en':'ru';}
  catch(_){lang='ru';}
  const selector=typeof document!=='undefined'?document.getElementById('languageSelect'):null;
  selector?.addEventListener('change',()=>setLanguage(selector.value));
  applyStatic();
  return lang;
 }
 return Object.freeze({KEY,EN,getLanguage,isEnglish,t,ui,aux,networkError,translateExact,formatGoal,localizeHint,stageTitle,stageObjective,stageHint,stageWorld,signatureTip,realityTip,realityLabel,applyStatic,setLanguage,subscribe,mountDialogLanguage,init});
});
