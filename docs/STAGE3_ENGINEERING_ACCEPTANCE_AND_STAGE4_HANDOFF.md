# Stage 3 — Engineering acceptance and Stage 4 handoff

**Date:** 2026-11-18. **Scope:** Linked by Light multiplayer browser game (not Steam/App Store production release).
**Version:** 26.0.0; WebSocket protocol 4; checkpoint schema v11; stage indexes 0–136 (137 catalog entries).
**Public beta configuration:** Render Frankfurt, Free web service, maximum 5 concurrent rooms (from `render.yaml`).

## What is accepted

This acceptance is limited to **automated engineering quality**:

- Integrated v28 onboarding, solo with one physical seat, host role Spark/Echo, context hints, Web Share and ping controls.
- G2 mobile input control gating and in-browser touch/reconnect regression.
- G3 process restart, checksum-backed journal fallback and strict Echo/Spark room ownership.
- Immediate critical local disk checkpoints before room/stage/solo acknowledgements (when `SAVE_DIR` is configured).
- Serialized, coalesced cloud checkpoint requests. These are *asynchronous* relative to user acknowledgements.
- G3.2 WebKit rejoin watchdog, three mobile-guest reloads and mock encrypted cloud slot/archive recovery.

**Baseline evidence on exact integration commit `75d26e552a43bbd5ecac6efd4d361bd001779c28`:**

| CI | Result | Evidence |
|---|---|---|
| Full Node suite | 255 of 255 PASS | https://github.com/liradion/linked-by-light-online/actions/runs/44301592405 |
| Chromium & WebKit E2E | 60 of 60 PASS, 0 flaky on this run | https://github.com/liradion/linked-by-light-online/actions/runs/44301592339 |
| Commercial UI E2E | 2 of 2 PASS | https://github.com/liradion/linked-by-light-online/actions/runs/44301592255 |
| Isolated capacity | PASS (simulated/isolated load) | https://github.com/liradion/linked-by-light-online/actions/runs/44301592444 |
| Impaired-network staging simulation | PASS | https://github.com/liradion/linked-by-light-online/actions/runs/44301592320 |

After adding this documentation and CI release-skip guard, the **new head SHA must receive its own 5/5 check** before any merge. The old evidence does not automatically certify a new commit.

## Unmet product release criteria — never mark these passed without evidence

- **G1:** 50 independent two-person pairs with anonymized first-playtime metrics, 80% unassisted start threshold.
- **G2 physical:** actual iPhone Safari + Windows desktop across independent Wi-Fi/LTE networks; screen lock, background resume, share sheet, safe areas and accessibility.
- **G3 full alpha:** full *human* playthrough/softlock matrix for curated campaign; real remote encrypted Supabase write/restore, key rotation and persistent staging disk after power failure; regional RTT/jitter p95.
- **Preview:** a shareable, isolated online Render preview must be deployed, returned by provider and smoke tested (not inferred from a PR or build status).
- **G4 beta:** closed user beta, metrics privacy review, no open P0 and real crash-free >=99.5% target.
- **Commercial launch:** rights, store approvals, payments, support, clean installers remain separate.

These cannot be completed by GitHub Actions emulated devices, temporary files or a paper checklist alone. Full product gate remains **HOLD**.

## Controlled engineering integration

Integration of the source lineage can be squashed into `main` as one reviewed code change **without** deploying public Render. Render's documented `[skip render]` commit marker prevents the auto-deploy for that commit; `v22-render-postmerge-verify.yml` detects the intentional skip and records a separate explicit log entry rather than falsely treating a skipped deploy as a live production verification.

**Do not equate a green skipped-deploy workflow with verified public deployment.** Verify via Render Dashboard before any future release. The PR merge should close superseded drafts #8 and #17–21 only after confirming the merged tree contains their integrated functionality.

## Stage 4 starting point

Stage 4 corresponds to **M4 Content/Presentation Beta** in `docs/MASTER_PLAN.md`, not to Steam/Google Play/App Store release. Begin with:

1. Consumer navigation cleanup: remove version identifiers from visible labels while preserving stable internal API/asset names.
2. First-session and guest-invite UX: clarify host/guest steps, network waiting, primary objective and accessible controls on mobile landscape.
3. Review RU/EN completeness, safe-area and accessible state labels, ensure functional parity for gamepad and touch actions.
4. Asset licence inventory, privacy disclosure, disable/moderate UGC, functional beta telemetry with minimized data.
5. Isolated live preview with separate secrets/data, followed by physical-device/independent-pair acceptance before beta release.

Do not report G4 as accepted merely for creating a new Stage 4 branch.
