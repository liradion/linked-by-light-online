// Linked by Light v23: 15 new cooperative light-physics and boss stages.
// Stable indices 122..136: all previous story/creator indices remain unchanged.
(function(root){'use strict';
const titles=['Две гравитации','Зеркальный луч','Великий и маленький','Маятник света','Живые тени',
 'Два облика мира','Подводная река','Полюса притяжения','Ритм созвездий','Машина маршрутов',
 'Хранитель кристаллов','Дракон часов','Зеркальные двойники','Спящий титан','Око двух миров'];
const kinds=['gravity-duet','prism','resize','pendulum','shadows','world-switch','water','magnets','rhythm','conductor',
 'boss-spider','boss-dragon','boss-mirror','boss-titan','boss-perception'];
const objectives=[
 'Искра переворачивает гравитацию, Эхо удерживает поле. Коснитесь двух небесных печатей.',
 'Искра направляет световой луч, Эхо настраивает зеркала. Активируйте три призмы.',
 'Искра становится великаном, Эхо проходит через узкий проход. Откройте обе печати.',
 'Удержите маятник общим усилием и по очереди зафиксируйте два небесных якоря.',
 'Тень Искры станет платформами Эха. Пересеките разрыв, оставаясь рядом.',
 'Переключайте геометрию двух миров по очереди и активируйте обе колонны.',
 'Искра управляет речным течением, Эхо ведёт плот и собирает три речные жемчужины.',
 'Притягивайте и отталкивайте общий кристалл, чтобы доставить его к солнечному приёмнику.',
 'Ритмическая загадка: повторите четыре узора по очереди, не торопясь.',
 'Постройте путь из четырёх секций; один игрок управляет мостом, другой проходит.',
 'Хранитель кристаллов: Эхо отвлекает паука, Искра уничтожает его печати.',
 'Дракон часов: замедлите его время, затем вместе нанесите четыре точных удара.',
 'Зеркальные двойники: заманите отражения в ловушку и повторите четыре раза.',
 'Спящий титан: поднимитесь по печатям и пробудите четыре источника света.',
 'Око двух миров: каждый видит лишь часть защиты; согласуйте четыре атаки.'
];
const stages=titles.map((title,i)=>{
 const width=2460+(i%4)*140,anchor=580+(i%3)*70,goal=anchor+820,kind=kinds[i];
 const floor=kind==='shadows'||kind==='pendulum'?[[0,anchor+220],[anchor+940,width]]:[[0,width]];
 return {v23Id:'v23-'+String(i+1).padStart(2,'0'),v23:{kind,anchor,goal,chapter:i<10?'Физика света':'Древние хранители'},
 title,chapter:i<10?'Физика света':'Древние хранители',levelSubtitle:'v23 · '+(i+1)+'/15',objective:objectives[i],hint:objectives[i],
 width,spawn:[100,145],floor,
 platforms:[{x:360,y:461,w:150,h:16},{x:anchor+400,y:409,w:160,h:18},{x:goal+200,y:475,w:150,h:16}],
 pads:[],walls:[],crystals:[],bridges:[],hazards:[],gates:[{x:width-210,y:354,w:30,h:190}],
 portal:width-90,shards:[250,460,anchor+190,goal+180,width-330],
 puzzle:{walls:false,crystals:false,pads:false},bridgeTrigger:'always'};
});
const registry={stages,titles,kinds,objectives,FIRST:122,LAST:136};
if(typeof module!=='undefined'&&module.exports)module.exports=registry;
if(root)root.GameV23Stages=registry;
})(typeof window!=='undefined'?window:null);
