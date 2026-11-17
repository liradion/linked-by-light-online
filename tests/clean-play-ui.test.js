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
 assert.match(html,/\/play-ui\.js\?v=27\.4/);
 assert.match(html,/\/play-ui\.css\?v=27\.5/);
 assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length);
});
test('first-run invitation and room UI are device-agnostic',()=>{
 const beta=read('public/beta.js'),client=read('public/client.js'),html=read('public/index.html');
 assert.doesNotMatch(beta,/setTimeout\(\(\)=>\{if\(!saved\(\)/);
 assert.match(beta,/id='betaQuickStart'/);
 assert.match(client,/id='shareInviteBtn'/);
 assert.match(client,/typeof navigator\.share==='function'/);
 assert.match(client,/navigator\.clipboard\.writeText\(message/);
 assert.match(html,/\/client\.js\?v=26\.1/);
 assert.match(html,/\/play-ui\.css\?v=27\.5/);
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
