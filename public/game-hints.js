/* Linked by Light: non-invasive, role-aware hints for content alpha.
   No game-state mutations, telemetry, saved personal data or paid unlocks. */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.GameHints=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  function hint(stage,world,role,depth=1){
    if(!stage)return 'Создайте комнату и начните игру вдвоём.';
    const isEcho=role===1;
    if(depth<=1)return stage.objective||stage.hint||'Действуйте вместе, чтобы открыть путь.';
    if(world?.gateOpen||stage.gateOpen)return 'Ворота открыты. Искра и Эхо должны вместе подойти к световому порталу.';
    const boss=world?.adventure?.boss;
    if(boss?.active&&boss.hp>0){
      return boss.next===role
        ?'Сейчас ваша очередь атаковать босса. Подойдите ближе и нажмите способность ('+(isEcho?'Enter / ✦':'F / ✦')+').'
        :'Сейчас атакует '+(boss.next===1?'Эхо':'Искра')+'. Помогите партнёру подойти к боссу и следите за предупреждением об атаке.';
    }
    const arcade=world?.adventure?.arcade;
    if(arcade?.started&&!arcade.done){
      const names={
        chase:'Оба бегите вправо, пересеките световую границу и избегайте преследователя.',
        flight:'Оба прыгните в воздушное кольцо. Высота и одновременность важнее скорости.',
        rhythm:'Оба подойдите к своим точкам ритма и нажмите способности в течение короткого общего окна.',
        sail:isEcho?'Подойдите к парусу и зарядите его импульсом (Enter / ✦); Искра должна держать направление вправо.':'Встаньте вдвоём на парусную платформу и удерживайте движение вправо; Эхо заряжает парус импульсом.'
      };
      return names[arcade.kind]||'Скоординируйте действия обоих игроков для завершения мини-игры.';
    }
    const wall=stage.walls?.find((w,i)=>!(world?.walls?.[i]??w.broken));
    if(wall)return isEcho?'Искра должна разрушить преграду рывком. Оставайтесь рядом и помогите пройти дальше.':'Подойдите к светящейся стене слева, повернитесь к ней и нажмите F на ПК или ✦ на телефоне.';
    const crystal=stage.crystals?.find((c,i)=>!(world?.crystals?.[i]??c.on));
    if(crystal)return isEcho?'Подойдите к неактивному кристаллу и нажмите Enter на ПК или ✦ на телефоне.':'Эхо должен зарядить кристалл импульсом. Если он за мостом, удерживайте плиту, пока Эхо проходит.';
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

  let api={},dialog=null,headerButton=null,cleanButton=null,body=null,nextButton=null;
  let lastStage=null,depth=0;
  function close(){if(dialog)dialog.hidden=true;}
  function open(next=false){
    const state=api.getState?.();
    if(!state||state.phase!=='playing'||state.role<0)return;
    if(!next&&dialog&&!dialog.hidden){close();return;}
    depth=next?Math.min(2,depth+1):1;
    const result=hint(state.level,state.world,state.role,depth);
    body.textContent=result;
    dialog.querySelector('.game-hint-caption').textContent=(state.role===1?'Эхо':'Искра')+' · '+(state.level?.title||'Уровень');
    nextButton.hidden=depth>=2;
    dialog.hidden=false;
  }
  function onSnapshot(s){
    if(!dialog)return;
    const eligible=s?.phase==='playing'&&api.getState?.().role>=0;
    if(headerButton)headerButton.hidden=!eligible;
    if(cleanButton)cleanButton.hidden=!eligible;
    if(!eligible||s.stage!==lastStage){lastStage=s.stage;depth=0;close();}
  }
  function init(callbacks){
    if(dialog)return;
    api=callbacks||{};
    const frame=document.getElementById('frame'),top=document.querySelector('.topline > div:last-child');
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
    const dismiss=document.createElement('button');dismiss.type='button';
    dismiss.textContent='Закрыть';dismiss.addEventListener('click',close);
    footer.append(nextButton,dismiss);
    dialog.append(caption,body,footer);frame.append(dialog);
    document.addEventListener('keydown',event=>{
      const tag=event.target?.tagName;
      if(event.key==='Escape'&&!dialog.hidden){close();return;}
      if(event.key==='?'&&!event.repeat&&!['INPUT','TEXTAREA','SELECT'].includes(tag)&&!event.ctrlKey&&!event.metaKey){
        const state=api.getState?.();
        if(state?.phase==='playing'&&state.role>=0){event.preventDefault();open(false);}
      }
    });
  }
  return Object.freeze({hint,init,onSnapshot,close});
});
