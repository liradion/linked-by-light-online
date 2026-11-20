# Linked by Light — Gameplay Evolution v29

**Scope:** five requested directions, delivered as one backwards-compatible engineering increment. This is a new mechanic + coherent audiovisual/UX pass, **not** a claim that 137 stages were professionally re-authored or human-playtested.

## 1. Gameplay, physics and cooperative puzzle depth

**Paired-ability Resonance** is a real, server-authoritative cooperative action integrated into `adventure-core.js` and isolated in `coop-resonance.js`.

- Both distinct players must use Spark's dash and Echo's pulse within **1.25 s**, while their player top-left positions differ by no more than **225 px horizontally** and **125 px vertically**. Each player retains the existing ability cooldown and original level objectives.
- The server awards exactly one synchronized combo: **+0.23 bond energy** (clamped to 1), at least **0.72 s shield**, **4.5 s resonance visual window**, and `syncs += 1`.
- A **2.5 s combo cooldown** prevents farming the reward; stale inputs and repeated same-role actions do not duplicate the bonus. It is disabled in solo mode.
- This is intentionally **optional**, not a new mandatory puzzle or changed win condition. No level is made impossible for old clients. The bonus supports cooperative recovery and is not granted by the renderer.
- Fields are additional properties of the existing authoritative `world.adventure.bond` snapshot (WebSocket protocol remains **v4**). Old room saves with no combo fields are lazily initialized; room save schema stays **v11**.

## 2. Graphics, characters and atmosphere

- A glowing procedural connection ribbon appears **between characters in world space**, stronger when bond power rises and doubled during actual synchronized resonance.
- Bounded visible-world fireflies add depth to the existing biomes, lighting and player animation engine; no external images, sound files or network requests.
- On low graphics settings, extra motes are disabled; reduced-motion mode removes animated particles from the link. All effects are client-only Canvas and cannot affect server physics.

## 3. UI, controls and device parity

- A compact bond-energy meter + synchronized-combo counter displays true server snapshots; no fake client achievement.
- A switch to enable/disable contextual story moments is available in the existing game menu and saved **only locally** on the current device.
- Responsive layout with iPhone landscape safe-area insets, focus-visible outline, semantic button states and an `aria-live` caption. Mobile controls, remapping and gamepad mapping remain unchanged.

## 4. Story and relationship between Spark and Echo

- Original bilingual, short story beats at levels **0, 1, 2 and 8**, plus act-opening guidance and chapter-specific descriptions for v20/v21/v23.
- When players actually synchronize abilities, a localized celebratory line appears with the genuine server-observed count.
- Moments disappear automatically and can be disabled; they don't block completion or force cutscenes. The existing story, role selection and endings remain intact.

## 5. Integration and acceptance

- Adds `public/evolution.js` and `public/evolution.css` before the game client loads and mounts the toggle in the existing menu.
- Core tests cover near/far/late/repeated/solo attempts, combo cooldown, old room snapshots, on-server energy/shield and world-space rendering. WebKit/Chromium E2E covers two live clients executing separate real abilities, plus iPhone-like reduced-motion and setting persistence.
- No production Render deployment or Steam release is implied. Validate M4/G4 physical play tests and the overall G5 commercial gate separately.

## Player instructions

**RU:** Подойдите ближе друг к другу. Искра использует рывок (по умолчанию `F`), Эхо — импульс (`Enter`) в течение 1,25 секунды. Если оба действия выполнены вовремя, получите резонанс: заряд связи и короткую защиту. Эффект видят оба игрока. Окно сюжета можно выключить через «Меню → Настройки и помощь → ✦ История».

**EN:** Move close together. Spark uses Dash (`F`), Echo uses Pulse (`Enter`) within 1.25 seconds. A successful combo grants bond energy and brief protection, with a shared light animation. You can disable story moments in Menu → Settings & Help → ✦ Story.

## Verification

Run `npm test` and the full Chromium/WebKit E2E workflow on the exact candidate SHA. On top of the existing complete game suite, `tests/evolution.test.js` validates the authoritative reward, and `e2e/evolution.spec.cjs` checks two real WebSocket clients. Human first-session observation and accessibility audits remain required before promotion.
