'use strict';
// Zero dependencies: HTTP static server + minimal RFC6455 WebSocket transport.
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {performance}=require('node:perf_hooks');
const {createBenchmarkMetrics}=require('./benchmark-metrics');
const benchmark=createBenchmarkMetrics();
const {createGame,initStage,updateInput,clearMovement,tick,snapshot}=require('./game-core');
const {stages}=require('./shared/stages');
const cloud=require('./cloud-store');
const pwaIcons=require('./pwa-icons');
const expansion=require('./expansion-core');
const v20=require('./v20-core');
const v21=require('./v21-core');
const social=require('./v21-social');
let V21_BOARD=[],V21_GALLERY=[];
const {createAuth}=require('./auth-server');
const auth=createAuth({cloud});
const PORT=Number(process.env.PORT)||3000;
const PUBLIC=path.join(__dirname,'public');
const ROOMS=new Map();
// Optional persistent session storage: point SAVE_DIR to a mounted durable disk.
// Free Render containers have ephemeral filesystems, so this does not imply cloud backup there.
const SAVE_DIR=process.env.SAVE_DIR||'';
const SAVE_FILE=SAVE_DIR?path.join(SAVE_DIR,'linked-light-rooms-v11.json'):'';
function roomBackups(){return {version:11,v21Board:V21_BOARD,v21Gallery:V21_GALLERY,rooms:Array.from(ROOMS.values()).map(r=>({
 code:r.code,seats:r.seats.map(s=>s?{token:s.token,look:s.look}:null),game:r.game,
 home:r.home||[],notes:r.notes||[],customLevel:r.customLevel||null,storyChoices:r.storyChoices||{},ending:r.ending||null,unlockedMax:r.unlockedMax,v20Unlocked:r.v20Unlocked||100,v20Home:r.v20Home||v20.cleanHome(),v20Story:r.v20Story||v20.cleanStory(),v21Unlocked:r.v21Unlocked||v21.FIRST,v21World:r.v21World||social.roomsProfile(),lastActivity:r.lastActivity,story:r.story||null}))};}
function persistRooms(){if(!SAVE_FILE)return;
 try{fs.mkdirSync(SAVE_DIR,{recursive:true});const rooms=Array.from(ROOMS.values()).map(r=>({
  code:r.code,seats:r.seats.map(s=>s?{token:s.token,look:s.look}:null),game:r.game,
  home:r.home||[],notes:r.notes||[],customLevel:r.customLevel||null,storyChoices:r.storyChoices||{},ending:r.ending||null,unlockedMax:r.unlockedMax,v20Unlocked:r.v20Unlocked||100,v20Home:r.v20Home||v20.cleanHome(),v20Story:r.v20Story||v20.cleanStory(),v21Unlocked:r.v21Unlocked||v21.FIRST,v21World:r.v21World||social.roomsProfile(),lastActivity:r.lastActivity,story:r.story||null}));
  const temp=SAVE_FILE+'.'+process.pid+'.tmp';fs.writeFileSync(temp,JSON.stringify({version:11,rooms,v21Board:V21_BOARD,v21Gallery:V21_GALLERY}),'utf8');fs.renameSync(temp,SAVE_FILE);
 }catch(e){console.warn('Session persistence failed:',e.message);}}
function hydrateRooms(parsed){if(parsed?.version!==11||!Array.isArray(parsed.rooms))return;
  V21_BOARD=social.cleanBoard(parsed.v21Board);V21_GALLERY=social.cleanGallery(parsed.v21Gallery,expansion.cleanBlueprint);
  for(const saved of parsed.rooms.slice(0,200)){
   if(!/^[A-HJ-NP-Z2-9]{6}$/.test(saved.code||''))continue;
   if(!saved.game||!Number.isSafeInteger(saved.game.stage)||saved.game.stage<0||saved.game.stage>v21.LAST)continue;
   const seats=(saved.seats||[]).slice(0,2).map(seat=>seat&&/^[0-9a-f]{48}$/.test(seat.token||'')?{token:seat.token,peer:null,online:false,look:cleanLook(seat.look)}:null);
   if(seats.length!==2||!seats[0])continue;
   const game=createGame();initStage(game,saved.game.stage);
   // Restore only expected game state fields; avoid stale socket and input queues.
   for(const key of ['players','shards','tick','padTimer','completion','transition','stats','lastResult','level','customChallenge','expansion','v20','v21'])
    if(saved.game[key]!==undefined)game[key]=saved.game[key];
   game.phase=saved.game.phase==='win'?'win':saved.game.phase==='playing'?'playing':'waiting';
   game.input.forEach(i=>{i.left=false;i.right=false;});
   ROOMS.set(saved.code,{code:saved.code,seats,game,home:cleanHome(saved.home),unlockedMax:Math.max(0,Math.min(98,Number(saved.unlockedMax)||0)),lastActivity:Date.now(),story:saved.story||null,notes:Array.isArray(saved.notes)?saved.notes.filter(n=>expansion.cleanNote(n?.text)).slice(-24).map(n=>({text:expansion.cleanNote(n.text),role:[0,1].includes(n.role)?n.role:0,at:Number(n.at)||0})):[],customLevel:expansion.cleanBlueprint(saved.customLevel),spectators:new Set(),storyChoices:saved.storyChoices&&typeof saved.storyChoices==='object'?saved.storyChoices:{},ending:saved.ending||null,v20Unlocked:Math.max(100,Math.min(v20.LAST,Number(saved.v20Unlocked)||100)),v20Home:v20.cleanHome(saved.v20Home),v20Story:v20.cleanStory(saved.v20Story),v21Unlocked:Math.max(v21.FIRST,Math.min(v21.LAST,Number(saved.v21Unlocked)||v21.FIRST)),v21World:social.cleanRoom(saved.v21World)});
  }
}
function restoreRooms(){if(!SAVE_FILE||!fs.existsSync(SAVE_FILE))return;
 try{const raw=fs.readFileSync(SAVE_FILE,'utf8');if(raw.length>8_000_000)throw Error('oversized session file');
  hydrateRooms(JSON.parse(raw));
 }catch(e){console.warn('Unable to restore rooms:',e.message);}}
async function persistRoomsCloud(){if(!cloud.active)return;
 try{await cloud.saveRooms(roomBackups());}catch(e){console.warn('Cloud room save failed:',e.message);}}
async function restoreRoomsCloud(){if(!cloud.active)return;
 try{const data=await cloud.loadRooms();if(data)hydrateRooms(data);}catch(e){console.warn('Cloud room restore failed:',e.message);}}

const ROOM_ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_ROOMS=200, MAX_PAYLOAD=4096;
// Bound stale state queued on slow mobile connections: fresh snapshots supersede old ones.
const MAX_SNAPSHOT_BACKLOG=24_000;
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.ico':'image/x-icon','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8'};

function sendFrame(socket,opcode,content=Buffer.alloc(0)){
  if(socket.destroyed||!socket.writable)return;
  const body=Buffer.isBuffer(content)?content:Buffer.from(content,'utf8');
  if(body.length>65535)return;
  const h=Buffer.alloc(body.length<126?2:4);h[0]=0x80|opcode;
  if(body.length<126)h[1]=body.length;else{h[1]=126;h.writeUInt16BE(body.length,2);}
  if(socket.writableLength<300_000)socket.write(Buffer.concat([h,body]));
}
function attachWebSocket(socket,head,onMessage,onClose){
  let buf=Buffer.alloc(0),fragment=null,closed=false,lastPong=Date.now();
  const stop=()=>{if(closed)return;closed=true;onClose();};
  const close=(code=1000)=>{if(socket.destroyed)return;const b=Buffer.alloc(2);b.writeUInt16BE(code,0);sendFrame(socket,8,b);socket.end();};
  socket.on('close',stop);socket.on('error',stop);
  socket.on('data',data=>{
    buf=Buffer.concat([buf,data]);if(buf.length>MAX_PAYLOAD+8192){close(1009);return;}
    while(buf.length>=2){
      const a=buf[0],b=buf[1],fin=!!(a&0x80),opcode=a&0x0f,masked=!!(b&0x80);
      if((a&0x70)||!masked){close(1002);return;}
      let length=b&0x7f,offset=2;
      if(length===126){if(buf.length<4)return;length=buf.readUInt16BE(2);offset=4;}
      if(length===127){close(1009);return;}
      if(length>MAX_PAYLOAD){close(1009);return;}
      if(buf.length<offset+4+length)return;
      const mask=buf.subarray(offset,offset+4),payload=Buffer.from(buf.subarray(offset+4,offset+4+length));
      buf=buf.subarray(offset+4+length);
      for(let i=0;i<length;i++)payload[i]^=mask[i%4];
      if(opcode>=8){if(!fin||length>125){close(1002);return;}if(opcode===8){close();return;}if(opcode===9)sendFrame(socket,10,payload);if(opcode===10)lastPong=Date.now();continue;}
      if(opcode===1){if(fragment){close(1002);return;}fragment=payload;}
      else if(opcode===0){if(!fragment){close(1002);return;}fragment=Buffer.concat([fragment,payload]);}
      else{close(1003);return;}
      if(fragment.length>MAX_PAYLOAD){close(1009);return;}
      if(fin){const text=fragment.toString('utf8');fragment=null;try{onMessage(JSON.parse(text));}catch(_){/* invalid packet ignored */}}
    }
  });
  if(head&&head.length)socket.emit('data',head);
  return {
    send:(data)=>{
      if(data?.t==='snapshot'&&socket.writableLength>MAX_SNAPSHOT_BACKLOG){benchmark.snapshotSkipped();return;}
      sendFrame(socket,1,JSON.stringify(data));
    },
    sendRaw:(payload,isSnapshot)=>{
      if(isSnapshot&&socket.writableLength>MAX_SNAPSHOT_BACKLOG){benchmark.snapshotSkipped();return;}
      sendFrame(socket,1,payload);
    },
    close,ping:()=>{if(Date.now()-lastPong>32_000){socket.destroy();return;}sendFrame(socket,9,Buffer.from('alive'));}
  };
}
function newCode(){for(let tries=0;tries<50;tries++){
  const code=Array.from(crypto.randomBytes(6),byte=>ROOM_ALPHABET[byte%ROOM_ALPHABET.length]).join('');
  if(!ROOMS.has(code))return code;
}throw Error('unable to create room');}
const allowedFurniture=['lamp','plant','sofa','shelf','star','rug','aquarium','telescope','fireplace','frame','garden','piano'];
const allowedSkins=['classic','sunset','aurora','royal','forest','galaxy'];
const allowedPets=['none','fox','owl','moth','cat','orb'];
const newSeat=()=>({token:crypto.randomBytes(24).toString('hex'),peer:null,online:false,look:{skin:'classic',pet:'none'}});
function cleanLook(x){return {skin:allowedSkins.includes(x?.skin)?x.skin:'classic',pet:allowedPets.includes(x?.pet)?x.pet:'none'};}
function cleanHome(x){if(!Array.isArray(x))return [];return x.slice(0,16).map(v=>({item:allowedFurniture.includes(v?.item)?v.item:'lamp',slot:Number.isInteger(v?.slot)?Math.max(0,Math.min(15,v.slot)):0}));}
function roomSnapshot(r){return {...snapshot(r.game,countOnline(r)),looks:r.seats.map(s=>s?.look||null),home:r.home||[],v20Home:r.v20Home||v20.cleanHome(),v20Story:r.v20Story||v20.cleanStory(),v20Unlocked:r.v20Unlocked||100,v21Unlocked:r.v21Unlocked||v21.FIRST,story:r.story||null,storyChoices:r.storyChoices||{},customLevel:r.customLevel||null,ending:r.ending||null};}
restoreRooms();
function countOnline(r){return r.seats.map(s=>!!s?.online);}
function sendSeatRoom(r){const obj={t:'members',room:r.code,connected:countOnline(r),phase:r.game.phase};
  for(const s of r.seats)if(s?.online)s.peer.send(obj);
  for(const peer of r.spectators||[])peer.send(obj);
}
function broadcast(r,obj){
  // Serialize authoritative state once for both players, avoiding per-socket CPU spikes.
  const payload=JSON.stringify(obj),isSnapshot=obj?.t==='snapshot';
  for(const s of r.seats)if(s?.online)s.peer.sendRaw(payload,isSnapshot);
  if(obj?.t!=='note')for(const peer of r.spectators||[])peer.sendRaw(payload,isSnapshot);
}
const server=http.createServer((req,res)=>{
  const authRequest=req.url?.startsWith('/api/auth/')||req.url?.startsWith('/?')&&/(?:\?|&)(?:code|error)=/.test(req.url);
  if(authRequest){auth.handle(req,res).catch(()=>{if(!res.headersSent){res.writeHead(500,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({error:'Ошибка авторизации'}));}});return;}
  if(req.url?.startsWith('/api/cloud/')){cloud.handle(req,res);return;}
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(benchmark.respond(req,res,ROOMS))return;
  if(pathname==='/version'){res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify({name:'Linked by Light',version:'21.0.0',protocol:3,commit:(process.env.RENDER_GIT_COMMIT||'').slice(0,12)||null}));return;}
  if(pathname==='/health'){
    res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
    res.end(JSON.stringify({ok:true}));return;
  }
  // Real PNG app icons generated once by the server (no binary assets or CDN).
  const iconSize=pathname==='/icons/icon-192.png'?192:pathname==='/icons/icon-512.png'?512:pathname==='/apple-touch-icon.png'?180:0;
  if(iconSize){
    try{res.writeHead(200,{'Content-Type':'image/png','Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'});
      res.end(pwaIcons.render(iconSize));}
    catch(_){if(!res.headersSent){res.writeHead(500);res.end('icon unavailable');}}
    return;
  }
  let file;
  if(pathname==='/shared/stages.js'||pathname==='/shared/v20-stages.js'||pathname==='/shared/v21-stages.js')file=path.join(__dirname,'shared',pathname.slice('/shared/'.length));
  else if(pathname==='/'||pathname==='/index.html')file=path.join(PUBLIC,'index.html');
  else if(/^\/[a-zA-Z0-9._-]+$/.test(pathname))file=path.join(PUBLIC,pathname.slice(1));
  else{res.writeHead(404);res.end('Not found');return;}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('Not found');return;}
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':pathname==='/sw.js'?'no-store':'no-cache',...(pathname==='/sw.js'?{'Service-Worker-Allowed':'/'}:{}),'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=()','Content-Security-Policy':"default-src 'self'; connect-src 'self' ws: wss:; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"});res.end(data);
  });
});
server.on('upgrade',(req,socket,head)=>{
  if(req.url?.split('?')[0]!=='/ws'){socket.destroy();return;}
  const origin=req.headers.origin;
  if(origin){try{if(new URL(origin).host!==req.headers.host){socket.destroy();return;}}catch(_){socket.destroy();return;}}
  const key=req.headers['sec-websocket-key'];
  if(req.headers.upgrade?.toLowerCase()!=='websocket'||req.headers['sec-websocket-version']!=='13'||typeof key!=='string'||!/^[-_a-zA-Z0-9+/=]{20,32}$/.test(key)){
    socket.destroy();return;
  }
  const accept=crypto.createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');
  socket.setNoDelay(true);
  let room=null,role=-1,peer,clientProtocol=1;
  let packetWindow=Date.now(),packetCount=0;
  const opCounts=new Map();
  function rateExceeded(action,limit){const now=Date.now(),entry=opCounts.get(action)||{start:now,count:0};
    if(now-entry.start>=60000){entry.start=now;entry.count=0;}
    entry.count++;opCounts.set(action,entry);return entry.count>limit;}
  const error=message=>peer.send({t:'error',message});
  const attach=(r,index)=>{
    if(room)return error('Вы уже находитесь в комнате.');
    const seat=r.seats[index];if(seat.online&&seat.peer){try{seat.peer.close();}catch(_){}}
    room=r;role=index;seat.online=true;seat.peer=peer;seat.protocol=clientProtocol;seat.connectionEpoch=(seat.connectionEpoch||0)+1;r.lastActivity=Date.now();
    // После обновления страницы счётчики нажатий в браузере начинаются с нуля.
    r.game.input[role].packetSeq=0;r.game.input[role].processedSeq=0;r.game.input[role].jumpSeq=0;r.game.input[role].abilitySeq=0;r.game.input[role].bondSeq=0;r.game.input[role].emoteSeq=0;clearMovement(r.game,role);r.game.input[role].resync=true;
    peer.send({t:'joined',room:r.code,role,token:seat.token,connectionEpoch:seat.connectionEpoch,protocol:3,phase:r.game.phase,connected:countOnline(r),home:r.home||[],notes:r.notes||[]});
    peer.send(roomSnapshot(r));
    peer.send({t:'v21State',data:social.publicState(r)});
    peer.send({t:'v21Private',data:social.privateState(r,index)});
    sendSeatRoom(r);
  };
  const watch=r=>{
    if(room)return error('Вы уже в комнате.');
    r.spectators=r.spectators||new Set();
    if(r.spectators.size>=4)return error('У комнаты уже четыре наблюдателя.');
    room=r;role=-1;r.spectators.add(peer);
    peer.send({t:'joined',room:r.code,role:-1,token:'',phase:r.game.phase,connected:countOnline(r),home:[],notes:[]});
    peer.send(roomSnapshot(r));
    peer.send({t:'v21State',data:social.publicState(r)});
    sendSeatRoom(r);
  };
  peer=attachWebSocket(socket,head,msg=>{
    if(!msg||typeof msg!=='object'||Array.isArray(msg))return;
    const now=Date.now();if(now-packetWindow>=2000){packetWindow=now;packetCount=0;}
    if(++packetCount>240){peer.close(1008);return;}
    if(msg.t==='ping'){peer.send({t:'pong',sent:Number.isFinite(msg.sent)?msg.sent:0});return;}
     if(msg.t==='hello'){clientProtocol=msg.protocol===3?3:msg.protocol===2?2:1;if(room&&role>=0&&room.seats[role])room.seats[role].protocol=clientProtocol;peer.send({t:'hello',protocol:3,version:'21.0.0'});return;}
    if(msg.t==='create'){
      if(rateExceeded('create',8))return error('Слишком много комнат за минуту.');
      if(room)return error('Вы уже в комнате.');
      if(ROOMS.size>=MAX_ROOMS)return error('Сервер заполнен. Попробуйте позже.');
      const code=newCode(),game=createGame(),blueprint=expansion.cleanBlueprint(msg.blueprint);
      // Progress is supplied by the host's browser; rooms still run one authoritative server state.
      const requested=Number.isSafeInteger(msg.stage)?msg.stage:0;
       if(v21.hasStage(requested)&&clientProtocol<3)return error('Оба игрока должны открыть v21 для новых испытаний.');
       if(v20.hasStage(requested)&&clientProtocol<2)return error('Обновите игру до v20, чтобы открыть новую кампанию.');
       // v19 already trusts the host browser's local checkpoint. v20 supports the
      // same noncompetitive resume model, bounded to consecutive known stage IDs.
      const ids=Array.isArray(msg.unlockedV20)?msg.unlockedV20.filter(x=>typeof x==='string').slice(0,12):[];
      let resumeMax=100;
      for(let i=100;i<=v20.LAST;i++){
        if(!ids.includes('v20-'+String(i-99).padStart(2,'0')))break;
        resumeMax=i;
      }
      const ids21=Array.isArray(msg.unlockedV21)?msg.unlockedV21.filter(x=>typeof x==='string').slice(0,10):[];
      let resume21=v21.FIRST;
      for(let i=v21.FIRST;i<=v21.LAST;i++){
        if(!ids21.includes('v21-'+String(i-v21.FIRST+1).padStart(2,'0')))break;
        resume21=i;
      }
      const saved=v21.hasStage(requested)?Math.min(requested,resume21):v20.hasStage(requested)?Math.min(requested,resumeMax):Math.max(0,Math.min(requested===99&&msg.secrets===11?99:98,requested));
      if(saved>0)initStage(game,saved);
      if(blueprint)expansion.applyBlueprint(game,blueprint);
      const r={code,seats:[newSeat(),null],game,home:cleanHome(msg.home),notes:[],customLevel:blueprint,spectators:new Set(),storyChoices:{},ending:null,unlockedMax:Math.min(98,saved),v20Unlocked:resumeMax,v20Home:v20.cleanHome(msg.v20Home),v20Story:v20.cleanStory({choices:msg.v20Choices}),v21Unlocked:resume21,v21World:social.cleanRoom(msg.v21Profile),lastActivity:Date.now()};
      ROOMS.set(code,r);attach(r,0);return;
    }
    if(msg.t==='join'){
      if(rateExceeded('join',24))return error('Слишком много попыток входа.');
      if(room)return error('Вы уже в комнате.');
      const code=typeof msg.room==='string'?msg.room.trim().toUpperCase():'';
      const r=ROOMS.get(code);if(!r)return error('Комната не найдена. Проверьте код.');
      if(v21.hasStage(r.game.stage)&&clientProtocol<3)return error('Обновите страницу до v21.');
       if(v20.hasStage(r.game.stage)&&clientProtocol<2)return error('Обновите страницу до v20, чтобы присоединиться к новой истории.');
       if(msg.spectate===true){watch(r);return;}
      const token=typeof msg.token==='string'?msg.token:'';
      let index=r.seats.findIndex(s=>s&&s.token===token);
      if(index<0){index=r.seats.findIndex(s=>s===null);if(index<0)return error('В комнате уже два игрока.');r.seats[index]=newSeat();}
      attach(r,index);return;
    }
    if(!room||room.seats[role]?.peer!==peer)return;
    room.lastActivity=Date.now();
    if(msg.t==='customize'){
      room.seats[role].look=cleanLook(msg);broadcast(room,{t:'looks',looks:room.seats.map(s=>s?.look||null)});return;
    }
    if(msg.t==='storyChoice'){
      const act=msg.act,choice=msg.choice;
      if(!Number.isSafeInteger(act)||act<0||act>10||![0,1].includes(choice))return;
      if(room.game.stage!==99&&Math.floor(room.game.stage/9)!==act)return;
      room.story={act,choice,role,stamp:Date.now()};room.storyChoices=room.storyChoices||{};room.storyChoices[act]=choice;
      broadcast(room,{t:'storyChoice',...room.story});return;
    }
    if(msg.t==='quick'&&['here','wait','help','heart'].includes(msg.kind)){
      if(rateExceeded('quick',30))return;
      broadcast(room,{t:'quick',kind:msg.kind,role});return;
    }
    if(msg.t==='note'){
      if(rateExceeded('note',12))return error('Не больше 12 записок в минуту.');
      const text=expansion.cleanNote(msg.text);
      if(!text)return error('Записка должна содержать от 1 до 160 символов.');
      const note={text,role,at:Date.now()};
      room.notes=(room.notes||[]).concat(note).slice(-24);
      broadcast(room,{t:'note',note});return;
    }
    if(msg.t==='coopAction'||msg.t==='sceneVote'||msg.t==='homeAction'){
       if(clientProtocol<2)return error('Для этой команды необходим клиент v20.');
       if(rateExceeded('v20-action',90))return error('Слишком много действий за минуту.');
       const id=typeof msg.actionId==='string'&&/^[a-zA-Z0-9_-]{1,64}$/.test(msg.actionId)?msg.actionId:'';
       if(!id)return error('Некорректный идентификатор действия');
       const seat=room.seats[role];seat.actionIds=seat.actionIds||new Set();
       if(seat.actionIds.has(id)){peer.send({t:'actionResult',actionId:id,ok:false,error:'Повторная команда'});return;}
       seat.actionIds.add(id);if(seat.actionIds.size>256)seat.actionIds.delete(seat.actionIds.values().next().value);
       let outcome;
       if(msg.t==='coopAction')outcome=v20.action(room.game,role,msg.kind);
       else if(msg.t==='sceneVote')outcome=v20.vote(room,role,msg.sceneId,msg.option);
       else outcome=v20.homeAction(room,role,msg.kind);
       peer.send({t:'actionResult',actionId:id,...outcome});
       if(outcome.ok){
         room.urgentSnapshot=true;
         if(msg.t==='sceneVote')broadcast(room,{t:'v20Story',story:room.v20Story});
         if(msg.t==='homeAction')broadcast(room,{t:'v20Home',home:room.v20Home});
         if(msg.t==='coopAction')broadcast(room,roomSnapshot(room));
       }
       return;
     }
     if(msg.t==='v21Action'||msg.t==='v21Publish'||msg.t==='v21Report'||msg.t==='v21GalleryPlay'||msg.t==='v21GalleryList'||msg.t==='v21Weekly'){
       if(clientProtocol<3)return error('Обновите игру до версии 21');
       if(rateExceeded('v21-actions',100))return error('Слишком много команд в минуту');
       if(msg.t==='v21GalleryList'){peer.send({t:'v21Gallery',items:social.publicGallery(V21_GALLERY)});return;}
       if(msg.t==='v21Weekly'){
         const week=v21.weekKey();
         peer.send({t:'v21WeeklyBoard',week,target:v21.weeklyStage(),items:V21_BOARD.filter(x=>x.week===week).sort((a,b)=>a.time-b.time).slice(0,10)});
         return;
       }
       const id=typeof msg.actionId==='string'&&/^[a-zA-Z0-9_-]{1,64}$/.test(msg.actionId)?msg.actionId:'';
       if(!id)return error('Некорректный идентификатор команды');
       const seat=room.seats[role];seat.actionIds=seat.actionIds||new Set();
       if(seat.actionIds.has(id)){peer.send({t:'actionResult',actionId:id,ok:false,error:'Команда уже обработана'});return;}
       seat.actionIds.add(id);if(seat.actionIds.size>256)seat.actionIds.delete(seat.actionIds.values().next().value);
       let result={ok:false,error:'Команда не распознана'};
       if(msg.t==='v21Action'){
         const puzzle=new Set(['trail_mark','transfer_send','transfer_receive','transfer_deliver','knowledge_symbol','lantern_toggle','transform','transform_collect','transform_orb_link','weather_wind','weather_rain','cargo_push','tree_grow','maze_rotate','maze_checkpoint','asym_action','asym_cross']);
         result=puzzle.has(msg.kind)?v21.action(room.game,role,msg.kind,msg):social.act(room,role,msg.kind,msg);
       }
       if(msg.t==='v21Publish'){
         if(role!==0)result={ok:false,error:'Только ведущий может публиковать авторскую карту'};
         else if(V21_GALLERY.filter(x=>x.owner===room.code&&!x.hidden).length>=2)result={ok:false,error:'Не более двух публичных карт от команды'};
         else{
           const entry=social.published(msg.blueprint,room.code,expansion.cleanBlueprint);
           if(entry){V21_GALLERY.push(entry);if(V21_GALLERY.length>40)V21_GALLERY.shift();result={ok:true,detail:'Карта опубликована и доступна в галерее'};}
           else result={ok:false,error:'Сначала создайте карту с платформами в редакторе'};
         }
       }
       if(msg.t==='v21Report'){
         const item=V21_GALLERY.find(x=>x.id===msg.id&&!x.hidden);
         if(!item||item.owner===room.code)result={ok:false,error:'Не удалось отправить жалобу'};
         else{
           const fingerprint=crypto.createHash('sha256').update(seat.token).digest('hex').slice(0,24);
           if(item.reports.includes(fingerprint))result={ok:false,error:'Жалоба уже получена'};
           else {item.reports.push(fingerprint);if(item.reports.length>=3)item.hidden=true;result={ok:true,detail:'Жалоба принята; карта скрывается после трёх независимых жалоб'};}
         }
       }
       if(msg.t==='v21GalleryPlay'){
         const item=V21_GALLERY.find(x=>x.id===msg.id&&!x.hidden);
         if(role!==0||!room.seats.every(x=>x?.online))result={ok:false,error:'Оба игрока должны быть в комнате'};
         else if(!item)result={ok:false,error:'Карта отсутствует'};
         else{
           initStage(room.game,0);expansion.applyBlueprint(room.game,item.blueprint);
           room.customLevel=item.blueprint;room.ending=null;room.game.phase='playing';
           sendSeatRoom(room);broadcast(room,roomSnapshot(room));
           result={ok:true,detail:'Авторская карта загружена'};
         }
       }
       peer.send({t:'actionResult',actionId:id,...result});
       if(result.ok){
         room.urgentSnapshot=true;
         if(msg.t==='v21Action'){
           broadcast(room,{t:'v21State',data:social.publicState(room)});
           if(msg.kind.startsWith('letter_'))for(const s of room.seats)if(s?.online)s.peer.send({t:'v21Private',data:social.privateState(room,s===room.seats[0]?0:1)});
         }
         if(msg.t==='v21Publish'||msg.t==='v21Report')broadcast(room,{t:'v21Gallery',items:social.publicGallery(V21_GALLERY)});
         if(msg.t==='v21Action'&&room.game.v21)broadcast(room,roomSnapshot(room));
       }
       return;
     }
     if(msg.t==='home'&&Array.isArray(msg.items)){
      room.home=cleanHome(msg.items);broadcast(room,{t:'home',items:room.home});return;
    }
    if(msg.t==='selectStage'&&role===0&&room.seats.every(s=>s?.online)){
      const target=msg.stage;
      if(!Number.isSafeInteger(target)||target<0||target>v21.LAST)return error('Неверный номер уровня.');
      if(v21.hasStage(target)){
        if(room.seats.some(s=>s?.online&&s.protocol<3))return error('Оба игрока должны обновить игру до v21.');
        if(target>(room.v21Unlocked||v21.FIRST))return error('Испытание v21 ещё не открыто.');
       }else if(v20.hasStage(target)){if(room.seats.some(s=>s?.online&&s.protocol<2))return error('Оба игрока должны обновить игру до v20.');if(target>(room.v20Unlocked||100))return error('Уровень ещё не открыт.');}
       else if(target>room.unlockedMax&&(target!==99||msg.secrets!==11))return error('Уровень ещё не открыт.');
      if(target===99&&msg.secrets!==11)return error('Сначала найдите все 11 секретных рун.');
      initStage(room.game,target);room.customLevel=null;room.ending=null;room.game.phase='playing';
      sendSeatRoom(room);broadcast(room,roomSnapshot(room));return;
    }
    if(msg.t==='input'&&room.game.phase==='playing'){
      const old=room.game.input[role];
      const urgent=['jumpSeq','abilitySeq','bondSeq','emoteSeq'].some(k=>Number.isSafeInteger(msg[k])&&msg[k]>=0&&msg[k]<=1_000_000_000&&msg[k]>old[k]);
      updateInput(room.game,role,msg);
      if(urgent)room.urgentSnapshot=true;
      return;
    }
    if(msg.t==='start'&&role===0&&room.seats.every(s=>s?.online)&&room.game.phase==='waiting'){
      if(v21.hasStage(room.game.stage)&&room.seats.some(s=>s.protocol<3))return error('Для новой главы нужен клиент v21 на обоих устройствах.');
      if(v20.hasStage(room.game.stage)&&room.seats.some(s=>s.protocol<2))return error('Для новой кампании обновите игру на обоих устройствах.');
      room.game.phase='playing';initStage(room.game,room.customLevel?0:room.game.stage);if(room.customLevel)expansion.applyBlueprint(room.game,room.customLevel);room.ending=null;sendSeatRoom(room);broadcast(room,roomSnapshot(room));return;
    }
    if(msg.t==='restart'&&role===0&&room.seats.every(s=>s?.online)){
      initStage(room.game,v21.hasStage(room.game.stage)?v21.FIRST:v20.hasStage(room.game.stage)?100:0);room.customLevel=null;room.ending=null;room.game.phase='playing';sendSeatRoom(room);broadcast(room,snapshot(room.game,countOnline(room)));return;
    }
    if(msg.t==='resetStage'&&role===0&&room.game.phase==='playing'){
      initStage(room.game,room.customLevel?0:room.game.stage);if(room.customLevel)expansion.applyBlueprint(room.game,room.customLevel);room.ending=null;broadcast(room,roomSnapshot(room));return;
    }
  },()=>{
    if(!room)return;
    if(role===-1){room.spectators?.delete(peer);return;}
    const seat=room.seats[role];if(!seat||seat.peer!==peer)return;
    seat.online=false;seat.peer=null;clearMovement(room.game,role);
    room.lastActivity=Date.now();sendSeatRoom(room);
  });
});
let lastBroadcast=0;
const loop=setInterval(()=>{
  const benchmarkStart=benchmark.enabled?performance.now():0;
  let benchmarkFrames=0;
  lastBroadcast++;
  for(const r of ROOMS.values()){
    tick(r.game,countOnline(r));
    if(r.game.phase==='win'&&!r.ending)r.ending=v21.hasStage(r.game.stage)?{kind:'v21',title:'Навстречу друг другу',text:'Ваши пути снова встретились! Новые воспоминания ждут дома.'}:v20.hasStage(r.game.stage)?v20.endingForStory(r.v20Story):r.customLevel?{kind:'creator',title:'Мастера света',text:'Ваш собственный уровень пройден вдвоём!',choices:0}:expansion.endingFor(r);
    if(r.ending?.kind==='v20-together'&&r.v20Home&&!r.v20Home.decor.includes('lampion')&&r.v20Home.decor.length<6)r.v20Home.decor.push('lampion');
     const previousV21=r.v21World?.lastResult;
     social.completed(r,V21_BOARD);
     if(previousV21!==r.v21World?.lastResult){
       broadcast(r,{t:'v21State',data:social.publicState(r)});
       for(const seat of r.seats)if(seat?.online)seat.peer.send({t:'v21Private',data:social.privateState(r,seat===r.seats[0]?0:1)});
     }
     r.unlockedMax=Math.max(r.unlockedMax,Math.min(98,r.game.stage));
     if(v20.hasStage(r.game.stage))r.v20Unlocked=Math.max(r.v20Unlocked||100,r.game.stage);
     if(v21.hasStage(r.game.stage))r.v21Unlocked=Math.max(r.v21Unlocked||v21.FIRST,r.game.stage);
     if(r.game.v21)r.game.v21.branch=r.v21World?.branch||0;
    const both=r.seats.every(s=>s?.online);
    // 30 Hz while playing (formerly 20 Hz), with next-tick feedback on discrete actions.
    // A disconnected/waiting room sends only 2 Hz; seat changes are sent immediately.
    const emit=both&&r.game.phase==='playing'
      ?lastBroadcast%2===0||r.urgentSnapshot
      :lastBroadcast%30===0;
    if(emit&&r.seats.some(s=>s?.online)){
      r.urgentSnapshot=false;
      broadcast(r,roomSnapshot(r));
      benchmarkFrames++;
    }
  }
  if(benchmark.enabled)benchmark.observeTick(benchmarkStart,performance.now(),benchmarkFrames);
},1000/60);
loop.unref();
setInterval(persistRooms,12_000).unref();
setInterval(persistRoomsCloud,30_000).unref();
process.on('SIGTERM',()=>{persistRooms();persistRoomsCloud();server.close();});
setInterval(()=>{for(const r of ROOMS.values())for(const seat of r.seats)if(seat?.online)seat.peer.ping();},10_000).unref();
setInterval(()=>{const now=Date.now();for(const [key,r] of ROOMS){if(!r.seats.some(s=>s?.online)&&now-r.lastActivity>30*60_000)ROOMS.delete(key);}},60_000).unref();
restoreRoomsCloud().finally(()=>server.listen(PORT,'0.0.0.0',()=>console.log(`Linked by Light online: http://localhost:${PORT}`))); 