/* Linked by Light — quality, accessibility, network diagnostics, gamepad and procedural audio. */
(function(root){'use strict';
const KEY='linked-light-settings-v11';
const DEFAULT={graphics:'auto',buttons:54,opacity:.88,lift:8,inset:12,sound:true,diagnostics:false,reducedMotion:false};
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const $=id=>document.getElementById(id);
let options={...DEFAULT},avg=0,jitter=0,samples=0,fps=60,frames=0,fpsElapsed=0,quality='high',onControls=()=>{},onAction=()=>{},getSession=()=>({});
let audioCtx=null,pad=null,padGain=null,gamepadButtons=[],oldLeft=false,oldRight=false,ambientWorld=-1;
try{const data=JSON.parse(localStorage.getItem(KEY));if(data&&typeof data==='object')options={...options,...data};}catch(_){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(options));}catch(_){}}
function adapt(){if(options.graphics!=='auto')return options.graphics;return fps<37||navigator.hardwareConcurrency<=2?'low':fps<48?'medium':'high';}
function apply(){
 options.buttons=clamp(Number(options.buttons)||54,44,76);options.opacity=clamp(Number(options.opacity)||.88,.5,1);options.lift=clamp(Number(options.lift??8),0,74);options.inset=clamp(Number(options.inset??12),4,45);
 document.documentElement.style.setProperty('--mobile-button-size',options.buttons+'px');
 document.documentElement.style.setProperty('--mobile-button-opacity',String(options.opacity));
 document.documentElement.style.setProperty('--mobile-button-lift',options.lift+'px');document.documentElement.style.setProperty('--mobile-button-inset',options.inset+'px');
 quality=adapt();document.documentElement.dataset.gameGraphics=quality;document.documentElement.dataset.reduceGameMotion=options.reducedMotion?'true':'false';
 save();
 const d=$('qualityStats');if(d)d.style.display=options.diagnostics?'block':'none';
 const s=$('soundBtn');if(s)s.textContent=options.sound?'♫ Вкл.':'♫ Выкл.';
 setSound(options.sound);
}
function net(value){if(!Number.isFinite(value)||value<0)return;
 if(!samples){avg=value;jitter=0;}else{const diff=Math.abs(value-avg);avg=avg*.83+value*.17;jitter=jitter*.82+diff*.18;}
 samples++;
}
function interpolationDelay(){return clamp(70+jitter*.8+avg*.07,85,235);}
function predictionLead(){return clamp(avg/2000+.045,.09,.35);}
function stats(){return {rtt:Math.round(avg),jitter:Math.round(jitter),fps:Math.round(fps),quality,buffer:Math.round(interpolationDelay())};}
function sample(dt){if(!Number.isFinite(dt)||dt<=0)return;frames++;fpsElapsed+=dt;
 if(fpsElapsed>=1){fps=Math.round(frames/fpsElapsed);frames=0;fpsElapsed=0;const next=adapt();if(next!==quality){quality=next;document.documentElement.dataset.gameGraphics=quality;}const d=$('qualityStats');if(d){const s=stats();d.textContent=`FPS ${s.fps} · RTT ${s.rtt} мс · Джиттер ${s.jitter} мс · Буфер ${s.buffer} мс · ${s.quality}`;}}
 pollGamepad();
}
function pollGamepad(){if(typeof navigator.getGamepads!=='function')return;
 let pads;try{pads=navigator.getGamepads();}catch(_){return;}
 const pad=Array.from(pads||[]).find(p=>p&&p.connected);const playing=getSession().phase==='playing';
 const left=!!(pad&&playing&&(pad.axes?.[0]<-.34||pad.buttons?.[14]?.pressed));
 const right=!!(pad&&playing&&(pad.axes?.[0]>.34||pad.buttons?.[15]?.pressed));
 if(left!==oldLeft||right!==oldRight){oldLeft=left;oldRight=right;onControls(left,right);}
 const buttons=[0,1,2,3];buttons.forEach((n,i)=>{const down=!!(pad&&playing&&pad.buttons?.[n]?.pressed);if(down&&!gamepadButtons[i])onAction(['jump','ability','bond','emote'][i]);gamepadButtons[i]=down;});
}
function init(api={}){onControls=api.onControls||onControls;onAction=api.onAction||onAction;getSession=api.getSession||getSession;
 const settings=document.createElement('button');settings.type='button';settings.className='mini-btn';settings.textContent='⚙ Настройки';settings.id='qualityOpen';
 const header=document.querySelector('.topline');if(header)header.append(settings);
 const d=document.createElement('dialog');d.id='qualityDialog';d.className='quality-dialog';
 d.innerHTML=`<div class="quality-head"><strong>⚙ Настройки игры</strong><button type="button" id="qualityClose" aria-label="Закрыть">✕</button></div>
 <div class="quality-grid">
 <label>Графика<select id="qualityGraphics"><option value="auto">Авто</option><option value="low">Низкая</option><option value="medium">Средняя</option><option value="high">Высокая</option></select></label>
 <label>Размер кнопок iPhone <output id="qualityButtonsValue"></output><input id="qualityButtons" type="range" min="44" max="76" step="2"></label>
 <label>Прозрачность кнопок <output id="qualityOpacityValue"></output><input id="qualityOpacity" type="range" min="50" max="100" step="5"></label>
 <label>Поднять кнопки выше <output id="qualityLiftValue"></output><input id="qualityLift" type="range" min="0" max="74" step="2"></label>
 <label>Отступ кнопок от краёв <output id="qualityInsetValue"></output><input id="qualityInset" type="range" min="4" max="45" step="1"></label>
 <label class="quality-check"><input id="qualitySound" type="checkbox"> Музыка и эффекты</label>
 <label class="quality-check"><input id="qualityReduced" type="checkbox"> Меньше анимаций</label>
 <label class="quality-check"><input id="qualityDiag" type="checkbox"> FPS и диагностика соединения</label></div>
 <p class="quality-note">🎮 Геймпад: левый стик — движение, A — прыжок, B — способность, X — связь, Y — эмоция. Настройки сохраняются только на этом устройстве.</p>
 <div class="quality-actions"><button type="button" id="qualitySave">Применить</button></div>`;
 document.body.append(d);
 const bind=[['qualityGraphics','graphics','value'],['qualityButtons','buttons','number'],['qualityOpacity','opacity','percent'],['qualityLift','lift','number'],['qualityInset','inset','number'],['qualitySound','sound','checked'],['qualityReduced','reducedMotion','checked'],['qualityDiag','diagnostics','checked']];
 function refresh(){for(const [id,key,kind] of bind){const n=$(id);n[kind==='checked'?'checked':'value']=kind==='percent'?String(Math.round(options[key]*100)):options[key];}const vals=[['qualityButtonsValue',options.buttons+' px'],['qualityOpacityValue',Math.round(options.opacity*100)+'%'],['qualityLiftValue',options.lift+' px'],['qualityInsetValue',options.inset+' px']];for(const [id,value] of vals)$(id).textContent=value;}
 for(const [id,key,kind] of bind)$(id).addEventListener(kind==='checked'?'change':'input',()=>{const n=$(id);options[key]=kind==='checked'?n.checked:kind==='percent'?Number(n.value)/100:kind==='number'?Number(n.value):n.value;refresh();apply();});
 const close=()=>d.close();$('qualityClose').addEventListener('click',close);$('qualitySave').addEventListener('click',close);
 settings.addEventListener('click',()=>{refresh();if(!d.open)d.showModal();});d.addEventListener('click',e=>{if(e.target===d)close();});
 const stat=document.createElement('div');stat.id='qualityStats';stat.className='quality-stats';const frame=$('frame');if(frame)frame.append(stat);
 apply();refresh();return d;
}
function setSound(enabled){options.sound=!!enabled;save();if(padGain&&audioCtx)padGain.gain.setTargetAtTime(enabled?.012:0,audioCtx.currentTime,.4);}
function audioUnlock(){if(!options.sound)return;try{
 if(!audioCtx){const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;audioCtx=new Ctx();padGain=audioCtx.createGain();padGain.gain.value=0;padGain.connect(audioCtx.destination);pad=[110,164.81,220].map((freq,i)=>{const osc=audioCtx.createOscillator();osc.type=i===1?'triangle':'sine';osc.frequency.value=freq;osc.connect(padGain);osc.start();return osc;});}
 if(audioCtx.state==='suspended')audioCtx.resume();padGain.gain.setTargetAtTime(.012,audioCtx.currentTime,.5);
 }catch(_){/* Audio is optional */}}
function ambient(act){if(!pad||!audioCtx||act===ambientWorld)return;ambientWorld=act;const rootFreq=82.4*Math.pow(2,(act%7)/12);pad.forEach((osc,i)=>osc.frequency.setTargetAtTime(rootFreq*[1,1.498,2][i],audioCtx.currentTime,1.1));}
function effect(type){if(!audioCtx||!options.sound)return;const config={step:[145,.04,.006],jump:[350,.12,.016],land:[95,.1,.015],ability:[650,.23,.026],boss:[110,.33,.025],star:[920,.16,.017],rescue:[540,.26,.026]};const [freq,duration,volume]=config[type]||config.step;try{
 const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();osc.type=type==='boss'?'sawtooth':'sine';osc.frequency.setValueAtTime(freq,audioCtx.currentTime);osc.frequency.exponentialRampToValueAtTime(Math.max(40,freq*.64),audioCtx.currentTime+duration);gain.gain.setValueAtTime(volume,audioCtx.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+duration);osc.connect(gain);gain.connect(audioCtx.destination);osc.start();osc.stop(audioCtx.currentTime+duration);
 }catch(_){}}
root.GameQuality={init,net,interpolationDelay,predictionLead,stats,sample,apply,ambient,effect,audioUnlock,setSound,settings:()=>({...options})};
})(typeof window!=='undefined'?window:globalThis);