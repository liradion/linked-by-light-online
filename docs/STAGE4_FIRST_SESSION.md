# Stage 4 — first-session guidance (M4 preview candidate)

**Status:** implementation candidate on the Stage 4 PR. Not a release, not a new networking protocol.

## Changes

- Server-driven session facts (room, phase, authenticated role, hostRole, member connectivity, WebSocket-ready flag and solo-mode flag) feed an accessible lobby status panel.
- Hosting is not tied to Spark: Echo may be the host; the other player's device does not change authorization.
- Host sees an invitation prompt until both seats connect, then a precise start prompt.
- Guest sees a waiting-for-host prompt, not a disabled button without explanation.
- Solo mode gets a correctly labelled **Start solo** action and a concise explanation of swapping heroes.
- Spectators and dropped connections get distinct statuses. Automatic reconnect remains in the existing WebSocket implementation.
- All visible new copy has authored Russian and English variants. The role=status panel only re-announces changed state to assistive technologies.
- Controls and gameplay state remain unchanged; existing network reconnect and storage behavior is untouched.

## Test coverage

- tests/stage4-lobby.test.js: pure role/state/locale cases, swapped host roles, solo, spectator and offline.
- e2e/stage4-first-session.spec.cjs: local multiplayer server, desktop Echo host, simulated iPhone landscape Spark guest, actual join/start in Chromium and WebKit, language switch and solo first-session.
- e2e/stage4-preview.spec.cjs: additional room-code-redacted solo-lobby screenshot in isolated visual Preview.

## Release restrictions

All testing is on an isolated CI server, with no real user room tokens, no production Supabase credentials and no public deployment. The published game is **not** updated. No gameplay state/schema/protocol edits (WS v4, checkpoints v11, package 26.0.0). Do not mark physical iPhone Safari, intercity Wi-Fi/LTE, 50 pairs, hosted staging or full G4 beta as passed by simulated browser tests.

## Review and rollback

Review public/stage4-lobby.js, public/stage4-lobby.css and the two integration points in public/client.js and public/index.html. To roll back a first-session regression, revert only these Stage 4 additions, without touching G3 cloud checkpointing or v28 room ownership. The guide never authorizes any server-side action.

Before merging, verify all required GitHub Actions against the exact final PR SHA and inspect fresh phone-size screenshots. The visual preview is not an interactive Render service.
