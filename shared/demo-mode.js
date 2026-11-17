/* Linked by Light — server-authoritative first-act vertical slice.
   Stage order is explicit and shared by Node and browsers; no new save schema. */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.GameDemo=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const stages=Object.freeze([0,1,2,3,4,5,6,7,8]);
  const last=stages[stages.length-1];
  const chapters=Object.freeze([
    Object.freeze({title:'Первый контакт',subtitle:'Вместе открываем путь'}),
    Object.freeze({title:'Мост доверия',subtitle:'Один помогает другому'}),
    Object.freeze({title:'Один ритм',subtitle:'Действовать одновременно'}),
    Object.freeze({title:'Сила двоих',subtitle:'Каждая способность важна'}),
    Object.freeze({title:'Общий сигнал',subtitle:'Слышать и отвечать'}),
    Object.freeze({title:'Держи мост',subtitle:'Вместе преодолеваем расстояние'}),
    Object.freeze({title:'Двойное сияние',subtitle:'Передавая свет'}),
    Object.freeze({title:'Верное решение',subtitle:'Помогать до конца'}),
    Object.freeze({title:'Финальная связка',subtitle:'Первый общий путь'})
  ]);
  const includes=index=>Number.isInteger(index)&&stages.includes(index);
  const next=index=>{
    const n=stages.indexOf(index);
    return n<0||n===stages.length-1?null:stages[n+1];
  };
  const progress=index=>{
    const n=stages.indexOf(index);
    return n<0?0:n+1;
  };
  return Object.freeze({
    stages,last,chapters,includes,next,progress,
    intro:'Девять совместных испытаний. Два героя, две способности и один путь.',
    ending:Object.freeze({
      kind:'demo',
      title:'Наш первый общий путь',
      text:'Вы прошли демоверсию вместе. Спасибо за игру! Основное приключение продолжается в полной кампании.'
    })
  });
});
