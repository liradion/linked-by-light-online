// Единственное определение уровней для сервера и браузера.
(function(root) {
  const GROUND = 544;
  const stages = [
 {title:'Первый контакт',objective:'Искра — на оранжевую плиту, Эхо — на голубую. Держите обе одновременно.',width:1660,spawn:[90,166],floor:[[0,1660]], platforms:[{x:285,y:452,w:165,h:18},{x:900,y:464,w:140,h:18}], pads:[{x:608,w:90,type:0},{x:782,w:90,type:1}], walls:[],crystals:[],bridges:[],hazards:[],gates:[{x:1102,y:350,w:31,h:194}],portal:1510,shards:[390,965,1310],hint:'Две плиты действуют, только когда вы на них вместе.'},
 {title:'Мост доверия',objective:'Искра разбивает стену рывком и держит плиту; Эхо пересекает мост и будит кристалл.',width:1750,spawn:[90,167],floor:[[0,854],[1142,1750]],platforms:[{x:325,y:454,w:140,h:18},{x:1185,y:465,w:135,h:18}],pads:[{x:728,w:92,type:0}], walls:[{x:538,y:353,w:34,h:191,broken:false}], crystals:[{x:1263,y:484,on:false}],bridges:[{x:854,y:544,w:288,h:18}],hazards:[],gates:[{x:1435,y:350,w:30,h:194}],portal:1610,shards:[350,788,1235,1520],hint:'Искра: F у треснувшей стены. Эхо: Enter рядом с кристаллом.'},
 {title:'Один ритм',objective:'Разбейте преграду, активируйте кристалл и синхронно встаньте на цветные плиты.',width:1820,spawn:[75,147],floor:[[0,470],[625,1105],[1260,1820]],platforms:[{x:230,y:444,w:125,h:18}],pads:[{x:1350,w:94,type:0},{x:1485,w:94,type:1}],walls:[{x:738,y:350,w:31,h:194,broken:false}],crystals:[{x:1010,y:478,on:false}],bridges:[{x:1105,y:544,w:155,h:18}],hazards:[{x:843,y:531,w:73,h:13}],gates:[{x:1635,y:347,w:30,h:197}],portal:1750,shards:[435,675,978,1203,1595],hint:'Используйте все способности, а затем найдите общий ритм.'}
];
  const result = { GROUND, stages };
  if (typeof module !== 'undefined' && module.exports) module.exports = result;
  if (root) root.GameStages = result;
})(typeof window !== 'undefined' ? window : null);
