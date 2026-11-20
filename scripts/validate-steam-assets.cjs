'use strict';
const fs=require('node:fs'),path=require('node:path');
const {FORMATS}=require('./generate-steam-concepts.cjs');
const ROOT=path.resolve(__dirname,'..');
function dimensions(file){
 const bytes=fs.readFileSync(file);
 const pngSig='89504e470d0a1a0a';
 if(bytes.subarray(0,8).toString('hex')===pngSig){
  const w=bytes.readUInt32BE(16),h=bytes.readUInt32BE(20);
  return {format:'png',width:w,height:h,sizeBytes:bytes.length};
 }
 if(bytes[0]===0xff&&bytes[1]===0xd8){
  let i=2;
  while(i<bytes.length){
   if(bytes[i]!==0xff){i++;continue;}
   const marker=bytes[i+1];i+=2;
   if(marker===0xd9||marker===0xda)break;
   if(i+2>bytes.length)break;
   const length=bytes.readUInt16BE(i);
   if(length<2||i+length>bytes.length)break;
   if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)){
    return {format:'jpg',width:bytes.readUInt16BE(i+5),height:bytes.readUInt16BE(i+3),sizeBytes:bytes.length};
   }
   i+=length;
  }
 }
 throw Error('Unknown image format: '+path.basename(file));
}
function report(out=path.join(ROOT,'artifacts','steam-prepayment')){
 const concepts=path.join(out,'concepts'),gameplay=path.join(out,'gameplay-captures');
 const errors=[],images=[];
 function verify(file,w,h,kind){
  if(!fs.existsSync(file)){errors.push('Missing '+kind+': '+path.basename(file));return;}
  try{
   const d=dimensions(file);
   if(d.width!==w||d.height!==h||d.sizeBytes<1000)errors.push('Invalid format/size: '+path.basename(file));
   images.push({file:path.relative(out,file).replace(/\\/g,'/'),kind,...d});
  }catch(e){errors.push(e.message);}
 }
 for(const item of FORMATS)verify(path.join(concepts,item.id+'.'+item.ext),item.w,item.h,'concept');
 const captures=['01-first-coop-room','02-first-steps','03-first-jump','04-second-hero','05-shared-light'];
 for(const id of captures)verify(path.join(gameplay,id+'.png'),1920,1080,'gameplay');
 const manifest=path.join(gameplay,'manifest.json');
 if(!fs.existsSync(manifest))errors.push('No gameplay capture provenance manifest');
 else{
  try{
   const data=JSON.parse(fs.readFileSync(manifest,'utf8'));
   if(data.type!=='ACTUAL_GAME_LOCAL_SERVER_SCREENSHOTS'||data.server!=='isolated-local-only')
    errors.push('Game screenshot provenance missing');
  }catch(_){errors.push('Invalid capture manifest');}
 }
 return {status:errors.length?'INCOMPLETE':'ARTIFACTS_GENERATED_PENDING_HUMAN_REVIEW',
  validation:'exact dimensions and local-origin provenance metadata only',
  count:images.length,images,errors,
  warnings:[
   'No rights, marketing, store acceptance, physical gameplay or Steam account validation is implied.',
   'Concept artwork is not game footage. Screenshots require owner editorial review, and no file was submitted to Steam.'
  ]};
}
if(require.main===module){
 const result=report();console.log(JSON.stringify(result,null,2));
 if(result.errors.length)process.exitCode=1;
}
module.exports={dimensions,report};
