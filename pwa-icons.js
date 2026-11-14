'use strict';
// Zero-dependency icon renderer. Generates real PNG icons so Apple and desktop
// browsers can install this game without committing opaque binary files.
const zlib=require('node:zlib');
const cache=new Map();
const CRC=new Uint32Array(256);
for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;CRC[n]=c>>>0;}
function crc32(b){let c=0xffffffff;for(const x of b)c=CRC[(c^x)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
function chunk(tag,data){
 const label=Buffer.from(tag),len=Buffer.alloc(4),check=Buffer.alloc(4);
 len.writeUInt32BE(data.length);check.writeUInt32BE(crc32(Buffer.concat([label,data])));
 return Buffer.concat([len,label,data,check]);
}
function render(size){
 if(![180,192,512].includes(size))throw Error('invalid icon size');
 if(cache.has(size))return cache.get(size);
 const stride=size*4+1,rgba=Buffer.alloc(stride*size),S=size/512;
 function blend(x,y,color,a){
  x=Math.round(x);y=Math.round(y);if(x<0||x>=size||y<0||y>=size||a<=0)return;
  const i=y*stride+1+x*4,t=Math.min(1,a);
  for(let k=0;k<3;k++)rgba[i+k]=Math.round(rgba[i+k]*(1-t)+color[k]*t);
 }
 function disc(cx,cy,r,color,opacity=1){
  const ax=Math.max(0,Math.floor(cx-r-1)),bx=Math.min(size-1,Math.ceil(cx+r+1));
  const ay=Math.max(0,Math.floor(cy-r-1)),by=Math.min(size-1,Math.ceil(cy+r+1));
  for(let y=ay;y<=by;y++)for(let x=ax;x<=bx;x++){
   const d=Math.hypot(x+.5-cx,y+.5-cy);const a=Math.min(1,(r+.7-d))*opacity;
   if(a>0)blend(x,y,color,a);
  }
 }
 function glow(cx,cy,r,color,power){
  const ax=Math.max(0,Math.floor(cx-r)),bx=Math.min(size-1,Math.ceil(cx+r));
  const ay=Math.max(0,Math.floor(cy-r)),by=Math.min(size-1,Math.ceil(cy+r));
  for(let y=ay;y<=by;y++)for(let x=ax;x<=bx;x++){
   const d=Math.hypot(x+.5-cx,y+.5-cy)/r;
   if(d<1)blend(x,y,color,(1-d)*(1-d)*power);
  }
 }
 // Violet midnight with a gentle central halo.
 for(let y=0;y<size;y++){const o=y*stride;rgba[o]=0;for(let x=0;x<size;x++){
  const i=o+1+x*4,dx=(x-size/2)/(size*.68),dy=(y-size/2)/(size*.68);
  const v=Math.max(0,1-Math.hypot(dx,dy));
  rgba[i]=Math.floor(11+25*v+4*(y/size));
  rgba[i+1]=Math.floor(14+18*v+5*(1-y/size));
  rgba[i+2]=Math.floor(31+48*v);
  rgba[i+3]=255;
 }}
 // Two paired celestial companions and the light connecting them.
 for(let k=0;k<=64;k++){
  const t=k/64,cx=(120+272*t)*S,cy=(277-33*Math.sin(t*Math.PI*2))*S;
  glow(cx,cy,52*S,[201,166,255],.10);
  disc(cx,cy,7*S,[203,184,255],.8);
 }
 glow(166*S,269*S,161*S,[255,152,90],.65);
 glow(346*S,269*S,161*S,[94,240,247],.65);
 disc(166*S,266*S,99*S,[255,173,97]);
 disc(166*S,266*S,80*S,[248,140,67]);
 disc(346*S,266*S,99*S,[111,237,244]);
 disc(346*S,266*S,80*S,[66,192,226]);
 // Faces, softly luminous eyes and tiny smiles.
 for(const cx of [166,346]){
  const c=cx*S,eye=[23,37,53];
  disc(c-24*S,256*S,11*S,eye);disc(c+24*S,256*S,11*S,eye);
  disc(c-27*S,252*S,4*S,[255,255,255]);disc(c+21*S,252*S,4*S,[255,255,255]);
  for(let t=0;t<=16;t++){const a=.23*Math.PI+t/16*.54*Math.PI;
   disc(c+28*S*Math.cos(a),274*S+21*S*Math.sin(a),3*S,eye,.65);}
 }
 // One star suspended between the characters.
 glow(256*S,159*S,82*S,[226,205,255],.6);
 for(let i=-1;i<=1;i++){disc(256*S+i*8*S,159*S,11*S,[255,249,227],.9);
  disc(256*S,159*S+i*8*S,11*S,[255,249,227],.9);}
 disc(256*S,159*S,12*S,[255,255,255]);
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(size,0);ihdr.writeUInt32BE(size,4);
 ihdr[8]=8;ihdr[9]=6;ihdr[10]=0;ihdr[11]=0;ihdr[12]=0;
 const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(rgba,{level:9})),chunk('IEND',Buffer.alloc(0))]);
 cache.set(size,png);return png;
}
module.exports={render};
