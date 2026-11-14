'use strict';
/**
 * Server-side Supabase Google OAuth (social PKCE), secure session cookies and
 * account-bound encrypted cloud saves. No OAuth/Supabase secret enters the UI.
 */
const crypto=require('node:crypto');
const {URL}=require('node:url');
const FALLBACK_ORIGIN='https://linked-by-light-online.onrender.com';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const b64=b=>Buffer.from(b).toString('base64url');
const hash=value=>b64(crypto.createHash('sha256').update(value).digest());
const random=n=>b64(crypto.randomBytes(n));
const json=(res,status,body)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','Pragma':'no-cache','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body));};
const cookieParts=req=>Object.fromEntries(String(req.headers.cookie||'').split(';').map(x=>x.trim()).filter(Boolean).map(x=>{const i=x.indexOf('=');return [x.slice(0,i),x.slice(i+1)];}).filter(([key])=>key));
function createAuth(options={}){
 const cloud=options.cloud||require('./cloud-store');
 const key=options.serviceKey??process.env.SUPABASE_SECRET_KEY??process.env.SUPABASE_SERVICE_ROLE_KEY??'';
 const supa=String(options.supabaseUrl??process.env.SUPABASE_URL??'').replace(/\/$/,'');
 const configured=options.origin??process.env.GAME_ORIGIN??process.env.RENDER_EXTERNAL_URL??FALLBACK_ORIGIN;
 const origin=new URL(configured).origin;
 const enabled=!!(cloud.active&&/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supa)&&key.length>20);
 const fetcher=options.fetchFn||globalThis.fetch;
 const secure=origin.startsWith('https:');
 const oauthCookie=(secure?'__Host-':'')+'ll_oauth';
 const sessionCookie=(secure?'__Host-':'')+'ll_session';
 const appKey=crypto.createHash('sha256').update('linked-light-auth-v1:'+key).digest();
 const savePepper=options.savePepper??process.env.GAME_ACCOUNT_SECRET??key;
 const limits=new Map();
 function limited(req,type,limit=40){const host=String(req.socket?.remoteAddress||'unknown'),id=host+':'+type,now=Date.now();let item=limits.get(id);
  if(!item||now-item.start>=60000)item={start:now,count:0};item.count++;limits.set(id,item);
  if(limits.size>15000){for(const [k,v] of limits){if(now-v.start>120000)limits.delete(k);}if(limits.size>15000)limits.clear();}
  return item.count>limit;
 }
 function seal(value,purpose){const iv=crypto.randomBytes(12);const cipher=crypto.createCipheriv('aes-256-gcm',appKey,iv);
  cipher.setAAD(Buffer.from(purpose));const text=Buffer.from(JSON.stringify(value));if(text.length>2600)throw Error('session too large');
  const data=Buffer.concat([cipher.update(text),cipher.final()]);return [iv,cipher.getAuthTag(),data].map(b64).join('.');
 }
 function unseal(value,purpose){if(typeof value!=='string'||value.length>5000)throw Error('bad cookie');
  const parts=value.split('.').map(x=>Buffer.from(x,'base64url'));if(parts.length!==3||parts[0].length!==12||parts[1].length!==16||parts[2].length>2600)throw Error('bad cookie');
  const decipher=crypto.createDecipheriv('aes-256-gcm',appKey,parts[0]);decipher.setAAD(Buffer.from(purpose));decipher.setAuthTag(parts[1]);
  return JSON.parse(Buffer.concat([decipher.update(parts[2]),decipher.final()]).toString('utf8'));
 }
 function readCookie(req,name,purpose){try{return unseal(cookieParts(req)[name],purpose);}catch(_){return null;}}
 function cookie(name,value,age){const bits=[`${name}=${value}`,'Path=/','HttpOnly','SameSite=Lax',`Max-Age=${age}`];if(secure)bits.push('Secure');return bits.join('; ');}
 function setCookie(res,name,value,age){const old=res.getHeader('Set-Cookie')||[];res.setHeader('Set-Cookie',[...Array.isArray(old)?old:[old],cookie(name,value,age)]);}
 function clearCookie(res,name){setCookie(res,name,'',0);}
 function accountKey(userId){return crypto.createHmac('sha256',savePepper).update('linked-light-google-account:v1:'+userId).digest('hex').slice(0,48);}
 function freshReturnPath(path){return /^\/\?room=[A-HJ-NP-Z2-9]{6}$/.test(path||'')?path:'/';}
 async function authFetch(endpoint,init={}){
  const response=await fetcher(supa+'/auth/v1/'+endpoint,{...init,headers:{apikey:key,'Content-Type':'application/json',...init.headers},signal:AbortSignal.timeout(8000),redirect:'error'});
  let data;try{data=await response.json();}catch(_){data={};}
  if(!response.ok)throw Object.assign(Error('Supabase auth response'),{status:response.status});return data;
 }
 async function fetchUser(access){if(typeof access!=='string'||access.length<20)return null;
  try{const data=await authFetch('user',{method:'GET',headers:{Authorization:'Bearer '+access}});return UUID.test(data?.id||'')?data:null;}catch(_){return null;}
 }
 function saveSession(res,data){if(typeof data.access_token!=='string'||typeof data.refresh_token!=='string')throw Error('incomplete auth token');
  const seconds=Math.max(60,Math.min(Number(data.expires_in)||3600,86400));
  setCookie(res,sessionCookie,seal({access:data.access_token,refresh:data.refresh_token,expires:Date.now()+seconds*1000},'session'),60*60*24*14);
 }
 async function current(req,res){let s=readCookie(req,sessionCookie,'session');if(!s||!s.access||!s.refresh)return null;
  if(s.expires<Date.now()+90_000){try{const refreshed=await authFetch('token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:s.refresh})});saveSession(res,refreshed);s={access:refreshed.access_token,refresh:refreshed.refresh_token,expires:Date.now()+Number(refreshed.expires_in||3600)*1000};}
    catch(_){clearCookie(res,sessionCookie);return null;}}
  let user=await fetchUser(s.access);
  if(!user){clearCookie(res,sessionCookie);return null;}
  return {user,access:s.access};
 }
 async function readJson(req,max=90000){let text='';for await(const part of req){text+=part.toString('utf8');if(Buffer.byteLength(text)>max)throw Error('too large');}
  if(!text)throw Error('empty body');return JSON.parse(text);
 }
 function postAllowed(req){return req.headers.origin===origin&&/^application\/json(?:;|$)/i.test(String(req.headers['content-type']||''));}
 function redirect(res,to){res.writeHead(303,{'Location':to,'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'});res.end();}
 async function start(req,res){if(limited(req,'google-start',8)){json(res,429,{error:'Слишком много попыток входа'});return;}
  if(!enabled){json(res,503,{error:'Google Login пока не настроен на сервере'});return;}
  const verifier=random(48);const back=freshReturnPath(new URL(req.url,origin).searchParams.get('next'));
  setCookie(res,oauthCookie,seal({verifier,back,created:Date.now(),nonce:random(16)},'oauth'),600);
  const url=new URL(supa+'/auth/v1/authorize');url.searchParams.set('provider','google');url.searchParams.set('redirect_to',origin+'/');
  url.searchParams.set('code_challenge',hash(verifier));url.searchParams.set('code_challenge_method','s256');
  res.writeHead(302,{'Location':url.href,'Cache-Control':'no-store','Referrer-Policy':'no-referrer'});res.end();
 }
 async function callback(req,res){if(limited(req,'google-callback',12)){redirect(res,'/?login_error=limited');return;}
  const params=new URL(req.url,origin).searchParams,flow=readCookie(req,oauthCookie,'oauth');clearCookie(res,oauthCookie);
  if(!enabled||!flow||!flow.verifier||Date.now()-flow.created>10*60_000||Date.now()-flow.created<0){redirect(res,'/?login_error=expired');return;}
  if(params.has('error')){redirect(res,'/?login_error=cancelled');return;}
  const code=params.get('code');if(!code||code.length>4096){redirect(res,'/?login_error=invalid');return;}
  try{
   const tokens=await authFetch('token?grant_type=pkce',{method:'POST',body:JSON.stringify({auth_code:code,code_verifier:flow.verifier})});
   const user=await fetchUser(tokens.access_token);if(!user)throw Error('No verified user');
   saveSession(res,tokens);
   const back=freshReturnPath(flow.back);redirect(res,back+(back.includes('?')?'&':'?')+'login=ok');
  }catch(e){redirect(res,'/?login_error=failed');}
 }
 async function handle(req,res){const url=new URL(req.url,origin),p=url.pathname;
  // Supabase redirects with the code to the already configured Site URL (root).
  if(p==='/'&&(url.searchParams.has('code')||url.searchParams.has('error'))){await callback(req,res);return true;}
  if(!p.startsWith('/api/auth/'))return false;
  if(!enabled&&p!=='/api/auth/me'){json(res,503,{error:'Google Login пока не настроен'});return true;}
  if(req.method==='GET'&&p==='/api/auth/google'){await start(req,res);return true;}
  if(req.method==='GET'&&p==='/api/auth/callback'){await callback(req,res);return true;}
  if(req.method==='GET'&&p==='/api/auth/me'){
   if(limited(req,'auth-me',80)){json(res,429,{error:'Слишком много запросов'});return true;}
   const session=enabled?await current(req,res):null;const user=session?.user;
   json(res,200,{enabled,authenticated:!!user,user:user?{id:user.id,email:user.email||null,name:String(user.user_metadata?.full_name||user.user_metadata?.name||'').slice(0,90),avatar:String(user.user_metadata?.avatar_url||'').slice(0,350)}:null});return true;
  }
  if(req.method==='POST'&&p==='/api/auth/logout'){
   if(!postAllowed(req)){json(res,403,{error:'Forbidden'});return true;}
   clearCookie(res,sessionCookie);json(res,200,{ok:true});return true;
  }
  if(p==='/api/auth/profile'&&(req.method==='GET'||req.method==='POST')){
   if(limited(req,'account-profile',45)){json(res,429,{error:'Слишком много запросов'});return true;}
   if(req.method==='POST'&&!postAllowed(req)){json(res,403,{error:'Forbidden'});return true;}
   const session=await current(req,res);if(!session){json(res,401,{error:'Сначала войдите через Google'});return true;}
   try{
    const userKey=accountKey(session.user.id);
    if(req.method==='GET'){const value=await cloud.read(userKey);json(res,200,value);}
    else {const body=await readJson(req,90000);
     if(!body||!Number.isSafeInteger(body.revision)||body.revision<0||!body.payload||body.payload.version!==11){json(res,400,{error:'Неверное сохранение'});return true;}
     const value=await cloud.write(userKey,body.payload,body.revision);
     json(res,value.conflict?409:200,value);
    }
   }catch(e){json(res,/too large|invalid|JSON|Неверное/.test(e.message)?400:503,{error:'Не удалось синхронизировать сохранение'});}
   return true;
  }
  json(res,404,{error:'Not found'});return true;
 }
 return {handle,enabled,origin,accountKey,_test:{seal,unseal,readCookie,limited}};
}
module.exports={createAuth};