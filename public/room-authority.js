/* Linked by Light: optional role-independent room host contract.
 * Legacy rooms use Spark (role 0); a host-aware client supplies isHost().
 * UI-only capability hint; server always authorizes room management.
 */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.GameRoomAuthority=api;
})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 function isHost(callbacks,role){
  if(typeof callbacks?.isHost==='function'){
   const result=callbacks.isHost();
   if(typeof result==='boolean')return result;
   // A present but invalid host callback must never elevate a role.
   return false;
  }
  return role===0;
 }
 return Object.freeze({isHost});
});
