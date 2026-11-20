'use strict';
// Pure and testable policy. The real game stays on its same HTTPS origin and uses WSS.
// No packaged build may replace the production origin through an environment variable.
const RELEASE_GAME_URL='https://linked-by-light-eu.onrender.com/';
const POLICY_PATHS=new Set(['/privacy.html','/privacy-en.html','/terms.html','/terms-en.html']);
function parse(raw){
 try{
  const parsed=new URL(raw);
  if(parsed.username||parsed.password)return null;
  if(!['https:','http:'].includes(parsed.protocol))return null;
  return parsed;
 }catch(_){return null;}
}
function resolveGameUrl(env={},isPackaged=true){
 const release=parse(RELEASE_GAME_URL);
 if(!release||release.protocol!=='https:')throw Error('Invalid pinned game URL');
 if(isPackaged||env.M5_ALLOW_LOOPBACK_DEV!=='1')return release.href;
 const raw=env.M5_GAME_URL;
 const selected=parse(raw);
 if(!selected)return release.href;
 const loopback=new Set(['localhost','127.0.0.1','[::1]']);
 if(selected.protocol!=='http:'||!loopback.has(selected.hostname))return release.href;
 // The dev-only origin is never serialized into a packaged app.
 if(selected.username||selected.password||selected.hash||selected.search)return release.href;
 return selected.origin+'/';
}
function sameOrigin(url,target=RELEASE_GAME_URL){
 const next=parse(url),base=parse(target);
 return !!next&&!!base&&next.origin===base.origin;
}
function allowedNavigation(url,target=RELEASE_GAME_URL){
 const next=parse(url);
 return !!next&&sameOrigin(next.href,target)&&!next.hash.startsWith('#javascript:');
}
function externalPolicyPage(url,target=RELEASE_GAME_URL){
 const next=parse(url);
 return !!next&&allowedNavigation(next.href,target)&&POLICY_PATHS.has(next.pathname);
}
function allowedPermission(permission,sourceUrl,target=RELEASE_GAME_URL){
 return permission==='clipboard-sanitized-write'&&allowedNavigation(sourceUrl,target);
}
module.exports={RELEASE_GAME_URL,POLICY_PATHS,resolveGameUrl,sameOrigin,allowedNavigation,externalPolicyPage,allowedPermission};
