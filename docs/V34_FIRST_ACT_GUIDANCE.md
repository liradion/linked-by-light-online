# v34 — role-aware first-act guidance

## Implementation

The v28 in-game tutorial hint now resolves the next action from the server-owned snapshot through `public/v34-steps.js`. It covers only curated Act 1 stages 0–8, never custom levels or generic content beyond the first act.

- Spark/Echo receive different instructions on dual plates, destructible walls, and crystals.
- The guidance changes after server-confirmed wall destruction, bridge latching, crystal charge, boss turn and gate opening.
- First-act jump, flight, rhythm, sail and flower-specific tasks are represented without fake completion triggers.
- Hints respect the currently controlled role in solo mode and the independent RU/EN setting.
- No new server messages, actions, high-frequency telemetry, client-owned scoring, progress grant, role permission changes or personal data.

## Tests

`tests/v34-first-act-guidance.test.js` and `e2e/v34-first-act-guidance.spec.cjs` cover stage state transitions and co-op desktop/mobile landscape hints.

This is an engineering change. It does **not** certify human traversal of the first 9 stages, the 50-pair G4 cohort or production release. Real Windows and iPhone field playtests remain mandatory.
