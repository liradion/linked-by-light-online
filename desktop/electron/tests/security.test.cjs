'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const p=require('../security.cjs');
test('packaged app only targets pinned HTTPS origin regardless of arbitrary environment',()=>{
 for(const env of [{},{M5_ALLOW_LOOPBACK_DEV:'1',M5_GAME_URL:'https://evil.example/'},{M5_ALLOW_LOOPBACK_DEV:'1',M5_GAME_URL:'http://127.0.0.1:43998/'}])
  assert.equal(p.resolveGameUrl(env,true),p.RELEASE_GAME_URL);
});
test('unpackaged opt-in accepts loopback HTTP only',()=>{
 assert.equal(p.resolveGameUrl({M5_ALLOW_LOOPBACK_DEV:'1',M5_GAME_URL:'http://127.0.0.1:43998/'},false),
  'http://127.0.0.1:43998/');
 for(const address of ['https://evil.example','http://192.168.1.2:43998/','file:///etc/passwd','javascript:alert(1)','http://user:pass@localhost:3000/']){
  assert.equal(p.resolveGameUrl({M5_ALLOW_LOOPBACK_DEV:'1',M5_GAME_URL:address},false),p.RELEASE_GAME_URL);
 }
});
test('game WebSocket and invite share remain same origin with exact host matching',()=>{
 const ok=['https://linked-by-light-eu.onrender.com/','https://linked-by-light-eu.onrender.com/?room=ABC123',
  'https://linked-by-light-eu.onrender.com/privacy-en.html'];
 for(const url of ok)assert.equal(p.allowedNavigation(url),true);
 for(const url of ['http://linked-by-light-eu.onrender.com/','https://linked-by-light-eu.onrender.com.evil.test/',
  'https://evil.test/','javascript:alert(1)','file:///C:/secret','https://user:pass@linked-by-light-eu.onrender.com/'])
  assert.equal(p.allowedNavigation(url),false);
});
test('only first-party policy pages are allowed in external browser',()=>{
 assert.equal(p.externalPolicyPage('https://linked-by-light-eu.onrender.com/privacy.html'),true);
 assert.equal(p.externalPolicyPage('https://linked-by-light-eu.onrender.com/terms-en.html'),true);
 assert.equal(p.externalPolicyPage('https://linked-by-light-eu.onrender.com/?room=ABCDEF'),false);
 assert.equal(p.externalPolicyPage('https://evil.test/privacy.html'),false);
});
test('permissions are denied except sanitized clipboard write for the exact game origin',()=>{
 assert.equal(p.allowedPermission('clipboard-sanitized-write',p.RELEASE_GAME_URL),true);
 for(const perm of ['media','geolocation','notifications','display-capture','openExternal','clipboard-read'])
  assert.equal(p.allowedPermission(perm,p.RELEASE_GAME_URL),false);
 assert.equal(p.allowedPermission('clipboard-sanitized-write','https://evil.test/'),false);
});
