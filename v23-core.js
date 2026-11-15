'use strict';
// Server-authoritative v23 progression; new mechanics never mutate v19/v20/v21 stages.
const {stages,FIRST,LAST}=require('./shared/v23-stages');
const DT=1/60,GROUND=544;
const hasStage=i=>Number.isInteger(i)&&i>=FIRST&&i<=LAST;
const getStage=i=>hasStage(i)?stages[i-FIRST]:null;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const near=(p,x,d=205)=>Math.abs(p.x+p.w/2-x)<=d&&p.y<GROUND+65;
function fresh(g){
 const {kind,anchor,goal}=g.level.v23;
 return {kind,anchor,goal,done:false,step:0,round:0,roles:[false,false],phase:0,mode:0,charge:0,
  gravity:[1,1],timer:0,beam:0,mirror:0,scale:[1,1],swing:0,shadow:[],switches:[false,false],
  water:{direction:0,pearls:0},magnet:{polarity:[0,0],x:anchor+230},
  rhythm:{sequence:[0,2,1,3],progress:0,beatAt:0},
  path:{segments:0,walker:0},
  boss:kind.startsWith('boss-')?{hp:4,max:4,next:0,shield:false,stunned:false,copyX:[0,0],lastHit:0}:null};
}
function init(g){
 g.v23=hasStage(g.stage)?fresh(g):null;
 if(g.v23){g.adventure.boss=null;g.adventure.arcade=null;g.adventure.pet.visible=false;g.adventure.secret.visible=false;}
}
function platforms(g,role){
 const z=g.v23;if(!z)return [];
 const {anchor,goal}=g.level.v23,out=[];
 if(z.kind==='gravity-duet'&&z.gravity[0]===-1&&role===0)out.push({x:anchor+100,y:260,w:690,h:15,kind:'v23-ceiling'});
 if(z.kind==='resize'&&role===1&&z.scale[1]!==0.5)out.push({x:anchor+250,y:GROUND-138,w:24,h:138,kind:'v23-tunnel'});
 if(z.kind==='resize'&&z.scale[0]===2)out.push({x:anchor+460,y:468,w:175,h:18,kind:'v23-giant'});
 if(z.kind==='pendulum'){
  if(role===0)out.push({x:anchor+205,y:475,w:190,h:16,kind:'v23-anchor'});
  if(z.swing!==0)out.push({x:anchor+355+Math.sin(z.swing)*230,y:410,w:145,h:17,kind:'v23-swing'});
 }
 if(z.kind==='shadows'){
  if(role===0)out.push({x:anchor+220,y:491,w:730,h:15,kind:'v23-source'});
  else for(const x of z.shadow)out.push({x,y:463,w:110,h:12,kind:'v23-shadow'});
 }
 if(z.kind==='world-switch'){
  const owner=(z.mode+role)%2;
  out.push({x:anchor+240+owner*370,y:438,w:170,h:18,kind:'v23-world'});
 }
 if(z.kind==='water'&&z.water.direction!==0)out.push({x:anchor+250,y:482,w:570,h:17,kind:'v23-raft'});
 if(z.kind==='conductor'){
  for(let i=0;i<z.path.segments;i++)out.push({x:anchor+180+i*155,y:456-i%2*45,w:165,h:16,kind:'v23-route'});
 }
 if(z.kind.startsWith('boss-')&&z.boss?.stunned)out.push({x:goal-80,y:444,w:130,h:18,kind:'v23-boss-step'});
 return out;
}
function beforeStep(g,dt){
 const z=g.v23;if(!z)return;
 if(z.timer>0)z.timer=Math.max(0,z.timer-dt);
 if(z.kind==='pendulum'&&z.swing!==0)z.swing+=dt*2.1;
 if(z.kind==='water'&&z.water.direction!==0){
  for(const p of g.players)if(p.x>z.anchor&&p.x<z.goal){
   p.vx+=z.water.direction*90*dt;
   p.vy-=Math.min(120*dt,5);
  }
 }
 if(z.kind==='magnets'&&z.magnet.polarity.every(x=>x!==0)){
  const direction=z.magnet.polarity[0]===z.magnet.polarity[1]?-1:1;
  z.magnet.x=clamp(z.magnet.x+direction*85*dt,z.anchor+170,z.goal+100);
 }
 if(z.kind==='gravity-duet'&&z.gravity[0]===-1){
  const p=g.players[0];p.vy=Math.min(p.vy,430);
 }
}
function gravity(g,p){return g.v23?.kind==='gravity-duet'&&g.v23.gravity[p.type]===-1?-1300:1300;}
function afterStep(g,dt){
 const z=g.v23;if(!z||z.done)return;
 const [a,b]=g.players,c=g.level.v23;
 if(z.kind==='shadows'){
  const x=Math.round(a.x/65)*65;
  if(x>c.anchor+80&&Math.abs(a.vx)>30&&!z.shadow.some(t=>Math.abs(t-x)<35))z.shadow.push(x);
  if(z.shadow.length>10)z.shadow.shift();
  if(z.shadow.length>=5&&near(b,c.goal,260))z.step=3;
 }
 if(z.kind==='pendulum'&&z.roles[0]&&z.roles[1])z.done=true;
 if(z.kind==='gravity-duet'&&z.roles.every(Boolean))z.done=true;
 if(z.kind==='prism'&&z.step>=3)z.done=true;
 if(z.kind==='resize'&&z.roles.every(Boolean))z.done=true;
 if(z.kind==='shadows'&&z.step>=3)z.done=true;
 if(z.kind==='world-switch'&&z.switches.every(Boolean))z.done=true;
 if(z.kind==='water'&&z.water.pearls>=3)z.done=true;
 if(z.kind==='magnets'&&z.magnet.x>=c.goal)z.done=true;
 if(z.kind==='rhythm'&&z.rhythm.progress>=4)z.done=true;
 if(z.kind==='conductor'&&z.path.walker>=4)z.done=true;
 if(z.boss&&z.boss.hp===0)z.done=true;
}
function action(g,role,kind,raw={}){
 const z=g.v23;if(!z||g.phase!=='playing'||![0,1].includes(role))return {ok:false,error:'Эта механика недоступна'};
 const p=g.players[role],q=g.players[1-role],c=g.level.v23;
 const deny=error=>({ok:false,error}),ok=detail=>({ok:true,detail});
 if(z.done)return deny('Испытание уже завершено');
 if(kind==='gravity_flip'&&z.kind==='gravity-duet'&&role===0){
  if(!near(p,c.anchor,260)||!z.roles[1])return deny('Искра должна стоять у поля, пока Эхо поддерживает его');
  z.gravity[0]=z.gravity[0]===1?-1:1;z.timer=6;
  return ok('Гравитационное поле переключено');
 }
 if(kind==='gravity_hold'&&z.kind==='gravity-duet'&&role===1){
  if(!near(p,c.anchor,250))return deny('Эхо должно удерживать якорь');
  z.roles[1]=true;return ok('Поле удерживается');
 }
 if(kind==='gravity_seal'&&z.kind==='gravity-duet'&&role===0){
  if(z.gravity[0]!==-1||!near(p,c.goal,230))return deny('Искра должна дойти до небесной печати');
  z.roles[0]=true;return ok('Небесные печати соединены');
 }
 if(kind==='mirror_rotate'&&z.kind==='prism'&&role===1){
  if(!near(p,c.anchor+180,320))return deny('Эхо должен находиться у призмы');
  z.mirror=(z.mirror+1)%3;return ok('Зеркало направлено: '+(z.mirror+1));
 }
 if(kind==='beam_emit'&&z.kind==='prism'&&role===0){
  if(!near(p,c.anchor,220))return deny('Искра должна стоять у источника луча');
  if(z.mirror!==z.step%3)return deny('Призма настроена неверно, попросите Эхо повернуть зеркало');
  z.step++;z.beam=z.step;return ok('Призма зажжена '+z.step+'/3');
 }
 if(kind==='resize_form'&&z.kind==='resize'){
  if(!near(p,c.anchor+(role?180:0),260))return deny('Подойдите к порталу размеров');
  z.scale[role]=z.scale[role]===1?(role===0?2:0.5):1;
  return ok(role===0?'Искра стала великаном':'Эхо уменьшился');
 }
 if(kind==='resize_seal'&&z.kind==='resize'){
  if(z.scale[role]!==(role===0?2:0.5)||!near(p,c.goal+(role?125:-115),245))return deny('Нужная форма должна дойти до своей печати');
  z.roles[role]=true;return ok('Печать '+(role+1)+' активирована');
 }
 if(kind==='swing_anchor'&&z.kind==='pendulum'&&role===0){
  if(!near(p,c.anchor,220))return deny('Искра должна зафиксировать начало маятника');
  z.swing=z.swing||0.01;z.roles[0]=true;return ok('Маятник раскачивается');
 }
 if(kind==='swing_release'&&z.kind==='pendulum'&&role===1){
  if(!z.roles[0]||!near(p,c.goal,260))return deny('Эхо должен достичь второго якоря');
  z.roles[1]=true;return ok('Второй якорь закреплён');
 }
 if(kind==='shadow_lock'&&z.kind==='shadows'&&role===1){
  if(z.shadow.length<5||!near(p,c.goal,260))return deny('Переходите по пяти теням Искры');
  z.step=3;return ok('Тени связали берега');
 }
 if(kind==='world_toggle'&&z.kind==='world-switch'){
  if(!near(p,c.anchor+role*380,270))return deny('Подойдите к переключателю своего мира');
  z.mode=(z.mode+1)%2;z.roles[role]=true;return ok('Реальность изменена');
 }
 if(kind==='world_seal'&&z.kind==='world-switch'){
  if(!z.roles[role]||!near(p,c.goal+(role?-170:170),250))return deny('Активируйте переключатель, затем доберитесь до своей колонны');
  z.switches[role]=true;return ok('Колонна '+(role+1)+' зажжена');
 }
 if(kind==='water_flow'&&z.kind==='water'&&role===0){
  if(!near(p,c.anchor,220))return deny('Искра должна стоять у плотины');
  if(![-1,0,1].includes(raw.value))return deny('Недопустимое течение');
  z.water.direction=raw.value;return ok('Течение '+(['влево','остановлено','вправо'][raw.value+1]));
 }
 if(kind==='water_pearl'&&z.kind==='water'&&role===1){
  if(z.water.direction!==1||!near(p,c.anchor+320+z.water.pearls*160,240))return deny('Плывите на плоту по течению к следующей жемчужине');
  z.water.pearls++;return ok('Речная жемчужина '+z.water.pearls+'/3');
 }
 if(kind==='magnet_polarity'&&z.kind==='magnets'){
  if(!near(p,c.anchor+role*150,350)||![-1,1].includes(raw.value))return deny('Подойдите к магнитной станции');
  z.magnet.polarity[role]=raw.value;return ok('Полярность изменена');
 }
 if(kind==='rhythm_beat'&&z.kind==='rhythm'){
  const index=z.rhythm.progress,expected=index%2;
  if(role!==expected||!near(p,c.anchor+role*260,350))return deny('Сейчас очередь другого игрока у своего инструмента');
  if(raw.value!==z.rhythm.sequence[index]){z.rhythm.progress=0;return deny('Неверная нота — начинаем последовательность заново');}
  z.rhythm.progress++;return ok('Правильный ритм '+z.rhythm.progress+'/4');
 }
 if(kind==='conductor_route'&&z.kind==='conductor'&&role===0){
  if(z.path.segments>=4||!near(p,c.anchor+z.path.segments*155,250))return deny('Искра должна встать у следующего переключателя');
  z.path.segments++;return ok('Маршрут построен '+z.path.segments+'/4');
 }
 if(kind==='conductor_cross'&&z.kind==='conductor'&&role===1){
  if(z.path.walker>=z.path.segments||!near(p,c.anchor+160+z.path.walker*155,240))return deny('Эхо должен перейти на построенную секцию');
  z.path.walker++;return ok('Пройдено секций '+z.path.walker+'/4');
 }
 if(z.boss&&kind==='boss_guard'){
  if(role!==1||!near(p,c.goal,390))return deny('Эхо должен остановить атаки хранителя');
  z.boss.shield=true;z.boss.stunned=true;z.timer=5;
  return ok('Защита хранителя нарушена');
 }
 if(z.boss&&kind==='boss_strike'){
  if(role!==0||!near(p,c.goal,390)||!z.boss.shield)return deny('Искра атакует лишь после сигнала Эха');
  if(z.boss.hp<=0)return deny('Хранитель уже побеждён');
  if(z.boss.lastHit>0&&g.tick-z.boss.lastHit<25)return deny('Удар не восстановился');
  z.boss.hp--;z.boss.shield=false;z.boss.stunned=false;z.boss.lastHit=g.tick;
  return ok('Удар по хранителю · осталось '+z.boss.hp+' HP');
 }
 if(z.boss&&kind==='boss_mirror_trap'&&z.kind==='boss-mirror'){
  if(role!==1||!near(p,g.players[0].x+15,140))return deny('Зеркальному отражению нужна согласованная позиция обоих героев');
  z.boss.shield=true;z.boss.stunned=true;return ok('Отражение заманено');
 }
 if(z.boss&&kind==='boss_titan_seal'&&z.kind==='boss-titan'){
  if(role!==1||!near(p,c.goal-150,300))return deny('Эхо должен открыть печать титана');
  z.boss.shield=true;return ok('Печать титана открыта');
 }
 return deny('Эта команда недоступна для текущего испытания');
}
function snapshot(g){
 const z=g.v23;if(!z)return null;
 return {kind:z.kind,done:z.done,step:z.step,round:z.round,roles:z.roles.slice(),phase:z.phase,mode:z.mode,
  gravity:z.gravity.slice(),timer:z.timer,beam:z.beam,mirror:z.mirror,scale:z.scale.slice(),swing:z.swing,
  shadow:z.shadow.slice(),switches:z.switches.slice(),water:{...z.water},
  magnet:{x:z.magnet.x,polarity:z.magnet.polarity.slice()},rhythm:{progress:z.rhythm.progress},
  path:{...z.path},boss:z.boss?{hp:z.boss.hp,max:z.boss.max,shield:z.boss.shield,stunned:z.boss.stunned}:null};
}
const completed=g=>!g.v23||g.v23.done;
module.exports={FIRST,LAST,hasStage,getStage,init,platforms,gravity,beforeStep,afterStep,action,completed,snapshot};
