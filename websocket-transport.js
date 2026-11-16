'use strict';
// v27 isolated RFC6455 transport; server.js owns room logic and authorization.
const MAX_PAYLOAD=4096,MAX_SNAPSHOT_BACKLOG=24_000;
function sendFrame(socket,opcode,content=Buffer.alloc(0)){
  if(socket.destroyed||!socket.writable)return;
  const body=Buffer.isBuffer(content)?content:Buffer.from(content,'utf8');
  if(body.length>65535)return;
  const h=Buffer.alloc(body.length<126?2:4);h[0]=0x80|opcode;
  if(body.length<126)h[1]=body.length;else{h[1]=126;h.writeUInt16BE(body.length,2);}
  if(socket.writableLength<300_000)socket.write(Buffer.concat([h,body]));
}
function attachWebSocket(socket,head,onMessage,onClose,benchmark){
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
      if(fin){let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(fragment);}catch(_){close(1007);return;}
        fragment=null;try{onMessage(JSON.parse(text));}catch(_){/* invalid JSON ignored */}}
    }
  });
  if(head&&head.length)socket.emit('data',head);
  return {
    send:(data)=>{
      if(data?.t==='snapshot'&&socket.writableLength>MAX_SNAPSHOT_BACKLOG){benchmark?.snapshotSkipped?.();return;}
      sendFrame(socket,1,JSON.stringify(data));
    },
    sendRaw:(payload,isSnapshot)=>{
      if(isSnapshot&&socket.writableLength>MAX_SNAPSHOT_BACKLOG){benchmark?.snapshotSkipped?.();return;}
      sendFrame(socket,1,payload);
    },
    close,ping:()=>{if(Date.now()-lastPong>32_000){socket.destroy();return;}sendFrame(socket,9,Buffer.from('alive'));}
  };
}

module.exports={sendFrame,attachWebSocket};
