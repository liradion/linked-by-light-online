'use strict';
// Optional server-side Supabase PostgREST adapter. Never send service credentials to the browser.
const crypto=require('node:crypto');
const URL_BASE=process.env.SUPABASE_URL||'';
const SERVICE_KEY=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY||'';
const active=/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(URL_BASE)&&SERVICE_KEY.length>20;
const base=URL_BASE.replace(/\/$/,'');
const LIMIT=80_000;
function fingerprint(key){return crypto.createHash('sha256').update('linked-light-cloud:v1:'+key).digest('hex');}
function validateKey(key){return typeof key==='string'&&/^[a-f0-9]{48}$/i.test(key);}
function cipherKey(key){return crypto.hkdfSync('sha256',Buffer.from(key,'hex'),Buffer.from('linked-light-v1'),Buffer.from('profile'),32);}
function encrypt(key,obj){const nonce=crypto.randomBytes(12);const c=crypto.createCipheriv('aes-256-gcm',cipherKey(key),nonce);const plain=JSON.stringify(obj);if(Buffer.byteLength(plain)>LIMIT)throw Error('payload too large');const ciphertext=Buffer.concat([c.update(plain),c.final()]);return [nonce,c.getAuthTag(),ciphertext].map(x=>x.toString('base64url')).join('.');}
function decrypt(key,encoded){const bits=String(encoded).split('.');if(bits.length!==3)throw Error('invalid blob');const [nonce,tag,ciphertext]=bits.map(x=>Buffer.from(x,'base64url'));if(nonce.length!==12||tag.length!==16||ciphertext.length>LIMIT)throw Error('invalid cipher');const c=crypto.createDecipheriv('aes-256-gcm',cipherKey(key),nonce);c.setAuthTag(tag);return JSON.parse(Buffer.concat([c.update(ciphertext),c.final()]).toString('utf8'));}
async function query(method,table,where,body,extraHeaders={}){
 if(!active)throw Error('not configured');
 const url=base+'/rest/v1/'+table+(where?'?'+where:'');
 const response=await fetch(url,{method,headers:{'apikey':SERVICE_KEY,...(SERVICE_KEY.startsWith('sb_secret_')?{}:{'Authorization':'Bearer '+SERVICE_KEY}),'Content-Type':'application/json','Prefer':'return=representation',...extraHeaders},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(8000)});
 if(!response.ok){const details=(await response.text()).slice(0,300);throw Error('cloud storage HTTP '+response.status+': '+details);}
 const res=await response.json();return Array.isArray(res)?res:[];
}
async function read(key){if(!validateKey(key))throw Error('invalid recovery key');const id=fingerprint(key);
 const rows=await query('GET','linked_light_cloud_saves','id=eq.'+id+'&select=revision,encrypted',null);
 if(!rows.length)return {revision:0,payload:null};
 return {revision:Number(rows[0].revision),payload:decrypt(key,rows[0].encrypted)};
}
async function write(key,payload,expectedRevision){if(!validateKey(key))throw Error('invalid recovery key');
 if(!Number.isSafeInteger(expectedRevision)||expectedRevision<0)throw Error('invalid revision');
 if(!payload||typeof payload!=='object'||Array.isArray(payload)||payload.version!==11)throw Error('invalid profile');
 const encrypted=encrypt(key,payload),id=fingerprint(key);
 if(expectedRevision===0){
  try{const rows=await query('POST','linked_light_cloud_saves','',{id,revision:1,encrypted});if(!rows.length)throw Error('empty write');return {revision:1};}
  catch(e){if(/409|23505/.test(e.message))return {conflict:true};throw e;}
 }
 const rows=await query('PATCH','linked_light_cloud_saves','id=eq.'+id+'&revision=eq.'+expectedRevision,{revision:expectedRevision+1,encrypted});
 return rows.length?{revision:expectedRevision+1}:{conflict:true};
}
// Server-only encrypted room checkpoints. These never expose seat tokens to clients.
const roomKey=crypto.createHash('sha256').update('linked-light-room-state-v1:'+SERVICE_KEY).digest();
function protectRooms(obj){const nonce=crypto.randomBytes(12),c=crypto.createCipheriv('aes-256-gcm',roomKey,nonce);
 const plain=JSON.stringify(obj);if(Buffer.byteLength(plain)>2_000_000)throw Error('room state too large');
 const encrypted=Buffer.concat([c.update(plain),c.final()]);
 return [nonce,c.getAuthTag(),encrypted].map(b=>b.toString('base64url')).join('.');}
function unprotectRooms(blob){const parts=String(blob).split('.').map(x=>Buffer.from(x,'base64url'));
 if(parts.length!==3||parts[0].length!==12||parts[1].length!==16||parts[2].length>2_000_000)throw Error('bad room checkpoint');
 const c=crypto.createDecipheriv('aes-256-gcm',roomKey,parts[0]);c.setAuthTag(parts[1]);
 return JSON.parse(Buffer.concat([c.update(parts[2]),c.final()]).toString('utf8'));}
async function saveRooms(state){if(!active)return false;
 await query('POST','linked_light_room_state','on_conflict=id',
 [{id:'server',encrypted:protectRooms(state)}],{'Prefer':'resolution=merge-duplicates,return=representation'});
 return true;}
async function loadRooms(){if(!active)return null;
 const rows=await query('GET','linked_light_room_state','id=eq.server&select=encrypted',null);
 return rows.length?unprotectRooms(rows[0].encrypted):null;}
const memory=new Map();
function reply(res,status,obj){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(obj));}
async function handle(req,res){const pathname=new URL(req.url,'http://localhost').pathname;if(!pathname.startsWith('/api/cloud/'))return false;
 if(pathname==='/api/cloud/status'){reply(res,200,{enabled:active});return true;}
 if(!['/api/cloud/read','/api/cloud/write'].includes(pathname)||req.method!=='POST'){reply(res,404,{error:'not found'});return true;}
 if(!active){reply(res,503,{error:'Облачное сохранение не подключено к серверу.'});return true;}
 const remote=String(req.socket.remoteAddress||'unknown'),now=Date.now();const old=memory.get(remote)||{start:now,count:0};if(now-old.start>60000){old.start=now;old.count=0;}old.count++;memory.set(remote,old);
 if(old.count>30){reply(res,429,{error:'Слишком много запросов'});return true;}
 let raw='';try{
  for await(const chunk of req){raw+=chunk.toString('utf8');if(raw.length>LIMIT*2)throw Error('too large');}
  const body=JSON.parse(raw);if(!validateKey(body.key))throw Error('Неверный ключ восстановления');
  const data=pathname.endsWith('/read')?await read(body.key):await write(body.key,body.payload,body.revision);
  reply(res,data.conflict?409:200,data);
 }catch(e){reply(res,/too large|Неверный|invalid/.test(e.message)?400:503,{error:/HTTP|timeout/.test(e.message)?'Хранилище временно недоступно':e.message.slice(0,120)});}
 return true;
}
module.exports={active,read,write,handle,encrypt,decrypt,validateKey,fingerprint,saveRooms,loadRooms};