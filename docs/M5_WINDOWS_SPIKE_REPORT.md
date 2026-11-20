# M5.1 — Windows shell technical implementation and comparison ledger

**Date:** 2026-11-20. **Branch:** `feat/m5-windows-shell-spike`. **PR:** #27. **Scope:** engineering proof of concept only; G4 remains HOLD in Issue #26.

## Architecture baseline

- Game client: existing HTML/CSS/Canvas JavaScript; server: authoritative Node.js WebSocket protocol 4, checkpoint schema v11.
- Client runs from fixed HTTPS first-party origin. It does not become an offline-first compiled game and must not turn into a trusted source of gameplay truth or entitlements.
- Windows candidate A: Electron 45 x64, Chromium embedded, strict renderer sandbox/no Node integration, native reconnect, fullscreen and offline fallback.
- Windows candidate B: Tauri 2 + WebView2 x64, separate Rust host, no privileged remote capabilities and first-party-only top-level navigation.
- Both prototypes reference the first-party currently deployed public game; they do NOT prove Stage 4 is live on that server.

## Verification and decision policy

CI workflow: `.github/workflows/m5-windows-spikes.yml` (Windows Server 2022 VM). Two jobs compile unsigned internal artifacts and save SHA256 + size reports. Electron also has a Windows GUI smoke that creates an isolated local-server room, and Tauri tests restrict off-site navigation.

**Do not compare performance by raw EXE size alone.** Tauri relies on WebView2; Electron distributes a Chromium runtime. Compare combined install/runtime requirements, cold start, resident memory, CPU/GPU during the same stage, FPS p1/p50/p95, reconnection, safe-area/DPI scaling and gamepad on two real Windows 10/11 PCs.

### Evaluation matrix

| Criterion | Electron | Tauri/WebView2 | Evidence needed |
|---|---|---|---|
| Windows x64 compilation | CI job / artifact, result must be checked per SHA | CI job / artifact, result must be checked per SHA | Workflow artifact SHA256 + logs |
| First-session room/invite | Local Electron GUI smoke | Not yet manually played in WebView2 | Two-player room recording |
| No privileged remote JS | Node integration disabled, sandboxed renderer | No Tauri remote capabilities + guarded navigation | Code audit + compiled tests |
| Windows 10/11 clean install | Not tested | Not tested | Device/video/reporter OS |
| Gamepad/DPI/fullscreen/reconnect | Not physically measured | Not physically measured | Equivalent 30-min trials |
| Startup/peak memory/CPU/GPU | Not measured on equivalent real hardware | Not measured on equivalent real hardware | Raw numerical report |
| Steamworks & paid entitlements | Not integrated | Not integrated | Genuine AppID/Steamworks sandbox verification |
| Signed and commercially licensed installer | Not produced | Not produced | Certificate, rightsholder records, release owner |

**Framework decision:** **PENDING** actual equal-hardware evidence. Electron may simplify Chromium parity, Tauri may reduce app footprint, but neither should be selected using speculative numbers.

## Required follow-up to close M5

1. Isolated live HTTPS/WSS staging with production-like authoritative backend and tested v4/v11 recovery; G4 physical first-use evidence documented.
2. 30+ minute equal-hardware Windows 10 and 11 test of both shells, including USB/Bluetooth controller, 100–400 ms RTT, offline handling, Alt+Tab, DPI and multi-monitor.
3. Choose shell and produce a real signed installer (clean installation, uninstall, Windows Defender/SmartScreen outcomes, no embedded secrets), rather than distributing unsigned research ZIPs.
4. Obtain Steamworks developer account and App ID, integrate official client API under a reviewed server-side entitlement verification model, test Steam client launch, private demo and Friend Pass rules.
5. Complete store capsules/screenshots, trailer, RU/EN descriptions, requirements, age category, pricing/taxes/banking, privacy/support and refunds.
6. Satisfy G4 external evidence (Issue #26) and obtain release-owner GO/NO-GO for exact SHA before Steam/production.

**Status:** M5.1 proof-of-concept in progress, M5 release candidate NOT ACCEPTED. Do not close Issue #25 solely for a green CI job.
