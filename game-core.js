'use strict';
const { stages, GROUND, BONUS_STAGE } = require('./shared/stages');
const adventure=require('./adventure-core');
const worlds=require('./world-mechanics');
const DT=1/60, WIDTH=1200, HEIGHT=650;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const overlaps=(a,b)=>a.x < b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;
const freshPlayer=(type,x)=>({type,x,y:GROUND-43,w:30,h:43,vx:0,vy:0,face:1,grounded:false,coyote:0,jumpBuffer:0,dash:0,cool:0,abilityFx:0});
function createGame(){const g={stage:0,phase:'waiting',level:null,players:[],shards:[],tick:0,completion:0,transition:0,padTimer:0,stats:null,lastResult:null,input:[null,null]}; initStage(g,0);return g;}
function initStage(g,index){
  g.stage=index;g.level=structuredClone(index===99?BONUS_STAGE:stages[index]);g.players=[freshPlayer(0,g.level.spawn[0]),freshPlayer(1,g.level.spawn[1])];
  g.level.gateOpen=false;g.level.bridgeLatched=false;g.level.padLatched=false;
  g.level.pads.forEach(p=>p.pressed=false);
  g.shards=g.level.shards.map(x=>false);g.completion=0;g.transition=0;g.padTimer=0;g.stats={level:index,elapsed:0,deaths:0,rescues:0,abilities:[0,0],hearts:0};
  // Последнее состояние ввода не переносится между главами.
  const previousInputs=g.input||[];
  g.input=[makeInput(),makeInput()];
  for(let i=0;i<2;i++)for(const key of ['jumpSeq','abilitySeq','bondSeq','emoteSeq','packetSeq','processedSeq'])
    if(Number.isSafeInteger(previousInputs[i]?.[key]))g.input[i][key]=previousInputs[i][key];
  worlds.initWorld(g);adventure.init(g);
}
const makeInput=()=>({left:false,right:false,jumpQueued:false,abilityQueued:false,bondQueued:false,emoteQueued:false,jumpSeq:0,abilitySeq:0,bondSeq:0,emoteSeq:0,packetSeq:0,processedSeq:0});
function updateInput(g,role,message){
  if(![0,1].includes(role))return;
  let i=g.input[role];
  if(Number.isSafeInteger(message.inputSeq)&&message.inputSeq>=0&&message.inputSeq<=Number.MAX_SAFE_INTEGER){i.packetSeq=Math.max(i.packetSeq||0,message.inputSeq);}
  i.left=message.left===true;i.right=message.right===true;
  for(const [seqField,queued] of [['jumpSeq','jumpQueued'],['abilitySeq','abilityQueued'],['bondSeq','bondQueued'],['emoteSeq','emoteQueued']]){
    const value=message[seqField];
    if(Number.isSafeInteger(value)&&value>=0&&value<=1_000_000_000&&value>i[seqField]){
      // Ограничение очереди: одна команда за обновление, без накопления повторов.
      i[seqField]=value;
      i[queued]=true;
    }
  }
}
function clearMovement(g,role){if(role==null)return;const i=g.input[role];i.left=false;i.right=false;i.jumpQueued=false;i.abilityQueued=false;i.bondQueued=false;i.emoteQueued=false;}
function bridgeActive(g){
  const l=g.level;
  if(l.bridgeLatched)return true;
  if(l.bridgeTrigger==='pad-crystal')return l.pads.some(p=>p.pressed);
  if(l.bridgeTrigger==='pad')return l.padLatched||l.pads.some(p=>p.pressed);
  if(l.bridgeTrigger==='crystal')return l.crystals.length>0&&l.crystals.every(c=>c.on);
  return l.bridgeTrigger==='always';
}
function solidRects(g){const l=g.level,out=l.platforms.map(p=>({...p,kind:'platform'}));
  for(const [a,b] of l.floor)out.push({x:a,y:GROUND,w:b-a,h:180,kind:'floor'});
  if(bridgeActive(g))l.bridges.forEach(b=>out.push({...b,kind:'bridge'}));
  l.walls.filter(w=>!w.broken).forEach(w=>out.push({...w,kind:'wall',wall:w}));
  if(!l.gateOpen)l.gates.forEach(q=>out.push({...q,kind:'gate'}));
  out.push(...worlds.extraPlatforms(g),...worlds.extraBarriers(g));
  return out;
}
function respawn(g,p){if(g.stats)g.stats.deaths++;p.x=g.level.spawn[p.type];p.y=GROUND-43;p.vx=0;p.vy=0;p.dash=0;p.cool=Math.min(.4,p.cool);}
function stepPlayer(g,p,dt){const i=g.input[p.type], axis=Number(i.right)-Number(i.left);
  if(axis)p.face=axis;
  p.cool=Math.max(0,p.cool-dt);p.abilityFx=Math.max(0,p.abilityFx-dt);
  const abilityFired=i.abilityQueued&&p.cool<=0;
  if(abilityFired&&g.stats)g.stats.abilities[p.type]++;
  if(abilityFired){
    if(p.type===0){p.dash=.22;p.cool=1;p.vy*=.2;p.abilityFx=.3;}
    else{p.cool=1.05;p.abilityFx=.55;let cx=p.x+15,cy=p.y+21.5;
      for(const c of g.level.crystals){if(!c.on&&Math.hypot(c.x-cx,c.y-cy)<175)c.on=true;}
    }
  }
  if(abilityFired){worlds.onAbility(g,p);adventure.onAbility(g,p);}
  i.abilityQueued=false;
  if(i.jumpQueued)p.jumpBuffer=.14;else p.jumpBuffer=Math.max(0,p.jumpBuffer-dt);
  i.jumpQueued=false;
  if(p.grounded)p.coyote=.11;else p.coyote=Math.max(0,p.coyote-dt);
  if(p.jumpBuffer>0&&p.coyote>0){
    const sig=g.level.signature;
    const lunarBoost=sig?.kind==='tide'&&sig.phase>.65&&sig.nodes.some(n=>Math.abs(p.x+15-n.x)<85);
    p.vy=lunarBoost?-580:-486;p.grounded=false;p.coyote=0;p.jumpBuffer=0;}
  if(p.dash>0){p.dash=Math.max(0,p.dash-dt);p.vx=p.face*760;}
  else{const target=axis*273;p.vx+=clamp(target-p.vx,-2450*dt,2450*dt);}
  p.vy=Math.min(950,p.vy+1300*dt);
  worlds.worldForces(g,p,dt);adventure.forces(g,p,dt);
  const solids=solidRects(g);
  p.x+=p.vx*dt;
  for(const s of solids)if(overlaps(p,s)){
    if(s.kind==='wall'&&p.type===0&&p.dash>0){s.wall.broken=true;continue;}
    if(p.vx>0)p.x=s.x-p.w;else if(p.vx<0)p.x=s.x+s.w;
    p.vx=0;p.dash=0;
  }
  p.x=clamp(p.x,5,g.level.width-p.w-5);
  p.y+=p.vy*dt;p.grounded=false;
  for(const s of solids)if(overlaps(p,s)){
    if(p.vy>=0&&p.y+p.h-s.y<Math.max(30,p.vy*dt+14)){
      p.y=s.y-p.h;p.vy=0;p.grounded=true;
    }else if(p.vy<0){p.y=s.y+s.h;p.vy=0;}
    else if(p.x+p.w/2<s.x+s.w/2)p.x=s.x-p.w;else p.x=s.x+s.w;
  }
  for(const h of g.level.hazards)if(g.adventure.bond.shield<=0&&overlaps(p,{...h,y:h.y+3,h:h.h-3})){respawn(g,p);break;}
  if(p.y>HEIGHT+52){
    const ally=g.players[1-p.type],bond=g.adventure?.bond;
    if(bond&&bond.active>0&&ally.grounded&&Math.abs(p.x-ally.x)<880){
      const safe=ally.x+(p.type===0?-42:42);
      p.x=clamp(safe,5,g.level.width-p.w-5);p.y=ally.y;p.vy=0;p.vx=0;p.grounded=true;
      bond.active=0;bond.shield=Math.max(bond.shield,1.1);if(g.stats)g.stats.rescues++;
    }else if(p.y>HEIGHT+120)respawn(g,p);
  }
  adventure.afterStep(g,p);
  g.level.shards.forEach((x,idx)=>{if(!g.shards[idx]){
    const y=idx%2?390:432;
    if(Math.hypot(p.x+15-x,p.y+21.5-y)<32)g.shards[idx]=true;
  }});
}
function updateObjectives(g,dt){
  const l=g.level;
  for(const pad of l.pads)
    pad.pressed=g.players.some(p=>p.type===pad.type&&p.x+p.w>pad.x+6&&p.x<pad.x+pad.w-6&&Math.abs(p.y+p.h-GROUND)<13);
  const simultaneous=l.pads.length>0&&l.pads.every(p=>p.pressed);
  g.padTimer=simultaneous?g.padTimer+dt:0;
  if(g.padTimer>.22)l.padLatched=true;
  const crystalsDone=l.crystals.length>0&&l.crystals.every(c=>c.on);
  const wallsDone=l.walls.every(w=>w.broken);
  if((l.bridgeTrigger==='crystal'||l.bridgeTrigger==='pad-crystal')&&crystalsDone)l.bridgeLatched=true;
  if(l.bridgeTrigger==='pad'&&l.padLatched)l.bridgeLatched=true;
  const goal=l.puzzle||{pads:true};
  if((!goal.walls||wallsDone)&&(!goal.crystals||crystalsDone)&&(!goal.pads||l.padLatched)&&worlds.complete(g)&&adventure.canExit(g))
    l.gateOpen=true;
}
function tick(g,connected){g.tick++;
  if(g.phase!=='playing'||!connected[0]||!connected[1])return;
  if(g.transition>0){g.transition-=DT;if(g.transition<=0){
    if(g.stage>=stages.length-1)g.phase='win';else initStage(g,g.stage+1);
  }return;}
  // Fixed timestep: world mechanics also run authoritatively on the server.
  worlds.advanceWorld(g,DT);
  for(const p of g.players)stepPlayer(g,p,DT);
  for(const i of g.input)i.processedSeq=i.packetSeq||0;
  for(const p of g.players)adventure.onInput(g,p,g.input[p.type]);
  if(g.stats){g.stats.elapsed+=DT;g.stats.hearts=g.adventure?.bond?.hearts||0;}
  worlds.updateWorld(g,DT);
  adventure.update(g,DT);
  updateObjectives(g,DT);
  const both=g.players.every(p=>Math.abs(p.x+15-g.level.portal)<70&&p.y+p.h>400);
  if(g.level.gateOpen&&both){g.completion+=DT;if(g.completion>.58){
    const st=g.stats||{elapsed:0,deaths:0,rescues:0,abilities:[0,0],hearts:0};
    const score=st.deaths===0&&st.elapsed<180&&st.abilities.every(n=>n>0)?3:st.deaths<=2?2:1;
    g.lastResult={level:g.stage,elapsed:Math.round(st.elapsed*10)/10,deaths:st.deaths,rescues:st.rescues,stars:score,completed:true};
    g.transition=.85;
  }}else g.completion=0;
}
function snapshot(g,connected){const l=g.level;
  return {t:'snapshot',tick:g.tick,stage:g.stage,phase:g.phase,players:g.players.map(p=>({x:p.x,y:p.y,vx:p.vx,vy:p.vy,face:p.face,grounded:p.grounded,cool:p.cool,dash:p.dash,abilityFx:p.abilityFx})),
  ack:g.input.map(i=>i.processedSeq||0),processedCommands:g.input.map(i=>({jumpSeq:i.jumpSeq||0,abilitySeq:i.abilitySeq||0})),stats:g.stats?{...g.stats}:null,result:g.lastResult,world:{pads:l.pads.map(p=>p.pressed),walls:l.walls.map(w=>w.broken),crystals:l.crystals.map(c=>c.on),gateOpen:l.gateOpen,bridgeLatched:l.bridgeLatched,padLatched:l.padLatched,shards:g.shards,signature:worlds.worldSnapshot(g),adventure:adventure.snapshot(g)},connected,transition:g.transition>0};
}
module.exports={createGame,initStage,updateInput,clearMovement,tick,snapshot,bridgeActive};