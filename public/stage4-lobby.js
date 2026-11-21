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
// Session-local recent server RTT history. No room IDs, tokens or remote-player metrics.
function createNetworkProbe(){
 const values=[];
 let startedAt=0,lastReplyAt=null;
 const stamp=now=>typeof now==='number'&&Number.isFinite(now)&&now>=0?now:0;
 function reset(now=0){values.length=0;startedAt=stamp(now);lastReplyAt=null;}
 function add(rtt,now=0){
  if(typeof rtt!=='number'||!Number.isFinite(rtt)||rtt<=0||rtt>60000)return false;
  const at=stamp(now);
  if(at<startedAt||(lastReplyAt!==null&&at<lastReplyAt))return false;
  values.push(Math.round(rtt));
  if(values.length>8)values.shift();
  lastReplyAt=at;return true;
 }
 function snapshot(now=0){
  const at=stamp(now),count=values.length;
  if(at<startedAt)return {latency:0,variation:null,samples:0,stalled:false};
  const sorted=values.slice().sort((a,b)=>a-b);
  const latency=count?Math.round((sorted[Math.floor((count-1)/2)]+sorted[Math.floor(count/2)])/2):0;
  return {latency,variation:count>=3?sorted[count-1]-sorted[0]:null,
   samples:count,stalled:at-(lastReplyAt===null?startedAt:lastReplyAt)>6000};
 }
 return Object.freeze({reset,add,snapshot});
}

// RTT and spread describe this device's path to the authoritative server only.
function describeNetwork(state,language){
 const lang=language==='en'?'en':'ru',s=state&&typeof state==='object'?state:{};
 if(!s.ready)return {key:'offline',text:lang==='en'?'Server connection interrupted · reconnecting':'Соединение с сервером потеряно · восстанавливаем'};
 if(s.stalled===true)return {key:'stalled',text:lang==='en'
  ?'No recent server response. Check your network; reconnection starts if the socket closes.'
  :'Нет свежих ответов сервера. Проверьте сеть; при обрыве игра переподключится.'};
 const ms=s.latency;
 if(typeof ms!=='number'||!Number.isFinite(ms)||ms<=0||ms>60000)
  return {key:'measuring',text:lang==='en'?'Measuring server response time…':'Измеряем задержку до сервера…'};
 const rtt=Math.round(ms);
 const spread=Number.isInteger(s.samples)&&s.samples>=3&&s.samples<=8&&
  typeof s.variation==='number'&&Number.isFinite(s.variation)&&s.variation>=0&&s.variation<=60000
   ?Math.round(s.variation):null;
 let key='ok',ru='До сервера · '+rtt+' мс. Каждому игроку стоит проверить свою связь.',
  en='Server RTT · '+rtt+' ms. Both players should check their own connection.';
 if(rtt>=350){
  key='high';
  ru='Высокая задержка до сервера · '+rtt+' мс. Управление может реагировать позже.';
  en='High server RTT · '+rtt+' ms. Inputs may react later; check your connection.';
 }else if(spread!==null&&spread>=250){
  key='high';
  ru='Нестабильная задержка до сервера · '+rtt+' мс. Возможны рывки управления.';
  en='Unstable server RTT · '+rtt+' ms. Controls may feel uneven.';
 }else if(rtt>=180){
  key='moderate';
  ru='Повышенная задержка до сервера · '+rtt+' мс. Возможна небольшая задержка.';
  en='Elevated server RTT · '+rtt+' ms. Some delay is possible.';
 }else if(spread!==null&&spread>=100){
  key='moderate';
  ru='Колебания задержки до сервера · '+rtt+' мс. Возможны короткие задержки.';
  en='Variable server RTT · '+rtt+' ms. Short delays are possible.';
 }
 const suffix=spread===null?'':lang==='en'
  ?' RTT spread ('+s.samples+' samples): '+spread+' ms.'
  :' Разброс RTT ('+s.samples+' '+(s.samples<5?'замера':'замеров')+'): '+spread+' мс.';
 return {key,text:(lang==='en'?en:ru)+suffix};
}

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
  const network=describeNetwork(s,lang);
  return {hidden:false,key,heading,detail,status,isHost,canStart:!!s.ready&&(s.solo||isHost&&bothReady),
   startLabel:s.solo?(lang==='en'?'Start solo ✦':'Начать одному ✦'):(lang==='en'?'Start together ✦':'Начать вдвоём ✦'),
   partnerReady:otherReady,network};
 }
 let panel=null,heading=null,detail=null,status=null,network=null,lastSignature='';
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
   network=document.createElement('p');network.id='stage4NetworkQuality';
   network.className='stage4-network-quality';network.setAttribute('aria-live','off');
   panel.append(heading,detail,status,network);hint.insertAdjacentElement('afterend',panel);
  }else{
   heading=panel.querySelector('.stage4-lobby-title');
   detail=panel.querySelector('.stage4-lobby-detail');
   status=panel.querySelector('.stage4-lobby-status');
   network=panel.querySelector('.stage4-network-quality');
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
  if(signature!==lastSignature){
   lastSignature=signature;panel.dataset.state=model.key;
   heading.textContent=model.heading;detail.textContent=model.detail;status.textContent=model.status;
  }
  if(network){
   network.dataset.quality=model.network.key;
   if(network.textContent!==model.network.text)network.textContent=model.network.text;
  }
 }
 return Object.freeze({describe,describeNetwork,createNetworkProbe,init,sync});
});
