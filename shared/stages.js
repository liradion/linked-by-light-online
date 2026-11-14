// Единственное определение уровней для сервера и браузера.
(function(root) {
  const GROUND = 544;
  const classic = [
 {title:'Первый контакт',objective:'Искра — на оранжевую плиту, Эхо — на голубую. Держите обе одновременно.',width:1660,spawn:[90,166],floor:[[0,1660]], platforms:[{x:285,y:452,w:165,h:18},{x:900,y:464,w:140,h:18}], pads:[{x:608,w:90,type:0},{x:782,w:90,type:1}], walls:[],crystals:[],bridges:[],hazards:[],gates:[{x:1102,y:350,w:31,h:194}],portal:1510,shards:[390,965,1310],hint:'Две плиты действуют, только когда вы на них вместе.'},
 {title:'Мост доверия',objective:'Искра разбивает стену рывком и держит плиту; Эхо пересекает мост и будит кристалл.',width:1750,spawn:[90,167],floor:[[0,854],[1142,1750]],platforms:[{x:325,y:454,w:140,h:18},{x:1185,y:465,w:135,h:18}],pads:[{x:728,w:92,type:0}], walls:[{x:538,y:353,w:34,h:191,broken:false}], crystals:[{x:1263,y:484,on:false}],bridges:[{x:854,y:544,w:288,h:18}],hazards:[],gates:[{x:1435,y:350,w:30,h:194}],portal:1610,shards:[350,788,1235,1520],hint:'Искра: F у треснувшей стены. Эхо: Enter рядом с кристаллом.'},
 {title:'Один ритм',objective:'Разбейте преграду, активируйте кристалл и синхронно встаньте на цветные плиты.',width:1820,spawn:[75,147],floor:[[0,470],[625,1105],[1260,1820]],platforms:[{x:230,y:444,w:125,h:18}],pads:[{x:1350,w:94,type:0},{x:1485,w:94,type:1}],walls:[{x:738,y:350,w:31,h:194,broken:false}],crystals:[{x:1010,y:478,on:false}],bridges:[{x:1105,y:544,w:155,h:18}],hazards:[{x:843,y:531,w:73,h:13}],gates:[{x:1635,y:347,w:30,h:197}],portal:1750,shards:[435,675,978,1203,1595],hint:'Используйте все способности, а затем найдите общий ритм.'}
];

  // 11 worlds x 9 missions = 99 fixed, reproducible levels.
  // Every route is made of ground segments, optional short jumpable gaps or
  // cooperative bridges, and the gate is always beyond all puzzle devices.
  const ACTS=[
    ['Искорки рассвета','Светлая долина'],
    ['Шёпот леса','Сумеречный лес'],
    ['Лунная гавань','Лунная пристань'],
    ['Мосты облаков','Высокие облака'],
    ['Тихие сады','Сад созвездий'],
    ['Хрустальные пути','Кристальный разлом'],
    ['Город фонарей','Сияющий город'],
    ['Небесная река','Река небес'],
    ['Механика звёзд','Часовая башня'],
    ['На краю мира','Дальний горизонт'],
    ['Сердце света','Сердце созвездия']
  ];
  const MISSIONS=[
    ['Вместе','Обе плиты откроют ворота. Станьте на них одновременно.'],
    ['Сквозь стену','Искра разрушает стену, Эхо зажигает кристалл.'],
    ['Первый мост','Эхо заряжает кристалл перед мостом. Перейдите вместе.'],
    ['Сила двоих','Искра разрушает преграду. Активируйте обе плиты.'],
    ['Общий сигнал','Зажгите кристалл и одновременно нажмите две плиты.'],
    ['Держи мост','Искра держит плиту, пока Эхо пересекает мост и активирует кристалл.'],
    ['Двойное сияние','Эхо включает два кристалла. Пройдите через мост.'],
    ['Верное решение','Разрушьте стену, активируйте кристалл и обе плиты.'],
    ['Финальная связка','Вместе активируйте все механизмы и войдите в портал.']
  ];
  // A seeded offset changes spaces without placing any objective inside a gap.
  function makeStage(index){
    const act=Math.floor(index/9),challenge=index%9;
    const drift=(act*41+challenge*23)%77;
    const first=965+drift;const gap=86+((act*11+challenge*7)%4)*12;
    const hasGap=[2,4,5,6,8].includes(challenge)||(act>2&&[1,3,7].includes(challenge));
    const second=act>=4&&[2,4,5,6,7,8].includes(challenge);
    const secondX=1515+((act*17+challenge*13)%63);
    const gap2=second?82+((act+challenge)%3)*14:0;
    const width=1850+act*42+challenge*18;
    const floor=[],bridges=[];
    let start=0;
    const holes=[];
    if(hasGap)holes.push([first,first+gap]);
    if(second)holes.push([secondX,secondX+gap2]);
    for(const [a,b] of holes){floor.push([start,a]);start=b;bridges.push({x:a,y:GROUND,w:b-a,h:18});}
    floor.push([start,width]);
    const hasWall=[1,3,5,7,8].includes(challenge);
    const dualPads=[0,3,4,7,8].includes(challenge);
    const singlePad=challenge===5;
    const crystalCount=[1,2,4,5,7].includes(challenge)?1:[6,8].includes(challenge)?2:0;
    const trigger=[2,6,8].includes(challenge)?'crystal':challenge===5?'pad-crystal':'none';
    const crystalPositions=[];
    if(crystalCount){
      // Bridge-crystals must lie before the first gap so a player can reach them.
      if(trigger==='crystal'){if(crystalCount>1)crystalPositions.push(310+(drift%31));crystalPositions.push(first-112);}
      else if(challenge===5)crystalPositions.push(first+gap+135);
      else if(challenge===7)crystalPositions.push(first+gap+130);
      else crystalPositions.push(first-130);
    }
    const pads=dualPads?[
      {x:600+(drift%32),w:82,type:0},
      {x:742+(drift%24),w:82,type:1}
    ]:singlePad?[{x:745+(drift%18),w:90,type:0}]:[];
    const puzzle={walls:hasWall,crystals:crystalCount>0,pads:dualPads};
    const hazardCount=act<2?0:act<5?1:2;
    const hazards=[];
    for(let n=0;n<hazardCount;n++){
      const x=hasGap?(first+gap+205+n*170):(1020+n*165);
      if(x+44<width-270&&!holes.some(([a,b])=>x>a-30&&x<b+30))
        hazards.push({x,y:GROUND-13,w:43,h:13});
    }
    const actName=ACTS[act][0],region=ACTS[act][1];
    const name=MISSIONS[challenge][0];
    const hint=MISSIONS[challenge][1];
    return {
      title:region+' · '+name,
      act:act+1,chapter:actName,
      objective:hint,hint,challenge,
      width,spawn:[75,147],floor,
      platforms:[
        {x:250+drift%22,y:463,w:130,h:18},
        {x:1120+drift%30,y:457,w:128,h:18},
        {x:width-510,y:468,w:135,h:18}
      ].filter(p=>!holes.some(([a,b])=>p.x<a+10&&p.x+p.w>b-10)),
      pads,walls:hasWall?[{x:425+drift%40,y:GROUND-192,w:34,h:192,broken:false}]:[],
      crystals:crystalPositions.map(x=>({x,y:GROUND-66,on:false})),
      bridges,
      hazards,
      gates:[{x:width-218,y:GROUND-194,w:31,h:194}],
      portal:width-90,
      shards:[335,first-240,first+gap+175,width-315].filter(x=>x>150&&x<width-270&&!holes.some(([a,b])=>x>=a-25&&x<=b+25)),
      bridgeTrigger:trigger,puzzle
    };
  }
  classic[0].puzzle={pads:true};classic[0].bridgeTrigger='none';
  classic[1].puzzle={crystals:true};classic[1].bridgeTrigger='pad-crystal';
  classic[2].puzzle={pads:true,crystals:true};classic[2].bridgeTrigger='crystal';
  classic.forEach((stage,i)=>{stage.act=1;stage.chapter=ACTS[0][0];stage.challenge=i;});
  const stages=classic.concat(Array.from({length:96},(_,offset)=>makeStage(offset+3)));

  // World signature engine: one new cooperative interaction in every chapter.
  // Signatures are data only, so the server and both browsers see identical geometry.
  const SIGNATURES=['flowers','forest','tide','wind','constellation','prism','city','river','clock','relay','heart'];
  const TWISTS=['Пробуждение','Второй голос','Скрытый путь','Новая высота','Точное время','Сила доверия','Два ключа','На расстоянии','Сердце мира'];
  const SIGNATURE_HINTS={
    flowers:'Прикоснитесь к световым цветам, чтобы разбудить тропу.',
    forest:'Эхо будит спящие семена импульсом; вырастут световые ветви.',
    tide:'Оба героя заряжают лунные фонари во время яркого прилива.',
    wind:'Поднимайтесь по воздушным потокам и соберите небесные перья.',
    constellation:'Эхо включает звёзды строго по номерам. Ошибка сбрасывает узор.',
    prism:'Искра заряжает янтарные призмы рывком, Эхо — голубые импульсом.',
    city:'Включайте городские генераторы способностями соответствующих героев.',
    river:'Одновременно вставайте у двух речных якорей, чтобы закрепить поток.',
    clock:'Эхо запускает часы; доберитесь вдвоём до контрольной линии до истечения времени.',
    relay:'Один держит дальний сигнал, второй отвечает у маяка. Заряжайте цепь по этапам.',
    heart:'Пробудите ядра способностями героев, а двойные — находясь рядом вдвоём.'
  };
  function safeSpot(stage,desired){
    // Search real walkable ground: never put a switch inside a pit, spike or wall.
    const desiredX=Math.max(190,Math.min(stage.width-295,desired));
    let best=null,bestScore=Infinity;
    for(const [a,b] of stage.floor){
      for(let x=Math.max(190,a+49);x<=Math.min(stage.width-295,b-49);x+=8){
        if(stage.walls.some(w=>x>w.x-48&&x<w.x+w.w+48))continue;
        if(stage.hazards.some(h=>x>h.x-66&&x<h.x+h.w+66))continue;
        const score=Math.abs(x-desiredX);
        if(score<bestScore){best=x;bestScore=score;}
      }
    }
    return Math.round(best??desiredX);
  }
  function enrichStage(stage,index){
    const act=Math.floor(index/9),variant=index%9;
    const kind=SIGNATURES[act],scale=variant===8?2:0;
    const s={kind,variant,finale:variant===8,elapsed:0,progress:0,
      subtitle:TWISTS[variant],hint:SIGNATURE_HINTS[kind],nodes:[],zones:[],pairs:[],platforms:[],
      done:false,window:0,phase:0,hold:0};
    const node=(x,mode,role=null,y=GROUND-35)=>({x:safeSpot(stage,x),y,mode,role,active:false,hold:0});
    const n=Math.min(5,1+Math.floor(variant/3)+scale);
    const positions=[292,750,1200,1502,1730].map((x,i)=>safeSpot(stage,x+(variant*11+i*17)%31));
    switch(kind){
      case 'flowers':
        s.nodes=positions.slice(0,Math.min(4,n+1)).map((x,i)=>node(x,'flower',i%2));break;
      case 'forest':
        s.nodes=positions.slice(0,Math.min(4,n+1)).map(x=>node(x,'seed',1));
        s.platforms=s.nodes.map((b,i)=>({x:b.x+43,y:GROUND-110-(i%2)*32,w:91,h:13,linked:i}));break;
      case 'tide':
        s.period=7.5-(variant%3)*.4;
        s.nodes=positions.slice(0,Math.min(4,n+1)).map((x,i)=>node(x,'moon',i%2));
        s.platforms=positions.slice(0,Math.min(3,n)).map((x,i)=>({x:x+70,y:GROUND-110,w:102,h:14,linked:-1,move:'tide',offset:i}));break;
      case 'wind':
        s.zones=positions.slice(0,Math.min(4,n+1)).map((x,i)=>({x:x-54,y:GROUND-218,w:130,h:230,dir:i%2?1:-1,force:1650+variant*55}));
        s.nodes=s.zones.map((z,i)=>node(z.x+z.w/2,'feather',null,GROUND-88-(i%2)*6));break;
      case 'constellation':
        s.nodes=positions.slice(0,Math.min(4,n+2)).map(x=>node(x,'star',1));
        {const seq=s.nodes.map((_,i)=>i),shift=variant%seq.length;const reversed=variant%2===1;
          const shuffled=seq.slice(shift).concat(seq.slice(0,shift));if(reversed)shuffled.reverse();
          shuffled.forEach((id,ordinal)=>s.nodes[id].order=ordinal+1);}break;
      case 'prism':
        s.nodes=positions.slice(0,Math.min(5,n+2)).map((x,i)=>node(x,'prism',i%2));break;
      case 'city':
        s.nodes=positions.slice(0,Math.min(5,n+2)).map((x,i)=>node(x,'power',i%2));
        s.platforms=s.nodes.slice(0,3).map((o,i)=>({x:o.x+30,y:GROUND-96,w:92,h:14,linked:i,move:'lift',offset:i}));break;
      case 'river':
        s.zones=positions.slice(0,Math.min(3,n+1)).map((x,i)=>({x:x-55,y:GROUND-95,w:155,h:100,dir:i%2?-1:1,force:120+variant*14}));
        s.pairs=Array.from({length:Math.min(3,1+Math.floor(variant/4)+scale)},(_,i)=>({
          x0:safeSpot(stage,260+i*145),x1:safeSpot(stage,700+i*175),active:false,hold:0
        }));break;
      case 'clock':
        s.period=22-(variant%4)*2;
        s.nodes=[node(340+variant*13,'clock',1)];
        s.barrier={x:safeSpot(stage,1170+variant*14),y:GROUND-193,w:28,h:193};break;
      case 'relay':
        s.pairs=Array.from({length:Math.min(4,1+Math.floor(variant/3)+scale)},(_,i)=>({
          x0:safeSpot(stage,280+i*150),x1:safeSpot(stage,690+i*260),active:false,hold:0
        }));break;
      case 'heart':
        s.nodes=positions.slice(0,Math.min(5,n+2)).map((x,i)=>node(x,i%3===2?'duo':i%3===0?'spark':'echo',i%3===0?0:i%3===1?1:null));break;
    }
    stage.signature=s;
    stage.signatureHint=s.hint;
    stage.levelSubtitle=TWISTS[variant];
    stage.campaignFinale=variant===8;
    return stage;
  }
  stages.forEach(enrichStage);
  const result = { GROUND, stages, ACTS, SIGNATURES, SIGNATURE_HINTS };
  if (typeof module !== 'undefined' && module.exports) module.exports = result;
  if (root) root.GameStages = result;
})(typeof window !== 'undefined' ? window : null);