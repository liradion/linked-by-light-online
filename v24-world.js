'use strict';
// v24 Living World: cooperative side quests and home activities, no paid rewards.
const crypto=require('node:crypto');
const TYPES=['keeper','navigator','hermit','secret'];
const RECIPES=['moon-bread','starlight-soup','berry-pie','sun-tea'];
const CRAFTS=['sky-lantern','compass','glider'];
const GAMES=['race','search','puzzle'];
const MAX=9999;
const integer=(x,min,max)=>Number.isInteger(x)&&x>=min&&x<=max;
const unique=(list,allowed,limit=64)=>Array.from(new Set((Array.isArray(list)?list:[])
 .filter(x=>typeof x==='string'&&allowed.includes(x)))).slice(0,limit);
function initial(){
 return {schema:24,npcs:[],quests:{keeper:0,navigator:0,hermit:0,secret:0},
  kitchen:{recipe:0,step:0,finished:[]},expedition:{seed:0,room:0,active:false,completed:0,loot:0},
  observatory:{progress:0,constellations:0},workshop:{crafted:[]},
  minigame:{kind:'race',round:0,score:[0,0],active:false,bests:{race:0,search:0,puzzle:0}},
  narrative:{votes:[null,null],path:0,answers:[[],[]],epilogue:null,endingVotes:[null,null]},
  achievements:[],events:[]};
}
function clean(raw){
 const z=initial(),v=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 z.npcs=unique(v.npcs,TYPES,4);
 for(const n of TYPES)z.quests[n]=integer(v.quests?.[n],0,3)?v.quests[n]:0;
 z.kitchen={recipe:integer(v.kitchen?.recipe,0,3)?v.kitchen.recipe:0,step:integer(v.kitchen?.step,0,8)?v.kitchen.step:0,
  finished:unique(v.kitchen?.finished,RECIPES,4)};
 z.expedition={seed:integer(v.expedition?.seed,0,0x7fffffff)?v.expedition.seed:0,
  room:integer(v.expedition?.room,0,5)?v.expedition.room:0,
  active:v.expedition?.active===true,completed:integer(v.expedition?.completed,0,999)?v.expedition.completed:0,
  loot:integer(v.expedition?.loot,0,20)?v.expedition.loot:0};
 z.observatory={progress:integer(v.observatory?.progress,0,8)?v.observatory.progress:0,
  constellations:integer(v.observatory?.constellations,0,10)?v.observatory.constellations:0};
 z.workshop={crafted:unique(v.workshop?.crafted,CRAFTS,3)};
 const kinds=GAMES,mg=v.minigame||{};
 z.minigame={kind:kinds.includes(mg.kind)?mg.kind:'race',round:integer(mg.round,0,6)?mg.round:0,
  score:[0,1].map(i=>integer(mg.score?.[i],0,100)?mg.score[i]:0),
  active:mg.active===true,bests:Object.fromEntries(kinds.map(k=>[k,integer(mg.bests?.[k],0,100)?mg.bests[k]:0]))};
 const a=v.narrative||{};
 z.narrative={votes:[0,1].map(i=>[null,0,1].includes(a.votes?.[i])?a.votes[i]:null),
  path:integer(a.path,0,1)?a.path:0,answers:[0,1].map(i=>(Array.isArray(a.answers?.[i])?a.answers[i]:[])
    .filter(x=>integer(x,0,2)).slice(0,5)),
  epilogue:['dawn','promise','aurora'].includes(a.epilogue)?a.epilogue:null,
  endingVotes:[0,1].map(i=>[null,0,1,2].includes(a.endingVotes?.[i])?a.endingVotes[i]:null)};
 z.achievements=unique(v.achievements,['cook','explorer','sky','maker','rivals','secret','story'],7);
 z.events=(Array.isArray(v.events)?v.events:[]).filter(x=>x&&typeof x==='object'&&Number.isInteger(x.at)&&x.at>0&&typeof x.text==='string')
  .slice(-20).map(x=>({at:x.at,text:x.text.slice(0,75)}));
 return z;
}
const publicState=r=>r.v24World||initial();
const note=(z,text)=>{
 z.events.push({at:Date.now(),text});if(z.events.length>20)z.events.shift();
};
function action(r,role,kind,msg={}){
 if(![0,1].includes(role))return {ok:false,error:'Нужны два участника'};
 const z=r.v24World||(r.v24World=initial()),fail=error=>({ok:false,error}),ok=detail=>({ok:true,detail});
 const mark=(id)=>{if(!z.achievements.includes(id))z.achievements.push(id);};
 const questCount=Object.values(z.quests).reduce((a,b)=>a+b,0);
 if(kind==='npc_meet'){
  if(!TYPES.includes(msg.npc))return fail('Неизвестный персонаж');
  if(msg.npc==='secret'&&(z.quests.keeper<3||z.quests.navigator<3||z.quests.hermit<3))
   return fail('Тайный житель появится после трёх завершённых историй');
  if(z.npcs.includes(msg.npc))return fail('Персонаж уже знаком');
  z.npcs.push(msg.npc);note(z,'Встреча с '+msg.npc);
  if(msg.npc==='secret')mark('secret');
  return ok('Новый знакомый: '+msg.npc);
 }
 if(kind==='npc_quest'){
  const npc=msg.npc;
  if(!TYPES.includes(npc)||!z.npcs.includes(npc))return fail('Сначала познакомьтесь с персонажем');
  const step=z.quests[npc];
  if(step>=3||role!==step%2)return fail('Задание завершено или сейчас очередь партнёра');
  z.quests[npc]++;if(z.quests[npc]===3)note(z,'История '+npc+' завершена');
  return ok('История '+npc+' · '+z.quests[npc]+'/3');
 }
 if(kind==='kitchen'){
  if(z.kitchen.finished.includes(RECIPES[z.kitchen.recipe])){
   z.kitchen.recipe=(z.kitchen.recipe+1)%RECIPES.length;z.kitchen.step=0;
  }
  if(role!==z.kitchen.step%2)return fail('Сейчас готовит другой игрок');
  if(z.kitchen.step>=8)return fail('Блюдо уже готово');
  const expected=z.kitchen.step%4;
  if(!integer(msg.ingredient,0,3)||msg.ingredient!==expected)return fail('Выберите ингредиент по рецепту: '+(expected+1));
  z.kitchen.step++;
  if(z.kitchen.step===8){
   z.kitchen.finished.push(RECIPES[z.kitchen.recipe]);mark('cook');note(z,'Приготовлено: '+RECIPES[z.kitchen.recipe]);
  }
  return ok('Шаг готовки '+z.kitchen.step+'/8');
 }
 if(kind==='recipe_select'){
  if(role!==0||!integer(msg.value,0,3))return fail('Выбор рецепта доступен ведущему');
  z.kitchen.recipe=msg.value;z.kitchen.step=0;return ok('Рецепт выбран');
 }
 if(kind==='expedition_start'){
  if(role!==0||z.expedition.active)return fail('Экспедицию запускает ведущий, когда предыдущая закончена');
  z.expedition.seed=crypto.randomInt(1,0x7fffffff);z.expedition.room=0;z.expedition.active=true;
  return ok('Открыта новая экспедиция на пять комнат');
 }
 if(kind==='expedition_step'){
  const e=z.expedition;
  if(!e.active||role!==e.room%2)return fail('Сейчас очередь второго путешественника');
  const expected=(e.seed+e.room*7)%3;
  if(msg.value!==expected)return fail('Неверный проход. Ищите номер '+(expected+1));
  e.room++;
  if(e.room>=5){
   e.active=false;e.completed=Math.min(e.completed+1,999);e.loot=Math.min(20,e.loot+2);
   mark('explorer');note(z,'Совместная экспедиция завершена');
  }
  return ok('Пройдена комната '+e.room+'/5');
 }
 if(kind==='observatory'){
  const obs=z.observatory;
  if(role!==obs.progress%2)return fail('Новая звезда зажигается другим игроком');
  const sequence=[2,0,3,1,1,3,0,2];
  if(msg.value!==sequence[obs.progress]){obs.progress=0;return fail('Созвездие погасло, попробуйте снова');}
  obs.progress++;
  if(obs.progress===8){
   obs.progress=0;obs.constellations=Math.min(10,obs.constellations+1);
   mark('sky');note(z,'Собрано созвездие №'+obs.constellations);
  }
  return ok('Звёзды '+obs.progress+'/8');
 }
 if(kind==='craft'){
  if(role!==0||!CRAFTS.includes(msg.value))return fail('Инструмент выбирает ведущий');
  if(z.workshop.crafted.includes(msg.value))return fail('Такое устройство уже построено');
  if(z.expedition.loot<=0||z.observatory.constellations<=0)return fail('Нужны находка из экспедиции и созвездие');
  z.expedition.loot--;z.workshop.crafted.push(msg.value);mark('maker');note(z,'Создан предмет: '+msg.value);
  return ok('Устройство создано для дома');
 }
 if(kind==='minigame_start'){
  if(role!==0||!GAMES.includes(msg.value))return fail('Ведущий выбирает игру');
  z.minigame={...z.minigame,kind:msg.value,round:0,score:[0,0],active:true};
  return ok('Мини-турнир: '+msg.value);
 }
 if(kind==='minigame_move'){
  const g=z.minigame;
  if(!g.active||role!==g.round%2)return fail('Ожидайте своей очереди');
  const lookup={race:1,search:2,puzzle:0};
  if(msg.value!==lookup[g.kind])return fail('Команда не подошла к текущему испытанию');
  g.score[role]++;g.round++;
  if(g.round===6){g.active=false;g.bests[g.kind]=Math.max(g.bests[g.kind],Math.max(...g.score));mark('rivals');}
  return ok('Раунд '+g.round+'/6');
 }
 if(kind==='branch_vote'){
  if(!integer(msg.value,0,1))return fail('Недопустимое решение');
  z.narrative.votes[role]=msg.value;
  if(z.narrative.votes[0]===z.narrative.votes[1]){
   z.narrative.path=msg.value;z.narrative.votes=[null,null];note(z,'Принято совместное сюжетное решение');
   return ok('Новая ветка сюжета выбрана');
  }
  return ok('Нужен голос второго игрока');
 }
 if(kind==='dialogue_answer'){
  if(!integer(msg.value,0,2))return fail('Недопустимый ответ');
  if(z.narrative.answers[role].length>=5)return fail('Все пять диалогов завершены');
  z.narrative.answers[role].push(msg.value);
  return ok('Ответ сохранён в общей истории');
 }
 if(kind==='ending_vote'){
  if(!integer(msg.value,0,2))return fail('Недопустимый финал');
  if(z.narrative.epilogue)return fail('Эпилог уже открыт');
  if(z.quests.keeper<3||z.quests.navigator<3||z.narrative.answers.some(x=>x.length<3))
   return fail('Завершите две истории NPC и по три диалога каждому');
  z.narrative.endingVotes[role]=msg.value;
  if(z.narrative.endingVotes[0]===z.narrative.endingVotes[1]){
   const endings=['dawn','promise','aurora'];
   z.narrative.epilogue=endings[msg.value];z.narrative.endingVotes=[null,null];mark('story');
   note(z,'Открыт эпилог: '+z.narrative.epilogue);
   return ok('История завершена, эпилог добавлен в альбом');
  }
  return ok('Ожидаем согласие партнёра');
 }
 return fail('Неизвестная активность живого мира');
}
module.exports={initial,clean,publicState,action,TYPES,RECIPES,CRAFTS,GAMES};
