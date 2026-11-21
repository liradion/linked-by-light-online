'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {parseTarget,expectedCommit}=require('../scripts/verify-g4-staging.cjs');
const repo=path.join(__dirname,'..');
const blueprint=fs.readFileSync(path.join(repo,'staging/render.yaml'),'utf8');
const main=fs.readFileSync(path.join(repo,'render.yaml'),'utf8');

test('G4 staging Blueprint does not target production service, branch automation or shared secrets',()=>{
 assert.match(blueprint,/name: linked-by-light-g4-staging/);
 assert.match(blueprint,/plan: free/);
 assert.match(blueprint,/autoDeployTrigger: off/);
 assert.match(blueprint,/healthCheckPath: \/ready/);
 assert.doesNotMatch(blueprint,/name: linked-by-light-eu/);
 assert.doesNotMatch(blueprint,/(SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY|DATABASE_URL|LL_ADMIN_TOKEN)\s*:/);
 assert.match(main,/name: linked-by-light-eu/);
});
test('G4 remote verifier cannot be pointed at production, insecure URL or local host',()=>{
 for(const bad of [
  'https://linked-by-light-eu.onrender.com/',
  'https://LINKED-BY-LIGHT-EU.ONRENDER.COM/',
  'http://linked-by-light-g4-staging.onrender.com/',
  'https://linked-by-light-g4-staging.onrender.com/room',
  'https://user:password@linked-by-light-g4-staging.onrender.com/',
  'https://localhost/',
  'https://127.0.0.1/',
  'javascript:alert(1)',undefined,''
 ])assert.throws(()=>parseTarget(bad));
 assert.equal(parseTarget('https://linked-by-light-g4-staging.onrender.com/').origin,
  'https://linked-by-light-g4-staging.onrender.com');
});
test('G4 verifier requires exact SHA, no branch names or shortened versions',()=>{
 const sha='0123456789abcdef0123456789abcdef01234567';
 assert.equal(expectedCommit(sha),'0123456789ab');
 for(const bad of ['',undefined,'main','0123456789ab','g'.repeat(40),null])assert.throws(()=>expectedCommit(bad));
});
test('G4 remote verifier sends only read-only requests and no room creation',()=>{
 const source=fs.readFileSync(path.join(repo,'scripts/verify-g4-staging.cjs'),'utf8');
 for(const path of ['/version','/health','/ready','/ws'])assert.ok(source.includes(path));
 assert.doesNotMatch(source,/t:\s*['"](?:create|join|start|input)['"]/);
 assert.match(source,/method:'GET'/);
});
