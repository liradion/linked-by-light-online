'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {encrypt,decrypt,validateKey,fingerprint,active}=require('../cloud-store');
const key='12'.repeat(24),other='24'.repeat(24);
test('cloud backup recovery requires a 192-bit secret',()=>{
 assert.ok(validateKey(key));assert.ok(!validateKey('ABC123'));assert.equal(fingerprint(key).length,64);assert.notEqual(fingerprint(key),fingerprint(other));
});
test('cloud payload encrypted with authenticated AES-256-GCM, never plaintext',()=>{
 const payload={version:11,checkpoint:39,adventure:{skin:'galaxy',home:[{item:'lamp',slot:1}]}};
 const cipher=encrypt(key,payload);assert.ok(!cipher.includes('galaxy'));
 assert.deepEqual(decrypt(key,cipher),payload);
 assert.throws(()=>decrypt(other,cipher));
 const tampered=cipher.slice(0,-3)+'abc';assert.throws(()=>decrypt(key,tampered));
});
test('cloud connection is not misrepresented as active without server credentials',()=>{
 if(!process.env.SUPABASE_URL)assert.equal(active,false);
});