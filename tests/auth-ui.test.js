'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
function dom(){const nodes=new Map(),host={append(node){nodes.set(node.id,node);}};
 const makeNode=tag=>({tag,hidden:false,style:{},id:'',value:'',open:false,
  set innerHTML(v){this._html=v;for(const match of v.matchAll(/id="([A-Za-z0-9_-]+)"/g))if(!nodes.has(match[1]))nodes.set(match[1],makeNode('child'));},
  get innerHTML(){return this._html;},
  showModal(){this.open=true;},close(){this.open=false;},append(){}});
 const document={body:{append(node){nodes.set(node.id,node);}},querySelector:()=>host,getElementById:id=>nodes.get(id)||null,createElement:makeNode,visibilityState:'visible'};
 return {nodes,document};
}
test('Google sign-in UI shows for guests and never requires an account to play',async()=>{
 const {nodes,document}=dom();let locationChanged='';const timers=[];
 const window={};const sandbox={window,document,URLSearchParams,location:{pathname:'/',search:'',assign:u=>{locationChanged=u;}},history:{replaceState(){}},setInterval:f=>timers.push(f),fetch:async(path)=>{
  assert.equal(path,'/api/auth/me');return {ok:true,json:async()=>({enabled:true,authenticated:false,user:null})};
 },console};
 const text=fs.readFileSync(path.join(__dirname,'../public/auth.js'),'utf8');
 vm.runInNewContext(text,sandbox,{filename:'auth.js'});
 await new Promise(r=>setImmediate(r));
 assert.equal(nodes.get('googleAccountBtn').textContent,'G Войти');
 nodes.get('googleAccountBtn').onclick();assert.equal(nodes.get('googleAccountDialog').open,true);
 assert.equal(nodes.get('googleSignIn').hidden,false);
 nodes.get('googleSignIn').onclick();assert.equal(locationChanged,'/api/auth/google?next=%2F');
 assert.equal(timers.length,0);
});
test('HTML includes Google module after existing co-op client',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
 assert.ok(html.includes('/client.js?v=13'));assert.ok(html.includes('/auth.js?v=13'));
 assert.ok(html.indexOf('/auth.js?v=13')>html.indexOf('/client.js?v=13'));
 assert.ok(html.includes('id="createBtn"'),'guest rooms remain available');
});