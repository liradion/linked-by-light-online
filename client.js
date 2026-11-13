(() => {
'use strict';
const W=1200,H=650,GROUND=GameStages.GROUND,stageDefs=GameStages.stages;
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id);
const overlay=$('overlay'),toastEl=$('toast');
const colors={amber:'#ffc17f',blue:'#80eff7'};
let levelIndex=0,level=structuredClone(stageDefs[0]),P=[],camera=0,clock=0;
let particles=[],rings=[],screenShake=0,collectibles=[],toastTimer=0;
let room='',role=-1,token='',phase='waiting',connected=[false,false],socket=null,ready=false;
let pendingRoom='',pendingCreate=false,connectedBefore=false,reconnectCount=0,wsTimer=null;
let latest=null,snapshots=[],fpsTime=performance.now(),sound=true,ac=null;
const keys=new Set(),input={left:false,right:false,jumpSeq:0,abilitySeq:0};
let latency=0,lastSend=0,playingOnce=false;
const qs=new URLSearchParams(location.search);const invite=qs.get('room');
if(invite&&/^[A-Z2-9]{6}$/i.test(invite))pendingRoom=invite.toUpperCase();
function roomToken(id){try{return localStorage.getItem('lightroom:'+id)||sessionStorage.getItem('lightroom:'+id)||'';}catch(_){return '';}}
function saveToken(id,t){try{localStorage.setItem('lightroom:'+id,t);sessionStorage.setItem('lightroom:'+id,t);}catch(_){}}
function setError(message){$('networkError').textContent=message;}
function wsSend(m){if(socket&&socket.readyState===WebSocket.OPEN)socket.send(JSON.stringify(m));}
function updateStatus(){const online=socket?.readyState===WebSocket.OPEN;
  $('statusDot').className='status-dot '+(online?'online':'offline');
  $('connectionStatus').textContent=online?'На связи':room?'Нет связи':'Подключение…';
  $('ping').textContent=online&&latency?`${latency} мс`:'';
}
function openConnection(){
  if(socket&&(socket.readyState===WebSocket.CONNECTING||socket.readyState===WebSocket.OPEN))return;
  clearTimeout(wsTimer);
  const protocol=location.protocol==='https:'?'wss:':'ws:';
  socket=new WebSocket(protocol+'//'+location.host+'/ws');ready=false;updateStatus();
  socket.addEventListener('open',()=>{
    reconnectCount=0;ready=true;connectedBefore=true;setError('');updateStatus();
    if(room||pendingRoom){const code=room||pendingRoom;wsSend({t:'join',room:code,token:token||roomToken(code)});}
    else if(pendingCreate){wsSend({t:'create'});pendingCreate=false;}
    else showUI();
  });
  socket.addEventListener('message',e=>{
    let m;try{m=JSON.parse(e.data);}catch(_){return;}
    if(m.t==='joined'){
      room=m.room;role=m.role;token=m.token;phase=m.phase;pendingRoom='';saveToken(room,token);
      history.replaceState({},'',location.pathname+'?room='+encodeURIComponent(room));
      connected=m.connected||[false,false];$('myRole').textContent=role===0?'Искра (ведущий)':'Эхо (гость)';
      setError('');resetKeys();showUI();return;
    }
    if(m.t==='members'){
      connected=m.connected||connected;phase=m.phase||phase;showUI();return;
    }
    if(m.t==='snapshot'){consumeSnapshot(m);return;}
    if(m.t==='error'){
      const msg=m.message||'Ошибка подключения.';
      if(room&&msg.includes('Комната не найдена')){room='';role=-1;token='';phase='waiting';latest=null;snapshots=[];history.replaceState({},'',location.pathname);}
      setError(msg);if(!room)pendingRoom='';showUI();return;
    }
    if(m.t==='pong'){
      if(Number.isFinite(m.sent)){latency=Math.max(0,Math.round(performance.now()-m.sent));updateStatus();}return;
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
function showUI(){
  updateStatus();
  $('slot0').textContent=connected[0]?'● В сети':'○ Нет подключения';
  $('slot1').textContent=connected[1]?'● В сети':'○ Ожидаем игрока';
  $('roomCode').textContent=room||'------';
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
function createRoom(){setError('');pendingCreate=true;pendingRoom='';if(!ready)openConnection();else {wsSend({t:'create'});pendingCreate=false;}}
function joinRoom(code){const value=(code||'').trim().toUpperCase();if(!/^[A-HJ-NP-Z2-9]{6}$/.test(value)){setError('Введите шестизначный код комнаты.');return;}
  pendingRoom=value;setError('');if(ready)wsSend({t:'join',room:value,token:roomToken(value)});else openConnection();
}
$('createBtn').addEventListener('click',createRoom);
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
$('soundBtn').addEventListener('click',()=>{sound=!sound;$('soundBtn').textContent=sound?'♫ Вкл.':'♫ Выкл.';});
function resetKeys(){keys.clear();input.left=false;input.right=false;
  document.querySelectorAll('.touch-button').forEach(b=>b.classList.remove('pressed'));sendInput();}
function updateInput(){const left=role===0?'a':'arrowleft',right=role===0?'d':'arrowright';
  input.left=keys.has(left)||keys.has('touch-left');input.right=keys.has(right)||keys.has('touch-right');sendInput();}
function activateKey(kind){if(kind==='jump')input.jumpSeq++;else input.abilitySeq++;sendInput();}
const prevent=new Set(['arrowleft','arrowright','arrowup','arrowdown',' ','enter']);
window.addEventListener('keydown',e=>{
  if(document.activeElement?.tagName==='INPUT')return;
  const k=e.key.toLowerCase();if(prevent.has(k))e.preventDefault();
  if(e.repeat||!room||phase!=='playing')return;
  if(k==='r'&&role===0){wsSend({t:'resetStage'});return;}
  const left=role===0?'a':'arrowleft',right=role===0?'d':'arrowright',jump=role===0?'w':'arrowup',ability=role===0?'f':'enter';
  if(k===jump)activateKey('jump');if(k===ability)activateKey('ability');
  if(k===left||k===right){keys.add(k);updateInput();}
});
window.addEventListener('keyup',e=>{keys.delete(e.key.toLowerCase());updateInput();});
window.addEventListener('blur',resetKeys);
document.addEventListener('visibilitychange',()=>{if(document.hidden)resetKeys();});
document.querySelectorAll('.touch-button').forEach(btn=>{
  const k=btn.dataset.input,tag='touch-'+k;
  function down(e){e.preventDefault();if(!room||phase!=='playing')return;
    if(!keys.has(tag)){
      keys.add(tag);btn.classList.add('pressed');if(k==='jump'||k==='ability')activateKey(k);else updateInput();
    }
    try{btn.setPointerCapture(e.pointerId);}catch(_){/* iOS fallback */}
  }
  function up(e){e.preventDefault();if(keys.delete(tag)){btn.classList.remove('pressed');updateInput();}}
  btn.addEventListener('pointerdown',down);btn.addEventListener('pointerup',up);btn.addEventListener('pointercancel',up);btn.addEventListener('lostpointercapture',()=>{keys.delete(tag);btn.classList.remove('pressed');updateInput();});
});
function sendInput(){if(!room||!ready||phase!=='playing')return;
  wsSend({t:'input',left:input.left,right:input.right,jumpSeq:input.jumpSeq,abilitySeq:input.abilitySeq});lastSend=performance.now();}
setInterval(()=>{if(ready&&room&&phase==='playing')sendInput();},40);
setInterval(()=>{if(ready)wsSend({t:'ping',sent:performance.now()});},3000);
function announce(msg,duration=2){toastEl.textContent=msg;toastEl.classList.add('visible');toastTimer=duration;}
function tone(freq,dur=.1,kind='sine',vol=.04){if(!sound)return;try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume();const osc=ac.createOscillator(),gain=ac.createGain();osc.type=kind;osc.frequency.value=freq;gain.gain.value=vol;gain.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+dur);osc.connect(gain);gain.connect(ac.destination);osc.start();osc.stop(ac.currentTime+dur);}catch(_){}}
function burst(x,y,color,n=12,speed=130){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=(.25+Math.random()*.75)*speed;const ttl=.4+Math.random()*.6;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-20,life:ttl,ttl,r:1.5+Math.random()*3,color});}if(particles.length>500)particles.splice(0,particles.length-500);}
function updateHUD(){ $('levelLabel').textContent=`ГЛАВА 0${levelIndex+1} / 03`; $('levelName').textContent=level.title;
  for(let i=0;i<3;i++)$('step'+(i+1)).className='step'+(i===levelIndex?' active':i<levelIndex?' complete':'');
  $('amberStatus').textContent=P[0]?.cool>0?'· '+P[0].cool.toFixed(1)+' c':'· Рывок готов';
  $('blueStatus').textContent=P[1]?.cool>0?'· '+P[1].cool.toFixed(1)+' c':'· Импульс готов';
  if(levelIndex===0)$('objective').textContent=level.gateOpen?'Ворота открыты — оба в портал!':`Плиты активны: ${level.pads.filter(p=>p.pressed).length}/2`;
  if(levelIndex===1)$('objective').textContent=level.gateOpen?'Мост закреплён — оба в портал!':!level.walls[0].broken?'Искра: разбейте стену рывком.':!level.crystals[0].on?'Искра держит плиту. Эхо пробуждает кристалл.':'Идите к порталу.';
  if(levelIndex===2)$('objective').textContent=level.gateOpen?'Последняя дверь открыта!':!level.walls[0].broken?'Искра: пробей стену.':!level.crystals[0].on?'Эхо: активируй кристалл.':`Одновременно встаньте на плиты: ${level.pads.filter(p=>p.pressed).length}/2`;
}
function consumeSnapshot(s){
  if(latest&&s.tick<latest.tick)return;
  const previous=latest;
  if(previous&&s.stage!==previous.stage){snapshots=[];camera=0;particles=[];rings=[];announce('✦ Новая глава: '+stageDefs[s.stage].title,2.3);tone(600,.16,'sine',.055);}
  levelIndex=s.stage;phase=s.phase;connected=s.connected||connected;latest={...s,recvTime:performance.now()};
  level=structuredClone(stageDefs[levelIndex]);level.gateOpen=s.world.gateOpen;level.bridgeLatched=s.world.bridgeLatched;
  level.pads.forEach((p,i)=>p.pressed=!!s.world.pads[i]);
  level.walls.forEach((w,i)=>w.broken=!!s.world.walls[i]);
  level.crystals.forEach((c,i)=>c.on=!!s.world.crystals[i]);
  collectibles=level.shards.map((x,i)=>({x,y:i%2?390:432,taken:!!s.world.shards[i]}));
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
function renderPlayers(){
  if(!latest){P=[{type:0,x:180,y:GROUND-43,w:30,h:43,face:1,grounded:true,cool:0,dash:0,abilityFx:0,trail:[],breathe:0},{type:1,x:250,y:GROUND-43,w:30,h:43,face:1,grounded:true,cool:0,dash:0,abilityFx:0,trail:[],breathe:1}];return;}
  const at=performance.now()-95;
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
    return {...source,x,y,type:i,w:30,h:43,trail:[],breathe:i*2};
  });
  updateHUD();
}
function animate(ts){
  const dt=Math.min(.033,Math.max(0,(ts-fpsTime)/1000));fpsTime=ts;clock+=dt;
  if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)toastEl.classList.remove('visible');}
  for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=95*dt;p.life-=dt;}
  particles=particles.filter(p=>p.life>0);
  for(const r of rings){r.life-=dt;r.r+=(r.max-r.r)*dt*5.5;}rings=rings.filter(r=>r.life>0);
  screenShake=Math.max(0,screenShake-35*dt);
  renderPlayers();
  const target=Math.max(0,Math.min(level.width-W,((P[0].x+P[1].x)/2)-W/2+90));
  camera+=(target-camera)*Math.min(1,dt*3.2);
  draw();requestAnimationFrame(animate);
}
function bridgeActive(){return level.bridgeLatched||(levelIndex===1&&level.pads[0].pressed)||(levelIndex===2&&level.crystals[0].on);}
function portalReady(){return level.gateOpen;}
function roundRect(x,y,w,h,r,fill){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill)ctx.fill();}
function gradient(x0,y0,x1,y1,stops){const g=ctx.createLinearGradient(x0,y0,x1,y1);for(const [s,c] of stops)g.addColorStop(s,c);return g;}
function glowCircle(x,y,r,color,alpha=1){ctx.save();ctx.globalAlpha=alpha;const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'#0000');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.restore();}
function background(){const palette=[['#0b1330','#24244e','#2c2852'],['#071c2e','#182b49','#29314d'],['#181231','#312048','#322453']][levelIndex]||['#0b1330','#24244e','#2c2852'];ctx.fillStyle=gradient(0,0,0,H,[[0,palette[0]],[.57,palette[1]],[1,palette[2]]]);ctx.fillRect(0,0,W,H);
 glowCircle(180-camera*.06,125,290,levelIndex===1?'#4ccbbd35':'#a085ef27');glowCircle(950-camera*.05,245,330,levelIndex===2?'#f9aeb92c':'#7aabf21d');
 for(let i=0;i<80;i++){const x=((i*197.7-camera*.13)%1270+1270)%1270-40,y=25+((i*83.31)%465);const a=.16+.38*(.5+.5*Math.sin(clock*.6+i*2.1));ctx.fillStyle=`rgba(234,227,255,${a})`;ctx.beginPath();ctx.arc(x,y,i%9===0?1.6:.8,0,Math.PI*2);ctx.fill();}
 const moonX=955-camera*.07,moonY=157;glowCircle(moonX,moonY,86,'#a2cbe82e');ctx.fillStyle='#e0deff1c';ctx.beginPath();ctx.arc(moonX,moonY,45,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#d1e4ff23';ctx.lineWidth=1;ctx.stroke();
 ctx.save();ctx.translate(-camera*.20,0);for(let i=0;i<14;i++){const x=i*145-130,h=125+Math.sin(i*2.1)*45;ctx.fillStyle=i%2?'#141d3c77':'#111b367c';ctx.beginPath();ctx.moveTo(x,GROUND+25);ctx.lineTo(x+72,GROUND+25-h);ctx.lineTo(x+147,GROUND+25);ctx.fill();}ctx.restore();
 ctx.save();ctx.translate(-camera*.42,0);for(let i=0;i<20;i++){const x=i*108-80;const h=90+55*Math.abs(Math.sin(i*1.71));ctx.fillStyle='#11172c8e';ctx.fillRect(x,GROUND+30-h,73,h);ctx.strokeStyle='#aab8f014';ctx.strokeRect(x+10,GROUND+39-h,50,h);for(let j=0;j<4;j++){ctx.fillStyle='#fdd5b315';ctx.fillRect(x+18,GROUND+48-h+j*21,5,9);ctx.fillRect(x+50,GROUND+48-h+j*21,5,9);}}ctx.restore();
 // floating motes
 for(let i=0;i<20;i++){const x=((i*127+clock*9*(i%2?1:-1))%1260+1260)%1260,y=140+(i*47%350)+Math.sin(clock+i)*15;glowCircle(x,y,6,i%2?'#93f1f563':'#ffd29852',.35);}
}
function drawPlatform(s){let x=s.x,y=s.y,w=s.w,h=s.h;if(x+w<camera-20||x>camera+W+20)return;const isBridge=s.kind==='bridge';ctx.save();ctx.shadowBlur=isBridge?22:8;ctx.shadowColor=isBridge?'#76f5f8aa':'#584b9370';ctx.fillStyle=isBridge?'#30687b':'#303450';roundRect(x,y,w,Math.max(h,14),5,true);ctx.shadowBlur=0;ctx.fillStyle=isBridge?'#a7f9ff':'#8582ac';roundRect(x,y,w,5,2,true);ctx.fillStyle=isBridge?'#79d5eb28':'#9a8cbd14';for(let i=x+20;i<x+w-10;i+=36)roundRect(i,y+10,16,4,2,true);ctx.restore();}
function drawWorld(){ctx.save();ctx.translate(Math.round(-camera+(Math.random()-.5)*screenShake),0);
 // thin skyline hanging structures
 for(let x=170;x<level.width;x+=365){ctx.strokeStyle='#cbccff17';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,-10);ctx.lineTo(x,70+Math.sin(x)*18);ctx.stroke();glowCircle(x,76,11,'#b9aaff66');}
 // ground shadows
 for(const [x0,x1] of level.floor){ctx.fillStyle=gradient(0,GROUND,0,650,[[0,'#353955'],[.3,'#24293f'],[1,'#111827']]);ctx.fillRect(x0,GROUND,x1-x0,H-GROUND);ctx.fillStyle='#9e95b8';ctx.fillRect(x0,GROUND,x1-x0,5);ctx.fillStyle='#a1a9df12';for(let x=x0+18;x<x1-15;x+=40){ctx.fillRect(x,GROUND+18,21,3);ctx.fillRect(x+7,GROUND+53,12,2);} }
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
 drawPortal(level.portal,GROUND-65,portalReady());
 // environmental hints
 ctx.textAlign='center';ctx.font='700 14px system-ui';ctx.fillStyle='#f5e5ff88';for(const w of level.walls)if(!w.broken)ctx.fillText('ИСКРА · F',w.x+w.w/2,w.y-22);for(const crystal of level.crystals)if(!crystal.on)ctx.fillText('ЭХО · ENTER',crystal.x,crystal.y-56);
 // particles behind character
 for(const r of rings){ctx.globalAlpha=Math.max(0,r.life/r.ttl)*.7;ctx.strokeStyle=r.color;ctx.lineWidth=5*(r.life/r.ttl)+1;ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
 P.forEach(drawPlayer);
 for(const pt of particles){ctx.globalAlpha=Math.max(0,pt.life/pt.ttl);ctx.fillStyle=pt.color;ctx.beginPath();ctx.arc(pt.x,pt.y,pt.r*Math.max(.25,pt.life/pt.ttl),0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
 ctx.restore();}
function drawPortal(x,y,active){const pulse=1+.11*Math.sin(clock*3);glowCircle(x,y,active?105:54,active?'#b5b7ff5f':'#b9acfa21');ctx.save();ctx.translate(x,y);ctx.strokeStyle=active?'#ded5ff':'#7776a2';ctx.lineWidth=8;ctx.shadowBlur=active?25:6;ctx.shadowColor='#a5aafc';ctx.beginPath();ctx.ellipse(0,0,34*pulse,60*pulse,0,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle=active?gradient(-30,-60,33,62,[[0,'#8fbbed60'],[.5,'#c79afc73'],[1,'#9deaf97e']]):'#9886b520';ctx.beginPath();ctx.ellipse(0,0,30*pulse,54*pulse,0,0,Math.PI*2);ctx.fill();for(let i=0;i<7;i++){let a=clock*(.3+i*.09)+i*.91;ctx.fillStyle=active?i%2?'#ffe4c4':'#c6ffff':'#8c84bb';ctx.beginPath();ctx.arc(Math.cos(a)*39,Math.sin(a)*65,2.5,0,Math.PI*2);ctx.fill();}ctx.textAlign='center';ctx.font='800 12px system-ui';ctx.fillStyle=active?'#f8eaff':'#aaa7cd';ctx.fillText(active?'ОБА СЮДА':'ЗАКРЫТО',0,-86);ctx.restore();}
function drawPlayer(p){const c=p.type?colors.blue:colors.amber,bob=p.grounded?Math.sin(clock*5+p.breathe)*1.2:0,cx=p.x+p.w/2,cy=p.y+p.h/2+bob;for(const trail of p.trail){ctx.globalAlpha=.07*(trail.life/trail.ttl);ctx.fillStyle=c;ctx.beginPath();ctx.arc(trail.x,trail.y,14*(trail.life/trail.ttl),0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;glowCircle(cx,cy,50,c,p.abilityFx>0?.38:.20);ctx.save();ctx.translate(cx,cy);if(p.dash>0){ctx.globalAlpha=.35;ctx.fillStyle=c;roundRect(-38*p.face-12,-18,38,36,12,true);ctx.globalAlpha=1;}
 // scarf flutter
 ctx.fillStyle=p.type?'#3ebfcf':'#e98262';ctx.beginPath();ctx.moveTo(-p.face*4,-7);ctx.quadraticCurveTo(-p.face*(15+Math.sin(clock*12)*5),0,-p.face*27,8+Math.sin(clock*11)*5);ctx.lineTo(-p.face*4,7);ctx.fill();
 // boots
 ctx.fillStyle=p.type?'#3b899c':'#af6470';roundRect(-12,15,10,9,4,true);roundRect(3,15,10,9,4,true);
 // body
 ctx.shadowColor=c;ctx.shadowBlur=12;ctx.fillStyle=p.type?'#46b8c8':'#e58f64';roundRect(-15,-17,30,37,12,true);ctx.shadowBlur=0;
 // face mask
 ctx.fillStyle=p.type?'#c3faff':'#ffe4ad';roundRect(-12,-15,24,24,10,true);
 // eyes
 ctx.fillStyle='#29324b';roundRect(p.face===1?-1:-9,-7,4,6,2,true);roundRect(p.face===1?6:-2,-7,4,6,2,true);
 // hair/hood
 ctx.fillStyle=p.type?'#25829f':'#a65166';ctx.beginPath();ctx.ellipse(0,-16,15,10,0,Math.PI,Math.PI*2);ctx.fill();ctx.fillRect(-15,-17,30,5);
 // top glyph
 ctx.fillStyle='#ffffff';ctx.font='900 15px system-ui';ctx.textAlign='center';ctx.fillText(p.type?'◈':'✦',0,-31);
 // ability charging ring
 if(p.cool>0){ctx.strokeStyle=c+'66';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,26,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-p.cool/(p.type?1.05:1)));ctx.stroke();}
 ctx.restore();}
function draw(){background();if(level)drawWorld();else {ctx.fillStyle='#ffffff11';ctx.fillRect(0,544,1200,106);}if(phase==='win'){glowCircle(600,280,300,'#ffe6b720');}}
openConnection();showUI();requestAnimationFrame(animate);
})();
