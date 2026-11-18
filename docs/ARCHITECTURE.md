# Linked by Light — architecture, packaging and migration strategy

**Observed baseline:** Node.js >=20, zero-dependency HTTP static server and RFC6455 WebSocket, 60Hz authoritative `game-core.js`, browser Canvas render in `public/client.js`, stage definitions shared with backend, 20Hz state delivery as documented, version 26.0.0 and protocol 4.

## Existing modules (main)
- `server.js`: HTTP, room ownership, persistence, WebSocket orchestration.
- `game-core.js`: authoritative physics, progression, player inputs.
- `shared/stages.js`, `shared/v20-stages.js`, `shared/v21-stages.js`, `shared/v23-stages.js`: shared level definitions.
- `public/client.js`: canvas loop, interpolation/prediction, controls and UI.
- `public/play-ui.js` / `play-ui.css`: compact menu and clean-play controls.
- `public/adventure.js`, `v20.js`, `v21.js`, `v23plus.js`: chapter-specific UI/actions.
- `cloud-store.js`, `room-checkpoint.js`, `runtime-monitor.js`: encrypted persistence and readiness.
- `websocket-transport.js`, `action-replay-cache.js`: transport validation/replay protection.
- `render.yaml`: Frankfurt free-service candidate, beta room cap five.

## Architecture contract
1. The **server owns** movement, positions, puzzles, room roles, unlocks, verified paid entitlements.
2. Clients may predict movement for visual smoothness, but server snapshots reconcile state.
3. Client must never be able to purchase, grant content, complete stage or change other player's role without validated server authority.
4. Signed app binaries (Windows/Android/iOS) remain thin clients sharing the same stable protocol and content logic wherever practical.
5. Save schema and protocol changes require versioned read/migration tests, graceful fallback and rollback plan.

## Packaging architecture (decision not made)
- **Windows:** evaluate Electron vs Tauri via short proof of concept on startup time, memory, GPU, full screen, input, browser/WebView security, Steamworks integration and update flow.
- **Android:** evaluate secure WebView-based shell (e.g. Capacitor) vs engine migration based on performance and policies. No automatic plugin loader for untrusted code.
- **iOS:** test WKWebView rendering, lifecycle, signed IPA/TestFlight, StoreKit and real-device safe areas. A wrapped website alone may not satisfy App Review.
- Prefer single game logic layer and platform adapters to three divergent clients.

## Backend scale plan
- First run isolated load test 50/100/200 clients at realistic input frequency.
- Measure p95 tick interval, CPU/RSS, RTT, snapshot delivery, bandwidth and failed joins.
- Design **room affinity** before attempting horizontal scaling: two players must reach one authoritative room process. Evaluate sticky routing or per-room shard directory.
- Plan durable storage, session handoff/recovery and safe shutdown before multi-instance.
- Monitoring: health liveness, readiness, latency, failed joins, room occupancy, error rates; no sensitive room token logs.

## Key migration checkpoints
- v11 room/profile backwards compatibility retained until documented migration.
- WebSocket protocol 4 until explicit version negotiation and test rollout.
- PR #8 v28 changes role and first-use semantics: verify hostRole and seat semantics on a separate staging environment before any production release.
- Do not enable database migration/archive or rotate keys without backups and staging restore.
- Never store Steam/Google/Apple payment secrets or signing keys in source control.

## Operational release flow
PR → CI (Node + Chromium/WebKit) → staging smoke → physical device acceptance → human release gate → tagged build → limited rollout → monitored operation → rollback if P0. Do not allow default branch write to implicitly count as market release.

## Pending engineering decisions
- Payment entitlement service and account identity model.
- Official Friend Pass policy per platform, and limits across stores.
- Region selection and lobby room routing.
- Telemetry consent/retention and data deletion workflow.
- Support target hardware and supported OS/API versions.
