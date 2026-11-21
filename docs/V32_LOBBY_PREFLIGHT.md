# Linked by Light — v32 lobby RTT preflight (engineering candidate)

**Scope:** Improve the two-device first session without changing authoritative simulation, network protocol, player roles or saved rooms.

## Behavior

- Each client sees a connection hint inside the waiting-room guide; no extra click or settings panel is needed.
- The hint measures that client's WebSocket ping round-trip to the server; it never claims to measure direct PC-to-iPhone latency or remote player ping.
- RTT categories for onboarding only: below 180 ms normal, 180–349 ms elevated, 350+ ms high. These are UX guidance, not certified playability thresholds.
- Before the first valid pong, UI says it is measuring; after connectivity loss it says reconnecting. A new socket resets prior RTT so stale green values cannot survive disconnect.
- Displays RU/EN copy and fits compact iPhone landscape. Connection status does not alter the server's start permissions, roles, invitations or matchmaking.
- No telemetry, external endpoints, analytics, identifiers, room codes or access tokens are added.

## Compatibility and verification

Changed: public/stage4-lobby.js, public/stage4-lobby.css, public/client.js, public/index.html.
Tests: tests/v32-lobby-preflight.test.js and e2e/v32-lobby-preflight.spec.cjs.

Run npm test and Chromium/WebKit Playwright suites against exact PR SHA. Field verification must check genuine Windows and physical iPhone Safari on independent networks, roles reversed, 200–500 ms RTT scenarios, Wi-Fi to LTE changes and resume after Safari backgrounding. CI emulation cannot replace these tests.

**Release:** G4 Issue #26 remains HOLD. Do not merge without CI review; do not deploy Render production, change package version, distribute unapproved installers or claim device validation. Safe rollback: revert PR; deploy only after separate owner approval. Existing WSS protocol v4 / saved room v11 unchanged.
