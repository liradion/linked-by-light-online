'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const room=require('../public/room-authority');

const src=file=>fs.readFileSync(path.resolve(__dirname,'../public',file),'utf8');

test('v28 host adapter preserves old rooms and denies untrusted ownership',()=>{
 assert.equal(room.isHost({},0),true,'legacy Spark creates room');
 assert.equal(room.isHost({},1),false,'legacy Echo is a guest');
 assert.equal(room.isHost({},-1),false,'spectator is not host');
 assert.equal(room.isHost({isHost:()=>true},1),true,'Echo may host when server says so');
 assert.equal(room.isHost({isHost:()=>false},0),false,'Spark is a guest when Echo hosts');
 assert.equal(room.isHost({isHost:()=>false},1),false);
 assert.equal(room.isHost({isHost:()=>true},0),true);
 for(const value of [undefined,null,0,1,'true',{},[]])
  assert.equal(room.isHost({isHost:()=>value},0),false,'invalid callback cannot grant ownership');
 assert.equal(room.isHost({isHost:true},0),true,'non-function callback uses legacy fallback');
 assert.equal(room.isHost(null,1),false);
});

test('v20/v21/v23 chapter management uses one host adapter; physical abilities stay role-specific',()=>{
 const index=src('index.html'),ref='/room-authority.js?v=1';
 assert.ok(index.includes(ref));
 assert.ok(index.indexOf(ref)<index.indexOf('/v20.js?v=20.1'));
 assert.ok(index.indexOf(ref)<index.indexOf('/v21.js?v=21.3'));
 assert.ok(index.indexOf(ref)<index.indexOf('/v23plus.js?v=26.1'));
 const v20=src('v20.js');
 assert.match(v20,/GameRoomAuthority\?\.isHost\(api,role\)/);
 assert.match(v20,/const start=button\(canLead\?/);
 assert.match(v20,/if\(canLead\)\{const levels=/);
 assert.match(v20,/button\(role===0\?'◷ Заморозить часы'/,'time powers are character abilities, not host powers');

 const v21=src('v21.js');
 assert.match(v21,/GameRoomAuthority\?\.isHost\(api,role\)/);
 assert.match(v21,/if\(canLead\)\{\s+const g=node\('div','v21-levels'\)/);
 assert.match(v21,/push\('Направить ветер','weather_wind',\{\},role!==0\)/);

 const future=src('v23plus.js');
 assert.match(future,/GameRoomAuthority\?\.isHost\(api,role\(\)\)/);
 assert.match(future,/if\(canLead\(\)\)\{\s+const unlocked=state\?\.v23Unlocked/);
 for(const pattern of [
  /recipe_select',\{value:i\}\),!host\)/,
  /expedition_start'\),!host\|\|/,
  /craft',\{value:v\}\),!host\|\|/,
  /minigame_start',\{value:v\}\),!host\)/,
  /v25Generate',\{mode:'daily'\}\),!canLead\(\)\)/,
  /v25Generate',\{seed:n,mode:'custom'\}\);\s+\},!canLead\(\)\)/
 ])assert.match(future,pattern);
 assert.match(future,/push\('✦ Искра: перевернуть гравитацию','gravity_flip',\{\},role\(\)!==0\)/,'physical puzzles retain role restrictions');
 for(const name of ['v23Action','v24Action','v25Generate','v26AssistVote'])
  assert.ok(future.includes("'"+name+"'"),'server message shape unchanged');
});

test('host-aware UI copy is localized without implying the host must be Spark',()=>{
 assert.match(src('v21-locale.js'),/"Попросите ведущего выбрать новый уровень\.": "Ask the host to choose a new level\."/);
 assert.match(src('v23-locale.js'),/"Новый уровень может выбрать ведущий\.": "Only the host can choose a new level\."/);
 assert.doesNotMatch(src('v21.js'),/Попросите Искру выбрать новый уровень/);
 assert.doesNotMatch(src('v23plus.js'),/Новый уровень может выбрать ведущий \(Искра\)/);
});
