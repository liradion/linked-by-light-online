'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createPublicBeta,normalizeFeedback,cleanFeedback}=require('../public-beta');
const {sameOrigin}=require('../public-beta-http');
test('consent is mandatory; beta feedback is normalized and excludes unrequested identifiers',()=>{
 const entry=normalizeFeedback({kind:'bug',consent:true,
  message:'<script>Проблема при соединении</script>',platform:'iphone',rating:4,stage:112,
  email:'never-collect@example.com',room:'ZXQ123',token:'private-token'},1700000000000);
 assert.equal(entry.message,'scriptПроблема при соединении/script');
 assert.equal(entry.stage,112);
 assert.equal(entry.platform,'iphone');
 assert.equal(entry.email,undefined);
 assert.equal(entry.room,undefined);
 assert.equal(entry.token,undefined);
 assert.equal(normalizeFeedback({kind:'bug',consent:false,message:'Проблема при подключении'}),null);
 assert.equal(normalizeFeedback({kind:'random',consent:true,message:'Проблема при подключении'}),null);
 assert.equal(normalizeFeedback({kind:'bug',consent:true,message:'коротко'}),null);
});
test('anonymous feedback and admin privileges are separated',()=>{
 const token='admin-secret-which-is-long-enough-for-production';
 const x=createPublicBeta({adminToken:token,maxRooms:10});
 assert.equal(x.maxRooms,10);assert.equal(x.adminEnabled,true);
 assert.equal(x.admin({headers:{authorization:'Bearer '+token}}),true);
 assert.equal(x.admin({headers:{authorization:'Bearer wrong'}}),false);
 assert.equal(x.admin({headers:{authorization:''}}),false);
 assert.equal(createPublicBeta({adminToken:'short'}).adminEnabled,false);
 assert.equal(x.acceptFeedback({consent:true,kind:'idea',message:'Добавьте мягкий режим сложности',platform:'windows'}).id.length,16);
 const data=x.feedbackQueue();
 assert.equal(data.length,1);
 assert.equal(data[0].platform,'windows');
 assert.equal(JSON.stringify(x.getStatus(new Map(),{})).includes(data[0].message),false);
});
test('request quotas reset after the selected interval without exposing IPs in reports',()=>{
 let current=2000;
 const x=createPublicBeta({now:()=>current});
 assert.equal(x.allow('join','127.0.0.1',2),true);
 assert.equal(x.allow('join','127.0.0.1',2),true);
 assert.equal(x.allow('join','127.0.0.1',2),false);
 current+=61_000;
 assert.equal(x.allow('join','127.0.0.1',2),true);
 x.record('roomCreated');
 const status=x.getDiagnostics(new Map(),{});
 assert.equal(status.counters.roomCreated,1);
 assert.equal(JSON.stringify(status).includes('127.0.0.1'),false);
});
test('new creator maps are pending and require an authorized moderation decision',()=>{
 const x=createPublicBeta({adminToken:'VeryLongModerationSecret1234567890'});
 const listing=[{id:'abcdef123456',title:'Тихая долина',status:'pending',hidden:false,
  blueprint:{platforms:[{x:500,y:400,w:100}]},reports:[]}];
 assert.equal(x.pendingGallery(listing).length,1);
 assert.equal(x.moderateGallery(listing,'bad','approve'),null);
 assert.deepEqual(x.moderateGallery(listing,'abcdef123456','approve'),{id:'abcdef123456',status:'approved'});
 assert.equal(listing[0].hidden,false);
 assert.equal(x.pendingGallery(listing).length,0);
 assert.equal(x.moderateGallery(listing,'abcdef123456','hide').status,'rejected');
 assert.equal(listing[0].hidden,true);
});
test('feedback backups sanitize unexpected entries and cap their count',()=>{
 const x=createPublicBeta();
 const saved=Array.from({length:130},(_,i)=>({
  id:i.toString(16).padStart(16,'0'),kind:'bug',message:'Ошибка при совместной игре',platform:'android',rating:5,stage:112,created:i
 }));
 x.restoreFeedback(saved);
 assert.equal(x.feedbackBackup().length,100);
 assert.equal(x.feedbackBackup()[0].id,saved[30].id);
 assert.equal(cleanFeedback([{id:'invalid',kind:'bug',message:'Some message here'}]).length,0);
});
test('cross-origin beta requests are rejected',()=>{
 assert.equal(sameOrigin({headers:{host:'game.example',origin:'https://game.example'}}),true);
 assert.equal(sameOrigin({headers:{host:'game.example',origin:'https://evil.example'}}),false);
 assert.equal(sameOrigin({headers:{host:'game.example',origin:'not a URL'}}),false);
 assert.equal(sameOrigin({headers:{host:'game.example'}}),true);
});
