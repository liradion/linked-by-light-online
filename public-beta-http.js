'use strict';
// Small HTTP surface for v22 Public Beta. No third-party dependencies.
function respond(res,status,body){
 res.writeHead(status,{'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'no-store','Pragma':'no-cache','X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'no-referrer','X-Frame-Options':'DENY'});
 res.end(JSON.stringify(body));
}
async function bodyJson(req,maxBytes){
 if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))
  throw Object.assign(Error('content type'),{status:415});
 let bytes=0,parts=[];
 for await(const chunk of req){
  bytes+=chunk.byteLength;
  if(bytes>maxBytes)throw Object.assign(Error('request too large'),{status:413});
  parts.push(chunk);
 }
 try{return JSON.parse(Buffer.concat(parts).toString('utf8'));}catch(_){
  throw Object.assign(Error('invalid json'),{status:400});
 }
}
function sameOrigin(req){
 if(!req.headers.origin)return true; // scripts / same-origin requests without Origin
 try{
  const origin=new URL(req.headers.origin),host=String(req.headers.host||'');
  return origin.host===host&&['https:','http:'].includes(origin.protocol);
 }catch(_){return false;}
}
function createPublicBetaHttp({beta,rooms,storageState,getGallery,onUpdate}){
 return async function handle(req,res){
  const pathname=new URL(req.url,'http://localhost').pathname;
  const publicApi=pathname.startsWith('/api/beta/');
  const adminApi=pathname.startsWith('/api/admin/v22/');
  if(!publicApi&&!adminApi)return false;
  if(!sameOrigin(req)){respond(res,403,{error:'Origin forbidden'});return true;}
  if(pathname==='/api/beta/status'&&req.method==='GET'){
   respond(res,200,beta.getStatus(rooms,storageState()));return true;
  }
  if(pathname==='/api/beta/feedback'&&req.method==='POST'){
   const ip=req.socket.remoteAddress||'unknown';
   if(!beta.allow('feedback',ip,5,3600000)){respond(res,429,{error:'Лимит отзывов достигнут'});return true;}
   try{
    const raw=await bodyJson(req,1700),saved=beta.acceptFeedback(raw);
    if(!saved){respond(res,400,{error:'Согласие и сообщение не короче 10 символов обязательны'});return true;}
    await onUpdate();
    respond(res,202,{ok:true,reference:saved.id});
   }catch(e){respond(res,e.status||503,{error:e.status===413?'Слишком длинное сообщение':'Не удалось сохранить отзыв'});}
   return true;
  }
  if(adminApi){
   if(!beta.admin(req)){respond(res,404,{error:'Not found'});return true;}
   if(pathname==='/api/admin/v22/overview'&&req.method==='GET'){
    respond(res,200,{ops:beta.getDiagnostics(rooms,storageState()),
     feedback:beta.feedbackQueue(),pendingGallery:beta.pendingGallery(getGallery())});
    return true;
   }
   if(pathname==='/api/admin/v22/gallery'&&req.method==='POST'){
    try{
     const data=await bodyJson(req,800);
     const outcome=beta.moderateGallery(getGallery(),data.id,data.decision);
     if(!outcome){respond(res,400,{error:'Неизвестная карта или решение'});return true;}
     await onUpdate();
     respond(res,200,{ok:true,...outcome});
    }catch(e){respond(res,e.status||503,{error:'Не удалось изменить состояние карты'});}
    return true;
   }
  }
  respond(res,404,{error:'Not found'});return true;
 };
}
module.exports={createPublicBetaHttp,bodyJson,sameOrigin};
