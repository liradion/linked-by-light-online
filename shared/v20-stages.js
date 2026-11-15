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
 const boss=i%4===3;
 const config={kind:kinds[i],tether:[940,1205],phase:[780,1290],time:[870,1330],boss:boss?['Смотритель граней','Хранитель секунд','Разорванное сердце'][(i-3)/4]:null};
 return {
  v20Id:'v20-'+String(i+1).padStart(2,'0'),v20:config,
  title,chapter:chapterNames[Math.floor(i/4)],levelSubtitle:'Переплетение миров · '+(i+1)+'/12',
  objective:hints[config.kind]+(boss?' После этого победите хранителя вдвоём.':''),
  hint:hints[config.kind],width:2320,spawn:[100,164],
  floor:boss?[[0,2320]]:[[0,820],[920,1435],[1535,2320]],
  platforms:[{x:695,y:455,w:142,h:18},{x:1480,y:456,w:145,h:18},{x:1690,y:473,w:148,h:18}],
  pads:[],walls:[],crystals:[],bridges:[],hazards:[],
  gates:[{x:2050,y:350,w:31,h:194}],portal:2195,shards:[260,620,1140,1710,1960],
  puzzle:{walls:false,crystals:false,pads:false},bridgeTrigger:'always'
 };
});
const result={stages,titles,chapterNames,kinds};
if(typeof module!=='undefined'&&module.exports)module.exports=result;
if(root)root.GameV20Stages=result;
})(typeof window!=='undefined'?window:null);
