/* Linked by Light v28 — First Experience UI. All gameplay decisions stay server-side. */
(function(root){'use strict';
const $=id=>document.getElementById(id);
const create=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
let api={},roleSelect=null,soloButton=null,shareButton=null,readyStatus=null,hint=null,pingToggle=null,pingWheel=null;
let solo=false,activeRole=0,hostRole=0,pings=[],intel=[],currentStage=-1,connected=false,lastOffline=performance.now(),hintStage=-1,tipDismissed=false,pingKind='';
const types={here:['📍','Иди сюда'],wait:['✋','Подожди'],help:['❗','Помоги'],danger:['⚠️','Опасность'],go:['➡️','Вперёд'],look:['👀','Посмотри']};
const tips=[
 'Освойте движение и прыжок. Двигайтесь к порталу вдвоём.',
 'Исследуйте платформы и синхронизируйте прыжки.',
 'Искра использует рывок, Эхо — импульс.',
 'Один герой удерживает механизм, второй проходит.',
 'Не отходите слишком далеко от партнёра.',
 'Посмотрите на светящиеся площадки и разделите действия.',
 'Связь на G помогает взаимодействовать друг с другом.',
 'Нажмите T, чтобы оставить партнёру метку на карте.',
 'Сначала активируйте механизм, затем откройте ворота.',
 'Используйте движение, способности и помощь в финале обучения.'
];
function notify(text){api.announce?.(text,3);}
function selectedHostRole(){return roleSelect?.value==='1'?1:0;}
const controlRole=()=>solo?activeRole:api.role?.()??-1;
function message(m){
 if(m.t==='v28Ping'&&Number.isFinite(m.x)&&Number.isFinite(m.y)&&types[m.kind]){
  pings.push({kind:m.kind,x:m.x,y:m.y,role:m.role,until:performance.now()+5500});
  if(pings.length>10)pings.shift();
 }
 if(m.t==='v28Intel'&&Number.isInteger(m.stage)){
  intel=(Array.isArray(m.items)?m.items:[]).filter(x=>Number.isFinite(x.x)&&Number.isFinite(x.y)&&typeof x.text==='string').slice(0,6);
  currentStage=m.stage;
 }
}
function onJoined(m){
 solo=m.solo===true;hostRole=m.hostRole===1?1:0;activeRole=solo?(m.soloActiveRole===1?1:0):m.role;
 if(soloButton)soloButton.hidden=!!api.room?.();
 updatePingLabel();
}
function onSnapshot(s){
 if(!s)return;
 solo=s.solo===true;hostRole=s.hostRole===1?1:0;
 if(solo)activeRole=s.soloActiveRole===1?1:0;
 if(s.stage!==currentStage){currentStage=s.stage;pings=[];intel=[];tipDismissed=false;}
 updatePingLabel();
 if(hint){
  const show=Number.isInteger(s.stage)&&s.stage<10&&s.stage>=0&&s.phase==='playing'&&api.role?.()>=0&&!tipDismissed;
  hint.hidden=!show;
  if(show){
   const secs=Number(s.stats?.elapsed)||0;
   hint.querySelector('.v28-tip-title').textContent=(solo?'Соло · ':'Обучение · ')+'Уровень '+(s.stage+1)+'/10';
   hint.querySelector('.v28-tip-text').textContent=(secs>40?'Подсказка: ':'')+tips[s.stage]+(solo?' Нажмите Tab для смены героя.':'');
  }
 }
}
function connection(online){
 connected=!!online;if(!connected)lastOffline=performance.now();
 if(readyStatus&&connected)readyStatus.hidden=true;
}
function updateWake(){
 if(!readyStatus)return;
 const waiting=!connected&&performance.now()-lastOffline>3500;
 readyStatus.hidden=!waiting;
 if(waiting){
  const long=performance.now()-lastOffline>16000;
  readyStatus.querySelector('.v28-wake-text').textContent=long
   ?'Связь ещё устанавливается. Проверяем сервер и повторяем подключение.'
   :'Сервер пробуждается… Подключение повторится автоматически.';
 }
}
function startPing(kind){
 if(!api.inRoom?.()||api.phase?.()!=='playing')return notify('Метки доступны во время игры');
 pingKind=kind;pingWheel.hidden=true;notify('Нажмите на точку игрового поля для метки: '+types[kind][1]);
}
function pingAt(ev){
 if(!pingKind||api.phase?.()!=='playing')return;
 const canvas=api.canvas?.();if(!canvas)return;
 const rect=canvas.getBoundingClientRect();
 const x=Math.round((ev.clientX-rect.left)*canvas.width/rect.width+api.camera());
 const y=Math.round((ev.clientY-rect.top)*canvas.height/rect.height);
 if(!Number.isFinite(x)||!Number.isFinite(y))return;
 api.send?.({t:'v28Ping',kind:pingKind,x,y});
 pingKind='';
}
function togglePing(){if(!pingWheel||!api.inRoom?.())return notify('Сначала присоединитесь к комнате');pingWheel.hidden=!pingWheel.hidden;}
function updatePingLabel(){
 if(pingToggle)pingToggle.textContent=solo?'🔁 '+(activeRole===0?'Искра':'Эхо')+' · Tab':'📍 Метка · T';
}
function draw(ctx){
 const now=performance.now();
 pings=pings.filter(p=>p.until>now);
 ctx.save();ctx.textAlign='center';
 for(const p of pings){
  const [symbol]=types[p.kind];ctx.globalAlpha=Math.min(1,(p.until-now)/1200);
  ctx.font='bold 29px system-ui';ctx.fillStyle=p.role===0?'#ffe9bb':'#b9f9ff';
  ctx.fillText(symbol,p.x,p.y-20);ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(p.x,p.y,16+(p.until-now)%1700/120,0,Math.PI*2);ctx.stroke();
 }
 ctx.globalAlpha=1;
 for(const c of intel){
  ctx.fillStyle='#111d3cdd';ctx.strokeStyle='#b7dcfb';ctx.lineWidth=1.5;
  const w=Math.min(265,Math.max(95,ctx.measureText(c.text).width+20));
  ctx.beginPath();ctx.roundRect(c.x-w/2,c.y-35,w,30,6);ctx.fill();ctx.stroke();
  ctx.font='12px system-ui';ctx.fillStyle='#fff';ctx.fillText(c.text.slice(0,48),c.x,c.y-16);
 }
 ctx.restore();
}
async function shareInvite(){
 const room=api.room?.();if(!room)return notify('Сначала создайте комнату');
 const url=new URL(location.pathname,location.href);url.searchParams.set('room',room);
 const data={title:'Связанные светом',text:'Сыграем вместе в Linked by Light?',url:url.href};
 try{
  if(typeof navigator.share==='function'){await navigator.share(data);}
  else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(data.text+' '+data.url);notify('Ссылка скопирована');}
  else throw Error('Unavailable');
  api.send?.({t:'v28InviteShared'});
 }catch(e){
  if(e?.name==='AbortError')return;
  notify('Ссылка: '+url.href);
 }
}
function init(callbacks){
 api=callbacks;const menu=$('menuView'),lobby=$('lobbyView'),frame=$('frame');
 if(menu){
  const wrap=create('div','v28-role-selector');
  const label=create('label','', 'Выберите своего героя (устройство не имеет значения)');
  roleSelect=create('select');roleSelect.id='v28RoleSelect';
  for(const [v,t] of [['0','✦ Искра'],['1','◈ Эхо']]){const opt=create('option','',t);opt.value=v;roleSelect.append(opt);}
  label.append(roleSelect);wrap.append(label);
  soloButton=create('button','button-secondary','Играть одному · переключать героев');
  soloButton.id='v28SoloBtn';soloButton.type='button';soloButton.onclick=()=>api.createSolo?.();
  wrap.append(soloButton);menu.append(wrap);
 }
 if(lobby){
  shareButton=create('button','button-secondary','Поделиться приглашением');
  shareButton.id='v28ShareBtn';shareButton.type='button';shareButton.onclick=shareInvite;
  const bar=create('div','v28-share-line');bar.append(shareButton);lobby.append(bar);
 }
 if(frame){
  hint=create('aside','v28-tip');hint.id='v28Tutorial';hint.hidden=true;
  hint.append(create('strong','v28-tip-title','Обучение'),create('p','v28-tip-text',''));
  const close=create('button','v28-tip-close','×');close.setAttribute('aria-label','Скрыть подсказку');
  close.onclick=()=>{tipDismissed=true;hint.hidden=true;};hint.append(close);frame.append(hint);
  pingToggle=create('button','v28-ping-toggle','📍 Метка · T');pingToggle.id='v28PingToggle';
  pingToggle.onclick=()=>{if(solo)api.switchSolo?.();else togglePing();};frame.append(pingToggle);
  pingWheel=create('div','v28-ping-wheel');pingWheel.id='v28PingWheel';pingWheel.hidden=true;
  for(const [kind,[emoji,label]]of Object.entries(types)){
   const btn=create('button','v28-ping-option',emoji+' '+label);btn.type='button';
   btn.addEventListener('click',()=>startPing(kind));pingWheel.append(btn);
  }
  frame.append(pingWheel);
  api.canvas?.()?.addEventListener('pointerdown',pingAt);
 }
 readyStatus=create('div','v28-wake');readyStatus.id='v28Wake';readyStatus.hidden=true;
 readyStatus.append(create('span','v28-wake-spinner','✦'),create('span','v28-wake-text','Сервер пробуждается…'));
 const retry=create('button','v28-wake-retry','Повторить сейчас');retry.onclick=()=>api.reconnect?.();
 readyStatus.append(retry);document.querySelector('.statusbar')?.append(readyStatus);
 connection(api.connected?.()||false);
 setInterval(updateWake,1300);
}
root.GameV28={init,message,onJoined,onSnapshot,connection,selectedHostRole,controlRole,togglePing,draw,shareInvite};
})(typeof window!=='undefined'?window:globalThis);
