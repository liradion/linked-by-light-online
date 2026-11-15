// Shared stage registry for Linked by Light v20. Pure data, also loaded by the browser.
(function(root){
'use strict';
const GROUND=544;
const chapterNames=['Осколки зеркала','Часы без стрелок','Дом на рассвете'];
const titles=[
 'Первый узел','Мост двух отражений','Память кристалла','Смотритель граней',
 'Секунда навстречу','Невозможный механизм','Остановка мгновения','Хранитель секунд',
 'Тёплый свет','Шаг через тень','Последняя нить','Разорванное сердце'
];
const kinds=['tether','phase','time','tether','time','phase','combo','time','tether','phase','combo','combo'];
const hints={
 tether:'Нажмите «Нить», пока стоите рядом, затем каждый встаньте на свою сияющую печать.',
 phase:'Искра у первой печати переключает измерение, затем Эхо активирует вторую печать.',
 time:'Искра замораживает часы, Эхо касается эха времени за следующие три секунды.',
 combo:'Свяжитесь нитью, активируйте обе печати измерений и завершите временной узел.'
};
const stages=titles.map((title,i)=>{
 const boss=i%4===3,shift=(i%3)*20,chapter=Math.floor(i/4);
 const first=800+shift,second=1440+(i%4)*17,width=2300+chapter*70+(i%4)*25;
 const config={kind:kinds[i],tether:[940+shift,1205+shift],phase:[740+shift,1290+(i%4)*15],time:[740+shift,1330+(i%4)*15],boss:boss?['Смотритель граней','Хранитель секунд','Разорванное сердце'][(i-3)/4]:null};
 return {
  v20Id:'v20-'+String(i+1).padStart(2,'0'),v20:config,
  title,chapter:chapterNames[chapter],levelSubtitle:'Переплетение миров · '+(i+1)+'/12',
  objective:hints[config.kind]+(boss?' После этого победите хранителя вдвоём.':''),
  hint:hints[config.kind],width,spawn:[92,160],
  floor:boss?[[0,width]]:[[0,first],[first+112,second],[second+116,width]],
  platforms:[{x:first-150,y:452-(i%2)*22,w:145,h:18},{x:second+28,y:455-(i%3)*14,w:148,h:18},{x:1680+shift,y:472-(i%3)*19,w:155,h:18}],
  pads:[],walls:[],crystals:[],bridges:[],hazards:[],
  gates:[{x:width-245,y:350,w:31,h:194}],portal:width-100,shards:[260+shift,620+shift,1135+(i%3)*35,1690+shift,width-370],
  puzzle:{walls:false,crystals:false,pads:false},bridgeTrigger:'always'
 };
});
const result={stages,titles,chapterNames,kinds};
if(typeof module!=='undefined'&&module.exports)module.exports=result;
if(root)root.GameV20Stages=result;
})(typeof window!=='undefined'?window:null);
