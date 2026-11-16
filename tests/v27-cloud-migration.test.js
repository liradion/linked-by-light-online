'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path');
test('v27 dedicated encryption key reads v26 legacy room snapshots and persists new ones',{timeout:9000},()=>{
 const script=[
 "const assert=require('node:assert/strict'),crypto=require('node:crypto');",
 "const service='sb_secret_test_only_secret_server_key_123456789';",
 "let db=[];",
 "const reply=(status,payload)=>({ok:status>=200&&status<300,status,json:async()=>payload,text:async()=>JSON.stringify(payload)});",
 "global.fetch=async(url,opts)=>{const data=opts.body?JSON.parse(opts.body):null;if(opts.method==='POST'){db=data;return reply(201,db);}if(opts.method==='GET')return reply(200,db);throw Error('Unexpected request');};",
 "const oldKey=crypto.createHash('sha256').update('linked-light-room-state-v1:'+service).digest();",
 "function legacyEncrypt(payload){const nonce=Buffer.alloc(12,7),cipher=crypto.createCipheriv('aes-256-gcm',oldKey,nonce);const out=Buffer.concat([cipher.update(JSON.stringify(payload)),cipher.final()]);return [nonce,cipher.getAuthTag(),out].map(x=>x.toString('base64url')).join('.');}",
 "const cloud=require('./cloud-store');",
 "const original={version:11,rooms:[{code:'ABCDEF',game:{stage:122},seats:[]}]};",
 "(async()=>{db=[{id:'server',encrypted:legacyEncrypt(original)}];assert.deepEqual(await cloud.loadRooms(),original);const next={version:11,savedAt:123456789,rooms:[]};assert.equal(await cloud.saveRooms(next),true);assert.deepEqual(await cloud.loadRooms(),next);assert.notEqual(db[0].encrypted,legacyEncrypt(next));})().catch(e=>{console.error(e);process.exitCode=1;});"
 ].join('\n');
 const res=spawnSync(process.execPath,['-e',script],{cwd:path.resolve(__dirname,'..'),encoding:'utf8',timeout:7000,
  env:{...process.env,SUPABASE_URL:'https://test.supabase.co',
   SUPABASE_SECRET_KEY:'sb_secret_test_only_secret_server_key_123456789',
   LL_ROOM_ENCRYPTION_KEY:'5a'.repeat(32),LL_V27_ARCHIVE:'0'}});
 assert.equal(res.status,0,res.stderr||res.stdout);
});
test('v27 migration is additive, disables public access and bounds history',()=>{
 const sql=fs.readFileSync(path.join(__dirname,'../database/migrations/20261116_v27_room_checkpoints.sql'),'utf8');
 assert.match(sql,/CREATE TABLE IF NOT EXISTS public\.linked_light_room_snapshots/i);
 assert.match(sql,/ENABLE ROW LEVEL SECURITY/i);
 assert.match(sql,/REVOKE ALL .* anon, authenticated/i);
 assert.match(sql,/OFFSET 24/);
 assert.doesNotMatch(sql,/DROP TABLE.*linked_light_room_state/i);
});
