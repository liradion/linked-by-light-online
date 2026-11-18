'use strict';
// Entirely in-memory Supabase PostgREST simulator, no external network.
const {test}=require('node:test'),assert=require('node:assert/strict');
const service='sb_secret_g32_test_only_nonlive_123456789012345';
process.env.SUPABASE_URL='https://g32-test-only.supabase.co';
process.env.SUPABASE_SECRET_KEY=service;
process.env.LL_ROOM_ENCRYPTION_KEY='3b'.repeat(32);
process.env.LL_V27_ARCHIVE='1';
const slots=new Map(),archive=[];
const ok=(data,status=200)=>({ok:status>=200&&status<300,status,json:async()=>data,text:async()=>JSON.stringify(data)});
global.fetch=async(url,opts)=>{
 const u=new URL(url),table=u.pathname.slice('/rest/v1/'.length);
 const method=opts?.method||'GET';
 assert.equal(u.host,'g32-test-only.supabase.co','No real external API should be contacted');
 assert.equal(opts?.headers?.apikey,service,'Server secret must be provided in request headers');
 if(table==='linked_light_room_state'){
  if(method==='POST'){
   const rows=JSON.parse(opts.body);
   for(const row of rows)slots.set(row.id,row.encrypted);
   return ok(rows,201);
  }
  if(method==='GET'){
   const id=(u.searchParams.get('id')||'').replace(/^eq\./,'');
   return ok(slots.has(id)?[{id,encrypted:slots.get(id)}]:[]);
  }
 }
 if(table==='linked_light_room_snapshots'){
  if(method==='POST'){
   const rows=JSON.parse(opts.body);
   archive.push(...rows);
   return ok(rows,201);
  }
  if(method==='GET'){
   return ok(archive.slice().reverse().slice(0,24).map(x=>({encrypted:x.encrypted,checksum:x.checksum})));
  }
 }
 throw Error('Unexpected mock PostgREST route: '+method+' '+table);
};
const cloud=require('../cloud-store');
const token='a'.repeat(48);
const state=(savedAt,stage)=>({
 version:11,savedAt,
 rooms:[{code:'ABCDEF',hostRole:1,solo:true,soloActiveRole:0,
  game:{stage,phase:'playing'},seats:[null,{token}]}]
});

test('G3.2: encrypted v11 room state replicates in both slots and verified archive',async()=>{
 assert.equal(cloud.active,true,'Cloud mock must meet exact real adapter configuration gates');
 const a=state(10_000,2);
 assert.equal(await cloud.saveRooms(a),true);
 assert.ok(slots.has('server'));
 assert.ok(slots.has('server-v27'));
 assert.equal(archive.length,1);
 assert.deepEqual(await cloud.loadRooms(),a);
 const dump=JSON.stringify([...slots.values(),...archive]);
 assert.equal(dump.includes(token),false,'Seat secrets must remain encrypted at rest');
 assert.equal(dump.includes('"hostRole":1'),false,'Room data must remain encrypted in both slots');
});

test('G3.2: single corrupted encrypted slot falls back to the readable legacy slot',async()=>{
 const expected=state(12_000,3);
 assert.equal(await cloud.saveRooms(expected),true);
 slots.set('server-v27','corrupt-not-a-valid-aes-gcm-message');
 assert.deepEqual(await cloud.loadRooms(),expected);
});

test('G3.2: unreadable latest slots restore checksum-valid older archive, but never tampered archive',async()=>{
 slots.set('server','corrupt');
 slots.set('server-v27','corrupt');
 const recovered=await cloud.loadRooms();
 assert.deepEqual(recovered,state(10_000,2),'Archive represents a recovery point, not latest unsaved progress');
 assert.equal(recovered.rooms[0].hostRole,1);
 assert.equal(recovered.rooms[0].solo,true);
 assert.equal(recovered.rooms[0].seats[1].token,token);
 archive[0].checksum='0'.repeat(64);
 await assert.rejects(cloud.loadRooms(),/No readable room snapshot/);
});
