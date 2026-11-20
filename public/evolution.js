/* Linked by Light — Gameplay Evolution: optional story beats, bond HUD and
 * visual communication. Authority stays in server game-core/adventure-core.
 * No new network messages, room tokens, analytics or third-party assets. */
(function(root,factory){
 'use strict';
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.GameEvolution=api;
})(typeof window!=='undefined'?window:globalThis,function(root){
 'use strict';
 const KEY='linked-light-evolution-story-v1';
 const STORIES=Object.freeze({
  0:{ru:['Первый контакт','Искра удерживает янтарный свет, Эхо — голубой. Найдите обе плиты и встаньте на них одновременно.'],
     en:['First contact','Spark holds the amber light; Echo holds the blue. Find your two plates and stand on them together.']},
  1:{ru:['Мост доверия','Искра разбивает преграду рывком. Эхо заряжает кристалл. Один открывает дорогу другому.'],
     en:['Bridge of trust','Spark dashes through the barrier. Echo charges the crystal. Each opens a path for the other.']},
  2:{ru:['Один ритм','Время искать общий темп. Договоритесь, прежде чем пересечь опасный участок.'],
     en:['One rhythm','Find your shared timing. Agree on your next move before crossing danger.']},
  8:{ru:['Вместе сильнее','Световые силы разные, но ваше решение одно. Держитесь рядом в финале первой главы.'],
     en:['Stronger together','Your powers are different; your purpose is the same. Stay close in the first chapter finale.']}
 });
 const limited=(n,min,max)=>Number.isFinite(n)?Math.max(min,Math.min(max,n)):min;
 const lang=()=>root.GameI18n?.isEnglish?.()===true?'en':'ru';
 const tr=(ru,en)=>lang()==='en'?en:ru;
 function moment(stage){
  if(!Number.isSafeInteger(stage)||stage<0)return null;
  const preset=STORIES[stage];
  if(preset)return preset[lang()];
  if(stage>=122&&stage<=136)return [tr('Физика света','Physics of light'),
   tr('В этом мире действуют новые правила. Попробуйте силы героев по очереди, затем вместе.','The rules have changed. Try each hero’s ability separately, then together.')];
  if(stage>=112&&stage<=121)return [tr('Навстречу друг другу','Toward each other'),
   tr('Иногда каждому видна лишь половина разгадки. Делитесь наблюдениями.','Sometimes each hero sees only half the answer. Talk through what you discover.')];
  if(stage>=100&&stage<=111)return [tr('Переплетение миров','Intertwined worlds'),
   tr('Соединяйте возможности двух миров: нить, время и смену измерений.','Combine both worlds: the tether, timing and shifting dimensions.')];
  if(stage>0&&stage<99&&stage%9===0)return [
   tr('Новый мир · акт '+(1+Math.floor(stage/9)),'New world · act '+(1+Math.floor(stage/9))),
   tr('Новые испытания потребуют разных решений. Обсудите, кто открывает путь первым.','New challenges need new tactics. Decide together who leads the next move.')];
  return null;
 }
 function comboText(count){
  return [tr('Резонанс света','Light resonance'),tr(
   'Обе способности применены рядом друг с другом! Заряд связи вырос, включилась короткая защита. Серия: '+count+'.',
   'You used both abilities close together! The bond gained energy and brief protection. Total: '+count+'.')];
 }
 let ribbon=null,toggle=null,body=null,heading=null,charge=null,chargeText=null,live=null;
 let lastStage=-1,lastSyncs=0,lastBond=null,phase='waiting',showStory=true,expiresAt=0,solo=false;
 function enabled(){try{return root.localStorage?.getItem(KEY)!=='0';}catch(_){return true;}}
 function persist(next){try{root.localStorage?.setItem(KEY,next?'1':'0');}catch(_){}}
 function show(title,message,time=6.4){
  if(!ribbon||!showStory)return;
  heading.textContent=title;body.textContent=message;
  ribbon.hidden=false;
  ribbon.classList.remove('evo-flash');void ribbon.offsetWidth;ribbon.classList.add('evo-flash');
  expiresAt=(root.performance?.now?.()||0)+time*1000;
 }
 function showCharge(bond){
  if(!charge||!chargeText)return;
  const power=limited(bond?.power,0,1);
  charge.style.width=Math.round(power*100)+'%';
  const percent=Math.round(power*100);
  chargeText.textContent=tr('Сила связи · ','Bond power · ')+percent+'%';
  if(toggle)toggle.setAttribute('aria-label',tr('Показать или скрыть сюжетные подсказки. Сила связи ','Toggle story moments. Bond power ')+percent+'%');
  if(live)live.textContent=Number.isSafeInteger(bond?.syncs)?
    tr('Синхронных действий · ','Synchronized actions · ')+bond.syncs:'';
 }
 function refresh(){
  if(!ribbon||!toggle)return;
  toggle.textContent=showStory?tr('✦ История: вкл.','✦ Story: on'):tr('✦ История: выкл.','✦ Story: off');
  toggle.setAttribute('aria-pressed',String(showStory));
  ribbon.querySelector('.evo-dismiss').setAttribute('aria-label',tr('Закрыть сюжетную реплику','Dismiss story message'));
  showCharge(lastBond);
  if(ribbon.hidden)return;
  if(expiresAt>0&&lastStage>=0&&phase==='playing'){
   const data=moment(lastStage);if(data){heading.textContent=data[0];body.textContent=data[1];}
  }
 }
 function init(){
  if(ribbon||!root.document)return;
  const frame=root.document.getElementById('frame');
  const top=root.document.querySelector('.topline > div:last-of-type');
  if(!frame||!top)return;
  showStory=enabled();
  toggle=root.document.createElement('button');toggle.type='button';toggle.id='evolutionToggle';
  toggle.className='mini-btn evo-toggle';toggle.setAttribute('aria-pressed',String(showStory));
  toggle.addEventListener('click',()=>{
   showStory=!showStory;persist(showStory);if(!showStory)ribbon.hidden=true;
   refresh();
   if(showStory&&phase==='playing'){const beat=moment(lastStage);if(beat)show(...beat);}
  });
  top.append(toggle);
  const hud=root.document.createElement('div');hud.id='evolutionHUD';hud.className='evo-hud';
  hud.innerHTML='<div class="evo-hud-head"><span class="evo-hud-label"></span><span class="evo-sync-count"></span></div><div class="evo-meter"><div class="evo-meter-fill"></div></div>';
  charge=hud.querySelector('.evo-meter-fill');chargeText=hud.querySelector('.evo-hud-label');live=hud.querySelector('.evo-sync-count');
  hud.hidden=true;frame.append(hud);
  ribbon=root.document.createElement('aside');ribbon.id='evolutionRibbon';ribbon.className='evo-ribbon';ribbon.hidden=true;
  ribbon.setAttribute('aria-live','polite');ribbon.setAttribute('aria-atomic','true');
  const icon=root.document.createElement('span');icon.className='evo-ribbon-symbol';icon.setAttribute('aria-hidden','true');icon.textContent='✦';
  const copy=root.document.createElement('div');copy.className='evo-copy';
  heading=root.document.createElement('strong');body=root.document.createElement('p');copy.append(heading,body);
  const close=root.document.createElement('button');close.type='button';close.className='evo-dismiss';close.textContent='×';
  close.addEventListener('click',()=>{ribbon.hidden=true;expiresAt=0;});
  ribbon.append(icon,copy,close);frame.append(ribbon);
  root.GameI18n?.subscribe?.(refresh);
  refresh();
 }
 function onSnapshot(prev,next){
  if(!ribbon||!next)return;
  phase=next.phase||'waiting';solo=next.solo===true;
  const hud=root.document.getElementById('evolutionHUD');
  if(hud)hud.hidden=phase!=='playing';
  if(phase!=='playing'){ribbon.hidden=true;expiresAt=0;return;}
  const bond=next.world?.adventure?.bond;
  lastBond=bond||null;showCharge(bond);
  const stage=next.stage;
  const incoming=Number.isSafeInteger(bond?.syncs)?bond.syncs:0;
  if(stage!==lastStage){
   lastStage=stage;lastSyncs=incoming;
   if(showStory){const beat=moment(stage);if(beat)show(...beat);}
  }else if(prev&&incoming>lastSyncs){
   lastSyncs=incoming;
   if(showStory)show(...comboText(incoming),4.4);
  }else lastSyncs=Math.max(lastSyncs,incoming);
 }
 function frame(now){
  if(ribbon&&!ribbon.hidden&&expiresAt>0&&Number.isFinite(now)&&now>=expiresAt){ribbon.hidden=true;expiresAt=0;}
 }
 // World-space communication: keep the beam between visible heroes. It never
 // changes collisions, physics, camera, level logic or server-owned entitlements.
 function link(ctx,players,bond,clock=0,settings={}){
  if(!ctx||!Array.isArray(players)||!players[0]||!players[1])return;
  const [a,b]=players;
  const ax=a.x+15,ay=a.y+17,bx=b.x+15,by=b.y+17;
  const d=Math.hypot(ax-bx,ay-by);
  if(!Number.isFinite(d)||d>550||d<8)return;
  const power=limited(bond?.power,0,1),resonance=limited(bond?.resonance,0,4.5);
  const low=settings.graphics==='low',reduced=!!settings.reducedMotion;
  const midx=(ax+bx)/2,midy=(ay+by)/2-Math.min(92,d*.16);
  ctx.save();ctx.lineCap='round';
  const gradient=ctx.createLinearGradient(ax,ay,bx,by);
  gradient.addColorStop(0,'#ffcf88');gradient.addColorStop(.5,'#f5f8ef');gradient.addColorStop(1,'#84e8ff');
  ctx.strokeStyle=gradient;ctx.lineWidth=1.3+power*2.5+(resonance>0?1.4:0);
  ctx.globalAlpha=.13+power*.38+(resonance>0?.20:0);
  if(!low){ctx.shadowColor=resonance>0?'#f7f3b6':'#b0e6fe';ctx.shadowBlur=9+(resonance>0?12:0);}
  ctx.beginPath();ctx.moveTo(ax,ay);ctx.quadraticCurveTo(midx,midy,bx,by);ctx.stroke();
  if(resonance>0){
   ctx.globalAlpha=.25+.2*power;ctx.lineWidth=1.4;
   ctx.beginPath();ctx.moveTo(ax,ay+7);ctx.quadraticCurveTo(midx,midy+25,bx,by+7);ctx.stroke();
  }
  if(!low&&!reduced){
   for(let i=0;i<4;i++){
    const t=((clock*(resonance>0?.36:.13)+i*.25)%1),u=1-t;
    const x=u*u*ax+2*u*t*midx+t*t*bx;
    const y=u*u*ay+2*u*t*midy+t*t*by;
    ctx.globalAlpha=(.24+power*.43)*(1-Math.abs(t-.5));
    ctx.fillStyle=i%2?'#9febff':'#ffe4b5';
    ctx.beginPath();ctx.arc(x,y,resonance>0?3:1.8,0,Math.PI*2);ctx.fill();
   }
  }
  ctx.restore();
 }
 // Additional world-space fireflies in scene; deterministic positions, no assets.
 function scenery(ctx,level,clock,camera=0,settings={}){
  if(!ctx||!level||settings.graphics==='low')return;
  const reduced=!!settings.reducedMotion,nearX=camera;
  ctx.save();ctx.lineCap='round';
  for(let i=0;i<19;i++){
   const x=140+i*153+Math.sin(i*4.713)*48;
   if(x<nearX-90||x>nearX+1290||x>level.width)continue;
   const baseY=260+(i*73%187),drift=reduced?0:Math.sin(clock*.75+i*2.7)*12;
   const y=baseY+drift;
   const color=i%2?'#92ebff':'#ffdea3';
   ctx.globalAlpha=.17+(reduced?.09:.11*Math.sin(clock*1.5+i));
   ctx.shadowColor=color;ctx.shadowBlur=9;ctx.fillStyle=color;
   ctx.beginPath();ctx.arc(x,y,1.4+(i%3)*.4,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
 }
 return Object.freeze({STORIES,moment,comboText,init,onSnapshot,frame,link,scenery,
  getState:()=>({showStory,lastStage,lastSyncs,phase,solo})});
});
