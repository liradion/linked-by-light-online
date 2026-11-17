'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const social=require('../v21-social');

function room(hostRole){
 const r={game:{stage:112},v21World:social.roomsProfile()};
 if(hostRole!==undefined)r.hostRole=hostRole;
 return r;
}

test('legacy v21 shared melody reset remains Spark-host only',()=>{
 const r=room();
 r.v21World.melody=[{note:1,role:0}];
 assert.equal(social.act(r,1,'music_reset').ok,false);
 assert.equal(r.v21World.melody.length,1,'a guest cannot reset another player’s tune');
 assert.equal(social.act(r,0,'music_reset').ok,true);
 assert.equal(r.v21World.melody.length,0);
});

test('v28 Echo-host resets the same melody without gaining Spark’s character abilities',()=>{
 const r=room(1);
 r.v21World.melody=[{note:0,role:0},{note:5,role:1}];
 assert.equal(social.act(r,0,'music_reset').ok,false,'Spark as guest is not the owner');
 assert.equal(r.v21World.melody.length,2);
 assert.equal(social.act(r,1,'music_reset').ok,true,'Echo host can reset');
 assert.equal(r.v21World.melody.length,0);
 assert.equal(social.act(r,1,'music_note',{value:1}).ok,false,'Echo cannot steal Spark’s first note');
 assert.equal(social.act(r,0,'music_note',{value:2}).ok,true);
 assert.equal(social.act(r,1,'music_note',{value:3}).ok,true);
 assert.equal(r.v21World.melody.length,2);
});

test('invalid hostRole defaults to Spark and UI checks host permission independently',()=>{
 const r=room('1');
 assert.equal(social.act(r,1,'music_reset').ok,false);
 assert.equal(social.act(r,0,'music_reset').ok,true);
 const src=fs.readFileSync(path.resolve(__dirname,'../public/v21.js'),'utf8');
 assert.match(src,/function renderHome\(\)\{\s+const m=community\|\|\{\},role=api\.role\?\.\(\)\?\?-1;\s+const host=root\.GameRoomAuthority\?\.isHost\(api,role\)/);
 assert.match(src,/btn\('↺ Новая мелодия',\(\)=>draw\('music_reset'\),!host\)/);
});
