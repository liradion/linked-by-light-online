'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const security=require('../desktop/electron/security.cjs');
const {toIco}=require('../scripts/generate-m5-icon.cjs');
const {render}=require('../pwa-icons.js');
test('M5 Electron packaged game URL is pinned to HTTPS, no untrusted origins or native permissions',()=>{
 const production=security.RELEASE_GAME_URL;
 assert.equal(security.resolveGameUrl({M5_ALLOW_LOOPBACK_DEV:'1',M5_GAME_URL:'https://evil.example'},true),production);
 assert.equal(security.allowedNavigation('https://linked-by-light-eu.onrender.com/?room=ABCDEF'),true);
 assert.equal(security.allowedNavigation('https://evil.test/'),false);
 assert.equal(security.allowedPermission('media',production),false);
 assert.equal(security.allowedPermission('clipboard-sanitized-write',production),true);
});
test('M5 Tauri uses HTTPS/WSS first-party site without remote native capabilities',()=>{
 const conf=JSON.parse(fs.readFileSync(path.join(root,'desktop/tauri/src-tauri/tauri.conf.json'),'utf8'));
 assert.equal(conf.build.frontendDist,security.RELEASE_GAME_URL);
 assert.equal(conf.app.windows.length,0,'Only guarded Rust builder may create main window');
 assert.equal(conf.bundle.active,false,'Proof of concept must not claim store distribution');
 const rust=fs.readFileSync(path.join(root,'desktop/tauri/src-tauri/src/main.rs'),'utf8');
 assert.match(rust,/\.on_navigation\(trusted_navigation\)/);
 assert.match(rust,/NewWindowResponse::Deny/);
 assert.doesNotMatch(rust,/#\s*\[\s*tauri::command/);
 const dir=path.join(root,'desktop/tauri/src-tauri');
 assert.equal(fs.existsSync(path.join(dir,'capabilities')),false,'Do not grant remote Tauri IPC capabilities');
});
test('M5 procedural source PNG can be encoded as an ICO for Tauri build',()=>{
 const png=render(192),ico=toIco(png);
 assert.equal(ico.readUInt16LE(0),0);
 assert.equal(ico.readUInt16LE(2),1);
 assert.equal(ico.readUInt16LE(4),1);
 assert.equal(ico[6],192);assert.equal(ico[7],192);
 assert.equal(ico.readUInt32LE(14),png.length);
 assert.equal(ico.readUInt32LE(18),22);
 assert.equal(ico.subarray(22,30).toString('hex'),'89504e470d0a1a0a');
});
