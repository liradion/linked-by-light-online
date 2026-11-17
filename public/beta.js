/* Linked by Light v22 — Public Beta: first-run guide and voluntary feedback.
   Does not transmit IP addresses, emails, room codes, player tokens or profile keys. */
(function(root){'use strict';
let dialog,feedbackDialog,notice,step=0,config=null,api={},status,noticeKind='init',noticeRole=-1;
const KEY='linked-light-v22-intro';
const $=id=>document.getElementById(id);
const add=(tag,cls,content)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(content!==undefined)e.textContent=root.GameI18n?.translateExact?.(content)??content;return e;};
const btn=(label,fn)=>{const b=add('button','beta-btn',label);b.type='button';b.addEventListener('click',fn);return b;};
const saved=()=>{try{return localStorage.getItem(KEY)==='done';}catch(_){return false;}};
const finish=()=>{try{localStorage.setItem(KEY,'done');}catch(_){}dialog?.close();document.getElementById('betaQuickStart')?.remove();};
const isMobile=()=>matchMedia('(pointer:coarse)').matches;
function start(){
 step=0;
 if(!dialog)build();
 if(!dialog.open)dialog.showModal();
 render();
}
const chapters=[
 {title:'Добро пожаловать в Linked by Light',description:'Это кооперативная игра для двоих. Один создаёт комнату, второй подключается по приглашению. Регистрация не обязательна для игры.'},
 {title:'Сначала создайте комнату',description:'Выберите «Создать комнату» или «Новая глава v21». В комнате появится шестизначный код. Не публикуйте свой код или ссылку в открытом доступе.'},
 {title:'Пригласите второго игрока',description:'Нажмите «Скопировать приглашение» и отправьте ссылку другу. Он открывает её в Safari или браузере на компьютере. Не пересылайте ссылку незнакомым людям.'},
 {title:'Начните вдвоём',description:'Когда появятся оба игрока, ведущий нажимает «Начать вдвоём». Первый герой — Искра, второй — Эхо. Уровни нужно проходить совместно.'},
 {title:'Управление и сохранение',description:'Если связь прервётся, игра попробует вернуть вас в комнату. Сохраняйте профиль и ключ восстановления отдельно. После перезапуска бесплатного сервера комната может быть недоступна.'}
];
function render(){
 if(!dialog)return;
 const root=$('beta-intro-content');root.replaceChildren();
 const i18n=window.GameI18n,english=i18n?.isEnglish?.();
 const topic=english?{title:i18n.t('chapter'+step),description:i18n.t('chapter'+step+'Text')}:chapters[step];
 root.append(add('p','beta-progress',english?i18n.t('onboardingStep',{step:step+1,total:chapters.length}):'Шаг '+(step+1)+' / '+chapters.length));
 root.append(add('h2','beta-heading',topic.title));
 root.append(add('p','beta-text',topic.description));
 if(step===4){
  const controls=english?i18n.t(isMobile()?'chapter4Mobile':'chapter4Desktop'):isMobile()
   ?'На телефоне: экранные стрелки, кнопка прыжка и действия персонажа. Поверните телефон горизонтально для удобства.'
   :'На компьютере: Искра — A/D, W, F; Эхо — стрелки, ↑ и Enter. V открывает меню новой главы.';
  root.append(add('p','beta-tip',controls));
  root.append(add('p','beta-tip',english?i18n.t(config?.durableRooms?'serverDurable':'serverTemporary'):config?.durableRooms?
   'Серверное хранилище настроено. Не забудьте создать резервную копию прогресса.'
   :'Серверные комнаты хранятся временно. Используйте «☁ Облако» при доступности или экспортируйте профиль.'));
 }
 const actions=add('div','beta-actions');
 if(step>0)actions.append(btn('Назад',()=>{step--;render();}));
 actions.append(btn(step===chapters.length-1?'Начать играть':'Далее',()=>{
  if(step===chapters.length-1)finish();else{step++;render();}
 }));
 root.append(actions);
}
function build(){
 dialog=add('dialog','beta-dialog');dialog.id='betaIntro';
 const content=add('section','beta-intro-content');content.id='beta-intro-content';dialog.append(content);
 const close=btn('✕ Пропустить',finish);close.classList.add('beta-close');dialog.append(close);
 document.body.append(dialog);
 dialog.addEventListener('cancel',finish);
}
function feedback(){
 if(!feedbackDialog)buildFeedback();
 const message=$('beta-feedback-state');message.textContent='';
 if(!feedbackDialog.open)feedbackDialog.showModal();
}
function buildFeedback(){
 feedbackDialog=add('dialog','beta-dialog beta-feedback');feedbackDialog.id='betaFeedback';
 const title=add('h2','beta-heading','Помогите улучшить игру');feedbackDialog.append(title);
 const desc=add('p','beta-text','Отправляйте только информацию об игре. Не указывайте имена, телефон, email, пароли, коды комнат и ключи сохранения.');
 feedbackDialog.append(desc);
 const form=add('form','beta-form');form.noValidate=true;
 const category=add('select','beta-input');category.id='beta-feedback-kind';
 for(const [value,name] of [['bug','Сообщить об ошибке'],['idea','Предложить идею'],['experience','Оценить впечатления']]){
  const opt=add('option','',name);opt.value=value;category.append(opt);
 }
 const categoryLabel=add('label','','Тип обращения');categoryLabel.append(category);form.append(categoryLabel);
 const rating=add('select','beta-input');rating.id='beta-feedback-rating';
 for(const [v,text] of [['','Без оценки'],['1','1 / 5'],['2','2 / 5'],['3','3 / 5'],['4','4 / 5'],['5','5 / 5']]){
  const opt=add('option','',text);opt.value=v;rating.append(opt);
 }
 const ratingLabel=add('label','','Общая оценка');ratingLabel.append(rating);form.append(ratingLabel);
 const notes=add('textarea','beta-input beta-notes');notes.id='beta-feedback-text';
 notes.maxLength=800;notes.minLength=10;notes.placeholder='Что произошло? Что ожидали? Как повторить? (10–800 символов)';
 const notesLabel=add('label','','Сообщение');notesLabel.append(notes);form.append(notesLabel);
 const check=add('input','');check.type='checkbox';check.id='beta-feedback-consent';
 const consent=add('label','beta-consent');consent.append(check,document.createTextNode(' Я согласен отправить сообщение и технический номер уровня для обработки отзыва.'));
 form.append(consent);
 const state=add('p','beta-state');state.id='beta-feedback-state';state.setAttribute('role','status');
 form.append(state);
 const actions=add('div','beta-actions');
 const cancel=btn('Отмена',()=>feedbackDialog.close());
 const submit=btn('Отправить отзыв',async()=>{
  const msg=notes.value.trim();
  if(msg.length<10){state.textContent='Введите минимум 10 символов.';return;}
  if(!check.checked){state.textContent='Сначала подтвердите согласие на отправку.';return;}
  submit.disabled=true;state.textContent='Отправка…';
  try{
   const ua=navigator.userAgent;
   const platform=/iPhone|iPad/i.test(ua)?'iphone':/Android/i.test(ua)?'android':/Windows/i.test(ua)?'windows':/Macintosh/i.test(ua)?'mac':'other';
   const stage=api.stage?.();
   const response=await fetch('/api/beta/feedback',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({kind:category.value,message:msg,consent:true,rating:rating.value?Number(rating.value):null,
     stage:Number.isInteger(stage)?stage:null,platform}),signal:AbortSignal.timeout(12000)
   });
   const data=await response.json();
   if(!response.ok)throw Error(data.error||'Сервис недоступен');
   state.textContent='Спасибо! Сообщение принято. Номер обращения: '+data.reference;
   notes.value='';check.checked=false;
  }catch(e){state.textContent='Не удалось отправить: '+e.message;}
  finally{submit.disabled=false;}
 });
 actions.append(cancel,submit);form.append(actions);feedbackDialog.append(form);document.body.append(feedbackDialog);
}
function updateNotice(){
 if(!notice)return;
 const en=root.GameI18n?.isEnglish?.();
 if(noticeKind==='joined'){
  notice.textContent=en?noticeRole===0?'You are Spark. Share the invite, then select “Start together”.'
   :noticeRole===1?'You are Echo. Waiting for the host to start.'
   :'You are watching. Hero controls are unavailable.':noticeRole===0
   ?'Вы — Искра. Отправьте приглашение второму игроку, затем нажмите «Начать вдвоём».'
   :noticeRole===1?'Вы — Эхо. Подождите, пока ведущий запустит совместное приключение.'
   :'Вы наблюдатель. Управление персонажами недоступно.';
 }else if(noticeKind==='disconnected')notice.textContent=en?
  'Connection lost. Reconnecting automatically; keep this page open.':
  'Соединение прервано. Выполняется автоматическое переподключение; не закрывайте страницу.';
 else if(noticeKind==='recovered')notice.textContent=en?
  'Connection restored. Continue the adventure together.':
  'Соединение восстановлено. Продолжайте приключение вместе.';
 else if(noticeKind==='temporary')notice.textContent=en?
  'Beta: rooms may reset when the server restarts.':
  'Бета: серверные комнаты могут сбрасываться после перезапуска.';
}
function onJoined(role){noticeRole=role;noticeKind='joined';updateNotice();}
function onDisconnected(){noticeKind='disconnected';updateNotice();}
function onRecovered(){noticeKind='recovered';updateNotice();}
function init(callbacks){
 api=callbacks||{};
 const target=document.querySelector('.topline > div:last-of-type')||document.querySelector('.topline')||document.body;
 const guide=btn('ⓘ Как играть',start);guide.id='betaHelpBtn';target.append(guide);
 const report=btn('✎ Отзыв',feedback);report.id='betaReportBtn';target.append(report);
 notice=add('p','beta-connection-note');notice.id='betaConnectionNote';
 notice.setAttribute('role','status');
 const overlay=$('menuView')||document.querySelector('.overlay-card');
 overlay?.append(notice);
 const info=add('div','beta-links');
 for(const [title,href] of [['Конфиденциальность','/privacy.html'],['Правила игры','/terms.html']]){
  const a=add('a','',title);a.href=href;a.target='_blank';a.rel='noopener noreferrer';info.append(a);
 }
 overlay?.append(info);
 fetch('/api/beta/status',{cache:'no-store'}).then(r=>r.ok?r.json():null)
  .then(x=>{config=x;if(x&&!x.durableRooms&&notice&&noticeKind==='init'){noticeKind='temporary';updateNotice();}})
  .catch(()=>{});
 // The first-run guide is optional and never blocks joining or starting a room.
 if(!saved()&&!new URLSearchParams(location.search).has('room')){
  const card=add('section','beta-quickstart');
  card.id='betaQuickStart';
  card.setAttribute('aria-label','Краткая инструкция');
  const heading=add('strong','beta-quickstart-title','Два игрока — одно приключение');
  const caption=add('span','beta-quickstart-copy','Создайте комнату и пригласите второго игрока по ссылке.');
  const readGuide=btn('Как играть',start);
  readGuide.classList.add('beta-quickstart-open');
  const dismiss=btn('Понятно',finish);
  dismiss.classList.add('beta-quickstart-dismiss');
  card.append(heading,caption,readGuide,dismiss);
  const menu=$('menuView');
  menu?.insertBefore(card,menu.querySelector('.menu-actions'));
 }
}
function refreshLanguage(){
 const english=root.GameI18n?.isEnglish?.();
 const card=$('betaQuickStart');
 if(card){
  const title=card.querySelector('.beta-quickstart-title'),copy=card.querySelector('.beta-quickstart-copy');
  if(title)title.textContent=english?'Two players — one adventure':'Два игрока — одно приключение';
  if(copy)copy.textContent=english?'Create a room and invite your partner with a link.':'Создайте комнату и пригласите второго игрока по ссылке.';
  const open=card.querySelector('.beta-quickstart-open'),dismiss=card.querySelector('.beta-quickstart-dismiss');
  if(open)open.textContent=english?'How to play':'Как играть';
  if(dismiss)dismiss.textContent=english?'Got it':'Понятно';
 }
 const guide=$('betaHelpBtn'),report=$('betaReportBtn');
 if(guide)guide.textContent=english?'ⓘ How to play':'ⓘ Как играть';
 if(report)report.textContent=english?'✎ Feedback':'✎ Отзыв';
 updateNotice();
 if(dialog?.open)render();
}
root.GamePublicBeta={init,onJoined,onDisconnected,onRecovered,start,feedback,refreshLanguage};
})(typeof window!=='undefined'?window:globalThis);
