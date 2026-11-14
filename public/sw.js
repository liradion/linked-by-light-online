'use strict';
// Online-first app: never cache authenticated responses, room URLs or game HTML.
const CACHE='linked-light-pwa-v14';
const OFFLINE='/offline.html';
const ICONS=['/icons/icon-192.png','/icons/icon-512.png','/apple-touch-icon.png'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll([OFFLINE,...ICONS])).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(Promise.all([
  caches.keys().then(names=>Promise.all(names.filter(n=>n.startsWith('linked-light-pwa-')&&n!==CACHE).map(n=>caches.delete(n)))),
  self.clients.claim()
 ]));
});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 if(url.pathname.startsWith('/api/')||url.pathname==='/ws'
    ||url.searchParams.has('code')||url.searchParams.has('error')
    ||url.searchParams.has('login')||url.searchParams.has('login_error'))return;
 if(request.mode==='navigate'){
  event.respondWith(fetch(request).catch(()=>caches.match(OFFLINE)));
  return;
 }
 if(url.pathname===OFFLINE||ICONS.includes(url.pathname)){
  event.respondWith(caches.open(CACHE).then(async cache=>{
   const hit=await cache.match(request);if(hit)return hit;
   const fresh=await fetch(request);
   if(fresh.ok&&fresh.type!=='opaque')cache.put(request,fresh.clone()).catch(()=>{});
   return fresh;
  }));
 }
 // JavaScript, styles, manifest, WebSocket and all game data use the network.
});