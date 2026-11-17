# M2 — Gameplay/content alpha: first engineering gate

**Date:** 2026-11-17  
**Branch:** `feat/commercial-readiness-foundation` (PR #17 draft)  
**Scope:** Stage schema and runtime smoke of 137 levels, 2-step optional role-specific hints and browser interaction. **Not** a claim that all 137 levels are independently navigable or fully polished.

## G1 handoff

The project owner reported that two human players completed the nine-stage demo. That is **user-reported manual evidence**, not a video-reviewed QA transcript or the independent 50-pair cohort. Keep the external-playtest gate open and do not infer statistical completion rates from this report.

## M2 implementation package

### Stage contracts and runtime
- Added `tests/campaign-full-catalog.test.js` covering all 137 stage indices and static support for both spawns, portal, pads, crystals, chapter signature nodes and dual-reality anchors.
- Assertions enforce basic gate/portal ordering, finite positions, two-player simulation, snapshot structure and no level-time movement during a disconnected-partner pause.
- Tests also check transitions within the 99-level campaign and v20/v21/v23 chapter boundaries. Unlike the demo's event harness, these **do not demonstrate** each route is physically traversable by unaided players.

### Optional hints
- `public/game-hints.js` includes a pure role-aware hint model, without state mutations or telemetry.
- First tap shows the authored stage objective; second tap gives the next role-relevant action.
- Specific guidance covers pressure plates, destructible walls, crystals, all 11 world signatures, alternate-world mechanics, co-op boss turn, four arcade minigames and later chapters.
- Hint controls are accessible in the unified menu and while using immersive clean-play; `?` is a keyboard shortcut for English keyboard layouts.
- Opens without pausing the network simulation; closes on stage change or when the player is not in active play.
- `tests/game-hints.test.js` validates non-empty hints for every level and both roles, plus read-only behavior.
- `e2e/campaign-hints.spec.cjs` validates desktop and phone hint use with real local WebSocket room, and clean-play restore.

## M2 acceptance gates — open

- [ ] A human reviewer completes all 137 stages without debug player relocation
- [ ] Each stage scored for fairness, novelty, frustration, softlocks and useful second-player agency
- [ ] Create keep / polish / redesign decisions, prioritize coherent 2–4-hour premium campaign
- [ ] Measure and fix difficulty spikes and boss attack telegraphs
- [ ] RU/EN text localization (current in-game hint UI is Russian)
- [ ] Rebindable keyboard and gamepad settings, accessible contrast and reduced-motion review
- [ ] Music, SFX and graphics licensing audit, original artwork and final presentation
- [ ] Independent playtest cohort; evaluate actual completion time before any public duration claim

## Next engineering priority

Implement deterministic test cases for chapter signature, reality and v20/v21/v23 abilities, starting with representative milestones at stage 9, 18, 27, 36, 45, 54, 63, 72, 81, 90 and stage 100/112/122. Evaluate movement and jump traversability separately; do not confuse static floor-support checks with successful physical route finding.

## Safety and release

No Steam, Android or iOS store release; no entitlement schema, pricing, WebSocket protocol change, production deploy or merge. Keep PR #8 v28 integration separate until its role changes and hints are reconciled.
