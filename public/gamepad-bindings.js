/* Linked by Light — safe local gamepad button remapping.
   Standard layout only: stick/D-pad still control movement, 8/9 menu and 14/15
   D-pad movement cannot be assigned to hero actions. No server changes. */
(function(root,factory){
 'use strict';
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.GamePadBindings=api;
})(typeof window!=='undefined'?window:globalThis,function(root){
 'use strict';
 const KEY='linked-light-gamepad-v1';
 const ACTIONS=Object.freeze(['jump','ability','bond','emote']);
 const DEFAULT=Object.freeze({jump:0,ability:1,bond:2,emote:3});
 const ALLOWED=Object.freeze([0,1,2,3,4,5,6,7,10,11,12,13]);
 const LABELS=Object.freeze({jump:'Прыжок',ability:'Способность',bond:'Связь',emote:'Эмоция'});
 const ui=(key,vars)=>root.GameI18n?.ui?.('pad.'+key,vars)||'';
 const actionName=(key)=>ui(key)||LABELS[key];
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
   el.setAttribute('aria-label',ui('assign',{action:actionName(action),key:el.textContent}));
  });
 }
 function cancelCapture(){
  capture=null;captureArmed=false;
  render();
 }
 function pollCapture(pad){
  // Observe releases even while the settings dialog is open; a button used to
  // rebind must work on its next deliberate press, never during capture.
  for(const index of usedButtons)if(!pressed(pad,index))usedButtons.delete(index);
  if(!capture)return false;
  if(!pad){noticeText(ui('missing'));return true;}
  const down=ALLOWED.filter(n=>pressed(pad,n));
  if(!captureArmed){
   if(down.length===0){
    captureArmed=true;
    noticeText(ui('ready'));
   }
   return true;
  }
  if(down.length===0)return true;
  const target=down[0],action=capture;
  const success=set(action,target);
  if(success){
   usedButtons.add(target);
   cancelCapture();
   noticeText(ui('saved',{action:actionName(action),key:buttonName(target)}));
  }else noticeText(ui('invalid'));
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
  openButton.textContent=ui('open');openButton.setAttribute('aria-label',ui('openLabel'));
  parent.append(openButton);
  dialog=document.createElement('dialog');dialog.id='gamepadDialog';dialog.className='gamepad-dialog';
  const head=document.createElement('div');head.className='gamepad-head';
  const heading=document.createElement('strong');heading.textContent=ui('title');
  const close=document.createElement('button');close.type='button';close.id='gamepadClose';
  close.textContent='✕';close.setAttribute('aria-label',ui('close'));
  head.append(heading,close);dialog.append(head);
  const description=document.createElement('p');description.className='gamepad-note';
  description.textContent=ui('note');
  dialog.append(description);
  const rows=document.createElement('div');rows.className='gamepad-rows';
  for(const action of ACTIONS){
   const row=document.createElement('div');row.className='gamepad-row';
   const text=document.createElement('span');text.textContent=actionName(action);
   const button=document.createElement('button');button.type='button';
   button.dataset.padAction=action;
   button.addEventListener('click',()=>{
    cancelCapture();capture=action;captureArmed=false;
    noticeText(ui('capture',{action:actionName(action)}));
    button.textContent=ui('wait');
   });
   row.append(text,button);rows.append(row);
  }
  dialog.append(rows);
  notice=document.createElement('p');notice.className='gamepad-note';notice.id='gamepadNotice';
  notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
  notice.hidden=true;dialog.append(notice);
  const footer=document.createElement('div');footer.className='gamepad-actions';
  const defaults=document.createElement('button');defaults.type='button';
  defaults.id='gamepadDefault';defaults.textContent=ui('reset');
  defaults.addEventListener('click',()=>{reset();noticeText(ui('restored'));});
  const done=document.createElement('button');done.type='button';done.textContent=ui('done');
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
  function refreshLanguage(){
   openButton.textContent=ui('open');
   openButton.setAttribute('aria-label',ui('openLabel'));
   heading.textContent=ui('title');
   close.setAttribute('aria-label',ui('close'));
   description.textContent=ui('note');
   rows.querySelectorAll('.gamepad-row').forEach((row,i)=>{
    row.querySelector('span').textContent=actionName(ACTIONS[i]);
   });
   defaults.textContent=ui('reset');
   done.textContent=ui('done');
   render();
  }
  root.GameI18n?.subscribe?.(refreshLanguage);
  refreshLanguage();
 }
 return Object.freeze({KEY,ACTIONS,DEFAULT,ALLOWED,RESERVED,normalizeLayout,read,current,
  buttonFor,buttonName,pressed,active,set,reset,pollCapture,init});
});
