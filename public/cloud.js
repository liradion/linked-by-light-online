/* Optional end-to-end encrypted cloud profiles. The recovery key is never saved on the server. */
(function(root){'use strict';
const KEY_STORAGE='linked-light-cloud-recovery-key-v1';
let key='',revision=0,enabled=false,busy=false,timer=null,notice=()=>{};
const $=id=>document.getElementById(id);
try{key=localStorage.getItem(KEY_STORAGE)||'';}catch(_){}
function validateKey(v){return /^[a-f0-9]{48}$/i.test(v);}
function generate(){const bytes=new Uint8Array(24);crypto.getRandomValues(bytes);return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');}
function setKey(v){if(!validateKey(v))throw Error('Нужен полный 48-значный ключ');key=v.toLowerCase();revision=0;try{localStorage.setItem(KEY_STORAGE,key);}catch(_){}return key;}
function clearKey(){key='';revision=0;try{localStorage.removeItem(KEY_STORAGE);}catch(_){};}
function merge(a,b){if(!a||a.version!==11)return b;if(!b||b.version!==11)return a;
 const keys=new Set([...(a.adventure?.secrets||[]),...(b.adventure?.secrets||[])]);
 const pets=new Set([...(a.adventure?.pets||[]),...(b.adventure?.pets||[])]);
 const achievements=new Set([...(a.adventure?.achievements||[]),...(b.adventure?.achievements||[])]);
 const records={...(b.records||{})};for(const [k,v] of Object.entries(a.records||{})){
  if(!records[k]||v.stars>records[k].stars||v.stars===records[k].stars&&v.elapsed<records[k].elapsed)records[k]=v;
 }
 return {...b,checkpoint:Math.max(a.checkpoint||0,b.checkpoint||0),records,
  adventure:{...b.adventure,secrets:Array.from(keys),pets:Array.from(pets),achievements:Array.from(achievements),
  shards:Math.max(a.adventure?.shards||0,b.adventure?.shards||0),choices:{...(b.adventure?.choices||{}),...(a.adventure?.choices||{})},
  // Field-level last-write-wins for home and looks; achievements and scores are monotonic.
  homeUpdatedAt:Math.max(a.adventure?.homeUpdatedAt||0,b.adventure?.homeUpdatedAt||0),
  lookUpdatedAt:Math.max(a.adventure?.lookUpdatedAt||0,b.adventure?.lookUpdatedAt||0),
  skin:(a.adventure?.lookUpdatedAt||0)>(b.adventure?.lookUpdatedAt||0)?a.adventure?.skin:b.adventure?.skin,
  pet:(a.adventure?.lookUpdatedAt||0)>(b.adventure?.lookUpdatedAt||0)?a.adventure?.pet:b.adventure?.pet,
  home:(a.adventure?.homeUpdatedAt||0)>(b.adventure?.homeUpdatedAt||0)?a.adventure?.home:b.adventure?.home}};
}
async function api(path,body){const r=await fetch('/api/cloud/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const v=await r.json();if(!r.ok)throw Object.assign(Error(v.error||'Cloud error'),{status:r.status});return v;}
async function sync(){if(!enabled||!key||busy)return false;busy=true;
 try{
  const remote=await api('read',{key});
  const local=GameAdventure.profilePayload();
  const combined=remote.payload?merge(local,remote.payload):local;
  if(remote.payload)GameAdventure.importProfile(combined);
  revision=remote.revision;
  if(remote.payload&&JSON.stringify(remote.payload)===JSON.stringify(combined)){notice('Сохранение актуально');return true;}
  let write;
  try{write=await api('write',{key,revision,payload:combined});}
  catch(e){if(e.status===409){const latest=await api('read',{key});const rerun=merge(GameAdventure.profilePayload(),latest.payload);write=await api('write',{key,revision:latest.revision,payload:rerun});}else throw e;}
  revision=write.revision||revision;
  notice('Облачный прогресс синхронизирован');return true;
 }catch(e){notice('Облако: '+e.message);return false;}finally{busy=false;}
}
function init(){const host=document.querySelector('.adv-nav')||document.querySelector('.topline');if(!host)return;
 const btn=document.createElement('button');btn.className='mini-btn';btn.textContent='☁ Облако';btn.type='button';host.append(btn);
 const dialog=document.createElement('dialog');dialog.className='quality-dialog';dialog.id='cloudDialog';dialog.innerHTML=`<div class="quality-head"><strong>☁ Облачные сохранения</strong><button id="cloudClose" type="button">✕</button></div>
 <p class="quality-note" id="cloudState">Проверка подключения...</p>
 <p class="quality-note">Один ключ для ваших двух устройств. Ключ открывает доступ к сохранению: не размещайте его публично. Скопируйте и храните отдельно.</p>
 <label class="cloud-entry">Ключ восстановления<input id="cloudKey" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="48 символов" maxlength="48" /></label>
 <div class="quality-actions"><button type="button" id="cloudNew">Создать ключ</button><button type="button" id="cloudUse">Подключить ключ</button><button type="button" id="cloudSync">Синхронизировать</button></div>
 <p class="quality-note" id="cloudMessage" role="status"></p>`;
 document.body.append(dialog);
 const status=$('cloudState'),message=$('cloudMessage'),input=$('cloudKey');
 notice=s=>{if(message)message.textContent=s;};
 $('cloudClose').onclick=()=>dialog.close();
 btn.onclick=()=>{input.value=key;if(!dialog.open)dialog.showModal();};
 $('cloudNew').onclick=()=>{input.value=setKey(generate());notice('Ключ создан. Сохраните его в надёжном месте и нажмите «Синхронизировать».');};
 $('cloudUse').onclick=()=>{try{setKey(input.value.trim());notice('Ключ подключён. Нажмите «Синхронизировать».');}catch(e){notice(e.message);}};
 $('cloudSync').onclick=()=>sync();
 fetch('/api/cloud/status').then(r=>r.json()).then(data=>{
  enabled=!!data.enabled;status.textContent=enabled?'Облачное хранилище подключено.':'Серверное облако ещё не настроено. Сохранения пока остаются локальными.';
  $('cloudNew').disabled=!enabled;$('cloudUse').disabled=!enabled;$('cloudSync').disabled=!enabled;
  if(enabled&&key)sync();if(enabled)timer=setInterval(()=>{if(key&&document.visibilityState==='visible')sync();},45000);
 }).catch(()=>{status.textContent='Не удалось проверить хранилище.';});
}
root.GameCloud={init,sync,generate,merge,setKey,clearKey,validateKey};
})(typeof window!=='undefined'?window:globalThis);