'use strict';
// Actual Electron-in-Windows-runner smoke with an isolated local authoritative server.
// Does not replace physical Windows 10/11, iPhone, Steamworks or network-beta evidence.
const {spawn}=require('node:child_process');
const path=require('node:path');
const {_electron}=require('playwright');
const assert=require('node:assert/strict');

const ROOT=path.resolve(__dirname,'../../..');
const PORT='43991';
const BASE='http://127.0.0.1:'+PORT+'/';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function serverReady(){
 for(let i=0;i<150;i++){
  try{
   const response=await fetch(BASE+'health',{signal:AbortSignal.timeout(1000)});
   if(response.ok)return;
  }catch(_){}
  await sleep(150);
 }
 throw Error('Local game server did not become ready');
}
(async()=>{
 const server=spawn(process.execPath,[path.join(ROOT,'server.js')],{
  cwd:ROOT,stdio:'pipe',
  env:{...process.env,PORT,RENDER:'',RENDER_SERVICE_ID:'',RENDER_GIT_COMMIT:'',
   SAVE_DIR:'',LL_REQUIRE_DURABLE_STORAGE:'0',SUPABASE_URL:'',SUPABASE_SECRET_KEY:'',SUPABASE_SERVICE_ROLE_KEY:''}
 });
 let app;
 try{
  await serverReady();
  app=await _electron.launch({
   args:[path.resolve(__dirname,'..')],
   cwd:path.resolve(__dirname,'..'),
   timeout:60000,
   env:{...process.env,M5_ALLOW_LOOPBACK_DEV:'1',M5_GAME_URL:BASE}
  });
  const page=await app.firstWindow();
  await page.locator('#createBtn').waitFor({timeout:25000});
  const dismiss=page.locator('#betaQuickStart .beta-quickstart-dismiss');
  if(await dismiss.isVisible())await dismiss.click();
  await page.locator('#createBtn').click();
  await page.waitForFunction(()=>/^[A-HJ-NP-Z2-9]{6}$/.test(
   document.querySelector('#roomCode')?.textContent?.trim()||''),null,{timeout:20000});
  assert.equal(await page.locator('#overlay').getAttribute('data-view'),'lobby');
  const title=await page.title();
  assert.ok(title.length>0);
  console.log(JSON.stringify({status:'PASS',kind:'electron-first-window-create-room',
   stage:'M5-internal-only',testedOrigin:BASE,auth:'none',environment:'GitHub Windows VM'}));
 }finally{
  try{await app?.close();}catch(_){}
  server.kill('SIGTERM');
 }
})().catch(e=>{console.error('M5 desktop smoke failed:',e.message);process.exitCode=1;});
