/* Linked by Light v20: cooperative campaign, home and story UX. */
(function(root){'use strict';
let api={},state=null,version='',dialog=null,body=null,quick=null,launch=null,seq=0,nonce='',lastRendered=0,lastLevel=-1;
const $=id=>document.getElementById(id);
const title=['Осколки зеркала','Часы без стрелок','Дом на рассвете'];
const kinds={tether:'Нить света',phase:'Измерения',time:'Управление временем',combo:'Все три механики'};
function el(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e;}
function button(label,callback,disabled=false){const b=el('button','v20-button',label);b.type='button';b.disabled=!!disabled;b.onclick=callback;return b;}
function action(type,kind,extra={}){
 if(!api.inRoom?.()||api.role?.()<0)return api.announce?.('Сначала подключитесь к комнате');
 const actionId=nonce+'-'+(++seq);api.send?.({t:type,actionId,kind,...extra});
}
function act(kind){action('coopAction',kind);}
function home(kind){action('homeAction',kind);}
function vote(sceneId,option){action('sceneVote','vote',{sceneId,option});}
function line(group,label,value){const row=el('div','v20-line');row.append(el('span','',label),el('strong','',String(value)));group.append(row);}
function heading(group,text){group.append(el('h3','v20-heading',text));}
function text(group,value){group.append(el('p','v20-text',value));}
function render(){
 if(!body||!dialog?.open)return;lastRendered=performance.now();body.replaceChildren();
 const inRoom=!!api.inRoom?.(),role=api.role?.()??-1,stage=state?.stage??api.stage?.()??0;
 const v=state?.world?.v20,h=state?.v20Home||{},story=state?.v20Story||{},b=body;
 heading(b,'Linked by Light · v20.0');
 text(b,'Переплетение миров · общая кампания и совместные активности');
 const network=el('section','v20-section');heading(network,'Подключение');
 const n=GameQuality.stats();line(network,'Сервер',version||'проверка');line(network,'RTT / jitter',(n.rtt||0)+' / '+(n.jitter||0)+' мс');line(network,'FPS / буфер',(n.fps||0)+' / '+(n.buffer||0)+' мс');
 line(network,'Повторные подключения',api.reconnects?.()??0);
 b.append(network);
 if(!inRoom){heading(b,'Новая история');text(b,'Создайте комнату главы v20 и пригласите второго игрока обычной ссылкой.');b.append(button('Начать новую историю',()=>{dialog.close();api.create?.();}));const saved=GameAdventure.data()?.v20?.unlockedStages||[];if(saved.length>1)b.append(button('Продолжить с открытого уровня',()=>{dialog.close();api.resume?.(99+Math.min(12,saved.length));}));return;}
 if(role<0){text(b,'Режим наблюдателя. События доступны только для просмотра.');return;}
 const campaign=el('section','v20-section');heading(campaign,'Кампания · 12 уровней');
 if(v){text(campaign,(v.stageId||'')+' · '+(kinds[v.kind]||'')+(v.complete?' · головоломка решена':' · головоломка активна'));
  line(campaign,'Нить',v.flags?.tether?'готово':v.tether?.active?'активна':'неактивна');
  line(campaign,'Миры',v.flags?.phase?'объединены':v.phase?.state||'свет');
  line(campaign,'Время',v.flags?.time?'исполнено':(v.time?.locked||0)+' с');
  if(v.boss)line(campaign,'Босс',v.boss.name+' · HP '+v.boss.hp+'/'+v.boss.max);
  const controls=el('div','v20-actions');
  controls.append(button('⛓ Соединить нить',()=>act('tether_attach')),
    button('⛓ Отпустить',()=>act('tether_detach')),
    button('◈ Переключить мир',()=>act('phase_shift'),!['phase','combo'].includes(v.kind)),
    button(role===0?'◷ Заморозить часы':'◷ Восстановить эхо',()=>act(role===0?'time_lock':'time_echo'),!['time','combo'].includes(v.kind)));
  campaign.append(controls);
  text(campaign,'Клавиши: Q — нить, E — измерение, Z — время. На iPhone доступны кнопки сверху игрового поля.');
 }else text(campaign,'Кампания v20 доступна из главного меню или по кнопке ниже.');
 const canLead=api.isHost?.()??role===0;
 const start=button(canLead?'✦ Перейти в главу v20':'Историю запускает ведущий',()=>api.send?.({t:'selectStage',stage:100}),!canLead);campaign.append(start);
 if(canLead){const levels=el('div','v20-levels');const unlocked=state?.v20Unlocked||100;
 for(let id=100;id<=111;id++){levels.append(button(String(id-99),()=>api.send?.({t:'selectStage',stage:id}),id>unlocked));}
 campaign.append(levels);text(campaign,'Номера 1–12: доступные эпизоды. Только ведущий выбирает уровень.');}
 b.append(campaign);
 const scene=GameV20Stages&&stage>=100&&stage<=111?{
  id:'scene-'+(stage-99),title:GameV20Stages.stages[stage-100].title,lines:storyLines[stage-100],
  choices:[101,103,105,107,109,111].includes(stage)?['Помочь друг другу','Открыть новый путь']:null
 }:null;
 if(scene){const sec=el('section','v20-section v20-story');heading(sec,'История · '+scene.title);
  const portrait=el('div','v20-story-art');portrait.append(el('span','v20-hero-one','✦'),el('span','v20-story-horizon','✧  ⋆  ✧'),el('span','v20-hero-two','◈'));sec.append(portrait);
  for(const l of scene.lines)text(sec,l);
  const prev=story.choices?.['scene-'+(stage-100)];
  if(prev!==undefined)text(sec,prev===0?'Память о вашем решении: поддержать друг друга.':'Память о вашем решении: открыть неизвестный путь.');
  if(scene.choices){const value=story.choices?.[scene.id],votes=story.votes?.[scene.id];
   if(value!==undefined)text(sec,'Ваше общее решение: '+scene.choices[value]);
   else {text(sec,votes?'Голоса: '+votes.map(x=>x===null?'ожидаем':scene.choices[x]).join(' / '):'Оба игрока должны выбрать один вариант.');
    for(let i=0;i<2;i++)sec.append(button(scene.choices[i],()=>vote(scene.id,i)));}
  }b.append(sec);
 }
 const hs=el('section','v20-section');heading(hs,'Наш дом · живые комнаты');
 const homeScene=el('div','v20-house');
 const area={living:'🪟　🛋️　🔥',garden:'🌷　🌳　🌼',workshop:'🪄　🖼️　🎨'}[h.zone]||'🪟　🛋️　🔥';
 homeScene.append(el('div','v20-house-backdrop',area));
 const petIcon=({fox:'🦊',owl:'🦉',moth:'🦋',cat:'🐈',orb:'✨'})[GameAdventure.data()?.pet]||'✨';
 homeScene.append(el('span','v20-pet',petIcon));
 const icons={lampion:'🏮',flower:'🌸',crystal:'💎'};
 homeScene.append(el('div','v20-decor',(h.decor||[]).map(k=>icons[k]||'✦').join(' ')));
 hs.append(homeScene);
 line(hs,'Зона',({living:'Гостиная',garden:'Сад',workshop:'Мастерская'})[h.zone]||'Гостиная');
 const zones=el('div','v20-actions');for(const [key,label] of [['living','Гостиная'],['garden','Сад'],['workshop','Мастерская']])zones.append(button(label,()=>home(key)));hs.append(zones);
 heading(hs,'Сад света');text(hs,'Искра направляет свет, Эхо отражает. Три последовательных раунда.');
 line(hs,'Прогресс',h.garden?.completed?'Завершено':(h.garden?.step||0)+'/6');
 const gardenSteps=el('div','v20-steps');for(let i=0;i<6;i++)gardenSteps.append(el('span',i<(h.garden?.step||0)?'v20-step done':'v20-step',i%2?'✧':'☀'));hs.append(gardenSteps);
 hs.append(button(role===0?'☀ Направить свет':'✧ Отразить луч',()=>home(role===0?'shine':'reflect'),!!h.garden?.completed));
 heading(hs,'Мастерская воспоминаний');text(hs,'Искра открывает фрагмент, Эхо помещает его на место. Четыре раунда.');
 line(hs,'Прогресс',h.memory?.completed?'Завершено':(h.memory?.step||0)+'/8');
 const memorySteps=el('div','v20-steps');for(let i=0;i<8;i++)memorySteps.append(el('span',i<(h.memory?.step||0)?'v20-step done':'v20-step','◈'));hs.append(memorySteps);
 hs.append(button(role===0?'Показать фрагмент':'Разместить фрагмент',()=>home(role===0?'reveal':'place'),!!h.memory?.completed));
 heading(hs,'Питомец и украшения');line(hs,'Настроение',h.pet?.mood||'curious');
 hs.append(button('♡ Погладить питомца',()=>home('pet')));
 const decor=el('div','v20-actions');for(const [key,label] of [['lampion','Фонарик'],['flower','Цветок'],['crystal','Кристалл']])decor.append(button('+ '+label,()=>home(key)));hs.append(decor);
 line(hs,'Украшения',(h.decor||[]).length+'/6');b.append(hs);
}
const storyLines=[
 ['Два огонька находят оборванную нить.','Искра: «Ты ещё слышишь меня?»','Эхо: «Да. Даже сквозь тишину».'],
 ['Первое зеркало показывает разные дороги.','Эхо: «Я вижу мост, которого у тебя нет».','Искра: «Тогда доверюсь твоим шагам».'],
 ['В кристалле сохранилось общее воспоминание.','Искра: «А если забыть дорогу?»','Эхо: «Я запомню её за нас двоих».'],
 ['Смотритель граней закрывает проход.','Смотритель: «Два отражения не могут быть одним».','Герои: «Мы помогаем друг другу».'],
 ['Часы перестают идти одновременно.','Эхо: «Мой миг уже прошёл».','Искра: «Тогда поделюсь своим».'],
 ['Механизм движется только от взаимного доверия.','Искра: «Сейчас я буду ждать».','Эхо: «А я завершу движение».'],
 ['Даже остановленное время оставляет след.','Эхо: «Слышишь шаги из прошлого?»','Искра: «Это мы. И мы идём дальше».'],
 ['Хранитель секунд возвращает забытый миг.','Хранитель: «Ни один миг не повторится».','Герои: «Но мы можем сделать новый».'],
 ['В саду появляется первый общий огонь.','Искра: «Здесь мог бы быть наш дом».','Эхо: «Значит, построим его вместе».'],
 ['Тень открывает последний проход.','Эхо: «Нужно ли бояться темноты?»','Искра: «Пока мы видим друг друга — нет».'],
 ['Две нити становятся одним узором.','Искра: «Можно отпустить?»','Эхо: «Мы всё равно останемся рядом».'],
 ['Сердце мира снова начинает светиться.','Сердце: «Что вы оставите после себя?»','Герои: «Дорогу для следующих».']
];
function onJoined(){state=null;lastLevel=-1;if(dialog?.open)render();refreshQuick();}
function onMessage(m){
 if(m.t==='v20Home'&&state)state.v20Home=m.home;
 if(m.t==='v20Story'&&state)state.v20Story=m.story;
 if(m.t==='actionResult')api.announce?.(m.ok?m.detail||'Действие принято':m.error||'Действие отклонено');
 if(dialog?.open)render();
}
function onSnapshot(s){
 state=s;if(api.role?.()>=0)GameAdventure.recordV20(s);
 if(lastLevel!==s.stage){lastLevel=s.stage;refreshQuick();}
 if(dialog?.open&&performance.now()-lastRendered>800)render();
}
function refreshQuick(){
 if(!quick)return;
 const active=!!api.inRoom?.()&&api.role?.()>=0&&api.stage?.()>=100&&api.stage?.()<=111;
 quick.style.display=active?'flex':'none';
}
function draw(ctx,level,players,v,clock,role){
 if(!v||!level?.v20)return;
 const c=level.v20;
 ctx.save();ctx.textAlign='center';ctx.font='bold 14px system-ui';
 const marker=(x,label,color,active)=>{ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=2;ctx.globalAlpha=active?1:.58;ctx.beginPath();ctx.arc(x,GROUND-21,21+Math.sin(clock*3)*2,0,Math.PI*2);ctx.stroke();ctx.fillText(label,x,GROUND-53);ctx.globalAlpha=1;};
 if(['tether','combo'].includes(v.kind)){marker(c.tether[0],'Искра · нить','#ffc17f',v.flags.tether);marker(c.tether[1],'Эхо · нить','#80eff7',v.flags.tether);}
 if(['phase','combo'].includes(v.kind)){marker(c.phase[0],'Свет · E','#ffc17f',v.phase.flags[0]);marker(c.phase[1],'Тень · E','#b3a1ff',v.phase.flags[1]);}
 if(['time','combo'].includes(v.kind)){marker(c.time[0],'Время · Z','#ffc17f',v.time.locked>0);marker(c.time[1],'Эхо · Z','#80eff7',v.time.complete);}
 if(['phase','combo'].includes(v.kind)){
  const rect=(x,color)=>{ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=12;ctx.fillRect(x,438,112,18);ctx.shadowBlur=0;};
  if(v.phase.flags[0]&&(role===0||role===-1))rect(900,'#ffca88bb');
  if(v.phase.state!=='light'&&(role===1||role===-1))rect(1340,'#a5e9ffbb');
 }
 if(v.tether.active&&players?.length===2){
  const a=players[0],b=players[1];ctx.lineWidth=3+v.tether.tension*2;ctx.strokeStyle='#fbd5ff';ctx.shadowColor='#ddbcff';ctx.shadowBlur=17;ctx.beginPath();ctx.moveTo(a.x+15,a.y+18);ctx.quadraticCurveTo((a.x+b.x)/2+15,(a.y+b.y)/2-36, b.x+15,b.y+18);ctx.stroke();ctx.shadowBlur=0;
 }
 if(v.boss?.hp>0){const z=v.boss;const y=GROUND-100+Math.sin(clock*2)*7;ctx.shadowColor='#d3a5ff';ctx.shadowBlur=30;ctx.fillStyle=z.warning>0?'#ff889f':z.style==='clock'?'#9efaff':z.style==='heart'?'#ffc0de':'#9e84ff';
   const radius=38+z.phase*6;ctx.beginPath();
   if(z.style==='mirror'){for(let i=0;i<8;i++){const a=i*Math.PI/4;const x=z.x+radius*Math.cos(a),py=y+radius*Math.sin(a);if(i===0)ctx.moveTo(x,py);else ctx.lineTo(x,py);}ctx.closePath();}
   else {ctx.arc(z.x,y,radius,0,Math.PI*2);}
   ctx.fill();
   if(z.style==='clock'){ctx.save();ctx.translate(z.x,y);ctx.strokeStyle='#18274c';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-radius*.7);ctx.moveTo(0,0);ctx.lineTo(radius*.5,0);ctx.stroke();ctx.restore();}
   if(z.style==='heart'){ctx.fillStyle='#fff2fc';ctx.font='bold 34px system-ui';ctx.fillText('♡',z.x,y+12);}
   ctx.shadowBlur=0;ctx.fillStyle='#ffffff';ctx.fillText(z.name+' · '+z.hp+'/'+z.max,z.x,y-75);
  if(z.warning>0){ctx.strokeStyle='#ff5577';ctx.lineWidth=4;const radius=z.style==='heart'?120:z.style==='clock'?90:72;ctx.strokeRect(z.focus-radius,GROUND-60,2*radius,62);}
 }
 ctx.restore();
}
function init(callbacks){
 api=callbacks||{};
 try{const bytes=new Uint32Array(2);crypto.getRandomValues(bytes);nonce='v20'+Array.from(bytes,n=>n.toString(36)).join('');}catch(_){nonce='v20'+String(Date.now());}
 const menu=$('createBtn')?.parentElement;if(menu){
  launch=button('✦ Новая история v20',()=>api.create?.());launch.classList.add('v20-launch');menu.append(launch);
  const saved=GameAdventure.data()?.v20?.unlockedStages||[];
  let max=100;for(let id=100;id<=111;id++){if(!saved.includes('v20-'+String(id-99).padStart(2,'0')))break;max=id;}
  if(max>100)menu.append(button('▶ Продолжить v20 · '+(max-99)+'/12',()=>api.resume?.(max)));
 }
 const frame=document.querySelector('.frame')||document.body;
 const toggle=button('✦ v20 · История / Дом',()=>{if(!dialog.open){dialog.showModal();render();}else dialog.close();});toggle.classList.add('v20-toggle');frame.append(toggle);
 dialog=el('dialog','v20-dialog');const top=el('div','v20-top');top.append(el('strong','','Переплетение миров'),button('Закрыть ✕',()=>dialog.close()));dialog.append(top);
 body=el('div','v20-body');dialog.append(body);document.body.append(dialog);
 quick=el('div','v20-quick');
 for(const [label,kind] of [['⛓ Нить','tether_attach'],['◈ Мир','phase_shift'],['◷ Время','clock']]){
  quick.append(button(label,()=>act(kind==='clock'?api.role?.()===0?'time_lock':'time_echo':kind)));
 }
 frame.append(quick);
 fetch('/version',{cache:'no-store'}).then(r=>r.json()).then(j=>{version=j.version+' / '+(j.commit||'local');if(dialog.open)render();}).catch(()=>{version='нет данных';});
 refreshQuick();
}
root.GameV20={init,onSnapshot,onMessage,onJoined,refreshQuick,draw,act};
})(typeof window!=='undefined'?window:globalThis);
