# M4 / Stage 4 — verification and product acceptance ledger

**Recorded:** 2026-11-20 (UTC). **Repository:** liradion/linked-by-light-online.

## Historical verified CI baseline (the preceding implementation)

**Exact tested SHA:** `f3d69fefc58a758df00a7a1432e3405fe2ca5642`.

| Suite | Executed result | GitHub Actions source |
|---|---|---|
| Node.js multiplayer, storage, security, PWA and UI | **PASS 260/260**, 0 failures | https://github.com/liradion/linked-by-light-online/actions/runs/44685847404 |
| Chromium + WebKit full browser E2E | **PASS 68/68** | https://github.com/liradion/linked-by-light-online/actions/runs/44685847411 |
| Commercial UI cross-browser E2E | **PASS 2/2** | https://github.com/liradion/linked-by-light-online/actions/runs/44685847394 |
| Isolated Stage 4 visual preview | **PASS 4/4** | https://github.com/liradion/linked-by-light-online/actions/runs/44685847400 |

These four checks reached completed/success on the exact SHA above. This attests only to that immutable commit; subsequent code edits require fresh verification. Previous 'in progress' status must not remain the final status for the historical SHA.

## Stage 4 additions following the verified baseline

- Explicit authoritative room-state guidance for host, guest, solo, spectator, connectivity and RU/EN.
- An evidence-based, fail-closed M4 acceptance evaluator with synthetic-only unit fixtures (`stage4-acceptance.js`, `scripts/check-stage4-evidence.js`).
- Static rights inventory automation (`scripts/audit-stage4-rights.js`) with a mandatory human commercial ownership/license review.
- Closed-community map safety: unapproved and hidden maps are rejected for **play**, not only omitted from gallery lists; end-to-end regression test.
- Informational bilingual privacy and terms notices (RU/EN), with language-sensitive links. Neither page claims completed legal review.

Do not extend the historical 4/4 CI result to these later changes. To inspect the most recent run, open https://github.com/liradion/linked-by-light-online/pull/24/checks.

## Product acceptance blockers (M4/G4 = HOLD)

| Blocker | Evidence required | Current status |
|---|---|---|
| Physical cross-device play | Real Windows + iPhone Safari, two networks, Wi-Fi/LTE transitions, foreground/background, safe areas | **No verified field evidence** |
| Independent first-play beta | At least 50 genuine anonymous pairs; >=80% unassisted starts; >=90% join success; majority first objective | **No verified field evidence** |
| Closed-beta stability | >=99.5% measured crash-free sessions; no known P0 or blocking P1 | **Not established on real cohort** |
| Complete curated campaign | End-to-end human 2-player walkthrough and softlock evidence | **Unverified** |
| Isolated HTTPS/WSS preview | Real deployed URL, separate secrets/storage and test of room/join/reconnect/restore | **Only local screenshot artifact exists** |
| Data/rights clearance | License/source provenance, privacy/retention review and UGC moderation operating procedures | **Requires owner/legal review** |
| Human release gate | Recorded reviewer identity, reviewed evidence and exact candidate SHA | **Not approved** |

**Current interpretation:** Stage 4 engineering continues, but Stage 4 is **not fully complete** and commercial/release gate G4 must remain HOLD. Stage 5 implementation or publication must not be triggered merely by automated green checks.

## Evidence submission

`node scripts/check-stage4-evidence.js path/to/private-aggregate-evidence.json` checks evidence structure and declared thresholds. It is not part of the automatic M4 signoff; humans must verify sources. Keep participant identities, room codes, tokens and raw IPs outside GitHub.

**Release safeguards:** No main-branch merge, public Render deployment, signing, store submission or payment change is authorized solely by this ledger. WebSocket protocol 4, room checkpoint schema 11, version 26.0.0 remain the compatibility baseline.
