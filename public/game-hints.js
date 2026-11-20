/* Linked by Light: non-invasive, role-aware hints for content alpha.
   No game-state mutations, telemetry, saved personal data or paid unlocks. */
(function(root,factory){
  'use strict';
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.GameHints=api;
})(typeof window!=='undefined'?window:globalThis,function(root){
  'use strict';
  function hint(stage,world,role,depth=1,players=null){
    if(!stage)return 'Создайте комнату и начните игру вдвоём.';
    const isEcho=role===1;
    const sparkAbility=root.GameControls?.labelFor(0,'ability')||'F';
    const echoAbility=root.GameControls?.labelFor(1,'ability')||'Enter';
    const currentObjective=stage.objective||stage.hint||'Действуйте вместе, чтобы открыть путь.';
    if(depth<=1)return currentObjective.replace(/\bF\b/g,sparkAbility).replace(/\bEnter\b/g,echoAbility);
    if(world?.gateOpen||stage.gateOpen)return 'Ворота открыты. Искра и Эхо должны вместе подойти к световому порталу.';
    const boss=world?.adventure?.boss;
    if(boss?.active&&boss.hp>0){
      return boss.next===role
        ?'Сейчас ваша очередь атаковать босса. Подойдите ближе и нажмите способность ('+(isEcho?echoAbility:sparkAbility)+' / ✦'+').'
        :'Сейчас атакует '+(boss.next===1?'Эхо':'Искра')+'. Помогите партнёру подойти к боссу и следите за предупреждением об атаке.';
    }
    const arcade=world?.adventure?.arcade;
    if(arcade?.started&&!arcade.done){
      const names={
        chase:'Оба бегите вправо, пересеките световую границу и избегайте преследователя.',
        flight:'Оба прыгните в воздушное кольцо. Высота и одновременность важнее скорости.',
        rhythm:'Оба подойдите к своим точкам ритма и нажмите способности в течение короткого общего окна.',
        sail:isEcho?'Подойдите к парусу и зарядите его импульсом ('+echoAbility+' / ✦); Искра должна держать направление вправо.':'Встаньте вдвоём на парусную платформу и удерживайте движение вправо; Эхо заряжает парус импульсом.'
      };
      return names[arcade.kind]||'Скоординируйте действия обоих игроков для завершения мини-игры.';
    }
    if(stage.onboarding==='jump-pads'&&(!players||players.some(p=>Number.isFinite(p?.x)&&p.x<555)))
      return 'Сначала прыгните через короткую пропасть: нажмите прыжок за шаг до края. После второго светового мостика оба встаньте на свои плиты.';
    const wall=stage.walls?.find((w,i)=>!(world?.walls?.[i]??w.broken));
    if(wall)return isEcho?'Искра должна разрушить преграду рывком. Оставайтесь рядом и помогите пройти дальше.':'Подойдите к светящейся стене слева, повернитесь к ней и нажмите '+sparkAbility+' на ПК или ✦ на телефоне.';
    const crystal=stage.crystals?.find((c,i)=>!(world?.crystals?.[i]??c.on));
    if(crystal)return isEcho?'Подойдите к неактивному кристаллу и нажмите '+echoAbility+' на ПК или ✦ на телефоне.':'Эхо должен зарядить кристалл импульсом. Если он за мостом, удерживайте плиту, пока Эхо проходит.';
    if(stage.puzzle?.pads&&!(world?.padLatched??stage.padLatched)){
      return isEcho?'Найдите голубую плиту и встаньте на неё, пока Искра держит оранжевую.':'Найдите оранжевую плиту и встаньте на неё одновременно с Эхом на голубой.';
    }
    const sig=stage.signature,signatureDone=world?.signature?.done??sig?.done;
    if(sig&&!signatureDone){
      const tips={
        flowers:'Коснитесь световых цветов обоими героями: оранжевые — Искрой, голубые — Эхом.',
        forest:'Эхо: применяйте импульс возле светящихся семян. Пробуждённые растения открывают путь.',
        tide:'Во время яркого прилива подойдите к лунным фонарям нужным героем.',
        wind:'Используйте воздушные потоки для подъёма к небесным перьям.',
        constellation:'Эхо включает звёзды импульсом в порядке номеров. Ошибка сбрасывает узор.',
        prism:'Искра заряжает янтарные призмы рывком, Эхо — голубые импульсом.',
        city:'Активируйте городские генераторы способностями героя соответствующего цвета.',
        river:'Встаньте одновременно у двух речных якорей и удерживайте позиции.',
        clock:'Эхо запускает часы импульсом, затем оба успевают пройти временную дверь.',
        relay:'Один герой удерживает дальний сигнал, второй отвечает возле парного маяка.',
        heart:'Зарядите личные ядра способностями. Двойные требуют присутствия обоих рядом.'
      };
      return tips[sig.kind]||sig.hint||stage.hint||'Используйте способности героев вместе.';
    }
    const reality=stage.reality;
    if(reality&&!(world?.reality?.done??reality.done))return reality.hint||'Найдите личные печати, затем соедините два мира.';
    if(stage.v20||stage.v21||stage.v23)
      return (stage.objective||stage.hint||'Следуйте условиям главы.')+' Для дополнительных действий откройте меню главы (⋯ в чистом режиме).';
    return stage.hint||stage.objective||'Помогайте друг другу, чтобы открыть выход.';
  }

  let api={},dialog=null,headerButton=null,cleanButton=null,body=null,nextButton=null,dismissButton=null,nudge=null;
  let lastStage=null,depth=0;
  let tracker={stage:null,progress:-1,at:0,deaths:0,snoozeUntil:0};
  const ui=(key)=>root.GameI18n?.ui?.('hints.'+key)||key;
  // Monotonic milestones only. Oscillating temporary pad states must not reset
  // the inactivity clock indefinitely, and the server remains authoritative.
  function progress(world){
    if(!world)return 0;
    const count=a=>Array.isArray(a)?a.filter(Boolean).length:0;
    return (world.gateOpen?50:0)+(world.padLatched?4:0)+
      count(world.walls)*3+count(world.crystals)*3+
      (world.signature?.done?6:0)+count(world.signature?.nodes)+
      count(world.signature?.pairs)+(world.adventure?.arcade?.done?6:0);
  }
  function adaptivePrompt(stage,world,role,players,idleSeconds,deathsSince=0,english=false){
    if(!stage||world?.gateOpen||(!Number.isFinite(idleSeconds)&&!Number.isFinite(deathsSince)))return null;
    if(idleSeconds<24&&deathsSince<2)return null;
    if(stage.onboarding==='paired-pads')
      return english?'Need help? Spark stands on orange, Echo on blue — stay together for a moment.'
        :'Нужна помощь? Искра — на оранжевую плиту, Эхо — на голубую. Постойте одновременно.';
    if(stage.onboarding==='bridge-trust')
      return english?'Stuck? Spark breaks the wall and holds the plate; Echo crosses the bridge to the crystal.'
        :'Застряли? Искра ломает стену и держит плиту, Эхо проходит мост к кристаллу.';
    if(stage.onboarding==='jump-pads'&&(!players||players.some(p=>p?.x<555)))
      return english?'Hard jump? Start just before the edge and press Jump. The next bridge is safe.'
        :'Не получается прыжок? Прыгайте за шаг до края. Следующий мост безопасен.';
    return english?'Need a hand? Open the hint for your role and the current objective.'
      :'Нужна помощь? Откройте подсказку для своей роли и текущей задачи.';
  }
  function updateNudge(s){
    if(!nudge||!s||s.phase!=='playing'){if(nudge)nudge.hidden=true;return;}
    const state=api.getState?.();if(!state||state.role<0||state.customLevel){nudge.hidden=true;return;}
    const elapsed=Number(s.stats?.elapsed)||0,deaths=Number(s.stats?.deaths)||0;
    const current=progress(s.world);
    if(tracker.stage!==s.stage){
      tracker={stage:s.stage,progress:current,at:elapsed,deaths,snoozeUntil:0};
      nudge.hidden=true;return;
    }
    if(current>tracker.progress){tracker.progress=current;tracker.at=elapsed;tracker.deaths=deaths;tracker.snoozeUntil=0;nudge.hidden=true;}
    if(elapsed<tracker.snoozeUntil||!nudge.hidden)return;
    const message=adaptivePrompt(state.level,s.world,state.role,s.players,elapsed-tracker.at,deaths-tracker.deaths,
      root.GameI18n?.isEnglish?.()===true);
    if(message){nudge.textContent='? '+message;nudge.hidden=false;}
  }
  function close(){if(dialog)dialog.hidden=true;}
  function renderHint(){
    const state=api.getState?.();
    if(!state||state.phase!=='playing'||state.role<0)return;
    const result=hint(state.level,state.world,state.role,depth,state.players);
    body.textContent=state.customLevel?result:(root.GameI18n?.localizeHint?.(result,state.stageIndex,state.role,depth)??result);
    const en=root.GameI18n?.isEnglish?.()===true;
    dialog.querySelector('.game-hint-caption').textContent=(state.role===1?(en?'Echo':'Эхо'):(en?'Spark':'Искра'))+' · '+(state.customLevel?(state.level?.title||'Custom Level'):(root.GameI18n?.stageTitle?.(state.stageIndex,state.level?.title)||(state.level?.title||'Уровень')));
    nextButton.hidden=depth>=2;
  }
  function refreshLanguage(){
    if(!dialog)return;
    headerButton.textContent=ui('open');
    headerButton.setAttribute('aria-label',ui('openLabel'));
    cleanButton.setAttribute('aria-label',ui('cleanLabel'));
    dialog.setAttribute('aria-label',ui('cleanLabel'));
    nextButton.textContent=ui('more');
    dismissButton.textContent=ui('close');
    if(nudge)nudge.setAttribute('aria-label',root.GameI18n?.isEnglish?.()?'Open an adaptive hint':'Открыть адаптивную подсказку');
    if(!dialog.hidden)renderHint();
  }
  function open(next=false){
    const state=api.getState?.();
    if(!state||state.phase!=='playing'||state.role<0)return;
    if(!next&&dialog&&!dialog.hidden){close();return;}
    depth=next?Math.min(2,depth+1):1;
    renderHint();
    dialog.hidden=false;
  }
  function onSnapshot(s){
    if(!dialog)return;
    const eligible=s?.phase==='playing'&&api.getState?.().role>=0;
    if(headerButton)headerButton.hidden=!eligible;
    if(cleanButton)cleanButton.hidden=!eligible;
    if(!eligible||s.stage!==lastStage){lastStage=s.stage;depth=0;close();}
    updateNudge(s);
  }
  function init(callbacks){
    if(dialog)return;
    api=callbacks||{};
    const frame=document.getElementById('frame'),top=document.querySelector('.topline > div:last-of-type');
    if(!frame||!top)return;
    headerButton=document.createElement('button');
    headerButton.type='button';headerButton.id='gameHintBtn';
    headerButton.className='mini-btn';headerButton.textContent='? Подсказка';
    headerButton.setAttribute('aria-label','Открыть подсказку по уровню');
    headerButton.hidden=true;headerButton.addEventListener('click',()=>open(false));
    top.append(headerButton);
    cleanButton=document.createElement('button');
    cleanButton.type='button';cleanButton.id='gameHintCleanBtn';
    cleanButton.className='game-hint-clean';cleanButton.textContent='?';
    cleanButton.setAttribute('aria-label','Подсказка по текущему уровню');
    cleanButton.hidden=true;cleanButton.addEventListener('click',()=>open(false));
    frame.append(cleanButton);
    nudge=document.createElement('button');nudge.id='gameHintNudge';nudge.type='button';
    nudge.className='game-hint-nudge';nudge.hidden=true;nudge.setAttribute('aria-live','polite');
    nudge.addEventListener('click',()=>{nudge.hidden=true;tracker.snoozeUntil=(Number(api.getState?.()?.stats?.elapsed)||0)+35;depth=1;open(true);});
    frame.append(nudge);
    dialog=document.createElement('aside');dialog.id='gameHintPanel';
    dialog.className='game-hint-panel';dialog.hidden=true;
    dialog.setAttribute('aria-label','Подсказка по текущему уровню');
    const caption=document.createElement('strong');
    caption.className='game-hint-caption';
    body=document.createElement('p');body.className='game-hint-text';
    body.setAttribute('role','status');body.setAttribute('aria-live','polite');
    const footer=document.createElement('div');footer.className='game-hint-actions';
    nextButton=document.createElement('button');nextButton.type='button';
    nextButton.textContent='Подробнее';nextButton.addEventListener('click',()=>open(true));
    dismissButton=document.createElement('button');const dismiss=dismissButton;dismiss.type='button';
    dismiss.textContent='Закрыть';dismiss.addEventListener('click',close);
    footer.append(nextButton,dismiss);
    dialog.append(caption,body,footer);frame.append(dialog);
    root.GameI18n?.subscribe?.(refreshLanguage);
    refreshLanguage();
    document.addEventListener('keydown',event=>{
      const tag=event.target?.tagName;
      if(event.key==='Escape'&&!dialog.hidden){close();return;}
      if(event.key==='?'&&!event.repeat&&!['INPUT','TEXTAREA','SELECT'].includes(tag)&&!event.ctrlKey&&!event.metaKey){
        const state=api.getState?.();
        if(state?.phase==='playing'&&state.role>=0){event.preventDefault();open(false);}
      }
    });
  }
  return Object.freeze({hint,progress,adaptivePrompt,init,onSnapshot,close});
});
