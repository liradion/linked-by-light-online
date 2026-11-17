/* Linked by Light — safe local gamepad button remapping.
   Standard layout only: stick/D-pad still control movement, 8/9 menu and 14/15
   D-pad movement cannot be assigned to hero actions. No server changes. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.GamePadBindings=api;
})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const KEY='linked-light-gamepad-v1';
 const ACTIONS=Object.freeze(['jump','ability','bond','emote']);
 const DEFAULT=Object.freeze({jump:0,ability:1,bond:2,emote:3});
 const ALLOWED=Object.freeze([0,1,2,3,4,5,6,7,10,11,12,13]);
 const LABELS=Object.freeze({jump:'Прыжок',ability:'Способность',bond:'Связь',emote:'Эмоция'});
 const RESERVED=new Set([8,9,14,15]);
 let mappings={...DEFAULT},storage=null,dialog=null,openButton=null,capture=null;
 let notice=null,usedButtons=new Set(),captureArmed=false;
 const current=()=>({...mappings});
 const validNumber=n=>Number.isInteger(n)&&ALLOWED.includes(n);
 function normalizeLayout(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return {...DEFAULT};
  const candidate={};
  for(const action of ACTIONS)candidate[action]=validNumber(raw[action])?raw[action]:DEFAULT[action];
  return new Set(Object.values(candidate)).size===ACTIONS.length?candidate:{...DEFAULT};
 }
 function read(store){
  try{const raw=store?.getItem(KEY);mappings=normalizeLayout(raw?JSON.parse(raw):null);}
  catch(_){mappings={...DEFAULT};}
  return current();
 }
 function buttonFor(action){
  return ACTIONS.includes(action)?mappings[action]:null;
 }
 function buttonName(n){
  return ({0:'A / ✕',1:'B / ○',2:'X / □',3:'Y / △',4:'LB / L1',5:'RB / R1',
   6:'LT / L2',7:'RT / R2',10:'L3',11:'R3',12:'D ↑',13:'D ↓'})[n]||('Кнопка '+n);
 }
 function set(action,index){
  if(!ACTIONS.includes(action)||!validNumber(index))return false;
  if(ACTIONS.some(key=>key!==action&&mappings[key]===index))return false;
  mappings[action]=index;
  try{storage?.setItem(KEY,JSON.stringify(mappings));}catch(_){}
  render();
  return true;
 }
 function reset(){
  mappings={...DEFAULT};
  usedButtons.clear();cancelCapture();
  try{storage?.setItem(KEY,JSON.stringify(mappings));}catch(_){}
  render();
 }
 function pressed(pad,index){
  const entry=pad?.buttons?.[index];
  return !!(entry&&(entry.pressed===true||Number(entry.value)>=.55));
 }
 function active(pad,action){
  const n=buttonFor(action);
  if(n===null||!pad)return false;
  if(usedButtons.has(n)){
   if(!pressed(pad,n))usedButtons.delete(n);
   return false;
  }
  return pressed(pad,n);
 }
 function noticeText(value){
  if(notice){notice.textContent=value;notice.hidden=!value;}
 }
 function render(){
  if(!dialog)return;
  dialog.querySelectorAll('[data-pad-action]').forEach(el=>{
   const action=el.dataset.padAction;
   el.textContent=buttonName(buttonFor(action));
   el.setAttribute('aria-label','Назначить '+LABELS[action]+': '+el.textContent);
  });
 }
 function cancelCapture(){
  capture=null;captureArmed=false;
  render();
 }
 function pollCapture(pad){
  if(!capture)return false;
  if(!pad){noticeText('Подключите геймпад и нажмите любую назначаемую кнопку.');return true;}
  const down=ALLOWED.filter(n=>pressed(pad,n));
  if(!captureArmed){
   if(down.length===0){
    captureArmed=true;
    noticeText('Теперь нажмите кнопку на геймпаде. Кнопки меню и движения зарезервированы.');
   }
   return true;
  }
  if(down.length===0)return true;
  const target=down[0],action=capture;
  const success=set(action,target);
  if(success){
   usedButtons.add(target);
   cancelCapture();
   noticeText('Сохранено: '+LABELS[action]+' — '+buttonName(target)+'. Отпустите кнопку.');
  }else noticeText('Кнопка занята другим действием. Отпустите её и выберите другую.');
  captureArmed=false;
  return true;
 }
 function init(api={}){
  storage=api.storage||(()=>{try{return localStorage;}catch(_){return null;}})();
  read(storage);
  if(typeof document==='undefined'||dialog)return;
  const parent=document.querySelector('.topline > div:last-of-type');
  if(!parent)return;
  openButton=document.createElement('button');
  openButton.type='button';openButton.id='gamepadOpen';openButton.className='mini-btn';
  openButton.textContent='🎮 Геймпад';openButton.setAttribute('aria-label','Настроить кнопки геймпада');
  parent.append(openButton);
  dialog=document.createElement('dialog');dialog.id='gamepadDialog';dialog.className='gamepad-dialog';
  const head=document.createElement('div');head.className='gamepad-head';
  const heading=document.createElement('strong');heading.textContent='🎮 Настройка геймпада';
  const close=document.createElement('button');close.type='button';close.id='gamepadClose';
  close.textContent='✕';close.setAttribute('aria-label','Закрыть настройки геймпада');
  head.append(heading,close);dialog.append(head);
  const description=document.createElement('p');description.className='gamepad-note';
  description.textContent='Подключите стандартный геймпад. Левый стик и крестовина — движение. Нажмите действие, отпустите все кнопки и нажмите новую. Старт, меню и ←/→ крестовины зарезервированы.';
  dialog.append(description);
  const rows=document.createElement('div');rows.className='gamepad-rows';
  for(const action of ACTIONS){
   const row=document.createElement('div');row.className='gamepad-row';
   const text=document.createElement('span');text.textContent=LABELS[action];
   const button=document.createElement('button');button.type='button';
   button.dataset.padAction=action;
   button.addEventListener('click',()=>{
    cancelCapture();capture=action;captureArmed=false;
    noticeText('Отпустите все кнопки геймпада перед назначением: '+LABELS[action]+'.');
    button.textContent='Ждём кнопку…';
   });
   row.append(text,button);rows.append(row);
  }
  dialog.append(rows);
  notice=document.createElement('p');notice.className='gamepad-note';notice.id='gamepadNotice';
  notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
  notice.hidden=true;dialog.append(notice);
  const footer=document.createElement('div');footer.className='gamepad-actions';
  const defaults=document.createElement('button');defaults.type='button';
  defaults.id='gamepadDefault';defaults.textContent='По умолчанию';
  defaults.addEventListener('click',()=>{reset();noticeText('Стандартная схема восстановлена.');});
  const done=document.createElement('button');done.type='button';done.textContent='Готово';
  footer.append(defaults,done);dialog.append(footer);
  document.body.append(dialog);
  const closeDialog=()=>{
   cancelCapture();
   if(dialog.open)dialog.close();
  };
  close.addEventListener('click',closeDialog);done.addEventListener('click',closeDialog);
  dialog.addEventListener('close',cancelCapture);
  dialog.addEventListener('click',event=>{if(event.target===dialog)closeDialog();});
  openButton.addEventListener('click',()=>{cancelCapture();noticeText('');render();if(!dialog.open)dialog.showModal();});
  render();
 }
 return Object.freeze({KEY,ACTIONS,DEFAULT,ALLOWED,RESERVED,normalizeLayout,read,current,
  buttonFor,buttonName,pressed,active,set,reset,pollCapture,init});
});
