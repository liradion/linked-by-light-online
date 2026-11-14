'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const {once}=require('node:events');
const {createAuth}=require('../auth-server');
const ID='00000000-0000-4000-8000-000000000001';
const KEY='sb_secret_A_test_only_non_private_development_key';
function fakeCloud(){const data=new Map();return {active:true,async read(key){return data.get(key)||{revision:0,payload:null}},async write(key,payload,rev){let old=data.get(key)||{revision:0,payload:null};if(old.revision!==rev)return{conflict:true};old={revision:rev+1,payload};data.set(key,old);return {revision:old.revision};}};}
function cookies(response){return (response.headers.getSetCookie?.()||[]).map(v=>v.split(';')[0]);}
function tokenCookie(response,name){return cookies(response).find(x=>x.startsWith(name+'='));}
function mockProvider(){let exchanges=0;return {calls:()=>exchanges,fetch:async (url,init)=>{
 if(url.includes('grant_type=pkce')){
  exchanges++;
  const body=JSON.parse(init.body);assert.ok(body.code_verifier?.length>=43);assert.equal(body.auth_code,'test-oauth-code');
  return new Response(JSON.stringify({access_token:'access_token_for_test_user_123456789',refresh_token:'refresh_token_for_test_user_123456789',expires_in:3600}),{status:200,headers:{'Content-Type':'application/json'}});
 }
 if(url.endsWith('/auth/v1/user')){
  assert.equal(init.headers.Authorization,'Bearer access_token_for_test_user_123456789');
  return new Response(JSON.stringify({id:ID,email:'test@example.com',user_metadata:{full_name:'Test player'}}),{status:200,headers:{'Content-Type':'application/json'}});
 }
 throw Error('Unexpected Supabase API request '+url);
 }};}
async function fixture(fn){const provider=mockProvider(),cloud=fakeCloud();let auth;const server=http.createServer((req,res)=>{
 auth.handle(req,res).then(handled=>{if(!handled){res.writeHead(404);res.end();}}).catch(e=>{res.writeHead(500);res.end('test '+e.message);});
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
 auth=createAuth({cloud,supabaseUrl:'https://exampleproject.supabase.co',serviceKey:KEY,origin:url,fetchFn:provider.fetch});
 try{await fn({url,auth,provider,cloud});}finally{await new Promise(r=>server.close(r));}
}
async function login(url){const start=await fetch(url+'/api/auth/google',{redirect:'manual'});
 assert.equal(start.status,302);const go=start.headers.get('location');
 const target=new URL(go);assert.equal(target.host,'exampleproject.supabase.co');assert.equal(target.searchParams.get('provider'),'google');assert.equal(target.searchParams.get('code_challenge_method'),'s256');
 assert.equal(target.searchParams.get('redirect_to'),url+'/');assert.ok(target.searchParams.get('code_challenge').length>30);
 const flow=tokenCookie(start,'ll_oauth');assert.ok(flow);
 const callback=await fetch(url+'/?code=test-oauth-code',{redirect:'manual',headers:{Cookie:flow}});
 assert.equal(callback.status,303);assert.equal(callback.headers.get('location'),'/?login=ok');
 const session=tokenCookie(callback,'ll_session');assert.ok(session);
 return {flow,session};
}
test('Google PKCE start/callback issues HTTP-only session and never exposes API secret',{timeout:8000},async()=>fixture(async({url,provider})=>{
 const {session}=await login(url);assert.equal(provider.calls(),1);
 const me=await fetch(url+'/api/auth/me',{headers:{Cookie:session}});const data=await me.json();assert.equal(data.authenticated,true);
 assert.equal(data.user.email,'test@example.com');assert.equal(data.user.name,'Test player');
 assert.equal(JSON.stringify(data).includes(KEY),false);
 assert.equal(me.headers.get('cache-control'),'private, no-store');
}));
test('Login callback without matching PKCE cookie cannot establish a session',{timeout:8000},async()=>fixture(async({url,provider})=>{
 const res=await fetch(url+'/?code=test-oauth-code',{redirect:'manual'});assert.equal(res.status,303);
 assert.match(res.headers.get('location'),/login_error=expired/);assert.equal(provider.calls(),0);
}));
test('Account saves require verified session and same-origin JSON POST',{timeout:8000},async()=>fixture(async({url})=>{
 const unauthorized=await fetch(url+'/api/auth/profile');assert.equal(unauthorized.status,401);
 const {session}=await login(url);
 const get=await fetch(url+'/api/auth/profile',{headers:{Cookie:session}});assert.deepEqual(await get.json(),{revision:0,payload:null});
 const body=JSON.stringify({revision:0,payload:{version:11,checkpoint:7,adventure:{secrets:[]},records:{}}});
 const wrong=await fetch(url+'/api/auth/profile',{method:'POST',headers:{Cookie:session,Origin:'https://evil.example','Content-Type':'application/json'},body});assert.equal(wrong.status,403);
 const correct=await fetch(url+'/api/auth/profile',{method:'POST',headers:{Cookie:session,Origin:url,'Content-Type':'application/json'},body});assert.equal(correct.status,200);assert.equal((await correct.json()).revision,1);
 const duplicate=await fetch(url+'/api/auth/profile',{method:'POST',headers:{Cookie:session,Origin:url,'Content-Type':'application/json'},body});assert.equal(duplicate.status,409);
 const reread=await fetch(url+'/api/auth/profile',{headers:{Cookie:session}});assert.equal((await reread.json()).payload.checkpoint,7);
}));
test('Session logout, tampered cookie and no-cache handling',{timeout:8000},async()=>fixture(async({url})=>{
 const {session}=await login(url);
 const forged=session.slice(0,-4)+'xxxx';
 const bad=await fetch(url+'/api/auth/me',{headers:{Cookie:forged}});assert.equal((await bad.json()).authenticated,false);
 const out=await fetch(url+'/api/auth/logout',{method:'POST',headers:{Cookie:session,Origin:url,'Content-Type':'application/json'},body:'{}'});
 assert.equal(out.status,200);assert.match(out.headers.get('set-cookie'),/Max-Age=0/);
 const csrf=await fetch(url+'/api/auth/logout',{method:'POST',headers:{Cookie:session,Origin:'https://example.net','Content-Type':'application/json'},body:'{}'});assert.equal(csrf.status,403);
}));
test('Account-derived secret is per-user and cookie payload cannot be decrypted for different purpose',()=>{
 const auth=createAuth({cloud:{active:true},supabaseUrl:'https://exampleproject.supabase.co',serviceKey:KEY,origin:'https://linked-by-light-online.onrender.com'});
 assert.notEqual(auth.accountKey(ID),auth.accountKey('00000000-0000-4000-8000-000000000002'));
 const sealed=auth._test.seal({secret:'test'},'session');assert.throws(()=>auth._test.unseal(sealed,'oauth'));
});