/* G4 local diagnostics. Explicit, user-initiated export only.
 * No network calls, persistent identifiers, tokens, room codes, URLs, free text,
 * raw user-agent strings, precise location or automatic telemetry. */
(function(root,factory){
 'use strict';
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.GameG4QA=api;
})(typeof window!=='undefined'?window:globalThis,function(root){
 'use strict';
 const number=(v,min,max,precision=0)=>typeof v==='number'&&Number.isFinite(v)?
  Math.round(Math.max(min,Math.min(max,v))*10**precision)/10**precision:null;
 const role=v=>v===0||v===1?v:null;
 const phase=v=>['waiting','playing','win'].includes(v)?v:'unknown';
 const twoNumbers=(array,min,max)=>[0,1].map(i=>number(array?.[i],min,max));
 const boolean=v=>v===true;
 function buildDiagnostic(raw={},metrics={},device={},timestamp=''){
  const s=raw&&typeof raw==='object'?raw:{};
  const m=metrics&&typeof metrics==='object'?metrics:{};
  const d=device&&typeof device==='object'?device:{};
  const world=s.world&&typeof s.world==='object'?s.world:{};
  const stats=s.stats&&typeof s.stats==='object'?s.stats:{};
  const checkpoint=world.checkpoint&&typeof world.checkpoint==='object'?world.checkpoint:{};
  return {
   schema:'linked-light-g4-local-v1',
   recordedAt:typeof timestamp==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(timestamp)&&
     Number.isFinite(Date.parse(timestamp))?timestamp:null,
   level:Number.isInteger(s.stage)&&s.stage>=0&&s.stage<=136?s.stage+1:null,
   playerRole:role(s.role),
   phase:phase(s.phase),
   connection:{ready:boolean(s.ready),bothPlayersConnected:[0,1].map(i=>s.connected?.[i]===true),reconnectCount:number(s.reconnectCount,0,9999)},
   play:{elapsedSeconds:number(stats.elapsed,0,86400,1),deaths:number(stats.deaths,0,9999),
    rescues:number(stats.rescues,0,9999),abilities:twoNumbers(stats.abilities,0,9999),
    gateOpen:boolean(world.gateOpen),checkpointIndex:number(checkpoint.index,-1,99),
    checkpointRecoveries:twoNumbers(checkpoint.recoveries,0,9999)},
   performance:{rttMs:number(m.rtt,0,5000),jitterMs:number(m.jitter,0,5000),
    fps:number(m.fps,0,360),bufferMs:number(m.buffer,0,1000),
    snapshotHz:number(m.snapshotHz,0,120),
    quality:['low','medium','high'].includes(m.quality)?m.quality:'unknown'},
   display:{touch:boolean(d.touch),landscape:boolean(d.landscape),
    reducedMotion:boolean(d.reducedMotion)}
  };
 }
 let getSession=()=>({}),launch=null,dialog=null,preview=null,state=null;
 const english=()=>root.GameI18n?.isEnglish?.()===true;
 const text=(ru,en)=>english()?en:ru;
 function current(){
  const touch=!!root.matchMedia?.('(pointer:coarse)').matches;
  const landscape=typeof root.innerWidth==='number'&&typeof root.innerHeight==='number'&&root.innerWidth>root.innerHeight;
  return buildDiagnostic(getSession(),root.GameQuality?.stats?.()||{},
   {touch,landscape,reducedMotion:root.GameQuality?.settings?.()?.reducedMotion===true},new Date().toISOString());
 }
 function refresh(){
  if(!dialog)return;
  launch.textContent=text('◎ Диагностика G4','◎ G4 diagnostics');
  dialog.querySelector('#g4QaTitle').textContent=text('Локальная диагностика игры','Local game diagnostics');
  dialog.querySelector('#g4QaDescription').textContent=text(
   'Проверьте данные перед передачей тестировщику. Они не отправляются автоматически; коды комнат и ключи доступа не включаются.',
   'Review the details before sharing. Nothing is uploaded automatically; room codes and access tokens are excluded.');
  dialog.querySelector('#g4QaRefresh').textContent=text('Обновить','Refresh');
  dialog.querySelector('#g4QaCopy').textContent=text('Скопировать','Copy');
  dialog.querySelector('#g4QaSave').textContent=text('Сохранить JSON','Save JSON');
  dialog.querySelector('#g4QaClose').textContent=text('Закрыть','Close');
  dialog.querySelector('#g4QaClose').setAttribute('aria-label',text('Закрыть диагностику','Close diagnostics'));
 }
 function render(){
  if(!preview)return;
  preview.textContent=JSON.stringify(current(),null,2);
  if(state)state.textContent='';
 }
 function open(){if(!dialog)return;refresh();render();if(!dialog.open)dialog.showModal();}
 async function copy(){
  if(!preview)return;
  try{
   await root.navigator.clipboard.writeText(preview.textContent);
   state.textContent=text('Скопировано. Перед отправкой проверьте отчёт.','Copied. Review before sharing.');
  }catch(_){state.textContent=text('Буфер недоступен. Используйте «Сохранить JSON».','Clipboard unavailable. Use Save JSON.');}
 }
 function save(){
  if(!preview)return;
  try{
   const blob=new root.Blob([preview.textContent],{type:'application/json;charset=utf-8'});
   const url=root.URL.createObjectURL(blob),a=root.document.createElement('a');
   a.href=url;a.download='linked-light-g4-local-diagnostic.json';a.style.display='none';
   root.document.body.append(a);a.click();a.remove();root.setTimeout(()=>root.URL.revokeObjectURL(url),0);
   state.textContent=text('Файл сохранён локально.','File saved locally.');
  }catch(_){state.textContent=text('Не удалось сохранить файл.','Could not save file.');}
 }
 function init(api={}){
  if(dialog||!root.document)return;
  getSession=typeof api.getSession==='function'?api.getSession:getSession;
  const header=root.document.querySelector('.topline');if(!header)return;
  launch=root.document.createElement('button');launch.id='g4QaOpen';launch.className='mini-btn';
  launch.type='button';launch.addEventListener('click',open);header.append(launch);
  dialog=root.document.createElement('dialog');dialog.id='g4QaDialog';dialog.className='g4-qa-dialog';
  const title=root.document.createElement('h2');title.id='g4QaTitle';
  const desc=root.document.createElement('p');desc.id='g4QaDescription';
  preview=root.document.createElement('pre');preview.id='g4QaPreview';
  preview.setAttribute('tabindex','0');preview.setAttribute('aria-label','G4 JSON diagnostics preview');
  state=root.document.createElement('p');state.id='g4QaStatus';state.setAttribute('role','status');
  const actions=root.document.createElement('div');actions.className='g4-qa-actions';
  function button(id,fn){
   const el=root.document.createElement('button');el.type='button';el.id=id;
   el.addEventListener('click',fn);actions.append(el);return el;
  }
  button('g4QaRefresh',render);button('g4QaCopy',copy);button('g4QaSave',save);
  button('g4QaClose',()=>dialog.close());
  dialog.append(title,desc,preview,state,actions);root.document.body.append(dialog);
  root.GameI18n?.subscribe?.(refresh);
  refresh();
 }
 return Object.freeze({buildDiagnostic,init,current,open});
});
