/* Linked by Light v28 — First Experience UI. All gameplay decisions stay server-side. */
(function(root){'use strict';
const $=id=>document.getElementById(id);
const loc=text=>root.GameV28Locale?.text(text,root.GameI18n?.getLanguage?.())??text;
const create=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=loc(text);return e;};
let api={},roleSelect=null,soloButton=null,shareButton=null,readyStatus=null,hint=null,pingToggle=null,pingWheel=null;
let solo=false,activeRole=0,hostRole=0,pings=[],intel=[],intelStage=-1,currentStage=-1,connected=false,lastOffline=performance.now(),tipDismissed=false,pingKind='',latestState=null,switchPending=false,pendingActiveRole=-1,switchRequestedAt=0;
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
function notify(text){api.announce?.(loc(text),3);}
function selectedHostRole(){return roleSelect?.value==='1'?1:0;}
const controlRole=()=>solo?activeRole:api.role?.()??-1;
function message(m){
 if(m.t==='v28Ping'&&Number.isFinite(m.x)&&Number.isFinite(m.y)&&types[m.kind]){
  pings.push({kind:m.kind,x:m.x,y:m.y,role:m.role,until:performance.now()+5500});
  if(pings.length>10)pings.shift();
 }
 if(m.t==='v28Intel'&&Number.isInteger(m.stage)){
  intel=(Array.isArray(m.items)?m.items:[]).filter(x=>Number.isFinite(x.x)&&Number.isFinite(x.y)&&typeof x.text==='string').slice(0,6);
  intelStage=m.stage;
 }
}
function onJoined(m){
 solo=m.solo===true;hostRole=m.hostRole===1?1:0;activeRole=solo?(m.soloActiveRole===1?1:0):m.role;
 switchPending=false;pendingActiveRole=-1;pingKind='';
 if(soloButton)soloButton.hidden=!!api.room?.();
 updatePingLabel();
}
function onSnapshot(s){
 if(!s)return;latestState=s;
 solo=s.solo===true;hostRole=s.hostRole===1?1:0;
 if(solo){
  activeRole=s.soloActiveRole===1?1:0;
  if(switchPending&&(activeRole===pendingActiveRole||performance.now()-switchRequestedAt>2500)){
   switchPending=false;pendingActiveRole=-1;
  }
 }else{switchPending=false;pendingActiveRole=-1;}
 if(s.stage!==currentStage){currentStage=s.stage;pings=[];if(intelStage!==s.stage)intel=[];tipDismissed=false;}
 updatePingLabel();
 if(hint){
  const show=Number.isInteger(s.stage)&&s.stage<10&&s.stage>=0&&s.phase==='playing'&&api.role?.()>=0&&!tipDismissed;
  hint.hidden=!show;
  if(show){
   const secs=Number(s.stats?.elapsed)||0;
   hint.querySelector('.v28-tip-title').textContent=loc(solo?'Соло · ':'Обучение · ')+loc('Уровень ')+(s.stage+1)+'/10';
   const level=api.level?.(),p=s.players?.[controlRole()];
   let context=tips[s.stage];
   if(p&&level){
    const nearbyWall=level.walls?.some((w,i)=>!s.world?.walls?.[i]&&Math.abs(w.x-p.x)<220);
    const nearbyCrystal=level.crystals?.some((c,i)=>!s.world?.crystals?.[i]&&Math.abs(c.x-p.x)<220);
    if(nearbyWall)context=controlRole()===0?'Преграда впереди: попробуйте рывок F (или кнопку способности).':'Преграду может разрушить Искра. Попросите её применить рывок.';
    else if(nearbyCrystal)context=controlRole()===1?'Кристалл рядом: нажмите Enter (или кнопку способности).':'Попросите Эхо активировать кристалл своим импульсом.';
   }
   hint.querySelector('.v28-tip-text').textContent=(secs>40?loc('Подсказка: '):'')+loc(context)+(solo?loc(root.matchMedia?.('(pointer:coarse)')?.matches?' Коснитесь кнопки смены героя.':' Нажмите Tab для смены героя.'):'');
  }
 }
}
function connection(online){
 const was=connected;connected=!!online;if(was&&!connected)lastOffline=performance.now();
 if(!connected){switchPending=false;pendingActiveRole=-1;pingKind='';}
 if(readyStatus&&connected)readyStatus.hidden=true;
 updatePingLabel();
}
function updateWake(){
 if(!readyStatus)return;
 const waiting=!connected&&performance.now()-lastOffline>3500;
 readyStatus.hidden=!waiting;
 if(waiting){
  const long=performance.now()-lastOffline>16000;
  readyStatus.querySelector('.v28-wake-text').textContent=loc(long
   ?'Связь ещё устанавливается. Проверяем сервер и повторяем подключение.'
   :'Сервер пробуждается… Подключение повторится автоматически.');
 }
}
function startPing(kind){
 if(!api.inRoom?.()||api.phase?.()!=='playing')return notify('Метки доступны во время игры');
 pingKind=kind;pingWheel.hidden=true;notify(loc('Нажмите на точку игрового поля для метки: ')+loc(types[kind][1]));
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
function requestSoloSwitch(){
 if(!solo||switchPending||!connected||api.role?.()<0||api.phase?.()!=='playing')return false;
 const target=1-activeRole;
 switchPending=true;pendingActiveRole=target;switchRequestedAt=performance.now();
 updatePingLabel();
 if(typeof api.switchSolo!=='function'){switchPending=false;pendingActiveRole=-1;updatePingLabel();return false;}
 api.switchSolo(target);
 return true;
}
function togglePing(){
 if(!pingWheel||!api.inRoom?.()||api.phase?.()!=='playing')return notify('Метки доступны во время игры');
 pingWheel.hidden=!pingWheel.hidden;updatePingLabel();
}
function updatePingLabel(){
 if(!pingToggle)return;
 const canUse=api.role?.()>=0&&!!api.inRoom?.()&&api.phase?.()==='playing';
 pingToggle.hidden=!canUse;
 if(!canUse||solo||!connected){if(pingWheel)pingWheel.hidden=true;if(!canUse||!connected)pingKind='';}
 pingToggle.disabled=!connected||(solo&&switchPending);
 pingToggle.textContent=solo?'🔁 '+loc(activeRole===0?'Искра':'Эхо')+(root.matchMedia?.('(pointer:coarse)')?.matches?'':' · Tab'):loc('📍 Метка · T');
 pingToggle.setAttribute('aria-label',loc(solo?(activeRole===0?'Переключить на Эхо':'Переключить на Искру'):'Поставить метку'));
 pingToggle.setAttribute('aria-pressed',String(!solo&&pingWheel&&!pingWheel.hidden));
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
  ctx.font='12px system-ui';ctx.fillStyle='#fff';ctx.fillText(loc(c.text).slice(0,48),c.x,c.y-16);
 }
 ctx.restore();
}
async function shareInvite(){
 const room=api.room?.();if(!room)return notify('Сначала создайте комнату');
 const url=new URL(location.pathname,location.href);url.searchParams.set('room',room);
 const data={title:loc('Связанные светом'),text:loc('Сыграем вместе в Linked by Light?'),url:url.href};
 try{
  if(typeof navigator.share==='function'){await navigator.share(data);}
  else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(data.text+' '+data.url);notify('Ссылка скопирована');}
  else throw Error('Unavailable');
  api.send?.({t:'v28InviteShared'});
 }catch(e){
  if(e?.name==='AbortError')return;
  notify(loc('Ссылка: ')+url.href);
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
  pingToggle.onclick=()=>{if(solo)requestSoloSwitch();else togglePing();};frame.append(pingToggle);
  pingWheel=create('div','v28-ping-wheel');pingWheel.id='v28PingWheel';pingWheel.hidden=true;
  for(const [kind,[emoji,label]]of Object.entries(types)){
   const btn=create('button','v28-ping-option',emoji+' '+loc(label));btn.type='button';btn.dataset.pingKind=kind;
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
 root.GameI18n?.subscribe?.(refreshLanguage);
 refreshLanguage();
 setInterval(updateWake,1300);
}
function refreshLanguage(){
 if(roleSelect)for(const opt of roleSelect.options)opt.textContent=loc(opt.value==='1'?'◈ Эхо':'✦ Искра');
 const roleLabel=roleSelect?.closest('label');
 if(roleLabel&&roleLabel.firstChild?.nodeType===3)roleLabel.firstChild.textContent=loc('Выберите своего героя (устройство не имеет значения)');
 if(soloButton)soloButton.textContent=loc('Играть одному · переключать героев');
 if(shareButton)shareButton.textContent=loc('Поделиться приглашением');
 if(pingWheel)for(const btn of pingWheel.querySelectorAll('[data-ping-kind]')){const [icon,label]=types[btn.dataset.pingKind];btn.textContent=icon+' '+loc(label);}
 if(hint){hint.querySelector('.v28-tip-close')?.setAttribute('aria-label',loc('Скрыть подсказку'));if(latestState)onSnapshot(latestState);}
 if(readyStatus){const retry=readyStatus.querySelector('.v28-wake-retry');if(retry)retry.textContent=loc('Повторить сейчас');updateWake();}
 updatePingLabel();
}
root.GameV28={init,message,onJoined,onSnapshot,connection,selectedHostRole,controlRole,togglePing,requestSoloSwitch,draw,shareInvite,localize:loc};
})(typeof window!=='undefined'?window:globalThis);
