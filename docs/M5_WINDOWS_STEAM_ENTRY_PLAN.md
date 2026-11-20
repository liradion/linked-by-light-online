# M5 — Windows/Steam engineering handoff (PREPARED, NOT STARTED)

**Date:** 2026-11-20. **Status:** blocked pending actual M4/G4 acceptance. This document is a plan; no executable, installer, Steamworks integration or production release has been built.

## Mandatory entry

- Complete `docs/M4_VERIFICATION_AND_GATES.md` with real pair/playthrough/device evidence, legal/privacy review, isolated HTTPS/WSS staging and zero blocking incidents.
- An authorized human release owner must review the evidence and sign off the exact candidate SHA. The `stage4-acceptance.js` evidence tool is a structural guard, not an automatic truth certification.
- Keep v4 WebSocket and v11 checkpoint compatibility until versioned migrations are tested.

## Windows wrapper architecture question

The existing game is a browser Canvas client that opens WebSocket to its page origin (`public/client.js`). `server.js` is the remote authoritative room server; this is **not** a standalone local-only game. Bundling static HTML into a `file://` shell will break the current location-based WebSocket address and requires a reviewed, production-safe server URL configuration and origin/auth policy.

| Candidate | Engineering advantage | Risk to measure on Windows |
|---|---|---|
| Electron | Chromium rendering consistency with tested browser client; Node integration | Binary footprint, memory/GPU, update/security hardening, remote-origin restrictions |
| Tauri | System WebView2 runtime and potentially smaller distribution | Runtime/version variation, Rust toolchain, WebView2 behavior, native plugin permissions |

Do not choose either approach by assumption. Two isolated throwaway POCs must load the same signed/tested game client, connect to a test authoritative server, and pass gameplay/regression tests on Windows 10/11.

## Required spike

1. Establish fixed Windows 10/11 x64 hardware, OS, graphics driver and network test matrix.
2. Build a minimal Electron and a minimal Tauri candidate in independent branches with least privilege, disabled Node integration in remote pages, context isolation, navigation allowlists and CSP. Do not embed backend secrets, player room tokens or administrator keys in the app bundle.
3. Test window/fullscreen, DPI scaling, keyboard remapping, controllers, alt-tab/suspend and remote WSS recovery. Keep browser PWA fallback.
4. Measure cold startup, memory resident size, install size, CPU/GPU load, 1% FPS lows and crash reproduction. Publish methods and raw evidence; no invented benchmark numbers.
5. Select an approach with a written decision, build a signed internal test artifact and run true clean-install Windows/Steam client smoke tests.
6. Steamworks account/app/ownership, tax/banking, store licensing, refund/entitlements, Friend Pass and release approvals are separate controlled gates.

## Do not advance before

No M5 code branch, Windows installer, Steam submission, payment access change or production deploy is authorized by this handoff alone. The M5 implementation may start when owner-reviewed M4/G4 evidence is available; the commercial release has additional M5 gates in `docs/RELEASE_CHECKLIST.md`.
