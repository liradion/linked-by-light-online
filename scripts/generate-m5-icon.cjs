'use strict';
// Build-only ICO from the game's procedural PWA icon: no downloaded graphics/fonts.
const fs=require('node:fs'),path=require('node:path');
const {render}=require('../pwa-icons.js');
function toIco(png,size=192){
 if(!Buffer.isBuffer(png)||png.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')
  throw Error('Expected PNG input');
 if(!Number.isInteger(size)||size<1||size>255)throw Error('Invalid ICO size');
 const header=Buffer.alloc(22);
 header.writeUInt16LE(0,0);header.writeUInt16LE(1,2);header.writeUInt16LE(1,4);
 header.writeUInt8(size,6);header.writeUInt8(size,7);
 header.writeUInt8(0,8);header.writeUInt8(0,9);
 header.writeUInt16LE(1,10);header.writeUInt16LE(32,12);
 header.writeUInt32LE(png.length,14);
 header.writeUInt32LE(header.length,18);
 return Buffer.concat([header,png]);
}
function writeIcon(dest=path.resolve(__dirname,'../desktop/tauri/src-tauri/icons/icon.ico')){
 const png=render(192),ico=toIco(png,192);
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,ico);
 return {dest,bytes:ico.length};
}
if(require.main===module)console.log(JSON.stringify(writeIcon()));
module.exports={toIco,writeIcon};
