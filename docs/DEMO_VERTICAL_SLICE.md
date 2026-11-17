# Linked by Light — First-act playable demo

**Status:** engineering candidate for G1; **not yet a commercially certified 20–30 minute demo**. Implemented on `feat/commercial-readiness-foundation` in PR #17. The current public Render deployment and `main` must not be assumed to have this demo.

## Player journey

1. On first visit, the quick-start guide is inline and optional. Choose **«Играть в демоверсию ✦»**, not the ordinary full-campaign room.
2. Host receives a six-character invite. Share through the OS Share Sheet on supported phones or copy the link.
3. Guest opens `?room=CODE` on PC or phone, joins as Echo; host plays Spark. The host starts when both seats are connected.
4. Server starts at stage 0, enforces progression sequentially through stages 0–8, then ends with a dedicated `demo` finale **instead of stage 9**.
5. Both clients see the same server-authoritative stage, phase and `demo` flag; HUD displays `ДЕМО · ИСПЫТАНИЕ n / 9` and the act progress.
6. On completion the server returns a demo ending: «Наш первый общий путь». Host can restart the same demo; the finale also offers a return to the main menu.
7. Normal **«Создать комнату»** mode remains independent, and the 137 stage definitions remain available through the existing main/bonus/new-world routes.

## Curated stage order (existing content)

| Demo | ID | Existing title | Core emphasis | Narrative beat |
|---:|---:|---|---|---|
| 1 | 0 | Первый контакт | Spark/Echo color-matched simultaneous pads | Вместе открываем путь |
| 2 | 1 | Мост доверия | Spark dash, Echo pulse, bridge | Один помогает другому |
| 3 | 2 | Один ритм | Wall, crystal, synchronized pads and jumps | Действовать одновременно |
| 4 | 3 | Светлая долина · Сила двоих | Asymmetric co-op | Каждая способность важна |
| 5 | 4 | Светлая долина · Общий сигнал | Crystal and paired pads | Слышать и отвечать |
| 6 | 5 | Светлая долина · Держи мост | Spark holds trigger while Echo moves | Вместе преодолеваем расстояние |
| 7 | 6 | Светлая долина · Двойное сияние | Echo charges two crystals | Передавая свет |
| 8 | 7 | Светлая долина · Верное решение | Multiple combined co-op objectives | Помогать до конца |
| 9 | 8 | Светлая долина · Финальная связка | First-act combined challenge/finale | Первый общий путь |

The level order is intentionally **sequential and server-owned**, not merely a client list. It reuses the actual production physics and stage assets. No new levels are presented as human-tested.

## Why this is not yet a validated 20–30 min release

- Nine levels are a **duration hypothesis**. Measure median and p90 completion times with 50 independent pairs, including disconnects and abandonments.
- Stages 3–8 are partly generated from repeated archetypes; independent playtest is required to evaluate differentiation and pacing.
- Stage 8 has complex first-act signature/finale behaviors. Require an actual start-to-end two-human clear, not just transition unit tests.
- Music, visual polish, accessible hint system and inclusive role selection still require QA.
- No Steam entitlement, monetization, store packaging, cross-platform purchase, or physical device certification is implied.

## Automated QA coverage

- `tests/demo-mode.test.js`: all nine stage definitions, sequential server transitions, dedicated ending and ordinary campaign 8→9 regression.
- `tests/demo-session.test.js`: real Node WebSocket host/guest session, join/start, malicious request for stage 122 clamped to stage 0, stage-skip rejected, restart preserves demo.
- `e2e/demo-first-act.spec.cjs`: mobile+desktop browser invite, stage 1/9 HUD sync, main campaign entry independent.
- Existing `npm test` suite, multiplayer reconnect, cloud v11 persistence, security and dual browser checks remain mandatory.
- G1 still requires human playtest results and device/network matrix in `QA_MATRIX.md`.

## Compatibility and security

- Existing WebSocket protocol 4 is unchanged. The optional `demo:true` flag is accepted **only** for room creation and the server forces stage 0.
- Existing room checkpoint version 11 is unchanged. `game.demo` is a backwards-compatible optional boolean in the existing saved game object and is restored only for stages 0–8.
- Main-campaign results, local campaign checkpoint and daily/story achievement rewards are not granted by demo snapshots.
- The host cannot use `selectStage` to skip chapters inside a demo room.
- The Free Render room cap and production deployment remain unchanged; test E2E room capacity is isolated to local Playwright configuration.

## G1 manual acceptance checklist

- [ ] Real PC↔iPhone, PC↔Android and phone↔phone games in landscape
- [ ] Native invite sharing from iOS Safari, Android Chrome; fallback clipboard
- [ ] Full nine-stage playthrough with two humans, including all ability and checkpoint mechanics
- [ ] Mobile clean mode doesn't conceal any essential buttons, objective, emergency disconnect banner, or final CTA
- [ ] Stage 8 finale really completes and presents the dedicated ending on both devices
- [ ] Returning to menu and replaying does not unlock the normal 99-stage campaign
- [ ] Reconnect mid-demo from independent Wi-Fi/LTE while preserving stage index/mode
- [ ] Restore demo room from v11 disk/cloud checkpoint in staging
- [ ] Independently measure actual playtime and difficulty before marketing a duration
- [ ] At least 50 pairs complete a consent-aware feedback survey and G1 gate is documented

Do not merge a passing unit test into an assertion of market readiness. Gate G1 is closed **only** after the full human/device acceptance criteria above are met.
