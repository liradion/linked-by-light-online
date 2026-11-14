'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const net=require('node:net');
const {spawn}=require('node:child_process');
const {once}=require('node:events');
const path=require('node:path');
function randomPort(){return new Promise((resolve,reject)=>{const s=net.createServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{const n=s.address().port;s.close(()=>resolve(n));});});}
async function launch(cb){const port=await randomPort();const env={...process.env,PORT:String(port)};delete env.SUPABASE_URL;delete env.SUPABASE_SECRET_KEY;delete env.SUPABASE_SERVICE_ROLE_KEY;
 const child=spawn(process.execPath,['server.js'],{cwd:path.join(__dirname,'..'),env,stdio:['ignore','pipe','pipe']});
 try{await Promise.race([once(child.stdout,'data'),new Promise((_,reject)=>setTimeout(()=>reject(Error('start timeout')),2000))]);await cb('http://127.0.0.1:'+port);}finally{child.kill('SIGTERM');}}
test('production routes expose account state, secure static script and no room counts',{timeout:5000},async()=>launch(async base=>{
 const me=await fetch(base+'/api/auth/me');assert.equal(me.status,200);assert.deepEqual(await me.json(),{enabled:false,authenticated:false,user:null});
 const health=await fetch(base+'/health');const h=await health.json();assert.deepEqual(h,{ok:true});
 const client=await fetch(base+'/auth.js?v=13');assert.equal(client.status,200);
 const page=await fetch(base+'/');assert.equal(page.status,200);
 assert.match(page.headers.get('content-security-policy'),/script-src 'self';/);
 assert.doesNotMatch(page.headers.get('content-security-policy'),/script-src 'self' 'unsafe-inline'/);
 assert.match(await page.text(),/auth\.js\?v=13/);
 const code=await fetch(base+'/?code=stolen',{redirect:'manual'});assert.equal(code.status,303);
 assert.match(code.headers.get('location'),/login_error=expired/);
}));