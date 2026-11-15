'use strict';
// v21 social systems. No currencies or purchase endpoints, no user identity leaks.
const crypto=require('node:crypto');
const puzzles=require('./v21-core');
const expansion=require('./expansion-core');
const valid=(v,choices)=>choices.includes(v);
const text=(v,n)=>puzzles.capText(v,n);
const between=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const unique=(v,max)=>Array.from(new Set((Array.isArray(v)?v:[]).filter(x=>typeof x==='string'&&x.length<70))).slice(0,max);
const roomsProfile=()=>({
 schemaVersion:1,unlockedStages:[],diary:[],restScenes:[],prequel:[0,0],
 mode:'friends',votes:[null,null],branch:0,branchVotes:[null,null],
 letters:[],garden:{steps:0,growth:0},aquarium:[],melody:[],painting:Array(64).fill(-1),
 trophies:[],completed:[],weeklyRecords:{},seasons:[],seasonProgress:{id:'',step:0},lastResult:'',
 counters:{paint:0,note:0},lastDay:''
});
function cleanRoom(raw){
 const d=roomsProfile(),v=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 d.unlockedStages=unique(v.unlockedStages,10).filter(x=>/^v21-(0[1-9]|10)$/.test(x));
 d.diary=(Array.isArray(v.diary)?v.diary:[]).filter(x=>x&&typeof x==='object'&&x.type==='event')
  .slice(-40).map(x=>({type:'event',stage:between(x.stage,0,121)?x.stage:0,kind:text(x.kind,25),title:text(x.title,75),day:/^\d{4}-\d{2}-\d{2}$/.test(x.day||'')?x.day:puzzles.weekKey()}));
 d.restScenes=unique(v.restScenes,20);
 d.prequel=[0,1].map(i=>between(v.prequel?.[i],0,3)?v.prequel[i]:0);
 d.mode=valid(v.mode,['friends','romance'])?v.mode:'friends';
 d.branch=between(v.branch,0,1)?v.branch:0;
 d.garden={steps:between(v.garden?.steps,0,24)?v.garden.steps:0,growth:between(v.garden?.growth,0,12)?v.garden.growth:0};
 d.aquarium=unique(v.aquarium,5).filter(x=>valid(x,['ember','moon','pearl','mist','nebula']));
 d.melody=(Array.isArray(v.melody)?v.melody:[]).filter(x=>x&&between(x.note,0,7)&&between(x.role,0,1)).slice(0,16).map(x=>({note:x.note,role:x.role}));
 d.painting=Array.from({length:64},(_,i)=>between(v.painting?.[i],-1,5)?v.painting[i]:-1);
 d.trophies=unique(v.trophies,64);
 d.completed=unique(v.completed,122);
 d.weeklyRecords=v.weeklyRecords&&typeof v.weeklyRecords==='object'?Object.fromEntries(Object.entries(v.weeklyRecords).filter(([k,n])=>/^\d{4}-W\d{2}$/.test(k)&&Number.isFinite(n)&&n>0&&n<36000).slice(-10)):{};
 d.seasons=unique(v.seasons,16).filter(x=>/^\d{4}-(winter|spring|summer|autumn)$/.test(x));
 d.seasonProgress={id:typeof v.seasonProgress?.id==='string'&&/^\d{4}-(winter|spring|summer|autumn)$/.test(v.seasonProgress.id)?v.seasonProgress.id:'',step:between(v.seasonProgress?.step,0,4)?v.seasonProgress.step:0};
 d.lastResult=text(v.lastResult,100);
 d.counters={paint:between(v.counters?.paint,0,10000)?v.counters.paint:0,note:between(v.counters?.note,0,10000)?v.counters.note:0};
 d.letters=(Array.isArray(v.letters)?v.letters:[]).filter(x=>x&&between(x.from,0,1)&&typeof x.body==='string')
  .slice(-8).map(x=>({id:text(x.id,24),from:x.from,body:text(x.body,120),
   unlock:between(x.unlock,0,121)?x.unlock:0,at:Number.isFinite(x.at)?x.at:0}));
 return d;
}
function publicState(r){
 const z=r.v21World||roomsProfile();
 return {schemaVersion:1,unlockedStages:z.unlockedStages,diary:z.diary.slice(-30),restScenes:z.restScenes,
  prequel:z.prequel,mode:z.mode,modeVotes:z.votes,branch:z.branch,branchVotes:z.branchVotes,
  garden:z.garden,aquarium:z.aquarium,melody:z.melody,painting:z.painting,
  trophies:z.trophies,completed:z.completed,weeklyRecords:z.weeklyRecords,seasons:z.seasons,seasonProgress:z.seasonProgress};
}
function privateState(r,role){
 return {letters:(r.v21World?.letters||[]).filter(x=>x.unlock<=(r.game?.stage||0)).map(x=>({...x})),role};
}
function diary(r,stage,kind,title){
 const z=r.v21World||(r.v21World=roomsProfile());
 if(z.diary.some(x=>x.stage===stage&&x.kind===kind))return;
 z.diary.push({type:'event',stage,kind,title:text(title,75),day:puzzles.safeDate?puzzles.safeDate():new Date().toISOString().slice(0,10)});
 if(z.diary.length>40)z.diary.shift();
}
function act(r,role,kind,raw={}){
 if(![0,1].includes(role))return {ok:false,error:'Только для игроков'};
 const z=r.v21World||(r.v21World=roomsProfile());
 const fail=error=>({ok:false,error}),ok=detail=>({ok:true,detail});
 const stage=r.game.stage;
 if(kind==='rest'){
  const id=String(stage);
  if(z.restScenes.includes(id))return fail('Эта тихая сцена уже открыта');
  if(!Array.isArray(z.restVotes))z.restVotes=[false,false];
  z.restVotes[role]=true;
  if(z.restVotes.every(Boolean)){z.restScenes.push(id);z.restVotes=[false,false];diary(r,stage,'rest','Тихая остановка под звёздами');return ok('Вы вместе встретили рассвет');}
  return ok('Ожидаем второго героя у костра');
 }
 if(kind==='prequel'){
  if(z.prequel[role]>=3)return fail('Личная история уже прочитана');
  z.prequel[role]++;
  if(z.prequel.every(n=>n===3))diary(r,stage,'prequel','Две дороги до встречи');
  return ok('Открыта часть прошлого: '+z.prequel[role]+'/3');
 }
 if(kind==='mode_vote'){
  if(!valid(raw.value,['friends','romance']))return fail('Режим не поддерживается');
  z.votes[role]=raw.value;
  if(z.votes[0]===z.votes[1]){z.mode=raw.value;z.votes=[null,null];return ok('Общая тональность истории изменена');}
  return ok('Ожидаем одинаковое решение обоих игроков');
 }
 if(kind==='branch_vote'){
  if(!between(raw.value,0,1))return fail('Неверный вариант');
  z.branchVotes[role]=raw.value;
  if(z.branchVotes[0]===z.branchVotes[1]){
   z.branch=raw.value;z.branchVotes=[null,null];
   if(r.game.v21)r.game.v21.branch=z.branch;
   diary(r,stage,'choice',z.branch?'Новый маршрут':'Поддержать друг друга');
   return ok('Ваш выбор изменит маршруты следующих уровней');
  }
  return ok('Ожидаем совпадающие голоса');
 }
 if(kind==='letter_send'){
  const body=text(raw.value,120);
  if(!body||body.length<2)return fail('Введите от 2 до 120 символов');
  if(z.letters.filter(x=>x.from===role&&x.unlock>stage).length>=1)return fail('Одна запечатанная записка за уровень');
  if(z.letters.length>=8)z.letters.shift();
  const id=crypto.randomBytes(6).toString('hex');
  z.letters.push({id,from:role,body,unlock:stage+1,at:Date.now()});
  return ok('Послание откроется после следующего уровня');
 }
 if(kind==='letter_delete'){
  const index=z.letters.findIndex(x=>x.id===raw.value&&x.from===role);
  if(index<0)return fail('Послание не найдено');
  z.letters.splice(index,1);return ok('Своё послание удалено');
 }
 if(kind==='garden_tend'){
  if(role!==z.garden.steps%2)return fail('Сейчас очередь второго игрока');
  if(z.garden.growth>=12)return fail('Сад уже вырос');
  z.garden.steps++;if(z.garden.steps%2===0)z.garden.growth++;
  return ok('Совместный сад растёт: '+z.garden.growth+'/12');
 }
 if(kind==='aquarium_feed'){
  if(!z.aquarium.length)return fail('Сначала найдите светлячка в приключениях');
  z.aquariumMood=(z.aquariumMood||0)+1;
  return ok('Светлячки светятся ярче');
 }
 if(kind==='music_note'){
  if(!between(raw.value,0,7))return fail('Недопустимая нота');
  if(z.melody.length>=16)return fail('Мелодия завершена');
  if(z.melody.length%2!==role)return fail('Ваша очередь наступит после ноты партнёра');
  z.melody.push({note:raw.value,role});
  if(z.melody.length===16)diary(r,stage,'music','Первая общая мелодия');
  return ok('Нота '+z.melody.length+'/16 добавлена');
 }
 if(kind==='music_reset'){
  if(role!==0)return fail('Начать новую мелодию может ведущий');
  z.melody=[];return ok('Чистый нотный лист');
 }
 if(kind==='paint_cell'){
  if(!between(raw.x,0,7)||!between(raw.y,0,7)||!between(raw.value,0,5))return fail('Недопустимая клетка или цвет');
  if(raw.x<4&&role!==0||raw.x>=4&&role!==1)return fail('Каждый герой рисует свою половину картины');
  if(z.counters.paint>=2000)return fail('Лимит штрихов этой комнаты');
  z.counters.paint++;z.painting[raw.y*8+raw.x]=raw.value;
  if(z.painting.every(n=>n>=0))diary(r,stage,'painting','Нарисовали общую картину');
  return ok('Фрагмент картины сохранён');
 }
 if(kind==='season_step'){
  const key=new Date().getUTCFullYear()+'-'+puzzles.seasonId();
  if(z.seasons.includes(key))return fail('Сезонная история уже пройдена');
  if(z.completed.filter(x=>x.startsWith('v21-')).length<2)return fail('Пройдите минимум два новых испытания вдвоём');
  if(!z.seasonProgress||z.seasonProgress.id!==key)z.seasonProgress={id:key,step:0};
  if(role!==z.seasonProgress.step%2)return fail('Эту страницу истории открывает второй игрок');
  z.seasonProgress.step++;
  if(z.seasonProgress.step===4){
   z.seasons.push(key);z.trophies.push('season-'+key);
   diary(r,stage,'season','Фестиваль '+puzzles.seasonId());
   return ok('Сезонная история пройдена, трофей в музее');
  }
  return ok('Открыта сцена '+z.seasonProgress.step+'/4');
 }
 return fail('Неизвестная совместная активность');
}
function completed(r,board){
 const result=r.game.lastResult;
 if(!result?.completed)return;
 const z=r.v21World||(r.v21World=roomsProfile());
 const key=result.level+':'+result.elapsed+':'+result.deaths;
 if(z.lastResult===key)return;
 z.lastResult=key;
 const stage=result.level;
 const id=stage>=112&&stage<=121?'v21-'+String(stage-111).padStart(2,'0'):stage>=100?'v20-'+String(stage-99).padStart(2,'0'):'original-'+String(stage+1);
 if(!z.completed.includes(id))z.completed.push(id);
 if(puzzles.hasStage(stage)&&!z.unlockedStages.includes(id))z.unlockedStages.push(id);
 const trophy='trophy-'+id;
 if(!z.trophies.includes(trophy))z.trophies.push(trophy);
 diary(r,stage,'win','Вместе пройдено: '+r.game.level.title);
 const species=['ember','moon','pearl','mist','nebula'];
 if(puzzles.hasStage(stage)){z.garden.growth=Math.min(12,z.garden.growth+1);const creature=species[(stage-112)%5];if(!z.aquarium.includes(creature))z.aquarium.push(creature);}
 if(!Array.isArray(board))return;
 const w=puzzles.weekKey();
 if(stage!==puzzles.weeklyStage())return;
 const time=Number(result.elapsed);
 if(!Number.isFinite(time)||time<=0||time>36000)return;
 if(z.weeklyRecords[w]&&z.weeklyRecords[w]<=time)return;
 z.weeklyRecords[w]=time;
 const opaque='Команда '+crypto.createHash('sha256').update(r.code+w).digest('hex').slice(0,5);
 const old=board.find(x=>x.week===w&&x.label===opaque);
 if(old){old.time=Math.min(old.time,time);}else board.push({week:w,label:opaque,time});
 board.sort((a,b)=>a.week===b.week?a.time-b.time:a.week.localeCompare(b.week));
 while(board.length>100)board.shift();
}
function cleanBoard(raw){
 return (Array.isArray(raw)?raw:[]).filter(x=>/^\d{4}-W\d{2}$/.test(x?.week||'')&&/^Команда [0-9a-f]{5}$/.test(x?.label||'')&&Number.isFinite(x?.time)&&x.time>0&&x.time<36000).slice(-100);
}
function published(raw,owner,clean){
 const b=clean(raw);
 if(!b||!b.platforms?.length)return null;
 const title=text(b.title,32);
 if(title.length<3||!/[a-zа-яё0-9]/i.test(title))return null;
 return {id:crypto.randomBytes(6).toString('hex'),title,blueprint:{...b,title},
  author:'Творцы света',created:Date.now(),reports:[],owner,hidden:false};
}
function publicGallery(items){
 return (items||[]).filter(x=>!x.hidden).slice(-30).map(x=>({id:x.id,title:x.title,author:x.author,created:x.created,platforms:x.blueprint.platforms.length}));
}
function cleanGallery(raw,clean){
 return (Array.isArray(raw)?raw:[]).slice(-40).flatMap(x=>{
  const b=clean(x?.blueprint);if(!b||!b.platforms?.length||!/^([a-f0-9]{12})$/.test(x.id||''))return [];
  return [{id:x.id,title:text(x.title,32),author:'Творцы света',blueprint:b,created:Number(x.created)||0,
    owner:typeof x.owner==='string'&&x.owner.length===6?x.owner:'',reports:[],hidden:!!x.hidden}];
 });
}
module.exports={roomsProfile,cleanRoom,publicState,privateState,act,completed,cleanBoard,published,publicGallery,cleanGallery,diary};
