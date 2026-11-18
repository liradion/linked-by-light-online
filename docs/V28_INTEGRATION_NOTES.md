# v27.2 clean-play UI ↔ PR #8 v28 First Experience: integration review

**Status:** candidate comparison, not full code review, not merged. Production remains v26.0.0 in package; Git main includes standalone v27.2 HUD changes. PR #8 base originally predates the latest `main` clean-mode work.

## Where conflicts may occur
- `public/index.html`: PR #8 adds v28 CSS/JS and onboarding; current main adds `play-ui.css` and `play-ui.js`. Both script orders and versioned assets must survive.
- `public/client.js`: v28 adds role choice, solo flow, native invites and ping controls; HUD is moved by `play-ui.js` dynamically.
- `public/beta.js`: onboarding, native share, privacy-safe funnel overlays; ensure moved Help/Feedback buttons still open correctly.
- `public/v20.js`, `public/v21.js`, `public/v23plus.js`: chapter menus/quick actions may be relocated to the compact drawer. Clean-mode contextual actions must never duplicate authoritative commands.
- `server.js`: v28 changes host/guest role model; verify legacy room restores hostRole=Spark and solo rooms cannot admit a second seat.
- `public/sw.js`: bump service worker version on versioned resource changes, but never cache room URLs, private data or authenticated responses.

## Required integration order
1. Rebase PR #8 onto exact current main HEAD in its own branch, preserve both sides' features.
2. Resolve `index.html` asset ordering and verify each module initializes only once.
3. Verify role-neutral HTML strings (remove "Spark=PC" and "Echo=iPhone" after merge).
4. Verify invitation through native Share Sheet, copied URL and query-room autojoin.
5. Test pings and new role-based clues without leaking to spectators.
6. Verify solo role-switch, authoritative ticks, no second member, assisted ranking.
7. Verify clean-mode chapter contextual actions at stage 100/112/122 and standard bond/emote.
8. Execute all 156+ core tests, full Chromium/WebKit and actual physical iPhone/Windows.
9. Check durable restores, admin-only funnel privacy, rollback and deployment on staging.
10. Explicit release approval **separate** from merge approval.

## Risk register
| Risk | Mitigation |
|---|---|
| Additional controls become unreachable in clean mode | contextual button + E2E on representative chapters |
| Persisted clean mode obscures first-launch lobby | always reachable restore control above overlay |
| v28 changed role semantics conflict with fixed character labels | replace device-specific text only after server role tests |
| New analytics capture too much data | allowlisted counters, admin-only, no room tokens or notes |
| Render free limit hides concurrency failures | separate staging and measured room capacity |
| v28 rebase silently drops UI commits | diff comparison, explicit checklist, web/physical QA |

PR #8 explicitly states not to merge/deploy without real acceptance. That gate remains active.
