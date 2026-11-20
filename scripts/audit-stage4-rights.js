'use strict';
// Automated repository inventory only; NEVER asserts that art/music/source rights are cleared.
const fs=require('node:fs'),path=require('node:path');
const ASSET=/\.(?:png|jpe?g|webp|gif|svg|ico|mp3|wav|ogg|flac|aac|m4a|woff2?|ttf|otf|mp4|mov|webm)$/i;
const SOURCE=/\.(?:html|css|js|cjs|mjs)$/i;
const OMIT=new Set(['.git','node_modules','test-results','playwright-report','preview-artifacts','coverage']);
function inventory(root){
 const assets=[],externalScriptsAndStyles=[];
 function visit(dir){
  if(!fs.existsSync(dir))return;
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
   if(OMIT.has(entry.name))continue;
   const abs=path.join(dir,entry.name),rel=path.relative(root,abs).replace(/\\/g,'/');
   if(entry.isDirectory()){visit(abs);continue;}
   if(!entry.isFile())continue;
   if(ASSET.test(rel)){
    assets.push({path:rel,bytes:fs.statSync(abs).size,licence:'UNVERIFIED'});
    continue;
   }
   if(!SOURCE.test(rel))continue;
   // Do not treat comments/README links as embedded third-party runtime code.
   // Only inspect the static HTML link/script tags or CSS @import/URL references.
   if(!rel.startsWith('public/')&&!['index.html'].includes(rel))continue;
   const data=fs.readFileSync(abs,'utf8');
   const htmlTag=/<(?:script|link)\b[^>]*\b(?:src|href)=["'](https?:\/\/[^"']+)["'][^>]*>/gi;
   const cssRef=/@import\s+(?:url\()?["']?(https?:\/\/[^"')\s;]+)/gi;
   for(const match of data.matchAll(htmlTag))externalScriptsAndStyles.push({path:rel,url:match[1]});
   for(const match of data.matchAll(cssRef))externalScriptsAndStyles.push({path:rel,url:match[1]});
  }
 }
 for(const base of ['public','shared'])visit(path.join(root,base));
 for(const filename of ['index.html']){const abs=path.join(root,filename);if(fs.existsSync(abs)){
  const data=fs.readFileSync(abs,'utf8');
  for(const match of data.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)=["'](https?:\/\/[^"']+)["'][^>]*>/gi))
   externalScriptsAndStyles.push({path:filename,url:match[1]});
 }}
 assets.sort((a,b)=>a.path.localeCompare(b.path));
 externalScriptsAndStyles.sort((a,b)=>a.path.localeCompare(b.path)||a.url.localeCompare(b.url));
 return {version:1,scope:'tracked-like public and shared media, embedded remote HTML/CSS dependencies',
  status:'RIGHTS_REVIEW_REQUIRED',assets,externalScriptsAndStyles,
  notes:['Source ownership and code provenance are not determined by file inventory.',
   'WebAudio, canvas paths, emojis and system fonts still require product and platform rights review.',
   'No green automated report is a commercial licensing clearance.']};
}
if(require.main===module)console.log(JSON.stringify(inventory(path.resolve(__dirname,'..')),null,2));
module.exports={inventory};
