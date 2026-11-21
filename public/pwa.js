/* v37: bilingual install guidance for Safari and Chromium browsers.
 * This remains an online-only PWA; no room identifiers or auth are stored here. */
(function(root,factory){
 'use strict';
 const api=factory(root);
 if(typeof module==='object'&&module.exports){module.exports=api;return;}
 api.init();
})(typeof window!=='undefined'?window:globalThis,function(root){
 'use strict';
 const COPY={
  ru:{
   button:'⬇ Приложение',title:'✦ Установить «Связанные светом»',
   introIos:'Откройте игру в Safari, затем добавьте её на экран «Домой» iPhone.',
   introDesktop:'В Chrome или Edge игру можно установить как отдельное веб-приложение.',
   ios:['Нажмите «Поделиться» в Safari.','Выберите «На экран Домой».','Нажмите «Добавить».'],
   desktop:['Найдите значок установки в адресной строке.','Либо откройте меню браузера и выберите установку приложения.'],
   hint:'Для совместной игры нужен интернет. Если вход открывается в Safari, вернитесь в приложение после авторизации.',
   close:'Понятно'},
  en:{
   button:'⬇ Install app',title:'✦ Install Linked by Light',
   introIos:'Open the game in Safari, then add it to your iPhone Home Screen.',
   introDesktop:'Chrome and Edge can install the game as a separate web app.',
   ios:['Tap Share in Safari.','Choose Add to Home Screen.','Tap Add.'],
   desktop:['Look for the install icon in the address bar.','Alternatively, select Install app from your browser menu.'],
   hint:'Co-op requires an internet connection. If sign-in opens Safari, return to the game after signing in.',
   close:'Got it'}
 };
 function guidance(ios,language){const c=COPY[language==='en'?'en':'ru'];return {
  button:c.button,title:c.title,intro:ios?c.introIos:c.introDesktop,
  steps:(ios?c.ios:c.desktop).slice(),hint:c.hint,close:c.close
 };}
 const standalone=()=>root.matchMedia?.('(display-mode: standalone)').matches||root.navigator?.standalone===true;
 const ios=()=>/iPad|iPhone|iPod/.test(root.navigator?.userAgent||'')||
  (root.navigator?.platform==='MacIntel'&&root.navigator?.maxTouchPoints>1);
 const lang=()=>root.GameI18n?.getLanguage?.()==='en'?'en':'ru';
 let deferredPrompt=null;
 function init(){
  const doc=root.document;if(!doc)return;
  function addUI(){
   const host=doc.querySelector('.topline > div:last-child')||doc.querySelector('.topline');
   if(!host||doc.getElementById('installGameBtn'))return;
   const btn=doc.createElement('button');btn.type='button';btn.className='install-game-btn';
   btn.id='installGameBtn';btn.hidden=standalone();host.append(btn);
   const dialog=doc.createElement('dialog');dialog.className='install-game-dialog';dialog.id='installGameDialog';
   dialog.setAttribute('aria-labelledby','installGameTitle');
   dialog.innerHTML='<div class="install-game-content"><h2 id="installGameTitle"></h2>'
    +'<p id="installGameText"></p><ol id="installGameSteps"></ol>'
    +'<p class="install-game-hint" id="installGameHint"></p>'
    +'<button type="button" class="install-game-close" id="installGameClose"></button></div>';
   doc.body.append(dialog);
   const title=doc.getElementById('installGameTitle'),text=doc.getElementById('installGameText'),
     steps=doc.getElementById('installGameSteps'),hint=doc.getElementById('installGameHint'),
     close=doc.getElementById('installGameClose');
   const render=()=>{
    const c=guidance(ios(),lang());btn.textContent=c.button;title.textContent=c.title;
    text.textContent=c.intro;hint.textContent=c.hint;close.textContent=c.close;
    steps.replaceChildren(...c.steps.map(value=>{const li=doc.createElement('li');li.textContent=value;return li;}));
   };
   btn.addEventListener('click',async()=>{
    if(deferredPrompt){
     const prompt=deferredPrompt;deferredPrompt=null;
     prompt.prompt();try{await prompt.userChoice;}catch(_){}
     btn.hidden=standalone();return;
    }
    render();if(!dialog.open)dialog.showModal();
   });
   close.addEventListener('click',()=>dialog.close());
   root.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();deferredPrompt=event;btn.hidden=standalone();
   });
   root.addEventListener('appinstalled',()=>{
    deferredPrompt=null;btn.hidden=true;if(dialog.open)dialog.close();
   });
   root.GameI18n?.subscribe?.(render);
   render();
  }
  function register(){
   if(!('serviceWorker' in root.navigator)||!root.isSecureContext)return;
   root.navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).then(reg=>{
    reg.update().catch(()=>{});
   }).catch(()=>{});
  }
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',addUI,{once:true});
  else addUI();
  root.addEventListener('load',register,{once:true});
 }
 return Object.freeze({guidance,init});
});
