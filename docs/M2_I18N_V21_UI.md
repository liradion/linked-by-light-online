# M2 / G2 — v21 cooperative chapter UI RU/EN

**Development status:** isolated engineering work in draft PR #17. No public deployment, iOS/Windows installer or product release approval.

## Delivered

- Separate exact-match static text catalog (`public/v21-locale.js`, 169 RU→EN entries).
- Level actions and objective texts for ten chapter levels (112–121), following the canonical `GameI18n.stageTitle` and `stageObjective` catalog rather than retranslating user-authored titles.
- Optional story, dialogue, mode selection, backstories, messages, shared garden, mail, aquarium, piano notes, painting accessibility labels, weekly challenges, seasonal stories and photo screens.
- Reuses the existing modal RU/EN selector, re-rendering on device-local locale changes without reconnecting or changing server state.
- Fixes v21 letter and photo caption draft loss when the UI refreshes or when users switch between tabs/languages; restores selection/focus for an active letter input.
- Existing user names, diary titles, message bodies, map names, leaderboard labels and photo captions remain **verbatim**; exact translation is applied only to fixed authored UI text.

## Quality verification

- `tests/v21-language.test.js` checks catalog coverage, English Cyrillic exclusion, RU/EN roundtrip, stage lookup, retained drafts and preserved authoritative commands.
- `e2e/v21-language.spec.cjs` verifies a real room creator can switch language across story/home/events/level/photo without losing unsent text (Chromium and WebKit).
- `e2e/v20-language.spec.cjs` corrected to open v20 from the actual v27 unified game menu (earlier test incorrectly assumed the moved button remained on the canvas).
- All Node, browser, load and degraded-network CI groups require a success result for the same exact candidate SHA before the technical change can be signed off. Real device play remains necessary.

## Out of scope and open gates

- v23+ auxiliary tabs and optional environmental text; external account-provider failure copy; legal documents; user-generated content translation policy; accessibility testing on physical iPhone/Windows; full human campaign; 50 independent co-op pairs.
- No new WebSocket message, physics, backend storage, API contract, session token, achievement, protocol 4, save v11 or Render configuration.
- Do not merge/deploy until an independent release decision, PR #8 compatibility review and physical cross-network Windows+iPhone acceptance.

## Rollback

Revert the new `v21-locale.js`, the `v21.js` display-only adjustments, `index.html` asset reference and the tests. Game logic remains server-authoritative.
