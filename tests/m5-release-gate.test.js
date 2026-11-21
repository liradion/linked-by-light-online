'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path');
const {evaluate}=require('../scripts/m5-release-gate.cjs');
const root=path.join(__dirname,'..');
test('M5 unsigned and unapproved repository template fails closed',()=>{
 const evidence=JSON.parse(fs.readFileSync(path.join(root,'docs/M5_RELEASE_EVIDENCE_TEMPLATE.json'),'utf8'));
 const g4=JSON.parse(fs.readFileSync(path.join(root,'docs/G4_EVIDENCE_TEMPLATE.json'),'utf8'));
 const result=evaluate(evidence,g4);
 assert.equal(result.status,'HOLD');
 assert.ok(result.missing.includes('g4-matching-audited-evidence'));
 assert.ok(result.missing.includes('windows-valid-signature'));
 assert.ok(result.missing.includes('steamworks-entitlement-backend'));
 assert.equal(result.candidateSha,null);
});
test('M5 requires actual matching SHA and never consumes tokens or personal identity',()=>{
 const g4={candidateSha:'1'.repeat(40)};
 const x={candidateSha:'2'.repeat(40),windows:{installerSha256:'x'.repeat(64)},
  steam:{partnerAccountVerified:true,token:'PRIVATE_SECRET'},owner:{exactShaApproved:true,reviewer:'owner'}};
 const output=evaluate(x,g4);
 assert.equal(output.status,'HOLD');
 assert.ok(output.missing.includes('exact-candidate-sha')===false);
 assert.ok(output.missing.includes('windows-installer-sha256'));
 assert.ok(output.missing.includes('g4-matching-audited-evidence'));
 assert.doesNotMatch(JSON.stringify(output),/PRIVATE_SECRET/);
});
test('M5 never includes a function that directly releases or pays Steam',()=>{
 const source=fs.readFileSync(path.join(root,'scripts/m5-release-gate.cjs'),'utf8');
 assert.doesNotMatch(source,/steamworks\.publish|purchaseTicket|steamDirect\.pay/);
 assert.match(source,/HUMAN_AUDIT_REQUIRED/);
 assert.match(source,/evaluateStage4Evidence/);
});
test('M5 actual Windows signature check uses OS Authenticode and SHA256, rejects unsigned',()=>{
 const script=fs.readFileSync(path.join(root,'scripts/verify-m5-windows-signature.ps1'),'utf8');
 assert.match(script,/Get-AuthenticodeSignature/);
 assert.match(script,/Get-FileHash/);
 assert.match(script,/SignerCertificate/);
 assert.match(script,/Status -ne 'Valid'/);
 assert.match(script,/commercialReleaseApproved=\$false/);
});
