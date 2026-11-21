# M5 — Windows and Steam: executable pre-release safeguards

The existing `desktop/electron` and `desktop/tauri` compile unsigned **internal** research shells in Windows GitHub runners. A Windows executable is not evidence of a legal, signed, Steam-approved product.

## Windows signing evidence (real Windows host required)

Once a human-controlled publisher certificate and installer exist, use Windows PowerShell:

```powershell
./scripts/verify-m5-windows-signature.ps1 -Installer "C:\Path\To\ApprovedSetup.exe" -ExpectedSha256 "<64_HEX_SHA256>" -ExpectedPublisher "<approved certificate subject>"
```

The verifier fails unless the EXE exists, SHA-256 matches, Authenticode status is **Valid**, and the certificate subject matches the expected publisher. It prints technical evidence but does not sign, submit, or authorize the installer. Do not store certificates or signing passwords in GitHub.

## M5 release gate (offline human evidence)

Never commit completed evidence files. Copy `docs/M5_RELEASE_EVIDENCE_TEMPLATE.json` outside this repository, add only nonsecret verified fields, and separately supply a privately completed G4 evidence report:

```bash
node scripts/m5-release-gate.cjs --evidence=PRIVATE_M5.json --g4=PRIVATE_G4.json
```

The default files **fail closed** and the gate also needs exact G4 SHA, true physical Windows 10/11 tests, controllers and reconnect, confirmed real Windows publisher signature, server-side Steam ownership check, Friend Pass/refund cases, actual rights/privacy review and owner approval. A metadata-complete outcome is only `METADATA_COMPLETE_HUMAN_AUDIT_REQUIRED` and is **not** approval to publish.

No Steamworks App ID, SDK, signing certificate, account, invoice, paid entitlement or real purchase has been provided. Steam integration, SDK native bridge, server-side ticket validation, Steam page, fees and store review remain external separately authorized work. **G4 #26 and G5 #28 remain HOLD.**
