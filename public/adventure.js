/* Linked by Light — the shared adventure hub, cosmetics, story and canvas accents. */
(function(root){'use strict';
const DATA_KEY='linked-light-adventure-v1';
const ACTS=['Светлая долина','Сумеречный лес','Лунная пристань','Высокие облака','Сад созвездий','Кристальный разлом','Сияющий город','Река небес','Часовая башня','Дальний горизонт','Сердце созвездия'];
const STORY=[
 ['Когда свет раскололся, два хранителя проснулись по разные стороны долины.','«Слышишь меня?» — «Да. Идём навстречу!»'],
 ['Лес хранит воспоминания о тех, кто проходил здесь вместе.','«Корни знают путь. Не отпускай мою руку».'],
 ['В лунной гавани звёзды отражаются даже в самых тёмных водах.','«Если упадём — поймаем друг друга».'],
 ['Облака больше не разделяют острова: теперь они становятся мостами.','«Высоко? Зато отсюда видно наш дом».'],
 ['Звёзды образуют узоры, если два сердца светят в одном ритме.','«Попробуй сначала ты. Я продолжу».'],
 ['Разлом хранит чужую силу, но только вдвоём её можно направить.','«У каждого из нас есть то, чего нет у другого».'],
 ['Город фонарей просыпается, когда в нём снова слышен смех.','«Гляди, мы зажгли целую улицу!»'],
 ['Река небес уносит страхи и возвращает смелость.','«Плывём дальше. Вместе».'],
 ['Часы отсчитывают мгновения, но не измеряют дружбу.','«Времени мало — зато нас двое».'],
 ['У горизонта осталось последнее испытание доверия.','«Мы прошли слишком далеко, чтобы остановиться».'],
 ['Сердце мира услышало два голоса вместо одного.','«Ты здесь?» — «Всегда рядом, даже из другого города».']
];
const BOSS_NAMES=['Сонный Великан','Лесной Хранитель','Лунный Кракен','Король Ветров','Звёздный Сфинкс','Алмазный Страж','Неоновый Титан','Хранитель Течения','Часовой Голем','Тень Горизонта','Сердце Тьмы','Последняя Тень'];
const SKINS=[['classic','Классика','✦'],['sunset','Закат','☀'],['aurora','Сияние','◈'],['royal','Корона','♛'],['forest','Лес','❀'],['galaxy','Галактика','✧']];
const PETS=[['none','Без питомца','·'],['fox','Лисёнок','🦊'],['owl','Совёнок','🦉'],['moth','Мотылёк','🦋'],['cat','Котик','🐈'],['orb','Светлячок','✨']];
const FURN=[['lamp','Лампа','💡'],['plant','Растение','🌿'],['sofa','Диван','🛋️'],['shelf','Книги','📚'],['star','Звезда','⭐'],['rug','Ковёр','🧶'],['aquarium','Аквариум','🐠'],['telescope','Телескоп','🔭'],['fireplace','Камин','🔥'],['frame','Фото','🖼️'],['garden','Сад','🪴'],['piano','Пианино','🎹']];
const initial={v21:{schemaVersion:1,unlockedStages:[],diary:[],completed:[],trophies:[],aquarium:[],seasons:[],garden:{steps:0,growth:0},melody:[],painting:Array(64).fill(-1),weeklyRecords:{}},v20:{schemaVersion:1,unlockedStages:[],records:{},choices:{},unlockedDecor:[],petInteractions:{}},secrets:[],pets:[],skin:'classic',pet:'none',home:[{item:'lamp',slot:0},{item:'plant',slot:4}],achievements:[],shards:0,choices:{},memories:[],daily:{day:'',completed:[]},homeUpdatedAt:0,lookUpdatedAt:0};
function cleanV20House(raw){
 const h=raw&&typeof raw==='object'?raw:{};
 const num=x=>Number.isInteger(x)?Math.max(0,Math.min(20,x)):0;
 return {zone:['living','garden','workshop'].includes(h.zone)?h.zone:'living',
  garden:{step:num(h.garden?.step),completed:!!h.garden?.completed},
  memory:{step:num(h.memory?.step),completed:!!h.memory?.completed},
  pet:{mood:['happy','curious','resting'].includes(h.pet?.mood)?h.pet.mood:'curious',interactions:num(h.pet?.interactions)},
  decor:Array.isArray(h.decor)?h.decor.filter(x=>['lampion','flower','crystal'].includes(x)).slice(0,6):[]};
}
function cleanV20(raw){const v=raw&&typeof raw==='object'?raw:{};return {schemaVersion:1,unlockedStages:Array.from(new Set((Array.isArray(v.unlockedStages)?v.unlockedStages:[]).filter(x=>typeof x==='string'&&/^v20-(?:0[1-9]|1[0-2])$/.test(x)))).slice(0,12),records:v.records&&typeof v.records==='object'&&!Array.isArray(v.records)?Object.fromEntries(Object.entries(v.records).filter(([k,r])=>/^v20-(?:0[1-9]|1[0-2])$/.test(k)&&r&&Number.isInteger(r.stars)&&r.stars>=1&&r.stars<=3).map(([k,r])=>[k,{stars:r.stars,elapsed:Math.max(0,Number(r.elapsed)||0)}])):{},choices:v.choices&&typeof v.choices==='object'&&!Array.isArray(v.choices)?Object.fromEntries(Object.entries(v.choices).filter(([k,n])=>/^scene-(?:2|4|6|8|10|12)$/.test(k)&&[0,1].includes(n))):{},unlockedDecor:Array.from(new Set((Array.isArray(v.unlockedDecor)?v.unlockedDecor:[]).filter(x=>['lampion','flower','crystal'].includes(x)))).slice(0,3),petInteractions:{},house:cleanV20House(v.house)};}
function cleanV21(raw){const z=raw&&typeof raw==='object'?raw:{},arr=(x,n)=>(Array.isArray(x)?x:[]).filter(y=>typeof y==='string'&&y.length<=75).slice(-n);return {schemaVersion:1,unlockedStages:arr(z.unlockedStages,10).filter(x=>/^v21-(0[1-9]|10)$/.test(x)),completed:arr(z.completed,122),trophies:arr(z.trophies,64),aquarium:arr(z.aquarium,5).filter(x=>['ember','moon','pearl','mist','nebula'].includes(x)),seasons:arr(z.seasons,16),diary:(Array.isArray(z.diary)?z.diary:[]).filter(e=>e&&e.type==='event'&&typeof e.title==='string').slice(-40).map(e=>({type:'event',kind:String(e.kind||'').slice(0,25),title:e.title.slice(0,75),stage:Number.isInteger(e.stage)?Math.max(0,Math.min(121,e.stage)):0,day:String(e.day||'').slice(0,10)})),garden:{steps:Math.max(0,Math.min(24,Number(z.garden?.steps)||0)),growth:Math.max(0,Math.min(12,Number(z.garden?.growth)||0))},melody:(Array.isArray(z.melody)?z.melody:[]).filter(x=>Number.isInteger(x?.note)&&x.note>=0&&x.note<=7&&[0,1].includes(x.role)).slice(0,16),painting:Array.from({length:64},(_,i)=>Number.isInteger(z.painting?.[i])&&z.painting[i]>=-1&&z.painting[i]<=5?z.painting[i]:-1),weeklyRecords:z.weeklyRecords&&typeof z.weeklyRecords==='object'&&!Array.isArray(z.weeklyRecords)?Object.fromEntries(Object.entries(z.weeklyRecords).filter(([k,v])=>/^\d{4}-W\d{2}$/.test(k)&&Number.isFinite(v)&&v>0).slice(-10)):{}};}
function load(){try{let x=JSON.parse(localStorage.getItem(DATA_KEY));if(x&&typeof x==='object')return {...initial,...x,v20:cleanV20(x.v20),v21:cleanV21(x.v21),secrets:Array.isArray(x.secrets)?x.secrets.filter(n=>Number.isInteger(n)&&n>=0&&n<11):[],pets:Array.isArray(x.pets)?x.pets.filter(n=>Number.isInteger(n)&&n>=0&&n<11):[],home:Array.isArray(x.home)?x.home.slice(0,16):initial.home,choices:x.choices&&typeof x.choices==='object'&&!Array.isArray(x.choices)?x.choices:{},memories:Array.isArray(x.memories)?x.memories.filter(v=>typeof v?.text==='string'&&v.text.length<=160).slice(-40):[],daily:x.daily&&typeof x.daily==='object'?{day:String(x.daily.day||'').slice(0,10),completed:Array.isArray(x.daily.completed)?x.daily.completed.filter(v=>['stage','duet','stars'].includes(v)):[]}:initial.daily};}catch(_){}return {...initial};}
let data=load(),callbacks={},lastBossPhase=0,lastStage=-1,lastPet=false,lastSecret=false,lastHearts=0,sharedHome=null,serverLooks=[null,null],lastSaveTime=0;
const $=id=>document.getElementById(id),save=()=>{try{localStorage.setItem(DATA_KEY,JSON.stringify(data));}catch(_){}};
const ownHome=()=>sharedHome||data.home;
function countUnlocked(){return Math.min(98,callbacks.bestStage?.()||0);}
function safeStage(n){if(n===99)return data.secrets.length===11;return n>=0&&n<=countUnlocked();}
function cinematic(act){
 if(!Number.isInteger(act)||act<0||act>10)return;
 let node=$('adventureCinematic');if(!node){node=el('div','adv-cinematic');node.id='adventureCinematic';document.querySelector('.frame').append(node);}
 node.replaceChildren(el('small',null,'ГЛАВА '+String(act+1).padStart(2,'0')+' / 11'),el('strong',null,ACTS[act]),el('span',null,STORY[act][0]));
 node.classList.remove('visible');void node.offsetWidth;node.classList.add('visible');clearTimeout(cinematic.timer);
 cinematic.timer=setTimeout(()=>node.classList.remove('visible'),4300);
}
function announce(text){const el=$('adventureStory');if(!el)return;el.textContent=text;el.classList.add('revealed');clearTimeout(announce.timer);announce.timer=setTimeout(()=>el.classList.remove('revealed'),6500);}
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
function button(label,cb,css=''){const b=el('button','adv-button '+css,label);b.type='button';b.addEventListener('click',cb);return b;}
function progressChanged(){save();if($('advDialog')?.open)renderDialog();}
function getProfile(){return {skin:data.skin,pet:data.pet};}
function addMemory(note){
 if(!note||typeof note.text!=='string')return;
 const text=note.text.trim().slice(0,160),at=Number(note.at)||Date.now(),role=[0,1].includes(note.role)?note.role:0;
 if(!text||!Number.isFinite(at)||at<0)return;
 const item={at,role,text},memories=Array.isArray(data.memories)?data.memories:[];
 if(memories.some(n=>n.at===at&&n.role===role&&n.text===text))return;
 data.memories=memories.concat(item).slice(-40);progressChanged();
}
function getHome(){return data.home;}
function receiveHome(items){if(!Array.isArray(items))return;sharedHome=items.slice(0,16);data.home=sharedHome;data.homeUpdatedAt=Date.now();progressChanged();}
function receiveLooks(looks){if(Array.isArray(looks))serverLooks=looks;}
function outfitFor(i){return serverLooks[i]||getProfile();}
function onJoined(room,role){if(role>=0){callbacks.send?.({t:'customize',...getProfile()});}
 // Room's synchronized home is authoritative when reconnecting.
}
function onSnapshot(s){
 if(!s?.world)return;
 const day=new Date().toISOString().slice(0,10);
 if(data.daily?.day!==day)data.daily={day,completed:[]};
 const finish=id=>{if(!data.daily.completed.includes(id)){data.daily.completed.push(id);data.shards=Math.min(99999,(data.shards||0)+5);progressChanged();announce('Ежедневная цель: +5 ✦');}};
 if(!s.customLevel&&s.result?.completed){finish('stage');if(s.result.stars===3)finish('stars');}
 if((s.world.expansion?.duets||0)>0){finish('duet');if(!data.achievements.includes('duet')){data.achievements.push('duet');progressChanged();}}
 if(s.looks)receiveLooks(s.looks);if(s.home&&JSON.stringify(s.home)!==JSON.stringify(ownHome()))receiveHome(s.home);
 const ex=s.world.adventure;
 if(!ex||s.stage>=100)return;
 const act=Math.min(10,Math.floor(s.stage/9));
 if(ex.pet?.collected&&!lastPet&&ex.pet.visible){if(!data.pets.includes(act)){data.pets.push(act);announce('Найден новый питомец '+PETS[(act%5)+1][2]+'!');progressChanged();}}
 if(ex.secret?.collected&&!lastSecret&&ex.secret.visible){if(!data.secrets.includes(act)){data.secrets.push(act);announce('Секрет мира открыт ✨ '+data.secrets.length+'/11');progressChanged();}}
 if(data.secrets.length===11&&!data.achievements.includes('archivist')){data.achievements.push('archivist');progressChanged();}
 if(data.pets.length>=5&&!data.achievements.includes('keeper')){data.achievements.push('keeper');progressChanged();}
 if(ex.bond?.hearts>lastHearts){if(!data.achievements.includes('together')){data.achievements.push('together');progressChanged();}announce('Дружба стала сильнее ♡');}
 if(ex.boss?.hp===0&&s.stage%9===8){const key='boss'+act;if(!data.achievements.includes(key)){data.achievements.push(key);progressChanged();}}
 lastHearts=ex.bond?.hearts||0;lastPet=!!ex.pet?.collected;lastSecret=!!ex.secret?.collected;
 if(ex.boss?.hp>0&&ex.boss.phase>lastBossPhase&&lastBossPhase>0){announce('⚡ Босс меняет тактику! Фаза '+ex.boss.phase+'/3');}
 lastBossPhase=ex.boss?.phase||0;
 if(s.stage!==lastStage){lastStage=s.stage;if(s.stage%9===0&&s.stage<99)cinematic(act);lastPet=!!ex.pet?.collected;lastSecret=!!ex.secret?.collected;const scene=STORY[Math.min(10,act)];announce(s.stage===99?'Секретная глава: свет сильнее тьмы.':(s.stage%9===0?scene[0]+' '+scene[1]:'Испытание '+(s.stage%9+1)+' · '+scene[1]));}
}
function storeHome(items){data.home=items;data.homeUpdatedAt=Date.now();sharedHome=items;progressChanged();callbacks.send?.({t:'home',items});}
function setSkin(skin){if(!SKINS.some(s=>s[0]===skin))return;
 if(skin!=='classic'&&countUnlocked()<SKINS.findIndex(s=>s[0]===skin)*9-1)return;
 data.skin=skin;data.lookUpdatedAt=Date.now();progressChanged();callbacks.send?.({t:'customize',...getProfile()});}
function setPet(pet){if(!PETS.some(s=>s[0]===pet))return;
 const index=PETS.findIndex(s=>s[0]===pet);
 if(index>0&&data.pets.length<index)return;
 data.pet=pet;data.lookUpdatedAt=Date.now();progressChanged();callbacks.send?.({t:'customize',...getProfile()});}
function renderMap(rootEl){
 rootEl.append(el('p','adv-description','Открытые уровни можно переигрывать вдвоём. Создатель выбирает уровень перед созданием новой комнаты.'));
 const acts=el('div','adv-map');
 ACTS.forEach((name,i)=>{const card=el('div','adv-act'),head=el('div','adv-act-title',`${String(i+1).padStart(2,'0')} · ${name}`);card.append(head);
  const grid=el('div','adv-levels');for(let q=0;q<9;q++){const stage=i*9+q,unlocked=safeStage(stage);const records=readRecords(),medal=records[stage]?.stars||0;
 const b=button(String(stage+1).padStart(2,'0')+(q===8?' 👑':medal?' ★':''),()=>{callbacks.startStage?.(stage);$('advDialog').close();},unlocked?'unlocked':'locked');b.disabled=!unlocked;b.title=unlocked?(medal?'Лучшее прохождение: '+medal+' звезды за '+records[stage].elapsed+' с':'Уровень '+(stage+1)):'Уровень пока закрыт';grid.append(b);}card.append(grid);acts.append(card);});
 rootEl.append(acts);
 const bonus=button(data.secrets.length===11?'✨ Секретный уровень 100 — открыть':'🔒 Уровень 100 · Секреты '+data.secrets.length+'/11',()=>{callbacks.startStage?.(99);$('advDialog').close();},'adv-bonus');bonus.disabled=data.secrets.length!==11;rootEl.append(bonus);
}
function renderHome(rootEl){
 rootEl.append(el('p','adv-description','Ваш общий домик. Выберите украшение, затем свободное место. Изменения синхронизируются в комнате и сохраняются в браузере.'));
 const preview=el('div','adv-home');const house=ownHome();const spaces=el('div','adv-home-grid');
 for(let i=0;i<16;i++){const obj=house.find(x=>x.slot===i),txt=obj?FURN.find(f=>f[0]===obj.item)?.[2]:'+';
 const spot=button(txt,()=>{const item=$('advFurniture').value;const copy=house.filter(x=>x.slot!==i);if(item!=='clear')copy.push({item,slot:i});storeHome(copy);},'adv-home-slot');spot.title=obj?obj.item:'Добавить мебель';spaces.append(spot);}preview.append(el('div','adv-home-header','🏡 Остров двух огней'));preview.append(spaces);rootEl.append(preview);
 const sel=el('select','adv-select');sel.id='advFurniture';const opts=[['clear','Убрать предмет','⌫'],...FURN];for(const x of opts){const o=el('option',null,x[2]+' '+x[1]);o.value=x[0];sel.append(o);}rootEl.append(sel);
 rootEl.append(el('div','adv-mini','Остров общий, если оба игрока находятся в одной комнате. Вне комнаты мебель сохраняется на вашем устройстве. Доступно 16 мест и четыре новых предмета.'));
}
function renderWardrobe(rootEl){
 rootEl.append(el('p','adv-description','Костюмы открываются за прохождение глав, питомцы — за исследование уровней. Всё бесплатно.'));
 const title=el('h3',null,'🎨 Наряды');rootEl.append(title);const skins=el('div','adv-options');SKINS.forEach((s,i)=>{const unlocked=i===0||countUnlocked()>=i*9-1;const b=button(s[2]+' '+s[1]+(unlocked?'':' 🔒'),()=>setSkin(s[0]),data.skin===s[0]?'chosen':'');b.disabled=!unlocked;skins.append(b);});rootEl.append(skins);
 rootEl.append(el('h3',null,'🐾 Питомцы'));const pets=el('div','adv-options');PETS.forEach((s,i)=>{const unlocked=i===0||data.pets.length>=i;const b=button(s[2]+' '+s[1]+(unlocked?'':' 🔒'),()=>setPet(s[0]),data.pet===s[0]?'chosen':'');b.disabled=!unlocked;pets.append(b);});rootEl.append(pets);
}

function readRecords(){try{return JSON.parse(localStorage.getItem('linked-light-stars-v11')||'{}');}catch(_){return {};}}
const ANSWERS=[
 ['Я рядом, идём вместе.','Ты ведёшь, я поддержу.'],['Не бойся темноты.','Послушаем лес.'],
 ['Наш свет отражается в воде.','Перепрыгнем прилив вместе.'],['Выше облаков!','Держись за мою руку.'],
 ['Разгадаю созвездие.','Подскажи мне порядок звёзд.'],['Ты — мой компас.','Мы справимся с разломом.'],
 ['Зажжём весь город.','Побудем здесь ещё немного.'],['Ветер нам помогает.','Не отпускай течение.'],
 ['Времени хватит на нас обоих.','Бежим, пока часы идут.'],['Горизонт ещё впереди.','Мы уже почти дома.'],
 ['Свет вернётся к нам.','Мы и есть свет.']
];
function storyChoice(m){if(!Number.isInteger(m?.act)||m.act<0||m.act>10||![0,1].includes(m.choice))return;
 data.choices[m.act]=m.choice;progressChanged();announce((m.role===0?'Искра':'Эхо')+': «'+ANSWERS[m.act][m.choice]+'»');}
function renderDialogue(rootEl){const act=Math.min(10,Math.floor((callbacks.currentStage?.()||0)/9));
 rootEl.append(el('p','adv-description','Выбирайте реплики вместе. Ответ появляется у обоих игроков в комнате; сюжетную механику не меняет.'));
 rootEl.append(el('h3',null,ACTS[act]));rootEl.append(el('div','adv-journal-entry',STORY[act].join(' ')));
 const choices=el('div','adv-options');ANSWERS[act].forEach((answer,index)=>{
 const b=button('💬 «'+answer+'»',()=>{
  data.choices[act]=index;progressChanged();callbacks.send?.({t:'storyChoice',act,choice:index});announce('«'+answer+'»');
 },data.choices[act]===index?'chosen':'');choices.append(b);});rootEl.append(choices);
}
function profilePayload(){return {version:11,adventure:JSON.parse(JSON.stringify(data)),checkpoint:callbacks.bestStage?.()||0,records:readRecords()};}
function exportProfile(){const payload=profilePayload();
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=url;a.download='svyazannye-svetom-save.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
}
function importProfile(obj){if(!obj||obj.version!==11||!obj.adventure||typeof obj.adventure!=='object')throw Error('Неверный формат сохранения');
 const a=obj.adventure;const skin=SKINS.some(v=>v[0]===a.skin)?a.skin:'classic',pet=PETS.some(v=>v[0]===a.pet)?a.pet:'none';
 data={...initial,v20:cleanV20(a.v20),v21:cleanV21(a.v21),secrets:Array.from(new Set((Array.isArray(a.secrets)?a.secrets:[]).filter(n=>Number.isInteger(n)&&n>=0&&n<11))),pets:Array.from(new Set((Array.isArray(a.pets)?a.pets:[]).filter(n=>Number.isInteger(n)&&n>=0&&n<11))),
 skin,pet,memories:Array.isArray(a.memories)?a.memories.filter(n=>n&&typeof n.text==='string'&&n.text.length<=160&&Number.isFinite(n.at)&&[0,1].includes(n.role)).slice(-40):[],home:Array.isArray(a.home)?a.home.filter(e=>FURN.some(x=>x[0]===e.item)&&Number.isInteger(e.slot)&&e.slot>=0&&e.slot<16).slice(0,16):initial.home,
 achievements:Array.isArray(a.achievements)?a.achievements.filter(x=>typeof x==='string'&&x.length<=40).slice(0,50):[],shards:Math.max(0,Math.min(99999,Number(a.shards)||0)),choices:{},daily:{day:typeof a.daily?.day==='string'?a.daily.day.slice(0,10):'',completed:Array.isArray(a.daily?.completed)?a.daily.completed.filter(v=>['stage','duet','stars'].includes(v)):[]},homeUpdatedAt:Number.isSafeInteger(a.homeUpdatedAt)&&a.homeUpdatedAt>=0?a.homeUpdatedAt:0,lookUpdatedAt:Number.isSafeInteger(a.lookUpdatedAt)&&a.lookUpdatedAt>=0?a.lookUpdatedAt:0};
 if(a.choices&&typeof a.choices==='object')for(const [k,v] of Object.entries(a.choices))if(/^\d{1,2}$/.test(k)&&Number(k)<=10&&[0,1].includes(v))data.choices[k]=v;
 const cp=Number(obj.checkpoint);if(Number.isSafeInteger(cp)&&cp>=0&&cp<=98){try{localStorage.setItem('linked-light-checkpoint-v99',String(cp));}catch(_){}}
 if(obj.records&&typeof obj.records==='object'){
  const safe={};for(const [k,v] of Object.entries(obj.records))if(/^\d{1,2}$/.test(k)&&Number(k)<100&&v&&Number.isInteger(v.stars)&&v.stars>=1&&v.stars<=3){safe[k]={stars:v.stars,elapsed:Math.max(0,Math.min(99999,Number(v.elapsed)||0)),deaths:Math.max(0,Math.min(9999,Number(v.deaths)||0))};}
  try{localStorage.setItem('linked-light-stars-v11',JSON.stringify(safe));}catch(_){}
 }
 sharedHome=null;save();callbacks.send?.({t:'customize',...getProfile()});callbacks.send?.({t:'home',items:data.home});progressChanged();
}
function syncV21(server){
 if(!server||typeof server!=='object')return;
 const old=cleanV21(data.v21),z=cleanV21(server);
 z.unlockedStages=Array.from(new Set([...old.unlockedStages,...z.unlockedStages]));
 z.completed=Array.from(new Set([...old.completed,...z.completed])).slice(-122);
 z.trophies=Array.from(new Set([...old.trophies,...z.trophies])).slice(-64);
 z.aquarium=Array.from(new Set([...old.aquarium,...z.aquarium]));
 z.seasons=Array.from(new Set([...old.seasons,...z.seasons])).slice(-16);
 const events=[...old.diary,...z.diary];
 z.diary=events.filter((e,i)=>events.findIndex(x=>x.kind===e.kind&&x.stage===e.stage)===i).slice(-40);
 z.garden={steps:Math.max(old.garden.steps,z.garden.steps),growth:Math.max(old.garden.growth,z.garden.growth)};
 if(!z.painting.some(n=>n>=0)&&old.painting.some(n=>n>=0))z.painting=old.painting;
 if(!z.melody.length&&old.melody.length)z.melody=old.melody;
 z.weeklyRecords={...old.weeklyRecords,...z.weeklyRecords};
 if(JSON.stringify(z)!==JSON.stringify(old)){data.v21=z;progressChanged();}
}
function renderSaves(rootEl){rootEl.append(el('p','adv-description','Выгрузите прогресс в JSON, чтобы перенести его между устройствами и сохранить после очистки браузера. Это не автоматическая облачная синхронизация.'));
 rootEl.append(button('⬇ Скачать сохранение',exportProfile));const pick=el('input','adv-import');pick.type='file';pick.accept='.json,application/json';
 pick.addEventListener('change',async()=>{try{const f=pick.files?.[0];if(!f)return;if(f.size>300000)throw Error('Слишком большой файл');const text=await f.text();importProfile(JSON.parse(text));announce('Сохранение успешно импортировано');}
 catch(e){announce('Не удалось импортировать: '+e.message);}});rootEl.append(pick);
 const records=Object.values(readRecords());rootEl.append(el('div','adv-mini','Результатов уровней: '+records.length+' · Звёзд: '+records.reduce((n,r)=>n+(r.stars||0),0)+'.'));
}
function renderJournal(rootEl){
 rootEl.append(el('p','adv-description','Короткая история хранителей света. Главы открываются во время прохождения кампании.'));
 STORY.forEach((line,i)=>{const unlocked=countUnlocked()>=i*9;const card=el('div','adv-journal-entry');card.append(el('b',null,unlocked?ACTS[i]:`Глава ${i+1} · закрыта`));if(unlocked)card.append(el('p',null,line.join(' ')));rootEl.append(card);});
 const awards=el('div','adv-options');
  for(const [key,name] of [['together','♡ Общая эмоция'],['keeper','🐾 Друг животных'],['archivist','✧ Хранитель тайн']]){awards.append(el('div','adv-award'+(data.achievements.includes(key)?' earned':''),name));}
  rootEl.append(el('h3',null,'🏆 Достижения'));rootEl.append(awards);
 rootEl.append(el('div','adv-mini',`Открыто секретов: ${data.secrets.length}/11 · Питомцев: ${data.pets.length}/11 · Побеждено боссов: ${data.achievements.filter(x=>x.startsWith('boss')).length}/11.`));
 const daily=el('div','adv-journal-entry');daily.append(el('h3','☀ Испытания дня · '+new Date().toISOString().slice(0,10)));
 for(const [key,name] of [['stage','Пройти один уровень'],['duet','Выполнить резонанс вдвоём'],['stars','Получить три звезды']]){
   daily.append(el('p',((data.daily?.completed||[]).includes(key)&&data.daily?.day===new Date().toISOString().slice(0,10)?'✓ ':'○ ')+name));
 }
 daily.append(el('p','За каждое испытание: +5 световых осколков · Всего: '+(data.shards||0)));
 rootEl.append(daily);
}
function renderDialog(){const holder=$('advDialogBody');if(!holder)return;holder.replaceChildren();const tab=$('advDialog').dataset.tab||'map';
 for(const b of document.querySelectorAll('.adv-tab'))b.classList.toggle('chosen',b.dataset.tab===tab);
 if(tab==='map')renderMap(holder);else if(tab==='home')renderHome(holder);else if(tab==='wardrobe')renderWardrobe(holder);else if(tab==='dialogue')renderDialogue(holder);else if(tab==='saves')renderSaves(holder);else renderJournal(holder);
}
function open(tab){const dialog=$('advDialog');dialog.dataset.tab=tab;renderDialog();if(!dialog.open)dialog.showModal();}
function init(api){callbacks=api;
 const header=document.querySelector('.topline');const nav=el('div','adv-nav');
 for(const [key,icon,label] of [['map','🗺️','Карта'],['home','🏡','Дом'],['wardrobe','🎨','Герои'],['journal','📖','История'],['dialogue','💬','Диалог'],['saves','💾','Сейвы']]){const b=button(icon+' '+label,()=>open(key));b.title=label;nav.append(b);}header.insertAdjacentElement('afterend',nav);
 const dialog=el('dialog','adv-dialog');dialog.id='advDialog';
 const top=el('div','adv-dialog-head');top.append(el('strong',null,'СВЯЗАННЫЕ СВЕТОМ · ПРИКЛЮЧЕНИЕ'));top.append(button('✕',()=>dialog.close(),'adv-close'));dialog.append(top);
 const tabs=el('div','adv-tabs');for(const [id,t] of [['map','Карта'],['home','Домик'],['wardrobe','Герои'],['journal','История'],['dialogue','Реплики'],['saves','Сохранения']]){const b=button(t,()=>{dialog.dataset.tab=id;renderDialog();},'adv-tab');b.dataset.tab=id;tabs.append(b);}dialog.append(tabs);
 const body=el('div','adv-dialog-body');body.id='advDialogBody';dialog.append(body);document.body.append(dialog);
 const story=el('div','adv-story');story.id='adventureStory';document.querySelector('.frame').append(story);
}
function draw(ctx,level,players,extra,clock){if(!extra)return;
 const bond=extra.bond;
 if(bond&&players?.length===2){const a=players[0],b=players[1];ctx.save();const pulse=.12+.09*Math.sin(clock*4);
  ctx.globalAlpha=bond.active>0?.88:pulse+.2*bond.power;ctx.strokeStyle=bond.active>0?'#fdf1c0':'#e0b2fa';ctx.lineWidth=bond.active>0?7:2;
  ctx.shadowColor='#d6a9ff';ctx.shadowBlur=12;ctx.beginPath();ctx.moveTo(a.x+15,a.y+19);ctx.quadraticCurveTo((a.x+b.x)/2+15,(a.y+b.y)/2+8+Math.sin(clock*3)*17,b.x+15,b.y+19);ctx.stroke();ctx.restore();
  if(bond.shield>0)for(const p of players){ctx.save();ctx.strokeStyle='#9bfbff';ctx.globalAlpha=.55+.2*Math.sin(clock*7);ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x+15,p.y+18,39,0,Math.PI*2);ctx.stroke();ctx.restore();}
 }
 const boss=extra.boss;if(boss&&boss.hp>0){const x=boss.x,y=boss.y;ctx.save();ctx.translate(x,y);const phase=boss.phase||1;ctx.scale(1+(phase-1)*.09,1+(phase-1)*.09);const amp=Math.sin(clock*3)*7;
  ctx.shadowBlur=36;ctx.shadowColor=['#e7a7ff','#a8d67a','#c2d1ff','#aadfff','#ffdb97','#7affd3','#f87bdc','#9aeafb','#e8a1ff','#fcbc98','#fff1b3'][boss.style||0];ctx.fillStyle=['#3a2a59','#29464b','#2f4270','#36527e','#59476b','#304f6a','#452955','#285c68','#4c3e69','#583456','#5b4a69'][boss.style||0];ctx.beginPath();ctx.ellipse(0,amp,54,67,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  ctx.fillStyle=['#dfabff','#aaf3c0','#cfdbff','#ade3ff','#ffe5a7','#a7ffe1','#ffa6e4','#b0f7f2','#e6baff','#ffd1a6','#fff3cf'][boss.style||0];ctx.beginPath();ctx.moveTo(-43,-41+amp);ctx.lineTo(-30,-84+amp);ctx.lineTo(-3,-47+amp);ctx.lineTo(29,-85+amp);ctx.lineTo(46,-35+amp);ctx.fill();
  ctx.fillStyle=boss.next?'#80eff7':'#ffc17f';ctx.beginPath();ctx.arc(-18,-2+amp,8,0,Math.PI*2);ctx.arc(18,-2+amp,8,0,Math.PI*2);ctx.fill();
  if(boss.warning>0){ctx.strokeStyle='#ff7c9e';ctx.lineWidth=5;ctx.globalAlpha=.5+.35*Math.sin(clock*20);ctx.beginPath();if(boss.pattern===0)ctx.arc(0,0,165,0,Math.PI*2);else{const xx=boss.pattern===1?-75:(boss.phase>=2?(boss.focusX||boss.x)-boss.x-70:-180);ctx.rect(xx,-98,150,184);}ctx.stroke();}
  ctx.globalAlpha=1;ctx.fillStyle='#ffffff';ctx.textAlign='center';ctx.font='bold 16px system-ui';ctx.fillText(boss.name+' · ФАЗА '+phase+'/3',0,-111);ctx.fillStyle='#27253f';ctx.fillRect(-50,-102,100,9);ctx.fillStyle='#ff9cb5';ctx.fillRect(-50,-102,100*boss.hp/boss.max,9);ctx.restore();}
 if(extra.pet?.visible&&!extra.pet.collected){const x=extra.pet.x,y=GROUND-44+Math.sin(clock*3)*6;ctx.save();ctx.translate(x,y);ctx.fillStyle='#ffb375';ctx.shadowColor='#ffa0aa';ctx.shadowBlur=16;ctx.beginPath();ctx.arc(0,0,15,0,Math.PI*2);ctx.fill();ctx.font='19px system-ui';ctx.textAlign='center';ctx.fillText('🐾',0,-23);ctx.restore();}
 if(extra.secret?.visible&&!extra.secret.collected){const x=extra.secret.x,y=extra.secret.y+Math.sin(clock*2)*7;ctx.save();ctx.translate(x,y);ctx.rotate(clock*.35);ctx.fillStyle='#ffe8a4';ctx.shadowBlur=21;ctx.shadowColor='#ffe8a4';ctx.beginPath();for(let i=0;i<8;i++){const angle=i*Math.PI/4,r=i%2?7:22;ctx.lineTo(Math.cos(angle)*r,Math.sin(angle)*r);}ctx.closePath();ctx.fill();ctx.restore();}
 const mode=extra.arcade;if(mode&&mode.started&&!mode.done){ctx.save();ctx.fillStyle='#d9eafd';ctx.strokeStyle='#b8f3ff';ctx.lineWidth=3;ctx.shadowColor='#9df7ff';ctx.shadowBlur=10;
  if(mode.kind==='flight'){ctx.beginPath();ctx.arc(mode.ringX,GROUND-125,40,0,Math.PI*2);ctx.stroke();ctx.font='17px system-ui';ctx.fillText('✦ ПОЛЁТ ✦',mode.ringX-62,GROUND-174);}
  if(mode.kind==='rhythm')for(let i=0;i<2;i++){const x=mode.ringX+i*125;ctx.beginPath();ctx.arc(x,GROUND-45,26,0,Math.PI*2);ctx.stroke();ctx.fillStyle=mode.rhythm[i]?'#7effda':i?'#80eff7':'#ffc17f';ctx.beginPath();ctx.arc(x,GROUND-45,13,0,Math.PI*2);ctx.fill();}
  if(mode.kind==='sail'){ctx.fillStyle=mode.boost>0?'#8cf8f8':'#e0b990';ctx.textAlign='center';ctx.fillText('Искра: ВПРАВО · Эхо: ИМПУЛЬС',mode.boat,GROUND-124);ctx.fillStyle='#d2ae82';ctx.fillRect(mode.boat-65,GROUND-20,130,13);ctx.fillStyle='#fff5dd';ctx.beginPath();ctx.moveTo(mode.boat,GROUND-100);ctx.lineTo(mode.boat+55,GROUND-28);ctx.lineTo(mode.boat,GROUND-28);ctx.fill();}
  if(mode.kind==='chase'){ctx.fillStyle='#ffa1ad';ctx.fillRect(mode.hunter-15,GROUND-62,30,62);ctx.fillRect(mode.ringX-7,GROUND-155,14,150);ctx.font='bold 13px system-ui';ctx.fillText('ГОНКА '+Math.ceil(mode.timer)+'с',mode.ringX-65,GROUND-180);}
  ctx.restore();}
 if(players)players.forEach((p,i)=>{const look=outfitFor(i);if(look.pet==='none')return;const sym=PETS.find(z=>z[0]===look.pet)?.[2]||'✨';ctx.save();ctx.font='22px system-ui';ctx.textAlign='center';ctx.globalAlpha=.8;ctx.fillText(sym,p.x+(i?-21:52),p.y-5+Math.sin(clock*5+i)*6);ctx.restore();});
 if(extra.emotes?.length)extra.emotes.forEach((duration,i)=>{if(duration>0&&players[i]){const p=players[i];ctx.save();ctx.font='bold 26px system-ui';ctx.textAlign='center';ctx.fillText((['♡','✋','♫'])[extra.emoteKinds?.[i]||0],p.x+15,p.y-89-Math.sin(clock*7)*8);ctx.restore();}});
}
function recordV20(s){
 if(!s||!Number.isInteger(s.stage))return;
 const v=data.v20||(data.v20=cleanV20());
 let changed=false,stageId='v20-'+String(s.stage-99).padStart(2,'0');
 if(s.stage>=100&&s.stage<=111&&!v.unlockedStages.includes(stageId)){v.unlockedStages.push(stageId);changed=true;}
 if(s.result?.completed&&s.result.level>=100&&s.result.level<=111){
  const id='v20-'+String(s.result.level-99).padStart(2,'0'),old=v.records[id];
  if(!old||s.result.stars>old.stars||s.result.stars===old.stars&&s.result.elapsed<old.elapsed){
   v.records[id]={stars:s.result.stars,elapsed:s.result.elapsed};changed=true;
  }
 }
 const choices=s.v20Story?.choices||{};
 for(const [k,choice] of Object.entries(choices))if(/^scene-(?:2|4|6|8|10|12)$/.test(k)&&[0,1].includes(choice)&&v.choices[k]!==choice){
  v.choices[k]=choice;changed=true;
 }
 if(s.v20Home){
  const h=cleanV20House(s.v20Home);
  if(JSON.stringify(h)!==JSON.stringify(v.house)){v.house=h;changed=true;}
 }
 if(s.v20Home?.garden?.completed&&!v.unlockedDecor.includes('flower')){v.unlockedDecor.push('flower');changed=true;}
 if(s.v20Home?.memory?.completed&&!v.unlockedDecor.includes('crystal')){v.unlockedDecor.push('crystal');changed=true;}
 if(changed)progressChanged();
}
root.GameAdventure={syncV21,cleanV21,recordV20,cleanV20,init,open,onJoined,onSnapshot,storyChoice,receiveHome,receiveLooks,getProfile,getHome,outfitFor,draw,data:()=>data,safeStage,BOSS_NAMES,profilePayload,importProfile,addMemory};
})(typeof window!=='undefined'?window:globalThis);