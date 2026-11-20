'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {buildDiagnostic}=require('../public/g4-qa');
test('G4 diagnostics: explicit allowlist strips room, token, IP, URL and user-agent across nested objects',()=>{
 const raw={stage:5,role:1,phase:'playing',ready:true,connected:[true,false],
  reconnectCount:4,room:'G4AB23',token:'secretTest321',ip:'192.168.1.99',
  url:'https://private.example/?room=G4AB23',userAgent:'SensitiveUA',
  stats:{elapsed:25.842,deaths:2,rescues:1,abilities:[3,9],email:'fake@example.org'},
  world:{gateOpen:false,checkpoint:{index:1,recoveries:[1,2],playerId:'real-id'},
   roomCode:'G4AB23',metadata:{key:'keepOut'}},
  players:[{x:123,y:501,userId:'real-id'}]};
 const m={rtt:129.9,jitter:23.1,fps:60,buffer:73,snapshotHz:30,quality:'high',
  endpoint:'https://internal.example.com',accountId:'do-not-output'};
 const report=buildDiagnostic(raw,m,{touch:true,landscape:true,reducedMotion:true},'2026-11-21T00:00:00.000Z');
 const json=JSON.stringify(report);
 for(const forbidden of ['G4AB23','secretTest321','192.168.1.99','private.example',
  'SensitiveUA','fake@example.org','real-id','accountId','internal.example.com']){
  assert.equal(json.includes(forbidden),false,forbidden+' should not be exported');
 }
 assert.equal(report.level,6);assert.equal(report.playerRole,1);
 assert.deepEqual(report.connection.bothPlayersConnected,[true,false]);
 assert.equal(report.play.elapsedSeconds,25.8);
 assert.deepEqual(report.play.checkpointRecoveries,[1,2]);
 assert.equal(report.performance.rttMs,130);
 assert.equal(report.display.touch,true);
});
test('G4 diagnostics: malformed and special-stage user input never gets copied verbatim',()=>{
 const x=buildDiagnostic({stage:'6',role:'user',phase:'unknown<script>',connected:['true',false],
  stats:{elapsed:Infinity,deaths:-2,abilities:['4',9999999999]},
  world:{checkpoint:{index:'1',recoveries:['oops',-2]}}},
 {quality:'../../secret',jitter:Infinity,snapshotHz:-1},
 {touch:'true'},'not a timestamp');
 assert.equal(x.level,null);assert.equal(x.playerRole,null);assert.equal(x.phase,'unknown');
 assert.deepEqual(x.connection.bothPlayersConnected,[false,false]);
 assert.equal(x.performance.quality,'unknown');
 assert.equal(x.play.elapsedSeconds,null);
 assert.deepEqual(x.play.abilities,[null,9999]);
 assert.equal(x.recordedAt,null);
 assert.equal(x.display.touch,false);
 const serialized=JSON.stringify(x);
 assert.doesNotMatch(serialized,/<script>|secret|oops|not a timestamp/);
});
test('G4 diagnostics: empty report is valid local JSON, not an assertion of testing',()=>{
 const x=buildDiagnostic();
 assert.equal(x.level,null);assert.equal(x.play.gateOpen,false);
 assert.equal(x.recordedAt,null);
 assert.equal(x.performance.fps,null);
 assert.equal(x.schema,'linked-light-g4-local-v1');
});
