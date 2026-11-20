/* Stage 4 — first-session lobby guidance. Presentation only; server decides all roles and starts. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.GameStage4Lobby=api;
})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const copy={
  ru:{
   offline:['Восстанавливаем соединение','Оставайтесь на этой странице: игра автоматически попытается вернуть вас в прежнюю комнату.','Связь с сервером потеряна'],
   solo:['Пробное приключение для одного','Вы управляете обоими героями. После запуска переключайте Искру и Эхо кнопкой на экране или клавишей Tab.','Один игрок · два героя'],
   hostWaiting:['Пригласите второго игрока','Отправьте ссылку через «Поделиться приглашением» или сообщите код комнаты. После подключения партнёра появится возможность начать.','Ожидаем второго игрока'],
   hostReady:['Вы готовы играть вдвоём','Оба участника в комнате. Нажмите «Начать вдвоём», чтобы открыть первое совместное испытание.','Оба игрока на связи'],
   guest:['Вы присоединились к комнате','Ведущий запускает приключение. Вы можете подготовить телефон горизонтально и проверить управление.','Ожидание ведущего'],
   spectator:['Вы смотрите игру','Управление доступно только двум участникам. Дождитесь запуска игры ведущим.','Режим наблюдателя']
  },
  en:{
   offline:['Reconnecting to your room','Keep this page open. The game will automatically try to restore your place in the room.','Connection to the server lost'],
   solo:['Try the adventure solo','You control both heroes. Once started, switch Spark and Echo with the on-screen button or Tab.','One player · two heroes'],
   hostWaiting:['Invite a second player','Send the link using “Share invitation” or give your partner the room code. Start becomes available once they join.','Waiting for the second player'],
   hostReady:['You are ready to play together','Both players are here. Select “Start together” to begin your first cooperative challenge.','Both players connected'],
   guest:['You have joined the room','The host starts the adventure. Rotate your phone to landscape and get familiar with the controls.','Waiting for the host'],
   spectator:['You are spectating','Only the two players can use the controls. Wait for the host to begin.','Spectator mode']
  }
 };
 function describe(state){
  const s=state&&typeof state==='object'?state:{};
  if(!s.room||s.phase!=='waiting')return {hidden:true};
  const lang=s.lang==='en'?'en':'ru',c=copy[lang],connected=Array.isArray(s.connected)?s.connected:[false,false];
  const isHost=s.role>=0&&s.role===s.hostRole;
  const otherRole=s.role===0?1:0;
  const otherReady=connected[otherRole]===true;
  const bothReady=connected[0]===true&&connected[1]===true;
  const key=!s.ready?'offline':s.solo?'solo':s.role<0?'spectator':isHost?(bothReady?'hostReady':'hostWaiting'):'guest';
  const [heading,detail,status]=c[key];
  return {hidden:false,key,heading,detail,status,isHost,canStart:!!s.ready&&(s.solo||isHost&&bothReady),
   startLabel:s.solo?(lang==='en'?'Start solo ✦':'Начать одному ✦'):(lang==='en'?'Start together ✦':'Начать вдвоём ✦'),
   partnerReady:otherReady};
 }
 let panel=null,heading=null,detail=null,status=null,lastSignature='';
 function init(){
  if(typeof document==='undefined')return;
  const lobby=document.getElementById('lobbyView'),hint=document.getElementById('lobbyHint');
  if(!lobby||!hint)return;
  panel=document.getElementById('stage4LobbyGuide');
  if(!panel){
   panel=document.createElement('section');
   panel.id='stage4LobbyGuide';panel.className='stage4-lobby-guide';
   panel.setAttribute('role','status');panel.setAttribute('aria-live','polite');panel.setAttribute('aria-atomic','true');
   heading=document.createElement('strong');heading.className='stage4-lobby-title';
   detail=document.createElement('p');detail.className='stage4-lobby-detail';
   status=document.createElement('span');status.className='stage4-lobby-status';
   panel.append(heading,detail,status);hint.insertAdjacentElement('afterend',panel);
  }else{
   heading=panel.querySelector('.stage4-lobby-title');
   detail=panel.querySelector('.stage4-lobby-detail');
   status=panel.querySelector('.stage4-lobby-status');
  }
  panel.hidden=true;
 }
 function sync(state){
  if(!panel)return;
  const model=describe(state);
  panel.hidden=model.hidden;
  if(model.hidden){lastSignature='';return;}
  const start=document.getElementById('startBtn');
  if(start&&start.textContent!==model.startLabel)start.textContent=model.startLabel;
  const signature=[model.key,model.heading,model.detail,model.status].join('|');
  if(signature===lastSignature)return;
  lastSignature=signature;panel.dataset.state=model.key;
  heading.textContent=model.heading;detail.textContent=model.detail;status.textContent=model.status;
 }
 return Object.freeze({describe,init,sync});
});
