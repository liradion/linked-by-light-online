# Linked by Light — QA and acceptance matrix

Status: **PLAN, NOT EXECUTED**. Test each release candidate by full Git SHA; store date, OS/browser, network, participants, result, logs, screen recording and issue link.

## Automated gate
- `npm test`: server physics, WebSocket protocol 4, roles, saves v11, v20/v21/v23, rate limits and admin rules.
- `npm run smoke:deploy -- --url=https://linked-by-light-eu.onrender.com --expect-commit=<sha>`: read-only production verification **after approved deployment**.
- `npx playwright test --config=playwright.config.cjs`: Chromium+WebKit, including clean-mode controls, invitations, lobby, game transitions.
- `npm run bench:load -- --cases=50,100,200 --duration=8 --warmup=2 --input-hz=25`: isolated local/controlled staging only.
- Validate syntax and targeted CSS/JS integration tests on every PR.

## Device/role matrix
| Setup | First join | Movement | Abilities | Reconnect | Persistence | Results |
|---|---|---|---|---|---|---|
| Windows Chrome Spark ↔ Windows Edge Echo | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Windows Chrome ↔ iPhone Safari Wi-Fi | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Windows ↔ iPhone LTE (different network) | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Windows ↔ Android Chrome Wi-Fi | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Android ↔ iPhone both cellular | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Windows keyboard ↔ Windows gamepad | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| iPhone host Echo ↔ Windows guest Spark (v28 only) | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |

## First session
- ☐ Fresh guest can create a room, invite and play without sign-in.
- ☐ Invite deep link opens the correct room; invalid/expired invite produces actionable error.
- ☐ First objective and roles are explained without technical version labels.
- ☐ Native iOS share sheet, clipboard fallback and Safari reload behave correctly.
- ☐ Slow server wake, retry, and disabled/offline state convey truthful status.
- ☐ Solo mode (v28 candidate) cannot accept second seated client; role switch clears input.
- ☐ Clean-play HUD hides decorative chrome, maintains directional, jump, ability **plus necessary contextual actions**, and has a visible restore button.
- ☐ Open dialogs, reconnect banners, error notices and game completion overlays remain accessible in clean mode.

## Core physics & content
- ☐ Every selected main-campaign stage is passable with two actual players.
- ☐ Both players can see stage outcome; simultaneous input produces consistent authoritative state.
- ☐ Physics: jumps, input timing, wall collision, pad, crystals, bridge, gates, portal.
- ☐ v20 (stages 100–111) tether, phase switch and time abilities on touch and PC.
- ☐ v21 (112–121) specialized coop actions and menus accessible under clean mode.
- ☐ v23 (122–136) special physics UI, map/gameplay context and bosses.
- ☐ Fail/respawn/checkpoints work; no softlock after partial objective.
- ☐ Pause/resume/redo and leave/rejoin do not duplicate scores or corrupt stages.
- ☐ Full curated campaign completion and ending tested.

## Unstable network / data
- ☐ Simulate 100–400 ms RTT + 0–5% packet loss + jitter.
- ☐ LTE→Wi-Fi, airplane toggle, foreground/background, device sleep, network drop.
- ☐ Recover after server restart; verify roles, checkpoint, cosmetics, purchases.
- ☐ Backups: clean restore, corrupted checkpoint, archive lag, encryption key rotation.
- ☐ Replay and duplicate command IDs do not duplicate entitlement-changing actions.
- ☐ Private room tokens must never appear in public responses or analytics.
- ☐ 50/100/200-player staging soak tested; document p50/p95/p99 RTT and tick gap.

## Platform quality
- ☐ Windows 10/11 clean install, uninstall, Steam launch, full-screen/windowed, DPI, gamepad.
- ☐ Android release AAB signed, billing sandbox, back gestures, orientation, interruptions, memory pressure.
- ☐ iOS signed archive/TestFlight, StoreKit sandbox, App Review path, safe area, background reconnect.
- ☐ Declared minimum platform specs are supported; measure RAM, FPS, crashes, ANRs and battery.
- ☐ Text, controls, contrast, reduced-motion and subtitles checked at supported scales.
- ☐ Cross-platform purchases/Guest Pass entitlements tested according to platform policies.

## Severity
- **P0 blocking:** data loss, unexpected charge, loss of purchased access, crash loop, severe exploit, game impossible to complete, persistent network desync.
- **P1:** major usability/accessibility regression, key action missing on some supported device, significant degraded performance.
- **P2:** polish or non-critical content.
Never override a P0 through a date-driven release.
