// Linked by Light v21: ten NEW cooperative mechanics; original 0..111 unchanged.
(function(root){'use strict';
const titles=['Мост из следов','Почта между мирами','Два взгляда','Фонарь в тумане','Меняем форму','Погода в ладонях','Хрупкий груз','Живое дерево','Лабиринт для двоих','Обмен ролями'];
const mechanics=['trails','transfer','knowledge','lantern','transform','weather','cargo','tree','maze','asymmetry'];
const objectives=[
 'Искра оставляет световой след при движении. Эхо пройдёт по четырём временным платформам.',
 'Искра передаёт сферу на алтаре. Эхо принимает её и приносит к выходу.',
 'Искра видит порядок знаков; Эхо активирует их в правильной последовательности.',
 'Искра включает фонарь, Эхо пересекает скрытый мост. Выключите свет, чтобы утихомирить стража.',
 'Примите новые формы и соберите два световых ключа: птица и лис.',
 'Искра направляет ветер, Эхо вызывает дождь. Вместе заполните небесный сосуд.',
 'Вдвоём передвиньте тяжёлый кристалл к третьей отметке.',
 'Поочерёдно выращивайте шесть ветвей огромного дерева.',
 'Эхо направляет механизм лабиринта, Искра проходит три контрольные отметки.',
 'Первая пара действий: Искра проходит, Эхо запускает. Затем поменяйтесь обязанностями.'
];
const stages=titles.map((title,i)=>{
 const width=2160+i*28,kind=mechanics[i],x=600+i*8;
 return {
  v21Id:'v21-'+String(i+1).padStart(2,'0'),
  v21:{kind,anchor:x,goal:x+780,sequence:[2,0,1]},
  title,chapter:'Навстречу друг другу',levelSubtitle:'Новая история · '+(i+1)+'/10',
  objective:objectives[i],hint:objectives[i],width,spawn:[115,162],
  floor:[[0,width]],platforms:[{x:420,y:448,w:160,h:17},{x:1110,y:445,w:178,h:18},{x:1540,y:475,w:125,h:17}],
  pads:[],walls:[],crystals:[],bridges:[],hazards:[],
  gates:[{x:width-220,y:354,w:30,h:190}],portal:width-90,
  shards:[280,720,1090,1570,width-330],puzzle:{walls:false,crystals:false,pads:false},bridgeTrigger:'always'
 };
});
const registry={stages,titles,mechanics,objectives};
if(typeof module!=='undefined'&&module.exports)module.exports=registry;
if(root)root.GameV21Stages=registry;
})(typeof window!=='undefined'?window:null);
