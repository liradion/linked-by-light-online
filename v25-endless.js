'use strict';
// v25 Endless Together: deterministically reproducible creator maps, short local
// replays and opt-in ghosts. No raw videos, device IDs, messages or account data.
const crypto=require('node:crypto');
const MAX_FRAMES=750,CHUNK=85;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const cleanFrame=v=>Array.isArray(v)&&v.length===5&&v.every(Number.isFinite)
 ?[Math.max(0,Math.min(1e8,Math.round(v[0]))),...v.slice(1).map(x=>clamp(Math.round(x),-10000,100000))]:null;
const days=()=>new Date().toISOString().slice(0,10);
function seedForDate(date=days()){
 let hash=2166136261;
 for(const c of String(date))hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;
 return hash||1;
}
function random(seed){let state=seed>>>0;return ()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};}
function generate(seed){
 if(!Number.isInteger(seed)||seed<1||seed>0xffffffff)throw Error('Invalid seed');
 const rnd=random(seed),platforms=[];
 for(let i=0;i<7;i++){
  const x=260+i*160+Math.floor(rnd()*30);
  const y=330+Math.floor(rnd()*110);
  const w=95+Math.floor(rnd()*50);
  platforms.push({x,y,w,h:16});
 }
 return {v:1,title:'Бесконечный свет #'+(seed>>>0).toString(36).toUpperCase(),platforms};
}
function initial(){
 return {schema:25,replays:[],active:[],ghost:[],ghostStage:-1,stage:-1,seed:0,dailyKey:'',
  bests:{},lastResult:'',lastCaptureTick:-1,recordedAt:0};
}
function clean(raw){
 const r=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{},d=initial();
 d.replays=Array.isArray(r.replays)?r.replays.slice(-2).flatMap(x=>{
  if(!x||!Number.isInteger(x.stage)||x.stage<0||x.stage>136||!Array.isArray(x.frames))return [];
  const frames=x.frames.slice(-MAX_FRAMES).map(cleanFrame).filter(Boolean);
  return [{stage:x.stage,frames,at:Number.isFinite(x.at)?x.at:0}];
 }):[];
 d.ghost=(Array.isArray(r.ghost)?r.ghost:[]).slice(-MAX_FRAMES).map(cleanFrame).filter(Boolean);
 d.ghostStage=Number.isInteger(r.ghostStage)&&r.ghostStage>=0&&r.ghostStage<=136?r.ghostStage:-1;
 d.stage=Number.isInteger(r.stage)&&r.stage>=0&&r.stage<=136?r.stage:-1;
 d.seed=Number.isInteger(r.seed)&&r.seed>=0&&r.seed<=0xffffffff?r.seed:0;
 d.dailyKey=/^\d{4}-\d{2}-\d{2}$/.test(r.dailyKey||'')?r.dailyKey:'';
 d.bests=r.bests&&typeof r.bests==='object'?Object.fromEntries(Object.entries(r.bests).filter(([k,v])=>/^[0-9a-z-]{1,40}$/i.test(k)&&Number.isFinite(v)&&v>0&&v<36000).slice(-40)):{};
 d.lastResult=typeof r.lastResult==='string'?r.lastResult.slice(0,120):'';
 d.recordedAt=Number.isFinite(r.recordedAt)?r.recordedAt:0;
 d.active=Array.isArray(r.active)?r.active.slice(-MAX_FRAMES).map(cleanFrame).filter(Boolean):[];
 return d;
}
function ensure(room){
 if(!room.v25)room.v25=initial();
 return room.v25;
}
function capture(room){
 const g=room.game,z=ensure(room);
 if(!g||g.phase!=='playing'||!g.players?.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)))return;
 if(z.stage!==g.stage){
  z.stage=g.stage;z.active=[];z.lastCaptureTick=-1;z.recordedAt=Date.now();
 }
 if(g.tick===z.lastCaptureTick||g.tick%6!==0)return;
 z.lastCaptureTick=g.tick;
 const [a,b]=g.players;
 z.active.push([Math.round(g.tick),Math.round(a.x),Math.round(a.y),Math.round(b.x),Math.round(b.y)]);
 if(z.active.length>MAX_FRAMES)z.active.shift();
 const result=g.lastResult;
 if(!result?.completed||result.level!==g.stage)return;
 const key=result.level+':'+result.elapsed+':'+result.deaths;
 if(z.lastResult===key)return;
 z.lastResult=key;
 z.replays.push({stage:g.stage,frames:z.active.slice(),at:Date.now()});
 if(z.replays.length>2)z.replays.shift();
 z.ghost=z.active.slice();z.ghostStage=g.stage;
 const bestKey=z.dailyKey||'stage-'+g.stage,time=Number(result.elapsed);
 if(Number.isFinite(time)&&time>0&&(!z.bests[bestKey]||time<z.bests[bestKey]))z.bests[bestKey]=time;
}
function meta(room){
 const z=ensure(room);
 return {ghostStage:z.ghostStage,ghostFrames:z.ghost.length,
  replayStages:z.replays.map(x=>({stage:x.stage,frames:x.frames.length,at:x.at})),
  seed:z.seed,dailyKey:z.dailyKey,bests:z.bests};
}
function replayChunks(room,which){
 const z=ensure(room),entry=which==='ghost'?{stage:z.ghostStage,frames:z.ghost}
  :z.replays.findLast(x=>x.stage===which)||z.replays.at(-1);
 if(!entry||!entry.frames?.length)return [];
 const total=Math.ceil(entry.frames.length/CHUNK),id=crypto.randomBytes(4).toString('hex');
 return Array.from({length:total},(_,index)=>({
  t:'v25Replay',id,stage:entry.stage,index,total,
  frames:entry.frames.slice(index*CHUNK,(index+1)*CHUNK)
 }));
}
module.exports={MAX_FRAMES,CHUNK,initial,clean,ensure,seedForDate,generate,capture,meta,replayChunks};
