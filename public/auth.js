/* Account sign-in is optional: the original anonymous 2-player game still works. */
(function(root){'use strict';
let auth={enabled:false,authenticated:false,user:null},busy=false,notice=()=>{},timer,lastNotice=null;
const LAST_ACCOUNT_KEY='linked-light-last-google-account-v13';
function otherAccount(){try{const old=localStorage.getItem(LAST_ACCOUNT_KEY);return !!(old&&auth.user?.id&&old!==auth.user.id);}catch(_){return false;}}
function markAccount(){try{if(auth.user?.id)localStorage.setItem(LAST_ACCOUNT_KEY,auth.user.id);}catch(_){}}
const $=id=>document.getElementById(id);
 const tr=(key,vars)=>root.GameI18n?.aux?.(key,vars)||key;
 const setNotice=(key,vars)=>{lastNotice={key,vars};notice(tr(key,vars));};
 function renderLocale(){
  const d=$('googleAccountDialog');if(!d)return;
  const text=(id,key)=>{const n=$(id);if(n)n.textContent=tr(key);};
  const btn=$('googleAccountBtn');if(btn)btn.title=tr('auth.openTitle');
  const heading=d.querySelector('.quality-head strong');
  if(heading)heading.textContent=tr('auth.title');
  const close=$('googleAccountClose');if(close)close.setAttribute('aria-label',tr('auth.close'));
  text('googleAccountAbout','auth.about');text('googleAccountWarning','auth.warning');
  text('googleSignIn','auth.signIn');text('googleAccountSync','auth.sync');text('googleSignOut','auth.signOut');
  if(lastNotice)notice(tr(lastNotice.key,lastNotice.vars));
  update();
 }
async function call(path,body){const init={cache:'no-store',credentials:'same-origin'};
 if(body!==undefined){init.method='POST';init.headers={'Content-Type':'application/json'};init.body=JSON.stringify(body);}
 const response=await fetch('/api/auth/'+path,init);const result=await response.json();
 if(!response.ok)throw Object.assign(Error(result.error||'Ошибка авторизации'),{status:response.status});return result;
}
function update(){const sign=$('googleSignIn'),logout=$('googleSignOut'),sync=$('googleAccountSync'),state=$('googleAccountState'),menu=$('googleAccountBtn');
 if(!state)return;
 if(!auth.enabled){state.textContent=tr('auth.disabled');}
 else if(!auth.authenticated){state.textContent=tr('auth.guest');}
 else{state.textContent=tr('auth.signedIn',{name:auth.user?.name||auth.user?.email||tr('auth.player')});}
 if(menu)menu.textContent=auth.authenticated?'👤 '+(auth.user?.name||tr('auth.account')).slice(0,17):tr('auth.open');
 if(sign)sign.hidden=!auth.enabled||auth.authenticated;
 if(logout)logout.hidden=!auth.authenticated;
 if(sync)sync.hidden=!auth.authenticated;
}
async function check(){try{auth=await call('me');}catch(_){auth={enabled:false,authenticated:false,user:null};}update();return auth;}
async function syncAccount(){if(busy||!auth.authenticated||!root.GameAdventure||!root.GameCloud)return false;
 if(otherAccount()){setNotice('auth.otherAccount');return false;}
 busy=true;setNotice('auth.syncing');
 try{
  let remote=await call('profile');let local=root.GameAdventure.profilePayload();
  for(let attempt=0;attempt<3;attempt++){
   const merged=remote.payload?root.GameCloud.merge(local,remote.payload):local;
   if(remote.payload)root.GameAdventure.importProfile(merged);
   if(remote.payload&&JSON.stringify(remote.payload)===JSON.stringify(merged)){
    markAccount();setNotice('auth.upToDate');return true;
   }
   try{await call('profile',{revision:remote.revision,payload:merged});markAccount();setNotice('auth.synced');return true;}
   catch(e){if(e.status!==409)throw e;remote=await call('profile');local=root.GameAdventure.profilePayload();}
  }
  throw Error(tr('auth.conflict'));
 }catch(e){setNotice('auth.syncError',{message:e.message});return false;}finally{busy=false;}
}
function login(){const current=location.pathname==='/'&&/^\?room=[A-HJ-NP-Z2-9]{6}$/.test(location.search)?location.pathname+location.search:'/';
 location.assign('/api/auth/google?next='+encodeURIComponent(current));}
async function logout(){try{await call('logout',{});auth={...auth,authenticated:false,user:null};setNotice('auth.loggedOut');update();}catch(e){notice(e.message);}}
function init(){const host=document.querySelector('.adv-nav')||document.querySelector('.topline');if(!host)return;
 const button=document.createElement('button');button.type='button';button.className='mini-btn';button.id='googleAccountBtn';button.textContent=tr('auth.open');button.title=tr('auth.openTitle');host.append(button);
 const dialog=document.createElement('dialog');dialog.className='quality-dialog';dialog.id='googleAccountDialog';dialog.innerHTML=`
 <div class="quality-head"><strong>Аккаунт Google</strong><button type="button" id="googleAccountClose" aria-label="Закрыть окно">✕</button></div>
 <p class="quality-note" id="googleAccountState">Проверяем авторизацию…</p>
 <p class="quality-note" id="googleAccountAbout">Google-аккаунт позволяет переносить достижения, костюмы и домик между устройствами. Гостевая игра и коды комнат останутся доступными.</p>
 <p class="quality-note" id="googleAccountWarning">При первом входе локальный прогресс объединится с облачным. На общем устройстве не входите в чужой аккаунт.</p>
 <div class="quality-actions auth-actions"><button type="button" id="googleSignIn">Войти через Google</button><button type="button" id="googleAccountSync" hidden>Сохранить и загрузить</button><button type="button" id="googleSignOut" hidden>Выйти</button></div>
 <p class="quality-note" id="googleAccountMessage" role="status" aria-live="polite"></p>`;
 document.body.append(dialog);
 notice=message=>{if($('googleAccountMessage'))$('googleAccountMessage').textContent=message;};
  root.GameI18n?.subscribe?.(renderLocale);renderLocale();
 button.onclick=()=>{if(!dialog.open)dialog.showModal();};
 $('googleAccountClose').onclick=()=>dialog.close();
 $('googleSignIn').onclick=login;
 $('googleAccountSync').onclick=()=>syncAccount();
 $('googleSignOut').onclick=()=>logout();
 check().then(a=>{if(a.authenticated){syncAccount();timer=setInterval(()=>{if(document.visibilityState==='visible')syncAccount();},60000);} });
 const query=new URLSearchParams(location.search);
 if(query.has('login')||query.has('login_error')){
  const error=query.get('login_error');setNotice(error?'auth.loginFailed':'auth.loginSuccess');
  dialog.showModal();query.delete('login');query.delete('login_error');history.replaceState({},'',location.pathname+(query.size?'?'+query.toString():''));
 }
}
root.GameAuth={init,check,syncAccount,login,logout};
init();
})(typeof window!=='undefined'?window:globalThis);