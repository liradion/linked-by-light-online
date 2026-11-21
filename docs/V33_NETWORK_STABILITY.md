# Linked by Light — v33: connection stability preflight (engineering candidate)

## Scope

Extend the v32 local server RTT indicator. No protocol v4 changes, server-authoritative input modifications, stage/save schema changes, partner telemetry or external requests.

- Each WebSocket PONG adds a **valid sample** of the local browser-to-server round trip.
- Only the latest **8** valid RTT samples are kept in memory. The displayed RTT is their **median**, not an isolated outlier.
- After at least **3** samples, display **RTT spread = maximum minus minimum** of that sample window. It is *not* statistical packet jitter, lost packets or direct Windows↔iPhone latency.
- Informational severity: median RTT <180ms=normal, 180–349ms=elevated, >=350ms=high; RTT spread <100ms=normal, 100–249ms=elevated, >=250ms=unstable/high. Either elevated/high component raises the label. These are UI hints, not certified QoS thresholds.
- If no valid PONG arrives for **more than 6 seconds** after socket creation or the latest valid PONG, show a **possible stalled connection** indicator even if WebSocket.readyState still says OPEN. Do not falsely assert the connection is closed. The game already reconnects automatically *after* a socket-close event.
- Reset the sample window on every socket replacement and close, so earlier RTTs cannot survive network transitions.
- RU/EN copy uses compact mobile landscape layout and updates independently of unrelated lobby status.
- Start permissions, role/room access and input authority remain exclusively controlled by the existing server. No new private data collection, tokens or room identifiers.

## Verification

- Unit tests: `tests/v33-network-stability.test.js` (rolling median, outlier variation, 6-second stale threshold, reset, malformed samples, severity and authorization).
- Browser: `e2e/v33-network-stability.spec.cjs` (live mobile landscape room, atomic sync assertions to avoid PONG races).
- Existing v32 and legacy tests remain in the exact-SHA CI matrix.
- Physical Windows and iPhone test should force RTT spikes, temporary network blackhole while socket appears connected, reconnect, Wi-Fi/LTE switch, RU/EN and both roles. Browser emulation cannot certify physical hardware.

## Release boundary

This is an engineering PR only. Do not merge or deploy public Render until exact-head CI and an explicit release decision. G4 #26 and G5 #28 certification remain separate HOLD gates, including 50-pair beta, rights/privacy and moderated UGC checks.
