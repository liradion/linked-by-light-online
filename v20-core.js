'use strict';
// Linked by Light v20: authoritative cooperative physics, puzzles, bosses, home and story.
const {stages}=require('./shared/v20-stages');
const GROUND=544, FIRST=100, LAST=111, DT=1/60;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const near=(p,x,r=120)=>Math.abs(p.x+15-x)<=r&&p.y<GROUND+30;
const hasStage=index=>Number.isInteger(index)&&index>=FIRST&&index<=LAST;
const getStage=index=>hasStage(index)?stages[index-FIRST]:null;
const sceneLines=[
 ['Два огонька находят оборванную нить.','Искра: «Ты ещё слышишь меня?»','Эхо: «Да. Даже сквозь тишину».'],
 ['Первое зеркало показывает разные дороги.','Эхо: «Я вижу мост, которого у тебя нет».','Искра: «Тогда доверюсь твоим шагам».'],
 ['В кристалле сохранилось общее воспоминание.','Искра: «А если забыть дорогу?»','Эхо: «Я запомню её за нас двоих».'],
 ['Смотритель граней закрывает проход.','Смотритель: «Два отражения не могут быть одним».','Герои: «И не должны. Мы помогаем друг другу».'],
 ['Часы перестают идти одновременно.','Эхо: «Мой миг уже прошёл».','Искра: «Тогда поделюсь своим».'],
 ['Механизм движется только от взаимного доверия.','Искра: «Сейчас я буду ждать».','Эхо: «А я завершу движение».'],
 ['Даже остановленное время оставляет след.','Эхо: «Слышишь шаги из прошлого?»','Искра: «Это мы. И мы идём дальше».'],
 ['Хранитель секунд возвращает забытый миг.','Хранитель: «Ни один миг не повторится».','Герои: «Но мы можем сделать новый».'],
 ['В саду появляется первый общий огонь.','Искра: «Здесь мог бы быть наш дом».','Эхо: «Значит, построим его вместе».'],
 ['Тень открывает последний проход.','Эхо: «Нужно ли бояться темноты?»','Искра: «Нет, пока мы видим друг друга».'],
 ['Две нити становятся одним узором.','Искра: «Можно отпустить?»','Эхо: «Можно. Мы всё равно останемся рядом».'],
 ['Сердце мира снова начинает светиться.','Сердце: «Что вы оставите после себя?»','Герои: «Дорогу для тех, кто придёт следом».']
];
const CHOICE_STAGES=new Set([101,103,105,107,109,111]);
function scene(index){if(!hasStage(index))return null;const i=index-FIRST;return {id:'scene-'+(i+1),stage:index,title:stages[i].title,lines:sceneLines[i],choices:CHOICE_STAGES.has(index)?['Помочь друг другу','Открыть новый путь']:null};}
function init(g){
 if(!hasStage(g.stage)){g.v20=null;return;}
 const conf=g.level.v20;const p=g.level.platforms;
 if(conf.kind==='time'||conf.kind==='combo')p.push({x:1120,y:414,w:142,h:18,temporal:true});
 g.v20={
  campaign:'v20',stageId:g.level.v20Id,kind:conf.kind,
  tether:{active:false,tension:0,cooldown:0},
  phase:{state:'light',flags:[false,false],complete:false},
  time:{locked:0,complete:false,phase:0,history:[]},
  flags:{tether:false,phase:false,time:false},complete:false,
  boss:conf.boss?{name:conf.boss,style:g.stage===103?'mirror':g.stage===107?'clock':'heart',x:1850,hp:g.stage===111?6:g.stage===107?5:4,max:g.stage===111?6:g.stage===107?5:4,phase:1,next:0,warning:0,attack:0,active:false,focus:0}:null
 };
}
function action(g,role,kind){
 if(!g.v20||![0,1].includes(role)||g.phase!=='playing')return {ok:false,error:'Нельзя выполнить действие'};
 const v=g.v20,p=g.players[role],mate=g.players[1-role],a=g.level.v20;
 if(kind==='tether_attach'){
  if(v.tether.active)return {ok:true,detail:'Нить уже активна'};
  if(v.tether.cooldown>0||distance(p,mate)>190)return {ok:false,error:'Подойдите ближе друг к другу'};
  v.tether.active=true;return {ok:true,detail:'Нить света соединена'};
 }
 if(kind==='tether_detach'){v.tether.active=false;v.tether.cooldown=1.5;return {ok:true,detail:'Нить отпущена'};}
 if(kind==='phase_shift'){
  if(!['phase','combo'].includes(v.kind))return {ok:false,error:'Здесь нет зеркальных печатей'};
  if(!near(p,a.phase[role],130))return {ok:false,error:'Подойдите к печати измерения'};
  if(role===1&&!v.phase.flags[0])return {ok:false,error:'Сначала нужна печать Искры'};
  v.phase.flags[role]=true;v.phase.state=role===0?'shadow':'united';
  v.phase.complete=v.phase.flags.every(Boolean);v.flags.phase=v.phase.complete;
  return {ok:true,detail:v.phase.complete?'Измерения соединены':'Мир Тени открыт'};
 }
 if(kind==='time_lock'){
  if(role!==0||!['time','combo'].includes(v.kind)||!near(p,a.time[0],130))
   return {ok:false,error:'Искра должна быть у часов'};
  v.time.locked=3;return {ok:true,detail:'Часы остановлены на 3 секунды'};
 }
 if(kind==='time_echo'){
  if(role!==1||!['time','combo'].includes(v.kind)||!near(p,a.time[1],130)||v.time.locked<=0)
   return {ok:false,error:'Эхо должно коснуться временного следа, пока часы остановлены'};
  v.flags.time=true;v.time.complete=true;v.time.locked=0;
  const platform=g.level.platforms.find(o=>o.temporal);
  if(platform&&v.time.history.length)platform.x=v.time.history[0];
  return {ok:true,detail:'Временной след восстановлен'};
 }
 return {ok:false,error:'Неизвестное кооперативное действие'};
}
function beforeStep(g,dt){
 const v=g.v20;if(!v)return;
 v.tether.cooldown=Math.max(0,v.tether.cooldown-dt);
 if(!v.tether.active)return;
 const a=g.players[0],b=g.players[1],dx=b.x-a.x,dy=b.y-a.y,dist=Math.hypot(dx,dy);
 if(dist>510){v.tether.active=false;v.tether.tension=0;v.tether.cooldown=3;return;}
 v.tether.tension=clamp((dist-220)/200,0,1);
 if(dist<=220||dist<.01)return;
 const ux=dx/dist,uy=dy/dist;
 const relative=(b.vx-a.vx)*ux+(b.vy-a.vy)*uy;
 const f=clamp((dist-220)*8+relative*1.2,0,1750);
 const d=f*dt;
 a.vx=clamp(a.vx+ux*d,-740,740);b.vx=clamp(b.vx-ux*d,-740,740);
 a.vy=clamp(a.vy+uy*d,-830,940);b.vy=clamp(b.vy-uy*d,-830,940);
}
function platforms(g,role){
 const v=g.v20;if(!v||!['phase','combo'].includes(v.kind))return [];
 if(role===0&&v.phase.flags[0])return [{x:900,y:438,w:112,h:18,kind:'v20-phase'}];
 if(role===1&&v.phase.state!=='light')return [{x:1340,y:438,w:112,h:18,kind:'v20-phase'}];
 return [];
}
function onAbility(g,player){
 const v=g.v20,b=v?.boss;if(!b||!b.active||b.hp<=0)return;
 if(player.type!==b.next||!near(player,b.x,240))return;
 if((v.kind==='combo'||b.style==='mirror')&&!v.tether.active)return;
 b.hp--;b.next=1-b.next;b.phase=clamp(1+Math.floor((b.max-b.hp)/2),1,3);
 b.warning=0;b.attack=0;
}
function afterStep(g,dt){
 const v=g.v20;if(!v)return;
 const c=g.level.v20,kind=v.kind;
 if(v.tether.active){
  const [a,b]=g.players;
  if(near(a,c.tether[0],112)&&near(b,c.tether[1],112)&&Math.abs(a.x-b.x)>210)
   v.flags.tether=true;
 }
 if((kind==='time'||kind==='combo')&&!v.time.complete){
  const platform=g.level.platforms.find(o=>o.temporal);
  if(platform){
   if(v.time.locked<=0){v.time.phase+=dt;platform.x=1120+Math.sin(v.time.phase*1.8)*92;}
   v.time.history.push(platform.x);if(v.time.history.length>180)v.time.history.shift();
  }
  v.time.locked=Math.max(0,v.time.locked-dt);
 }
 v.complete=kind==='tether'?v.flags.tether:
  kind==='phase'?v.flags.phase:
  kind==='time'?v.flags.time:
  v.flags.tether&&v.flags.phase&&v.flags.time;
 const boss=v.boss;
 if(!boss)return;
 boss.active=v.complete&&boss.hp>0;
 if(!boss.active)return;
 boss.attack+=dt;
 if(boss.warning>0){boss.warning=Math.max(0,boss.warning-dt);
  if(boss.warning===0){
   const radius=boss.style==='heart'?120:boss.style==='clock'?90:72;
   for(const p of g.players)if(near(p,boss.focus,radius)&&g.adventure.bond.shield<=0){
    const knock=boss.style==='clock'?265:boss.style==='heart'?210:175;
    p.vx+=p.x<boss.focus?-knock:knock;p.vy=boss.style==='clock'?-320:-245;
   }
  }
 }else if(boss.attack>Math.max(2.3,4.6-boss.phase*.5)){
  boss.attack=0;boss.warning=boss.style==='clock'?1.55:boss.style==='heart'?1.4:1.2;
  boss.focus=boss.style==='mirror'?clamp(g.players[boss.next].x,60,g.level.width-70):boss.style==='clock'?clamp(g.players[1-boss.next].x,60,g.level.width-70):clamp((g.players[0].x+g.players[1].x)/2,60,g.level.width-70);
 }
}
function completed(g){return !g.v20||g.v20.complete&&(!g.v20.boss||g.v20.boss.hp<=0);}
function snapshot(g){
 const v=g.v20;if(!v)return null;
 const platform=g.level.platforms.find(o=>o.temporal);
 return {campaign:v.campaign,stageId:v.stageId,kind:v.kind,complete:v.complete,
  flags:{...v.flags},tether:{active:v.tether.active,tension:Math.round(v.tether.tension*100)/100,cooldown:v.tether.cooldown},
  phase:{state:v.phase.state,flags:v.phase.flags.slice(),complete:v.phase.complete},
  time:{locked:Math.round(v.time.locked*10)/10,complete:v.time.complete,platformX:platform?platform.x:null},
  boss:v.boss?{...v.boss}:null};
}
function cleanStory(raw){
 const val=raw&&typeof raw==='object'?raw:{};
 const choices={};for(const [k,v] of Object.entries(val.choices||{}))if(/^scene-(?:2|4|6|8|10|12)$/.test(k)&&[0,1].includes(v))choices[k]=v;
 return {choices,votes:{}};
}
function vote(room,role,sceneId,option){
 const active=scene(room.game.stage);
 if(!active||!active.choices||active.id!==sceneId||![0,1].includes(option))return {ok:false,error:'Решение недоступно'};
 const s=room.v20Story||(room.v20Story=cleanStory());
 if(s.choices[sceneId]!==undefined)return {ok:true,committed:true,choice:s.choices[sceneId]};
 s.votes[sceneId]=s.votes[sceneId]||[null,null];s.votes[sceneId][role]=option;
 const values=s.votes[sceneId];
 if(values[0]!==null&&values[0]===values[1]){s.choices[sceneId]=option;delete s.votes[sceneId];return {ok:true,committed:true,choice:option};}
 return {ok:true,committed:false,disagree:values.every(x=>x!==null),votes:values.slice()};
}
function endingForStory(story){
 const choices=Object.values(story?.choices||{}).filter(v=>v===0||v===1);
 const helping=choices.filter(v=>v===0).length;
 if(helping>=4)return {kind:'v20-together',title:'Тепло двух сердец',text:'Вы сохранили связь и помогли мирам вновь услышать друг друга.',choices:choices.length};
 if(helping<=2)return {kind:'v20-path',title:'Дорога навстречу',text:'Вы открыли новые пути для всех, кто решится пройти их вдвоём.',choices:choices.length};
 return {kind:'v20-balance',title:'Переплетение миров',text:'Свет и тень нашли равновесие. Ваша общая история продолжается.',choices:choices.length};
}
function cleanHome(raw){
 const v=raw&&typeof raw==='object'?raw:{},safe=n=>Math.max(0,Math.min(20,Number.isInteger(n)?n:0));
 return {zone:['living','garden','workshop'].includes(v.zone)?v.zone:'living',
  garden:{step:safe(v.garden?.step),completed:!!v.garden?.completed},
  memory:{step:safe(v.memory?.step),completed:!!v.memory?.completed},
  pet:{mood:['curious','happy','resting'].includes(v.pet?.mood)?v.pet.mood:'curious',interactions:safe(v.pet?.interactions)},
  decor:Array.isArray(v.decor)?v.decor.filter(x=>['lampion','flower','crystal'].includes(x)).slice(0,6):[]};
}
function homeAction(room,role,kind){
 const h=room.v20Home||(room.v20Home=cleanHome());
 if(['living','garden','workshop'].includes(kind)){h.zone=kind;return {ok:true,detail:'Зона изменена'};}
 if(kind==='pet'){h.pet.interactions=Math.min(20,h.pet.interactions+1);h.pet.mood=h.pet.interactions%4===0?'resting':'happy';return {ok:true,detail:'Питомец радуется встрече'};}
 if(['shine','reflect'].includes(kind)){
  if(h.garden.completed)return {ok:false,error:'Сад уже расцвёл'};
  if(role!==h.garden.step%2||kind!==(role===0?'shine':'reflect'))return {ok:false,error:'Сейчас ход другого игрока'};
  h.garden.step++;if(h.garden.step>=6)h.garden.completed=true;
  return {ok:true,detail:h.garden.completed?'Сад света завершён!':'Свет направлен'};
 }
 if(['reveal','place'].includes(kind)){
  if(h.memory.completed)return {ok:false,error:'Воспоминание уже собрано'};
  if(role!==h.memory.step%2||kind!==(role===0?'reveal':'place'))return {ok:false,error:'Сейчас ход другого игрока'};
  h.memory.step++;if(h.memory.step>=8)h.memory.completed=true;
  return {ok:true,detail:h.memory.completed?'Воспоминание собрано!':'Фрагмент найден'};
 }
 if(['lampion','flower','crystal'].includes(kind)){
  if(!h.garden.completed&&!h.memory.completed)return {ok:false,error:'Завершите совместную мини-игру'};
  if(h.decor.length>=6)return {ok:false,error:'Все декоративные места заняты'};
  h.decor.push(kind);return {ok:true,detail:'Украшение добавлено'};
 }
 return {ok:false,error:'Неизвестная домашняя активность'};
}
module.exports={FIRST,LAST,hasStage,getStage,scene,init,action,beforeStep,platforms,onAbility,afterStep,completed,snapshot,cleanStory,vote,endingForStory,cleanHome,homeAction};
