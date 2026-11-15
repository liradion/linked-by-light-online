'use strict';
// v16–v19: deterministic server-authoritative weather, synchronized duets,
// bounded community blueprints and story endings. No third-party dependencies.
const {stages}=require('./shared/stages');
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const WEATHER=['clear','wind','rain','mist','stars','wind','rain','mist','stars','wind','rain'];
function forecast(stage){
 if(stage===99||stage<9)return 'clear';
 return WEATHER[Math.min(10,Math.floor(stage/9))];
}
function init(g){
 g.expansion={kind:forecast(g.stage),time:0,wind:0,duet:[-100,-100],resonance:0,duets:0};
}
function advance(g,dt){
 const e=g.expansion;if(!e)return;
 e.time+=dt;e.resonance=Math.max(0,e.resonance-dt);
 // Gentle deterministic gusts; net physics follows server state.
 e.wind=e.kind==='wind'?Math.sin(e.time*.6+g.stage)*43:0;
}
function forces(g,p,dt){
 const e=g.expansion;if(!e)return;
 p.vx+=e.wind*dt;
 if(e.kind==='rain'&&p.grounded)p.vx*=.998;
}
function onAbility(g,p){
 const e=g.expansion;if(!e)return;
 e.duet[p.type]=e.time;
 const other=g.players[1-p.type];
 if(e.resonance<=0&&Math.abs(e.duet[0]-e.duet[1])<=2.2
    &&Math.hypot(p.x-other.x,p.y-other.y)<185){
   e.resonance=2.5;e.duets++;e.duet=[-100,-100];
   if(g.adventure?.bond){g.adventure.bond.shield=Math.max(2,g.adventure.bond.shield);
    g.adventure.bond.power=clamp(g.adventure.bond.power+.22,0,1);}
   if(g.stats)g.stats.duets=(g.stats.duets||0)+1;
 }
}
function snapshot(g){
 const e=g.expansion||{};return {kind:e.kind||'clear',time:e.time||0,wind:e.wind||0,
  resonance:e.resonance||0,duets:e.duets||0};
}
function cleanNote(text){
 if(typeof text!=='string')return null;
 const safe=text.normalize('NFC').replace(/[\x00-\x08\x0b-\x1f\x7f]/g,'').trim().slice(0,160);
 return safe.length>=1?safe:null;
}
function cleanBlueprint(raw){
 if(!raw||raw.v!==1||!Array.isArray(raw.platforms)||raw.platforms.length>8)return null;
 const title=cleanNote(raw.title);
 if(!title||title.length>38)return null;
 const platforms=[];
 for(const p of raw.platforms){
  if(!p||!['x','y','w'].every(k=>Number.isInteger(p[k])))return null;
  if(p.x<235||p.x>1380||p.y<288||p.y>483||p.w<55||p.w>190
     ||p.x+p.w>1450)return null;
  platforms.push({x:p.x,y:p.y,w:p.w,h:16});
 }
 // Fixed safe floor, spawns, both role pads and portal; no arbitrary world scripts.
 return {v:1,title,platforms};
}
function applyBlueprint(g,raw){
 const b=cleanBlueprint(raw);if(!b)return false;
 // Always start from safe campaign level 1, never trust client-provided geometry.
 const {initStage}=require('./game-core');
 initStage(g,0);
 g.customChallenge=true;g.level.title=b.title;g.level.platforms=b.platforms.map(p=>({...p}));
 g.level.signature.done=true;
 g.level.shards=[];
 g.shards=[];
 return true;
}
const ENDINGS={
 dawn:{title:'Рассвет вдвоём',text:'Искра и Эхо вернули свет в долину. Впереди их ждут новые путешествия.'},
 promise:{title:'Нити света',text:'Два голоса сохранили своё обещание. Даже на расстоянии их свет остаётся общим.'},
 aurora:{title:'Вечное сияние',text:'Каждое совместное решение зажгло новое созвездие. Мир запомнил историю двоих.'}
};
function endingFor(room){
 const choices=Object.keys(room.storyChoices||{}).length;
 const hearts=room.game?.stats?.hearts||0;
 const kind=choices>=5?'aurora':hearts>=2?'promise':'dawn';
 return {kind,...ENDINGS[kind],choices};
}
module.exports={forecast,init,advance,forces,onAbility,snapshot,cleanNote,cleanBlueprint,applyBlueprint,endingFor,ENDINGS};
