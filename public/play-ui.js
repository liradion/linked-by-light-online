/* Calm, gameplay-first UI v27. All original action handlers remain attached. */
(() => {
  'use strict';
  function mount(){
    if(document.getElementById('gameQuickMenu'))return;
    const shell=document.querySelector('.game-shell');
    const header=document.querySelector('.topline');
    if(!shell||!header)return;
    const right=header.querySelector(':scope > div:last-child')||header;
    const trigger=document.createElement('button');
    trigger.type='button';
    trigger.className='mini-btn game-menu-trigger';
    trigger.textContent='☰ Меню';
    trigger.setAttribute('aria-label','Открыть меню игры');
    trigger.setAttribute('aria-controls','gameQuickMenu');
    trigger.setAttribute('aria-expanded','false');
    right.append(trigger);
    const shade=document.createElement('button');
    shade.type='button';
    shade.className='game-menu-shade';
    shade.setAttribute('aria-label','Закрыть меню игры');
    shade.tabIndex=-1;
    const drawer=document.createElement('aside');
    drawer.id='gameQuickMenu';
    drawer.className='game-quick-menu';
    drawer.setAttribute('aria-label','Меню игры');
    drawer.setAttribute('aria-hidden','true');
    drawer.innerHTML='<div class="game-menu-head"><strong>Меню игры</strong><button class="game-menu-close" type="button" aria-label="Закрыть меню">✕</button></div>'+
      '<section class="game-menu-group"><span class="game-menu-group-title">Приключение</span><div class="game-menu-navigation"></div></section>'+
      '<section class="game-menu-group"><span class="game-menu-group-title">Миры и главы</span><div class="game-menu-worlds"></div></section>'+
      '<section class="game-menu-group"><span class="game-menu-group-title">Способности</span><div class="game-menu-skills"></div></section>'+
      '<section class="game-menu-group"><span class="game-menu-group-title">Настройки и помощь</span><div class="game-menu-tools"></div></section>';
    shell.append(shade,drawer);
    const move=(selector,to)=>{
      const item=document.querySelector(selector);
      if(item)drawer.querySelector(to).append(item);
    };
    move('.adv-nav','.game-menu-navigation');
    for(const name of ['.v20-toggle','.v21-toggle','.v2346-toggle'])move(name,'.game-menu-worlds');
    move('.v20-quick','.game-menu-skills');
    move('.v21-quick','.game-menu-skills');
    for(const name of ['#qualityOpen','#betaHelpBtn','#betaReportBtn','#installGameBtn','#resetBtn'])move(name,'.game-menu-tools');
    function setOpen(open){
      drawer.classList.toggle('is-open',open);
      shade.classList.toggle('is-open',open);
      drawer.setAttribute('aria-hidden',String(!open));
      trigger.setAttribute('aria-expanded',String(open));
      trigger.setAttribute('aria-label',open?'Закрыть меню игры':'Открыть меню игры');
      if(open)drawer.querySelector('.game-menu-close').focus({preventScroll:true});
      else if(drawer.contains(document.activeElement))trigger.focus({preventScroll:true});
    }
    trigger.addEventListener('click',()=>setOpen(!drawer.classList.contains('is-open')));
    shade.addEventListener('click',()=>setOpen(false));
    drawer.querySelector('.game-menu-close').addEventListener('click',()=>setOpen(false));
    drawer.addEventListener('click',event=>{
      if(event.target.closest('button')&&!event.target.closest('.game-menu-close'))setOpen(false);
    });
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&drawer.classList.contains('is-open'))setOpen(false);
    });

    // Clean-play mode hides decoration, not gameplay controls or network warnings.
    const gameFrame=document.getElementById('frame');
    if(gameFrame){
      const cleanToggle=document.createElement('button');
      cleanToggle.type='button';
      cleanToggle.id='cleanPlayToggle';
      cleanToggle.className='clean-play-toggle';
      const storageKey='linked-light-clean-ui';
      gameFrame.append(cleanToggle);
      const applyCleanMode=(enabled,remember=true)=>{
        document.documentElement.classList.toggle('clean-play-mode',enabled);
        cleanToggle.textContent=enabled?'☰':'◫ Чистое поле';
        cleanToggle.setAttribute('aria-pressed',String(enabled));
        cleanToggle.setAttribute('aria-label',enabled?'Показать интерфейс игры':'Скрыть интерфейс игры');
        cleanToggle.title=enabled?'Показать интерфейс':'Чистое игровое поле';
        if(enabled)setOpen(false);
        if(remember){try{localStorage.setItem(storageKey,enabled?'1':'0');}catch(_){}}
      };
      let enabled=false;
      try{enabled=localStorage.getItem(storageKey)==='1';}catch(_){}
      applyCleanMode(enabled,false);
      cleanToggle.addEventListener('click',()=>applyCleanMode(!document.documentElement.classList.contains('clean-play-mode')));
      document.addEventListener('keydown',event=>{
        if(event.repeat||event.altKey||event.ctrlKey||event.metaKey)return;
        if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)||document.activeElement?.isContentEditable)return;
        if(event.key.toLowerCase()==='h'||(event.key==='Escape'&&document.documentElement.classList.contains('clean-play-mode'))){
          event.preventDefault();
          applyCleanMode(!document.documentElement.classList.contains('clean-play-mode'));
        }
      });
    }
    const status=document.querySelector('.statusbar');
    if(status)status.setAttribute('aria-live','polite');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
})();
