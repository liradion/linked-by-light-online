/* Linked by Light — local, role-specific keyboard remapping.
   Pure mappings are shared with Node tests; no server protocol or save-schema changes. */
(function(root,factory){
  'use strict';
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.GameControls=api;
})(typeof window!=='undefined'?window:globalThis,function(root){
  'use strict';
  const KEY='linked-light-keybindings-v1';
  const ACTIONS=Object.freeze(['left','right','jump','ability']);
  const DEFAULT=Object.freeze([
    Object.freeze({left:'a',right:'d',jump:'w',ability:'f'}),
    Object.freeze({left:'arrowleft',right:'arrowright',jump:'arrowup',ability:'enter'})
  ]);
  // Fixed global shortcuts must not become movement keys (restart/skills/menu/bond).
  const RESERVED=new Set(['r','g','t','v','q','e','z','h','escape','tab','backspace','delete','?','/']);
  const names={left:'Влево',right:'Вправо',jump:'Прыжок',ability:'Способность'};
  const ui=(key,vars)=>root.GameI18n?.ui?.('controls.'+key,vars)||'';
  const actionName=(action)=>ui(action)||names[action];
  const clone=()=>DEFAULT.map(x=>({...x}));
  let mappings=clone(),storage=null,changed=()=>{},dialog=null,capture=null,openButton=null,notice=null;
  function normalize(value){
    if(typeof value!=='string')return '';
    const key=value.toLowerCase();
    return key===' '||key==='spacebar'?'space':key;
  }
  function allowed(key){
    return /^[a-z]$/.test(key)||['arrowleft','arrowright','arrowup','arrowdown','enter','space'].includes(key);
  }
  function valid(role,action,key,layout=mappings){
    if(role!==0&&role!==1)return false;
    if(!ACTIONS.includes(action))return false;
    key=normalize(key);
    if(!allowed(key)||RESERVED.has(key))return false;
    return !ACTIONS.some(x=>x!==action&&layout[role][x]===key);
  }
  function normalizeLayout(data){
    const result=clone();
    if(!Array.isArray(data)||data.length!==2)return result;
    for(let role=0;role<2;role++){
      const incoming=data[role];
      if(!incoming||typeof incoming!=='object'||Array.isArray(incoming))continue;
      const candidate={...result[role]};
      for(const action of ACTIONS){
        const key=normalize(incoming[action]);
        if(allowed(key)&&!RESERVED.has(key))candidate[action]=key;
      }
      if(new Set(ACTIONS.map(action=>candidate[action])).size===ACTIONS.length)
        result[role]=candidate;
    }
    return result;
  }
  function read(store){
    try{
      const raw=store?.getItem(KEY),parsed=raw?JSON.parse(raw):null;
      mappings=normalizeLayout(parsed);
    }catch(_){mappings=clone();}
    return current();
  }
  function current(){return mappings.map(x=>({...x}));}
  function keyFor(role,action){
    return mappings[role===1?1:0]?.[action]||DEFAULT[role===1?1:0]?.[action]||'';
  }
  function label(key){
    return {arrowleft:'←',arrowright:'→',arrowup:'↑',arrowdown:'↓',enter:'Enter',space:(ui('space')||'Пробел')}[normalize(key)]||String(key||'').toUpperCase();
  }
  function labelFor(role,action){return label(keyFor(role,action));}
  function isBound(key){key=normalize(key);return mappings.some(role=>ACTIONS.some(action=>role[action]===key));}
  function save(){
    try{storage?.setItem(KEY,JSON.stringify(mappings));}catch(_){}
  }
  function set(role,action,rawKey){
    const key=normalize(rawKey);
    if(!valid(role,action,key))return false;
    mappings[role][action]=key;save();changed(current());return true;
  }
  function reset(){
    mappings=clone();save();changed(current());
  }
  function showMessage(message){
    if(notice){notice.textContent=message;notice.hidden=!message;}
  }
  function updateLabels(){
    if(!dialog)return;
    dialog.querySelectorAll('[data-role][data-action]').forEach(button=>{
      button.textContent=labelFor(Number(button.dataset.role),button.dataset.action);
      button.setAttribute('aria-label',ui('assign',{action:actionName(button.dataset.action),hero:ui(button.dataset.role==='0'?'spark':'echo'),key:button.textContent}));
    });
  }
  function cancelCapture(){
    if(!capture)return;
    window.removeEventListener('keydown',capture.listener,true);
    capture=null;
    updateLabels();
  }
  function startCapture(role,action,button){
    cancelCapture();
    showMessage(ui('capture'));
    button.textContent=ui('wait');
    const listener=event=>{
      event.preventDefault();
      event.stopImmediatePropagation();
      if(event.key==='Escape'){cancelCapture();showMessage(ui('cancelled'));return;}
      if(event.ctrlKey||event.metaKey||event.altKey||event.repeat)return;
      const key=normalize(event.key);
      if(!set(role,action,key)){
        showMessage(ui('invalid',{key:label(key)}));
        return;
      }
      cancelCapture();showMessage(ui('saved'));
    };
    capture={listener};
    window.addEventListener('keydown',listener,true);
  }
  function init(api={}){
    storage=api.storage||(()=>{try{return localStorage;}catch(_){return null;}})();
    changed=typeof api.onChange==='function'?api.onChange:()=>{};
    read(storage);
    if(typeof document==='undefined'||dialog)return;
    const header=document.querySelector('.topline > div:last-of-type');
    if(!header)return;
    openButton=document.createElement('button');
    openButton.type='button';openButton.id='controlsOpen';
    openButton.className='mini-btn';openButton.textContent=ui('open');
    openButton.setAttribute('aria-label',ui('openLabel'));
    header.append(openButton);
    dialog=document.createElement('dialog');dialog.id='controlsDialog';dialog.className='controls-dialog';
    const heading=document.createElement('div');heading.className='controls-head';
    const title=document.createElement('strong');title.textContent=ui('title');
    const close=document.createElement('button');close.type='button';close.id='controlsClose';
    close.setAttribute('aria-label',ui('close'));close.textContent='✕';
    heading.append(title,close);dialog.append(heading);
    const description=document.createElement('p');description.className='controls-note';
    description.textContent=ui('note');
    dialog.append(description);
    const grid=document.createElement('div');grid.className='controls-grid';
    for(let role=0;role<2;role++){
      const group=document.createElement('section');group.className='controls-role';
      const header=document.createElement('strong');header.textContent=ui(role===0?'spark':'echo');group.append(header);
      for(const action of ACTIONS){
        const row=document.createElement('div');row.className='controls-row';
        const caption=document.createElement('span');caption.textContent=actionName(action);
        const button=document.createElement('button');button.type='button';
        button.dataset.role=String(role);button.dataset.action=action;
        button.addEventListener('click',()=>startCapture(role,action,button));
        row.append(caption,button);group.append(row);
      }
      grid.append(group);
    }
    dialog.append(grid);
    notice=document.createElement('p');notice.id='controlsNotice';notice.className='controls-note';
    notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
    notice.hidden=true;dialog.append(notice);
    const footer=document.createElement('div');footer.className='controls-actions';
    const resetButton=document.createElement('button');resetButton.type='button';
    resetButton.textContent=ui('reset');resetButton.addEventListener('click',()=>{
      cancelCapture();reset();updateLabels();showMessage(ui('restored'));
    });
    const done=document.createElement('button');done.type='button';
    done.textContent=ui('done');
    footer.append(resetButton,done);dialog.append(footer);document.body.append(dialog);root.GameI18n?.mountDialogLanguage?.(dialog);
    const closeDialog=()=>{cancelCapture();if(dialog.open)dialog.close();};
    close.addEventListener('click',closeDialog);done.addEventListener('click',closeDialog);
    dialog.addEventListener('close',cancelCapture);
    dialog.addEventListener('click',event=>{if(event.target===dialog)closeDialog();});
    openButton.addEventListener('click',()=>{
      cancelCapture();showMessage('');updateLabels();
      if(!dialog.open)dialog.showModal();
    });
    function refreshLanguage(){
      openButton.textContent=ui('open');
      openButton.setAttribute('aria-label',ui('openLabel'));
      title.textContent=ui('title');
      close.setAttribute('aria-label',ui('close'));
      description.textContent=ui('note');
      grid.querySelectorAll('.controls-role').forEach((group,role)=>{
        group.querySelector('strong').textContent=ui(role===0?'spark':'echo');
        group.querySelectorAll('.controls-row').forEach((row,i)=>{
          row.querySelector('span').textContent=actionName(ACTIONS[i]);
        });
      });
      resetButton.textContent=ui('reset');
      done.textContent=ui('done');
      updateLabels();
    }
    root.GameI18n?.subscribe?.(refreshLanguage);
    refreshLanguage();changed(current());
  }
  return Object.freeze({KEY,ACTIONS,DEFAULT,RESERVED,normalize,normalizeLayout,valid,read,current,keyFor,label,labelFor,isBound,set,reset,init});
});
