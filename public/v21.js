/* Linked by Light v21: 25 interactive additions for desktop and iPhone.
   Only server snapshots mutate shared progression; browser controls are inputs. */
(function(root){'use strict';
let api={},state=null,community=null,secret=[],leaderboard=null,dialog,body,quick,nav,tab='level',nonce='',serial=0,lastRender=0,paintColor=0;
const $=id=>document.getElementById(id);
const levels=GameV21Stages.stages,GROUND=544;
const labels={trails:'Мост из следов',transfer:'Почта между мирами',knowledge:'Два взгляда',
 lantern:'Живой фонарь',transform:'Превращения',weather:'Власть над погодой',
 cargo:'Перенести кристалл',tree:'Живое дерево',maze:'Лабиринт без карты',asymmetry:'Обмен способностями'};
const notes=['До встречи Искра бродила по бесконечным огненным тропам.','Эхо отвечало звёздам в одиноком лесу.','Две дороги однажды слились в один свет.'];
const palettes=['#b5a9d5','#ffb77f','#7ce5ef','#a8db98','#f8e0a4','#ed95c1'];
const draw=(kind,params={})=>{
 if(!api.inRoom?.()||api.role?.()<0){api.announce?.('Сначала подключитесь вдвоём');return;}
 api.send?.({t:'v21Action',kind,...params,actionId:nonce+'-'+(++serial)});
};
const request=(type,params={})=>api.send?.({t:type,...params,actionId:nonce+'-'+(++serial)});
const node=(tag,cls,content)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(content!==undefined)el.textContent=content;return el;};
const btn=(text,cb,disabled=false)=>{const b=node('button','v21-btn',text);b.type='button';b.disabled=!!disabled;b.addEventListener('click',cb);return b;};
function heading(parent,name){parent.append(node('h3','v21-heading',name));}
function para(parent,text){parent.append(node('p','v21-paragraph',text));}
function group(parent,title){const x=node('section','v21-section');heading(x,title);parent.append(x);return x;}
function actions(parent,buttons){const g=node('div','v21-actions');for(const b of buttons)g.append(b);parent.append(g);}
function selectInfo(parent,label,value){const r=node('div','v21-row');r.append(node('span',null,label),node('strong',null,String(value)));parent.append(r);}
function announce(text){api.announce?.(text,2.8);}
function palette(parent){const g=node('div','v21-palette');palettes.forEach((c,i)=>{
 const b=btn('●',()=>{paintColor=i;render();});b.style.background=c;b.style.color='#111b35';b.style.outline=i===paintColor?'3px solid white':'none';b.setAttribute('aria-label','Цвет '+(i+1));g.append(b);
});parent.append(g);}
function renderLevel(){
 const role=api.role?.()??-1,stage=state?.stage??api.stage?.()??0,core=state?.world?.v21;
 const section=group(body,'Новые кооперативные испытания');
 if(core){
  para(section,(stage-111)+'/10 · '+labels[core.kind]+(core.completed?' — решено':''));
  para(section,levels[stage-112]?.objective||'Исследуйте новую главу вдвоём.');
  if(core.kind==='knowledge'){
   if(role===0)para(section,'Ваша карта: ✧ → ☀ → ☾. Передайте порядок второму игроку.');
   else para(section,'Ваши знаки: 0 = ☀, 1 = ☾, 2 = ✧. Попросите Искру назвать порядок.');
   selectInfo(section,'Правильных символов',core.knowledge.progress+'/3');
  }
  if(core.kind==='trails')selectInfo(section,'Пройдено платформ',core.trailCrossings+'/4');
  if(core.kind==='transfer')selectInfo(section,'Сфера',core.transfer.delivered?'Доставлена':core.transfer.received?'У Эха':core.transfer.sent?'Перенесена':'На алтаре');
  if(core.kind==='lantern')selectInfo(section,'Мост',core.lantern.bridgeCrossed?'Пройден':core.lantern.lit?'Освещён':'Скрыт');
  if(core.kind==='transform')selectInfo(section,'Световые ключи',core.transform.tokens.filter(Boolean).length+'/2');
  if(core.kind==='weather')selectInfo(section,'Небесный сосуд',Math.floor(core.weather.charge*10)/10+'/2');
  if(core.kind==='cargo')selectInfo(section,'Перемещения груза',core.cargo.step+'/3');
  if(core.kind==='tree')selectInfo(section,'Ветвей',core.tree.growth+'/6');
  if(core.kind==='maze')selectInfo(section,'Контрольные точки',core.maze.checkpoint+'/3');
  if(core.kind==='asymmetry')selectInfo(section,'Обмен ролями',core.asymmetry.phase+'/2');
  const allowed=[];
  const push=(label,kind,params,disabled=false)=>allowed.push(btn(label,()=>draw(kind,params),disabled));
  switch(core.kind){
   case 'trails':push('✨ Оставлять следы','trail_mark',{},role!==0);break;
   case 'transfer':
    push('Передать сферу','transfer_send',{},role!==0);
    push('Получить сферу','transfer_receive',{},role!==1);
    push('Доставить сферу','transfer_deliver',{},role!==1);break;
   case 'knowledge':
    [0,1,2].forEach((n)=>push(['☀ Солнце','☾ Луна','✧ Звезда'][n],'knowledge_symbol',{value:n},role!==1));break;
   case 'lantern':push(core.lantern.lit?'Погасить фонарь':'Зажечь фонарь','lantern_toggle',{},role!==0);break;
   case 'transform':push('Сменить форму: герой → зверь/птица → сфера','transform');push('Взять ключ','transform_collect');push('Соединить две сферы','transform_orb_link');break;
   case 'weather':push('Направить ветер','weather_wind',{},role!==0);push('Вызвать дождь','weather_rain',{},role!==1);break;
   case 'cargo':push('Толкнуть вместе','cargo_push');break;
   case 'tree':push('Вырастить ветвь','tree_grow',{},role!==core.tree.growth%2);break;
   case 'maze':push('Повернуть секцию','maze_rotate',{},role!==1);push('Пройти отметку','maze_checkpoint',{},role!==0);break;
   case 'asymmetry':
    push('Запустить механизм','asym_action');push('Пройти после сигнала','asym_cross');break;
  }
  actions(section,allowed);
  para(section,'Все положения предметов и решения сверяются сервером. На компьютере откройте меню клавишей V; на iPhone используйте панель управления.');
 }else para(section,'Новые механики доступны в отдельной главе v21. Старая кампания остаётся без изменений.');
 const select=group(body,'Глава v21 · 10 испытаний');
 if(role===0){
  const g=node('div','v21-levels');const unlocked=state?.v21Unlocked??112;
  levels.forEach((level,i)=>g.append(btn(String(i+1)+' · '+level.title,()=>api.send?.({t:'selectStage',stage:112+i}),112+i>unlocked)));
  select.append(g);
 }else para(select,role<0?'Зритель может наблюдать за игрой':'Попросите Искру выбрать новый уровень.');
}
function renderStory(){
 const m=community||{},role=api.role?.()??-1;
 const s=group(body,'Моменты тишины');
 para(s,'Необязательные совместные сцены под звёздами между испытаниями. Оба участника должны согласиться. '+(m.mode==='romance'?'«Мы смотрим на одно небо, даже когда далеко друг от друга».':'«Расстояние не помешает нашей дружбе и общим приключениям».'));
 actions(s,[btn('✦ Посидеть под звёздами',()=>draw('rest'))]);
 const prequel=group(body,'До первой встречи · личные предыстории');
 para(prequel,notes[Math.min(2,m.prequel?.[role]||0)]);
 selectInfo(prequel,'Ваша часть',((m.prequel?.[role]||0))+'/3');
 actions(prequel,[btn('Открыть следующий фрагмент',()=>draw('prequel'),(m.prequel?.[role]||0)>=3)]);
 const path=group(body,'Выбор, влияющий на дорогу');
 para(path,'Согласуйте вместе маршрут. Новый путь добавляет платформы в главе v21.');
 selectInfo(path,'Общий выбор',m.branch?'Открыть новый путь':'Поддержать друг друга');
 actions(path,[btn('Помочь друг другу',()=>draw('branch_vote',{value:0})),btn('Открыть новый путь',()=>draw('branch_vote',{value:1}))]);
 const mode=group(body,'Ваша история');
 para(mode,'Режим дружбы и романтики меняет необязательные реплики, а не доступ к уровням.');
 selectInfo(mode,'Тональность',m.mode==='romance'?'Романтика':'Дружба');
 actions(mode,[btn('🤝 Дружба',()=>draw('mode_vote',{value:'friends'})),btn('♡ Романтика',()=>draw('mode_vote',{value:'romance'}))]);
 const diary=group(body,'Книга нашей истории');
 const entries=(m.diary||[]).slice(-20).reverse();
 if(!entries.length)para(diary,'Первая страница появится после совместного события.');
 for(const item of entries)para(diary,(item.day||'')+' · '+item.title);
 const letters=group(body,'Запечатанные послания');
 para(letters,'Короткое сообщение откроется вам обоим после перехода на следующий уровень. Оно видно только участникам комнаты, не зрителям.');
 for(const item of secret){const r=node('div','v21-letter');r.append(node('span',null,(item.from===0?'Искра':'Эхо')+': '+item.body));if(item.from===role)r.append(btn('Удалить',()=>draw('letter_delete',{value:item.id})));letters.append(r);}
 const editor=node('textarea','v21-textarea');editor.maxLength=120;editor.rows=2;editor.placeholder='Короткое послание для партнёра';letters.append(editor);
 letters.append(btn('✉ Запечатать до следующего уровня',()=>{draw('letter_send',{value:editor.value});editor.value='';}));
}
function musicPlayback(notes){
 if(!notes?.length)return;
 const AudioContext=root.AudioContext||root.webkitAudioContext;if(!AudioContext)return announce('Воспроизведение не поддерживается');
 try{
  const ctx=new AudioContext();ctx.resume();
  const frequencies=[261.63,293.66,329.63,349.23,392,440,493.88,523.25];
  notes.forEach((n,i)=>{const o=ctx.createOscillator(),gain=ctx.createGain(),t=ctx.currentTime+.04+i*.29;
   o.type='sine';o.frequency.value=frequencies[n.note];gain.gain.setValueAtTime(.0001,t);gain.gain.linearRampToValueAtTime(.09,t+.03);gain.gain.exponentialRampToValueAtTime(.0001,t+.24);
   o.connect(gain);gain.connect(ctx.destination);o.start(t);o.stop(t+.27);
  });
  setTimeout(()=>ctx.close().catch(()=>{}),notes.length*290+650);
 }catch(_){announce('Аудио на этом устройстве недоступно');}
}
function renderHome(){
 const m=community||{},role=api.role?.()??-1;
 const garden=group(body,'Живой сад');
 para(garden,'Выращивайте растения по очереди. Каждый второй совместный уход раскрывает новый цветок.');
 selectInfo(garden,'Рост сада',(m.garden?.growth||0)+'/12');
 const plant=node('div','v21-plant','🌱 '+Array.from({length:Math.min(12,m.garden?.growth||0)},()=>'✿').join(' '));garden.append(plant);
 garden.append(btn('Полить и ухаживать',()=>draw('garden_tend'),(m.garden?.steps||0)%2!==role));
 const mailbox=group(body,'Почтовый ящик наших воспоминаний');
 para(mailbox,'Запечатанные послания показываются здесь только после разблокировки следующего уровня.');
 if(!secret.length)para(mailbox,'Пока ни одного открытого послания.');
 for(const item of secret)mailbox.append(node('div','v21-letter',(item.from===0?'✦ Искра: ':'◈ Эхо: ')+item.body));
 const aquarium=group(body,'Аквариум светлячков');
 para(aquarium,'Существа коллекционируются за первые прохождения новых эпизодов.');
 const icons={ember:'✨',moon:'🌙',pearl:'🫧',mist:'🦋',nebula:'⭐'};
 aquarium.append(node('div','v21-creatures',(m.aquarium||[]).map(x=>icons[x]||'✧').join('  ')||'Пока никого'));
 aquarium.append(btn('Покормить светлячков',()=>draw('aquarium_feed')));
 const music=group(body,'Музыкальная комната');
 para(music,'Создайте свою мелодию из 16 нот. Искра и Эхо нажимают клавиши по очереди.');
 selectInfo(music,'Мелодия',(m.melody||[]).length+'/16');
 const keys=node('div','v21-piano');
 for(let i=0;i<8;i++)keys.append(btn('♪ '+['До','Ре','Ми','Фа','Соль','Ля','Си','До↑'][i],()=>draw('music_note',{value:i}),(m.melody||[]).length%2!==role||(m.melody||[]).length>=16));
 music.append(keys);actions(music,[btn('▶ Сыграть',()=>musicPlayback(m.melody)),btn('↺ Новая мелодия',()=>draw('music_reset'),role!==0)]);
 const painting=group(body,'Наша совместная картина');
 para(painting,'Каждый рисует свою половину 8×8: Искра — левую, Эхо — правую. Картина синхронизируется между устройствами.');
 palette(painting);
 const canvas=node('div','v21-paint-grid');
 for(let y=0;y<8;y++)for(let x=0;x<8;x++){
  const v=m.painting?.[y*8+x]??-1,cell=btn(' ',()=>draw('paint_cell',{x,y,value:paintColor}),role===0?x>=4:x<4);
  cell.className='v21-paint-cell';cell.style.background=v<0?'#303a5d':palettes[v];cell.title='Строка '+(y+1)+', колонка '+(x+1);
  canvas.append(cell);
 }
 painting.append(canvas);
}
function renderEvents(){
 const m=community||{};
 const week=group(body,'Еженедельное испытание');
 para(week,'Каждую неделю выбран один эпизод v21. Лидерборд показывает лучшее подтверждённое сервером время команд. Имена анонимизированы.');
 if(leaderboard){selectInfo(week,'Неделя',leaderboard.week);selectInfo(week,'Испытание',String(leaderboard.target-111)+'/10');
  const results=node('ol','v21-scores');(leaderboard.items||[]).forEach(x=>results.append(node('li','',x.label+' — '+Number(x.time).toFixed(1)+' с')));week.append(results);
  if(!(leaderboard.items||[]).length)para(week,'Пока ни одной завершившей команды.');
 }
 actions(week,[btn('Обновить таблицу',()=>api.send?.({t:'v21Weekly'})),btn('Перейти в еженедельный уровень',()=>api.send?.({t:'selectStage',stage:leaderboard?.target}),api.role?.()!==0||!leaderboard)]);
 const season=group(body,'Сезонные главы');
 const month=new Date().getUTCMonth(),seasons=['Зимняя ночь','Весенний сад','Летние светлячки','Осенний фестиваль'];
 const idx=month===11||month<=1?0:month<=4?1:month<=7?2:3;
 para(season,seasons[idx]+': проходите совместные испытания и сохраняйте памятный сезонный трофей.');
 const stories=[
  ['Ледяной фонарь мерцает под снегом.','Искра согревает маленькую звезду.','Эхо открывает северные ворота.','Оба возвращают свет зимнему небу.'],
  ['Первые ростки пробуждаются от сна.','Искра рисует круг в земле.','Эхо переносит солнечную росу.','Оба встречают цветение сада.'],
  ['Светлячки пролетают над водой.','Искра показывает им путь домой.','Эхо собирает отражения звёзд.','Оба устраивают фестиваль света.'],
  ['Листья поют тихую мелодию.','Искра находит золотую ветку.','Эхо завершает узор на дереве.','Оба зажигают праздничный фонарь.']
 ];
 const step=Math.min(4,m.seasonProgress?.step||0);
 para(season,step<4?stories[idx][step]:'Сезонный сюжет завершён!');
 selectInfo(season,'Сцен',step+'/4');
 actions(season,[btn('✦ Продолжить сезонную историю',()=>draw('season_step'),api.role?.()!==step%2||step>=4)]);
 const museum=group(body,'Музей совместных побед');
 para(museum,'Подтверждённые уровни и сезонные достижения превращаются в постоянные трофеи.');
 const trophies=m.trophies||[];
 if(!trophies.length)para(museum,'Первые трофеи ещё впереди.');
 trophies.slice(-28).reverse().forEach(t=>museum.append(node('div','v21-trophy','🏆 '+t.replace(/^(trophy-|season-)/,''))));
}
function renderCommunity(){
 const section=group(body,'Обмен авторскими уровнями');
 para(section,'Карты состоят только из проверяемой геометрии. Публичные названия и содержимое требуют модерации; доступна отправка жалобы.');
 actions(section,[btn('Опубликовать мой уровень',()=>request('v21Publish',{blueprint:GameExpansion.currentBlueprint?.()}),api.role?.()!==0),btn('Обновить галерею',()=>api.send?.({t:'v21GalleryList'}))]);
 if(!galleryCacheReady())return para(section,'Загрузка списка опубликованных уровней.');
 if(!communityGallery.length)return para(section,'Пока нет опубликованных карт.');
 for(const item of communityGallery){
  const card=node('article','v21-gallery-card');
  card.append(node('strong','',item.title),node('span','',item.platforms+' платформ · '+item.author));
  actions(card,[btn('▶ Играть вдвоём',()=>request('v21GalleryPlay',{id:item.id}),api.role?.()!==0),btn('Пожаловаться',()=>request('v21Report',{id:item.id}))]);
  section.append(card);
 }
}
let communityGallery=[],galleryLoaded=false;
function galleryCacheReady(){return galleryLoaded;}
async function takePhoto(){
 const source=api.canvas?.();if(!source)return announce('Кадр недоступен');
 const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
 const c=canvas.getContext('2d');c.drawImage(source,0,0);c.fillStyle='#081126b8';c.fillRect(0,canvas.height-65,canvas.width,65);
 c.font='bold 21px system-ui';c.fillStyle='#f6eaff';
 const caption=$('v21-photo-caption')?.value?.trim()?.slice(0,64)||'Наш общий путь';
 c.fillText('✦ Linked by Light · '+caption,28,canvas.height-24);
 canvas.toBlob(async blob=>{
  if(!blob){announce('Кадр не удалось создать');return;}
  const file=new File([blob],'linked-by-light-memory.png',{type:'image/png'});
  if(navigator.canShare?.({files:[file]})&&navigator.share){
   try{await navigator.share({files:[file],title:'Linked by Light'});return;}catch(e){if(e.name==='AbortError')return;}
  }
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=file.name;link.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
 },'image/png');
}
function renderPhoto(){
 const section=group(body,'Фоторежим · делитесь совместными моментами');
 para(section,'Сохраните изображение игрового поля с подписью. Кадр остаётся на вашем устройстве, сервер его не получает.');
 const input=node('input','v21-photo-input');input.id='v21-photo-caption';input.maxLength=64;input.placeholder='Наш общий путь';section.append(input);
 section.append(btn('📷 Создать памятное фото',takePhoto));
}
function render(){
 if(!dialog?.open)return;
 lastRender=performance.now();body.replaceChildren();
 body.append(node('p','v21-subtitle','Linked by Light v21 · Навстречу друг другу'));
 if(!api.inRoom?.()){para(body,'Создайте комнату в новой кампании и пригласите второго игрока.');body.append(btn('✦ Начать новую главу',()=>{dialog.close();api.create?.();}));return;}
 if(api.role?.()<0){para(body,'Вы наблюдатель. Совместные действия доступны только игрокам.');}
 if(tab==='level')renderLevel();
 if(tab==='story')renderStory();
 if(tab==='home')renderHome();
 if(tab==='events')renderEvents();
 if(tab==='community')renderCommunity();
 if(tab==='photo')renderPhoto();
}
function onMessage(m){
 if(m.t==='v21State'){community=m.data;if(api.role?.()>=0)GameAdventure.syncV21(community);}
 if(m.t==='v21Private')secret=m.data?.letters||[];
 if(m.t==='v21Gallery'){communityGallery=m.items||[];galleryLoaded=true;}
 if(m.t==='v21WeeklyBoard')leaderboard=m;
 if(dialog?.open&&performance.now()-lastRender>60)render();
}
function onSnapshot(s){
 state=s;
 if(s?.world?.v21&&api.role?.()>=0){
  const ids=GameAdventure.data()?.v21?.unlockedStages||[];
  const id=s.world.v21.stageId;
  if(!ids.includes(id)){
   const old=community||{};community={...old,unlockedStages:[...(old.unlockedStages||[]),id]};
   GameAdventure.syncV21(community);
  }
 }
 if(dialog?.open&&performance.now()-lastRender>900)render();
 quick.style.display=s.world?.v21&&api.role?.()>=0?'flex':'none';
}
function paint(ctx,level,players,world,clock,role){
 if(!world||!level?.v21)return;
 const c=level.v21;ctx.save();ctx.font='bold 15px system-ui';ctx.textAlign='center';
 const marker=(x,label,active)=>{ctx.strokeStyle=active?'#bffaff':'#ffd2a6';ctx.fillStyle='#f2ebff';ctx.shadowColor='#ae99ed';ctx.shadowBlur=active?18:7;ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,GROUND-30,24,0,Math.PI*2);ctx.stroke();ctx.fillText(label,x,GROUND-65);ctx.shadowBlur=0;};
 marker(c.anchor,labels[world.kind],world.completed);marker(c.goal,'◈ Второй путь',world.completed);
 if(world.kind==='trails')for(const s of world.trail){ctx.fillStyle='#efc8ffb8';ctx.fillRect(s.x,s.y,95,12);}
 if(world.kind==='lantern'){
  if(role===0||role===-1){ctx.fillStyle='#adcaff9c';ctx.fillRect(c.anchor+310,459,260,17);}
  if(world.lantern.lit&&(role===1||role===-1)){ctx.fillStyle='#fff2ae9c';ctx.fillRect(c.anchor+360,459,230,17);}
 }
 if(world.kind==='transform'&&world.transform.forms[1]!=='fox'&&(role===1||role===-1)){ctx.fillStyle='#bd92d4';ctx.fillRect(c.anchor+320,544-76,28,76);}
 if(world.kind==='maze'&&world.maze.turn<=world.maze.checkpoint&&world.maze.checkpoint<3&&(role===0||role===-1)){ctx.fillStyle='#e9b9ff';ctx.fillRect(c.anchor+310+world.maze.checkpoint*150,544-100,29,100);}
 if(world.kind==='tree')for(let i=0;i<world.tree.growth;i++){ctx.fillStyle='#a8ecc69e';ctx.fillRect(c.anchor+i*115,440-i%3*32,125,16);}
 if(world.kind==='cargo'){ctx.fillStyle='#c2dcff';ctx.shadowColor='#8beeff';ctx.shadowBlur=22;ctx.fillRect(world.cargo.x,GROUND-64,65,64);ctx.shadowBlur=0;}
 if(world.branch===1){ctx.fillStyle='#eed2a9bb';ctx.fillRect(c.anchor+310,399,172,17);}
 if(world.kind==='transform'&&world.transform.orbLink){ctx.fillStyle='#c0faffbb';ctx.fillRect(c.goal+100,398,180,18);}
 if(world.kind==='transform'){
  for(const p of players){if(world.transform.forms[p.type]!=='normal'){
   ctx.fillStyle=p.type===0?'#ffe7af':'#b9f9dd';ctx.fillText(world.transform.forms[p.type]==='orb'?'✨':p.type===0?'🕊️':'🦊',p.x+15,p.y-14);
  }}
 }
 if(world.kind==='weather'){ctx.fillStyle='#cff7ff';ctx.fillText(world.weather.wind>0?'🌬️':'' ,c.anchor,GROUND-95);ctx.fillText(world.weather.rain>0?'🌧️':'',c.goal,GROUND-95);}
 if(world.kind==='maze'&&world.maze.turn%2===1){ctx.fillStyle='#bcb4f0ac';ctx.fillRect(c.anchor+280,455,150,18);}
 if(world.kind==='maze'){ctx.fillStyle='#b6b4fc';ctx.fillText('⤾ '+world.maze.turn,c.anchor+240,GROUND-102);}
 ctx.restore();
}
function open(t){
 tab=t;if(!dialog.open)dialog.showModal();render();
 if(t==='events')api.send?.({t:'v21Weekly'});
 if(t==='community')api.send?.({t:'v21GalleryList'});
}
function init(callbacks){
 api=callbacks;
 const bytes=new Uint32Array(2);crypto.getRandomValues(bytes);nonce='v21'+Array.from(bytes,v=>v.toString(36)).join('');
 const menu=$('createBtn')?.parentElement;
 if(menu){menu.append(btn('✨ Новая глава v21',()=>api.create?.()));
  const saved=GameAdventure.data()?.v21?.unlockedStages||[];
  let last=112;for(let i=112;i<=121;i++){if(!saved.includes('v21-'+String(i-111).padStart(2,'0')))break;last=i;}
  if(last>112)menu.append(btn('▶ Продолжить v21 · '+(last-111)+'/10',()=>api.resume?.(last)));
 }
 const host=document.querySelector('.frame')||document.body;
 nav=btn('✧ v21 · Наш мир',()=>open('level'));nav.classList.add('v21-toggle');host.append(nav);
 quick=node('div','v21-quick');
 quick.append(btn('✦ Действия',()=>open('level')));
 host.append(quick);quick.style.display='none';
 dialog=node('dialog','v21-dialog');
 const top=node('header','v21-top');top.append(node('strong','', 'Навстречу друг другу'),btn('✕ Закрыть',()=>dialog.close()));dialog.append(top);
 const tabs=node('nav','v21-tabs');
 for(const [key,title] of [['level','Испытания'],['story','История'],['home','Дом'],['events','События'],['community','Карты'],['photo','Фото']])tabs.append(btn(title,()=>open(key)));
 dialog.append(tabs);body=node('div','v21-body');dialog.append(body);document.body.append(dialog);
}
root.GameV21={init,onMessage,onSnapshot,draw:paint,open,act:draw};
})(typeof window!=='undefined'?window:globalThis);
