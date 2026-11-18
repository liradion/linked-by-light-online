# G3 Crash Recovery — critical room-state durability

**Engineering branch:** `feat/g3-sigkill-ack-durability`. **Base:** PR #20 `319cfc60ebc958b9acab15f9e1a3e3afab13b2f3`. **Status:** experimental draft, not deployed, not public release approved.

## Why this is necessary

Previously, the server wrote a local v11 room checkpoint every 12 seconds and during `SIGTERM`. A newly created room, partner seat, selected stage or solo hero switch acknowledged between those writes could disappear after `SIGKILL` (where Node never executes shutdown handlers). This is a legitimate crash-consistency risk, not merely a test gap.

## Persistence contract

With a configured persistent `SAVE_DIR`:

- On room creation and seat attach/recovery, write a full disk checkpoint **before** sending `joined` to that authenticated seat.
- After a validated solo hero switch, write the updated authoritative active role **before** broadcasting its snapshot.
- After server-accepted stage selection, `start`, chapter restart and level reset, write the state **before** the new state is acknowledged.
- Record stage changes caused by actual authoritative ticks and persist when the stage advances. Do not write on every 60 Hz physics tick.
- Preserve the 12-second periodic checkpoint for ongoing movement and within-level puzzle progress.

The existing checkpoint format stays **v11** for compatibility, with a checksummed `.v27` envelope and `.v27.bak` fallback. No client schema, WebSocket protocol (4) or room-capacity change is introduced. Files are atomically renamed and written with restricted permissions. This protects against a **process** crash after the save call has returned, not sudden power loss or storage-device failure (there is no directory `fsync` guarantee).

If cloud storage is configured, critical changes also initiate an **asynchronous forced cloud snapshot**. A room WebSocket acknowledgement does **not** mean that a cloud write finished. A hard crash can still occur before that remote write completes. Do not claim zero cloud RPO.

## Automated crash drill

`tests/g3-v28-process-recovery.test.js` now includes three additional process-kill tests using a temporary disk and real Node HTTP/WebSocket connections:

1. Create an Echo-host room; on receipt of its `joined` packet, immediately kill the server using `SIGKILL`. Restart the server and reconnect to the original room with the original authenticated seat token.
2. Create an Echo-host/Spark-guest room, start playing and select another unlocked stage; on receipt of the corresponding snapshot, `SIGKILL`. Recover the stage, both seat tokens and ownership, and ensure Spark cannot select a stage.
3. Create an Echo-host solo room, switch active control to Spark and kill the server on the acknowledged snapshot. Restore the original role, active hero and solo occupancy restriction.

All tests use short-lived localhost servers, local disk, no real user data, no production network. They do not rely on the graceful `SIGTERM` hook or the 12-second periodic timer.

## Remaining release blockers

- Verify recovery in a **real durable staging environment**, including encryption keys, archive fallback, corrupted checkpoint and cloud write completion.
- Test hard machine restart/power loss, OS/storage durability, real Render/Supabase network and key rotation. The current local `SIGKILL` test cannot establish these.
- Assess tick interval and p95 latency when critical checkpoints are written with real numbers of concurrent rooms; the test bench is isolated and is not a production capacity certificate.
- Test full curated campaign traversal and iPhone Safari ↔ Windows across Wi-Fi/LTE, sleep and reconnect; obtain playtest evidence from at least 50 independent pairs.

**Do not merge, ship installers or deploy the production server based only on automated green tests.**
