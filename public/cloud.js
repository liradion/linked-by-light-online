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
function mergeV20(a,b){
 const left=a&&typeof a==='object'?a:{},right=b&&typeof b==='object'?b:{};
 const records={...(right.records||{})};
 for(const [id,r] of Object.entries(left.records||{})){const p=records[id];if(!p||r.stars>p.stars||r.stars===p.stars&&r.elapsed<p.elapsed)records[id]=r;}
 return {schemaVersion:1,unlockedStages:Array.from(new Set([...(left.unlockedStages||[]),...(right.unlockedStages||[])])),
  records,choices:{...(left.choices||{}),...(right.choices||{})},
  unlockedDecor:Array.from(new Set([...(left.unlockedDecor||[]),...(right.unlockedDecor||[])])),
  petInteractions:{...(left.petInteractions||{}),...(right.petInteractions||{})},
  house:{
   zone:right.house?.zone||left.house?.zone||'living',
   garden:{step:Math.max(left.house?.garden?.step||0,right.house?.garden?.step||0),completed:!!(left.house?.garden?.completed||right.house?.garden?.completed)},
   memory:{step:Math.max(left.house?.memory?.step||0,right.house?.memory?.step||0),completed:!!(left.house?.memory?.completed||right.house?.memory?.completed)},
   pet:{mood:right.house?.pet?.mood||left.house?.pet?.mood||'curious',interactions:Math.max(left.house?.pet?.interactions||0,right.house?.pet?.interactions||0)},
   decor:[...(right.house?.decor||[]),...(left.house?.decor||[])].slice(0,6)
  }};
}
function mergeV21(a,b){
 const x=a&&typeof a==='object'?a:{},y=b&&typeof b==='object'?b:{};
 const union=(p,q,n)=>Array.from(new Set([...(Array.isArray(p)?p:[]),...(Array.isArray(q)?q:[])])).slice(-n);
 const records={...(y.weeklyRecords||{})};
 for(const [week,seconds] of Object.entries(x.weeklyRecords||{}))
  if(!Number.isFinite(records[week])||seconds<records[week])records[week]=seconds;
 const entries=[...(x.diary||[]),...(y.diary||[])],seen=new Set();
 const diary=entries.filter(v=>{
  if(!v||typeof v.title!=='string')return false;
  const key=[v.stage,v.kind].join(':');if(seen.has(key))return false;seen.add(key);return true;
 }).slice(-40);
 const stageRecords={...(y.records||{})};
 for(const [key,entry] of Object.entries(x.records||{})){
  const old=stageRecords[key];if(!old||entry.stars>old.stars||entry.stars===old.stars&&entry.elapsed<old.elapsed)stageRecords[key]=entry;
 }
 return {schemaVersion:1,records:stageRecords,unlockedStages:union(x.unlockedStages,y.unlockedStages,10),
  completed:union(x.completed,y.completed,122),trophies:union(x.trophies,y.trophies,64),
  seasons:union(x.seasons,y.seasons,16),aquarium:union(x.aquarium,y.aquarium,5),
  diary,weeklyRecords:records,garden:{
   steps:Math.max(x.garden?.steps||0,y.garden?.steps||0),
   growth:Math.max(x.garden?.growth||0,y.garden?.growth||0)
  },melody:(y.melody?.length||0)>=(x.melody?.length||0)?y.melody||[]:x.melody,
  painting:Array.isArray(y.painting)&&y.painting.length===64?y.painting:x.painting||Array(64).fill(-1)};
}
function mergeV23(a,b){
 const x=a&&typeof a==='object'?a:{},y=b&&typeof b==='object'?b:{};
 const records={...(y.records||{})};
 for(const [id,item] of Object.entries(x.records||{})){
  const old=records[id];if(!old||item.stars>old.stars||item.stars===old.stars&&item.elapsed<old.elapsed)records[id]=item;
 }
 const stages=Array.from(new Set([...(x.unlockedStages||[]),...(y.unlockedStages||[])]))
  .filter(id=>/^v23-(?:0[1-9]|1[0-5])$/.test(id)).slice(-15);
 return {schema:23,unlockedStages:stages,records};
}
function mergeV24(a,b){
 const x=a&&typeof a==='object'?a:{},y=b&&typeof b==='object'?b:{};
 const union=(p,q,n)=>Array.from(new Set([...(Array.isArray(p)?p:[]),...(Array.isArray(q)?q:[])])).slice(-n);
 const quests={};
 for(const id of ['keeper','navigator','hermit','secret'])quests[id]=Math.max(x.quests?.[id]||0,y.quests?.[id]||0);
 return {...x,...y,schema:24,npcs:union(x.npcs,y.npcs,4),quests,
  achievements:union(x.achievements,y.achievements,10),events:union(x.events?.map(v=>JSON.stringify(v)),y.events?.map(v=>JSON.stringify(v)),20).map(v=>{try{return JSON.parse(v);}catch(_){return null;}}).filter(Boolean),
  kitchen:{...(y.kitchen||{}),finished:union(x.kitchen?.finished,y.kitchen?.finished,4),
   step:Math.max(x.kitchen?.step||0,y.kitchen?.step||0)},
  expedition:{...(y.expedition||{}),completed:Math.max(x.expedition?.completed||0,y.expedition?.completed||0),
   loot:Math.max(x.expedition?.loot||0,y.expedition?.loot||0)},
  observatory:{...y.observatory,constellations:Math.max(x.observatory?.constellations||0,y.observatory?.constellations||0),
   progress:Math.max(x.observatory?.progress||0,y.observatory?.progress||0)},
  workshop:{crafted:union(x.workshop?.crafted,y.workshop?.crafted,3)},
  minigame:{...(y.minigame||{}),bests:Object.fromEntries(['race','search','puzzle'].map(k=>[k,Math.max(x.minigame?.bests?.[k]||0,y.minigame?.bests?.[k]||0)]))},
  narrative:{...(y.narrative||{}),epilogue:y.narrative?.epilogue||x.narrative?.epilogue||null,
   answers:[0,1].map(i=>(y.narrative?.answers?.[i]?.length||0)>=(x.narrative?.answers?.[i]?.length||0)
    ?y.narrative?.answers?.[i]||[]:x.narrative?.answers?.[i]||[])}};
}
function merge(a,b){if(!a||a.version!==11)return b;if(!b||b.version!==11)return a;
 const keys=new Set([...(a.adventure?.secrets||[]),...(b.adventure?.secrets||[])]);
 const pets=new Set([...(a.adventure?.pets||[]),...(b.adventure?.pets||[])]);
 const achievements=new Set([...(a.adventure?.achievements||[]),...(b.adventure?.achievements||[])]);
 const records={...(b.records||{})};for(const [k,v] of Object.entries(a.records||{})){
  if(!records[k]||v.stars>records[k].stars||v.stars===records[k].stars&&v.elapsed<records[k].elapsed)records[k]=v;
 }
 return {...b,checkpoint:Math.max(a.checkpoint||0,b.checkpoint||0),records,
  adventure:{...b.adventure,v23:mergeV23(a.adventure?.v23,b.adventure?.v23),v24:mergeV24(a.adventure?.v24,b.adventure?.v24),v21:mergeV21(a.adventure?.v21,b.adventure?.v21),v20:mergeV20(a.adventure?.v20,b.adventure?.v20),secrets:Array.from(keys),pets:Array.from(pets),achievements:Array.from(achievements),
  shards:Math.max(a.adventure?.shards||0,b.adventure?.shards||0),
  memories:(()=>{
   const all=[...(b.adventure?.memories||[]),...(a.adventure?.memories||[])],seen=new Set();
   return all.filter(n=>{if(!n||typeof n.text!=='string')return false;
    const id=[n.at,n.role,n.text].join(':');if(seen.has(id))return false;seen.add(id);return true;
   }).sort((x,y)=>x.at-y.at).slice(-40);
  })(),
  daily:a.adventure?.daily?.day===b.adventure?.daily?.day
   ?{day:a.adventure?.daily?.day||'',completed:Array.from(new Set([...(a.adventure?.daily?.completed||[]),...(b.adventure?.daily?.completed||[])]))}
   :(String(a.adventure?.daily?.day||'')>String(b.adventure?.daily?.day||'')?a.adventure?.daily:b.adventure?.daily),
  choices:{...(b.adventure?.choices||{}),...(a.adventure?.choices||{})},
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