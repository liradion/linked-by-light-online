/* Linked by Light v4 — client-only motion and reactions. Never changes server physics. */
(function(root){
'use strict';
const TAU=Math.PI*2;
const lowPower=typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches;
const MAX=lowPower?96:160;
const characters=[{},{}];
let sparks=[],waves=[],time=0;
const seed=i=>{const x=Math.sin(i*79.71+3.1)*42358.5453;return x-Math.floor(x);};
function clear(){
  sparks=[];waves=[];time=0;
  characters.forEach((a,i)=>Object.assign(a,{steps:i*1.2,blink:2.1+i*1.7,blinkLength:0,land:0,
    wasGrounded:null,oldDash:0,oldPower:0,dustTimer:0}));
}
function spark(x,y,color,count=8,scale=1){
  for(let n=0;n<count;n++){
    const angle=Math.random()*TAU,velocity=(26+Math.random()*98)*scale;
    const life=.24+Math.random()*.37;
    sparks.push({x,y,dx:Math.cos(angle)*velocity,dy:Math.sin(angle)*velocity-22,
      life,ttl:life,r:1.2+Math.random()*3,color});
  }
  if(sparks.length>MAX)sparks.splice(0,sparks.length-MAX);
}
function wave(x,y,color,radius=60,duration=.45){
  waves.push({x,y,color,radius,life:duration,ttl:duration});
  if(waves.length>22)waves.shift();
}
function snapshot(prev,next,level){
  if(!prev||prev.stage!==next.stage)return;
  const past=prev.world,now=next.world;
  if(!past||!now)return;
  if(!past.gateOpen&&now.gateOpen){
    for(const gate of level.gates)wave(gate.x+gate.w/2,gate.y+gate.h/2,'#f7c9fe',136,.8);
  }
  if(!past.bridgeLatched&&now.bridgeLatched){
    for(const b of level.bridges)wave(b.x+b.w/2,b.y,'#96fff1',Math.min(190,b.w*.7),.75);
  }
  for(let i=0;i<now.pads.length;i++){
    if(!past.pads[i]&&now.pads[i]){
      const pad=level.pads[i],color=pad.type?'#83f5ff':'#ffc788';
      if(pad)wave(pad.x+pad.w/2,544-10,color,42,.32);
    }
  }
  for(let i=0;i<now.shards.length;i++){
    if(!past.shards[i]&&now.shards[i]){
      const x=level.shards[i],y=i%2?390:432;
      spark(x,y,'#ffe5a2',lowPower?8:16,1.15);wave(x,y,'#ffe6b7',42,.5);
    }
  }
  for(let i=0;i<now.crystals.length;i++){
    if(!past.crystals[i]&&now.crystals[i]){
      const obj=level.crystals[i];wave(obj.x,obj.y,'#9af9f5',136,.8);
    }
  }
}
function frame(dt,players,playing){
  dt=Math.min(.05,Math.max(0,dt));time+=dt;
  for(let i=0;i<players.length;i++){
    const p=players[i],a=characters[i];if(!p)continue;
    const moving=p.grounded&&Math.abs(p.vx)>24;
    a.steps+=dt*(moving?Math.min(17,6+Math.abs(p.vx)*.023):2.2);
    a.blink-=dt;
    if(a.blink<=0){a.blinkLength=.12;a.blink=2.2+seed(time*39+i*11)*3.7;}
    if(a.blinkLength>0)a.blinkLength=Math.max(0,a.blinkLength-dt);
    a.land=Math.max(0,a.land-dt*3.5);
    if(playing&&a.wasGrounded!==null){
      if(p.grounded&&!a.wasGrounded){
        a.land=1;
        spark(p.x+15,p.y+44,p.type?'#aaf9ec':'#ffdeb4',lowPower?4:9,.58);
        wave(p.x+15,p.y+43,p.type?'#9df4f0':'#ffe1b0',26,.3);
      }else if(!p.grounded&&a.wasGrounded&&p.vy<0){
        wave(p.x+15,p.y+40,p.type?'#95eff7':'#ffd29b',22,.25);
      }
      if(p.dash>0&&a.oldDash<=0){
        spark(p.x+15,p.y+18,'#ffca84',lowPower?9:17,1.3);
        wave(p.x+15,p.y+22,'#ffd29b',55,.25);
      }
      if(p.type===1&&p.abilityFx>.3&&a.oldPower<=.3){
        spark(p.x+15,p.y+19,'#9dfbfc',lowPower?10:17,1.1);
        wave(p.x+15,p.y+19,'#a0f9ff',148,.5);
      }
      a.dustTimer-=dt;
      if(moving&&a.dustTimer<=0){
        a.dustTimer=lowPower?.19:.105;
        spark(p.x+15-p.face*9,p.y+43,p.type?'#9ff5f3':'#ffcfaa',lowPower?1:2,.28);
      }
    }
    a.wasGrounded=!!p.grounded;a.oldDash=p.dash||0;a.oldPower=p.abilityFx||0;
    p.anim={stride:a.steps,run:moving?Math.min(1,Math.abs(p.vx)/230):0,
      blink:a.blinkLength>0,land:a.land,
      airborne:!p.grounded,fall:p.vy>80,takeoff:p.vy< -75,
      lean:Math.min(.13,Math.abs(p.vx)/2600)*Math.sign(p.vx||0)};
  }
  for(const s of sparks){s.x+=s.dx*dt;s.y+=s.dy*dt;s.dy+=140*dt;s.life-=dt;}
  sparks=sparks.filter(s=>s.life>0);
  for(const w of waves)w.life-=dt;
  waves=waves.filter(w=>w.life>0);
}
function ambient(c,level,clock,index){
  const color=index===1?'#a3fff1':index===2?'#ffbddd':'#c7c3ff';
  // Smooth, low-cost moths that drift near the walking surface.
  for(let i=0;i<15;i++){
    const x=65+i*137+Math.sin(clock*.37+i*2.1)*20;
    if(x>level.width+50)continue;
    const y=390+seed(i+13)*105+Math.sin(clock*.9+i*1.8)*12;
    const r=1.8+seed(i+7)*1.5;
    c.save();c.globalAlpha=.35+.25*Math.sin(clock*1.9+i*2);
    c.fillStyle=color;c.shadowColor=color;c.shadowBlur=13;
    c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.restore();
  }
  // Subtle swaying light-vines on stable ground segments.
  for(const [left,right] of level.floor){
    for(let x=left+110;x<right-40;x+=227){
      c.save();c.strokeStyle=color;c.lineWidth=1.6;c.globalAlpha=.35;
      const swing=Math.sin(clock*1.2+x*.014)*6;
      c.beginPath();c.moveTo(x,541);c.quadraticCurveTo(x+swing,530,x+7+swing,519);c.stroke();
      c.fillStyle=color;c.beginPath();c.arc(x+7+swing,519,2.3,0,TAU);c.fill();c.restore();
    }
  }
}
function effects(c){
  for(const w of waves){
    const progress=1-w.life/w.ttl;
    c.save();c.globalAlpha=(1-progress)*.65;c.lineWidth=4-2.5*progress;
    c.strokeStyle=w.color;c.beginPath();c.arc(w.x,w.y,5+w.radius*progress,0,TAU);c.stroke();c.restore();
  }
  for(const s of sparks){
    const a=s.life/s.ttl;
    c.save();c.globalAlpha=a*.9;c.fillStyle=s.color;c.shadowColor=s.color;c.shadowBlur=8;
    c.beginPath();c.arc(s.x,s.y,Math.max(.35,s.r*a),0,TAU);c.fill();c.restore();
  }
}
clear();
root.GameJuice={clear,snapshot,frame,ambient,effects};
})(typeof window!=='undefined'?window:globalThis);
