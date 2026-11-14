(() => {
'use strict';
const W=1200,H=650,GROUND=GameStages.GROUND,stageDefs=[...GameStages.stages,GameStages.BONUS_STAGE];
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id);
const overlay=$('overlay'),toastEl=$('toast');
const colors={amber:'#ffc17f',blue:'#80eff7'};
let levelIndex=0,level=structuredClone(stageDefs[0]),P=[],camera=0,clock=0;
let particles=[],rings=[],screenShake=0,collectibles=[],toastTimer=0;
let room='',role=-1,token='',phase='waiting',connected=[false,false],socket=null,ready=false;
let pendingRoom='',pendingCreate=false,pendingCreateStage=0,connectedBefore=false,reconnectCount=0,wsTimer=null;
let latest=null,snapshots=[],fpsTime=performance.now(),sound=true,ac=null;
const keys=new Set(),input={left:false,right:false,jumpSeq:0,abilitySeq:0,bondSeq:0,emoteSeq:0};
let prediction=null,lastPredStage=-1,predJumpAt=0,lastAck=0,lastResultId='',packetSeq=0,wasOnGround=null,lastFootstep=0;
let latency=0,lastSend=0,playingOnce=false;
const qs=new URLSearchParams(location.search);const invite=qs.get('room');
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
function setError(message){$('networkError').textContent=message;}
function wsSend(m){if(socket&&socket.readyState===WebSocket.OPEN)socket.send(JSON.stringify(m));}
function updateStatus(){const online=socket?.readyState===WebSocket.OPEN;
  $('statusDot').className='status-dot '+(online?'online':'offline');
  $('connectionStatus').textContent=online?'На связи':room?'Нет связи':'Подключение…';
  $('ping').textContent=online&&latency?`${latency} мс`:'';
  const mobileStatus=$('mobileConnectionText'),mobileBox=$('mobileConnection');
  if(mobileStatus)mobileStatus.textContent=online?('Сервер на связи'+(latency?' · '+latency+' мс':'')):'Подключение к серверу…';
  if(mobileBox)mobileBox.dataset.status=online?'online':'offline';
}
function openConnection(){
  if(socket&&(socket.readyState===WebSocket.CONNECTING||socket.readyState===WebSocket.OPEN))return;
  clearTimeout(wsTimer);
  const protocol=location.protocol==='https:'?'wss:':'ws:';
  socket=new WebSocket(protocol+'//'+location.host+'/ws');ready=false;updateStatus();
  socket.addEventListener('open',()=>{
    reconnectCount=0;ready=true;connectedBefore=true;setError('');updateStatus();
    if(room||pendingRoom){const code=room||pendingRoom;wsSend({t:'join',room:code,token:token||roomToken(code)});}
    else if(pendingCreate){wsSend({t:'create',stage:pendingCreateStage,secrets:GameAdventure.data().secrets.length,home:GameAdventure.getHome()});pendingCreate=false;}
    else showUI();
  });
  socket.addEventListener('message',e=>{
    let m;try{m=JSON.parse(e.data);}catch(_){return;}
    if(m.t==='joined'){
      room=m.room;role=m.role;token=m.token;phase=m.phase;pendingRoom='';saveToken(room,token);
      history.replaceState({},'',location.pathname+'?room='+encodeURIComponent(room));
      connected=m.connected||[false,false];$('myRole').textContent=role===0?'Искра (ведущий)':'Эхо (гость)';
      if(m.home)GameAdventure.receiveHome(m.home);GameAdventure.onJoined(room,role);
      setError('');resetKeys();showUI();return;
    }
    if(m.t==='home'){GameAdventure.receiveHome(m.items);return;}
    if(m.t==='looks'){GameAdventure.receiveLooks(m.looks);return;}
    if(m.t==='storyChoice'){GameAdventure.storyChoice?.(m);return;}
    if(m.t==='members'){
      connected=m.connected||connected;phase=m.phase||phase;showUI();return;
    }
    if(m.t==='snapshot'){consumeSnapshot(m);return;}
    if(m.t==='error'){
      const msg=m.message||'Ошибка подключения.';
      if(room&&msg.includes('Комната не найдена')){room='';role=-1;token='';phase='waiting';latest=null;snapshots=[];history.replaceState({},'',location.pathname);}
      const help=msg.includes('Комната не найдена')
        ?'Комната не найдена. Сначала создайте новую комнату на первом устройстве и отправьте свежую ссылку. После перезапуска сервера прежние коды исчезают.'
        :msg;
      setError(help);if(!room)pendingRoom='';showUI();return;
    }
    if(m.t==='pong'){
      if(Number.isFinite(m.sent)){latency=Math.max(0,Math.round(performance.now()-m.sent));GameQuality.net(latency);updateStatus();}return;
    }
  });
  socket.addEventListener('close',()=>{
    ready=false;updateStatus();resetKeys();
    if(room){connected=[false,false];$('waitingBanner').classList.remove('hidden');}
    setError(room?'Связь прервалась. Автоматически переподключаемся…':'Нет связи с сервером. Повторная попытка…');
    reconnectCount++;const delay=Math.min(15_000,700*2**Math.min(reconnectCount,5));
    wsTimer=setTimeout(openConnection,delay);showUI();
  });
  socket.addEventListener('error',()=>{/* close handles backoff */});
}
function updateTouchRole(){
  const badge=$('touchRoleBadge'),icon=$('touchRoleIcon'),name=$('touchRoleName'),hint=$('touchRoleHint');
  if(!badge||!icon||!name||!hint)return;
  const echo=role===1;
  icon.textContent=echo?'◈':'✦';name.textContent=echo?'Эхо':'Искра';
  hint.textContent=echo?'прыжок и импульс':'прыжок и рывок';
  icon.style.color=echo?'#8ff8ff':'#ffcf83';
  icon.style.background=echo?'#73e3f01a':'#ffb45f1c';
  badge.style.borderColor=echo?'#70e9f388':'#ffbb6e88';
}
function showUI(){
  updateStatus();
  updateTouchRole();
  $('slot0').textContent=connected[0]?'● В сети':'○ Нет подключения';
  $('slot1').textContent=connected[1]?'● В сети':'○ Ожидаем игрока';
  $('roomCode').textContent=room||'------';
  if(!room)refreshCampaignMenu();
  $('startBtn').disabled=!(role===0&&connected[0]&&connected[1]&&ready&&phase==='waiting');
  $('restartBtn').disabled=role!==0||!connected.every(Boolean);
  $('resetBtn').disabled=role!==0;
  $('lobbyHint').textContent=role===0?'Отправьте приглашение. Когда оба игрока подключатся, нажмите «Начать вдвоём».':'Вы подключены. Ждём, когда создатель комнаты запустит игру.';
  if(!room)overlay.dataset.view='menu';
  else if(phase==='waiting')overlay.dataset.view='lobby';
  else if(phase==='win')overlay.dataset.view='win';
  else overlay.dataset.view='';
  overlay.classList.toggle('hidden',!!room&&phase==='playing');
  $('waitingBanner').classList.toggle('hidden',!room||phase!=='playing'||connected.every(Boolean));
  $('touchControls').style.visibility=!!room&&phase==='playing'?'visible':'hidden';
}
function createRoom(newGame=false,stageOverride=null){
 setError('');pendingCreate=true;pendingRoom='';pendingCreateStage=Number.isInteger(stageOverride)?stageOverride:(newGame?0:bestStage());
 if(!ready)openConnection();
 else{wsSend({t:'create',stage:pendingCreateStage,secrets:GameAdventure.data().secrets.length,home:GameAdventure.getHome()});pendingCreate=false;}
}
function joinRoom(code){const value=(code||'').trim().toUpperCase();if(!/^[A-HJ-NP-Z2-9]{6}$/.test(value)){setError('Введите шестизначный код комнаты.');return;}
  pendingRoom=value;setError('');if(ready)wsSend({t:'join',room:value,token:roomToken(value)});else openConnection();
}
$('createBtn').addEventListener('click',()=>createRoom(false));
$('newCampaignBtn').addEventListener('click',()=>createRoom(true));
$('joinBtn').addEventListener('click',()=>joinRoom($('roomInput').value));
$('roomInput').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();joinRoom($('roomInput').value);}});
$('startBtn').addEventListener('click',()=>wsSend({t:'start'}));
$('resetBtn').addEventListener('click',()=>wsSend({t:'resetStage'}));
$('restartBtn').addEventListener('click',()=>wsSend({t:'restart'}));
$('copyBtn').addEventListener('click',async()=>{
  const url=new URL(location.pathname,location.href);url.searchParams.set('room',room);
  const text=`Сыграем вместе в «Связанные светом»? Открой эту ссылку на iPhone: ${url.href} (код ${room})`;
  try{await navigator.clipboard.writeText(text);$('copyBtn').textContent='Скопировано ✓';setTimeout(()=>$('copyBtn').textContent='Скопировать приглашение',1500);}
  catch(_){setError('Не удалось скопировать автоматически. Код: '+room+' — '+url.href);}
});
$('soundBtn').addEventListener('click',()=>{sound=!sound;GameQuality.setSound(sound);$('soundBtn').textContent=sound?'♫ Вкл.':'♫ Выкл.';if(sound)GameQuality.audioUnlock();});
function resetKeys(){keys.clear();input.left=false;input.right=false;
  document.querySelectorAll('.touch-button').forEach(b=>b.classList.remove('pressed'));sendInput();}
function updateInput(){const left=role===0?'a':'arrowleft',right=role===0?'d':'arrowright';
  input.left=keys.has(left)||keys.has('touch-left')||keys.has('gamepad-left');input.right=keys.has(right)||keys.has('touch-right')||keys.has('gamepad-right');sendInput();}
function activateKey(kind){GameQuality.audioUnlock();if(kind==='jump')GameQuality.effect('jump');else if(kind==='ability')GameQuality.effect('ability');if(kind==='jump'){input.jumpSeq++;predJumpAt=performance.now();}else if(kind==='ability')input.abilitySeq++;else if(kind==='bond')input.bondSeq++;else if(kind==='emote')input.emoteSeq++;sendInput();}
const prevent=new Set(['arrowleft','arrowright','arrowup','arrowdown',' ','enter']);
window.addEventListener('keydown',e=>{
  if(document.activeElement?.tagName==='INPUT')return;
  const k=e.key.toLowerCase();if(prevent.has(k))e.preventDefault();
  if(e.repeat||!room||phase!=='playing')return;
  if(k==='r'&&role===0){wsSend({t:'resetStage'});return;}
  const left=role===0?'a':'arrowleft',right=role===0?'d':'arrowright',jump=role===0?'w':'arrowup',ability=role===0?'f':'enter';
  GameQuality.audioUnlock();if(k===jump)activateKey('jump');if(k===ability)activateKey('ability');
  if(k==='g')activateKey('bond');if(k==='t')activateKey('emote');
  if(k===left||k===right){keys.add(k);updateInput();}
});
window.addEventListener('keyup',e=>{keys.delete(e.key.toLowerCase());updateInput();});
window.addEventListener('blur',resetKeys);
document.addEventListener('visibilitychange',()=>{if(document.hidden)resetKeys();});
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
function sendInput(){if(!room||!ready||phase!=='playing')return;
  wsSend({t:'input',inputSeq:++packetSeq,left:input.left,right:input.right,jumpSeq:input.jumpSeq,abilitySeq:input.abilitySeq,bondSeq:input.bondSeq,emoteSeq:input.emoteSeq});lastSend=performance.now();}
setInterval(()=>{if(ready&&room&&phase==='playing')sendInput();},40);
setInterval(()=>{if(ready)wsSend({t:'ping',sent:performance.now()});},3000);
function announce(msg,duration=2){toastEl.textContent=msg;toastEl.classList.add('visible');toastTimer=duration;}
function tone(freq,dur=.1,kind='sine',vol=.04){if(!sound||!GameQuality.settings().sound)return;try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume();const osc=ac.createOscillator(),gain=ac.createGain();osc.type=kind;osc.frequency.value=freq;gain.gain.value=vol;gain.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+dur);osc.connect(gain);gain.connect(ac.destination);osc.start();osc.stop(ac.currentTime+dur);}catch(_){}}
function burst(x,y,color,n=12,speed=130){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=(.25+Math.random()*.75)*speed;const ttl=.4+Math.random()*.6;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-20,life:ttl,ttl,r:1.5+Math.random()*3,color});}if(particles.length>500)particles.splice(0,particles.length-500);}
function updateHUD(){
  const act=Math.min(10,Math.floor(levelIndex/9)),segment=Math.floor((levelIndex%9)/3);
  $('levelLabel').textContent=levelIndex===99?'СЕКРЕТНЫЙ УРОВЕНЬ 100':'УРОВЕНЬ '+String(levelIndex+1).padStart(2,'0')+' / 99 · АКТ '+(act+1)+'/11';
  $('levelName').textContent=level.title;
  const worldTag=$('worldTag');if(worldTag)worldTag.textContent=level.signature?.subtitle||'';
  const progress=$('actProgress');if(progress)progress.textContent=`АКТ ${String(act+1).padStart(2,'0')}`;
  for(let i=0;i<3;i++)$('step'+(i+1)).className='step'+(i===segment?' active':i<segment?' complete':'');
  $('amberStatus').textContent=P[0]?.cool>0?'· '+P[0].cool.toFixed(1)+' c':'· Рывок готов';
  $('blueStatus').textContent=P[1]?.cool>0?'· '+P[1].cool.toFixed(1)+' c':'· Импульс готов';
  let goal='Ворота открыты! Доберитесь до портала вдвоём.';
  if(!level.gateOpen){
    const wall=level.walls.find(w=>!w.broken);
    const crystal=level.crystals.find(c=>!c.on);
    if(wall)goal='Искра: разрушьте светящуюся стену рывком (F).';
    else if(crystal)goal=level.bridgeTrigger==='pad-crystal'
      ?'Искра держит плиту, пока Эхо заряжает кристалл за мостом.'
      :'Эхо: активируйте кристалл импульсом.';
    else if(level.puzzle?.pads&&!level.padLatched)
      goal=`Встаньте одновременно на плиты: ${level.pads.filter(p=>p.pressed).length}/${level.pads.length}`;
    else if(level.signature&&!level.signature.done){
      const sp=level.signature;
      const total=sp.pairs.length||sp.nodes.length||1;
      const active=sp.pairs.length?sp.pairs.filter(p=>p.active).length:sp.nodes.filter(n=>n.active).length;
      goal=sp.kind==='clock'?(sp.window>0?'Пока идут часы, ОБА перейдите временную дверь. Осталось '+Math.ceil(sp.window)+' с.':'Эхо: запусти часы импульсом. Дверь откроется на время.')
       :sp.kind==='constellation'?'Порядок звёзд: '+sp.progress+'/'+total+'. Активируйте их по номерам.'
       :sp.hint+' ('+active+'/'+total+')';
    }else goal=level.hint||'Помогайте друг другу, чтобы открыть выход.';
    const extra=latest?.world?.adventure;
    if(extra?.boss?.hp>0&&extra.boss.active)goal='БОСС '+extra.boss.name+' · '+extra.boss.hp+'/'+extra.boss.max+' HP · атакует '+(extra.boss.next?'Эхо':'Искра');
    else if(extra?.arcade?.started&&!extra.arcade.done)goal='МИНИ-ИГРА: '+({chase:'гонка до светового рубежа',flight:'оба пролетите через кольцо',rhythm:'активируйте два ритмических узла',sail:'держите вправо вдвоём у паруса'}[extra.arcade.kind]||'действуйте вместе');
  }
  $('objective').textContent=goal;
}

function consumeSnapshot(s){
  if(latest&&s.tick<latest.tick)return;
  const previous=latest;
  if(s.ack&&role>=0){lastAck=Math.max(lastAck,s.ack[role]||0);document.documentElement.dataset.pendingInputs=String(Math.max(0,packetSeq-lastAck));}
  if(s.result&&s.result.completed){const key=s.result.level+':'+s.result.elapsed+':'+s.result.deaths;
    if(lastResultId!==key){lastResultId=key;saveStageResult(s.result);announce('Уровень '+(s.result.level+1)+' — '+s.result.stars+' ★ · '+s.result.elapsed+' с · падений: '+s.result.deaths,3.6);GameQuality.effect('star');}}
  if(previous&&s.stage!==previous.stage){prediction=null;lastPredStage=-1;snapshots=[];camera=0;particles=[];rings=[];GameJuice.clear();
    const next=stageDefs[s.stage];GameQuality.ambient(Math.floor(s.stage/9));announce('✦ Уровень '+(s.stage+1)+' — '+next.signature.subtitle,2.8);tone(600,.16,'sine',.055);}

  levelIndex=s.stage;phase=s.phase;connected=s.connected||connected;latest={...s,recvTime:performance.now()};
  GameQuality.ambient(Math.floor(Math.min(98,s.stage)/9));
  if((phase==='playing'||phase==='win')&&levelIndex<99)saveCheckpoint(levelIndex);
  level=structuredClone(stageDefs[levelIndex]);level.gateOpen=s.world.gateOpen;level.bridgeLatched=s.world.bridgeLatched;level.padLatched=!!s.world.padLatched;
  level.pads.forEach((p,i)=>p.pressed=!!s.world.pads[i]);
  level.walls.forEach((w,i)=>w.broken=!!s.world.walls[i]);
  level.crystals.forEach((c,i)=>c.on=!!s.world.crystals[i]);
  if(level.signature&&s.world.signature){
    const data=s.world.signature,z=level.signature;
    z.nodes.forEach((n,i)=>n.active=!!data.nodes[i]);
    z.pairs.forEach((p,i)=>p.active=!!data.pairs[i]);
    z.progress=data.progress||0;z.done=!!data.done;z.window=data.window||0;
    z.phase=data.phase||0;z.elapsed=data.elapsed||0;z.flash=data.flash||0;
  }
  collectibles=level.shards.map((x,i)=>({x,y:i%2?390:432,taken:!!s.world.shards[i]}));
  GameJuice.snapshot(previous,s,level);GameAdventure.onSnapshot(s);
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
      if(!before.done&&now.done){announce('✦ Особенность мира пройдена!',1.65);tone(980,.2,'sine',.04);}
    }
  }
  if(previous&&s.stage===previous.stage){
    if(!previous.world.gateOpen&&s.world.gateOpen){announce('✦ Ворота открыты! Оба к порталу.',2);tone(550,.2,'sine',.05);screenShake=7;}
    for(let i=0;i<level.walls.length;i++)if(!previous.world.walls[i]&&s.world.walls[i]){const w=level.walls[i];burst(w.x,w.y+w.h/2,colors.amber,30,200);screenShake=11;tone(180,.2,'sawtooth',.05);}
    for(let i=0;i<level.crystals.length;i++)if(!previous.world.crystals[i]&&s.world.crystals[i]){const c=level.crystals[i];burst(c.x,c.y,colors.blue,30,200);announce('Кристалл активирован ✦',2);tone(740,.2,'sine',.04);}
  }
  snapshots.push(latest);if(snapshots.length>12)snapshots.shift();
  if(phase==='playing')playingOnce=true;
  if(phase==='win'&&previous?.phase!=='win'){announce('Вы прошли игру вместе!',4);tone(740,.3,'sine',.06);}
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
    if(i===role&&phase==='playing'&&connected.every(Boolean)){
      if(!prediction||lastPredStage!==levelIndex||Math.abs(prediction.x-source.x)>260){prediction={x:source.x,y:source.y,vy:source.vy||0};lastPredStage=levelIndex;}
      const axis=Number(input.right)-Number(input.left);
      const lead=GameQuality.predictionLead();
      const desiredV=axis*(source.dash>0?760:273);
      prediction.x+=desiredV*dt;
      // Bound extrapolation to the plausible commands not yet acknowledged by the server.
      const ahead=Math.max(28,Math.abs(desiredV)*lead+32);
      prediction.x=Math.max(source.x-ahead,Math.min(source.x+ahead,prediction.x));
      if(!axis)prediction.x+=(source.x-prediction.x)*Math.min(1,dt*9);
      for(const wall of level.walls.filter(w=>!w.broken).concat(level.gateOpen?[]:level.gates)){
        if(source.x+30<=wall.x&&prediction.x+30>wall.x)prediction.x=wall.x-30;
        if(source.x>=wall.x+wall.w&&prediction.x<wall.x+wall.w)prediction.x=wall.x+wall.w;
      }
      if(predJumpAt&&performance.now()-predJumpAt<180&&source.grounded){prediction.vy=-486;predJumpAt=0;}
      prediction.vy=Math.min(950,prediction.vy+1300*dt);
      prediction.y+=prediction.vy*dt;
      if(source.grounded&&prediction.y>source.y){prediction.y=source.y;prediction.vy=0;}
      prediction.y+=(source.y-prediction.y)*Math.min(1,dt*9);
      if(Math.abs(prediction.y-source.y)>110){prediction.y=source.y;prediction.vy=source.vy;}
      x=prediction.x;y=prediction.y;
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
 GameAdventure.draw(ctx,level,P,latest?.world?.adventure,clock);
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
function drawPlayer(p){GameVisuals.player(ctx,p,clock);}
function draw(){background();if(level)drawWorld();else {ctx.fillStyle='#ffffff11';ctx.fillRect(0,544,1200,106);}if(phase==='win'){glowCircle(600,280,300,'#ffe6b720');}if(GameQuality.settings().graphics!=='low')GameVisuals.vignette(ctx,W,H);}
const RESULT_KEY='linked-light-stars-v11';
function saveStageResult(result){try{const all=JSON.parse(localStorage.getItem(RESULT_KEY)||'{}');
 const k=String(result.level),prev=all[k];if(!prev||result.stars>prev.stars||result.stars===prev.stars&&result.elapsed<prev.elapsed){all[k]={stars:result.stars,elapsed:result.elapsed,deaths:result.deaths};localStorage.setItem(RESULT_KEY,JSON.stringify(all));}}
 catch(e){console.warn('Result not saved',e);}}
GameQuality.init({getSession:()=>({phase,role,room}),onControls:(left,right)=>{if(left)keys.add('gamepad-left');else keys.delete('gamepad-left');if(right)keys.add('gamepad-right');else keys.delete('gamepad-right');updateInput();},onAction:activateKey});
GameQuality.ambient(0);
GameAdventure.init({send:wsSend,currentStage:()=>levelIndex,bestStage,inRoom:()=>!!room,startStage:(n)=>{if(room){if(role===0)wsSend({t:'selectStage',stage:n,secrets:GameAdventure.data().secrets.length});else announce('Уровни выбирает создатель комнаты.');}else createRoom(false,n);}});
openConnection();showUI();requestAnimationFrame(animate);
})();