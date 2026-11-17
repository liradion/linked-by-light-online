'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('commercial clean-play UI has loadable JS/CSS and versioned references',()=>{
 const js=read('public/play-ui.js'),css=read('public/play-ui.css'),html=read('public/index.html');
 assert.doesNotThrow(()=>new vm.Script(js));
 assert.match(html,/\/play-ui\.js\?v=27\.8/);
 assert.match(html,/\/play-ui\.css\?v=27\.9/);
 assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length);
});
test('first-run invitation and room UI are device-agnostic',()=>{
 const beta=read('public/beta.js'),client=read('public/client.js'),html=read('public/index.html');
 assert.doesNotMatch(beta,/setTimeout\(\(\)=>\{if\(!saved\(\)/);
 assert.match(beta,/id='betaQuickStart'/);
 assert.match(client,/id='shareInviteBtn'/);
 assert.match(client,/typeof navigator\.share==='function'/);
 assert.match(client,/navigator\.clipboard\.writeText\(message/);
 assert.match(html,/\/client\.js\?v=26\.7/);
 assert.match(html,/\/play-ui\.css\?v=27\.9/);
});
test('clean-play preserves original primary inputs and recovery controls',()=>{
 const html=read('public/index.html'),css=read('public/play-ui.css'),js=read('public/play-ui.js');
 for(const k of ['left','right','jump','ability','bond','emote'])
  assert.match(html,new RegExp('data-input="'+k+'"'));
 assert.match(js,/id='cleanPlayEntry'/);
 assert.match(js,/id='cleanPlayToggle'/);
 assert.match(js,/gameFrame\.append\(cleanToggle\)/);
 assert.match(js,/localStorage\.setItem\(storageKey/);
 assert.match(css,/html\.clean-play-mode \.clean-play-toggle\{z-index:12!important\}/);
 assert.match(css,/html\.clean-play-mode #touchControls\.clean-show-extra \.adv-extra-controls/);
 // Both base and late-game action controls must remain wired to *original* handlers.
 assert.match(js,/\.v20-quick button/);
 assert.match(js,/originals\[i\]\.click\(\)/);
 assert.match(js,/GameV21\?\.open\('level'\)/);
 assert.match(js,/GameFuture\?\.open\('physics'\)/);
});
test('clean-play does not hide required overlays, errors and dialogs',()=>{
 const css=read('public/play-ui.css');
 for(const forbidden of [/html\.clean-play-mode\s+\.overlay\s*[,\{]/,/html\.clean-play-mode\s+\.banner\s*[,\{]/,/html\.clean-play-mode\s+\.toast\s*[,\{]/])
  assert.doesNotMatch(css,forbidden);
 assert.match(css,/\.clean-context-actions\[hidden\]\{display:none!important\}/);
});

test('demo has independent entry, server flag and isolated campaign awards',()=>{
 const html=read('public/index.html'),client=read('public/client.js'),adventure=read('public/adventure.js');
 assert.match(html,/id="demoBtn"/);
 assert.match(html,/id="demoBackBtn"/);
 assert.match(html,/\/shared\/demo-mode\.js\?v=1/);
 assert.match(client,/demo:pendingDemo/);
 assert.match(client,/demoMode=s\.demo===true/);
 assert.match(client,/!demoMode&&!s\.customLevel/);
 assert.match(adventure,/if\(s\.demo===true\)/);
});

test('content-alpha hint resources are loaded and never hidden by clean mode',()=>{
 const html=read('public/index.html'),client=read('public/client.js'),ui=read('public/play-ui.js'),css=read('public/play-ui.css');
 const hints=read('public/game-hints.js');
 assert.doesNotThrow(()=>new vm.Script(hints));
 assert.match(html,/\/game-hints\.js\?v=3/);
 assert.ok(html.indexOf('/game-hints.js?v=3')<html.indexOf(html.match(/\/client\.js\?v=[0-9.]+/)[0]));
 assert.match(client,/GameHints\.init\(/);
 assert.match(client,/GameHints\.onSnapshot\(s\)/);
 assert.match(ui,/'#gameHintBtn'/);
 assert.match(css,/#gameHintPanel\[hidden\]\{display:none!important\}/);
 assert.match(css,/html\.clean-play-mode #gameHintCleanBtn:not\(\[hidden\]\)/);
});

test('header control selectors survive new settings and plugin buttons',()=>{
 const ui=read('public/play-ui.js'),hint=read('public/game-hints.js'),beta=read('public/beta.js');
 for(const source of [ui,hint,beta])assert.doesNotMatch(source,/div:last-child/);
 assert.match(ui,/:scope > div:last-of-type/);
 assert.match(hint,/\.topline > div:last-of-type/);
 assert.match(beta,/\.topline > div:last-of-type/);
});

test('remappable keyboard controls initialize before client and retain native touch controls',()=>{
 const html=read('public/index.html'),client=read('public/client.js'),menu=read('public/play-ui.js');
 const kb=read('public/keybinds.js');
 assert.doesNotThrow(()=>new vm.Script(kb));
 assert.match(html,/\/keybinds\.js\?v=1/);
 assert.ok(html.indexOf('/keybinds.js?v=1')<html.indexOf(html.match(/\/client\.js\?v=[0-9.]+/)[0]));
 assert.match(html,/id="amberControlsGuide"/);
 assert.match(html,/id="blueControlsGuide"/);
 assert.match(client,/GameControls\.keyFor\(role,'right'\)/);
 assert.match(client,/GameControls\.normalize\(e\.key\)/);
 assert.match(client,/GameControls\.init\(\{onChange:/);
 assert.match(menu,/'#controlsOpen'/);
});

test('gamepad binding module loads before quality and client and preserves touch control markup',()=>{
 const html=read('public/index.html'),ui=read('public/play-ui.js');
 const module=read('public/gamepad-bindings.js'),quality=read('public/quality.js'),client=read('public/client.js');
 assert.doesNotThrow(()=>new vm.Script(module));
 assert.match(html,/\/gamepad-bindings\.js\?v=1/);
 assert.ok(html.indexOf('/gamepad-bindings.js?v=1')<html.indexOf('/quality.js?v=15.2'));
 assert.ok(html.indexOf('/quality.js?v=15.2')<html.indexOf('/client.js?v=26.7'));
 assert.match(client,/GamePadBindings\.init\(\)/);
 assert.match(quality,/root\.GamePadBindings/);
 assert.match(ui,/'#gamepadOpen'/);
 assert.match(html,/data-input="ability"/);
 assert.match(read('public/play-ui.css'),/\.gamepad-dialog/);
});
