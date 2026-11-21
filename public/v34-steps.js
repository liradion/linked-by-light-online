/* v34: role-aware first-act guidance derived only from authoritative snapshots.
 * Informational presentation; never sends commands or changes world state. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.GameV34Steps=api;
})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const text=(lang,key,ru,en)=>({key,text:lang==='en'?en:ru});
 const active=(arr,i,fallback=false)=>Array.isArray(arr)?arr[i]===true:fallback;
 function describe(level,world,role,players,language='ru'){
  if(!level||!world||![0,1].includes(role)||!level.onboarding||level.act!==1||!Number.isInteger(level.challenge)||level.challenge>8)return null;
  const en=language==='en'?'en':'ru',echo=role===1;
  const tip=(id,ru,english)=>text(en,id,ru,english);
  if(world.gateOpen)return tip('portal','Ворота открыты. Войдите в портал вместе с партнёром.','Gate open. Reach the portal together with your partner.');
  const notDoneWall=level.walls?.find((wall,i)=>!active(world.walls,i,!!wall.broken));
  const notDoneCrystal=level.crystals?.find((crystal,i)=>!active(world.crystals,i,!!crystal.on));
  const pad=(level.pads||[]).find(p=>p.type===role);
  const padIndex=pad?level.pads.indexOf(pad):-1;
  const isOnPad=padIndex>=0&&active(world.pads,padIndex);
  const ownName=echo?['Эхо','Echo']:['Искра','Spark'];
  const otherName=echo?['Искра','Spark']:['Эхо','Echo'];
  if(notDoneWall)return echo?
    tip('wall-support','Искра должна разрушить стену рывком. Подождите партнёра у преграды.','Spark needs to dash through the wall. Regroup near the barrier.'):
    tip('wall-dash','Ваш шаг: разрушьте светящуюся стену рывком (F или кнопка способности).','Your turn: dash into the glowing wall (F or the ability button).');
  if(level.onboarding==='bridge-trust'&&notDoneCrystal){
   if(!echo)return isOnPad?
    tip('bridge-hold','Продолжайте удерживать янтарную плиту, пока Эхо пересекает мост.','Keep holding the amber plate while Echo crosses the bridge.'):
    tip('bridge-plate','Встаньте на янтарную плиту и удерживайте мост для Эха.','Stand on the amber plate and hold the bridge for Echo.');
   return active(world.pads,0)?
    tip('bridge-echo','Искра удерживает мост. Перейдите и зарядите кристалл импульсом.','Spark is holding the bridge. Cross it and pulse the crystal.'):
    tip('bridge-wait','Дождитесь, пока Искра встанет на янтарную плиту и удержит мост.','Wait until Spark holds the amber plate to support the bridge.');
  }
  if(notDoneCrystal)return echo?
   tip('crystal-pulse','Ваш шаг: приблизьтесь к кристаллу и зарядите его импульсом (Enter или ✦).','Your turn: approach the crystal and activate it with a pulse (Enter or ✦).'):
   tip('crystal-support','Эхо заряжает кристалл импульсом. Держитесь рядом и помогите пройти дальше.','Echo activates the crystal with a pulse. Stay close and help them move ahead.');
  if(level.onboarding==='jump-pads'){
   const own=players?.[role];
   if(Number.isFinite(own?.x)&&own.x<555)
    return tip('jump-gap','Перепрыгните короткую пропасть: нажмите прыжок за шаг до края.','Jump over the short gap: press Jump just before the edge.');
  }
  if(level.onboarding==='hold-and-sail'){
   if(!world.padLatched)return echo?
    tip('sail-wait','Искра закрепляет мост янтарной плитой. Подождите, прежде чем переходить.','Spark must latch the bridge with the amber plate. Wait before crossing.'):
    tip('sail-hold','Удерживайте янтарную плиту, пока мост не закрепится.','Hold the amber plate until the bridge stays in place.');
   if(world.adventure?.arcade?.started&&!world.adventure.arcade.done)return echo?
    tip('sail-pulse','На парусе применяйте импульс Эха для движения вперёд.','On the sail, pulse as Echo to drive it forward.'):
    tip('sail-steer','На парусе удерживайте направление вправо, пока Эхо даёт импульс.','On the sail, steer right while Echo pulses.');
   return tip('sail-board','Мост закреплён. Оба подойдите к парусу.','Bridge latched. Both players should board the sail.');
  }
  if(level.onboarding==='first-flight'){
   if(world.adventure?.arcade?.started&&!world.adventure.arcade.done)
    return tip('flight-pair','Войдите в световое кольцо вместе и синхронизируйте прыжки.','Enter the glowing ring together and time your jumps.');
   return tip('flight-enter','Кристалл готов. Вместе подпрыгните к световому кольцу.','Crystal activated. Jump together into the glowing ring.');
  }
  if(level.onboarding==='rhythm-duo'){
   return tip('rhythm','Займите свою ритмическую точку и используйте способность в общем временном окне.',
    'Move to your rhythm mark and use your ability within the shared time window.');
  }
  if(level.onboarding==='first-boss'){
   const boss=world.adventure?.boss;
   if(boss?.active&&boss.hp>0)return boss.next===role?
    tip('boss-turn','Ваша очередь: приблизьтесь к стражу и используйте способность.','Your turn: approach the guardian and use your ability.'):
    tip('boss-support','Сейчас очередь партнёра. Следите за предупреждениями стража.','Your partner attacks next. Watch the guardian’s warnings.');
   if(boss?.active&&boss.hp<=0)
    return tip('boss-win','Страж побеждён. Двигайтесь к выходу вместе.','Guardian defeated. Reach the exit together.');
  }
  if(level.onboarding==='flowers-wall'&&!world.signature?.done){
   const nodes=level.signature?.nodes||[];
   const outstanding=nodes.some((n,i)=>n.role===role&&!active(world.signature?.nodes,i));
   if(outstanding)return tip('flower-own','Найдите и коснитесь светового цветка своего цвета.','Find and touch the glowing flower matching your hero.');
   if(nodes.length)return tip('flower-partner','Ваш цветок активирован. Помогите партнёру найти его цветок.','Your flower is active. Help your partner find theirs.');
  }
  if(level.puzzle?.pads&&!world.padLatched){
   if(isOnPad)return tip('pad-hold','Удерживайте свою плиту, пока партнёр активирует вторую.','Hold your plate while your partner activates the other.');
   if(pad)return tip('pad-own',echo?'Встаньте на голубую плиту одновременно с Искрой.':'Встаньте на оранжевую плиту одновременно с Эхом.',
    echo?'Stand on the blue plate together with Spark.':'Stand on the orange plate together with Echo.');
  }
  return tip('team','Держитесь вместе и завершите оставшийся совместный механизм.','Stay together and finish the remaining cooperative mechanism.');
 }
 return Object.freeze({describe});
});
