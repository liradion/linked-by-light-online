'use strict';
// Zero dependencies: HTTP static server + minimal RFC6455 WebSocket transport.
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {createGame,initStage,updateInput,clearMovement,tick,snapshot}=require('./game-core');
const PORT=Number(process.env.PORT)||3000;
const PUBLIC=path.join(__dirname,'public');
const ROOMS=new Map();
const ROOM_ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_ROOMS=200, MAX_PAYLOAD=4096;
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.ico':'image/x-icon','.json':'application/json; charset=utf-8'};

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
  return {send:(data)=>sendFrame(socket,1,JSON.stringify(data)), close, ping:()=>{if(Date.now()-lastPong>32_000){socket.destroy();return;}sendFrame(socket,9,Buffer.from('alive'));}};
}
function newCode(){for(let tries=0;tries<50;tries++){
  const code=Array.from(crypto.randomBytes(6),byte=>ROOM_ALPHABET[byte%ROOM_ALPHABET.length]).join('');
  if(!ROOMS.has(code))return code;
}throw Error('unable to create room');}
const newSeat=()=>({token:crypto.randomBytes(24).toString('hex'),peer:null,online:false});
function countOnline(r){return r.seats.map(s=>!!s?.online);}
function sendSeatRoom(r){const obj={t:'members',room:r.code,connected:countOnline(r),phase:r.game.phase};
  for(const s of r.seats)if(s?.online)s.peer.send(obj);
}
function broadcast(r,obj){for(const s of r.seats)if(s?.online)s.peer.send(obj);}
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/health'){
    res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
    res.end(JSON.stringify({ok:true,rooms:ROOMS.size}));return;
  }
  let file;
  if(pathname==='/shared/stages.js')file=path.join(__dirname,'shared','stages.js');
  else if(pathname==='/'||pathname==='/index.html')file=path.join(PUBLIC,'index.html');
  else if(/^\/[a-zA-Z0-9._-]+$/.test(pathname))file=path.join(PUBLIC,pathname.slice(1));
  else{res.writeHead(404);res.end('Not found');return;}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('Not found');return;}
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; connect-src 'self' ws: wss:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'"});res.end(data);
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
  let room=null,role=-1,peer;
  const error=message=>peer.send({t:'error',message});
  const attach=(r,index)=>{
    if(room)return error('Вы уже находитесь в комнате.');
    const seat=r.seats[index];if(seat.online&&seat.peer){try{seat.peer.close();}catch(_){}}
    room=r;role=index;seat.online=true;seat.peer=peer;r.lastActivity=Date.now();
    // После обновления страницы счётчики нажатий в браузере начинаются с нуля.
    r.game.input[role].jumpSeq=0;r.game.input[role].abilitySeq=0;clearMovement(r.game,role);
    peer.send({t:'joined',room:r.code,role,token:seat.token,phase:r.game.phase,connected:countOnline(r)});
    peer.send(snapshot(r.game,countOnline(r)));
    sendSeatRoom(r);
  };
  peer=attachWebSocket(socket,head,msg=>{
    if(!msg||typeof msg!=='object'||Array.isArray(msg))return;
    if(msg.t==='ping'){peer.send({t:'pong',sent:Number.isFinite(msg.sent)?msg.sent:0});return;}
    if(msg.t==='create'){
      if(room)return error('Вы уже в комнате.');
      if(ROOMS.size>=MAX_ROOMS)return error('Сервер заполнен. Попробуйте позже.');
      const code=newCode(),r={code,seats:[newSeat(),null],game:createGame(),lastActivity:Date.now()};
      ROOMS.set(code,r);attach(r,0);return;
    }
    if(msg.t==='join'){
      if(room)return error('Вы уже в комнате.');
      const code=typeof msg.room==='string'?msg.room.trim().toUpperCase():'';
      const r=ROOMS.get(code);if(!r)return error('Комната не найдена. Проверьте код.');
      const token=typeof msg.token==='string'?msg.token:'';
      let index=r.seats.findIndex(s=>s&&s.token===token);
      if(index<0){index=r.seats.findIndex(s=>s===null);if(index<0)return error('В комнате уже два игрока.');r.seats[index]=newSeat();}
      attach(r,index);return;
    }
    if(!room||room.seats[role]?.peer!==peer)return;
    room.lastActivity=Date.now();
    if(msg.t==='input'&&room.game.phase==='playing'){
      updateInput(room.game,role,msg);return;
    }
    if(msg.t==='start'&&role===0&&room.seats.every(s=>s?.online)&&room.game.phase==='waiting'){
      room.game.phase='playing';initStage(room.game,0);sendSeatRoom(room);broadcast(room,snapshot(room.game,countOnline(room)));return;
    }
    if(msg.t==='restart'&&role===0&&room.seats.every(s=>s?.online)){
      initStage(room.game,0);room.game.phase='playing';sendSeatRoom(room);broadcast(room,snapshot(room.game,countOnline(room)));return;
    }
    if(msg.t==='resetStage'&&role===0&&room.game.phase==='playing'){
      initStage(room.game,room.game.stage);broadcast(room,snapshot(room.game,countOnline(room)));return;
    }
  },()=>{
    if(!room)return;
    const seat=room.seats[role];if(!seat||seat.peer!==peer)return;
    seat.online=false;seat.peer=null;clearMovement(room.game,role);
    room.lastActivity=Date.now();sendSeatRoom(room);
  });
});
let lastBroadcast=0;
const loop=setInterval(()=>{
  for(const r of ROOMS.values())tick(r.game,countOnline(r));
  lastBroadcast++;
  if(lastBroadcast%3===0)for(const r of ROOMS.values())if(r.seats.some(s=>s?.online))broadcast(r,snapshot(r.game,countOnline(r)));
},1000/60);
loop.unref();
setInterval(()=>{for(const r of ROOMS.values())for(const seat of r.seats)if(seat?.online)seat.peer.ping();},10_000).unref();
setInterval(()=>{const now=Date.now();for(const [key,r] of ROOMS){if(!r.seats.some(s=>s?.online)&&now-r.lastActivity>30*60_000)ROOMS.delete(key);}},60_000).unref();
server.listen(PORT,'0.0.0.0',()=>console.log(`Linked by Light online: http://localhost:${PORT}`));
