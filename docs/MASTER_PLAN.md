# Linked by Light — Commercial Readiness Master Plan

**Baseline:** main `d0dcb16` (UI v27.2); package version `26.0.0`; WebSocket protocol `4`; 137 campaign stages (indexes 0–136); saved profile/room schema version 11. **Status:** planning and engineering in progress; **NOT** Steam, Google Play or App Store ready.

## Product definition

A short, emotionally compelling cooperative platformer for two people playing from different devices and locations. The initial commercial release targets **Windows/Steam**, followed by Android and then iOS **only after product/technical gates pass**. Core promises: meaningful two-character cooperation, approachable onboarding, stable cross-network play, control parity, genuine polished 2–4h curated campaign, optional free guest via Friend Pass *if licensing and platform conditions are solved*.

**Non-goals before first release:** new massive worlds, social marketplace, voice chat, new engine, cosmetics economy, consoles. Feature count is not a success metric.

## Project status and release policy

- `main` includes v27.2 calm/clean UI but no demonstrated commercial acceptance test.
- Open PR #8 (`feat/v28-first-experience`) contains proposed first experience, solo mode, role selection, pings and privacy-safe funnel. **Unmerged**; browser/physical acceptance and explicit release approval required by its PR.
- Existing v27 stability modules require staging verification of durability and database configuration. Render `render.yaml` uses Free plan, Frankfurt region and `BETA_MAX_ROOMS=5`.
- Do not change public version, data schema, payments, server limits or production release without tests and explicit, recorded release gate approval.

## Milestones and work packages

All statuses default to TODO until **evidence is linked**. A merged implementation alone does not imply a passed gate.

### M0 — Baseline audit / release management (P0)
- [ ] Record production `/version`, `/health`, `/ready` and compare to `main`.
- [ ] Run `npm test`, web smoke and Chromium/WebKit E2E on the exact candidate commit.
- [ ] Review PR #8 against v27.2 UI and v27 storage for conflicts.
- [ ] Freeze baseline and create recoverable release tag; require reviewed PR and passing CI.
- [ ] Inventory all 137 levels, mechanics, assets, fonts, libraries, audio licensing, third-party services.
- [x] Generate **structural** metadata-only inventory of 137 stage definitions; no playability claim (see [STAGE_AUDIT.md](STAGE_AUDIT.md) and `node scripts/audit-levels.js`).
- [ ] Record architecture risks, crash cases and rollback drill.

### M1 — 30-minute vertical slice (P0)
- [ ] Choose 5–10 distinctive co-op stages and document a compelling 30-min loop.
- [ ] First-use UX: device-neutral role choice, reliable invite URL/native share, start, replay and guided onboarding.
- [ ] Contextual mobile controls, including v20/world abilities, without losing clean-mode simplicity.
- [ ] First session with no blocking popups; understandable goal/feedback; navigable level transitions.
- [ ] Solo tutorial only if authoritative v28 server implementation passes QA; no fake partner bot.
- [ ] Recruit ≥50 independent pairs and record completion, difficulty, delight, failure reasons.
- [ ] Iterate until at least 80% begin without developer help and majority complete first objective.

### M2 — Gameplay/content alpha (P0)
- [ ] Audit all levels: completion, state transitions, softlocks, simultaneous puzzles, abuse, shortcuts.
- [ ] Keep/repair/remove decision per level; select coherent 2–4h main campaign.
- [ ] Balance Spark/Echo contribution, timing windows and recoverability; reduce waiting-only play.
- [ ] Verify all boss patterns, fair telegraphs, death recovery and co-op goals.
- [ ] Create coherent chapter narrative, ending, prompts, audiovisual feedback and multilingual strings.
- [ ] Control accessibility: remapping, contrast, reduced motion, subtitles, safe areas, gamepad.
- [ ] Do not promise 137 *polished* stages until all are measured.

### M3 — Network/storage/security alpha (P0)
- [ ] Establish regional RTT/jitter/p95 playability SLOs from real device pairs.
- [ ] Test reconnection, tab switching, sleep, LTE↔Wi-Fi, network partitions, slow clients.
- [ ] Validate persistent recovery against crashes and full process restart, including all stage profiles.
- [ ] Load-test 50/100/200 players in **isolated staging**, not public Render Free.
- [ ] Verify server-authoritative actions, input replay protection, invite access, rate limits, backpressure.
- [ ] Configure durability and secrets in staging; test encrypted backup restore and key rotation.
- [ ] Calculate server expense per active player pair; size and monitor capacity.

### M4 — Content/presentation beta (P1)
- [ ] Unified consumer-facing UI; remove version numbers from user-facing navigation.
- [ ] Visual design, animation, sound mix, consistent localized RU/EN game copy.
- [ ] Curated progression, accessible hints, action affordances and first-contact storytelling.
- [ ] Asset rights register, privacy notice, moderation or disable publishing UGC until safe.
- [ ] Closed external beta and crash/retention/funnel dashboards with privacy controls.
- [ ] Zero known blocking softlocks or lost paid entitlements.

### M5 — Windows + Steam release candidate (P0)
- [ ] Compare Electron/Tauri packaging in a realistic build (memory, startup, GPU, security).
- [ ] Offline failure UX; verified clean-install Windows 10/11 x64, gamepad, DPI and scaling.
- [ ] Steamworks integration, app ID, license validation, private branches, achievements optional.
- [ ] Steam Direct onboarding, banking/tax setup, store metadata, trailer, capsules, RU/EN.
- [ ] Public Coming Soon, demo and playtest; comply with store lead times.
- [ ] Pricing/regions, refunds, support, telemetry disclosures, QA and staged launch.
- [ ] Review GO/NO-GO against `docs/RELEASE_CHECKLIST.md`; promote only approved candidate.

### M6 — Android (conditional on Windows market proof)
- [ ] Choose and performance-test Android runtime; signed `.aab` and Play Console setup.
- [ ] Safe-area, orientation, background/foreground, thermal/battery and touch targets.
- [ ] Google Play Billing + verified entitlements, refunds and restore; region requirements.
- [ ] Data Safety/privacy, testing cohort, store listing, supported API compliance.
- [ ] Cross-platform co-op with Steam and iOS clients on actual consumer networks.
- [ ] Gradual rollout with ANR/crash/payment monitoring.

### M7 — iOS (conditional on mobile viability)
- [ ] macOS/Xcode signing, builds, certificates, App Store Connect/TestFlight.
- [ ] Native-quality iPhone usability, 3rd-party login compliance, safe areas and resume.
- [ ] StoreKit + verified entitlements/restores; App Review docs, age rating and privacy.
- [ ] Real physical device beta across iOS versions and cellular/Wi-Fi, reviewer test account.
- [ ] Monitor rating, crashes, refunds and server load after staged release.

### M8 — Live operations and growth (P1)
- [ ] First 30-day bug triage: P0 data/payment/crash first, P1 balance/performance next.
- [ ] Weekly cohort and per-platform revenue/refund/retention analysis.
- [ ] Steam wishlist-to-sale, mobile install-to-purchase, organic vs paid acquisition economics.
- [ ] Customer support, rollback, incident communications and moderation process.
- [ ] Roadmap new worlds/features only if retention and financial economics justify them.

## Release gates (must be evidence-backed)

| Gate | Exit criterion | Evidence |
|---|---|---|
| G0 Audit | Version, dependencies, rollback and PR #8 conflicts documented | audit notes, exact SHA |
| G1 First Playable | 50 independent pairs; ≥80% start unassisted | anonymized playtest report |
| G2 Vertical Slice | 30 minutes coherent co-op; all critical actions accessible | video + QA cases |
| G3 Alpha | Curated campaign finishable; persistent server recovery | full-run matrix |
| G4 Beta | No open P0, tested regional multiplayer, crash-free ≥99.5% target | CI, staged soak |
| G5 Steam RC | Store compliance, clean installer, account and support, approvals | checklist signed |
| G6 Android/iOS | Platform payment, recovery, signed builds, live device acceptance | Play / TestFlight |

## Definition of Done — all engineering changes

1. Reproduction/requirement, explicit tests and backwards-compatibility statement.
2. Unit/integration tests pass in CI; user-facing UI covered in Chromium and WebKit.
3. Physical Windows/iPhone checks for interaction/connection-affecting features.
4. No exposed tokens, private text or personal data in logs/telemetry.
5. Rollback instructions and release notes available.
6. Reviewer approves PR; release operator separately approves deployment.

## Dependency chain

`M0 → M1 → G1 → M2/M3 (parallel) → G3 → M4 → G4 → M5/Steam → (market validation) → M6/Android → (mobile validation) → M7/iOS`.

Do **not** mark unchecked items as delivered simply because source code exists. For detailed QA, economics and release criteria see `QA_MATRIX.md`, `ECONOMICS.md`, `RELEASE_CHECKLIST.md`, and `PRIVACY_AND_SECURITY.md`.
