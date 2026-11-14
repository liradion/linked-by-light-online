'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const path=require('node:path');
test('encrypted cloud REST save/reload, compare-and-set conflicts and room recovery with service key',()=>{
 const script=`
 const assert=require('node:assert/strict');
 const rows={};let requests=[];
 const response=(status,body)=>({ok:status>=200&&status<300,status,text:async()=>JSON.stringify(body),json:async()=>body});
 global.fetch=async(url,options)=>{
  const {method,headers,body}=options;requests.push({url,method,headers});
  assert.equal(headers.apikey,'sb_secret_test_only_secret_server_key_123456789');
  assert.ok(!('Authorization' in headers));
  const table=url.split('/rest/v1/')[1].split('?')[0];const query=url.split('?')[1]||'';
  const all=rows[table]||(rows[table]={});
  const id=query.match(/id=eq.([a-z0-9]+)/)?.[1];
  if(method==='GET')return response(200,all[id]?[all[id]]:[]);
  const data=JSON.parse(body),item=Array.isArray(data)?data[0]:data;
  if(method==='POST'){
   if(all[item.id]&&!query.includes('on_conflict'))return response(409,{code:'23505'});
   all[item.id]=item;return response(201,[item]);
  }
  if(method==='PATCH'){
   const expected=Number(query.match(/revision=eq.(\\d+)/)?.[1]);
   if(!all[id]||all[id].revision!==expected)return response(200,[]);
   all[id]={...all[id],...item};return response(200,[all[id]]);
  }
  throw Error(method);
 };
 const cloud=require('./cloud-store');
 assert.equal(cloud.active,true);
 const key='ab'.repeat(24);
 (async()=>{
  assert.deepEqual(await cloud.read(key),{revision:0,payload:null});
  assert.deepEqual(await cloud.write(key,{version:11,checkpoint:12},0),{revision:1});
  assert.equal((await cloud.read(key)).payload.checkpoint,12);
  assert.deepEqual(await cloud.write(key,{version:11,checkpoint:14},0),{conflict:true});
  assert.deepEqual(await cloud.write(key,{version:11,checkpoint:24},1),{revision:2});
  assert.deepEqual(await cloud.write(key,{version:11,checkpoint:20},1),{conflict:true});
  assert.equal((await cloud.read(key)).payload.checkpoint,24);
  await cloud.saveRooms({version:11,rooms:[{code:'ABCDEF',seats:[]}]});
  assert.deepEqual(await cloud.loadRooms(),{version:11,rooms:[{code:'ABCDEF',seats:[]}]});
  assert.ok(!JSON.stringify(rows).includes('checkpoint'));
 })().catch(e=>{console.error(e);process.exitCode=1;});
 `;
 const result=spawnSync(process.execPath,['-e',script],{cwd:path.join(__dirname,'..'),encoding:'utf8',timeout:12000,env:{...process.env,SUPABASE_URL:'https://test.supabase.co',SUPABASE_SECRET_KEY:'sb_secret_test_only_secret_server_key_123456789'}});
 assert.equal(result.status,0,result.stderr||result.stdout);
});