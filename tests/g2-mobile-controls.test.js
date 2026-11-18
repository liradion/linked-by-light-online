'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=name=>fs.readFileSync(path.join(__dirname,'../public',name),'utf8');
const locale=require('../public/v28-locale');

test('G2 mobile action UI is gameplay-gated and does not leak through onboarding',()=>{
 const v28=src('v28.js'),css=src('v28.css');
 assert.doesNotThrow(()=>new vm.Script(v28));
 assert.match(v28,/pingToggle\.hidden=!canUse/);
 assert.match(v28,/const canUse=api\.role\?\.\(\)>=0&&!!api\.inRoom\?\.\(\)&&api\.phase\?\.\(\)==='playing'/);
 assert.match(v28,/pingWheel\.hidden=true/);
 assert.match(css,/\.v28-ping-toggle\[hidden\].*display:none!important/);
 assert.match(css,/@media\(pointer:coarse\) and \(orientation:landscape\)/);
 assert.match(css,/safe-area-inset-right/);
 assert.match(css,/\.v28-ping-toggle:disabled/);
});

test('G2 solo switch is single-flight and is confirmed or timed out by authoritative snapshots',()=>{
 const js=src('v28.js'),client=src('client.js');
 assert.match(js,/if\(!solo\|\|switchPending\|\|!connected\|\|api\.role\?\.\(\)<0\|\|api\.phase\?\.\(\)!=='playing'\)return false/);
 assert.match(js,/switchPending=true;pendingActiveRole=target;switchRequestedAt=performance\.now\(\)/);
 assert.match(js,/activeRole===pendingActiveRole\|\|performance\.now\(\)-switchRequestedAt>2500/);
 assert.match(js,/if\(!connected\)\{switchPending=false;pendingActiveRole=-1;pingKind='';\}/);
 assert.match(client,/GameV28\.requestSoloSwitch\(\)/);
 assert.match(client,/switchSolo:targetRole=>\{resetKeys\(\);wsSend\(\{t:'v28SoloSwitch',activeRole:targetRole\}\);\}/);
 assert.doesNotMatch(client,/wsSend\(\{t:'v28SoloSwitch',activeRole:1-soloActiveRole\}\)/);
});

test('G2 accessible iPhone control names stay localized without translating private content',()=>{
 for(const [ru,en] of [
  [' Коснитесь кнопки смены героя.',' Tap the switch-hero button.'],
  ['Переключить на Эхо','Switch to Echo'],
  ['Переключить на Искру','Switch to Spark'],
  ['Поставить метку','Place a marker']
 ]){assert.equal(locale.text(ru,'en'),en);assert.equal(locale.text(ru,'ru'),ru);}
 assert.equal(locale.text('Моя частная заметка','en'),'Моя частная заметка');
 const script=src('v28.js');
 assert.match(script,/root\.matchMedia\?\.\('\(pointer:coarse\)'\)\?\.matches/);
 assert.match(script,/pingToggle\.setAttribute\('aria-label'/);
 assert.match(script,/pingToggle\.disabled=!connected\|\|\(solo&&switchPending\)/);
});
