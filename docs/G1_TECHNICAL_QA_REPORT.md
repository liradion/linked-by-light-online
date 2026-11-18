# G1 — Technical QA audit: first-act demo

**Audit date:** 2026-11-17  
**Tested code commit:** `ed06353dec53cde3c71d6b8c0e349102b3dc3b75`  
**Branch:** `feat/commercial-readiness-foundation` · PR #17 (draft)  
**Production:** not merged, no Render production deployment, no native Steam/Android/iOS builds.

## Executive verdict

**Automated technical QA: PASS on the exact commit above.** **Product Gate G1: NOT YET APPROVED** because no two-human, full-path physical-device playthrough or independent playtest cohort has been completed. Do not describe this as market-ready or as a measured 20–30-minute game.

## Evidence from GitHub Actions

| Suite | Result | Evidence |
|---|---|---|
| Game quality checks, including actual Node WebSocket and persistence suites | **168 / 168 passed** | [run 44092736526](https://github.com/liradion/linked-by-light-online/actions/runs/44092736526) |
| Chromium + WebKit browser E2E | **10 / 10 passed** | [run 44092736459](https://github.com/liradion/linked-by-light-online/actions/runs/44092736459) |
| Commercial UI E2E | **2 / 2 passed** | [run 44092736410](https://github.com/liradion/linked-by-light-online/actions/runs/44092736410) |
| Isolated 50/100/200/400-client WebSocket capacity benchmarks | **Workflow passed**; retain detailed thresholds in artifact | [run 44092736483](https://github.com/liradion/linked-by-light-online/actions/runs/44092736483) |
| Render-Free-class resource and impaired-network staging emulator | **Workflow passed**; 5/5 tested reconnects and recovered roles/ticks in impairment scenario | [run 44092736503](https://github.com/liradion/linked-by-light-online/actions/runs/44092736503) |

Passing an emulation workflow does **not** imply the real production Render service has the same network, CPU, database durability or scaling characteristics.

## Actual gameplay logic covered

1. `tests/demo-puzzle-walkthrough.test.js`: all nine first-act stages run through their **real game-core ticks**, not manually-set `gateOpen` or `arcade.done`.
2. Player interaction commands activate Spark/Echo color pads, destructible walls, crystals, chapter flower receivers and required cooperative progression.
3. Arcade sequences for chase, flight, rhythm and sail, as well as the first boss's alternating role attacks, reach their actual completion conditions.
4. Both characters reach each actual portal, resulting in server-authoritative transitions. Stage 8 ends with demo `win`; an ordinary stage 8 still advances to 9.
5. The harness **relocates test actors** between interaction points to test objective logic. This does **NOT** prove all jump sequences, map traversal, control responsiveness, difficulty, route accessibility or typical time-to-clear.
6. `tests/demo-session.test.js`: two real WebSocket clients; demo room creation cannot be redirected to stage 122; unauthorized `selectStage` and later-world/editor/generator commands are blocked; restart/reset preserves demo; reconnection with original seat token preserves phase and chapter.
7. `tests/demo-restart-recovery.test.js`: real process shutdown/restart, v11 checksummed/legacy-compatible checkpoint, original host and guest seat restoration in same demo room.
8. `e2e/demo-first-act.spec.cjs`: PC host → phone guest, phone host → PC guest, mobile reload/recovery, room code, first-stage UI and independent normal-campaign entry.
9. Separate clean-mode tests cover original touch controls, context actions, unobstructed start/lobby and restoring the HUD.

## Bugs identified and repaired

| Severity | Defect | Correction / evidence |
|---|---|---|
| P0 | `restart` broadcasted a bare game snapshot without `demo`; client could switch to full-campaign interpretation | Server now always sends `roomSnapshot`; socket regression guards flag after restart and reset |
| P0 | v21 gallery / v25 generator and other later-world mutators could replace demo content despite stage-selection prohibition | Server rejects modifying later-world/editor commands in demo; explicit socket attack tests |
| P1 | Stale result from completed level visible after **manual** reset/replay | Clear `lastResult` only at manual server reset/replay/select |
| P1 regression found during repair | Clearing `lastResult` in generic `initStage` broke existing per-level completion scoreboard contract | Reverted overbroad change; preserved result through normal auto-transition; the 168-test suite is green |
| QA gap | No full server-authoritative objective walkthrough of all nine demo stages | Added nine-stage physics/arcade/boss event harness; must still verify human navigability |
| QA gap | Only PC-host → mobile-guest orientation originally covered | Added mobile-host → desktop-guest, reload recovery and touch controls browser regression |
| QA gap | v11 disk checkpoint behavior for demo had no focused test | Added graceful shutdown + journal restore test for both seat tokens |

## What was **not** tested or proven

- No human completed stages 0–8 with physical movement and natural input. Teleport-based semantic solver is **not** equivalent.
- No physical iPhone Safari, Android Chrome, Windows packaged executable or offline/locked-screen lifecycle evidence in this audit.
- No empirical duration, player satisfaction, 50 independent pairs, paid willingness-to-buy or accessibility review by users.
- No production cloud durable-storage failover, real geographic latency measurements or real Render cold-start verification.
- No Steamworks, Play Billing, StoreKit, purchase entitlements, cross-store licenses or App Store review.

## Mandatory next acceptance activities

1. **Human navigation:** two unbriefed participants complete stages 0–8 on two separate devices, without teleport/testing hooks; record videos, exact level where failed, time-to-clear, controls and disconnects.
2. **Hardware matrix:** Windows–iPhone and iPhone–Windows with separate Wi-Fi/LTE connections; Android–iPhone and Android–PC on real devices, landscape safe areas, touch targets and background resume.
3. **Recovery drill:** guest switches Wi-Fi↔LTE and returns from screen lock at stage 3/5/8; compare game snapshots, token and progression.
4. **Gameplay polish:** assess jump reachability, stage 5 sail guidance, stage 8 boss clarity, both players' meaningful contributions and final CTA.
5. **G1 research:** at least 50 independent pairs; calculate median/p90 time, pairing success, first-stage completion, participant feedback; confirm whether 20–30 minutes is a fair advertised duration.
6. Record QA incidents and user feedback in GitHub Issue #10. Do **not** merge PR #17 until approval on these physical/human gates and the open PR #8 interaction is resolved.

## Reproduction

- `npm test` on the exact branch/commit.
- `npx playwright test --config=playwright.config.cjs` with supported Chromium and WebKit on a test machine.
- Run capacity scripts **only against isolated staging**, never public Render.
- Keep the public release on `main` unaffected until explicit release approval.

**Conclusion:** No blocking defect remains reproducible **within the automated scenarios above** as of the specified commit. This is not a claim that the game has zero undiscovered bugs.
