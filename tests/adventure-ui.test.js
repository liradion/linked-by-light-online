'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
class Node {
 constructor(tag='div',root=null){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.style={};this.events={};this.root=root;this.open=false;this.classList={names:new Set(),add:v=>this.classList.names.add(v),remove:v=>this.classList.names.delete(v),toggle:(v,on)=>on?this.classList.names.add(v):this.classList.names.delete(v),contains:v=>this.classList.names.has(v)};}
 append(...nodes){for(const n of nodes){this.children.push(n);if(n?.id)this.root.ids[n.id]=n;}return this;}
 insertAdjacentElement(_,n){this.append(n);}
 replaceChildren(...a){this.children=[];this.append(...a);}
 addEventListener(kind,fn){this.events[kind]=fn;}
 click(){this.events.click?.();}
 showModal(){this.open=true;}
 close(){this.open=false;}
 set className(v){this.classList.names=new Set(v.split(/\s+/).filter(Boolean));}
 get className(){return [...this.classList.names].join(' ');}
}
test('map/home/wardrobe/story render, and local selections persist',()=>{
 const ids={};const doc={ids};doc.body=new Node('body',doc);
 const header=new Node('header',doc),frame=new Node('div',doc);doc.body.append(header,frame);
 doc.createElement=t=>new Node(t,doc);doc.getElementById=id=>ids[id]||null;
 doc.querySelector=s=>s==='.topline'?header:s==='.frame'?frame:null;
 const walk=(n,ans)=>{if(n.classList?.contains('adv-tab'))ans.push(n);for(const x of n.children||[])walk(x,ans);};
 doc.querySelectorAll=s=>{const out=[];if(s==='.adv-tab')walk(doc.body,out);return out;};
 const memory=new Map();const storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
 const window={}, ctx=vm.createContext({window,document:doc,localStorage:storage,clearTimeout,setTimeout,Math,JSON,console});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/adventure.js'),'utf8'),ctx);
 const adventure=window.GameAdventure;
 let selected=-1,updated=null;
 adventure.init({bestStage:()=>45,inRoom:()=>false,send:x=>{updated=x;},startStage:n=>{selected=n;}});
 adventure.open('map');assert.equal(ids.advDialog.open,true);
 assert.equal(doc.querySelectorAll('.adv-tab').length,4);
 assert.ok(ids.advDialogBody.children.length>0);
 adventure.open('home');assert.ok(ids.advFurniture);
 const homeSlot=ids.advDialogBody.children.find(n=>n.classList.contains('adv-home')).children.find(n=>n.classList.contains('adv-home-grid')).children[2];
 homeSlot.click();assert.equal(updated.t,'home');assert.ok(adventure.getHome().length>=2);
 adventure.open('wardrobe');assert.equal(ids.advDialog.dataset.tab,'wardrobe');
 adventure.open('journal');assert.equal(ids.advDialog.dataset.tab,'journal');
 adventure.onSnapshot({stage:0,world:{adventure:{bond:{hearts:1},pet:{visible:false},secret:{visible:false}}}});
 assert.ok(adventure.data().achievements.includes('together'));
});