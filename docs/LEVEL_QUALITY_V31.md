# Linked by Light — Level Quality & Gameplay v31

**Scope:** a curated, fair, co-operative progression across missions 4–9 (zero-based 3–8), server-owned recovery after falling, improved first-act jump timing, player-aware camera and mobile multi-pointer input.

## Six deliberately authored levels

| Stage | Required co-op path | Main teaching objective |
|---|---|---|
| 4 · Сила двоих | Spark dashes through a wall; Spark and Echo touch one color-matched flower each | Introduce role-colored world objects without simultaneous hidden pads |
| 5 · Общий сигнал | Echo pulses crystal, both jump into a flight ring | Teach pulse then airborne co-operation; retain the existing flight minigame |
| 6 · Держи мост | Spark holds amber plate until bridge latches; both board sail, Spark steers, Echo pulses sail | Teach persistence of a bridge and distinct ship roles; retain existing sail mechanics |
| 7 · Двойное сияние | Echo pulses crystal, then the heroes use their abilities at separate rhythm locations within the shared time window | Introduce timing without spikes or a hidden flower requirement |
| 8 · Верное решение | Spark dashes wall, Echo charges crystal, both hold colored plates | First combined three-device puzzle |
| 9 · Финальная связка | Echo charges crystal, both latch plates, then alternate Spark/Echo attacks on guardian | Preserve and explicitly teach first boss, with safe regrouping before encounter |

All six use authored floor segments, reachable one-way ledges, no hidden first-act light-flower requirement after mission 4, no spikes and clearly matching Russian/English objectives. Flower mechanics return in later Acts as before. Existing flight/sail/rhythm minigames and the first boss **remain**. This does not alter the full 137-stage catalog or custom created levels.

## Safe checkpoints, never a puzzle bypass

- `gameplay-quality.js` stores **two shared checkpoints per authored level**, earned only after both characters stand grounded beyond the marker. A still-intact wall or unlatchable bridge blocks the award.
- On a real fall or boss attack, `quality.recover` respawns that role near the last earned safe checkpoint instead of the beginning. Previously solved pads, wall/crystal objectives and boss HP persist.
- No checkpoint is awarded when only one role advances. If no checkpoint was earned, normal start-position respawn is retained. The game uses fixed authoritative server ticks; clients cannot submit checkpoint grants.
- Checkpoint state is optional, additive to existing room v11; on restoration it is validated. Pre-v31 legacy stages 0–8 normalize to canonical stage geometry on room recovery, preserving compatible earned objectives, not changing user-created puzzles.

## Physics and cross-device UX

- First-act stages 0–8 allow jump input buffering **0.18 s** (previously 0.14 s) and coyote time **0.15 s** (previously 0.11 s). Velocity/gravity, abilities, non-intro levels and WSS protocol v4 remain unchanged.
- The client predictor uses the same first-act jump grace and consumes additive `coyote` and `jumpBuffer` snapshot fields. No extra privileged input messages are introduced.
- Camera targets the local character when the pair separates, smoothing at frame-rate-independent speed; a small marker shows the off-screen teammate and current objective. Symbols for earned checkpoints appear world-space. These are UI only.
- Touch buttons preserve their pressed state while any fingers remain held; a 50 px minimum target in compact coarse-pointer mode and enlarged jump visual affordance improve landscape mobile use.

## Acceptance evidence / limitations

- `tests/v31-level-quality.test.js` uses real `updateInput` and fixed server `tick()` from **official spawn** across all six stage missions, with no player-coordinate teleport in route tests. An isolated injection fixture validates that a checkpoint cannot be granted past an unbroken wall.
- Unit tests also check safe checkpoint recovery, player-local camera selection, jump grace, RU/EN hints, geometry and legacy level migration. Browser E2E covers actual connected players and touch-pointer retention on mobile.
- Full existing Node.js, Chromium/WebKit multiplayer, commercial UI, visual and Render Free impairment CI must pass **on the exact PR commit** before merge. Never claim Steam entitlement, real-device QA, or commercial release.
- The 99-stage static geometry checker remains, but **it does not prove full human traversal of the other 90 base campaign levels**; physical Windows/iPhone two-device playtests remain HOLD in G4.

## Release safety

Only integrate via `[skip render]` after CI and verify that the post-merge Render skip action succeeds. Steam workflows, fees, owner verification and commercial Windows builds are separate and remain unchanged.
