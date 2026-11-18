# G2 / M2 — Remappable keyboard controls

**Status:** engineering implementation and automated QA candidate in PR #17. No merge or public deployment.

## User behavior

Open **☰ Меню → ⌨ Клавиши** during the game or from the lobby. There are separate mappings for **Искра** and **Эхо** for:

| Action | Искра — default | Эхо — default |
|---|---|---|
| Move left | A | ← |
| Move right | D | → |
| Jump | W | ↑ |
| Ability | F | Enter |

Select a button, then press a replacement key. **Esc** cancels capture. Conflicting keys within the same hero, browser/system modifiers, non-character keys, and protected game shortcuts are rejected. **По умолчанию** resets both heroes. The mapping is stored in the device's `localStorage` under `linked-light-keybindings-v1`.

Supported remaps are A–Z, four arrow keys, Enter and Space. Protected shortcuts remain unchanged: **R** restart (host), **G** bond, **T** emote, **V** chapter, **Q/E/Z** late-world actions, **H** immersive mode. Pointer/touch controls and the existing gamepad mapping are not modified.

The visible PC control instructions, basic objective HUD and the role-aware level hint module use the saved mapping. If local storage is absent, corrupted or blocked, the game falls back safely to the defaults.

## Engineering design

- `public/keybinds.js` exports a pure mapping API for Node tests and a browser dialog for remapping.
- `public/client.js` resolves movement and abilities against the **current hero's mapping** and uses keyboard normalization for keydown/keyup.
- A dialogue capture listener runs in the capture phase to prevent invalid binding keys from leaking into a running game.
- Opening a game settings dialogue prevents ordinary gameplay keydown handlers from firing.
- `public/play-ui.js` relocates the original remapping action into the main menu without cloning its handlers.
- `public/game-hints.js` and the HUD show the configured Spark/Echo ability keys.
- No change to the WebSocket protocol, authoritative physics, room save schema or multiplayer seat assignment.

## QA coverage

- `tests/keybinds.test.js`: exact defaults, valid remaps, duplicate protection, reserved keys, persisted reload, corrupt state handling, immutable return values, dynamic gameplay hints.
- `tests/clean-play-ui.test.js`: script dependency ordering, UI wiring, unchanged original touchscreen inputs.
- `e2e/keyboard-remap.spec.cjs`: two-player browser session, menu access, Spark's right key D→J, the authoritative WebSocket input frame, rejection of a collision, local reload/persistence, role separation and restoring defaults.
- Existing offline-PWA, reconnect, gameplay physics and mobile controls regressions are still required.

## Not yet covered

- Native system-level gamepad remapping.
- Accessibility testing by users with motor impairments.
- Keyboard layouts that produce IME-composition or dead-key sequences; current implementation is `KeyboardEvent.key`-based rather than physical `KeyboardEvent.code`.
- Full RU/EN localization; settings in this release use Russian.
- Complete real-device and end-to-end Steam release acceptance.

Do not mark the whole M2 accessibility task complete based only on keyboard remapping.
