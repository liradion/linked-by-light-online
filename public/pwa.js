/* PWA install controls. Game remains online-only; never caches OAuth or room state. */
(function(){
'use strict';
const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||
  (navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
let prompt=null;
function addUI(){
 const host=document.querySelector('.topline > div:last-child')||document.querySelector('.topline');
 if(!host)return;
 const btn=document.createElement('button');btn.type='button';btn.className='install-game-btn';
 btn.id='installGameBtn';btn.textContent='⬇ Приложение';btn.hidden=standalone();host.append(btn);
 const dialog=document.createElement('dialog');dialog.className='install-game-dialog';dialog.id='installGameDialog';
 dialog.innerHTML='<div class="install-game-content"><h2>✦ Установить «Связанные светом»</h2>'
  +'<p id="installGameText">Игра откроется отдельно, как обычное приложение.</p>'
  +'<ol id="installGameSteps"></ol>'
  +'<p class="install-game-hint">Для игры вдвоём нужен интернет. Google-вход на iPhone может открывать Safari — это зависит от iOS.</p>'
  +'<button type="button" class="install-game-close" id="installGameClose">Понятно</button></div>';
 document.body.append(dialog);
 const text=document.getElementById('installGameText'),steps=document.getElementById('installGameSteps');
 const instructions=()=>{
  if(ios){text.textContent='Откройте этот адрес в Safari, затем добавьте игру на главный экран iPhone.';
   steps.innerHTML='<li>Нажмите «Поделиться» в Safari.</li><li>Выберите «На экран Домой».</li><li>Включите «Открывать как веб-приложение» и нажмите «Добавить».</li>';}
  else{text.textContent='В Google Chrome или Microsoft Edge можно установить игру как отдельное приложение.';
   steps.innerHTML='<li>Нажмите значок установки в адресной строке.</li><li>Либо откройте меню браузера и выберите «Установить приложение».</li>';}
 };
 btn.addEventListener('click',async()=>{
  if(prompt){const saved=prompt;prompt=null;saved.prompt();try{await saved.userChoice;}catch(_){}
   btn.hidden=standalone();return;}
  instructions();if(!dialog.open)dialog.showModal();
 });
 document.getElementById('installGameClose').addEventListener('click',()=>dialog.close());
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();prompt=event;btn.hidden=standalone();});
 window.addEventListener('appinstalled',()=>{prompt=null;btn.hidden=true;if(dialog.open)dialog.close();});
}
function register(){
 if(!('serviceWorker' in navigator)||!window.isSecureContext)return;
 navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).then(reg=>{
  // A new service worker never needs to cache game HTML or private data.
  reg.update().catch(()=>{});
 }).catch(()=>{});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addUI,{once:true});else addUI();
window.addEventListener('load',register,{once:true});
})();