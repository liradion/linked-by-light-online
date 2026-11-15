'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process'),net=require('node:net');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const adminToken='V22IntegrationAdministratorToken0123456789ABCDEF';
const freePort=()=>new Promise((resolve,reject)=>{
 const s=net.createServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{
  const n=s.address().port;s.close(()=>resolve(n));
 });
});
function startServer(port,storage,overrides={}){
 const proc=spawn(process.execPath,['server.js'],{
  cwd:path.resolve(__dirname,'..'),env:{...process.env,PORT:String(port),SAVE_DIR:storage,
   LL_ADMIN_TOKEN:adminToken,SUPABASE_URL:'',SUPABASE_SECRET_KEY:'',
   SUPABASE_SERVICE_ROLE_KEY:'',DATABASE_URL:'',BETA_MAX_ROOMS:'10',...overrides},stdio:['ignore','pipe','pipe']
 });
 let log='';proc.stderr.on('data',b=>{log=(log+b.toString()).slice(-12000);});
 proc.stdout.on('data',b=>{log=(log+b.toString()).slice(-12000);});
 proc.getLog=()=>log;
 return proc;
}
async function waitHealth(port){
 for(let i=0;i<180;i++){
  try{
   const r=await fetch('http://127.0.0.1:'+port+'/health',{signal:AbortSignal.timeout(450)});
   if(r.ok)return;
  }catch(_){}
  await sleep(50);
 }
 throw Error('Server startup failed');
}
async function stopServer(server){
 if(!server||server.exitCode!==null||server.signalCode!==null)return;
 const done=new Promise(resolve=>server.once('exit',resolve));server.kill('SIGTERM');
 await Promise.race([done,sleep(6500)]);
 if(server.exitCode===null&&server.signalCode===null)server.kill('SIGKILL');
}
function req(port,url,options={}){return fetch('http://127.0.0.1:'+port+url,{...options,signal:AbortSignal.timeout(5000)});}
function post(port,path,body,token){return req(port,path,{
 method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},
 body:JSON.stringify(body)
});}
test('v22 HTTP API, consent, moderation authentication and feedback survive controlled restart',{timeout:24000},async()=>{
 const port=await freePort(),dir=fs.mkdtempSync(path.join(os.tmpdir(),'linked-beta-test-'));
 let server;
 try{
  server=startServer(port,dir);await waitHealth(port);
  const ver=await (await req(port,'/version')).json();
  assert.equal(ver.version,'26.0.0');assert.equal(ver.protocol,4);
  for(const file of ['/beta.js','/beta.css','/privacy.html','/terms.html']){
   const resp=await req(port,file);assert.equal(resp.status,200,file);
  }
  const statusResponse=await req(port,'/api/beta/status');
  assert.equal(statusResponse.status,200);
  assert.equal(statusResponse.headers.get('cache-control'),'no-store');
  const status=await statusResponse.json();
  assert.equal(status.roomCapacity,10);assert.equal(status.diskConfigured,true);
  assert.equal(status.cloudConfigured,false);assert.equal(status.galleryModeration,true);
  const unauth=await req(port,'/api/admin/v22/overview');
  assert.equal(unauth.status,404);
  const noConsent=await post(port,'/api/beta/feedback',{
   kind:'bug',message:'На iPhone прыжок задерживается',consent:false
  });
  assert.equal(noConsent.status,400);
  const noOrigin=await req(port,'/api/beta/feedback',{method:'POST',
   headers:{'Content-Type':'application/json',Origin:'https://attacker.example'},
   body:JSON.stringify({kind:'bug',message:'На iPhone прыжок задерживается',consent:true})});
  assert.equal(noOrigin.status,403);
  const accepted=await post(port,'/api/beta/feedback',{
   kind:'bug',consent:true,message:'В первый раз не получилось подключиться из Safari',
   stage:112,rating:4,platform:'iphone',
   room:'PRIVATE_ROOM',sessionToken:'SHOULD_NOT_BE_STORED'
  });
  assert.equal(accepted.status,202);
  const response=await accepted.json();
  assert.equal(response.ok,true);assert.match(response.reference,/^[0-9a-f]{16}$/);
  const before=await (await req(port,'/api/admin/v22/overview',{
   headers:{Authorization:'Bearer '+adminToken}
  })).json();
  assert.equal(before.feedback.length,1);
  assert.equal(before.feedback[0].message,'В первый раз не получилось подключиться из Safari');
  assert.equal(before.feedback[0].room,undefined);
  assert.equal(before.ops.feedbackCount,1);
  assert.equal(before.ops.counters.feedbackReceived,1);
  assert.equal(before.ops.roomCapacity,10);
  await stopServer(server);
  assert.ok(fs.existsSync(path.join(dir,'linked-light-rooms-v11.json')));
  server=startServer(port,dir);await waitHealth(port);
  const restored=await (await req(port,'/api/admin/v22/overview',{
   headers:{Authorization:'Bearer '+adminToken}
  })).json();
  assert.equal(restored.feedback.length,1);
  assert.equal(restored.feedback[0].id,response.reference);
 }finally{
  await stopServer(server);fs.rmSync(dir,{recursive:true,force:true});
 }
});
test('v22 refuses unauthorized moderation attempts and validates decisions',{timeout:14000},async()=>{
 const port=await freePort();let server;
 try{
  server=startServer(port,'');await waitHealth(port);
  const fake=await post(port,'/api/admin/v22/gallery',{id:'bad',decision:'approve'});
  assert.equal(fake.status,404);
  const invalid=await post(port,'/api/admin/v22/gallery',{id:'bad',decision:'approve'},adminToken);
  assert.equal(invalid.status,400);
  const ops=await req(port,'/api/admin/v22/overview',{headers:{Authorization:'Bearer '+adminToken}});
  assert.equal(ops.status,200);assert.equal((await ops.json()).pendingGallery.length,0);
 }finally{await stopServer(server);}
});

test('v26 first rollout caps room capacity on Render even if old dashboard setting is 200',{timeout:15000},async()=>{
 const port=await freePort();
 const srv=startServer(port,'',{RENDER:'true',RENDER_GIT_COMMIT:'1234567890abcdef',BETA_MAX_ROOMS:'200'});
 try{
  await waitHealth(port);
  const status=await (await req(port,'/api/beta/status')).json();
  assert.equal(status.version,'26.0.0');
  assert.equal(status.roomCapacity,5);
 }finally{await stopServer(srv);}
});
