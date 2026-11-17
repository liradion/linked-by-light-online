# v28 / PR #8 integration compatibility gates

**Branch:** `feat/commercial-readiness-foundation` (PR #17, draft). **Source:** independent `feat/v28-first-experience` (PR #8, draft), head `98d48cf235ec45cb38b8f96b88b99451a78c63de`. GitHub currently reports PR #8 `mergeable=false`, `mergeable_state=dirty`; do **not** auto-merge it into PR #17 or `main`.

## What has been safely adapted

- New `public/room-authority.js` provides a reusable `isHost(callbacks, role)` contract. Legacy room behavior: only Spark, role 0, is the host. On host-aware clients, the explicit boolean callback wins, so a host playing Echo (role 1) may select chapters while Spark as guest cannot. Invalid callback results deny ownership.
- `public/v20.js`, `public/v21.js`, `public/v23plus.js` use that host check **only** for chapter/room management controls: selecting stages, the v24 kitchen recipe/expedition/crafting/tournament host actions, and v25 seed generation. Physical character abilities (Spark/Echo mechanics) stay bound to their assigned roles.
- Host labels in v21/v23 no longer identify the owner as Spark. RU/EN copy and existing room behavior are preserved.
- `tests/chapter-host-role.test.js` covers owner callback semantics, 0/1 legacy fallback and invalid callback denial. `e2e/chapter-host-role.spec.cjs` covers a real two-device room and chapter gates across all three UIs. This is a compatibility **foundation**, not proof that PR #8 is integrated.

## Conflict and dependency inventory

GitHub reports 11 paths touched by **both** PRs, not necessarily 11 textual conflict hunks:

| Path | Integration treatment |
|---|---|
| `server.js` | High risk: preserve v27 durable room backups, protocol 4, restore validation, hostRole, solo switch and redacted role clues; independent security review |
| `public/client.js` | High risk: combine current RU/EN, clean-play, reconnect and demo with role chooser, Web Share, solo input and pings without duplicate handlers |
| `game-core.js` | Solo results must be assisted; preserve current score rules and campaign progression |
| `public/index.html` | Keep localized stage/aux/v20/v21/v23 catalogs and new room authority script in load order; integrate v28 controls and styles without blocking mobile screen |
| `public/v20.js`, `public/v21.js`, `public/v23plus.js` | Retain existing translations, draft preservation and this host adapter; reconcile physical-role and host-role semantics |
| `public/beta.js` | Merge first-use guidance; preserve translated onboarding, accessibility and optional account flow |
| `playwright.config.cjs` | Reconcile isolated test room capacity without modifying Render production limit |
| `README_RU.md` | Update documentation after integration acceptance |
| `tests/auth-ui.test.js` | Update script-version checks only after final frontend bundle selection |

Non-overlapping but server-sensitive PR #8 files include `v28-core.js`, `v28-telemetry.js`, `v24-world.js`, `public/v28.js`, `public/v28.css`, `public/sw.js`, `public-beta-http.js`, network tests and role-visibility E2E. Simply copying these without adapting their server/client callers is unsafe.

## Stage-gated integration sequence

1. Create a **new isolated integration branch** off the latest fully passing PR #17 candidate, leaving both source branches as recoverable references. Inspect actual conflict hunks; do not force-merge.
2. Integrate v28 server host-role ownership, persistent checkpoint restoration, solo restrictions and role-specific clue filtering. Retain protocol 4 and save profile v11; add migration/backwards-compat tests before UI changes.
3. Integrate the v28 client first-start, Web Share, wake/retry, controlledRole, solo input and ping UI with the existing clean-play navigation and RU/EN catalogs. Preserve guest invite URLs and device-local language.
4. Test room creation with role 0 host and role 1 host, reconnect after browser reload, guest leave/rejoin, spectators, private role clues, replay, solo mode, abuse/rate limits and server restart.
5. Run Node tests, browser E2E in Chromium/WebKit, isolated capacity and impaired-network tests at the same commit; compare changed scripts and translated asset loading.
6. Perform physical Windows Chrome + iPhone Safari cross-network verification: invite from messenger, Share Sheet, Wi-Fi↔LTE, sleep/background, gestures/safe areas, keyboard/gamepad, solo switching and two-user stage controls.
7. Collect independent playtest evidence (≥50 player pairs for G1). Approve engineering merge and public release **separately**. PR #8 and PR #17 remain draft until that decision.

## Security invariants

- The `isHost` UI adapter only changes button visibility. The server must authorize ownership for `selectStage`, `start`, `v24Action`, `v25Generate` and any admin/solo requests; a spoofed client callback must never grant access.
- Do not copy guest tokens, letters, room invitation codes, profile keys, IP addresses or message bodies into private telemetry.
- `visibleTo` role-specific intelligence must be filtered server-side **before** WebSocket delivery, including to spectators.
- Saved profile/room schema remains version 11 until separately reviewed; old rooms must default hostRole to role 0.
- Never enable new solo/role-choice controls on the production server without protocol compatibility, CI, real-device QA and explicit user authorization.

## Rollback

Revert the UI-only host adapter, its reference in `public/index.html`, v20/v21/v23 ownership checks, translation keys, Node/browser tests and this document. This draft step contains **no** v28 server mode, database migration, production endpoint or public deployment.
