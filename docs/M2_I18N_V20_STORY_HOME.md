# M2 / G2 — v20 story and home RU/EN engineering pass

**Status:** implemented in the draft commercial-readiness branch only. No Render deployment or production merge.

## Implemented

- Bilingual chapter menu, 12-stage selector, tether/phase/time actions, connection diagnostics and campaign status.
- Shared-home zones, garden, memory workshop, pet/decor controls, and contextual action hints.
- All 12 original three-line story scenes and cooperative voting labels use the local device language. Official stage names reuse the existing GameI18n.stageTitle catalog.
- A native RU/EN selector is inside the v20 story modal, even when the page header is unavailable behind the modal.
- Language switching refreshes launch/menu/quick controls and open story panels, without losing the room or re-sending commands.
- Unknown player-provided text and map codes remain untouched. There is no automatic translation of user content.

## Automated validation

- tests/v20-language.test.js: known translations, RU/EN round-trip, unknown authored text, and no changes to multiplayer action payload shape.
- e2e/v20-language.spec.cjs: real browser entry, modal switch RU/EN/RU and closing behavior in both Chromium and WebKit.
- Existing Node tests, browser E2E, connection, save compatibility, and isolated load workflows remain mandatory.

## Open acceptance gates

Full 12-stage physical co-op play on Windows/iPhone, independent language review, accessibility, side screens v21/v23, environmental story labels and original branch PR #8 integration are not complete.

## Compatibility and rollback

Changed files: public/v20.js (UI-only), public/i18n.js (adds v20 modal to the language control's header selector), public/index.html (browser cache-bust). No changes to WebSocket protocol 4, stage data, server authority, save schema v11, room limits or persistent profiles. Reverting these presentation changes restores the prior Russian-only v20 UI.

**No release approval is implied.** G2 remains open.
