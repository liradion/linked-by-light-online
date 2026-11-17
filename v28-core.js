'use strict';
// v28 multiplayer convenience. Physical character role is independent of device and room ownership.
const ROLES=[0,1],PING_KINDS=['here','wait','help','danger','go','look'];
const MAX_STAGE=136;
function roleChoice(v){return v===1?1:0;}
function owner(r,role){return role===roleChoice(r.hostRole);}
function validPing(msg,level){
 return PING_KINDS.includes(msg?.kind)&&Number.isInteger(msg.x)&&Number.isInteger(msg.y)
  &&msg.x>=0&&msg.x<=Math.min(20000,level?.width||0)&&msg.y>=0&&msg.y<=650;
}
function pingData(msg,role){
 return {t:'v28Ping',kind:msg.kind,x:msg.x,y:msg.y,role,at:Date.now()};
}
// Role-specific clues are NEVER placed in the shared room snapshot.
// The server filters these before delivering to each authenticated player's socket.
const CLUES=Object.freeze({
 136:[
  {id:'weakness',x:1430,y:310,text:'Искра: уязвимость открывается после сигнала Эха',visibleTo:'spark'},
  {id:'guard',x:1530,y:375,text:'Эхо: останови защитный контур перед ударом Искры',visibleTo:'echo'}
 ],
 123:[
  {id:'source',x:590,y:335,text:'Искра: выпусти луч, когда зеркало правильно направлено',visibleTo:'spark'},
  {id:'mirror',x:790,y:380,text:'Эхо: изменяй направление призмы',visibleTo:'echo'}
 ]
});
function cluesFor(stage,role){
 if(!ROLES.includes(role)||!Number.isInteger(stage)||stage<0||stage>MAX_STAGE)return [];
 const label=role===0?'spark':'echo';
 return (CLUES[stage]||[]).filter(c=>c.visibleTo==='both'||c.visibleTo===label)
  .map(({id,x,y,text})=>({id,x,y,text}));
}
function tutorial(stage,role,elapsed=0,waiting=false){
 if(!Number.isInteger(stage)||stage<0||stage>9||!ROLES.includes(role))return null;
 const roleName=role===0?'Искра':'Эхо';
 const tips=[
  'Начните с движения и прыжка. Двигайтесь вместе к световому порталу.',
  'Координируйте прыжки: одному герою нужна поддержка второго.',
  'Искра использует рывок, Эхо — импульс. Попробуйте способности у препятствий.',
  'Один игрок удерживает кнопку, второй проходит вперёд.',
  'Исследуйте платформы и не разрывайте связь между героями.',
  'Посмотрите на световые площадки и обсудите, кто идёт первым.',
  'Используйте клавишу G для энергетической связи.',
  'Если партнёр отстал, нажмите T и поставьте сигнал на карте.',
  'Сначала взаимодействуйте с механизмом, затем бегите к порталу.',
  'Примените всё, чему научились: движение, способности и помощь друг другу.'
 ];
 const prefix=waiting?'Нет движения? ':elapsed>40?'Подсказка: ':'';
 return {stage,title:'Обучение '+(stage+1)+'/10 · '+roleName,text:prefix+tips[stage]};
}
module.exports={roleChoice,owner,validPing,pingData,cluesFor,tutorial,PING_KINDS};
