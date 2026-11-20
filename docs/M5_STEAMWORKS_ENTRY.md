# M5 — Steamworks integration and store readiness contract

**Status:** PRE-INTEGRATION / OWNER ACTION REQUIRED. No Steam App ID, access to Steamworks partner account, publishing rights or Windows signing certificate has been provided to the repository.

## 1. Identity and entitlement architecture

- Steam client identity is independent of a browser session or room code. The desktop shell must never infer paid ownership simply from an app query string, localStorage value, JavaScript flag, or Steam process presence.
- After actual Steamworks onboarding, integrate the official SDK under a minimal, reviewed native API. Authenticate the user's Steam session with the **authoritative backend** using Steam's supported ticket/identity verification flow. Check App ID ownership server-side before granting paid content.
- Do not commit production Steam Web API keys, publisher tokens, signed binaries or signing certificates. Keep secrets only in an approved secret manager/environment.
- Define policy for a free guest (Friend Pass) vs purchaser, simultaneous clients and revocation/restore, per Steam rules and legal review. The current browser game remains a free beta and does not grant paid entitlements.
- Server must enforce entitlement rules independently of the renderer and validate all commands/receipt replay attempts. Offline fallback may allow only an explicitly designated free demo after policy approval.

## 2. Required external owner actions

- Set up/verify Steamworks partner access, app ownership, payout and tax details and Steam Direct fees.
- Provide an authorized **test App ID** and the intended license/Guest Pass product model (do not send secrets or credentials in chat).
- Approve RU/EN store title, descriptions, screenshots, original art/capsules, gameplay trailer, prices, supported Windows OS, input devices, age fields and privacy/support address.
- Verify actual Steam release policies, lead times, private branches and sandbox purchase flows immediately before distribution; policies are time-sensitive.

## 3. Test and acceptance matrix

| Gate | Evidence required |
|---|---|
| Authentic Steam launch | Real Steam client / authorized test user launches internal build and game recognizes approved account |
| Valid ownership | Backend verifies genuine Steam ticket/entitlement and links it to game access |
| Forged/expired/foreign ticket | Server denies without fallback paid access or altering room authority |
| Guest Pass | Real invited guest can play within documented scope, without unlicensed content access |
| Refund/revocation | Refund, loss of license, restore and second-device login obey central entitlement state |
| Signing/update | Clean Windows installer and rollback tested against trusted signature on physical Windows |
| Store compliance | Steam listing, support, banking/tax, refunds, licensing and release owner review complete |

## 4. Explicit non-goals of the current code

No fake Steam authentication, mock payment success, client-side purchase switch or invented App ID will be shipped. Electron/Tauri research prototypes are not Steamworks integrations. An App ID alone does not certify authorization, distribution or payment capability.

**Commercial gate:** do not close Stage 5 / G5 until the checks above and Issue #26 external G4 criteria are genuinely met.
