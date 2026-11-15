'use strict';
// Linked by Light v21: deterministic authoritative puzzle state for ten new levels.
const {stages}=require('./shared/v21-stages');
const FIRST=112,LAST=121,GROUND=544,DT=1/60;
const hasStage=i=>Number.isInteger(i)&&i>=FIRST&&i<=LAST;
const getStage=i=>hasStage(i)?stages[i-FIRST]:null;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const close=(p,x,tolerance=155)=>Math.abs(p.x+15-x)<=tolerance&&p.y<GROUND+60;
const capText=(raw,max=120)=>typeof raw==='string'?raw.replace(/[\u0000-\u001f\u007f-\u009f<>]/g,'').trim().slice(0,max):'';
const safeDate=(date=new Date())=>date.toISOString().slice(0,10);
function weekKey(date=new Date()){
 const d=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate()));
 const n=(d.getUTCDay()+6)%7;d.setUTCDate(d.getUTCDate()-n+3);
 const year=d.getUTCFullYear();const first=new Date(Date.UTC(year,0,4));
 return year+'-W'+String(1+Math.round(((d-first)/86400000-3+(first.getUTCDay()+6)%7)/7)).padStart(2,'0');
}
function weeklyStage(date=new Date()){
 const key=weekKey(date);const y=Number(key.slice(0,4)),w=Number(key.slice(-2));
 return FIRST+((y*53+w)%10);
}
function seasonId(date=new Date()){
 const m=date.getUTCMonth();return ['winter','spring','summer','autumn'][m===11||m<=1?0:m<=4?1:m<=7?2:3];
}
function freshState(game){
 const c=game.level.v21;
 return {stageId:game.level.v21Id,kind:c.kind,completed:false,anchor:c.anchor,goal:c.goal,
  trail:[],trailCrossings:0,lastTrailX:0,lastTrailTick:0,lastCrossTick:-999,
  transfer:{sent:false,received:false,delivered:false},knowledge:{progress:0,sequence:c.sequence.slice()},
  lantern:{lit:false,bridgeCrossed:false,calm:false},
  transform:{forms:['normal','normal'],tokens:[false,false],energy:[0,0]},
  weather:{wind:0,rain:0,charges:[0,0]},
  cargo:{x:c.anchor+180,step:0,votes:[false,false]},tree:{growth:0},
  maze:{turn:0,checkpoint:0},asymmetry:{phase:0,flags:[false,false]},
  diaryMark:0};
}
function init(g){g.v21=hasStage(g.stage)?freshState(g):null;
 if(hasStage(g.stage)){g.adventure.boss=null;g.adventure.arcade=null;g.adventure.pet.visible=false;g.adventure.secret.visible=false;}
}
function platformRects(g,role){
 const z=g.v21;if(!z)return [];
 const c=g.level.v21,all=[];
 if(z.branch===1)all.push({x:c.anchor+310,y:399,w:172,h:17,kind:'v21-choice-route'});
 if(z.kind==='trails'&&role===1)for(const s of z.trail)all.push({x:s.x,y:s.y,w:95,h:12,kind:'v21-trail'});
 if(z.kind==='lantern'&&z.lantern.lit&&role===1)all.push({x:c.anchor+360,y:459,w:230,h:17,kind:'v21-light'});
 if(z.kind==='tree')for(let i=0;i<z.tree.growth;i++)all.push({x:c.anchor+i*115,y:440-(i%3)*32,w:125,h:16,kind:'v21-branch'});
 if(z.kind==='maze'&&z.maze.turn%2===1)all.push({x:c.anchor+280,y:455,w:150,h:18,kind:'v21-maze'});
 return all;
}
function beforeStep(g,dt){
 const z=g.v21;if(!z)return;
 if(z.kind==='weather'){
  z.weather.wind=Math.max(0,z.weather.wind-dt);
  z.weather.rain=Math.max(0,z.weather.rain-dt);
  if(z.weather.wind>0)for(const p of g.players)p.vx=clamp(p.vx+170*dt,-740,740);
  if(z.weather.rain>0)for(const p of g.players)p.vy-=Math.min(220*dt,12);
 }
 if(z.kind==='transform'){
  for(const p of g.players)if(z.transform.forms[p.type]==='bird'){
   p.vy=clamp(p.vy-490*dt,-480,950);
  }
 }
}
function afterStep(g,dt){
 const z=g.v21;if(!z||z.completed)return;
 const c=g.level.v21,p=g.players;
 if(z.kind==='trails'){
  z.trail=z.trail.filter(s=>s.until>g.tick);
  const spark=p[0],echo=p[1];
  if(spark.x>350&&Math.abs(spark.vx)>48&&g.tick-z.lastTrailTick>18&&Math.abs(spark.x-z.lastTrailX)>36){
   z.trail.push({x:Math.round(spark.x),y:Math.round(spark.y+spark.h-5),until:g.tick+360});
   if(z.trail.length>12)z.trail.shift();z.lastTrailX=spark.x;z.lastTrailTick=g.tick;
  }
  if(g.tick-z.lastCrossTick>22&&z.trail.some(s=>Math.abs(echo.x-s.x)<65&&Math.abs(echo.y+echo.h-s.y)<25)){
   z.trailCrossings++;z.lastCrossTick=g.tick;
  }
  z.completed=z.trailCrossings>=4;
 }
 if(z.kind==='weather'){
  if(z.weather.wind>0&&z.weather.rain>0&&p.every(x=>close(x,c.goal,350))){
   z.weather.charges[0]=clamp(z.weather.charges[0]+dt,0,3);
  }
  z.completed=z.weather.charges[0]>=2;
 }
 if(z.kind==='lantern'){
  if(z.lantern.lit&&close(p[1],c.goal,220))z.lantern.bridgeCrossed=true;
  if(z.lantern.bridgeCrossed&&!z.lantern.lit)z.lantern.calm=true;
  z.completed=z.lantern.calm;
 }
 if(z.kind==='transfer')z.completed=z.transfer.delivered;
 if(z.kind==='knowledge')z.completed=z.knowledge.progress>=3;
 if(z.kind==='transform')z.completed=z.transform.tokens.every(Boolean);
 if(z.kind==='cargo')z.completed=z.cargo.step>=3;
 if(z.kind==='tree')z.completed=z.tree.growth>=6;
 if(z.kind==='maze')z.completed=z.maze.checkpoint>=3;
 if(z.kind==='asymmetry')z.completed=z.asymmetry.phase>=2;
}
function action(g,role,kind,raw={}){
 const z=g.v21;
 if(!z||g.phase!=='playing'||![0,1].includes(role))return {ok:false,error:'Сейчас недоступно'};
 const p=g.players[role],mate=g.players[1-role],c=g.level.v21;
 const deny=(error)=>({ok:false,error});
 const success=(detail)=>({ok:true,detail});
 if(kind==='trail_mark'&&z.kind==='trails'&&role===0){
  if(!close(p,c.anchor,500))return deny('Пройдите по световой тропе');
  z.lastTrailTick=-100;z.lastTrailX=-100;
  return success('Пробегите вперёд и оставьте светящиеся следы');
 }
 if(kind==='transfer_send'&&z.kind==='transfer'&&role===0){
  if(!close(p,c.anchor))return deny('Искра должна стоять у алтаря');
  z.transfer.sent=true;return success('Сфера перенесена во второй мир');
 }
 if(kind==='transfer_receive'&&z.kind==='transfer'&&role===1){
  if(!z.transfer.sent||!close(p,c.goal,190))return deny('Эхо должно получить сферу у своего алтаря');
  z.transfer.received=true;return success('Сфера у Эха');
 }
 if(kind==='transfer_deliver'&&z.kind==='transfer'&&role===1){
  if(!z.transfer.received||!close(p,c.goal+370,170))return deny('Отнесите сферу к хранителю');
  z.transfer.delivered=true;return success('Ключ между мирами доставлен');
 }
 if(kind==='knowledge_symbol'&&z.kind==='knowledge'&&role===1){
  const v=raw.value;
  if(!close(p,c.anchor+200,300)||!Number.isInteger(v)||v<0||v>2)return deny('Эхо должно находиться у панели символов');
  if(v!==z.knowledge.sequence[z.knowledge.progress]){z.knowledge.progress=0;return deny('Символы сброшены. Искра видит верный порядок');}
  z.knowledge.progress++;return success('Правильный символ: '+z.knowledge.progress+'/3');
 }
 if(kind==='lantern_toggle'&&z.kind==='lantern'&&role===0){
  if(!close(p,c.anchor,210))return deny('Встаньте рядом с фонарём');
  z.lantern.lit=!z.lantern.lit;return success(z.lantern.lit?'Фонарь зажжён':'Фонарь погашен');
 }
 if(kind==='transform'&&z.kind==='transform'){
  if(!close(p,c.anchor+(role?440:0),240))return deny('Подойдите к месту превращения');
  const form=role===0?'bird':'fox';
  z.transform.forms[role]=z.transform.forms[role]===form?'normal':form;
  return success('Форма '+z.transform.forms[role]);
 }
 if(kind==='transform_collect'&&z.kind==='transform'){
  if(!close(p,c.anchor+(role?550:150),190)||z.transform.forms[role]!== (role===0?'bird':'fox'))
   return deny('Нужна правильная форма у своего ключа');
  z.transform.tokens[role]=true;return success('Световой ключ получен');
 }
 if(kind==='weather_wind'&&z.kind==='weather'&&role===0){
  if(!close(p,c.anchor,220))return deny('Искра должна встать у флюгера');
  z.weather.wind=4;return success('Ветер направлен');
 }
 if(kind==='weather_rain'&&z.kind==='weather'&&role===1){
  if(!close(p,c.goal,250))return deny('Эхо должно встать у облака');
  z.weather.rain=4;return success('Дождь вызван');
 }
 if(kind==='cargo_push'&&z.kind==='cargo'){
  if(!close(p,z.cargo.x,190))return deny('Подойдите к тяжёлому кристаллу');
  z.cargo.votes[role]=true;
  if(z.cargo.votes.every(Boolean)){
   z.cargo.step++;z.cargo.x+=210;z.cargo.votes=[false,false];return success('Кристалл сдвинут: '+z.cargo.step+'/3');
  }
  return success('Ожидаем помощь второго игрока');
 }
 if(kind==='tree_grow'&&z.kind==='tree'){
  if(role!==z.tree.growth%2||!close(p,c.anchor+z.tree.growth*115,220))return deny('Не ваша очередь или нужно подойти к корню');
  z.tree.growth++;return success('Выросла ветвь '+z.tree.growth+'/6');
 }
 if(kind==='maze_rotate'&&z.kind==='maze'&&role===1){
  if(!close(p,c.anchor,250))return deny('Эхо должно стоять у карты лабиринта');
  z.maze.turn++;return success('Секция лабиринта повёрнута');
 }
 if(kind==='maze_checkpoint'&&z.kind==='maze'&&role===0){
  if(z.maze.turn<=z.maze.checkpoint||!close(p,c.anchor+370+z.maze.checkpoint*150,160))
   return deny('Искра должна пройти открытый маршрут');
  z.maze.checkpoint++;return success('Отметка лабиринта '+z.maze.checkpoint+'/3');
 }
 if(kind==='asym_action'&&z.kind==='asymmetry'){
  const expected=z.asymmetry.phase===0?1:0;
  if(role!==expected||!close(p,c.anchor+z.asymmetry.phase*430,230))return deny('Сейчас механизм активирует другой игрок');
  z.asymmetry.flags[0]=true;return success('Механизм готов');
 }
 if(kind==='asym_cross'&&z.kind==='asymmetry'){
  const expected=z.asymmetry.phase===0?0:1;
  if(role!==expected||!z.asymmetry.flags[0]||!close(p,c.anchor+220+z.asymmetry.phase*450,230))
   return deny('Пройдите контрольную точку после сигнала партнёра');
  z.asymmetry.phase++;z.asymmetry.flags[0]=false;return success('Роли поменялись местами');
 }
 return deny('Для этой головоломки действие не подходит');
}
function snapshot(g){
 const z=g.v21;if(!z)return null;
 return {stageId:z.stageId,kind:z.kind,completed:z.completed,trail:z.trail.map(s=>({...s})),trailCrossings:z.trailCrossings,
  transfer:{...z.transfer},knowledge:{progress:z.knowledge.progress},
  lantern:{...z.lantern},transform:{forms:z.transform.forms.slice(),tokens:z.transform.tokens.slice()},
  weather:{wind:z.weather.wind,rain:z.weather.rain,charge:z.weather.charges[0]},
  cargo:{x:z.cargo.x,step:z.cargo.step,votes:z.cargo.votes.slice()},
  tree:{growth:z.tree.growth},maze:{...z.maze},asymmetry:{...z.asymmetry}};
}
function completed(g){return !g.v21||g.v21.completed;}
module.exports={FIRST,LAST,hasStage,getStage,init,platformRects,beforeStep,afterStep,action,completed,snapshot,weekKey,weeklyStage,seasonId,capText};
