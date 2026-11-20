# Level Repair & Onboarding v30 — first-act geometry and reachability

**Scope:** first three actual missions, static ledges across the 99-stage base campaign, and non-blocking contextual help. Existing authoritative WebSocket protocol v4 and persisted checkpoint schema v11 remain unchanged. This is an engineering intervention, not a claim of real-device QA or of a complete 137-stage campaign playthrough.

## Root causes verified before implementation

- Original ground `Y=544`; jump initial velocity `-486` and gravity `1300`, integrated at `60 Hz`. The ordinary maximum jump is about `86.8` units.
- Original ledges on stages 0, 1 and 2 rose **92**, **90** and **100** units, respectively; some generated ledges rose 87 units. Those heights cannot be landed on by an ordinary jump from flat ground.
- The collision engine used solid rectangle collision from below, so characters' heads hit platforms and could be blocked laterally. Client prediction used the same old solid assumption.
- The first three stages also created world-signature light flowers, not mentioned in the displayed tutorial objective. Completing the advertised pressure plates on stage 0 was insufficient to open the gate.
- The old demo puzzle walkthrough moved characters directly between locations; it verified ability triggers but not whether physical movement actually reached the objective.

## Changed level route

| Stage | Before | After |
|---|---|---|
| 0 — Первый контакт | Optional ledge at rise 92; unexplained extra flower interactions | Two reachable 64-unit ledges; **only** simultaneous orange/blue plates required |
| 1 — Мост доверия | Ledge rise 90; unseen flower condition | Ledges rise 64; Spark dashes through wall, holds plate to enable the long bridge; Echo crosses, pulses crystal; bridge then latches |
| 2 — Один ритм | Ledge rise 100; first gap 155; second gap 155; wall, crystal, hazards, hidden flowers and pads all present | Ledge rises 64; first gap **95** and jumpable, later **75**-unit always-on light bridge, no surprise hazards/wall/crystal; both pads complete stage |
| Stages 3–98 | Some generated static ledges rise 87, with almost no jump margin | Static ledges rise 62–65, **one-way** top landing collision; special dynamic platforms retain their existing collision behavior |

One-way means the hero can jump *through* an ordinary ledge from below, then stand on it while falling. This change is present in both `game-core.js` and `public/reconciliation.js` to avoid client/server prediction mismatch. Floor, bridge, walls, gates and dynamic signature platforms continue using their original collision rules.

The **first three** tutorial missions explicitly bypass flower completion by marking their world signatures tutorial-only and complete. World-signature flowers remain an active campaign mechanic beginning with the fourth stage. This change is additive stage metadata, not a protocol or checkpoint schema change.

## Adaptive, voluntary help

- The existing Hint button and per-role hints remain. Stage 3's detailed hint teaches the first short gap before suggesting paired pads.
- A small, safe-area-aware nudge appears **after 24 seconds without a positive objective milestone**, or **two deaths since the last milestone**. No text interrupts gameplay automatically.
- Tapping the nudge opens the existing more-detailed role hint; users can dismiss it. Progress resets the stalled-time counter. No analytics/telemetry or personal data is added.
- The nudge supports Russian/English, keyboard focus and iPhone landscape layout. Context is computed locally from authoritative snapshots, not from speculative private user profiling.

## Automated acceptance plan

- `tests/v30-onboarding.test.js`: actual measured jump peak, geometry of **all 99** base stages, safe ledge approach, existence/trigger of bridges, no hidden flower gates, predictor/server collision agreement, and movement-based staged route completion for the first three missions. Only the focused underside-collision fixture starts below a test ledge; staged walkthroughs begin at the official spawn and use server input ticks.
- `e2e/v30-onboarding.spec.cjs`: Chromium + WebKit check first-level objective, nudge and mobile landscape usability.
- Existing full Node and browser suites still cover protocol, online pairing, UI, reconnect, demo puzzles and story mechanics. Incomplete human QA remains in G4 Issue #26.

### Limits

This geometric audit proves height margins and bridged/jumpable gaps in all 99 base-stage layouts. It **does not certify that every generated world-signature puzzle is fully traversable by humans**, nor does a scripted bot replace physical Windows/iPhone playtesting. The 38 special stages retain their own specific mechanics and QA gates. Production deployment and Steam release remain separately held.

## How to validate

Run `npm test`, then full Chromium + WebKit E2E via the existing GitHub Actions PR workflows. The integration is eligible for `main` only on a green exact SHA and with `[skip render]`; do not publish to Render from this engineering patch.
