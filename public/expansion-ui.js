/* v17-v19: shared room notes, quick signals, screenshot, safe map constructor and endings. */
(function(root){'use strict';
const $=id=>document.getElementById(id),el=(tag,text,cls)=>{
 const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;
};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
let api={},dialog,body,tab='notes',notes=[],blueprint={v:1,title:'Наш световой маршрут',platforms:[]},lastDuets=0,lastEnding='';
const MAX_NOTES=24;
function normalize(raw){
 if(!raw||raw.v!==1||typeof raw.title!=='string'||!Array.isArray(raw.platforms)||raw.platforms.length>8)return null;
 const title=raw.title.trim().slice(0,38);
 if(!title)return null;
 const platform=[];
 for(const p of raw.platforms){
  if(!p||!Number.isInteger(p.x)||!Number.isInteger(p.y)||!Number.isInteger(p.w)||p.x<235||p.x>1380||p.y<288||p.y>483||p.w<55||p.w>190||p.x+p.w>1450)return null;
  platform.push({x:p.x,y:p.y,w:p.w,h:16});
 }
 return {v:1,title,platforms:platform};
}
function toStage(base,raw){
 const b=normalize(raw);if(!b)return structuredClone(base);
 const level=structuredClone(base);level.title=b.title;level.platforms=b.platforms;
 level.signature.done=true;level.shards=[];return level;
}
function haptic(pattern=15){try{if(navigator.vibrate)navigator.vibrate(pattern);}catch(_){}}
function onJoined(serverNotes){
 notes=Array.isArray(serverNotes)?serverNotes.slice(-MAX_NOTES):[];
 for(const note of notes)api.saveMemory?.(note);
 if(dialog?.open&&tab==='notes')render();
}
function onNote(note){
 if(!note||typeof note.text!=='string')return;
 notes.push({text:note.text.slice(0,160),role:note.role,at:note.at});notes=notes.slice(-MAX_NOTES);api.saveMemory?.(note);
 if(dialog?.open&&tab==='notes')render();
 haptic(12);
}
function onQuick(m){
 const labels={here:'Я здесь!',wait:'Подожди!',help:'Помоги!',heart:'♡'};
 if(m&&labels[m.kind]){api.announce?.((m.role===0?'Искра':'Эхо')+': '+labels[m.kind],2);haptic(13);}
}
function onSnapshot(s){
 const duet=s?.world?.expansion?.duets||0;
 if(duet>lastDuets){api.announce?.('✦ Резонанс вдвоём! Щит активирован.',2.5);haptic([30,30,30]);}
 lastDuets=duet;
 if(s?.phase==='win'&&s.ending){
  const key=s.ending.kind||'';if(lastEnding!==key){lastEnding=key;haptic([30,40,70]);}
  const title=document.querySelector('#winView .hero-title');
  const desc=document.querySelector('#winView .intro-copy');
  const label=document.querySelector('#winView .eyebrow');
  if(title)title.textContent=s.ending.title||'Вы прошли игру!';
  if(desc)desc.textContent=s.ending.text||'Ваше путешествие продолжается.';
  if(label)label.textContent=s.customLevel?'СОБСТВЕННАЯ КАРТА':'ВАША СОВМЕСТНАЯ КОНЦОВКА';
 }
}
function noteEditor(){
 const intro=el('p','Записки видят только участники комнаты. Последние 24 записки хранятся в комнате, до 40 попадают в ваш личный архив и синхронизируются с Google при входе.','adv-description');
 body.append(intro);
 const list=el('div',undefined,'exp-notes');
 if(!(api.getMemories?.()?.length||notes.length))list.append(el('p','Пока нет записок. Оставьте первую ✨','adv-mini'));
 const saved=api.getMemories?.()||[];
 const seen=new Set(),all=[...saved,...notes].filter(n=>{
  if(!n||typeof n.text!=='string')return false;
  const k=[n.at,n.role,n.text].join(':');if(seen.has(k))return false;seen.add(k);return true;
 }).sort((x,y)=>(x.at||0)-(y.at||0)).slice(-40);
 for(const n of all){
  const item=el('article',undefined,'exp-note');
  item.append(el('strong',n.role===0?'✦ Искра':'◈ Эхо'));
  item.append(el('p',n.text));list.append(item);
 }
 body.append(list);
 const input=el('textarea');input.maxLength=160;input.rows=2;input.placeholder='Напиши что-нибудь друг другу…';
 input.className='exp-input';body.append(input);
 const send=el('button','Отправить записку','adv-button');
 send.onclick=()=>{const text=input.value.trim();if(!text)return;
  if(api.inRoom?.())api.send?.({t:'note',text});
  else{const note={text,role:0,at:Date.now()};api.saveMemory?.(note);notify('Личная заметка сохранена на устройстве.');render();}
  input.value='';
 };
 body.append(send);
 body.append(el('h3','Быстрые сигналы'));
 const actions=el('div',undefined,'adv-options');
 for(const [kind,label] of [['here','📍 Я здесь'],['wait','✋ Подожди'],['help','❗ Помоги'],['heart','♡ Люблю']]){
  const b=el('button',label,'adv-button');b.onclick=()=>api.send?.({t:'quick',kind});actions.append(b);
 }
 body.append(actions);
}
function encode(map){
 const text=JSON.stringify(map),bytes=new TextEncoder().encode(text);
 let binary='';for(const b of bytes)binary+=String.fromCharCode(b);
 return 'LL1.'+btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function decode(code){
 const raw=String(code||'').trim();
 if(!/^LL1\.[A-Za-z0-9_-]{10,2400}$/.test(raw))return null;
 try{const base=raw.slice(4).replace(/-/g,'+').replace(/_/g,'/');
  const binary=atob(base);const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
  return normalize(JSON.parse(new TextDecoder().decode(bytes)));
 }catch(_){return null;}
}
function paintEditor(canvas){
 const ctx=canvas.getContext('2d'),width=canvas.width,height=canvas.height;
 ctx.clearRect(0,0,width,height);ctx.fillStyle='#111a31';ctx.fillRect(0,0,width,height);
 const sx=width/1660,sy=height/544;
 ctx.fillStyle='#42675e';ctx.fillRect(0,544*sy,width,4);
 ctx.fillStyle='#ffcd8f';ctx.fillRect(608*sx,529*sy,90*sx,5);ctx.fillStyle='#80eff7';ctx.fillRect(782*sx,529*sy,90*sx,5);
 ctx.fillStyle='#d8aeef';ctx.fillRect(1102*sx,350*sy,31*sx,194*sy);
 ctx.fillStyle='#a1f6d4';ctx.fillRect(1506*sx,465*sy,8,14);
 ctx.fillStyle='#c6b6ff';
 for(const p of blueprint.platforms)ctx.fillRect(p.x*sx,p.y*sy,p.w*sx,Math.max(3,p.h*sy));
 ctx.fillStyle='#f3eaff';ctx.font='12px system-ui';ctx.fillText('Коснитесь поля, чтобы поставить платформу (макс. 8)',12,18);
}
function renderEditor(){
 body.append(el('p','Создайте безопасную карту с собственными платформами. Две плиты и портал остаются обязательными. Создатель запускает карту в новой комнате, второй игрок получает её автоматически.','adv-description'));
 const title=el('input');title.className='exp-input';title.maxLength=38;title.value=blueprint.title;title.placeholder='Название уровня';
 title.oninput=()=>{blueprint.title=title.value.slice(0,38);};
 body.append(title);
 const canvas=el('canvas');canvas.className='exp-canvas';canvas.width=650;canvas.height=215;
 canvas.setAttribute('aria-label','Редактор платформ: нажмите, чтобы разместить платформу');body.append(canvas);
 canvas.addEventListener('click',e=>{
  if(blueprint.platforms.length>=8){return;}
  const r=canvas.getBoundingClientRect();
  const x=clamp(Math.round(((e.clientX-r.left)/r.width*1660)/20)*20,240,1340);
  const y=clamp(Math.round(((e.clientY-r.top)/r.height*544)/16)*16,288,480);
  blueprint.platforms.push({x,y,w:100,h:16});paintEditor(canvas);
 });
 paintEditor(canvas);
 const tools=el('div',undefined,'adv-options');
 const undo=el('button','↶ Убрать последнюю','adv-button');undo.onclick=()=>{blueprint.platforms.pop();paintEditor(canvas);};tools.append(undo);
 const clear=el('button','Очистить','adv-button');clear.onclick=()=>{blueprint.platforms=[];paintEditor(canvas);};tools.append(clear);
 const play=el('button','🎮 Создать комнату с картой','adv-button');play.onclick=()=>{
  const b=normalize(blueprint);if(!b){notify('Проверьте название и платформы.');return;}
  if(api.inRoom?.()){notify('Сначала завершите текущую комнату или откройте игру в другой вкладке.');return;}
  api.createCustom?.(b);dialog.close();
 };tools.append(play);
 body.append(tools);
 const code=el('textarea');code.className='exp-input';code.rows=3;code.placeholder='Здесь появится код карты или вставьте код друга';body.append(code);
 const actions=el('div',undefined,'adv-options');
 const share=el('button','📋 Код карты','adv-button');share.onclick=async()=>{
  const b=normalize(blueprint);if(!b){notify('Название карты недопустимо.');return;}
  code.value=encode(b);
  try{await navigator.clipboard.writeText(code.value);notify('Код карты скопирован.');}catch(_){notify('Скопируйте код из поля.');}
 };actions.append(share);
 const load=el('button','📥 Загрузить код','adv-button');load.onclick=()=>{
  const b=decode(code.value);if(!b){notify('Неверный код карты.');return;}
  blueprint=b;render();
 };actions.append(load);
 body.append(actions);
 body.append(el('p','Коды карт — это переносимый текст; публичного каталога и серверной публикации пока нет.','adv-mini'));
}
function notify(text){const n=$('exp-message');if(n)n.textContent=text;}
function savePhoto(){
 const c=$('game');if(!c)return;
 try{const url=c.toDataURL('image/png'),a=el('a');
  a.href=url;a.download='svyazannye-svetom-'+Date.now()+'.png';
  document.body.append(a);a.click();a.remove();notify('Кадр сохранён на устройстве.');}
 catch(_){notify('Браузер не разрешил сохранить кадр. Сделайте обычный скриншот.');}
}
function renderPhoto(){
 body.append(el('p','Сохраните памятный кадр текущего уровня. Фото создаётся на устройстве и не загружается на сервер.','adv-description'));
 const save=el('button','📸 Сохранить кадр PNG','adv-button');save.onclick=savePhoto;body.append(save);
}
function render(){
 if(!body)return;body.replaceChildren();
 if(tab==='notes')noteEditor();else if(tab==='editor')renderEditor();else renderPhoto();
 body.append(el('p',undefined,'adv-mini'));body.lastChild.id='exp-message';
}
function open(next){tab=next;render();if(!dialog.open)dialog.showModal();body.scrollTop=0;dialog.scrollTop=0;}
function init(callbacks){
 api=callbacks;
 const host=document.querySelector('.adv-nav')||document.querySelector('.topline');
 if(!host)return;
 const buttons=[['notes','💌 Записки'],['editor','🛠 Карты'],['photo','📸 Кадр']];
 for(const [id,label] of buttons){const b=el('button',label,'adv-button');b.onclick=()=>open(id);host.append(b);}
 dialog=el('dialog',undefined,'adv-dialog');dialog.id='exp-dialog';
 const head=el('div',undefined,'adv-dialog-head');head.append(el('strong','✦ Наше приключение'));const close=el('button','✕','adv-button');close.onclick=()=>dialog.close();head.append(close);dialog.append(head);
 body=el('div',undefined,'adv-dialog-body');dialog.append(body);document.body.append(dialog);
}
function drawWeather(ctx,width,height,weather,time,quality='high'){
 if(!weather||weather.kind==='clear')return;
 ctx.save();const n=quality==='low'?14:45;
 // A gentle 60-second day/night tint, driven by the authoritative world clock.
 const dusk=(1+Math.sin((weather.time||0)*.105-1.1))*.5;
 ctx.fillStyle='rgba(5,9,28,'+(0.05+dusk*.14).toFixed(3)+')';
 ctx.fillRect(0,0,width,height);
 if(weather.kind==='rain'){
  ctx.strokeStyle='#a2d8ff48';ctx.lineWidth=1.3;ctx.beginPath();
  for(let i=0;i<n;i++){const x=(i*83+time*175)%width,y=(i*139+time*440)%height;ctx.moveTo(x,y);ctx.lineTo(x-8,y+23);}ctx.stroke();
 }else if(weather.kind==='wind'){
  ctx.strokeStyle='#c2f2e744';ctx.beginPath();
  for(let i=0;i<n/3;i++){const x=(i*127+time*65)%width,y=110+(i*83)%380;ctx.moveTo(x,y);ctx.lineTo(x+24+Math.abs(weather.wind)*.3,y-3);}ctx.stroke();
 }else if(weather.kind==='mist'){
  const g=ctx.createLinearGradient(0,0,0,height);g.addColorStop(0,'#a3b6de18');g.addColorStop(1,'#d2defa23');ctx.fillStyle=g;ctx.fillRect(0,0,width,height);
 }else if(weather.kind==='stars'){
  ctx.fillStyle='#d7e6ff60';for(let i=0;i<n;i++){ctx.globalAlpha=.3+.4*Math.abs(Math.sin(time*1.7+i));ctx.fillRect((i*117)%width,40+(i*53)%(height-130),2,2);}
 }
 if(weather.resonance>0){ctx.strokeStyle='#d9ffff88';ctx.lineWidth=4;ctx.strokeRect(5,5,width-10,height-10);}
 ctx.restore();
}
root.GameExpansion={init,onJoined,onNote,onQuick,onSnapshot,toStage,drawWeather,normalize,encode,decode,haptic};
})(typeof window!=='undefined'?window:globalThis);