(() => {
'use strict';
const W=1200,H=650,GROUND=GameStages.GROUND,stageDefs=[...GameStages.stages,GameStages.BONUS_STAGE,...GameV20Stages.stages,...GameV21Stages.stages,...GameV23Stages.stages];
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id);
const overlay=$('overlay'),toastEl=$('toast');
const colors={amber:'#ffc17f',blue:'#80eff7'};
let levelIndex=0,level=structuredClone(stageDefs[0]),P=[],camera=0,clock=0;
let particles=[],rings=[],screenShake=0,collectibles=[],toastTimer=0;
let room='',role=-1,token='',phase='waiting',connected=[false,false],socket=null,ready=false,demoMode=false;
let pendingRoom='',pendingCreate=false,pendingCreateStage=0,pendingBlueprint=null,pendingDemo=false,connectedBefore=false,reconnectCount=0,totalReconnects=0,wsTimer=null;
let latest=null,snapshots=[],fpsTime=performance.now(),sound=true,ac=null;
const keys=new Set(),input={left:false,right:false,jumpSeq:0,abilitySeq:0,bondSeq:0,emoteSeq:0};
let prediction=null,lastPredStage=-1,predJumpAt=0,lastAck=0,lastResultId='',packetSeq=0,wasOnGround=null,lastFootstep=0;
const predictor=GameReconciliation.createPredictor();
let latency=0,lastSend=0,playingOnce=false;
const qs=new URLSearchParams(location.search);const invite=qs.get('room');let pendingSpectate=qs.get('spectate')==='1';
if(invite&&/^[A-Z2-9]{6}$/i.test(invite))pendingRoom=invite.toUpperCase();
function roomToken(id){try{return localStorage.getItem('lightroom:'+id)||sessionStorage.getItem('lightroom:'+id)||'';}catch(_){return '';}}
function saveToken(id,t){try{localStorage.setItem('lightroom:'+id,t);sessionStorage.setItem('lightroom:'+id,t);}catch(_){}}
const CHECKPOINT_KEY='linked-light-checkpoint-v99';
function bestStage(){try{const n=Number(localStorage.getItem(CHECKPOINT_KEY)||0);return Number.isSafeInteger(n)?Math.max(0,Math.min(98,n)):0;}catch(_){return 0;}}
function saveCheckpoint(index){try{if(index>bestStage())localStorage.setItem(CHECKPOINT_KEY,String(index));}catch(_){}}
function refreshCampaignMenu(){
 const saved=bestStage(),resume=$('createBtn'),fresh=$('newCampaignBtn'),hint=$('campaignProgress');
 if(resume)resume.textContent=saved>0?'Продолжить с уровня '+(saved+1)+' ✦':'Создать комнату ✦';
 if(fresh)fresh.style.display=saved>0?'inline-flex':'none';
 if(hint)hint.textContent=saved>0?'Прогресс сохранён на этом устройстве: уровень '+(saved+1)+' из '+stageDefs.length+'.':'Впереди 99 уровней в 11 мирах.';
}
let lastErrorCode='',lastErrorVars=null;
function setError(message='',vars=null){
 if(typeof message!=='string')message='';
 lastErrorCode=message;lastErrorVars=vars;
 $('networkError').textContent=message.startsWith('network.')
  ?GameI18n.ui(message,vars)
  :GameI18n.networkError(message);
}
function wsSend(m){if(socket&&socket.readyState===WebSocket.OPEN)socket.send(JSON.stringify(m));}
function updateStatus(){const online=socket?.readyState===WebSocket.OPEN;
  $('statusDot').className='status-dot '+(online?'online':'offline');
  $('connectionStatus').textContent=online?GameI18n.t('networkOnline'):room?GameI18n.t('networkOffline'):GameI18n.t('networkConnecting');
  $('ping').textContent=online&&latency?`${latency} ${GameI18n.isEnglish()?'ms':'мс'}`:'';
  const mobileStatus=$('mobileConnectionText'),mobileBox=$('mobileConnection');
  if(mobileStatus)mobileStatus.textContent=GameI18n.isEnglish()?(online?'Server connected'+(latency?' · '+latency+' ms':''):'Connecting to server…'):(online?'Сервер на связи'+(latency?' · '+latency+' мс':''):'Подключение к серверу…');
  if(mobileBox)mobileBox.dataset.status=online?'online':'offline';
}
function openConnection(){
  if(socket&&(socket.readyState===WebSocket.CONNECTING||socket.readyState===WebSocket.OPEN))return;
  clearTimeout(wsTimer);
  const protocol=location.protocol==='https:'?'wss:':'ws:';
  socket=new WebSocket(protocol+'//'+location.host+'/ws');ready=false;updateStatus();
  socket.addEventListener('open',()=>{
    if(connectedBefore){totalReconnects++;GamePublicBeta.onRecovered();}reconnectCount=0;ready=true;connectedBefore=true;setError('');updateStatus();
    wsSend({t:'hello',protocol:4});
    if(room||pendingRoom){const code=room||pendingRoom;wsSend({t:'join',room:code,token:token||roomToken(code),spectate:role===-1&&!!room||pendingSpectate});}
    else if(pendingCreate){wsSend({t:'create',stage:pendingCreateStage,blueprint:pendingBlueprint,secrets:GameAdventure.data().secrets.length,home:GameAdventure.getHome(),unlockedV20:GameAdventure.data().v20?.unlockedStages||[],v20Home:GameAdventure.data().v20?.house||{},v20Choices:GameAdventure.data().v20?.choices||{},unlockedV21:GameAdventure.data().v21?.unlockedStages||[],v21Profile:{unlockedStages:GameAdventure.data().v21?.unlockedStages||[],completed:GameAdventure.data().v21?.completed||[],trophies:GameAdventure.data().v21?.trophies||[],aquarium:GameAdventure.data().v21?.aquarium||[]},unlockedV23:GameAdventure.data().v23?.unlockedStages||[],v24Profile:GameAdventure.data().v24||{},demo:pendingDemo});pendingCreate=false;pendingBlueprint=null;pendingDemo=false;}
    else showUI();
  });
  socket.addEventListener('message',e=>{
    let m;try{m=JSON.parse(e.data);}catch(_){return;}
    if(m.t==='joined'){
       demoMode=false;room=m.room;role=m.role;token=m.token;phase=m.phase;pendingRoom='';
      latest=null;snapshots=[];lastAck=0;predictor.reset();if(role>=0)saveToken(room,token);
      history.replaceState({},'',location.pathname+'?room='+encodeURIComponent(room));
      connected=m.connected||[false,false];$('myRole').textContent=role===0?'Искра (ведущий)':role===1?'Эхо (гость)':'Наблюдатель';
      if(role>=0&&m.home)GameAdventure.receiveHome(m.home);GameAdventure.onJoined(room,role);GameExpansion.onJoined(m.notes||[]);GameV20.onJoined();GameV21.onJoined?.();
      setError('');resetKeys();GamePublicBeta.onJoined(role);showUI();return;
    }
    if(m.t==='home'){if(role>=0)GameAdventure.receiveHome(m.items);return;}
    if(m.t==='note'){GameExpansion.onNote(m.note);return;}
    if(m.t==='quick'){GameExpansion.onQuick(m);return;}
    if(m.t==='looks'){GameAdventure.receiveLooks(m.looks);return;}
    if(m.t==='storyChoice'){if(role>=0)GameAdventure.storyChoice?.(m);return;}
    if(['v20Home','v20Story','actionResult'].includes(m.t)){GameV20.onMessage(m);GameFuture.onMessage(m);return;}
    if(['v24State','v25Meta','v25Replay'].includes(m.t)){GameFuture.onMessage(m);return;}
    if(['v21State','v21Private','v21Gallery','v21WeeklyBoard'].includes(m.t)){GameV21.onMessage(m);return;}
    if(m.t==='members'){
      connected=m.connected||connected;phase=m.phase||phase;showUI();return;
    }
    if(m.t==='snapshot'){consumeSnapshot(m);return;}
    if(m.t==='error'){
      const msg=m.message||'Ошибка подключения.';
      if(room&&msg.includes('Комната не найдена')){room='';role=-1;token='';phase='waiting';latest=null;snapshots=[];history.replaceState({},'',location.pathname);}
      const help=msg.includes('Комната не найдена')?'network.roomHelp':msg;
      setError(help);if(!room)pendingRoom='';showUI();return;
    }
    if(m.t==='pong'){
      if(Number.isFinite(m.sent)){latency=Math.max(0,Math.round(performance.now()-m.sent));GameQuality.net(latency);updateStatus();}return;
    }
  });
  socket.addEventListener('close',()=>{
    ready=false;updateStatus();resetKeys();GamePublicBeta.onDisconnected();
    if(room){connected=[false,false];$('waitingBanner').classList.remove('hidden');}
    setError(room?'network.lost':'network.retry');
    reconnectCount++;const delay=Math.min(10_000,500*2**Math.min(reconnectCount,5))+Math.floor(Math.random()*220);
    wsTimer=setTimeout(openConnection,delay);showUI();
  });
  socket.addEventListener('error',()=>{/* close handles backoff */});
}
function updateTouchRole(){
  const badge=$('touchRoleBadge'),icon=$('touchRoleIcon'),name=$('touchRoleName'),hint=$('touchRoleHint');
  if(!badge||!icon||!name||!hint)return;
  const echo=role===1;
  icon.textContent=role<0?'◉':echo?'◈':'✦';name.textContent=role<0?'Зритель':echo?'Эхо':'Искра';
  hint.textContent=role<0?'без управления':echo?'прыжок и импульс':'прыжок и рывок';
  icon.style.color=echo?'#8ff8ff':'#ffcf83';
  icon.style.background=echo?'#73e3f01a':'#ffb45f1c';
  badge.style.borderColor=echo?'#70e9f388':'#ffbb6e88';
}
function showUI(){
  updateStatus();
  updateTouchRole();
  $('slot0').textContent=GameI18n.t(connected[0]?'online':'offline');
  $('slot1').textContent=GameI18n.t(connected[1]?'online':'awaitPlayer');
  $('roomCode').textContent=room||'------';
  if(!room)refreshCampaignMenu();
   $('demoBtn').disabled=!!room;
  $('startBtn').disabled=!(role===0&&connected[0]&&connected[1]&&ready&&phase==='waiting');
  $('restartBtn').disabled=role!==0||!connected.every(Boolean);
  $('resetBtn').disabled=role!==0;
  $('lobbyHint').textContent=GameI18n.t(demoMode?(role===0?'demoHost':'demoGuest'):role===0?'lobbyHost':'lobbyGuest');
  if(!room)overlay.dataset.view='menu';
  else if(phase==='waiting')overlay.dataset.view='lobby';
  else if(phase==='win')overlay.dataset.view='win';
  if(phase==='win'&&(latest?.ending||demoMode)){
    const win=$('winView'),ending=latest?.ending||(demoMode?GameDemo.ending:null);
    const heading=win?.querySelector('.hero-title'),summary=win?.querySelector('.intro-copy'),eyebrow=win?.querySelector('.eyebrow');
    if(heading)heading.textContent=ending?.title||'Вы прошли игру!';
    if(summary)summary.textContent=ending?.text||'Ваша общая история продолжается.';
    if(eyebrow)eyebrow.textContent=demoMode?'ДЕМО · ПЕРВАЯ ГЛАВА · 9 ИСПЫТАНИЙ':levelIndex>=122?'ФИЗИКА СВЕТА · 15 ИСПЫТАНИЙ':levelIndex>=112?'НАВСТРЕЧУ ДРУГ ДРУГУ · 10 ИСПЫТАНИЙ':levelIndex>=100?'ПЕРЕПЛЕТЕНИЕ МИРОВ · 12 УРОВНЕЙ':'ОСНОВНАЯ КАМПАНИЯ · 99 УРОВНЕЙ';
  }
  $('demoBackBtn').hidden=!(demoMode&&phase==='win');
  $('restartBtn').textContent=GameI18n.t(demoMode?'replayDemo':'replay');
  if(GameI18n.isEnglish()){
    const me=$('myRole');
    if(me&&role>=0)me.textContent=GameI18n.t(role===0?'youSpark':role===1?'youEcho':'youSpectator');
    $('touchRoleName').textContent=role===1?'Echo':role===0?'Spark':'Spectator';
    $('touchRoleHint').textContent=role===1?'jump and pulse':role===0?'jump and dash':'view only';
    $('mobileConnectionText').textContent=ready?'Server connected':'Connecting to server…';
    shareInviteBtn.textContent='Share ↗';
    shareInviteBtn.setAttribute('aria-label','Send a co-op invitation to your partner');
    if(!room){
      const progress=bestStage();
      $('createBtn').textContent=progress>0?'Continue from level '+(progress+1)+' ✦':GameI18n.EN.create;
      $('campaignProgress').textContent=progress>0?'Progress saved on this device: level '+(progress+1)+' of '+stageDefs.length+'.':GameI18n.EN.campaignInfo;
    }
    if(phase==='win'&&demoMode){
      const win=$('winView');
      win.querySelector('.hero-title').textContent=GameI18n.t('demoEndingTitle');
      win.querySelector('.intro-copy').textContent=GameI18n.t('demoEndingText');
      win.querySelector('.eyebrow').textContent=GameI18n.t('demoEndingTag');
    }
  }
  // Preserve the menu/lobby view selected above. Resetting dataset.view here
  // hid the entire landing menu in browsers whenever the game had no ending.
  overlay.classList.toggle('hidden',!!room&&phase==='playing');
  $('waitingBanner').classList.toggle('hidden',!room||phase!=='playing'||connected.every(Boolean));
  if(!GameI18n.isEnglish()){
    shareInviteBtn.textContent='Поделиться ↗';
    shareInviteBtn.setAttribute('aria-label','Отправить приглашение второму игроку');
  }
  $('touchControls').style.visibility=!!room&&role>=0&&phase==='playing'?'visible':'hidden';
}
function createRoom(newGame=false,stageOverride=null,blueprint=null,startDemo=false){
 setError('');pendingCreate=true;pendingRoom='';pendingBlueprint=blueprint;pendingDemo=startDemo===true;pendingCreateStage=pendingDemo?GameDemo.stages[0]:Number.isInteger(stageOverride)?stageOverride:(newGame?0:bestStage());
 if(!ready)openConnection();
 else{wsSend({t:'create',stage:pendingCreateStage,blueprint:pendingBlueprint,secrets:GameAdventure.data().secrets.length,home:GameAdventure.getHome(),unlockedV20:GameAdventure.data().v20?.unlockedStages||[],v20Home:GameAdventure.data().v20?.house||{},v20Choices:GameAdventure.data().v20?.choices||{},unlockedV21:GameAdventure.data().v21?.unlockedStages||[],v21Profile:{unlockedStages:GameAdventure.data().v21?.unlockedStages||[],completed:GameAdventure.data().v21?.completed||[],trophies:GameAdventure.data().v21?.trophies||[],aquarium:GameAdventure.data().v21?.aquarium||[]},unlockedV23:GameAdventure.data().v23?.unlockedStages||[],v24Profile:GameAdventure.data().v24||{},demo:pendingDemo});pendingCreate=false;pendingBlueprint=null;pendingDemo=false;}
}
function joinRoom(code){const value=(code||'').trim().toUpperCase();if(!/^[A-HJ-NP-Z2-9]{6}$/.test(value)){setError(GameI18n.t('roomInvalid'));return;}
  pendingRoom=value;pendingSpectate=false;setError('');if(ready)wsSend({t:'join',room:value,token:roomToken(value)});else openConnection();
}
$('createBtn').addEventListener('click',()=>createRoom(false));
$('demoBtn').addEventListener('click',()=>createRoom(true,0,null,true));
$('demoBackBtn').addEventListener('click',()=>{history.replaceState({},'',location.pathname);location.reload();});
$('newCampaignBtn').addEventListener('click',()=>createRoom(true));
$('joinBtn').addEventListener('click',()=>joinRoom($('roomInput').value));
$('roomInput').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();joinRoom($('roomInput').value);}});
$('startBtn').addEventListener('click',()=>wsSend({t:'start'}));
$('resetBtn').addEventListener('click',()=>wsSend({t:'resetStage'}));
$('restartBtn').addEventListener('click',()=>wsSend({t:'restart'}));
$('copyBtn').addEventListener('click',async()=>{
  const url=new URL(location.pathname,location.href);url.searchParams.set('room',room);
  const text=GameI18n.t('copyInviteMessage',{url:url.href,room});
  try{await navigator.clipboard.writeText(text);$('copyBtn').textContent=GameI18n.isEnglish()?'Copied ✓':'Скопировано ✓';setTimeout(()=>$('copyBtn').textContent=GameI18n.isEnglish()?GameI18n.EN.copyInvite:GameI18n.t('copyInvite'),1500);}
  catch(_){setError('network.copyFailed',{room,url:url.href});}
});
// Native share on iPhone/Android, clipboard fallback for desktop and older browsers.
const shareInviteBtn=document.createElement('button');
shareInviteBtn.type='button';shareInviteBtn.id='shareInviteBtn';
shareInviteBtn.className='button-secondary';
shareInviteBtn.textContent='Поделиться ↗';
shareInviteBtn.setAttribute('aria-label','Отправить приглашение второму игроку');
shareInviteBtn.addEventListener('click',async()=>{
 if(!room){setError('network.createFirst');return;}
 const url=new URL(location.pathname,location.href);url.searchParams.set('room',room);
 const message=GameI18n.isEnglish()?'Join me in Linked by Light! Let’s solve co-op puzzles together.':'Присоединяйся ко мне в «Связанные светом»! Вместе пройдём приключение.';
 if(typeof navigator.share==='function'){
  try{await navigator.share({title:'Связанные светом',text:message,url:url.href});return;}
  catch(error){if(error?.name==='AbortError')return;/* unsupported/failed share → copy */}
 }
 try{
  await navigator.clipboard.writeText(message+' '+url.href+' (код '+room+')');
  shareInviteBtn.textContent=GameI18n.isEnglish()?'Link copied ✓':'Ссылка скопирована ✓';
  setTimeout(()=>shareInviteBtn.textContent=GameI18n.isEnglish()?'Share ↗':'Поделиться ↗',1800);
 }catch(_){setError('network.manualCopy',{url:url.href});}
});
$('copyBtn').parentElement.insertBefore(shareInviteBtn,$('copyBtn'));
const spectatorCopy=document.createElement('button');spectatorCopy.type='button';spectatorCopy.className='button-secondary';spectatorCopy.textContent='👀 Ссылка наблюдателю';
spectatorCopy.onclick=async()=>{
 if(!room)return;
 const url=new URL(location.pathname,location.href);url.searchParams.set('room',room);url.searchParams.set('spectate','1');
 try{await navigator.clipboard.writeText(url.href);spectatorCopy.textContent='Скопировано ✓';setTimeout(()=>spectatorCopy.textContent='👀 Ссылка наблюдателю',1600);}
 catch(_){setError('network.spectatorLink',{url:url.href});}
};
$('copyBtn').parentElement.append(spectatorCopy);
$('soundBtn').addEventListener('click',()=>{sound=!sound;GameQuality.setSound(sound);$('soundBtn').textContent=sound?'♫ Вкл.':'♫ Выкл.';if(sound)GameQuality.audioUnlock();});
function resetKeys(){keys.clear();input.left=false;input.right=false;
  document.querySelectorAll('.touch-button').forEach(b=>b.classList.remove('pressed'));sendInput();}
function updateInput(){const left=GameControls.keyFor(role,'left'),right=GameControls.keyFor(role,'right');
  input.left=keys.has(left)||keys.has('touch-left')||keys.has('gamepad-left');input.right=keys.has(right)||keys.has('touch-right')||keys.has('gamepad-right');sendInput();}
function activateKey(kind){if(role<0)return;GameExpansion.haptic(12);GameQuality.audioUnlock();if(kind==='jump')GameQuality.effect('jump');else if(kind==='ability')GameQuality.effect('ability');if(kind==='jump'){input.jumpSeq++;predJumpAt=performance.now();}else if(kind==='ability')input.abilitySeq++;else if(kind==='bond')input.bondSeq++;else if(kind==='emote')input.emoteSeq++;sendInput();}
const prevent=new Set(['arrowleft','arrowright','arrowup','arrowdown','space','enter']);
window.addEventListener('keydown',e=>{
  if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)||document.activeElement?.isContentEditable||document.querySelector('dialog[open]'))return;
  const k=GameControls.normalize(e.key);if(prevent.has(k)||GameControls.isBound(k))e.preventDefault();
  if(e.repeat||!room||role<0||phase!=='playing')return;
  if(k==='r'&&role===0){wsSend({t:'resetStage'});return;}
  const left=GameControls.keyFor(role,'left'),right=GameControls.keyFor(role,'right'),jump=GameControls.keyFor(role,'jump'),ability=GameControls.keyFor(role,'ability');
  GameQuality.audioUnlock();if(k===jump)activateKey('jump');if(k===ability)activateKey('ability');
  if(k==='g')activateKey('bond');if(k==='t')activateKey('emote');
  if(k==='v'){GameV21.open('level');return;}
  if(k==='q'&&levelIndex>=100&&levelIndex<=111)GameV20.act('tether_attach');
  if(k==='e'&&levelIndex>=100&&levelIndex<=111)GameV20.act('phase_shift');
  if(k==='z'&&levelIndex>=100&&levelIndex<=111)GameV20.act(role===0?'time_lock':'time_echo');
  if(k===left||k===right){keys.add(k);updateInput();}
});
window.addEventListener('keyup',e=>{keys.delete(GameControls.normalize(e.key));updateInput();});
window.addEventListener('blur',resetKeys);
document.addEventListener('visibilitychange',()=>{if(document.hidden)resetKeys();else if(!ready)openConnection();});
window.addEventListener('online',()=>{if(!ready)openConnection();});
document.querySelectorAll('.touch-button').forEach(btn=>{
  const k=btn.dataset.input,tag='touch-'+k;
  function down(e){e.preventDefault();if(!room||phase!=='playing')return;
    GameQuality.audioUnlock();if(!keys.has(tag)){
      keys.add(tag);btn.classList.add('pressed');if(['jump','ability','bond','emote'].includes(k))activateKey(k);else updateInput();
    }
    try{btn.setPointerCapture(e.pointerId);}catch(_){/* iOS fallback */}
  }
  function up(e){e.preventDefault();if(keys.delete(tag)){btn.classList.remove('pressed');updateInput();}}
  btn.addEventListener('pointerdown',down);btn.addEventListener('pointerup',up);btn.addEventListener('pointercancel',up);btn.addEventListener('lostpointercapture',()=>{keys.delete(tag);btn.classList.remove('pressed');updateInput();});
});
function sendInput(){if(!room||role<0||!ready||phase!=='playing')return;
  const packet={t:'input',inputSeq:++packetSeq,left:input.left,right:input.right,jumpSeq:input.jumpSeq,abilitySeq:input.abilitySeq,bondSeq:input.bondSeq,emoteSeq:input.emoteSeq};
  predictor.send(packet,performance.now());wsSend(packet);lastSend=performance.now();}
setInterval(()=>{if(ready&&room&&phase==='playing')sendInput();},25);
setInterval(()=>{if(ready)wsSend({t:'ping',sent:performance.now()});},1000);
function announce(msg,duration=2){toastEl.textContent=msg;toastEl.classList.add('visible');toastTimer=duration;}
function tone(freq,dur=.1,kind='sine',vol=.04){if(!sound||!GameQuality.settings().sound)return;try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume();const osc=ac.createOscillator(),gain=ac.createGain();osc.type=kind;osc.frequency.value=freq;gain.gain.value=vol;gain.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+dur);osc.connect(gain);gain.connect(ac.destination);osc.start();osc.stop(ac.currentTime+dur);}catch(_){}}
function burst(x,y,color,n=12,speed=130){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=(.25+Math.random()*.75)*speed;const ttl=.4+Math.random()*.6;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-20,life:ttl,ttl,r:1.5+Math.random()*3,color});}if(particles.length>500)particles.splice(0,particles.length-500);}
function updateHUD(){
  const act=Math.min(10,Math.floor(levelIndex/9)),segment=Math.floor((levelIndex%9)/3);
  $('levelLabel').textContent=demoMode?'ДЕМО · ИСПЫТАНИЕ '+GameDemo.progress(levelIndex)+' / '+GameDemo.stages.length:levelIndex>=122?'ФИЗИКА СВЕТА · '+(levelIndex-121)+'/15':levelIndex>=112?'НАВСТРЕЧУ ДРУГ ДРУГУ · '+(levelIndex-111)+'/10':levelIndex>=100?'ПЕРЕПЛЕТЕНИЕ МИРОВ · '+(levelIndex-99)+'/12':levelIndex===99?'СЕКРЕТНЫЙ УРОВЕНЬ 100':'УРОВЕНЬ '+String(levelIndex+1).padStart(2,'0')+' / 99 · АКТ '+(act+1)+'/11';
  $('levelName').textContent=level.title;
  const worldTag=$('worldTag');if(worldTag)worldTag.textContent=(demoMode?'✦ Первая глава':latest?.customLevel?'🛠 Авторский уровень':level.v23?'✦ Физика света':level.v21?'✧ Навстречу друг другу':level.v20?'✦ Переплетение миров':level.signature?.subtitle||'')+(level.reality?' · '+({mirror:'Два мира',chronicle:'Время',gravity:'Антигравитация'}[level.reality.kind]||''):'');
  const progress=$('actProgress');if(progress)progress.textContent=demoMode?'ДЕМО '+String(GameDemo.progress(levelIndex)).padStart(2,'0')+'/'+String(GameDemo.stages.length).padStart(2,'0'):levelIndex>=122?'ГЛАВА V23':levelIndex>=112?'ГЛАВА V21':levelIndex>=100?'ГЛАВА '+(Math.floor((levelIndex-100)/4)+1)+'/3':`АКТ ${String(act+1).padStart(2,'0')}`;
  for(let i=0;i<3;i++)$('step'+(i+1)).className='step'+(i===segment?' active':i<segment?' complete':'');
  $('amberStatus').textContent=P[0]?.cool>0?'· '+P[0].cool.toFixed(1)+' c':'· Рывок готов';
  $('blueStatus').textContent=P[1]?.cool>0?'· '+P[1].cool.toFixed(1)+' c':'· Импульс готов';
  let goal='Ворота открыты! Доберитесь до портала вдвоём.';
  if(!level.gateOpen){
    const wall=level.walls.find(w=>!w.broken);
    const crystal=level.crystals.find(c=>!c.on);
    if(wall)goal='Искра: у светящейся стены нажмите способность ('+GameControls.labelFor(0,'ability')+' на ПК или ✦ на телефоне).';
    else if(crystal)goal=level.bridgeTrigger==='pad-crystal'
      ?'Искра держит плиту, пока Эхо заряжает кристалл за мостом.'
      :'Эхо: у кристалла нажмите способность ('+GameControls.labelFor(1,'ability')+' на ПК или ✦ на телефоне).';
    else if(level.puzzle?.pads&&!level.padLatched)
      goal=levelIndex===0?`Плиты: Искра — оранжевая, Эхо — голубая. Вместе ${level.pads.filter(p=>p.pressed).length}/${level.pads.length}`:`Встаньте одновременно на плиты: ${level.pads.filter(p=>p.pressed).length}/${level.pads.length}`;
    else if(level.signature&&!level.signature.done){
      const sp=level.signature;
      const total=sp.pairs.length||sp.nodes.length||1;
      const active=sp.pairs.length?sp.pairs.filter(p=>p.active).length:sp.nodes.filter(n=>n.active).length;
      goal=sp.kind==='clock'?(sp.window>0?'Пока идут часы, ОБА перейдите временную дверь. Осталось '+Math.ceil(sp.window)+' с.':'Эхо: запусти часы импульсом. Дверь откроется на время.')
       :sp.kind==='constellation'?'Порядок звёзд: '+sp.progress+'/'+total+'. Активируйте их по номерам.'
       :sp.hint+' ('+active+'/'+total+')';
    }else if(level.reality&&!level.reality.done){
      const r=level.reality;
      if(r.kind==='mirror')goal=r.hint+' · Печати '+r.anchors.filter(a=>a.active).length+'/2';
      else if(r.kind==='chronicle')goal=r.window>0
        ?'Прошлое активировано. Эхо: включите будущее! Осталось '+Math.ceil(r.window)+' с.'
        :r.hint;
      else if(r.kind==='gravity')goal=r.gravityTimer>0
        ?'Антигравитация: коснитесь ядра оба! '+r.touched.filter(Boolean).length+'/2 · '+Math.ceil(r.gravityTimer)+' с.'
        :r.hint;
    }else goal=level.hint||'Помогайте друг другу, чтобы открыть выход.';
    if(level.v20){const state=latest?.world?.v20;goal=state?.boss?.active?'БОСС '+state.boss.name+' · '+state.boss.hp+'/'+state.boss.max+' HP · удар '+(state.boss.next?'Эхо':'Искра'):state?.complete?'Печати активированы. Оба к порталу!':level.objective;}
    if(level.v21){const v=latest?.world?.v21;goal=v?.completed?'Испытание пройдено! Оба к порталу.':level.objective;}
    if(level.v23){const v=latest?.world?.v23;goal=v?.done?'Испытание пройдено! Оба к порталу.':level.objective;}
    const extra=latest?.world?.adventure;
    if(extra?.boss?.hp>0&&extra.boss.active)goal='БОСС '+extra.boss.name+' · '+extra.boss.hp+'/'+extra.boss.max+' HP · атакует '+(extra.boss.next?'Эхо':'Искра');
    else if(extra?.arcade?.started&&!extra.arcade.done)goal='МИНИ-ИГРА: '+({chase:'гонка до светового рубежа',flight:'оба пролетите через кольцо',rhythm:'активируйте два ритмических узла',sail:'держите вправо вдвоём у паруса'}[extra.arcade.kind]||'действуйте вместе');
  }
  if(GameI18n.isEnglish()){
    const pad2=n=>String(n).padStart(2,'0');
    $('levelName').textContent=latest?.customLevel?level.title:GameI18n.stageTitle(levelIndex,level.title);
    $('levelLabel').textContent=demoMode?'DEMO · CHALLENGE '+GameDemo.progress(levelIndex)+' / '+GameDemo.stages.length
      :levelIndex>=122?'PHYSICS OF LIGHT · '+(levelIndex-121)+'/15'
      :levelIndex>=112?'TOWARD EACH OTHER · '+(levelIndex-111)+'/10'
      :levelIndex>=100?'INTERTWINED WORLDS · '+(levelIndex-99)+'/12'
      :levelIndex===99?'SECRET LEVEL 100'
      :'LEVEL '+pad2(levelIndex+1)+' / 99 · ACT '+(Math.floor(levelIndex/9)+1)+'/11';
    $('actProgress').textContent=demoMode?'DEMO '+pad2(GameDemo.progress(levelIndex))+'/'+pad2(GameDemo.stages.length)
      :levelIndex>=122?'CHAPTER V23':levelIndex>=112?'CHAPTER V21'
      :levelIndex>=100?'CHAPTER '+(Math.floor((levelIndex-100)/4)+1)+'/3'
      :'ACT '+pad2(Math.floor(levelIndex/9)+1);
    if(worldTag)worldTag.textContent=latest?.customLevel?'🛠 Custom Level':demoMode?'✦ Chapter One'
      :GameI18n.stageWorld(levelIndex)+(level.reality?' · '+GameI18n.realityLabel(level.reality.kind):'');
    if(P[0]?.cool<=0)$('amberStatus').textContent=GameI18n.t('readyDash');
    if(P[1]?.cool<=0)$('blueStatus').textContent=GameI18n.t('readyPulse');
    if(!latest?.customLevel)goal=GameI18n.formatGoal(goal,levelIndex,GameControls.labelFor(0,'ability'),GameControls.labelFor(1,'ability'));
  }
  $('objective').textContent=goal;
}

function consumeSnapshot(s){
  if(latest&&s.tick<latest.tick)return;
   demoMode=s.demo===true;
  const previous=latest;
  if(s.ack&&role>=0){lastAck=Math.max(lastAck,s.ack[role]||0);document.documentElement.dataset.pendingInputs=String(Math.max(0,packetSeq-lastAck));}
  if(s.result&&s.result.completed&&!s.customLevel&&!demoMode&&role>=0){const key=s.result.level+':'+s.result.elapsed+':'+s.result.deaths;
    if(lastResultId!==key){lastResultId=key;saveStageResult(s.result);announce('Уровень '+(s.result.level+1)+' — '+s.result.stars+' ★ · '+s.result.elapsed+' с · падений: '+s.result.deaths,3.6);GameQuality.effect('star');}}
  if(previous&&s.stage!==previous.stage){prediction=null;lastPredStage=-1;predictor.reset();snapshots=[];camera=0;particles=[];rings=[];GameJuice.clear();
    const next=stageDefs[s.stage];GameQuality.ambient(Math.floor(Math.min(s.stage,98)/9));announce(GameI18n.isEnglish()&&!demoMode?'✦ Level '+(s.stage+1)+' · '+GameI18n.stageTitle(s.stage,next.title):demoMode?(GameI18n.isEnglish()?'✦ Demo '+GameDemo.progress(s.stage)+'/'+GameDemo.stages.length+' · '+GameI18n.stageTitle(s.stage,next.title):'✦ Демо '+GameDemo.progress(s.stage)+'/'+GameDemo.stages.length+' · '+(GameDemo.chapters[GameDemo.progress(s.stage)-1]?.subtitle||next.title)):next?.v23?'✦ Физика света · '+next.title:next?.v21?'✧ Навстречу друг другу · '+next.title:next?.v20?'✦ Переплетение миров · '+next.title:'✦ Уровень '+(s.stage+1)+' — '+(next.reality?{mirror:'Две реальности',chronicle:'Прошлое и будущее',gravity:'Антигравитация'}[next.reality.kind]:next.signature?.subtitle||next.title),2.8);tone(600,.16,'sine',.055);}

  levelIndex=s.stage;phase=s.phase;connected=s.connected||connected;
  const receivedAt=performance.now();GameQuality.snapshotArrived(receivedAt);
  latest={...s,recvTime:receivedAt};
  const predictedStage=s.customLevel?GameExpansion.toStage(stageDefs[0],s.customLevel):stageDefs[s.stage];
  if(role>=0&&!stageDefs[s.stage]?.v23&&phase==='playing'&&s.players?.[role])predictor.reconcile({...s.players[role],type:role,w:30,h:43},s.ack?.[role]||0,predictedStage,s.world,s.stage,performance.now(),s.processedCommands?.[role],GameQuality.predictionLead());
  GameQuality.ambient(Math.floor(Math.min(98,s.stage)/9));
  if(role>=0&&!demoMode&&!s.customLevel&&(phase==='playing'||phase==='win')&&levelIndex<99)saveCheckpoint(levelIndex);
  level=s.customLevel?GameExpansion.toStage(stageDefs[0],s.customLevel):structuredClone(stageDefs[levelIndex]);level.gateOpen=s.world.gateOpen;level.bridgeLatched=s.world.bridgeLatched;level.padLatched=!!s.world.padLatched;
  level.pads.forEach((p,i)=>p.pressed=!!s.world.pads[i]);
  level.walls.forEach((w,i)=>w.broken=!!s.world.walls[i]);
  level.crystals.forEach((c,i)=>c.on=!!s.world.crystals[i]);
  const moving=level.platforms.find(p=>p.temporal);if(moving&&Number.isFinite(s.world?.v20?.time?.platformX))moving.x=s.world.v20.time.platformX;
  if(level.signature&&s.world.signature){
    const data=s.world.signature,z=level.signature;
    z.nodes.forEach((n,i)=>n.active=!!data.nodes[i]);
    z.pairs.forEach((p,i)=>p.active=!!data.pairs[i]);
    z.progress=data.progress||0;z.done=!!data.done;z.window=data.window||0;
    z.phase=data.phase||0;z.elapsed=data.elapsed||0;z.flash=data.flash||0;
  }
  if(level.reality&&s.world.reality){
    const state=s.world.reality,r=level.reality;
    r.done=!!state.done;r.window=state.window||0;r.charge=state.charge||0;
    r.gravityTimer=state.gravityTimer||0;r.touched=state.touched||[false,false];
    r.anchors.forEach((a,i)=>a.active=!!state.anchors?.[i]);
  }
  collectibles=level.shards.map((x,i)=>({x,y:i%2?390:432,taken:!!s.world.shards[i]}));
  GameJuice.snapshot(previous,s,level);if(role>=0)GameAdventure.onSnapshot(s);GameExpansion.onSnapshot(s);GameV20.onSnapshot(s);GameV21.onSnapshot(s);GameFuture.onSnapshot(s);if(role>=0)GameAdventure.recordV23(s);
  if(previous?.world?.reality&&!previous.world.reality.done&&s.world.reality?.done){
    announce('✦ Две реальности соединены!',2.6);tone(860,.22,'sine',.05);GameQuality.effect('star');
  }
  if(previous?.world?.adventure?.boss?.hp>s.world?.adventure?.boss?.hp)GameQuality.effect('boss');
  if(previous?.world?.adventure?.bond?.active>0&&s.world?.adventure?.bond?.active===0&&s.stats?.rescues>previous.stats?.rescues)GameQuality.effect('rescue');
  if(previous&&s.stage===previous.stage&&s.world.signature){
    const before=previous.world?.signature,now=s.world.signature;
    if(before){
      now.nodes.forEach((active,i)=>{
        if(active&&!before.nodes[i]){
          const n=level.signature.nodes[i];burst(n.x,n.y-12,n.role===0?colors.amber:colors.blue,11,75);
          tone(n.role===0?560:740,.12,'sine',.027);
        }
      });
      if(!before.done&&now.done){announce(GameI18n.isEnglish()?'✦ World challenge complete!':'✦ Особенность мира пройдена!',1.65);tone(980,.2,'sine',.04);}
    }
  }
  if(previous&&s.stage===previous.stage){
    if(!previous.world.gateOpen&&s.world.gateOpen){announce(GameI18n.isEnglish()?'✦ Gate open! Both players to the portal.':'✦ Ворота открыты! Оба к порталу.',2);tone(550,.2,'sine',.05);screenShake=7;}
    for(let i=0;i<level.walls.length;i++)if(!previous.world.walls[i]&&s.world.walls[i]){const w=level.walls[i];burst(w.x,w.y+w.h/2,colors.amber,30,200);screenShake=11;tone(180,.2,'sawtooth',.05);}
    for(let i=0;i<level.crystals.length;i++)if(!previous.world.crystals[i]&&s.world.crystals[i]){const c=level.crystals[i];burst(c.x,c.y,colors.blue,30,200);announce(GameI18n.isEnglish()?'Crystal activated ✦':'Кристалл активирован ✦',2);tone(740,.2,'sine',.04);}
  }
  snapshots.push(latest);if(snapshots.length>12)snapshots.shift();
  GameHints.onSnapshot(s);
  if(demoMode&&!previous&&phase==='playing')announce('✦ '+(GameI18n.isEnglish()?'Nine co-op challenges. Two heroes, two abilities, one path.':GameDemo.intro),4);
  if(phase==='playing')playingOnce=true;
  if(phase==='win'&&previous?.phase!=='win'){announce(demoMode&&GameI18n.isEnglish()?GameI18n.t('demoEndingTitle'):s.ending?.title||'Вы прошли игру вместе!',4);tone(740,.3,'sine',.06);}
  showUI();
}
function renderPlayers(dt){
  if(!latest){P=[{type:0,x:180,y:GROUND-43,w:30,h:43,face:1,grounded:true,cool:0,dash:0,abilityFx:0,trail:[],breathe:0},{type:1,x:250,y:GROUND-43,w:30,h:43,face:1,grounded:true,cool:0,dash:0,abilityFx:0,trail:[],breathe:1}];return;}
  const at=performance.now()-GameQuality.interpolationDelay();
  while(snapshots.length>2&&snapshots[1].recvTime<at)snapshots.shift();
  let a=snapshots[0]||latest,b=snapshots[1]||a;
  const span=b.recvTime-a.recvTime;
  const alpha=a===b||span<0.01?1:Math.max(0,Math.min(1,(at-a.recvTime)/span));
  P=latest.players.map((source,i)=>{
    let older=a.players[i],newer=b.players[i];
    let x=older.x+(newer.x-older.x)*alpha,y=older.y+(newer.y-older.y)*alpha;
    // Локальная экстраполяция только на этапе рисования, не влияет на физику или головоломки.
    if(i===role&&connected.every(Boolean)){
      const lead=Math.min(.045,Math.max(0,(performance.now()-latest.recvTime)/1000));
      if(a===b){x=source.x+source.vx*lead;y=source.y+source.vy*lead;}
    }
    if(i===role&&!level?.v23&&phase==='playing'&&connected.every(Boolean)){
      const p=predictor.display(dt,input,level,latest.world,GameQuality.predictionLead());if(p){x=p.x;y=p.y;}
    }
    return {...source,x,y,type:i,w:30,h:43,trail:[],breathe:i*2,look:GameAdventure.outfitFor(i),emote:latest?.world?.adventure?.emotes?.[i]||0};
  });
  updateHUD();
}
function animate(ts){
  const dt=Math.min(.033,Math.max(0,(ts-fpsTime)/1000));fpsTime=ts;clock+=dt;GameQuality.sample(dt);
  if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)toastEl.classList.remove('visible');}
  for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=95*dt;p.life-=dt;}
  particles=particles.filter(p=>p.life>0);
  for(const r of rings){r.life-=dt;r.r+=(r.max-r.r)*dt*5.5;}rings=rings.filter(r=>r.life>0);
  screenShake=GameQuality.settings().reducedMotion?0:Math.max(0,screenShake-35*dt);
  renderPlayers(dt);
  // Animations are visual-only; server physics and multiplayer state are unchanged.
  GameJuice.frame(dt,P,phase==='playing'&&connected.every(Boolean));
  if(role>=0&&P[role]&&phase==='playing'){const p=P[role],now=performance.now();
    if(wasOnGround===false&&p.grounded)GameQuality.effect('land');
    if(p.grounded&&Math.abs(p.vx||0)>85&&now-lastFootstep>210){lastFootstep=now;GameQuality.effect('step');}
    wasOnGround=!!p.grounded;}else wasOnGround=null;
  const avg=(P[0].x+P[1].x)/2;
  const lead=((P[0].vx||0)+(P[1].vx||0))*.052;
  const target=Math.max(0,Math.min(level.width-W,avg-W/2+90+lead));
  camera+=(target-camera)*(1-Math.exp(-dt*4.65));
  draw();requestAnimationFrame(animate);
}
function bridgeActive(){
 if(level.bridgeLatched)return true;
 if(level.bridgeTrigger==='pad-crystal'||level.bridgeTrigger==='pad')return level.pads.some(p=>p.pressed)||level.bridgeTrigger==='pad'&&level.padLatched;
 if(level.bridgeTrigger==='crystal')return level.crystals.length>0&&level.crystals.every(c=>c.on);
 return level.bridgeTrigger==='always';
}
function portalReady(){return level.gateOpen;}
function roundRect(x,y,w,h,r,fill){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill)ctx.fill();}
function gradient(x0,y0,x1,y1,stops){const g=ctx.createLinearGradient(x0,y0,x1,y1);for(const [s,c] of stops)g.addColorStop(s,c);return g;}
function glowCircle(x,y,r,color,alpha=1){ctx.save();ctx.globalAlpha=alpha;const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'#0000');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.restore();}
function background(){
 GameVisuals.background(ctx,{W,H,camera,clock,levelIndex});
 GameBiomes.background(ctx,level,levelIndex,clock,camera);
 if(typeof GameReality!=='undefined'&&level)GameReality.background(ctx,level,role,clock);
}
function drawPlatform(p){GameVisuals.platform(ctx,p,levelIndex,clock);GameBiomes.platform(ctx,p,levelIndex,clock);}
function drawWorld(){ctx.save();ctx.translate(Math.round(-camera+(Math.random()-.5)*screenShake),0);
 // thin skyline hanging structures
 for(let x=170;x<level.width;x+=365){ctx.strokeStyle='#cbccff17';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,-10);ctx.lineTo(x,70+Math.sin(x)*18);ctx.stroke();glowCircle(x,76,11,'#b9aaff66');}
 // Layered terrain and enchanted scenery.
 GameVisuals.terrain(ctx,level,levelIndex,clock,GROUND);
 GameVisuals.scenery(ctx,level,levelIndex,clock);
  if(GameQuality.settings().graphics!=='low')GameJuice.ambient(ctx,level,clock,levelIndex);
 // pits
 for(let x=0;x<level.width;x+=12){if(!level.floor.some(([a,b])=>x>=a&&x<b)){glowCircle(x,615,28,levelIndex===2?'#ed77a015':'#78e9eb12');}}
 // bridge
 if(bridgeActive())level.bridges.forEach(b=>drawPlatform({...b,kind:'bridge'}));else for(const b of level.bridges){ctx.setLineDash([9,12]);ctx.strokeStyle='#80e8ef34';ctx.lineWidth=2;ctx.strokeRect(b.x,b.y,b.w,6);ctx.setLineDash([]);}
 level.platforms.forEach(p=>drawPlatform({...p,kind:'platform'}));
 // spikes
 for(const h of level.hazards){glowCircle(h.x+h.w/2,GROUND-3,h.w*.7,'#ff6d8940');for(let x=h.x;x<h.x+h.w;x+=12){ctx.fillStyle='#ff8196';ctx.beginPath();ctx.moveTo(x,GROUND);ctx.lineTo(x+6,h.y-8);ctx.lineTo(x+12,GROUND);ctx.fill();}}
 // pads
 for(const pad of level.pads){const c=pad.type?colors.blue:colors.amber;glowCircle(pad.x+pad.w/2,GROUND-6,pad.pressed?76:36,c,pad.pressed?.37:.14);ctx.fillStyle='#141c31';roundRect(pad.x,GROUND-11,pad.w,12,5,true);ctx.fillStyle=pad.pressed?c:c+'69';roundRect(pad.x+4,GROUND-10,pad.w-8,6,3,true);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.beginPath();ctx.arc(pad.x+pad.w/2,GROUND-20,8,0,Math.PI*2);ctx.stroke();if(pad.pressed){for(let i=0;i<4;i++){glowCircle(pad.x+10+i*(pad.w-20)/3,GROUND-17-((clock*21+i*16)%60),9,c,.4);}}}
 // gates
 for(const gate of level.gates){if(!level.gateOpen){glowCircle(gate.x+gate.w/2,gate.y+gate.h/2,90,'#c697ff33');ctx.fillStyle='#313158';roundRect(gate.x,gate.y,gate.w,gate.h,8,true);ctx.fillStyle='#bc91ed';roundRect(gate.x+8,gate.y+5,6,gate.h-10,3,true);for(let y=gate.y+15;y<gate.y+gate.h;y+=26){ctx.strokeStyle='#dcc6fd7f';ctx.beginPath();ctx.moveTo(gate.x,y);ctx.lineTo(gate.x+gate.w,y+13);ctx.stroke();}}else{ctx.globalAlpha=.45;glowCircle(gate.x+gate.w/2,gate.y+7,28,'#bdb6fd44');ctx.fillStyle='#af8bd6';ctx.fillRect(gate.x-6,gate.y,gate.w+12,7);ctx.globalAlpha=1;}}
 // walls
 for(const wall of level.walls)if(!wall.broken){glowCircle(wall.x+wall.w/2,wall.y+wall.h/2,53,'#ffa96022');ctx.fillStyle='#5f4250';roundRect(wall.x,wall.y,wall.w,wall.h,5,true);ctx.fillStyle='#ffb479';ctx.fillRect(wall.x,wall.y,wall.w,4);ctx.strokeStyle='#ffc386';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(wall.x+6,wall.y+16);ctx.lineTo(wall.x+22,wall.y+54);ctx.lineTo(wall.x+10,wall.y+93);ctx.lineTo(wall.x+25,wall.y+127);ctx.lineTo(wall.x+9,wall.y+170);ctx.stroke();}
 // crystals
 for(const crystal of level.crystals){const c=crystal.on?'#9ffff5':'#76baf7';glowCircle(crystal.x,crystal.y,crystal.on?105:65,c,crystal.on?.35:.18);ctx.save();ctx.translate(crystal.x,crystal.y+Math.sin(clock*2)*4);ctx.rotate(Math.sin(clock*.7)*.1);ctx.fillStyle=crystal.on?'#c9fff4':'#9fc9f9';ctx.shadowBlur=crystal.on?30:14;ctx.shadowColor=c;ctx.beginPath();ctx.moveTo(0,-23);ctx.lineTo(16,0);ctx.lineTo(0,25);ctx.lineTo(-16,0);ctx.closePath();ctx.fill();ctx.strokeStyle='#f3ffff';ctx.lineWidth=1.4;ctx.stroke();ctx.restore();}
 // shards
 for(const item of collectibles)if(!item.taken){const y=item.y+Math.sin(clock*2+item.x)*6;glowCircle(item.x,y,24,'#f8df9140');ctx.save();ctx.translate(item.x,y);ctx.rotate(clock*.8);ctx.fillStyle='#ffe7a7';ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,r=i%2?4:12;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.restore();}
 GameBiomes.signature(ctx,level,clock);
 if(typeof GameReality!=='undefined')GameReality.draw(ctx,level,P,latest?.world?.reality,clock,role);
 GameAdventure.draw(ctx,level,P,latest?.world?.adventure,clock);GameV20.draw(ctx,level,P,latest?.world?.v20,clock,role);GameV21.draw(ctx,level,P,latest?.world?.v21,clock,role);GameFuture.draw(ctx,level,P,latest?.world?.v23,clock,role,latest?.stats);
 drawPortal(level.portal,GROUND-65,portalReady());
 // environmental hints
 ctx.textAlign='center';ctx.font='700 14px system-ui';ctx.fillStyle='#f5e5ff88';for(const w of level.walls)if(!w.broken)ctx.fillText('ИСКРА · F',w.x+w.w/2,w.y-22);for(const crystal of level.crystals)if(!crystal.on)ctx.fillText('ЭХО · ENTER',crystal.x,crystal.y-56);
 // particles behind character
 for(const r of rings){ctx.globalAlpha=Math.max(0,r.life/r.ttl)*.7;ctx.strokeStyle=r.color;ctx.lineWidth=5*(r.life/r.ttl)+1;ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
 P.forEach(drawPlayer);
  if(GameQuality.settings().graphics!=='low')GameJuice.effects(ctx);
 for(const pt of particles){ctx.globalAlpha=Math.max(0,pt.life/pt.ttl);ctx.fillStyle=pt.color;ctx.beginPath();ctx.arc(pt.x,pt.y,pt.r*Math.max(.25,pt.life/pt.ttl),0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
 ctx.restore();}
function drawPortal(x,y,active){GameVisuals.portal(ctx,x,y,active,clock);}
function drawPlayer(p){
 const scale=level?.v23?.kind==='resize'?(latest?.world?.v23?.scale?.[p.type]||1):1;
 if(scale!==1){
  ctx.save();ctx.translate(p.x+15,p.y+43);ctx.scale(scale,scale);ctx.translate(-(p.x+15),-(p.y+43));
  GameVisuals.player(ctx,p,clock);ctx.restore();
 }else GameVisuals.player(ctx,p,clock);
}
function draw(){background();if(level)drawWorld();else {ctx.fillStyle='#ffffff11';ctx.fillRect(0,544,1200,106);}GameExpansion.drawWeather(ctx,W,H,latest?.world?.expansion,clock,GameQuality.settings().graphics);if(phase==='win'){glowCircle(600,280,300,'#ffe6b720');}if(GameQuality.settings().graphics!=='low')GameVisuals.vignette(ctx,W,H);}
const RESULT_KEY='linked-light-stars-v11';
function saveStageResult(result){try{const all=JSON.parse(localStorage.getItem(RESULT_KEY)||'{}');
 const k=String(result.level),prev=all[k];if(!prev||result.stars>prev.stars||result.stars===prev.stars&&result.elapsed<prev.elapsed){all[k]={stars:result.stars,elapsed:result.elapsed,deaths:result.deaths};localStorage.setItem(RESULT_KEY,JSON.stringify(all));}}
 catch(e){console.warn('Result not saved',e);}}
function refreshKeyboardGuides(){
 for(const [who,id] of [[0,'amberControlsGuide'],[1,'blueControlsGuide']]){
  const el=$(id);if(!el)continue;
  const labels=['left','right','jump','ability'].map(key=>GameControls.labelFor(who,key));
  el.textContent=labels[0]+' / '+labels[1]+(GameI18n.isEnglish()?' — move · ':' — ходить · ')+labels[2]+(GameI18n.isEnglish()?' — jump · ':' — прыжок · ')+labels[3]+(GameI18n.isEnglish()?' — ability · G — bond · T — emote':' — способность · G — связь · T — эмоция');
 }
}
GameI18n.init();
GameI18n.subscribe(()=>{
  showUI();
  updateStatus();
  if(latest?.world)updateHUD();
  setError(lastErrorCode,lastErrorVars);
  refreshKeyboardGuides();
  GamePublicBeta.refreshLanguage?.();
});
GameControls.init({onChange:()=>{resetKeys();refreshKeyboardGuides();}});
GamePadBindings.init();
GameQuality.init({getSession:()=>({phase,role,room}),onControls:(left,right)=>{if(left)keys.add('gamepad-left');else keys.delete('gamepad-left');if(right)keys.add('gamepad-right');else keys.delete('gamepad-right');updateInput();},onAction:activateKey});
GameQuality.ambient(0);
GameAdventure.init({send:wsSend,currentStage:()=>levelIndex,bestStage,inRoom:()=>!!room,startStage:(n)=>{if(room){if(role===0)wsSend({t:'selectStage',stage:n,secrets:GameAdventure.data().secrets.length});else announce('Уровни выбирает создатель комнаты.');}else createRoom(false,n);}});
GameHints.init({getState:()=>({level,world:latest?.world,role,phase,stageIndex:levelIndex,customLevel:!!latest?.customLevel})});
GameCloud.init();GameFuture.init({send:wsSend,role:()=>role,room:()=>room,stage:()=>levelIndex,inRoom:()=>!!room,create:stage=>createRoom(true,stage),announce,canvas:()=>canvas});GamePublicBeta.init({stage:()=>levelIndex,role:()=>role,inRoom:()=>!!room});GameV21.init({send:wsSend,role:()=>role,stage:()=>levelIndex,inRoom:()=>!!room,create:()=>createRoom(true,112),resume:id=>createRoom(false,id),announce,canvas:()=>canvas});GameV20.init({send:wsSend,role:()=>role,stage:()=>levelIndex,inRoom:()=>!!room,create:()=>createRoom(true,100),resume:id=>createRoom(false,id),announce,reconnects:()=>totalReconnects});GameExpansion.init({send:wsSend,inRoom:()=>!!room&&role>=0,createCustom:b=>createRoom(false,0,b),announce,saveMemory:GameAdventure.addMemory,getMemories:()=>GameAdventure.data().memories||[]});openConnection();showUI();requestAnimationFrame(animate);
})();