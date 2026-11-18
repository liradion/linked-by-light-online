# G3.2 — serialized cloud saves and mobile rejoin resilience

**Branch:** `feat/g3-2-cloud-queue-webkit-rejoin`; based on the locally validated SIGKILL candidate in draft PR #21. **Status:** engineering candidate, not released.

## Race condition and contract

Before G3.2, multiple concurrent `persistRoomsCloud(true)` calls could await a single running cloud write, then resume simultaneously and issue independent Supabase writes. Network reordering between them could overwrite a newer room snapshot with an older one. This matters when many players reconnect or change rooms while a remote write is slow.

`cloud-save-queue.js` introduces one active cloud write and at most one coalesced follow-up force request. Every queued follow-up captures current `roomBackups()` **after** the preceding write settles. The old periodic `persistRoomsCloud(false)` shares the active write rather than launching new ones. Failure of an individual write resolves `false`, records operational error, and never discards a queued follow-up; the next save may succeed.

**Limits:** a room's WebSocket acknowledgement still means the local checkpoint has been written when `SAVE_DIR` exists; it does **not** mean the asynchronous Supabase write is durable. Cloud writes are not transactional across the legacy and v27 slots. Without a durable mounted disk or successful cloud checkpoint, a crash can lose progress. No guarantee is made about Sudden power loss without fsync.

## Mobile/WebKit recovery

A WebSocket can be `OPEN` even if its `join` message is never acknowledged. A mobile guest could therefore remain on the menu or lobby forever until manually refreshing.

`public/client.js` now:
- Waits up to eight seconds for a `joined` or a definitive error **after issuing** a room join. If neither arrives on an open socket, closes it to trigger the existing reconnect/backoff and re-sends the same saved seat token.
- Disarms the watchdog on an accepted `joined`, a server `error` or socket close.
- Ignores events from an older WebSocket when a newer connection has become authoritative, to prevent late close/message callbacks resetting the current connection.

The watchdog never sends a new room-creation request and does not mint or expose a new seat token.

## Automated coverage

- `tests/g3-cloud-save-queue.test.js`: strict single-flight writes, force coalescing and latest-snapshot capture, error recovery, third-generation follow-up.
- `tests/g3-cloud-storage-failover.test.js`: no-network Supabase PostgREST simulator. Verifies encrypted legacy/v27 slot writes, older checksum-validated archive fallback, corruption rejection, and preservation of host/solo tokens. **Not real Supabase integration.**
- `e2e/g3-2-webkit-rejoin.spec.cjs`: live local game server and Chromium + WebKit contexts. One guest join is deliberately dropped by a browser WebSocket test shim; the guest must regain the invited seat via the watchdog. A second scenario reloads a mobile guest three times while the demo is playing, asserting original token, role, stage and host recovery.

## Gates still open

1. Real staging with a configured Supabase project and durable disk, including rate limits, write interruptions, key rotation and operator disaster-recovery drill.
2. Physical iPhone Safari / Windows Chrome testing across networks, iOS background/resume, Web Share Sheet, landscape safe areas and VoiceOver.
3. Full 137-level gameplay audit and human navigability, plus 50 independent pairs for the first-playable gate.

**No changes to protocol 4, v11 room schema, production room cap, payment logic or public deployment. Do not merge until reviewed and explicitly authorized.**
