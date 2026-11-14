'use strict';
// Adventure systems are authoritative: neither player simulates boss health, tether or secrets.
const {GROUND}=require('./shared/stages');
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const dist=(p,x,y)=>Math.hypot(p.x+15-x,p.y+21.5-y);
const BOSS_NAMES=['Сонный Великан','Лесной Хранитель','Лунный Кракен','Король Ветров','Звёздный Сфинкс','Алмазный Страж','Неоновый Титан','Хранитель Течения','Часовой Голем','Тень Горизонта','Сердце Тьмы','Последняя Тень'];
const ARCADE=['chase','flight','rhythm','sail'];
function init(g){
 const idx=g.stage,act=Math.min(10,Math.floor(idx/9)),variant=idx%9,l=g.level;
 const isBoss=variant===8||idx===99;
 const boss=isBoss?{name:BOSS_NAMES[idx===99?11:act],x:l.gates[0].x-156,y:GROUND-80,hp:idx===99?8:3+Math.floor(act/3),max:idx===99?8:3+Math.floor(act/3),next:0,active:false,attack:0,warning:0,flash:0,phase:1,style:act,pattern:act%3}:null;
 let kind=null;
 if(idx!==99&&[2,4,5,6].includes(variant)){
  kind=variant===2?'chase':variant===4?'flight':variant===5?'sail':'rhythm';
 }
 g.adventure={boss,bond:{power:.35,active:0,shield:0,hearts:0},emotes:[0,0],emoteKinds:[0,0],pet:{x:Math.min(l.width-360,620+act*11),collected:false,act,visible:variant===4},secret:{x:Math.min(l.width-385,1320+act*9),y:GROUND-76,collected:false,act,visible:variant===7},arcade:kind?{kind,done:false,started:false,timer:kind==='chase'?29:0,progress:0,boat:Math.max(150,l.gates[0].x-690),hunter:Math.max(90,l.gates[0].x-1300),ringX:l.gates[0].x-335,flightHits:[false,false],rhythm:[false,false],rhythmTime:0,boost:0}:null};
}
function baseComplete(g){
 const l=g.level,goal=l.puzzle||{pads:true};
 return l.walls.every(w=>w.broken)&&(!goal.crystals||l.crystals.every(c=>c.on))&&(!goal.pads||l.padLatched)&&l.signature?.done!==false;
}
function onAbility(g,p){
 const a=g.adventure;if(!a)return;
 const boss=a.boss;
 if(boss&&boss.active&&boss.hp>0&&p.type===boss.next&&dist(p,boss.x,boss.y)<190){boss.hp--;boss.next=1-boss.next;boss.flash=.55;boss.attack=0;boss.phase=boss.hp<=boss.max/3?3:boss.hp<=boss.max*2/3?2:1;boss.pattern=(boss.style+boss.phase-1)%3;if(boss.hp===0)boss.active=false;}
 if(a.arcade?.kind==='sail'&&a.arcade.started&&!a.arcade.done&&p.type===1&&dist(p,a.arcade.boat,GROUND-43)<155){a.arcade.boost=2.2;}
 if(a.arcade?.kind==='rhythm'&&a.arcade.started&&!a.arcade.done){
  const m=a.arcade,mark=m.ringX+(p.type?125:0);
  if(dist(p,mark,GROUND-35)<130){m.rhythm[p.type]=true;m.rhythmTime=3.4;}
 }
}
function onInput(g,p,i){
 const a=g.adventure;if(!a)return;
 if(i.emoteQueued){a.emotes[p.type]=2.4;a.emoteKinds[p.type]=(a.emoteKinds[p.type]+1)%3;i.emoteQueued=false;
  if(Math.abs(g.players[0].x-g.players[1].x)<105&&a.emotes[1-p.type]>0){a.bond.hearts++;a.bond.power=clamp(a.bond.power+.27,0,1);}
 }
 if(i.bondQueued){i.bondQueued=false;
  if(a.bond.power>=.45){a.bond.power-=.45;a.bond.active=3.3;a.bond.shield=2.5;}
 }
}
function forces(g,p,dt){
 const a=g.adventure;if(!a)return;
 const b=a.bond,other=g.players[1-p.type];
 if(b.active>0){const gap=other.x-p.x;
  if(Math.abs(gap)>185&&Math.abs(gap)<870)p.vx+=clamp(gap,-450,450)*dt*1.4;
 }
 if(a.arcade?.kind==='flight'&&a.arcade.started&&!a.arcade.done){
  if(p.x>a.arcade.ringX-150&&p.x<a.arcade.ringX+170&&!p.grounded)p.vy-=2400*dt;
 }
}
function afterStep(g,p){
 const a=g.adventure;if(!a)return;
 if(a.pet.visible&&!a.pet.collected&&dist(p,a.pet.x,GROUND-39)<52)a.pet.collected=true;
 if(a.secret.visible&&!a.secret.collected&&dist(p,a.secret.x,a.secret.y)<70)a.secret.collected=true;
 if(a.arcade?.kind==='flight'&&a.arcade.started&&!a.arcade.done){
  if(dist(p,a.arcade.ringX,GROUND-125)<73)a.arcade.flightHits[p.type]=true;
 }
}
function update(g,dt){
 const a=g.adventure;if(!a)return;
 const l=g.level,base=baseComplete(g),p0=g.players[0],p1=g.players[1],boss=a.boss,mode=a.arcade;
 a.bond.active=Math.max(0,a.bond.active-dt);a.bond.shield=Math.max(0,a.bond.shield-dt);
 a.bond.power=clamp(a.bond.power+(Math.abs(p0.x-p1.x)<250?.064:.015)*dt,0,1);
 for(let i=0;i<2;i++)a.emotes[i]=Math.max(0,a.emotes[i]-dt);
 if(boss&&boss.hp>0){boss.active=base;boss.flash=Math.max(0,boss.flash-dt);
  if(boss.active){boss.attack+=dt;if(boss.attack>Math.max(2.1,4.8-boss.phase*.64)){boss.warning=Math.max(.68,1.28-boss.phase*.17);boss.attack=0;}
   if(boss.warning>0){boss.warning-=dt;if(boss.warning<=0&&a.bond.shield<=0){
    for(const p of g.players){const nearBoss=dist(p,boss.x,GROUND-43)<165;const beam=Math.abs(p.x-boss.x)<80;const targetZone=Math.abs(p.x-(boss.x-110))<80;const danger=boss.pattern===0?nearBoss:boss.pattern===1?beam:targetZone;if(danger){p.x=l.spawn[p.type];p.y=GROUND-43;p.vx=0;p.vy=0;}}
   }}
  }
 }
 if(mode&&!mode.done&&base&&(!boss||boss.hp<=0)){
  if(!mode.started){mode.started=true;mode.timer=mode.kind==='chase'?29:0;}
  switch(mode.kind){
   case 'chase':mode.timer=Math.max(0,mode.timer-dt);mode.hunter+=dt*(140+g.stage/3);
    if(mode.timer===0||g.players.some(p=>Math.abs(p.x-mode.hunter)<32)){
      mode.timer=29;mode.hunter=Math.max(90,l.gates[0].x-1300);
      for(const p of g.players){p.x=l.spawn[p.type];p.y=GROUND-43;p.vx=p.vy=0;}
    }else if(g.players.every(p=>p.x>mode.ringX))mode.done=true;break;
   case 'flight':if(mode.flightHits.every(Boolean))mode.done=true;break;
   case 'rhythm':if(mode.rhythmTime>0){mode.rhythmTime-=dt;if(mode.rhythm.every(Boolean))mode.done=true;if(mode.rhythmTime<=0)mode.rhythm=[false,false];}break;
   case 'sail':{
    mode.boost=Math.max(0,mode.boost-dt);
    const onboard=g.players.every(p=>Math.abs(p.x-mode.boat)<135&&Math.abs(p.y+p.h-GROUND)<60);
    // Искра управляет курсом, Эхо заряжает парус импульсом.
    if(onboard&&g.input[0].right&&mode.boost>0){mode.progress+=dt*145;mode.boat+=dt*145;for(const p of g.players){p.x=mode.boat+(p.type?31:-55);p.vx=145;}}
    if(mode.progress>250)mode.done=true;
    break;
   }
  }
 }
}
function canExit(g){const a=g.adventure;return !a||(!a.boss||a.boss.hp<=0)&&(!a.arcade||a.arcade.done);}
function snapshot(g){const a=g.adventure;if(!a)return null;return {
 boss:a.boss?{...a.boss}:null,
 bond:{...a.bond},emotes:a.emotes.slice(),emoteKinds:a.emoteKinds.slice(),
 pet:{...a.pet},secret:{...a.secret},
 arcade:a.arcade?{...a.arcade,flightHits:a.arcade.flightHits.slice(),rhythm:a.arcade.rhythm.slice()}:null
};}
module.exports={BOSS_NAMES,ARCADE,init,onAbility,onInput,forces,afterStep,update,canExit,snapshot};