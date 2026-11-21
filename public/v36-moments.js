/* v36 — original co-op milestone feedback, derived solely from server snapshots.
 * No progress writes, network requests, personal identifiers or licensed media. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.GameV36Moments=api;
})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 function detect(previous,next,language='ru'){
  if(!previous||!next||previous.stage!==next.stage||next.phase!=='playing')return null;
  const a=previous.world,b=next.world;
  if(!a||!b||b.gateOpen)return null; // Gate opening already has a stronger canonical announcement.
  const en=language==='en';
  const msg=(key,ru,english,freq)=>({key,text:en?english:ru,freq});
  const before=Number.isInteger(a.checkpoint?.index)?a.checkpoint.index:-1;
  const after=Number.isInteger(b.checkpoint?.index)?b.checkpoint.index:-1;
  if(after>before&&after>=0&&after<20)
   return msg('checkpoint','✦ Общая точка восстановления активирована','✦ Shared recovery checkpoint activated',740);
  if(a.bridgeLatched!==true&&b.bridgeLatched===true)
   return msg('bridge','◇ Мост закреплён совместными действиями','◇ Bridge latched through teamwork',610);
  if(a.padLatched!==true&&b.padLatched===true&&b.gateOpen!==true)
   return msg('pads','✦ Совместный механизм активирован','✦ Cooperative mechanism activated',680);
  return null;
 }
 function apply(prev,next,language,announce,tone,toast){
  const event=detect(prev,next,language);
  if(!event||typeof announce!=='function')return false;
  announce(event.text,2.7);
  if(toast&&toast.dataset)toast.dataset.milestone=event.key;
  if(typeof tone==='function')tone(event.freq,.16,'sine',.027);
  return true;
 }
 return Object.freeze({detect,apply});
});
