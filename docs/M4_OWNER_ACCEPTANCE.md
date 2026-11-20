# Stage 4 M4 — Owner Acceptance Record (engineering scope)

**Decision date:** 2026-11-20 (Asia/Almaty).  
**Authority:** Project owner explicitly instructed "прими полностью этап 4" in the project conversation.  
**Acceptance type:** OWNER-APPROVED ENGINEERING MILESTONE, with named, non-fabricated product-evidence exceptions.  
**Review candidate:** `6b3fe67aa2d8910bed92a3a08e2611794862b32e`.  
**Scope:** Linked by Light browser-based client, RU/EN onboarding and presentation improvements, server-supported lobby, moderation constraints, beta privacy and evidence tooling.  
**No store release or public hosting approval granted by this decision.**

## Engineering evidence

All six GitHub Actions checks completed **successfully** for the exact candidate SHA:

| Check | Outcome | Immutable run |
|---|---|---|
| Full Node test suite | 272 / 272 PASS | https://github.com/liradion/linked-by-light-online/actions/runs/44688113813 |
| Chromium and WebKit E2E | 70 / 70 PASS | https://github.com/liradion/linked-by-light-online/actions/runs/44688113791 |
| Commercial UI E2E | 2 / 2 PASS | https://github.com/liradion/linked-by-light-online/actions/runs/44688113717 |
| Isolated visual preview | 4 / 4 PASS | https://github.com/liradion/linked-by-light-online/actions/runs/44688113712 |
| Isolated capacity benchmark | Workflow PASS | https://github.com/liradion/linked-by-light-online/actions/runs/44688113701 |
| Simulated Render Free and impaired network | Workflow PASS, **100-client capacity subcase did not meet threshold** | https://github.com/liradion/linked-by-light-online/actions/runs/44688113836 |

No failed test is concealed or treated as a successful real-world measurement. This record does not certify any commit created after the candidate SHA until its own checks finish.

## Owner decision

- **M4 implementation and code integration: ACCEPTED by owner.** The work may be integrated into `main` following a fresh CI check if this record changes the PR head.
- **External acceptance items: explicitly waived for the purpose of concluding the M4 *engineering work package*, not asserted as performed.**
- **G4 product beta exit and commercial release: HOLD**, pending the independently verifiable evidence listed below.
- **M5:** Engineering design/spike tasks may be prepared; do not ship a Windows installer, apply for Steam release, charge users, or deploy to production merely on the strength of this signoff.
- Preserve authoritative WebSocket v4, save schema v11, package 26.0.0 and existing user-room data.
- Integrate with Git commit message `[skip render]`; Render production deployment is a separate release action and not authorized by this signoff.

## Outstanding product verification / G4 release blockers

1. Real Windows Chrome + physical iPhone Safari, independent Wi-Fi and cellular networks, background/recovery and safe-area acceptance.
2. Fifty independent real pairs with anonymous first-session metrics; >=80% start without help, >=90% successful invite joins, majority first-objective completion.
3. Measured closed beta with >=99.5% crash-free sessions and no known unresolved P0/blocking P1.
4. Complete human cooperative campaign run, softlock triage, accessibility and role parity.
5. Isolated **live** HTTPS/WSS service preview with separate secrets and storage and real cloud restore tests; local CI screenshot artifacts are not an interactive live preview.
6. Confirmed commercial rights and privacy review, approved support/retention/deletion and moderated UGC operations.

These criteria are **NOT PASSED**, and any G4 certification requires evidence plus a separate human release approval.

## Traceability and rollback

- Feature PR: https://github.com/liradion/linked-by-light-online/pull/24
- M4 tracking: https://github.com/liradion/linked-by-light-online/issues/23
- Engineering diagnostics: `docs/M4_VERIFICATION_AND_GATES.md`
- Deferred commercial gate: maintain separately in a dedicated G4 issue when the engineering issue is closed.
- M5 plan: `docs/M5_WINDOWS_STEAM_ENTRY_PLAN.md`, https://github.com/liradion/linked-by-light-online/issues/25
- If M4 integration causes a regression, revert the integration commit, not the Stage 3 authoritative room or save features; do not deploy an unapproved build as a workaround.

**Decision semantics:** This is a project-management waiver of uncompleted field evidence, not an independent audit or a statement that G4 was objectively met.
