# G4 — Windows + iPhone field QA and closed beta readiness

**Status: PREPARATION, NOT FIELD CERTIFICATION. Release gate #26 remains HOLD.**

The integration commit is the current GitHub main SHA, not an automatically deployed build. A *true* Windows + physical iPhone Safari test, live isolated HTTPS/WSS instance and 50 human pairs require operator-run sessions and evidence. A simulated iPhone/WebKit CI test **is not** a physical device test.

## What this change adds

- Optional **G4 diagnostics / Диагностика G4** control, available in the top navigation. The player can review a narrow JSON report and explicitly **Copy** or **Save JSON**. The game never auto-sends diagnostics; no new HTTP endpoint or external analytics provider is installed.
- Strict report allowlist: session phase, numerical stage, local role, seat-connected booleans, reconnect count, elapsed time, deaths, rescues, abilities, gate/checkpoint state, FPS, RTT/jitter, snapshot cadence, selected graphics and coarse touch/landscape/reduced-motion settings.
- **Explicit exclusions:** actual room code, invitation URL, access/reconnect token, cookies, raw user-agent, IP/address, email, GPS, chat, raw free text and names; user-custom level titles excluded. Review JSON before any sharing.
- Offline `node scripts/g4-beta-report.js PRIVATE_ANONYMOUS_COUNTS.json` calculates metrics; bad or absent counts keep status `HOLD`.
- `docs/G4_EVIDENCE_TEMPLATE.json` is intentionally empty and fails `node scripts/check-stage4-evidence.js docs/G4_EVIDENCE_TEMPLATE.json`. It is a guide, **not** fabricated evidence or a release approval. Store filled versions **outside** GitHub.

## Device acceptance sessions

Every row must be performed manually on physical hardware, recorded with date/time, reviewer, exact app SHA and private redacted evidence links.

| Scenario | Windows | iPhone Safari | Acceptance | Evidence |
|---|---|---|---|---|
| A. Fresh join/start | Chrome or Edge 10/11 | Safari Wi-Fi | Both roles can create/invite/start without developer help | Independent run, result |
| B. Role reversal | Echo host | Spark guest | Controls, host authority and captions correct in RU/EN | Screen captures (room code obscured) |
| C. Network split | Windows wired/Wi-Fi | Independent LTE/5G | Inputs, puzzles, roles and snapshot interpolation recover from jitter | Local diagnostics from both devices |
| D. Reconnect/reload | Host network drops and returns | Safari background, screen lock, reload | Same roles, checkpoint and progress; no duplicate actions | Precise outcome and before/after snapshot |
| E. Safe-area and touch | Stationary co-op client | Physical landscape iPhone | Jump/ability remain reachable with notch/gesture bar; touch pointers release independently | Short recording with identifiers masked |
| F. First act | Both devices | Both devices | Stages 1–9 genuinely traversed with no developer teleport; mechanics introduced in order | Per-stage result sheet |
| G. Softlock/recovery | Any network | Any network | Falling after a 2-player checkpoint restores hero without bypassing unsolved wall, bridge or boss | Failure/recovery steps |
| H. Visual/a11y | Keyboard/controller | VoiceOver, reduced motion and 200% text where supported | Hints, focus, readable overlays, enough contrast and playable buttons | Screenshots/notes |

Use independent networks at least once. Run each role on both devices, check controls after two-finger press/release and after tab visibility changes. If a test fails, record the reproduction steps, stage, device type and severity (P0/P1/P2), do not invent a PASS.

### Level-specific first-act acceptance

1. **Stage 1:** two simultaneous pads only; first platforms can be reached with normal jumps.
2. **Stage 2:** Spark wall dash, held pad, Echo bridge crossing/crystal, both portal; no collapsing bridge after latch.
3. **Stage 3:** first 95-unit gap is jumpable with keyboard and touch; both plates open exit.
4. **Stage 4:** one orange/one blue light flower, genuinely reachable after Spark wall dash.
5. **Stage 5:** Echo crystal pulse; both use the flight ring without invisible high platform.
6. **Stage 6:** amber pad latches bridge; Spark steers and Echo pulses sail; no accidental checkpoint beyond an unlatched bridge.
7. **Stage 7:** crystal + two rhythm abilities in the shared window; hints are understandable.
8. **Stage 8:** Spark wall, Echo crystal, both pads; checkpoint recovery preserves completed tasks.
9. **Stage 9:** crystal + pads, then alternating Spark/Echo boss attacks. Resets and boss warning do not force an unwinnable state.

## Private anonymous cohort and exact denominators

Collect **at least 50 independent real two-person pairs**, not automated browser instances. Use session tallying in a private system with appropriate participant consent. Publish only aggregate counts, not raw participant identifiers.

| Field | Meaning |
|---|---|
| `independentPairs` | Unique real co-op pairs that attempted a new-session test |
| `joinsAttempted` | Count of invitation join attempts; each attempt counted once |
| `joinsSucceeded` | Count of these join attempts that reached a valid seated connection |
| `startedWithoutHelp` | Pairs that independently reached playing state |
| `firstObjectiveCompleted` | Pairs that finished the first mandatory objective |
| `wouldContinue` | Pairs indicating willingness to continue via voluntary questionnaire |
| `sessions` | Measured gameplay sessions covered by crash reporting |
| `crashFree` | Sessions without a measured crash, subset of `sessions` |

**Thresholds:** ≥50 pairs, ≥80% unassisted starts, ≥90% successful joins from ≥50 attempts, more than half of pairs complete first objective, ≥70% willing to continue, ≥99.5% measured crash-free sessions with ≥50 measured sessions, no unresolved P0 or blocking P1. At exactly 50 measured sessions the crash-free threshold effectively demands 50/50.

Place those eight **numeric** keys in a private `PRIVATE_ANONYMOUS_COUNTS.json`, run:

```bash
node scripts/g4-beta-report.js PRIVATE_ANONYMOUS_COUNTS.json
node scripts/check-stage4-evidence.js PRIVATE_G4_EVIDENCE.json
```

The first command only evaluates declared arithmetic; the second uses the existing Stage4 gate to require exact SHA CI links, real physical test evidence, separate HTTPS/WSS staging, rights/privacy review and explicit human signoff. **Neither script proves external claims true.** Even when both output a ready-to-audit status, the release owner must independently inspect evidence and authorize any publication.

## Privacy and operational boundaries

- Never commit a completed field report, invitation link, room code, reconnect token, IP, full browser UA, player identity or raw video with identifiable private content.
- Local G4 JSON is user-initiated; discard unneeded copies and follow locally approved retention/deletion policy. It may contain session times and coarse quality data; review before sharing.
- Do **not** configure production Render, pay Steam fees, sign or distribute binaries, invite public beta users automatically or assert a hosted staging exists. Independent preview credentials/hosting require a separate owner-controlled task.
- Keep GitHub issue #26 open in **HOLD** until every required field test, at-scale cohort, safety/legal review and signoff is evidenced. Do not close G4 based on green CI.
- Existing WSS protocol 4, checkpoint schema 11 and game version 26.0.0 are unchanged in this preparation increment.

## Engineering checks

- `tests/g4-qa.test.js`: malicious session fields cannot appear in local JSON.
- `tests/g4-beta-metrics.test.js`: aggregate threshold math, malformed counts, evidence template HOLD.
- `e2e/g4-qa.spec.cjs`: real localhost Chromium/WebKit UI, independent RU/EN, phone-size safe layout, no tokens emitted by report API.
- Existing entire Node/E2E/visual/network regression and post-merge `[skip render]` checks required for source integration. Full physical tests are **not** executed by GitHub Actions.
