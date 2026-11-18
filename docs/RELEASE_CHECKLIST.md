# Linked by Light — Release checklist and approval gates

No step here implies any store submission, certification, successful tests or live deployment.

## 0. Exact candidate identity
- [ ] Candidate Git SHA: `<SHA>`
- [ ] Public version, protocol, save schema and content count documented.
- [ ] All applicable PRs reviewed; no unresolved merge conflicts with v28.
- [ ] Staging configuration documented, including server capacity and durable storage.
- [ ] Release owner and incident contact recorded.

## 1. Technical acceptance
- [ ] `npm test` green for exact candidate SHA.
- [ ] Browser Chromium/WebKit E2E green.
- [ ] Real Windows Chrome and physical iPhone Safari playtest across independent networks.
- [ ] Server reconnection and checkpoint recovery after restart verified.
- [ ] 50/100/200-player benchmark with comparable hardware and network methodology recorded.
- [ ] No known P0 bugs; all blocking tickets closed with regression test.
- [ ] Safe-area, contextual abilities, accessibility and clean-play HUD validated.
- [ ] Backup restore and rollback rehearsed.

## 2. Business and legal
- [ ] Product name/trademark and rights chain checked by appropriate owner.
- [ ] Asset/music/font/source licences documented and suitable for commercial use.
- [ ] Terms, privacy policy, data deletion, abuse report and support contact published.
- [ ] UGC publication disabled or supported by moderation/reporting.
- [ ] Platform accounts/banking/tax onboarding completed.
- [ ] Prices, localization, refunds, account/entitlement model approved.
- [ ] Chargeback/refund/revoke/regrant and purchase restore flow tested.

## 3. Steam
- [ ] Steamworks onboarding and app fee complete; lead times satisfied.
- [ ] Playable Windows build, clean installation, version metadata, signature and required redistributables.
- [ ] Store capsule art, screenshots, genuine gameplay trailer, descriptions, languages and age fields.
- [ ] Steam demo and launch branch validated in Steam client.
- [ ] Store review accepted; full game approved.
- [ ] Release approval recorded; rollback and support ready.

## 4. Google Play — after Windows proof
- [ ] Android API target and current policy reviewed just before upload.
- [ ] Signed AAB built and tested on physical range of devices.
- [ ] Google Play Billing sandbox, backend receipt verification, restore/refund.
- [ ] Data Safety form, privacy page, account deletion and content rating complete.
- [ ] Applicable closed test and production access requirements met.
- [ ] Review approved and staged rollout plan recorded.

## 5. App Store — after mobile proof
- [ ] Developer Program, signing, Xcode and platform SDK policy verified.
- [ ] iOS/TestFlight build tested on real hardware, Safe Areas, interruptions, performance.
- [ ] StoreKit, backend entitlement verification and restore/refund.
- [ ] Sign-in policy, privacy disclosures, age rating, UGC moderation and App Review test path complete.
- [ ] App Review approval and phased rollout authorized.

## 6. Production launch protocol
1. Capture pre-deploy status, durable backups and expected SHA.
2. Stage candidate; complete smoke and full manual acceptance.
3. Obtain **explicit human launch approval** for exact candidate and platform.
4. Deploy, verify `/version` reports expected SHA, `/health`, `/ready`, and join real test room.
5. Monitor incidents, store operations and server cost continuously during launch.
6. If P0, stop rollout/rollback with documented customer-communication process.

**Do not merge open PR #8 or push unverified production binaries simply because this checklist exists.**
